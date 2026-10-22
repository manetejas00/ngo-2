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
