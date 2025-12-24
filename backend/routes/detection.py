"""
Object Detection Routes
Endpoints for image and video frame detection
"""
import base64
import io
import os
from typing import Optional, Dict, Any
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from PIL import Image
import uuid

from backend.config import settings

router = APIRouter(prefix="/api/v1", tags=["detection"])


def resize_image_if_needed(image: Image.Image, max_dimension: int = 1280) -> Image.Image:
    """
    Resize image if it exceeds max dimension while maintaining aspect ratio

    Args:
        image: PIL Image to potentially resize
        max_dimension: Maximum width or height

    Returns:
        Resized or original image
    """
    width, height = image.size

    if width <= max_dimension and height <= max_dimension:
        return image

    # Calculate new dimensions maintaining aspect ratio
    if width > height:
        new_width = max_dimension
        new_height = int(height * (max_dimension / width))
    else:
        new_height = max_dimension
        new_width = int(width * (max_dimension / height))

    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)


def image_to_base64(image: Image.Image, format: str = "JPEG") -> str:
    """
    Convert PIL Image to base64 string

    Args:
        image: PIL Image
        format: Image format (JPEG, PNG, etc.)

    Returns:
        Base64 encoded string with data URI prefix
    """
    buffered = io.BytesIO()
    image.save(buffered, format=format)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/{format.lower()};base64,{img_str}"


@router.post("/detect/image")
async def detect_image(
    file: UploadFile = File(...),
    confidence: Optional[float] = Form(None),
    iou_threshold: Optional[float] = Form(None)
) -> Dict[str, Any]:
    """
    Detect objects in an uploaded image

    Args:
        file: Image file (JPEG, PNG, etc.)
        confidence: Confidence threshold (0.0-1.0)
        iou_threshold: IoU threshold for NMS (0.0-1.0)

    Returns:
        Detection results with bounding boxes and annotated image
    """
    from backend.main import yolo_detector

    if yolo_detector is None:
        raise HTTPException(status_code=500, detail="YOLO model not loaded")

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    try:
        # Read and process image
        contents = await file.read()

        # Check file size
        if len(contents) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE / 1024 / 1024}MB"
            )

        # Open image
        image = Image.open(io.BytesIO(contents))

        # Convert to RGB if needed (handles RGBA, grayscale, etc.)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize if needed
        image = resize_image_if_needed(image, settings.MAX_IMAGE_DIMENSION)

        # Perform detection
        results = yolo_detector.detect(
            image,
            confidence=confidence,
            iou_threshold=iou_threshold
        )

        # Convert annotated image to base64
        annotated_base64 = image_to_base64(results["annotated_image"])

        return {
            "success": True,
            "filename": file.filename,
            "detections": results["detections"],
            "num_detections": results["num_detections"],
            "processing_time": results["processing_time"],
            "image_shape": results["image_shape"],
            "annotated_image": annotated_base64
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@router.post("/detect/frame")
async def detect_frame(
    file: UploadFile = File(None),
    frame_data: Optional[str] = Form(None),
    confidence: Optional[float] = Form(None),
    iou_threshold: Optional[float] = Form(None)
) -> Dict[str, Any]:
    """
    Detect objects in a video frame

    Args:
        file: Image file OR
        frame_data: Base64 encoded image data
        confidence: Confidence threshold (0.0-1.0)
        iou_threshold: IoU threshold for NMS (0.0-1.0)

    Returns:
        Detection results with bounding boxes
    """
    from backend.main import yolo_detector

    if yolo_detector is None:
        raise HTTPException(status_code=500, detail="YOLO model not loaded")

    try:
        # Handle either file upload or base64 data
        if file:
            contents = await file.read()
            image = Image.open(io.BytesIO(contents))
        elif frame_data:
            # Remove data URI prefix if present
            if "base64," in frame_data:
                frame_data = frame_data.split("base64,")[1]

            # Decode base64
            image_bytes = base64.b64decode(frame_data)
            image = Image.open(io.BytesIO(image_bytes))
        else:
            raise HTTPException(
                status_code=400,
                detail="Either 'file' or 'frame_data' must be provided"
            )

        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Resize if needed (important for real-time performance)
        image = resize_image_if_needed(image, settings.MAX_IMAGE_DIMENSION)

        # Perform detection
        results = yolo_detector.detect(
            image,
            confidence=confidence,
            iou_threshold=iou_threshold
        )

        # Convert annotated image to base64
        annotated_base64 = image_to_base64(results["annotated_image"])

        return {
            "success": True,
            "detections": results["detections"],
            "num_detections": results["num_detections"],
            "processing_time": results["processing_time"],
            "image_shape": results["image_shape"],
            "annotated_image": annotated_base64
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing frame: {str(e)}")
