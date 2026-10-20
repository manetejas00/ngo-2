# Push-to-Live Deployment Guide — AvinyaCareFoundation

This guide explains how to deploy code changes to the live production website (**https://avinyacarefoundation.org**) from any computer.

---

## Quick Reference & Production Details

| Item | Details |
| --- | --- |
| **Production Website** | https://avinyacarefoundation.org |
| **GitHub Repository** | https://github.com/manetejas00/ngo-2 |
| **Production Branch** | `main` |
| **SSH Host / IP** | `82.112.239.95` |
| **SSH Port** | `65002` |
| **SSH Username** | `u382139760` |
| **Live Web Root** | `domains/avinyacarefoundation.org/public_html` |
| **Database Name** | `u382139760_ngo_staging` (Hostinger MySQL) |

---

## Option 1: True Zero-Touch "Push to Deploy" (via GitHub Actions)

To make it so that **simply running `git push origin main` automatically deploys to the live website**, you just need to add 4 repository secrets in GitHub once.

### Step 1: Open GitHub Secrets
Go to: **https://github.com/manetejas00/ngo-2/settings/secrets/actions**

### Step 2: Add these 4 Repository Secrets

1. **`HOSTINGER_SSH_HOST`**
   ```text
   82.112.239.95
   ```
2. **`HOSTINGER_SSH_PORT`**
   ```text
   65002
   ```
3. **`HOSTINGER_SSH_USER`**
   ```text
   u382139760
   ```
4. **`HOSTINGER_SSH_PRIVATE_KEY`**
   - The OpenSSH private key whose public key is authorized on Hostinger.
   - Paste the full private key including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

> **Note on SSH Keys:**
> The Hostinger account (`u382139760`) currently has these authorized public keys in `~/.ssh/authorized_keys`:
> - `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB5UYt/0QuOQuGn/dpyAwEZOBDeIpMUjXlGsHGBzaIdT manetejas00`
> - `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAYywPMiWjHCvN2cOpGCVHGR3DSu0Gu0+lfuS497YHyN avinya-deploy`
>
> If you want to generate a dedicated GitHub Actions key pair:
> 1. Run: `ssh-keygen -t ed25519 -f gh_deploy -N "" -C "github-actions-deploy"`
> 2. Add `gh_deploy.pub` into Hostinger hPanel (**Advanced → SSH Access → Add SSH Key**) or append it to `~/.ssh/authorized_keys`.
> 3. Paste `gh_deploy` into the GitHub Secret `HOSTINGER_SSH_PRIVATE_KEY`.

### How It Works After Setup:
From **ANY computer**:
```bash
git add .
git commit -m "feat: your feature description"
git push origin main
```
1. GitHub triggers **Deployment quality gate** (validates JavaScript syntax and preflight checks).
2. Upon passing, GitHub automatically triggers **Deploy website** workflow.
3. The release is securely transferred to Hostinger, installed, migrated, and verified live!

---

## Option 2: One-Command Deployment from Terminal (`npm run deploy:live`)

If you are working on a computer and want to push and deploy right from your terminal without opening a browser:

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Deploy to live website
npm run deploy:live
```

### What `npm run deploy:live` does automatically:
1. Runs local preflight verification (`node scripts/preflight.mjs`).
2. Pushes all local commits to GitHub `origin/main`.
3. Connects securely to the Hostinger server over SSH.
4. Pulls the latest release onto the live production website (`git pull --ff-only origin main`).
5. Updates the `.release` marker file with the exact commit SHA.
6. Runs database migrations and seeds (`php api/migrate.php`).
7. Purges and invalidates all server caches.
8. Runs post-deployment live smoke checks against `https://avinyacarefoundation.org`.

---

## Option 3: Manual Deployment (Hostinger Web Terminal or SSH)

If you ever need to manually trigger a release from Hostinger's terminal:

1. **Connect to Hostinger**:
   - Via SSH:
     ```bash
     ssh -p 65002 u382139760@82.112.239.95
     ```
   - Or open **Hostinger hPanel → Advanced → Terminal**.

2. **Execute Deployment Commands**:
   ```bash
   cd domains/avinyacarefoundation.org/public_html
   git fetch origin main
   git checkout main
   git pull --ff-only origin main
   git rev-parse HEAD > .release
   php api/migrate.php
   ```

---

## Verifying the Live Website

Run the automated smoke suite from any terminal to check that all live pages, assets, and APIs are healthy:

```bash
npm run smoke:production
```

Expected output:
```text
PASS / (200, 107974 bytes)
PASS /doctors.html (200, 42062 bytes)
PASS /admin.html (200, 210282 bytes)
PASS /assets/logo.png (200, 237377 bytes)
PASS /api/healthcare/doctors.php (200, 21956 bytes, doctors=10)
PASS /api/healthcare/tests.php (200, 14832 bytes, tests=8)
PASS /api/news.php (200, 5851 bytes, articles=9)
Smoke checks passed for https://avinyacarefoundation.org.
```

### Deep Live Feature Checks:
- **Hero Video**: Visit `/` and verify the background video seeks smoothly on scroll.
- **Gallery Video Lightbox**: Visit `/gallery` and click on any video drive (*Avinya Community Health Camp*, *Child Welfare*, *Blood Donation*); confirm the video opens in the custom lightbox player.
- **Doctors Directory**: Visit `/doctors` or `/doctors.html` and verify the full doctor catalog and booking flow are displayed (not "Coming Soon").

---

## Troubleshooting

| Symptom | Cause & Solution |
| --- | --- |
| **GitHub Action fails at "Configure Hostinger SSH"** | Missing GitHub Secrets. Add `HOSTINGER_SSH_PRIVATE_KEY`, `HOSTINGER_SSH_HOST`, `HOSTINGER_SSH_PORT`, and `HOSTINGER_SSH_USER` in repository settings. |
| **Permission denied (publickey,password)** | Your local SSH key is not authorized. Either add your SSH public key to Hostinger hPanel or use `npm run deploy:live` which supports `.env` password authentication fallback. |
| **Node fetch timeout on Windows** | Node on Windows may attempt IPv6 before IPv4. Run with `node --dns-result-order=ipv4first ...` or use `npm run smoke:production`. |
| **Old styles or scripts show on website** | Asset caching. Update the `?v=X.X.X` query parameter in the corresponding HTML files (e.g. `?v=4.2.1`). |
| **Need emergency rollback** | The server keeps a backup at `domains/avinyacarefoundation.org/public_html.rollback`. Run `git checkout HEAD~1` or copy the backup files back. |
