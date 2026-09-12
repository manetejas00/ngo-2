/* Shared, database-backed donation UI state. No totals are calculated client-side. */
(function () {
  'use strict';
  const money = amount => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(amount) || 0)}`;
  let refreshPromise = null;
  let retryTimer = null;
  const text = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  const escapeHtml = value => { const div = document.createElement('div'); div.textContent = String(value); return div.innerHTML; };

  function applyStats(stats) {
    text('[data-donation-total]', money(stats.total));
    text('[data-donation-count]', String(stats.total_donations || 0));
    text('[data-unique-donor-count]', String(stats.unique_donors || stats.donors || 0));
    document.querySelectorAll('.cf-progress-container[data-campaign-category]').forEach(container => {
      const campaign = container.dataset.campaignCategory;
      const pledged = Number(stats.pledged_categories?.[campaign] || 0);
      const goal = Number(container.dataset.goal || 0);
      const percent = goal > 0 ? Math.round((pledged / goal) * 100) : 0;
      const raisedEl = container.querySelector('.cf-progress-raised');
      const percentEl = container.querySelector('.cf-progress-percent');
      const fillEl = container.querySelector('.cf-progress-bar-fill');
      const donorsEl = container.querySelector('.cf-progress-donor-count');
      if (raisedEl) raisedEl.textContent = money(pledged);
      if (percentEl) percentEl.textContent = `${percent}%`;
      if (fillEl) {
        const visiblePercent = Math.max(0, Math.min(100, percent));
        fillEl.dataset.progress = String(visiblePercent);
        if (container.dataset.animated) fillEl.style.width = `${visiblePercent}%`;
      }
      if (donorsEl) donorsEl.textContent = String(stats.pledged_campaign_donors?.[campaign] || 0);
    });
  }

  function applyRecent(donations) {
    const container = document.getElementById('cf-ticker-stream');
    if (!container) return;
    const entries = Array.isArray(donations) && donations.length
      ? donations.map(d => `<div class="cf-ticker-item"><strong>${escapeHtml(d.name || 'Anonymous Donor')}</strong> pledged <span class="amount">${money(d.amount)}</span> <span class="cf-ticker-cause">for ${escapeHtml(d.cause || 'General Fund')}</span></div><span class="cf-ticker-separator" aria-hidden="true">•</span>`).join('')
      : '<div class="cf-ticker-item">No donation activity yet.</div>';
    container.innerHTML = Array.isArray(donations) && donations.length ? entries + entries : entries;
  }

  async function refresh({ retry = true } = {}) {
    if (refreshPromise) return refreshPromise;
    refreshPromise = Promise.all([fetch('/api/donations/stats', { cache: 'no-store' }), fetch('/api/donations/recent', { cache: 'no-store' })])
      .then(async ([statsResponse, recentResponse]) => {
        if (!statsResponse.ok || !recentResponse.ok) throw new Error('Donation data is temporarily unavailable.');
        const [statsPayload, recentPayload] = await Promise.all([statsResponse.json(), recentResponse.json()]);
        if (statsPayload.status !== 'ok' || !statsPayload.stats || recentPayload.status !== 'ok') throw new Error('Donation data response is invalid.');
        applyStats(statsPayload.stats);
        applyRecent(recentPayload.donations);
        window.dispatchEvent(new CustomEvent('avinya:donation_stats_updated', { detail: statsPayload.stats }));
        return statsPayload.stats;
      }).catch(error => {
        if (retry && !retryTimer) retryTimer = window.setTimeout(() => { retryTimer = null; refresh({ retry: false }).catch(() => {}); }, 5000);
        console.warn('Donation statistics refresh failed:', error.message);
        throw error;
      }).finally(() => { refreshPromise = null; });
    return refreshPromise;
  }
  window.AvinyaDonations = { refresh };
  document.addEventListener('DOMContentLoaded', () => { refresh().catch(() => {}); window.setInterval(() => refresh().catch(() => {}), 15000); });
  window.addEventListener('avinya:donation_success', () => refresh().catch(() => {}));
  window.addEventListener('avinya:donation_submitted', () => refresh().catch(() => {}));
}());
