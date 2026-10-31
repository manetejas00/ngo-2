# Mega Health Camp Google Form

Google account: avinyacarefoundation@gmail.com.

Published form: https://docs.google.com/forms/d/e/1FAIpQLSeTJhxRvhfLdXYVn42D4ZjvZKa-eezs3awprflhlwQ76TboYg/viewform

Form editor: https://docs.google.com/forms/d/1V7U85Zg_iw9to6ZM6uciaUrvI7Oy6AByKgeezMbS-DU/edit

Automation: https://script.google.com/home/projects/1a2wxbYQQnEKokQr2_CLHwLN9ZL1WJXwePy1UTncVZKkKUb9LK_oc7JWn/edit

The form matches `/preregistration`, including optional email and medical questions and required consent. It does not collect Google account emails or limit submissions to one per signed-in user. Response summaries are private.

The form submit trigger sends responses to `https://avinyacarefoundation.org/api/google-form-sync.php`. A second trigger retries pending responses every five minutes, processing up to 25 per run. Responses stay in Google Forms during an outage; a cursor advances only after the website acknowledges saving them. Keep the response history intact: deleting old responses can invalidate the cursor. Do not rename question titles without updating the mapping in the script.

The live PHP endpoint uses the existing MySQL `form_submissions` table. Node development uses the existing file-backed submission store. Both use `preregistration` so answers appear in Admin → Mega Health Camp Pre-Registrations. Google form ID + response ID determine the unique registration reference. Replays cannot create duplicate registrations or resend automatic confirmations.

Data is saved before email dispatch. Participant email status is PENDING, SENT (accepted by the SMTP server), FAILED, or SKIPPED when no email was supplied. SENT does not guarantee inbox placement. The admin list shows source and delivery status and offers Send Mail / Retry Email. An administrator can add a recipient in the mail dialog when no email was provided; this does not change the original answer. Manual delivery updates the registration status.

Live sync configuration is kept outside the public web directory at `domains/avinyacarefoundation.org/.avinya-google-form.php`, mode 0600. It contains only the dedicated sync secret and allowed form ID. The endpoint falls back to `GOOGLE_FORM_SYNC_SECRET` and `GOOGLE_PREREGISTRATION_FORM_ID` environment variables for other installations. Script Properties hold FORM_ID, SYNC_URL, SYNC_SECRET and SYNC_CURSOR. Never put the sync secret or Google account password in source control, page HTML, or query strings. Rotate the dedicated secret on both ends together if necessary.

The script closes Google responses on its first run after 29 November 2026, midnight IST, matching the website's default online pre-registration cutoff (up to five minutes of trigger delay). Existing responses continue syncing after closure. Changes to website administrator open/closed overrides are not propagated to Google Forms; close or reopen the Google form separately if an override is used.

Source: `scripts/google-forms/mega-health-camp.gs`. The existing live script uses equivalent compact formatting. `createMegaHealthCamp` creates an unpublished draft and is safe to rerun after creation. Configure both ends, then `enableSyncAndPublish` probes the server before creating submit/retry triggers and publishing the form. Google may require the account owner to authorize Google Forms, external requests, and trigger execution.

Deployment on 31 October 2026 uses targeted changes to the current live admin HTML/API, preserving unrelated local changes. Original live files are backed up privately under `domains/avinyacarefoundation.org/.google-form-release-20261031/`. No database schema migration is required.

Verification: authenticated live validation probe returned 422, unsigned requests returned 401, a generated registration saved successfully, and replay returned duplicate=true. A secured database query verified exactly one row with SKIPPED email and the correct source; the generated test row was then removed. Both Google triggers are installed and the scheduled trigger has completed successfully. No test emails were sent. Local syntax checks and 11 focused registration/submission/sync tests passed.

Google Form answer limits are applied: name 120 characters, locality 160 characters, and health concerns 2000 characters, matching database validation.

Website registration entry points now open the published Google Form directly: desktop navigation, mobile navigation, footer registration link, and camp-page registration buttons. The custom HTML form and its submission/pass-generation code were removed from `/preregistration`; the page retains camp information and an Open Registration Form link. The live menu/page update has separate private backups in `domains/avinyacarefoundation.org/.google-form-menu-release-20261031/`.

Live QA follow-up: see `docs/camp-registration-live-qa.md`. Admin exports now use a stable 19-column schema and respect the visible filters. The PDF report includes all answers for all filtered records. Website-only camp closure controls were replaced by Manage Google Form/Open Google Form links and Refresh. Manual mail now writes to the actual email audit schema.
