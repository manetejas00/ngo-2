# Avinya Care Foundation — Hostinger Deployment Guide

This guide provides SSH details, key setup instructions, and deployment commands for Hostinger shared hosting (`avinyacarefoundation.org` and `test.avinyacarefoundation.org`).

---

## 1. Hostinger SSH Details

- **SSH IP / Host**: `82.112.239.95` (or `avinyacarefoundation.org`)
- **SSH Port**: `65002`
- **SSH Username**: `u382139760`
- **Production Path**: `domains/avinyacarefoundation.org/public_html`
- **Staging Path**: `domains/test.avinyacarefoundation.org/public_html`

---

## 2. Public SSH Key (Add to Hostinger hPanel)

To allow passwordless terminal deployment from your local machine, click **Add SSH key** in Hostinger hPanel (**Advanced** → **SSH Access**) and paste the key below:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB5UYt/0QuOQuGn/dpyAwEZOBDeIpMUjXlGsHGBzaIdT manetejas00
```

---

## 3. How to Run `npm install` on Hostinger Live

### Method A: Hostinger Web Terminal (hPanel)
1. Go to Hostinger hPanel → **Advanced** → **Terminal**.
2. Run the following commands:

```bash
# Production Domain
cd domains/avinyacarefoundation.org/public_html
npm install
npm run build

# Staging Domain
cd domains/test.avinyacarefoundation.org/public_html
npm install
npm run build
```

---

### Method B: Via Local Terminal (Once SSH Key is Added)

Connect to Hostinger SSH:
```bash
ssh -p 65002 u382139760@82.112.239.95
```

Once connected:
```bash
cd domains/avinyacarefoundation.org/public_html
npm install
node server.mjs
```

---

## 4. Automated Deployment Script

Once SSH access is authorized, deploy directly using our automated script:

```bash
# Set SSH Environment Variables
export HOSTINGER_SSH_HOST="82.112.239.95"
export HOSTINGER_SSH_USER="u382139760"
export HOSTINGER_SSH_PORT="65002"

# Deploy Staging
./scripts/deploy-hostinger.sh staging

# Deploy Production
./scripts/deploy-hostinger.sh production
```

---

## 5. Live Verification

Run live preflight smoke checks:
```bash
npm run smoke:production
npm run smoke:staging
```
