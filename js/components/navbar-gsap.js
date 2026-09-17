/**
 * Avinya Care Foundation - GSAP Dynamic Island Orchestrated Navbar Controller
 * Inspired by GreenSock (GreenSock/pen/JoRMPLg) - Asymmetric easeReverse Navigation Engine
 */

class AvinyaGsapNavbar {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.mobileToggleBtn = document.querySelector('.mobile-toggle');
    this.mobileOverlay = document.getElementById('mobile-nav-overlay');
    
    if (!this.mobileToggleBtn || !this.mobileOverlay) return;

    this.isOpen = false;
    this.tl = null;
    this.focusableElements = this.mobileOverlay.querySelectorAll('.mobile-nav-link, button');
    this.init();
  }

  init() {
    this.mobileOverlay.setAttribute('aria-hidden', 'true');
    this.mobileToggleBtn.setAttribute('aria-controls', this.mobileOverlay.id);
    this.focusableElements.forEach(element => element.setAttribute('tabindex', '-1'));

    // The controller remains functional when the animation library is unavailable.
    // GSAP only enhances the shared drawer; it must not control its visibility state.
    if (typeof gsap !== 'undefined') {
      gsap.set(this.mobileOverlay, { 
        display: 'none', 
        opacity: 1,
        clipPath: 'circle(0px at calc(100% - 3.5rem) 2.5rem)'
      });
      
      this.tl = gsap.timeline({ paused: true });

      this.tl.to(this.mobileOverlay, {
        display: 'flex',
        clipPath: 'circle(150% at calc(100% - 3.5rem) 2.5rem)',
        duration: 0.6,
        ease: 'power3.inOut'
      }, 0);

      const menuContainer = this.mobileOverlay.querySelector('.mobile-nav-menu') || this.mobileOverlay;
      if (menuContainer) {
        this.tl.from(menuContainer, {
          autoAlpha: 0,
          y: 40,
          scale: 0.95,
          duration: 0.5,
          ease: 'power2.out'
        }, 0.2);
      }

      if (this.focusableElements.length) {
        this.tl.from(this.focusableElements, {
          opacity: 0,
          y: 20,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.05
        }, 0.3);
      }
    }

    // Event Listeners
    this.mobileToggleBtn.addEventListener('click', () => this.toggle());

    // Close button inside overlay if present
    const closeBtn = this.mobileOverlay.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Click outside or link click auto-close
    this.mobileOverlay.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => this.close());
    });

    this.mobileOverlay.querySelectorAll('.mobile-nav-action').forEach(action => {
      action.addEventListener('click', () => this.close());
    });

    this.mobileOverlay.addEventListener('click', (event) => {
      if (event.target === this.mobileOverlay) this.close();
    });

    // Keyboard ESC & Tab Trap Handling
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
        this.mobileToggleBtn.focus();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.mobileToggleBtn.setAttribute('aria-expanded', 'true');
    this.mobileToggleBtn.setAttribute('aria-label', 'Close navigation menu');
    this.mobileOverlay.setAttribute('aria-hidden', 'false');
    this.mobileOverlay.classList.add('active');
    this.mobileOverlay.style.display = 'flex';
    document.body.classList.add('mobile-nav-open');
    this.focusableElements.forEach(element => element.setAttribute('tabindex', '0'));

    if (this.tl) {
      this.tl.eventCallback('onReverseComplete', null);
      this.tl.timeScale(1).play();
    }
  }

  close() {
    if (!this.isOpen && !this.mobileOverlay.classList.contains('active')) return;
    this.isOpen = false;
    this.mobileToggleBtn.setAttribute('aria-expanded', 'false');
    this.mobileToggleBtn.setAttribute('aria-label', 'Open navigation menu');
    this.mobileOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mobile-nav-open');
    this.focusableElements.forEach(element => element.setAttribute('tabindex', '-1'));

    const finishClose = () => {
      if (this.isOpen) return;
      this.mobileOverlay.classList.remove('active');
      this.mobileOverlay.style.display = 'none';
    };

    if (this.tl) {
      this.tl.eventCallback('onReverseComplete', finishClose);
      this.tl.timeScale(1.4).reverse();
    } else {
      finishClose();
    }
  }
}

// Auto-Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.AvinyaNavbarEngine = new AvinyaGsapNavbar();
});
