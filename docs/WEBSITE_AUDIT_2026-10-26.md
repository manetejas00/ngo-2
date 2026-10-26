# Avinya Care Foundation — live website audit

Date: 26 October 2026 (Asia/Kolkata). Website: https://www.avinyacarefoundation.org.

## Scope and evidence

Reviewed source and live routes: home, About, Assistance, Health Camp, Get Involved, Diagnostic Tests, Crowdfunding, Gallery, Events, Privacy, Terms, Transparency, Coming Soon and the legacy Response route. Services and Contact are home sections. Volunteer and CSR have Get Involved entry points. Contribution enquiries use the shared modal.

The initial crawl checked 14 routes and 101 same-origin resources: no broken resource responses. Public navigation anchors resolved. Browser inspection covered the listed public pages at 1280 × 720, team profile navigation, the shared contribution modal, diagnostic search and its no-results state, required-field validation, modal scrolling and closing, labels, focus restoration and console errors. These checks do **not** establish that every combination of device, control and authenticated workflow has passed.

## Critical fixes deployed

- Replaced the staff-login implementation that overwrote passwords and created accounts during login with verification of an existing active account's password hash.
- Removed public demo-account selection, password autofill and published login credentials. Fixed password-reset action and token parsing.
- Disabled public account enumeration and HTTP account-reset/reseed actions. Disabled the public maintenance runner; deployment can still run it from the server console.
- Removed automatic account provisioning/password replacement and database migrations from ordinary database reads.
- Rejected legacy session tokens. Blocked the shared demo password. Revoked persistent tokens on logout and password changes. Private responses use `Cache-Control: no-store`.
- Removed the operations console from the public diagnostic page. Live unauthenticated admin data, booking history, export and diagnostic-record requests are rejected.
- Removed tracked environment files and hard-coded database credential fallbacks. Existing private Hostinger configuration was preserved outside the web root and restored as ignored runtime files. SMTP uses private configuration.
- Restricted analytics to named events without caller-supplied fields; page views exclude query strings and fragments. No form field values are intentionally passed to analytics.
- Disabled the public donor activity feed, which previously exposed donor names and enquiry text without recorded publication consent. Removed public live-activity and funding totals.
- Removed internal diagnostic wholesale prices and margins from public catalog responses. Protected seed JSON and runtime/configuration files from HTTP access.

## Form and interface fixes

- Fixed duplicate visitor confirmation emails: one confirmation is now dispatched per submission.
- Added SMTP recipient/header validation and checked envelope/data responses. Corrected diagnostic Reply-To and pending-request wording.
- A diagnostic request must be stored before its email is sent. Failed appointment requests no longer fabricate a locally confirmed appointment or WhatsApp delivery.
- Diagnostic success displays whether email was sent, preserves the reference, and safely renders returned text. Errors retain form entries; repeated clicks are blocked while saving.
- General forms return an error when persistence cannot be confirmed. Optional-email support requests explicitly report `SKIPPED`, rather than claiming a nonexistent email was sent.
- Added form accessibility names and privacy notices. Shared support form, team modal next/close controls, diagnostic scroll bounds and focus return were checked in the live browser.
- Fixed gallery horizontal overflow caused by rotated collage cards. The browser recheck found no horizontal overflow on Gallery.
- Corrected the office address to **210, Global Plaza, Global City, Virar West**, without guessing a PIN. Corrected hours to **9:00 AM–6:00 PM, Monday–Saturday; Sunday closed**. Kept the supplied phone, email, service area and tagline.
- Removed assumed Mumbai locality from diagnostic requests. Collection addresses must identify the actual city.
- Kept the existing home hero scroll implementation and media.

## Claims and publication controls

- Removed unsupported laboratory/accreditation, fixed report-turnaround and automatic tax-certificate claims from relevant page, email and PDF copy. A request summary is not a clinical order, appointment confirmation or tax certificate.
- Removed invented registration identifiers from generated PDFs. Existing document photographs are labelled for current-validity confirmation.
- Removed unverified campaign progress/count widgets and urgency dates. Proposals and contribution options are labelled accordingly.
- Withheld the public clinician directory and online clinician booking pending verified provider details. The diagnostic test enquiry form remains available, with provider, availability, preparation and final-charge confirmation required.
- Replaced unsupported gallery outcome/participant/partner descriptions with explicit archive-verification notices, and removed public staff/editor metadata. This is not a verification of image rights or event facts.
- Removed the static generated-news endpoint and its unsupported articles. The inspected live news feed linked to WHO sources.
- Redirected the duplicate legacy Response route to home. Added canonical/noindex metadata to Coming Soon.

## Safe live email and database tests

All audit email recipients were restricted to **info@avinyacarefoundation.org**. General-form handlers were invoked on the production server with marked dummy records and per-process recipient overrides, avoiding notifications to the normal record-copy address. No provider, patient, donor or partner was contacted.

