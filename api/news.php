<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

require_once __DIR__ . '/rate_limiter.php';
enforcePhpRateLimit(60, 60);

// Fallback & Cache Files
$fallbackFile = __DIR__ . '/news.json';
$cacheFile = dirname(__DIR__) . '/cache/news_cache.json';
$cacheTtl = 86400; // 24 hours daily cycle

// Check if valid cache exists and is less than 24 hours old
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
    'fda', 'who', 'icmr', 'nih', 'blood donation', 'health', 'cardiac', 'insulin'
];

$strictNonHealthKeywords = [
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

// NewsData's free health feed returns the upstream image_url field directly.
// Configure NEWSDATA_API_KEY in the PHP host environment; never expose it to
// the client or add it to source control.
$newsDataKey = trim((string)(getenv('NEWSDATA_API_KEY') ?: ''));
$articles = [];

if ($newsDataKey !== '' && !str_starts_with($newsDataKey, 'YOUR_')) {
    try {
        $url = 'https://newsdata.io/api/1/latest?apikey=' . rawurlencode($newsDataKey) . '&category=health&language=en&size=10';
        $context = stream_context_create(['http' => ['timeout' => 3, 'header' => "User-Agent: AvinyaCareFoundationGlobalNews/1.0\r\n"]]);
        $jsonStr = @file_get_contents($url, false, $context);
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
                            'id' => 'ext-' . substr(md5($artUrl), 0, 8),
                            'title' => $cleanTitle,
                            'description' => !empty($desc) ? $desc : 'Read clinical update from worldwide healthcare sources.',
                            'category' => $cat,
                            'source' => $art['source_name'] ?? $art['source_id'] ?? 'NewsData Health Desk',
                            'apiProvider' => 'NewsData.io Health',
                            'publishedAt' => $art['pubDate'] ?? date('c'),
                            'url' => $artUrl,
                            // Keep the external API image value untouched. The
                            // frontend validates it and uses its single branded
                            // template when it is missing or cannot load.
                            'urlToImage' => isset($art['image_url']) && is_string($art['image_url']) ? trim($art['image_url']) : null,
                            'isAIGenerated' => false
                        ];
                    }
                }
            }
        }
    } catch (Throwable $e) {}
}

// Load static fallback articles (AI stories) and combine
$fallbackArticles = [];
if (file_exists($fallbackFile)) {
    $fbData = json_decode((string)file_get_contents($fallbackFile), true);
    if (!empty($fbData['articles']) && is_array($fbData['articles'])) {
        $fallbackArticles = $fbData['articles'];
    }
}

$combined = array_merge($fallbackArticles, $articles);

// Deduplicate
$seen = [];
$uniqueArticles = [];
foreach ($combined as $item) {
    $key = strtolower(preg_replace('/[^a-z0-9]/', '', (string)$item['title']));
    if (!empty($key) && !isset($seen[$key])) {
        $seen[$key] = true;
        $uniqueArticles[] = $item;
    }
}

// If articles fetched, return and save cache
if (count($uniqueArticles) > 0) {
    $payload = [
        'status' => 'ok',
        'cached' => false,
        'lastUpdated' => time() * 1000,
        'articles' => array_slice($uniqueArticles, 0, 24)
    ];

    @file_put_contents($cacheFile, json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    @file_put_contents($fallbackFile, json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit(0);
}

// Last resort fallback
if (file_exists($fallbackFile)) {
    echo file_get_contents($fallbackFile);
    exit(0);
}

echo json_encode(['status' => 'error', 'message' => 'Healthcare news service unavailable'], JSON_UNESCAPED_SLASHES);
exit(0);
