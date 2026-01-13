from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import base64
import json

from app.core.schemas import MatchResponse, MatchResult, IngestItem, GeoLocation, MatchBreakdown
from app.core.config import settings
from app.processing.detector import detector
from app.processing.embedder import embedder
from app.engine.vector_store import store
from app.engine.fusion import fusion_engine
from app.engine.geo import calculate_location_score

router = APIRouter()

@router.post("/ingest")
async def ingest_item(
    item_id: str = Form(...),
    image: UploadFile = File(...),
    text_description: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    category: str = Form(...)
):
    # 1. Read Image
    image_bytes = await image.read()
    
    # 2. Detect & Crop
    cropped_img, detection = detector.detect_and_crop(image_bytes)
    
    # 3. Embed
    vis_embedding = embedder.get_image_embedding(cropped_img)
    txt_embedding = embedder.get_text_embedding(text_description)
    
    # 4. Store
    store.add_item(
        item_id=item_id,
        visual_embedding=vis_embedding,
        text_embedding=txt_embedding,
        location=GeoLocation(lat=lat, lng=lng),
        category=category
    )
    
    return {"status": "indexed", "item_id": item_id, "detection": detection}

@router.post("/match", response_model=MatchResponse)
async def match_item(
    image: UploadFile = File(...),
    text_description: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    category_filter: Optional[str] = Form(None)
):
    # 1. Processing Input
    image_bytes = await image.read()
    cropped_img, detection = detector.detect_and_crop(image_bytes)
    if not detection:
        # Fallback if object detection fails? For now proceed with full image? 
        # Plan says "Strict", but if detection fails, maybe reject?
        # We will proceed with the image as is, assuming it *is* the object.
        pass

    query_vis = embedder.get_image_embedding(cropped_img)
    query_txt = embedder.get_text_embedding(text_description)
    query_loc = GeoLocation(lat=lat, lng=lng)
    
    # 2. ANN Search (Visual only first)
    candidates = store.search_visual(query_vis, k=50)
    
    results = []
    
    # 3. Re-Rank with Fusion
    for internal_id, vis_score in candidates:
        candidate_data = store.get_item_data(internal_id)
        
        # Hard Filter: Category
        if category_filter and candidate_data['category'] != category_filter:
            continue
            
        # Calc Text Score
        cand_txt_vec = candidate_data['text_embedding']
        txt_score = fusion_engine.compute_cosine_sim(query_txt, cand_txt_vec)
        
        # Calc Geo Score
        cand_loc = candidate_data['location']
        geo_score = calculate_location_score(query_loc, cand_loc)
        
        # Calc Final Score
        final_score = fusion_engine.compute_final_score(vis_score, txt_score, geo_score)
        
        status = fusion_engine.categorize_match(final_score)
        
        if status != "discard":
            match_result = MatchResult(
                item_id=candidate_data['item_id'],
                final_score=round(float(final_score), 4),
                status=status,
                breakdown=MatchBreakdown(
                    visual_similarity=round(float(vis_score), 4),
                    text_similarity=round(float(txt_score), 4),
                    location_score=round(float(geo_score), 4)
                ),
                object_class=detection.label if detection else "unknown",
                match_reasoning={
                    "strategy": "weighted_fusion",
                    "visual_weight": settings.WEIGHT_VISUAL,
                    "text_weight": settings.WEIGHT_TEXT,
                    "geo_weight": settings.WEIGHT_GEO
                }
            )
            results.append(match_result)
            
    # Sort by Final Score
    results.sort(key=lambda x: x.final_score, reverse=True)
    
    return MatchResponse(matches=results)
