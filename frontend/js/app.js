/**
 * Main Application Controller
 * Coordinates all components and manages UI state
 */

class YOLOApp {
    constructor() {
        // UI Elements
        this.cameraModeBtn = document.getElementById('cameraMode');
        this.uploadModeBtn = document.getElementById('uploadMode');
        this.cameraModeContent = document.getElementById('cameraModeContent');
        this.uploadModeContent = document.getElementById('uploadModeContent');
        this.startCameraBtn = document.getElementById('startCamera');
        this.stopCameraBtn = document.getElementById('stopCamera');
        this.switchCameraBtn = document.getElementById('switchCamera');
        this.captureFrameBtn = document.getElementById('captureFrame');
        this.cameraStatus = document.getElementById('cameraStatus');
        this.confidenceSlider = document.getElementById('confidenceSlider');
        this.confidenceValue = document.getElementById('confidenceValue');
        this.autoDetectCheckbox = document.getElementById('autoDetect');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorMessage = document.getElementById('errorMessage');

        // State
        this.currentMode = 'camera';
        this.isProcessing = false;
        this.confidence = 0.25;

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing YOLO Object Detection App...');

        // Check API health
        try {
            const health = await yoloApi.checkHealth();
            console.log('API Status:', health);
        } catch (error) {
            this.showError('Failed to connect to API. Please ensure the backend server is running.');
        }

        // Setup event listeners
        this.setupEventListeners();

        // Check camera support
        if (!CameraHandler.isSupported()) {
            this.showError('Camera not supported in this browser.');
            this.startCameraBtn.disabled = true;
        }

        console.log('App initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mode switching
        this.cameraModeBtn.addEventListener('click', () => this.switchMode('camera'));
        this.uploadModeBtn.addEventListener('click', () => this.switchMode('upload'));

        // Camera controls
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
        this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        this.captureFrameBtn.addEventListener('click', () => this.detectFrame());

        // Confidence slider
        this.confidenceSlider.addEventListener('input', (e) => {
            this.confidence = parseFloat(e.target.value);
            this.confidenceValue.textContent = this.confidence.toFixed(2);
        });

        // Auto-detect checkbox
        this.autoDetectCheckbox.addEventListener('change', (e) => {
            if (e.target.checked && cameraHandler.isRunning) {
                this.startAutoDetection();
            } else {
                cameraHandler.stopAutoDetection();
            }
        });

        // Upload handler callback
        uploadHandler.onFileLoaded = async (file) => {
            await this.detectImage(file);
        };
    }

    /**
     * Switch between camera and upload modes
     */
    switchMode(mode) {
        if (this.currentMode === mode) return;

        this.currentMode = mode;

        if (mode === 'camera') {
            // Switch to camera mode
            this.cameraModeBtn.classList.add('active');
            this.uploadModeBtn.classList.remove('active');
            this.cameraModeContent.classList.add('active');
            this.uploadModeContent.classList.remove('active');

            // Reset upload
            uploadHandler.reset();
        } else {
            // Switch to upload mode
            this.uploadModeBtn.classList.add('active');
            this.cameraModeBtn.classList.remove('active');
            this.uploadModeContent.classList.add('active');
            this.cameraModeContent.classList.remove('active');

            // Stop camera
            if (cameraHandler.isRunning) {
                this.stopCamera();
            }
        }

        // Hide results when switching modes
        this.hideResults();
        this.hideError();
    }

    /**
     * Start camera
     */
    async startCamera() {
        try {
            this.showLoading();
            await cameraHandler.start();

            // Update UI
            this.startCameraBtn.style.display = 'none';
            this.stopCameraBtn.style.display = 'inline-block';
            this.switchCameraBtn.style.display = 'inline-block';
            this.captureFrameBtn.style.display = 'inline-block';

            const cameraType = cameraHandler.getFacingMode() === 'environment' ? 'Back' : 'Front';
            this.showStatus(`${cameraType} camera started successfully`, 'success');

            // Start auto-detection if enabled
            if (this.autoDetectCheckbox.checked) {
                this.startAutoDetection();
            }

            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }

    /**
     * Stop camera
     */
    stopCamera() {
        cameraHandler.stop();

        // Update UI
        this.startCameraBtn.style.display = 'inline-block';
        this.stopCameraBtn.style.display = 'none';
        this.switchCameraBtn.style.display = 'none';
        this.captureFrameBtn.style.display = 'none';
        this.showStatus('Camera stopped', 'success');
        this.hideResults();
    }

    /**
     * Switch camera (front/back)
     */
    async switchCamera() {
        try {
            this.showLoading();
            const newFacingMode = await cameraHandler.switchCamera();

            const cameraType = newFacingMode === 'environment' ? 'Back' : 'Front';
            this.showStatus(`Switched to ${cameraType} camera`, 'success');

            // Restart auto-detection if it was running
            if (this.autoDetectCheckbox.checked) {
                this.startAutoDetection();
            }

            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError(`Failed to switch camera: ${error.message}`);
        }
    }

    /**
     * Start auto-detection for camera
     */
    startAutoDetection() {
        cameraHandler.startAutoDetection(async () => {
            await this.detectFrame(true);
        }, 1000); // Detect every 1 second
    }

    /**
     * Detect objects in camera frame
     */
    async detectFrame(isAuto = false) {
        if (this.isProcessing && !isAuto) return;

        try {
            this.isProcessing = true;

            if (!isAuto) {
                this.showLoading();
            }

            // Capture frame
            const frameBlob = await cameraHandler.captureFrameAsBlob();

            // Send to API
            const result = await yoloApi.detectFrame(frameBlob, this.confidence);

            // Draw detections
            cameraHandler.drawDetections(result.detections);

            // Update results
            this.displayResults(result);

            if (!isAuto) {
                this.hideLoading();
            }

            this.isProcessing = false;
        } catch (error) {
            this.isProcessing = false;
            if (!isAuto) {
                this.hideLoading();
                this.showError(error.message);
            }
            console.error('Frame detection error:', error);
        }
    }

    /**
     * Detect objects in uploaded image
     */
    async detectImage(file) {
        try {
            this.showLoading();
            this.hideError();

            // Send to API
            const result = await yoloApi.detectImage(file, this.confidence);

            // Display annotated image
            uploadHandler.displayAnnotatedImage(result.annotated_image);

            // Update results
            this.displayResults(result);

            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
            console.error('Image detection error:', error);
        }
    }

    /**
     * Display detection results
     */
    displayResults(result) {
        // Show results container
        this.resultsContainer.style.display = 'block';

        // Update stats
        document.getElementById('objectCount').textContent = result.num_detections;
        document.getElementById('processingTime').textContent =
            `${(result.processing_time * 1000).toFixed(0)}ms`;

        // Update FPS for camera mode
        if (this.currentMode === 'camera' && cameraHandler.isRunning) {
            document.getElementById('fps').textContent = cameraHandler.getFPS();
        } else {
            document.getElementById('fps').textContent = '-';
        }

        // Update detections list
        const detectionsList = document.getElementById('detectionsList');
        detectionsList.innerHTML = '';

        if (result.detections.length === 0) {
            detectionsList.innerHTML = '<p style="text-align: center; color: #6c757d;">No objects detected</p>';
        } else {
            result.detections.forEach((detection) => {
                const item = document.createElement('div');
                item.className = 'detection-item';
                item.innerHTML = `
                    <span class="detection-class">${detection.class}</span>
                    <span class="detection-confidence">${(detection.confidence * 100).toFixed(1)}%</span>
                `;
                detectionsList.appendChild(item);
            });
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.loadingIndicator.style.display = 'block';
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        // Format multi-line messages
        const formattedMessage = message.replace(/\\n/g, '<br>');
        this.errorMessage.innerHTML = formattedMessage;
        this.errorMessage.style.display = 'block';

        // Check if this is a permission error that needs user action
        const needsUserAction = message.includes('PERMISSION:') ||
                                message.includes('DENIED:') ||
                                message.includes('How to fix:');

        // Add retry button for permission errors
        if (needsUserAction && this.currentMode === 'camera') {
            const retryBtn = document.createElement('button');
            retryBtn.textContent = 'Try Again';
            retryBtn.className = 'btn btn-primary';
            retryBtn.style.marginTop = '10px';
            retryBtn.onclick = () => {
                this.hideError();
                this.startCamera();
            };
            this.errorMessage.appendChild(document.createElement('br'));
            this.errorMessage.appendChild(retryBtn);
        }

        // Only auto-hide non-critical errors
        if (!needsUserAction) {
            setTimeout(() => this.hideError(), 5000);
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        this.errorMessage.style.display = 'none';
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'success') {
        this.cameraStatus.textContent = message;
        this.cameraStatus.className = `status-message ${type}`;
        this.cameraStatus.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.cameraStatus.style.display = 'none';
        }, 3000);
    }

    /**
     * Hide results
     */
    hideResults() {
        this.resultsContainer.style.display = 'none';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.yoloApp = new YOLOApp();
});
