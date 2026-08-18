/**
 * Avinya Care Foundation - NestJS Champion CTA Manifesto Engine
 * Handles word-by-word scroll text illumination, 5-stage node sequence, central organic heart glow, and interactive particle depth.
 */

class ChampionManifestoEngine {
  constructor() {
    this.section = document.getElementById('champion-cta');
    this.canvas = document.getElementById('champion-particle-canvas');
    if (!this.section) return;

    this.words = Array.from(this.section.querySelectorAll('.champion-word'));
    this.nodes = Array.from(this.section.querySelectorAll('.champion-node'));
    this.centerHeart = this.section.querySelector('.center-heart-glow');
    this.finalPayoff = this.section.querySelector('.champion-final-payoff');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;

    this.init();
  }

  init() {
    // 1. Canvas Setup
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

    // 2. Node Mouse Proximity Hover Effects
    this.nodes.forEach(node => {
      node.addEventListener('mouseenter', () => {
        node.classList.add('hovered');
      });
      node.addEventListener('mouseleave', () => {
        node.classList.remove('hovered');
      });
    });

    // 3. Scroll Listener for Storytelling & Node Illumination
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', () => {
      requestAnimationFrame(this.handleScroll);
    }, { passive: true });

    this.handleScroll();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    const count = window.innerWidth < 768 ? 35 : 90;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 1.6 + 0.5,
        opacity: Math.random() * 0.45 + 0.1,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        pulseSpeed: Math.random() * 0.015 + 0.005
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

      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x + this.mouseX, p.y + this.mouseY, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(98, 181, 159, ${Math.max(0.05, Math.min(0.65, p.opacity))})`;
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animateParticles());
  }

  handleScroll() {
    if (!this.section) return;

    const rect = this.section.getBoundingClientRect();
    const sectionHeight = this.section.offsetHeight - window.innerHeight;
    if (sectionHeight <= 0) return;

    // Calculate progress inside Champion section [0.0 to 1.0]
    const rawProgress = -rect.top / sectionHeight;
    const progress = Math.max(0, Math.min(1, rawProgress));

    // 1. Word-by-Word Scroll Reveal
    const totalWords = this.words.length;
    const illuminatedCount = Math.floor(progress * (totalWords + 1));

    this.words.forEach((word, idx) => {
      if (idx < illuminatedCount || this.reducedMotion) {
        word.classList.add('illuminated');
      } else {
        word.classList.remove('illuminated');
      }
    });

    // 2. 5-Stage Node Illumination Sequence (0.1 to 0.9 progress)
    // Nodes: 0: LEARN, 1: DETECT, 2: SUPPORT, 3: SHARE, 4: HOPE
    const stageThresholds = [0.15, 0.32, 0.48, 0.65, 0.82];

    this.nodes.forEach((node, idx) => {
      if (progress >= stageThresholds[idx] || this.reducedMotion) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    // 3. Central Heart & Final Payoff Glow (0.85+ progress)
    if (progress > 0.82 || this.reducedMotion) {
      if (this.centerHeart) this.centerHeart.classList.add('glowing');
      if (this.finalPayoff) this.finalPayoff.classList.add('active');
    } else {
      if (this.centerHeart) this.centerHeart.classList.remove('glowing');
      if (this.finalPayoff) this.finalPayoff.classList.remove('active');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.AvinyaChampionManifesto = new ChampionManifestoEngine();
});
