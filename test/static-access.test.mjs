import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateStaticPath } from '../services/http/static-access.mjs';

test('private server and deployment files cannot be served as static assets', () => {
  for (const path of ['/server.mjs', '/config/environment.mjs', '/services/email/emailService.mjs', '/test/example.js', '/storage', '/cache/news.json', '/.env.production', '/api/db.php', '/assets/../test/example.js']) {
    assert.equal(isPrivateStaticPath(path), true, path);
  }
});

test('public pages, browser scripts and assets remain available', () => {
  for (const path of ['/index.html', '/js/services/gallery-service.js', '/assets/logo.png', '/gallery']) {
    assert.equal(isPrivateStaticPath(path), false, path);
  }
});
