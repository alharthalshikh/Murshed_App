from ultralytics import YOLO
from PIL import Image
import numpy as np
from app.core.config import settings
from app.core.schemas import DetectionResult
from typing import Tuple
import io

class ObjectDetector:
    def __init__(self):
        # Load strictly yolov8x for maximum accuracy as requested
        self.model = YOLO(settings.YOLO_MODEL)
    
    def detect_and_crop(self, image_data: bytes) -> Tuple[Image.Image, DetectionResult]:
        """
        Detects the primary object and returns a cropped PIL Image.
        Enforces strict confidence thresholds.
        """
        # Load image
        original_img = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Inference
        results = self.model(original_img, conf=settings.YOLO_CONF_THRESHOLD, verbose=False)
        result = results[0]
        
        if len(result.boxes) == 0:
            return original_img, None # Fallback to full image if nothing detected (should be handled upstream)

        # Select Primary Object
        # Logic: Prioritize highest confidence, then largest area
        # For now, we take the one with highest confidence as YOLO sorts by conf by default
        best_box = result.boxes[0]
        
        # Extract coordinates
        x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
        conf = float(best_box.conf[0])
        cls_id = int(best_box.cls[0])
        label = result.names[cls_id]
        
        # Apply padding (10%)
        width = x2 - x1
        height = y2 - y1
        pad_x = int(width * settings.CROP_PADDING_PCT)
        pad_y = int(height * settings.CROP_PADDING_PCT)
        
        # Ensure bounds
        img_w, img_h = original_img.size
        crop_x1 = max(0, x1 - pad_x)
        crop_y1 = max(0, y1 - pad_y)
        crop_x2 = min(img_w, x2 + pad_x)
        crop_y2 = min(img_h, y2 + pad_y)
        
        # Crop
        cropped_img = original_img.crop((crop_x1, crop_y1, crop_x2, crop_y2))
        
        detection_info = DetectionResult(
            label=label,
            confidence=conf,
            box=(x1, y1, x2, y2)
        )
        
        return cropped_img, detection_info

detector = ObjectDetector()
