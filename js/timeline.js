/**
 * Avinya Care Foundation - GSAP 3D Card Deck Controller
 * Controls Section 6 (#journey - "Every step of your health journey.")
 * Guaranteed 100% dead-center focal alignment for every card stage.
 */

class JourneyTimeline {
  constructor() {
    this.section = document.getElementById('journey');
    this.track = document.getElementById('nestjs-card-deck-track');
    if (!this.section || !this.track) return;

    this.cards = Array.from(this.track.querySelectorAll('.nestjs-deck-card'));
    this.dots = Array.from(this.section.querySelectorAll('.deck-dot'));
    this.prevBtn = this.section.querySelector('.deck-arrow-btn.prev');
    this.nextBtn = this.section.querySelector('.deck-arrow-btn.next');

    this.numCards = this.cards.length;
    this.currentIndex = 0;
    this.playhead = { progress: 0 }; // ranges from 0 to (numCards - 1)
    this.scrubTween = null;
    this.trigger = null;

    this.init();
  }

  init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger, Draggable);

    const cards = this.cards;
    const numCards = this.numCards;

    // Smooth scrub tween object
    this.scrubTween = gsap.to(this.playhead, {
      progress: 0,
      onUpdate: () => {
        this.renderCards(this.playhead.progress);
      },
      duration: 0.45,
      ease: "power2.out",
      paused: true
    });

    // Pinned ScrollTrigger on desktop/tablet, natural scrolling on mobile
    const isMobile = window.innerWidth <= 768;
    this.trigger = ScrollTrigger.create({
      trigger: '#journey',
      start: 'top top',
      end: isMobile ? '+=400' : '+=1400',
      pin: !isMobile,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Map scroll progress (0 to 0.85) to (0 to numCards - 1), hold last card from 0.85 to 1.0
        const normProgress = gsap.utils.clamp(0, 1, self.progress / 0.85);
        const targetProgress = normProgress * (numCards - 1);
        this.scrubTween.vars.progress = targetProgress;
        this.scrubTween.invalidate().restart();
      }
    });

    // Touch & Mouse Dragging Support
    const selfObj = this;
    Draggable.create(this.track, {
      type: "x",
      onPress() {
        selfObj.startProgress = selfObj.playhead.progress;
      },
      onDrag() {
        const delta = (this.startX - this.x) * 0.003;
        const target = gsap.utils.clamp(0, numCards - 1, selfObj.startProgress + delta);
        selfObj.scrubTween.vars.progress = target;
        selfObj.scrubTween.invalidate().restart();
      }
    });

    // Arrow Button Navigation
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevCard());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextCard());
    }

    // Dot Indicators Click Navigation
    if (this.dots && this.dots.length) {
      this.dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
          this.goToStage(idx);
        });
      });
    }

    // Initialize to Card 0 (Stage 01) dead center
    this.goToStage(0);
  }

  renderCards(currentProgress) {
    const numCards = this.numCards;
    const clampedProgress = gsap.utils.clamp(0, numCards - 1, currentProgress);
    const activeIdx = Math.round(clampedProgress);

    this.currentIndex = activeIdx;

    this.cards.forEach((card, i) => {
      const diff = i - clampedProgress; // slot distance from focal center

      // Calculate 3D transforms based on exact distance from center
      const absDiff = Math.abs(diff);
      const scale = gsap.utils.clamp(0.65, 1.05, 1.05 - absDiff * 0.18);
      const opacity = gsap.utils.clamp(0, 1, 1 - absDiff * 0.45);
      const translateX = diff * 112; // percentage offset from center
      const zIndex = Math.round(100 - absDiff * 20);

      // Apply transform using GSAP set for 60fps performance
      gsap.set(card, {
        xPercent: translateX - 50, // -50 centers card on left: 50%
        yPercent: -50,
        scale: scale,
        opacity: opacity,
        zIndex: zIndex,
        transformOrigin: "center center"
      });

      card.classList.toggle('active', i === activeIdx);
    });

    // Update Dots Active State
    if (this.dots && this.dots.length) {
      this.dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIdx);
      });
    }
  }

  goToStage(idx) {
    const clampedIdx = gsap.utils.clamp(0, this.numCards - 1, idx);
    this.currentIndex = clampedIdx;
    this.scrubTween.vars.progress = clampedIdx;
    this.scrubTween.invalidate().restart();
  }

  nextCard() {
    this.goToStage(this.currentIndex + 1);
  }

  prevCard() {
    this.goToStage(this.currentIndex - 1);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaTimeline = new JourneyTimeline();
});
