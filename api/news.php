<?php
declare(strict_types=1);

require_once __DIR__ . '/rate_limiter.php';
enforcePhpRateLimit(60, 60);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

$cacheFile = dirname(__DIR__) . '/cache/news_cache.json';
$cacheTtl = 3600; // 1 hour live refresh cycle

// 1. Check if valid live API cache exists and is less than 1 hour old
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

// Strict Healthcare Filter Keywords (ONLY health & oncology)
$healthKeywords = [
    'cancer', 'oncology', 'tumor', 'tumour', 'leukemia', 'lymphoma', 'melanoma',
    'chemotherapy', 'radiotherapy', 'immunotherapy', 'mammogram', 'screening',
    'carcinoma', 'sarcoma', 'biomarker', 'survivor', 'survivorship', 'remission',
    'oncologist', 'breast cancer', 'lung cancer', 'prostate cancer', 'colorectal',
    'palliative', 'biopsy', 'early detection', 'clinical trial', 'medical research',
    'hospital', 'vaccine', 'vaccination', 'disease', 'cardiology', 'dialysis',
    'cataract', 'pediatric', 'surgery', 'therapeutics', 'genomics', 'mental health',
    'pathology', 'patient care', 'clinical', 'doctor', 'physician', 'wellness',
    'epidemic', 'healthcare', 'medicine', 'nutrition', 'public health', 'pharma',
    'fda', 'who', 'icmr', 'nih', 'blood donation', 'health', 'cardiac', 'insulin',
    'virus', 'infection', 'outbreak', 'medical', 'clinic', 'therapy', 'patient'
];

$strictNonHealthKeywords = [
    'nasa', 'spacex', 'cygnus', 'canadarm', 'astronaut', 'space station', 'expedition', 'orbit', 'crew-12', 'crew-13', 'spacecraft',
    'politics', 'election', 'trump', 'biden', 'parliament', 'congress', 'minister',
    'nfl', 'nba', 'football', 'basketball', 'cricket', 'ipl', 'premier league',
    'hollywood', 'bollywood', 'celebrity', 'box office', 'actor', 'actress',
    'stocks', 'wall street', 'bitcoin', 'crypto', 'currency', 'stock market',
    'crime', 'murder', 'shooting', 'robbery', 'arrested', 'police raid',
    'weather', 'storm', 'cyclone', 'tornado', 'earthquake',
    'movie', 'film', 'trailer', 'gaming', 'playstation', 'xbox', 'nintendo',
    'smartphone', 'iphone', 'tesla', 'ev car', 'automobile', 'gadget'
];

function isHealthcareOnly(string $title, string $desc, array $posKeys, array $negKeys): bool {
    $text = strtolower($title . ' ' . $desc);
    foreach ($negKeys as $neg) {
        $pattern = '/\b' . preg_quote($neg, '/') . '\b/i';
        if (preg_match($pattern, $text)) return false;
    }
    foreach ($posKeys as $pos) {
        if (strpos($text, $pos) !== false) return true;
    }
    return false;
}

// 2. Fetch Live Healthcare & Medical News from External Public APIs
$articles = [];
$ctx = stream_context_create([
    'http' => [
        'timeout' => 5,
        'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AvinyaCareFoundationGlobalHealth/4.0\r\n"
    ]
]);

// Source A: World Health Organization (WHO) Live API
try {
    $whoUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.who.int%2Frss-feeds%2Fnews-english.xml';
    $jsonStr = @file_get_contents($whoUrl, false, $ctx);
    if ($jsonStr) {
        $data = json_decode($jsonStr, true);
        if (isset($data['items']) && is_array($data['items'])) {
            foreach ($data['items'] as $item) {
                $rawTitle = trim((string)($item['title'] ?? ''));
                $rawDesc = strip_tags(trim((string)($item['description'] ?? '')));
                $link = trim((string)($item['link'] ?? ''));
                $img = !empty($item['thumbnail']) ? $item['thumbnail'] : (!empty($item['enclosure']['link']) ? $item['enclosure']['link'] : null);

                if (!$img && !empty($item['description'])) {
                    if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $item['description'], $matches)) {
                        $img = $matches[1];
                    }
                }

                if (!empty($rawTitle) && !empty($link)) {
                    $cat = (stripos($rawTitle, 'cancer') !== false || stripos($rawTitle, 'oncology') !== false) ? 'Cancer Research' : 'Global Health';
                    $articles[] = [
                        'id' => 'who-' . substr(md5($link), 0, 8),
                        'title' => $rawTitle,
                        'description' => !empty($rawDesc) ? substr($rawDesc, 0, 220) . '...' : 'Read global healthcare guidance from World Health Organization.',
                        'category' => $cat,
                        'source' => 'World Health Organization (WHO)',
                        'apiProvider' => 'WHO Health Desk',
                        'publishedAt' => $item['pubDate'] ?? date('c'),
                        'url' => $link,
                        'urlToImage' => $img
                    ];
                }
            }
        }
    }
} catch (Throwable $e) {}

// Source B: NewsData.io Health API (if API key present)
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

                    if (!empty($title) && !empty($artUrl) && isHealthcareOnly($title, $desc, $healthKeywords, $strictNonHealthKeywords)) {
                        $cleanTitle = explode(' - ', $title)[0];
                        $cat = (stripos($title, 'cancer') !== false || stripos($title, 'tumor') !== false) ? 'Cancer Research' : 'Global Health';
                        
                        $articles[] = [
                            'id' => 'nd-' . substr(md5($artUrl), 0, 8),
                            'title' => $cleanTitle,
                            'description' => !empty($desc) ? $desc : 'Read clinical update from worldwide healthcare sources.',
                            'category' => $cat,
                            'source' => $art['source_name'] ?? $art['source_id'] ?? 'NewsData Health Desk',
                            'apiProvider' => 'NewsData.io Health',
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

// Source C: Public Health APIs (India & Global Health News)
$publicApiEndpoints = [
    'https://saurav.tech/NewsAPI/top-headlines/category/health/in.json',
    'https://saurav.tech/NewsAPI/top-headlines/category/health/us.json'
];

foreach ($publicApiEndpoints as $endpoint) {
    try {
        $jsonStr = @file_get_contents($endpoint, false, $ctx);
        if (!$jsonStr) continue;
        $data = json_decode($jsonStr, true);
        if (!$data || !isset($data['articles']) || !is_array($data['articles'])) continue;

        foreach ($data['articles'] as $art) {
            $title = trim((string)($art['title'] ?? ''));
            $desc = trim((string)($art['description'] ?? $art['content'] ?? ''));
            $artUrl = trim((string)($art['url'] ?? ''));
            if (empty($title) || empty($artUrl)) continue;

            if (isHealthcareOnly($title, $desc, $healthKeywords, $strictNonHealthKeywords)) {
                $cleanTitle = explode(' - ', $title)[0];
                $articles[] = [
                    'id' => 'ph-' . substr(md5($artUrl), 0, 8),
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
    } catch (Throwable $e) {}
}

// 3. Filter strictly for healthcare topics and deduplicate by title
$uniqueArticles = [];
$seen = [];

foreach ($articles as $item) {
    if (!isHealthcareOnly($item['title'], $item['description'], $healthKeywords, $strictNonHealthKeywords)) {
        continue;
    }
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
