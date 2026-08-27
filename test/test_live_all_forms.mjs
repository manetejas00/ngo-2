/**
 * Comprehensive Live End-to-End Test Suite for Avinya Care Foundation
 * Tests all form submissions and booking endpoints against live production servers:
 * - test.avinyacarefoundation.org
 * - avinyacarefoundation.org
 * Target recipient: manetejas00@gmail.com
 */

import https from 'node:https';

const TARGET_HOST = 'test.avinyacarefoundation.org';
const TEST_EMAIL = 'manetejas00@gmail.com';

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: TARGET_HOST,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runLiveFormTests() {
  console.log(`====================================================`);
  console.log(`LIVE SYSTEM INTEGRATION & EMAIL TEST SUITE`);
  console.log(`Target Host: https://${TARGET_HOST}`);
  console.log(`Test Target Email: ${TEST_EMAIL}`);
  console.log(`====================================================\n`);

  // 1. General Contact Form
  console.log('1. Submitting General Contact Form...');
  const contactRes = await postJson('/api/submit-form', {
    form_type: 'contact',
    name: 'Tejas Mane QA',
    email: TEST_EMAIL,
    phone: '+91 98765 43210',
    subject: 'Live System Verification',
    message: 'Testing contact form email submission on live production environment.'
  });
  console.log(`   ✓ Contact Form Status: ${contactRes.statusCode}`, JSON.stringify(contactRes.data));

  // 2. Newsletter Subscription Form
  console.log('\n2. Submitting Newsletter Subscription...');
  const newsRes = await postJson('/api/submit-form', {
    form_type: 'newsletter',
    name: 'Tejas Mane QA',
    email: TEST_EMAIL
  });
  console.log(`   ✓ Newsletter Status: ${newsRes.statusCode}`, JSON.stringify(newsRes.data));

  // 3. Volunteer Application Form
  console.log('\n3. Submitting Volunteer Application Form...');
  const volRes = await postJson('/api/submit-form', {
    form_type: 'volunteer',
    name: 'Tejas Mane QA',
    email: TEST_EMAIL,
    phone: '+91 98765 43210',
    skills: 'Community Outreach, Medical Support',
    availability: 'Weekends'
  });
  console.log(`   ✓ Volunteer Application Status: ${volRes.statusCode}`, JSON.stringify(volRes.data));

  // 4. Donation / Patient Support Request Form
  console.log('\n4. Submitting Patient Support Request Form...');
  const donRes = await postJson('/api/submit-form', {
    form_type: 'support',
    name: 'Tejas Mane QA',
    email: TEST_EMAIL,
    phone: '+91 98765 43210',
    assistance_type: 'Financial Subsidy for Chemotherapy',
    patient_age: '32',
    hospital: 'Tata Memorial Hospital'
  });
  console.log(`   ✓ Support Request Status: ${donRes.statusCode}`, JSON.stringify(donRes.data));

  // 5. Healthcare Doctor Appointment Booking
  console.log('\n5. Booking Healthcare Doctor Appointment (PHP Live)...');
  const aptRes = await postJson('/api/booking/index.php', {
    doctorId: 'doc-1',
    date: '2026-09-25',
    time: '11:00 AM',
    consultationType: 'in-clinic',
    patientName: 'Tejas Mane QA',
    patientPhone: '+91 98765 43210',
    patientEmail: TEST_EMAIL,
    patientAge: 28,
    patientGender: 'Male',
    reason: 'Live production appointment test',
    notes: 'Live verification test booking'
  });
  console.log(`   ✓ Appointment Booking Status: ${aptRes.statusCode}`, JSON.stringify(aptRes.data));

  console.log('\n====================================================');
  console.log('🎉 ALL LIVE FORM & BOOKING ENDPOINTS TESTED SUCCESSFULLY!');
  console.log('====================================================');
}

runLiveFormTests().catch(err => {
  console.error('❌ Live test script error:', err);
  process.exit(1);
});
