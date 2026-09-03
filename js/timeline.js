/**
 * Avinya Care Foundation - GSAP 3D Card Deck Controller
 * Controls Section 6 (#journey - "Every step of your health journey.")
 * Perfect 100% dead-center focal alignment with responsive scroll scrubbing on both Mobile & Desktop.
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
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
    if (typeof Draggable !== 'undefined') {
      gsap.registerPlugin(Draggable);
    }

    const numCards = this.numCards;
    const isMobile = window.innerWidth <= 768;

    // Smooth scrub tween for card transitions
    this.scrubTween = gsap.to(this.playhead, {
      progress: 0,
      onUpdate: () => {
        this.renderCards(this.playhead.progress);
      },
      duration: 0.45,
      ease: "power2.out",
      paused: true
    });

    // ScrollTrigger: Desktop pins & scrubs, Mobile changes cards cleanly on page scroll
    if (typeof ScrollTrigger !== 'undefined') {
      const selfObj = this;
      this.trigger = ScrollTrigger.create({
        trigger: '#journey',
        start: isMobile ? 'top 70%' : 'top top',
        end: isMobile ? 'bottom 30%' : '+=1600',
        pin: !isMobile,
        anticipatePin: 1,
        onUpdate: (self) => {
          if (isMobile) {
            // Mobile: Step cleanly to integer card stage as section passes through screen
            const rawProgress = self.progress * (numCards - 1);
            const activeCard = gsap.utils.clamp(0, numCards - 1, Math.round(rawProgress));
            if (activeCard !== selfObj.currentIndex) {
              selfObj.goToStage(activeCard);
            }
          } else {
            // Desktop: Smooth 3D scrub timeline with pinned section
            const normProgress = gsap.utils.clamp(0, 1, self.progress / 0.85);
            const targetProgress = normProgress * (numCards - 1);
            selfObj.scrubTween.vars.progress = targetProgress;
            selfObj.scrubTween.invalidate().restart();
          }
        }
      });
    }

    // Touch & Mouse Dragging Support with Snap on Drag Release
    if (typeof Draggable !== 'undefined') {
      const selfObj = this;
      Draggable.create(this.track, {
        type: "x",
        allowNativeTouchScrolling: true,
        onPress() {
          selfObj.startProgress = selfObj.playhead.progress;
        },
        onDrag() {
          const delta = (this.startX - this.x) * 0.003;
          const target = gsap.utils.clamp(0, numCards - 1, selfObj.startProgress + delta);
          selfObj.playhead.progress = target;
          selfObj.renderCards(target);
        },
        onDragEnd() {
          const closestCard = Math.round(selfObj.playhead.progress);
          selfObj.goToStage(closestCard);
        }
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
