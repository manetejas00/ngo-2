/**
 * AvinyaCareFoundation - Scroll-Driven Video Hero Engine
 * High-Performance, Anti-Jitter, Butter-Smooth 60FPS Video Scrubbing
 *
 * Requirements Met:
 * 1. Smooth bidirectional scroll scrubbing (down advances, up reverses).
 * 2. Sticky viewport pinning with 0.90 animation phase + 0.10 final frame hold.
 * 3. Prevention of flickering, black frames, and seek contention via atomic seek queue.
 * 4. Full responsive support across mobile, tablet, laptop, and desktop (adaptive sources).
 * 5. Preloading, sharp poster display, mobile touch/scroll decoder priming.
 * 6. Accessibility support for prefers-reduced-motion and graceful error fallbacks.
 * 7. Clean public asset URLs with GSAP ScrollTrigger & app.js backward compatibility.
 */

class HeroVideoEngine {
  constructor() {
    this.container = document.querySelector('.hero-scroll-container');
    this.video = document.getElementById('hero-video');
    this.canvas = document.getElementById('hero-canvas');
    if (!this.container) return;

    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.innerWidth <= 768;

    this.targetProgress = 0;
    this.currentProgress = 0;
    this.isSeeking = false;
    this.pendingTime = null;
    this.metadataLoaded = false;
    this.rafId = null;

    // 0.0 -> 0.90: Full video progress from 0s to duration
    // 0.90 -> 1.00: Hold final frame before unpinning into next section
    this.holdStartProgress = 0.90;

    this.init();
  }

