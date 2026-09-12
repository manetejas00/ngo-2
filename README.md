# Avinya Care Foundation

Avinya Care Foundation is a healthcare-awareness and community-support website
with doctor discovery, diagnostic booking, donation, contact, and protected
operations features.

## Website pages

- `index.html` — main foundation website
- `doctors.html` — doctor directory and appointment experience
- `crowdfunding.html` — fundraising and donation information
- `admin.html` — protected operations dashboard

## Technology

- Static HTML, CSS, and browser JavaScript
- Node.js development runtime (`server.mjs`)
- PHP API endpoints for Hostinger shared hosting
- MySQL for production data
- SMTP email delivery, optional AI/news integrations, and WhatsApp support

The Node and PHP API adapters intentionally support the same website so the
project can run locally and on shared hosting.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create local environment settings from `.env.example`. Keep the resulting
   `.env` file private and never commit it.

3. Start the website:

   ```bash
   npm run dev
   ```

4. Open the local URL shown in the terminal.

## Authentication and user management

There is no public registration. Accounts are created only by an authorized
administrator in the admin dashboard.

For a new deployment, set these server-only environment values once:

```text
BOOTSTRAP_ADMIN_EMAIL=admin@example.org
BOOTSTRAP_ADMIN_PASSWORD=a-strong-unique-password
```

Use a unique password that meets the application password policy. After the
first administrator is provisioned, remove these bootstrap values. New users
must then be created through the protected admin workflow.

The application includes:

- role-based backend authorization for administrators, managers, doctors, and
  diagnostic providers;
- scoped booking data for clinical and diagnostic roles;
- hashed passwords and password-reset tokens;
- temporary-password enforcement for administrator-created accounts;
- login throttling, short-lived sessions, logout invalidation, and account
  status checks; and
- server-side protection for private API actions.

## Environment configuration

Use [`.env.example`](.env.example) as the configuration template. Configure
database, SMTP, AI, news, and WhatsApp values only in your host environment.

Never store passwords, access tokens, private keys, database credentials, or
production account details in source files, test fixtures, browser storage, or
documentation.

## Validation

Run the project checks before deploying:

```bash
npm test
```

This validates required project files, JavaScript syntax, and PHP syntax when
PHP is available.

## Deployment

The website supports Hostinger shared hosting. See
[`HOSTINGER_DEPLOYMENT.md`](HOSTINGER_DEPLOYMENT.md) for deployment guidance.
Before production deployment, configure HTTPS, SMTP, database access, and
environment secrets on the host.

## Project structure

```text
api/             PHP API endpoints and database helpers
assets/          Images, video, logos, and other media
css/             Website styling
js/              Browser-side functionality
services/        Node email, AI, and healthcare services
scripts/         Validation, deployment, and maintenance scripts
server.mjs       Local Node.js server
```
