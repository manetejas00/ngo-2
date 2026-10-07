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
    'email' => 'info@avinyacarefoundation.com',
    'phone' => '+91 74474 41116',
    'whatsapp' => '+91 74474 41116',
    'address' => 'Mumbai-Virar, Maharashtra'
];

$settings = AvinyaCache::remember('settings:public', ['settings', 'homepage'], 1800, function () use ($defaults) {
    $pdo = getDatabaseConnection();
    if ($pdo === null) return $defaults;
    $rows = $pdo->query('SELECT setting_key, setting_value FROM site_settings')->fetchAll(PDO::FETCH_KEY_PAIR);
    return array_merge($defaults, array_filter($rows, fn($key) => array_key_exists($key, $defaults) || str_ends_with($key, '_url'), ARRAY_FILTER_USE_KEY));
});

echo json_encode(['status' => 'ok', 'settings' => $settings], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
