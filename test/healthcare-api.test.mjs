import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/services/healthcare-api.js', import.meta.url), 'utf8');
function api() {
  const context = { window: {}, console: { warn() {} } };
  vm.runInNewContext(source, context);
  return context.window.AvinyaHealthcareApi;
}

test('healthcare API requests and parses JSON', async () => {
  const client = api();
  const data = await client.fetchJson('/api/test', async (url, options) => {
    assert.equal(url, '/api/test');
    assert.equal(options.headers.Accept, 'application/json');
    return { ok: true, text: async () => ' {"status":"ok"} ' };
  });
  assert.equal(data.status, 'ok');
});

test('healthcare API distinguishes failed, empty, HTML and malformed responses', async () => {
  const client = api();
  await assert.rejects(client.fetchJson('/test', async () => ({ ok: false, status: 503 })), /HTTP 503/);
  for (const [body, message] of [[' ', /Empty response/], ['<html>', /received HTML/], ['{', /Invalid JSON/]]) {
    await assert.rejects(client.fetchJson('/test', async () => ({ ok: true, text: async () => body })), message);
  }
});

test('healthcare API preserves primary and fallback behavior', async () => {
  const client = api();
  const calls = [];
  const result = await client.fetchWithFallback('/primary', '/fallback', 'Test', async url => {
    calls.push(url);
    if (url === '/primary') throw new Error('offline');
    return { ok: true };
  });
  assert.deepEqual(calls, ['/primary', '/fallback']);
  assert.equal(result.ok, true);
  assert.equal(await client.fetchWithFallback('/primary', '/fallback', 'Test', async () => { throw new Error('offline'); }), null);
});

test('doctors page loads the healthcare API before the controller', async () => {
  const html = await readFile(new URL('../doctors.html', import.meta.url), 'utf8');
  const apiPosition = html.indexOf('js/services/healthcare-api.js');
  assert.ok(apiPosition >= 0 && apiPosition < html.indexOf('js/healthcare/healthcare-app.js'));
});
