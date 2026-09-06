import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_BASE = 'http://127.0.0.1:3000';

console.log('Testing End-to-End Doctor Photo Upload & Persistence...');

async function runTest() {
  // 1. Create a 1x1 transparent PNG / test base64 image
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  // 2. Save a doctor with base64 photo via /api/admin-data.php
  const docPayload = {
    action: 'save_doctor',
    doctor: {
      id: 'doc-test-photo-' + Date.now(),
      name: 'Dr. Test Photo Specialist',
      specialityName: 'Oncology Specialist',
      qualification: 'MBBS, MD',
      experienceYears: 12,
      hospitalName: 'Tata Memorial Hospital',
      location: 'Mumbai',
      consultationFee: 500,
      feeDisplay: '₹500',
      badge: 'Oncologist',
      photoBase64: sampleBase64,
      about: 'Test profile for photo upload.'
    }
  };

  const adminToken = 'AVG-ADM-TEST-TOKEN-2026';
  const saveRes = await fetch(`${API_BASE}/api/admin-data.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(docPayload)
  });

  const saveJson = await saveRes.json();
  console.log('Save Doctor Response:', saveJson);
  assert.strictEqual(saveJson.status, 'ok', 'Doctor save should return status ok');
  assert.ok(saveJson.avatarUrl && saveJson.avatarUrl.startsWith('/assets/doctors/'), `Avatar URL should start with /assets/doctors/, got ${saveJson.avatarUrl}`);

  // 3. Verify the file exists on disk
  const relativeFile = saveJson.avatarUrl.replace(/^\//, '');
  const localFilePath = resolve(relativeFile);
  assert.ok(existsSync(localFilePath), `Saved doctor photo should exist on disk at ${localFilePath}`);
  console.log('✓ Doctor photo saved to disk at:', localFilePath);

  // 4. Verify the image is served over HTTP
  const imgRes = await fetch(`${API_BASE}${saveJson.avatarUrl}`);
  assert.strictEqual(imgRes.status, 200, 'Image should be served with HTTP 200');
  console.log('✓ Doctor photo served over HTTP with status 200');

  // 5. Clean up test doctor
  const delRes = await fetch(`${API_BASE}/api/admin-data.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ action: 'delete_doctor', id: docPayload.doctor.id })
  });
  const delJson = await delRes.json();
  assert.strictEqual(delJson.status, 'ok', 'Doctor deletion should succeed');
  console.log('✓ Test doctor cleaned up.');

  console.log('🎉 ALL End-to-End Doctor Photo Upload Tests Passed Perfectly!');
}

runTest().catch(err => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
