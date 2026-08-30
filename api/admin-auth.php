<?php
/**
 * Avinya Care Foundation - Admin & Role-Based Authentication Endpoint
 * Supports Super Admin, Doctor, and Diagnostic Provider Accounts
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

ini_set('session.use_strict_mode', '1');
session_set_cookie_params(['secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Strict', 'path' => '/']);
session_start();
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/activity-logger.php';
require_once __DIR__ . '/password-reset-email.php';

$rawInput = file_get_contents('php://input');
$data = json_decode((string) $rawInput, true) ?: $_POST;
$action = strtolower(trim((string) ($_GET['action'] ?? $data['action'] ?? $_POST['action'] ?? 'login')));

$pdo = getDatabaseConnection();

// Action: Get Temporary Dev Users list grouped by role
if ($action === 'get_temp_users' || $action === 'temp_users') {
    if (empty($_SESSION['admin_token']) || ($_SESSION['user_role'] ?? '') !== 'admin') {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
        exit(0);
    }
    $usersList = [];
    if ($pdo !== null) {
        $stmt = $pdo->query("SELECT `user_id`, `name`, `email`, `role`, `doctor_id`, `provider_id` FROM `users` WHERE `status` = 'active' ORDER BY `role` ASC, `name` ASC");
        $usersList = $stmt->fetchAll();
    }

    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'users' => array_map(function($u) {
            return [
                'userId' => $u['user_id'],
                'name' => $u['name'],
                'email' => $u['email'],
                'role' => strtolower($u['role']),
                'doctorId' => $u['doctor_id'],
                'providerId' => $u['provider_id']
            ];
        }, $usersList)
    ]);
    exit(0);
}

// Action: Login
if ($action === 'login' || $action === 'temp_login') {
    $identifier = strtolower(trim((string) ($data['email'] ?? $data['username'] ?? $data['user_id'] ?? $data['userId'] ?? '')));
    $password = trim((string) ($data['password'] ?? ''));

    if (!$identifier || !$password) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Email/Username and Password are required.']);
        exit(0);
    }

    $user = null;
    if ($pdo !== null) {
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(`email`) = :q OR LOWER(`user_id`) = :q LIMIT 1");
        $stmt->execute([':q' => $identifier]);
        $user = $stmt->fetch();
    }

    if (!$user) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid email/username or password.']);
        exit(0);
    }

    if (strtolower($user['status'] ?? 'active') !== 'active') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Your account is currently unavailable. Please contact the administrator.']);
        exit(0);
    }

    $hash = $user['password_hash'] ?? '';
    $isValidPassword = $hash !== '' && password_verify($password, $hash);

    if (!$isValidPassword) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Invalid email/username or password.']);
        exit(0);
    }

    if ($pdo !== null) {
        try {
            $updStmt = $pdo->prepare("UPDATE `users` SET `last_login` = NOW() WHERE `user_id` = :uid");
            $updStmt->execute([':uid' => $user['user_id']]);
        } catch (Throwable $e) {}
    }

    session_regenerate_id(true);
    $token = 'AVG-SESS-' . bin2hex(random_bytes(32));
    $_SESSION['admin_token'] = $token;
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = strtolower($user['role']);
    $_SESSION['user_doc_id'] = $user['doctor_id'] ?? null;
    $_SESSION['user_prov_id'] = $user['provider_id'] ?? null;

    logActivity('USER_LOGIN_SUCCESS', $user['role'], $user['email'], "Authenticated user {$user['name']} as {$user['role']}");

    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'message' => 'Authentication successful.',
        'token' => $token,
        'user' => [
            'userId' => $user['user_id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'phone' => $user['phone'] ?? '',
            'avatar' => $user['avatar'] ?? '',
            'role' => strtolower($user['role']),
            'doctorId' => $user['doctor_id'] ?? null,
            'providerId' => $user['provider_id'] ?? null,
            'must_change_password' => (bool) ($user['must_change_password'] ?? 1)
        ]
    ]);
    exit(0);
}

// Action: View/update the signed-in user's own profile.
if ($action === 'get_profile' || $action === 'update_profile') {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches);
    $requestToken = trim((string) ($matches[1] ?? $data['token'] ?? ''));
    if (empty($_SESSION['admin_token']) || $requestToken === '' || !hash_equals((string) $_SESSION['admin_token'], $requestToken)) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
        exit(0);
    }
    $userId = (string) ($_SESSION['user_id'] ?? '');
    $stmt = $pdo?->prepare("SELECT `user_id`, `name`, `email`, `phone`, `avatar`, `role`, `doctor_id`, `provider_id`, `status`, `last_login` FROM `users` WHERE `user_id` = :uid LIMIT 1");
    $stmt?->execute([':uid' => $userId]);
    $profile = $stmt?->fetch();
    if (!$profile) {
        http_response_code(404); echo json_encode(['status' => 'error', 'message' => 'Profile not found.']); exit(0);
    }

    if ($action === 'update_profile') {
        $name = trim((string) ($data['name'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $phone = trim((string) ($data['phone'] ?? ''));
        $avatar = trim((string) ($data['avatar'] ?? ''));
        if ($name === '' || mb_strlen($name) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'Enter a valid name and email address.']); exit(0);
        }
        if ($phone !== '' && !preg_match('/^[0-9+() .-]{7,20}$/', $phone)) {
            http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'Enter a valid phone number.']); exit(0);
        }
        if ($avatar !== '' && (!filter_var($avatar, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $avatar))) {
            http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'Profile image must be a valid HTTPS or HTTP URL.']); exit(0);
        }
        $duplicate = $pdo->prepare("SELECT 1 FROM `users` WHERE LOWER(`email`) = :email AND `user_id` <> :uid LIMIT 1");
        $duplicate->execute([':email' => $email, ':uid' => $userId]);
        if ($duplicate->fetchColumn()) {
            http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'That email address is already in use.']); exit(0);
        }
        $update = $pdo->prepare("UPDATE `users` SET `name` = :name, `email` = :email, `phone` = :phone, `avatar` = :avatar WHERE `user_id` = :uid");
        $update->execute([':name' => $name, ':email' => $email, ':phone' => $phone ?: null, ':avatar' => $avatar ?: null, ':uid' => $userId]);
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $profile = array_merge($profile, ['name' => $name, 'email' => $email, 'phone' => $phone, 'avatar' => $avatar]);
        logActivity('PROFILE_UPDATED', (string) $profile['role'], $email, 'Updated own profile');
    }

    echo json_encode(['status' => 'ok', 'message' => $action === 'update_profile' ? 'Profile updated successfully.' : 'Profile loaded.', 'user' => $profile]);
    exit(0);
}

// Action: Force Change Password or Normal Password Change
if ($action === 'change_password' || $action === 'force_change_password') {
    $currentPass = trim((string) ($data['currentPassword'] ?? $data['current_password'] ?? ''));
    $newPass = trim((string) ($data['newPassword'] ?? $data['new_password'] ?? ''));
    $confirmPass = trim((string) ($data['confirmPassword'] ?? $data['confirm_password'] ?? ''));

    if ($newPass !== $confirmPass) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'New password and confirmation password do not match.']);
        exit(0);
    }
    if (strlen($newPass) < 8 || !preg_match('/[A-Z]/', $newPass) || !preg_match('/[a-z]/', $newPass) || !preg_match('/[0-9]/', $newPass) || !preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]/', $newPass)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Password must be at least 8 chars long with uppercase, lowercase, number, and special character.']);
        exit(0);
    }

    $userId = (string) ($_SESSION['user_id'] ?? '');
    if ($userId === '' || empty($_SESSION['admin_token'])) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
        exit(0);
    }
    if ($currentPass === '') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Current password is required.']);
        exit(0);
    }
    if ($pdo !== null) {
        $stmt = $pdo->prepare("SELECT `password_hash` FROM `users` WHERE `user_id` = :uid LIMIT 1");
        $stmt->execute([':uid' => $userId]);
        $u = $stmt->fetch();
        if (!$u || !password_verify($currentPass, (string) $u['password_hash'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Current password is incorrect.']);
            exit(0);
        }

        $newHash = password_hash($newPass, PASSWORD_DEFAULT);
        $upd = $pdo->prepare("UPDATE `users` SET `password_hash` = :h, `must_change_password` = 0, `password_changed_at` = NOW() WHERE `user_id` = :uid");
        $upd->execute([':h' => $newHash, ':uid' => $userId]);
    }

    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'Password changed successfully.']);
    exit(0);
}

// Action: Forgot Password
if ($action === 'forgot_password') {
    $email = strtolower(trim((string) ($data['email'] ?? '')));
    if (!$email) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Email address is required.']);
        exit(0);
    }

    if ($pdo !== null) {
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(`email`) = :e LIMIT 1");
        $stmt->execute([':e' => $email]);
        $u = $stmt->fetch();
        if ($u) {
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+45 minutes'));
            $pdo->prepare("UPDATE `password_resets` SET `used` = 1 WHERE `email` = :e AND `used` = 0")->execute([':e' => $email]);
            $ins = $pdo->prepare("INSERT INTO `password_resets` (`email`, `token`, `expires_at`, `used`) VALUES (:e, :t, :exp, 0)");
            $ins->execute([':e' => $email, ':t' => $tokenHash, ':exp' => $expiresAt]);

            $configuredBase = rtrim(resetMailEnv('RESET_BASE_URL'), '/');
            $host = preg_replace('/[^a-z0-9.:-]/i', '', (string) ($_SERVER['HTTP_HOST'] ?? ''));
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $baseUrl = $configuredBase !== '' ? $configuredBase : ($host !== '' ? $scheme . '://' . $host : '');
            $resetUrl = $baseUrl . '/admin.html#reset-password?token=' . rawurlencode($token);
            $mail = $baseUrl !== '' ? sendPasswordResetEmail($email, (string) ($u['name'] ?? ''), $resetUrl, 45) : ['sent' => false, 'error' => 'Application base URL is not configured.'];
            $smtpStatus = !empty($mail['sent']) ? 'SENT' : 'FAILED';
            $log = $pdo->prepare("INSERT INTO `email_logs` (`reference_id`, `form_or_booking_type`, `recipient_role`, `recipient_email`, `subject`, `smtp_status`, `delivery_method`, `error_message`) VALUES (:ref, 'PASSWORD_RESET', 'user', :email, :subject, :status, 'HOSTINGER_SSL_SMTP', :error)");
            $log->execute([
                ':ref' => 'RESET-' . bin2hex(random_bytes(8)), ':email' => $email,
                ':subject' => $mail['subject'] ?? 'Password Reset — Avinya Care Foundation', ':status' => $smtpStatus,
                ':error' => $mail['error'] ?? null
            ]);
            if (empty($mail['sent'])) {
                $pdo->prepare("UPDATE `password_resets` SET `used` = 1 WHERE `token` = :t")->execute([':t' => $tokenHash]);
                error_log('Password reset email delivery failed: ' . ($mail['error'] ?? 'Unknown SMTP error'));
                http_response_code(503);
                echo json_encode(['status' => 'error', 'message' => 'The reset email could not be delivered. Please try again later.']);
                exit(0);
            }
        }
    }

    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'If an account exists with this email address, a password reset link has been sent.']);
    exit(0);
}

// Action: Reset Password with Token
if ($action === 'reset_password') {
    $token = trim((string) ($data['token'] ?? ''));
    $newPass = trim((string) ($data['newPassword'] ?? $data['new_password'] ?? ''));
    $confirmPass = trim((string) ($data['confirmPassword'] ?? $data['confirm_password'] ?? ''));

    if (!$token) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Reset token is required.']);
        exit(0);
    }
    if ($newPass !== $confirmPass) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'New password and confirmation password do not match.']);
        exit(0);
    }
    if (strlen($newPass) < 8 || !preg_match('/[A-Z]/', $newPass) || !preg_match('/[a-z]/', $newPass) || !preg_match('/[0-9]/', $newPass) || !preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\\\|,.<>\/?]/', $newPass)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Password must be at least 8 chars long with uppercase, lowercase, number, and special character.']);
        exit(0);
    }

    if ($pdo !== null) {
        $stmt = $pdo->prepare("SELECT * FROM `password_resets` WHERE `token` = :t AND `used` = 0 AND `expires_at` > NOW() LIMIT 1");
        $stmt->execute([':t' => hash('sha256', $token)]);
        $rst = $stmt->fetch();
        if (!$rst) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid or expired password reset link.']);
            exit(0);
        }

        $newHash = password_hash($newPass, PASSWORD_DEFAULT);
        $updUser = $pdo->prepare("UPDATE `users` SET `password_hash` = :h, `must_change_password` = 0, `password_changed_at` = NOW() WHERE `email` = :e");
        $updUser->execute([':h' => $newHash, ':e' => $rst['email']]);

        $updReset = $pdo->prepare("UPDATE `password_resets` SET `used` = 1 WHERE `id` = :id");
        $updReset->execute([':id' => $rst['id']]);
    }

    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'Your password has been reset successfully. Please login using your new password.']);
    exit(0);
}

// Action: Verify Token / Session State
if ($action === 'verify') {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    $token = '';

    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
    } else {
        $token = trim((string) ($data['token'] ?? $_GET['token'] ?? ''));
    }

    $isValidToken = !empty($_SESSION['admin_token']) && hash_equals((string) $_SESSION['admin_token'], $token);

    if ($isValidToken) {
        $userRole = $_SESSION['user_role'] ?? 'admin';
        $userDocId = $_SESSION['user_doc_id'] ?? null;
        $userProvId = $_SESSION['user_prov_id'] ?? null;
        $userName = $_SESSION['user_name'] ?? 'Super Admin';
        $userEmail = $_SESSION['user_email'] ?? 'admin@gmail.com';
        $userId = $_SESSION['user_id'] ?? 'usr-admin-01';

        http_response_code(200);
        echo json_encode([
            'status' => 'ok',
            'authenticated' => true,
            'user' => [
                'userId' => $userId,
                'email' => $userEmail,
                'name' => $userName,
                'role' => $userRole,
                'doctorId' => $userDocId,
                'providerId' => $userProvId
            ]
        ]);
        exit(0);
    } else {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'authenticated' => false,
            'message' => 'Invalid or expired admin session token.'
        ]);
        exit(0);
    }
}

// Action: Logout
if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();

    echo json_encode(['status' => 'ok', 'message' => 'Logged out successfully.']);
    exit(0);
}

http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'Invalid action requested.']);
exit(0);
