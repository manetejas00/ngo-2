const base = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https:\/\//.test(base)) {
  console.error('Usage: node scripts/live-smoke.mjs https://example.com');
  process.exit(2);
}

const checks = [
  { path: '/', type: 'text', contains: 'AvinyaCareFoundation' },
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
  { path: '/donation-guide', type: 'text', contains: 'donation' },
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
  { path: '/api/healthcare/doctors.php', type: 'json', array: 'doctors' },
  { path: '/api/healthcare/tests.php', type: 'json', array: 'tests' },
  { path: '/api/crowdfunding.php', type: 'json', array: 'campaigns' },
  { path: '/api/news.php', type: 'json', array: 'articles' },
  { path: '/sitemap.xml', type: 'text', contains: 'diagnostic-tests' },
  { path: '/robots.txt', type: 'text', contains: 'sitemap.xml' },
];

let failed = false;
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
      ok = data.status !== 'error' && Array.isArray(data[check.array]) && data[check.array].length > 0;
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
