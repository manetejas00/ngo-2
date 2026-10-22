import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../services/http/rate-limit.mjs';

test('sensitive endpoints enforce their existing limit and report retry information', () => {
  const req = { url: '/api/submit-form', headers: {}, socket: { remoteAddress: 'test-client' } };
  const headers = {};
  const res = {
    setHeader(name, value) { headers[name] = value; },
    writeHead(status) { this.status = status; },
    end(body) { this.body = body; }
  };
  for (let i = 0; i < 15; i++) assert.equal(checkRateLimit(req, res), true);
  assert.equal(checkRateLimit(req, res), false);
  assert.equal(res.status, 429);
  assert.equal(headers['X-RateLimit-Limit'], 15);
  assert.ok(headers['Retry-After'] > 0);
  assert.equal(JSON.parse(res.body).status, 'error');
});
