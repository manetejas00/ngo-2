/**
 * Avinya Care Foundation - Form & AI Email System Test Suite
 * Executes end-to-end verification of all 7 form types against the server API.
 */

import https from 'node:https';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000/api/submit-form';

const TEST_FORMS = [
  {
    name: 'Volunteer Form Test',
    form_type: 'volunteer',
    payload: {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 98200 12345',
      interest: 'Cancer awareness campaigns',
      message: 'I would like to help with awareness activities in Mumbai.'
    }
  },
  {
    name: 'Donation Form Test (Success)',
    form_type: 'donation',
    payload: {
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
      phone: '+91 98333 54321',
      amount: 2500,
      frequency: 'monthly',
      payment_status: 'SUCCESS',
      transaction_id: 'TXN-98765432'
    }
  },
  {
    name: 'Donation Form Test (Pending)',
    form_type: 'donation',
    payload: {
      name: 'Aarav Mehta',
      email: 'aarav.mehta@example.com',
      amount: 1000,
      frequency: 'one-time',
      payment_status: 'PENDING',
      transaction_id: 'TXN-88776655'
    }
  },
  {
    name: 'Patient Support Form Test (Sensitive)',
    form_type: 'support',
    payload: {
      name: 'Savitri Devi',
      email: 'savitri@example.com',
      phone: '+91 98111 22334',
      interest: 'Treatment & Financial Navigation',
      message: 'Seeking help for diagnostic guidance in Pune for family member.',
      is_sensitive: true
    }
  },
  {
    name: 'Corporate CSR Partnership Form Test',
    form_type: 'partnership',
    payload: {
      name: 'Vikram Malhotra',
      email: 'vikram@tata-corp.example.com',
      organization: 'Tata Consultancy CSR Wing',
      phone: '+91 99000 11223',
      interest: 'Corporate CSR Screening Van Sponsorship',
      message: 'We are interested in funding 2 mobile screening vans in rural Maharashtra.'
    }
  },
  {
    name: 'Contact Form Test',
    form_type: 'contact',
    payload: {
      name: 'Ananya Gupta',
      email: 'ananya@example.com',
      phone: '+91 97654 32100',
      interest: 'General Healthcare Inquiry',
      message: 'Can I get information on the upcoming mobile diagnostic camp schedule?'
    }
  },
  {
    name: 'Newsletter Form Test',
    form_type: 'newsletter',
    payload: {
      name: 'Devraj Nair',
      email: 'devraj@example.com',
      interest: 'Early Cancer Screening Guidelines'
    }
  },
  {
    name: 'Feedback Form Test',
    form_type: 'feedback',
    payload: {
      name: 'Meera Kulkarni',
      email: 'meera@example.com',
      interest: 'Diagnostic Camp Experience',
      message: 'The volunteers at the Pune screening camp were extremely polite and helpful.'
    }
  }
];

function makePostRequest(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
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
    req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log('=====================================================');
  console.log('AVINYA CARE — AI EMAIL SYSTEM VERIFICATION TEST SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_FORMS) {
    console.log(`[TEST] Executing: ${testCase.name} (Form Type: ${testCase.form_type})...`);
    try {
      const res = await makePostRequest(SERVER_URL, {
        form_type: testCase.form_type,
        ...testCase.payload
      });

      if (res.statusCode === 200 && res.data && res.data.status === 'ok') {
        const d = res.data;
        const userSubj = d.userEmail?.subject || '';
        const adminSubj = d.adminEmail?.subject || '';

        // Validation Checks
        const hasValidUserSubject = userSubj.endsWith('— Avinya Care Foundation');
        const hasValidAdminSubject = adminSubj.startsWith('[Avinya Care]');
        const hasSubmissionId = Boolean(d.submissionId && d.submissionId.startsWith('SUB-'));
        const hasTimestamp = Boolean(d.timestampIST && d.timestampIST.includes('IST'));

        if (hasValidUserSubject && hasValidAdminSubject && hasSubmissionId && hasTimestamp) {
          console.log(`  ✓ PASSED — Submission ID: ${d.submissionId} | AI Mode: ${d.isAIGenerated ? 'DYNAMIC AI' : 'SAFE FALLBACK'}`);
          console.log(`    User Subject : "${userSubj}"`);
          console.log(`    Admin Subject: "${adminSubj}"`);
          console.log(`    Timestamp IST: "${d.timestampIST}"\n`);
          passed++;
        } else {
          console.error(`  ✕ FAILED — Validation rule mismatch:`);
          console.error(`    User Subj Valid: ${hasValidUserSubject}`);
          console.error(`    Admin Subj Valid: ${hasValidAdminSubject}`);
          console.error(`    Submission ID: ${d.submissionId}`);
          console.error(`    Timestamp: ${d.timestampIST}\n`);
          failed++;
        }
      } else {
        console.error(`  ✕ FAILED — HTTP Status ${res.statusCode}:`, res.data || res.raw);
        failed++;
      }
    } catch (err) {
      console.error(`  ✕ ERROR executing test "${testCase.name}":`, err.message);
      failed++;
    }
  }

  // Verify Persistent File Records
  try {
    const subRaw = await readFile(join(__dirname, '../cache/submissions.json'), 'utf-8');
    const submissions = JSON.parse(subRaw);
    console.log(`[PERSISTENCE VERIFICATION] Successfully verified ${submissions.length} submission records stored in cache/submissions.json.`);
  } catch (e) {
    console.warn('[PERSISTENCE VERIFICATION] Submissions log check warning:', e.message);
  }

  try {
    const logRaw = await readFile(join(__dirname, '../cache/email_logs.json'), 'utf-8');
    const logs = JSON.parse(logRaw);
    console.log(`[EMAIL LOG VERIFICATION] Successfully verified ${logs.length} email audit logs stored in cache/email_logs.json.`);
  } catch (e) {
    console.warn('[EMAIL LOG VERIFICATION] Email audit log check warning:', e.message);
  }

  console.log('\n=====================================================');
  console.log(`SUMMARY: Total Tests: ${TEST_FORMS.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
