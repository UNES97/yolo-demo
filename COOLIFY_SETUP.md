# Coolify Deployment Guide

## Configuration Steps

### 1. Port Configuration
In your Coolify application settings:
- **Ports Exposes**: `8010`
- **Ports Mappings**: Leave empty (Coolify will auto-map)

### 2. Environment Variables
Add these in Coolify's Environment Variables section:
```
PORT=8010
HOST=0.0.0.0
DEBUG=false
ALLOWED_ORIGINS=*
```

### 3. Health Check
- **Health Check Path**: `/health`
- **Health Check Port**: `8010`
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

### "404 page not found" Error

1. **Check Application Logs**:
   - In Coolify, go to your application → Logs
   - Look for startup messages and errors
   - You should see: "Starting YOLO Object Detection API"

2. **Verify Port**:
   - Ensure port 8010 is configured in Coolify
   - Check that the container is listening on 0.0.0.0:8010

3. **Test Health Endpoint**:
   ```bash
   curl http://your-domain/health
   ```
   Should return: `{"status":"ok"}`

4. **Check Container Status**:
   - Make sure the container is running
   - Check if health checks are passing

5. **Review Build Logs**:
   - Ensure the Docker build completed successfully
   - Check for any package installation errors

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
docker run -p 8010:8010 yolo-app

# Test
curl http://localhost:8010/health
```

## Additional Resources

- API Documentation: `http://your-domain/docs`
- Health Check: `http://your-domain/health`
- API Health: `http://your-domain/api/v1/health`
