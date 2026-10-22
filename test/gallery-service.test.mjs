import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/services/gallery-service.js', import.meta.url), 'utf8');
function service() {
  const context = { window: {}, console: { warn() {}, error() {} } };
  vm.runInNewContext(source, context);
  return context.window.AvinyaGalleryService;
}

test('gallery service loads, normalizes and sorts API records', async () => {
  const calls = [];
  const items = await service().load(async url => {
    calls.push(url);
    return { ok: true, json: async () => ({ status: 'ok', data: [
      { id: 'older', title: 'Avinya Care Foundation', sort_order: 2 },
      { id: 'featured', title: 'Featured', is_featured: true, sort_order: 5 }
    ] }) };
  });
  assert.deepEqual(calls, ['/api/gallery']);
  assert.equal(items[0].id, 'featured');
  assert.equal(items[1].title, 'AvinyaCareFoundation');
});

test('gallery service falls back to PHP and returns empty data on failure', async () => {
  const calls = [];
  const items = await service().load(async url => {
    calls.push(url);
    if (calls.length === 1) throw new Error('offline');
    return { json: async () => ({ status: 'ok', data: [{ id: 'fallback' }] }) };
  });
  assert.deepEqual(calls, ['/api/gallery', '/api/gallery.php']);
  assert.equal(items[0].id, 'fallback');
  const empty = await service().load(async () => { throw new Error('offline'); });
  assert.equal(empty.length, 0);
});
