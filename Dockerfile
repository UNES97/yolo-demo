# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV and other libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgl1 \
    ffmpeg \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker caching
COPY requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY .env.example .env

# Create necessary directories
RUN mkdir -p uploads models_cache

# Note: YOLO model (yolov8n.pt) will be downloaded automatically on first run
# The model will be cached in the models_cache directory (mounted as volume)

# Expose the port the app runs on
EXPOSE 8010

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8010
ENV HOST=0.0.0.0
ENV DEBUG=false

# Run the FastAPI application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8010"]
