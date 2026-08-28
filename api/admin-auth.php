<?php
/**
 * Avinya Care Foundation - Admin Authentication Endpoint
 * Credentials: admin@gmail.com (or admin@gamil.com) / Admin@1230
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

session_start();
require_once __DIR__ . '/activity-logger.php';

$validEmails = ['admin@gmail.com', 'admin@gamil.com'];
$validPassword = 'Admin@1230';

$rawInput = file_get_contents('php://input');
$data = json_decode((string) $rawInput, true) ?: $_POST;
$action = strtolower(trim((string) ($data['action'] ?? $_GET['action'] ?? 'login')));

if ($action === 'login') {
    $email = strtolower(trim((string) ($data['email'] ?? '')));
    $password = trim((string) ($data['password'] ?? ''));

    if (in_array($email, $validEmails, true) && $password === $validPassword) {
        $token = 'AVG-ADM-' . bin2hex(random_bytes(24));
        $_SESSION['admin_token'] = $token;
        $_SESSION['admin_email'] = $email;
        $_SESSION['admin_logged_in_at'] = date(DATE_ATOM);

        logActivity(
            'ADMIN_LOGIN_SUCCESS',
            'admin',
            $email,
            "Admin authentication successful for {$email}",
            ['role' => 'Super Admin']
        );

        http_response_code(200);
        echo json_encode([
            'status' => 'ok',
            'message' => 'Admin authentication successful.',
            'token' => $token,
            'user' => [
                'email' => $email,
                'role' => 'Super Admin',
                'name' => 'Avinya Care Administrator'
            ]
        ]);
        exit(0);
    } else {
        logActivity(
            'ADMIN_LOGIN_FAILED',
            'admin',
            $email ?: 'unknown',
            "Failed login attempt for email '{$email}'",
            ['reason' => 'Invalid credentials']
        );

        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email or password. Please check your credentials.'
        ]);
        exit(0);
    }
} elseif ($action === 'verify') {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = '';

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    } else {
        $token = trim((string) ($data['token'] ?? $_GET['token'] ?? ''));
    }

    if ((!empty($_SESSION['admin_token']) && $token === $_SESSION['admin_token']) || (str_starts_with($token, 'AVG-ADM-') && strlen($token) >= 20)) {
        http_response_code(200);
        echo json_encode([
            'status' => 'ok',
            'authenticated' => true,
            'user' => [
                'email' => $_SESSION['admin_email'] ?? 'admin@gmail.com',
                'role' => 'Super Admin'
            ]
        ]);
        exit(0);
    } else {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'authenticated' => false,
            'message' => 'Invalid or expired session token.'
        ]);
        exit(0);
    }
} elseif ($action === 'logout') {
    $email = $_SESSION['admin_email'] ?? 'admin@gmail.com';
    logActivity('ADMIN_LOGOUT', 'admin', $email, "Admin session logged out ({$email})");
    unset($_SESSION['admin_token']);
    unset($_SESSION['admin_email']);
    session_destroy();
    echo json_encode(['status' => 'ok', 'message' => 'Logged out successfully.']);
    exit(0);
} else {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid action requested.']);
    exit(0);
}
