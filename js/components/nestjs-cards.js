/**
 * Avinya Care Foundation - NestJS 7-Card Interactive Overlapping Hover Stack
 * Provides physical card lift, zero-rotation alignment, neighbor pushback,
 * 3D mouse parallax tilt tracking, and touch/keyboard accessibility.
 */

class NestJSCardStack {
  constructor() {
    this.container = document.getElementById('nestjs-card-stack');
    if (!this.container) return;

    this.cards = Array.from(this.container.querySelectorAll('.nestjs-stack-card'));
    this.activeIndex = -1;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    // 1. Set Initial Rotations & Overlap Z-Indexes
    this.cards.forEach((card, idx) => {
      const baseRot = parseFloat(card.dataset.rot) || 0;
      const baseTY = parseFloat(card.dataset.ty) || 0;

      card.style.transform = `translateY(${baseTY}px) rotate(${baseRot}deg) scale(1)`;
      card.style.zIndex = idx + 1;

      // Event Listeners
      card.addEventListener('mouseenter', () => this.handleMouseEnter(idx));
      card.addEventListener('mouseleave', () => this.handleMouseLeave(idx));
      card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
      card.addEventListener('focus', () => this.handleMouseEnter(idx));
      card.addEventListener('blur', () => this.handleMouseLeave(idx));
    });

    // 2. IntersectionObserver for viewport scroll entry animation
    this.observeEntrance();
  }

  handleMouseEnter(index) {
    this.activeIndex = index;

    this.cards.forEach((card, idx) => {
      const baseRot = parseFloat(card.dataset.rot) || 0;
      const baseTY = parseFloat(card.dataset.ty) || 0;

      // Reset class state
      card.classList.remove('active', 'adjacent-left', 'adjacent-right', 'distant');

      if (idx === index) {
        // ACTIVE CARD: Lifts upward (-40px), rotates to 0deg, scales to 1.04
        card.classList.add('active');
        if (!this.reducedMotion) {
          card.style.transform = `translateY(-40px) rotate(0deg) scale(1.04)`;
        }
      } else if (idx === index - 1) {
        // IMMEDIATE LEFT NEIGHBOR: Shifts left (-16px), scales to 0.97
        card.classList.add('adjacent-left');
        if (!this.reducedMotion) {
          card.style.transform = `translateY(${baseTY + 6}px) translateX(-16px) rotate(${baseRot - 2}deg) scale(0.97)`;
        }
      } else if (idx === index + 1) {
        // IMMEDIATE RIGHT NEIGHBOR: Shifts right (+16px), scales to 0.97
        card.classList.add('adjacent-right');
        if (!this.reducedMotion) {
          card.style.transform = `translateY(${baseTY + 6}px) translateX(16px) rotate(${baseRot + 2}deg) scale(0.97)`;
        }
      } else {
        // DISTANT CARDS: Scale down (0.94), lower opacity
        card.classList.add('distant');
        const dir = idx < index ? -24 : 24;
        if (!this.reducedMotion) {
          card.style.transform = `translateY(${baseTY + 10}px) translateX(${dir}px) rotate(${baseRot}deg) scale(0.94)`;
        }
      }
    });
  }

  handleMouseMove(e, card) {
    if (!card.classList.contains('active') || this.reducedMotion) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Subtle 3° - 4° 3D Tilt calculation
    const tiltX = (mouseY / (rect.height / 2)) * -4;
    const tiltY = (mouseX / (rect.width / 2)) * 4;

    card.style.transform = `translateY(-40px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.04)`;
  }

  handleMouseLeave(index) {
    this.activeIndex = -1;

    this.cards.forEach((card, idx) => {
      card.classList.remove('active', 'adjacent-left', 'adjacent-right', 'distant');
      const baseRot = parseFloat(card.dataset.rot) || 0;
      const baseTY = parseFloat(card.dataset.ty) || 0;

      card.style.transform = `translateY(${baseTY}px) rotate(${baseRot}deg) scale(1)`;
      card.style.zIndex = idx + 1;
    });
  }

  observeEntrance() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.container.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(this.container);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaNestJSCards = new NestJSCardStack();
});
