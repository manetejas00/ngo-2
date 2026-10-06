<?php
/**
 * Avinya Care Foundation - Gallery Table Reset & Cache Purge Endpoint
 * Truncates galleries table and flushes cache so user starts fresh with custom photos.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cache-manager.php';

try {
    $pdo = getDatabaseConnection();
    if ($pdo !== null) {
        $pdo->exec("TRUNCATE TABLE `galleries`");
    }

    AvinyaCache::clearAll();

    echo json_encode([
        'status' => 'ok',
        'message' => 'Galleries table truncated and cache purged cleanly.',
        'timestamp' => date(DATE_ATOM)
    ], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to reset gallery: ' . $e->getMessage()
    ]);
}
