/**
 * Camera Handler
 * Manages webcam access, video stream, and frame capture
 */

class CameraHandler {
    constructor() {
        this.videoElement = document.getElementById('videoElement');
        this.canvas = document.getElementById('videoCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.isRunning = false;
        this.detectionInterval = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.facingMode = 'environment'; // Default to back camera (environment)
    }

    /**
     * Check camera permission status
     */
    async checkPermission() {
        if (!navigator.permissions) {
            return 'unavailable';
        }

        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            return result.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            console.log('Permission API not supported, will try direct access');
            return 'unavailable';
        }
    }

    /**
     * Start camera stream
     */
    async start() {
        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('UNSUPPORTED: Your browser does not support camera access. Please use Chrome, Firefox, or Safari.');
            }

            // Check permission status
            const permissionStatus = await this.checkPermission();
            console.log('Camera permission status:', permissionStatus);

            if (permissionStatus === 'denied') {
                throw new Error('DENIED: Camera access was denied. Please click the camera icon in your browser\'s address bar and allow camera access, then refresh the page.');
            }

            // Request camera access
            console.log('Requesting camera access with facingMode:', this.facingMode);
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: this.facingMode
                },
                audio: false
            });

            // Set video source
            this.videoElement.srcObject = this.stream;
            this.isRunning = true;

            // Wait for video to load metadata
            await new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    // Set canvas size to match video
                    this.canvas.width = this.videoElement.videoWidth;
                    this.canvas.height = this.videoElement.videoHeight;
                    resolve();
                };

                // Timeout after 10 seconds
                setTimeout(() => reject(new Error('Camera initialization timeout')), 10000);
            });

            console.log('Camera started successfully');
            return true;
        } catch (error) {
            console.error('Failed to start camera:', error);

            // Provide specific error messages
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                throw new Error('PERMISSION: Camera access was denied. Please allow camera access when prompted, or check your browser settings.\n\nHow to fix:\n1. Look for the camera icon in your browser\'s address bar\n2. Click it and select "Allow"\n3. Refresh the page and try again');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                throw new Error('NO_CAMERA: No camera detected. Please ensure a camera is connected to your device.');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                throw new Error('CAMERA_BUSY: Camera is already in use by another application. Please close other apps using the camera and try again.');
            } else if (error.name === 'OverconstrainedError') {
                throw new Error('RESOLUTION: Camera does not support the requested resolution. Trying with default settings...');
            } else if (error.message && error.message.startsWith('UNSUPPORTED:')) {
                throw error;
            } else if (error.message && error.message.startsWith('DENIED:')) {
                throw error;
            } else {
                throw new Error('UNKNOWN: ' + (error.message || 'Failed to access camera. Please check your browser settings and try again.'));
            }
        }
    }

    /**
     * Stop camera stream
     */
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.videoElement.srcObject) {
            this.videoElement.srcObject = null;
        }

        this.isRunning = false;
        this.stopAutoDetection();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        console.log('Camera stopped');
    }

    /**
     * Capture current frame from video
     */
    captureFrame() {
        if (!this.isRunning) {
            throw new Error('Camera is not running');
        }

        // Create temporary canvas for frame capture
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = this.videoElement.videoWidth;
        frameCanvas.height = this.videoElement.videoHeight;
        const frameCtx = frameCanvas.getContext('2d');

        // Draw current video frame
        frameCtx.drawImage(this.videoElement, 0, 0, frameCanvas.width, frameCanvas.height);

        return frameCanvas;
    }

    /**
     * Capture frame as blob
     */
    async captureFrameAsBlob() {
        const frameCanvas = this.captureFrame();
        return await yoloApi.canvasToBlob(frameCanvas, 'image/jpeg', 0.8);
    }

    /**
     * Capture frame as base64
     */
    captureFrameAsBase64() {
        const frameCanvas = this.captureFrame();
        return yoloApi.canvasToBase64(frameCanvas, 'image/jpeg', 0.8);
    }

    /**
     * Draw detections on canvas overlay
     */
    drawDetections(detections) {
        // Clear previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!detections || detections.length === 0) {
            return;
        }

        // Define colors for different classes
        const colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#FF8800', '#8800FF'
        ];

        detections.forEach((detection, index) => {
            const { bbox, class: className, confidence } = detection;
            const color = colors[index % colors.length];

            // Draw bounding box
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                bbox.x1,
                bbox.y1,
                bbox.x2 - bbox.x1,
                bbox.y2 - bbox.y1
            );

            // Prepare label
            const label = `${className} ${(confidence * 100).toFixed(0)}%`;

            // Measure label size
            this.ctx.font = 'bold 16px Arial';
            const textMetrics = this.ctx.measureText(label);
            const textWidth = textMetrics.width;
            const textHeight = 20;

            // Draw label background
            this.ctx.fillStyle = color;
            this.ctx.fillRect(
                bbox.x1,
                bbox.y1 - textHeight - 4,
                textWidth + 10,
                textHeight + 4
            );

            // Draw label text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(label, bbox.x1 + 5, bbox.y1 - 8);
        });
    }

    /**
     * Start auto-detection loop
     */
    startAutoDetection(detectionCallback, intervalMs = 500) {
        this.stopAutoDetection(); // Clear any existing interval

        this.detectionInterval = setInterval(async () => {
            if (!this.isRunning) {
                this.stopAutoDetection();
                return;
            }

            try {
                await detectionCallback();

                // Calculate FPS
                const now = performance.now();
                if (this.lastFrameTime > 0) {
                    const delta = (now - this.lastFrameTime) / 1000; // seconds
                    this.fps = (1 / delta).toFixed(1);
                }
                this.lastFrameTime = now;
                this.frameCount++;
            } catch (error) {
                console.error('Auto-detection error:', error);
            }
        }, intervalMs);
    }

    /**
     * Stop auto-detection loop
     */
    stopAutoDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
    }

    /**
     * Check if camera is supported
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Get FPS
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Switch between front and back camera
     */
    async switchCamera() {
        const wasRunning = this.isRunning;

        if (wasRunning) {
            this.stop();
        }

        // Toggle facing mode
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        console.log('Switching to camera:', this.facingMode);

        if (wasRunning) {
            await this.start();
        }

        return this.facingMode;
    }

    /**
     * Get current facing mode
     */
    getFacingMode() {
        return this.facingMode;
    }
}

// Create global camera instance
const cameraHandler = new CameraHandler();
