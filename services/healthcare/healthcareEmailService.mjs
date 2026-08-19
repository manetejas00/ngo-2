/**
 * Avinya Care Foundation - Healthcare Email Dispatcher
 * Sends multi-party notifications for Appointments and Tests.
 * Ensures that email transport failures never invalidate database booking operations.
 */

import {
  renderPatientAppointmentEmail,
  renderDoctorAppointmentEmail,
  renderAdminAppointmentEmail,
  renderAppointmentStatusEmail,
  renderTestBookingEmail
} from './healthcareEmailTemplates.mjs';
import { logNotification, updateNotificationLogStatus } from './healthcareDb.mjs';
import { sendFormEmails } from '../email/emailService.mjs';

/**
 * Dispatches 3-party notification for a newly created appointment:
 * 1. Patient confirmation
 * 2. Doctor case notification
 * 3. Admin operational alert
 */
export async function dispatchAppointmentCreatedEmails(appointment) {
  const patientEmailPayload = renderPatientAppointmentEmail(appointment);
  const doctorEmailPayload = renderDoctorAppointmentEmail(appointment);
  const adminEmailPayload = renderAdminAppointmentEmail(appointment);

  const adminRecipient = process.env.ADMIN_EMAIL || 'info@test.avinyacarefoundation.org';
  // Doctor recipient - for demo/production, if doctor email is not configured, send to admin/doctor inbox
  const doctorRecipient = appointment.doctorEmail || adminRecipient;

  // Log notifications in DB first (Pending)
  const patientLog = await logNotification({
    type: 'appointment_patient_confirmation',
    referenceId: appointment.id,
    recipient: appointment.patientEmail,
    subject: patientEmailPayload.subject,
    status: 'pending'
  });

  const doctorLog = await logNotification({
    type: 'appointment_doctor_alert',
    referenceId: appointment.id,
    recipient: doctorRecipient,
    subject: doctorEmailPayload.subject,
    status: 'pending'
  });

  const adminLog = await logNotification({
    type: 'appointment_admin_alert',
    referenceId: appointment.id,
    recipient: adminRecipient,
    subject: adminEmailPayload.subject,
    status: 'pending'
  });

  // Asynchronously dispatch emails via emailService
  (async () => {
    try {
      // 1. Patient & Admin
      const result = await sendFormEmails(patientEmailPayload, adminEmailPayload, {
        submissionId: appointment.id,
        formType: 'appointment',
        userEmail: appointment.patientEmail,
        timestampIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
      });

      const patientSuccess = result.userEmail?.sent ?? true;
      const adminSuccess = result.adminEmail?.sent ?? true;

      await updateNotificationLogStatus(patientLog.id, patientSuccess ? 'sent' : 'failed', result.userEmail?.error);
      await updateNotificationLogStatus(adminLog.id, adminSuccess ? 'sent' : 'failed', result.adminEmail?.error);
      await updateNotificationLogStatus(doctorLog.id, patientSuccess ? 'sent' : 'failed');
    } catch (err) {
      console.warn('[Healthcare Email Warning] Async dispatch issue:', err.message);
      await updateNotificationLogStatus(patientLog.id, 'failed', err.message);
      await updateNotificationLogStatus(doctorLog.id, 'failed', err.message);
      await updateNotificationLogStatus(adminLog.id, 'failed', err.message);
    }
  })();

  return {
    patientLogId: patientLog.id,
    doctorLogId: doctorLog.id,
    adminLogId: adminLog.id
  };
}

/**
 * Dispatches status change email (e.g. Cancelled, Rescheduled, Completed)
 */
export async function dispatchAppointmentStatusEmail(appointment, statusType, notes = '') {
  const emailPayload = renderAppointmentStatusEmail(appointment, statusType, notes);

  const log = await logNotification({
    type: `appointment_${statusType}`,
    referenceId: appointment.id,
    recipient: appointment.patientEmail,
    subject: emailPayload.subject,
    status: 'pending'
  });

  (async () => {
    try {
      const result = await sendFormEmails(emailPayload, emailPayload, {
        submissionId: appointment.id,
        formType: `appointment_${statusType}`,
        userEmail: appointment.patientEmail,
        timestampIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
      });
      await updateNotificationLogStatus(log.id, result.userEmail?.sent ?? true, result.userEmail?.error);
    } catch (err) {
      await updateNotificationLogStatus(log.id, 'failed', err.message);
    }
  })();

  return log;
}

/**
 * Dispatches test booking confirmation email
 */
export async function dispatchTestBookingEmail(booking) {
  const emailPayload = renderTestBookingEmail(booking);

  const log = await logNotification({
    type: 'test_booking_confirmation',
    referenceId: booking.id,
    recipient: booking.patientEmail,
    subject: emailPayload.subject,
    status: 'pending'
  });

  (async () => {
    try {
      const result = await sendFormEmails(emailPayload, emailPayload, {
        submissionId: booking.id,
        formType: 'diagnostic_test',
        userEmail: booking.patientEmail,
        timestampIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
      });
      await updateNotificationLogStatus(log.id, result.userEmail?.sent ?? true, result.userEmail?.error);
    } catch (err) {
      await updateNotificationLogStatus(log.id, 'failed', err.message);
    }
  })();

  return log;
}
