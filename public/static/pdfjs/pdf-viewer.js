// PDF.js Viewer with All Features
// Version: 3.11.174

class PDFViewer {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            workerSrc: '/static/pdfjs/pdf.worker.min.js',
            cMapUrl: '/static/pdfjs/cmaps/',
            cMapPacked: true,
            disableRange: false,
            disableStream: false,
            disableAutoFetch: false,
            renderAllPages: true, // New option to render all pages
            highResolution: true, // Enable high-resolution rendering
            defaultScale: 1.2, // Balanced default scale for all devices
            forceCustomViewer: false, // Force custom viewer even on desktop
            ...options
        };

        this.pdfDoc = null;
        this.pageNum = 1;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.baseScale = this.options.defaultScale;
        this.devicePixelRatio = this.calculateOptimalPixelRatio();
        this.scale = this.baseScale * this.devicePixelRatio;
        this.canvases = []; // Array to hold all page canvases
        this.pdfContainer = null;
        this.controlsContainer = null;
        this.pagesContainer = null; // Container for all pages

        this.init();
    }

    calculateOptimalPixelRatio() {
        if (!this.options.highResolution) return 1;

        const devicePR = window.devicePixelRatio || 1;
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

        // Reduced quality for mobile devices to improve performance
        if (isMobile) {
            // Significantly reduce quality on mobile for better performance
            return Math.min(devicePR, 1.0); // Limit to 1x on mobile
        } else if (isTablet) {
            // Allow up to 1.5x on tablets
            return Math.min(devicePR, 1.5);
        } else {
            // Desktop: allow up to 2x
            return Math.min(devicePR, 2);
        }
    }

    init() {
        // Check if we should use native browser PDF viewer for desktop
        if (this.shouldUseNativeViewer()) {
            this.useNativeViewer();
            return;
        }

        // Configure PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = this.options.workerSrc;

        // Create container structure
        this.createContainer();

        // Create controls
        this.createControls();

        // Create canvas for PDF rendering
        this.createCanvas();

        // Setup event listeners
        this.setupEventListeners();
    }

    createContainer() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID '${this.containerId}' not found`);
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Create main PDF container
        this.pdfContainer = document.createElement('div');
        this.pdfContainer.className = 'pdf-viewer-container';

        // Add mobile notification if on mobile device
        const isMobile = this.isMobileDevice();
        const mobileNotification = isMobile ? `
            <div class="mobile-pdf-notification-blinking" id="${this.containerId}-mobile-notice" style="
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                border-radius: 12px;
                padding: 12px 16px;
                margin: 8px 16px;
                box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
                animation: blink 1.5s ease-in-out infinite;
                position: relative;
                border: 2px solid rgba(255, 255, 255, 0.3);
            ">
                <div class="mobile-notice-content" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                ">
                    <div class="notice-text" style="
                        flex: 1;
                        color: white;
                        font-size: 14px;
                        line-height: 1.4;
                    ">
                        <strong style="color: #ffffff; font-size: 15px;">📱 Better Experience:</strong>
                        <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.9);">
                            Use <strong style="color: #ffffff;">Open</strong> button for clearer PDF viewing
                        </p>
                    </div>
                    <div class="notice-arrow" style="
                        font-size: 20px;
                        color: #ffffff;
                        animation: bounce 1.5s ease-in-out infinite;
                        margin-right: 8px;
                    ">👆</div>
                    <button class="dismiss-notice" onclick="this.parentElement.parentElement.style.display='none'" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        color: white;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        transition: background-color 0.2s;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <style>
                    @keyframes blink {
                        0%, 50% { opacity: 1; transform: scale(1); }
                        25%, 75% { opacity: 0.7; transform: scale(1.02); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-4px); }
                        60% { transform: translateY(-2px); }
                    }
                </style>
            </div>
        ` : '';

        this.pdfContainer.innerHTML = `
            <div class="pdf-viewer-wrapper">
                <div class="pdf-controls" id="${this.containerId}-controls"></div>
                <div class="pdf-pages-container" id="${this.containerId}-pages">
                    <div class="pdf-loading" id="${this.containerId}-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading PDF...</p>
                    </div>
                </div>
                <div class="pdf-error" id="${this.containerId}-error" style="display: none;">
                    <p>Error loading PDF. Please try again.</p>
                </div>
            </div>
        `;

        container.appendChild(this.pdfContainer);
        this.pagesContainer = document.getElementById(`${this.containerId}-pages`);

        // Add mobile notification above the PDF viewer on mobile devices
        if (isMobile && mobileNotification) {
            const notificationDiv = document.createElement('div');
            notificationDiv.innerHTML = mobileNotification;
            container.insertBefore(notificationDiv.firstElementChild, this.pdfContainer);
        }
    }

    createControls() {
        const controlsContainer = document.getElementById(`${this.containerId}-controls`);
        const isMobile = this.isMobileDevice();

        // Add mobile-specific "Open" button for better PDF viewing
        const mobileOpenButton = isMobile ? `
            <button id="${this.containerId}-open" class="pdf-btn mobile-open-btn" title="Open in Native Viewer">
                <i class="fas fa-external-link-alt"></i>
                <span class="btn-text">Open</span>
            </button>
        ` : '';

        controlsContainer.innerHTML = `
            <div class="pdf-toolbar">
                <div class="pdf-nav-controls">
                    <button id="${this.containerId}-prev" class="pdf-btn" title="Previous Page">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="pdf-page-info">
                        Page <span id="${this.containerId}-page-num">1</span> of <span id="${this.containerId}-page-count">0</span>
                    </span>
                    <button id="${this.containerId}-next" class="pdf-btn" title="Next Page">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>

                <div class="pdf-zoom-controls">
                    <button id="${this.containerId}-zoom-out" class="pdf-btn" title="Zoom Out">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <select id="${this.containerId}-zoom-select" class="pdf-zoom-select">
                        <option value="0.5">50%</option>
                        <option value="0.75">75%</option>
                        <option value="1">100%</option>
                        <option value="1.25">125%</option>
                        <option value="1.5">150%</option>
                        <option value="2">200%</option>
                        <option value="2.5">250%</option>
                        <option value="3">300%</option>
                        <option value="auto">Auto Fit</option>
                        <option value="page-fit">Page Fit</option>
                        <option value="page-width">Page Width</option>
                    </select>
                    <button id="${this.containerId}-zoom-in" class="pdf-btn" title="Zoom In">
                        <i class="fas fa-search-plus"></i>
                    </button>
                </div>

                <div class="pdf-action-controls">
                    ${mobileOpenButton}
                    <button id="${this.containerId}-download" class="pdf-btn" title="Download PDF">
                        <i class="fas fa-download"></i>
                    </button>
                    <button id="${this.containerId}-print" class="pdf-btn" title="Print PDF">
                        <i class="fas fa-print"></i>
                    </button>
                    <button id="${this.containerId}-fullscreen" class="pdf-btn" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
        `;
    }

    createCanvas() {
        // For single page mode (legacy support)
        if (!this.options.renderAllPages) {
            this.canvas = document.getElementById(`${this.containerId}-canvas`);
            this.ctx = this.canvas.getContext('2d');
        }
    }

    createPageCanvas(pageNum) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'pdf-page';
        pageDiv.setAttribute('data-page', pageNum);

        const canvas = document.createElement('canvas');
        canvas.id = `${this.containerId}-canvas-${pageNum}`;
        canvas.className = 'pdf-page-canvas';

        pageDiv.appendChild(canvas);
        this.pagesContainer.appendChild(pageDiv);

        return {
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            container: pageDiv
        };
    }

    setupEventListeners() {
        // Navigation controls
        const prevBtn = document.getElementById(`${this.containerId}-prev`);
        const nextBtn = document.getElementById(`${this.containerId}-next`);
        const zoomInBtn = document.getElementById(`${this.containerId}-zoom-in`);
        const zoomOutBtn = document.getElementById(`${this.containerId}-zoom-out`);
        const zoomSelect = document.getElementById(`${this.containerId}-zoom-select`);
        const downloadBtn = document.getElementById(`${this.containerId}-download`);
        const printBtn = document.getElementById(`${this.containerId}-print`);
        const fullscreenBtn = document.getElementById(`${this.containerId}-fullscreen`);

        if (prevBtn) prevBtn.addEventListener('click', () => this.onPrevPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.onNextPage());
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.onZoomIn());
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.onZoomOut());
        if (zoomSelect) zoomSelect.addEventListener('change', (e) => this.onZoomSelect(e.target.value));
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.onDownload());
        if (printBtn) printBtn.addEventListener('click', () => this.onPrint());
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.onFullscreen());

        // Mobile Open button (only if it exists)
        const openBtn = document.getElementById(`${this.containerId}-open`);
        if (openBtn) {
            openBtn.addEventListener('click', () => this.onOpenInNativeViewer());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Touch events for mobile
        this.setupTouchEvents();
    }

    setupTouchEvents() {
        if (!this.pdfContainer) return;

        // Different touch handling for all-pages vs single-page mode
        if (this.options.renderAllPages) {
            this.setupAllPagesTouchEvents();
        } else {
            this.setupSinglePageTouchEvents();
        }
    }

    setupSinglePageTouchEvents() {
        if (!this.canvas) return;

        let startX = 0;
        let startY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;

            // Horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.onNextPage(); // Swipe left - next page
                } else {
                    this.onPrevPage(); // Swipe right - previous page
                }
            }

            startX = 0;
            startY = 0;
        });
    }

    setupAllPagesTouchEvents() {
        if (!this.pagesContainer) return;

        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let isScrolling = false;
        let lastTapTime = 0;

        // Touch start
        this.pagesContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
            isScrolling = false;
        }, { passive: false });

        // Touch move - detect scrolling
        this.pagesContainer.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = Math.abs(startX - currentX);
            const diffY = Math.abs(startY - currentY);

            // If moved more than 10px, consider it scrolling
            if (diffX > 10 || diffY > 10) {
                isScrolling = true;
            }
        }, { passive: false });

        // Touch end
        this.pagesContainer.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            const diffX = startX - endX;
            const diffY = startY - endY;
            const touchDuration = endTime - startTime;

            // Double tap detection
            const currentTime = Date.now();
            const timeSinceLastTap = currentTime - lastTapTime;

            if (!isScrolling && touchDuration < 300 && timeSinceLastTap < 300) {
                // Double tap - zoom toggle
                e.preventDefault();
                this.handleDoubleTap(endX, endY);
                this.addGestureFeedback(this.pagesContainer, 'double-tap');
                lastTapTime = 0; // Reset
            } else if (!isScrolling && touchDuration < 300) {
                // Single tap - might be used for page selection
                lastTapTime = currentTime;
            } else if (isScrolling && Math.abs(diffX) > 50) {
                // Horizontal swipe - page navigation
                e.preventDefault();
                if (diffX > 0) {
                    this.onNextPage(); // Swipe left - next page
                    this.addGestureFeedback(this.pagesContainer, 'swipe');
                } else {
                    this.onPrevPage(); // Swipe right - previous page
                    this.addGestureFeedback(this.pagesContainer, 'swipe');
                }
            }

            startX = 0;
            startY = 0;
            isScrolling = false;
        }, { passive: false });

        // Pinch to zoom support
        this.setupPinchToZoom();
    }

    setupPinchToZoom() {
        if (!this.pagesContainer) return;

        let initialDistance = 0;
        let initialScale = 1;
        let lastScale = 1;
        let isZooming = false;

        this.pagesContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
                initialScale = this.baseScale;
                lastScale = this.baseScale;
                isZooming = true;
            }
        }, { passive: false });

        this.pagesContainer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && isZooming) {
                e.preventDefault();
                const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
                const scaleChange = currentDistance / initialDistance;

                // Apply zoom with limits
                const newScale = Math.max(0.5, Math.min(3.0, initialScale * scaleChange));

                // Only update if scale changed significantly (prevents excessive re-rendering)
                if (Math.abs(newScale - lastScale) > 0.05) {
                    this.setZoomSmooth(newScale);
                    lastScale = newScale;
                }
            }
        }, { passive: false });

        this.pagesContainer.addEventListener('touchend', (e) => {
            if (isZooming && e.touches.length < 2) {
                isZooming = false;
            }
        }, { passive: false });
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleDoubleTap(x, y) {
        // Toggle between fit-to-width and 100% zoom
        if (Math.abs(this.baseScale - 1.0) < 0.1) {
            this.fitToWidth();
        } else {
            this.setZoomSmooth(1.0);
        }
    }

    showGestureHint() {
        // Show gesture hint on mobile devices
        if (window.innerWidth > 768) return;

        const container = this.pagesContainer;
        if (container) {
            container.classList.add('show-hint');
            setTimeout(() => {
                container.classList.remove('show-hint');
            }, 3000); // Hide after 3 seconds
        }
    }

    // Enhanced gesture feedback
    addGestureFeedback(element, gestureType) {
        if (!element) return;

        element.classList.add('gesture-active');

        // Remove the class after animation
        setTimeout(() => {
            element.classList.remove('gesture-active');
        }, 300);
    }

    async loadPDF(url) {
        try {
            this.showLoading();

            const loadingTask = pdfjsLib.getDocument({
                url: url,
                cMapUrl: this.options.cMapUrl,
                cMapPacked: this.options.cMapPacked,
                disableRange: this.options.disableRange,
                disableStream: this.options.disableStream,
                disableAutoFetch: this.options.disableAutoFetch
            });

            this.pdfDoc = await loadingTask.promise;

            // Adjust quality based on device performance
            this.adjustQualityForPerformance();

            this.hideLoading();
            this.updatePageInfo();

            if (this.options.renderAllPages) {
                await this.renderAllPages();
            } else {
                this.renderPage(this.pageNum);
            }

            // Optimize memory usage on mobile
            setTimeout(() => {
                this.optimizeMemoryUsage();
            }, 1000);

        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError();
        }
    }

    async renderAllPages() {
        if (!this.pdfDoc) return;

        // Clear existing pages
        this.pagesContainer.innerHTML = '';

        // Create canvases for all pages
        this.canvases = [];

        for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
            const pageCanvas = this.createPageCanvas(pageNum);
            this.canvases.push(pageCanvas);

            try {
                await this.renderPageToCanvas(pageNum, pageCanvas);
            } catch (error) {
                console.error(`Error rendering page ${pageNum}:`, error);
            }
        }

        // Update page info
        this.updatePageInfo();

        // Show gesture hint on mobile after a short delay
        setTimeout(() => {
            this.showGestureHint();
        }, 1000);
    }

    async renderPageToCanvas(pageNum, pageCanvas) {
        const page = await this.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: this.scale });

        // Optimize canvas for high-quality rendering
        this.optimizeCanvasForQuality(pageCanvas.canvas, viewport);

        const renderContext = {
            canvasContext: pageCanvas.ctx,
            viewport: viewport,
            enableWebGL: false // Use 2D canvas for better quality control
        };

        // Add rendering enhancements for mobile
        if (this.isMobileDevice()) {
            renderContext.intent = 'print'; // Higher quality rendering
        }

        await page.render(renderContext).promise;

        // Apply post-rendering enhancements
        this.applyPostRenderingEnhancements(pageCanvas.ctx, viewport);
    }

    optimizeCanvasForQuality(canvas, viewport) {
        // Set canvas size with high DPI support
        const scaledWidth = Math.ceil(viewport.width);
        const scaledHeight = Math.ceil(viewport.height);

        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        // Set CSS size for proper display
        canvas.style.width = viewport.width / this.devicePixelRatio + 'px';
        canvas.style.height = viewport.height / this.devicePixelRatio + 'px';

        // Optimize canvas context for quality
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Enable high-quality image rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Set better text rendering for mobile
            if (this.isMobileDevice()) {
                ctx.textBaseline = 'alphabetic';
                ctx.textAlign = 'left';
            }
        }
    }

    applyPostRenderingEnhancements(ctx, viewport) {
        if (!this.isMobileDevice()) return;

        // Apply subtle sharpening for mobile devices
        const imageData = ctx.getImageData(0, 0, viewport.width, viewport.height);
        const data = imageData.data;

        // Simple sharpening algorithm for better text clarity
        for (let i = 0; i < data.length; i += 4) {
            // Enhance contrast slightly for better readability
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Apply subtle contrast enhancement
            const factor = 1.05;
            data[i] = Math.min(255, r * factor);
            data[i + 1] = Math.min(255, g * factor);
            data[i + 2] = Math.min(255, b * factor);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    isMobileDevice() {
        return window.innerWidth <= 768 ||
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    shouldUseNativeViewer() {
        // Use native viewer for desktop browsers, custom viewer for mobile
        const isDesktop = window.innerWidth > 768 && !this.isMobileDevice();
        const hasNativePDFSupport = this.checkNativePDFSupport();

        // Use native viewer if:
        // 1. It's a desktop device
        // 2. Browser has native PDF support
        // 3. Not explicitly disabled
        return isDesktop && hasNativePDFSupport && !this.options.forceCustomViewer;
    }

    checkNativePDFSupport() {
        // Check if browser can handle PDFs natively
        const ua = navigator.userAgent;
        const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
        const isFirefox = /Firefox/.test(ua);
        const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor);
        const isEdge = /Edg/.test(ua);

        // Modern browsers have good native PDF support
        return isChrome || isFirefox || isSafari || isEdge;
    }

    useNativeViewer() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        // Create native PDF viewer container
        this.pdfContainer = document.createElement('div');
        this.pdfContainer.className = 'native-pdf-viewer-container';
        this.pdfContainer.innerHTML = `
            <div class="native-pdf-header">
                <div class="native-pdf-info">
                    <i class="fas fa-file-pdf"></i>
                    <span>PDF Document</span>
                </div>
                <div class="native-pdf-actions">
                    <button class="native-pdf-toggle" onclick="window.toggleNativeViewer()">
                        <i class="fas fa-eye"></i>
                        <span>Use Custom Viewer</span>
                    </button>
                </div>
            </div>
            <div class="native-pdf-notice">
                <i class="fas fa-info-circle"></i>
                <p>Using browser's built-in PDF viewer for the best desktop experience.</p>
                <p>For mobile-optimized viewing, try the custom viewer option.</p>
            </div>
        `;

        container.appendChild(this.pdfContainer);
    }

    toggleNativeViewer() {
        // Switch between native and custom viewer
        this.options.forceCustomViewer = !this.options.forceCustomViewer;

        // Re-initialize with new viewer type
        this.init();
    }

    loadPDF(url) {
        if (this.shouldUseNativeViewer()) {
            this.loadNativePDF(url);
        } else {
            // Use custom PDF.js viewer
            this.loadCustomPDF(url);
        }
    }

    loadNativePDF(url) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Create iframe for native PDF viewing
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.className = 'native-pdf-iframe';
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '100%');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');

        // Replace the notice with the actual PDF
        const notice = container.querySelector('.native-pdf-notice');
        if (notice) {
            notice.parentNode.replaceChild(iframe, notice);
        } else {
            // If no notice found, just append the iframe
            container.appendChild(iframe);
        }
    }

    loadCustomPDF(url) {
        // Original PDF.js loading logic
        const loadingTask = pdfjsLib.getDocument({
            url: url,
            cMapUrl: this.options.cMapUrl,
            cMapPacked: this.options.cMapPacked,
            disableRange: this.options.disableRange,
            disableStream: this.options.disableStream,
            disableAutoFetch: this.options.disableAutoFetch
        });

        loadingTask.promise.then((pdfDoc) => {
            this.pdfDoc = pdfDoc;
            this.hideLoading();
            this.updatePageInfo();

            if (this.options.renderAllPages) {
                this.renderAllPages();
            } else {
                this.renderPage(this.pageNum);
            }

            // Adjust quality based on device performance
            this.adjustQualityForPerformance();

            // Optimize memory usage on mobile
            setTimeout(() => {
                this.optimizeMemoryUsage();
            }, 1000);
        }).catch((error) => {
            console.error('Error loading PDF:', error);
            this.showError();
        });
    }

    // Performance-based quality adjustment
    adjustQualityForPerformance() {
        const isLowEndDevice = this.detectLowEndDevice();
        const connectionSlow = this.detectSlowConnection();

        if (isLowEndDevice || connectionSlow) {
            // Reduce quality for better performance
            this.devicePixelRatio = Math.max(1, this.devicePixelRatio * 0.75);
            this.baseScale = Math.max(0.8, this.baseScale * 0.9);
            this.scale = this.baseScale * this.devicePixelRatio;

            console.log('Adjusted rendering quality for performance');
        }
    }

    detectLowEndDevice() {
        // Check for low-end device indicators
        const memory = navigator.deviceMemory;
        const hardwareConcurrency = navigator.hardwareConcurrency;

        return (memory && memory <= 2) ||
               (hardwareConcurrency && hardwareConcurrency <= 2) ||
               /Android [2-6]|iPhone OS [1-9]|iPad.*OS [1-9]/i.test(navigator.userAgent);
    }

    detectSlowConnection() {
        // Check connection quality
        const connection = navigator.connection ||
                          navigator.mozConnection ||
                          navigator.webkitConnection;

        if (connection) {
            return connection.effectiveType === 'slow-2g' ||
                   connection.effectiveType === '2g' ||
                   connection.downlink < 1;
        }

        return false;
    }

    // Memory management for mobile devices
    optimizeMemoryUsage() {
        if (this.isMobileDevice()) {
            // Clear unused canvases from memory
            this.canvases.forEach(pageCanvas => {
                if (pageCanvas && pageCanvas.ctx) {
                    // Force garbage collection hint
                    pageCanvas.ctx.clearRect(0, 0, pageCanvas.canvas.width, pageCanvas.canvas.height);
                }
            });

            // Suggest garbage collection
            if (window.gc) {
                window.gc();
            }
        }
    }

    renderPage(num) {
        this.pageRendering = true;

        this.pdfDoc.getPage(num).then((page) => {
            const viewport = page.getViewport({ scale: this.scale });

            // Apply quality optimizations for single-page mode too
            this.optimizeCanvasForQuality(this.canvas, viewport);

            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport,
                enableWebGL: false
            };

            // Add mobile-specific rendering intent
            if (this.isMobileDevice()) {
                renderContext.intent = 'print';
            }

            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                this.pageRendering = false;

                // Apply post-rendering enhancements for single page
                this.applyPostRenderingEnhancements(this.ctx, viewport);

                if (this.pageNumPending !== null) {
                    this.renderPage(this.pageNumPending);
                    this.pageNumPending = null;
                }
            });
        });

        this.updatePageInfo();
    }

    queueRenderPage(num) {
        if (this.pageRendering) {
            this.pageNumPending = num;
        } else {
            this.renderPage(num);
        }
    }

    onPrevPage() {
        if (this.pageNum <= 1) return;
        this.pageNum--;

        if (this.options.renderAllPages) {
            // In all-pages mode, scroll to the previous page
            const prevPageElement = document.querySelector(`[data-page="${this.pageNum}"]`);
            if (prevPageElement) {
                prevPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            this.queueRenderPage(this.pageNum);
        }
    }

    onNextPage() {
        if (this.pageNum >= this.pdfDoc.numPages) return;
        this.pageNum++;

        if (this.options.renderAllPages) {
            // In all-pages mode, scroll to the next page
            const nextPageElement = document.querySelector(`[data-page="${this.pageNum}"]`);
            if (nextPageElement) {
                nextPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            this.queueRenderPage(this.pageNum);
        }
    }

    onZoomIn() {
        this.baseScale *= 1.25;
        this.scale = this.baseScale * this.devicePixelRatio;
        if (this.options.renderAllPages) {
            this.renderAllPages();
        } else {
            this.queueRenderPage(this.pageNum);
        }
        this.updateZoomSelect();
    }

    onZoomOut() {
        this.baseScale *= 0.8;
        this.scale = this.baseScale * this.devicePixelRatio;
        if (this.options.renderAllPages) {
            this.renderAllPages();
        } else {
            this.queueRenderPage(this.pageNum);
        }
        this.updateZoomSelect();
    }

    onZoomSelect(value) {
        switch (value) {
            case 'auto':
                this.baseScale = 1.0;
                this.scale = this.baseScale * this.devicePixelRatio;
                break;
            case 'page-fit':
                this.fitToPage();
                return; // fitToPage will handle rendering
            case 'page-width':
                this.fitToWidth();
                return; // fitToWidth will handle rendering
            default:
                this.baseScale = parseFloat(value);
                this.scale = this.baseScale * this.devicePixelRatio;
        }

        if (this.options.renderAllPages) {
            this.renderAllPages();
        } else {
            this.queueRenderPage(this.pageNum);
        }
    }

    fitToPage() {
        if (!this.pdfDoc) return;

        this.pdfDoc.getPage(1).then((page) => {
            const viewport = page.getViewport({ scale: 1 });
            const containerRect = this.pagesContainer.getBoundingClientRect();

            const scaleX = containerRect.width / viewport.width;
            const scaleY = containerRect.height / viewport.height;
            const newScale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some margin

            if (this.options.renderAllPages) {
                this.setZoomSmooth(newScale);
            } else {
                this.baseScale = newScale;
                this.scale = this.baseScale * this.devicePixelRatio;
                this.queueRenderPage(this.pageNum);
                this.updateZoomSelect();
            }
        });
    }

    fitToWidth() {
        if (!this.pdfDoc) return;

        this.pdfDoc.getPage(1).then((page) => {
            const viewport = page.getViewport({ scale: 1 });
            const containerRect = this.pagesContainer.getBoundingClientRect();

            const newScale = (containerRect.width / viewport.width) * 0.95; // 95% to add some margin

            if (this.options.renderAllPages) {
                this.setZoomSmooth(newScale);
            } else {
                this.baseScale = newScale;
                this.scale = this.baseScale * this.devicePixelRatio;
                this.queueRenderPage(this.pageNum);
                this.updateZoomSelect();
            }
        });
    }

    onDownload() {
        if (!this.pdfDoc) return;

        const link = document.createElement('a');
        link.href = this.pdfDoc._transport._url;
        link.download = 'document.pdf';
        link.click();
    }

    onPrint() {
        if (!this.pdfDoc) return;

        this.pdfDoc.getPage(this.pageNum).then((page) => {
            const printCanvas = document.createElement('canvas');
            const printCtx = printCanvas.getContext('2d');

            const viewport = page.getViewport({ scale: 2 }); // Higher scale for print quality
            printCanvas.width = viewport.width;
            printCanvas.height = viewport.height;

            page.render({
                canvasContext: printCtx,
                viewport: viewport
            }).promise.then(() => {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html>
                        <head><title>Print PDF</title></head>
                        <body style="margin: 0; padding: 20px;">
                            <img src="${printCanvas.toDataURL()}" style="max-width: 100%; height: auto;" />
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.print();
            });
        });
    }

    onFullscreen() {
        const container = this.pdfContainer;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen().catch(console.error);
        }
    }

    onOpenInNativeViewer() {
        if (!this.pdfDoc) return;

        try {
            // Get the PDF URL from the document
            const pdfUrl = this.pdfDoc._transport._url;

            // Create a temporary link to open the PDF in native viewer
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            // Set download attribute to suggest opening in native viewer
            link.download = 'document.pdf';

            // Add a small delay to ensure proper handling
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success message
            this.showMobileNotification('Opening PDF in your device\'s native viewer...', 'success');

        } catch (error) {
            console.error('Error opening PDF in native viewer:', error);
            this.showMobileNotification('Unable to open PDF. Please try downloading instead.', 'error');
        }
    }

    showMobileNotification(message, type = 'info') {
        // Remove any existing notification
        const existingNotification = document.querySelector('.mobile-pdf-temp-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `mobile-pdf-temp-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: '90%',
            textAlign: 'center'
        });

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    onKeyDown(e) {
        if (!this.pdfDoc) return;

        switch (e.key) {
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                this.onPrevPage();
                break;
            case 'ArrowRight':
            case 'PageDown':
                e.preventDefault();
                this.onNextPage();
                break;
            case '+':
            case '=':
                e.preventDefault();
                this.onZoomIn();
                break;
            case '-':
                e.preventDefault();
                this.onZoomOut();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                this.onFullscreen();
                break;
            case 'Home':
                e.preventDefault();
                this.goToPage(1);
                break;
            case 'End':
                e.preventDefault();
                this.goToPage(this.pdfDoc.numPages);
                break;
        }
    }

    updatePageInfo() {
        if (!this.pdfDoc) return;

        const pageNumElement = document.getElementById(`${this.containerId}-page-num`);
        const pageCountElement = document.getElementById(`${this.containerId}-page-count`);

        if (pageNumElement) pageNumElement.textContent = this.pageNum;
        if (pageCountElement) pageCountElement.textContent = this.pdfDoc.numPages;
    }

    updateZoomSelect() {
        const select = document.getElementById(`${this.containerId}-zoom-select`);
        if (!select) return;

        // Find closest match using baseScale (without device pixel ratio)
        const currentValue = this.baseScale.toFixed(2);
        let found = false;

        for (let option of select.options) {
            if (Math.abs(parseFloat(option.value) - this.baseScale) < 0.01) {
                select.value = option.value;
                found = true;
                break;
            }
        }

        if (!found) {
            select.value = '1'; // Default to 100%
        }
    }

    showLoading() {
        const loadingElement = document.getElementById(`${this.containerId}-loading`);
        const errorElement = document.getElementById(`${this.containerId}-error`);

        if (loadingElement) loadingElement.style.display = 'flex';
        if (errorElement) errorElement.style.display = 'none';
    }

    hideLoading() {
        const loadingElement = document.getElementById(`${this.containerId}-loading`);
        if (loadingElement) loadingElement.style.display = 'none';
    }

    showError() {
        const loadingElement = document.getElementById(`${this.containerId}-loading`);
        const errorElement = document.getElementById(`${this.containerId}-error`);

        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'flex';
    }

    // Public API methods
    goToPage(pageNum) {
        if (pageNum >= 1 && pageNum <= this.pdfDoc.numPages) {
            this.pageNum = pageNum;
            if (this.options.renderAllPages) {
                // In all-pages mode, scroll to the specific page
                const pageElement = document.querySelector(`[data-page="${pageNum}"]`);
                if (pageElement) {
                    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                this.queueRenderPage(this.pageNum);
            }
        }
    }

    setZoom(scale) {
        this.baseScale = scale;
        this.scale = this.baseScale * this.devicePixelRatio;
        if (this.options.renderAllPages) {
            this.renderAllPages();
        } else {
            this.queueRenderPage(this.pageNum);
        }
        this.updateZoomSelect();
    }

    setZoomSmooth(scale) {
        // Store current scroll position
        const scrollTop = this.pagesContainer.scrollTop;
        const scrollLeft = this.pagesContainer.scrollLeft;

        // Update zoom
        this.baseScale = scale;
        this.scale = this.baseScale * this.devicePixelRatio;

        // Re-render all pages
        this.renderAllPages().then(() => {
            // Restore scroll position after rendering
            setTimeout(() => {
                this.pagesContainer.scrollTop = scrollTop;
                this.pagesContainer.scrollLeft = scrollLeft;
            }, 50); // Small delay to ensure rendering is complete
        });

        this.updateZoomSelect();
    }

    getCurrentPage() {
        return this.pageNum;
    }

    getTotalPages() {
        return this.pdfDoc ? this.pdfDoc.numPages : 0;
    }

    getScale() {
        return this.baseScale;
    }
}

// Auto-initialize PDF viewers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Find all PDF viewer containers
    const pdfContainers = document.querySelectorAll('[data-pdf-viewer]');

    pdfContainers.forEach(container => {
        const pdfUrl = container.getAttribute('data-pdf-url');
        if (pdfUrl) {
            const viewer = new PDFViewer(container.id);
            viewer.loadPDF(pdfUrl);

            // Store viewer instance for later access
            container.pdfViewer = viewer;
        }
    });
});

// Make toggle function globally available for native viewer
window.toggleNativeViewer = function() {
    // This will be called from the native viewer toggle button
    const containers = document.querySelectorAll('[data-pdf-viewer]');
    containers.forEach(container => {
        if (container.pdfViewer) {
            container.pdfViewer.toggleNativeViewer();
        }
    });
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFViewer;
}