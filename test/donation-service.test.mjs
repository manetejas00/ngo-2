import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/services/donation-service.js', import.meta.url), 'utf8');
function service() {
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.AvinyaDonationService;
}

test('donation service loads both API responses', async () => {
  const calls = [];
  const result = await service().load(async (url, options) => {
    calls.push([url, options.cache]);
    return { ok: true, json: async () => url.endsWith('/stats')
      ? { status: 'ok', stats: { total: 42 } }
      : { status: 'ok', donations: [{ name: 'Donor' }] } };
  });
  assert.deepEqual(calls, [['/api/donations/stats', 'no-store'], ['/api/donations/recent', 'no-store']]);
  assert.equal(result.stats.total, 42);
  assert.equal(result.donations[0].name, 'Donor');
});

test('donation service rejects failed or invalid responses', async () => {
  await assert.rejects(service().load(async () => ({ ok: false })), /temporarily unavailable/);
  await assert.rejects(service().load(async () => ({ ok: true, json: async () => ({ status: 'error' }) })), /response is invalid/);
});

test('each donation page loads the service before the UI controller', async () => {
  for (const page of ['index.html', 'crowdfunding.html', 'response.html']) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    const servicePosition = html.indexOf('js/services/donation-service.js');
    assert.ok(servicePosition >= 0 && servicePosition < html.indexOf('js/donations-ui.js'), page);
  }
});
