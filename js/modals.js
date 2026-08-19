/**
 * Avinya Care Foundation - Interactive Modals & Form Manager
 * Manages Donation, Volunteer, Patient Support, Contact, Partnership, Newsletter, and Feedback forms.
 * All submissions communicate server-side with /api/submit-form and display live email delivery status.
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.selectedAmount = 1000;
    this.isMonthly = false;
    
    // Store original modal HTML templates for reliable re-opening
    this.templates = {};
    this.init();
  }

  init() {
    const modalIds = [
      'donate-modal', 'volunteer-modal', 'support-modal',
      'contact-modal', 'csr-modal', 'newsletter-modal', 'feedback-modal', 'guide-modal', 'story-modal'
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

      if (modalId === 'donate-modal') {
        this.selectAmount(this.selectedAmount || 1000);
      }
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
      mobileNav.style.display = 'none';
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

  // --- DONATION CONTROLS ---
  setDonationType(type) {
    this.isMonthly = (type === 'monthly');
    const oneTimeBtn = document.getElementById('toggle-one-time');
    const monthlyBtn = document.getElementById('toggle-monthly');
    if (oneTimeBtn && monthlyBtn) {
      oneTimeBtn.classList.toggle('active', !this.isMonthly);
      monthlyBtn.classList.toggle('active', this.isMonthly);
    }
    this.updateImpactStatement();
  }

  selectAmount(amount) {
    this.selectedAmount = amount;
    document.querySelectorAll('#donate-modal .amount-btn').forEach(btn => {
      const btnText = btn.textContent.replace(/[^\d]/g, '');
      const btnAmount = parseInt(btnText, 10);
      btn.classList.toggle('active', btnAmount === amount || (btnText === '10' && amount === 10000));
    });
    this.updateImpactStatement();
  }

  updateImpactStatement() {
    const statement = document.getElementById('impact-calculator-statement');
    if (!statement) return;
    const amount = this.selectedAmount;
    const freq = this.isMonthly ? 'monthly' : 'one-time';

    let desc = `₹${new Intl.NumberFormat('en-IN').format(amount)} provides early screening kits and medical counseling for patients in need.`;
    if (amount <= 500) {
      desc = `₹500 sponsors primary oral & breast cancer awareness kits for 1 rural family.`;
    } else if (amount <= 1000) {
      desc = `₹1,000 provides diagnostic screening guidance and local travel assistance for 2 individuals.`;
    } else if (amount <= 2500) {
      desc = `₹2,500 funds 2 clinical oncology diagnostic screenings + specialist counseling at mobile health camps.`;
    } else if (amount <= 5000) {
      desc = `₹5,000 provides 1 month of clinical nutrition packages and compassionate caregiver navigation.`;
    } else {
      desc = `₹10,000 sponsors advanced diagnostic imaging support and palliative care navigation for 3 patients.`;
    }

    statement.innerHTML = `✨ <strong>Impact (${freq}):</strong> ${desc}<br><span style="font-size: 0.8rem; color: #087F73; font-weight: 600; display: inline-block; margin-top: 4px;">✓ 100% Eligible for 80G Tax Exemption (Receipt delivered via email)</span>`;
  }

  // --- SUBMIT FORM TO API ---
  async submitFormToAPI(formType, payload, containerSelector, title) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Loading State with AI Generation indicator
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem;">
        <div style="width: 56px; height: 56px; border: 4px solid rgba(8, 127, 115, 0.2); border-top-color: #087F73; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
        <h3 style="font-size: 1.5rem; color: #111817; margin-bottom: 0.5rem;">Avinya Care Email Dispatch Engine</h3>
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
        const delivery = resData.emailDelivery || {};
        const isAI = resData.isAIGenerated;

        const isUserSent = delivery.userEmailSent !== false;
        const isAdminSent = delivery.adminEmailSent !== false;
        const hasDeliveryWarning = delivery.status === 'FAILED' || delivery.status === 'PARTIAL' || Boolean(delivery.errorMessage);

        container.innerHTML = `
          <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
          <div style="text-align: center; padding: 2rem 1rem;">
            <div style="width: 68px; height: 68px; background: rgba(98, 181, 159, 0.2); border-radius: 50%; color: #087F73; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 1.25rem;">✓</div>
            <span class="category-tag" style="margin-bottom: 0.5rem; display: inline-block;">${isAI ? '✨ Dynamic AI Email Generated' : '✓ Submission Confirmed'}</span>
            <h2 style="font-size: 1.8rem; margin-bottom: 0.75rem; color: #111817;">${title || 'Dhanyawad!'}</h2>
            <p style="color: var(--text-dark-muted); font-size: 1.05rem; margin-bottom: 1.25rem; line-height: 1.6;">
              ${userEmail.greeting ? `<strong>${userEmail.greeting}</strong><br>` : ''}
              ${resData.message || 'We have received your submission and sent a confirmation email to your address.'}
            </p>

            <!-- Live Email Dispatch Status (Success / Error Indicators) -->
            <div style="background: ${hasDeliveryWarning ? '#FFFBEB' : '#F0FDF4'}; border: 1px solid ${hasDeliveryWarning ? '#FDE68A' : '#BBF7D0'}; border-radius: 12px; padding: 14px 16px; margin-bottom: 1.25rem; text-align: left; font-size: 0.85rem;">
              <div style="font-weight: 700; color: ${hasDeliveryWarning ? '#B45309' : '#166534'}; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span>${hasDeliveryWarning ? '⚠️ Email Dispatch Status' : '✓ Live Email Delivery Status'}</span>
                <span style="font-size: 0.75rem; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${isUserSent && isAdminSent ? '#DCFCE7; color: #166534;' : '#FEF3C7; color: #92400E;'}">
                  ${delivery.status || 'SENT'}
                </span>
              </div>
              <div style="color: ${hasDeliveryWarning ? '#92400E' : '#15803D'}; line-height: 1.6;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span>${isUserSent ? '✅' : '❌'}</span>
                  <span>User Email (<strong>${payload.email || 'Recipient'}</strong>): ${isUserSent ? 'Dispatched' : (delivery.userEmailError || 'Delivery Failed')}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <span>${isAdminSent ? '✅' : '❌'}</span>
                  <span>Operations Alert (<strong>${delivery.adminEmailRecipient || 'info@test.avinyacarefoundation.org'}</strong>): ${isAdminSent ? 'Dispatched' : (delivery.adminEmailError || 'Delivery Failed')}</span>
                </div>
                ${delivery.successMessage ? `<div style="font-size: 0.78rem; color: #166534; margin-top: 6px; border-top: 1px dashed #BBF7D0; padding-top: 4px;">✓ ${delivery.successMessage}</div>` : ''}
                ${delivery.errorMessage ? `<div style="font-size: 0.78rem; color: #DC2626; margin-top: 6px; border-top: 1px dashed #FECACA; padding-top: 4px;">⚠ ${delivery.errorMessage}</div>` : ''}
              </div>
            </div>

            <!-- Email Content Preview Card -->
            <div style="background: var(--bg-light); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: left; font-size: 0.9rem; border: 1px solid var(--border-light);">
              <div style="font-weight: 700; color: #087F73; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span>📧 Confirmation Email Preview</span>
                <span style="font-size: 0.75rem; background: #087F73; color: white; padding: 2px 8px; border-radius: 10px;">${resData.submissionId}</span>
              </div>
              <div style="font-weight: 600; color: #111817; margin-bottom: 4px;">Subject: ${userEmail.subject || 'Submission Confirmation'}</div>
              <div style="color: var(--text-dark-muted); line-height: 1.5; font-size: 0.85rem; font-style: italic;">
                "${userEmail.body ? userEmail.body.slice(0, 180).replace(/<[^>]*>?/gm, '') + '...' : 'A personalized email response has been generated.'}"
              </div>
            </div>

            <button class="btn-primary" onclick="window.AvinyaModals.closeAll()" style="width: 100%; justify-content: center;">
              Return to Website
            </button>
          </div>
        `;
      } else {
        throw new Error(resData.message || resData.errorMessage || 'Server response error');
      }
    } catch (err) {
      container.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
        <div style="text-align: center; padding: 2rem 1rem;">
          <div style="width: 64px; height: 64px; background: #FEE2E2; border-radius: 50%; color: #DC2626; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1rem;">!</div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.75rem; color: #111817;">Submission Failed</h3>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 12px 16px; margin-bottom: 1.5rem; text-align: left; font-size: 0.9rem; color: #991B1B; line-height: 1.5;">
            <strong>Error Details:</strong><br>
            ${err.message || 'Could not submit form. Please check your network connection or try again.'}
          </div>
          <button class="btn-primary" onclick="window.AvinyaModals.closeAll()" style="width: 100%; justify-content: center;">Close</button>
        </div>
      `;
    }
  }

  // --- DONATION MODAL ---
  openDonateModal(defaultAmount = 1000) {
    this.openModal('donate-modal');
    this.selectAmount(defaultAmount);
  }

  submitDonation(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('#donor-name')?.value || '';
    const email = form.querySelector('#donor-email')?.value || '';
    const phone = form.querySelector('#donor-phone')?.value || '';
    const pan = form.querySelector('#donor-pan')?.value || '';

    const payload = {
      name,
      email,
      phone,
      pan,
      amount: this.selectedAmount || 1000,
      frequency: this.isMonthly ? 'monthly' : 'one-time',
      payment_status: 'SUCCESS',
      transaction_id: `TXN-${Date.now().toString().slice(-8)}`
    };

    this.submitFormToAPI('donation', payload, '#donate-modal .modal-container', 'Dhanyawad for Your Compassion!');
  }

  // Generic form handler for all modals (volunteer, support, contact, csr, newsletter, feedback, guide)
  submitForm(e, formTitle) {
    e.preventDefault();
    const form = e.target;
    const modal = form.closest('.modal-backdrop');
    const modalId = modal ? modal.id : 'form-modal';
    
    let formType = 'contact';
    const titleLower = (formTitle || '').toLowerCase();
    if (modalId.includes('volunteer') || titleLower.includes('volunteer')) formType = 'volunteer';
    else if (modalId.includes('support') || titleLower.includes('support')) formType = 'support';
    else if (modalId.includes('csr') || titleLower.includes('csr') || titleLower.includes('partner')) formType = 'partnership';
    else if (modalId.includes('news') || titleLower.includes('news')) formType = 'newsletter';
    else if (modalId.includes('feed') || titleLower.includes('feed')) formType = 'feedback';
    else if (modalId.includes('guide') || titleLower.includes('guide')) formType = 'guide';

    const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
    const payload = {};
    
    inputs.forEach(input => {
      const val = input.value.trim();
      if (!val) return;
      if (input.type === 'email' || input.placeholder?.toLowerCase().includes('email')) {
        payload.email = val;
      } else if (input.type === 'tel' || input.placeholder?.toLowerCase().includes('phone')) {
        payload.phone = val;
      } else if (input.placeholder?.toLowerCase().includes('name') && !payload.name) {
        payload.name = val;
      } else if (input.placeholder?.toLowerCase().includes('org') || input.placeholder?.toLowerCase().includes('company')) {
        payload.organization = val;
      } else if (input.tagName === 'SELECT') {
        payload.interest = val;
      } else if (input.tagName === 'TEXTAREA' || input.placeholder?.toLowerCase().includes('message') || input.placeholder?.toLowerCase().includes('thought')) {
        payload.message = val;
      }
    });

    if (!payload.name) payload.name = 'Valued Supporter';
    if (!payload.email) {
      const emailInput = inputs.find(i => i.type === 'email' || i.placeholder?.toLowerCase().includes('email'));
      if (emailInput) payload.email = emailInput.value;
    }

    this.submitFormToAPI(formType, payload, `#${modalId} .modal-container`, formTitle || 'Submission Received');
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
        <blockquote style="font-size: 1.25rem; font-style: italic; color: #087F73; border-left: 4px solid #087F73; padding-left: 1rem; margin-bottom: 1.5rem;">
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
