import http from 'http';
import assert from 'assert';

const paths = [
  '/assets/stories/story-meera-deshmukh.jpg',
  '/assets/stories/story-rajesh-sharma.jpg',
  '/assets/stories/story-ananya-iyer.jpg',
  '/assets/stories/story-kailash-patil.jpg',
  '/assets/stories/story-leela-rathod.jpg',
  '/assets/stories/story-sunil-mane.jpg',
  '/assets/stories/story-pooja-naik.jpg',
  '/assets/stories/story-girish-kulkarni.jpg',
  '/assets/stories/story-tanvi-gupte.jpg',
  '/assets/stories/story-joshi-couple.jpg',
  '/assets/initiatives/initiative-blood-drive.jpg',
  '/assets/initiatives/initiative-screening-camp.jpg',
  '/assets/initiatives/initiative-patient-care.jpg'
];

async function check() {
  console.log('Testing all Indian photo assets over HTTP...');
  let count = 0;
  for (const p of paths) {
    await new Promise((resolve, reject) => {
      http.get('http://localhost:3000' + p, (res) => {
        let size = 0;
        res.on('data', chunk => size += chunk.length);
        res.on('end', () => {
          assert.strictEqual(res.statusCode, 200, `Expected 200 for ${p} but got ${res.statusCode}`);
          assert.ok(size > 10000, `Expected file size > 10KB for ${p}, got ${size}`);
          console.log(`  ✓ [200 OK] ${p} (${Math.round(size / 1024)} KB)`);
          count++;
          resolve();
        });
      }).on('error', reject);
    });
  }
  console.log(`\n🎉 Verified all ${count} Indian photos and portraits successfully!`);
}

check().catch(err => {
  console.error('❌ Asset verification failed:', err);
  process.exit(1);
});
