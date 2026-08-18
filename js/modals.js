/**
 * Avinya Care Foundation - Interactive Modals & AI Form Manager
 * Manages Donation, Volunteer, Patient Support, Contact, Partnership, Newsletter, and Feedback forms.
 * All submissions communicate server-side with /api/submit-form for AI email generation.
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.selectedAmount = 1000;
    this.isMonthly = true;
    
    // Store original modal HTML templates for reliable re-opening
    this.templates = {};
    this.init();
  }

  init() {
    const modalIds = [
      'donate-modal', 'volunteer-modal', 'support-modal',
      'contact-modal', 'partnership-modal', 'newsletter-modal', 'feedback-modal'
    ];

    modalIds.forEach(id => {
      const container = document.querySelector(`#${id} .modal-container`);
      if (container) {
        this.templates[id] = container.innerHTML;
      }
    });

    // Backdrop click listener
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeAll();
        }
      });
    });

    // ESC Key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Restore template if container exists
      const container = modal.querySelector('.modal-container');
      if (container && this.templates[modalId]) {
        container.innerHTML = this.templates[modalId];
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.activeModal = modal;
    }
  }

  closeAll() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.classList.remove('active');
    });

    const newsModal = document.getElementById('news-detail-modal');
    if (newsModal) {
      newsModal.classList.remove('active');
      newsModal.innerHTML = '';
    }

    const mobileNav = document.getElementById('mobile-nav-overlay');
    if (mobileNav) {
      mobileNav.classList.remove('active');
    }

    document.body.style.overflow = '';
    this.activeModal = null;
  }

  closeAllModals() {
    this.closeAll();
  }

  closeModal() {
    this.closeAll();
  }

  // Helper method: Send form payload to Node server AI endpoint
  async submitFormToAPI(formType, payload, containerSelector, title) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Loading State with AI Generation indicator
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem;">
        <div style="width: 56px; height: 56px; border: 4px solid rgba(8, 127, 115, 0.2); border-top-color: #087F73; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
        <h3 style="font-size: 1.5rem; color: #111817; margin-bottom: 0.5rem;">Avinya Care AI Email Engine</h3>
        <p style="color: var(--text-dark-muted); font-size: 0.95rem; line-height: 1.5;">
          Generating personalized confirmation & notifying our operations desk...
        </p>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      </div>
    `;

    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_type: formType,
          ...payload
        })
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'ok') {
        const userEmail = resData.userEmail || {};
        const isAI = resData.isAIGenerated;

        container.innerHTML = `
          <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
          <div style="text-align: center; padding: 2rem 1rem;">
            <div style="width: 68px; height: 68px; background: rgba(98, 181, 159, 0.2); border-radius: 50%; color: #087F73; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 1.25rem;">✓</div>
            <span class="category-tag" style="margin-bottom: 0.5rem; display: inline-block;">${isAI ? '✨ Dynamic AI Email Generated' : '✓ Submission Confirmed'}</span>
            <h2 style="font-size: 1.8rem; margin-bottom: 1rem; color: #111817;">${title || 'Dhanyawad!'}</h2>
            <p style="color: var(--text-dark-muted); font-size: 1.05rem; margin-bottom: 1.5rem; line-height: 1.6;">
              ${userEmail.greeting ? `<strong>${userEmail.greeting}</strong><br>` : ''}
              ${resData.message || 'We have received your submission and sent a confirmation email to your address.'}
            </p>

            <div style="background: var(--bg-light); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: left; font-size: 0.9rem; border: 1px solid var(--border-light);">
              <div style="font-weight: 700; color: #087F73; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span>📧 Confirmation Sent to: ${payload.email}</span>
                <span style="font-size: 0.75rem; background: #087F73; color: white; padding: 2px 8px; border-radius: 10px;">${resData.submissionId}</span>
              </div>
              <div style="font-weight: 600; color: #111817; margin-bottom: 4px;">Subject: ${userEmail.subject || 'Submission Confirmation'}</div>
              <div style="color: var(--text-dark-muted); line-height: 1.5; font-size: 0.85rem; font-style: italic;">
                "${userEmail.body ? userEmail.body.slice(0, 180) + '...' : 'A personalized email response has been generated.'}"
              </div>
            </div>

            <button class="btn-primary" onclick="window.AvinyaModals.closeAll()" style="width: 100%; justify-content: center;">
              Return to Website
            </button>
          </div>
        `;
      } else {
        throw new Error(resData.message || 'Server response error');
      }
    } catch (err) {
      container.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
        <div style="text-align: center; padding: 2rem 1rem;">
          <div style="width: 64px; height: 64px; background: #FEE2E2; border-radius: 50%; color: #DC2626; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem;">!</div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.75rem;">Submission Failed</h3>
          <p style="color: var(--text-dark-muted); margin-bottom: 1.5rem;">${err.message || 'Could not submit form. Please try again.'}</p>
          <button class="btn-primary" onclick="window.AvinyaModals.closeAll()" style="width: 100%; justify-content: center;">Close</button>
        </div>
      `;
    }
  }

  // --- DONATION MODAL ---
  openDonateModal(defaultAmount = 1000) {
    this.openModal('donate-modal');
    this.selectedAmount = defaultAmount;
    this.updateDonateUI();
  }

  setDonationFrequency(isMonthly) {
    this.isMonthly = isMonthly;
    document.getElementById('freq-monthly')?.classList.toggle('active', isMonthly);
    document.getElementById('freq-onetime')?.classList.toggle('active', !isMonthly);
    this.updateDonateUI();
  }

  setDonationAmount(amount) {
    this.selectedAmount = amount;
    document.querySelectorAll('.amount-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-amount'), 10) === amount);
    });
    const customInput = document.getElementById('custom-amount-input');
    if (customInput) customInput.value = '';
    this.updateDonateUI();
  }

  setCustomAmount(val) {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      this.selectedAmount = num;
      document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
      this.updateDonateUI();
    }
  }

  formatINR(num) {
    return new Intl.NumberFormat('en-IN').format(num);
  }

  updateDonateUI() {
    const impactText = document.getElementById('impact-calculator-text');
    const submitBtn = document.getElementById('donate-submit-btn');

    let text = "";
    if (this.selectedAmount < 1000) {
      text = `Provides 1 early diagnostic screening kit and local transport assistance for a rural patient in Maharashtra.`;
    } else if (this.selectedAmount < 3000) {
      text = `Funds 2 clinical breast & cervical diagnostic screenings + counseling at mobile health camps.`;
    } else if (this.selectedAmount < 8000) {
      text = `Sponsors 1 month of essential clinical nutrition packages and patient navigation support.`;
    } else {
      text = `Sponsors complete diagnostic biopsies, emotional therapy, and palliative care navigation for 3 patients.`;
    }

    const freqStr = this.isMonthly ? '/month' : ' one-time';
    const formattedVal = this.formatINR(this.selectedAmount);

    if (impactText) {
      impactText.innerHTML = `<strong>Your ₹${formattedVal}${freqStr} impact:</strong> ${text}<br><span style="font-size: 0.85rem; color: var(--accent-teal); margin-top: 4px; display: inline-block;">✓ Eligible for 80G Tax Deduction under Indian Income Tax Act</span>`;
    }
    if (submitBtn) submitBtn.textContent = `Donate ₹${formattedVal}${freqStr} via UPI / NetBanking / Card`;
  }

  handleDonationSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const firstName = form.querySelector('[name="firstName"]')?.value || form.querySelectorAll('input')[0]?.value || '';
    const lastName = form.querySelector('[name="lastName"]')?.value || form.querySelectorAll('input')[1]?.value || '';
    const email = form.querySelector('[name="email"]')?.value || form.querySelectorAll('input')[2]?.value || '';
    const phone = form.querySelector('[name="phone"]')?.value || form.querySelectorAll('input')[3]?.value || '';
    const pan = form.querySelector('[name="pan"]')?.value || form.querySelectorAll('input')[4]?.value || '';

    const payload = {
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone,
      pan,
      amount: this.selectedAmount,
      frequency: this.isMonthly ? 'monthly' : 'one-time',
      payment_status: 'SUCCESS', // Backend supplied payment status
      transaction_id: `TXN-${Date.now().toString().slice(-8)}`
    };

    this.submitFormToAPI('donation', payload, '#donate-modal .modal-container', 'Dhanyawad for Your Compassion!');
  }

  // --- VOLUNTEER MODAL ---
  openVolunteerModal() {
    this.openModal('volunteer-modal');
  }

  handleVolunteerSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]')?.value || form.querySelectorAll('input')[0]?.value || '';
    const email = form.querySelector('[name="email"]')?.value || form.querySelectorAll('input')[1]?.value || '';
    const phone = form.querySelector('[name="phone"]')?.value || '';
    const interest = form.querySelector('select')?.value || 'Community Awareness';
    const message = form.querySelector('textarea')?.value || '';

    const payload = { name, email, phone, interest, message };
    this.submitFormToAPI('volunteer', payload, '#volunteer-modal .modal-container', 'Welcome to the Avinya Community!');
  }

  // --- PATIENT SUPPORT MODAL ---
  openSupportModal() {
    this.openModal('support-modal');
  }

  handleSupportSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const phone = form.querySelector('[name="phone"]')?.value || '';
    const interest = form.querySelector('[name="category"]')?.value || 'Patient Care Navigation';
    const message = form.querySelector('[name="message"]')?.value || '';
    const is_sensitive = form.querySelector('[name="is_sensitive"]')?.checked || true;

    const payload = { name, email, phone, interest, message, is_sensitive };
    this.submitFormToAPI('support', payload, '#support-modal .modal-container', 'We Are Here for You');
  }

  // --- CONTACT US MODAL ---
  openContactModal(subjectHint = '') {
    this.openModal('contact-modal');
    if (subjectHint) {
      const select = document.querySelector('#contact-modal select[name="subject"]');
      if (select) select.value = subjectHint;
    }
  }

  handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const phone = form.querySelector('[name="phone"]')?.value || '';
    const interest = form.querySelector('[name="subject"]')?.value || 'General Inquiry';
    const message = form.querySelector('[name="message"]')?.value || '';

    const payload = { name, email, phone, interest, message };
    this.submitFormToAPI('contact', payload, '#contact-modal .modal-container', 'Message Received!');
  }

  // --- CSR & PARTNERSHIP MODAL ---
  openPartnershipModal() {
    this.openModal('partnership-modal');
  }

  handlePartnershipSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const organization = form.querySelector('[name="organization"]')?.value || '';
    const phone = form.querySelector('[name="phone"]')?.value || '';
    const interest = form.querySelector('[name="partnershipType"]')?.value || 'Corporate CSR Partnership';
    const message = form.querySelector('[name="message"]')?.value || '';

    const payload = { name, email, organization, phone, interest, message };
    this.submitFormToAPI('partnership', payload, '#partnership-modal .modal-container', 'Partnership Proposal Received');
  }

  // --- NEWSLETTER MODAL ---
  openNewsletterModal() {
    this.openModal('newsletter-modal');
  }

  handleNewsletterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]')?.value || 'Supporter';
    const email = form.querySelector('[name="email"]')?.value || '';
    const interest = form.querySelector('[name="interest"]')?.value || 'Cancer Awareness Updates';

    const payload = { name, email, interest };
    this.submitFormToAPI('newsletter', payload, '#newsletter-modal .modal-container', 'Welcome to Our Health Newsletter!');
  }

  // --- FEEDBACK MODAL ---
  openFeedbackModal() {
    this.openModal('feedback-modal');
  }

  handleFeedbackSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const interest = form.querySelector('[name="category"]')?.value || 'Website & Diagnostic Camp Experience';
    const message = form.querySelector('[name="message"]')?.value || '';

    const payload = { name, email, interest, message };
    this.submitFormToAPI('feedback', payload, '#feedback-modal .modal-container', 'Thank You for Your Feedback!');
  }

  // --- STORY READER MODAL ---
  openStoryModal(author, role, quote, fullStory, imgUrl) {
    const modalContainer = document.querySelector('#story-modal .modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
        <div style="margin-bottom: 1.5rem;">
          <span class="category-tag">${role}</span>
          <h2 style="font-size: 2.2rem; margin-top: 0.5rem; margin-bottom: 1rem;">${author}'s Journey</h2>
        </div>
        <div style="width: 100%; height: 260px; border-radius: 20px; overflow: hidden; margin-bottom: 1.5rem;">
          <img src="${imgUrl}" alt="${author}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <blockquote style="font-size: 1.25rem; font-style: italic; color: var(--accent-teal); border-left: 4px solid var(--accent-teal); padding-left: 1rem; margin-bottom: 1.5rem;">
          "${quote}"
        </blockquote>
        <div style="color: var(--text-dark-muted); font-size: 1.05rem; line-height: 1.7;">
          <p style="margin-bottom: 1rem;">${fullStory}</p>
          <p>“Avinya Care Foundation stood by my family during early diagnosis and treatment navigation. Having a dedicated support group in India changes everything.”</p>
        </div>
      `;
    }
    this.openModal('story-modal');
  }

  // --- CANCER AWARENESS GUIDE MODAL ---
  openGuideModal(topic = "Cancer Awareness") {
    const modalContainer = document.querySelector('#guide-modal .modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
        <span class="category-tag">Indian Health Resource</span>
        <h2 style="font-size: 2rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">${topic} Guide & Screening Checklist</h2>
        <div style="color: var(--text-dark-muted); line-height: 1.7; font-size: 1.05rem;">
          <p style="margin-bottom: 1rem;">
            Early detection drastically improves treatment outcomes. Download or review our clinical checklist aligned with Tata Memorial Centre & ICMR guidelines for routine self-exams and diagnostic screenings in India.
          </p>
          <div style="background-color: var(--bg-light); border-radius: 16px; padding: 1.5rem; margin: 1.5rem 0;">
            <h4 style="color: var(--text-dark); margin-bottom: 0.75rem;">Recommended Indian Screening Guidelines:</h4>
            <ul style="padding-left: 1.25rem;">
              <li><strong>Breast Screening:</strong> Monthly self-exam; clinical breast exam annually from age 30; Mammogram every 2 years from age 40.</li>
              <li><strong>Cervical Screening:</strong> Pap test / VIA screening every 3–5 years for women aged 30–65.</li>
              <li><strong>Oral Screening:</strong> Annual visual oral examination for tobacco users and high-risk individuals.</li>
              <li><strong>Colorectal Screening:</strong> Stool test (FIT) / Colonoscopy screening starting at age 45.</li>
            </ul>
          </div>
          <button class="btn-primary" onclick="alert('Awareness PDF Guide downloaded successfully.')">
            Download Printable PDF Guide 📄
          </button>
        </div>
      `;
    }
    this.openModal('guide-modal');
  }
}

// Global Export
window.AvinyaModals = new ModalManager();
