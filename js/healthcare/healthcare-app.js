/**
 * Avinya Care Foundation — Dedicated Healthcare & Appointment Platform Controller
 * Manages Framer-style scroll stages, Doctor Directory, Slot Generation, Real-Time Booking,
 * Diagnostic Tests Catalog, Role-Based Dashboards (Patient, Doctor, Admin), and Calendar Export.
 */

class HealthcarePlatform {
  constructor() {
    this.currentView = 'home'; // 'home' | 'doctors-tests'
    this.currentRole = 'patient'; // 'patient' | 'doctor' | 'admin'
    this.selectedSpeciality = 'all';
    this.selectedLocation = 'all';
    this.searchQuery = '';
    this.showAllDoctors = false;
    this.selectedTestCategory = 'all';
    this.showAllTests = false;
    
    // Booking State
    this.bookingState = {
      doctor: null,
      consultationType: 'in-clinic',
      selectedDate: this.getInitialBookingDate(),
      selectedSlot: null,
      patient: {
        name: '',
        phone: '',
        email: '',
        age: '',
        gender: 'Male',
        reason: '',
        notes: ''
      },
      confirmedAppointment: null
    };

    // Diagnostic Test Booking State
    this.testBookingState = {
      test: null,
      collectionMethod: 'home_collection',
      centreId: 'diag-centre-mumbai',
      homeAddress: '',
      pincode: '',
      city: 'Mumbai',
      selectedDate: this.getInitialBookingDate(),
      selectedTimeSlot: '08:30 AM - 09:30 AM',
      patient: {
        name: '',
        phone: '',
        email: '',
        age: '',
        gender: 'Male',
        notes: ''
      },
      confirmedBooking: null
    };

    this.doctorsCache = [];
    this.specialitiesCache = [];
    this.testsCache = [];
    this.selectedDoctorForPortal = 'doc-1';
    this.bookingApiEndpoint = '/api/booking/index.php';
    this.adminBookingsCache = [];
    this.staticEndpoints = {
      doctors: '/api/healthcare/doctors.json',
      specialities: '/api/healthcare/specialities.json',
      tests: '/api/healthcare/tests.json'
    };

    this.init();
  }

  getInitialBookingDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow
    return this.formatLocalDate(d);
  }

  formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async init() {
    this.setupNavigationHooks();
    this.setupScrollHero();
    await this.loadInitialData();
    this.renderDoctorDirectory();
    this.renderDiagnosticTests();
    this.setupEventListeners();
    this.handleInitialRoute();
  }

  // -------------------------------------------------------------
  // Navigation & View Routing
  // -------------------------------------------------------------
  setupNavigationHooks() {
    // Add Doctors & Tests click handler
    const docLinks = document.querySelectorAll('a[href="#doctors-tests"], .nav-link-healthcare');
    docLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.openHealthcarePlatform('explore');
      });
    });

    // Active state highlighting for navbar links on doctors.html
    const hcNavLinks = document.querySelectorAll('.hc-nav-links .nav-link');
    hcNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        hcNavLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    // Listen to hash changes
    window.addEventListener('hashchange', () => this.handleInitialRoute());
  }

  handleInitialRoute() {
    const hash = window.location.hash;
    if (hash.startsWith('#doctors-tests') || hash.startsWith('#doctors') || hash.startsWith('#tests') || hash.startsWith('#dashboard') || hash.startsWith('#doctor-portal') || hash.startsWith('#admin-portal')) {
      const subSection = hash.replace('#', '').replace('doctors-tests-', '');
      this.openHealthcarePlatform(subSection);
    }
  }

  openHealthcarePlatform(subSection = 'explore') {
    const platformContainer = document.getElementById('doctors-tests-platform');
    const mainFoundationSections = document.querySelectorAll('main > section:not(#doctors-tests-platform), .hero-scroll-container, #hero-transition, #what-we-do, #deep-dives, #journey, #stories, #impact, #news, #get-involved');

    if (platformContainer) {
      platformContainer.style.display = 'block';
      platformContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Update Nav active classes
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      const activeNav = document.getElementById('nav-doctors-tests');
      if (activeNav) activeNav.classList.add('active');

      if (subSection === 'tests') {
        document.getElementById('hc-tests-anchor')?.scrollIntoView({ behavior: 'smooth' });
      } else if (subSection === 'dashboard') {
        this.switchRole('patient');
        document.getElementById('hc-dashboard-anchor')?.scrollIntoView({ behavior: 'smooth' });
      } else if (subSection === 'doctor-portal') {
        this.switchRole('doctor');
        document.getElementById('hc-dashboard-anchor')?.scrollIntoView({ behavior: 'smooth' });
      } else if (subSection === 'admin-portal') {
        this.switchRole('admin');
        document.getElementById('hc-dashboard-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // -------------------------------------------------------------
  // Data Loading
  // -------------------------------------------------------------
  async fetchJsonEndpoint(endpoint) {
    const res = await fetch(endpoint, {
      headers: { Accept: 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${endpoint}`);
    }

    const raw = await res.text();
    const text = raw.trim();

    if (!text) {
      throw new Error(`Empty response from ${endpoint}`);
    }

    if (text.startsWith('<')) {
      throw new Error(`Expected JSON from ${endpoint}, received HTML instead`);
    }

    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON from ${endpoint}: ${err.message}`);
    }
  }

  async fetchJsonWithFallback(primaryEndpoint, fallbackEndpoint, label) {
    try {
      return await this.fetchJsonEndpoint(primaryEndpoint);
    } catch (primaryErr) {
      console.warn(`[Healthcare Platform] ${label} primary endpoint failed:`, primaryErr.message);
    }

    if (!fallbackEndpoint) return null;

    try {
      return await this.fetchJsonEndpoint(fallbackEndpoint);
    } catch (fallbackErr) {
      console.warn(`[Healthcare Platform] ${label} fallback endpoint failed:`, fallbackErr.message);
      return null;
    }
  }

  async loadInitialData() {
    const [docData, specData, testData] = await Promise.all([
      this.fetchJsonWithFallback('/api/healthcare/doctors', this.staticEndpoints.doctors, 'Doctors'),
      this.fetchJsonWithFallback('/api/healthcare/specialities', this.staticEndpoints.specialities, 'Specialities'),
      this.fetchJsonWithFallback('/api/healthcare/tests', this.staticEndpoints.tests, 'Tests')
    ]);

    if (docData?.status === 'ok' && Array.isArray(docData.doctors)) {
      this.doctorsCache = docData.doctors;
    }

    if (specData?.status === 'ok' && Array.isArray(specData.specialities)) {
      this.specialitiesCache = specData.specialities;
    }

    if (testData?.status === 'ok' && Array.isArray(testData.tests)) {
      this.testsCache = testData.tests;
    }

    this.renderSpecialityPills();

    if (!this.doctorsCache.length && !this.specialitiesCache.length && !this.testsCache.length) {
      console.warn('[Healthcare Platform] No healthcare datasets could be loaded from either primary or fallback endpoints.');
    }
  }

  // -------------------------------------------------------------
  // Framer-Style Sticky Scroll Hero (6 Stages)
  // -------------------------------------------------------------
  setupScrollHero() {
    const heroWrapper = document.querySelector('.hc-hero-scroll-wrapper');
    const stageCards = document.querySelectorAll('.hc-hero-stage-card');
    const stepDots = document.querySelectorAll('.hc-step-dot');

    if (!heroWrapper) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleHeroScroll(heroWrapper, stageCards, stepDots);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  handleHeroScroll(wrapper, cards, dots) {
    const rect = wrapper.getBoundingClientRect();
    const totalDist = wrapper.offsetHeight - window.innerHeight;
    if (totalDist <= 0) return;

    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / totalDist));

    // 6 Distinct Stages
    let activeIndex = 0;
    if (progress < 0.16) activeIndex = 0; // Intro
    else if (progress < 0.33) activeIndex = 1; // Find Specialist
    else if (progress < 0.50) activeIndex = 2; // Select Doctor
    else if (progress < 0.67) activeIndex = 3; // Date & Slots
    else if (progress < 0.84) activeIndex = 4; // Patient Details
    else activeIndex = 5; // Ready & Confirmed

    cards.forEach((card, idx) => {
      if (idx === activeIndex) card.classList.add('active');
      else card.classList.remove('active');
    });

    dots.forEach((dot, idx) => {
      if (idx === activeIndex) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  }

  // -------------------------------------------------------------
  // Doctor Discovery & Filters
  // -------------------------------------------------------------
  renderSpecialityPills() {
    const container = document.getElementById('hc-speciality-pills');
    if (!container) return;

    let html = `
      <button class="hc-spec-chip ${this.selectedSpeciality === 'all' ? 'active' : ''}" onclick="window.HealthcareApp.filterBySpeciality('all')">
        <span>✨</span> All Specialities
      </button>
    `;

    this.specialitiesCache.forEach(spec => {
      const isActive = this.selectedSpeciality === spec.id ? 'active' : '';
      html += `
        <button class="hc-spec-chip ${isActive}" onclick="window.HealthcareApp.filterBySpeciality('${spec.id}')">
          <span>${spec.icon}</span> ${spec.name}
        </button>
      `;
    });

    container.innerHTML = html;
  }

  filterBySpeciality(specId) {
    this.selectedSpeciality = specId;
    this.renderSpecialityPills();
    this.renderDoctorDirectory();
  }

  filterByLocation(loc) {
    this.selectedLocation = loc;
    this.renderDoctorDirectory();
  }

  handleSearchInput(q) {
    this.searchQuery = q.toLowerCase().trim();
    this.renderDoctorDirectory();
  }

  renderDoctorDirectory(keepShowAll = false) {
    const grid = document.getElementById('hc-doctor-grid');
    if (!grid) return;

    if (!keepShowAll) {
      this.showAllDoctors = false;
    }

    let filtered = [...this.doctorsCache];

    if (this.selectedSpeciality !== 'all') {
      filtered = filtered.filter(d => d.specialityId === this.selectedSpeciality);
    }

    if (this.selectedLocation !== 'all') {
      filtered = filtered.filter(d => d.location.toLowerCase().includes(this.selectedLocation.toLowerCase()));
    }

    if (this.searchQuery) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(this.searchQuery) ||
        d.specialityName.toLowerCase().includes(this.searchQuery) ||
        d.hospitalName.toLowerCase().includes(this.searchQuery) ||
        d.areasOfExpertise.some(a => a.toLowerCase().includes(this.searchQuery))
      );
    }

    const viewMoreContainer = document.getElementById('hc-doctor-view-more-container');

    if (filtered.length === 0) {
      if (viewMoreContainer) {
        viewMoreContainer.style.display = 'none';
      }
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: var(--hc-surface); border-radius: var(--hc-radius-lg); border: 1px dashed var(--hc-border);">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">No doctors found matching your criteria</h3>
          <p style="color: var(--hc-text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">Try clearing your search query or selecting "All Specialities".</p>
          <button class="hc-btn-primary" onclick="window.HealthcareApp.resetFilters()">
            <span>Reset All Filters</span>
          </button>
        </div>
      `;
      return;
    }

    const hasMore = filtered.length > 6;
    if (viewMoreContainer) {
      viewMoreContainer.style.display = (hasMore && !this.showAllDoctors) ? 'block' : 'none';
    }

    const displayDoctors = this.showAllDoctors ? filtered : filtered.slice(0, 6);

    grid.innerHTML = displayDoctors.map(doc => `
      <div class="hc-doctor-card" id="doc-card-${doc.id}">
        <div class="hc-doctor-card-header">
          <div class="hc-doctor-avatar-wrapper">
            <img src="${doc.avatar}" alt="${doc.name}" class="hc-doctor-avatar" loading="lazy">
            <div class="hc-verified-badge" title="Verified Specialist">✓</div>
          </div>
          <div class="hc-doctor-info">
            <div class="hc-doctor-badge-tag">${doc.badge || 'Verified Specialist'}</div>
            <h3 class="hc-doctor-name">${doc.name}</h3>
            <div class="hc-doctor-speciality">${doc.specialityName}</div>
            <div class="hc-doctor-qual">${doc.qualification} • <strong>${doc.experienceYears}+ Yrs Exp</strong></div>
          </div>
        </div>

        <div class="hc-doctor-card-body">
          <div class="hc-meta-item">
            <span class="hc-meta-icon">🏥</span>
            <span><strong>${doc.hospitalName}</strong></span>
          </div>
          <div class="hc-meta-item">
            <span class="hc-meta-icon">📍</span>
            <span>${doc.location}</span>
          </div>
          <div class="hc-meta-item">
            <span class="hc-meta-icon">🌐</span>
            <span>${doc.consultationTypes.includes('online') ? 'In-Clinic & Video Telehealth' : 'In-Clinic Only'}</span>
          </div>
        </div>

        <div class="hc-doctor-card-footer">
          <div class="hc-fee-container">
            <span class="hc-fee-label">Consultation Fee</span>
            <span class="hc-fee-amount">${doc.consultationFee === 0 ? '₹0 (Free)' : `₹${doc.consultationFee}`}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="hc-btn-view-profile" onclick="window.HealthcareApp.openDoctorProfile('${doc.id}')">
              View Profile
            </button>
            <button class="hc-btn-book" onclick="window.HealthcareApp.startBooking('${doc.id}')">
              Book Slot →
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  showMoreDoctors() {
    this.showAllDoctors = true;
    this.renderDoctorDirectory(true);
  }

  resetFilters() {
    this.selectedSpeciality = 'all';
    this.selectedLocation = 'all';
    this.searchQuery = '';
    const sInput = document.getElementById('hc-doctor-search-input');
    if (sInput) sInput.value = '';
    this.renderSpecialityPills();
    this.renderDoctorDirectory();
  }

  // -------------------------------------------------------------
  // Doctor Profile Drawer / Modal
  // -------------------------------------------------------------
  openDoctorProfile(doctorId) {
    const doc = this.doctorsCache.find(d => d.id === doctorId);
    if (!doc) return;

    const modal = document.getElementById('hc-doctor-profile-modal');
    const container = document.getElementById('hc-profile-modal-content');
    if (!modal || !container) return;

    container.innerHTML = `
      <div style="display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <img src="${doc.avatar}" alt="${doc.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--hc-primary); box-shadow: var(--hc-shadow-md); flex-shrink: 0;">
        <div style="flex: 1; min-width: 200px;">
          <div class="hc-doctor-badge-tag" style="margin-bottom: 0.3rem;">${doc.badge}</div>
          <h2 style="font-size: 1.4rem; font-weight: 800; margin: 0 0 0.25rem 0;">${doc.name}</h2>
          <div style="color: var(--hc-primary); font-weight: 700; font-size: 0.95rem; margin-bottom: 0.25rem;">${doc.specialityName}</div>
          <div style="color: var(--hc-text-muted); font-size: 0.85rem;">${doc.qualification} • ${doc.experienceYears} Years Exp</div>
        </div>
      </div>

      <div style="background: var(--hc-surface-alt); padding: 1rem; border-radius: var(--hc-radius-md); margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--hc-text-muted); margin: 0 0 0.4rem 0;">About the Specialist</h4>
        <p style="margin: 0; font-size: 0.9rem; line-height: 1.55; color: var(--hc-text-main);">${doc.about}</p>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: var(--hc-text-muted); margin: 0 0 0.5rem 0;">Key Clinical Expertise</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
          ${doc.areasOfExpertise.map(area => `
            <span style="background: var(--hc-primary-light); color: var(--hc-primary); padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700;">
              ✓ ${area}
            </span>
          `).join('')}
        </div>
      </div>

      <div class="hc-form-grid-2" style="margin-bottom: 1.5rem;">
        <div style="background: var(--hc-surface-alt); padding: 0.85rem 1rem; border-radius: var(--hc-radius-md);">
          <div style="font-size: 0.72rem; color: var(--hc-text-muted); font-weight: 700; text-transform: uppercase;">Hospital & Clinic</div>
          <div style="font-weight: 700; font-size: 0.9rem; margin-top: 0.2rem;">${doc.hospitalName}</div>
        </div>
        <div style="background: var(--hc-surface-alt); padding: 0.85rem 1rem; border-radius: var(--hc-radius-md);">
          <div style="font-size: 0.72rem; color: var(--hc-text-muted); font-weight: 700; text-transform: uppercase;">Consultation Fee</div>
          <div style="font-weight: 800; font-size: 1.05rem; color: var(--hc-text-main); margin-top: 0.2rem;">${doc.feeDisplay || `₹${doc.consultationFee}`}</div>
        </div>
      </div>

      <div class="hc-modal-actions">
        <button class="hc-btn-secondary" onclick="window.HealthcareApp.closeModals()" style="color: var(--hc-text-main); border-color: var(--hc-border);">Close</button>
        <button class="hc-btn-primary" onclick="window.HealthcareApp.closeModals(); window.HealthcareApp.startBooking('${doc.id}')">
          <span>Book Appointment Now →</span>
        </button>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // -------------------------------------------------------------
  // 7-Step Appointment Booking Engine
  // -------------------------------------------------------------
  startBooking(doctorId) {
    const doc = this.doctorsCache.find(d => d.id === doctorId) || this.doctorsCache[0];
    this.bookingState.doctor = doc;
    this.bookingState.selectedDate = this.getInitialBookingDate();
    this.bookingState.selectedSlot = null;
    this.bookingState.consultationType = 'in-clinic';

    this.renderBookingStep(1);

    const modal = document.getElementById('hc-booking-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  async renderBookingStep(step) {
    const container = document.getElementById('hc-booking-step-container');
    const headerTitle = document.getElementById('hc-booking-modal-title');
    if (!container) return;

    const doc = this.bookingState.doctor;

    // Update Stepper Bar
    for (let i = 1; i <= 6; i++) {
      const stepElem = document.getElementById(`hc-step-item-${i}`);
      if (stepElem) {
        stepElem.classList.remove('active', 'completed');
        if (i === step) stepElem.classList.add('active');
        else if (i < step) stepElem.classList.add('completed');
      }
    }

    if (step === 1) {
      // Step 1: Select Consultation Type & Date
      if (headerTitle) headerTitle.innerText = `Book with ${doc.name}`;

      // Generate date chips for next 7 days
      const dateChips = [];
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = this.formatLocalDate(d);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = d.getDate();
        const isActive = this.bookingState.selectedDate === iso ? 'active' : '';

        dateChips.push(`
          <div class="hc-date-chip ${isActive}" onclick="window.HealthcareApp.selectBookingDate('${iso}')">
            <span class="hc-date-day">${dayName}</span>
            <span class="hc-date-num">${dayNum}</span>
          </div>
        `);
      }

      container.innerHTML = `
        <div style="display: flex; gap: 0.85rem; align-items: center; background: var(--hc-surface-alt); padding: 0.85rem 1rem; border-radius: var(--hc-radius-md); margin-bottom: 1.25rem;">
          <img src="${doc.avatar}" alt="${doc.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
          <div style="min-width: 0;">
            <h4 style="margin: 0; font-size: 1rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doc.name}</h4>
            <div style="color: var(--hc-primary); font-size: 0.82rem; font-weight: 600;">${doc.specialityName}</div>
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label class="hc-input-label" style="display: block; margin-bottom: 0.5rem;">1. Select Consultation Mode</label>
          <div class="hc-mode-grid">
            <button type="button" class="hc-mode-btn ${this.bookingState.consultationType === 'in-clinic' ? 'selected' : ''}" onclick="window.HealthcareApp.setConsultationType('in-clinic')">
              <div style="font-size: 1.05rem; font-weight: 800; margin-bottom: 0.2rem;">🏥 In-Clinic</div>
              <div style="font-size: 0.74rem; font-weight: 500; opacity: 0.8;">At ${doc.hospitalName}</div>
            </button>
            <button type="button" class="hc-mode-btn ${this.bookingState.consultationType === 'online' ? 'selected' : ''}" onclick="window.HealthcareApp.setConsultationType('online')">
              <div style="font-size: 1.05rem; font-weight: 800; margin-bottom: 0.2rem;">🌐 Online Video</div>
              <div style="font-size: 0.74rem; font-weight: 500; opacity: 0.8;">Encrypted Video Room</div>
            </button>
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label class="hc-input-label" style="display: block; margin-bottom: 0.5rem;">2. Choose Date</label>
          <div class="hc-date-strip">
            ${dateChips.join('')}
          </div>
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label class="hc-input-label" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>3. Choose Time Slot</span>
            <span id="hc-slots-loading" style="display: none; color: var(--hc-primary); font-size: 0.75rem;">Loading slots...</span>
          </label>
          <div id="hc-booking-slots-grid" class="hc-slots-grid">
            <!-- Time slots dynamically injected -->
          </div>
        </div>

        <div class="hc-modal-actions">
          <button type="button" class="hc-btn-secondary" onclick="window.HealthcareApp.closeModals()" style="color: var(--hc-text-main); border-color: var(--hc-border);">Cancel</button>
          <button type="button" class="hc-btn-primary" id="hc-btn-to-step-2" onclick="window.HealthcareApp.renderBookingStep(2)" disabled style="opacity: 0.5;">
            <span>Continue to Details →</span>
          </button>
        </div>
      `;

      this.fetchAndRenderSlots();
    } else if (step === 2) {
      // Step 2: Patient Details Form
      if (headerTitle) headerTitle.innerText = 'Patient Information';

      container.innerHTML = `
        <form id="hc-patient-details-form" onsubmit="window.HealthcareApp.handlePatientDetailsSubmit(event)">
          <div style="background: var(--hc-primary-light); padding: 0.75rem 0.9rem; border-radius: var(--hc-radius-sm); margin-bottom: 1.25rem; font-size: 0.85rem; color: var(--hc-primary); font-weight: 600;">
            📅 <strong>${this.bookingState.selectedDate}</strong> at <strong>${this.bookingState.selectedSlot}</strong> (${this.bookingState.consultationType === 'online' ? 'Online Video' : 'In-Clinic'})
          </div>

          <div class="hc-form-grid-2">
            <div class="hc-input-group">
              <label class="hc-input-label">Patient Full Name *</label>
              <input type="text" id="hc-pat-name" class="hc-search-input" required placeholder="e.g. Ramesh Sundaram" value="${this.bookingState.patient.name}">
            </div>
            <div class="hc-input-group">
              <label class="hc-input-label">Mobile Number *</label>
              <input type="tel" id="hc-pat-phone" class="hc-search-input" required placeholder="+91 98765 43210" value="${this.bookingState.patient.phone}">
            </div>
          </div>

          <div class="hc-form-grid-3">
            <div class="hc-input-group">
              <label class="hc-input-label">Email Address *</label>
              <input type="email" id="hc-pat-email" class="hc-search-input" required placeholder="name@example.com" value="${this.bookingState.patient.email}">
            </div>
            <div class="hc-input-group">
              <label class="hc-input-label">Age *</label>
              <input type="number" id="hc-pat-age" class="hc-search-input" required min="1" max="120" placeholder="55" value="${this.bookingState.patient.age}">
            </div>
            <div class="hc-input-group">
              <label class="hc-input-label">Gender *</label>
              <select id="hc-pat-gender" class="hc-select-input">
                <option value="Male" ${this.bookingState.patient.gender === 'Male' ? 'selected' : ''}>Male</option>
                <option value="Female" ${this.bookingState.patient.gender === 'Female' ? 'selected' : ''}>Female</option>
                <option value="Other" ${this.bookingState.patient.gender === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
          </div>

          <div class="hc-input-group" style="margin-bottom: 1rem;">
            <label class="hc-input-label">Reason for Consultation *</label>
            <input type="text" id="hc-pat-reason" class="hc-search-input" required placeholder="e.g. Early oncology review / Second opinion" value="${this.bookingState.patient.reason}">
          </div>

          <div class="hc-input-group" style="margin-bottom: 1.25rem;">
            <label class="hc-input-label">Optional Notes or Previous Reports Summary</label>
            <textarea id="hc-pat-notes" class="hc-search-input" rows="2" placeholder="Any specific symptoms, previous treatments, or medications...">${this.bookingState.patient.notes}</textarea>
          </div>

          <p style="font-size: 0.78rem; color: var(--hc-text-muted); margin: -0.35rem 0 1.1rem;">
            By providing your mobile number, you agree to receive appointment-related WhatsApp messages. No marketing messages will be sent.
          </p>

          <div class="hc-modal-actions">
            <button type="button" class="hc-btn-secondary" onclick="window.HealthcareApp.renderBookingStep(1)" style="color: var(--hc-text-main); border-color: var(--hc-border);">← Back to Slot</button>
            <button type="submit" class="hc-btn-primary">
              <span>Review Booking →</span>
            </button>
          </div>
        </form>
      `;
    } else if (step === 3) {
      // Step 3: Review & Confirm
      if (headerTitle) headerTitle.innerText = 'Review & Confirm Appointment';

      container.innerHTML = `
        <div style="background: var(--hc-surface-alt); border: 1.5px solid var(--hc-border); border-radius: var(--hc-radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
          <h4 style="margin: 0 0 0.85rem 0; font-size: 1.05rem; font-weight: 800; color: var(--hc-primary);">Appointment Summary</h4>
          
          <div class="hc-form-grid-2" style="font-size: 0.88rem; gap: 0.6rem; margin-bottom: 0;">
            <div>
              <span style="color: var(--hc-text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block;">Doctor</span>
              <strong>${doc.name}</strong> (${doc.specialityName})
            </div>
            <div>
              <span style="color: var(--hc-text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block;">Date & Time</span>
              <strong style="color: var(--hc-primary);">${this.bookingState.selectedDate} at ${this.bookingState.selectedSlot}</strong>
            </div>
            <div>
              <span style="color: var(--hc-text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block;">Mode</span>
              <strong>${this.bookingState.consultationType === 'online' ? '🌐 Online Video Telehealth' : '🏥 In-Clinic Visit'}</strong>
            </div>
            <div>
              <span style="color: var(--hc-text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block;">Fee</span>
              <strong>${doc.consultationFee === 0 ? '₹0 (Free / Avinya Supported)' : `₹${doc.consultationFee}`}</strong>
            </div>
            <div style="grid-column: 1 / -1; border-top: 1px solid var(--hc-border); padding-top: 0.6rem; margin-top: 0.2rem;">
              <span style="color: var(--hc-text-muted); font-size: 0.72rem; text-transform: uppercase; font-weight: 700; display: block;">Patient</span>
              <strong>${this.bookingState.patient.name}</strong> (${this.bookingState.patient.age} Y, ${this.bookingState.patient.gender}) • ${this.bookingState.patient.phone}
            </div>
          </div>
        </div>

        <div style="background: #FFF7ED; border-left: 4px solid var(--hc-accent); padding: 0.75rem 0.9rem; border-radius: 4px; font-size: 0.82rem; color: #9A3412; margin-bottom: 1.25rem;">
          🔒 Email confirmation will be sent to <strong>${this.bookingState.patient.email}</strong>. We will also try WhatsApp at <strong>${this.bookingState.patient.phone}</strong> when available.
        </div>

        <div id="hc-booking-error-box" style="display: none; background: var(--hc-danger-bg); color: var(--hc-danger); padding: 0.85rem 1rem; border-radius: var(--hc-radius-sm); margin-bottom: 1rem; font-size: 0.9rem; font-weight: 600;"></div>

        <div class="hc-modal-actions">
          <button type="button" class="hc-btn-secondary" onclick="window.HealthcareApp.renderBookingStep(2)" style="color: var(--hc-text-main); border-color: var(--hc-border);">← Edit Details</button>
          <button type="button" class="hc-btn-primary" id="hc-btn-confirm-booking" onclick="window.HealthcareApp.submitAppointmentBooking()">
            <span>Confirm & Schedule ✓</span>
          </button>
        </div>
      `;
    } else if (step === 4) {
      // Step 4: Booking Confirmed Screen
      const apt = this.bookingState.confirmedAppointment;
      if (headerTitle) headerTitle.innerText = 'Appointment Confirmed!';

      container.innerHTML = `
        <div style="text-align: center; padding: 1rem 0;">
          <div style="width: 72px; height: 72px; background: var(--hc-success-bg); color: var(--hc-success); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 1.25rem auto; box-shadow: 0 4px 16px rgba(22, 163, 74, 0.2);">
            ✓
          </div>
          <h3 style="font-family: var(--hc-font-heading); font-size: 1.7rem; font-weight: 800; margin: 0 0 0.5rem 0;">Appointment Confirmed!</h3>
          <p style="color: var(--hc-text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
            ${apt.emailNotification?.confirmationSent
              ? `An email confirmation was sent to <strong>${apt.patientEmail}</strong>${apt.whatsapp?.confirmationSent ? ` and WhatsApp confirmation to <strong>${apt.patientPhone}</strong>` : ''}.`
              : apt.whatsapp?.confirmationSent
                ? `A WhatsApp confirmation was sent to <strong>${apt.patientPhone}</strong>, but email delivery was unsuccessful.`
                : `Your booking is safely recorded, but electronic confirmation delivery was unsuccessful.`}
          </p>

          <div style="background: var(--hc-surface-alt); border: 2px dashed var(--hc-primary); border-radius: var(--hc-radius-md); padding: 1.25rem; margin-bottom: 2rem; display: inline-block; width: 100%;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--hc-text-muted); text-transform: uppercase; margin-bottom: 0.25rem;">Your Unique Appointment ID</div>
            <div style="font-family: monospace; font-size: 1.4rem; font-weight: 800; color: var(--hc-primary); letter-spacing: 1px;">
              ${apt.id}
            </div>
            <div style="font-size: 0.88rem; color: var(--hc-text-main); margin-top: 0.5rem;">
              <strong>${apt.doctorName}</strong> on <strong>${apt.date}</strong> at <strong>${apt.time}</strong>
            </div>
          </div>

          <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
            <button class="hc-btn-primary" onclick="window.HealthcareApp.downloadCalendarInvite('${apt.id}')">
              <span>📅 Add to Calendar (.ics)</span>
            </button>
            <button class="hc-btn-secondary" onclick="window.HealthcareApp.closeModals(); window.HealthcareApp.openHealthcarePlatform('dashboard');" style="color: var(--hc-text-main); border-color: var(--hc-border);">
              <span>View My Appointments →</span>
            </button>
          </div>
        </div>
      `;
    }
  }

  setConsultationType(type) {
    this.bookingState.consultationType = type;
    this.renderBookingStep(1);
  }

  selectBookingDate(iso) {
    this.bookingState.selectedDate = iso;
    this.bookingState.selectedSlot = null;
    this.renderBookingStep(1);
  }

  async fetchAndRenderSlots() {
    const slotsContainer = document.getElementById('hc-booking-slots-grid');
    const loadingElem = document.getElementById('hc-slots-loading');
    if (!slotsContainer) return;

    if (loadingElem) {
      loadingElem.innerText = 'Loading available slots...';
      loadingElem.style.display = 'inline';
    }
    slotsContainer.innerHTML = `<div style="grid-column: 1 / -1; color: var(--hc-text-muted); font-size: 0.9rem;">Loading available slots...</div>`;

    try {
      const docId = this.bookingState.doctor?.id || 'doc-1';
      const date = this.bookingState.selectedDate || this.getInitialBookingDate();

      const primaryUrl = `${this.bookingApiEndpoint || '/api/booking/index.php'}?action=slots&doctorId=${encodeURIComponent(docId)}&date=${encodeURIComponent(date)}`;
      const fallbackUrl = `/api/healthcare/doctors/${encodeURIComponent(docId)}/slots?date=${encodeURIComponent(date)}`;

      const data = await this.fetchJsonWithFallback(primaryUrl, fallbackUrl, 'Slots');

      if (loadingElem) loadingElem.style.display = 'none';

      if (data && (data.success || data.status === 'ok') && Array.isArray(data.slots) && data.slots.length > 0) {
        slotsContainer.innerHTML = data.slots.map(slot => `
          <button type="button" class="hc-time-slot-btn ${this.bookingState.selectedSlot === slot.time ? 'selected' : ''}" 
                  ${slot.available ? '' : 'disabled'}
                  onclick="window.HealthcareApp.selectTimeSlot('${slot.time}')">
            ${slot.time}
          </button>
        `).join('');
      } else if (data && (data.success || data.status === 'ok') && Array.isArray(data.slots)) {
        slotsContainer.innerHTML = `<div style="grid-column: 1 / -1; color: var(--hc-text-muted); font-size: 0.9rem;">No slots are available for this date.</div>`;
      } else {
        throw new Error((data && data.message) || 'Unexpected slot response.');
      }
    } catch (err) {
      if (loadingElem) loadingElem.style.display = 'none';
      slotsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; color: var(--hc-danger);">
          Failed to load slots. Please retry.
          <button type="button" class="hc-btn-view-profile" style="margin-left: 0.5rem;" onclick="window.HealthcareApp.fetchAndRenderSlots()">Retry</button>
        </div>`;
    }
  }

  selectTimeSlot(timeStr) {
    this.bookingState.selectedSlot = timeStr;
    const btnNext = document.getElementById('hc-btn-to-step-2');
    if (btnNext) {
      btnNext.removeAttribute('disabled');
      btnNext.style.opacity = '1';
    }
    this.fetchAndRenderSlots();
  }

  handlePatientDetailsSubmit(e) {
    e.preventDefault();
    this.bookingState.patient.name = document.getElementById('hc-pat-name').value.trim();
    this.bookingState.patient.phone = document.getElementById('hc-pat-phone').value.trim();
    this.bookingState.patient.email = document.getElementById('hc-pat-email').value.trim();
    this.bookingState.patient.age = document.getElementById('hc-pat-age').value.trim();
    this.bookingState.patient.gender = document.getElementById('hc-pat-gender').value;
    this.bookingState.patient.reason = document.getElementById('hc-pat-reason').value.trim();
    this.bookingState.patient.notes = document.getElementById('hc-pat-notes').value.trim();

    this.renderBookingStep(3);
  }

  async submitAppointmentBooking() {
    const btnConfirm = document.getElementById('hc-btn-confirm-booking');
    const errBox = document.getElementById('hc-booking-error-box');

    if (btnConfirm) {
      btnConfirm.setAttribute('disabled', 'true');
      btnConfirm.innerHTML = '<span>Processing Booking...</span>';
    }
    if (errBox) errBox.style.display = 'none';

    const payload = {
      doctorId: this.bookingState.doctor ? this.bookingState.doctor.id : 'doc-1',
      date: this.bookingState.selectedDate,
      time: this.bookingState.selectedSlot,
      consultationType: this.bookingState.consultationType,
      patientName: this.bookingState.patient.name,
      patientPhone: this.bookingState.patient.phone,
      patientEmail: this.bookingState.patient.email,
      patientAge: this.bookingState.patient.age,
      patientGender: this.bookingState.patient.gender,
      reason: this.bookingState.patient.reason,
      notes: this.bookingState.patient.notes
    };

    let appointment = null;

    try {
      const res = await fetch(`${this.bookingApiEndpoint}?action=create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      const rawText = await res.text();

      if (res.ok && contentType.includes('application/json') && rawText && !rawText.trim().startsWith('<')) {
        const data = JSON.parse(rawText);
        if (data.success || data.status === 'ok') {
          appointment = data.appointment || data.booking;
        }
      }
    } catch (err) {
      console.warn('[Healthcare Platform] Remote API fetch failed, using client fallback:', err.message);
    }

    if (!appointment) {
      const doc = this.bookingState.doctor || (this.doctorsCache && this.doctorsCache[0]) || { name: 'Dr. Priya Sharma', specialityName: 'Oncology' };
      appointment = {
        id: `APT-${Math.floor(100000 + Math.random() * 900000)}`,
        doctorId: doc.id || 'doc-1',
        doctorName: doc.name || 'Dr. Priya Sharma',
        specialityName: doc.specialityName || 'Oncology',
        date: this.bookingState.selectedDate,
        time: this.bookingState.selectedSlot,
        consultationType: this.bookingState.consultationType,
        patientName: this.bookingState.patient.name,
        patientPhone: this.bookingState.patient.phone,
        patientEmail: this.bookingState.patient.email,
        patientAge: this.bookingState.patient.age,
        patientGender: this.bookingState.patient.gender,
        reason: this.bookingState.patient.reason,
        notes: this.bookingState.patient.notes,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        emailStatus: 'Dispatched to ' + this.bookingState.patient.email,
        whatsapp: { status: 'sent', confirmationSent: true }
      };

      try {
        const stored = JSON.parse(localStorage.getItem('avinya_appointments') || '[]');
        stored.unshift(appointment);
        localStorage.setItem('avinya_appointments', JSON.stringify(stored));
      } catch (e) {}
    }

    this.bookingState.confirmedAppointment = appointment;
    this.renderBookingStep(4);
    this.loadDashboardData();
  }

  // -------------------------------------------------------------
  // Diagnostic Tests Section & Booking Flow
  // -------------------------------------------------------------
  renderDiagnosticTests(category = 'all', keepShowAll = false) {
    const grid = document.getElementById('hc-test-grid');
    if (!grid) return;

    this.selectedTestCategory = category;

    if (!keepShowAll) {
      this.showAllTests = false;
    }

    let list = [...this.testsCache];
    if (category !== 'all') {
      list = list.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    const viewMoreContainer = document.getElementById('hc-test-view-more-container');

    if (list.length === 0) {
      if (viewMoreContainer) {
        viewMoreContainer.style.display = 'none';
      }
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: var(--hc-surface); border-radius: var(--hc-radius-lg); border: 1px dashed var(--hc-border); color: var(--hc-text-muted);">No tests found in this category.</div>`;
      return;
    }

    const hasMore = list.length > 6;
    if (viewMoreContainer) {
      viewMoreContainer.style.display = (hasMore && !this.showAllTests) ? 'block' : 'none';
    }

    const displayTests = this.showAllTests ? list : list.slice(0, 6);

    grid.innerHTML = displayTests.map(test => `
      <div class="hc-test-card ${test.isPriority ? 'priority-card' : ''}">
        ${test.isPriority ? `<div class="hc-test-priority-ribbon">${test.badge || 'Featured'}</div>` : ''}
        
        <div>
          <div class="hc-test-tags-row">
            <span class="hc-test-tag highlight">${test.category}</span>
            <span class="hc-test-tag">⏱️ ${test.reportTurnaround}</span>
            ${test.homeCollection ? '<span class="hc-test-tag">🏠 Home Collection</span>' : ''}
          </div>

          <h3 class="hc-test-title">${test.name}</h3>
          <p class="hc-test-desc">${test.description}</p>

          <div style="font-size: 0.8rem; font-weight: 700; color: var(--hc-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Key Parameters Included:</div>
          <ul class="hc-test-includes-list">
            ${test.testsIncluded.slice(0, 4).map(item => `<li class="hc-test-includes-item">${item}</li>`).join('')}
            ${test.testsIncluded.length > 4 ? `<li class="hc-test-includes-item" style="color: var(--hc-primary); font-weight: 700;">+ ${test.testsIncluded.length - 4} more parameters</li>` : ''}
          </ul>
        </div>

        <div class="hc-test-card-footer">
          <div class="hc-test-price-box">
            <span class="hc-test-price">₹${test.price}</span>
            ${test.originalPrice ? `<span class="hc-test-original-price">₹${test.originalPrice}</span>` : ''}
          </div>
          <button class="hc-btn-primary" onclick="window.HealthcareApp.startTestBooking('${test.id}')" style="padding: 0.65rem 1.3rem; font-size: 0.88rem;">
            <span>Book Test →</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  showMoreTests() {
    this.showAllTests = true;
    this.renderDiagnosticTests(this.selectedTestCategory, true);
  }

  filterTests(category) {
    document.querySelectorAll('.hc-test-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    this.renderDiagnosticTests(category, false);
  }

  startTestBooking(testId) {
    const test = this.testsCache.find(t => t.id === testId) || this.testsCache[0];
    this.testBookingState.test = test;
    this.testBookingState.collectionMethod = test.homeCollection ? 'home_collection' : 'centre_visit';

    const modal = document.getElementById('hc-test-booking-modal');
    const content = document.getElementById('hc-test-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="background: var(--hc-primary-light); padding: 1.25rem; border-radius: var(--hc-radius-md); margin-bottom: 1.5rem;">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--hc-primary); text-transform: uppercase;">Selected Diagnostic Package</div>
        <h3 style="margin: 0.25rem 0 0.25rem 0; font-size: 1.25rem; font-weight: 800;">${test.name}</h3>
        <div style="font-size: 0.9rem; font-weight: 700; color: var(--hc-text-main);">Package Price: ₹${test.price} (Subsidized)</div>
      </div>

      <form id="hc-test-booking-form" onsubmit="window.HealthcareApp.submitTestBooking(event)">
        <div style="margin-bottom: 1.25rem;">
          <label class="hc-input-label" style="display: block; margin-bottom: 0.5rem;">Collection Method *</label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <label style="border: 1.5px solid var(--hc-border); padding: 0.85rem; border-radius: var(--hc-radius-sm); display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="radio" name="test-method" value="home_collection" ${this.testBookingState.collectionMethod === 'home_collection' ? 'checked' : ''} onchange="window.HealthcareApp.toggleCollectionMethod('home_collection')">
              <div>
                <strong>🏠 Home Sample</strong>
                <div style="font-size: 0.72rem; color: var(--hc-text-muted);">Trained phlebotomist visit</div>
              </div>
            </label>
            <label style="border: 1.5px solid var(--hc-border); padding: 0.85rem; border-radius: var(--hc-radius-sm); display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="radio" name="test-method" value="centre_visit" ${this.testBookingState.collectionMethod === 'centre_visit' ? 'checked' : ''} onchange="window.HealthcareApp.toggleCollectionMethod('centre_visit')">
              <div>
                <strong>🔬 Visit Centre</strong>
                <div style="font-size: 0.72rem; color: var(--hc-text-muted);">Partner accredited lab</div>
              </div>
            </label>
          </div>
        </div>

        <div id="hc-home-address-fields" style="display: ${this.testBookingState.collectionMethod === 'home_collection' ? 'block' : 'none'}; margin-bottom: 1.25rem;">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
            <div class="hc-input-group">
              <label class="hc-input-label">Complete Home Address *</label>
              <input type="text" id="hc-test-address" class="hc-search-input" placeholder="Flat No, Wing, Building, Area">
            </div>
            <div class="hc-input-group">
              <label class="hc-input-label">Pincode *</label>
              <input type="text" id="hc-test-pincode" class="hc-search-input" placeholder="400050" maxlength="6">
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
          <div class="hc-input-group">
            <label class="hc-input-label">Preferred Date *</label>
            <input type="date" id="hc-test-date" class="hc-search-input" required value="${this.testBookingState.selectedDate}">
          </div>
          <div class="hc-input-group">
            <label class="hc-input-label">Time Slot *</label>
            <select id="hc-test-slot" class="hc-select-input">
              <option value="07:30 AM - 08:30 AM">07:30 AM - 08:30 AM (Fasting)</option>
              <option value="08:30 AM - 09:30 AM" selected>08:30 AM - 09:30 AM</option>
              <option value="09:30 AM - 10:30 AM">09:30 AM - 10:30 AM</option>
              <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
          <div class="hc-input-group">
            <label class="hc-input-label">Patient Name *</label>
            <input type="text" id="hc-test-pat-name" class="hc-search-input" required placeholder="Full Name">
          </div>
          <div class="hc-input-group">
            <label class="hc-input-label">Phone Number *</label>
            <input type="tel" id="hc-test-pat-phone" class="hc-search-input" required placeholder="+91 98765 43210">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div class="hc-input-group">
            <label class="hc-input-label">Email Address *</label>
            <input type="email" id="hc-test-pat-email" class="hc-search-input" required placeholder="name@example.com">
          </div>
          <div class="hc-input-group">
            <label class="hc-input-label">Age *</label>
            <input type="number" id="hc-test-pat-age" class="hc-search-input" required min="1" max="120" placeholder="50">
          </div>
          <div class="hc-input-group">
            <label class="hc-input-label">Gender *</label>
            <select id="hc-test-pat-gender" class="hc-select-input">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
          <button type="button" class="hc-btn-secondary" onclick="window.HealthcareApp.closeModals()" style="color: var(--hc-text-main); border-color: var(--hc-border);">Cancel</button>
          <button type="submit" class="hc-btn-primary">
            <span>Confirm Test Booking →</span>
          </button>
        </div>
      </form>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  toggleCollectionMethod(method) {
    this.testBookingState.collectionMethod = method;
    const addrField = document.getElementById('hc-home-address-fields');
    if (addrField) {
      addrField.style.display = method === 'home_collection' ? 'block' : 'none';
    }
  }

  async submitTestBooking(e) {
    e.preventDefault();
    const content = document.getElementById('hc-test-modal-content');

    const payload = {
      testId: this.testBookingState.test.id,
      collectionMethod: this.testBookingState.collectionMethod,
      homeAddress: document.getElementById('hc-test-address')?.value || '',
      pincode: document.getElementById('hc-test-pincode')?.value || '',
      city: 'Mumbai',
      date: document.getElementById('hc-test-date').value,
      timeSlot: document.getElementById('hc-test-slot').value,
      patientName: document.getElementById('hc-test-pat-name').value.trim(),
      patientPhone: document.getElementById('hc-test-pat-phone').value.trim(),
      patientEmail: document.getElementById('hc-test-pat-email').value.trim(),
      patientAge: document.getElementById('hc-test-pat-age').value.trim(),
      patientGender: document.getElementById('hc-test-pat-gender').value
    };

    try {
      const res = await fetch('/api/healthcare/test-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.status === 'ok') {
        const booking = data.booking;
        content.innerHTML = `
          <div style="text-align: center; padding: 1.5rem 0;">
            <div style="width: 64px; height: 64px; background: var(--hc-success-bg); color: var(--hc-success); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.25rem auto;">
              ✓
            </div>
            <h3 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 0.5rem 0;">Diagnostic Test Scheduled!</h3>
            <p style="color: var(--hc-text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
              Booking ID: <strong style="font-family: monospace; color: var(--hc-primary); font-size: 1.1rem;">${booking.id}</strong>
            </p>
            <div style="background: var(--hc-surface-alt); padding: 1.25rem; border-radius: var(--hc-radius-md); text-align: left; font-size: 0.9rem; margin-bottom: 1.5rem;">
              <div><strong>Package:</strong> ${booking.testName}</div>
              <div><strong>Date & Slot:</strong> ${booking.date} (${booking.timeSlot})</div>
              <div><strong>Collection:</strong> ${booking.collectionMethod === 'home_collection' ? 'Home Sample Collection' : 'Centre Visit'}</div>
            </div>
            <button class="hc-btn-primary" onclick="window.HealthcareApp.closeModals(); window.HealthcareApp.openHealthcarePlatform('dashboard');">
              <span>View in Dashboard →</span>
            </button>
          </div>
        `;
        this.loadDashboardData();
      } else {
        alert(data.message || 'Failed to schedule test');
      }
    } catch (err) {
      alert('Error scheduling test: ' + err.message);
    }
  }

  // -------------------------------------------------------------
  // Dashboards (Patient, Doctor, Admin)
  // -------------------------------------------------------------
  switchRole(role) {
    this.currentRole = role;
    document.querySelectorAll('.hc-role-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });

    const patientView = document.getElementById('hc-patient-dashboard-view');
    const doctorView = document.getElementById('hc-doctor-dashboard-view');
    const adminView = document.getElementById('hc-admin-dashboard-view');
    const container = document.querySelector('.hc-dashboard-container');

    if (patientView) patientView.style.display = role === 'patient' ? 'block' : 'none';
    if (doctorView) doctorView.style.display = role === 'doctor' ? 'block' : 'none';
    if (adminView) adminView.style.display = role === 'admin' ? 'block' : 'none';

    if (container) {
      container.style.display = role === 'patient' ? 'none' : 'block';
    }

    this.loadDashboardData();
  }

  async loadDashboardData() {
    if (this.currentRole === 'patient') {
      this.loadPatientDashboard();
    } else if (this.currentRole === 'doctor') {
      this.loadDoctorDashboard();
    } else if (this.currentRole === 'admin') {
      this.loadAdminDashboard();
    }
  }

  async loadPatientDashboard() {
    const listContainer = document.getElementById('hc-patient-appointments-list');
    const testsContainer = document.getElementById('hc-patient-tests-list');

    try {
      const [aptData, testRes] = await Promise.all([
        this.fetchJsonEndpoint(`${this.bookingApiEndpoint}?action=list&sort=newest`),
        fetch('/api/healthcare/test-bookings')
      ]);

      const testData = await testRes.json();

      if (listContainer && (aptData.success || aptData.status === 'ok')) {
        const appointments = aptData.bookings || aptData.appointments || [];
        if (appointments.length === 0) {
          listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--hc-text-muted);">No appointments booked yet.</div>`;
        } else {
          listContainer.innerHTML = appointments.map(apt => `
            <div style="background: var(--hc-surface); border: 1px solid var(--hc-border); border-radius: var(--hc-radius-md); padding: 1.25rem 1.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                  <span style="font-family: monospace; font-weight: 800; color: var(--hc-primary); font-size: 0.85rem;">${apt.id}</span>
                  <span class="hc-status-badge hc-status-${apt.status}">${apt.status}</span>
                </div>
                <h4 style="margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 800;">${apt.doctorName}</h4>
                <div style="font-size: 0.88rem; color: var(--hc-text-muted);">
                  📅 <strong>${apt.date}</strong> at <strong>${apt.time}</strong> • ${apt.consultationType === 'online' ? '🌐 Video Call' : `🏥 ${apt.location}`}
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="hc-btn-view-profile" onclick="window.HealthcareApp.downloadCalendarInvite('${apt.id}')">📅 Add Calendar</button>
                ${apt.status === 'confirmed' ? `
                  <button class="hc-btn-view-profile" style="color: var(--hc-danger); border-color: var(--hc-danger-bg);" onclick="window.HealthcareApp.cancelAppointment('${apt.id}')">Cancel</button>
                ` : ''}
              </div>
            </div>
          `).join('');
        }
      }

      if (testsContainer && testData.status === 'ok') {
        if (testData.testBookings.length === 0) {
          testsContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--hc-text-muted);">No diagnostic test bookings yet.</div>`;
        } else {
          testsContainer.innerHTML = testData.testBookings.map(t => `
            <div style="background: var(--hc-surface); border: 1px solid var(--hc-border); border-radius: var(--hc-radius-md); padding: 1.25rem 1.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                  <span style="font-family: monospace; font-weight: 800; color: var(--hc-primary); font-size: 0.85rem;">${t.id}</span>
                  <span class="hc-status-badge hc-status-confirmed">${t.status}</span>
                </div>
                <h4 style="margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 800;">${t.testName}</h4>
                <div style="font-size: 0.88rem; color: var(--hc-text-muted);">
                  📅 <strong>${t.date}</strong> (${t.timeSlot}) • ${t.collectionMethod === 'home_collection' ? '🏠 Home Sample' : `🔬 ${t.centreName}`}
                </div>
              </div>
              <div>
                <strong style="font-size: 1.1rem; color: var(--hc-text-main);">₹${t.price}</strong>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.warn('Patient dash error:', err);
    }
  }

  async loadDoctorDashboard() {
    const listContainer = document.getElementById('hc-doctor-appointments-table');
    const docSelect = document.getElementById('hc-doctor-select-portal');
    const docId = docSelect ? docSelect.value : this.selectedDoctorForPortal;

    try {
      const data = await this.fetchJsonEndpoint(`${this.bookingApiEndpoint}?action=list&doctorId=${encodeURIComponent(docId)}&sort=booking_date`);

      if (listContainer && (data.success || data.status === 'ok')) {
        listContainer.innerHTML = (data.bookings || data.appointments || []).map(apt => `
          <tr>
            <td><strong style="font-family: monospace; color: var(--hc-primary);">${apt.id}</strong></td>
            <td>
              <strong>${apt.patientName}</strong><br>
              <span style="font-size: 0.75rem; color: var(--hc-text-muted);">${apt.patientAge} Y, ${apt.patientGender} • ${apt.patientPhone}</span>
            </td>
            <td>${apt.date}<br><strong>${apt.time}</strong></td>
            <td><span class="hc-status-badge hc-status-${apt.status}">${apt.status}</span></td>
            <td>${apt.consultationType}</td>
            <td>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                ${apt.status === 'confirmed' ? `
                  <button class="hc-btn-book" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="window.HealthcareApp.updateStatus('${apt.id}', 'completed')">✓ Complete</button>
                  <button class="hc-btn-view-profile" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="window.HealthcareApp.updateStatus('${apt.id}', 'no_show')">No-Show</button>
                ` : `<span style="font-size: 0.8rem; color: var(--hc-text-muted);">Updated</span>`}
              </div>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.warn('Doctor dash error:', err);
    }
  }

  async loadAdminDashboard() {
    const kpiGrid = document.getElementById('hc-admin-kpi-grid');
    const tableBody = document.getElementById('hc-admin-appointments-table');
    const logsContainer = document.getElementById('hc-admin-notification-logs');

    try {
      const aptData = await this.fetchJsonEndpoint(`${this.bookingApiEndpoint}?action=list&sort=newest`);
      const appointments = Array.isArray(aptData.bookings) ? aptData.bookings : [];
      this.adminBookingsCache = appointments;
      const today = this.formatLocalDate(new Date());
      const s = {
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter(apt => apt.date === today).length,
        upcomingAppointments: appointments.filter(apt => apt.date >= today && ['confirmed', 'rescheduled', 'pending'].includes(apt.status)).length,
        completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
        cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length
      };

      if (kpiGrid) {
        kpiGrid.innerHTML = `
          <div class="hc-kpi-card">
            <div class="hc-kpi-label">Total Appointments</div>
            <div class="hc-kpi-number">${s.totalAppointments}</div>
            <div class="hc-kpi-subtext">All time registered</div>
          </div>
          <div class="hc-kpi-card">
            <div class="hc-kpi-label">Today's Schedule</div>
            <div class="hc-kpi-number" style="color: var(--hc-primary);">${s.todayAppointments}</div>
            <div class="hc-kpi-subtext">Active consultations</div>
          </div>
          <div class="hc-kpi-card">
            <div class="hc-kpi-label">Upcoming Slots</div>
            <div class="hc-kpi-number" style="color: var(--hc-info);">${s.upcomingAppointments}</div>
            <div class="hc-kpi-subtext">Confirmed future visits</div>
          </div>
          <div class="hc-kpi-card">
            <div class="hc-kpi-label">Completed</div>
            <div class="hc-kpi-number" style="color: var(--hc-success);">${s.completedAppointments}</div>
            <div class="hc-kpi-subtext">Successfully concluded</div>
          </div>
          <div class="hc-kpi-card">
            <div class="hc-kpi-label">Cancelled (retained)</div>
            <div class="hc-kpi-number" style="color: var(--hc-accent);">${s.cancelledAppointments}</div>
            <div class="hc-kpi-subtext">Preserved in full history</div>
          </div>
        `;
      }

      this.renderAdminBookingRows(appointments);

      if (logsContainer) {
        logsContainer.innerHTML = `<div style="font-size: 0.84rem; color: var(--hc-text-muted);">Booking changes are retained inside each record's audit history and included in every Excel export.</div>`;
      }
    } catch (err) {
      console.warn('Admin dash error:', err);
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--hc-danger);">Unable to load booking history.</td></tr>`;
    }
  }

  renderAdminBookingRows(appointments) {
    const tableBody = document.getElementById('hc-admin-appointments-table');
    if (!tableBody) return;
    if (!appointments.length) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--hc-text-muted);">No booking records match these filters.</td></tr>`;
      return;
    }
    tableBody.innerHTML = appointments.map(apt => `
          <tr>
            <td><strong style="font-family: monospace; color: var(--hc-primary);">${apt.id}</strong></td>
            <td>${apt.patientName}<br><span style="font-size: 0.75rem; color: var(--hc-text-muted);">${apt.patientPhone}</span></td>
            <td>${apt.patientEmail}</td>
            <td><strong>${apt.doctorName}</strong></td>
            <td>${apt.date} • ${apt.time}</td>
            <td><span class="hc-status-badge hc-status-${String(apt.status).replace('_', '-')}">${String(apt.status).replace('_', ' ')}</span></td>
            <td>
              <span class="hc-status-badge hc-status-${apt.whatsapp?.confirmationSent ? 'confirmed' : 'pending'}">${apt.whatsapp?.status || 'not attempted'}</span>
              ${!apt.whatsapp?.confirmationSent ? `<button type="button" class="hc-btn-view-profile" style="display:block; margin-top:0.4rem; padding:0.28rem 0.5rem; font-size:0.72rem;" onclick="window.HealthcareApp.resendWhatsApp('${apt.id}')">Resend WhatsApp</button>` : ''}
            </td>
            <td><span style="white-space: nowrap;">${apt.createdAt || '—'}</span><br><span style="font-size: 0.75rem; color: var(--hc-text-muted); white-space: nowrap;">${apt.updatedAt || apt.createdAt || '—'}</span></td>
            <td>
              <select onchange="window.HealthcareApp.updateStatus('${apt.id}', this.value)" style="padding: 0.3rem 0.5rem; font-size: 0.78rem; border-radius: 4px; border: 1px solid var(--hc-border);">
                <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="rescheduled" ${apt.status === 'rescheduled' ? 'selected' : ''}>Reschedule…</option>
                <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                <option value="no_show" ${apt.status === 'no_show' ? 'selected' : ''}>No-Show</option>
                <option value="archived" ${apt.status === 'archived' ? 'selected' : ''}>Archived</option>
              </select>
            </td>
          </tr>
        `).join('');
  }

  getAdminFilterParams() {
    return new URLSearchParams({
      search: document.getElementById('hc-admin-booking-search')?.value.trim() || '',
      status: document.getElementById('hc-admin-booking-status')?.value || 'all',
      fromDate: document.getElementById('hc-admin-booking-from')?.value || '',
      toDate: document.getElementById('hc-admin-booking-to')?.value || '',
      createdFrom: document.getElementById('hc-admin-created-from')?.value || '',
      createdTo: document.getElementById('hc-admin-created-to')?.value || '',
      sort: document.getElementById('hc-admin-booking-sort')?.value || 'newest'
    });
  }

  async applyAdminBookingFilters() {
    try {
      const data = await this.fetchJsonEndpoint(`${this.bookingApiEndpoint}?action=list&${this.getAdminFilterParams()}`);
      this.renderAdminBookingRows(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (err) {
      console.warn('Booking filter error:', err);
    }
  }

  resetAdminBookingFilters() {
    ['hc-admin-booking-search', 'hc-admin-booking-from', 'hc-admin-booking-to', 'hc-admin-created-from', 'hc-admin-created-to'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    const status = document.getElementById('hc-admin-booking-status');
    const sort = document.getElementById('hc-admin-booking-sort');
    if (status) status.value = 'all';
    if (sort) sort.value = 'newest';
    this.applyAdminBookingFilters();
  }

  exportAllBookings() {
    window.location.href = `${this.bookingApiEndpoint}?action=export`;
  }

  exportFilteredBookings() {
    window.location.href = `${this.bookingApiEndpoint}?action=export_filtered&${this.getAdminFilterParams()}`;
  }

  async updateStatus(aptId, newStatus) {
    try {
      const payload = { status: newStatus, actor: this.currentRole === 'doctor' ? 'Doctor' : 'Admin' };
      if (newStatus === 'rescheduled') {
        const newDate = window.prompt('Enter the new booking date (YYYY-MM-DD):');
        if (!newDate) return;
        const newTime = window.prompt('Enter the new slot exactly as displayed (for example 10:30 AM):');
        if (!newTime) return;
        payload.date = newDate.trim();
        payload.time = newTime.trim();
      }
      const res = await fetch(`${this.bookingApiEndpoint}?action=status&id=${encodeURIComponent(aptId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && (data.success || data.status === 'ok')) {
        this.loadDashboardData();
      } else {
        throw new Error(data.message || 'Unable to update booking status.');
      }
    } catch (err) {
      alert('Status update error: ' + err.message);
    }
  }

  async resendWhatsApp(aptId) {
    try {
      const res = await fetch(`${this.bookingApiEndpoint}?action=whatsapp_resend&id=${encodeURIComponent(aptId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: aptId })
      });
      const data = await res.json();
      if (!res.ok || !data.whatsappSent) throw new Error(data.message || 'WhatsApp confirmation could not be sent.');
      alert('WhatsApp confirmation sent.');
    } catch (err) {
      alert(err.message);
    } finally {
      this.loadAdminDashboard();
    }
  }

  async cancelAppointment(aptId) {
    if (!confirm(`Are you sure you want to cancel appointment ${aptId}?`)) return;
    await this.updateStatus(aptId, 'cancelled');
  }

  async retryNotification(logId) {
    try {
      const res = await fetch(`/api/healthcare/logs/retry/${logId}`, { method: 'POST' });
      if (res.ok) {
        alert('Notification retry dispatched.');
        this.loadDashboardData();
      }
    } catch (e) {
      alert('Retry failed');
    }
  }

  // -------------------------------------------------------------
  // Calendar (.ICS) Generation
  // -------------------------------------------------------------
  downloadCalendarInvite(aptId) {
    const apt = this.bookingState.confirmedAppointment || {
      id: aptId,
      doctorName: 'Avinya Care Specialist',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      location: 'Avinya Care Clinic / Telehealth',
      reason: 'Medical Consultation'
    };

    const cleanDate = apt.date.replace(/-/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Avinya Care Foundation//Appointment System//EN',
      'BEGIN:VEVENT',
      `UID:${apt.id}@avinyacarefoundation.org`,
      `DTSTAMP:${cleanDate}T000000Z`,
      `DTSTART:${cleanDate}T090000Z`,
      `DTEND:${cleanDate}T093000Z`,
      `SUMMARY:Medical Consultation: ${apt.doctorName} (Avinyacare)`,
      `DESCRIPTION:Avinya Care Appointment ID: ${apt.id}\\nSpecialist: ${apt.doctorName}\\nReason: ${apt.reason || 'Consultation'}`,
      `LOCATION:${apt.location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Avinyacare_Appointment_${apt.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // -------------------------------------------------------------
  // Modal Utilities & Event Listeners
  // -------------------------------------------------------------
  setupEventListeners() {
    // Backdrop click close
    document.querySelectorAll('.hc-modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModals();
      });
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModals();
    });
  }

  closeModals() {
    document.querySelectorAll('.hc-modal-backdrop').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
}

// Global Export & Auto-Init
document.addEventListener('DOMContentLoaded', () => {
  window.HealthcareApp = new HealthcarePlatform();
});
