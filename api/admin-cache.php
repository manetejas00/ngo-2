<?php
/**
 * AvinyaCareFoundation - Admin Cache Management API
 * Authorized endpoint providing real-time cache diagnostics and safe cache clearing operations.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

ini_set('session.use_strict_mode', '1');
session_set_cookie_params(['lifetime' => 1800, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Strict', 'path' => '/']);
session_start();

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cache-manager.php';
require_once __DIR__ . '/activity-logger.php';

$pdo = getDatabaseConnection();
$token = getBearerToken();
$rawInput = file_get_contents('php://input');
$data = json_decode((string) $rawInput, true) ?: $_POST;

$isAuthenticated = verifyAndRehydrateAdminToken($pdo, $token);

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized access. Administrator authorization required.'
    ]);
    exit(0);
}

$userRole = strtolower(trim((string) ($_SESSION['user_role'] ?? 'admin')));
if (!in_array($userRole, ['admin', 'manager'], true)) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Forbidden. System cache management requires administrator permissions.'
    ]);
    exit(0);
}

$action = strtolower(trim((string) ($data['action'] ?? $_GET['action'] ?? 'status')));
$adminEmail = $_SESSION['admin_email'] ?? 'admin@avinyacarefoundation.org';

if ($action === 'status') {
    echo json_encode([
        'status' => 'ok',
        'diagnostics' => AvinyaCache::getStatus()
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'POST request required for cache operations.']);
    exit(0);
}

$message = '';

switch ($action) {
    case 'clear_app':
    case 'clear_data':
        AvinyaCache::clearAll();
        $message = 'Application data cache cleared successfully.';
        logActivity('ADMIN_CACHE_CLEAR_APP', 'admin', $adminEmail, 'Cleared application data cache.');
        break;

    case 'clear_view':
        // Flush OPcache / View cache
        if (function_exists('opcache_reset')) {
            @opcache_reset();
        }
        AvinyaCache::invalidateGroup('views');
        $message = 'View cache and compiled templates cleared successfully.';
        logActivity('ADMIN_CACHE_CLEAR_VIEW', 'admin', $adminEmail, 'Cleared view & template cache.');
        break;

    case 'clear_route':
        AvinyaCache::invalidateGroup('routes');
        $message = 'Route rewrite rules cache cleared successfully.';
        logActivity('ADMIN_CACHE_CLEAR_ROUTE', 'admin', $adminEmail, 'Cleared route cache.');
        break;

    case 'clear_config':
        loadEnvDatabaseVars();
        AvinyaCache::invalidateGroup('config');
        $message = 'Environment and configuration cache reloaded successfully.';
        logActivity('ADMIN_CACHE_CLEAR_CONFIG', 'admin', $adminEmail, 'Cleared configuration cache.');
        break;

    case 'clear_all':
        AvinyaCache::clearAll();
        if (function_exists('opcache_reset')) {
            @opcache_reset();
        }
        $message = 'Website cache cleared successfully. Fresh cache will rebuild automatically as visitors browse.';
        logActivity('ADMIN_CACHE_CLEAR_ALL', 'admin', $adminEmail, 'Executed full website cache flush.');
        break;

    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid cache action specified.']);
        exit(0);
}

echo json_encode([
    'status' => 'ok',
    'message' => $message,
    'timestamp' => date('d M Y, h:i A \I\S\T'),
    'diagnostics' => AvinyaCache::getStatus()
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
exit(0);
