import React, { useEffect } from 'react';

export default function ScrollTypography() {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.ScrollTypographyEngine) {
        window.AvinyaScrollTypography = new window.ScrollTypographyEngine();
      }
    }, 100);
    return () => clearTimeout(timer);
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
