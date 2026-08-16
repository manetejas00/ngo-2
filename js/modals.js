/**
 * Avinya Care Foundation - Interactive Modals & Drawers Manager
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    this.selectedAmount = 100;
    this.isMonthly = true;
    this.init();
  }

  init() {
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
    this.closeAll();
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
    document.body.style.overflow = '';
    this.activeModal = null;
  }

  // --- DONATION MODAL LOGIC ---
  openDonateModal(defaultAmount = 100) {
    this.selectedAmount = defaultAmount;
    this.openModal('donate-modal');
    this.updateDonateUI();
  }

  setDonationFrequency(isMonthly) {
    this.isMonthly = isMonthly;
    document.getElementById('freq-monthly').classList.toggle('active', isMonthly);
    document.getElementById('freq-onetime').classList.toggle('active', !isMonthly);
    this.updateDonateUI();
  }

  setDonationAmount(amount) {
    this.selectedAmount = amount;
    document.querySelectorAll('.amount-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-amount')) === amount);
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

  updateDonateUI() {
    const impactText = document.getElementById('impact-calculator-text');
    const submitBtn = document.getElementById('donate-submit-btn');

    let text = "";
    if (this.selectedAmount < 30) {
      text = `Provides 1 early detection screening kit and transport assistance for a rural patient.`;
    } else if (this.selectedAmount < 75) {
      text = `Funds 2 comprehensive clinical breast & cervical screenings + counseling sessions.`;
    } else if (this.selectedAmount < 200) {
      text = `Sponsors 1 month of essential nutrition packages and medical navigation support.`;
    } else {
      text = `Sponsors full diagnostics, emotional therapy, and diagnostic scans for 3 patients.`;
    }

    const freqStr = this.isMonthly ? '/month' : ' one-time';
    if (impactText) impactText.innerHTML = `<strong>Your $${this.selectedAmount}${freqStr} impact:</strong> ${text}`;
    if (submitBtn) submitBtn.textContent = `Donate $${this.selectedAmount}${freqStr}`;
  }

  handleDonationSubmit(e) {
    e.preventDefault();
    const modalContent = document.querySelector('#donate-modal .modal-container');
    if (modalContent) {
      modalContent.innerHTML = `
        <button class="modal-close-btn" onclick="window.AvinyaModals.closeAll()">✕</button>
        <div style="text-align: center; padding: 2rem 1rem;">
          <div style="width: 72px; height: 72px; background: rgba(98, 181, 159, 0.2); border-radius: 50%; color: #087F73; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem;">✓</div>
          <h2 style="font-size: 2rem; margin-bottom: 1rem;">Thank You for Your Compassion!</h2>
          <p style="color: var(--text-dark-muted); font-size: 1.1rem; margin-bottom: 2rem;">
            Your generous contribution of <strong>$${this.selectedAmount}${this.isMonthly ? '/month' : ''}</strong> brings care, dignity, and hope to individuals facing cancer. A receipt has been issued to your email.
          </p>
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
          <h2 style="font-size: 2.2rem; margin-top: 0.5rem; margin-bottom: 1rem;">${author}'s Story</h2>
        </div>
        <div style="width: 100%; height: 260px; border-radius: 20px; overflow: hidden; margin-bottom: 1.5rem;">
          <img src="${imgUrl}" alt="${author}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <blockquote style="font-size: 1.25rem; font-style: italic; color: var(--accent-teal); border-left: 4px solid var(--accent-teal); padding-left: 1rem; margin-bottom: 1.5rem;">
          "${quote}"
        </blockquote>
        <div style="color: var(--text-dark-muted); font-size: 1.05rem; line-height: 1.7;">
          <p style="margin-bottom: 1rem;">${fullStory}</p>
          <p>“Avinya Care Foundation stood by my family when everything felt uncertain. Knowing you have a community behind you changes everything.”</p>
        </div>
      `;
    }
    this.openModal('story-modal');
  }

  // --- VOLUNTEER MODAL ---
  openVolunteerModal() {
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
            Thank you for applying to volunteer. Our community coordinator will reach out to you within 48 hours with orientation details.
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
        <span class="category-tag">Resource Guide</span>
        <h2 style="font-size: 2rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">${topic} Guide & Screening Checklist</h2>
        <div style="color: var(--text-dark-muted); line-height: 1.7; font-size: 1.05rem;">
          <p style="margin-bottom: 1rem;">
            Early detection dramatically improves treatment outcomes. Download or review our clinical checklist for routine self-exams and professional screenings.
          </p>
          <div style="background-color: var(--bg-light); border-radius: 16px; padding: 1.5rem; margin: 1.5rem 0;">
            <h4 style="color: var(--text-dark); margin-bottom: 0.75rem;">Recommended Screening Guidelines:</h4>
            <ul style="padding-left: 1.25rem;">
              <li><strong>Mammogram:</strong> Annually starting at age 40 or earlier for high-risk families.</li>
              <li><strong>Cervical Screening:</strong> Pap test every 3 years for ages 21–65.</li>
              <li><strong>Colorectal Screening:</strong> Regular screening starting at age 45.</li>
              <li><strong>Skin Checks:</strong> Monthly self-exam for unusual moles or skin changes.</li>
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
