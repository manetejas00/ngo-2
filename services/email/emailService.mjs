/**
 * Avinya Care Foundation - Email Dispatch & Delivery Service
 * Sends dual emails (User confirmation & Admin operational notification).
 * Integrates SMTP delivery via Nodemailer (with connection pooling) + Native TLS Socket fallback.
 * Automatically dispatches error alert emails to info@test.avinyacarefoundation.org if any email fails.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = join(__dirname, '../../cache');
const LOG_FILE = join(LOG_DIR, 'email_logs.json');
const EMAIL_LOGO_PATH = join(__dirname, '../../assets/logo.png');
const EMAIL_LOGO_ATTACHMENT = {
  filename: 'avinya-care-logo.png',
  path: EMAIL_LOGO_PATH,
  cid: 'avinya-logo',
  contentType: 'image/png'
};

// Reusable Transporter instance
let cachedTransporter = null;
let cachedTransporterKey = '';

async function getOrCreateTransporter(smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass) {
  const currentKey = `${smtpHost}:${smtpPort}:${smtpSecure}:${smtpUser}`;
  if (cachedTransporter && cachedTransporterKey === currentKey) {
    return cachedTransporter;
  }

  try {
    const nodemailer = await import('nodemailer');
    if (nodemailer && nodemailer.createTransport) {
      cachedTransporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        ignoreTLS: smtpHost === '127.0.0.1' || smtpHost === 'localhost',
        auth: (smtpUser && smtpPass) ? { user: smtpUser, pass: smtpPass } : undefined,
        connectionTimeout: 8000,
        greetingTimeout: 6000,
        socketTimeout: 10000
      });
      cachedTransporterKey = currentKey;
      return cachedTransporter;
    }
  } catch (e) {
    // Nodemailer not available
  }
  return null;
}

/**
 * Sends an automated diagnostic error alert email to info@test.avinyacarefoundation.org if any email dispatch fails.
 */
async function sendDeliveryErrorAlertToAdmin(details) {
  const {
    adminEmail,
    senderEmail,
    senderName,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    metadata,
    userEmailError,
    deliveryError
  } = details;

  try {
    const errorSubject = `[Avinya Care ALERT] Email Delivery Failed — ${metadata.formType?.toUpperCase()} (ID: ${metadata.submissionId})`;
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${errorSubject}</title></head>
<body style="margin: 0; padding: 24px; background-color: #FEF2F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111817;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #FECACA; overflow: hidden; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.08);">
    <tr>
      <td style="background-color: #DC2626; color: #FFFFFF; padding: 20px 24px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; color: #FEE2E2;">Avinya Care System Diagnostics</div>
        <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #FFFFFF;">⚠️ Outbound Email Delivery Failed</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <p style="margin-top: 0; font-size: 14px; line-height: 1.6; color: #374151;">
          An automated email dispatch for a recent <strong>${metadata.formType?.toUpperCase()}</strong> form submission failed to deliver to <strong>${metadata.userEmail || 'User'}</strong>.
        </p>
        
        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; border-radius: 6px; padding: 14px 16px; margin: 18px 0; font-size: 13px; line-height: 1.6; color: #991B1B;">
          <strong>Error Details:</strong><br>
          <code style="font-family: monospace; word-break: break-all;">${userEmailError || deliveryError || 'SMTP Outbound Connection Failure'}</code>
        </div>

        <div style="background-color: #F9FAFB; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.8; color: #111817; border: 1px solid #E5E7EB;">
          <strong>Submission ID:</strong> <code style="color: #DC2626; font-weight: 700;">${metadata.submissionId}</code><br>
          <strong>Form Category:</strong> ${metadata.formType?.toUpperCase()}<br>
          <strong>Target Recipient:</strong> <a href="mailto:${metadata.userEmail}" style="color: #DC2626; font-weight: 600;">${metadata.userEmail || 'N/A'}</a><br>
          <strong>Timestamp:</strong> ${metadata.timestampIST}<br>
          <strong>Hostinger SMTP Host:</strong> ${smtpHost}:${smtpPort}
        </div>

        <p style="font-size: 13px; color: #6B7280; margin: 20px 0 0 0; line-height: 1.5;">
          <strong>Recommended Action:</strong> Please verify the user's email address or reach out to them directly via phone or dashboard.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const errorText = `[AVINYA CARE ALERT] Email Delivery Failed\n\nSubmission ID: ${metadata.submissionId}\nForm Type: ${metadata.formType}\nTarget Recipient: ${metadata.userEmail}\nError: ${userEmailError || deliveryError}\nTimestamp: ${metadata.timestampIST}\nSMTP Server: ${smtpHost}:${smtpPort}`;

    const { sendSmtpSocket } = await import('./smtpClient.mjs');
    await sendSmtpSocket({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      pass: smtpPass,
      from: senderEmail,
      fromName: 'Avinya Care System Alerts',
      to: adminEmail,
      subject: errorSubject,
      htmlContent: errorHtml,
      textContent: errorText,
      replyTo: senderEmail
    });

    console.log(`[Diagnostic Alert Sent] Dispatched delivery failure alert to ${adminEmail} for submission ${metadata.submissionId}`);
  } catch (alertErr) {
    console.error('[Diagnostic Alert Failure]', alertErr.message);
  }
}

