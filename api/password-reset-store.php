<?php
declare(strict_types=1);

// Consume the link and save the password together. A failed save must leave the
// link usable, and simultaneous requests must not reuse the same link.
function completeStaffPasswordReset(PDO $pdo, string $token, string $newPassword): bool {
    $tokenHash = hash('sha256', $token);
    $pdo->beginTransaction();
    try {
        $consume = $pdo->prepare('UPDATE password_resets SET used = 1 WHERE token = :token AND used = 0 AND expires_at > CURRENT_TIMESTAMP');
        $consume->execute([':token' => $tokenHash]);
        if ($consume->rowCount() !== 1) {
            $pdo->rollBack();
            return false;
        }
        $lookup = $pdo->prepare('SELECT email FROM password_resets WHERE token = :token LIMIT 1');
        $lookup->execute([':token' => $tokenHash]);
        $email = $lookup->fetchColumn();
        $save = $pdo->prepare('UPDATE users SET password_hash = :hash, session_token = NULL, session_expires = NULL, must_change_password = 0, password_changed_at = CURRENT_TIMESTAMP WHERE email = :email');
        $save->execute([':hash' => password_hash($newPassword, PASSWORD_DEFAULT), ':email' => $email]);
        if ($save->rowCount() !== 1) {
            $pdo->rollBack();
            return false;
        }
        $invalidate = $pdo->prepare('UPDATE password_resets SET used = 1 WHERE email = :email AND used = 0');
        $invalidate->execute([':email' => $email]);
        $pdo->commit();
        return true;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
}
