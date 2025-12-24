"""
YOLO Detector Wrapper
Handles YOLOv8 model loading and inference
"""
import base64
import io
import time
from typing import List, Dict, Any, Optional
import numpy as np
from PIL import Image
import cv2
from ultralytics import YOLO


class YOLODetector:
    """Wrapper class for YOLOv8 object detection"""

    def __init__(self, model_name: str = "yolov8n.pt", confidence: float = 0.25, iou_threshold: float = 0.45):
        """
        Initialize YOLO detector

        Args:
            model_name: Name of YOLO model to use (default: yolov8n.pt - fastest)
            confidence: Confidence threshold for detections
            iou_threshold: IoU threshold for NMS
        """
        self.model_name = model_name
        self.confidence = confidence
        self.iou_threshold = iou_threshold
        self.model = None
        self.class_names = []
        self._load_model()

    def _load_model(self):
        """Load YOLO model (downloads if not cached)"""
        try:
            print(f"Loading YOLO model: {self.model_name}")
            self.model = YOLO(self.model_name)
            self.class_names = self.model.names
            print(f"Model loaded successfully. Classes: {len(self.class_names)}")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise

    def detect(self, image: Image.Image, confidence: Optional[float] = None,
               iou_threshold: Optional[float] = None) -> Dict[str, Any]:
        """
        Perform object detection on an image

        Args:
            image: PIL Image object
            confidence: Override default confidence threshold
            iou_threshold: Override default IoU threshold

        Returns:
            Dictionary containing detections and metadata
        """
        start_time = time.time()

        # Use custom thresholds if provided, otherwise use defaults
        conf = confidence if confidence is not None else self.confidence
        iou = iou_threshold if iou_threshold is not None else self.iou_threshold

        # Convert PIL to numpy array for YOLO
        img_array = np.array(image)

        # Run inference
        results = self.model.predict(
            img_array,
            conf=conf,
            iou=iou,
            verbose=False
        )

        # Parse results
        detections = []
        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes

            for box in boxes:
                # Extract box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                # Extract class and confidence
                cls = int(box.cls[0].cpu().numpy())
                conf_score = float(box.conf[0].cpu().numpy())

                detection = {
                    "class": self.class_names[cls],
                    "class_id": cls,
                    "confidence": round(conf_score, 3),
                    "bbox": {
                        "x1": int(x1),
                        "y1": int(y1),
                        "x2": int(x2),
                        "y2": int(y2)
                    }
                }
                detections.append(detection)

        processing_time = time.time() - start_time

        # Generate annotated image
        annotated_image = self._draw_detections(image, detections)

        return {
            "detections": detections,
            "num_detections": len(detections),
            "processing_time": round(processing_time, 3),
            "image_shape": {
                "width": image.width,
                "height": image.height
            },
            "annotated_image": annotated_image
        }

    def _draw_detections(self, image: Image.Image, detections: List[Dict]) -> Image.Image:
        """
        Draw bounding boxes and labels on image

        Args:
            image: Original PIL Image
            detections: List of detection dictionaries

        Returns:
            Annotated PIL Image
        """
        # Convert to OpenCV format
        img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Define colors for different classes (BGR format)
        colors = [
            (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0),
            (255, 0, 255), (0, 255, 255), (128, 0, 0), (0, 128, 0)
        ]

        for detection in detections:
            bbox = detection["bbox"]
            x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]

            # Get color based on class
            color = colors[detection["class_id"] % len(colors)]

            # Draw bounding box
            cv2.rectangle(img_cv, (x1, y1), (x2, y2), color, 2)

            # Prepare label
            label = f"{detection['class']} {detection['confidence']:.2f}"

            # Calculate label size and position
            (label_width, label_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )

            # Draw label background
            cv2.rectangle(
                img_cv,
                (x1, y1 - label_height - baseline - 5),
                (x1 + label_width, y1),
                color,
                -1
            )

            # Draw label text
            cv2.putText(
                img_cv,
                label,
                (x1, y1 - baseline - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )

        # Convert back to PIL
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        return Image.fromarray(img_rgb)

    def get_classes(self) -> List[str]:
        """Return list of class names the model can detect"""
        return list(self.class_names.values())

    def get_model_info(self) -> Dict[str, Any]:
        """Return information about the loaded model"""
        return {
            "model_name": self.model_name,
            "num_classes": len(self.class_names),
            "confidence_threshold": self.confidence,
            "iou_threshold": self.iou_threshold,
            "classes": list(self.class_names.values())
        }