/**
 * Dispatches both User confirmation email and Admin notification email.
 * @param {Object} userEmailPayload - Rendered user email ({ subject, html, text })
 * @param {Object} adminEmailPayload - Rendered admin email ({ subject, html, text })
 * @param {Object} metadata - Submission metadata (submissionId, formType, userEmail, isAIGenerated, timestampIST)
 * @returns {Promise<{ success: boolean, messageId: string, deliveryStatus: string, deliveryMethod: string, userEmail: Object, adminEmail: Object, successMessage: string, errorMessage: string }>} Dispatch result
 */
export async function sendFormEmails(userEmailPayload, adminEmailPayload, metadata) {
  const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const senderEmail = process.env.SMTP_FROM || 'info@test.avinyacarefoundation.org';
  const senderName = process.env.SMTP_FROM_NAME || 'Avinya Care Foundation';
  const adminEmail = process.env.ADMIN_EMAIL || 'info@test.avinyacarefoundation.org';
  const recipientUser = metadata.userEmail;

  let deliveryStatus = 'SENT';
  let deliveryMethod = 'VIRTUAL_MAILER';
  let deliveryError = null;
  let userEmailError = null;
  let adminEmailError = null;

  const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpUser = process.env.SMTP_USER || 'info@test.avinyacarefoundation.org';
  const smtpPass = process.env.SMTP_PASS || '@qLVTyL|J5';
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  let userEmailSent = !recipientUser;
  let adminEmailSent = false;

  // 1. Attempt delivery via Nodemailer pooled transporter
  try {
    const transporter = await getOrCreateTransporter(smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass);

    if (transporter) {
      if (!userEmailSent && recipientUser) {
        try {
          const userRes = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: recipientUser,
            subject: userEmailPayload.subject,
            text: userEmailPayload.text,
            html: userEmailPayload.html,
            replyTo: senderEmail,
            attachments: [EMAIL_LOGO_ATTACHMENT]
          });
          userEmailSent = true;
          console.log(`[SMTP Sent via Nodemailer] User email sent to ${recipientUser} | ID: ${userRes.messageId || 'ok'}`);
        } catch (uErr) {
          userEmailError = uErr.message;
          console.warn('[Nodemailer User Email Warning]', uErr.message);
        }
      }

      if (!adminEmailSent) {
        try {
          const adminRes = await transporter.sendMail({
            from: `"Avinya Care Operations" <${senderEmail}>`,
            to: adminEmail,
            subject: adminEmailPayload.subject,
            text: adminEmailPayload.text,
            html: adminEmailPayload.html,
            replyTo: recipientUser || senderEmail,
            attachments: [EMAIL_LOGO_ATTACHMENT]
          });
          adminEmailSent = true;
          console.log(`[SMTP Sent via Nodemailer] Admin alert sent to ${adminEmail} | ID: ${adminRes.messageId || 'ok'}`);
        } catch (aErr) {
          adminEmailError = aErr.message;
          console.warn('[Nodemailer Admin Email Warning]', aErr.message);
        }
      }

      if (userEmailSent && adminEmailSent) {
        deliveryMethod = 'SMTP_NODEMAILER';
        deliveryStatus = 'SENT';
      }
    }
  } catch (nodemailerErr) {
    console.warn('[Nodemailer Delivery Warning]', nodemailerErr.message, '— Switching to Native TLS Socket...');
  }

  // 2. Fallback to Native TLS Socket Client for any pending emails
  if (!userEmailSent || !adminEmailSent) {
    try {
      const { sendSmtpSocket } = await import('./smtpClient.mjs');

      if (!userEmailSent && recipientUser) {
        try {
          await sendSmtpSocket({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            user: smtpUser,
            pass: smtpPass,
            from: senderEmail,
            fromName: senderName,
            to: recipientUser,
            subject: userEmailPayload.subject,
            htmlContent: userEmailPayload.html,
            textContent: userEmailPayload.text,
            replyTo: senderEmail,
            attachments: [EMAIL_LOGO_ATTACHMENT]
          });
          userEmailSent = true;
          userEmailError = null;
          console.log(`[Native TLS Socket Sent] User email sent to ${recipientUser}`);
        } catch (sUserErr) {
          userEmailError = sUserErr.message;
          console.error('[Native Socket User Email Error]', sUserErr.message);
        }
      }

      if (!adminEmailSent) {
        try {
          await sendSmtpSocket({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            user: smtpUser,
            pass: smtpPass,
            from: senderEmail,
            fromName: 'Avinya Care Operations',
            to: adminEmail,
            subject: adminEmailPayload.subject,
            htmlContent: adminEmailPayload.html,
            textContent: adminEmailPayload.text,
            replyTo: recipientUser || senderEmail,
            attachments: [EMAIL_LOGO_ATTACHMENT]
          });
          adminEmailSent = true;
          adminEmailError = null;
          console.log(`[Native TLS Socket Sent] Admin alert sent to ${adminEmail}`);
        } catch (sAdminErr) {
          adminEmailError = sAdminErr.message;
          console.error('[Native Socket Admin Email Error]', sAdminErr.message);
        }
      }

      deliveryMethod = smtpSecure || smtpPort === 465 ? 'SMTP_TLS_SOCKET' : 'SMTP_SOCKET';
      deliveryStatus = userEmailSent && adminEmailSent ? 'SENT' : (userEmailSent || adminEmailSent ? 'PARTIAL' : 'FAILED');
    } catch (socketErr) {
      console.error('[Native Socket SMTP Error]', socketErr.message);
      deliveryError = socketErr.message;
      deliveryStatus = userEmailSent || adminEmailSent ? 'PARTIAL' : 'FAILED';
      deliveryMethod = 'FAILED';
    }
  }

  if (!userEmailSent || !adminEmailSent) {
    deliveryError = userEmailError || adminEmailError || deliveryError || 'Failed to dispatch one or more emails.';

    // Automatically send error alert email to admin (info@test.avinyacarefoundation.org)
    await sendDeliveryErrorAlertToAdmin({
      adminEmail,
      senderEmail,
      senderName,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      metadata,
      userEmailError,
      deliveryError
    });
  }

  const successMessage = (userEmailSent && adminEmailSent)
    ? `All emails successfully dispatched via Hostinger SSL SMTP (Port ${smtpPort}).`
    : (userEmailSent || adminEmailSent ? 'Partial email delivery completed. Admin error alert dispatched.' : 'Email delivery failed. Admin error alert dispatched.');

  // Create safe log record (NO passwords, secrets, card info, or raw sensitive medical data)
  const logRecord = {
    messageId,
    submissionId: metadata.submissionId,
    formType: metadata.formType,
    recipientUser: recipientUser || 'N/A',
    recipientAdmin: adminEmail,
    senderEmail,
    isAIGenerated: metadata.isAIGenerated,
    deliveryStatus,
    deliveryMethod,
    userEmailSent,
    adminEmailSent,
    userEmailError,
    adminEmailError,
    deliveryError,
    successMessage,
    userSubject: userEmailPayload.subject,
    adminSubject: adminEmailPayload.subject,
    timestampIST: metadata.timestampIST
  };

  await logEmailDispatch(logRecord);

  console.log(`[Email Service] Emails status: ${deliveryStatus} (${deliveryMethod}) for submission ${metadata.submissionId} (Form: ${metadata.formType}, AI: ${metadata.isAIGenerated ? 'YES' : 'FALLBACK'})`);

  return {
    success: userEmailSent && adminEmailSent,
    messageId,
    deliveryStatus,
    deliveryMethod,
    userEmail: {
      sent: userEmailSent,
      recipient: recipientUser || 'N/A',
      subject: userEmailPayload.subject,
      statusMessage: userEmailSent ? `Confirmation email dispatched to ${recipientUser}` : `Delivery failed for ${recipientUser}`,
      error: userEmailError
    },
    adminEmail: {
      sent: adminEmailSent,
      recipient: adminEmail,
      subject: adminEmailPayload.subject,
      statusMessage: adminEmailSent ? `Operational alert dispatched to ${adminEmail}` : `Delivery failed for admin alert`,
      error: adminEmailError
    },
    successMessage,
    errorMessage: deliveryError
  };
}

/**
 * Appends email dispatch records to persistent storage for auditing.
 */
async function logEmailDispatch(record) {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    let existingLogs = [];
    try {
      const raw = await readFile(LOG_FILE, 'utf-8');
      existingLogs = JSON.parse(raw);
      if (!Array.isArray(existingLogs)) existingLogs = [];
    } catch (e) {
      existingLogs = [];
    }

    existingLogs.unshift(record);
    // Keep last 500 email logs
    if (existingLogs.length > 500) existingLogs = existingLogs.slice(0, 500);

    await writeFile(LOG_FILE, JSON.stringify(existingLogs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Email Service Log Error]', err.message);
  }
}
