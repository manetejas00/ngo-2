# Avinya Care Foundation — Hostinger Production & Staging Deployment Guide

This guide details the complete deployment process and server configuration for **Avinya Care Foundation** on Hostinger.

---

## 📌 Environment & Branch Deployment Table

| Environment | Live Domain | Git Branch | Hostinger MySQL Database | MySQL User | Hostinger Root Dir |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staging / Test** | `https://test.avinyacarefoundation.org` | **`staging`** | `u382139760_ngo_staging` | `u382139760_ngo_staging` | `public_html` (Staging Subdomain) |
| **Production** | `https://avinyacarefoundation.org` | **`main`** | `u382139760_ngo` | `u382139760_ngo` | `public_html` (Main Domain) |

---

## ⚙️ Hostinger hPanel App Hosting / Web Configuration

When setting up or updating deployments in Hostinger hPanel under `Websites > Deployments > Settings`:

- **Framework Preset**: `Other`
- **Branch**: `main` (for Production) / `staging` (for Staging)
- **Node Version**: `18.x`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Package Manager**: `npm`
- **Output Directory**: (Leave default / empty)
- **Entry File**: `server.mjs`

---

## 🚀 One-Command Automated SSH Deployment

To deploy from your local environment to the live Hostinger Staging server:

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

## 🧪 Master Live Integration Audit

Run the master audit script against `https://test.avinyacarefoundation.org`:

```bash
python3 test/test_live_master_audit.py
```
