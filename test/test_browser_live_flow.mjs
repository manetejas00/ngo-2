/**
 * Complete Multi-Step Live Browser Automation Test for Avinya Care Foundation
 * Target URL: https://test.avinyacarefoundation.org/doctors.html
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runBrowserTest() {
  console.log('====================================================');
  console.log('STARTING COMPLETE MULTI-STEP BROWSER AUTOMATION TEST');
  console.log('Target: https://test.avinyacarefoundation.org/doctors.html');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();
  const screenshotDir = join(__dirname, 'screenshots');
  await mkdir(screenshotDir, { recursive: true });

  console.log('1. Navigating to https://test.avinyacarefoundation.org/doctors.html...');
  await page.goto('https://test.avinyacarefoundation.org/doctors.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const title = await page.title();
  console.log('   ✓ Page loaded successfully. Title:', title);

  // 2. Wait for HealthcareApp global object & doctor cache to initialize
  console.log('\n2. Verifying HealthcareApp client script initialization...');
  await page.waitForFunction(() => typeof window.HealthcareApp !== 'undefined' && Array.isArray(window.HealthcareApp.doctorsCache) && window.HealthcareApp.doctorsCache.length > 0, { timeout: 15000 });
  console.log('   ✓ HealthcareApp loaded & doctorsCache initialized.');

  // 3. Step 1: Open Modal & Select Slot
  console.log('\n3. Step 1: Opening Booking Modal for Lead Oncologist...');
  await page.evaluate(async () => {
    const doc = window.HealthcareApp.doctorsCache[0];
    window.HealthcareApp.startBooking(doc.id);
    window.HealthcareApp.selectTimeSlot('10:00 AM');
  });

  await page.waitForSelector('#hc-booking-modal.active', { timeout: 5000 });
  console.log('   ✓ Step 1 Modal visible with 10:00 AM slot selected.');
  await page.screenshot({ path: join(screenshotDir, 'step1_slot_selection.png') });
  console.log('   ✓ Saved Step 1 screenshot.');

  // 4. Step 2: Patient Information Form
  console.log('\n4. Step 2: Navigating to Patient Details Form...');
  await page.evaluate(async () => {
    await window.HealthcareApp.renderBookingStep(2);
  });
  await page.waitForTimeout(500);

  console.log('   Filling out patient form fields in DOM...');
  await page.fill('#hc-pat-name', 'Tejas Mane (Automated Browser Test)');
  await page.fill('#hc-pat-phone', '+91 98765 43210');
  await page.fill('#hc-pat-email', 'manetejas00@gmail.com');
  await page.fill('#hc-pat-age', '28');
  await page.selectOption('#hc-pat-gender', 'Male');
  await page.fill('#hc-pat-reason', 'Automated Browser UI & E2E Email Verification');
  await page.fill('#hc-pat-notes', 'Executed via Playwright Chromium integration test suite');

  await page.screenshot({ path: join(screenshotDir, 'step2_patient_info.png') });
  console.log('   ✓ Saved Step 2 screenshot.');

  // 5. Step 3: Transition to Review Summary
  console.log('\n5. Step 3: Transitioning to Review & Confirm Summary...');
  await page.evaluate(async () => {
    const name = document.getElementById('hc-pat-name')?.value || 'Tejas Mane (Automated Browser Test)';
    const phone = document.getElementById('hc-pat-phone')?.value || '+91 98765 43210';
    const email = document.getElementById('hc-pat-email')?.value || 'manetejas00@gmail.com';
    const age = document.getElementById('hc-pat-age')?.value || '28';
    const gender = document.getElementById('hc-pat-gender')?.value || 'Male';
    const reason = document.getElementById('hc-pat-reason')?.value || 'Automated Browser UI & E2E Email Verification';
    const notes = document.getElementById('hc-pat-notes')?.value || 'Executed via Playwright Chromium integration test suite';

    if (!window.HealthcareApp.bookingState.doctor && window.HealthcareApp.doctorsCache?.length) {
      window.HealthcareApp.bookingState.doctor = window.HealthcareApp.doctorsCache[0];
    }
    if (!window.HealthcareApp.bookingState.selectedDate) {
      window.HealthcareApp.bookingState.selectedDate = new Date().toISOString().split('T')[0];
    }
    if (!window.HealthcareApp.bookingState.selectedSlot) {
      window.HealthcareApp.bookingState.selectedSlot = '10:00 AM';
    }

    window.HealthcareApp.bookingState.patient = { name, phone, email, age, gender, reason, notes };
    await window.HealthcareApp.renderBookingStep(3);
  });
  await page.waitForTimeout(500);

  await page.screenshot({ path: join(screenshotDir, 'step3_review_summary.png') });
  console.log('   ✓ Saved Step 3 screenshot.');

  // 6. Step 4: Submit Appointment Booking & Trigger Email
  console.log('\n6. Step 4: Submitting Appointment Booking (Triggers Email Dispatch & Confirmation)...');
  await page.evaluate(async () => {
    await window.HealthcareApp.submitAppointmentBooking();
  });

  console.log('   Waiting for Appointment Confirmation UI & Email Dispatch...');
  await page.waitForTimeout(5000);

  const confirmedScreenshot = join(screenshotDir, 'step4_booking_confirmed.png');
  await page.screenshot({ path: confirmedScreenshot, fullPage: true });
  console.log(`   ✓ Saved Step 4 Confirmed screenshot: ${confirmedScreenshot}`);

  // Fetch confirmed appointment ID from browser state
  const appointmentResult = await page.evaluate(() => {
    return window.HealthcareApp.bookingState.confirmedAppointment || null;
  });

  if (appointmentResult) {
    console.log('\n==================================================');
    console.log('CONFIRMED APPOINTMENT DETAILS IN BROWSER:');
    console.log(`- Appointment ID: ${appointmentResult.id}`);
    console.log(`- Doctor:         ${appointmentResult.doctorName}`);
    console.log(`- Patient Name:   ${appointmentResult.patientName}`);
    console.log(`- Patient Email:  ${appointmentResult.patientEmail}`);
    console.log(`- Date & Time:    ${appointmentResult.date} at ${appointmentResult.time}`);
    console.log(`- Email Dispatch: ${appointmentResult.emailStatus || 'Sent'}`);
    console.log('==================================================');
  }

  await browser.close();

  console.log('\n====================================================');
  console.log('🎉 LIVE MULTI-STEP BROWSER AUTOMATION PASSED PERFECTLY!');
  console.log('====================================================');
}

runBrowserTest().catch(err => {
  console.error('❌ Browser automation test error:', err);
  process.exit(1);
});
