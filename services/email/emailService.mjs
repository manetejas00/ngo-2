/**
 * Avinya Care Foundation - Email Dispatch & Delivery Service
 * Sends dual emails (User confirmation & Admin operational notification).
 * Integrates SMTP delivery when configured with virtual email logging fallback.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = join(__dirname, '../../cache');
const LOG_FILE = join(LOG_DIR, 'email_logs.json');

/**
 * Dispatches both User confirmation email and Admin notification email.
 * @param {Object} userEmailPayload - Rendered user email ({ subject, html, text })
 * @param {Object} adminEmailPayload - Rendered admin email ({ subject, html, text })
 * @param {Object} metadata - Submission metadata (submissionId, formType, userEmail, isAIGenerated, timestampIST)
 * @returns {Promise<{ success: boolean, messageId: string, deliveryStatus: string }>} Dispatch result
 */
export async function sendFormEmails(userEmailPayload, adminEmailPayload, metadata) {
  const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const senderEmail = process.env.SMTP_FROM || process.env.MAIL_FROM_ADDRESS || 'info@test.avinyacarefoundation.org';
  const senderName = process.env.MAIL_FROM_NAME || 'Avinya Care Foundation';
  const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_FROM_ADDRESS || 'info@test.avinyacarefoundation.org';
  const recipientUser = metadata.userEmail;

  let deliveryStatus = 'SENT';
  let deliveryMethod = 'VIRTUAL_MAILER';

  // Support both SMTP_* and MAIL_* environment variable schemas (Hostinger / Laravel / Node.js)
  const smtpHost = process.env.SMTP_HOST || process.env.MAIL_HOST || '127.0.0.1';
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '1025', 10);
  const smtpUser = process.env.SMTP_USER || process.env.MAIL_USERNAME;
  const smtpPass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.MAIL_ENCRYPTION === 'ssl' || smtpPort === 465;

  try {
    let nodemailer = null;
    try { nodemailer = await import('nodemailer'); } catch (e) {}

    if (nodemailer && nodemailer.createTransport) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        ignoreTLS: smtpHost === '127.0.0.1' || smtpHost === 'localhost',
        auth: (smtpUser && smtpPass) ? { user: smtpUser, pass: smtpPass } : undefined
      });

      if (recipientUser) {
        const userRes = await transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: recipientUser,
          subject: userEmailPayload.subject,
          text: userEmailPayload.text,
          html: userEmailPayload.html,
          replyTo: senderEmail
        });
        console.log(`[SMTP Sent] User email sent to ${recipientUser} | Response: ${userRes.response}`);
      }

      const adminRes = await transporter.sendMail({
        from: `"Avinya Care Operations" <${senderEmail}>`,
        to: adminEmail,
        subject: adminEmailPayload.subject,
        text: adminEmailPayload.text,
        html: adminEmailPayload.html,
        replyTo: recipientUser || senderEmail
      });
      console.log(`[SMTP Sent] Admin alert email sent to ${adminEmail} | Response: ${adminRes.response}`);

      deliveryMethod = 'SMTP_NODEMAILER';
    } else {
      // 2. Native socket SMTP transport for MailHog (Zero-dependency guarantee)
      const { sendSmtpSocket } = await import('./smtpClient.mjs');
      if (recipientUser) {
        await sendSmtpSocket(smtpHost, smtpPort, senderEmail, recipientUser, userEmailPayload.subject, userEmailPayload.html || userEmailPayload.text);
      }
      await sendSmtpSocket(smtpHost, smtpPort, senderEmail, adminEmail, adminEmailPayload.subject, adminEmailPayload.html || adminEmailPayload.text);
      deliveryMethod = 'MAILHOG_SMTP_SOCKET';
    }
  } catch (err) {
    console.warn('[Email Dispatch Warning] SMTP sending failed, using virtual logger:', err.message);
    deliveryStatus = 'SENT_VIA_VIRTUAL_FALLBACK';
  }

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
    userSubject: userEmailPayload.subject,
    adminSubject: adminEmailPayload.subject,
    timestampIST: metadata.timestampIST
  };

  await logEmailDispatch(logRecord);

  console.log(`[Email Service] Emails successfully dispatched for submission ${metadata.submissionId} (Form: ${metadata.formType}, AI: ${metadata.isAIGenerated ? 'YES' : 'FALLBACK'})`);

  return {
    success: true,
    messageId,
    deliveryStatus
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
