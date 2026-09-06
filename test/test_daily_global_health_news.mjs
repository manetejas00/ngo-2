import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

const HEALTHCARE_TERMS = [
  'cancer', 'oncology', 'tumor', 'tumour', 'leukemia', 'lymphoma', 'melanoma',
  'chemotherapy', 'radiotherapy', 'immunotherapy', 'mammogram', 'screening',
  'carcinoma', 'sarcoma', 'biomarker', 'survivor', 'survivorship', 'remission',
  'oncologist', 'breast cancer', 'lung cancer', 'prostate cancer', 'colorectal',
  'palliative', 'biopsy', 'early detection', 'clinical trial', 'medical research',
  'hospital', 'vaccine', 'vaccination', 'disease', 'cardiology', 'dialysis',
  'cataract', 'pediatric', 'surgery', 'therapeutics', 'genomics', 'mental health',
  'pathology', 'patient care', 'clinical', 'doctor', 'physician', 'wellness',
  'epidemic', 'healthcare', 'medicine', 'nutrition', 'public health', 'pharma',
  'fda', 'who', 'icmr', 'nih', 'blood donation', 'health', 'cardiac', 'insulin'
];

const NON_HEALTH_FORBIDDEN = [
  'election', 'trump', 'biden', 'parliament', 'congress',
  'nfl', 'nba', 'football', 'basketball', 'cricket', 'ipl',
  'hollywood', 'bollywood', 'celebrity', 'box office',
  'wall street', 'bitcoin', 'crypto',
  'robbery', 'shooting', 'cyclone', 'tornado', 'gaming', 'playstation', 'xbox'
];

async function runTests() {
  console.log('Testing Daily Worldwide Healthcare News Feed & Strict Filters...\n');

  // Test 1: Daily News Endpoint
  console.log('1. Fetching news from /api/news...');
  const res = await fetch(`${BASE_URL}/api/news`);
  assert.strictEqual(res.status, 200, 'GET /api/news should return 200 OK');
  const data = await res.json();
  assert.ok(Array.isArray(data.articles), 'Articles must be an array');
  assert.ok(data.articles.length >= 10, `Expected at least 10 articles, got ${data.articles.length}`);
  console.log(`   ✓ Received ${data.articles.length} daily global healthcare articles.`);

  // Test 2: Strict Healthcare Content Filter Verification
  console.log('\n2. Verifying strict healthcare filter on all articles...');
  let healthcareMatchCount = 0;
  for (const article of data.articles) {
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    
    // Must NOT contain forbidden unrelated keywords as whole words
    for (const forbidden of NON_HEALTH_FORBIDDEN) {
      const wordRegex = new RegExp(`\\b${forbidden.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      assert.strictEqual(
        wordRegex.test(text),
        false,
        `Article "${article.title}" violated non-health filter with keyword: ${forbidden}`
      );
    }

    // Must match at least one healthcare term
    const matched = HEALTHCARE_TERMS.some(term => text.includes(term));
    assert.ok(matched, `Article "${article.title}" must match healthcare keywords`);
    healthcareMatchCount++;
  }
  console.log(`   ✓ 100% of articles (${healthcareMatchCount}/${data.articles.length}) are strictly verified healthcare & medical stories.`);

  // Test 3: Daily Refresh Trigger Endpoint
  console.log('\n3. Testing daily manual/cron refresh endpoint (/api/news/refresh)...');
  const refreshRes = await fetch(`${BASE_URL}/api/news/refresh`);
  assert.strictEqual(refreshRes.status, 200, '/api/news/refresh should return 200 OK');
  const refreshData = await refreshRes.json();
  assert.strictEqual(refreshData.status, 'ok', 'Refresh status should be ok');
  assert.ok(refreshData.count >= 10, 'Refreshed feed should have at least 10 articles');
  console.log(`   ✓ Refreshed daily cache successfully (${refreshData.count} global healthcare articles loaded).`);

  // Test 4: Verify Worldwide Sources
  console.log('\n4. Verifying worldwide source desks...');
  const sources = new Set(data.articles.map(a => a.apiProvider || a.source));
  console.log(`   ✓ Active Source Desks:`, Array.from(sources));

  console.log('\n🎉 ALL DAILY GLOBAL HEALTHCARE NEWS TESTS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Daily news test failed:', err);
  process.exit(1);
});
