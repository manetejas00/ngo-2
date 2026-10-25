import { renderUserEmail } from '../email/emailTemplate.mjs';
import { sendFormEmails } from '../email/emailService.mjs';
export async function sendCampConfirmation(data, record) {
  if (!data.email) return 'SKIPPED';
  const email = renderUserEmail({
    subject: 'Your Mega Health & Screening Camp Registration',
    greeting: `Hello ${data.name},`,
    body: `Your registration has been received.\n\nRegistration reference: ${record.id}\nDate: 29 November 2026\nVenue: Ameya Classic Club, Yashwant Nagar, West, Vasai-Virar, Maharashtra 401303.\n\nPlease keep your reference. Registration does not guarantee a particular test or appointment. Screening depends on medical eligibility and availability. Call 7447441116 to confirm available tests and any charges.`,
    closing: 'With care,\nAvinya Care Foundation'
  }, { name: data.name }, 'camp_registration');
  const delivery = await sendFormEmails(email, email, { submissionId: record.id, formType: 'camp_registration', userEmail: data.email, skipAdmin: true, isAIGenerated: false, timestampIST: record.createdAt });
  return delivery.userEmail?.sent ? 'SENT' : 'FAILED';
}
