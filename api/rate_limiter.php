<?php
/**
 * Avinya Care Foundation - Shared PHP Rate Limiter
 * Enforces IP-based rate limits across all PHP API endpoints.
 */

function enforcePhpRateLimit($maxRequests = 60, $windowSeconds = 60) {
    // Handle CORS Preflight OPTIONS requests without rate limiting
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        return;
    }

    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (strpos($ip, ',') !== false) {
        $ip = trim(explode(',', $ip)[0]);
    }

    $tmpDir = sys_get_temp_dir() . '/avinya_ratelimit';
    if (!is_dir($tmpDir)) {
        @mkdir($tmpDir, 0777, true);
    }

    $hashKey = md5($ip . '_' . ($_SERVER['SCRIPT_NAME'] ?? 'api'));
    $file = $tmpDir . '/' . $hashKey . '.json';
    $now = time();

    $data = ['count' => 0, 'start' => $now];
    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        if ($raw) {
            $parsed = @json_decode($raw, true);
            if (is_array($parsed) && isset($parsed['start']) && ($now - $parsed['start'] < $windowSeconds)) {
                $data = $parsed;
            }
        }
    }

    $data['count']++;
    @file_put_contents($file, json_encode($data), LOCK_EX);

    $remaining = max(0, $maxRequests - $data['count']);
    $reset = max(1, $windowSeconds - ($now - $data['start']));

    header("X-RateLimit-Limit: {$maxRequests}");
    header("X-RateLimit-Remaining: {$remaining}");
    header("X-RateLimit-Reset: {$reset}");

    if ($data['count'] > $maxRequests) {
        header("Retry-After: {$reset}");
        http_response_code(429);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => 'error',
            'message' => "Too many requests. Please slow down and try again in {$reset} seconds."
        ]);
        exit;
    }
}
