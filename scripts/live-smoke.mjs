const base = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https:\/\//.test(base)) {
  console.error('Usage: node scripts/live-smoke.mjs https://example.com');
  process.exit(2);
}

const checks = [
  { path: '/', type: 'text', contains: 'Avinya Care' },
  { path: '/doctors.html', type: 'text', contains: 'Doctors & Diagnostic Tests' },
  { path: '/admin.html', type: 'text', contains: 'Admin Dashboard' },
  { path: '/assets/logo.png', type: 'asset' },
  { path: '/api/healthcare/doctors.php', type: 'json', array: 'doctors' },
  { path: '/api/healthcare/tests.php', type: 'json', array: 'tests' },
  { path: '/api/news.php', type: 'json', array: 'articles' },
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
