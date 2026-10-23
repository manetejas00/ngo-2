# Deploy AvinyaCareFoundation from another computer

This guide deploys the repository's committed `main` branch to Hostinger production. It includes the scrolling video hero, gallery video player, social-link updates, and PHP gallery video support.

## Release and server details

| Item | Value |
| --- | --- |
| Repository | https://github.com/manetejas00/ngo-2 |
| Production branch | `main` |
| Application version at handoff | `4.2.2` |
| PHP gallery repair commit | `12e6bee` (or a newer commit containing it) |
| Website | https://avinyacarefoundation.org |
| SSH host | `82.112.239.95` |
| SSH port | `65002` |
| SSH user | `u382139760` |
| Production directory, relative to SSH home | `domains/avinyacarefoundation.org/public_html` |

At handoff on 20 October 2026, the production website still served version `4.1.0`. GitHub validation passed for the repair, but deployment failed because the repository had no Hostinger deployment secrets. A direct SSH test from the original computer also failed authentication.

## 1. Prepare the other computer

Use a Bash terminal on Linux/macOS, or WSL on Windows. Install Git, Node.js 20 or newer with npm, OpenSSH (`ssh`, `scp`, `ssh-agent`), and `tar`. PHP 8 or newer is useful for local syntax validation; GitHub also validates PHP.

Run the commands in this guide in that Bash terminal, not PowerShell. Clone with LF line endings so the deployment shell script runs correctly:

```bash
git -c core.autocrlf=false clone https://github.com/manetejas00/ngo-2.git
cd ngo-2
git config core.autocrlf false
git switch main
git pull --ff-only origin main
git merge-base --is-ancestor 12e6bee HEAD
git status --short
npm ci
npm test
```

The ancestor check must succeed. The working tree should be clean: deployment uses `git archive HEAD`, so uncommitted changes are not uploaded. Resolve failed checks before deploying. Never use the old ZIP archive as the release source.

## 2. Authenticate with Hostinger

The public key in `HOSTINGER_DEPLOYMENT.md` cannot authenticate by itself. You need its matching private key, or another private key whose public key is authorized for this hosting account.

If the other computer already has working access, use that identity. Otherwise, generate a dedicated key there:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/avinya_hostinger -C "avinya-deployment"
```

In Hostinger hPanel, open **Advanced → SSH Access**, ensure SSH is enabled, and add the contents of `~/.ssh/avinya_hostinger.pub` as an authorized public key. Keep the private file `~/.ssh/avinya_hostinger` private; do not commit it or paste it into a chat.

Load the private key into an agent so both `ssh` and `scp` can use it:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/avinya_hostinger
ssh -p 65002 u382139760@82.112.239.95 'pwd'
```

For an existing identity, replace the `ssh-add` path with that key's path. On first connection, verify the server fingerprint through a trusted hosting source before accepting it. If authentication fails, correct SSH access before continuing.

Confirm noninteractive access and the existing production environment file:

```bash
ssh -p 65002 -o BatchMode=yes -o StrictHostKeyChecking=yes \
  u382139760@82.112.239.95 \
  'test -s domains/avinyacarefoundation.org/public_html/.env && echo "SSH and production environment ready"'
```

Do not overwrite the live `.env` with a development file. The deploy script requires the existing server `.env` and carries it into the release. Confirm the server has PHP and that its production database credentials are working.

## 3. Back up production before deployment

Create a Hostinger backup of the website files and production MySQL database, and confirm it can be restored. Record the backup's time and location.

The current deployment script replaces the website directory and preserves only `.env` and `storage/`. Files uploaded on the server under `uploads/`, `assets/gallery/`, or `assets/videos/` that are absent from Git can be removed. Back up those files separately and arrange to restore them after deployment. Do not proceed until that content is protected.

The script also keeps a sibling `public_html.rollback` file backup, replacing the previous one each time. That backup is not a database backup. The PHP API automatically adds gallery video columns and inserts missing seed gallery records on database initialization; it preserves existing gallery records during normal seeding.

## 4. Deploy production directly

From the repository root on `main`:

```bash
export HOSTINGER_SSH_HOST=82.112.239.95
export HOSTINGER_SSH_PORT=65002
export HOSTINGER_SSH_USER=u382139760

bash scripts/deploy-hostinger.sh production
```

The script validates the project, uploads the committed release, checks PHP syntax on the host, installs the files, writes the commit to `.release`, and runs live smoke checks. If those smoke checks fail, it attempts to restore the previous website files and exits with an error. Database changes are not rolled back automatically.

Read the final result. A successful upload alone does not mean deployment succeeded. If server-only uploads were backed up in step 3, restore the missing media without replacing the newly deployed application files, then repeat verification.

## 5. Verify the actual live release

Check that the server's release marker matches the local commit:

