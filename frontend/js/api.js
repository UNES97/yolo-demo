/**
 * API Client for YOLO Object Detection
 * Handles all communication with the backend API
 */

class YOLOApi {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl || window.location.origin;
        this.apiBase = `${this.baseUrl}/api/v1`;
    }

    /**
     * Check API health
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    /**
     * Get model information
     */
    async getModelInfo() {
        try {
            const response = await fetch(`${this.apiBase}/model/info`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get model info:', error);
            throw error;
        }
    }

    /**
     * Get list of detectable classes
     */
    async getClasses() {
        try {
            const response = await fetch(`${this.apiBase}/classes`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get classes:', error);
            throw error;
        }
    }

    /**
     * Detect objects in an image file
     * @param {File} file - Image file
     * @param {number} confidence - Confidence threshold (0.0-1.0)
     * @param {number} iouThreshold - IoU threshold (0.0-1.0)
     */
    async detectImage(file, confidence = null, iouThreshold = null) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            if (confidence !== null) {
                formData.append('confidence', confidence.toString());
            }

            if (iouThreshold !== null) {
                formData.append('iou_threshold', iouThreshold.toString());
            }

            const response = await fetch(`${this.apiBase}/detect/image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Detection failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Image detection failed:', error);
            throw error;
        }
    }

    /**
     * Detect objects in a video frame
     * @param {Blob|string} frameData - Frame as Blob or base64 string
     * @param {number} confidence - Confidence threshold (0.0-1.0)
     * @param {number} iouThreshold - IoU threshold (0.0-1.0)
     */
    async detectFrame(frameData, confidence = null, iouThreshold = null) {
        try {
            const formData = new FormData();

            if (frameData instanceof Blob) {
                formData.append('file', frameData, 'frame.jpg');
            } else if (typeof frameData === 'string') {
                formData.append('frame_data', frameData);
            }

            if (confidence !== null) {
                formData.append('confidence', confidence.toString());
            }

            if (iouThreshold !== null) {
                formData.append('iou_threshold', iouThreshold.toString());
            }

            const response = await fetch(`${this.apiBase}/detect/frame`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Frame detection failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Frame detection failed:', error);
            throw error;
        }
    }

    /**
     * Convert canvas to blob
     * @param {HTMLCanvasElement} canvas
     * @param {string} type - Image type (image/jpeg, image/png)
     * @param {number} quality - Image quality (0.0-1.0)
     */
    canvasToBlob(canvas, type = 'image/jpeg', quality = 0.8) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert canvas to blob'));
                    }
                },
                type,
                quality
            );
        });
    }

    /**
     * Convert canvas to base64
     * @param {HTMLCanvasElement} canvas
     * @param {string} type - Image type (image/jpeg, image/png)
     * @param {number} quality - Image quality (0.0-1.0)
     */
    canvasToBase64(canvas, type = 'image/jpeg', quality = 0.8) {
        return canvas.toDataURL(type, quality);
    }
}

// Create global API instance
const yoloApi = new YOLOApi();
