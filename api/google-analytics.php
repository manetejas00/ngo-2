<?php
/** Authenticated GA4 Data API report for the administration dashboard. */
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, private');
require_once __DIR__ . '/db.php';

session_set_cookie_params(['lifetime' => 1800, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Strict', 'path' => '/']);
session_start();
$pdo = getDatabaseConnection();
if (!verifyAndRehydrateAdminToken($pdo, getBearerToken()) || !in_array(strtolower((string) ($_SESSION['user_role'] ?? '')), ['admin', 'manager'], true)) {
    http_response_code(401); echo json_encode(['status' => 'error', 'message' => 'Unauthorized']); exit;
}

function gaBase64Url(string $value): string { return rtrim(strtr(base64_encode($value), '+/', '-_'), '='); }
function gaRequest(string $url, array $headers, ?array $body = null): array {
    $curl = curl_init($url);
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => $headers]);
    if ($body !== null) { curl_setopt($curl, CURLOPT_POST, true); curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body)); }
    $result = curl_exec($curl); $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE); curl_close($curl);
    return [$status, json_decode((string) $result, true) ?: []];
}
function gaAccessToken(string $email, string $privateKey): string {
    $now = time();
    $header = gaBase64Url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $claims = gaBase64Url(json_encode(['iss' => $email, 'scope' => 'https://www.googleapis.com/auth/analytics.readonly', 'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $now, 'exp' => $now + 3600]));
    $input = $header . '.' . $claims; $signature = '';
    if (!openssl_sign($input, $signature, $privateKey, OPENSSL_ALGO_SHA256)) throw new RuntimeException('Could not sign the Google service-account request.');
    $assertion = $input . '.' . gaBase64Url($signature);
    $curl = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_POST => true, CURLOPT_POSTFIELDS => http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $assertion]), CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']]);
    $result = curl_exec($curl); $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE); curl_close($curl);
    $data = json_decode((string) $result, true) ?: [];
    if ($status !== 200 || empty($data['access_token'])) throw new RuntimeException('Google authorization failed. Confirm the service account has Analytics Viewer access.');
    return (string) $data['access_token'];
}

$propertyId = preg_replace('/\D/', '', getDbEnv('GA4_PROPERTY_ID'));
$email = getDbEnv('GA4_SERVICE_ACCOUNT_EMAIL');
$privateKey = str_replace('\\n', "\n", getDbEnv('GA4_SERVICE_ACCOUNT_PRIVATE_KEY'));
if ($propertyId === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $privateKey === '') {
    echo json_encode(['status' => 'not_configured', 'message' => 'GA4 reporting has not been configured yet.']); exit;
}

$cacheFile = dirname(__DIR__) . '/cache/ga4-dashboard.json';
if (is_file($cacheFile) && (time() - filemtime($cacheFile)) < 900) {
    $cached = json_decode((string) file_get_contents($cacheFile), true);
    if (is_array($cached)) { echo json_encode($cached); exit; }
}

try {
    $token = gaAccessToken($email, $privateKey);
    $body = ['dateRanges' => [['startDate' => '30daysAgo', 'endDate' => 'today'], ['startDate' => '60daysAgo', 'endDate' => '31daysAgo']], 'metrics' => [['name' => 'activeUsers'], ['name' => 'sessions'], ['name' => 'screenPageViews'], ['name' => 'averageSessionDuration']]];
    [$status, $report] = gaRequest('https://analyticsdata.googleapis.com/v1beta/properties/' . rawurlencode($propertyId) . ':runReport', ['Authorization: Bearer ' . $token, 'Content-Type: application/json'], $body);
    if ($status !== 200) throw new RuntimeException('Google Analytics could not return a report.');
    $rows = $report['rows'] ?? [];
    $values = static function (int $index) use ($rows): array { return array_map('floatval', $rows[$index]['metricValues'] ?? [0, 0, 0, 0]); };
    $current = $values(0); $previous = $values(1);
    $metrics = ['activeUsers' => $current[0] ?? 0, 'sessions' => $current[1] ?? 0, 'pageViews' => $current[2] ?? 0, 'engagementSeconds' => $current[3] ?? 0];
    $prior = ['activeUsers' => $previous[0] ?? 0, 'sessions' => $previous[1] ?? 0, 'pageViews' => $previous[2] ?? 0, 'engagementSeconds' => $previous[3] ?? 0];
    $changes = []; foreach ($metrics as $key => $value) $changes[$key] = $prior[$key] > 0 ? round((($value - $prior[$key]) / $prior[$key]) * 100, 1) : null;
    $response = ['status' => 'ok', 'range' => 'Last 30 days', 'metrics' => $metrics, 'changes' => $changes, 'updatedAt' => gmdate('c')];
    @mkdir(dirname($cacheFile), 0755, true); @file_put_contents($cacheFile, json_encode($response), LOCK_EX);
    echo json_encode($response);
} catch (Throwable $error) {
    http_response_code(502); echo json_encode(['status' => 'error', 'message' => $error->getMessage()]);
}
