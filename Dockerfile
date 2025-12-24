# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV and other libraries
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
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
COPY yolov8n.pt ./yolov8n.pt

# Create necessary directories
RUN mkdir -p uploads models_cache

# Expose the port the app runs on
EXPOSE 8010

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the FastAPI application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8010"]
