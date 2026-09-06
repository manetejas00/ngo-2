import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('Testing AI News Generation & Multi-Story Expansion...\n');

  // Test 1: GET /api/news returns at least 10 articles
  console.log('1. Fetching news from /api/news...');
  const newsRes = await fetch(`${BASE_URL}/api/news`);
  assert.strictEqual(newsRes.status, 200, 'GET /api/news should return 200 OK');
  const newsData = await newsRes.json();
  assert.ok(Array.isArray(newsData.articles), 'Articles must be an array');
  assert.ok(newsData.articles.length >= 10, `Expected at least 10 articles, got ${newsData.articles.length}`);
  console.log(`   ✓ Successfully fetched ${newsData.articles.length} news articles.`);

  const aiArticles = newsData.articles.filter(a => a.isAIGenerated);
  console.log(`   ✓ Found ${aiArticles.length} AI-generated oncology research articles in current list.`);
  assert.ok(aiArticles.length >= 3, 'Should have at least 3 AI-generated stories in initial list');

  // Test 2: POST /api/news/generate with count=5
  console.log('\n2. Testing POST /api/news/generate with count=5...');
  const genPostRes = await fetch(`${BASE_URL}/api/news/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: 5, topicHint: 'immunotherapy and early screening' })
  });
  assert.strictEqual(genPostRes.status, 200, 'POST /api/news/generate should return 200 OK');
  const genPostData = await genPostRes.json();
  assert.strictEqual(genPostData.status, 'ok', 'Status should be ok');
  assert.ok(Array.isArray(genPostData.articles), 'Response must contain articles array');
  assert.ok(genPostData.articles.length >= 3, `Expected at least 3 generated stories, got ${genPostData.articles.length}`);
  console.log(`   ✓ Successfully generated ${genPostData.articles.length} AI news stories in batch.`);
  genPostData.articles.forEach((art, idx) => {
    console.log(`     [AI ${idx + 1}] (${art.category}): ${art.title}`);
  });

  // Test 3: GET /api/news/generate?count=5
  console.log('\n3. Testing GET /api/news/generate?count=5...');
  const genGetRes = await fetch(`${BASE_URL}/api/news/generate?count=5`);
  assert.strictEqual(genGetRes.status, 200, 'GET /api/news/generate should return 200 OK');
  const genGetData = await genGetRes.json();
  assert.strictEqual(genGetData.status, 'ok', 'Status should be ok');
  assert.ok(Array.isArray(genGetData.articles), 'Response must contain articles array');
  assert.ok(genGetData.articles.length >= 3, `Expected at least 3 generated stories, got ${genGetData.articles.length}`);
  console.log(`   ✓ Successfully generated ${genGetData.articles.length} AI news stories via GET.`);

  // Test 4: Verify static JSON fallbacks exist
  console.log('\n4. Verifying static fallbacks (/api/news.json & /api/news_generate.json)...');
  const staticNewsRes = await fetch(`${BASE_URL}/api/news.json`);
  assert.strictEqual(staticNewsRes.status, 200, '/api/news.json should return 200 OK');
  const staticNewsData = await staticNewsRes.json();
  assert.ok(staticNewsData.articles.length >= 10, 'Static news JSON should have at least 10 articles');
  console.log(`   ✓ Static news.json contains ${staticNewsData.articles.length} articles.`);

  const staticGenRes = await fetch(`${BASE_URL}/api/news_generate.json`);
  assert.strictEqual(staticGenRes.status, 200, '/api/news_generate.json should return 200 OK');
  const staticGenData = await staticGenRes.json();
  assert.ok(staticGenData.articles.length >= 3, 'Static news_generate.json should have multiple articles');
  console.log(`   ✓ Static news_generate.json contains ${staticGenData.articles.length} batch articles.`);

  console.log('\n🎉 ALL AI NEWS EXPANSION & GENERATION TESTS PASSED!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
