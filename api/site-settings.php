<?php
/** Public, cache-aware organization settings endpoint. */
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['status' => 'error']); exit; }

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cache-manager.php';

$defaults = [
    'organization_name' => 'AvinyaCareFoundation',
    'tagline' => 'No one should face a health crisis alone.',
    'email' => 'info@avinyacarefoundation.org',
    'phone' => '+91 744 744 1116',
    'whatsapp' => '+91 744 744 1116',
    'address' => '210, Global Plaza, Global City, Virar West - 401305',
    'instagram_url' => 'https://www.instagram.com/avinyacare_foundation/',
    'youtube_url' => 'https://www.youtube.com/@Avinyacarefoundation',
    'x_url' => 'https://x.com/Avinyacare',
    'threads_url' => 'https://www.threads.com/@avinyacare_foundation',
    'facebook_url' => '',
    'linkedin_url' => ''
];

$settings = AvinyaCache::remember('settings:public_v2', ['settings', 'homepage'], 1800, function () use ($defaults) {
    $pdo = getDatabaseConnection();
    if ($pdo === null) return $defaults;
    $rows = $pdo->query('SELECT setting_key, setting_value FROM site_settings')->fetchAll(PDO::FETCH_KEY_PAIR);
    return array_merge($defaults, array_filter($rows, fn($key) => array_key_exists($key, $defaults) || str_ends_with($key, '_url'), ARRAY_FILTER_USE_KEY));
});

// Retire the known obsolete address even when an older saved setting or cache remains.
if (strcasecmp(trim((string) ($settings['email'] ?? '')), 'info@avinyacarefoundation.com') === 0) {
    $settings['email'] = $defaults['email'];
}
if (preg_replace('/\D/', '', (string) ($settings['phone'] ?? '')) === '917447441116') {
    $settings['phone'] = $defaults['phone'];
}

// Ensure newly supported social media channels are never undefined or omitted
foreach (['instagram_url', 'youtube_url', 'x_url', 'threads_url'] as $socialKey) {
    if (empty($settings[$socialKey]) && !empty($defaults[$socialKey])) {
        $settings[$socialKey] = $defaults[$socialKey];
    }
}

echo json_encode(['status' => 'ok', 'settings' => $settings], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
