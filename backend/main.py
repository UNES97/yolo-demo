"""
FastAPI Main Application
YOLO Object Detection API
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

from backend.config import settings
from backend.models.yolo_detector import YOLODetector
from backend.routes import health, detection

# Global YOLO detector instance
yolo_detector = None

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Object detection API using YOLOv8",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if not settings.DEBUG else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize YOLO model on startup"""
    global yolo_detector

    print("=" * 60)
    print(f"Starting {settings.APP_NAME}")
    print("=" * 60)

    try:
        print(f"\nInitializing YOLO model: {settings.YOLO_MODEL}")
        yolo_detector = YOLODetector(
            model_name=settings.YOLO_MODEL,
            confidence=settings.CONFIDENCE_THRESHOLD,
            iou_threshold=settings.IOU_THRESHOLD
        )
        print("Model loaded successfully!")
        print(f"Detected {len(yolo_detector.get_classes())} object classes")
    except Exception as e:
        print(f"ERROR: Failed to load YOLO model: {e}")
        print("API will be unavailable until model is loaded")

    print("\n" + "=" * 60)
    print(f"API running at: http://{settings.HOST}:{settings.PORT}")
    print(f"API Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"Frontend: http://{settings.HOST}:{settings.PORT}/")
    print("=" * 60 + "\n")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("\nShutting down YOLO Object Detection API...")


# Include routers
app.include_router(health.router)
app.include_router(detection.router)

# Serve frontend static files
if settings.FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(settings.FRONTEND_DIR)), name="static")

    @app.get("/")
    async def serve_frontend():
        """Serve the main frontend HTML page"""
        index_path = settings.FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"message": "Frontend not found. Please create frontend/index.html"}
else:
    @app.get("/")
    async def root():
        """Root endpoint"""
        return {
            "message": f"Welcome to {settings.APP_NAME}",
            "docs": "/docs",
            "health": "/api/v1/health"
        }


if __name__ == "__main__":
    # Run with: python -m backend.main
    # Or use: uvicorn backend.main:app --reload
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
