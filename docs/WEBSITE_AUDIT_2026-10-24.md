# Website audit implementation — 24 October 2026

Source: Avinya_Care_Website_Audit_2026-10-24.xlsx, 164 Action Tracker rows. The workbook was read, not modified. Recommendations were treated as findings to assess, not authority to invent foundation records or make external changes.

Changes are local and not deployed. “Implemented locally” describes a code change, not legal, clinical or operational certification. Partial/mitigated findings remain open against the workbook’s acceptance criteria. No real booking, donation, email or payment was submitted during verification.

## Validation

- `npm test`: 28 tests passed; JavaScript and tracked PHP syntax checks passed. New PHP files were also checked explicitly.
- `npm run test:http`: 5 suites passed, including all 52 audited seed diagnostic routes plus 8 retained local legacy entries, seven new information pages and internal-file blocking.
- Browser checks: PSA detail renders readable core content; its link selects PSA in booking; neutral gender prompt and privacy notice are present; keyboard focus stays in the booking dialog; navigation no longer covers the close button.
- Full mobile/device, screen-reader, performance, production PHP/database, payment, email and operational verification remain open.
- Added regression tests for diagnostic input boundaries and escaped crawlable content, plus opt-in local HTTP coverage for all diagnostic detail pages and internal-file blocking.
- PHP syntax is checked locally; actual LiteSpeed rewrite/production database behavior needs a staging check.

## Evidence needed from the foundation

Confirm the monitored .org inbox, office/holiday hours, registered identity, address/PIN and whether the address is a clinic; provide the approved logo master and leadership details. Supply registration/tax documents, audited reports, reconciled outcome/fund-use records, current partner/lab/doctor permissions and credentials, clinical review of all 52 packages, project approvals and budgets, campaign deadlines, confirmed November camp details, image/story consent records and refund/retention/response policies. Hosted payment, recurring mandates, provider capacity and report delivery need separate authorized integrations/tests.

Known seeded project and diagnostic copy overrides apply at public read time so existing database records cannot reintroduce flagged claims. The overrides do not alter financial records. After evidence and clinical approval, revise or remove the corresponding entries in data/campaign-copy-overrides.json and data/diagnostic-copy-overrides.json as well as the source records. No production database was modified.

