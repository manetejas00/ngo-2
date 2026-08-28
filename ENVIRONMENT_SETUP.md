# Avinya Care Foundation — Environment & Deployment Workflow Guide

This document defines the official Git Branching strategy, Environment Configuration rules, Hostinger Deployment procedures, and Automated Testing standards for the **Avinya Care Foundation** web application platform.

---

## 📌 Environment & Database Infrastructure

| Environment | Domain | Git Branch | MySQL Database | MySQL Username | Host |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Staging / Testing** | `https://test.avinyacarefoundation.org` | `feature/*` | `u382139760_ngo_staging` | `u382139760_ngo_staging` | `localhost` |
| **Production** | `https://avinyacarefoundation.org` | `main` | `u382139760_ngo` | `u382139760_ngo` | `localhost` |

---

## 🌿 Git Branching Workflow Strategy

To ensure production stability, **new development work must never be committed directly to `main` without testing on Staging first**.

### Rule 1: Feature Branch Creation
When initiating any new feature, bugfix, or UI enhancement, always create a dedicated feature branch:
```bash
git checkout main
git pull origin main
git checkout -b feature/<feature-name>
```

### Rule 2: Staging Deployment & Testing
Deploy changes from your feature branch to the Staging server (`https://test.avinyacarefoundation.org`) for verification:
```bash
# Stage, commit, and push feature branch to origin
git add .
git commit -m "Describe feature changes"
git push -u origin feature/<feature-name>

# Build zip package and deploy to Hostinger test server via SSH
zip -r avinya-care-hostinger-deployment.zip . -x "node_modules/*" ".git/*" ".DS_Store"
./deploy.exp
```

### Rule 3: Integration Testing & Verification
Run the automated end-to-end suite against `https://test.avinyacarefoundation.org`:
```bash
python3 test/test_live_master_audit.py
python3 test/test_live_tab_data.py
python3 test/test_user_crud.py
python3 test/test_form_menus.py
```

### Rule 4: Merge to Production (`main`)
Once all live staging tests pass successfully, merge the feature branch into `main`:
```bash
git checkout main
git merge feature/<feature-name>
git push origin main
```

---

## ⚙️ Environment Configuration Files

- **`.env.staging`**: Contains staging environment variables targeting `https://test.avinyacarefoundation.org` and database `u382139760_ngo_staging`.
- **`.env.production`**: Contains production environment variables targeting `https://avinyacarefoundation.org` and database `u382139760_ngo`.
- **`.env`**: Local working environment file.

### Credentials Summary
- **Staging MySQL Database**:
  - `DB_HOST`: `localhost`
  - `DB_NAME`: `u382139760_ngo_staging`
  - `DB_USER`: `u382139760_ngo_staging`
  - `DB_PASS`: `@qLVTyL|J5`
- **Production MySQL Database**:
  - `DB_HOST`: `localhost`
  - `DB_NAME`: `u382139760_ngo`
  - `DB_USER`: `u382139760_ngo`
  - `DB_PASS`: `@qLVTyL|J5`
- **SMTP Email Service**:
  - `SMTP_HOST`: `smtp.hostinger.com` (Port 465 SSL)
  - `SMTP_USER`: `info@test.avinyacarefoundation.org` (Staging) / `info@avinyacarefoundation.org` (Production)
- **Admin Dashboard Login**:
  - URL: `https://test.avinyacarefoundation.org/admin.html`
  - Email: `admin@gmail.com`
  - Password: `Admin@1230`

---

## 🧪 Live Automated Test Suite

| Test Script | Target Functionality | Command |
| :--- | :--- | :--- |
| `test/test_live_master_audit.py` | Complete E2E Audit (Forms, Bookings, News, Admin CRUD) | `python3 test/test_live_master_audit.py` |
| `test/test_live_tab_data.py` | Admin Sidebar Badges & Table Data Parity | `python3 test/test_live_tab_data.py` |
| `test/test_user_crud.py` | System User Account Creation, Read, Update, Delete | `python3 test/test_user_crud.py` |
| `test/test_form_menus.py` | Dedicated Form Sidebar Tabs & Type Filtering | `python3 test/test_form_menus.py` |
| `test/test_doctor_test_crud.py` | Doctors Directory & Diagnostic Test Package CRUD | `python3 test/test_doctor_test_crud.py` |

---

## 📄 Automated Deployment Script (`deploy.exp`)

```expect
#!/usr/bin/expect -f
set timeout 120
spawn ssh -p 65002 u382139760@195.35.48.24
expect "password:"
send "@qLVTyL|J5\r"
expect "$ "
send "cd domains/avinyacarefoundation.org/public_html && unzip -o avinya-care-hostinger-deployment.zip && echo DEPLOYMENT_COMPLETE\r"
expect "$ "
send "exit\r"
expect eof
```
