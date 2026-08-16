/**
 * Avinya Care Foundation - Continuum of Care Smooth Scroll Storytelling Engine
 * Zero-flicker pre-rendered grid overlay panel architecture for liquid 60FPS transitions.
 */

const journeyStages = [
  {
    step: "Stage 01",
    title: "Awareness",
    tagline: "Knowledge empowers people and breaks stigma.",
    description: "Understanding symptoms, risk factors, and myths about cancer equips individuals and communities to take charge of their health early.",
    checklist: [
      "Understanding family health history & risk factors",
      "Recognizing subtle body changes early",
      "Promoting open, stigma-free health conversations"
    ],
    ctaText: "View Awareness Toolkit & Guide →"
  },
  {
    step: "Stage 02",
    title: "Screening",
    tagline: "Early detection saves lives.",
    description: "Regular health check-ups and targeted screenings significantly increase treatment success rates and simplify care pathways.",
    checklist: [
      "Access to low-cost or free screening clinics",
      "Age-appropriate mammograms, Pap tests, and colonoscopies",
      "Guidance from community healthcare workers"
    ],
    ctaText: "View Screening Checklist →"
  },
  {
    step: "Stage 03",
    title: "Diagnosis",
    tagline: "No one should face the news alone.",
    description: "Receiving a cancer diagnosis is emotionally overwhelming. Avinya provides instant emotional support, second opinions, and patient navigation.",
    checklist: [
      "Compassionate oncology counseling",
      "Financial guidance & medical insurance assistance",
      "Connecting with peer survivor mentors"
    ],
    ctaText: "Explore Diagnosis Navigation →"
  },
  {
    step: "Stage 04",
    title: "Treatment",
    tagline: "Comprehensive care and compassionate companionship.",
    description: "Navigating chemotherapy, radiation, or surgery requires physical, nutritional, and emotional support for both patients and caregivers.",
    checklist: [
      "Caregiver relief & respite assistance",
      "Nutritional & side-effect management counseling",
      "Transportation assistance to treatment centers"
    ],
    ctaText: "Explore Treatment Support →"
  },
  {
    step: "Stage 05",
    title: "Recovery",
    tagline: "Hope continues long beyond treatment.",
    description: "Life after treatment brings new milestones. We foster long-term wellness, post-treatment monitoring, and thriving survivor networks.",
    checklist: [
      "Post-treatment rehabilitation & wellness programs",
      "Survivor support groups & mentorship opportunities",
      "Ongoing routine surveillance monitoring"
    ],
    ctaText: "View Recovery & Care Toolkit & Guide →"
  }
];

class JourneyTimeline {
  constructor() {
    this.section = document.getElementById('journey');
    this.nodes = document.querySelectorAll('.timeline-node');
    this.progressBar = document.querySelector('.timeline-progress');
    this.detailCard = document.getElementById('journey-detail-card');
    this.currentIndex = -1;

    if (!this.section || !this.detailCard) return;

    this.init();
  }

  init() {
    // 1. Pre-render all 5 stage panels in DOM inside grid container for zero-latency CSS cross-fading
    this.renderAllPanels();

    // 2. Add click handlers to stage nodes for manual selection
    this.nodes.forEach((node, index) => {
      node.addEventListener('click', () => this.selectStage(index));
    });

    // 3. Select stage 0 initially
    this.selectStage(0);

    // 4. Scroll listener for smooth scroll progression
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', () => {
      requestAnimationFrame(this.handleScroll);
    }, { passive: true });
  }

  renderAllPanels() {
    if (!this.detailCard) return;

    this.detailCard.innerHTML = journeyStages.map((stage, idx) => `
      <div class="journey-stage-panel ${idx === 0 ? 'active' : ''}" data-stage="${idx}">
        <div class="journey-detail-content">
          <span class="category-tag">${stage.step} — ${stage.title}</span>
          <h3>${stage.tagline}</h3>
          <p>${stage.description}</p>
          <button class="btn-primary" onclick="window.AvinyaModals.openGuideModal('${stage.title}')">
            <span>${stage.ctaText}</span>
          </button>
        </div>
        <div class="journey-checklist-box">
          <h4 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Key Initiatives & Steps</h4>
          <ul class="journey-checklist">
            ${stage.checklist.map(item => `
              <li>
                <span class="check-icon">✓</span>
                <span>${item}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    this.panels = this.detailCard.querySelectorAll('.journey-stage-panel');
  }

  handleScroll() {
    if (!this.section) return;

    // Respect user prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = this.section.getBoundingClientRect();
    const sectionHeight = this.section.offsetHeight - window.innerHeight;

    if (sectionHeight <= 0) return;

    // Calculate scroll progress (0 to 1) within the 400vh Continuum of Care section
    const progress = Math.max(0, Math.min(1, -rect.top / sectionHeight));

    // Calculate target stage index with balanced 20% progress thresholds
    let targetIndex = 0;
    if (progress < 0.20) {
      targetIndex = 0;
    } else if (progress < 0.40) {
      targetIndex = 1;
    } else if (progress < 0.60) {
      targetIndex = 2;
    } else if (progress < 0.80) {
      targetIndex = 3;
    } else {
      targetIndex = 4;
    }

    if (targetIndex !== this.currentIndex) {
      this.selectStage(targetIndex);
    }
  }

  selectStage(index) {
    if (index === this.currentIndex) return;
    this.currentIndex = index;

    // Update Node Active States
    this.nodes.forEach((node, idx) => {
      node.classList.toggle('active', idx <= index);
    });

    // Update Progress Bar Width
    const progressPercent = (index / (this.nodes.length - 1)) * 100;
    if (this.progressBar) {
      this.progressBar.style.width = `${progressPercent}%`;
    }

    // Toggle Stage Panel Active States (instant GPU-accelerated CSS cross-fade)
    if (this.panels) {
      this.panels.forEach((panel, idx) => {
        panel.classList.toggle('active', idx === index);
      });
    }
  }
}

window.JourneyTimeline = JourneyTimeline;
