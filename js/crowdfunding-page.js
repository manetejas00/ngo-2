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
  });

  window.addEventListener('avinya:donation_stats_updated', event => {
    document.querySelectorAll('.cf-progress-container').forEach(container => {
      const fill = container.querySelector('.cf-progress-bar-fill');
      if (fill && container.dataset.animated) fill.style.width = `${fill.dataset.progress || 0}%`;
    });
    animateDonationTotal(event.detail);
  });
}());
