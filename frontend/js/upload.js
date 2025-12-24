/**
 * File Upload Handler
 * Manages drag-and-drop and file input for image uploads
 */

class UploadHandler {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.chooseFileBtn = document.getElementById('chooseFileBtn');
        this.uploadNewBtn = document.getElementById('uploadNewBtn');
        this.canvas = document.getElementById('uploadCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.imagePreview = document.getElementById('imagePreview');
        this.currentFile = null;
        this.currentImage = null;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for drag-drop and file input
     */
    setupEventListeners() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, () => {
                this.dropZone.classList.remove('drag-over');
            }, false);
        });

        // Handle dropped files
        this.dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        }, false);

        // Handle file input
        this.fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // Choose file button
        this.chooseFileBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.fileInput.click();
        });

        // Upload new button
        this.uploadNewBtn.addEventListener('click', () => {
            this.reset();
        });

        // Click drop zone to open file dialog (but not on the button)
        this.dropZone.addEventListener('click', (e) => {
            // Only trigger if clicking the drop zone itself, not the button
            if (e.target === this.dropZone || e.target.classList.contains('drop-zone-content')) {
                this.fileInput.click();
            }
        });
    }

    /**
     * Prevent default drag behaviors
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Validate file type
     */
    validateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp'];

        if (!validTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please upload a JPG, PNG, BMP, or WebP image.');
        }

        // Check file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error('File is too large. Maximum size is 10MB.');
        }

        return true;
    }

    /**
     * Handle file selection
     */
    async handleFile(file) {
        try {
            // Validate file
            this.validateFile(file);

            // Store file
            this.currentFile = file;

            // Load and display image
            await this.loadImage(file);

            // Hide drop zone, show preview
            this.dropZone.style.display = 'none';
            this.imagePreview.classList.add('active');

            // Trigger file loaded event
            if (this.onFileLoaded) {
                this.onFileLoaded(file);
            }
        } catch (error) {
            console.error('File handling error:', error);
            throw error;
        }
    }

    /**
     * Load image and draw on canvas
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    // Store image
                    this.currentImage = img;

                    // Set canvas size to match image
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;

                    // Draw image on canvas
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.drawImage(img, 0, 0);

                    resolve(img);
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Draw detections on canvas
     */
    drawDetections(detections) {
        if (!this.currentImage) {
            return;
        }

        // Redraw original image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.currentImage, 0, 0);

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
     * Display annotated image from API response
     */
    displayAnnotatedImage(base64Image) {
        const img = new Image();
        img.onload = () => {
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = base64Image;
    }

    /**
     * Reset upload state
     */
    reset() {
        this.currentFile = null;
        this.currentImage = null;
        this.fileInput.value = '';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.imagePreview.classList.remove('active');
        this.dropZone.style.display = 'block';
    }

    /**
     * Get current file
     */
    getFile() {
        return this.currentFile;
    }

    /**
     * Get current image
     */
    getImage() {
        return this.currentImage;
    }

    /**
     * Check if file is loaded
     */
    hasFile() {
        return this.currentFile !== null;
    }
}

// Create global upload handler instance
const uploadHandler = new UploadHandler();