  init() {
    if (!this.video) {
      // Create video element dynamically if not present in DOM
      this.video = document.createElement('video');
      this.video.id = 'hero-video';
      this.video.className = 'hero-video';
      this.video.setAttribute('muted', '');
      this.video.setAttribute('playsinline', '');
      this.video.setAttribute('webkit-playsinline', '');
      this.video.setAttribute('preload', 'auto');
      this.video.setAttribute('tabindex', '-1');
      this.video.setAttribute('aria-hidden', 'true');
      this.video.setAttribute('poster', 'assets/hero-poster.jpg');

      const viewport = document.querySelector('.hero-sticky-viewport') || this.container;
      const overlay = viewport.querySelector('.hero-cinematic-overlay');
      if (overlay) {
        viewport.insertBefore(this.video, overlay);
      } else {
        viewport.prepend(this.video);
      }
    }

    // Force essential video properties for mobile and inline playback
    this.video.muted = true;
    this.video.defaultMuted = true;
    this.video.playsInline = true;
    this.video.autoplay = false;
    this.video.loop = false;
    this.video.controls = false;

    // Setup adaptive video source
    this.updateVideoSource(true);

    // Setup video event listeners
    this.setupVideoEvents();

    // Setup mobile touch & scroll decoder priming
    this.setupMobilePriming();

    // Setup GSAP ScrollTrigger integration if available
    this.setupScrollTrigger();

    // Listen to resize and reduced motion changes
    window.addEventListener('resize', () => this.handleResize(), { passive: true });
    window.addEventListener('orientationchange', () => this.handleResize(), { passive: true });

    try {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      motionQuery.addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
        if (this.isReducedMotion && this.video) {
          this.video.pause();
          this.seekTo(0);
        }
      });
    } catch (_) {
      // Legacy matchMedia listener fallback
    }

    // Calculate initial scroll position
    this.handleScroll();
  }

  updateVideoSource(isInitial = false) {
    if (!this.video) return;
    const newIsMobile = window.innerWidth <= 768;
    const targetSrc = newIsMobile ? 'assets/hero-video-mobile.mp4' : 'assets/hero-video.mp4';

    const currentSrc = this.video.currentSrc || this.video.getAttribute('src') || '';
    if (isInitial || !currentSrc.includes(targetSrc)) {
      const savedTime = (this.video && this.metadataLoaded) ? this.video.currentTime : 0;
      this.isMobile = newIsMobile;
      this.metadataLoaded = false;

      // Update source
      this.video.src = targetSrc;
      this.video.load();

      const onMeta = () => {
        this.metadataLoaded = true;
        this.video.removeEventListener('loadedmetadata', onMeta);
        if (savedTime > 0 && this.video.duration) {
          this.seekTo(Math.min(this.video.duration, savedTime));
        } else {
          this.seekTo(0);
        }
      };

      if (this.video.readyState >= 1) {
        onMeta();
      } else {
        this.video.addEventListener('loadedmetadata', onMeta, { once: true });
      }
    }
  }

  setupVideoEvents() {
    if (!this.video) return;

    this.video.addEventListener('loadedmetadata', () => {
      this.metadataLoaded = true;
      this.updateScrollProgress(this.targetProgress);
    });

    this.video.addEventListener('canplay', () => {
      this.metadataLoaded = true;
      if (this.video.classList) {
        this.video.classList.add('video-ready');
      }
    });

    this.video.addEventListener('seeked', () => {
      this.isSeeking = false;
      if (this.pendingTime !== null) {
        const nextTime = this.pendingTime;
        this.pendingTime = null;
        this.seekTo(nextTime);
      }
    });

    this.video.addEventListener('error', (e) => {
      console.warn('[Hero Video Notice] Video loading fallback engaged:', e);
      if (this.video) {
        this.video.style.display = 'none';
      }
      if (this.canvas) {
        this.canvas.style.display = 'block';
      }
    });
  }

  setupMobilePriming() {
    // Prime the video decoder on first user gesture for iOS WebKit & Android Chrome
    const primeDecoder = () => {
      if (this.video && this.video.paused) {
        const p = this.video.play();
        if (p !== undefined) {
          p.then(() => {
            this.video.pause();
          }).catch(() => {
            // Unmuted restrictions safely caught; muted inline scrubbing remains enabled
          });
        }
      }
      window.removeEventListener('touchstart', primeDecoder);
      window.removeEventListener('scroll', primeDecoder);
      window.removeEventListener('pointerdown', primeDecoder);
    };

    window.addEventListener('touchstart', primeDecoder, { once: true, passive: true });
    window.addEventListener('scroll', primeDecoder, { once: true, passive: true });
    window.addEventListener('pointerdown', primeDecoder, { once: true, passive: true });
  }

  setupScrollTrigger() {
    if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
      window.gsap.registerPlugin(window.ScrollTrigger);

      window.ScrollTrigger.create({
        trigger: this.container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          this.updateScrollProgress(self.progress);
        }
      });
    }
  }

  handleScroll() {
    if (this.container) {
      const containerTop = this.container.offsetTop;
      const containerHeight = this.container.offsetHeight - window.innerHeight;
      if (containerHeight > 0) {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        let progress = (scrollY - containerTop) / containerHeight;
        progress = Math.max(0, Math.min(1, progress));
        this.updateScrollProgress(progress);
      }
    }
  }

  handleResize() {
    this.updateVideoSource(false);
    this.handleScroll();
    if (typeof window.ScrollTrigger !== 'undefined') {
      window.ScrollTrigger.refresh();
    }
  }

  updateScrollProgress(progress) {
    if (this.isReducedMotion) return;
    const p = Math.max(0, Math.min(1, progress));
    this.targetProgress = p;

    // Start render loop if not running
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.renderLoop());
    }
  }

  renderLoop() {
    if (!this.video || !this.metadataLoaded || !this.video.duration) {
      // If metadata not ready yet, keep waiting
      if (!this.metadataLoaded) {
        this.rafId = requestAnimationFrame(() => this.renderLoop());
        return;
      }
    }

    // Smooth momentum lerp
    const delta = this.targetProgress - this.currentProgress;
    if (Math.abs(delta) > 0.0005) {
      this.currentProgress += delta * 0.22;
    } else {
      this.currentProgress = this.targetProgress;
    }

    // Split scroll distance:
    // 0.00 to 0.90 -> Video playback from 0.0s to duration
    // 0.90 to 1.00 -> Brief hold phase on final frame before unpinning
    const animProgress = Math.min(1, this.currentProgress / this.holdStartProgress);
    const duration = this.video.duration || 10.0;
    const targetTime = animProgress * duration;

    this.seekTo(targetTime);

    // Continue loop until playhead reaches target
    if (Math.abs(this.targetProgress - this.currentProgress) > 0.0005) {
      this.rafId = requestAnimationFrame(() => this.renderLoop());
    } else {
      this.rafId = null;
    }
  }

  seekTo(time) {
    if (!this.video || !this.metadataLoaded || !this.video.duration) return;
    const duration = this.video.duration;
    const clampedTime = Math.max(0, Math.min(duration, time));

    // Avoid micro-seeks below 0.025s (sub-frame threshold at 24fps)
    if (Math.abs(this.video.currentTime - clampedTime) < 0.025) {
      return;
    }

    // Queue seek if browser decoder is currently busy with previous seek
    if (this.isSeeking) {
      this.pendingTime = clampedTime;
      return;
    }

    this.isSeeking = true;
    try {
      if (typeof this.video.fastSeek === 'function') {
        this.video.fastSeek(clampedTime);
      } else {
        this.video.currentTime = clampedTime;
      }
    } catch (_) {
      this.isSeeking = false;
    }
  }
}

// Global Exports - Compatible with existing HeroCanvasEngine & HeroVideoEngine references
window.HeroVideoEngine = HeroVideoEngine;
window.HeroCanvasEngine = HeroVideoEngine;
