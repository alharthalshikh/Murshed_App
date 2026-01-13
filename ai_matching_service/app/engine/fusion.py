import numpy as np
from app.core.config import settings
from app.core.schemas import MatchResult, MatchBreakdown, MatchRequest, GeoLocation

class FusionEngine:
    def compute_final_score(
        self, 
        visual_score: float, 
        text_score: float, 
        location_score: float
    ) -> float:
        """
        Formula: (S_v * 0.6) + (S_t * 0.25) + (S_g * 0.15)
        """
        final = (
            (visual_score * settings.WEIGHT_VISUAL) +
            (text_score * settings.WEIGHT_TEXT) +
            (location_score * settings.WEIGHT_GEO)
        )
        return final

    def compute_cosine_sim(self, vec1: list[float], vec2: list[float]) -> float:
        # Assumes vectors are already L2 normalized
        return np.dot(vec1, vec2)

    def categorize_match(self, final_score: float) -> str:
        if final_score >= settings.THRESHOLD_CONFIRMED:
            return "confirmed_match"
        elif final_score >= settings.THRESHOLD_REVIEW:
            return "human_review"
        else:
            return "discard"

fusion_engine = FusionEngine()
