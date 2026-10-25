# Live website QA report and flow checklist

Date: 26 October 2026 (IST)  
Site: https://avinyacarefoundation.org  
Final general-form test marker: `QA-20261026-FLOW-R3` (camp checks use R2)

## Release scope

- About navbar **Support us** opens the existing **Sponsor Care & Early Detection** donation enquiry form, with amount, frequency, project and contact fields. It no longer opens the receipt guide.
- Information pages load the same form template and existing submission manager. The shared template matches the existing home form exactly, with root-relative image URLs.
- Guide links still open the separate informational guide modal.
- Existing support, volunteer and partnership navigation is preserved on information pages.
- Previous fixes retained: original home scroll story; fullscreen hero; diagnostic form scrolling; shared close buttons; corrected Advisor spelling; no blank band above the diagnostic footer.

## Automated checks

- PASS: 36 project tests and syntax/preflight checks.
- PASS: 5 local read-only HTTP tests against a temporary server, including page/catalog availability and private-file protection.
- PASS: 36 production smoke checks.
- PASS: 14 public entry pages returned HTTP 200. Donation guide redirects to its modal; Connect returns 404.

## Live general-form submissions and email results

These are actual synthetic API submissions, not fabricated results. Recipient: the foundation mailbox. Names start `LIVE QA TEST`; messages explicitly say no action or follow-up is requested. No payment was collected. SMTP acceptance does not prove inbox placement or exclude spam filtering.

| Form | HTTP | Reference | User confirmation | Admin notification | Admin record copy | Database |
| --- | --- | --- | --- | --- | --- | --- |
| donation | 200 | `SUB-1792960819-9466C` | SENT | SENT | SENT | Verified |
| volunteer | 200 | `SUB-1792960826-FB01B` | SENT | SENT | SENT | Verified |
| support | 200 | `SUB-1792960832-228D7` | SENT | SENT | SENT | Verified |
| contact | 200 | `SUB-1792960839-2E480` | SENT | SENT | SENT | Verified |
| partnership | 200 | `SUB-1792960846-931FF` | SENT | SENT | SENT | Verified |
| newsletter | 200 | `SUB-1792960855-A1F7D` | SENT | SENT | SENT | Verified |
| feedback | 200 | `SUB-1792960862-A573C` | SENT | SENT | SENT | Verified |
| guide | 200 | `SUB-1792960868-DBC93` | SENT | SENT | SENT | Verified |
| coming_soon_feedback | 200 | `SUB-1792960875-0C9B2` | SENT | SENT | SENT | Verified |

- Verified 8 general-form rows in `form_submissions` and the coming-soon row in `coming_soon_feedbacks`.
- Verified 18 email audit entries marked `SENT` for the user/admin channels. Record-copy acceptance is also reported by each submission response.
- Donation test remains `PENDING` and anonymous; an enquiry is never a confirmed payment or tax receipt.
- The first test pass found SMTP authentication error **535** and failed emails. The user-supplied app password authenticated with **235**, and the live private SMTP configuration was corrected. All nine forms were then retested successfully. A later deployment exposed a mail configuration regression; the final fix loads private mail settings from outside the deploy checkout. All nine forms and the About UI form were retested after deploying that fix. Credentials are not included in this report or release.
- Initial failed-email QA rows, the failed pre-fix UI test, and successful retest rows remain in the admin records, clearly labeled. They have not been silently deleted.

## Health camp and critical failure cases

| Check | Actual result |
| --- | --- |
| Camp with email | HTTP 201; `SENT`; persisted |
| Camp without email | HTTP 201; `SKIPPED`; persisted |
| Duplicate name/mobile | HTTP 409; duplicate rejected |
| Missing camp fields / consent | HTTP 422 |
| Invalid donation email / details | HTTP 422 |
| Empty medical booking | HTTP 400; missing doctor rejected; no appointment created |
| Unauthenticated camp delete | HTTP 401 |
| Unauthenticated camp email resend | HTTP 401 |

Camp test references:
- `ACF-29882879382d08d572d724b0c6c31209` — SKIPPED
- `ACF-6ee35d2955f5592d7788686818638868` — SENT

## Expected visitor flows

