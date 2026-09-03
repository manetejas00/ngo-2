/**
 * Avinya Care Foundation - NestJS 7-Card Interactive Overlapping Stack
 * Controls Section 4 (#what-we-do - "Support at every step of the journey.")
 * Provides physical card lift, zero-rotation alignment, neighbor pushback,
 * 3D tilt tracking, mobile touch-tap activation & mobile scroll-snap center detection.
 */

class NestJSCardStack {
  constructor() {
    this.container = document.getElementById('nestjs-card-stack');
    if (!this.container) return;

    this.cards = Array.from(this.container.querySelectorAll('.nestjs-stack-card'));
    this.dots = Array.from(document.querySelectorAll('#journey-stage-dots .journey-dot'));
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
      card.style.zIndex = (idx + 1).toString();

      // Mouse & Desktop Listeners
      card.addEventListener('mouseenter', () => this.handleMouseEnter(idx));
      card.addEventListener('mouseleave', () => this.handleMouseLeave(idx));
      card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card));
      card.addEventListener('focus', () => this.handleMouseEnter(idx));
      card.addEventListener('blur', () => this.handleMouseLeave(idx));

      // Mobile Touch & Tap Listeners
      card.addEventListener('touchstart', () => {
        this.handleMouseEnter(idx);
      }, { passive: true });

      card.addEventListener('click', () => {
        this.handleMouseEnter(idx);
      });
    });

    // 2. Stage Progress Dots Click Listeners
    if (this.dots && this.dots.length) {
      this.dots.forEach((dot, dIdx) => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleMouseEnter(dIdx);
          if (this.cards[dIdx] && window.innerWidth <= 1024) {
            this.cards[dIdx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        });
      });
    }

    // 3. Mobile Horizontal Scroll Center Detection
    this.container.addEventListener('scroll', () => {
      if (window.innerWidth <= 1024) {
        requestAnimationFrame(() => this.detectMobileCenterCard());
      }
    }, { passive: true });

    // 4. IntersectionObserver for viewport scroll entry animation
    this.observeEntrance();
  }

  detectMobileCenterCard() {
    const containerRect = this.container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIdx = -1;
    let minDistance = Infinity;

    this.cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(containerCenter - cardCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    if (closestIdx !== -1 && closestIdx !== this.activeIndex) {
      this.handleMouseEnter(closestIdx);
    }
  }

  handleMouseEnter(index) {
    this.activeIndex = index;

    if (this.dots && this.dots.length) {
      this.dots.forEach((dot, dIdx) => {
        dot.classList.toggle('active', dIdx === index);
      });
    }

    const isMobile = window.innerWidth <= 768;
    const liftY = isMobile ? -24 : -40;

    this.cards.forEach((card, idx) => {
      const baseRot = parseFloat(card.dataset.rot) || 0;
      const baseTY = parseFloat(card.dataset.ty) || 0;

      card.classList.remove('active', 'adjacent-left', 'adjacent-right', 'distant');

      if (idx === index) {
        card.classList.add('active');
        if (!this.reducedMotion) {
          card.style.transform = `translateY(${liftY}px) rotate(0deg) scale(1.04)`;
        }
      } else if (idx === index - 1) {
        card.classList.add('adjacent-left');
        if (!this.reducedMotion) {
          card.style.transform = `translateY(${baseTY + 6}px) translateX(-16px) rotate(${baseRot - 2}deg) scale(0.97)`;
        }
      } else if (idx === index + 1) {
        card.classList.add('adjacent-right');
        if (!this.reducedMotion) {
          card.style.transform = `translateY(${baseTY + 6}px) translateX(16px) rotate(${baseRot + 2}deg) scale(0.97)`;
        }
      } else {
        card.classList.add('distant');
        const dir = idx < index ? -20 : 20;
        if (!this.reducedMotion) {
          card.style.transform = `translateY(${baseTY + 10}px) translateX(${dir}px) rotate(${baseRot}deg) scale(0.94)`;
        }
      }
    });
  }

  handleMouseMove(e, card) {
    if (!card.classList.contains('active') || this.reducedMotion || window.innerWidth <= 768) return;

    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const tiltX = (mouseY / (rect.height / 2)) * -4;
    const tiltY = (mouseX / (rect.width / 2)) * 4;

    card.style.transform = `translateY(-40px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.04)`;
  }

  handleMouseLeave(index) {
    if (window.innerWidth <= 768) return;

    this.activeIndex = -1;

    if (this.dots && this.dots.length) {
      this.dots.forEach((dot, dIdx) => {
        dot.classList.toggle('active', dIdx === 0);
      });
    }

    this.cards.forEach((card, idx) => {
      card.classList.remove('active', 'adjacent-left', 'adjacent-right', 'distant');
      const baseRot = parseFloat(card.dataset.rot) || 0;
      const baseTY = parseFloat(card.dataset.ty) || 0;

      card.style.transform = `translateY(${baseTY}px) rotate(${baseRot}deg) scale(1)`;
      card.style.zIndex = (idx + 1).toString();
    });
  }

  observeEntrance() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.container.classList.add('stack-entered');

          if (window.innerWidth <= 1024 && this.activeIndex === -1) {
            this.handleMouseEnter(1);
          }
        }
      });
    }, { threshold: 0.2 });

    observer.observe(this.container);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaNestJSCards = new NestJSCardStack();
});
