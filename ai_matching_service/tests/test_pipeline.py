import unittest
from app.engine.geo import calculate_location_score, GeoLocation
from app.engine.fusion import fusion_engine
from app.core.config import settings

class TestMatchingLogic(unittest.TestCase):
    def test_geo_score(self):
        # Same location
        loc1 = GeoLocation(lat=40.7128, lng=-74.0060)
        score = calculate_location_score(loc1, loc1)
        self.assertAlmostEqual(score, 1.0)
        
        # ~500m away (Should be > 0.8)
        loc2 = GeoLocation(lat=40.7173, lng=-74.0060)
        score = calculate_location_score(loc1, loc2)
        self.assertTrue(0.8 <= score < 1.0)
        
        # > 100km away (Should be 0.0)
        loc3 = GeoLocation(lat=42.7128, lng=-74.0060)
        score = calculate_location_score(loc1, loc3)
        self.assertEqual(score, 0.0)

    def test_fusion_logic(self):
        # Perfect Match
        # 0.6*1.0 + 0.25*1.0 + 0.15*1.0 = 1.0
        score = fusion_engine.compute_final_score(1.0, 1.0, 1.0)
        self.assertAlmostEqual(score, 1.0)
        
        # Strong Visual (0.95), Weak Text (0.5), Strong Geo (1.0)
        # 0.6*0.95 + 0.25*0.5 + 0.15*1.0 = 0.57 + 0.125 + 0.15 = 0.845
        score = fusion_engine.compute_final_score(0.95, 0.5, 1.0)
        self.assertAlmostEqual(score, 0.845)
        self.assertEqual(fusion_engine.categorize_match(score), "human_review")
        
        # Confirmed Match Case
        # Visual 0.98, Text 0.90, Geo 0.80
        # 0.6*0.98 + 0.25*0.90 + 0.15*0.80 = 0.588 + 0.225 + 0.12 = 0.933
        score = fusion_engine.compute_final_score(0.98, 0.90, 0.80)
        self.assertTrue(score >= settings.THRESHOLD_CONFIRMED)
        self.assertEqual(fusion_engine.categorize_match(score), "confirmed_match")

if __name__ == '__main__':
    unittest.main()
