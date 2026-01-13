from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.config import settings
from app.processing.detector import detector
from app.processing.embedder import embedder

app = FastAPI(
    title="AI Matching Service",
    description="Microservice for Lost & Found Object Matching using YOLOv8x + CLIP",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    # Preload models at startup
    print("Preloading AI models (YOLOv8x + CLIP ViT-L/14)...")
    _ = detector.model
    _ = embedder.vis_model
    _ = embedder.txt_model
    print("AI Models preloaded successfully.")

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_version": settings.MODEL_VERSION}
