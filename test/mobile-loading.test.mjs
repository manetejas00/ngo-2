import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('visitor page scripts are available without third-party CDN access', async () => {
  for (const name of (await readdir(root)).filter(name => name.endsWith('.html') && name != 'admin.html')) {
    const html = await readFile(new URL(name, root), 'utf8');
    for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) {
      assert.ok(!/^https?:\/\//.test(src), `${name} blocks on external script ${src}`);
      const path = src.split('?')[0].replace(/^\//, '');
      assert.ok((await stat(new URL(path, root))).size > 0, `${name}: ${src}`);
    }
  }
});

test('remote fonts cannot block first paint and preloader has a CSS-only exit', async () => {
  for (const name of (await readdir(root)).filter(name => name.endsWith('.html'))) {
    const html = await readFile(new URL(name, root), 'utf8');
    for (const [link] of html.matchAll(/<link\b[^>]*href="https:\/\/fonts.googleapis.com\/[^>]+>/g)) {
      assert.match(link, /media="print"/, name);
      assert.match(link, /onload="this.media='all'"/, name);
    }
  }
  const styles = await readFile(new URL('css/styles.css', root), 'utf8');
  assert.doesNotMatch(styles, /@import[^;]*https:/);
  const loader = await readFile(new URL('css/preloader.css', root), 'utf8');
  assert.match(loader, /animation: preloaderFailsafe 0s 2s forwards/);
  assert.match(loader, /@keyframes preloaderFailsafe\s*{\s*to\s*{[^}]*visibility: hidden;[^}]*pointer-events: none;/);
});
