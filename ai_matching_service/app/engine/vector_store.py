import faiss
import numpy as np
import pickle
import os
from typing import List, Tuple, Dict
from app.core.schemas import GeoLocation

class VectorStore:
    def __init__(self, dimension: int = 768):
        self.dimension = dimension
        # IndexFlatIP = Exact Cosine Similarity (assuming normalized vectors)
        self.index = faiss.IndexFlatIP(dimension)
        
        # Metadata storage (In-memory for MVP, should be DB in prod)
        # Map: internal_id (int) -> {item_id, text_embedding, location, category}
        self.metadata: Dict[int, Dict] = {} 
        self.current_id = 0

    def add_item(self, item_id: str, visual_embedding: List[float], text_embedding: List[float], location: GeoLocation, category: str):
        # Add to FAISS
        vec = np.array([visual_embedding], dtype='float32')
        faiss.normalize_L2(vec) # Ensure normalization just in case
        self.index.add(vec)
        
        # Store metadata
        self.metadata[self.current_id] = {
            "item_id": item_id,
            "visual_vector": visual_embedding, # Keep for debugging/refined checks
            "text_embedding": text_embedding,  # Stored for secondary fusion score
            "location": location,
            "category": category
        }
        self.current_id += 1

    def search_visual(self, query_visual: List[float], k: int = 50) -> List[Tuple[int, float]]:
        """
        Returns list of (internal_id, visual_similarity_score)
        """
        vec = np.array([query_visual], dtype='float32')
        faiss.normalize_L2(vec)
        
        distances, indices = self.index.search(vec, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:
                results.append((int(idx), float(dist)))
                
        return results

    def get_item_data(self, internal_id: int):
        return self.metadata.get(internal_id)

    def persist(self, path: str = "vector_store.pkl"):
        # For simple MVP persistence
        pass

store = VectorStore()
