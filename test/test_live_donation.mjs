import https from 'node:https';

function submitDonation(urlStr, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const data = JSON.stringify(payload);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function verifyDonationMail() {
  const donationPayload = {
    form_type: 'donation',
    name: 'Siddharth Deshmukh',
    email: 'info@test.avinyacarefoundation.org',
    phone: '+91 98201 54321',
    amount: 5000,
    frequency: 'monthly',
    pan: 'ABCDE1234F',
    payment_status: 'SUCCESS',
    transaction_id: `TXN-LIVE-${Date.now().toString().slice(-6)}`
  };

  console.log('===========================================================');
  console.log('LIVE DONATION EMAIL DISPATCH VERIFICATION');
  console.log('===========================================================\n');

  const targets = [
    'https://test.avinyacarefoundation.org/api/submit-form',
    'https://avinyacarefoundation.org/api/submit-form'
  ];

  for (const target of targets) {
    console.log(`[POST TARGET] ${target}`);
    try {
      const res = await submitDonation(target, donationPayload);
      console.log(`HTTP Status: ${res.status}`);
      if (res.body && res.body.status === 'ok') {
        console.log(`✓ Status         : ${res.body.status}`);
        console.log(`✓ Submission ID  : ${res.body.submissionId}`);
        console.log(`✓ Form Type      : ${res.body.formType}`);
        console.log(`✓ User Subject   : ${res.body.userEmail?.subject}`);
        console.log(`✓ User Greeting  : ${res.body.userEmail?.greeting}`);
        console.log(`✓ Timestamp IST  : ${res.body.timestampIST}`);
        console.log(`✓ Confirmation   : ${res.body.message}\n`);
      } else {
        console.error(`✕ Response Details:`, res.body || res.raw);
      }
    } catch (e) {
      console.error(`✕ Error:`, e.message);
    }
  }
}

verifyDonationMail();
