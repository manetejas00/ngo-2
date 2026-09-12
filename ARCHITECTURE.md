# Architecture guide

Avinya Care is a progressively enhanced static website with two compatible backend entry points:

- `index.html`, `crowdfunding.html`, `doctors.html`, and `admin.html` are the public/admin page shells.
- `js/components/` owns page-focused presentation behavior; `js/services/` owns browser integrations such as PDFs and news.
- `api/` contains PHP endpoints used on shared hosting. `api/db.php` centralizes its database connection.
- `server.mjs` is the Node runtime used for local development and Node-compatible deployments. It delegates email and healthcare persistence to `services/`.
- `services/email/`, `services/ai/`, and `services/healthcare/` are backend domain boundaries. New backend business rules belong there rather than in `server.mjs` route handling.

## Request flow

Browser code should keep a simple flow: UI event → validation → API/service call → render success or a user-safe error. PHP and Node endpoints must preserve the existing response shapes because both deployment modes are in use.

Donation totals are server-derived. `js/donations-ui.js` is the sole browser-side owner of donation statistics refreshes and broadcasts `avinya:donation_stats_updated` after a successful refresh. A successful donation should emit `avinya:donation_success`; it must not calculate totals in the browser or reload the page.

## Change boundaries

- Keep page-specific DOM work out of reusable services.
- Put reusable formatting, validation, request, and persistence logic in the appropriate service or utility rather than duplicating it in page scripts.
- Treat `server.mjs` and the PHP endpoints as public API adapters: validate input, authorize, call a domain service, and return a safe response.
- Never add secrets, credentials, tokens, or production contact data to source files or logs. Use environment variables for runtime configuration.

## Verification

Run `npm test` (or `npm run build`) before committing. The preflight check verifies required deployment files and JavaScript syntax, including browser and service files that have not yet been added to Git. It also runs PHP syntax checks whenever PHP is installed locally.
