from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "AI Matching Service"
    MODEL_VERSION: str = "1.0.0"

    # Matching Thresholds (Strict -> More Sensitive as per User Request)
    THRESHOLD_CONFIRMED: float = 0.90 
    THRESHOLD_REVIEW: float = 0.60

    # Fusion Weights (Must sum to 1.0)
    WEIGHT_VISUAL: float = 0.60
    WEIGHT_TEXT: float = 0.25
    WEIGHT_GEO: float = 0.15

    # Object Detection
    YOLO_MODEL: str = "yolov8x.pt"
    YOLO_CONF_THRESHOLD: float = 0.25
    CROP_PADDING_PCT: float = 0.10

    # Embeddings
    CLIP_MODEL: str = "openai/clip-vit-large-patch14-336"

    class Config:
        env_file = ".env"

settings = Settings()
