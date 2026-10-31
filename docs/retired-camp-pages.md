# Camp page retirement

Updated 1 November 2026.

- The homepage announcement popup, hero camp link, assistance-page camp link, footer and mobile camp links now open the published Google registration form in a new tab.
- Removed `health-camp.html` and `preregistration.html`; Apache and Node redirect their clean and `.html` URLs to the Google Form.
- Removed the retired health-camp URL from the sitemap.
- Live copies are recoverable from the private `.retired-camp-pages-20261101` backup directory outside public_html. Registration records and sync endpoints are unchanged.
- Retained about, assistance, admin, coming-soon, crowdfunding, doctors, events, gallery, get-involved, index, privacy, terms and transparency pages because navigation, routes or modal features use them. Components and the email template are active includes, not unused pages.
- Retained `response.html` following automatic approval review's concern about possible references. Its existing public redirect to home remains in place.

Live verification: four retired URL variants return 302 directly to the Google Form; popup and shared navigation links contain the Google Form URL; eight other public pages return successfully; sitemap no longer lists health-camp. Node server and smoke-check script syntax passed.
