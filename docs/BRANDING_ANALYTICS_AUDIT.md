# AvinyaCareFoundation audit and implementation report

Date: 7 October 2026
Status: Implementation tested locally; production upload blocked pending explicit authorization. This is not an end-to-end completion report.

## Branding and SEO

Public pages, shared navigation/footer, admin labels, email templates, generated PDF text, seed data, descriptions, metadata, JSON-LD, accessibility text, manifest, and documentation now use AvinyaCareFoundation. Existing domains, email addresses, routes, table names, keys, and storage paths are retained. Gallery was added to the Node-generated sitemap; Gallery Twitter and CollectionPage metadata were added. Script/CSS versions were advanced to avoid stale one-year browser caches.

Existing Gallery record display fields are normalized when fetched, without changing slugs or image paths. Historical email logs and ignored runtime caches still contain the previous name; these are preserved as historical records. Embedded text in raster logos, certificates, letterhead images, and archived PDFs has not been edited and needs visual asset review. Production database records have not been migrated.

## Analytics configuration

Existing account: 268892241. Existing property: 377147710 (Chandresh Pandey). Existing foundation stream: 5237630569, https://www.avinyacarefoundation.org/. Measurement ID: G-DJN4CS1KK7. The other property 379334186 points to rhymee.in and is not used. No duplicate account, property, or stream was created.

The existing foundation stream display name was changed to AvinyaCareFoundation. Enhanced Measurement was disabled to prevent automatic outbound-link, form, and content capture. The existing property and account display names were left unchanged because they also contain an unrelated website stream.

GOOGLE_ANALYTICS_ID=G-DJN4CS1KK7 is configured in the local production environment file. The production server environment remains unchanged until deployment. Staging has no production ID configured.

Installation: js/analytics.js on index, Gallery, crowdfunding, doctors, and Coming Soon pages. api/public-config.php and the Node /api/public-config handler expose only a validated public Measurement ID. Apache rewrite is included. Admin has no Analytics script.

Analytics loads only after consent. Preferences can be revisited through the shared footer. Query strings, fragments, referrers, and dynamic page titles are excluded from explicit page views. Advertising storage, ad personalization, and Google signals are disabled. Only allow-listed event names are accepted, with no custom parameters. The loader configures send_page_view=false and emits one explicit page_view.

Events wired: donation_started, donation_completed, contact_form_submitted, whatsapp_clicked, phone_clicked, email_clicked, gallery_viewed, news_article_viewed. Contact is emitted only after a successful API result. Donation completion is emitted only for paymentStatus SUCCESS. The currently disabled donation entry point opens Coming Soon; donation events cannot be end-to-end verified until a real payment flow is enabled. No payment was performed.

Privacy disclosure was added to existing policy modals. This implementation does not establish legal compliance by itself.

## Verification evidence

- Preflight passes: JavaScript and PHP syntax checks, required files, and deployment text checks.
- git diff --check passes.
- Local public configuration returns only G-DJN4CS1KK7.
- Homepage, Gallery, admin and crowdfunding return HTTP 200 locally.
- Homepage newsroom renders seven entries after fixing a pre-existing missing image-pool constant and invalid index fallback.
- Gallery renders ten existing records and corrected image alt text.
- Mobile Gallery has no horizontal overflow at the tested 390 by 844 viewport; brand remains visible.
- One gtag.js script was found in the homepage DOM after consent.
- Existing donation buttons still open Coming Soon.
- GA4 Realtime visibly received page_view, gallery_viewed, user_engagement and one active user from consented local preview visits.
- GA4 screenshot: /tmp/avinya-ga4-realtime.jpg.
- Full form submission, authenticated admin CRUD, payment completion, production database behavior, production HTTP/network inspection, and complete animation regression testing remain unverified. No production test email or record was created.

## Google Business Profile

The authenticated account has one profile: Avinya Care Foundation, 210, Second Floor, Global Plaza, Global City, Virar West, Maharashtra 401303. Status: Verification required; 0% verified. No profile name, address, contact, category, opening hours, logo or social-link changes were made. Per the user's instruction, stop at verification. Manual action: open the existing profile's Get verified option and complete Google's offered owner-verification process. Do not create a duplicate profile. Its address differs from the project's PDF contact address, so owner confirmation is required before any address edit. Google naming rules require the real-world name to match signage/stationery; the code rebrand alone is insufficient evidence.

