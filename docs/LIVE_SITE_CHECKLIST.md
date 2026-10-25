# Live site verification checklist

Production: https://avinyacarefoundation.org
Prepared: 26 October 2026 (IST).

Use PASS / FAIL / NOT TESTED with a timestamp and release commit. An HTTP 200
checks availability, not visual quality or successful completion of a workflow.
Do not write passwords, authentication tokens, medical information or real
visitor records in this document or test reports.

## P0 — Critical: check before declaring a release healthy

- [ ] HTTPS works without certificate warnings or redirect loops.
- [ ] Home, About, Assistance, Health Camp, diagnostic tests and Admin load without server errors.
- [ ] Camp registration validates name, age, gender, Indian mobile, locality and explicit consent server-side.
- [ ] Optional medical questions can be left blank. No email is required.
- [ ] Valid registration saves once, returns a reference, and remains present after a reload.
- [ ] Same camp + name + mobile does not create a duplicate; show a clear duplicate warning.
- [ ] Family members with different names can share a mobile number.
- [ ] Email supplied: confirmation uses the branded template, correct reference, venue and date.
- [ ] Email omitted: registration saves and sends no email.
- [ ] Email failure: registration stays saved and shows a delivery warning instead of a failed registration.
- [ ] Check the receiving mailbox for delivery and spam placement. SMTP acceptance alone does not confirm inbox delivery.
- [ ] Registration closes **29 November 2026 at 4:00 PM IST** (10:30 UTC). API rejects submissions at and after cutoff, including an already-open form.
- [ ] Admin and manager can see Health Camp Registrations and all submitted fields.
- [ ] Anonymous visitors receive 401; other roles cannot read or export camp responses.
- [ ] CSV export includes all fields, safely escapes quotes, preserves Unicode and prevents spreadsheet formula execution.
- [ ] Production SMTP credentials stay in private server configuration. Deployment must preserve the private `.env` file.
- [ ] Private configuration, storage and database files are blocked from public access.
- [ ] Existing registration records survive deployment; no resets or truncation occur.

## P1 — Page and interface checks

Check desktop (1440 × 900), laptop (1280 × 720), tablet (768 × 1024), and phone
(390 × 844 and 360 × 740). Also use keyboard-only navigation and 200% zoom.

- [ ] Shared navbar/footer appear exactly once on every public page; Admin uses its dashboard layout.
- [ ] No overlapping navbar links; mobile menu opens, closes and restores focus.
- [ ] Health Camp link works in navbar, home hero, announcement and footer.
- [ ] Footer phone, email, WhatsApp, legal and social links work. Floating quick actions do not cover footer controls.
- [ ] About and Assistance heroes fill their opening screen without unintended white strips.
- [ ] Camp first screen ends at the countdown on supported desktop sizes; all content remains accessible on small screens.
- [ ] Countdown displays days/hours/minutes/seconds and resumes correctly after returning to the tab.
- [ ] Venue is Ameya Classic Club, Yashwant Nagar, West, Vasai-Virar, Maharashtra 401303.
- [ ] Map loads or directions link remains usable if third-party content is blocked.
- [ ] Form loading prevents double submission; errors preserve input and point to invalid fields.
- [ ] Success, duplicate, validation, network and email-warning states remain readable.
- [ ] About shows all six portraits matched to the supplied list and correct names/roles.
- [ ] Every team card opens the right modal; next/previous and arrow keys work.
- [ ] Modal traps focus; Escape/outside click/Close work and focus returns to the selected card.
- [ ] Team modal works at phone size and can scroll without clipping controls.
- [ ] Diagnostic background shows only the first unbranded scene, with no overlapping faces or logo overlays.
- [ ] Diagnostic filters, test details and booking enquiry controls still work.
- [ ] Home popup appears once per campaign/browser after a delay; respects dismissals and stops after cutoff.
- [ ] Images have useful alt text, forms have labels, focus is visible, and motion respects reduced-motion settings.

## P1 — Existing service regressions

- [ ] Doctors and diagnostic catalog APIs return expected data.
- [ ] Diagnostic booking validation, slot selection, collection/address requirements and confirmations work.
- [ ] Crowdfunding campaigns load; contribution enquiry never claims an unverified payment succeeded.
- [ ] Gallery, community events, health news and document links load correctly.
- [ ] Contact/support/volunteer forms keep their existing validation and confirmation behaviour.
- [ ] Admin login, logout, permissions and existing records remain functional.

## P2 — Release quality

- [ ] No missing CSS, JavaScript, portraits, logos or map resources.
- [ ] No browser console errors in primary workflows.
- [ ] Sitemap, robots.txt, canonical URLs and page titles remain valid.
- [ ] No horizontal overflow or unreadable text on white/dark sections.
- [ ] Hero and team images load at reasonable sizes; no unnecessary image sequence downloads.
- [ ] No test records mixed with genuine registrations unless clearly labelled; remove only explicitly created disposable test records.

## Repeatable checks

```sh
npm test
npm run smoke:production
```

Smoke checks are read-only. For live form delivery, use a clearly labelled test
registration and a foundation-controlled email address. Never submit another
person's medical data to test a form. Record the test reference privately if needed.

## Release verification log

Record the release, checks actually run, failures and untested items here. Do not
mark the entire checklist complete based solely on the automated smoke suite.
