# YOLO Object Detection Web Application

A real-time object detection web application powered by YOLOv8. Detect objects through your webcam or by uploading images.

## Features

- **Real-time Camera Detection**: Use your webcam for live object detection
- **Image Upload**: Upload and analyze images (JPG, PNG, BMP, WebP)
- **YOLOv8 Powered**: Fast and accurate object detection using the latest YOLO model
- **Adjustable Confidence**: Control detection sensitivity with confidence threshold slider
- **Auto-Detection Mode**: Continuous detection on camera feed
- **Responsive UI**: Clean, modern interface that works on desktop and mobile
- **REST API**: Full-featured API with automatic documentation

## Technology Stack

- **Backend**: FastAPI + Python
- **AI Model**: YOLOv8 (via Ultralytics)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Computer Vision**: OpenCV + PyTorch

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Webcam (for camera mode)
- Modern web browser with camera access

## Installation

### 1. Clone or Navigate to Project Directory

```bash
cd /Applications/MAMP/htdocs/YOLO
```

### 2. Create Virtual Environment

```bash
python3 -m venv venv
```

### 3. Activate Virtual Environment

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This will install:
- FastAPI and Uvicorn (web framework and server)
- Ultralytics YOLOv8 (object detection)
- OpenCV and PyTorch (computer vision)
- Other required packages

**Note**: First run will automatically download the YOLOv8n model (~6MB). This may take a minute depending on your internet connection.

### 5. Create Environment File (Optional)

```bash
cp .env.example .env
```

Edit `.env` if you want to customize settings (model, thresholds, etc.)

## Usage

### Running the Application

1. **Start the Backend Server:**

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Or alternatively:

```bash
python -m backend.main
```

2. **Access the Application:**

Open your browser and navigate to:
- **Main App**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Interactive Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc

### Using Camera Mode

1. Click the "Camera" tab
2. Click "Start Camera"
3. Grant camera permissions when prompted
4. Click "Detect Objects" for single detection, or enable "Auto-detect" for continuous detection
5. Adjust confidence threshold as needed

### Using Upload Mode

1. Click the "Upload Image" tab
2. Drag and drop an image, or click "Choose File"
3. Detection will run automatically once the image is loaded
4. View results with bounding boxes and labels

## API Endpoints

### Health Check
```
GET /api/v1/health
```
Check if API is running

### Model Information
```
GET /api/v1/model/info
```
Get loaded model details

### Get Classes
```
GET /api/v1/classes
```
List all detectable object classes

### Detect Objects in Image
```
POST /api/v1/detect/image
Content-Type: multipart/form-data

Parameters:
- file: Image file (required)
- confidence: Confidence threshold 0.0-1.0 (optional)
- iou_threshold: IoU threshold 0.0-1.0 (optional)
```

### Detect Objects in Frame
```
POST /api/v1/detect/frame
Content-Type: multipart/form-data

Parameters:
- file: Image file OR frame_data: base64 string (required)
- confidence: Confidence threshold 0.0-1.0 (optional)
- iou_threshold: IoU threshold 0.0-1.0 (optional)
```

## Project Structure

```
YOLO/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── models/
│   │   └── yolo_detector.py # YOLO wrapper
│   └── routes/
│       ├── detection.py     # Detection endpoints
│       └── health.py        # Health check
├── frontend/
│   ├── index.html           # Main UI
│   ├── css/
│   │   └── styles.css       # Styling
│   └── js/
│       ├── app.js           # Main controller
│       ├── api.js           # API client
│       ├── camera.js        # Camera handler
│       └── upload.js        # Upload handler
├── uploads/                 # Temporary uploads
├── models_cache/            # YOLO model weights
├── requirements.txt         # Python dependencies
├── .env.example            # Config template
└── README.md               # This file
```

## Configuration

Edit `.env` file to customize:

- **YOLO_MODEL**: Model to use (yolov8n.pt, yolov8s.pt, yolov8m.pt, etc.)
  - `yolov8n.pt`: Fastest, smallest (recommended)
  - `yolov8s.pt`: Small, more accurate
  - `yolov8m.pt`: Medium, even more accurate
  - `yolov8l.pt`: Large, very accurate
  - `yolov8x.pt`: Extra large, most accurate

- **CONFIDENCE_THRESHOLD**: Default confidence (0.0-1.0)
- **MAX_IMAGE_DIMENSION**: Max image size (default: 1280px)
- **ALLOWED_ORIGINS**: CORS origins for API access

## Performance

**YOLOv8n (Nano) - Recommended:**
- Single image: 50-150ms on CPU
- Real-time video: 2-5 FPS on CPU
- Model size: 6MB
- Memory: ~500MB

**Tips for Better Performance:**
- Use YOLOv8n for fastest inference
- Lower confidence threshold to detect more objects
- Reduce image resolution for faster processing
- Enable GPU support for 10x faster inference (requires CUDA)

## Troubleshooting

### Camera Not Working
- Ensure you've granted camera permissions
- Try using HTTPS (required by some browsers)
- Check if camera is being used by another application

### Model Download Fails
- Check internet connection
- The model will download automatically on first run
- Manual download: https://github.com/ultralytics/assets/releases

### API Connection Error
- Ensure backend server is running on port 8000
- Check CORS settings in `backend/config.py`
- Verify firewall settings

### Slow Performance
- Use YOLOv8n (nano) model instead of larger models
- Reduce image size (MAX_IMAGE_DIMENSION setting)
- Consider using GPU if available

## Development

### Running in Development Mode

```bash
# Backend with auto-reload
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Access frontend
open http://localhost:8000
```

### Testing the API

Use the interactive API docs at http://localhost:8000/docs to test endpoints.

Or use curl:

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Detect objects in image
curl -X POST "http://localhost:8000/api/v1/detect/image" \
  -F "file=@path/to/image.jpg" \
  -F "confidence=0.3"
```

## Supported Object Classes

YOLOv8 can detect 80 object classes from the COCO dataset:

person, bicycle, car, motorcycle, airplane, bus, train, truck, boat, traffic light, fire hydrant, stop sign, parking meter, bench, bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe, backpack, umbrella, handbag, tie, suitcase, frisbee, skis, snowboard, sports ball, kite, baseball bat, baseball glove, skateboard, surfboard, tennis racket, bottle, wine glass, cup, fork, knife, spoon, bowl, banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake, chair, couch, potted plant, bed, dining table, toilet, tv, laptop, mouse, remote, keyboard, cell phone, microwave, oven, toaster, sink, refrigerator, book, clock, vase, scissors, teddy bear, hair drier, toothbrush

## License

This project uses:
- YOLOv8 by Ultralytics (AGPL-3.0)
- FastAPI (MIT)
- Other open-source libraries

## Credits

- **YOLOv8**: Ultralytics (https://github.com/ultralytics/ultralytics)
- **FastAPI**: Sebastián Ramírez (https://fastapi.tiangolo.com)

## Support

For issues or questions:
1. Check the API docs: http://localhost:8000/docs
2. Review this README
3. Check console logs for errors
4. Ensure all dependencies are installed

---

Built with YOLOv8, FastAPI, and modern web technologies.
