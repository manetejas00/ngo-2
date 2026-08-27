/**
 * Test script to trigger and verify Diagnostic Test Booking & Appointment Booking email delivery
 * Sent to: manetejas00@gmail.com
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env variables
try {
  const envPath = join(__dirname, '../.env');
  const envContent = await readFile(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
} catch (e) {
  console.warn('Could not read .env file:', e.message);
}

import { createTestBooking, createAppointment, getDoctorAvailableSlots } from '../services/healthcare/healthcareDb.mjs';
import { renderTestBookingEmail, renderPatientAppointmentEmail, renderAdminAppointmentEmail } from '../services/healthcare/healthcareEmailTemplates.mjs';
import { sendFormEmails } from '../services/email/emailService.mjs';

async function testBookingMails() {
  const recipient = 'manetejas00@gmail.com';
  console.log(`====================================================`);
  console.log(`TESTING BOOKING EMAILS TO: ${recipient}`);
  console.log(`====================================================\n`);

  // 1. Diagnostic Test Booking
  console.log('1. Creating Diagnostic Test Booking...');
  const testBooking = await createTestBooking({
    testId: 'test-1',
    collectionMethod: 'home_collection',
    homeAddress: 'Flat 402, Sunshine Towers, Dadar West',
    pincode: '400028',
    city: 'Mumbai',
    date: '2026-09-10',
    timeSlot: '08:00 AM - 09:00 AM',
    patientName: 'Tejas Mane',
    patientPhone: '+91 98765 43210',
    patientEmail: recipient,
    patientAge: 28,
    patientGender: 'Male',
    notes: 'Test email dispatch verification for diagnostic test booking'
  });

  console.log(`   ✓ Created Test Booking ID: ${testBooking.id}`);
  console.log(`   ✓ Test Package: ${testBooking.testName}`);

  console.log('\n2. Rendering & Dispatching Diagnostic Test Email...');
  const testEmailPayload = renderTestBookingEmail(testBooking);

  const testEmailResult = await sendFormEmails(testEmailPayload, testEmailPayload, {
    submissionId: testBooking.id,
    formType: 'diagnostic_test',
    userEmail: recipient,
    timestampIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
  });

  console.log('   ✓ Diagnostic Test Email Result:', JSON.stringify(testEmailResult, null, 2));

  // 2. Doctor Appointment Booking
  console.log('\n3. Creating Doctor Appointment Booking...');
  const dateStr = '2026-09-15';
  const slots = await getDoctorAvailableSlots('doc-1', dateStr);
  const availSlot = slots.find(s => s.available) || { time: '11:30 AM' };

  const appointment = await createAppointment({
    doctorId: 'doc-1',
    date: dateStr,
    time: availSlot.time,
    consultationType: 'in-clinic',
    patientName: 'Tejas Mane',
    patientPhone: '+91 98765 43210',
    patientEmail: recipient,
    patientAge: 28,
    patientGender: 'Male',
    reason: 'Routine consultation & test review',
    notes: 'Test email dispatch verification for doctor appointment'
  });

  console.log(`   ✓ Created Appointment ID: ${appointment.id}`);
  console.log(`   ✓ Doctor: ${appointment.doctorName} (${appointment.speciality})`);

  console.log('\n4. Rendering & Dispatching Doctor Appointment Email...');
  const patientAptPayload = renderPatientAppointmentEmail(appointment);
  const adminAptPayload = renderAdminAppointmentEmail(appointment);

  const aptEmailResult = await sendFormEmails(patientAptPayload, adminAptPayload, {
    submissionId: appointment.id,
    formType: 'appointment',
    userEmail: recipient,
    timestampIST: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
  });

  console.log('   ✓ Doctor Appointment Email Result:', JSON.stringify(aptEmailResult, null, 2));

  console.log('\n====================================================');
  if (testEmailResult.success && aptEmailResult.success) {
    console.log('🎉 ALL BOOKING TEST EMAILS DISPATCHED SUCCESSFULLY TO ' + recipient);
  } else {
    console.log('⚠️ EMAIL DISPATCH FINISHED WITH PARTIAL OR FAILED STATUS');
  }
  console.log('====================================================');
}

testBookingMails().catch(err => {
  console.error('❌ Test email script failed:', err);
  process.exit(1);
});
