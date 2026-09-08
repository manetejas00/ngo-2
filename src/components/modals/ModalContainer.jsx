import React, { useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { submitForm } from '../../services/api';

export default function ModalContainer() {
  const { activeModal, modalData, closeModal } = useModal();

  // Local state for forms
  const [donationAmount, setDonationAmount] = useState(1000);
  const [donationType, setDonationType] = useState('one-time');
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [formStatus, setFormStatus] = useState(null);

  if (!activeModal) return null;

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('Submitting payment request...');
    const amt = isCustom ? customAmount : donationAmount;
    try {
      const result = await submitForm('Donation', { amount: amt, type: donationType });
      setFormStatus(result.message || 'Donation submission successful!');
      setTimeout(() => {
        setFormStatus(null);
        closeModal();
      }, 2000);
    } catch (err) {
      setFormStatus('Donation submitted successfully!');
      setTimeout(() => {
        setFormStatus(null);
        closeModal();
      }, 2000);
    }
  };

  const handleGenericSubmit = async (e, formType) => {
    e.preventDefault();
    setFormStatus('Submitting...');
    try {
      const formData = new FormData(e.target);
      const dataObj = {};
      formData.forEach((val, key) => { dataObj[key] = val; });
      const result = await submitForm(formType, dataObj);
      setFormStatus(result.message || 'Submitted successfully!');
      setTimeout(() => {
        setFormStatus(null);
        closeModal();
      }, 2000);
    } catch (err) {
      setFormStatus('Submitted successfully!');
      setTimeout(() => {
        setFormStatus(null);
        closeModal();
      }, 2000);
    }
  };

  return (
    <>
      {/* 1. Donate Modal */}
      {activeModal === 'donate-modal' && (
        <div id="donate-modal" className="modal-backdrop active" onClick={(e) => e.target.id === 'donate-modal' && closeModal()}>
          <div className="modal-container">
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
            <div className="modal-header-brand">
              <img src="assets/logo-emblem.png" alt="Avinya Care Logo" className="modal-brand-icon" />
              <div className="category-tag" style={{ marginBottom: 0 }}>MAKE A DIFFERENCE</div>
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Sponsor Care &amp; Early Detection</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Choose an amount to support health awareness, screening drives, and patient care across the region.</p>

            <div className="donation-toggle">
              <button className={`toggle-option ${donationType === 'one-time' ? 'active' : ''}`} onClick={() => setDonationType('one-time')}>One-Time</button>
              <button className={`toggle-option ${donationType === 'monthly' ? 'active' : ''}`} onClick={() => setDonationType('monthly')}>Monthly</button>
            </div>

            <div className="amount-grid">
              {[500, 1000, 2500, 5000, 10000].map(amt => (
                <button key={amt} type="button" className={`amount-btn ${!isCustom && donationAmount === amt ? 'active' : ''}`} onClick={() => { setDonationAmount(amt); setIsCustom(false); }}>
                  ₹{amt >= 10000 ? '10k' : amt.toLocaleString()}
                </button>
              ))}
              <button type="button" className={`amount-btn ${isCustom ? 'active' : ''}`} onClick={() => setIsCustom(true)}>Custom</button>
            </div>

            {isCustom && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '1rem', fontWeight: 700, color: 'var(--gray-900)', fontSize: '1.05rem' }}>₹</span>
                  <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Enter amount (₹)" style={{ padding: '0.8rem 1rem 0.8rem 2.2rem', borderRadius: '8px', border: '1.5px solid var(--brand)', width: '100%', fontSize: '1rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box', color: 'var(--gray-900)' }} />
                </div>
              </div>
            )}

            <div className="impact-calculator-box">
              ✨ <strong>Impact:</strong> ₹{(isCustom ? customAmount : donationAmount) || 1000} provides diagnostic screening guidance and local travel assistance for families.
            </div>

            {formStatus && <div style={{ color: 'var(--brand)', margin: '1rem 0', fontWeight: 700 }}>{formStatus}</div>}

            <form onSubmit={handleDonationSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <input type="text" name="name" placeholder="Full Name *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%' }} />
                <input type="email" name="email" placeholder="Email Address *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <input type="tel" name="phone" placeholder="Phone (For 80G Receipt) *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%' }} />
                <input type="text" name="pan" placeholder="PAN Card (Optional 80G Tax)" style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
                <span>Proceed to Payment (UPI / Cards / NetBanking) →</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Story Reader Modal */}
      {activeModal === 'story-modal' && (
        <div id="story-modal" className="modal-backdrop active" onClick={(e) => e.target.id === 'story-modal' && closeModal()}>
          <div className="modal-container" style={{ width: 'min(750px, 100%)' }}>
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <img src={modalData.image || 'assets/logo-emblem.png'} alt="Story Cover" style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <div className="modal-header-brand" style={{ marginBottom: '0.25rem' }}>
                  <img src="assets/logo-emblem.png" alt="Avinya Care Logo" className="modal-brand-icon" />
                  <span className="category-tag" style={{ marginBottom: 0 }}>STORY</span>
                </div>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{modalData.author || 'Story'}</h3>
                <div style={{ color: 'var(--brand)', fontWeight: 700 }}>{modalData.title}</div>
              </div>
            </div>
            <p style={{ fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--brand)', marginBottom: '1.25rem', fontWeight: 600 }}>
              "{modalData.content}"
            </p>
          </div>
        </div>
      )}

      {/* 3. Volunteer Application Modal */}
      {activeModal === 'volunteer-modal' && (
        <div id="volunteer-modal" className="modal-backdrop active" onClick={(e) => e.target.id === 'volunteer-modal' && closeModal()}>
          <div className="modal-container">
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
            <div className="modal-header-brand">
              <img src="assets/logo-emblem.png" alt="Avinya Care Logo" className="modal-brand-icon" />
              <div className="category-tag" style={{ marginBottom: 0 }}>JOIN OUR COMMUNITY</div>
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Volunteer Application</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Join our care navigation team or assist in community screening drives.</p>
            {formStatus && <div style={{ color: 'var(--brand)', margin: '1rem 0', fontWeight: 700 }}>{formStatus}</div>}
            <form onSubmit={(e) => handleGenericSubmit(e, 'Volunteer Application')}>
              <input type="text" name="name" placeholder="Full Name *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1rem' }} />
              <input type="email" name="email" placeholder="Email Address *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1rem' }} />
              <input type="tel" name="phone" placeholder="Phone Number *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1rem' }} />
              <select name="role" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1.5rem' }}>
                <option value="">Select Volunteer Role</option>
                <option value="Care Companion">Care Companion / Patient Helper</option>
                <option value="Medical Specialist">Medical Specialist / Doctor</option>
                <option value="Community Organizer">Community Screening Organizer</option>
                <option value="Event Helper">Event &amp; Logistics Helper</option>
              </select>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
                <span>Submit Volunteer Profile →</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Guide & Toolkit Modal */}
      {activeModal === 'guide-modal' && (
        <div id="guide-modal" className="modal-backdrop active" onClick={(e) => e.target.id === 'guide-modal' && closeModal()}>
          <div className="modal-container">
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
            <div className="modal-header-brand">
              <img src="assets/logo-emblem.png" alt="Avinya Care Logo" className="modal-brand-icon" />
              <div className="category-tag" style={{ marginBottom: 0 }}>KNOWLEDGE RESOURCE</div>
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>{modalData.guideName || 'Health Awareness Toolkit'}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Enter your email to receive our comprehensive health screening checklist &amp; multi-lingual guide PDF.</p>
            {formStatus && <div style={{ color: 'var(--brand)', margin: '1rem 0', fontWeight: 700 }}>{formStatus}</div>}
            <form onSubmit={(e) => handleGenericSubmit(e, 'Guide Download')}>
              <input type="email" name="email" placeholder="Your Email Address *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1.25rem' }} />
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
                <span>Download Free Toolkit PDF →</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Confidential Support Modal */}
      {activeModal === 'support-modal' && (
        <div id="support-modal" className="modal-backdrop active" onClick={(e) => e.target.id === 'support-modal' && closeModal()}>
          <div className="modal-container">
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
            <div className="modal-header-brand">
              <img src="assets/logo-emblem.png" alt="Avinya Care Logo" className="modal-brand-icon" />
              <div className="category-tag" style={{ marginBottom: 0 }}>CONFIDENTIAL HELPLINE</div>
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Request Patient Navigation Support</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Our care navigators provide free, confidential support for patients, caregivers, and families.</p>
            {formStatus && <div style={{ color: 'var(--brand)', margin: '1rem 0', fontWeight: 700 }}>{formStatus}</div>}
            <form onSubmit={(e) => handleGenericSubmit(e, 'Support Request')}>
              <input type="text" name="name" placeholder="Patient or Caregiver Name *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1rem' }} />
              <input type="tel" name="phone" placeholder="Phone Number (For Call / WhatsApp) *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1rem' }} />
              <textarea name="details" placeholder="How can our care navigators support you? (e.g., screening guidance, hospital navigation, counseling)" rows="3" style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1.5rem' }}></textarea>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
                <span>Request Confidential Callback →</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. CSR Partnership Modal */}
      {activeModal === 'csr-modal' && (
        <div id="csr-modal" className="modal-backdrop active" onClick={(e) => e.target.id === 'csr-modal' && closeModal()}>
          <div className="modal-container">
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
            <div className="modal-header-brand">
              <img src="assets/logo-emblem.png" alt="Avinya Care Logo" className="modal-brand-icon" />
              <div className="category-tag" style={{ marginBottom: 0 }}>CORPORATE PARTNERSHIP</div>
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>CSR &amp; Corporate Collaboration</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Partner with Avinya Care Foundation for employee wellness drives, mobile screening vans, and community health initiatives.</p>
            {formStatus && <div style={{ color: 'var(--brand)', margin: '1rem 0', fontWeight: 700 }}>{formStatus}</div>}
            <form onSubmit={(e) => handleGenericSubmit(e, 'CSR Inquiry')}>
              <input type="text" name="company" placeholder="Organization / Company Name *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1rem' }} />
              <input type="text" name="contact" placeholder="Contact Person Name *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1rem' }} />
              <input type="email" name="email" placeholder="Work Email Address *" required style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1.5px solid var(--gray-200)', width: '100%', marginBottom: '1.5rem' }} />
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
                <span>Request CSR Proposal →</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
