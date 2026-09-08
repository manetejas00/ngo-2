import React, { useEffect, useRef } from 'react';
import { useModal } from '../context/ModalContext';

export default function HeroCanvas() {
  const { openModal } = useModal();
  const canvasRef = useRef(null);

  useEffect(() => {
    // Initialize HeroCanvasEngine
    if (window.HeroCanvasEngine && canvasRef.current) {
      new window.HeroCanvasEngine();
    }
  }, []);

  return (
    <section id="hero" className="hero-scroll-container">
      <div className="hero-sticky-viewport">
        <canvas id="hero-canvas" ref={canvasRef}></canvas>
        <div className="hero-cinematic-overlay"></div>

        <div className="hero-overlay">
          {/* Frame 1: 0 - 15% Scroll (One Person) */}
          <div id="card-1" className="hero-narrative-card active">
            <div className="eyebrow-pill">
              <img src="assets/logo-emblem.png" alt="" className="pill-logo-emblem" />
              <span>AVINYA CARE FOUNDATION</span>
            </div>
            <h1 className="hero-title">No one should face a health crisis alone.</h1>
            <p className="hero-subtitle">
              Building awareness, encouraging early detection, and standing beside patients, caregivers, and communities across the Mumbai-Virar-Palghar-Vasai-Nalasopara belt.
            </p>
            <div className="hero-cta-group">
              <button className="btn-primary" onClick={() => openModal('support-modal')}>
                <span>Get Support</span>
                <span className="arrow">→</span>
              </button>
              <a href="#hero-transition" className="btn-secondary btn-secondary-dark">
                <span>Our Mission</span>
              </a>
            </div>
          </div>

          {/* Frame 2: 15 - 30% Scroll (Awareness) */}
          <div id="card-2" className="hero-narrative-card">
            <div className="eyebrow-pill">
              <span className="dot"></span>
              <span>01 / AWARENESS</span>
            </div>
            <h2 className="hero-title">Awareness sparks early action.</h2>
            <p className="hero-subtitle">Bringing life-saving health knowledge, early warning signs, and screening tools to every family.</p>
            <div className="hero-cta-group">
              <button className="btn-primary" onClick={() => openModal('guide-modal', { guideName: 'Health Awareness Toolkit' })}>
                <span>Explore Awareness Toolkit</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>

          {/* Frame 3: 30 - 45% Scroll (Screening Drives) */}
          <div id="card-3" className="hero-narrative-card">
            <div className="eyebrow-pill">
              <span className="dot"></span>
              <span>02 / EARLY SCREENING</span>
            </div>
            <h2 className="hero-title">Catching signs before symptoms appear.</h2>
            <p className="hero-subtitle">Mobile diagnostic camps and early detection initiatives empowering communities across the Mumbai-Virar belt.</p>
            <div className="hero-cta-group">
              <button className="btn-primary" onClick={() => openModal('guide-modal', { guideName: 'Early Screening' })}>
                <span>View Screening Guide</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>

          {/* Frame 4: 45 - 60% Scroll (Doctor & Patient Connection) */}
          <div id="card-4" className="hero-narrative-card">
            <div className="eyebrow-pill">
              <span className="dot"></span>
              <span>03 / PATIENT NAVIGATION</span>
            </div>
            <h2 className="hero-title">Guiding every step of the medical journey.</h2>
            <p className="hero-subtitle">Empowering patients and caregivers with clear treatment choices, medical clarity, and direct helpline support.</p>
            <div className="hero-cta-group">
              <button className="btn-primary" onClick={() => openModal('support-modal')}>
                <span>Talk to Care Navigator</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>

          {/* Frame 5: 60 - 75% Scroll (Community & Caregivers) */}
          <div id="card-5" className="hero-narrative-card">
            <div className="eyebrow-pill">
              <span className="dot"></span>
              <span>04 / CAREGIVER SUPPORT</span>
            </div>
            <h2 className="hero-title">Standing beside those who care.</h2>
            <p className="hero-subtitle">Counseling, practical guidance, and respite support for family caregivers walking the journey together.</p>
            <div className="hero-cta-group">
              <button className="btn-primary" onClick={() => openModal('volunteer-modal')}>
                <span>Join Care Network</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>

          {/* Frame 6: 75 - 90% Scroll (Hope & Community) */}
          <div id="card-6" className="hero-narrative-card">
            <div className="eyebrow-pill">
              <span className="dot"></span>
              <span>05 / SURVIVORSHIP & HOPE</span>
            </div>
            <h2 className="hero-title">A united community creates hope.</h2>
            <p className="hero-subtitle">Connecting patients, volunteers, and medical experts in a compassionate ecosystem of strength.</p>
            <div className="hero-cta-group">
              <button className="btn-primary" onClick={() => openModal('donate-modal')}>
                <span>Make a Difference</span>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>

          {/* Frame 7: 90 - 100% Scroll (Final Hero Statement) */}
          <div id="card-7" className="hero-narrative-card">
            <div className="eyebrow-pill">
              <span className="dot"></span>
              <span>TOGETHER FOR HEALTH</span>
            </div>
            <h2 className="hero-title">No one should face a health crisis alone.</h2>
            <p className="hero-subtitle">Building awareness, encouraging early detection, and standing beside patients, caregivers, and communities across the Mumbai-Virar-Palghar-Vasai-Nalasopara belt.</p>
            <div className="hero-cta-group">
              <button className="btn-primary" onClick={() => openModal('support-modal')}>
                <span>Get Support Now</span>
                <span className="arrow">→</span>
              </button>
              <button className="btn-secondary btn-secondary-dark" onClick={() => openModal('donate-modal')}>
                <span>Make a Difference</span>
              </button>
            </div>
          </div>
        </div>

        {/* Animated Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-mouse">
            <div className="scroll-wheel"></div>
          </div>
          <span>SCROLL TO EXPLORE</span>
        </div>
      </div>
    </section>
  );
}
