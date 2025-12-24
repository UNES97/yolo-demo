"""
Health Check Routes
Simple endpoints to check API and model status
"""
from fastapi import APIRouter, Depends
from typing import Dict, Any

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint

    Returns:
        Status information about the API
    """
    return {
        "status": "healthy",
        "message": "YOLO Object Detection API is running"
    }


@router.get("/model/info")
async def model_info() -> Dict[str, Any]:
    """
    Get information about the loaded YOLO model

    Returns:
        Model configuration and metadata
    """
    from backend.main import yolo_detector

    if yolo_detector is None:
        return {
            "status": "error",
            "message": "Model not loaded"
        }

    return {
        "status": "ready",
        "model_info": yolo_detector.get_model_info()
    }


@router.get("/classes")
async def get_classes() -> Dict[str, Any]:
    """
    Get list of classes the model can detect

    Returns:
        List of class names
    """
    from backend.main import yolo_detector

    if yolo_detector is None:
        return {
            "status": "error",
            "message": "Model not loaded",
            "classes": []
        }

    return {
        "status": "success",
        "classes": yolo_detector.get_classes(),
        "num_classes": len(yolo_detector.get_classes())
    }