1. **Donation:** Support us → existing form → choose one-time/monthly interest and amount → select project → contact details → record interest → saved reference and honest email status → admin donation/form entry. No payment or recurring debit occurs.
2. **Contact:** Contact form → required fields and message → saved entry → user acknowledgement and admin notification.
3. **Volunteer:** Volunteer application → interests/contact fields → saved entry → user/admin emails → admin volunteer list.
4. **Support:** Request support → relevant contact/request fields → saved entry → acknowledgement if email supplied → admin support queue. Do not submit real medical records during QA.
5. **CSR:** Partnership form → organization/contact details → saved entry → user/admin emails → admin CSR queue.
6. **Newsletter:** Email → saved subscription entry → confirmation/admin email. Avoid repeatedly subscribing a real visitor during testing.
7. **Feedback:** Feedback form → message/contact fields → saved entry → confirmation/admin email → admin feedback list.
8. **Guide request:** Guide form → contact details → saved request → user/admin email; confirm any promised downloadable attachment manually.
9. **Coming soon:** Subscription/feedback form → saved separate coming-soon entry → user/admin emails.
10. **Camp:** Registration → consent/validation → database save → reference → optional email → admin camp list → view/edit/filter/export/delete/resend with permissions and explicit confirmation.
11. **Diagnostics:** Test search/filter → Book Test → scroll inside modal → collection/date/patient validation → booking request → provider confirmation and report follow-up. An actual appointment was not reserved during this QA run.

## Live browser checks and remaining manual checks

- [x] Local About navbar opens the original donation form rather than the guide.
- [x] Local form template equivalence checked against the original home form.
- [x] Deployed About navbar opens the existing form; custom ₹100, project selection, anonymous option, submission and confirmation email succeeded. Reference: `SUB-1792960843-A54E5`. Reopening after a prior submission also worked.
- [ ] Open the foundation inbox and spam folder; confirm rendering, logo, subject, reference and reply-to for test messages. SMTP acceptance alone cannot verify these.
- [ ] With an authenticated admin session, inspect each QA entry in its matching list and All Form Submissions.
- [ ] Verify CSV filtering/export and edit/delete/resend on a designated QA entry only. Database persistence and unauthenticated access rejection were checked; these authenticated live UI actions were not performed.
- [ ] Verify full successful diagnostic/doctor booking and cancellation/reschedule in an agreed test slot with the provider; no real clinical appointment or WhatsApp message was created here.
- [ ] Inspect phone/tablet/desktop layouts, native validation, success/error states, close button, Escape, focus return, backdrop dismissal and form scrolling.

## Page and navigation release checklist

- Home: original seven-stage scroll story, full-screen footage, hero links, campaign popup frequency, contact form.
- About: team cards and profiles, Finance Advisor / NGO Advisor, Support us form.
- Assistance, Get Involved, Events, Transparency, Privacy and Terms: correct links, readable sections, navbar/footer, Support us entry point.
- Health Camp: countdown, venue map, optional email, consent, duplicate handling, date/time cutoff at 29 November 2026, 4 PM IST.
- Diagnostics / Doctors: catalog search/categories, detail pages, internal modal scrolling, footer boundary.
- Gallery: filters, images/videos, lightbox, navigation and close control.
- Crowdfunding: campaign filters, donation enquiry, amount selection, no payment-success claim for pending interest.
- Admin: login/access control, all form lists, email statuses, filtering/export, camp operations, logout.
- Retired URLs: `/donation-guide` and `.html` redirect to the guide modal; `/connect` remains retired.

## Deployment verification

- Application releases: `3f97fa0` (About form) and `6ce3991` (private SMTP override), deployed on Hostinger.
- Final About UI reference: `SUB-1792960843-A54E5`; database delivery status `SENT`, both user/admin flags set, payment PENDING. Browser success state explicitly confirmed email sent.
- Nine final API form tests plus one final About UI test persisted; all 20 corresponding user/admin email audit entries are `SENT`.
- Two camp records persisted with `SENT` / `SKIPPED` as appropriate.
- 36 project tests, 5 local HTTP tests and 36 production smoke checks passed.
- 14 public entry pages returned HTTP 200; `/donation-guide` returned HTTP 302 to `/#donation-guide`; `/connect` returned 404.
- The shared donation template was compared with the original home form, allowing only root-relative asset URLs.
- No real medical appointment, payment, recurring debit, destructive admin action or external WhatsApp message was created.
- Inbox/spam placement and authenticated admin UI operations remain explicitly unchecked above. SMTP acceptance is not proof of inbox delivery.
