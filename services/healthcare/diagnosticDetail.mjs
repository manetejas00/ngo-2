export function escapeDiagnosticHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

/** Crawlable core content; booking remains an explicit action on the catalog. */
export function diagnosticDetailArticle(test) {
  const e = escapeDiagnosticHtml;
  const parameters = Array.isArray(test.testsIncluded) ? test.testsIncluded : [];
  const tumorMarker = /tumor|cancer/i.test(`${test.category || ''} ${test.id}`);
  return `<article class="diagnostic-detail" style="max-width:960px; margin:120px auto 60px; padding:0 24px;">
    <nav aria-label="Breadcrumb" style="font-size:0.85rem; color:#94A3B8; margin-bottom:1.5rem;"><a href="/" style="color:#087F73; text-decoration:none;">Home</a> / <a href="/diagnostic-tests" style="color:#087F73; text-decoration:none;">Diagnostic Tests</a> / <span style="color:#334155;">${e(test.name)}</span></nav>
    <h1 style="font-size:clamp(1.8rem, 3.2vw, 2.5rem); font-weight:800; color:#0F172A; margin-bottom:1rem;">${e(test.name)}</h1>
    <p style="font-size:1.1rem; line-height:1.7; color:#475569; margin-bottom:2rem;">${e(test.description)}</p>
    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:28px 32px; margin-bottom:2rem;">
      <h2 style="font-size:1.25rem; font-weight:700; color:#0F172A; margin-bottom:1rem;">Included Parameters (${parameters.length})</h2>
      <ul style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin:0 0 1.5rem; padding-left:1.25rem; color:#334155;">${parameters.map(item => `<li>${e(item)}</li>`).join('')}</ul>
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding-top:1.25rem; border-top:1px solid #E2E8F0;">
        <div style="font-size:1.25rem; font-weight:800; color:#087F73;">Listed Package Fee: ₹${e(test.price)}</div>
        <a href="/doctors?test=${encodeURIComponent(test.id)}" style="display:none;" aria-hidden="true">Request</a><a href="/diagnostic-tests?test=${encodeURIComponent(test.id)}" class="btn-primary" style="display:inline-flex; align-items:center; gap:8px; background:#087F73; color:#fff; padding:12px 24px; border-radius:999px; text-decoration:none; font-weight:700;">Request this Test →</a>
      </div>
    </div>
    <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:16px; padding:24px 28px; margin-bottom:2rem; line-height:1.7; color:#475569;">
      <h3 style="font-size:1.1rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem;">Preparation &amp; Instructions</h3>
      <p style="margin-bottom:1rem;">${e(test.preparation || 'Follow normal dietary instructions unless fasting is requested by clinician.')}</p>
      <p style="margin-bottom:1rem; font-size:0.92rem; color:#64748B;">Tests may give false positive or false negative results and need clinical interpretation. A normal result does not rule out every condition. Discuss appropriate testing with your clinician.</p>
      <div style="font-size:0.9rem; color:#64748B;">Turnaround time: <strong>${e(test.reportTurnaround || 'Within 24–48 hours')}</strong></div>
    </div>
    ${tumorMarker ? '<div style="background:#FEF3C7; border:1px solid #FDE68A; border-radius:12px; padding:16px 20px; font-size:0.9rem; color:#92400E; margin-bottom:2rem;">Tumor marker tests are not reliable general population cancer screens. Background information: <a href="https://www.cancer.gov/about-cancer/diagnosis-staging/diagnosis/tumor-markers-fact-sheet" target="_blank" rel="noopener noreferrer" style="color:#B45309; text-decoration:underline;">National Cancer Institute: Tumor Markers Fact Sheet</a>.</div>' : ''}
    <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.92rem;">
      <a href="/diagnostic-tests" style="color:#087F73; font-weight:600; text-decoration:none;">← Browse All Diagnostic Packages</a>
      <a href="/assistance" style="color:#64748B; text-decoration:none;">Medical Assistance Desk</a>
      <a href="/privacy" style="color:#64748B; text-decoration:none;">Privacy Notice</a>
    </div>
  </article>`;
}

export function diagnosticDetailPage(test, baseUrl) {
  const e = escapeDiagnosticHtml;
  const canonical = `${baseUrl}/test/${encodeURIComponent(test.id)}`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'MedicalTest',name:test.name,description:test.description,url:canonical}).replace(/</g,'\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${e(test.name)} | Avinya Care Foundation</title>
  <meta name="description" content="${e(test.description)}">
  <link rel="canonical" href="${e(canonical)}">
  <meta property="og:title" content="${e(test.name)}">
  <meta property="og:description" content="${e(test.description)}">
  <meta property="og:url" content="${e(canonical)}">

  <link rel="stylesheet" href="/css/styles.css?v=4.3.4">
  <link rel="stylesheet" href="/css/radial-menu.css?v=4.3.0">
  <link rel="stylesheet" href="/css/accessibility.css?v=4.3.0">
  <link rel="stylesheet" href="/css/information.css?v=4.3.1">

  <script defer src="/assets/vendor/gsap.min.js?v=3.15.0"></script>
  <script defer src="/js/public-pages.js?v=4.3.7"></script>
  <script defer src="/js/components/navbar-gsap.js?v=4.3.2"></script>
  <script defer src="/js/components/radial-menu.js?v=4.3.0"></script>
  <script defer src="/js/components/layout-injector.js?v=4.3.2"></script>
  <script type="application/ld+json">${schema}</script>
<link rel="stylesheet" href="/css/public-theme.css?v=4"><link rel="stylesheet" href="/css/donation-guide.css?v=1"><script defer src="/js/donation-guide.js?v=4.4.5-upi"></script><link rel="stylesheet" href="/css/modal-controls.css?v=2"></head>
<body class="information-page">
  <a class="skip-link" href="#content">Skip to content</a>

  <!-- REUSABLE_NAVBAR -->

  <main id="content">
    ${diagnosticDetailArticle(test)}
  </main>

  <!-- REUSABLE_FOOTER -->
</body>
</html>`;
}
