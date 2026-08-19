/**
 * Automated Verification Script for Healthcare APIs and Database Engine
 */

import {
  getSpecialities,
  getHospitals,
  getDoctors,
  getDoctorById,
  getDoctorAvailableSlots,
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  getDiagnosticTests,
  createTestBooking,
  getTestBookings,
  getHealthcareStats,
  getNotificationLogs
} from '../services/healthcare/healthcareDb.mjs';

async function runTests() {
  console.log('--- STARTING HEALTHCARE SUITE TESTS ---');

  // 1. Specialities & Hospitals
  const specs = await getSpecialities();
  console.log(`✓ Specialities loaded: ${specs.length} items`);
  if (specs.length < 5) throw new Error('Expected at least 5 specialities');

  const hospitals = await getHospitals();
  console.log(`✓ Hospitals loaded: ${hospitals.length} items`);

  // 2. Doctors Directory & Filtering
  const allDocs = await getDoctors();
  console.log(`✓ Doctors loaded: ${allDocs.length} doctors`);

  const oncologyDocs = await getDoctors({ speciality: 'oncology' });
  console.log(`✓ Oncology doctors filter: ${oncologyDocs.length} found`);
  if (oncologyDocs.length === 0) throw new Error('Failed to find oncology doctors');

  const searchDocs = await getDoctors({ search: 'Priya' });
  console.log(`✓ Doctor search ("Priya"): ${searchDocs.length} found`);
  if (searchDocs.length === 0) throw new Error('Failed to search doctor Priya');

  // 3. Slot Computation
  const testDate = '2026-08-25';
  const slots = await getDoctorAvailableSlots('doc-1', testDate);
  console.log(`✓ Generated ${slots.length} slots for Dr. Priya on ${testDate}`);
  if (slots.length === 0) throw new Error('Slots computation returned 0 slots');

  const firstAvailableSlot = slots.find(s => s.available);
  if (!firstAvailableSlot) throw new Error('No available slot found');
  console.log(`✓ Selected available slot: ${firstAvailableSlot.time}`);

  // 4. Create Appointment
  const aptData = {
    doctorId: 'doc-1',
    date: testDate,
    time: firstAvailableSlot.time,
    consultationType: 'in-clinic',
    patientName: 'Test Automated Patient',
    patientPhone: '+91 99999 11111',
    patientEmail: 'test.patient@example.com',
    patientAge: 45,
    patientGender: 'Male',
    reason: 'Routine oncology health checkup',
    notes: 'Automated test suite'
  };

  const createdApt = await createAppointment(aptData);
  console.log(`✓ Created Appointment ID: ${createdApt.id} with status: ${createdApt.status}`);
  if (!createdApt.id.startsWith('AVC-APT-2026-')) throw new Error('Invalid Appointment ID format');

  // 5. Double Booking Concurrency Protection Test
  console.log('✓ Testing double-booking collision rejection...');
  let doubleBookFailed = false;
  try {
    await createAppointment(aptData);
  } catch (err) {
    doubleBookFailed = true;
    console.log(`✓ Concurrency Protection Guard Active: Correctly rejected double booking (${err.message})`);
  }
  if (!doubleBookFailed) throw new Error('Double booking guard failed! Collision was allowed.');

  // 6. Status Transition
  const updatedApt = await updateAppointmentStatus(createdApt.id, 'rescheduled', 'Dr. Priya Sharma', 'Shifted by 30 mins', testDate, '11:00 AM');
  console.log(`✓ Updated status: ${updatedApt.status}, Time: ${updatedApt.time}`);
  if (updatedApt.status !== 'rescheduled') throw new Error('Status update failed');

  // 7. Diagnostic Tests Catalog & Booking
  const tests = await getDiagnosticTests();
  console.log(`✓ Diagnostic tests catalog: ${tests.length} packages`);
  if (tests.length === 0) throw new Error('No diagnostic tests found');

  const testBooking = await createTestBooking({
    testId: 'test-1',
    collectionMethod: 'home_collection',
    homeAddress: '101, Palm Court, Worli, Mumbai',
    pincode: '400018',
    city: 'Mumbai',
    date: '2026-08-26',
    timeSlot: '08:30 AM - 09:30 AM',
    patientName: 'Test Patient Tests',
    patientPhone: '+91 99999 22222',
    patientEmail: 'test.tests@example.com',
    patientAge: 50,
    patientGender: 'Female'
  });
  console.log(`✓ Created Diagnostic Test Booking ID: ${testBooking.id}`);
  if (!testBooking.id.startsWith('AVC-TST-2026-')) throw new Error('Invalid Test Booking ID format');

  // 8. Stats & Logs
  const stats = await getHealthcareStats();
  console.log('✓ Healthcare KPIs:', stats);

  const logs = await getNotificationLogs();
  console.log(`✓ Notification audit logs entries: ${logs.length}`);

  console.log('--- ALL BACKEND HEALTHCARE TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('❌ Test suite error:', err);
  process.exit(1);
});
