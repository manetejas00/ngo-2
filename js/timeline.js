/**
 * Avinya Care Foundation - NestJS 3D Overlapping Card Deck Controller (#journey)
 * Uses GSAP ScrollTrigger + matchMedia for responsive desktop/tablet/mobile horizontal pin animation.
 */

class JourneyTimeline {
  constructor() {
    this.section = document.getElementById('journey');
    this.viewport = document.querySelector('.nestjs-card-deck-viewport');
    this.track = document.getElementById('nestjs-card-deck-track');
    this.cards = Array.from(document.querySelectorAll('.nestjs-deck-card'));
    this.dots = Array.from(document.querySelectorAll('.deck-dots .deck-dot'));
    this.prevBtn = document.querySelector('.deck-arrow-btn.prev');
    this.nextBtn = document.querySelector('.deck-arrow-btn.next');

    this.currentIndex = 0;
    this.st = null;
    this.mm = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.section || !this.track || !this.cards.length) return;

    this.init();
  }

  init() {
    // Check for reduced motion
    if (this.reducedMotion) {
      this.initReducedMotion();
      return;
    }

    // Check if GSAP & ScrollTrigger are loaded
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      this.setupGSAP();
    } else {
      this.setupFallbackScroll();
    }

    this.setupInteractions();
  }

  calculateOffset(index) {
    if (!this.viewport || !this.cards[index]) return 0;
    const viewportWidth = this.viewport.clientWidth;
    const targetCard = this.cards[index];
    const cardWidth = targetCard.offsetWidth;
    const cardLeft = targetCard.offsetLeft;
    // Centering formula: center of viewport minus center of target card
    return (viewportWidth - cardWidth) / 2 - cardLeft;
  }

  setupGSAP() {
    this.mm = gsap.matchMedia();

    this.mm.add({
      isDesktop: "(min-width: 1024px)",
      isTablet: "(min-width: 768px) and (max-width: 1023px)",
      isMobile: "(max-width: 767px)"
    }, (context) => {
      const { isDesktop, isTablet } = context.conditions;

      const getDistance = () => {
        const firstOffset = this.calculateOffset(0);
        const lastOffset = this.calculateOffset(this.cards.length - 1);
        return Math.abs(lastOffset - firstOffset);
      };

      const getPinDuration = () => {
        const dist = getDistance();
        if (isDesktop) return Math.max(1600, dist * 1.5);
        if (isTablet) return Math.max(1300, dist * 1.3);
        return Math.max(1000, dist * 1.2);
      };

      this.st = ScrollTrigger.create({
        trigger: this.section,
        pin: true,
        start: "top top",
        end: () => `+=${getPinDuration()}`,
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const targetIndex = Math.min(
            this.cards.length - 1,
            Math.max(0, Math.round(progress * (this.cards.length - 1)))
          );

          if (targetIndex !== this.currentIndex) {
            this.setActiveStage(targetIndex);
          }

          // Dynamic calculation of track position based on progress
          const startOffset = this.calculateOffset(0);
          const endOffset = this.calculateOffset(this.cards.length - 1);
          const currentOffset = startOffset + progress * (endOffset - startOffset);
          
          this.track.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
        },
        onRefresh: () => {
          const progress = this.currentIndex / (this.cards.length - 1);
          const startOffset = this.calculateOffset(0);
          const endOffset = this.calculateOffset(this.cards.length - 1);
          const currentOffset = startOffset + progress * (endOffset - startOffset);
          this.track.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
        }
      });

      this.setActiveStage(0);
      const initialOffset = this.calculateOffset(0);
      this.track.style.transform = `translate3d(${initialOffset}px, 0, 0)`;

      return () => {
        if (this.st) {
          this.st.kill();
          this.st = null;
        }
      };
    });

    // Refresh ScrollTrigger when images load
    window.addEventListener('load', () => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    });
  }

  setupFallbackScroll() {
    this.handleScroll = () => {
      const rect = this.section.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      if (scrollDistance <= 0) return;

      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollDistance));
        const targetIndex = Math.min(this.cards.length - 1, Math.round(progress * (this.cards.length - 1)));
        if (targetIndex !== this.currentIndex) {
          this.goToStage(targetIndex, false);
        }
      }
    };

    window.addEventListener('scroll', () => {
      requestAnimationFrame(this.handleScroll);
    }, { passive: true });

    this.setActiveStage(0);
  }

  initReducedMotion() {
    this.setActiveStage(0);
  }

  setActiveStage(index) {
    if (index < 0 || index >= this.cards.length) return;
    this.currentIndex = index;

    // 1. Update Cards Active / Perspective State
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

    // 2. Update Progress Dots
    this.dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });

    // 3. Update Arrow Buttons state (disable when at ends)
    if (this.prevBtn) {
      this.prevBtn.disabled = (index === 0);
    }
    if (this.nextBtn) {
      this.nextBtn.disabled = (index === this.cards.length - 1);
    }
  }

  goToStage(index, syncScroll = true) {
    if (index < 0 || index >= this.cards.length) return;

    this.setActiveStage(index);

    if (this.st && syncScroll) {
      const targetProgress = index / (this.cards.length - 1);
      const targetScrollY = this.st.start + targetProgress * (this.st.end - this.st.start);

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    } else {
      const offset = this.calculateOffset(index);
      this.track.style.transform = `translate3d(${offset}px, 0, 0)`;
    }
  }

  nextCard() {
    if (this.currentIndex < this.cards.length - 1) {
      this.goToStage(this.currentIndex + 1, true);
    }
  }

  prevCard() {
    if (this.currentIndex > 0) {
      this.goToStage(this.currentIndex - 1, true);
    }
  }

  setupInteractions() {
    // 1. Keyboard Navigation
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

    // 2. Touch / Swipe Gestures for Mobile
    let touchStartX = 0;
    let touchStartY = 0;

    if (this.viewport) {
      this.viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      this.viewport.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;

        // Ensure horizontal swipe intent (diffX > 40 & horizontal > vertical)
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX > 0) {
            this.nextCard();
          } else {
            this.prevCard();
          }
        }
      }, { passive: true });
    }

    // 3. Dot & Arrow Click Handlers
    this.dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        this.goToStage(idx, true);
      });
    });

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.prevCard();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.nextCard();
      });
    }
  }
}

// Instantiate singleton
window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaTimeline = new JourneyTimeline();
});

