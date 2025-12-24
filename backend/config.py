"""
Application Configuration
Environment variables and settings
"""
import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "YOLO Object Detection API"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 3000

    # Model Configuration
    YOLO_MODEL: str = "yolov8n.pt"  # yolov8n.pt (fastest), yolov8s.pt, yolov8m.pt, etc.
    CONFIDENCE_THRESHOLD: float = 0.25
    IOU_THRESHOLD: float = 0.45

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    MODEL_CACHE_DIR: Path = BASE_DIR / "models_cache"
    FRONTEND_DIR: Path = BASE_DIR / "frontend"

    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "*"  # Allow all origins by default
    ]

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".bmp", ".webp"]

    # Performance
    MAX_IMAGE_DIMENSION: int = 1280  # Resize larger images to this max dimension

    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_origins(cls, v):
        """Parse comma-separated string into list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )


# Create settings instance
settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(exist_ok=True)
settings.MODEL_CACHE_DIR.mkdir(exist_ok=True)
