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

// Default Open-Access Health & Science News Feed Endpoints
$defaultEndpoints = [
    'https://saurav.tech/NewsAPI/top-headlines/category/health/in.json',
    'https://saurav.tech/NewsAPI/top-headlines/category/health/us.json',
    'https://saurav.tech/NewsAPI/top-headlines/category/science/in.json',
    'https://saurav.tech/NewsAPI/top-headlines/category/science/us.json'
];

$articles = [];
$fallbackFile = __DIR__ . '/news.json';

foreach ($defaultEndpoints as $url) {
    try {
        $context = stream_context_create(['http' => ['timeout' => 3, 'header' => 'User-Agent: AvinyaCareNewsBot/1.0\r\n']]);
        $jsonStr = @file_get_contents($url, false, $context);
        if ($jsonStr) {
            $data = json_decode($jsonStr, true);
            if (isset($data['articles']) && is_array($data['articles'])) {
                foreach (array_slice($data['articles'], 0, 4) as $art) {
                    if (!empty($art['title']) && !empty($art['url'])) {
                        $articles[] = [
                            'id' => 'ext-' . substr(md5($art['url']), 0, 8),
                            'title' => $art['title'],
                            'description' => $art['description'] ?? '',
                            'category' => 'Health & Science',
                            'source' => $art['source']['name'] ?? 'Medical Research',
                            'publishedAt' => $art['publishedAt'] ?? date('c'),
                            'url' => $art['url'],
                            'urlToImage' => $art['urlToImage'] ?? 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80'
                        ];
                    }
                }
            }
        }
    } catch (Throwable $e) {
        // Skip failed external endpoint
    }
}

// If external news fetch returned articles, render them; otherwise fallback to news.json
if (count($articles) > 0) {
    echo json_encode([
        'status' => 'ok',
        'cached' => false,
        'lastUpdated' => time() * 1000,
        'articles' => array_values($articles)
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit(0);
}

// Fallback to local static news cache
if (file_exists($fallbackFile)) {
    echo file_get_contents($fallbackFile);
    exit(0);
}

echo json_encode(['status' => 'error', 'message' => 'News service unavailable'], JSON_UNESCAPED_SLASHES);
exit(0);
