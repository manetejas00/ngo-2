import React, { useEffect, useRef } from 'react';
import { useModal } from '../context/ModalContext';

export default function OverlappingFanStack() {
  const { openModal } = useModal();
  const stackRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.NestJSCardStack && stackRef.current) {
        window.AvinyaNestJSCards = new window.NestJSCardStack();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="what-we-do" className="section-nestjs-stack">
      <div className="nestjs-stack-header">
        <div className="eyebrow-pill eyebrow-pill-dark" style={{ margin: '0 auto 1.25rem' }}>
          <img src="assets/logo-emblem.png" className="pill-logo-emblem" alt="Avinya Care Logo" />
          <span>AVINYA CARE INITIATIVES</span>
        </div>
        <h2 className="journey-section-title">
          Support at <span className="journey-accent-word">every step<span className="journey-accent-dot"></span></span> of the journey.
        </h2>
        <p className="journey-section-subtitle">
          From blood donation drives and dialysis assistance to cataract, cancer, and cardiac care across the Mumbai-Virar region.
        </p>
      </div>

      {/* NestJS Interactive Card Stack Viewport */}
      <div className="nestjs-stack-container" id="nestjs-card-stack" ref={stackRef}>
        
        {/* Card 01: Blood Donation Drives */}
        <div className="nestjs-stack-card" data-index="0" data-rot="-6" data-ty="12" tabIndex={0} onClick={() => openModal('volunteer-modal')}>
          <div className="stack-card-inner">
            <div className="stack-card-header">
              <span className="stack-card-badge">STAGE 01</span>
              <div className="stack-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z"/>
                  <path d="M12 8v8M8 12h8"/>
                </svg>
              </div>
            </div>
            <div className="stack-card-body">
              <h3 className="stack-card-title">Blood Donation Drives</h3>
              <p className="stack-card-desc">Every drop counts. Every drive saves lives. Regular community blood donation camps ensuring a steady, reliable supply for surgeries, emergencies, and long-term patient care.</p>
            </div>
            <div className="stack-card-footer">
              <div className="stack-card-action">
                <span>Explore Blood Drives</span>
                <span className="stack-arrow">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 02: Dialysis Assistance */}
        <div className="nestjs-stack-card" data-index="1" data-rot="-4" data-ty="-4" tabIndex={0} onClick={() => openModal('support-modal')}>
          <div className="stack-card-inner">
            <div className="stack-card-header">
              <span className="stack-card-badge">STAGE 02</span>
              <div className="stack-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
            </div>
            <div className="stack-card-body">
              <h3 className="stack-card-title">Dialysis Assistance</h3>
              <p className="stack-card-desc">Consistent care, without the financial strain. Subsidised dialysis sessions and logistics support, so patients never have to choose between treatment and travel.</p>
            </div>
            <div className="stack-card-footer">
              <div className="stack-card-action">
                <span>Dialysis Aid</span>
                <span className="stack-arrow">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 03: Cataract Care */}
        <div className="nestjs-stack-card" data-index="2" data-rot="-2" data-ty="14" tabIndex={0} onClick={() => openModal('guide-modal', { guideName: 'Cataract Care' })}>
          <div className="stack-card-inner">
            <div className="stack-card-header">
              <span className="stack-card-badge">STAGE 03</span>
              <div className="stack-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
                  <circle cx="12" cy="12" r="3.5"/>
                </svg>
              </div>
            </div>
            <div className="stack-card-body">
              <h3 className="stack-card-title">Cataract Care</h3>
              <p className="stack-card-desc">Restoring sight, restoring independence. Free screening camps and sponsored cataract surgeries for senior citizens across our community.</p>
            </div>
            <div className="stack-card-footer">
              <div className="stack-card-action">
                <span>Eye Care Camps</span>
                <span className="stack-arrow">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 04: Cancer Care */}
        <div className="nestjs-stack-card" data-index="3" data-rot="0" data-ty="-8" tabIndex={0} onClick={() => openModal('support-modal')}>
          <div className="stack-card-inner">
            <div className="stack-card-header">
              <span className="stack-card-badge">STAGE 04</span>
              <div className="stack-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  <path d="M11 8v6M8 11h6"/>
                </svg>
              </div>
            </div>
            <div className="stack-card-body">
              <h3 className="stack-card-title">Cancer Care</h3>
              <p className="stack-card-desc">Awareness today. Survival tomorrow. From early screening to full patient-family navigation — we walk beside every family through diagnosis and treatment.</p>
            </div>
            <div className="stack-card-footer">
              <div className="stack-card-action">
                <span>Patient Navigation</span>
                <span className="stack-arrow">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 05: Heart Care */}
        <div className="nestjs-stack-card" data-index="4" data-rot="2" data-ty="10" tabIndex={0} onClick={() => openModal('guide-modal', { guideName: 'Heart Care' })}>
          <div className="stack-card-inner">
            <div className="stack-card-header">
              <span className="stack-card-badge">STAGE 05</span>
              <div className="stack-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  <path d="M12 8v5M9.5 10.5h5"/>
                </svg>
              </div>
            </div>
            <div className="stack-card-body">
              <h3 className="stack-card-title">Heart Care</h3>
              <p className="stack-card-desc">Every heartbeat deserves attention. Preventive check-ups, early cardiac risk screening, and emergency awareness programs built for our region.</p>
            </div>
            <div className="stack-card-footer">
              <div className="stack-card-action">
                <span>Cardiac Health</span>
                <span className="stack-arrow">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 06: Early Detection */}
        <div className="nestjs-stack-card" data-index="5" data-rot="4" data-ty="-12" tabIndex={0} onClick={() => openModal('guide-modal', { guideName: 'Early Detection' })}>
          <div className="stack-card-inner">
            <div className="stack-card-header">
              <span className="stack-card-badge">STAGE 06</span>
              <div className="stack-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/>
                </svg>
              </div>
            </div>
            <div className="stack-card-body">
              <h3 className="stack-card-title">Early Detection</h3>
              <p className="stack-card-desc">Catch it before it becomes a crisis. Mobile diagnostic units and free clinical checkups bringing early detection directly to underserved communities.</p>
            </div>
            <div className="stack-card-footer">
              <div className="stack-card-action">
                <span>Screening Camps</span>
                <span className="stack-arrow">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 07: Compassionate Support */}
        <div className="nestjs-stack-card" data-index="6" data-rot="6" data-ty="8" tabIndex={0} onClick={() => openModal('support-modal')}>
          <div className="stack-card-inner">
            <div className="stack-card-header">
              <span className="stack-card-badge">STAGE 07</span>
              <div className="stack-card-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <div className="stack-card-body">
              <h3 className="stack-card-title">Compassionate Support</h3>
              <p className="stack-card-desc">No family walks alone. Helpline support, practical navigation, emotional counseling, and volunteer companionship through every stage of recovery.</p>
            </div>
            <div className="stack-card-footer">
              <div className="stack-card-action">
                <span>Join Support Network</span>
                <span className="stack-arrow">→</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Stage Dots Indicator Bar */}
      <div className="journey-stage-dots" id="journey-stage-dots">
        <button className="journey-dot active" data-stage="0" aria-label="Stage 1: Blood Donation"></button>
        <button className="journey-dot" data-stage="1" aria-label="Stage 2: Dialysis"></button>
        <button className="journey-dot" data-stage="2" aria-label="Stage 3: Cataract Care"></button>
        <button className="journey-dot" data-stage="3" aria-label="Stage 4: Cancer Care"></button>
        <button className="journey-dot" data-stage="4" aria-label="Stage 5: Heart Care"></button>
        <button className="journey-dot" data-stage="5" aria-label="Stage 6: Early Detection"></button>
        <button className="journey-dot" data-stage="6" aria-label="Stage 7: Compassionate Support"></button>
      </div>
    </section>
  );
}
