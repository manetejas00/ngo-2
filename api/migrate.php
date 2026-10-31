<?php
/**
 * AvinyaCareFoundation - Auto-Migration & Re-seed Runner Endpoint
 * Can be triggered via HTTP GET /api/migrate.php or deployment scripts
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Maintenance is available only through the server console.']);
    exit;
}

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cache-manager.php';

try {
    $pdo = getDatabaseConnection();
    if (!$pdo) {
        $root = dirname(__DIR__);
        $envUsed = is_file($root . '/.env') ? '.env' : (is_file($root . '/.env.production') ? '.env.production' : 'none');
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'envUsed' => $envUsed,
            'dbUser' => getDbEnv('DB_USER'),
            'dbName' => getDbEnv('DB_NAME'),
            'dbPassLen' => strlen(getDbEnv('DB_PASS')),
            'message' => 'Unable to establish Hostinger MySQL connection: ' . ($GLOBALS['last_db_conn_error'] ?? 'Unknown error')
        ]);
        exit;
    }

    $force = isset($_GET['force']) ? ($_GET['force'] === '1' || $_GET['force'] === 'true' || $_GET['force'] === 'yes') : true;
    
    // 1. Run full auto-migration with force flag
    $migrated = autoMigrateDatabaseTables($pdo, $force);

    // 2. Explicitly re-seed galleries table from data/seed_galleries.json
    $seededCount = seedGalleryFromJSON($pdo, true);

    // 2b. Explicitly re-seed crowdfunding campaigns from data/seed_crowdfunding.json
    $seededCampaignsCount = seedCrowdfundingFromJSON($pdo, true);

    // 2c. Seed default admin users for portal authentication
    $seededUsersCount = seedDefaultUsers($pdo, true);

    // Explicitly purge old placeholder tests (test-1 through test-8)
    $pdo->exec("DELETE FROM `diagnostic_tests` WHERE `test_id` IN ('test-1', 'test-2', 'test-3', 'test-4', 'test-5', 'test-6', 'test-7', 'test-8')");

    // 2c. Explicitly re-seed diagnostic tests catalog from api/healthcare/tests.json
    $seededCatalog = seedCatalogFromJSON($pdo, true);
    $seededTestsCount = $seededCatalog['tests_seeded'] ?? 0;

    // Invalidate and purge all application caches completely so endpoints reflect fresh DB state
    AvinyaCache::clearAll();

    // 3. Fetch updated list of active galleries to confirm DB state
    $stmtGal = $pdo->query("SELECT `gallery_id`, `title`, `category`, `image`, `is_published`, `created_at` FROM `galleries` ORDER BY `sort_order` ASC, `created_at` DESC");
    $galleries = $stmtGal->fetchAll(PDO::FETCH_ASSOC);

    // 3b. Fetch updated list of campaigns
    $stmtCamp = $pdo->query("SELECT `campaign_id`, `title`, `category`, `location`, `goal_amount`, `is_spotlight`, `is_published` FROM `crowdfunding_campaigns` WHERE `deleted_at` IS NULL ORDER BY `is_spotlight` DESC, `sort_order` ASC");
    $campaigns = $stmtCamp->fetchAll(PDO::FETCH_ASSOC);

    // 3c. Fetch diagnostic tests count and sample
    $stmtTests = $pdo->query("SELECT COUNT(*) FROM `diagnostic_tests` WHERE `is_active` = 1");
    $activeTestsCount = (int) $stmtTests->fetchColumn();

    // 4. List all existing tables to confirm schema health
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'status' => 'ok',
        'message' => 'Database migration, gallery, crowdfunding, and diagnostic tests re-seeding completed successfully.',
        'database' => getDbEnv('DB_NAME', 'u382139760_ngo'),
        'tablesCreated' => $tables,
        'galleriesCount' => count($galleries),
        'galleriesSeeded' => $seededCount,
        'campaignsCount' => count($campaigns),
        'campaignsSeeded' => $seededCampaignsCount,
        'testsCount' => $activeTestsCount,
        'testsSeeded' => $seededTestsCount,
        'usersSeeded' => $seededUsersCount,
        'galleries' => $galleries,
        'campaigns' => $campaigns,
        'timestamp' => date(DATE_ATOM)
    ], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Migration failed: ' . $e->getMessage()
    ]);
}