```bash
git rev-parse HEAD
ssh -p 65002 -o BatchMode=yes -o StrictHostKeyChecking=yes \
  u382139760@82.112.239.95 \
  'cat domains/avinyacarefoundation.org/public_html/.release'

npm run smoke:production
```

Then verify the feature-specific files and API. Run this from the repository root:

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs';
const base = 'https://avinyacarefoundation.org';
let failed = false;
function check(ok, label) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  failed ||= !ok;
}
async function get(path, headers = {}) {
  return fetch(`${base}${path}?verify=${Date.now()}`, {
    headers: { 'cache-control': 'no-cache', ...headers },
    signal: AbortSignal.timeout(20000),
  });
}
const home = await get('/');
check(home.ok && (await home.text()).includes('id="hero-video"'), 'Home video element');
const gallery = await get('/gallery');
check(gallery.ok && (await gallery.text()).includes('id="lightboxVideo"'), 'Gallery video player');
for (const path of ['/js/canvas-hero.js', '/js/gallery-app.js']) {
  const response = await get(path);
  const live = (await response.text()).replaceAll('\r\n', '\n');
  const local = fs.readFileSync(`.${path}`, 'utf8').replaceAll('\r\n', '\n');
  check(response.ok && live === local, `${path} matches this release`);
}
const response = await get('/api/gallery.php');
const json = await response.json();
const items = Array.isArray(json) ? json : json.data || [];
const seeds = JSON.parse(fs.readFileSync('data/seed_galleries.json', 'utf8'));
const expectedVideos = seeds.filter(item => item.video && item.is_published);
for (const seed of expectedVideos) {
  check(response.ok && items.some(item =>
    (item.gallery_id || item.id) === (seed.gallery_id || seed.id) && item.video === seed.video
  ), `Published gallery video: ${seed.title}`);
}
const media = [
  '/assets/hero-video.mp4', '/assets/hero-video-mobile.mp4',
  ...expectedVideos.map(item => item.video),
];
for (const path of media) {
  const response = await get(path, { Range: 'bytes=0-63' });
  check(response.status === 206 &&
    (response.headers.get('content-type') || '').includes('video/mp4') &&
    (response.headers.get('content-range') || '').startsWith('bytes 0-63/'),
    `Video range streaming: ${path}`);
  await response.body?.cancel();
}
if (failed) process.exitCode = 1;
NODE
```

Finally, open the live site in a private browser window:

- On `/`, scroll down and back up: the hero video should seek with scrolling. Repeat on a phone or narrow viewport.
- On `/gallery`, confirm the video cards appear, open each of the three new videos, play and seek, then close the lightbox. Check the Videos filter and image cards too.
- Check navigation and social links, and confirm `/doctors.html` shows the doctor directory rather than Coming Soon.
- Confirm existing uploaded gallery content still loads.

If old content remains, compare `.release` and the live feature checks first. After confirming the new files are installed, purge Hostinger/CDN cache and hard-refresh. A cache purge cannot fix missing files or a failed deployment.

## 6. Enable future deployments through GitHub (optional)

Open https://github.com/manetejas00/ngo-2/settings/secrets/actions and add these repository Actions secrets:

| Secret | Value |
| --- | --- |
| `HOSTINGER_SSH_PRIVATE_KEY` | Full private deployment key in OpenSSH format, including header, footer, and newlines |
| `HOSTINGER_SSH_HOST` | `82.112.239.95` |
| `HOSTINGER_SSH_PORT` | `65002` |
| `HOSTINGER_SSH_USER` | `u382139760` |

The existing GitHub workflow has no passphrase-unlock step. For automated deployments, use an authorized dedicated deployment key compatible with that workflow; do not substitute an unrelated personal private key.

After the secrets are configured, open **Actions → Deploy website → Run workflow**, select `main`, and start it. Monitor both the deployment result and the live checks above. Future pushes to `main` trigger **Deployment quality gate**, followed by **Deploy website** when validation succeeds.

## Troubleshooting

| Symptom | Next action |
| --- | --- |
| `Permission denied (publickey,password)` | Load the correct private key and authorize its public key in Hostinger SSH Access. |
| GitHub fails at Configure Hostinger SSH | Check all four Actions secrets, key formatting, SSH availability, and host reachability. |
| `.env is missing; refusing deployment` | Restore/configure the production server `.env` using Hostinger; never copy development credentials blindly. |
| Video URLs return 404 | Confirm the newest `main` was deployed and that video files were included in the upload. |
| Videos exist but cards are absent | Check `/api/gallery.php`, PHP logs, and database migration permissions; deploy commit `12e6bee` or newer. |
| API returns video records but old UI persists | Compare the JavaScript files with the release, then purge cache. |
| `/doctors.html` shows Coming Soon | Verify the new file and `.htaccess` were deployed and inspect hosting redirects. |
| Smoke checks fail and the site reverts | The deploy script attempted rollback. Fix the reported failure before retrying. |

Do not send SSH keys, server environment files, database passwords, or private backups to GitHub source control.
