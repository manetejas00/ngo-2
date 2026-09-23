/**
 * Avinya Care Foundation - Premium GSAP Radial Floating Action Menu (FAB)
 * Includes 6 Radial Spring Actions: WhatsApp, Instagram, Facebook, LinkedIn, Scroll to Top, Scroll to Bottom.
 * High-Contrast Crisp Icons, Compact Radial Arc, & Full Page GSAP Smooth Scroll.
 */

class RadialMenuEngine {
  constructor() {
    this.container = document.querySelector('.radial-fab-container');
    if (!this.container) return;

    this.toggleBtn = this.container.querySelector('.radial-fab-main-btn');
    this.toggleIcon = this.container.querySelector('.radial-fab-icon');
    this.actionsWrapper = this.container.querySelector('.radial-actions-wrapper');
    this.actionItems = Array.from(this.container.querySelectorAll('.radial-action-item'));
    
    this.upBtn = this.container.querySelector('#radial-up-btn');
    this.downBtn = this.container.querySelector('#radial-down-btn');
    this.shareBtn = this.container.querySelector('#radial-share-btn');

    this.isOpen = false;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.positions = [];
    this.toastElem = null;

    this.init();
  }

  init() {
    // Register GSAP ScrollToPlugin if available
    if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
      try {
        gsap.registerPlugin(ScrollToPlugin);
      } catch (e) {}
    }

    // 1. Calculate positions & initial arrow context
    this.calculatePositions();
    this.updateArrowStates();
    this.createToastElement();

