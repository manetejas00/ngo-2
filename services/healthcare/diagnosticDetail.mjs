export function escapeDiagnosticHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

/** Crawlable core content; booking remains an explicit action on the catalog. */
export function diagnosticDetailArticle(test) {
  const e = escapeDiagnosticHtml;
  const parameters = Array.isArray(test.testsIncluded) ? test.testsIncluded : [];
  const tumorMarker = /tumor|cancer/i.test(`${test.category || ''} ${test.id}`);
  return `<article class="diagnostic-detail">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/doctors">Diagnostics</a> / ${e(test.name)}</nav>
    <h1>${e(test.name)}</h1><p>${e(test.description)}</p>
    <h2>Listed package</h2><ul>${parameters.map(item => `<li>${e(item)}</li>`).join('')}</ul>
    <p>Listed package price: ₹${e(test.price)}. Confirm the final price, any collection charges and availability with the team.</p>
    <h2>Before your test</h2><p>Laboratory preparation information: ${e(test.preparation)} Confirm these instructions with your laboratory or clinician; do not stop medicines without advice.</p>
    <p>Listed report turnaround: ${e(test.reportTurnaround)}. Confirm when timing starts and any exceptions.</p>
    <p>Tests may give false positive or false negative results and need clinical interpretation. A normal result does not rule out every condition. Discuss appropriate testing with your clinician.</p>
    ${tumorMarker ? '<p>Tumor marker tests are not reliable general population cancer screens. Background information: <a href="https://www.cancer.gov/about-cancer/diagnosis-staging/diagnosis/tumor-markers-fact-sheet">National Cancer Institute: tumor markers</a>. Information updated 24 October 2026.</p>' : ''}
    <a href="/doctors?test=${encodeURIComponent(test.id)}">Request this test →</a> · <a href="/assistance">Ask for help</a> · <a href="/privacy">Privacy notice</a>
  </article>`;
}

export function diagnosticDetailPage(test, baseUrl) {
  const e = escapeDiagnosticHtml;
  const canonical = `${baseUrl}/test/${encodeURIComponent(test.id)}`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'MedicalTest',name:test.name,description:test.description,url:canonical}).replace(/</g,'\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(test.name)} | Avinya Care Foundation</title><meta name="description" content="${e(test.description)}"><link rel="canonical" href="${e(canonical)}"><meta property="og:title" content="${e(test.name)}"><meta property="og:description" content="${e(test.description)}"><meta property="og:url" content="${e(canonical)}"><link rel="stylesheet" href="/css/styles.css?v=4.3.4"><link rel="stylesheet" href="/css/radial-menu.css?v=4.3.0"><link rel="stylesheet" href="/css/accessibility.css?v=4.3.0"><link rel="stylesheet" href="/css/information.css?v=4.3.1"><script defer src="/assets/vendor/gsap.min.js?v=3.15.0"></script><script defer src="/js/public-pages.js?v=4.3.2"></script><script defer src="/js/components/navbar-gsap.js?v=4.3.2"></script><script defer src="/js/components/radial-menu.js?v=4.3.0"></script><script defer src="/js/components/layout-injector.js?v=4.3.5"></script><script type="application/ld+json">${schema}</script><link rel="stylesheet" href="/css/public-theme.css?v=4"><link rel="stylesheet" href="/css/donation-guide.css?v=1"><script defer src="/js/donation-guide.js?v=2"></script><link rel="stylesheet" href="/css/modal-controls.css?v=2"></head><body class="information-page"><a class="skip" href="#content">Skip to content</a><!-- REUSABLE_NAVBAR --><main id="content">${diagnosticDetailArticle(test)}</main><!-- REUSABLE_FOOTER --></body></html>`;
}
