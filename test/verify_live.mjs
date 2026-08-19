import https from 'https';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          statusCode: res.statusCode,
          headers: res.headers,
          bodyLength: data.length,
          preview: data.slice(0, 100).replace(/\n/g, ' ')
        });
      });
    }).on('error', (err) => {
      resolve({ url, error: err.message });
    });
  });
}

async function runQA() {
  const urls = [
    'https://test.avinyacarefoundation.org/',
    'https://avinyacarefoundation.org/',
    'https://test.avinyacarefoundation.org/css/styles.css',
    'https://avinyacarefoundation.org/css/styles.css',
    'https://test.avinyacarefoundation.org/js/app.js',
    'https://avinyacarefoundation.org/js/app.js',
    'https://test.avinyacarefoundation.org/js/components/nestjs-cards.js',
    'https://avinyacarefoundation.org/js/components/nestjs-cards.js',
    'https://test.avinyacarefoundation.org/favicon.svg',
    'https://avinyacarefoundation.org/favicon.svg',
    'https://test.avinyacarefoundation.org/favicon.ico',
    'https://avinyacarefoundation.org/favicon.ico',
    'https://test.avinyacarefoundation.org/assets/logo-emblem.png',
    'https://avinyacarefoundation.org/assets/logo-emblem.png',
    'https://test.avinyacarefoundation.org/hero-sequence/ezgif-frame-001.jpg',
    'https://avinyacarefoundation.org/hero-sequence/ezgif-frame-001.jpg',
    'https://test.avinyacarefoundation.org/api/news',
    'https://avinyacarefoundation.org/api/news'
  ];

  console.log('--- LIVE ENVIRONMENT QA CHECKS ---');
  for (const u of urls) {
    const res = await checkUrl(u);
    if (res.error) {
      console.log(`[FAILED] ${res.url} -> ${res.error}`);
    } else {
      console.log(`[HTTP ${res.statusCode}] ${res.url} (${res.bodyLength} bytes)`);
    }
  }
}

runQA();
