import test from 'node:test';
import assert from 'node:assert/strict';
import { parseByteRange } from '../services/http/byte-range.mjs';

test('parses bounded, open-ended and suffix video ranges', () => {
  assert.deepEqual(parseByteRange('bytes=2-5', 10), { start: 2, end: 5 });
  assert.deepEqual(parseByteRange('bytes=7-', 10), { start: 7, end: 9 });
  assert.deepEqual(parseByteRange('bytes=-3', 10), { start: 7, end: 9 });
  assert.deepEqual(parseByteRange('bytes=0-100', 10), { start: 0, end: 9 });
});

test('rejects malformed and unsatisfiable ranges', () => {
  for (const header of ['bytes=10-', 'bytes=5-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,3-4', 'invalid']) {
    assert.equal(parseByteRange(header, 10), null, header);
  }
});
