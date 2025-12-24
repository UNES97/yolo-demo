# Coolify Deployment Guide

## Configuration Steps

### 1. Port Configuration
In your Coolify application settings:
- **Ports Exposes**: `8000`
- **Ports Mappings**: `8010:8000` (external:internal)

### 2. Environment Variables
Add these in Coolify's Environment Variables section:
```
PORT=8000
HOST=0.0.0.0
DEBUG=false
ALLOWED_ORIGINS=*
```

### 3. Health Check
- **Health Check Path**: `/health`
- **Health Check Port**: `8000`
- **Health Check Method**: `GET`

### 4. Domain Configuration
- Go to **Domains** tab
- Click **"Generate Domain"** or add your custom domain
- Make sure the domain points to your app

### 5. Build Pack
- **Type**: Dockerfile
- **Dockerfile Location**: `./Dockerfile`

### 6. Volumes (Optional but Recommended)
Add persistent volumes:
- `/app/uploads` → For uploaded files
- `/app/models_cache` → For YOLO model cache

## Troubleshooting

### "404 page not found" on ALL Endpoints

This means Coolify's reverse proxy cannot reach your container. Follow these steps:

#### Step 1: Verify Port Configuration
In Coolify → Your App → **Service** tab:
- **Ports Exposes**: Must be `8000` (just the number)
- **Ports Mappings**: `8010:8000` (external port 8010 → internal port 8000)

#### Step 2: Check Domain Setup
In Coolify → Your App → **Domains** tab:
- Must have at least one domain configured
- If empty, click **"Generate Domain"**
- Note the full URL (e.g., `http://yourapp.server.com`)

#### Step 3: Verify Application Settings
In Coolify → Your App → **General** tab:
- **Port**: Should show `8000`
- **Dockerfile Location**: `Dockerfile` or `./Dockerfile`
- **Build Pack**: `Dockerfile`
- **Base Directory**: `/` (or empty)

#### Step 4: Check Application Logs
In Coolify → Your App → **Logs** tab, you should see:
```
Starting YOLO Object Detection API
API running at: http://0.0.0.0:8000
```

If you see this, the app IS running but Coolify routing is broken.

#### Step 5: Test Endpoints
Try these URLs (replace with your actual domain):
```bash
# Simple health check
curl http://your-domain/health

# Test endpoint with debug info
curl http://your-domain/test

# API docs
curl http://your-domain/docs
```

Expected responses:
- `/health` → `{"status":"ok"}`
- `/test` → `{"status":"working","message":"If you see this, the app is running!",...}`

#### Step 6: If Still 404 - Nuclear Option
1. **Stop** the application in Coolify
2. In **Service** tab, verify:
   - **Ports Exposes**: `8000`
   - **Ports Mappings**: `8010:8000`
3. **Redeploy** (click Deploy button)
4. Wait for build to complete
5. Check logs for startup message

If still broken:
1. **Delete** the application in Coolify
2. **Create new** application from scratch
3. During setup, ensure Port is set to `8000`
4. Set Ports Mappings to `8010:8000`
5. Generate domain before first deployment

### Common Issues

- **Model Download**: First startup takes longer as it downloads YOLOv8 model (~6MB)
- **Memory**: Ensure your server has at least 2GB RAM available
- **CORS Errors**: If you need specific origins, update `ALLOWED_ORIGINS` in environment variables

## Testing Locally

Before deploying to Coolify, test locally:

```bash
# Build the image
docker build -t yolo-app .

# Run the container
docker run -p 8010:8000 yolo-app

# Test
curl http://localhost:8010/health
```

## Additional Resources

- API Documentation: `http://your-domain/docs`
- Health Check: `http://your-domain/health`
- API Health: `http://your-domain/api/v1/health`
