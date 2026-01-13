import math
from app.core.schemas import GeoLocation

def calculate_haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371  # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLng = math.radians(lng2 - lng1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLng/2) * math.sin(dLng/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def calculate_location_score(loc1: GeoLocation, loc2: GeoLocation) -> float:
    """
    Returns a score 0.0 to 1.0 based on distance.
    < 100m  -> 1.0 (Very Strong)
    < 1km   -> 0.8
    < 10km  -> 0.5
    > 50km  -> 0.1 (Weak)
    """
    if not loc1 or not loc2:
        return 0.0
        
    distance_km = calculate_haversine(loc1.lat, loc1.lng, loc2.lat, loc2.lng)
    
    if distance_km <= 0.1: # 100m
        return 1.0
    elif distance_km <= 1.0: # 1km
        return 0.8 + (1.0 - distance_km) * 0.1 # Linear decay 0.9->0.8
    elif distance_km <= 10.0:
        return 0.5 + (10.0 - distance_km) / 9.0 * 0.3 # 0.8->0.5
    elif distance_km <= 50.0:
        return 0.1 + (50.0 - distance_km) / 40.0 * 0.4 # 0.5->0.1
    else:
        return 0.0 # Out of range for local lost & found
