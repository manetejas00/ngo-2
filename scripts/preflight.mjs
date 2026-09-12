import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const requiredFiles = [
  'index.html',
  'doctors.html',
  'crowdfunding.html',
  'admin.html',
  '.htaccess',
  'api/submit-form.php',
  'api/booking/index.php',
  'api/diagnostic-booking.php',
  'api/healthcare/doctors.php',
  'api/healthcare/tests.php',
  'js/donations-ui.js',
  'assets/logo.png',
];

const failures = [];
for (const relative of requiredFiles) {
  const path = resolve(root, relative);
  if (!existsSync(path) || statSync(path).size === 0) failures.push(`Missing or empty: ${relative}`);
}

const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  .split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

function collectFiles(directory, extensions) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path, extensions);
    return extensions.has(extname(entry.name)) ? [path] : [];
  });
}

const javaScriptFiles = [
  ...new Set([
    ...tracked.map((relative) => resolve(root, relative)),
    ...collectFiles(resolve(root, 'js'), new Set(['.js', '.mjs', '.cjs'])),
    ...collectFiles(resolve(root, 'services'), new Set(['.js', '.mjs', '.cjs'])),
    ...collectFiles(resolve(root, 'scripts'), new Set(['.js', '.mjs', '.cjs'])),
  ]),
];

for (const path of javaScriptFiles) {
  const relative = path.slice(root.length + 1);
  const extension = extname(relative);
  if (!['.js', '.mjs', '.cjs'].includes(extension)) continue;
  try {
    execFileSync(process.execPath, ['--check', path], { stdio: 'pipe' });
  } catch (error) {
    failures.push(`JavaScript syntax failed: ${relative}\n${error.stderr?.toString() || error.message}`);
  }
}

// PHP is deployed separately on Hostinger. Validate it locally whenever PHP is installed,
// while keeping the JavaScript-only development workflow usable on machines without it.
const phpFiles = tracked.filter((file) => file.endsWith('.php'));
const phpBinaryCandidates = [
  process.env.PHP_BINARY,
  'php',
  '/opt/homebrew/bin/php',
  '/usr/local/bin/php',
  '/usr/bin/php',
].filter(Boolean);
const phpBinary = phpBinaryCandidates.find((candidate) => (
  spawnSync(candidate, ['--version'], { stdio: 'ignore' }).status === 0
));
const phpAvailable = Boolean(phpBinary);
if (phpAvailable) {
  for (const relative of phpFiles) {
    const result = spawnSync(phpBinary, ['-l', resolve(root, relative)], { encoding: 'utf8' });
    if (result.status !== 0) {
      failures.push(`PHP syntax failed: ${relative}\n${result.stderr || result.stdout}`);
    }
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

console.log(`Preflight passed: ${requiredFiles.length} required files and ${javaScriptFiles.length} JavaScript file(s) syntax verified${phpAvailable ? `; ${phpFiles.length} PHP file(s) syntax verified` : '; PHP runtime unavailable, PHP syntax check skipped'}.`);
