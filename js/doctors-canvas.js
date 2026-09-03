/**
 * Avinya Care Foundation - Doctors & Diagnostic Page Microscopic Canvas Engine
 * High-Performance, Anti-Jitter 60FPS Frame-by-Frame Scroll Renderer
 */

class DoctorsCanvasEngine {
  constructor() {
    this.canvas = document.getElementById('doctors-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.frameCount = 192;
    this.images = new Array(this.frameCount);
    this.imagesLoadedCount = 0;
    this.currentFrameIndex = 0;
    this.targetFrameIndex = 0;
    this.lastDrawnFrameIndex = -1;
    this.needsRedraw = true;
    this.scrollProgress = 0;

    // Cap DPR at 1.5 for maximum 60fps responsiveness
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.init();
  }

  init() {
    this.resize();

    const handleScroll = () => {
      const heroWrapper = document.querySelector('.hc-hero-scroll-wrapper');
      if (heroWrapper) {
        const rect = heroWrapper.getBoundingClientRect();
        const totalDist = heroWrapper.offsetHeight - window.innerHeight;
        if (totalDist > 0) {
          const scrolled = -rect.top;
          const progress = Math.max(0, Math.min(1, scrolled / totalDist));
          this.updateScrollProgress(progress);
        }
      }
    };

    window.addEventListener('resize', () => {
      this.resize();
      handleScroll();
      this.needsRedraw = true;
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Force immediate initial scroll position sync
    handleScroll();

    // 2-Phase Prioritized Preloader
    this.preloadFrames();

    // Initial render trigger
    this.needsRedraw = true;
    this.render();
  }

  preloadFrames() {
    const frameFolder = 'doctors-sequence';

    // Phase 1: Keyframes (Every 5th frame for instant readiness)
    for (let i = 1; i <= this.frameCount; i += 5) {
      this.loadSingleFrame(frameFolder, i);
    }

    // Phase 2: Fill remaining frames sequentially
    for (let i = 1; i <= this.frameCount; i++) {
      if (i % 5 !== 1) {
        this.loadSingleFrame(frameFolder, i);
      }
    }
  }

  loadSingleFrame(folder, index) {
    if (this.images[index - 1]) return;

    const img = new Image();
    this.images[index - 1] = img;

    const paddedNum = String(index).padStart(3, '0');
    img.src = `${folder}/ezgif-frame-${paddedNum}.jpg`;

    img.onload = () => {
      this.imagesLoadedCount++;
      this.needsRedraw = true;
    };

    img.onerror = () => {
      this.images[index - 1] = null;
    };
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const displayWidth = this.canvas.parentElement ? this.canvas.parentElement.clientWidth : window.innerWidth;
    const displayHeight = this.canvas.parentElement ? this.canvas.parentElement.clientHeight : window.innerHeight;

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

    // Smooth frame lerp interpolation (0.3 lerp speed matching hero canvas)
    const delta = this.targetFrameIndex - this.currentFrameIndex;
    
    if (Math.abs(delta) > 0.02) {
      this.currentFrameIndex += delta * 0.3;
      this.needsRedraw = true;
    } else if (this.currentFrameIndex !== this.targetFrameIndex) {
      this.currentFrameIndex = this.targetFrameIndex;
      this.needsRedraw = true;
    }

    const frameToDrawIndex = Math.round(this.currentFrameIndex);

    if (this.needsRedraw || frameToDrawIndex !== this.lastDrawnFrameIndex) {
      let currentImg = this.images[frameToDrawIndex];

      // Fallback nearest frame lookup if targeted frame is still loading
      if (!currentImg || !currentImg.complete) {
        for (let offset = 1; offset < 40; offset++) {
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

        // Soft dark cinematic tint & radial vignette for text contrast
        const vignetteGrad = this.ctx.createRadialGradient(
          width / 2, height / 2, width * 0.35,
          width / 2, height / 2, width * 0.85
        );
        vignetteGrad.addColorStop(0, 'rgba(10, 15, 29, 0.15)');
        vignetteGrad.addColorStop(1, 'rgba(10, 15, 29, 0.65)');

        this.ctx.fillStyle = vignetteGrad;
        this.ctx.fillRect(0, 0, width, height);

        // Soft bottom infusion gradient to seamlessly blend canvas with next section
        const bottomGrad = this.ctx.createLinearGradient(0, height * 0.6, 0, height);
        bottomGrad.addColorStop(0, 'rgba(10, 15, 29, 0)');
        bottomGrad.addColorStop(0.6, 'rgba(10, 15, 29, 0.5)');
        bottomGrad.addColorStop(1, 'rgba(10, 15, 29, 0.92)');

        this.ctx.fillStyle = bottomGrad;
        this.ctx.fillRect(0, height * 0.6, width, height * 0.4);

        this.lastDrawnFrameIndex = frameToDrawIndex;
        this.needsRedraw = false;
      }
    }

    requestAnimationFrame(() => this.render());
  }
}

// Global Export & Auto-Initialization
window.DoctorsCanvasEngine = DoctorsCanvasEngine;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('doctors-canvas')) {
    window.doctorsEngine = new DoctorsCanvasEngine();
  }
});
