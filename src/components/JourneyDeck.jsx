import React, { useEffect } from 'react';
import { useModal } from '../context/ModalContext';

export default function JourneyDeck() {
  const { openModal } = useModal();

  useEffect(() => {
    if (window.JourneyTimeline) {
      new window.JourneyTimeline();
    }
  }, []);

  return (
    <>
      <section id="journey" className="section-journey">
        <div className="journey-sticky-viewport">
          <div className="journey-wrapper">
            <div className="nestjs-split-header">
              <div className="header-left">
                <span className="category-tag category-tag-dark">THE CONTINUUM OF CARE</span>
                <h2 className="section-title section-title-dark">Every step of your health journey.</h2>
              </div>
              <div className="header-right">
                <p className="body-large-dark">
                  Built on human compassion and clinical excellence, Avinya Care guides individuals through every milestone — keeping hope clear, accessible, and supported at every stage.
                </p>
              </div>
            </div>

            {/* NestJS Stacked 3D Overlapping Card Deck Carousel */}
            <div className="nestjs-card-deck-viewport">
              <div id="nestjs-card-deck-track" className="nestjs-card-deck-track">
                {/* Card 01: Blood Donation Drives */}
                <div className="nestjs-deck-card active" data-index="0" onClick={() => window.AvinyaTimeline?.goToStage(0, true)}>
                  <div className="card-3d-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z"/>
                      <path d="M12 8v8M8 12h8"/>
                    </svg>
                  </div>
                  <div>
                    <div className="card-step-num">01 / SERVICE</div>
                    <h3 className="card-deck-title">Blood Donation Drives</h3>
                    <p className="card-deck-desc">
                      Community-wide donation drives ensuring supply for surgeries, emergencies, and chronic care.
                    </p>
                  </div>
                  <button className="btn-primary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }} onClick={() => openModal('volunteer-modal')}>
                    <span>View Blood Drives →</span>
                  </button>
                </div>

                {/* Card 02: Dialysis Assistance */}
                <div className="nestjs-deck-card" data-index="1" onClick={() => window.AvinyaTimeline?.goToStage(1, true)}>
                  <div className="card-3d-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="card-step-num">02 / SERVICE</div>
                    <h3 className="card-deck-title">Dialysis Assistance</h3>
                    <p className="card-deck-desc">
                      Subsidised care and logistics support for regular dialysis patients.
                    </p>
                  </div>
                  <button className="btn-primary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }} onClick={() => openModal('support-modal')}>
                    <span>Get Dialysis Aid →</span>
                  </button>
                </div>

                {/* Card 03: Cataract Care */}
                <div className="nestjs-deck-card" data-index="2" onClick={() => window.AvinyaTimeline?.goToStage(2, true)}>
                  <div className="card-3d-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
                      <circle cx="12" cy="12" r="3.5"/>
                    </svg>
                  </div>
                  <div>
                    <div className="card-step-num">03 / SERVICE</div>
                    <h3 className="card-deck-title">Cataract Care</h3>
                    <p className="card-deck-desc">
                      Free screening camps and sponsored cataract surgeries for seniors.
                    </p>
                  </div>
                  <button className="btn-primary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }} onClick={() => openModal('guide-modal', { guideName: 'Cataract Care' })}>
                    <span>Find Eye Camps →</span>
                  </button>
                </div>

                {/* Card 04: Cancer Care */}
                <div className="nestjs-deck-card" data-index="3" onClick={() => window.AvinyaTimeline?.goToStage(3, true)}>
                  <div className="card-3d-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <path d="M11 8v6M8 11h6"/>
                    </svg>
                  </div>
                  <div>
                    <div className="card-step-num">04 / SERVICE</div>
                    <h3 className="card-deck-title">Cancer Care</h3>
                    <p className="card-deck-desc">
                      Awareness, early screening camps, and patient-family navigation.
                    </p>
                  </div>
                  <button className="btn-primary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }} onClick={() => openModal('support-modal')}>
                    <span>Cancer Support →</span>
                  </button>
                </div>

                {/* Card 05: Heart Care */}
                <div className="nestjs-deck-card" data-index="4" onClick={() => window.AvinyaTimeline?.goToStage(4, true)}>
                  <div className="card-3d-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      <path d="M12 8v5M9.5 10.5h5"/>
                    </svg>
                  </div>
                  <div>
                    <div className="card-step-num">05 / SERVICE</div>
                    <h3 className="card-deck-title">Heart Care</h3>
                    <p className="card-deck-desc">
                      Preventive check-ups, early cardiac risk screening, and emergency awareness.
                    </p>
                  </div>
                  <button className="btn-primary" style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }} onClick={() => openModal('guide-modal', { guideName: 'Heart Care' })}>
                    <span>Heart Checkups →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Controls & Progress Dots */}
            <div className="nestjs-deck-controls">
              <button className="deck-arrow-btn prev" onClick={() => window.AvinyaTimeline?.prevCard()} aria-label="Previous Stage">←</button>
              <div className="deck-dots">
                <span className="deck-dot active" onClick={() => window.AvinyaTimeline?.goToStage(0, true)}></span>
                <span className="deck-dot" onClick={() => window.AvinyaTimeline?.goToStage(1, true)}></span>
                <span className="deck-dot" onClick={() => window.AvinyaTimeline?.goToStage(2, true)}></span>
                <span className="deck-dot" onClick={() => window.AvinyaTimeline?.goToStage(3, true)}></span>
                <span className="deck-dot" onClick={() => window.AvinyaTimeline?.goToStage(4, true)}></span>
              </div>
              <button className="deck-arrow-btn next" onClick={() => window.AvinyaTimeline?.nextCard()} aria-label="Next Stage">→</button>
            </div>
          </div>
        </div>
      </section>

      {/* WHY IT MATTERS SECTION */}
      <section id="why-it-matters" className="section-stories" style={{ background: '#080A09', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '7rem 2rem' }}>
        <div className="section-header-center" style={{ maxWidth: '900px', margin: '0 auto 3.5rem' }}>
          <span className="category-tag category-tag-dark">WHY IT MATTERS</span>
          <h2 className="section-title section-title-dark" style={{ marginBottom: '1.25rem' }}>Early Detection Saves More Than Lives.</h2>
          <p className="body-large-dark" style={{ maxWidth: '780px', margin: '0 auto', color: 'var(--text-light-sub)', lineHeight: 1.7 }}>
            Late-stage cancer and heart treatment can cost families lakhs of rupees — and by then, outcomes are far less certain. A simple early screening test, costing a fraction of that, can catch warning signs years before symptoms appear. That's the difference our diagnostic centre is built to make.
          </p>
        </div>

        <div className="action-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Stat Card 1: 90% */}
          <div className="action-card" style={{ background: '#141716', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="category-tag" style={{ background: 'rgba(235,94,40,0.15)', color: 'var(--brand)', fontWeight: 700, border: '1px solid rgba(235,94,40,0.3)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-block', marginBottom: '1.25rem', fontSize: '0.75rem', letterSpacing: '0.08em' }}>SURVIVAL IMPACT</span>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand)', marginBottom: '0.75rem', lineHeight: 1.1 }}>90%</h3>
              <p style={{ color: 'var(--text-light-sub)', fontSize: '0.98rem', lineHeight: 1.6 }}>
                Higher survival rate when cancer is caught at Stage 1 vs Stage 4
              </p>
            </div>
          </div>

          {/* Stat Card 2: ₹5–10L+ */}
          <div className="action-card" style={{ background: '#141716', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '2.5rem 2rem', display: 'flex', flexDirect: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="category-tag" style={{ background: 'rgba(42,157,143,0.15)', color: '#2A9D8F', fontWeight: 700, border: '1px solid rgba(42,157,143,0.3)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-block', marginBottom: '1.25rem', fontSize: '0.75rem', letterSpacing: '0.08em' }}>FINANCIAL RELIEF</span>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#2A9D8F', marginBottom: '0.75rem', lineHeight: 1.1 }}>₹5–10L+</h3>
              <p style={{ color: 'var(--text-light-sub)', fontSize: '0.98rem', lineHeight: 1.6 }}>
                Potential treatment cost a family avoids by catching a condition early
              </p>
            </div>
          </div>

          {/* Stat Card 3: 100% */}
          <div className="action-card" style={{ background: '#141716', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="category-tag" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)', padding: '0.35rem 0.85rem', borderRadius: '999px', display: 'inline-block', marginBottom: '1.25rem', fontSize: '0.75rem', letterSpacing: '0.08em' }}>COMMUNITY PROMISE</span>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F59E0B', marginBottom: '0.75rem', lineHeight: 1.1 }}>100%</h3>
              <p style={{ color: 'var(--text-light-sub)', fontSize: '0.98rem', lineHeight: 1.6 }}>
                Reinvested into free &amp; subsidised screening drives across Mumbai-Virar
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
