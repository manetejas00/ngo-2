import React from 'react';
import { useModal } from '../context/ModalContext';

export default function GetInvolved() {
  const { openModal } = useModal();

  return (
    <>
      {/* 12. MAKE A DIFFERENCE SECTION (DEEP BLACK #0A0A0A & BRAND RED) */}
      <section id="get-involved" className="section-get-involved">
        <div className="section-header-center">
          <span className="category-tag category-tag-dark">MAKE A DIFFERENCE</span>
          <h2 className="section-title section-title-dark">Your support can help someone take the next step.</h2>
          <p className="body-large-dark">
            Your contribution helps us build awareness, encourage early screening, and support people affected by health crises across the Mumbai-Virar region.
          </p>
        </div>

        <div className="action-grid">
          {/* Donate / Make a Difference Card (Brand Red Accent) */}
          <div className="action-card donate-theme">
            <div>
              <span className="category-tag category-tag-dark" style={{ color: '#FFFFFF' }}>DIRECT IMPACT</span>
              <h3 className="action-title">Make a Difference</h3>
              <p className="action-desc">
                Fund early diagnostic screening camps, dialysis assistance, cataract surgeries, and patient care packages.
              </p>

              <div className="indian-pay-badges">
                <span className="pay-pill">₹ INR</span>
                <span className="pay-pill">UPI</span>
                <span className="pay-pill">GPay</span>
                <span className="pay-pill">PhonePe</span>
                <span className="pay-pill">Net Banking</span>
                <span className="pay-pill">80G Tax Receipt</span>
              </div>
            </div>

            <button className="btn-primary" style={{ background: '#FFFFFF', color: 'var(--brand)', width: '100%', justifyContent: 'center' }} onClick={() => openModal('donate-modal')}>
              <span>Make a Difference →</span>
            </button>
          </div>

          {/* Volunteer Card */}
          <div className="action-card volunteer-theme">
            <div>
              <span className="category-tag category-tag-dark">JOIN OUR NETWORK</span>
              <h3 className="action-title" style={{ color: '#FFFFFF' }}>Become a Volunteer</h3>
              <p className="action-desc" style={{ color: 'var(--text-light-muted)' }}>
                Join our care navigation team, assist in community screening drives, or provide bedside patient companionship.
              </p>
            </div>

            <button className="btn-secondary btn-secondary-dark" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openModal('volunteer-modal')}>
              <span>Volunteer Application →</span>
            </button>
          </div>

          {/* Partner Card */}
          <div className="action-card awareness-theme">
            <div>
              <span className="category-tag category-tag-dark">CORPORATE & CSR</span>
              <h3 className="action-title" style={{ color: '#FFFFFF' }}>Partner With Us</h3>
              <p className="action-desc" style={{ color: 'var(--text-light-muted)' }}>
                Sponsor diagnostic labs, mobile screening vans, and regional community healthcare initiatives.
              </p>
            </div>

            <button className="btn-secondary btn-secondary-dark" style={{ width: '100%', justifyContent: 'center' }} onClick={() => openModal('csr-modal')}>
              <span>CSR Partnership →</span>
            </button>
          </div>
        </div>
      </section>

      {/* 13. NESTJS-STYLE MINIMALIST PREMIUM FINALE CTA SECTION */}
      <section className="section-final-cta">
        <div className="cta-box">
          <div className="eyebrow-pill" style={{ margin: '0 auto 1.25rem' }}>
            <img src="assets/logo-emblem.png" alt="" className="pill-logo-emblem" />
            <span>AVINYA CARE FOUNDATION</span>
          </div>
          <h2 className="display-title">No one should face a health crisis alone.</h2>
          <p className="cta-subtitle">Together, we create hope.</p>

          <div className="cta-actions">
            <button className="btn-primary" style={{ padding: '1.05rem 2.6rem', fontSize: '1.05rem' }} onClick={() => openModal('support-modal')}>
              <span>Get Patient Support →</span>
            </button>
            <button className="btn-secondary btn-secondary-dark" style={{ padding: '1.05rem 2.6rem', fontSize: '1.05rem' }} onClick={() => openModal('donate-modal')}>
              <span>Make a Difference →</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
