# Live website QA report and flow checklist

Date: 26 October 2026 (IST)  
Site: https://avinyacarefoundation.org  
Test marker: `QA-20261026-FLOW-R2`

## Release scope

- About navbar **Support us** opens the existing **Sponsor Care & Early Detection** donation enquiry form, with amount, frequency, project and contact fields. It no longer opens the receipt guide.
- Information pages load the same form template and existing submission manager. The shared template matches the existing home form exactly, with root-relative image URLs.
- Guide links still open the separate informational guide modal.
- Existing support, volunteer and partnership navigation is preserved on information pages.
- Previous fixes retained: original home scroll story; fullscreen hero; diagnostic form scrolling; shared close buttons; corrected Advisor spelling; no blank band above the diagnostic footer.

## Automated checks

- PASS: 36 project tests and syntax/preflight checks.
- PASS: 5 local read-only HTTP tests against a temporary server, including page/catalog availability and private-file protection.
- Production page/asset checks are recorded below after deployment.

## Live general-form submissions and email results

These are actual synthetic API submissions, not fabricated results. Recipient: the foundation mailbox. Names start `LIVE QA TEST`; messages explicitly say no action or follow-up is requested. No payment was collected. SMTP acceptance does not prove inbox placement or exclude spam filtering.

| Form | HTTP | Reference | User confirmation | Admin notification | Admin record copy | Database |
| --- | --- | --- | --- | --- | --- | --- |
| donation | 200 | `SUB-1792960048-8E541` | SENT | SENT | SENT | Verified |
| volunteer | 200 | `SUB-1792960055-BE19C` | SENT | SENT | SENT | Verified |
| support | 200 | `SUB-1792960062-3A340` | SENT | SENT | SENT | Verified |
| contact | 200 | `SUB-1792960069-B9D20` | SENT | SENT | SENT | Verified |
| partnership | 200 | `SUB-1792960076-802B4` | SENT | SENT | SENT | Verified |
| newsletter | 200 | `SUB-1792960083-54E73` | SENT | SENT | SENT | Verified |
| feedback | 200 | `SUB-1792960089-BCB76` | SENT | SENT | SENT | Verified |
| guide | 200 | `SUB-1792960096-5CB11` | SENT | SENT | SENT | Verified |
| coming_soon_feedback | 200 | `SUB-1792960103-06AAF` | SENT | SENT | SENT | Verified |

- Verified 8 general-form rows in `form_submissions` and the coming-soon row in `coming_soon_feedbacks`.
- Verified 18 email audit entries marked `SENT` for the user/admin channels. Record-copy acceptance is also reported by each submission response.
- Donation test remains `PENDING` and anonymous; an enquiry is never a confirmed payment or tax receipt.
- The first test pass found SMTP authentication error **535** and failed emails. The user-supplied app password authenticated with **235**, and the live private SMTP configuration was corrected. All nine forms were then retested successfully. Credentials are not included in this report or release.
- Initial failed-email QA rows and successful retest rows remain in the admin records, clearly labeled. They have not been silently deleted.

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
- [ ] Verify the deployed About navbar form and submit a synthetic entry through its UI.
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

Pending final release verification. Replace this line with measured results before closing the task.
