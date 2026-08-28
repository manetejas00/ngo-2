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

## 🚀 One-Command Automated SSH Deployment

To deploy from your local environment to the live Hostinger Staging & Production web servers:

```bash
# 1. Switch to staging branch
git checkout staging
git add .
git commit -m "Deployment update"
git push origin staging

# 2. Build deployment package & trigger SSH upload script
zip -r avinya-care-hostinger-deployment.zip . -x "node_modules/*" ".git/*" ".DS_Store"
./deploy.exp
```

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
