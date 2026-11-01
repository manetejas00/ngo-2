# Volunteer Google Form live sync

Verified 1 November 2026 on avinyacarefoundation.org.

Public form: https://docs.google.com/forms/d/e/1FAIpQLSeiRxf0Cv3OktSKILJScVgsNHpTVAEj0M-9rOD-7vMeECXZUA/viewform

Editor: https://docs.google.com/forms/d/1UVgzhzhWTUvwals3B997bIdFKocLsxWUiveiP93APjU/edit

Bound Apps Script: https://script.google.com/u/0/home/projects/1KZiu16zkHsrcgPyt6wIP5HTHzWNYds8Br9yO7Wny0oUcXtXzWgHsLCjd/edit

Source: `scripts/google-volunteer-sync.gs`. Endpoint: `/api/google-volunteer-sync.php` on the live PHP host.

## Configuration and behavior

The foundation account has two installed triggers: `onVolunteerSubmit` runs on form submission, and `syncRecentVolunteers` retries the last seven days every hour. `installVolunteerSync` installs missing handlers and backfills all responses. `SYNC_SECRET` is stored in private Google Script Properties and matches the server's `GOOGLE_FORMS_SYNC_SECRET`; never commit either value.

Requests explicitly use UTF-8 signatures and ASCII-escaped JSON so non-ASCII question titles and responses are signed consistently across Google and PHP. Authentication errors report safe categories; validation failures report field names without answers.

The user approved preserving responses with invalid phone numbers as unverified records. Nonempty phone values up to 40 bytes are retained, with `validation_warnings: ["phone"]` and `PRIVATE_UNREVIEWED` when the Indian mobile-number check fails. Admin displays **Phone needs review**. Name, age 18–120, declaration, signature, timestamp and payment-reference validation remain enforced. Optional health answers are stored only when their explicit sharing permission is present.

The current Google form does not collect email, so these records have delivery status **SKIPPED**, `user_email_sent = 0`, and an unavailable Send Mail action labeled **No email provided**. Importing does not send email or verify payment; payment stays PENDING.

## Live verification

- Found zero triggers, a missing Script Property, and zero Google volunteer database records initially.
- User entered and saved the existing sync key; both triggers are now active.
- Fixed signing failures for non-ASCII payloads.
- Imported the two existing responses successfully: Google execution reported **2 succeeded, 0 failed**.
- Confirmed exactly two `VOL-GF-` records and two receipt keys in MySQL; volunteer total increased from 17 to 19.
- Both submitted test phone values are preserved with review warnings; both email statuses are SKIPPED.
- Verified both imported rows, the warnings and the 19-count badge in the live admin UI.
- Replayed both actual responses against the endpoint: duplicate acknowledged, row/receipt counts stayed at two.
- Ran `syncRecentVolunteers`: **2 succeeded, 0 failed**, execution completed.
- Seven live no-write validation checks passed: unsigned request, expired timestamp, wrong signature, wrong form ID, missing consent, age below 18, invalid payment reference.
- Live PHP syntax and Apps Script JavaScript syntax passed. No additional test registrations or outbound emails were created.
