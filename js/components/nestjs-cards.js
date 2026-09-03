/**
 * Avinya Care Foundation - GSAP Infinite Seamless 3D Carousel Card Deck
 * Inspired by GreenSock (GreenSock/pen/RwKwLWK)
 * Seamless 3D card carousel scrubbing with ScrollTrigger, Draggable, and dot indicators.
 */

class NestJSSeamlessCardDeck {
  constructor() {
    this.stackContainer = document.getElementById('nestjs-card-stack');
    if (!this.stackContainer) return;

    this.cards = Array.from(this.stackContainer.querySelectorAll('.nestjs-stack-card'));
    this.dots = Array.from(document.querySelectorAll('#journey-stage-dots .journey-dot'));
    
    this.iteration = 0;
    this.spacing = 0.14;
    this.tl = null;
    this.seamlessLoop = null;
    this.scrub = null;
    this.trigger = null;

    this.init();
  }

  init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger, Draggable);

    const cards = this.cards;
    const spacing = this.spacing;

    // Set initial card states
    gsap.set(cards, { xPercent: 320, opacity: 0, scale: 0.5 });

    // Individual card 3D path animation function
    const animateFunc = (element) => {
      const tl = gsap.timeline();
      tl.fromTo(element, 
        { scale: 0.7, opacity: 0.3, zIndex: 1 }, 
        { scale: 1.05, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.inOut", immediateRender: false }
      ).fromTo(element, 
        { xPercent: 320 }, 
        { xPercent: -320, duration: 1, ease: "none", immediateRender: false }, 
        0
      );
      return tl;
    };

    this.seamlessLoop = this.buildSeamlessLoop(cards, spacing, animateFunc);

    const playhead = { offset: 0 };
    const wrapTime = gsap.utils.wrap(0, this.seamlessLoop.duration());

    this.scrub = gsap.to(playhead, {
      offset: 0,
      onUpdate: () => {
        this.seamlessLoop.time(wrapTime(playhead.offset));
        this.updateActiveDot(playhead.offset);
      },
      duration: 0.5,
      ease: "power3",
      paused: true
    });

    this.trigger = ScrollTrigger.create({
      trigger: '#what-we-do',
      start: 'top top',
      end: '+=2500',
      pin: true,
      onUpdate: (self) => {
        const scroll = self.scroll();
        if (scroll > self.end - 1) {
          this.wrap(1, 2);
        } else if (scroll < 1 && self.direction < 0) {
          this.wrap(-1, self.end - 2);
        } else {
          this.scrub.vars.offset = (this.iteration + self.progress) * this.seamlessLoop.duration();
          this.scrub.invalidate().restart();
        }
      }
    });

    // Auto-snap on scroll end
    ScrollTrigger.addEventListener("scrollEnd", () => this.scrollToOffset(this.scrub.vars.offset));

    // Touch & Mouse Drag support
    const selfObj = this;
    Draggable.create(this.stackContainer, {
      type: "x",
      onPress() {
        selfObj.startOffset = selfObj.scrub.vars.offset;
      },
      onDrag() {
        selfObj.scrub.vars.offset = selfObj.startOffset + (this.startX - this.x) * 0.0015;
        selfObj.scrub.invalidate().restart();
      },
      onDragEnd() {
        selfObj.scrollToOffset(selfObj.scrub.vars.offset);
      }
    });

    // Progress Dot Clicks
    if (this.dots && this.dots.length) {
      this.dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
          const targetOffset = idx * spacing;
          this.scrollToOffset(targetOffset);
        });
      });
    }
  }

  updateActiveDot(offset) {
    if (!this.dots || !this.dots.length) return;
    const cardCount = this.cards.length;
    const wrappedOffset = gsap.utils.wrap(0, this.seamlessLoop.duration(), offset);
    const activeIdx = Math.floor((wrappedOffset / this.seamlessLoop.duration()) * cardCount) % cardCount;

    this.dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeIdx);
    });
  }

  progressToScroll(progress) {
    return gsap.utils.clamp(1, this.trigger.end - 1, gsap.utils.wrap(0, 1, progress) * this.trigger.end);
  }

  wrap(iterationDelta, scrollTo) {
    this.iteration += iterationDelta;
    this.trigger.scroll(scrollTo);
    this.trigger.update();
  }

  scrollToOffset(offset) {
    const snapTime = gsap.utils.snap(this.spacing);
    const snappedTime = snapTime(offset);
    const progress = (snappedTime - this.seamlessLoop.duration() * this.iteration) / this.seamlessLoop.duration();
    const scroll = this.progressToScroll(progress);
    if (progress >= 1 || progress < 0) {
      return this.wrap(Math.floor(progress), scroll);
    }
    this.trigger.scroll(scroll);
  }

  buildSeamlessLoop(items, spacing, animateFunc) {
    const overlap = Math.ceil(1 / spacing);
    const startTime = items.length * spacing + 0.5;
    const loopTime = (items.length + overlap) * spacing + 1;
    const rawSequence = gsap.timeline({ paused: true });
    const seamlessLoop = gsap.timeline({
      paused: true,
      repeat: -1,
      onRepeat() {
        this._time === this._dur && (this._tTime += this._dur - 0.01);
      }
    });

    const l = items.length + overlap * 2;
    let time, i, index;

    for (i = 0; i < l; i++) {
      index = i % items.length;
      time = i * spacing;
      rawSequence.add(animateFunc(items[index]), time);
    }

    rawSequence.time(startTime);
    seamlessLoop.to(rawSequence, {
      time: loopTime,
      duration: loopTime - startTime,
      ease: "none"
    }).fromTo(rawSequence, { time: overlap * spacing + 1 }, {
      time: startTime,
      duration: startTime - (overlap * spacing + 1),
      immediateRender: false,
      ease: "none"
    });

    return seamlessLoop;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaNestJSCards = new NestJSSeamlessCardDeck();
});
