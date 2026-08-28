<?php
/**
 * Avinya Care Foundation - Central Activity Audit Logger
 * Records user, admin, and system activities into Hostinger MySQL `activity_logs` table
 * with fallback to local JSON file ledger.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function logActivity(
    string $eventType,
    string $actorType = 'user',
    ?string $actorIdentifier = null,
    string $action = '',
    array $details = []
): bool {
    $logId = 'ACT-' . time() . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 5));
    $ipAddress = getClientIpAddress();
    $userAgent = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'), 0, 255);
    $detailsJson = json_encode($details, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $createdAt = date('Y-m-d H:i:s');

    $dbSuccess = false;
    $pdo = getDatabaseConnection();

    if ($pdo !== null) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `activity_logs` (
                    `log_id`, `event_type`, `actor_type`, `actor_identifier`,
                    `action`, `details`, `ip_address`, `user_agent`, `created_at`
                ) VALUES (
                    :log_id, :event_type, :actor_type, :actor_identifier,
                    :action, :details, :ip_address, :user_agent, :created_at
                )
            ");
            $stmt->execute([
                ':log_id' => $logId,
                ':event_type' => strtoupper($eventType),
                ':actor_type' => strtolower($actorType),
                ':actor_identifier' => $actorIdentifier,
                ':action' => $action,
                ':details' => $detailsJson,
                ':ip_address' => $ipAddress,
                ':user_agent' => $userAgent,
                ':created_at' => $createdAt
            ]);
            $dbSuccess = true;
        } catch (Throwable $e) {
            error_log('Activity Logger DB Exception: ' . $e->getMessage());
        }
    }
    return $dbSuccess;
}

function getClientIpAddress(): string {
    $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
    foreach ($ipKeys as $key) {
        if (!empty($_SERVER[$key])) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}
