import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DoctorsPage() {
  useEffect(() => {
    document.title = 'Doctors & Diagnostic Tests | Avinya Care Foundation';
    if (window.DoctorsCanvasEngine && document.getElementById('doctors-canvas')) {
      new window.DoctorsCanvasEngine();
    }
  }, []);

  return (
    <div className="healthcare-page-body" style={{ backgroundColor: 'var(--hc-bg, #0B0F1D)', color: 'var(--hc-text-main, #FFFFFF)', minHeight: '100vh' }}>
      <Header />
      
      {/* Healthcare Doctors Hero Banner */}
      <section className="hc-hero-scroll-wrapper" style={{ padding: '8rem 2rem 4rem', textAlign: 'center', background: '#0B0F1D', position: 'relative' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="eyebrow-pill" style={{ margin: '0 auto 1.5rem', background: 'rgba(98,181,159,0.15)', color: '#62B59F', border: '1px solid rgba(98,181,159,0.3)' }}>
            <span>AVINYA HEALTH CONNECT</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.5rem', color: '#FFFFFF' }}>
            Book Appointments with Certified Specialists
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            Connect with leading oncologists, general physicians, and access subsidized diagnostic health tests across Mumbai &amp; Virar.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#hc-doctors-anchor" className="btn-primary" style={{ padding: '1rem 2.2rem' }}>
              <span>Explore Specialists ↓</span>
            </a>
            <a href="#hc-tests-anchor" className="btn-secondary btn-secondary-dark" style={{ padding: '1rem 2.2rem' }}>
              <span>View Diagnostic Tests ↓</span>
            </a>
          </div>
        </div>
      </section>

      {/* Specialists Section */}
      <section id="hc-doctors-anchor" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: '#FFFFFF' }}>Partner Oncologists &amp; Physicians</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Experienced specialists dedicated to compassionate patient navigation and early treatment.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Doctor 1 */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Surgical Oncology</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFFFFF' }}>Dr. Ananya Iyer</h3>
              <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                15+ years experience in breast and head-neck surgical oncology. Partner doctor for Avinya Care early screening drives.
              </p>
            </div>
            <a href="tel:+917447441116" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Book Consultation</a>
          </div>

          {/* Doctor 2 */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#62B59F', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Medical Oncology</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFFFFF' }}>Dr. Rajesh K. Varma</h3>
              <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Specialist in targeted chemotherapy, immunotherapy protocols, and integrative symptom management.
              </p>
            </div>
            <a href="tel:+917447441116" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Book Consultation</a>
          </div>

          {/* Doctor 3 */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F58220', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Preventive Cardiology</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#FFFFFF' }}>Dr. Priya Sharma</h3>
              <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Expert in cardiac risk screening, blood pressure monitoring, and early diagnostic checkups.
              </p>
            </div>
            <a href="tel:+917447441116" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Book Consultation</a>
          </div>
        </div>
      </section>

      {/* Diagnostic Tests Section */}
      <section id="hc-tests-anchor" style={{ padding: '6rem 2rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: '#FFFFFF' }}>Subsidized Diagnostic Tests</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Early screening packages and essential pathology tests available at subsidized rates.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: '#141716', border: '1px solid rgba(255,255,255,0.1)', padding: '1.8rem', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>Complete Mammogram Screening</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>High-resolution bilateral breast mammography.</p>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand)' }}>Subsidized / Free</div>
            </div>

            <div style={{ background: '#141716', border: '1px solid rgba(255,255,255,0.1)', padding: '1.8rem', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>Oral Visual AI Checkup</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>Early detection screening for oral mucosal lesions.</p>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#62B59F' }}>Free at Camps</div>
            </div>

            <div style={{ background: '#141716', border: '1px solid rgba(255,255,255,0.1)', padding: '1.8rem', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>Comprehensive Blood Panel</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>CBC, Lipid Profile, LFT, KFT &amp; HbA1c testing.</p>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F58220' }}>Subsidized</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
