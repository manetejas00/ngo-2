import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const requiredFiles = [
  'index.html',
  'doctors.html',
  'admin.html',
  '.htaccess',
  'api/submit-form.php',
  'api/booking/index.php',
  'api/diagnostic-booking.php',
  'api/healthcare/doctors.php',
  'api/healthcare/tests.php',
  'assets/logo.png',
];

const failures = [];
for (const relative of requiredFiles) {
  const path = resolve(root, relative);
  if (!existsSync(path) || statSync(path).size === 0) failures.push(`Missing or empty: ${relative}`);
}

const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

for (const relative of tracked) {
  const extension = extname(relative);
  if (!['.js', '.mjs', '.cjs'].includes(extension)) continue;
  try {
    execFileSync(process.execPath, ['--check', resolve(root, relative)], { stdio: 'pipe' });
  } catch (error) {
    failures.push(`JavaScript syntax failed: ${relative}\n${error.stderr?.toString() || error.message}`);
  }
}

const deployableText = tracked
  .filter((file) => file.endsWith('.html') || file.startsWith('css/') || file.startsWith('js/'))
  .map((file) => [file, readFileSync(resolve(root, file), 'utf8')]);

for (const [file, source] of deployableText) {
  if (/\b(?:localhost|127\.0\.0\.1):\d+\b/.test(source)) {
    failures.push(`Localhost URL found in deployable file: ${file}`);
  }
}

if (failures.length) {
  console.error(`Preflight failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Preflight passed: ${requiredFiles.length} required files and JavaScript syntax verified.`);
