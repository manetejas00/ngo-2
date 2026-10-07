<?php
/**
 * AvinyaCareFoundation - Auto-Migration & Re-seed Runner Endpoint
 * Can be triggered via HTTP GET /api/migrate.php or deployment scripts
 */

declare(strict_types=1);

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

    // Invalidate and purge all application caches completely so endpoints reflect fresh DB state
    AvinyaCache::clearAll();

    // 3. Fetch updated list of active galleries to confirm DB state
    $stmtGal = $pdo->query("SELECT `gallery_id`, `title`, `category`, `image`, `is_published`, `created_at` FROM `galleries` ORDER BY `sort_order` ASC, `created_at` DESC");
    $galleries = $stmtGal->fetchAll(PDO::FETCH_ASSOC);

    // 4. List all existing tables to confirm schema health
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'status' => 'ok',
        'message' => 'Database migration and gallery re-seeding completed successfully.',
        'database' => getDbEnv('DB_NAME', 'u382139760_ngo'),
        'tablesCreated' => $tables,
        'galleriesCount' => count($galleries),
        'galleriesSeeded' => $seededCount,
        'galleries' => $galleries,
        'timestamp' => date(DATE_ATOM)
    ], JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Migration failed: ' . $e->getMessage()
    ]);
}

