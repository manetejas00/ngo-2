import React, { useEffect } from 'react';
import { useModal } from '../context/ModalContext';

export default function StickyPanels() {
  const { openModal } = useModal();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.StackedPanelsEngine) {
        window.AvinyaStackedPanels = new window.StackedPanelsEngine();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="deep-dives" className="section-stacked-panels">
      <div className="stacked-panels-header">
        <span className="category-tag category-tag-dark">FEATURED CARE INITIATIVES</span>
        <h2 className="section-title section-title-dark">Empowering patients & communities.</h2>
        <p className="body-large-dark" style={{ maxWidth: '750px', margin: '0 auto' }}>
          Explore our core operational pillars designed for early detection, subsidized care, and compassionate navigation.
        </p>
      </div>

      <div className="stacked-panels-wrapper">
        {/* Panel 01: Deep Charcoal — BLOOD & CRITICAL CARE */}
        <div className="stacked-feature-panel dark-panel" data-panel="0">
          <div className="panel-header">
            <span className="panel-eyebrow">01 / BLOOD &amp; CRITICAL CARE</span>
            <h3 className="panel-title">Critical care within reach.</h3>
            <p className="panel-desc">
              Ensuring emergency blood supplies for surgeries and trauma care, alongside subsidized logistics and ongoing support for chronic dialysis patients across the region.
            </p>
            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => openModal('volunteer-modal')}>
              <span>Explore Blood &amp; Care Drives</span>
              <span className="arrow">→</span>
            </button>
          </div>

          <div className="panel-visual-frame">
            <img src="assets/initiatives/initiative-blood-drive.jpg" alt="Blood and Care Drive" className="panel-visual-image" loading="lazy" />
            <div className="panel-visual-overlay"></div>
          </div>
        </div>

        {/* Panel 02: Emerald Teal — VISION & PREVENTIVE HEALTH */}
        <div className="stacked-feature-panel teal-panel" data-panel="1">
          <div className="panel-header">
            <span className="panel-eyebrow">02 / VISION &amp; PREVENTIVE HEALTH</span>
            <h3 className="panel-title">Don't wait for symptoms.</h3>
            <p className="panel-desc">
              Free eye screening camps, sponsored cataract surgeries restoring sight for seniors, and preventive cardiovascular checkups catching cardiac risks early.
            </p>
            <button className="btn-primary" style={{ marginTop: '1.5rem', background: '#FFFFFF', color: 'var(--brand)' }} onClick={() => openModal('guide-modal', { guideName: 'Early Screening' })}>
              <span>View Screening Initiatives</span>
              <span className="arrow">→</span>
            </button>
          </div>

          <div className="panel-visual-frame">
            <img src="assets/initiatives/initiative-screening-camp.jpg" alt="Early Diagnostic Screening" className="panel-visual-image" loading="lazy" />
            <div className="panel-visual-overlay"></div>
          </div>
        </div>

        {/* Panel 03: Warm Cream — COMPASSIONATE ONCOLOGY & PATIENT CARE */}
        <div className="stacked-feature-panel light-panel" data-panel="2">
          <div className="panel-header">
            <span className="panel-eyebrow" style={{ color: 'var(--brand)' }}>03 / ONCOLOGY &amp; PATIENT CARE</span>
            <h3 className="panel-title" style={{ color: '#0B0D0C' }}>No one should face illness alone.</h3>
            <p className="panel-desc" style={{ color: '#404040' }}>
              Promoting cancer awareness, demystifying pathology reports, and walking beside patients and families with compassionate bedside companions and helpline navigation.
            </p>
            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => openModal('support-modal')}>
              <span>Get Patient Support</span>
              <span className="arrow">→</span>
            </button>
          </div>

          <div className="panel-visual-frame">
            <img src="assets/initiatives/initiative-patient-care.jpg" alt="Compassionate Care Navigator" className="panel-visual-image" loading="lazy" />
            <div className="panel-visual-overlay"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