| Flow | Result |
| --- | --- |
| Contact | Saved; visitor and admin messages sent; mailbox arrival verified |
| Volunteer | Saved; visitor and admin messages sent; mailbox arrival verified |
| CSR partnership | Saved; visitor and admin messages sent; mailbox arrival verified |
| Patient support | Saved; visitor and admin messages sent; mailbox arrival verified |
| Newsletter, feedback, guide, Coming Soon | Saved; visitor/admin messages sent; mailbox arrival verified |
| Contribution interest | Saved as **PENDING**, no payment; visitor/admin delivery verified across Inbox and Junk |
| Patient support without email | Saved; admin notification only; visitor email explicitly skipped |
| Diagnostic email | Production template and SMTP sender tested **without inserting a booking**; arrival, pending-request copy and Reply-To verified |
| Health camp with email | HTTP 201; saved; email status `SENT` |
| Health camp without email | HTTP 201; saved; email status `SKIPPED` |
| Duplicate health camp | HTTP 409; duplicate blocked |

Second batch: **19 messages in Inbox, 1 contribution notification in Junk**. All inspected To and Reply-To headers used the foundation inbox. The Junk message passed SPF, DKIM and DMARC. Its subject was subsequently simplified for retesting; inbox placement is not guaranteed by SMTP acceptance. No messages were moved or marked as not spam.

Dummy records remain clearly labelled `QA-AUDIT-20261026…`; they are not real donations, care requests or attendance arrangements. No live payment or real clinician/diagnostic booking was created. Automatic deletion was avoided.

## Verification

- Automated regression suite: **41 tests passed**.
- Read-only local HTTP suite: **5 tests passed**.
- Targeted live checks: **18 passed**, covering private data/config/seed protection, invalid form inputs, invalid staff login, public donor privacy, internal-price omission and confirmed office address.
- Live invalid input: general form 422; diagnostic request 400; camp registration 422; nonexistent staff login 401.
- Public maintenance/reset actions: 403; private data/history: 401; configuration/runtime/seed files: 403.
- A smoke run overlapped deployment and observed transient missing pages. Fixed the fallback deploy/rollback path to atomically replace each file before deleting retired files, rather than emptying the public directory. Updated the smoke expectation for the intentionally unpublished clinician directory.
- Release IDs, final smoke results and subsequent email retest are recorded below after deployment.

## Foundation confirmation and remaining work

1. **Rotate credentials previously committed to Git.** Removing files from the current branch does not erase historical copies. Provider-side rotation and any history cleanup need coordinated ownership; no claim is made that exposed credentials have all been rotated.
2. Staff using the former shared demo password must use the password-reset flow and a private password. Do not re-enable a public default-password exception.
3. Confirm clinicians, laboratories, accreditation scope, collection staff, prices, turnaround and any service subsidy before publishing guarantees or restoring clinician booking.
4. Confirm legal identity, current 12A/80G/CSR-1/Darpan status and receipt processes. The supplied Form 10AC photograph is provisional and shows a historical address; a photograph alone does not establish current tax eligibility or current registered address.
5. Confirm campaign budgets, permissions, dates, location, partners and current funding records. Confirm gallery event facts, participant consent and image publication rights. Archive notices do not replace those permissions.
6. **Phone/tablet visual sign-off remains open.** The available browser exposed a fixed desktop viewport and no viewport/emulation control. Responsive CSS was inspected, but 375/390/768-pixel physical layouts were not certified.
7. Authenticated staff CRUD, export, resend and record ownership require a secure staff-session acceptance test. No real record was edited/deleted, and no staff credential was guessed. No complete penetration-test or legal-compliance claim is made.
8. Review large scroll-media downloads and low-bandwidth/mobile performance separately. The home desktop video is approximately 5.7 MiB; the largest gallery video is approximately 15.3 MiB. The home hero was deliberately preserved.
9. Concurrent local and Hostinger edits allowing a demo password for the foundation account were detected, preserved in private backups and excluded from the release. Password-reset UI corrections were reviewed separately; the default-password block remains the intended live behavior.

## Final recorded results

- Functional release verified: `72faa18` (earlier security/UI release `7ebbf21`). Updates were committed and pushed to `main`, then pulled onto Hostinger. A later documentation commit does not change those application behaviors.
- Settled production smoke run: **36/36 PASS**. The withheld clinician directory is explicitly checked as unpublished, rather than requiring invented provider records.
- Final automated regression run: **41/41 PASS**; read-only HTTP suite: **5/5 PASS**; targeted live security/validation checks: **18/18 PASS**.
- Final contribution-email retest: **2 messages in Inbox, 0 in Junk**, with the revised subjects “Contribution Interest Received” and “Website contribution enquiry”. Camp confirmation: **1 in Inbox, 0 in Junk**. All test recipients and inspected Reply-To headers used the foundation inbox.
- Production database inspection confirmed the marked general-form records were saved. The nonexistent staff-login test created **zero accounts**. The released login source contains **no foundation-account demo-password exception**.
- Browser recheck confirmed the staff sign-in page has no demo account selector, published shared password or prefilled password. Sign-in labels and the Forgot Password entry work. No staff password was changed by this audit.
- HTTPS redirects with HTTP 301. The existing desktop hero video supports a one-byte HTTP 206 response. `nosniff`, same-origin framing and referrer-policy headers were observed. Explicit one-hour cache/revalidation settings were added for MP4/WebM, alongside existing static-asset caching.
- The deploy fallback and rollback file-copy helper passed a local fixture check: new files copied, retired files removed, `.env` and stored records preserved. Temporary replacement files are outside the public directory.

Do not interpret this report as certification that every device or authenticated staff workflow passed. The open sign-off and factual-confirmation items above remain required.
