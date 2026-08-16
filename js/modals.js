/**
 * Avinya Care Foundation - Interactive Modals & Drawers Manager (India-First)
 * Manages Donation (₹ INR / UPI / Net Banking), Volunteer, Guide, and Story Reader modal layers above all views (z-index: 3000).
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.selectedAmount = 1000;
    this.isMonthly = true;
    this.donateFormHTML = null;
    this.volunteerFormHTML = null;
    this.init();
  }

  init() {
    // Store initial form HTML templates for reliable re-opening
    const donateContainer = document.querySelector('#donate-modal .modal-container');
    if (donateContainer) this.donateFormHTML = donateContainer.innerHTML;

    const volunteerContainer = document.querySelector('#volunteer-modal .modal-container');
    if (volunteerContainer) this.volunteerFormHTML = volunteerContainer.innerHTML;

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
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.activeModal = modal;
    }
  }

  closeAll() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.classList.remove('active');
    });

    // Only restore body overflow if full-screen news view is NOT active
    const newsModal = document.getElementById('news-detail-modal');
    if (!newsModal || !newsModal.classList.contains('active')) {
      document.body.style.overflow = '';
    }

    this.activeModal = null;
  }

  // --- DONATION MODAL LOGIC (₹ INR / UPI / 80G Tax Exemption) ---
  openDonateModal(defaultAmount = 1000) {
    const donateContainer = document.querySelector('#donate-modal .modal-container');
    if (donateContainer && this.donateFormHTML) {
      donateContainer.innerHTML = this.donateFormHTML;
    }

    this.selectedAmount = defaultAmount;
    this.openModal('donate-modal');
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
    const modalContent = document.querySelector('#donate-modal .modal-container');
    if (modalContent) {
      const formattedVal = this.formatINR(this.selectedAmount);
      modalContent.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
        <div style="text-align: center; padding: 2rem 1rem;">
          <div style="width: 72px; height: 72px; background: rgba(98, 181, 159, 0.2); border-radius: 50%; color: #087F73; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem;">✓</div>
          <h2 style="font-size: 2rem; margin-bottom: 1rem;">Dhanyawad for Your Compassion!</h2>
          <p style="color: var(--text-dark-muted); font-size: 1.05rem; margin-bottom: 1.5rem; line-height: 1.6;">
            Your contribution of <strong>₹${formattedVal}${this.isMonthly ? '/month' : ''}</strong> directly brings healthcare dignity, early screening, and hope to cancer patients and families across India.
          </p>
          <div style="background: var(--bg-light); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-dark);">
            <strong>80G Tax Certificate:</strong> An official tax exemption receipt with Registration No. AAETA80G1234 has been emailed to your address.
          </div>
          <button class="btn-primary" onclick="window.AvinyaModals.closeAll()">Return to Website</button>
        </div>
      `;
    }
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

  // --- VOLUNTEER MODAL ---
  openVolunteerModal() {
    const volunteerContainer = document.querySelector('#volunteer-modal .modal-container');
    if (volunteerContainer && this.volunteerFormHTML) {
      volunteerContainer.innerHTML = this.volunteerFormHTML;
    }
    this.openModal('volunteer-modal');
  }

  handleVolunteerSubmit(e) {
    e.preventDefault();
    const modalContainer = document.querySelector('#volunteer-modal .modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
        <div style="text-align: center; padding: 2rem 1rem;">
          <div style="width: 72px; height: 72px; background: rgba(98, 181, 159, 0.2); border-radius: 50%; color: #087F73; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem;">✓</div>
          <h2 style="font-size: 2rem; margin-bottom: 1rem;">Welcome to the Avinya Community!</h2>
          <p style="color: var(--text-dark-muted); font-size: 1.1rem; margin-bottom: 2rem;">
            Thank you for applying to volunteer. Our community coordinator in Mumbai/Pune will reach out to you via Phone/WhatsApp within 24 hours.
          </p>
          <button class="btn-primary" onclick="window.AvinyaModals.closeAll()">Close</button>
        </div>
      `;
    }
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
