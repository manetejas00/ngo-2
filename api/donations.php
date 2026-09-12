<?php
/**
 * Avinya Care Foundation - Public Donations Feed API
 * Serves real verified donation records from MySQL / persistent storage.
 * Sorted latest first, with no timestamps (for live activity ticker).
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

require_once __DIR__ . '/rate_limiter.php';
enforcePhpRateLimit(60, 60);

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? '';
$isStats = (strpos($_SERVER['REQUEST_URI'], '/stats') !== false) || ($action === 'stats');

if ($isStats) {
    $totalRaised = 0;
    $totalDonors = 0;
    try {
        $pdo = getDatabaseConnection();
        if ($pdo !== null) {
            $stmt = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total_raised, COUNT(*) as total_donations, COUNT(DISTINCT NULLIF(LOWER(email), '')) as unique_donors FROM form_submissions WHERE LOWER(form_type) = 'donation' AND amount > 0 AND UPPER(payment_status) IN ('SUCCESS', 'CONFIRMED', 'PAID')");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalRaised = (float)($row['total_raised'] ?? 0);
            $totalDonors = (int)($row['unique_donors'] ?? 0);
            $totalDonations = (int)($row['total_donations'] ?? 0);
            $categories = [];
            $campaignDonors = [];
            $categoryStmt = $pdo->query("SELECT COALESCE(NULLIF(category, ''), NULLIF(interest, ''), 'General Fund') AS campaign, COALESCE(SUM(amount), 0) AS total FROM form_submissions WHERE LOWER(form_type) = 'donation' AND amount > 0 AND UPPER(payment_status) IN ('SUCCESS', 'CONFIRMED', 'PAID') GROUP BY campaign");
            foreach ($categoryStmt->fetchAll(PDO::FETCH_ASSOC) as $categoryRow) {
                $categories[$categoryRow['campaign']] = (float)$categoryRow['total'];
            }
            $donorStmt = $pdo->query("SELECT COALESCE(NULLIF(category, ''), NULLIF(interest, ''), 'General Fund') AS campaign, COUNT(DISTINCT NULLIF(LOWER(email), '')) AS donors FROM form_submissions WHERE LOWER(form_type) = 'donation' AND amount > 0 AND UPPER(payment_status) IN ('SUCCESS', 'CONFIRMED', 'PAID') GROUP BY campaign");
            foreach ($donorStmt->fetchAll(PDO::FETCH_ASSOC) as $donorRow) {
                $campaignDonors[$donorRow['campaign']] = (int)$donorRow['donors'];
            }
        }
    } catch (Throwable $e) {}
    
    echo json_encode([
        'status' => 'ok',
        'stats' => [
            'total' => $totalRaised,
            'total_donations' => $totalDonations ?? 0,
            'unique_donors' => $totalDonors,
            'donors' => $totalDonors,
            'categories' => $categories
            ,'campaign_donors' => $campaignDonors ?? []
        ]
    ]);
    exit;
}

$donations = [];

// 1. Try fetching from MySQL database
try {
    $pdo = getDatabaseConnection();
    if ($pdo !== null) {
        $stmt = $pdo->prepare("
            SELECT id, submission_id, name, amount, interest, message, is_anonymous, created_at
            FROM form_submissions 
            WHERE LOWER(form_type) = 'donation' AND amount > 0
            ORDER BY id DESC 
            LIMIT 25
        ");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as $row) {
            $rawName = !empty($row['is_anonymous']) ? 'Anonymous Donor' : trim((string)($row['name'] ?? 'Anonymous Donor'));
            $nameParts = preg_split('/\s+/', $rawName);
            $displayName = $rawName;
            if (count($nameParts) > 1 && stripos($rawName, 'supporter') === false && stripos($rawName, 'anonymous') === false) {
                $displayName = $nameParts[0] . ' ' . strtoupper(substr($nameParts[count($nameParts) - 1], 0, 1)) . '.';
            }

            $cause = trim((string)($row['interest'] ?? $row['message'] ?? ''));
            if ($cause === '') {
                $cause = 'Emergency Medical Relief';
            }

            $amt = (float)($row['amount'] ?? 0);
            $donations[] = [
                'id' => $row['submission_id'] ?? ('DON-' . $row['id']),
                'name' => $displayName,
                'amount' => $amt,
                'formattedAmount' => '₹' . number_format($amt, 0, '.', ','),
                'cause' => $cause
            ];
        }
    }
} catch (Throwable $e) {
    error_log('Donations API MySQL Query Exception: ' . $e->getMessage());
}

// 2. Fallback to cache/submissions.json if MySQL had no donation entries
if (empty($donations)) {
    $submissionsFile = dirname(__DIR__) . '/cache/submissions.json';
    if (is_file($submissionsFile) && is_readable($submissionsFile)) {
        $jsonContent = @file_get_contents($submissionsFile);
        $submissions = json_decode($jsonContent ?: '[]', true);
        if (is_array($submissions)) {
            foreach ($submissions as $sub) {
                $ft = strtolower((string)($sub['formType'] ?? $sub['form_type'] ?? ''));
                $amt = (float)($sub['amount'] ?? 0);
                $paymentStatus = strtoupper((string)($sub['paymentStatus'] ?? $sub['payment_status'] ?? 'PENDING'));
                if ($ft === 'donation' && $amt > 0) {
                    $rawName = !empty($sub['isAnonymous']) || !empty($sub['is_anonymous'])
                        ? 'Anonymous Donor'
                        : trim((string)($sub['name'] ?? 'Anonymous Supporter'));
                    $nameParts = preg_split('/\s+/', $rawName);
                    $displayName = $rawName;
                    if (count($nameParts) > 1 && stripos($rawName, 'supporter') === false && stripos($rawName, 'anonymous') === false) {
                        $displayName = $nameParts[0] . ' ' . strtoupper(substr($nameParts[count($nameParts) - 1], 0, 1)) . '.';
                    }

                    $cause = trim((string)($sub['interest'] ?? $sub['message'] ?? ''));
                    if ($cause === '') {
                        $cause = 'Emergency Medical Relief';
                    }

                    $donations[] = [
                        'id' => $sub['submissionId'] ?? $sub['id'] ?? ('SUB-' . uniqid()),
                        'name' => $displayName,
                        'amount' => $amt,
                        'formattedAmount' => '₹' . number_format($amt, 0, '.', ','),
                        'cause' => $cause
                    ];
                }
            }
        }
    }
}

$finalList = array_slice($donations, 0, 25);

echo json_encode([
    'status' => 'ok',
    'count' => count($finalList),
    'donations' => $finalList
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
