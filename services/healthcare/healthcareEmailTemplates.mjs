/**
 * Avinya Care Foundation - Healthcare Email Template Generator
 * Produces responsive, branded HTML & Plain Text emails for Appointments & Diagnostic Tests.
 */

import { escapeHTML } from '../email/emailTemplate.mjs';

function renderEmailLayout(title, preheader, contentHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 24px rgba(8, 127, 115, 0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A0A0A 0%, #171717 100%); padding: 28px 32px; text-align: center; border-bottom: 3px solid #F47528;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #FFFFFF; border-radius: 50%; padding: 6px; box-shadow: 0 4px 12px rgba(244, 117, 40, 0.3);">
                      <img src="https://avinyacare.org/assets/logo.png" alt="Avinya Care Foundation" width="52" height="52" style="display: block; width: 52px; height: 52px; border: 0;" />
                    </div>
                  </td>
                </tr>
              </table>
              <div style="color: #F58220; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">Avinya Care Healthcare Platform</div>
              <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">${escapeHTML(title)}</h1>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Help & Emergency Box -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 14px 16px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 2px;">📞 Need Immediate Assistance or Rescheduling?</div>
                    <div style="font-size: 12px; color: #15803D; line-height: 1.5;">
                      Call our 24/7 patient helpline at <strong>+91 98765 43210</strong> or email <a href="mailto:support@avinyacarefoundation.org" style="color: #166534; font-weight: 600;">support@avinyacarefoundation.org</a>.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 24px 32px; text-align: center; border-top: 1px solid #262626;">
              <p style="margin: 0 0 6px 0; color: #FFFFFF; font-size: 13px; font-weight: 600;">Avinya Care Foundation</p>
              <p style="margin: 0 0 12px 0; color: #A3A3A3; font-size: 11px; line-height: 1.5;">
                A humanitarian oncology and healthcare initiative.<br>
                80G & 12A Tax Exempted under the Indian IT Act.
              </p>
              <div style="font-size: 10px; color: #737373;">
                © 2026 Avinya Care Foundation. All healthcare records strictly confidential.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Patient Appointment Confirmation Email
 */
export function renderPatientAppointmentEmail(apt) {
  const subject = `Appointment Booking Confirmation – Avinyacare [${apt.id}]`;
  const isOnline = apt.consultationType === 'online';

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #0F172A;">
      Dear <strong>${escapeHTML(apt.patientName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
      Your appointment with <strong>${escapeHTML(apt.doctorName)}</strong> has been successfully booked and confirmed through Avinyacare Foundation.
    </p>

    <!-- Appointment Summary Card -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="background-color: #087F73; padding: 12px 20px; color: #FFFFFF; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Appointment Details
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
            <tr>
              <td width="38%" style="font-size: 13px; color: #64748B; font-weight: 600;">Appointment ID:</td>
              <td style="font-size: 14px; color: #0F172A; font-weight: 800; font-family: monospace;">${escapeHTML(apt.id)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Doctor:</td>
              <td style="font-size: 14px; color: #0F172A; font-weight: 700;">${escapeHTML(apt.doctorName)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Speciality:</td>
              <td style="font-size: 13px; color: #334155;">${escapeHTML(apt.doctorSpeciality)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Date & Time:</td>
              <td style="font-size: 14px; color: #087F73; font-weight: 800;">${escapeHTML(apt.date)} at ${escapeHTML(apt.time)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Consultation Type:</td>
              <td style="font-size: 13px; color: #0F172A;">
                <span style="display: inline-block; background-color: ${isOnline ? '#EFF6FF' : '#F0FDF4'}; color: ${isOnline ? '#1D4ED8' : '#15803D'}; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                  ${isOnline ? '🌐 Online Telehealth Video' : '🏥 In-Clinic Visit'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Location / Link:</td>
              <td style="font-size: 13px; color: #334155;">${escapeHTML(apt.location)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Consultation Fee:</td>
              <td style="font-size: 13px; color: #0F172A; font-weight: 700;">${apt.doctorFee === 0 ? '₹0 (Avinya Supported / Free)' : `₹${apt.doctorFee}`}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Reason:</td>
              <td style="font-size: 13px; color: #334155;">${escapeHTML(apt.reason || 'General Health Consultation')}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background-color: #FFF7ED; border-left: 4px solid #F47528; border-radius: 4px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #9A3412; line-height: 1.5;">
      <strong>Preparation Instructions:</strong><br>
      Please keep your previous medical records, prescription history, and test reports accessible during your consultation. For in-clinic visits, please arrive 15 minutes prior to your scheduled time.
    </div>
  `;

  const text = `Avinya Care Foundation - Appointment Confirmation
Appointment ID: ${apt.id}
Doctor: ${apt.doctorName} (${apt.doctorSpeciality})
Date: ${apt.date} at ${apt.time}
Type: ${apt.consultationType}
Location: ${apt.location}
Patient: ${apt.patientName} (${apt.patientPhone})
Fee: ₹${apt.doctorFee}
Reason: ${apt.reason || 'Consultation'}

Helpline: +91 98765 43210`;

  return {
    subject,
    html: renderEmailLayout('Appointment Confirmed', 'Your appointment booking confirmation with Avinyacare', contentHtml),
    text
  };
}

/**
 * 2. Doctor Notification Email
 */
export function renderDoctorAppointmentEmail(apt) {
  const subject = `New Patient Appointment – Avinyacare [${apt.id}]`;
  const isOnline = apt.consultationType === 'online';

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #0F172A;">
      Dear <strong>${escapeHTML(apt.doctorName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
      A new patient consultation has been scheduled with you through the Avinyacare healthcare portal.
    </p>

    <!-- Patient Case Summary -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="background-color: #1E293B; padding: 12px 20px; color: #FFFFFF; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Patient & Consultation Overview
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
            <tr>
              <td width="38%" style="font-size: 13px; color: #64748B; font-weight: 600;">Appointment ID:</td>
              <td style="font-size: 14px; color: #0F172A; font-weight: 800; font-family: monospace;">${escapeHTML(apt.id)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Patient Name:</td>
              <td style="font-size: 14px; color: #0F172A; font-weight: 700;">${escapeHTML(apt.patientName)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Age & Gender:</td>
              <td style="font-size: 13px; color: #334155;">${apt.patientAge} Years / ${escapeHTML(apt.patientGender)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Contact:</td>
              <td style="font-size: 13px; color: #334155;">${escapeHTML(apt.patientPhone)} | ${escapeHTML(apt.patientEmail)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Scheduled Slot:</td>
              <td style="font-size: 14px; color: #087F73; font-weight: 800;">${escapeHTML(apt.date)} at ${escapeHTML(apt.time)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Mode:</td>
              <td style="font-size: 13px; color: #0F172A; font-weight: 600;">${isOnline ? 'Online Video Teleconsult' : 'In-Clinic Consultation'}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Clinical Reason:</td>
              <td style="font-size: 13px; color: #0F172A; font-weight: 600;">${escapeHTML(apt.reason || 'General Consultation')}</td>
            </tr>
            ${apt.notes ? `
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Patient Notes:</td>
              <td style="font-size: 13px; color: #475569; font-style: italic;">${escapeHTML(apt.notes)}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `Avinya Care Foundation - New Patient Scheduled
Appointment ID: ${apt.id}
Doctor: ${apt.doctorName}
Patient: ${apt.patientName} (${apt.patientAge} Y, ${apt.patientGender})
Contact: ${apt.patientPhone}
Date/Time: ${apt.date} at ${apt.time}
Type: ${apt.consultationType}
Reason: ${apt.reason}`;

  return {
    subject,
    html: renderEmailLayout('New Patient Appointment', 'New patient consultation booked on Avinyacare', contentHtml),
    text
  };
}

/**
 * 3. Admin Operational Appointment Notification
 */
export function renderAdminAppointmentEmail(apt) {
  const subject = `New Appointment Booked – [${apt.id}]`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #0F172A;">
      A new clinical appointment has been registered on the platform.
    </p>

    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="background-color: #F47528; padding: 12px 20px; color: #FFFFFF; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Operational Audit Record
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
            <tr>
              <td width="35%" style="font-size: 13px; color: #64748B;">Appointment ID:</td>
              <td style="font-size: 14px; font-weight: 800; color: #F47528; font-family: monospace;">${escapeHTML(apt.id)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Patient:</td>
              <td style="font-size: 13px; font-weight: 700; color: #0F172A;">${escapeHTML(apt.patientName)} (${escapeHTML(apt.patientPhone)}, ${escapeHTML(apt.patientEmail)})</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Doctor:</td>
              <td style="font-size: 13px; font-weight: 700; color: #0F172A;">${escapeHTML(apt.doctorName)} — ${escapeHTML(apt.doctorSpeciality)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Hospital / Center:</td>
              <td style="font-size: 13px; color: #334155;">${escapeHTML(apt.doctorHospital)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Schedule:</td>
              <td style="font-size: 13px; font-weight: 700; color: #087F73;">${escapeHTML(apt.date)} at ${escapeHTML(apt.time)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Mode:</td>
              <td style="font-size: 13px; color: #334155;">${escapeHTML(apt.consultationType)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Initial Status:</td>
              <td style="font-size: 13px; font-weight: 700; color: #16A34A; text-transform: uppercase;">${escapeHTML(apt.status)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `Admin Alert: New Appointment Booked
ID: ${apt.id}
Patient: ${apt.patientName} (${apt.patientPhone})
Doctor: ${apt.doctorName}
Date/Time: ${apt.date} at ${apt.time}
Status: ${apt.status}`;

  return {
    subject,
    html: renderEmailLayout('New Booking Alert', 'Operational booking notification', contentHtml),
    text
  };
}

/**
 * 4. Status Change Email (Cancelled, Rescheduled, Completed, Confirmed)
 */
export function renderAppointmentStatusEmail(apt, statusType, notes = '') {
  let title = 'Appointment Status Updated';
  let badgeColor = '#087F73';

  if (statusType === 'cancelled') {
    title = 'Appointment Cancelled';
    badgeColor = '#DC2626';
  } else if (statusType === 'rescheduled') {
    title = 'Appointment Rescheduled';
    badgeColor = '#F58220';
  } else if (statusType === 'completed') {
    title = 'Consultation Completed';
    badgeColor = '#16A34A';
  }

  const subject = `Appointment ${statusType.toUpperCase()} – Avinyacare [${apt.id}]`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #0F172A;">
      Dear <strong>${escapeHTML(apt.patientName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
      Your appointment <strong>${escapeHTML(apt.id)}</strong> with <strong>${escapeHTML(apt.doctorName)}</strong> has been marked as 
      <span style="display: inline-block; background-color: ${badgeColor}; color: #FFFFFF; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
        ${escapeHTML(statusType)}
      </span>.
    </p>

    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
            <tr>
              <td width="35%" style="font-size: 13px; color: #64748B;">Appointment ID:</td>
              <td style="font-size: 14px; font-weight: 800; font-family: monospace;">${escapeHTML(apt.id)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Doctor:</td>
              <td style="font-size: 13px; font-weight: 700;">${escapeHTML(apt.doctorName)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B;">Date & Time:</td>
              <td style="font-size: 13px; font-weight: 700; color: #087F73;">${escapeHTML(apt.date)} at ${escapeHTML(apt.time)}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="font-size: 13px; color: #64748B;">Status Remarks:</td>
              <td style="font-size: 13px; color: #334155;">${escapeHTML(notes)}</td>
            </tr>` : ''}
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `Avinya Care Foundation - Appointment Status: ${statusType.toUpperCase()}
ID: ${apt.id}
Doctor: ${apt.doctorName}
Schedule: ${apt.date} at ${apt.time}
Remarks: ${notes}`;

  return {
    subject,
    html: renderEmailLayout(title, `Appointment ${statusType}`, contentHtml),
    text
  };
}

/**
 * 5. Diagnostic Test Booking Email
 */
export function renderTestBookingEmail(booking) {
  const isHome = booking.collectionMethod === 'home_collection';
  const subject = `Diagnostic Test Booking Confirmation – Avinyacare [${booking.id}]`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #0F172A;">
      Dear <strong>${escapeHTML(booking.patientName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
      Your diagnostic test booking for <strong>${escapeHTML(booking.testName)}</strong> has been scheduled successfully.
    </p>

    <!-- Test Summary Card -->
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="background-color: #087F73; padding: 12px 20px; color: #FFFFFF; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Diagnostic Test Booking Summary
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
            <tr>
              <td width="38%" style="font-size: 13px; color: #64748B; font-weight: 600;">Booking ID:</td>
              <td style="font-size: 14px; color: #0F172A; font-weight: 800; font-family: monospace;">${escapeHTML(booking.id)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Test Package:</td>
              <td style="font-size: 14px; color: #0F172A; font-weight: 700;">${escapeHTML(booking.testName)}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Collection Mode:</td>
              <td style="font-size: 13px; color: #0F172A;">
                <span style="display: inline-block; background-color: ${isHome ? '#F0FDF4' : '#EFF6FF'}; color: ${isHome ? '#15803D' : '#1D4ED8'}; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                  ${isHome ? '🏠 Home Sample Collection' : '🔬 Visit Diagnostic Centre'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Date & Time Slot:</td>
              <td style="font-size: 14px; color: #087F73; font-weight: 800;">${escapeHTML(booking.date)} (${escapeHTML(booking.timeSlot)})</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Location Details:</td>
              <td style="font-size: 13px; color: #334155;">
                ${isHome ? `${escapeHTML(booking.homeAddress)}, Pincode: ${escapeHTML(booking.pincode)}` : `${escapeHTML(booking.centreName)}, ${escapeHTML(booking.centreAddress)}`}
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #64748B; font-weight: 600;">Total Package Fee:</td>
              <td style="font-size: 14px; color: #0F172A; font-weight: 800;">₹${escapeHTML(booking.price)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `Avinya Care Foundation - Test Booking Confirmation
Booking ID: ${booking.id}
Test: ${booking.testName}
Collection: ${booking.collectionMethod}
Schedule: ${booking.date} (${booking.timeSlot})
Patient: ${booking.patientName} (${booking.patientPhone})
Price: ₹${booking.price}`;

  return {
    subject,
    html: renderEmailLayout('Diagnostic Test Confirmed', 'Diagnostic test booking confirmation', contentHtml),
    text
  };
}
