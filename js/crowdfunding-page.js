/* Crowdfunding page controls: accessible, data-safe enhancements around the shared donation UI. */
(function () {
  'use strict';

  const money = amount => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`;
  let currentCalcAmount = 2500;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.shareOnWhatsApp = text => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

  window.toggleFaq = button => {
    const item = button.closest('.cf-faq-item');
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.cf-faq-item').forEach(entry => entry.classList.remove('active'));
    if (!wasActive) item.classList.add('active');
  };

  window.setCalcAmount = amount => {
    currentCalcAmount = amount;
    const input = document.getElementById('calc-input');
    if (input) input.value = amount;
    document.querySelectorAll('.cf-preset-pill').forEach(pill => {
      pill.classList.toggle('active', Number(pill.textContent.replace(/[^\d]/g, '')) === amount);
    });
    window.updateCalculator(amount);
  };

  window.updateCalculator = value => {
    const amount = Math.max(0, parseInt(value, 10) || 0);
    currentCalcAmount = amount;
    const deduction = Math.round(amount * 0.5);
    const saved = Math.round(deduction * 0.312);
    document.getElementById('calc-tax-deduction').textContent = money(deduction);
    document.getElementById('calc-tax-saved').textContent = money(saved);
    document.getElementById('calc-btn-amount').textContent = money(amount);
    const impact = amount >= 50000 ? '✨ Fully funds 1 comprehensive cancer chemotherapy cycle or major emergency ICU stabilization.'
      : amount >= 25000 ? '✨ Sponsors 3 specialized oncology diagnostic scans (PET-CT/MRI) + 2 post-op support visits.'
      : amount >= 10000 ? '✨ Fully covers 2 targeted chemotherapy sessions + 1 month of vital cardiac medications.'
      : amount >= 5000 ? '✨ Sponsors 2 full sets of diagnostic blood work and essential pediatric ICU antibiotics.'
      : amount >= 2500 ? '✨ Sponsors 1 complete diagnostic ultrasound + 1 week of post-op antibiotic medications.'
      : amount >= 1000 ? '✨ Provides essential diagnostic screening guidance and nutritional supplements for 2 patients.'
      : '✨ Provides diagnostic test assistance and local patient travel support.';
    document.getElementById('calc-impact-text').textContent = impact;
  };

  window.triggerCalcDonation = () => window.AvinyaModals?.openDonateModal(currentCalcAmount || 2500);

  function animateProgress(container) {
    const fill = container.querySelector('.cf-progress-bar-fill');
    if (!fill || !fill.dataset.progress || container.dataset.animated) return;
    container.dataset.animated = 'true';
    fill.style.width = reduceMotion ? `${fill.dataset.progress}%` : '0%';
    requestAnimationFrame(() => { fill.style.width = `${fill.dataset.progress}%`; });
  }

  function initializeProgress() {
    const containers = document.querySelectorAll('.cf-progress-container[data-campaign-category]');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      containers.forEach(animateProgress);
      return;
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateProgress(entry.target);
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.3 });
    containers.forEach(container => observer.observe(container));
  }

  function animateDonationTotal(stats) {
    const total = Number(stats?.total) || 0;
    const totalNode = document.querySelector('[data-donation-total]');
    if (!totalNode) return;
    const start = Number(totalNode.dataset.animatedTotal || 0);
    totalNode.dataset.animatedTotal = String(total);
    if (reduceMotion || typeof gsap === 'undefined') {
      totalNode.textContent = money(total);
      return;
    }
    const counter = { value: start };
    gsap.to(counter, { value: total, duration: 0.7, ease: 'power2.out', overwrite: true, onUpdate: () => { totalNode.textContent = money(counter.value); } });
  }

  function initializeReveals() {
    if (reduceMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    const groups = [
      ['.cf-spotlight-card', 0],
      ['.cf-calculator-card, .cf-cta-banner, .cf-faq-item', 0.05]
    ];
    groups.forEach(([selector, stagger]) => {
      const items = gsap.utils.toArray(selector);
      if (!items.length) return;
      gsap.from(items, { opacity: 0, y: 18, duration: 0.55, stagger, ease: 'power3.out', scrollTrigger: { trigger: items[0], start: 'top 86%', once: true } });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadDynamicCampaigns() {
    try {
      const res = await fetch('/api/crowdfunding.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!data || data.status !== 'ok') return;

      // Render Spotlight Campaign if available
      if (data.spotlight) {
        const spot = data.spotlight;
        const spotlightContainer = document.querySelector('#urgent-spotlight .cf-spotlight-card');
        if (spotlightContainer) {
          const goal = parseFloat(spot.goal_amount) || 2500000;
          const raised = parseFloat(spot.raised_amount) || 0;
          const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
          const donCat = spot.donation_category || spot.title || 'Mobile Medical Ambulance';

          spotlightContainer.innerHTML = `
            <div class="cf-spotlight-media">
              <img src="${escapeHtml(spot.image || 'assets/mobile_ambulance_clinic.jpg')}" alt="${escapeHtml(spot.alt_text || spot.title)}" loading="lazy" decoding="async">
              <div class="cf-spotlight-tag-urgent">
                <span>⏱️</span> ${escapeHtml(spot.target_timeline || 'Target: Next 30 Days')}
              </div>
              <div class="cf-spotlight-tag-verified">
                <span>✓</span> ${escapeHtml(spot.tag_label || 'AvinyaCareFoundation Official Project')}
              </div>
            </div>

            <div class="cf-spotlight-content">
              <div>
                <h3 class="cf-spotlight-title">${escapeHtml(spot.title)}</h3>
                <div class="cf-spotlight-hospital">
                  <span>📍 Region:</span>
                  <span class="hosp-name">${escapeHtml(spot.location || 'Vasai-Virar Region')}</span>
                  ${spot.hospital_name ? `<span>• ${escapeHtml(spot.hospital_name)}</span>` : '<span>• Healthcare Access Initiative</span>'}
                </div>
                <p class="cf-spotlight-desc">
                  ${escapeHtml(spot.description || '')}
                </p>
              </div>

              <div>
                <div class="cf-progress-container" data-campaign-category="${escapeHtml(donCat)}" data-goal="${goal}">
                  <div class="cf-progress-header">
                    <div>
                      <span class="cf-progress-raised">${money(raised)}</span>
                      <span class="cf-progress-goal">pledged toward ${money(goal)} goal</span>
                    </div>
                    <span class="cf-progress-percent" style="color: #FFA466; font-weight: 800; font-size: 1.1rem;">${pct}%</span>
                  </div>
                  <div class="cf-progress-bar-bg">
                    <div class="cf-progress-bar-fill" style="width: ${pct}%;"></div>
                  </div>
                  <div class="cf-progress-stats">
                    <span>🏢 <span class="cf-progress-donor-count">${spot.donor_count || 0}</span> Corporate &amp; Community Donors</span>
                    <span>🛡️ ${spot.is_tax_exempt ? '80G Tax Exempt Eligible' : 'Direct Impact Project'}</span>
                  </div>
                </div>

                <div class="cf-spotlight-actions">
                  <button class="cf-btn-primary" style="flex: 1; justify-content: center;" onclick="window.AvinyaModals.openDonateModal(5000, '${escapeHtml(donCat)}')">
                    <span>Fund the Ambulance</span>
                    <span>→</span>
                  </button>
                  <button class="cf-btn-secondary" style="padding: 0.95rem 1.25rem;" onclick="shareOnWhatsApp('${escapeHtml(spot.whatsapp_text || ('Help AvinyaCareFoundation with: ' + spot.title + ' ' + window.location.href))}')">
                    <span>📱 Share on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }
      }

      // Render Grid Campaigns
      if (Array.isArray(data.campaigns) && data.campaigns.length > 0) {
        const gridContainer = document.getElementById('cf-grid-container');
        if (gridContainer) {
          gridContainer.innerHTML = data.campaigns.map(c => {
            const goal = parseFloat(c.goal_amount) || 1000000;
            const raised = parseFloat(c.raised_amount) || 0;
            const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
            const donCat = c.donation_category || c.title;

            return `
              <div class="cf-card" data-category="${escapeHtml(c.category || 'infrastructure')}">
                <div class="cf-card-media">
                  <img src="${escapeHtml(c.image || 'assets/logo-emblem.png')}" alt="${escapeHtml(c.alt_text || c.title)}" loading="lazy" decoding="async">
                  <div class="cf-card-category">${escapeHtml(c.category_label || c.category || 'Healthcare')}</div>
                  ${c.is_tax_exempt ? `<div class="cf-card-tax">${escapeHtml(c.tag_label || '80G Tax Saver')}</div>` : ''}
                </div>
                <div class="cf-card-body">
                  <h3 class="cf-card-title">${escapeHtml(c.title)}</h3>
                  <div class="cf-card-meta">
                    <span>📍</span>
                    <span class="hospital">${escapeHtml(c.location || 'Vasai-Virar')}${c.hospital_name ? ` • ${escapeHtml(c.hospital_name)}` : ''}</span>
                  </div>
                  <p class="cf-card-desc">
                    ${escapeHtml(c.description || '')}
                  </p>
                  <div class="cf-card-footer">
                    <div class="cf-progress-container" style="margin-bottom: 0.75rem;" data-campaign-category="${escapeHtml(donCat)}" data-goal="${goal}">
                      <div class="cf-progress-header">
                        <span class="cf-progress-raised" style="font-weight: 700; color: #FFA466;">${money(raised)}</span>
                        <span class="cf-progress-goal">pledged toward ${money(goal)} (<span class="cf-progress-percent">${pct}%</span>)</span>
                      </div>
                      <div class="cf-progress-bar-bg">
                        <div class="cf-progress-bar-fill" style="width: ${pct}%;"></div>
                      </div>
                      <div class="cf-progress-stats" style="margin-top: 0.35rem;">
                        <span>👥 <span class="cf-progress-donor-count">${c.donor_count || 0}</span> Donors</span>
                        <span>⏱️ ${escapeHtml(c.target_timeline || 'Active')}</span>
                      </div>
                    </div>
                    <div class="cf-card-actions">
                      <button class="cf-btn-donate" onclick="window.AvinyaModals.openDonateModal(5000, '${escapeHtml(donCat)}')">
                        <span>Donate ₹5,000</span>
                        <span>→</span>
                      </button>
                      <button class="cf-btn-share" title="Share on WhatsApp" onclick="shareOnWhatsApp('${escapeHtml(c.whatsapp_text || ('Support ' + c.title + ': ' + window.location.href))}')">
                        <span>💬</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('');

          // Update "All Projects (N)" count button if present
          const allBtn = document.querySelector('.cf-filter-btn[data-filter="all"]');
          if (allBtn) {
            allBtn.textContent = `All Projects (${data.campaigns.length})`;
          }
        }
      }

      initializeProgress();
      initializeReveals();
    } catch (e) {
      console.warn('Dynamic Crowdfunding Campaigns Fetch Warning:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.cf-filter-btn').forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      document.querySelectorAll('.cf-filter-btn').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      document.querySelectorAll('#cf-grid-container .cf-card').forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.hidden = !show;
        if (show) card.classList.add('cf-filtered-in');
      });
    }));
    initializeProgress();
    initializeReveals();
    loadDynamicCampaigns();
  });

  window.addEventListener('avinya:donation_stats_updated', event => {
    document.querySelectorAll('.cf-progress-container').forEach(container => {
      const fill = container.querySelector('.cf-progress-bar-fill');
      if (fill && container.dataset.animated) fill.style.width = `${fill.dataset.progress || 0}%`;
    });
    animateDonationTotal(event.detail);
  });
}());
