/**
 * Avinya Care Foundation - Email Dispatch & Delivery Service
 * Sends dual emails (User confirmation & Admin operational notification).
 * Integrates SMTP delivery via Nodemailer (with connection pooling) + Native TLS Socket fallback.
 * Exposes detailed delivery success and error reporting for every email dispatch.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = join(__dirname, '../../cache');
const LOG_FILE = join(LOG_DIR, 'email_logs.json');

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
 * Dispatches both User confirmation email and Admin notification email.
 * @param {Object} userEmailPayload - Rendered user email ({ subject, html, text })
 * @param {Object} adminEmailPayload - Rendered admin email ({ subject, html, text })
 * @param {Object} metadata - Submission metadata (submissionId, formType, userEmail, isAIGenerated, timestampIST)
 * @returns {Promise<{ success: boolean, messageId: string, deliveryStatus: string, deliveryMethod: string, userEmail: Object, adminEmail: Object, successMessage: string, errorMessage: string }>} Dispatch result
 */
export async function sendFormEmails(userEmailPayload, adminEmailPayload, metadata) {
  const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const senderEmail = process.env.SMTP_FROM || process.env.MAIL_FROM_ADDRESS || 'info@test.avinyacarefoundation.org';
  const senderName = process.env.MAIL_FROM_NAME || 'Avinya Care Foundation';
  const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_FROM_ADDRESS || 'info@test.avinyacarefoundation.org';
  const recipientUser = metadata.userEmail;

  let deliveryStatus = 'SENT';
  let deliveryMethod = 'VIRTUAL_MAILER';
  let deliveryError = null;
  let userEmailError = null;
  let adminEmailError = null;

  // Support both SMTP_* and MAIL_* environment variable schemas
  const smtpHost = process.env.SMTP_HOST || process.env.MAIL_HOST || '127.0.0.1';
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '1025', 10);
  const smtpUser = process.env.SMTP_USER || process.env.MAIL_USERNAME;
  const smtpPass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.MAIL_ENCRYPTION === 'ssl' || smtpPort === 465;

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
            replyTo: senderEmail
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
            replyTo: recipientUser || senderEmail
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
            replyTo: senderEmail
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
            replyTo: recipientUser || senderEmail
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
  }

  const successMessage = (userEmailSent && adminEmailSent)
    ? `All emails successfully dispatched via Hostinger SSL SMTP (Port ${smtpPort}).`
    : (userEmailSent || adminEmailSent ? 'Partial email delivery completed.' : null);

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
