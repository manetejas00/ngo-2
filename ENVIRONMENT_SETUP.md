# Avinya Care Foundation — Official Branch & Environment Deployment Reference

This document defines the official Git Branching strategy, Environment Configuration rules, Hostinger MySQL parameters, and Deployment Workflow for the **Avinya Care Foundation** healthcare platform.

---

## 📌 Environment & Infrastructure Mapping

| Environment | Live Domain | Git Branch | Hostinger MySQL Database | MySQL User | Host |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staging / Testing** | `https://test.avinyacarefoundation.org` | `staging` | `u382139760_ngo_staging` | `u382139760_ngo_staging` | `localhost` |
| **Production / Main** | `https://avinyacarefoundation.org` | `main` | `u382139760_ngo` | `u382139760_ngo` | `localhost` |

---

## 🌿 Git Branching & Workflow Rules

### Rule 1: Staging Development (`staging` Branch)
All new features, UI enhancements, form updates, and API modifications must be committed and tested on the **`staging`** branch first:
```bash
git checkout staging
git pull origin staging
# Develop & test locally
git add .
git commit -m "Add new feature / bugfix"
git push origin staging
```
Deploying to Staging (`https://test.avinyacarefoundation.org`):
```bash
zip -r avinya-care-hostinger-deployment.zip . -x "node_modules/*" ".git/*" ".DS_Store"
./deploy.exp
```

### Rule 2: Production Release (`main` Branch)
Once all end-to-end tests pass on `https://test.avinyacarefoundation.org`, merge `staging` into **`main`**:
```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```

---

## ⚙️ Environment Configuration Files (`.env.staging` & `.env.production`)

- **`.env.staging`**: Dedicated staging environment configuration loaded automatically when accessing `test.avinyacarefoundation.org`.
  - Database: `u382139760_ngo_staging`
  - SMTP From: `info@test.avinyacarefoundation.org`
  - Domain: `https://test.avinyacarefoundation.org`
- **`.env.production`**: Dedicated production environment configuration loaded automatically when accessing `avinyacarefoundation.org`.
  - Database: `u382139760_ngo`
  - SMTP From: `info@avinyacarefoundation.org`
  - Domain: `https://avinyacarefoundation.org`

---

## 🔐 Credentials & API Parameters Summary

- **Database Password (Staging & Production)**: `@qLVTyL|J5`
- **Hostinger SMTP Email Server**: `smtp.hostinger.com` (Port 465 SSL)
- **Admin Dashboard Credentials**:
  - URL: `https://test.avinyacarefoundation.org/admin.html`
  - Email: `admin@gmail.com`
  - Password: `Admin@1230`

---

## 🧪 Master Automated E2E Audit Command

To execute the complete 15-point live integration audit:
```bash
python3 test/test_live_master_audit.py
```
