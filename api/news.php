<?php
declare(strict_types=1);

require_once __DIR__ . '/rate_limiter.php';
enforcePhpRateLimit(60, 60);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$cacheFile = dirname(__DIR__) . '/cache/news_cache.json';
$cacheTtl = 3600; // 1 hour live refresh cycle

// 1. Check if valid live API cache exists and is fresh
if (file_exists($cacheFile)) {
    $cachedData = json_decode((string)file_get_contents($cacheFile), true);
    if (!empty($cachedData['timestamp']) && (time() - ($cachedData['timestamp'] / 1000)) < $cacheTtl && !empty($cachedData['articles'])) {
        echo json_encode([
            'status' => 'ok',
            'cached' => true,
            'lastUpdated' => $cachedData['timestamp'],
            'articles' => $cachedData['articles']
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit(0);
    }
}

// 2. Fetch Live Healthcare & Medical News from External Public APIs
$articles = [];
$ctx = stream_context_create([
    'http' => [
        'timeout' => 5,
        'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AvinyaCareFoundationGlobalNews/4.0\r\n"
    ]
]);

// Source A: NewsData.io API (if API key is present in environment)
$newsDataKey = trim((string)(getenv('NEWSDATA_API_KEY') ?: ''));
if ($newsDataKey !== '' && !str_starts_with($newsDataKey, 'YOUR_')) {
    try {
        $url = 'https://newsdata.io/api/1/latest?apikey=' . rawurlencode($newsDataKey) . '&category=health&language=en&size=10';
        $jsonStr = @file_get_contents($url, false, $ctx);
        if ($jsonStr) {
            $data = json_decode($jsonStr, true);
            if (isset($data['results']) && is_array($data['results'])) {
                foreach ($data['results'] as $art) {
                    $title = trim((string)($art['title'] ?? ''));
                    $desc = trim((string)($art['description'] ?? ''));
                    $artUrl = trim((string)($art['link'] ?? ''));

                    if (!empty($title) && !empty($artUrl)) {
                        $cleanTitle = explode(' - ', $title)[0];
                        $cat = (stripos($title, 'cancer') !== false || stripos($title, 'tumor') !== false) ? 'Cancer Research' : 'Global Health';
                        
                        $articles[] = [
                            'id' => 'nd-' . substr(md5($artUrl), 0, 8),
                            'title' => $cleanTitle,
                            'description' => !empty($desc) ? $desc : 'Read clinical update from worldwide healthcare sources.',
                            'category' => $cat,
                            'source' => $art['source_name'] ?? $art['source_id'] ?? 'NewsData Health Desk',
                            'apiProvider' => 'NewsData.io',
                            'publishedAt' => $art['pubDate'] ?? date('c'),
                            'url' => $artUrl,
                            'urlToImage' => isset($art['image_url']) && is_string($art['image_url']) ? trim($art['image_url']) : null
                        ];
                    }
                }
            }
        }
    } catch (Throwable $e) {}
}

// Source B: Saurav.tech Public NewsAPI Mirror (Health & Medical News)
$publicApiEndpoints = [
    'https://saurav.tech/NewsAPI/top-headlines/category/health/in.json',
    'https://saurav.tech/NewsAPI/top-headlines/category/health/us.json',
    'https://api.spaceflightnewsapi.net/v4/blogs/?limit=10'
];

foreach ($publicApiEndpoints as $endpoint) {
    try {
        $jsonStr = @file_get_contents($endpoint, false, $ctx);
        if (!$jsonStr) continue;
        $data = json_decode($jsonStr, true);
        if (!$data) continue;

        if (isset($data['articles']) && is_array($data['articles'])) {
            foreach ($data['articles'] as $art) {
                $title = trim((string)($art['title'] ?? ''));
                $desc = trim((string)($art['description'] ?? $art['content'] ?? ''));
                $artUrl = trim((string)($art['url'] ?? ''));
                if (empty($title) || empty($artUrl)) continue;

                $cleanTitle = explode(' - ', $title)[0];
                $articles[] = [
                    'id' => 'st-' . substr(md5($artUrl), 0, 8),
                    'title' => $cleanTitle,
                    'description' => !empty($desc) ? $desc : 'Read live update from medical and health news desk.',
                    'category' => (stripos($title, 'cancer') !== false || stripos($title, 'oncology') !== false) ? 'Cancer Research' : 'Global Health',
                    'source' => $art['source']['name'] ?? 'Health News Desk',
                    'apiProvider' => 'Public Health API',
                    'publishedAt' => $art['publishedAt'] ?? date('c'),
                    'url' => $artUrl,
                    'urlToImage' => isset($art['urlToImage']) && is_string($art['urlToImage']) ? trim($art['urlToImage']) : null
                ];
            }
        }

        if (isset($data['results']) && is_array($data['results'])) {
            foreach ($data['results'] as $art) {
                $title = trim((string)($art['title'] ?? ''));
                $desc = trim((string)($art['summary'] ?? ''));
                $artUrl = trim((string)($art['url'] ?? ''));
                if (empty($title) || empty($artUrl)) continue;

                $articles[] = [
                    'id' => 'sp-' . substr(md5($artUrl), 0, 8),
                    'title' => $title,
                    'description' => !empty($desc) ? $desc : 'Read live update from global medical and science desk.',
                    'category' => 'Medical & Science',
                    'source' => $art['news_site'] ?? 'Science News Desk',
                    'apiProvider' => 'Public Science API',
                    'publishedAt' => $art['published_at'] ?? date('c'),
                    'url' => $artUrl,
                    'urlToImage' => isset($art['image_url']) && is_string($art['image_url']) ? trim($art['image_url']) : null
                ];
            }
        }
    } catch (Throwable $e) {}
}

// 3. Deduplicate articles by title
$seen = [];
$uniqueArticles = [];
foreach ($articles as $item) {
    $key = strtolower(preg_replace('/[^a-z0-9]/', '', (string)$item['title']));
    if (!empty($key) && !isset($seen[$key])) {
        $seen[$key] = true;
        $uniqueArticles[] = $item;
    }
}

// 4. Save and return API payload
if (count($uniqueArticles) > 0) {
    $payload = [
        'status' => 'ok',
        'cached' => false,
        'lastUpdated' => time() * 1000,
        'articles' => array_slice($uniqueArticles, 0, 24)
    ];

    $cacheDir = dirname($cacheFile);
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    @file_put_contents($cacheFile, json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit(0);
}

// 5. Fallback to existing cache if available
if (file_exists($cacheFile)) {
    echo file_get_contents($cacheFile);
    exit(0);
}

echo json_encode(['status' => 'error', 'message' => 'Healthcare news API currently unavailable'], JSON_UNESCAPED_SLASHES);
exit(0);
