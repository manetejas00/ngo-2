import test from 'node:test';
import assert from 'node:assert/strict';

// This suite is intentionally opt-in and restricted to a local test server.
const base = new URL(process.env.TEST_BASE_URL || 'http://127.0.0.1:31879');
if (!['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname)) {
  throw new Error('The read-only HTTP suite only permits a local server.');
}

test('public pages and gallery service are served', async () => {
  for (const path of ['/', '/gallery.html', '/doctors.html', '/js/services/gallery-service.js', '/js/services/donation-service.js', '/js/services/healthcare-api.js']) {
    const response = await fetch(new URL(path, base));
    assert.equal(response.status, 200, path);
  }
});

test('healthcare catalog endpoint returns a doctors array', async () => {
  const response = await fetch(new URL('/api/healthcare/doctors', base));
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.status, 'ok');
  assert.ok(Array.isArray(payload.doctors));
});

test('internal source and configuration are not served', async () => {
  for (const path of ['/server.mjs', '/config/environment.mjs', '/services/donations/donationStats.mjs', '/.env']) {
    const response = await fetch(new URL(path, base));
    assert.equal(response.status, 403, path);
  }
});

test('public gallery and donation statistics endpoints have their expected response shape', async () => {
  const galleryResponse = await fetch(new URL('/api/gallery', base));
  assert.equal(galleryResponse.status, 200);
  const gallery = await galleryResponse.json();
  assert.equal(gallery.status, 'ok');
  assert.ok(Array.isArray(gallery.data));

  const statsResponse = await fetch(new URL('/api/donations/stats', base));
  assert.equal(statsResponse.status, 200);
  const stats = await statsResponse.json();
  assert.equal(stats.status, 'ok');
  assert.equal(typeof stats.stats.total, 'number');
});

test('audit information pages and every diagnostic detail remain public while internal tests stay private', async () => {
  for (const path of ['/about','/get-involved','/assistance','/transparency','/privacy','/terms','/events']) {
    const response = await fetch(new URL(path, base));
    assert.equal(response.status, 200, path);
  }
  const catalog = await (await fetch(new URL('/api/healthcare/tests', base))).json();
  for (const item of catalog.tests) {
    const response = await fetch(new URL('/test/' + item.id, base));
    assert.equal(response.status, 200, item.id);
    const html = await response.text();
    assert.ok(html.includes('class="diagnostic-detail"'), item.id);
    assert.ok(html.includes('href="/css/information.css'), item.id);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, item.id);
  }
  assert.equal((await fetch(new URL('/test/config.test.mjs', base))).status, 403);
  assert.equal((await fetch(new URL('/test/test-not-real', base))).status, 404);
});
