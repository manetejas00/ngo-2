<?php
/**
 * Avinya Care Foundation - Auto-Migration Runner Endpoint
 * Can be triggered via HTTP GET /api/migrate.php or deployment scripts
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

try {
    $pdo = getDatabaseConnection();
    if (!$pdo) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Unable to establish Hostinger MySQL connection. Check DB credentials in .env.'
        ]);
        exit;
    }

    $migrated = autoMigrateDatabaseTables($pdo);

    // List all existing tables to confirm schema health
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'status' => 'ok',
        'message' => 'Database migration check completed successfully.',
        'database' => getDbEnv('DB_NAME', 'u382139760_ngo'),
        'tablesCreated' => $tables,
        'timestamp' => date(DATE_ATOM)
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Migration failed: ' . $e->getMessage()
    ]);
}