    // 2. Main Toggle Button Listener
    if (this.toggleBtn) {
      // Remove any existing click handler to prevent duplicates
      this.toggleBtn.removeEventListener('click', this._onToggleClick);
      this._onToggleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      };
      this.toggleBtn.addEventListener('click', this._onToggleClick);
    }

    // 3. Full Up / Full Down Navigation Listeners
    if (this.upBtn) {
      this.upBtn.removeEventListener('click', this._onUpClick);
      this._onUpClick = (e) => {
        e.preventDefault();
        this.scrollToSection('up');
      };
      this.upBtn.addEventListener('click', this._onUpClick);
    }

    if (this.downBtn) {
      this.downBtn.removeEventListener('click', this._onDownClick);
      this._onDownClick = (e) => {
        e.preventDefault();
        this.scrollToSection('down');
      };
      this.downBtn.addEventListener('click', this._onDownClick);
    }

    // 4. Share Button Listener (if present)
    if (this.shareBtn) {
      this.shareBtn.removeEventListener('click', this._onShareClick);
      this._onShareClick = (e) => {
        e.preventDefault();
        this.handleShare();
      };
      this.shareBtn.addEventListener('click', this._onShareClick);
    }

    // 5. Close menu on click outside
    document.removeEventListener('click', this._onOutsideClick);
    this._onOutsideClick = (e) => {
      if (this.isOpen && this.container && !this.container.contains(e.target)) {
        this.close();
      }
    };
    document.addEventListener('click', this._onOutsideClick);

    // 6. Keyboard accessibility (Escape key closes menu)
    document.removeEventListener('keydown', this._onKeyDown);
    this._onKeyDown = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);

    // 7. Window Scroll & Resize Listeners
    if (!this._hasBoundScroll) {
      let scrollTicking = false;
      window.addEventListener('scroll', () => {
        if (!scrollTicking) {
          requestAnimationFrame(() => {
            this.updateArrowStates();
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      }, { passive: true });

      window.addEventListener('resize', () => {
        this.calculatePositions();
        if (this.isOpen) {
          this.updateRadialPositions(false);
        }
      }, { passive: true });
      this._hasBoundScroll = true;
    }
  }

  /**
   * Calculates sleek, compact upper-left quarter-circle radial positions (180deg to 270deg) for action buttons.
   * Ensures all items float strictly in upper-left quadrant (y <= 0) with a tight, perfectly spaced arc.
   */
  calculatePositions() {
    const totalItems = this.actionItems.length;
    if (totalItems === 0) return;

    // Compact radius (130px desktop / 90px mobile) & upper-left arc range (180deg to 270deg)
    const radius = window.innerWidth < 768 ? 90 : 130;
    const startAngle = 180; // Facing straight left
    const endAngle = 270;   // Facing straight up
    const angleStep = (endAngle - startAngle) / Math.max(1, totalItems - 1);

    this.positions = this.actionItems.map((_, index) => {
      const angleDeg = startAngle + index * angleStep;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = Math.round(radius * Math.cos(angleRad));
      const y = Math.round(radius * Math.sin(angleRad));
      return { x, y };
    });
  }

  /**
   * Toggles the radial menu open/closed.
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Opens the radial FAB with GSAP spring animations.
   */
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.container.classList.add('is-open');
    if (this.toggleBtn) this.toggleBtn.setAttribute('aria-expanded', 'true');

    // Rotate main button icon (+) to (x)
    if (typeof gsap !== 'undefined' && this.toggleIcon) {
      gsap.to(this.toggleIcon, {
        rotation: 135,
        duration: this.reducedMotion ? 0 : 0.4,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }

    this.updateRadialPositions(true);
  }

  /**
   * Closes the radial FAB and retracts items.
   */
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.toggleBtn) this.toggleBtn.setAttribute('aria-expanded', 'false');

    // Rotate icon back to 0deg
    if (typeof gsap !== 'undefined' && this.toggleIcon) {
      gsap.to(this.toggleIcon, {
        rotation: 0,
        duration: this.reducedMotion ? 0 : 0.3,
        ease: 'power2.in',
        overwrite: 'auto'
      });
    }

    if (typeof gsap !== 'undefined' && !this.reducedMotion) {
      gsap.to(this.actionItems, {
        x: 0,
        y: 0,
        opacity: 0,
        scale: 0.5,
        duration: 0.25,
        ease: 'power2.in',
        stagger: -0.02,
        overwrite: 'auto',
        onComplete: () => {
          if (!this.isOpen && this.container) {
            this.container.classList.remove('is-open');
          }
        }
      });
    } else {
      this.actionItems.forEach(item => {
        item.style.transform = 'translate(0px, 0px) scale(0.5)';
        item.style.opacity = '0';
      });
      if (this.container) this.container.classList.remove('is-open');
    }
  }

  /**
   * Updates radial positions for open state.
   */
  updateRadialPositions(animate = true) {
    if (typeof gsap !== 'undefined' && !this.reducedMotion && animate) {
      gsap.to(this.actionItems, {
        x: (i) => this.positions[i]?.x || 0,
        y: (i) => this.positions[i]?.y || 0,
        opacity: 1,
        scale: 1,
        duration: 0.65,
        ease: 'elastic.out(1, 0.5)',
        stagger: 0.04,
        overwrite: 'auto'
      });
    } else {
      this.actionItems.forEach((item, i) => {
        const pos = this.positions[i] || { x: 0, y: 0 };
        item.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(1)`;
        item.style.opacity = '1';
      });
    }
  }

  /**
   * Performs smooth GSAP ScrollTo navigation:
   * Up Arrow (↑) -> Full scroll to top of page (y = 0)
   * Down Arrow (↓) -> Full scroll to bottom of page (y = maxScroll)
   */
  scrollToSection(direction) {
    const maxScroll = Math.max(0, (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight);
    let targetY = 0;

    if (direction === 'up') {
      targetY = 0; // Full Up to top of website
    } else if (direction === 'down') {
      targetY = maxScroll; // Full Down to bottom of website
    }

    // Ensure GSAP ScrollToPlugin is registered if available
    const hasScrollTo = typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined';
    if (hasScrollTo) {
      try {
        gsap.registerPlugin(ScrollToPlugin);
      } catch (e) {}
    }

    if (hasScrollTo) {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: targetY, autoKill: false },
        ease: 'power3.inOut',
        onUpdate: () => {
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.update();
          }
        },
        onComplete: () => {
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
          this.updateArrowStates();
        }
      });
    } else if (typeof gsap !== 'undefined') {
      // Custom GSAP power3 smooth scroll without ScrollToPlugin
      const startY = window.scrollY || window.pageYOffset || 0;
      const dist = targetY - startY;
      const duration = 1000;
      let startTime = null;

      const animateScroll = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easeProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        window.scrollTo(0, startY + dist * easeProgress);

        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.update();
        }

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
          this.updateArrowStates();
        }
      };

      requestAnimationFrame(animateScroll);
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      setTimeout(() => this.updateArrowStates(), 800);
    }
  }

  /**
   * Dynamically enables/disables Up and Down arrows based on viewport scroll position.
   */
  updateArrowStates() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;

    // Up Arrow disabled state (at top)
    if (this.upBtn) {
      if (scrollY <= 30) {
        this.upBtn.classList.add('disabled');
        this.upBtn.setAttribute('aria-disabled', 'true');
        this.upBtn.setAttribute('tabindex', '-1');
      } else {
        this.upBtn.classList.remove('disabled');
        this.upBtn.setAttribute('aria-disabled', 'false');
        this.upBtn.removeAttribute('tabindex');
      }
    }

    // Down Arrow disabled state (at bottom)
    if (this.downBtn) {
      if (scrollY >= maxScroll - 30) {
        this.downBtn.classList.add('disabled');
        this.downBtn.setAttribute('aria-disabled', 'true');
        this.downBtn.setAttribute('tabindex', '-1');
      } else {
        this.downBtn.classList.remove('disabled');
        this.downBtn.setAttribute('aria-disabled', 'false');
        this.downBtn.removeAttribute('tabindex');
      }
    }
  }

  /**
   * Web Share API / Clipboard fallback handler.
   */
  async handleShare() {
    const shareData = {
      title: document.title || 'Avinya Care Foundation',
      text: 'Empowering communities through accessible healthcare & compassionate aid.',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.copyToClipboard();
        }
      }
    } else {
      this.copyToClipboard();
    }
  }

  /**
   * Copies current URL to clipboard & triggers toast notification.
   */
  copyToClipboard() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        this.showToast('Link copied to clipboard!');
      }).catch(() => {
        this.fallbackCopyText(url);
      });
    } else {
      this.fallbackCopyText(url);
    }
  }

  fallbackCopyText(text) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      this.showToast('Link copied to clipboard!');
    } catch (e) {
      this.showToast('Copy URL: ' + text);
    }
    document.body.removeChild(input);
  }

  /**
   * Safely creates custom toast element for link copy feedback.
   */
  createToastElement() {
    let toast = document.getElementById('radial-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'radial-toast';
      toast.className = 'radial-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span id="radial-toast-msg">Link copied to clipboard!</span>
      `;
      document.body.appendChild(toast);
    }
    this.toastElem = toast;
  }

  showToast(message) {
    if (!this.toastElem) this.createToastElement();
    const msgNode = document.getElementById('radial-toast-msg');
    if (msgNode) msgNode.textContent = message;

    if (this.toastElem) {
      this.toastElem.classList.add('show');
      setTimeout(() => {
        if (this.toastElem) this.toastElem.classList.remove('show');
      }, 2800);
    }
  }
}

// Global initialization helper for static or dynamic component injection
window.initRadialMenu = function() {
  if (document.querySelector('.radial-fab-container')) {
    window.AvinyaRadialMenu = new RadialMenuEngine();
    return window.AvinyaRadialMenu;
  }
  return null;
};

// Auto-initialize when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.initRadialMenu());
} else {
  window.initRadialMenu();
}
