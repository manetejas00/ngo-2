/**
 * Avinya Care Foundation - Cancer Journey Timeline & Interactive Stage Switcher
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
    ]
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
    ]
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
    ]
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
    ]
  },
  {
    step: "Stage 05",
    title: "Recovery & Care",
    tagline: "Hope continues long beyond treatment.",
    description: "Life after treatment brings new milestones. We foster long-term wellness, post-treatment monitoring, and thriving survivor networks.",
    checklist: [
      "Post-treatment rehabilitation & wellness programs",
      "Survivor support groups & mentorship opportunities",
      "Ongoing routine surveillance monitoring"
    ]
  }
];

class JourneyTimeline {
  constructor() {
    this.nodes = document.querySelectorAll('.timeline-node');
    this.progressBar = document.querySelector('.timeline-progress');
    this.detailCard = document.getElementById('journey-detail-card');
    this.currentIndex = 0;

    if (!this.nodes.length || !this.detailCard) return;

    this.init();
  }

  init() {
    this.nodes.forEach((node, index) => {
      node.addEventListener('click', () => this.selectStage(index));
    });

    // Render initial stage
    this.selectStage(0);
  }

  selectStage(index) {
    this.currentIndex = index;
    const stage = journeyStages[index];

    // Update Node active states
    this.nodes.forEach((node, idx) => {
      if (idx <= index) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });

    // Update Progress Line width
    const progressPercent = (index / (this.nodes.length - 1)) * 100;
    if (this.progressBar) {
      this.progressBar.style.width = `${progressPercent}%`;
    }

    // Render Stage Detail
    this.detailCard.innerHTML = `
      <div class="journey-detail-content">
        <span class="category-tag">${stage.step} — ${stage.title}</span>
        <h3>${stage.tagline}</h3>
        <p>${stage.description}</p>
        <button class="btn-primary" onclick="window.AvinyaModals.openGuideModal('${stage.title}')">
          View ${stage.title} Toolkit & Guide →
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
    `;
  }
}

window.JourneyTimeline = JourneyTimeline;