Clinical background checked: [NCI tumor markers](https://www.cancer.gov/about-cancer/diagnosis-staging/diagnosis/tumor-markers-fact-sheet), [NCI PSA](https://www.cancer.gov/types/prostate/psa-fact-sheet), [NIH vitamin D](https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/). These references do not replace local clinical approval.

## Item-by-item disposition

| Audit ID | Finding | Local disposition | Evidence or remaining work |
| --- | --- | --- | --- |
| ACF-001 | Correct official email | Implemented locally | Public .org email defaults and links updated; inbox delivery not tested. |
| ACF-002 | Standardize office hours | Open | Approve one schedule including holidays and align all channels. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-003 | Standardize phone display | Implemented locally | Phone display standardized; tel and WhatsApp links retain +917447441116. |
| ACF-004 | Confirm address and PIN | Open | Verify postal details and whether clinical services operate there. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-005 | Use consistent foundation name | Open | Approve public brand spelling and show the exact registered name in legal and payment contexts. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-006 | Preserve official logo | Open | Compare all variants with the authorized master and replace unauthorized versions. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-007 | Create a shared contact configuration | Partial | Existing managed site-settings endpoint updates annotated public contact links. Email templates retain corrected static defaults. |
| ACF-008 | Reconcile surgery and aid metrics | Mitigated; evidence needed | Removed 1,240+ surgery figure. Donation statistics are recorded contributions, not disbursed aid. Reconciled records still needed. |
| ACF-009 | Separate actuals from targets | Open | Label completed results and planned targets distinctly. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-010 | Verify all patient testimonials | Mitigated; evidence needed | Removed named homepage stories and images pending case records and publication permissions. |
| ACF-011 | Verify doctor and team identities | Mitigated; evidence needed | Named homepage endorsements removed with stories. Clinician directory credentials still require verification. |
| ACF-012 | Publish reporting periods | Open | Use dated annual and cumulative totals with methodology. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-013 | Define beneficiary counting | Open | Explain unique people versus visits, tests and interactions; avoid double counting. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-014 | Publish evidence of fund use | Open | Provide redacted disbursement summaries and annual utilization reports. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-015 | Add dated outcome reports | Open | Publish short verified reports covering the service, period, reach and follow-up. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-016 | Replace generic trust quotations | Implemented locally | Removed quotation styling from generic community service descriptions. |
| ACF-017 | Moderate absolute assurances | Partial | Removed major absolute crowdfunding assurances; broader content review remains. |
| ACF-018 | Build a proper About page | Partial | Added About destination and navigation with known service context. Leadership and legal records are not invented. |
| ACF-019 | Show leadership and governance | Open | Publish approved trustee/director names, roles and relevant biographies. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-020 | Publish registration details | Open | Show exact legal name, registration number, issuing authority and relevant dates. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-021 | Create a document centre | Partial | Added transparency/document request page. Actual certificates and financial reports must be supplied and vetted. |
| ACF-022 | Check legal entity description | Open | Confirm the exact legal form against registration documents. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-023 | Explain assistance decisions | Partial | Added assistance process and questions to confirm; formal eligibility/decision policy requires approval. |
| ACF-024 | Add grievance contacts | Partial | Added patient, donor and privacy concern routes using existing contacts; operational references and escalation SLA require approval. |
| ACF-025 | Publish governance policies | Open | Add approved conflict-of-interest, safeguarding and anti-fraud summaries where appropriate. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-026 | Correct biomarker screening claims | Mitigated; clinical review needed | Replaced cancer panel screening promises with clinician-directed use/limitations in seeds and existing database read overrides. |
| ACF-027 | Review PSA description | Mitigated; clinical review needed | PSA description now explains limitations and discussion with a clinician. |
| ACF-028 | Review CA-125 and CA19-9 descriptions | Mitigated; clinical review needed | CA-125 and CA19-9 copy no longer presents reliable universal screening. |
| ACF-029 | Remove universal survival statistic | Implemented locally | Removed blanket 90% survival comparison. |
| ACF-030 | Review universal treatment savings | Implemented locally | Removed blanket ₹5–10L savings claim. |
| ACF-031 | Correct ECG outcome story | Mitigated; evidence needed | Removed the unverified ECG story rather than inventing a diagnostic sequence. |
| ACF-032 | Explain false results | Partial | Added false-result and interpretation limitations to booking and crawlable test details; clinical review of full catalog remains. |
| ACF-033 | Separate screening from diagnosis | Partial | Explained screening, evaluation and monitoring in homepage/terms. Changed tumor-marker category and matching filters. |
| ACF-034 | Add clinical editorial review | Partial | Added medical background source and copy update date, explicitly without claiming clinical sign-off. |
| ACF-035 | Review every package description | Partial | Corrected flagged biomarker, preoperative, vitamin D, ferritin and older-adult claims. Full 52-package clinical/price/preparation approval remains. |
| ACF-036 | Confirm oncologist review availability | Open | Specify who reviews which tests, timing, fee and exclusions. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-037 | Replace protective package names | Partial | Neutralized Shield names via catalog overrides; clinician review of all package branding remains. |
| ACF-038 | Add locally appropriate guidance | Open | Have clinicians publish locally applicable age/risk guidance with sources. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-039 | Move emergency limitations closer to help | Partial | Added emergency limitations to assistance page and financial-aid CTA. Staffed hours remain unconfirmed. |
| ACF-040 | Clarify hospital project status | Mitigated; evidence needed | Seed project copy and matching database reads describe proposals pending status evidence. |
| ACF-041 | Explain hospital budget phase | Mitigated; evidence needed | Planning amounts labeled unverified; approved phase budgets must be supplied. |
| ACF-042 | Verify children hospital identity | Mitigated; evidence needed | Removed assertion of an operating owned children’s hospital; actual ownership/partners unresolved. |
| ACF-043 | Substantiate dialysis plan | Mitigated; evidence needed | Removed unverified ten-machine delivery description; costed operating plan unresolved. |
| ACF-044 | Use real deadlines | Implemented locally | Removed rolling 30/15/5-day urgency in seeded project copy and known database records. |
| ACF-045 | Support ambulance capacity claim | Mitigated; evidence needed | Removed 10,000 residents/month ambulance capacity claim. |
| ACF-046 | Verify camp description | Mitigated; evidence needed | Removed three-day/20-doctor camp claims and fixed countdown; confirmed event plan required. |
| ACF-047 | Give projects their own pages | Open | Add project scope, status, budget, timeline, owner and documents. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-048 | Publish project milestones | Open | List approval, procurement, construction and service milestones as applicable. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-049 | Explain project changes | Partial | Added pre-donation questions about delays/cancellation/excess funds. Approved policy required. |
| ACF-050 | Show real progress evidence | Partial | Known campaign images labeled illustrative; real dated progress evidence required. |
| ACF-051 | Separate patients and infrastructure | Partial | Distinguished patient assistance from infrastructure in donor guide/transparency/crowdfunding. |
| ACF-052 | Clarify case verification limits | Partial | Removed unsupported four-hour verification promise; response policy needs owner approval. |
| ACF-053 | Provide patient campaign updates | Open | Use consented redacted updates, funds used and closure status. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-054 | Align direct hospital payment promise | Mitigated; evidence needed | Removed universal direct-hospital settlement promise; approved purpose-specific settlement arrangements needed. |
| ACF-055 | Explain zero fee economics | Mitigated; evidence needed | Removed zero-fee grant-funding assurances; actual economics need finance confirmation. |
| ACF-056 | Reconcile receipt timing | Partial | Separated interest acknowledgement, payment verification and tax documents; removed browser-generated official receipt action. Statutory process needs finance review. |
| ACF-057 | Review tax calculator | Mitigated; finance review needed | Removed automatic tax saving calculator and eligibility guarantees; contribution amount selector retained. |
| ACF-058 | Verify international donations | Mitigated; evidence needed | Removed international payment support promise; international contribution route explicitly not enabled on website. |
| ACF-059 | Validate gateway checkout | Open | Test hosted payment initiation, return and server verification in sandbox. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-060 | Reconcile live activity | Partial | Existing paid versus pledged separation retained; donor display labels are pledges. Historical test-record reconciliation still needed. |
| ACF-061 | Publish refund policy | Partial | Donor guide provides refund enquiry route; no invented eligibility or processing SLA. |
| ACF-062 | Confirm monthly mandate support | Partial | Monthly interest explicitly does not create an auto-debit. Recurring mandate integration remains unimplemented. |
| ACF-063 | Clarify anonymous giving | Partial | Explained public anonymity versus retained records in donor guide. |
| ACF-064 | Validate custom amounts | Implemented locally | Invalid custom amounts now block submission rather than reuse a previous amount; selector blocks invalid amounts. |
| ACF-065 | Preserve campaign selection | Open | Verify every project button prefills the correct cause and amount. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-066 | Explain donation status | Partial | Donation interest/payment status and next-step guidance added; hosted gateway still absent. |
| ACF-067 | Substantiate impact calculator | Mitigated; evidence needed | Removed amount-to-treatment/beneficiary guarantees; real unit costs required to reintroduce estimates. |
| ACF-068 | Show donor support details | Implemented locally | Added donor guide with payment, receipt correction and enquiry routes. |
| ACF-069 | Check PAN handling | Mitigated; evidence needed | Removed PAN fields from public donation forms pending approved necessity and secure collection process. |
| ACF-070 | Publish assistance eligibility | Partial | Assistance destination lists eligibility questions; approved geography/need/exclusion rules still needed. |
| ACF-071 | Label free versus paid services | Partial | Assistance page requires confirmation of free/subsidized/paid status; service-by-service pricing policy unresolved. |
| ACF-072 | Explain the application process | Partial | Added assistance request/review/follow-up explanation without inventing an approval process. |
| ACF-073 | Give realistic response targets | Mitigated; evidence needed | Removed unsupported response promises; staffing and realistic targets require approval. |
| ACF-074 | Create service-specific destinations | Partial | Added stable assistance and donor guidance destinations; other service-specific flows remain. |
| ACF-075 | Add low-bandwidth contact options | Implemented locally | Plain information pages provide call, email and WhatsApp links without requiring JavaScript. |
| ACF-076 | Avoid compulsory email for basic help | Implemented locally | Support form accepts no email on client and both backends; phone remains required. Plain call fallback provided. |
| ACF-077 | Add Hindi and Marathi essentials | Open | Translate key help, eligibility, directions and consent content professionally. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-078 | Explain follow-up and escalation | Partial | Reference and follow-up guidance added; operational escalation workflow needs owner definition. |
| ACF-079 | Clarify clinical responsibility | Partial | Assistance/terms explain clinician/lab responsibility; assigned provider and follow-up specifics require approval. |
| ACF-080 | Check detail-page access | Implemented locally; hosting check needed | Added narrow PHP public detail rewrite before internal /test block. Node renders standalone crawlable escaped content, resolves all canonical seed IDs and retains existing legacy IDs. Actual Hostinger routing remains to verify after deployment. |
| ACF-081 | Align required fields and labels | Partial | Diagnostic date/slot/age/gender/phone and home-address/PIN validation aligned across backends; all-form validation audit remains. |
| ACF-082 | Avoid preselected patient gender | Implemented locally | Neutral required gender prompt in consultation and test forms; rejected blank gender for diagnostic requests. |
| ACF-083 | Add booking privacy notice | Partial | Added booking data-use notice and stable privacy link. Full processor/consent review still needed. |
| ACF-084 | Review compulsory booking email | Open | Allow an appropriate alternative if operations support it. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-085 | Show complete package parameters | Partial | Detail pages expose existing panel lists; completeness and analyte/calculated distinction require laboratory review. |
| ACF-086 | Show preparation instructions | Partial | Existing preparation shown with instruction to confirm with laboratory/clinician; actual instructions still require validation. |
| ACF-087 | Validate laboratory accreditations | Open | Publish lab names, accreditation details and applicable test scope. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-088 | Name collection centres | Open | Show actual centre address, hours, accessibility and directions. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-089 | Check home collection availability | Partial | Home address/PIN validation and availability caveat added. PIN serviceability integration remains. |
| ACF-090 | Verify slot capacity | Partial | Reject past/impossible dates and unknown slots; bookings remain pending. Capacity and same-day cutoff logic still required. |
| ACF-091 | Show all-in price | Partial | Booking copy requires confirmation of final price/extras. No unverified fee table added. |
| ACF-092 | Verify discounts and subsidies | Open | Keep approved price evidence and compute reductions accurately. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-093 | Explain cancellation and rescheduling | Partial | Terms instruct confirming cancellation/rescheduling arrangements. Approved policy remains. |
| ACF-094 | Explain report turnaround | Partial | Existing turnaround shown with confirmation of start/exceptions; provider validation remains. |
| ACF-095 | Add abnormal-result follow-up | Partial | Medical interpretation and clinical responsibility stated; critical-result operations need clinical policy. |
| ACF-096 | Test search and category filters | Partial | Tumor-marker filter updated to match renamed category. Full spelling/alias testing remains. |
| ACF-097 | Check sample recollection policy | Open | Explain rejected samples, recollection charges and communication. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-098 | Reduce repeated service sections | Open | Consolidate into a clear service overview with useful detail links. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-099 | Clarify opening message | Partial | About/assistance identify service area and request types; homepage opening design unchanged. |
| ACF-100 | Reduce empty hero space | Open | Move service explanation and primary actions higher. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-101 | Use authentic community photography | Open | Feature approved real foundation work with appropriate permission. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-102 | Shorten loading screen | Implemented locally | Preloader dismisses at DOM readiness with no minimum display duration; shorter failsafe retained. |
| ACF-103 | Simplify desktop menu | Open | Group secondary links under clear sections and retain key actions. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-104 | Improve informational contrast | Open | Use clear light information areas and verify text/button contrast. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-105 | Use descriptive action labels | Partial | Diagnostic request and contribution selector labels corrected; remaining CTA review outstanding. |
| ACF-106 | Audit all shared modal triggers | Open | Check each button on all four main pages and direct deep links. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-107 | Make legal pages shareable | Implemented locally | Added stable privacy, terms and transparency pages; matching modal content and footer links updated. |
| ACF-108 | Use consistent type and spacing | Open | Define a shared font scale, spacing, button and form system. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-109 | Provide breadcrumbs on detail pages | Partial | Added diagnostic detail breadcrumbs; no project detail pages yet. |
| ACF-110 | Reduce floating action clutter | Open | Prioritize help/contact and keep social links secondary. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-111 | Replace design jargon in gallery | Implemented locally | Gallery label changed to Our Community Work. |
| ACF-112 | Remove draft gallery text | Partial | Removed default public lightbox placeholder wording; database draft/provenance review remains. |
| ACF-113 | Verify media provenance | Open | Check that each image/video represents the stated foundation work and is authorized. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-114 | Add complete event metadata | Open | Include actual date, location, organizer, partner and service outcome. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-115 | Consolidate gallery categories | Open | Use a concise taxonomy aligned with real programs. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-116 | Show upcoming events separately | Partial | Added upcoming events information destination without inventing event dates. |
| ACF-117 | Publish confirmed November camp details | Waiting for evidence | Events page explicitly states no confirmed November schedule was supplied; publish only approved particulars. |
| ACF-118 | Protect patient and child imagery | Open | Keep documented publication permissions, guardian permissions where needed and removal process. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-119 | Correct daily news promise | Open | Show actual refresh dates and distinguish archives from latest news. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-120 | Prioritize foundation updates | Open | Feature verified local work, events and impact updates before external news. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-121 | Keep external news attribution | Open | Link original articles and use accurate limited summaries with review rules. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-122 | Add video captions and transcripts | Open | Provide subtitles and text summaries for important videos. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-123 | Create a dedicated CSR page | Open | Publish approved projects, budgets, reporting commitments and due diligence documents. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-124 | Create partner service directory | Open | List approved hospitals, labs, doctors and service arrangements with permission. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-125 | Explain volunteer roles | Open | Add responsibilities, location, skills, time commitment, training and selection process. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-126 | Create doctor/hospital collaboration route | Open | Provide relevant fields and next steps for doctors, hospitals, labs and ambulance partners. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-127 | Show partner permission and scope | Open | Use only authorized logos and describe the actual collaboration. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-128 | Provide downloadable CSR proposals | Open | Offer current costed project briefs and a named contact. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-129 | Add volunteer follow-up workflow | Open | Track reference, acknowledgement, review, training and placement. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-130 | Protect admin operations server-side | Open | Verify authorization on records, exports, status updates and logs using authorized test accounts. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-131 | Secure patient report access | Open | Require appropriate identity checks and expiring protected delivery routes. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-132 | Verify payment status authority | Open | Ensure only trusted gateway verification can mark payment successful. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-133 | Simplify technical form messages | Partial | Shared form confirmation uses plain request/reference/email wording and omits internal dispatch diagnostics; other journeys still need review. |
| ACF-134 | Make privacy notice specific | Partial | Added specific data-use/privacy notice. Exact retention/processor policies require owner approval. |
| ACF-135 | Keep medical data out of analytics | Partial | Manual analytics page views omit queries/fragments and skip diagnostic/admin pages. Full GA configuration and external-provider review remains. |
| ACF-136 | Review public-origin policy | Open | Review CORS, credentials, authorization and browser protections for private endpoints. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-137 | Strengthen content security policy | Open | Review required origins and implement an appropriate tested policy and dependency controls. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-138 | Review server validation and rate limits | Partial | Added server-side diagnostic validation. Existing rate limits retained; broader abuse/upload review outstanding. |
| ACF-139 | Review session security | Open | Check roles, secure cookies, expiry, recovery and privileged-user protection. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-140 | Review privacy of confirmation messages | Open | Use approved templates for sensitive communications and review any external data processing. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-141 | Review retention and deletion | Open | Approve and implement retention, access, deletion and backup policies. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-142 | Test backup restoration | Open | Run an authorized restore test and document recovery responsibilities. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-143 | Review dependency maintenance | Open | Inventory versions, update safely and review CDN integrity practices. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-144 | Test mobile layout | Partial | Added narrow-screen diagnostic form/modal layout rules. Full requested viewport/device matrix not yet completed. |
| ACF-145 | Test keyboard operation | Partial | Shared modal focus trap added and visible focus CSS improved; whole-site keyboard review remains. |
| ACF-146 | Test modal accessibility | Partial | Named shared/healthcare dialogs, close labels and focus handling added. Full screen-reader/browser verification remains. |
| ACF-147 | Check form labels and errors | Partial | Added associated labels to placeholder-only fields and field-linked errors; all-form audit outstanding. |
| ACF-148 | Check tap targets and overlays | Partial | Close controls use minimum 44px targets; other controls and overlays need device checks. |
| ACF-149 | Support zoom and large text | Open | Test reflow, navigation and form usability with enlarged text. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-150 | Respect reduced motion | Partial | Shared reduced-motion CSS added. JavaScript motion and media still need full audit. |
| ACF-151 | Ensure content without animation | Partial | Added crawlable test core content and static information pages. Homepage animation-dependent content still needs review. |
| ACF-152 | Check alternative text | Open | Use meaningful descriptions and empty alt for decorative images. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-153 | Resolve sitemap access exceptions | Partial | Local detail route repair and bounded checks added; live host/Search Console verification remains. |
| ACF-154 | Make essential content crawlable | Partial | Added server-rendered diagnostic core content for both backends and static information pages. |
| ACF-155 | Measure mobile page speed | Open | Measure LCP, INP and CLS with field/lab context before optimizing. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-156 | Optimize images and video loading | Open | Use responsive images, dimensions, compression and deferred offscreen media. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-157 | Review caching policy | Partial | Replaced one-year immutable caching for unversioned Apache static files with one-hour revalidation; live CDN/cache/private-data review remains. |
| ACF-158 | Audit titles and canonical URLs | Partial | Escaped diagnostic SEO text, removed duplicate detail canonical and supplied unique new-page titles/canonicals. Full redirect audit remains. |
| ACF-159 | Improve share previews | Open | Use a readable approved preview image and page-specific titles/descriptions. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-160 | Validate structured data | Partial | Escaped JSON-LD closing-tag content; structured-data validation and all claims remain to review. |
| ACF-161 | Test missing pages and redirects | Open | Check invalid URLs, www/non-www, HTTPS and trailing-slash behavior. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-162 | Audit broken assets and links | Open | Run a bounded link/asset check and verify important documents manually. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-163 | Measure useful conversions | Open | Track verified completed help requests, bookings, applications and payments separately. Requires evidence, operational approval or a separate implementation/verification step; not represented as completed. |
| ACF-164 | Add a content maintenance schedule | Partial | Added this evidence/owner handover. Foundation must assign actual review owners and dates. |
