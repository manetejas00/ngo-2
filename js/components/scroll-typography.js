/**
 * Avinya Care Foundation - NestJS Cinematic Scroll Typography & Floating Particle Engine
 * Word-by-word scroll-controlled text illumination with smooth sentence cross-fading & particle parallax.
 */

class ScrollTypographyEngine {
  constructor() {
    this.section = document.getElementById('hero-transition');
    this.canvas = document.getElementById('typography-particle-canvas');
    if (!this.section) return;

    this.sentences = Array.from(this.section.querySelectorAll('.typography-sentence'));
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.currentSentenceIdx = -1;

    this.init();
  }

  init() {
    // 1. Particle Canvas Setup
    if (this.ctx) {
      this.resizeCanvas();
      this.createParticles();
      window.addEventListener('resize', () => {
        this.resizeCanvas();
        this.createParticles();
      });

      window.addEventListener('mousemove', (e) => {
        this.mouseX = (e.clientX - window.innerWidth / 2) * 0.03;
        this.mouseY = (e.clientY - window.innerHeight / 2) * 0.03;
      }, { passive: true });

      this.animateParticles();
    }

    // 2. Scroll Listener
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', () => {
      requestAnimationFrame(this.handleScroll);
    }, { passive: true });

    // Initial Trigger
    this.handleScroll();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    const count = window.innerWidth < 768 ? 40 : 100;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.005
      });
    }
  }

  animateParticles() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.002;

      // Wrap-around bounds
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x + this.mouseX, p.y + this.mouseY, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, Math.min(0.6, p.opacity))})`;
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animateParticles());
  }

  handleScroll() {
    if (!this.section) return;

    const rect = this.section.getBoundingClientRect();
    const sectionHeight = this.section.offsetHeight - window.innerHeight;
    if (sectionHeight <= 0) return;

    // Calculate normalized scroll progress [0.0 to 1.0] inside Section 3
    const rawProgress = -rect.top / sectionHeight;
    const progress = Math.max(0, Math.min(1, rawProgress));

    // Define 6 sentence timeline intervals
    const stages = [
      { start: 0.00, end: 0.18 }, // Sentence 0: Cancer can feel overwhelming.
      { start: 0.18, end: 0.36 }, // Sentence 1: But no one should face it alone.
      { start: 0.36, end: 0.54 }, // Sentence 2: Awareness creates understanding.
      { start: 0.54, end: 0.72 }, // Sentence 3: Early detection creates possibilities.
      { start: 0.72, end: 0.86 }, // Sentence 4: Support creates strength.
      { start: 0.86, end: 1.00 }  // Sentence 5: Together, we create hope.
    ];

    let activeStageIdx = 0;
    for (let i = 0; i < stages.length; i++) {
      if (progress >= stages[i].start && progress <= stages[i].end) {
        activeStageIdx = i;
        break;
      }
    }
    if (progress > 0.98) activeStageIdx = 5;

    // Toggle Active Sentence Visibility
    this.sentences.forEach((sentence, idx) => {
      if (idx === activeStageIdx) {
        sentence.classList.add('active');

        // Sub-stage calculation for Word-by-Word Illumination
        const stage = stages[idx];
        const stageProgress = (progress - stage.start) / (stage.end - stage.start);
        const clampedStageProgress = Math.max(0, Math.min(1, stageProgress));

        const words = Array.from(sentence.querySelectorAll('.typo-word'));
        const totalWords = words.length;

        // Determine how many words are illuminated based on sub-progress
        const illuminatedCount = Math.floor(clampedStageProgress * (totalWords + 1));

        words.forEach((word, wordIdx) => {
          if (wordIdx < illuminatedCount || this.reducedMotion) {
            word.classList.add('illuminated');
          } else {
            word.classList.remove('illuminated');
          }
        });

      } else {
        sentence.classList.remove('active');
        // Reset non-active sentence words if scrolling backwards
        const words = sentence.querySelectorAll('.typo-word');
        if (idx > activeStageIdx && !this.reducedMotion) {
          words.forEach(w => w.classList.remove('illuminated'));
        } else if (idx < activeStageIdx) {
          words.forEach(w => w.classList.add('illuminated'));
        }
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaScrollTypography = new ScrollTypographyEngine();
});
