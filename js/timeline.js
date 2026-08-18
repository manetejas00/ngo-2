/**
 * Avinya Care Foundation - NestJS 3D Overlapping Card Deck Controller
 * Provides smooth 3D tilt transitions, card navigation, and dot indicators.
 */

class JourneyTimeline {
  constructor() {
    this.section = document.getElementById('journey');
    this.track = document.getElementById('nestjs-card-deck-track');
    this.cards = document.querySelectorAll('.nestjs-deck-card');
    this.dots = document.querySelectorAll('.deck-dot');
    this.currentIndex = 0;

    if (!this.section || !this.track || !this.cards.length) return;

    this.init();
  }

  init() {
    // 1. Initial State
    this.goToStage(0);

    // 2. Keyboard Arrow Navigation
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

    // 3. Touch / Swipe Gesture support for mobile
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
  }

  goToStage(index) {
    if (index < 0 || index >= this.cards.length) return;
    this.currentIndex = index;

    // Update Cards Active State
    this.cards.forEach((card, idx) => {
      if (idx === index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
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

    // Calculate Track Slide Offset
    const cardWidth = this.cards[0].offsetWidth;
    const gap = 32; // 2rem gap
    const offset = index * (cardWidth + gap);

    this.track.style.transform = `translateX(-${offset}px)`;
  }

  nextCard() {
    const nextIdx = (this.currentIndex + 1) % this.cards.length;
    this.goToStage(nextIdx);
  }

  prevCard() {
    const prevIdx = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
    this.goToStage(prevIdx);
  }
}

// Global Singleton Instance
window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaTimeline = new JourneyTimeline();
});
