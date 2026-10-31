/**
 * AvinyaCareFoundation - Interactive Modals & Form Manager
 * Manages Donation, Volunteer, Patient Support, Contact, Partnership, Newsletter, and Feedback forms.
 * All submissions communicate server-side with /api/submit-form and display live email delivery status.
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.selectedAmount = 1000;
    this.isMonthly = false;
    this.refreshDonationStatsOnClose = false;
    this.submittingForms = new WeakSet();
    
    // Store original modal HTML templates for reliable re-opening
    this.templates = {};
    this.init();
  }

  init() {
    const modalIds = [
      'donate-modal', 'volunteer-modal', 'support-modal',
      'contact-modal', 'csr-modal', 'newsletter-modal', 'feedback-modal', 'guide-modal', 'story-modal',
      'privacy-modal', 'terms-modal', 'compliance-modal', 'coming-soon-modal'
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
      if (e.key === 'Tab' && this.activeModal) {
        const items = [...this.activeModal.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
        const first = items[0], last = items[items.length - 1];
        if (items.length && !this.activeModal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });
  }

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  openModal(modalId) {
    const requestedModalId = modalId;

    const modal = document.getElementById(modalId);
    if (modal) {
      // Restore template if container exists (except dynamic modals like story-modal and guide-modal)
      const container = modal.querySelector('.modal-container');
      if (container && this.templates[modalId] && modalId !== 'story-modal' && modalId !== 'guide-modal') {
        container.innerHTML = this.templates[modalId];
      }

      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      const heading = modal.querySelector('h2, h3');
      if (heading) { heading.id ||= `${modalId}-heading`; modal.setAttribute('aria-labelledby', heading.id); }
      modal.querySelectorAll('.modal-close-btn').forEach(button => button.setAttribute('aria-label', 'Close dialog'));
      modal.querySelectorAll('input,select,textarea').forEach(field => {
        if (!field.labels?.length && !field.hasAttribute('aria-label')) {
          field.setAttribute('aria-label', field.getAttribute('placeholder') || field.name || 'Form field');
        }
      });
      modal.querySelectorAll('form').forEach(form => {
        if (!form.querySelector('[data-form-privacy]')) {
          const notice = document.createElement('p');
          notice.dataset.formPrivacy = '';
          notice.style.cssText = 'font-size:13px;line-height:1.6;color:#525252;margin:12px 0';
          notice.append('We use these details to respond to your request. Share only necessary information. ');
          const privacy = document.createElement('a'); privacy.href = '/privacy'; privacy.textContent = 'Read the privacy notice';
          notice.append(privacy);
          form.prepend(notice);
        }
      });
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.activeModal = modal;
      this.previousActiveElement = document.activeElement;

      // Focus first interactive element for WCAG 2.2 AA accessibility
      requestAnimationFrame(() => {
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
      });

      if (requestedModalId === 'donate-modal' && window.AvinyaAnalytics) {
        window.AvinyaAnalytics.event('donation_started');
      }

      if (modalId === 'donate-modal') {
        this.setDonationType('one-time');
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

    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      try { this.previousActiveElement.focus(); } catch (err) {}
      this.previousActiveElement = null;
    }

    // A donation confirmation can stay open while the visitor reads it. Refresh
    // campaign progress when they close it, rather than changing the page behind it.
    if (this.refreshDonationStatsOnClose) {
      this.refreshDonationStatsOnClose = false;
      window.dispatchEvent(new CustomEvent('avinya:donation_submitted'));
    }
  }

  closeAllModals() {
    this.closeAll();
  }

  closeModal() {
    this.closeAll();
  }

  // --- DONATION CONTROLS ---
  setDonationType(type) {
    // This form records an intention; it cannot create a recurring payment mandate.
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
    this.isCustom = false;
    this.selectedAmount = amount;
    const customContainer = document.getElementById('custom-amount-container');
    if (customContainer) {
      customContainer.style.display = 'none';
    }

    document.querySelectorAll('#donate-modal .amount-btn').forEach(btn => {
      const btnText = btn.textContent.trim().toLowerCase();
      if (btnText === 'custom') {
        btn.classList.remove('active');
      } else {
        const numText = btnText.replace(/[^\d]/g, '');
        const btnAmount = parseInt(numText, 10);
        btn.classList.toggle('active', btnAmount === amount || (btnText === '10k' && amount === 10000));
      }
    });
    this.updateImpactStatement();
  }

  selectCustom() {
    this.isCustom = true;
    document.querySelectorAll('#donate-modal .amount-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === 'custom');
    });

    const customContainer = document.getElementById('custom-amount-container');
    const customInput = document.getElementById('custom-amount-input');
    if (customContainer) {
      customContainer.style.display = 'block';
    }
    if (customInput) {
      customInput.focus();
      const val = parseInt(customInput.value, 10);
      if (val && val >= 100) {
        this.selectedAmount = val;
      } else {
        this.selectedAmount = 1500;
        customInput.value = 1500;
      }
    }
    this.updateImpactStatement();
  }

  handleCustomAmountInput(value) {
    this.selectedAmount = Number(value);
    this.updateImpactStatement();
  }

  updateImpactStatement() {
    const statement = document.getElementById('impact-calculator-statement');
    if (!statement) return;
    const valid = Number.isSafeInteger(this.selectedAmount) && this.selectedAmount >= 100;
    statement.textContent = valid
      ? `Donation interest: ₹${new Intl.NumberFormat('en-IN').format(this.selectedAmount)}. No payment is taken here. Confirm payment arrangements and receipt eligibility with the foundation.`
      : 'Enter a whole-rupee amount of at least ₹100.';
  }

  // --- SUBMIT FORM TO API ---
  async submitFormToAPI(formType, payload, containerSelector, title) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Loading State with AI Generation indicator
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem;">
        <div style="width: 56px; height: 56px; border: 4px solid rgba(8, 127, 115, 0.2); border-top-color: #087F73; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
        <h3 style="font-size: 1.5rem; color: #111817; margin-bottom: 0.5rem;">AvinyaCareFoundation Email Dispatch Engine</h3>
        <p style="color: var(--text-dark-muted); font-size: 0.95rem; line-height: 1.5;">
          Generating personalized confirmation & notifying our operations desk...
        </p>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      </div>
    `;

    try {
      const apiBase = '';
      const response = await fetch(apiBase + '/api/submit-form', {
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
        const isConfirmedDonation = formType === 'donation' && String(resData.paymentStatus || '').toUpperCase() === 'SUCCESS';

        // Defer the pledge-progress refresh until the donor closes the
        // confirmation modal. The confirmed-only event below still updates the
        // public donation ticker immediately.
        if (formType === 'donation') {
          this.refreshDonationStatsOnClose = true;
        }

        // Dispatch real-time donation event for live activity ticker
        if (formType === 'donation' && String(resData.paymentStatus || '').toUpperCase() === 'SUCCESS') {
          if (window.AvinyaAnalytics) window.AvinyaAnalytics.event('donation_completed');
          try {
            window.dispatchEvent(new CustomEvent('avinya:donation_success', {
              detail: {
                id: resData.submissionId,
                name: payload.is_anonymous ? 'Anonymous Donor' : (payload.name || payload.fullName || 'Anonymous Supporter'),
                amount: parseFloat(payload.amount || 1000),
                cause: payload.interest || payload.category || payload.message || 'Medical Emergency Relief'
              }
            }));
          } catch (_) {}
        }

        if (formType === 'contact' && window.AvinyaAnalytics) {
          window.AvinyaAnalytics.event('contact_form_submitted');
        }

        const isUserSent = delivery.userEmailSent !== false;
        const isAdminSent = delivery.adminEmailSent !== false;
        const hasDeliveryWarning = delivery.status === 'FAILED' || delivery.status === 'PARTIAL' || Boolean(delivery.errorMessage);

        container.innerHTML = `
          <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()" style="top: 1rem; right: 1rem; font-size: 1rem; cursor: pointer; color: #6B7280; z-index: 10; background: #F3F4F6; border: none; border-radius: 50%; width: 32px; height: 32px; font-weight: bold;">✕</button>
          <div style="text-align: center; padding: 1.5rem 1rem 0;">
            <div style="width: 64px; height: 64px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 50%; color: #166534; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.03));">✓</div>
            <span style="font-size: 0.75rem; font-weight: 700; color: #166534; background: #DCFCE7; padding: 0.35rem 0.75rem; border-radius: 9999px; letter-spacing: 0.05em; text-transform: uppercase;">
              Request received
            </span>
            <h2 style="font-size: 1.8rem; font-weight: 800; margin: 1rem 0 0.5rem; color: #111827; font-family: var(--font-primary, 'Manrope', sans-serif); letter-spacing: -0.02em;">${this.escapeHtml(title || 'Thank You!')}</h2>
            <p style="color: #4B5563; font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.6;">
              ${userEmail.greeting ? `<strong style="color:#111827;">${this.escapeHtml(userEmail.greeting)}</strong><br>` : ''}
              ${formType === 'donation' ? 'Your donation interest has been recorded. Payment has not been taken by this form.' : 'Your request has been received.'}
            </p>

            <p role="status" style="color:#374151">Reference: ${this.escapeHtml(resData.submissionId || '')}. ${isUserSent && payload.email ? 'A confirmation email has been sent.' : 'Your request was received. Please save this reference and contact us if you need help.'} ${formType === 'donation' && !isConfirmedDonation ? 'Payment has not been confirmed. This is an acknowledgement of your interest, not a donation receipt. No recurring payment has been set up.' : ''}</p>
            <!-- Action Buttons -->
            ${isConfirmedDonation ? `<p>Contact the foundation with your reference to request a verified payment receipt or applicable tax certificate.</p>` : formType === 'guide' ? `
              <button onclick="window.AvinyaPdf.generateAwarenessGuidePDF()" style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem; border-radius: 9999px; background: #F3F4F6; color: #111827; border: 1px solid #E5E7EB; font-weight: 600; font-size: 0.95rem; cursor: pointer; margin-bottom: 1rem; transition: all 0.2s;">
                📄 Download Cancer Toolkit PDF
              </button>
            ` : ''}

            <button onclick="window.AvinyaModals.closeAll()" style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem; border-radius: 9999px; background: #111827; color: #FFFFFF; border: none; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s ease;">
              Return to Website
            </button>
          </div>
        `;
      } else {
        throw new Error(resData.message || resData.errorMessage || 'Server response error');
      }
    } catch (err) {
      container.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()" style="top: 1rem; right: 1rem; font-size: 1rem; cursor: pointer; color: #6B7280; z-index: 10; background: #F3F4F6; border: none; border-radius: 50%; width: 32px; height: 32px; font-weight: bold;">✕</button>
        <div style="text-align: center; padding: 1.5rem 1rem 0;">
          <div style="width: 64px; height: 64px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 50%; color: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 1.5rem; filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.03));">!</div>
          <span style="font-size: 0.75rem; font-weight: 700; color: #B91C1C; background: #FEE2E2; padding: 0.35rem 0.75rem; border-radius: 9999px; letter-spacing: 0.05em; text-transform: uppercase;">
            Submission Failed
          </span>
          <h2 style="font-size: 1.8rem; font-weight: 800; margin: 1rem 0 0.5rem; color: #111827; font-family: var(--font-primary, 'Manrope', sans-serif); letter-spacing: -0.02em;">Oops!</h2>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 16px; padding: 1.25rem; margin-bottom: 2rem; text-align: left; font-size: 0.9rem; color: #991B1B; line-height: 1.6;">
            <div style="font-weight: 700; margin-bottom: 0.5rem; color: #7F1D1D;">Error Details:</div>
            ${this.escapeHtml(err.message || 'Could not submit form. Please check your network connection or try again.')}
          </div>
          <button onclick="window.AvinyaModals.closeAll()" style="width: 100%; display: flex; align-items: center; justify-content: center; padding: 1rem; border-radius: 9999px; background: #111827; color: #FFFFFF; border: none; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s ease;">
            Close & Try Again
          </button>
        </div>
      `;
    }
  }

  // --- DONATION MODAL ---
  openDonateModal(defaultAmount = 1000, category = null) {
    this.selectedAmount = defaultAmount || 1000;
    this.openModal('donate-modal');
    if (category) {
      const select = document.getElementById('donor-category');
      if (select) select.value = category;
    }
    this.selectAmount(this.selectedAmount);
  }

  // --- VOLUNTEER MODAL ---
  openVolunteerModal() {
    window.location.assign('https://docs.google.com/forms/d/e/1FAIpQLSeiRxf0Cv3OktSKILJScVgsNHpTVAEj0M-9rOD-7vMeECXZUA/viewform');
  }

  // --- PATIENT & CAREGIVER SUPPORT MODAL ---
  openSupportModal() {
    this.openModal('support-modal');
  }

  // --- CSR & PARTNERSHIP MODAL ---
  openCSRModal() {
    this.openModal('csr-modal');
  }

  openCsrModal() {
    this.openCSRModal();
  }

  // --- CONTACT MODAL ---
  openContactModal() {
    this.openModal('contact-modal');
  }

  // --- NEWSLETTER MODAL ---
  openNewsletterModal() {
    this.openModal('newsletter-modal');
  }

  // --- FEEDBACK MODAL ---
  openFeedbackModal() {
    this.openModal('feedback-modal');
  }

  // --- PRIVACY POLICY MODAL ---
  openPrivacyModal() {
    this.openModal('privacy-modal');
  }

  // --- TERMS OF SERVICE MODAL ---
  openTermsModal() {
    this.openModal('terms-modal');
  }

  // --- LEGAL & COMPLIANCE MODAL ---
  openComplianceModal() {
    this.openModal('compliance-modal');
  }

  submitDonation(e) {
    e.preventDefault();
    const form = e.target;
    if (this.submittingForms.has(form)) return;
    const category = form.querySelector('#donor-category')?.value || '';
    const name = form.querySelector('#donor-name')?.value || '';
    const email = form.querySelector('#donor-email')?.value || '';
    const phone = form.querySelector('#donor-phone')?.value || '';
    const pan = form.querySelector('#donor-pan')?.value || '';

    let amount = this.selectedAmount || 1000;
    if (this.isCustom) {
      const customInput = document.getElementById('custom-amount-input');
      const val = Number(customInput?.value);
      if (!Number.isSafeInteger(val) || val < 100) {
        this.showFormErrors(form, { amount: 'Enter a whole-rupee donation amount of at least ₹100.' });
        customInput?.focus();
        return;
      }
      amount = val;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      pan: pan.trim().toUpperCase(),
      amount,
      category,
      interest: category,
      frequency: this.isMonthly ? 'monthly' : 'one-time',
      payment_status: 'PENDING',
      is_anonymous: Boolean(form.querySelector('#donor-anonymous')?.checked)
    };
    const errors = this.validatePayload('donation', payload);
    if (!this.showFormErrors(form, errors)) return;
    this.submittingForms.add(form);
    this.setFormBusy(form, true);
    this.submitFormToAPI('donation', payload, '#donate-modal .modal-container', 'Dhanyawad for Your Compassion!')
      .finally(() => { this.submittingForms.delete(form); this.setFormBusy(form, false); });
  }

  // Generic form handler for all modals (volunteer, support, contact, csr, newsletter, feedback, guide)
  submitForm(e, formTitle) {
    e.preventDefault();
    const form = e.target;
    if (this.submittingForms.has(form)) return;
    const modal = form.closest('.modal-backdrop');
    const modalId = modal ? modal.id : 'form-modal';
    
    let formType = 'contact';
    const titleLower = (formTitle || '').toLowerCase();
    if (modalId.includes('volunteer') || titleLower.includes('volunteer')) formType = 'volunteer';
    else if (modalId.includes('support') || titleLower.includes('support')) formType = 'support';
    else if (modalId.includes('csr') || titleLower.includes('csr') || titleLower.includes('partner')) formType = 'partnership';
    else if (modalId.includes('news') || titleLower.includes('news')) formType = 'newsletter';
    else if (modalId.includes('coming-soon') || titleLower.includes('coming soon')) formType = 'coming_soon_feedback';
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

    if (!payload.name && !['newsletter', 'guide', 'feedback', 'coming_soon_feedback'].includes(formType)) payload.name = 'Valued Supporter';
    if (!payload.email) {
      const emailInput = inputs.find(i => i.type === 'email' || i.placeholder?.toLowerCase().includes('email'));
      if (emailInput) payload.email = emailInput.value;
    }

    const errors = this.validatePayload(formType, payload);
    if (!this.showFormErrors(form, errors)) return;
    this.submittingForms.add(form);
    this.setFormBusy(form, true);
    this.submitFormToAPI(formType, payload, `#${modalId} .modal-container`, formTitle || 'Submission Received')
      .finally(() => { this.submittingForms.delete(form); this.setFormBusy(form, false); });
  }

  validatePayload(formType, payload) {
    const errors = {};
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,63}$/.test(String(payload.email || '').trim());
    const phoneOk = /^(?:\+91)?[6-9]\d{9}$/.test(String(payload.phone || '').replace(/[\s()-]/g, ''));
    if (!emailOk && !(formType === 'support' && !String(payload.email || '').trim())) errors.email = 'Please enter a valid email address.';
    if (['donation', 'volunteer', 'support', 'contact', 'partnership', 'coming_soon_feedback'].includes(formType) && !String(payload.name || '').trim()) errors.name = 'Please enter your name.';
    if (['donation', 'volunteer', 'support', 'coming_soon_feedback'].includes(formType) && !phoneOk) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (formType === 'donation' && (!Number.isFinite(Number(payload.amount)) || Number(payload.amount) < 100 || Number(payload.amount) > 10000000)) errors.amount = 'Donation amount must be between ₹100 and ₹1,00,00,000.';
    if (formType === 'partnership' && !String(payload.organization || '').trim()) errors.organization = 'Please enter your organization name.';
    if (['contact', 'support', 'feedback', 'coming_soon_feedback'].includes(formType) && !String(payload.message || '').trim()) errors.message = 'Please enter a message.';
    return errors;
  }

  showFormErrors(form, errors) {
    form.querySelectorAll('[data-validation-error]').forEach(node => node.remove());
    form.querySelectorAll('[aria-invalid="true"]').forEach(node => node.removeAttribute('aria-invalid'));
    const messages = Object.values(errors);
    if (!messages.length) return true;
    for (const [field, message] of Object.entries(errors)) {
      const input = field === 'amount' ? form.querySelector('#custom-amount-input') : Array.from(form.querySelectorAll('input, textarea, select')).find(el => (field === 'email' && (el.type === 'email' || /email/i.test(el.placeholder))) || (field === 'phone' && (el.type === 'tel' || /phone/i.test(el.placeholder))) || (field === 'name' && /name/i.test(el.placeholder)) || (field === 'organization' && /org|company/i.test(el.placeholder)) || (field === 'message' && el.tagName === 'TEXTAREA'));
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        const node = document.createElement('div');
        node.id = `${input.id || 'form-' + field}-error`;
        input.setAttribute('aria-describedby', node.id);
        node.dataset.validationError = 'true'; node.setAttribute('role', 'alert'); node.style.cssText = 'color:#B91C1C;font-size:.82rem;margin:.35rem 0 .65rem;'; node.textContent = message;
        input.insertAdjacentElement('afterend', node);
      }
    }
    const first = form.querySelector('[aria-invalid="true"]');
    first?.focus();
    return false;
  }

  setFormBusy(form, busy) {
    const button = form.querySelector('button[type="submit"], input[type="submit"]');
    if (!button) return;
    button.disabled = busy; button.setAttribute('aria-busy', String(busy));
    if (busy) { button.dataset.originalText = button.textContent; button.textContent = 'Submitting…'; }
    else if (button.dataset.originalText) button.textContent = button.dataset.originalText;
  }

  // --- STORY READER MODAL ---
  openStoryModal(author, role, quote, fullStory, imgUrl) {
    const modalContainer = document.querySelector('#story-modal .modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
        <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
          <img src="${imgUrl || 'assets/logo-emblem.png'}" alt="${author}" style="width: 68px; height: 68px; border-radius: 50%; object-fit: cover; border: 2px solid var(--brand); flex-shrink: 0;" loading="lazy">
          <div>
            <span class="category-tag" style="background: rgba(235,94,40,0.15); color: var(--brand); border: 1px solid rgba(235,94,40,0.3); font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 999px; margin-bottom: 0.25rem; display: inline-block;">${role}</span>
            <h3 style="font-size: 1.6rem; font-weight: 800; color: #111827; margin: 0.25rem 0 0;">${author}'s Story</h3>
          </div>
        </div>
        <blockquote style="font-size: 1.15rem; font-style: italic; color: var(--brand); border-left: 3px solid var(--brand); padding-left: 1rem; margin: 0 0 1.5rem; line-height: 1.6; font-weight: 600;">
          "${quote}"
        </blockquote>
        <div style="color: #4B5563; font-size: 1.02rem; line-height: 1.75;">
          <p style="margin-bottom: 1.25rem;">${fullStory}</p>
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 1.25rem; margin-top: 1.75rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="font-weight: 700; color: #111827; font-size: 0.95rem;">Empowering lives across Mumbai-Virar</div>
              <div style="font-size: 0.85rem; color: #6B7280;">Support early screening, dialysis aid, and patient navigation.</div>
            </div>
            <button class="btn-primary" style="padding: 0.6rem 1.4rem; font-size: 0.85rem;" onclick="window.AvinyaModals.closeAll(); window.AvinyaModals.openDonateModal(1000);">
              <span>Support Care →</span>
            </button>
          </div>
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
          <button class="btn-primary" onclick="window.AvinyaPdf.generateAwarenessGuidePDF('${topic.replace(/'/g, "\\'")}')">
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

// Stories Section Expand/Collapse Manager
window.AvinyaStories = {
  isExpanded: false,
  toggle: function() {
    this.isExpanded = !this.isExpanded;
    const hiddenCards = document.querySelectorAll('.stories-grid .story-card.story-card-extra');
    const btnText = document.getElementById('toggle-stories-text');
    const btnArrow = document.getElementById('toggle-stories-arrow');

    hiddenCards.forEach((card, idx) => {
      if (this.isExpanded) {
        card.classList.remove('story-card-hidden');
        card.classList.add('story-card-revealed');
        card.style.animationDelay = `${idx * 0.05}s`;
      } else {
        card.classList.add('story-card-hidden');
        card.classList.remove('story-card-revealed');
        card.style.animationDelay = '0s';
      }
    });

    if (this.isExpanded) {
      if (btnText) btnText.textContent = 'Show Fewer Stories';
      if (btnArrow) btnArrow.textContent = '↑';
    } else {
      if (btnText) btnText.textContent = 'Show More Stories (7 More)';
      if (btnArrow) btnArrow.textContent = '↓';
      const storiesSection = document.getElementById('stories');
      if (storiesSection) {
        storiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
};
