const base = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https:\/\//.test(base)) {
  console.error('Usage: node scripts/live-smoke.mjs https://example.com');
  process.exit(2);
}

const checks = [
  { path: '/', type: 'text', contains: '/assets/vendor/gsap-3.12.5/gsap.min.js' },
  { path: '/assets/vendor/gsap-3.12.5/gsap.min.js', type: 'text', contains: '3.12.5' },
  { path: '/assets/vendor/gsap-3.12.5/ScrollTrigger.min.js', type: 'text', contains: 'ScrollTrigger' },
  { path: '/assets/vendor/gsap-3.12.5/ScrollToPlugin.min.js', type: 'text', contains: 'ScrollToPlugin' },
  { path: '/assets/vendor/gsap-3.12.5/Draggable.min.js', type: 'text', contains: 'Draggable' },
  { path: '/assets/vendor/html2pdf-0.10.1/html2pdf.bundle.min.js', type: 'text', contains: 'html2pdf' },
  { path: '/css/preloader.css', type: 'text', contains: '@keyframes preloaderFailsafe' },
  { path: '/doctors.html', type: 'text', contains: 'Diagnostic Tests' },
  { path: '/diagnostic-tests', type: 'text', contains: 'Diagnostic Tests' },
  { path: '/crowdfunding.html', type: 'text', contains: 'NGO Healthcare Infrastructure' },
  { path: '/admin.html', type: 'text', contains: 'Admin Dashboard' },
  { path: '/about', type: 'text', contains: 'team-profile-trigger' },
  { path: '/assistance', type: 'text', contains: 'assistance-hero' },
  { path: '/health-camp', type: 'text', contains: 'camp-opening' },
  { path: '/get-involved', type: 'text', contains: 'volunteer' },
  { path: '/gallery', type: 'text', contains: 'Gallery' },
  { path: '/events', type: 'text', contains: 'Community events' },
  { path: '/transparency', type: 'text', contains: 'transparency' },
  { path: '/js/donation-guide.js', type: 'text', contains: 'donation-guide-dialog' },
  { path: '/css/donation-guide.css', type: 'text', contains: '.donation-guide-dialog' },
  { path: '/privacy', type: 'text', contains: 'Privacy' },
  { path: '/terms', type: 'text', contains: 'terms' },
  { path: '/components/navbar', type: 'text', contains: '/health-camp' },
  { path: '/components/footer', type: 'text', contains: 'site-footer-grid' },
  { path: '/css/section-themes.css', type: 'text', contains: '.camp-opening' },
  { path: '/css/footer.css', type: 'text', contains: '.site-footer-grid' },
  { path: '/css/public-theme.css', type: 'text', contains: '--hc-primary:#a94710' },
  { path: '/css/team.css', type: 'text', contains: '.team-dialog' },
  { path: '/js/team.js', type: 'text', contains: 'dialog.showModal()' },
  { path: '/assets/team/sagar-warekar.jpg', type: 'asset' },
  { path: '/assets/team/ajay-pandey.jpg', type: 'asset' },
  { path: '/assets/team/ravindra-singh.jpg', type: 'asset' },
  { path: '/assets/team/ranjeet-mane.jpg', type: 'asset' },
  { path: '/assets/team/chandresh-pandey.jpg', type: 'asset' },
  { path: '/assets/team/tejas-mane.jpg', type: 'asset' },
  { path: '/assets/logo.png', type: 'asset' },
  { path: '/api/healthcare/doctors.php', type: 'json', array: 'doctors', allowUnpublished: true },
  { path: '/api/healthcare/tests.php', type: 'json', array: 'tests' },
  { path: '/api/crowdfunding.php', type: 'json', array: 'campaigns' },
  { path: '/api/news.php', type: 'json', array: 'articles' },
  { path: '/sitemap.xml', type: 'text', contains: 'diagnostic-tests' },
  { path: '/robots.txt', type: 'text', contains: 'sitemap.xml' },
];

let failed = false;
// The www entry point must be checked independently: following redirects on the
// apex domain alone cannot detect a broken alias or a redirect loop.
if (new URL(base).hostname === 'avinyacarefoundation.org') {
  for (const protocol of ['http:', 'https:']) {
    const probe = `${protocol}//www.avinyacarefoundation.org/about?domain-check=1`;
    try {
      const response = await fetch(probe, {
        redirect: 'manual', signal: AbortSignal.timeout(20_000),
        headers: { 'cache-control': 'no-cache' },
      });
      const location = response.headers.get('location');
      const expected = 'https://avinyacarefoundation.org/about?domain-check=1';
      const ok = response.status === 308 && location === expected;
      await response.arrayBuffer();
      console.log(`${ok ? 'PASS' : 'FAIL'} ${probe} (${response.status}, ${location})`);
      failed ||= !ok;
    } catch (error) {
      failed = true;
      console.error(`FAIL ${probe} (${error.message})`);
    }
  }
}
for (const check of checks) {
  const url = `${base}${check.path}${check.path.includes('?') ? '&' : '?'}smoke=${Date.now()}`;
  try {
    const response = await fetch(url, {
      headers: { 'cache-control': 'no-cache', 'user-agent': 'Avinya-Deploy-Smoke/1.0' },
      signal: AbortSignal.timeout(20_000),
    });
    const body = await response.text();
    let ok = response.ok && body.length > 0;
    let detail = `${response.status}, ${body.length} bytes`;

    if (ok && check.type === 'text') ok = body.includes(check.contains);
    if (ok && check.type === 'json') {
      const data = JSON.parse(body);
      ok = data.status !== 'error' && Array.isArray(data[check.array]) && (data[check.array].length > 0 || (check.allowUnpublished && data.published === false));
      detail += `, ${check.array}=${data[check.array]?.length ?? 0}`;
    }

    console.log(`${ok ? 'PASS' : 'FAIL'} ${check.path} (${detail})`);
    failed ||= !ok;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.path} (${error.message})`);
  }
}

if (failed) process.exit(1);
console.log(`Smoke checks passed for ${base}.`);
