# Mega Health Checkup registration

Page: `/health-camp`. API: `POST /api/camp-registration` (JSON).
Source: owner-supplied Google Form, reviewed on 25 October 2026.
Camp: 29 November 2026, Ameya Classic Club, Yashwant Nagar, West, Vasai-Virar, Maharashtra 401303.

The Node server stores registrations in a SQLite database at
`storage/registrations/camp.sqlite`. The host must have the `sqlite3` executable
on PATH. The directory is created with mode 0700 and the database with mode 0600.
Keep this directory on persistent local storage, exclude it from public hosting,
and back it up securely. It is ignored by Git and blocked by the Node static server.
No responses are sent to Google Forms. When an optional email is supplied, a confirmation uses the shared branded email template and SMTP service. Medical answers are not included in the email. With no email, sending is skipped.

Records include the ten form answers, consent version, creation time and a random
registration reference. Medical questions are optional. The same camp, name
(case-insensitive) and mobile combination is rejected as a duplicate; different
names can share a family phone number. There is no public listing endpoint.
A registration is an attendance enquiry, not a user login or confirmed appointment.

Authorized coordinators can query the database using their secured server access.
Do not publish the database or its exports. Corrections/deletions currently require
authorized database maintenance; visitors are directed to the camp contact number.
Admins and managers can view all responses and export CSV from Admin → Camp Registrations. Other roles are denied by the server. Email delivery status is stored separately in the same SQLite database.

Production PHP hosting uses the existing MySQL connection and creates the camp_registrations table on first use. Both backends expose the same registration and admin actions. PHP uses the shared SMTP sender and a confirmation template rendered from the Node branded email template.
