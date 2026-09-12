import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

console.log('--- AVINYA CARE FOUNDATION PRELOADER AUDIT ---');

const checks = [];

// 1. Check preloader.css
const cssPath = resolve(root, 'css/preloader.css');
if (!existsSync(cssPath)) {
  checks.push({ test: 'css/preloader.css exists', pass: false });
} else {
  const css = readFileSync(cssPath, 'utf8');
  checks.push({ test: 'css/preloader.css contains #avinya-preloader', pass: css.includes('#avinya-preloader') });
  checks.push({ test: 'css/preloader.css contains heartbeat animation', pass: css.includes('preloaderHeartbeat') });
  checks.push({ test: 'css/preloader.css contains pulse rings', pass: css.includes('preloaderRingPulse') });
  checks.push({ test: 'css/preloader.css contains prefers-reduced-motion', pass: css.includes('prefers-reduced-motion') });
  checks.push({ test: 'css/preloader.css contains mobile responsive queries', pass: css.includes('@media (max-width:') });
}

// 2. Check preloader.js
const jsPath = resolve(root, 'js/components/preloader.js');
if (!existsSync(jsPath)) {
  checks.push({ test: 'js/components/preloader.js exists', pass: false });
} else {
  const js = readFileSync(jsPath, 'utf8');
  checks.push({ test: 'js/components/preloader.js contains AvinyaPreloader class', pass: js.includes('class AvinyaPreloader') });
  checks.push({ test: 'js/components/preloader.js contains failsafe timeout', pass: js.includes('maxFailsafeTimeout') });
  checks.push({ test: 'js/components/preloader.js contains custom event dispatch', pass: js.includes('avinya:preloader-dismissed') });
}

// 3. Check index.html and doctors.html integration
for (const page of ['index.html', 'doctors.html']) {
  const pagePath = resolve(root, page);
  const html = readFileSync(pagePath, 'utf8');
  checks.push({ test: `${page} includes preloader.css`, pass: html.includes('css/preloader.css') });
  checks.push({ test: `${page} includes preloader.js`, pass: html.includes('js/components/preloader.js') });
  checks.push({ test: `${page} includes #avinya-preloader markup`, pass: html.includes('id="avinya-preloader"') });
  checks.push({ test: `${page} uses official logo emblem`, pass: html.includes('assets/logo-emblem.png') });
}

let allPassed = true;
for (const c of checks) {
  if (c.pass) {
    console.log(`✓ PASS: ${c.test}`);
  } else {
    console.log(`✗ FAIL: ${c.test}`);
    allPassed = false;
  }
}

if (!allPassed) {
  process.exit(1);
}

console.log('\nAll preloader verification checks passed successfully!');
