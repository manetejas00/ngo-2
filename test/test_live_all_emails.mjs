/**
 * Comprehensive Live Email Integration Test Suite
 * Target Host: https://test.avinyacarefoundation.org
 * Target Email: manetejas00@gmail.com
 *
 * Tests all 9 live form & booking endpoints to verify deliverability for both User emails and Admin emails:
 * 1. General Contact Form
 * 2. Newsletter Subscription
 * 3. Volunteer Application
 * 4. Patient Support Inquiry
 * 5. Donation Receipt & 80G Form
 * 6. CSR & Corporate Partnership Inquiry
 * 7. Website Feedback Form
 * 8. Doctor Appointment Booking (PHP Live)
 * 9. Diagnostic Test Package Booking (PHP Live)
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

async function runLiveEmailTests() {
  console.log(`====================================================`);
  console.log(`LIVE EMAIL INTEGRATION & ADMIN EMAIL TEST SUITE`);
  console.log(`Target Host: https://${TARGET_HOST}`);
  console.log(`Test Email Recipient: ${TEST_EMAIL}`);
  console.log(`====================================================\n`);

  const results = [];

  // 1. General Contact Form
  console.log('1. Testing Contact Form Email...');
  const contactRes = await postJson('/api/submit-form.php', {
    form_type: 'contact',
    name: 'Tejas Mane Live Test',
    email: TEST_EMAIL,
    phone: '+91 98765 43210',
    subject: 'Live Contact Form Email Test',
    message: 'Testing contact form email deliverability to user and admin recipients.'
  });
  console.log(`   Status: ${contactRes.statusCode}`, JSON.stringify(contactRes.data));
  results.push({ name: 'Contact Form', res: contactRes });

  // 2. Newsletter Subscription Form
  console.log('\n2. Testing Newsletter Form Email...');
  const newsRes = await postJson('/api/submit-form.php', {
    form_type: 'newsletter',
    name: 'Tejas Mane Live Test',
    email: TEST_EMAIL
  });
  console.log(`   Status: ${newsRes.statusCode}`, JSON.stringify(newsRes.data));
  results.push({ name: 'Newsletter Subscription', res: newsRes });

  // 3. Volunteer Application Form
  console.log('\n3. Testing Volunteer Application Email...');
  const volRes = await postJson('/api/submit-form.php', {
    form_type: 'volunteer',
    name: 'Tejas Mane Live Test',
    email: TEST_EMAIL,
    phone: '+91 98765 43210',
    skills: 'Medical Outreach, Cancer Awareness',
    availability: 'Weekends'
  });
  console.log(`   Status: ${volRes.statusCode}`, JSON.stringify(volRes.data));
  results.push({ name: 'Volunteer Application', res: volRes });

  // 4. Patient Support Inquiry
  console.log('\n4. Testing Patient Support Inquiry Email...');
  const suppRes = await postJson('/api/submit-form.php', {
    form_type: 'support',
    name: 'Tejas Mane Live Test',
    email: TEST_EMAIL,
    phone: '+91 98765 43210',
    assistance_type: 'Financial Subsidy & Diagnostic Navigation',
    patient_age: '35',
    hospital: 'Tata Memorial Center'
  });
  console.log(`   Status: ${suppRes.statusCode}`, JSON.stringify(suppRes.data));
  results.push({ name: 'Patient Support Inquiry', res: suppRes });

  // 5. Donation Form (80G Tax Receipt)
  console.log('\n5. Testing Donation Receipt & 80G Email...');
  const donRes = await postJson('/api/submit-form.php', {
    form_type: 'donation',
    name: 'Tejas Mane Live Test',
    email: TEST_EMAIL,
    phone: '+91 98765 43210',
    amount: 2500,
    frequency: 'one-time',
    pan: 'ABCDE1234F',
    transaction_id: 'TXN-TEST-' + Date.now()
  });
  console.log(`   Status: ${donRes.statusCode}`, JSON.stringify(donRes.data));
  results.push({ name: 'Donation Receipt', res: donRes });

  // 6. Partnership & CSR Inquiry
  console.log('\n6. Testing CSR & Partnership Email...');
  const partRes = await postJson('/api/submit-form.php', {
    form_type: 'partnership',
    name: 'Tejas Mane Live Test',
    email: TEST_EMAIL,
    phone: '+91 98765 43210',
    organization: 'Avinya Tech Solutions',
    message: 'CSR Collaboration inquiry for mobile screening bus.'
  });
  console.log(`   Status: ${partRes.statusCode}`, JSON.stringify(partRes.data));
  results.push({ name: 'CSR & Partnership Inquiry', res: partRes });

  // 7. Feedback Form
  console.log('\n7. Testing Feedback Form Email...');
  const feedRes = await postJson('/api/submit-form.php', {
    form_type: 'feedback',
    name: 'Tejas Mane Live Test',
    email: TEST_EMAIL,
    message: 'Great platform experience and clean responsive UI!'
  });
  console.log(`   Status: ${feedRes.statusCode}`, JSON.stringify(feedRes.data));
  results.push({ name: 'Feedback Form', res: feedRes });

  // 8. Healthcare Doctor Appointment Booking
  console.log('\n8. Testing Doctor Appointment Booking Email...');
  const aptRes = await postJson('/api/booking/index.php', {
    doctorId: 'doc-1',
    date: '2026-09-28',
    time: '11:30 AM',
    consultationType: 'in-clinic',
    patientName: 'Tejas Mane Live Test',
    patientPhone: '+91 98765 43210',
    patientEmail: TEST_EMAIL,
    patientAge: 29,
    patientGender: 'Male',
    reason: 'Routine Oncology Consultation',
    notes: 'Live verification test'
  });
  console.log(`   Status: ${aptRes.statusCode}`, JSON.stringify(aptRes.data));
  results.push({ name: 'Doctor Appointment Booking', res: aptRes });

  // 9. Diagnostic Test Package Booking
  console.log('\n9. Testing Diagnostic Test Package Booking Email...');
  const diagRes = await postJson('/api/diagnostic-booking.php', {
    testId: 'test-full-body',
    date: '2026-09-30',
    timeSlot: '08:00 AM - 10:00 AM',
    collectionMethod: 'home_collection',
    patientName: 'Tejas Mane Live Test',
    patientEmail: TEST_EMAIL,
    patientPhone: '+91 98765 43210',
    patientAge: 29,
    patientGender: 'Male',
    homeAddress: 'Flat 402, Building A',
    pincode: '400001',
    city: 'Mumbai'
  });
  console.log(`   Status: ${diagRes.statusCode}`, JSON.stringify(diagRes.data));
  results.push({ name: 'Diagnostic Test Booking', res: diagRes });

  console.log('\n====================================================');
  console.log('SUMMARY OF EMAIL DISPATCH RESULTS:');
  console.log('====================================================');
  results.forEach(r => {
    const success = r.res.statusCode === 200 || r.res.statusCode === 201;
    const isOk = r.res.data?.status === 'ok' || r.res.data?.emailSent || r.res.data?.emailNotification?.confirmationSent;
    console.log(`${success && isOk ? '✅' : '❌'} ${r.name}: Status ${r.res.statusCode} | Response:`, JSON.stringify(r.res.data));
  });
}

runLiveEmailTests().catch(err => {
  console.error('❌ Live test execution error:', err);
  process.exit(1);
});
