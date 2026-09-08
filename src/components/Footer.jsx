import React from 'react';
import { useModal } from '../context/ModalContext';

export default function Footer() {
  const { openModal } = useModal();

  return (
    <>
      {/* 14. NESTJS-INSPIRED MINIMAL FOOTER (DEEP BLACK #0A0A0A) */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-brand-badge">
              <img src="assets/logo-white.png" alt="Avinya Care Foundation" className="footer-brand-logo" />
              <div>
                <div className="footer-brand">Avinya Care Foundation</div>
                <p className="footer-tagline">No one should face a health crisis alone.</p>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-light-sub)', lineHeight: 1.6 }}>
              Registered Non-Profit Indian Humanitarian Organization.<br />
              80G • 12A • CSR-1 • NITI Aayog Darpan Registered.<br />
              Location: Mumbai-Virar, Maharashtra
            </p>
          </div>

          <div>
            <h4 className="footer-heading">Explore</h4>
            <ul className="footer-links">
              <li><a href="#hero" className="footer-link">About</a></li>
              <li><a href="/doctors" className="footer-link" style={{ color: 'var(--brand)', fontWeight: 700 }}>Doctors &amp; Tests</a></li>
              <li><a href="#what-we-do" className="footer-link">What We Do</a></li>
              <li><a href="#stories" className="footer-link">Stories</a></li>
              <li><a href="#impact" className="footer-link">Impact</a></li>
              <li><a href="#news" className="footer-link">News</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Get Involved</h4>
            <ul className="footer-links">
              <li><a href="#get-involved" className="footer-link" onClick={() => openModal('donate-modal')}>Make a Difference</a></li>
              <li><a href="#get-involved" className="footer-link" onClick={() => openModal('volunteer-modal')}>Volunteer</a></li>
              <li><a href="#get-involved" className="footer-link" onClick={() => openModal('csr-modal')}>CSR</a></li>
              <li><a href="#get-involved" className="footer-link" onClick={() => openModal('csr-modal')}>Partner</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Contact &amp; Support</h4>
            <ul className="footer-links">
              <li><a href="tel:+917447441116" className="footer-link">Helpline: +91 74474 41116</a></li>
              <li><a href="mailto:info@avinyacarefoundation.com" className="footer-link">Email: info@avinyacarefoundation.com</a></li>
              <li><a href="https://wa.me/917447441116" target="_blank" rel="noopener noreferrer" className="footer-link">WhatsApp: wa.me/917447441116</a></li>
              <li><span className="footer-link" style={{ opacity: 0.85 }}>Mumbai-Virar, Maharashtra</span></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-heading">Legal &amp; Compliance</h4>
            <ul className="footer-links">
              <li><a href="#privacy" className="footer-link" onClick={(e) => { e.preventDefault(); openModal('privacy-modal'); }}>Privacy Policy</a></li>
              <li><a href="#terms" className="footer-link" onClick={(e) => { e.preventDefault(); openModal('terms-modal'); }}>Terms of Service</a></li>
              <li><a href="#compliance" className="footer-link" onClick={(e) => { e.preventDefault(); openModal('compliance-modal'); }}>80G • 12A • CSR-1 • Darpan</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 Avinya Care Foundation. All rights reserved. | Mumbai-Virar, Maharashtra</div>
          <div>Confidential Helpline: <a href="tel:+917447441116" style={{ color: '#FFFFFF', fontWeight: 700 }}>+91 74474 41116</a> | Email: <a href="mailto:info@avinyacarefoundation.com" style={{ color: '#FFFFFF' }}>info@avinyacarefoundation.com</a></div>
        </div>
      </footer>

      {/* Floating WhatsApp Support Button */}
      <a href="https://wa.me/917447441116" target="_blank" rel="noopener noreferrer" className="whatsapp-float-btn" aria-label="Chat with Support on WhatsApp">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-.981z"/>
        </svg>
        <span>Need support? Chat on WhatsApp</span>
      </a>
    </>
  );
}
