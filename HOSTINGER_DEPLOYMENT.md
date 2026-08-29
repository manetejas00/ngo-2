# Avinya Care Foundation — Hostinger Production & Staging Deployment Guide

This guide details the complete deployment process, server configuration, environment variable mapping, and troubleshooting steps for **Avinya Care Foundation** on Hostinger.

---

## 📌 Environment & Branch Deployment Table

| Environment | Live Domain | Git Branch | Hostinger MySQL Database | MySQL User | Hostinger Root Dir |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staging / Test** | `https://test.avinyacarefoundation.org` | **`staging`** | `u382139760_ngo_staging` | `u382139760_ngo_staging` | `domains/test.avinyacarefoundation.org/public_html` |
| **Production** | `https://avinyacarefoundation.org` | **`main`** | `u382139760_ngo` | `u382139760_ngo` | `domains/avinyacarefoundation.org/public_html` |

---

## 🛠️ Resolving 503 Service Unavailable Errors

### Cause
Hostinger standard Web Hosting serves static HTML, CSS, JavaScript, and PHP scripts via **LiteSpeed / Apache**. If Hostinger Node.js App Hosting reverse proxy is enabled for `avinyacarefoundation.org`, LiteSpeed attempts to forward requests to a long-running Node process (`server.mjs`) on port 3000. If the Node process is inactive or port binding times out, LiteSpeed returns **`503 Service Unavailable`**.

### Solution & .htaccess Static Pass-Through
1. **LiteSpeed Direct Pass-Through Rule (`.htaccess`)**:
   Added static file condition ensuring `.html`, `.css`, `.js`, and image assets bypass reverse proxy rules and are served directly from disk by LiteSpeed:
   ```apache
   RewriteCond %{REQUEST_FILENAME} -f
   RewriteRule \.(html|css|js|png|jpg|jpeg|gif|ico|svg|webp)$ - [L]
   ```

2. **Automated SSH Deployment Sync (`./deploy.exp`)**:
   - **Staging Web Root**: `domains/test.avinyacarefoundation.org/public_html/` (loads `.env.staging` -> `u382139760_ngo_staging`)
   - **Production Web Root**: `domains/avinyacarefoundation.org/public_html/` (loads `.env.production` -> `u382139760_ngo`)

---

## 🚀 Guarded branch deployment

Each branch deploys only to its matching environment after the quality gate passes:

```bash
# staging branch -> test.avinyacarefoundation.org
git push origin staging

# main branch -> avinyacarefoundation.org
git push origin main
```

The GitHub deployment requires these repository secrets:

- `HOSTINGER_SSH_HOST`
- `HOSTINGER_SSH_PORT` (normally `65002`)
- `HOSTINGER_SSH_USER`
- `HOSTINGER_SSH_PRIVATE_KEY`

The matching public key must be installed for the Hostinger SSH account. The workflow validates the release, deploys only the matching branch, preserves the remote `.env` and `storage/`, checks the live pages and APIs, and automatically restores the previous release if verification fails.

For a guarded local deployment with SSH key authentication:

```bash
export HOSTINGER_SSH_HOST="your-host"
export HOSTINGER_SSH_PORT="65002"
export HOSTINGER_SSH_USER="your-user"
./deploy.exp staging
./deploy.exp production
```

Do not deploy staging and production in one command. Promote a verified staging commit by merging it into `main`.

---

## ⚙️ Hostinger hPanel Web Configuration

When configuring deployments in Hostinger hPanel under `Websites > Deployments > Settings`:

- **Framework Preset**: `Other`
- **Branch**: `main` (for Production) / `staging` (for Staging)
- **Node Version**: `18.x`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Package Manager**: `npm`
- **Entry File**: `server.mjs`

---

## 🧪 Master Live Integration Audit

To run the master audit script against `https://test.avinyacarefoundation.org`:

```bash
python3 test/test_live_master_audit.py
```
