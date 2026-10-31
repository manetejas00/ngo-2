# Mega Health Camp registration: live QA

Tested 31 October–1 November 2026 (IST) against the published Google Form and https://avinyacarefoundation.org/admin. After the owner specified live-only checks, all functional checks and fixes were verified against production; no staging registrations were made.

## Live test records

- `QA-CAMP-20261031-A No Email`: age 1, +91-prefixed mobile, required fields only, no email, no medical answers. Google trigger completed; database retained one record; email status SKIPPED.
- `QA-CAMP-20261031-B मराठी "CSV"`: age 120, plain Indian mobile, foundation email, multiple requested checkups, Marathi and quoted text, multiline synthetic concerns, optional screening/history choices. Google trigger completed; database retained one record; automatic confirmation arrived in the foundation Gmail inbox.

These two clearly labeled synthetic responses are retained in Google Forms and the database as reviewable evidence. They contain no patient medical information. They should be excluded from real attendance counts. Responses were not deleted because Google response history currently anchors the sync cursor.

## Results

| Area | Check | Result |
| --- | --- | --- |
| Google Form | Blank required fields, missing gender and missing consent | Rejected |
| Google Form | Invalid phone, age 0/121, malformed email | Rejected |
| Google Form | Names over 120, locality over 160, concerns over 2000 characters | Rejected |
| Google Form | Ages 1 and 120, +91 and plain phone formats | Accepted |
| Google Form | Optional email and medical answers left blank | Accepted |
| Sync | Actual Google submit triggers for both responses | Completed |
| Sync | Database field mapping, Unicode, arrays, multiline concerns, consent | Verified |
| Sync | Replay both existing response IDs | Duplicate acknowledged; no new registration or repeat automatic email |
| API | Authentication, wrong form ID, wrong method, invalid JSON, oversized request | Correct 401/403/405/400/413 rejection |
| API | Fifteen invalid field/value/length cases | Correct 422 rejection |
| Admin | Source and email status labels | Google Form / SENT / SKIPPED displayed correctly |
| Admin | View record | All selected answers shown; markup remains escaped text |
| Admin | Send Mail prefill | Correct selected registration, name and email |
| Admin | Invalid email in Send Mail | Browser blocked submission |
| Admin | Manual Send Mail | Delivered to foundation Gmail; SENT audit record verified |
| Admin | Search and CSV export | Two QA-filtered records exported |
| Admin | Checkup category filter | Eye selects the full-answer response; restoring All Categories returns both QA records |
| Admin | Refresh | Reloads synced records and preserves the QA search |
| CSV | Stable 19-column schema | All rows align with headings |
| CSV | Marathi, quotes, commas, multiline text, checkups, consent, delivery status | Round-trip verified in downloaded live CSV |
| Copy | Copy for Google Sheets | Live UI reported two filtered registrations copied |
| PDF | Both QA records and all answer labels | Final two-page download rendered and visually verified: readable text, Marathi text, complete answers, references wrapped within table margins |

Twenty-two direct live API checks passed: two idempotent replays, five protocol/authentication checks, and fifteen invalid-answer checks. The earlier repository suite also passed 51 tests before the owner requested remaining functional checks only on live.

## Fixes made during QA

- Replaced mixed-record Object.keys/Object.values CSV export with a stable, labeled 19-column schema using the currently filtered records.
- Added UTF-8 BOM and correct CSV quoting; protected spreadsheet cells from formula interpretation.
- Aligned clipboard export with CSV fields and flattened embedded newlines only for tab-separated clipboard output.
- Added an all-answer PDF export, replacing the generic first-six-fields / first-fifteen-records summary for this section.
- Fixed PDF text colors and long-reference wrapping for dark-themed admin sessions.
- Fixed checkup category filtering to use the selected checkups rather than the generic form category.
- Replaced retired website open/close controls with Google Form management links and Refresh; the Google form controls its own availability.
- Corrected the manual-mail audit insert to use the actual email_logs schema.
- Prevented organizer notes from being inserted once for every closing div in the email template.

Live backups are kept outside public_html under `.camp-qa-fixes-20261031/` and `.camp-qa-pdf-20261101/` in the domain directory.

## Limits

- SMTP acceptance and receipt were verified for the foundation Gmail inbox. Inbox placement at every other email provider cannot be guaranteed.
- Production SMTP was not deliberately disabled to simulate an outage. Failure persistence/retry logic is covered by the existing registration tests; live invalid-input rejection and successful manual delivery were checked.
- Printing to a physical printer was not tested. The PDF download and its rendered pages were checked.
- Git main was initially unreadable because commit objects were missing. Refetch restored main and its history. Unrelated old checkpoint/staging/stash references still report missing objects; no working files or history were reset to repair them.

Final downloaded PDF was generated at 00:10 IST on 1 November 2026 and inspected on both pages. Automatic and manual emails were observed in the foundation Gmail inbox. Only the two clearly labeled synthetic registrations were used for the live UI checks.
