import http from 'http';
import assert from 'assert';

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('🩺 Testing Doctors DB & Storage System...\n');

  // 1. Fetch all doctors from DB
  const getRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/healthcare/doctors',
    method: 'GET'
  });

  assert.strictEqual(getRes.status, 200, 'GET /api/healthcare/doctors should return 200');
  assert.ok(Array.isArray(getRes.body.doctors), 'Should return doctors array');
  assert.ok(getRes.body.doctors.length >= 10, 'Should have at least 10 doctors');

  console.log(`✓ GET /api/healthcare/doctors: Loaded ${getRes.body.doctors.length} doctors from DB.`);
  getRes.body.doctors.forEach(doc => {
    assert.ok(doc.avatar.startsWith('/assets/doctors/'), `Doctor ${doc.name} should have local /assets/doctors/ avatar, got ${doc.avatar}`);
  });
  console.log('✓ All doctors have valid local /assets/doctors/ avatar paths.');

  // 2. Add a new doctor with custom base64 photo
  // 1x1 transparent GIF base64
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const newDocPayload = {
    id: 'doc-test-future-01',
    name: 'Dr. Sameer Joshi',
    specialityId: 'cardiology',
    specialityName: 'Consultant Cardiologist',
    qualification: 'MBBS, MD, DM',
    experienceYears: 12,
    location: 'Mumbai - Vasai',
    consultationFee: 500,
    image: dummyBase64
  };

  const addRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/healthcare/doctors',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, newDocPayload);

  assert.strictEqual(addRes.status, 201, 'POST /api/healthcare/doctors should return 201');
  assert.ok(addRes.body.doctor.avatar.startsWith('/assets/doctors/'), 'New doctor avatar should be stored in /assets/doctors/');
  console.log(`✓ POST /api/healthcare/doctors: Added ${addRes.body.doctor.name} with storage avatar: ${addRes.body.doctor.avatar}`);

  // 3. Upload / Update Photo for doctor
  const uploadRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/healthcare/doctors/doc-test-future-01/upload-photo',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    image: dummyBase64,
    filename: 'dr_sameer_new'
  });

  assert.strictEqual(uploadRes.status, 200, 'Photo upload should return 200');
  assert.ok(uploadRes.body.avatarUrl.includes('dr_sameer_new'), 'Photo upload URL should match custom filename');
  console.log(`✓ Photo Upload API: Updated doctor photo -> ${uploadRes.body.avatarUrl}`);

  // 4. Clean up test doctor
  const delRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/healthcare/doctors/doc-test-future-01',
    method: 'DELETE'
  });

  assert.strictEqual(delRes.status, 200, 'DELETE /api/healthcare/doctors/:id should return 200');
  console.log(`✓ DELETE /api/healthcare/doctors: Cleaned up test doctor profile.`);

  console.log('\n🎉 ALL Doctors DB & Storage Tests Passed Successfully!');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
