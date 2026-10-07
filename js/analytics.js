/* Consent-gated GA4 integration. The measurement ID is fetched from the server
 * so public pages never contain account credentials or a hard-coded ID. */
(function () {
  'use strict';

  const consentKey = 'avinya-analytics-consent';
  let measurementId = '';
  let initialized = false;

  function validId(value) {
    return typeof value === 'string' && /^G-[A-Z0-9]+$/i.test(value.trim());
  }

  const allowedEvents = new Set(['donation_started', 'donation_completed', 'contact_form_submitted', 'whatsapp_clicked', 'phone_clicked', 'email_clicked', 'gallery_viewed', 'news_article_viewed']);
  function event(name) {
    if (!initialized || typeof window.gtag !== 'function') return;
    if (allowedEvents.has(name)) window.gtag('event', name);
  }

  function loadGa4() {
    if (initialized || !validId(measurementId)) return;
    initialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('config', measurementId, {
      send_page_view: false,
      page_location: location.origin + location.pathname,
      page_referrer: '',
      page_title: 'AvinyaCareFoundation',
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    window.gtag('event', 'page_view', { page_location: location.origin + location.pathname, page_referrer: '', page_title: 'AvinyaCareFoundation' });
    if (location.pathname === '/gallery' || location.pathname.endsWith('/gallery.html')) event('gallery_viewed');
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);
  }

  function showConsent() {
    if (document.getElementById('analytics-consent-banner')) return;
    const banner = document.createElement('section');
    banner.id = 'analytics-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Analytics preference');
    banner.style.cssText = 'position:fixed;z-index:9999;left:16px;right:16px;bottom:16px;max-width:680px;margin:auto;padding:16px 18px;background:#10201e;color:#fff;border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.28);font:14px/1.45 Inter,Arial,sans-serif;';
    banner.innerHTML = '<strong>Privacy choice</strong><p style="margin:6px 0 12px;">With your permission, we use Google Analytics to understand aggregate site use. We do not send form, health, donation, or payment details.</p><button type="button" data-choice="accept" style="margin-right:8px;padding:8px 12px;border:0;border-radius:6px;background:#fff;color:#10201e;font-weight:700;cursor:pointer;">Allow analytics</button><button type="button" data-choice="reject" style="padding:8px 12px;border:1px solid #fff;border-radius:6px;background:transparent;color:#fff;font-weight:700;cursor:pointer;">Decline</button>';
    banner.addEventListener('click', function (e) {
      const choice = e.target && e.target.getAttribute('data-choice');
      if (!choice) return;
      try { localStorage.setItem(consentKey, choice); } catch (_) { /* Session choice still applies. */ }
      banner.remove();
      if (choice === 'accept') loadGa4();
      else if (initialized) {
        window['ga-disable-' + measurementId] = true;
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
        location.reload();
      }
    });
    document.body.appendChild(banner);
  }

  function trackInteractions() {
    document.addEventListener('click', function (e) {
      const anchor = e.target.closest && e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (href.startsWith('tel:')) event('phone_clicked');
      else if (href.startsWith('mailto:')) event('email_clicked');
      else if (/whatsapp\.com|wa\.me/i.test(href)) event('whatsapp_clicked');
    });
  }

  window.AvinyaAnalytics = { event: event, preferences: showConsent };
  document.addEventListener('DOMContentLoaded', function () {
    trackInteractions();
    fetch('/api/public-config', { credentials: 'same-origin' })
      .then(function (response) { return response.ok ? response.json() : {}; })
      .then(function (config) {
        measurementId = validId(config.googleAnalyticsId) ? config.googleAnalyticsId.trim() : '';
        if (!measurementId) return;
        let choice = '';
        try { choice = localStorage.getItem(consentKey); } catch (_) { /* Ask when storage is unavailable. */ }
        if (choice === 'accept') loadGa4();
        else if (!choice) showConsent();
      })
      .catch(function () { /* Analytics remains disabled when config is unavailable. */ });
  });
}());
