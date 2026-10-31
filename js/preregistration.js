/**
 * Avinya Care Foundation - Pre-Registration Page Script
 * Manages campaign filtering, validation, async form dispatch, printable pass generation,
 * and automated camp registration closure on the day of the camp (29 November 2026).
 */

(function () {
  'use strict';

  // Camp Schedule & Auto-Closure Configuration
  const CAMP_CONFIG = {
    campId: 'CAMP-2026-VIRAR',
    campTitle: 'Avinya Care Foundation – Mega Health Checkup with Free Tests',
    dateStr: '2026-11-29',
    // Registration closes on the day of the camp (Sunday, 29 Nov 2026 00:00:00 IST)
    cutoffTime: new Date('2026-11-29T00:00:00+05:30').getTime(),
    campEndTime: new Date('2026-11-29T16:00:00+05:30').getTime(),
    venue: 'Yashwant Nagar, Virar West',
    helpline: '+91 74474 41116'
  };

  let isRegistrationClosed = false;
  let countdownTimerId = null;

  document.addEventListener('DOMContentLoaded', initPreregistration);

  async function initPreregistration() {
    setupCampaignTabs();
    await initAutoClosureEngine();
    setupFormSubmission();
  }

  // 1. Campaign Filtering Tabs
  function setupCampaignTabs() {
    const tabs = document.querySelectorAll('.camp-tab-btn');
    const cards = document.querySelectorAll('.camp-card');

    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        const filter = this.getAttribute('data-filter') || 'all';

        cards.forEach(card => {
          if (filter === 'all') {
            card.style.display = 'flex';
          } else {
            const cardCategory = card.getAttribute('data-category') || '';
            const cardStatus = card.getAttribute('data-status') || '';
            const match = cardCategory.includes(filter) || cardStatus.includes(filter);
            card.style.display = match ? 'flex' : 'none';
          }
        });
      });
    });
  }

  // 2. Automated Camp Closure Engine
  async function initAutoClosureEngine() {
    const statusResult = await checkRegistrationStatus();
    isRegistrationClosed = statusResult.isClosed;
    applyRegistrationState(statusResult.isClosed, statusResult);

    // If still open, set up live monitoring to automatically close when cutoff is reached
    if (!statusResult.isClosed) {
      startClosureCountdown();
    }
  }

  async function checkRegistrationStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Support URL-based manual simulation for testing & previews
    const paramStatus = urlParams.get('status') || urlParams.get('preview');
    if (paramStatus === 'closed') {
      return { isClosed: true, reason: 'preview_closed', simulated: true };
    }
    if (paramStatus === 'open') {
      return { isClosed: false, reason: 'preview_open', simulated: true };
    }

    // Support simulated test date (e.g. ?test_date=2026-11-29)
    const testDateParam = urlParams.get('test_date');
    const now = testDateParam ? new Date(testDateParam).getTime() : Date.now();

    // Query backend API for centralized status or admin override
    try {
      const res = await fetch('/api/camp-status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.is_open === 'boolean') {
          return {
            isClosed: !data.is_open,
            serverData: data,
            reason: data.is_open ? 'server_open' : 'server_closed'
          };
        }
      }
    } catch (_) {
      // Offline fallback: rely on deterministic client-side IST calculation
    }

    // Default auto-closure logic: on that day (29 Nov 2026 00:00:00 IST), registration closes
    const isPastCutoff = now >= CAMP_CONFIG.cutoffTime;
    return {
      isClosed: isPastCutoff,
      reason: isPastCutoff ? 'auto_closed_camp_day' : 'open'
    };
  }

  function applyRegistrationState(isClosed, details = {}) {
    const heroBadge = document.getElementById('heroRegStatusBadge');
    const heroBtn = document.getElementById('heroRegActionBtn');
    const cardBadge = document.getElementById('campCardStatusBadge');
    const formHeaderTag = document.getElementById('campFormHeaderTag');
    const formEl = document.getElementById('preregistrationForm');
    const closedNotice = document.getElementById('campClosedNotice');

    if (isClosed) {
      // 1. Update Hero Badge
      if (heroBadge) {
        heroBadge.innerHTML = '🔒 Pre-Registration Closed';
        heroBadge.style.color = '#EF4444';
      }

      // 2. Update Hero Action Button
      if (heroBtn) {
        heroBtn.innerHTML = '<span>🔒 Registration Closed (Walk-Ins Welcome)</span><span aria-hidden="true">↓</span>';
        heroBtn.setAttribute('title', 'Pre-registration has closed. Walk-in registrations accepted directly at venue.');
        heroBtn.setAttribute('href', '#campRegistrationSection');
      }

      // 3. Update Camp Showcase Card Badge
      if (cardBadge) {
        cardBadge.className = 'camp-badge badge-closed';
        cardBadge.innerHTML = '🔒 Registration Closed · Walk-Ins Welcome';
      }

      // 4. Update Form Card Header Tag
      if (formHeaderTag) {
        formHeaderTag.textContent = 'CAMP STATUS: REGISTRATION CLOSED';
      }

      // 5. Hide Registration Form & Disable All Form Inputs
      if (formEl) {
        formEl.style.display = 'none';
        formEl.querySelectorAll('input, select, textarea, button').forEach(el => {
          el.disabled = true;
        });
      }

      // 6. Display Clean Walk-In Closure Notice
      if (closedNotice) {
        closedNotice.style.display = 'block';
      }
    } else {
      // Active / Open State
      if (heroBadge) {
        heroBadge.innerHTML = '● Registration Open';
        heroBadge.style.color = '#10B981';
      }
      if (cardBadge) {
        cardBadge.className = 'camp-badge badge-open';
        cardBadge.innerHTML = '✓ Registration Open';
      }
      if (formHeaderTag) {
        formHeaderTag.textContent = 'Official Registration Portal';
      }
      if (closedNotice) {
        closedNotice.style.display = 'none';
      }
      if (formEl) {
        formEl.style.display = 'block';
      }
    }
  }

  function startClosureCountdown() {
    if (countdownTimerId) clearInterval(countdownTimerId);

    const updateCountdown = () => {
      const now = Date.now();
      const timeLeft = CAMP_CONFIG.cutoffTime - now;

      if (timeLeft <= 0) {
        // Cutoff time reached on camp day! Automatically trigger closure UI
        isRegistrationClosed = true;
        applyRegistrationState(true, { reason: 'timer_cutoff_reached' });
        clearInterval(countdownTimerId);
        return;
      }

      // If within 48 hours, update badge with hours remaining
      const heroBadge = document.getElementById('heroRegStatusBadge');
      if (heroBadge && timeLeft < 48 * 3600 * 1000) {
        const hours = Math.floor(timeLeft / (3600 * 1000));
        const mins = Math.floor((timeLeft % (3600 * 1000)) / (60 * 1000));
        heroBadge.innerHTML = `● Closes in ${hours}h ${mins}m`;
      }
    };

    updateCountdown();
    // Check every 30 seconds
    countdownTimerId = setInterval(updateCountdown, 30000);
  }

  // 3. Pre-Registration Form Submission
  function setupFormSubmission() {
    const form = document.getElementById('preregistrationForm');
    if (!form) return;

    const submitBtn = document.getElementById('submitRegBtn');
    const errorAlert = document.getElementById('campFormError');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      if (errorAlert) {
        errorAlert.style.display = 'none';
        errorAlert.textContent = '';
      }

      // Pre-flight check: ensure registration is not closed
      if (isRegistrationClosed) {
        showError('Pre-registration has closed for this camp. Walk-in registrations are accepted directly on-site at Yashwant Nagar, Virar West.');
        applyRegistrationState(true);
        return;
      }

      // Collect required fields
      const fullName = (document.getElementById('full_name')?.value || '').trim();
      const age = parseInt(document.getElementById('age')?.value, 10);
      const gender = (document.getElementById('gender')?.value || '').trim();
      const phone = (document.getElementById('phone')?.value || '').trim();
      const areaLocation = (document.getElementById('area_location')?.value || '').trim();
      const consent = document.getElementById('consent')?.checked;
      const email = (document.getElementById('email')?.value || '').trim();

      // Collect optional health questions
      const checkups = [];
      document.querySelectorAll('input[name="checkups"]:checked').forEach(cb => {
        checkups.push(cb.value);
      });
      const healthConcerns = (document.getElementById('health_concerns')?.value || '').trim();
      const priorScreening = document.querySelector('input[name="prior_screening"]:checked')?.value || 'Not sure';
      const priorCancerDiagnosis = document.querySelector('input[name="prior_cancer_diagnosis"]:checked')?.value || 'Prefer not to say';
      const familyCancerHistory = document.querySelector('input[name="family_cancer_history"]:checked')?.value || 'Prefer not to say';

      // Client-side validation
      if (!fullName) {
        showError('Please enter your full name.');
        return;
      }
      if (isNaN(age) || age < 1 || age > 120) {
        showError('Please enter a valid age between 1 and 120.');
        return;
      }
      if (!gender) {
        showError('Please select your gender.');
        return;
      }
      const cleanPhone = phone.replace(/[\s()-]/g, '');
      if (!/^(?:\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
        showError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        return;
      }
      if (!areaLocation) {
        showError('Please enter your area or location (e.g. Yashwant Nagar, Virar West).');
        return;
      }
      if (!consent) {
        showError('Please agree to be contacted by Avinya Care Foundation regarding camp arrangements.');
        return;
      }

      const payload = {
        form_type: 'preregistration',
        full_name: fullName,
        name: fullName,
        age: age,
        gender: gender,
        phone: cleanPhone,
        mobile: cleanPhone,
        area_location: areaLocation,
        location: areaLocation,
        email: email,
        consent: true,
        checkups: checkups.length ? checkups : ['General health'],
        health_concerns: healthConcerns,
        prior_screening: priorScreening,
        prior_cancer_diagnosis: priorCancerDiagnosis,
        family_cancer_history: familyCancerHistory,
        camp_title: CAMP_CONFIG.campTitle
      };

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>⏳ Submitting Pre-Registration...</span>';
        }

        const res = await fetch('/api/submit-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        // Handle backend registration closure response (HTTP 403 or status 'closed')
        if (res.status === 403 || data.status === 'closed') {
          isRegistrationClosed = true;
          applyRegistrationState(true);
          throw new Error(data.message || 'Pre-registration has closed for this camp. Walk-in registrations are accepted directly on-site at Yashwant Nagar, Virar West.');
        }

        if (!res.ok || data.status !== 'ok') {
          throw new Error(data.message || 'Unable to complete pre-registration. Please try again.');
        }

        // Show Success Pass Card
        displaySuccessPass(payload, data.submissionId || ('CAMP-' + Date.now().toString().slice(-6)));
      } catch (err) {
        showError(err.message || 'A network error occurred. Please try again or call helpline 7447441116.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>📋 Submit Pre-Registration</span>';
        }
      }
    });

    function showError(msg) {
      if (errorAlert) {
        errorAlert.textContent = msg;
        errorAlert.style.display = 'block';
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        alert(msg);
      }
    }
  }

  function displaySuccessPass(data, regId) {
    const formEl = document.getElementById('preregistrationForm');
    const successCard = document.getElementById('regSuccessCard');
    if (!successCard) return;

    if (formEl) formEl.style.display = 'none';
    successCard.style.display = 'block';

    // Populate pass details
    const passRegId = document.getElementById('passRegId');
    const passName = document.getElementById('passName');
    const passAgeGender = document.getElementById('passAgeGender');
    const passPhone = document.getElementById('passPhone');
    const passArea = document.getElementById('passArea');
    const passCheckups = document.getElementById('passCheckups');

    if (passRegId) passRegId.textContent = regId;
    if (passName) passName.textContent = data.full_name;
    if (passAgeGender) passAgeGender.textContent = `${data.age} yrs • ${data.gender}`;
    if (passPhone) passPhone.textContent = data.phone;
    if (passArea) passArea.textContent = data.area_location;
    if (passCheckups) passCheckups.textContent = Array.isArray(data.checkups) ? data.checkups.join(', ') : data.checkups;

    // Scroll to success card
    successCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Window helper functions for UI buttons
  window.resetPreregForm = function () {
    const formEl = document.getElementById('preregistrationForm');
    const successCard = document.getElementById('regSuccessCard');
    if (formEl) {
      formEl.reset();
      formEl.style.display = 'block';
    }
    if (successCard) {
      successCard.style.display = 'none';
    }
  };

  window.scrollToCampForm = function (preselectCheckup) {
    const target = document.getElementById('campRegistrationSection');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    if (preselectCheckup) {
      const cb = document.querySelector(`input[name="checkups"][value="${preselectCheckup}"]`);
      if (cb) cb.checked = true;
    }
  };

  // Expose camp status for console or admin verification
  window.AvinyaCampStatus = {
    getConfig: () => CAMP_CONFIG,
    isClosed: () => isRegistrationClosed,
    setSimulatedState: (closed) => {
      isRegistrationClosed = closed;
      applyRegistrationState(closed);
    }
  };
})();
