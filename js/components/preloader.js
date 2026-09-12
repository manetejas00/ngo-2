/**
 * Avinya Care Foundation — Premium Healthcare Website Preloader Controller
 * Orchestrates resource readiness, progress interpolation, and smooth dismissal.
 */

(function () {
  'use strict';

  class AvinyaPreloader {
    constructor() {
      this.preloaderElem = null;
      this.progressBar = null;
      this.statusElem = null;
      this.currentProgress = 0;
      this.targetProgress = 0;
      this.isDismissed = false;
      this.startTime = Date.now();
      this.minDisplayDuration = 550; // Ensure brand is gracefully perceived without jarring flicker
      this.maxFailsafeTimeout = 2200; // Guaranteed auto-dismiss under any network condition

      this.init();
    }

    init() {
      // Find DOM elements if already present, or wait for DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupDOM());
      } else {
        this.setupDOM();
      }

      // Track window full load
      window.addEventListener('load', () => {
        this.setTargetProgress(100, 'Ready');
      });

      // Absolute safety failsafe timeout
      setTimeout(() => {
        if (!this.isDismissed) {
          this.setTargetProgress(100);
          this.dismiss();
        }
      }, this.maxFailsafeTimeout);

      // Start animation loop for smooth progress interpolation
      this.animateProgress();
    }

    setupDOM() {
      this.preloaderElem = document.getElementById('avinya-preloader');
      if (!this.preloaderElem) return;

      this.progressBar = this.preloaderElem.querySelector('.preloader-progress-fill');
      this.statusElem = this.preloaderElem.querySelector('.preloader-status-text');

      // Initial progress boost
      this.setTargetProgress(45, 'Connecting');

      // Hook up DOMContentLoaded
      this.setTargetProgress(75, 'Preparing');
    }

    setTargetProgress(val, statusText) {
      this.targetProgress = Math.max(this.targetProgress, Math.min(100, val));
      if (statusText && this.statusElem) {
        this.statusElem.textContent = statusText;
      }
    }

    animateProgress() {
      if (this.isDismissed) return;

      // Smooth lerp progress
      if (this.currentProgress < this.targetProgress) {
        this.currentProgress += (this.targetProgress - this.currentProgress) * 0.15;
        if (Math.abs(this.targetProgress - this.currentProgress) < 0.5) {
          this.currentProgress = this.targetProgress;
        }

        if (this.progressBar) {
          this.progressBar.style.width = `${this.currentProgress}%`;
        }
      }

      // Trigger dismissal when 100% reached and min display time satisfied
      if (this.currentProgress >= 99 && !this.isDismissed) {
        const elapsed = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minDisplayDuration - elapsed);

        setTimeout(() => {
          this.dismiss();
        }, remainingTime);
        return;
      }

      requestAnimationFrame(() => this.animateProgress());
    }

    dismiss() {
      if (this.isDismissed) return;
      this.isDismissed = true;

      if (!this.preloaderElem) {
        this.preloaderElem = document.getElementById('avinya-preloader');
      }

      if (!this.preloaderElem) return;

      // Update progress bar to 100%
      if (this.progressBar) {
        this.progressBar.style.width = '100%';
      }

      // Add smooth hidden class
      this.preloaderElem.classList.add('preloader-hidden');

      // Dispatch custom event for hero canvas or other components
      document.dispatchEvent(new CustomEvent('avinya:preloader-dismissed', {
        detail: { elapsed: Date.now() - this.startTime }
      }));

      // Cleanup DOM visibility after transition finishes
      setTimeout(() => {
        if (this.preloaderElem) {
          this.preloaderElem.style.display = 'none';
        }
      }, 700);
    }
  }

  // Instantiate globally
  window.AvinyaPreloaderInstance = new AvinyaPreloader();
})();
