#!/bin/bash

# YOLO Object Detection - Setup and Run Script
# This script sets up the environment and runs the application

set -e  # Exit on error

echo "========================================"
echo "YOLO Object Detection - Setup & Run"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Use Python 3.11 (required for PyTorch compatibility)
PYTHON_CMD="python3.11"

# Check if Python 3.11 is installed
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo -e "${RED}Error: Python 3.11 is not installed.${NC}"
    echo "PyTorch and ML packages require Python 3.11 or 3.12"
    echo "Please install Python 3.11 using: brew install python@3.11"
    exit 1
fi

echo -e "${GREEN}✓${NC} Python found: $($PYTHON_CMD --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}→${NC} Creating virtual environment with Python 3.11..."
    $PYTHON_CMD -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
else
    echo -e "${GREEN}✓${NC} Virtual environment already exists"
fi

# Activate virtual environment
echo -e "${YELLOW}→${NC} Activating virtual environment..."
source venv/bin/activate
echo -e "${GREEN}✓${NC} Virtual environment activated"

# Upgrade pip
echo -e "${YELLOW}→${NC} Upgrading pip..."
python -m pip install --upgrade pip -q
echo -e "${GREEN}✓${NC} Pip upgraded"

# Install requirements
echo -e "${YELLOW}→${NC} Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo "Warning: requirements.txt not found"
fi

# Create .env file from .env.example if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}→${NC} Creating .env file from .env.example..."
        cp .env.example .env
        echo -e "${GREEN}✓${NC} .env file created"
    else
        echo "Warning: .env.example not found"
    fi
else
    echo -e "${GREEN}✓${NC} .env file already exists"
fi

# Create necessary directories
echo -e "${YELLOW}→${NC} Setting up directories..."
mkdir -p uploads
mkdir -p models_cache
echo -e "${GREEN}✓${NC} Directories ready"

# Check if YOLO model exists
if [ ! -f "models_cache/yolov8n.pt" ]; then
    echo -e "${YELLOW}→${NC} Note: YOLO model will be downloaded on first run"
fi

echo ""
echo "========================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================"
echo ""
echo "Starting FastAPI server..."
echo ""

# Run the FastAPI application from project root
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8010
