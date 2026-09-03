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

require_once dirname(__DIR__) . '/db.php';
require_once dirname(__DIR__) . '/rate_limiter.php';
enforcePhpRateLimit(60, 60);

try {
    $pdo = getDatabaseConnection();
    if ($pdo !== null) {
        // Ensure catalog table is populated if empty
        seedCatalogFromJSON($pdo);

        $stmt = $pdo->query("SELECT * FROM `diagnostic_tests` WHERE `is_active` = 1 ORDER BY `id` ASC");
        $rows = $stmt->fetchAll();
        $tests = [];

        foreach ($rows as $r) {
            $tId = $r['test_id'] ?? $r['id'];
            $tests[] = [
                'id' => $tId,
                'name' => $r['name'],
                'category' => $r['category'],
                'tagline' => $r['tagline'],
                'description' => $r['description'],
                'price' => (float) $r['price'],
                'originalPrice' => (float) $r['original_price'],
                'avinyaSubsidy' => $r['avinya_subsidy'],
                'testsIncluded' => json_decode($r['tests_included'] ?? '[]', true) ?: [],
                'preparation' => $r['preparation'],
                'reportTurnaround' => $r['report_turnaround'],
                'sampleType' => $r['sample_type'] ?? 'Blood / Serum Sample',
                'icon' => $r['icon'] ?? '🧪',
                'homeCollection' => (bool) $r['home_collection'],
                'centreVisit' => (bool) $r['centre_visit'],
                'isPriority' => (bool) $r['is_priority'],
                'badge' => $r['badge']
            ];
        }

        echo json_encode([
            'status' => 'ok',
            'tests' => $tests,
            'data' => $tests
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit(0);
    }
} catch (Throwable $e) {
    error_log("Dynamic diagnostic tests API error: " . $e->getMessage());
}

echo json_encode(['status' => 'error', 'message' => 'Unable to fetch diagnostic tests from database.'], JSON_UNESCAPED_SLASHES);
exit(0);
