import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'ssh2';
import 'dotenv/config';

const HOST = process.env.HOSTINGER_SSH_HOST || '82.112.239.95';
const PORT = parseInt(process.env.HOSTINGER_SSH_PORT || '65002', 10);
const USER = process.env.HOSTINGER_SSH_USER || 'u382139760';
const PASS = process.env.HOSTINGER_SSH_PASS || process.env.DB_PASS || '@qLVTyL|J5';
const TARGET_DIR = 'domains/avinyacarefoundation.org/public_html';
const LIVE_URL = 'https://avinyacarefoundation.org';

console.log('🚀 AvinyaCareFoundation Production Deployment');
console.log('---------------------------------------------');

// 1. Run local preflight verification
console.log('1️⃣ Running local preflight verification...');
try {
  execSync(`"${process.execPath}" scripts/preflight.mjs', { stdio: 'inherit' });
} catch (e) {
  console.error('❌ Preflight failed. Aborting deployment.');
  process.exit(1);
}

// 2. Ensure git branch is main
const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
if (currentBranch !== 'main') {
  console.error(`❌ Deployment must be run from 'main' branch (current: '${currentBranch}').`);
  process.exit(1);
}

// 3. Check for unpushed commits and push if needed
console.log('2️⃣ Checking git status and pushing commits...');
try {
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Local commits pushed to GitHub origin/main.');
} catch (e) {
  console.error('❌ Failed to push commits to GitHub origin/main. Ensure remote access is valid.');
  process.exit(1);
}

const localSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
console.log(`📦 Deploying release commit: ${localSha}`);

// 4. Determine SSH authentication (Key or Password)
const authConfig = { host: HOST, port: PORT, username: USER };
const defaultKeyPath = join(homedir(), '.ssh', 'id_ed25519');
const rsaKeyPath = join(homedir(), '.ssh', 'id_rsa');

if (existsSync(defaultKeyPath)) {
  try {
    authConfig.privateKey = readFileSync(defaultKeyPath);
    console.log('🔑 Authenticating via local SSH key (~/.ssh/id_ed25519)...');
  } catch {}
} else if (existsSync(rsaKeyPath)) {
  try {
    authConfig.privateKey = readFileSync(rsaKeyPath);
    console.log('🔑 Authenticating via local SSH key (~/.ssh/id_rsa)...');
  } catch {}
}

if (!authConfig.privateKey && PASS) {
  authConfig.password = PASS;
  console.log('🔐 Authenticating via Hostinger SSH password credentials...');
}

// 5. Connect and execute remote deployment commands
console.log(`3️⃣ Connecting to Hostinger server (${USER}@${HOST}:${PORT})...`);
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected to Hostinger via SSH.');
  console.log('4️⃣ Pulling release on production server, running migrations & purging cache...');

  const remoteScript = [
    `set -e`,
    `cd ${TARGET_DIR}`,
    `git fetch origin main`,
    `git checkout main`,
    `git pull --ff-only origin main`,
    `echo "${localSha}" > .release`,
    `php api/migrate.php`,
  ].join(' && ');

  conn.exec(remoteScript, (err, stream) => {
    if (err) {
      console.error('❌ Failed to execute remote deployment:', err);
      conn.end();
      process.exit(1);
    }

    let remoteOutput = '';
    stream.on('data', (d) => {
      remoteOutput += d;
      process.stdout.write(d.toString());
    });

    stream.stderr.on('data', (d) => {
      process.stderr.write(d.toString());
    });

    stream.on('close', (code) => {
      conn.end();
      if (code !== 0) {
        console.error(`\n❌ Remote execution exited with code ${code}.`);
        process.exit(code);
      }

      console.log('\n✅ Remote files updated and database migrated successfully.');
      console.log('5️⃣ Running live smoke checks against production...');

      try {
        execSync(`"${process.execPath}" --dns-result-order=ipv4first scripts/live-smoke.mjs ${LIVE_URL}`, { stdio: 'inherit' });
        console.log('\n🎉 ALL CHECKS PASSED: Website is live and fully verified!');
      } catch (smokeErr) {
        console.error('❌ Post-deployment smoke check failed.');
        process.exit(1);
      }
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Error:', err.message);
  process.exit(1);
}).connect(authConfig);