## Search Console

The authenticated account opens the welcome page with Add a website and no accessible property. No property was created. Existing property ownership, sitemap submission, indexing, and coverage cannot be verified from this session. Manual action: use the account that owns the existing property, or confirm there is no existing property before undertaking DNS/URL-prefix verification.

## Deployment blocker

Existing Hostinger SSH access and PHP 8.3 availability were confirmed through read-only checks. Prepared release: /tmp/avinya-branding-20261007.tar.gz. Manifest: /tmp/avinya-release-files.txt. Backup/apply procedure: /tmp/avinya-apply-release.sh. Payload excludes environment files, credentials, database/storage records, tests and documentation. The apply procedure backs up existing changed files and the remote environment before setting only the public GA4 ID and SMTP display name.

Automatic approval review rejected the upload because it sends private project code to an external Hostinger destination without explicit approval of that payload and destination. No upload or live-file changes occurred. Required approval: upload this prepared release to Hostinger u382139760@82.112.239.95 and apply it to domains/avinyacarefoundation.org/public_html with backups, then continue live verification.

## Before and after

Before: inconsistent branding, no website Analytics integration, existing foundation GA4 stream receiving no traffic, newsroom image fallback errors. After locally: standardized display branding, consent-gated Analytics with a verified existing ID, safe event hooks, corrected newsroom fallback, Gallery/mobile checks and Realtime reception confirmed. Live deployment and Google owner/property verification remain outstanding.

## Files modified or added

- .env.example
- .env.production
- .env.staging
- .htaccess
- ARCHITECTURE.md
- ENVIRONMENT_SETUP.md
- HOSTINGER_DEPLOYMENT.md
- README.md
- WEBSITE_SUMMARY.md
- admin.html
- api/activity-logger.php
- api/admin-auth.php
- api/admin-cache.php
- api/admin-data.php
- api/booking/EmailService.php
- api/cache-manager.php
- api/db.php
- api/diagnostic-booking.php
- api/donations.php
- api/gallery.php
- api/healthcare/doctors.json
- api/migrate.php
- api/news.php
- api/news/generate
- api/password-reset-email.php
- api/rate_limiter.php
- api/security-health.php
- api/submit-form.php
- coming-soon.html
- components/footer.html
- components/navbar.html
- crowdfunding.html
- css/admin.css
- css/crowdfunding.css
- css/gallery.css
- css/healthcare.css
- css/preloader.css
- css/radial-menu.css
- css/styles.css
- data/aiNewsTopics.json
- data/seed_galleries.json
- doctors.html
- favicon.svg
- gallery.html
- index.html
- js/app.js
- js/canvas-hero.js
- js/components/champion-cta.js
- js/components/layout-injector.js
- js/components/navbar-gsap.js
- js/components/nestjs-cards.js
- js/components/news-ui.js
- js/components/preloader.js
- js/components/radial-menu.js
- js/components/scroll-typography.js
- js/components/stacked-panels.js
- js/counters.js
- js/doctors-canvas.js
- js/gallery-app.js
- js/healthcare/healthcare-app.js
- js/modals.js
- js/services/newsService.js
- js/services/pdf-service.js
- js/timeline.js
- llms.txt
- package.json
- response.html
- scripts/live-smoke.mjs
- server.mjs
- services/ai/aiProvider.mjs
- services/ai/emailGenerator.mjs
- services/ai/fallbackGenerator.mjs
- services/email/emailService.mjs
- services/email/emailTemplate.mjs
- services/email/mailhogServer.mjs
- services/email/smtpClient.mjs
- services/healthcare/healthcareAuthService.mjs
- services/healthcare/healthcareDb.mjs
- services/healthcare/healthcareEmailService.mjs
- services/healthcare/healthcareEmailTemplates.mjs
- site.webmanifest
- test/test-forms.mjs
- test/test_admin_panel.py
- test/test_browser_live_flow.mjs
- test/test_doctor_test_crud.py
- test/test_live_all_emails.py
- test/test_live_all_forms.mjs
- test/test_pdf_integration.mjs
- test/test_preloader.mjs
- test/test_security_audit.mjs
- test/test_security_audit.py
- api/public-config.php
- js/analytics.js

