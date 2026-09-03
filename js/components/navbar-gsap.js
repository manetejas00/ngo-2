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
    this.init();
  }

  init() {
    if (typeof gsap === 'undefined') return;

    // Ensure initial overlay accessibility setup
    gsap.set(this.mobileOverlay, { display: 'none', opacity: 0 });
    const links = this.mobileOverlay.querySelectorAll('.mobile-nav-link, button');

    // Build Orchestrated GSAP Navigation Timeline
    this.tl = gsap.timeline({ paused: true });

    // 1. Fade & Blur Backdrop
    this.tl.to(this.mobileOverlay, {
      display: 'flex',
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    }, 0);

    // 2. Animate Mobile Menu Container (Spring Scale Entrance & Snappy Reverse)
    const menuContainer = this.mobileOverlay.querySelector('.mobile-nav-menu') || this.mobileOverlay;
    if (menuContainer) {
      this.tl.from(menuContainer, {
        autoAlpha: 0,
        y: -20,
        scale: 0.92,
        duration: 0.5,
        ease: 'back.out(1.7)'
      }, 0.05);
    }

    // 3. Staggered Link Item Reveal
    if (links.length) {
      this.tl.from(links, {
        opacity: 0,
        y: 12,
        duration: 0.3,
        ease: 'power2.out',
        stagger: 0.04
      }, 0.12);
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
    if (!this.tl) return;
    this.isOpen = true;
    this.mobileToggleBtn.setAttribute('aria-expanded', 'true');
    this.mobileToggleBtn.setAttribute('aria-label', 'Close navigation menu');
    
    // Enable focusable elements inside overlay
    const links = this.mobileOverlay.querySelectorAll('.mobile-nav-link, button');
    links.forEach(l => l.setAttribute('tabindex', '0'));

    this.tl.timeScale(1).play();
  }

  close() {
    if (!this.tl || !this.isOpen) return;
    this.isOpen = false;
    this.mobileToggleBtn.setAttribute('aria-expanded', 'false');
    this.mobileToggleBtn.setAttribute('aria-label', 'Open navigation menu');

    // Disable tab index on close
    const links = this.mobileOverlay.querySelectorAll('.mobile-nav-link');
    links.forEach(l => l.setAttribute('tabindex', '-1'));

    // Fast 1.4x reverse speed for snappy, non-lingering exit
    this.tl.timeScale(1.4).reverse();
  }
}

// Auto-Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.AvinyaNavbarEngine = new AvinyaGsapNavbar();
});
