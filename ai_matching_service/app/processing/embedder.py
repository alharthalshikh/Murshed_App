from transformers import CLIPProcessor, CLIPModel
import torch
import torch.nn.functional as F
from PIL import Image
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading CLIP model on {self.device}...")
        self.model = CLIPModel.from_pretrained(settings.CLIP_MODEL).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(settings.CLIP_MODEL)
    
    def get_image_embedding(self, image: Image.Image) -> list[float]:
        inputs = self.processor(images=image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            features = self.model.get_image_features(**inputs)
        
        # Enforce L2 Normalization immediately
        features = F.normalize(features, p=2, dim=1)
        return features.cpu().numpy().flatten().tolist()

    def get_text_embedding(self, text: str) -> list[float]:
        # Minimal cleaning as requested
        clean_text = text.strip()
        
        inputs = self.processor(text=[clean_text], return_tensors="pt", padding=True).to(self.device)
        with torch.no_grad():
            features = self.model.get_text_features(**inputs)
            
        # Enforce L2 Normalization immediately
        features = F.normalize(features, p=2, dim=1)
        return features.cpu().numpy().flatten().tolist()

embedder = EmbeddingService()
