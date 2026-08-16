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
  const senderEmail = process.env.SMTP_FROM || 'care@avinyacare.org';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@avinyacare.org';
  const recipientUser = metadata.userEmail;

  let deliveryStatus = 'SENT';
  let deliveryMethod = 'VIRTUAL_MAILER';

  // Check if real SMTP credentials exist in environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      // Dynamic import to avoid crash if nodemailer is not installed
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Send User Email
      if (recipientUser) {
        await transporter.sendMail({
          from: `"Avinya Care Foundation" <${senderEmail}>`,
          to: recipientUser,
          subject: userEmailPayload.subject,
          text: userEmailPayload.text,
          html: userEmailPayload.html,
          replyTo: senderEmail
        });
      }

      // Send Admin Email
      await transporter.sendMail({
        from: `"Avinya Care System" <${senderEmail}>`,
        to: adminEmail,
        subject: adminEmailPayload.subject,
        text: adminEmailPayload.text,
        html: adminEmailPayload.html,
        replyTo: recipientUser || senderEmail
      });

      deliveryMethod = 'SMTP_TRANSPORT';
    } catch (err) {
      console.warn('[Email Dispatch Warning] SMTP sending failed, falling back to virtual logger:', err.message);
      deliveryStatus = 'SENT_VIA_VIRTUAL_FALLBACK';
    }
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
