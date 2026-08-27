/**
 * Avinya Care Foundation - HTML & Plain Text Email Template Engine
 * Wraps AI-generated content in brand-aligned, responsive HTML templates with strict security escaping.
 */

/**
 * Escapes unsafe HTML characters to prevent XSS / HTML injection.
 * @param {string} str - Raw string
 * @returns {string} Safe HTML-escaped string
 */
export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats multi-line plain text into safe HTML paragraphs.
 * @param {string} text - Raw text content
 * @returns {string} Formatted HTML paragraphs
 */
function formatBodyParagraphs(text) {
  if (!text) return '';
  const escaped = escapeHTML(text);
  return escaped
    .split(/\n\s*\n/)
    .map(para => `<p style="margin: 0 0 1rem 0; line-height: 1.65; color: #111817; font-size: 15px;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Renders complete User Email payload.
 * @param {Object} emailContent - AI or fallback email content ({ subject, greeting, body, closing })
 * @param {Object} formData - Form submission data
 * @param {string} formType - Form type
 * @returns {{ subject: string, html: string, text: string }} User email payload
 */
export function renderUserEmail(emailContent, formData, formType) {
  const rawSubject = emailContent.subject || 'Thank You for Reaching Out';
  const formattedSubject = `${rawSubject.replace(/\s*—\s*Avinya Care Foundation$/i, '')} — Avinya Care Foundation`;

  const greeting = escapeHTML(emailContent.greeting || `Hello ${formData.name || 'Friend'},`);
  const bodyHTML = formatBodyParagraphs(emailContent.body);
  const closingHTML = formatBodyParagraphs(emailContent.closing || 'With care,\nAvinya Care Foundation');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(formattedSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111817; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F4EF; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(8, 127, 115, 0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 28px 32px; text-align: center; border-bottom: 3px solid #F47528;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #FFFFFF; border-radius: 50%; padding: 6px; box-shadow: 0 4px 12px rgba(245, 130, 32, 0.3);">
                      <img src="${process.env.LOGO_URL || 'https://test.avinyacarefoundation.org/assets/logo.png'}" alt="Avinya Care Foundation" width="56" height="56" style="display: block; width: 56px; height: 56px; border: 0; border-radius: 50%; object-fit: contain;" />
                    </div>
                  </td>
                </tr>
              </table>
              <div style="color: #F58220; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">Avinya Care Foundation</div>
              <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">No One Should Face Cancer Alone</h1>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <p style="font-size: 17px; font-weight: 600; color: #087F73; margin: 0 0 16px 0;">${greeting}</p>
              
              <div style="font-size: 15px; color: #111817; line-height: 1.65;">
                ${bodyHTML}
              </div>

              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #F6F4EF; color: #5F6865; font-size: 14px; font-weight: 500;">
                ${closingHTML}
              </div>
            </td>
          </tr>

          <!-- Footer & Disclaimers -->
          <tr>
            <td style="background-color: #F6F4EF; padding: 24px 32px; text-align: center; border-top: 1px solid #E2E8F0; color: #5F6865; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #087F73; text-transform: uppercase; letter-spacing: 1px; font-size: 11px;">
                Cancer Awareness • Support • Care • Community
              </p>
              <p style="margin: 0 0 12px 0;">
                Avinya Care Foundation • Reg. NGO 80G / 12A Tax Exempted<br>
                Email: <a href="mailto:care@avinyacare.org" style="color: #087F73; text-decoration: none; font-weight: 500;">care@avinyacare.org</a> | Helpline: <a href="tel:+919876543210" style="color: #087F73; text-decoration: none; font-weight: 500;">+91 98765 43210</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #5F6865; border-top: 1px dashed #CBD5E1; padding-top: 10px;">
                <strong>Medical & Legal Disclaimer:</strong> Avinya Care Foundation communications provide general cancer awareness and support navigation. We do not provide medical diagnoses, treatment prescriptions, or clinical medical advice. Please consult a registered medical oncologist for health concerns.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `AVINYA CARE FOUNDATION
${formattedSubject}

${emailContent.greeting || `Hello ${formData.name || 'Friend'},`}

${emailContent.body || ''}

${emailContent.closing || 'With care,\nAvinya Care Foundation'}

------------------------------------------------
Cancer Awareness • Support • Care • Community
Avinya Care Foundation • Reg. NGO 80G / 12A Tax Exempted
Email: care@avinyacare.org | Helpline: +91 98765 43210
Medical Disclaimer: General cancer awareness and support navigation only. Not medical advice.`;

  return {
    subject: formattedSubject,
    html,
    text
  };
}

/**
 * Renders complete Admin Email payload.
 * @param {Object} emailContent - AI or fallback email content ({ subject, summary, recommendedAction, closing })
 * @param {Object} formData - Form submission data
 * @param {string} formType - Form type
 * @param {string} submissionId - Submission ID
 * @param {string} timestampIST - Formatted IST timestamp
 * @returns {{ subject: string, html: string, text: string }} Admin email payload
 */
export function renderAdminEmail(emailContent, formData, formType, submissionId, timestampIST) {
  const rawSubject = emailContent.subject || `New ${formType} Submission — ${formData.name || 'Website User'}`;
  const cleanSubject = rawSubject.replace(/^\[Avinya Care\]\s*/i, '');
  const formattedSubject = `[Avinya Care] ${cleanSubject}`;

  const summaryHTML = formatBodyParagraphs(emailContent.summary);
  const actionHTML = formatBodyParagraphs(emailContent.recommendedAction || 'Review submission and follow up as necessary.');
  const closingHTML = formatBodyParagraphs(emailContent.closing || 'Avinya Care Operations System');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(formattedSubject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111817;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F4EF; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 650px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 24px 32px; border-bottom: 3px solid #F47528;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td valign="middle" style="width: 44px;">
                    <div style="background-color: #FFFFFF; border-radius: 50%; padding: 4px; display: inline-block;">
                      <img src="${process.env.LOGO_URL || 'https://test.avinyacarefoundation.org/assets/logo.png'}" alt="Avinya Care" width="36" height="36" style="display: block; width: 36px; height: 36px; border: 0; border-radius: 50%; object-fit: contain;" />
                    </div>
                  </td>
                  <td valign="middle" style="padding-left: 12px;">
                    <div style="color: #F58220; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Avinya Care Internal Operations</div>
                    <h2 style="color: #FFFFFF; font-size: 19px; font-weight: 700; margin: 2px 0 0 0;">New Form Submission: ${escapeHTML(formType.toUpperCase())}</h2>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Box -->
          <tr>
            <td style="padding: 32px 32px 16px 32px;">
              <div style="background-color: #F6F4EF; border-left: 4px solid #087F73; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #087F73; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Submission Metadata</div>
                <div style="font-size: 14px; color: #111817; line-height: 1.6;">
                  <strong>Form Type:</strong> ${escapeHTML(formType.toUpperCase())}<br>
                  <strong>Submission ID:</strong> <code>${escapeHTML(submissionId)}</code><br>
                  <strong>Submitted At:</strong> ${escapeHTML(timestampIST)}<br>
                  <strong>Reply-To:</strong> <a href="mailto:${escapeHTML(formData.email || '')}" style="color: #087F73; text-decoration: none;">${escapeHTML(formData.email || 'N/A')}</a>
                </div>
              </div>

              <h3 style="font-size: 16px; font-weight: 700; color: #087F73; margin: 0 0 12px 0;">Submission Overview</h3>
              <div style="font-size: 15px; color: #111817; line-height: 1.6; margin-bottom: 24px;">
                ${summaryHTML}
              </div>

              <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Recommended Operational Action</div>
                <div style="font-size: 14px; color: #166534; line-height: 1.6;">
                  ${actionHTML}
                </div>
              </div>

              <div style="font-size: 13px; color: #5F6865; border-top: 1px solid #F6F4EF; padding-top: 16px;">
                ${closingHTML}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F6F4EF; padding: 16px 32px; text-align: center; color: #5F6865; font-size: 12px; border-top: 1px solid #E2E8F0;">
              Avinya Care Automated Dispatch System • Confidential Internal Operations Notice
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `AVINYA CARE OPERATIONAL ALERT
${formattedSubject}

Form Type: ${formType.toUpperCase()}
Submission ID: ${submissionId}
Submitted At: ${timestampIST}
Reply-To: ${formData.email || 'N/A'}

SUBMISSION SUMMARY:
${emailContent.summary || ''}

RECOMMENDED ACTION:
${emailContent.recommendedAction || ''}

${emailContent.closing || 'Avinya Care Operations Desk'}`;

  return {
    subject: formattedSubject,
    html,
    text
  };
}
