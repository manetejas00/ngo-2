/**
 * Avinya Care Foundation - Predefined Safe Fallback Email Generator
 * Guarantees that every form submission receives high-quality, personalized email content
 * even if the AI service times out, is unavailable, or returns invalid output.
 */

/**
 * Generates structured fallback email content based on form type and submitted fields.
 * @param {Object} formData - Cleaned form input fields
 * @param {string} formType - Form type (donation, volunteer, contact, support, partnership, newsletter, feedback)
 * @param {string} submissionId - Unique submission ID
 * @param {string} timestampIST - Formatted IST timestamp
 * @returns {Object} Structured user and admin email content
 */
export function generateFallbackEmails(formData, formType, submissionId, timestampIST) {
  const name = formData.name || formData.firstName || 'Valued Supporter';
  const email = formData.email || '';
  const phone = formData.phone || formData.mobile || '';
  const interest = formData.interest || formData.category || formData.subject || 'Cancer Care & Awareness';
  const message = formData.message || formData.feedback || '';
  const organization = formData.organization || formData.company || '';

  // Form type specific fallback content
  switch (formType.toLowerCase()) {
    case 'donation': {
      const amount = formData.amount ? `₹${new Intl.NumberFormat('en-IN').format(formData.amount)}` : 'your monetary gift';
      const frequency = formData.frequency || (formData.isMonthly ? 'monthly' : 'one-time');
      const status = (formData.payment_status || 'SUCCESS').toUpperCase();
      const transactionId = formData.transaction_id || `TXN-${Date.now().toString().slice(-8)}`;

      let statusMessage = "Your contribution has been successfully processed.";
      if (status === 'PENDING') statusMessage = "Your payment transaction is currently pending confirmation from the payment gateway.";
      if (status === 'FAILED') statusMessage = "We noticed your donation attempt was not completed. If funds were debited, they will be auto-refunded by your bank.";

      return {
        user: {
          subject: `Thank You for Your Generous Support of ${amount}`,
          greeting: `Dear ${name},`,
          body: `Thank you for supporting Avinya Care Foundation's mission. We have received your ${frequency} donation of ${amount}. ${statusMessage}\n\nYour contribution directly enables early cancer diagnostic screening camps, patient navigation support, and clinical care kits for families across India.\n\nTransaction Reference: ${transactionId}`,
          closing: "With deep gratitude,\nAvinya Care Foundation Team"
        },
        admin: {
          subject: `New Donation Received — ${name} (${amount})`,
          summary: `A donation submission of ${amount} (${frequency}) has been recorded for ${name} (${email}${phone ? `, Mobile: ${phone}` : ''}).\n\nPayment Status: ${status}\nTransaction ID: ${transactionId}${formData.pan ? `\nPAN: ${formData.pan}` : ''}`,
          recommendedAction: "Verify transaction receipt in the financial dashboard and issue 80G tax certificate if required.",
          closing: "Avinya Care Operations Desk"
        }
      };
    }

    case 'volunteer': {
      return {
        user: {
          subject: `Thank You for Wanting to Volunteer with Avinya Care`,
          greeting: `Hello ${name},`,
          body: `Thank you for reaching out to Avinya Care Foundation and expressing your interest in supporting our cancer awareness and patient care initiatives${interest ? ` regarding ${interest}` : ''}.\n\nWe have received your volunteer request and deeply appreciate your willingness to contribute your time and energy to our cause.\n\nOur community team will review your application and connect with you shortly when a suitable activity or campaign opens up in your region.`,
          closing: "With warm regards,\nAvinya Care Foundation"
        },
        admin: {
          subject: `New Volunteer Application — ${name}`,
          summary: `A new volunteer application has been submitted by ${name} (${email}${phone ? `, Mobile: ${phone}` : ''}).\n\nArea of Interest: ${interest}${message ? `\nApplicant Message: "${message}"` : ''}`,
          recommendedAction: "Review applicant's location and background to match with upcoming regional awareness drives or survivor support sessions.",
          closing: "Avinya Care Volunteer Coordination Team"
        }
      };
    }

    case 'support': {
      const isSensitive = formData.is_sensitive || false;
      return {
        user: {
          subject: `Avinya Care Support Helpline — We Have Received Your Request`,
          greeting: `Dear ${name},`,
          body: `Thank you for reaching out to Avinya Care Foundation. We have safely received your support inquiry.\n\nNavigating cancer care can feel overwhelming, but please know that you are not alone. Our team provides diagnostic navigation guidance, emotional counseling resources, and patient assistance information.\n\nA dedicated care navigator from our team will review the details you shared and reach out to you directly.`,
          closing: "With compassionate care,\nAvinya Care Patient Support Team"
        },
        admin: {
          subject: `URGENT: Patient Support Inquiry — ${name}`,
          summary: isSensitive
            ? `Sensitive patient support request received from ${name} (${email}${phone ? `, Mobile: ${phone}` : ''}). Sensitive clinical support details were submitted safely. Please log into the secure admin portal to review.`
            : `A support inquiry was submitted by ${name} (${email}${phone ? `, Mobile: ${phone}` : ''}).\n\nCategory: ${interest}${message ? `\nUser Request: "${message}"` : ''}`,
          recommendedAction: "Assign a medical navigator or counselor to call or message the family within 24 hours.",
          closing: "Avinya Care Health Desk"
        }
      };
    }

    case 'partnership': {
      return {
        user: {
          subject: `Partnership & Corporate CSR Inquiry — Avinya Care Foundation`,
          greeting: `Dear ${name},`,
          body: `Thank you for contacting Avinya Care Foundation regarding a potential partnership${organization ? ` on behalf of ${organization}` : ''}.\n\nWe welcome opportunities to collaborate with corporate partners, institutions, and community organizations to expand cancer screening and healthcare outreach in underserved communities across India.\n\nOur partnerships desk will evaluate your proposal and reach out to initiate a discussion.`,
          closing: "Sincerely,\nAvinya Care Foundation Partnerships Desk"
        },
        admin: {
          subject: `New CSR & Partnership Lead — ${organization || name}`,
          summary: `A corporate/institutional partnership inquiry was submitted by ${name} (${email}${phone ? `, Mobile: ${phone}` : ''})${organization ? ` representing ${organization}` : ''}.\n\nFocus Area: ${interest}${message ? `\nProposal Details: "${message}"` : ''}`,
          recommendedAction: "Schedule an introductory discussion call to share CSR impact metrics and mobile screening van alignment.",
          closing: "Avinya Care Alliances Desk"
        }
      };
    }

    case 'newsletter': {
      return {
        user: {
          subject: `Welcome to the Avinya Care Community Newsletter`,
          greeting: `Hello ${name},`,
          body: `Thank you for subscribing to the Avinya Care Foundation newsletter.\n\nYou will now receive monthly updates on early detection screening guidelines, patient stories of hope, oncologist insights, and community health drives.\n\nThank you for standing with us in spreading health awareness across India.`,
          closing: "Warmly,\nAvinya Care Foundation Communications Team"
        },
        admin: {
          subject: `New Newsletter Subscriber — ${name}`,
          summary: `${name} (${email}) has subscribed to the Avinya Care monthly health newsletter.`,
          recommendedAction: "Add email address to the monthly health newsletter broadcasting list.",
          closing: "Avinya Care Communications Desk"
        }
      };
    }

    case 'feedback': {
      return {
        user: {
          subject: `Thank You for Sharing Your Feedback with Avinya Care`,
          greeting: `Dear ${name},`,
          body: `Thank you for taking the time to share your valuable feedback with Avinya Care Foundation.\n\nYour insights and experience help us continually improve our diagnostic health camps, survivor support programs, and community initiatives.\n\nWe deeply appreciate your engagement with our foundation.`,
          closing: "With appreciation,\nAvinya Care Quality & Support Team"
        },
        admin: {
          subject: `Website Feedback Received — ${name}`,
          summary: `Feedback was submitted by ${name} (${email}).\n\nTopic: ${interest}${message ? `\nFeedback Content: "${message}"` : ''}`,
          recommendedAction: "Review feedback for service improvement or follow up if user requested a response.",
          closing: "Avinya Care Admin Desk"
        }
      };
    }

    case 'contact':
    default: {
      return {
        user: {
          subject: `We Have Received Your Message — Avinya Care Foundation`,
          greeting: `Hello ${name},`,
          body: `Thank you for getting in touch with Avinya Care Foundation.\n\nWe have received your message regarding "${interest}". Our team is committed to advancing cancer awareness, early screening, and healthcare support across India.\n\nRepresentative team members will review your query and respond to you as soon as possible.`,
          closing: "Best regards,\nAvinya Care Foundation Team"
        },
        admin: {
          subject: `New Website Contact Inquiry — ${name}`,
          summary: `A contact inquiry has been submitted by ${name} (${email}${phone ? `, Mobile: ${phone}` : ''}).\n\nSubject / Area: ${interest}${message ? `\nMessage: "${message}"` : ''}`,
          recommendedAction: "Review the query and route to the appropriate department (Medical, Volunteer, Financial, or Operations).",
          closing: "Avinya Care Operations Desk"
        }
      };
    }
  }
}
