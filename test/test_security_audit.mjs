/**
 * Avinya Care Foundation - Automated Security & RBAC Audit Test Suite
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runSecurityAuditTests() {
  console.log('====================================================');
  console.log('  AVINYA CARE SECURITY & PRIVACY AUDIT TEST SUITE   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Diagnostic Booking Unauthenticated GET Leak Protection
  try {
    const res = await makeRequest('/api/diagnostic-booking.php');
    if (res.status === 401 || res.status === 403) {
      console.log(`✓ TEST 1 PASSED: Public GET /api/diagnostic-booking.php correctly rejected with HTTP ${res.status}.`);
      passed++;
    } else {
      console.error(`✗ TEST 1 FAILED: Expected 401 or 403, got ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.error('✗ TEST 1 ERROR:', e.message);
    failed++;
  }

  // Test 2: Doctor Appointment Unauthenticated GET List Leak Protection
  try {
    const res = await makeRequest('/api/booking/index.php?action=list');
    if (res.status === 401 || res.status === 403) {
      console.log(`✓ TEST 2 PASSED: Public GET /api/booking/index.php?action=list correctly rejected with HTTP ${res.status}.`);
      passed++;
    } else {
      console.error(`✗ TEST 2 FAILED: Expected 401 or 403, got ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.error('✗ TEST 2 ERROR:', e.message);
    failed++;
  }

  // Test 3: Account Enumeration Prevention on Forgot Password
  try {
    const res = await makeRequest('/api/admin-auth.php?action=forgot_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'nonexistent.user.98765@gmail.com' });

    if (res.status === 200 && res.body?.message?.includes('If an account exists')) {
      console.log('✓ TEST 3 PASSED: Account enumeration prevented (generic response returned).');
      passed++;
    } else {
      console.error(`✗ TEST 3 FAILED: Expected generic 200 response, got status ${res.status}`, res.body);
      failed++;
    }
  } catch (e) {
    console.error('✗ TEST 3 ERROR:', e.message);
    failed++;
  }

  // Test 4: Unauthenticated Admin Action Escalation Rejection
  try {
    const res = await makeRequest('/api/admin-data.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { action: 'delete_user', id: 'usr-admin-01' });

    if (res.status === 401) {
      console.log('✓ TEST 4 PASSED: Unauthenticated admin manipulation rejected with 401 Unauthorized.');
      passed++;
    } else {
      console.error(`✗ TEST 4 FAILED: Expected 401, got ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.error('✗ TEST 4 ERROR:', e.message);
    failed++;
  }

  // Test 5: Security Health Headers Check
  try {
    const res = await makeRequest('/api/security-health.php');
    const headers = res.headers;
    const hasNosniff = headers['x-content-type-options'] === 'nosniff';
    const hasFrameOptions = headers['x-frame-options'] === 'SAMEORIGIN';
    const hasPolicy = !!headers['permissions-policy'];

    if (res.status === 200 && hasNosniff && hasFrameOptions && hasPolicy) {
      console.log('✓ TEST 5 PASSED: Security monitoring endpoint active with full security headers.');
      passed++;
    } else {
      console.error('✗ TEST 5 FAILED: Security headers missing or incomplete.', res.headers);
      failed++;
    }
  } catch (e) {
    console.error('✗ TEST 5 ERROR:', e.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runSecurityAuditTests();
