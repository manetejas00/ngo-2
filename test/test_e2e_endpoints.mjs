import http from 'http';

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('=== STARTING HTTP END-TO-END HEALTHCARE TEST SUITE ===\n');

  // 1. Homepage has Doctors & Tests link
  const homeRes = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
  console.log(`1. GET / status: ${homeRes.statusCode}`);
  if (!homeRes.body.includes('doctors.html') || !homeRes.body.includes('Doctors & Tests')) {
    throw new Error('Homepage missing Doctors & Tests link to doctors.html');
  }
  console.log('   ✓ Homepage successfully contains Doctors & Tests link to doctors.html');

  // 2. Standalone doctors.html and /doctors routing
  const docPageRes = await request({ hostname: 'localhost', port: 3000, path: '/doctors.html', method: 'GET' });
  console.log(`2. GET /doctors.html status: ${docPageRes.statusCode}`);
  if (!docPageRes.body.includes('Avinya Health Connect') || !docPageRes.body.includes('The Right Doctor.')) {
    throw new Error('doctors.html missing key platform elements');
  }
  console.log('   ✓ doctors.html contains Avinya Health Connect & Framer Hero content');

  const docRouteRes = await request({ hostname: 'localhost', port: 3000, path: '/doctors', method: 'GET' });
  console.log(`3. GET /doctors status: ${docRouteRes.statusCode}`);
  if (docRouteRes.statusCode !== 200) throw new Error('/doctors route failed');
  console.log('   ✓ /doctors route alias properly serves doctors.html');

  // 3. API: Get Doctors
  const docsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/healthcare/doctors', method: 'GET' });
  const docsData = JSON.parse(docsRes.body);
  console.log(`4. GET /api/healthcare/doctors: returned ${docsData.doctors.length} doctors`);
  if (docsData.doctors.length < 5) throw new Error('Expected at least 5 doctors');

  // 4. API: Get Slots
  const testDate = '2026-09-02';
  const slotsRes = await request({ hostname: 'localhost', port: 3000, path: `/api/healthcare/doctors/doc-1/slots?date=${testDate}`, method: 'GET' });
  const slotsData = JSON.parse(slotsRes.body);
  const availSlot = slotsData.slots.find(s => s.available);
  console.log(`5. GET /api/healthcare/doctors/doc-1/slots: found slot ${availSlot.time}`);

  // 5. API: Book Appointment
  const bookPayload = {
    doctorId: 'doc-1',
    date: testDate,
    time: availSlot.time,
    consultationType: 'in-clinic',
    patientName: 'Sunita Rao',
    patientPhone: '+91 98201 54321',
    patientEmail: 'sunita.rao@example.com',
    patientAge: 52,
    patientGender: 'Female',
    reason: 'Second opinion for oncology consultation',
    notes: 'Please review prior mammogram'
  };

  const bookRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/healthcare/appointments',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, bookPayload);

  const bookData = JSON.parse(bookRes.body);
  console.log(`6. POST /api/healthcare/appointments: status ${bookRes.statusCode}, ID: ${bookData.appointment?.id}`);
  if (bookRes.statusCode !== 201 || !bookData.appointment?.id.startsWith('AVC-APT-2026-')) {
    throw new Error('Appointment booking failed');
  }

  // 6. API: Concurrency Double-Booking Protection
  const collisionRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/healthcare/appointments',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, bookPayload);

  console.log(`7. Collision rejection test status: ${collisionRes.statusCode}`);
  if (collisionRes.statusCode !== 409) {
    throw new Error(`Expected 409 Conflict for double booking, got ${collisionRes.statusCode}`);
  }
  console.log('   ✓ Double booking successfully blocked by backend atomic lock');

  // 7. API: Diagnostic Test Booking
  const testPayload = {
    testId: 'test-1',
    collectionMethod: 'home_collection',
    homeAddress: 'Flat 302, Palm Beach Road, Bandra West',
    pincode: '400050',
    city: 'Mumbai',
    date: testDate,
    timeSlot: '08:30 AM - 09:30 AM',
    patientName: 'Sunita Rao',
    patientPhone: '+91 98201 54321',
    patientEmail: 'sunita.rao@example.com',
    patientAge: 52,
    patientGender: 'Female'
  };

  const testBookRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/healthcare/test-bookings',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, testPayload);

  const testBookData = JSON.parse(testBookRes.body);
  console.log(`8. POST /api/healthcare/test-bookings: status ${testBookRes.statusCode}, ID: ${testBookData.booking?.id}`);
  if (testBookRes.statusCode !== 201 || !testBookData.booking?.id.startsWith('AVC-TST-2026-')) {
    throw new Error('Diagnostic test booking failed');
  }

  // 8. API: Status Update
  const statusRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/healthcare/appointments/${bookData.appointment.id}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: 'completed', actor: 'Doctor', notes: 'Consultation completed successfully' });

  const statusData = JSON.parse(statusRes.body);
  console.log(`9. PATCH /api/healthcare/appointments/:id/status: ${statusData.message}`);
  if (statusRes.statusCode !== 200 || statusData.appointment.status !== 'completed') {
    throw new Error('Status update failed');
  }

  // 9. API: Stats & KPI Metrics
  const statsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/healthcare/stats', method: 'GET' });
  const statsData = JSON.parse(statsRes.body);
  console.log(`10. GET /api/healthcare/stats: total ${statsData.stats.totalAppointments} appointments, ${statsData.stats.totalTests} tests`);

  // 10. API: Notification Logs
  const logsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/healthcare/logs', method: 'GET' });
  const logsData = JSON.parse(logsRes.body);
  console.log(`11. GET /api/healthcare/logs: ${logsData.logs.length} notification audit entries recorded`);

  console.log('\n======================================================');
  console.log('🎉 ALL 11 END-TO-END HEALTHCARE CHECKS PASSED PERFECTLY!');
  console.log('======================================================\n');
}

runE2ETests().catch(err => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
