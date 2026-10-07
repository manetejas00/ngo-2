<?php
// Public, allow-listed configuration only. Never expose credentials here.
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
$id = getenv('GOOGLE_ANALYTICS_ID') ?: '';
if ($id === '') {
    $root = dirname(__DIR__);
    $envFile = $root . '/.env';
    if (!is_file($envFile)) {
        $envFile = str_contains($_SERVER['HTTP_HOST'] ?? '', 'test.avinyacarefoundation.org')
            ? $root . '/.env.staging' : $root . '/.env.production';
    }
    if (is_readable($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
            if (preg_match('/^\s*GOOGLE_ANALYTICS_ID\s*=\s*(.*?)\s*$/', $line, $match)) {
                $id = trim($match[1], "\"'");
                break;
            }
        }
    }
}
if (!preg_match('/^G-[A-Z0-9]+$/i', $id)) {
    $id = '';
}
echo json_encode(['googleAnalyticsId' => $id], JSON_UNESCAPED_SLASHES);
