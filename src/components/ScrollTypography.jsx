import React, { useEffect } from 'react';

export default function ScrollTypography() {
  useEffect(() => {
    // Instantiate ScrollTypographyEngine from js/components/scroll-typography.js logic
    const section = document.getElementById('hero-transition');
    const canvas = document.getElementById('typography-particle-canvas');
    if (!section) return;

    const sentences = Array.from(section.querySelectorAll('.typography-sentence'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas ? canvas.getContext('2d') : null;
    let particles = [];
    let mouseX = 0;
    let mouseY = 0;
    let animFrameId = null;

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = window.innerWidth < 768 ? 40 : 100;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          pulseSpeed: Math.random() * 0.02 + 0.005
        });
      }
    };

    const animateParticles = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += Math.sin(Date.now() * p.pulseSpeed) * 0.002;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x + mouseX, p.y + mouseY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, Math.min(0.6, p.opacity))})`;
        ctx.fill();
      }

      animFrameId = requestAnimationFrame(animateParticles);
    };

    const handleScroll = () => {
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight - window.innerHeight;
      if (sectionHeight <= 0) return;

      const rawProgress = -rect.top / sectionHeight;
      const progress = Math.max(0, Math.min(1, rawProgress));

      const totalSentences = sentences.length || 1;
      const step = 1 / totalSentences;
      let activeStageIdx = Math.min(totalSentences - 1, Math.floor(progress / step));
      if (progress >= 0.98) activeStageIdx = totalSentences - 1;

      sentences.forEach((sentence, idx) => {
        if (idx === activeStageIdx) {
          sentence.classList.add('active');

          const stageStart = idx * step;
          const stageEnd = (idx + 1) * step;
          const stageProgress = (progress - stageStart) / (stageEnd - stageStart);
          const clampedStageProgress = Math.max(0, Math.min(1, stageProgress));

          const words = Array.from(sentence.querySelectorAll('.typo-word'));
          const totalWords = words.length;

          const illuminatedCount = Math.floor(clampedStageProgress * (totalWords + 1));

          words.forEach((word, wordIdx) => {
            if (wordIdx < illuminatedCount || reducedMotion) {
              word.classList.add('illuminated');
            } else {
              word.classList.remove('illuminated');
            }
          });

        } else {
          sentence.classList.remove('active');
          const words = sentence.querySelectorAll('.typo-word');
          if (idx > activeStageIdx && !reducedMotion) {
            words.forEach(w => w.classList.remove('illuminated'));
          } else if (idx < activeStageIdx) {
            words.forEach(w => w.classList.add('illuminated'));
          }
        }
      });
    };

    const handleMouseMove = (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.03;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.03;
    };

    if (ctx) {
      resizeCanvas();
      createParticles();
      animateParticles();
      window.addEventListener('resize', resizeCanvas);
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section id="hero-transition" className="section-scroll-typography">
      <div className="typography-sticky-viewport">
        {/* Lightweight Canvas for Floating Stars / Depth Particles */}
        <canvas id="typography-particle-canvas"></canvas>

        <div className="typography-stage-container">
          {/* Sentence 1: 0 - 14% Scroll */}
          <div className="typography-sentence active" data-sentence="0">
            <span className="typo-word">A</span>
            <span className="typo-word">health</span>
            <span className="typo-word">crisis</span>
            <span className="typo-word">can</span>
            <span className="typo-word">feel</span>
            <span className="typo-word">overwhelming.</span>
          </div>

          {/* Sentence 2: 14 - 28% Scroll */}
          <div className="typography-sentence" data-sentence="1">
            <span className="typo-word">But</span>
            <span className="typo-word">no</span>
            <span className="typo-word">one</span>
            <span className="typo-word">should</span>
            <span className="typo-word">face</span>
            <span className="typo-word">it</span>
            <span className="typo-word">alone.</span>
          </div>

          {/* Sentence 3: 28 - 42% Scroll */}
          <div className="typography-sentence" data-sentence="2">
            <span className="typo-word">Awareness</span>
            <span className="typo-word">creates</span>
            <span className="typo-word">understanding.</span>
          </div>

          {/* Sentence 4: 42 - 57% Scroll */}
          <div className="typography-sentence" data-sentence="3">
            <span className="typo-word">Early</span>
            <span className="typo-word">detection</span>
            <span className="typo-word">creates</span>
            <span className="typo-word">possibilities.</span>
          </div>

          {/* Sentence 5: 57 - 71% Scroll */}
          <div className="typography-sentence" data-sentence="4">
            <span className="typo-word">Timely</span>
            <span className="typo-word">care</span>
            <span className="typo-word">creates</span>
            <span className="typo-word">second</span>
            <span className="typo-word">chances.</span>
          </div>

          {/* Sentence 6: 71 - 85% Scroll */}
          <div className="typography-sentence" data-sentence="5">
            <span className="typo-word">Compassion</span>
            <span className="typo-word">creates</span>
            <span className="typo-word">strength.</span>
          </div>

          {/* Sentence 7: 85 - 100% Scroll (Final Statement) */}
          <div className="typography-sentence final-sentence" data-sentence="6">
            <div className="final-headline">
              <span className="typo-word">Together,</span>
              <span className="typo-word">we</span>
              <span className="typo-word">create</span>
              <span className="typo-word accent-word">hope.</span>
            </div>
            <div className="final-sub-caption">
              <span>AVINYA CARE FOUNDATION</span>
              <span className="dot-sep">•</span>
              <span>Awareness • Early Detection • Compassionate Care</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
