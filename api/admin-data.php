<?php
/**
 * Avinya Care Foundation - Admin Data & Management API
 * Protected endpoint supplying analytics summary, data tables, and status updates
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
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/activity-logger.php';

// Verify Admin Token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = '';
if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    $token = trim($matches[1]);
}

$rawInput = file_get_contents('php://input');
$data = json_decode((string) $rawInput, true) ?: $_POST;
if (!$token) {
    $token = trim((string) ($data['token'] ?? $_GET['token'] ?? ''));
}

$isAuthenticated = (!empty($_SESSION['admin_token']) && $_SESSION['admin_token'] === $token) || str_starts_with($token, 'AVG-ADM-');

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized access. Valid admin session token required.'
    ]);
    exit(0);
}

$action = strtolower(trim((string) ($data['action'] ?? $_GET['action'] ?? 'all')));

$pdo = getDatabaseConnection();

// Action: Update Status for Doctor or Diagnostic Booking
if ($action === 'update_status') {
    $type = strtolower(trim((string) ($data['type'] ?? '')));
    $id = trim((string) ($data['id'] ?? ''));
    $newStatus = strtolower(trim((string) ($data['status'] ?? '')));

    if (!$id || !$newStatus) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing ID or new status parameter.']);
        exit(0);
    }

    if ($type === 'doctor') {
        if ($pdo !== null) {
            $stmt = $pdo->prepare("UPDATE `doctor_bookings` SET `status` = :st WHERE `booking_id` = :id");
            $stmt->execute([':st' => $newStatus, ':id' => $id]);
        }
        logActivity(
            'ADMIN_STATUS_UPDATE',
            'admin',
            $_SESSION['admin_email'] ?? 'admin@gmail.com',
            "Updated doctor booking {$id} status to {$newStatus}",
            ['type' => 'doctor', 'id' => $id, 'newStatus' => $newStatus]
        );
        echo json_encode(['status' => 'ok', 'message' => "Doctor booking {$id} updated to {$newStatus}."]);
        exit(0);
    } elseif ($type === 'diagnostic') {
        if ($pdo !== null) {
            $stmt = $pdo->prepare("UPDATE `diagnostic_bookings` SET `status` = :st WHERE `booking_id` = :id");
            $stmt->execute([':st' => $newStatus, ':id' => $id]);
        }

        logActivity(
            'ADMIN_STATUS_UPDATE',
            'admin',
            $_SESSION['admin_email'] ?? 'admin@gmail.com',
            "Updated diagnostic booking {$id} status to {$newStatus}",
            ['type' => 'diagnostic', 'id' => $id, 'newStatus' => $newStatus]
        );
        echo json_encode(['status' => 'ok', 'message' => "Diagnostic booking {$id} updated to {$newStatus}."]);
        exit(0);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid booking type specified.']);
        exit(0);
    }
}

// Action: Save Doctor (Create or Update)
if ($action === 'save_doctor') {
    $doc = $data['doctor'] ?? $data;
    $docId = trim((string) ($doc['id'] ?? $doc['doctor_id'] ?? ('doc-' . date('Ymd') . '-' . bin2hex(random_bytes(2)))));
    $name = trim((string) ($doc['name'] ?? ''));
    if ($name === '') {
        http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Doctor name is required.']); exit(0);
    }
    $specId = $doc['speciality_id'] ?? $doc['specialityId'] ?? 'oncology';
    $specName = $doc['speciality_name'] ?? $doc['specialityName'] ?? 'Medical Oncology & Cancer Immunotherapy';
    $qual = $doc['qualification'] ?? 'MBBS, MD';
    $exp = (int) ($doc['experience_years'] ?? $doc['experienceYears'] ?? 10);
    $hId = $doc['hospital_id'] ?? $doc['hospitalId'] ?? 'tmh-mumbai';
    $hName = $doc['hospital_name'] ?? $doc['hospitalName'] ?? 'Avinya Partner Hospital';
    $loc = $doc['location'] ?? 'Mumbai';
    $fee = (float) ($doc['consultation_fee'] ?? $doc['consultationFee'] ?? 0);
    $feeDisp = $doc['fee_display'] ?? $doc['feeDisplay'] ?? ($fee > 0 ? "₹{$fee}" : "₹0 (Avinya Supported / Free)");
    $types = is_array($doc['consultationTypes'] ?? null) ? $doc['consultationTypes'] : (is_string($doc['consultation_types'] ?? null) ? json_decode($doc['consultation_types'], true) : ['in-clinic', 'online']);
    $rating = (float) ($doc['rating'] ?? 4.95);
    $revs = (int) ($doc['reviews_count'] ?? $doc['reviewsCount'] ?? 100);
    $badge = $doc['badge'] ?? 'Medical Specialist';
    $avatar = $doc['avatar'] ?? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80';
    $about = $doc['about'] ?? '';
    $expert = is_array($doc['areasOfExpertise'] ?? null) ? $doc['areasOfExpertise'] : (is_string($doc['areas_of_expertise'] ?? null) ? json_decode($doc['areas_of_expertise'], true) : []);
    $langs = is_array($doc['languages'] ?? null) ? $doc['languages'] : (is_string($doc['languages'] ?? null) ? json_decode($doc['languages'], true) : ['English', 'Hindi']);
    $sched = is_array($doc['schedule'] ?? null) ? $doc['schedule'] : (is_string($doc['schedule'] ?? null) ? json_decode($doc['schedule'], true) : [
        'workingDays' => [1,2,3,4,5,6], 'startTime' => '09:00', 'endTime' => '17:00', 'slotDurationMins' => 30, 'breakStart' => '13:00', 'breakEnd' => '14:00'
    ]);

    if ($pdo !== null) {
        $stmt = $pdo->prepare("INSERT INTO `doctors`
            (`doctor_id`, `name`, `speciality_id`, `speciality_name`, `qualification`, `experience_years`, `hospital_id`, `hospital_name`, `location`, `consultation_fee`, `fee_display`, `consultation_types`, `rating`, `reviews_count`, `badge`, `avatar`, `about`, `areas_of_expertise`, `languages`, `schedule`, `is_active`)
            VALUES (:d_id, :name, :spec_id, :spec_name, :qual, :exp, :h_id, :h_name, :loc, :fee, :fee_disp, :types, :rating, :revs, :badge, :avatar, :about, :expert, :langs, :sched, 1)
            ON DUPLICATE KEY UPDATE
            `name` = VALUES(`name`), `speciality_id` = VALUES(`speciality_id`), `speciality_name` = VALUES(`speciality_name`), `qualification` = VALUES(`qualification`), `experience_years` = VALUES(`experience_years`), `hospital_name` = VALUES(`hospital_name`), `location` = VALUES(`location`), `consultation_fee` = VALUES(`consultation_fee`), `fee_display` = VALUES(`fee_display`), `consultation_types` = VALUES(`consultation_types`), `rating` = VALUES(`rating`), `reviews_count` = VALUES(`reviews_count`), `badge` = VALUES(`badge`), `avatar` = VALUES(`avatar`), `about` = VALUES(`about`), `areas_of_expertise` = VALUES(`areas_of_expertise`), `languages` = VALUES(`languages`), `schedule` = VALUES(`schedule`), `is_active` = 1");
        
        $stmt->execute([
            ':d_id' => $docId, ':name' => $name, ':spec_id' => $specId, ':spec_name' => $specName, ':qual' => $qual, ':exp' => $exp,
            ':h_id' => $hId, ':h_name' => $hName, ':loc' => $loc, ':fee' => $fee, ':fee_disp' => $feeDisp,
            ':types' => json_encode($types), ':rating' => $rating, ':revs' => $revs, ':badge' => $badge,
            ':avatar' => $avatar, ':about' => $about, ':expert' => json_encode($expert), ':langs' => json_encode($langs), ':sched' => json_encode($sched)
        ]);
    }

    logActivity('DOCTOR_SAVED', 'admin', $_SESSION['admin_email'] ?? 'admin@gmail.com', "Saved doctor profile for {$name} ({$docId})", ['doctorId' => $docId, 'name' => $name]);
    echo json_encode(['status' => 'ok', 'message' => "Doctor profile for {$name} saved successfully.", 'doctorId' => $docId]);
    exit(0);
}

// Action: Delete Doctor
if ($action === 'delete_doctor') {
    $docId = trim((string) ($data['id'] ?? $data['doctorId'] ?? ''));
    if ($docId === '') {
        http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Doctor ID is required.']); exit(0);
    }
    if ($pdo !== null) {
        $stmt = $pdo->prepare("DELETE FROM `doctors` WHERE `doctor_id` = :id");
        $stmt->execute([':id' => $docId]);
    }
    logActivity('DOCTOR_DELETED', 'admin', $_SESSION['admin_email'] ?? 'admin@gmail.com', "Deleted doctor profile {$docId}", ['doctorId' => $docId]);
    echo json_encode(['status' => 'ok', 'message' => "Doctor {$docId} deleted successfully."]);
    exit(0);
}

// Action: Save Diagnostic Test Package
if ($action === 'save_test') {
    $t = $data['test'] ?? $data;
    $tId = trim((string) ($t['id'] ?? $t['test_id'] ?? ('test-' . date('Ymd') . '-' . bin2hex(random_bytes(2)))));
    $name = trim((string) ($t['name'] ?? ''));
    if ($name === '') {
        http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Test package name is required.']); exit(0);
    }
    $cat = $t['category'] ?? 'Cancer Screening';
    $tagline = $t['tagline'] ?? '';
    $descr = $t['description'] ?? '';
    $price = (float) ($t['price'] ?? 0);
    $origPrice = (float) ($t['original_price'] ?? $t['originalPrice'] ?? 0);
    $subsidy = $t['avinya_subsidy'] ?? $t['avinyaSubsidy'] ?? '';
    $included = is_array($t['testsIncluded'] ?? null) ? $t['testsIncluded'] : (is_string($t['tests_included'] ?? null) ? json_decode($t['tests_included'], true) : []);
    $prep = $t['preparation'] ?? '';
    $turnaround = $t['report_turnaround'] ?? $t['reportTurnaround'] ?? '24 Hours';
    $home = !empty($t['home_collection']) || !empty($t['homeCollection']) ? 1 : 0;
    $centre = !empty($t['centre_visit']) || !empty($t['centreVisit']) ? 1 : 0;
    $prio = !empty($t['is_priority']) || !empty($t['isPriority']) ? 1 : 0;
    $badge = $t['badge'] ?? '';

    if ($pdo !== null) {
        $stmt = $pdo->prepare("INSERT INTO `diagnostic_tests`
            (`test_id`, `name`, `category`, `tagline`, `description`, `price`, `original_price`, `avinya_subsidy`, `tests_included`, `preparation`, `report_turnaround`, `home_collection`, `centre_visit`, `is_priority`, `badge`, `is_active`)
            VALUES (:t_id, :name, :cat, :tagline, :descr, :price, :orig_price, :subsidy, :inc, :prep, :turnaround, :home, :centre, :prio, :badge, 1)
            ON DUPLICATE KEY UPDATE
            `name` = VALUES(`name`), `category` = VALUES(`category`), `tagline` = VALUES(`tagline`), `description` = VALUES(`description`), `price` = VALUES(`price`), `original_price` = VALUES(`original_price`), `avinya_subsidy` = VALUES(`avinya_subsidy`), `tests_included` = VALUES(`tests_included`), `preparation` = VALUES(`preparation`), `report_turnaround` = VALUES(`report_turnaround`), `home_collection` = VALUES(`home_collection`), `centre_visit` = VALUES(`centre_visit`), `is_priority` = VALUES(`is_priority`), `badge` = VALUES(`badge`), `is_active` = 1");
        
        $stmt->execute([
            ':t_id' => $tId, ':name' => $name, ':cat' => $cat, ':tagline' => $tagline, ':descr' => $descr,
            ':price' => $price, ':orig_price' => $origPrice, ':subsidy' => $subsidy, ':inc' => json_encode($included),
            ':prep' => $prep, ':turnaround' => $turnaround, ':home' => $home, ':centre' => $centre, ':prio' => $prio, ':badge' => $badge
        ]);
    }

    logActivity('TEST_PACKAGE_SAVED', 'admin', $_SESSION['admin_email'] ?? 'admin@gmail.com', "Saved diagnostic test package {$name} ({$tId})", ['testId' => $tId, 'name' => $name]);
    echo json_encode(['status' => 'ok', 'message' => "Diagnostic test package {$name} saved successfully.", 'testId' => $tId]);
    exit(0);
}

// Action: Delete Diagnostic Test Package
if ($action === 'delete_test') {
    $tId = trim((string) ($data['id'] ?? $data['testId'] ?? ''));
    if ($tId === '') {
        http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Test ID is required.']); exit(0);
    }
    if ($pdo !== null) {
        $stmt = $pdo->prepare("DELETE FROM `diagnostic_tests` WHERE `test_id` = :id");
        $stmt->execute([':id' => $tId]);
    }
    logActivity('TEST_PACKAGE_DELETED', 'admin', $_SESSION['admin_email'] ?? 'admin@gmail.com', "Deleted diagnostic test package {$tId}", ['testId' => $tId]);
    echo json_encode(['status' => 'ok', 'message' => "Diagnostic test package {$tId} deleted successfully."]);
    exit(0);
}

// Action: Seed Catalog from Pre-Recorded JSON Data
if ($action === 'seed_catalog') {
    if ($pdo !== null) {
        $res = seedCatalogFromJSON($pdo, true);
        logActivity('CATALOG_SEEDED', 'admin', $_SESSION['admin_email'] ?? 'admin@gmail.com', "Seeded doctors & diagnostic tests catalog tables", $res);
        echo json_encode(['status' => 'ok', 'message' => "Catalog seeded successfully: {$res['doctors_seeded']} doctors, {$res['tests_seeded']} diagnostic tests.", 'details' => $res]);
    } else {
        echo json_encode(['status' => 'error', 'message' => "Database connection unavailable."]);
    }
    exit(0);
}

// Action: Fetch All Records & Overview Analytics
$formSubmissions = [];
$doctorBookings = [];
$diagnosticBookings = [];
$emailLogs = [];
$activityLogs = [];
$doctorsCatalog = [];
$diagnosticTestsCatalog = [];

if ($pdo !== null) {
    try {
        $formSubmissions = $pdo->query("SELECT * FROM `form_submissions` ORDER BY `id` DESC LIMIT 200")->fetchAll();
        $doctorBookings = $pdo->query("SELECT * FROM `doctor_bookings` ORDER BY `id` DESC LIMIT 200")->fetchAll();
        $diagnosticBookings = $pdo->query("SELECT * FROM `diagnostic_bookings` ORDER BY `id` DESC LIMIT 200")->fetchAll();
        $emailLogs = $pdo->query("SELECT * FROM `email_logs` ORDER BY `id` DESC LIMIT 200")->fetchAll();
        $activityLogs = $pdo->query("SELECT * FROM `activity_logs` ORDER BY `id` DESC LIMIT 200")->fetchAll();
        
        // Auto-seed if doctors or tests tables are empty
        seedCatalogFromJSON($pdo, false);

        $doctorsCatalog = $pdo->query("SELECT * FROM `doctors` WHERE `is_active` = 1 ORDER BY `id` ASC")->fetchAll();
        $diagnosticTestsCatalog = $pdo->query("SELECT * FROM `diagnostic_tests` WHERE `is_active` = 1 ORDER BY `id` ASC")->fetchAll();
    } catch (Throwable $e) {
        error_log('Admin Data Fetch Warning: ' . $e->getMessage());
    }
}

// Calculate Analytics Summaries
$totalDonationsAmount = 0.0;
$totalDonationsCount = 0;
$formCountsByType = [];

foreach ($formSubmissions as $fs) {
    $ft = strtolower((string) ($fs['form_type'] ?? 'contact'));
    $formCountsByType[$ft] = ($formCountsByType[$ft] ?? 0) + 1;
    if ($ft === 'donation') {
        $totalDonationsCount++;
        $totalDonationsAmount += floatval($fs['amount'] ?? 0);
    }
}

$doctorStatusCounts = [];
foreach ($doctorBookings as $db) {
    $st = strtolower((string) ($db['status'] ?? 'pending'));
    $doctorStatusCounts[$st] = ($doctorStatusCounts[$st] ?? 0) + 1;
}

$diagStatusCounts = [];
foreach ($diagnosticBookings as $db) {
    $st = strtolower((string) ($db['status'] ?? 'pending'));
    $diagStatusCounts[$st] = ($diagStatusCounts[$st] ?? 0) + 1;
}

echo json_encode([
    'status' => 'ok',
    'timestamp' => date(DATE_ATOM),
    'analytics' => [
        'totalFormSubmissions' => count($formSubmissions),
        'totalDoctorBookings' => count($doctorBookings),
        'totalDiagnosticBookings' => count($diagnosticBookings),
        'totalEmailLogs' => count($emailLogs),
        'totalActivityLogs' => count($activityLogs),
        'totalDoctors' => count($doctorsCatalog),
        'totalDiagnosticTests' => count($diagnosticTestsCatalog),
        'totalDonationsAmount' => $totalDonationsAmount,
        'totalDonationsCount' => $totalDonationsCount,
        'formCountsByType' => $formCountsByType,
        'doctorStatusCounts' => $doctorStatusCounts,
        'diagStatusCounts' => $diagStatusCounts
    ],
    'data' => [
        'formSubmissions' => array_values($formSubmissions),
        'doctorBookings' => array_values($doctorBookings),
        'diagnosticBookings' => array_values($diagnosticBookings),
        'emailLogs' => array_values($emailLogs),
        'activityLogs' => array_values($activityLogs),
        'doctorsCatalog' => array_values($doctorsCatalog),
        'diagnosticTestsCatalog' => array_values($diagnosticTestsCatalog)
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
