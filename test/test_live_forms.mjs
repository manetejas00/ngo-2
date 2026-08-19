import https from 'https';

function submitForm(hostname, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname,
      port: 443,
      path: '/api/submit-form',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function testForms() {
  const hosts = ['test.avinyacarefoundation.org', 'avinyacarefoundation.org'];

  for (const host of hosts) {
    console.log(`\nTesting forms on https://${host}...`);
    try {
      const res = await submitForm(host, {
        form_type: 'newsletter',
        name: 'Deployment QA Tester',
        email: 'info@test.avinyacarefoundation.org'
      });
      console.log(`Result from ${host}:`, JSON.stringify(res));
    } catch (e) {
      console.error(`Error from ${host}:`, e.message);
    }
  }
}

testForms();
