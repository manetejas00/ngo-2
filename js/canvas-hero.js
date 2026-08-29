/**
 * Avinya Care Foundation - Real Image-Sequence Canvas Scrollytelling Engine
 * High-Performance, Anti-Jitter, Liquid 60FPS Frame Renderer
 */

class HeroCanvasEngine {
  constructor() {
    this.canvas = document.getElementById('hero-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize context for fast rendering

    this.frameCount = 360;
    this.images = new Array(this.frameCount);
    this.imagesLoadedCount = 0;
    this.currentFrameIndex = 0;
    this.targetFrameIndex = 0;
    this.lastDrawnFrameIndex = -1;
    this.needsRedraw = true;
    this.scrollProgress = 0;

    // Cap DPR at 1.5 to guarantee 60fps performance without memory overload
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      this.needsRedraw = true;
    });

    // Fast prioritized preloader
    this.preloadFrames();

    // Force initial render frame
    this.needsRedraw = true;

    // Start render loop
    this.render();
  }

  preloadFrames() {
    const frameFolder = 'hero-sequence';

    // Phase 1: Rapid Keyframes (Every 5th frame for instant readiness)
    for (let i = 1; i <= this.frameCount; i += 5) {
      this.loadSingleFrame(frameFolder, i);
    }

    // Phase 2: Fill remaining frames
    for (let i = 1; i <= this.frameCount; i++) {
      if (i % 5 !== 1) {
        this.loadSingleFrame(frameFolder, i);
      }
    }
  }

  loadSingleFrame(folder, index) {
    if (this.images[index - 1]) return; // Already loading or loaded

    const img = new Image();
    this.images[index - 1] = img; // Assign immediately so duplicate fetches are prevented!

    const paddedNum = String(index).padStart(3, '0');
    img.src = `${folder}/ezgif-frame-${paddedNum}.jpg`;

    img.onload = () => {
      this.imagesLoadedCount++;
      // Unconditionally request redraw when any frame loads so canvas updates from fallbacks
      this.needsRedraw = true;
    };

    img.onerror = () => {
      this.images[index - 1] = null; // Reset on error so fallback finder works
    };
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    this.canvas.width = Math.floor(displayWidth * this.dpr);
    this.canvas.height = Math.floor(displayHeight * this.dpr);

    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'medium';
    this.needsRedraw = true;
  }

  updateScrollProgress(progress) {
    const newProgress = Math.max(0, Math.min(1, progress));
    this.scrollProgress = newProgress;

    const newTarget = Math.min(
      this.frameCount - 1,
      Math.floor(this.scrollProgress * (this.frameCount - 1))
    );

    if (newTarget !== this.targetFrameIndex || this.needsRedraw) {
      this.targetFrameIndex = newTarget;
      this.needsRedraw = true;
    }
  }

  render() {
    if (!this.canvas || !this.ctx) return;

    // Smooth frame lerp interpolation
    const delta = this.targetFrameIndex - this.currentFrameIndex;
    
    if (Math.abs(delta) > 0.02) {
      this.currentFrameIndex += delta * 0.3; // Smooth lerp speed
      this.needsRedraw = true;
    } else if (this.currentFrameIndex !== this.targetFrameIndex) {
      this.currentFrameIndex = this.targetFrameIndex;
      this.needsRedraw = true;
    }

    const frameToDrawIndex = Math.round(this.currentFrameIndex);

    // Render only when frame index changes or redraw is requested
    if (this.needsRedraw || frameToDrawIndex !== this.lastDrawnFrameIndex) {
      let currentImg = this.images[frameToDrawIndex];

      // Fallback: If target frame isn't loaded yet, find closest available loaded frame
      if (!currentImg || !currentImg.complete) {
        for (let offset = 1; offset < 50; offset++) {
          if (this.images[frameToDrawIndex - offset]?.complete) {
            currentImg = this.images[frameToDrawIndex - offset];
            break;
          }
          if (this.images[frameToDrawIndex + offset]?.complete) {
            currentImg = this.images[frameToDrawIndex + offset];
            break;
          }
        }
      }

      if (currentImg && currentImg.complete && currentImg.naturalWidth !== 0) {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Calculate object-fit: cover scaling
        const imgRatio = currentImg.naturalWidth / currentImg.naturalHeight;
        const canvasRatio = width / height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
          drawWidth = width;
          drawHeight = width / imgRatio;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        } else {
          drawWidth = height * imgRatio;
          drawHeight = height;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
        }

        // Draw image frame
        this.ctx.drawImage(currentImg, offsetX, offsetY, drawWidth, drawHeight);

        // Soft vignette overlay
        const vignetteGrad = this.ctx.createRadialGradient(
          width / 2, height / 2, width * 0.35,
          width / 2, height / 2, width * 0.85
        );
        vignetteGrad.addColorStop(0, 'rgba(11, 13, 12, 0.1)');
        vignetteGrad.addColorStop(1, 'rgba(11, 13, 12, 0.65)');

        this.ctx.fillStyle = vignetteGrad;
        this.ctx.fillRect(0, 0, width, height);

        this.lastDrawnFrameIndex = frameToDrawIndex;
        this.needsRedraw = false;
      }
    }

    requestAnimationFrame(() => this.render());
  }
}

// Global Export
window.HeroCanvasEngine = HeroCanvasEngine;
