<?php
declare(strict_types=1);
require_once __DIR__ . '/../api/password-reset-store.php';

function checkReset(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException($message);
}

function testPasswordResetStore(PDO $pdo): void {
    $email = 'isolated-reset@example.invalid';
    $pdo->exec("INSERT INTO users (user_id, name, email, password_hash, session_token, session_expires, must_change_password) VALUES ('isolated-reset', 'Isolated reset test', '$email', 'old-hash', 'old-session', '2099-01-01 00:00:00', 1)");
    $insert = $pdo->prepare('INSERT INTO password_resets (email, token, expires_at, used) VALUES (:email, :token, :expiry, 0)');
    foreach (['valid', 'other', 'expired'] as $token) {
        $insert->execute([':email'=>$email, ':token'=>hash('sha256', $token), ':expiry'=>$token === 'expired' ? '2000-01-01 00:00:00' : '2099-01-01 00:00:00']);
    }
    checkReset(!completeStaffPasswordReset($pdo, 'expired', 'NewPassword!234'), 'expired link accepted');
    checkReset(!completeStaffPasswordReset($pdo, 'missing', 'NewPassword!234'), 'unknown link accepted');
    checkReset(completeStaffPasswordReset($pdo, 'valid', 'NewPassword!234'), 'valid link rejected');
    $user = $pdo->query("SELECT * FROM users WHERE email = '$email'")->fetch(PDO::FETCH_ASSOC);
    checkReset(password_verify('NewPassword!234', $user['password_hash']), 'new password does not authenticate');
    checkReset($user['session_token'] === null && $user['session_expires'] === null, 'old session remains');
    checkReset((int)$user['must_change_password'] === 0, 'temporary password flag remains');
    checkReset(!completeStaffPasswordReset($pdo, 'valid', 'AnotherPassword!234'), 'link reusable');
    checkReset(!completeStaffPasswordReset($pdo, 'other', 'AnotherPassword!234'), 'older link remains valid');
    // A failed database save must roll back consumption of the reset link.
    $insert->execute([':email'=>$email, ':token'=>hash('sha256','rollback'), ':expiry'=>'2099-01-01 00:00:00']);
    $pdo->exec('ALTER TABLE users DROP COLUMN session_expires');
    try {
        completeStaffPasswordReset($pdo, 'rollback', 'AnotherPassword!234');
        throw new RuntimeException('missing schema was silently accepted');
    } catch (PDOException $error) {
        $lookup = $pdo->prepare('SELECT used FROM password_resets WHERE token = :token');
        $lookup->execute([':token'=>hash('sha256','rollback')]);
        checkReset((int)$lookup->fetchColumn() === 0, 'failed save consumed the link');
        $user = $pdo->query("SELECT password_hash FROM users WHERE email = '$email'")->fetchColumn();
        checkReset(password_verify('NewPassword!234', $user), 'failed save changed password');
    }
    echo "Password reset save, authentication, expiry, replay prevention, session revocation and rollback passed.\n";
}

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    $pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('CREATE TABLE users (user_id TEXT, name TEXT, email TEXT UNIQUE, password_hash TEXT, session_token TEXT, session_expires TEXT, must_change_password INTEGER, password_changed_at TEXT)');
    $pdo->exec('CREATE TABLE password_resets (id INTEGER PRIMARY KEY, email TEXT, token TEXT UNIQUE, expires_at TEXT, used INTEGER)');
    testPasswordResetStore($pdo);
}
