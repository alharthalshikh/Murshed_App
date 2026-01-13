from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Dict, Any

class GeoLocation(BaseModel):
    lat: float
    lng: float

class MatchRequest(BaseModel):
    image_base64: Optional[str] = None
    text_description: Optional[str] = None
    location: Optional[GeoLocation] = None
    category_filter: Optional[str] = None

class IngestItem(BaseModel):
    item_id: str
    image_base64: str
    text_description: str
    location: GeoLocation
    category: str

class DetectionResult(BaseModel):
    label: str
    confidence: float
    box: Tuple[int, int, int, int]  # x1, y1, x2, y2

class MatchBreakdown(BaseModel):
    visual_similarity: float
    text_similarity: float
    location_score: float

class MatchResult(BaseModel):
    item_id: str
    final_score: float
    status: str  # confirmed_match, human_review
    breakdown: MatchBreakdown
    object_class: str
    match_reasoning: Dict[str, Any]

class MatchResponse(BaseModel):
    matches: List[MatchResult]
