/*
 * Loads GA4 only when a public measurement ID has been configured server-side.
 * This file deliberately never handles credentials or personally identifiable data.
 */
(async function loadAnalytics() {
  try {
    const response = await fetch('/api/analytics-config.php', { cache: 'force-cache' });
    const config = await response.json();
    const measurementId = String(config.measurementId || '');
    if (!/^G-[A-Z0-9]+$/i.test(measurementId)) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { anonymize_ip: true });

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);

    // Retains the small custom-event interface used by the site without sending form fields.
    window.AvinyaAnalytics = window.AvinyaAnalytics || {
      event: function (name, params) { window.gtag('event', name, params || {}); }
    };
  } catch (_) {
    // Analytics must never interfere with the visitor experience.
  }
})();
