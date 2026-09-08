/**
 * Avinya Care Foundation - NestJS 3D Overlapping Card Deck Controller
 * Features:
 * - Selected card is always positioned directly in the MIDDLE of the viewport
 * - Natural scroll-driven progression pinned to stage as user scrolls through page
 * - Trackpad & mousewheel horizontal scrub when hovering over deck
 * - Keyboard arrow navigation (Left/Right)
 * - Touch swipe gestures for mobile
 * - Clickable stage cards, progress dots, and arrow buttons with smooth scroll synchronization
 */

class JourneyTimeline {
  constructor() {
    this.section = document.getElementById('journey');
    this.viewport = document.querySelector('.nestjs-card-deck-viewport');
    this.track = document.getElementById('nestjs-card-deck-track');
    this.cards = Array.from(document.querySelectorAll('.nestjs-deck-card'));
    this.dots = Array.from(document.querySelectorAll('.deck-dot'));
    this.currentIndex = 0;
    this.isWheeling = false;
    this.wheelTimeout = null;

    if (!this.section || !this.track || !this.cards.length) return;

    this.init();
  }

  init() {
    // 1. Initial State - center stage 0 after layout is ready
    requestAnimationFrame(() => {
      this.goToStage(0);
    });

    // 2. Responsive Recalculation on Resize
    window.addEventListener('resize', () => {
      this.goToStage(this.currentIndex, false);
    });

    // 3. Keyboard Arrow Navigation
    document.addEventListener('keydown', (e) => {
      const rect = this.section.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (!isVisible) return;

      if (e.key === 'ArrowLeft') {
        this.prevCard();
      } else if (e.key === 'ArrowRight') {
        this.nextCard();
      }
    });

    // 4. Touch / Swipe Gesture support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    this.track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) {
        this.nextCard();
      } else if (touchEndX - touchStartX > 50) {
        this.prevCard();
      }
    }, { passive: true });

    // 5. Mouse Wheel / Trackpad Scroll on Carousel Stage
    if (this.viewport) {
      this.viewport.addEventListener('wheel', (e) => {
        const absDeltaX = Math.abs(e.deltaX);
        const absDeltaY = Math.abs(e.deltaY);

        if (absDeltaX > 15 || (absDeltaY > 15 && !this.isWheeling)) {
          const delta = absDeltaX > absDeltaY ? e.deltaX : e.deltaY;
          if (delta > 15) {
            if (this.currentIndex < this.cards.length - 1) {
              e.preventDefault();
              this.nextCard();
              this.triggerWheelCooldown(500);
            }
          } else if (delta < -15) {
            if (this.currentIndex > 0) {
              e.preventDefault();
              this.prevCard();
              this.triggerWheelCooldown(500);
            }
          }
        }
      }, { passive: false });
    }

    // 6. Page Scroll Triggering - Synchronize cards with page scroll position
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', () => {
      requestAnimationFrame(this.handleScroll);
    }, { passive: true });
  }

  triggerWheelCooldown(duration = 400) {
    this.isWheeling = true;
    clearTimeout(this.wheelTimeout);
    this.wheelTimeout = setTimeout(() => {
      this.isWheeling = false;
    }, duration);
  }

  handleScroll() {
    if (!this.section || this.isWheeling) return;

    const rect = this.section.getBoundingClientRect();
    const scrollDistance = rect.height - window.innerHeight;

    // Desktop Sticky Mode
    if (scrollDistance > 50) {
      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollDistance));
        const targetIndex = Math.min(this.cards.length - 1, Math.floor(progress * this.cards.length));
        if (targetIndex !== this.currentIndex) {
          this.goToStage(targetIndex, false);
        }
      } else if (rect.top > 0) {
        if (this.currentIndex !== 0) {
          this.goToStage(0, false);
        }
      } else if (rect.bottom < window.innerHeight) {
        if (this.currentIndex !== this.cards.length - 1) {
          this.goToStage(this.cards.length - 1, false);
        }
      }
    } else {
      // Mobile / standard non-sticky mode
      const windowH = window.innerHeight;
      const visibleTop = rect.top;
      const visibleHeight = rect.height;

      if (visibleTop < windowH * 0.65 && visibleTop + visibleHeight > windowH * 0.35) {
        const scrollProgress = (windowH * 0.65 - visibleTop) / (visibleHeight * 0.7);
        const clamped = Math.max(0, Math.min(1, scrollProgress));
        const targetIndex = Math.floor(clamped * this.cards.length);
        const safeIndex = Math.min(this.cards.length - 1, Math.max(0, targetIndex));

        if (safeIndex !== this.currentIndex) {
          this.goToStage(safeIndex, false);
        }
      }
    }
  }

  goToStage(index, syncScroll = false) {
    if (index < 0 || index >= this.cards.length) return;
    this.currentIndex = index;

    // Update Cards Active State & Perspective Classes
    this.cards.forEach((card, idx) => {
      if (idx === index) {
        card.classList.add('active');
        card.classList.remove('card-prev', 'card-next');
      } else if (idx < index) {
        card.classList.remove('active', 'card-next');
        card.classList.add('card-prev');
      } else {
        card.classList.remove('active', 'card-prev');
        card.classList.add('card-next');
      }
    });

    // Update Dots Active State
    this.dots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Calculate Track Slide Offset so the selected card is in the exact MIDDLE of the viewport
    const targetCard = this.cards[index];
    if (targetCard && this.viewport) {
      const viewportWidth = this.viewport.clientWidth;
      const cardWidth = targetCard.offsetWidth;
      const cardLeft = targetCard.offsetLeft;
      // Centering formula: center of viewport minus center of target card
      const offset = (viewportWidth - cardWidth) / 2 - cardLeft;
      this.track.style.transform = `translateX(${offset}px)`;
    }

    // Smoothly synchronize page scroll position if manually triggered
    if (syncScroll && this.section) {
      const scrollDistance = this.section.offsetHeight - window.innerHeight;
      if (scrollDistance > 50) {
        const targetScrollY = this.section.offsetTop + (index / (this.cards.length - 1)) * scrollDistance;
        this.triggerWheelCooldown(600);
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      }
    }
  }

  nextCard() {
    const nextIdx = (this.currentIndex + 1) % this.cards.length;
    this.goToStage(nextIdx, true);
  }

  prevCard() {
    const prevIdx = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
    this.goToStage(prevIdx, true);
  }
}

window.JourneyTimeline = JourneyTimeline;
window.initJourneyTimeline = () => {
  window.AvinyaTimeline = new JourneyTimeline();
  return window.AvinyaTimeline;
};

// Auto-initialize if DOM is already ready or on DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  window.AvinyaTimeline = new JourneyTimeline();
} else {
  window.addEventListener('DOMContentLoaded', () => {
    window.AvinyaTimeline = new JourneyTimeline();
  });
}
