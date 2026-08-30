<?php
/**
 * Avinya Care Foundation - Admin Data & Management API
 * Protected endpoint supplying analytics summary, data tables, and status updates
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

$userRole = $_SESSION['user_role'] ?? '';
$userDocId = $_SESSION['user_doc_id'] ?? null;
$userProvId = $_SESSION['user_prov_id'] ?? null;

$isAuthenticated = !empty($_SESSION['admin_token']) && $token !== '' && hash_equals((string) $_SESSION['admin_token'], $token);

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
    if (!in_array($newStatus, ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'], true)) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'Invalid booking status.']);
        exit(0);
    }

    // Role-based authorization check for status updates
    if ($userRole === 'doctor') {
        if ($type !== 'doctor') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Forbidden: Doctors can only manage doctor appointments.']);
            exit(0);
        }
        if (empty($userDocId)) {
            http_response_code(403); echo json_encode(['status' => 'error', 'message' => 'Doctor account is not linked to a doctor profile.']); exit(0);
        }
        if ($pdo !== null) {
            $checkStmt = $pdo->prepare("SELECT `doctor_id` FROM `doctor_bookings` WHERE `booking_id` = :id");
            $checkStmt->execute([':id' => $id]);
            $bDoc = $checkStmt->fetchColumn();
            if ($bDoc !== $userDocId) {
                http_response_code(403);
                echo json_encode(['status' => 'error', 'message' => 'Forbidden: You do not have permission to manage this doctor appointment.']);
                exit(0);
            }
        }
    } elseif ($userRole === 'diagnostic_provider') {
        if ($type !== 'diagnostic') {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Forbidden: Diagnostic Providers can only manage lab test bookings.']);
            exit(0);
        }
        if (empty($userProvId)) {
            http_response_code(403); echo json_encode(['status' => 'error', 'message' => 'Provider account is not linked to a lab profile.']); exit(0);
        }
        if ($pdo !== null) {
            $checkStmt = $pdo->prepare("SELECT b.`provider_id`, t.`provider_id` as t_prov FROM `diagnostic_bookings` b LEFT JOIN `diagnostic_tests` t ON b.test_id = t.test_id WHERE b.booking_id = :id");
            $checkStmt->execute([':id' => $id]);
            $row = $checkStmt->fetch();
            if (!$row || ($row['provider_id'] !== $userProvId && $row['t_prov'] !== $userProvId)) {
                http_response_code(403);
                echo json_encode(['status' => 'error', 'message' => 'Forbidden: You do not have permission to manage this diagnostic booking.']);
                exit(0);
            }
        }
    } elseif (!in_array($userRole, ['admin', 'manager'], true)) {
        http_response_code(403); echo json_encode(['status' => 'error', 'message' => 'Forbidden.']); exit(0);
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

// Enforce Admin role for management actions
if (in_array($action, ['save_doctor', 'delete_doctor', 'save_test', 'delete_test', 'save_user', 'delete_user', 'seed_catalog'], true)) {
    if ($userRole !== 'admin') {
        http_response_code(403);
        echo json_encode(['status' => 'error', 'message' => 'Forbidden: Only Super Administrators can alter catalog records or system accounts.']);
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
    $sched = is_array($sched) ? $sched : [];
    $sched['workingDays'] = array_values(array_unique(array_filter(array_map('intval', $sched['workingDays'] ?? [1,2,3,4,5,6]), fn($day) => $day >= 0 && $day <= 6)));
    $sched['startTime'] = preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) ($sched['startTime'] ?? '')) ? $sched['startTime'] : '09:00';
    $sched['endTime'] = preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string) ($sched['endTime'] ?? '')) ? $sched['endTime'] : '17:00';
    $sched['slotDurationMins'] = max(5, min(240, (int) ($sched['slotDurationMins'] ?? 30)));
    foreach (['breakStart', 'breakEnd'] as $field) {
        $value = trim((string) ($sched[$field] ?? ''));
        $sched[$field] = preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $value) ? $value : '';
    }
    $sched['availableDates'] = array_values(array_unique(array_filter(array_map('strval', $sched['availableDates'] ?? []), fn($date) => preg_match('/^\d{4}-\d{2}-\d{2}$/', $date))));
    $sched['slots'] = array_values(array_unique(array_filter(array_map('strval', $sched['slots'] ?? []), fn($time) => preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $time))));
    if ($sched['startTime'] >= $sched['endTime']) {
        http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'Doctor schedule end time must be after start time.']); exit(0);
    }

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
    $sampleType = $t['sample_type'] ?? $t['sampleType'] ?? 'Blood / Serum Sample';
    $icon = $t['icon'] ?? '🧪';
    $home = !empty($t['home_collection']) || !empty($t['homeCollection']) ? 1 : 0;
    $centre = !empty($t['centre_visit']) || !empty($t['centreVisit']) ? 1 : 0;
    $prio = !empty($t['is_priority']) || !empty($t['isPriority']) ? 1 : 0;
    $badge = $t['badge'] ?? '';

    if ($pdo !== null) {
        $stmt = $pdo->prepare("INSERT INTO `diagnostic_tests`
            (`test_id`, `name`, `category`, `tagline`, `description`, `price`, `original_price`, `avinya_subsidy`, `tests_included`, `preparation`, `report_turnaround`, `sample_type`, `icon`, `home_collection`, `centre_visit`, `is_priority`, `badge`, `is_active`)
            VALUES (:t_id, :name, :cat, :tagline, :descr, :price, :orig_price, :subsidy, :inc, :prep, :turnaround, :stype, :icon, :home, :centre, :prio, :badge, 1)
            ON DUPLICATE KEY UPDATE
            `name` = VALUES(`name`), `category` = VALUES(`category`), `tagline` = VALUES(`tagline`), `description` = VALUES(`description`), `price` = VALUES(`price`), `original_price` = VALUES(`original_price`), `avinya_subsidy` = VALUES(`avinya_subsidy`), `tests_included` = VALUES(`tests_included`), `preparation` = VALUES(`preparation`), `report_turnaround` = VALUES(`report_turnaround`), `sample_type` = VALUES(`sample_type`), `icon` = VALUES(`icon`), `home_collection` = VALUES(`home_collection`), `centre_visit` = VALUES(`centre_visit`), `is_priority` = VALUES(`is_priority`), `badge` = VALUES(`badge`), `is_active` = 1");
        
        $stmt->execute([
            ':t_id' => $tId, ':name' => $name, ':cat' => $cat, ':tagline' => $tagline, ':descr' => $descr,
            ':price' => $price, ':orig_price' => $origPrice, ':subsidy' => $subsidy, ':inc' => json_encode($included),
            ':prep' => $prep, ':turnaround' => $turnaround, ':stype' => $sampleType, ':icon' => $icon, ':home' => $home, ':centre' => $centre, ':prio' => $prio, ':badge' => $badge
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

// Action: Save System User (Create or Update)
if ($action === 'save_user') {
    $usr = $data['user'] ?? $data;
    $uId = trim((string) ($usr['id'] ?? $usr['user_id'] ?? ('usr-' . date('Ymd') . '-' . bin2hex(random_bytes(2)))));
    $name = trim((string) ($usr['name'] ?? ''));
    $email = strtolower(trim((string) ($usr['email'] ?? '')));
    $role = strtolower(trim((string) ($usr['role'] ?? 'admin')));
    $status = strtolower(trim((string) ($usr['status'] ?? 'active')));
    $password = trim((string) ($usr['password'] ?? ''));
    $phone = trim((string) ($usr['phone'] ?? ''));
    $avatar = trim((string) ($usr['avatar'] ?? ''));

    $doctorId = trim((string) ($usr['doctorId'] ?? $usr['doctor_id'] ?? '')) ?: null;
    $providerId = trim((string) ($usr['providerId'] ?? $usr['provider_id'] ?? '')) ?: null;
    if ($name === '' || $email === '') {
        http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'User name and email are required.']); exit(0);
    }
    if (mb_strlen($name) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'Enter a valid name and email address.']); exit(0);
    }
    if (!in_array($role, ['admin', 'manager', 'doctor', 'diagnostic_provider'], true) || !in_array($status, ['active', 'inactive', 'disabled', 'suspended'], true)) {
        http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'Invalid role or account status.']); exit(0);
    }
    if ($phone !== '' && !preg_match('/^[0-9+() .-]{7,20}$/', $phone)) {
        http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'Enter a valid phone number.']); exit(0);
    }
    if ($avatar !== '' && (!filter_var($avatar, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $avatar))) {
        http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'Profile image must be a valid HTTP or HTTPS URL.']); exit(0);
    }
    if (($role === 'doctor' && $doctorId === null) || ($role === 'diagnostic_provider' && $providerId === null)) {
        http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'The selected role requires a linked doctor or provider profile.']); exit(0);
    }
    if ($password !== '' && (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/[0-9]/', $password) || !preg_match('/[^A-Za-z0-9]/', $password))) {
        http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'Password must contain uppercase, lowercase, number, and special character.']); exit(0);
    }

    if ($pdo !== null) {
        $exists = $pdo->prepare("SELECT 1 FROM `users` WHERE `user_id` = :uid LIMIT 1");
        $exists->execute([':uid' => $uId]);
        $isExistingUser = (bool) $exists->fetchColumn();
        if (!$isExistingUser && $password === '') {
            http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'A password is required when creating a user.']); exit(0);
        }
        $duplicate = $pdo->prepare("SELECT `user_id` FROM `users` WHERE LOWER(`email`) = :email AND `user_id` <> :uid LIMIT 1");
        $duplicate->execute([':email' => $email, ':uid' => $uId]);
        if ($duplicate->fetchColumn()) {
            http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'A user with this email address already exists.']); exit(0);
        }
        if ($password !== '') {
            $passHash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO `users`
                (`user_id`, `name`, `email`, `phone`, `avatar`, `password_hash`, `role`, `doctor_id`, `provider_id`, `status`)
                VALUES (:u_id, :name, :email, :phone, :avatar, :pass_hash, :role, :doctor_id, :provider_id, :status)
                ON DUPLICATE KEY UPDATE
                `name` = VALUES(`name`), `email` = VALUES(`email`), `phone` = VALUES(`phone`), `avatar` = VALUES(`avatar`), `password_hash` = VALUES(`password_hash`), `role` = VALUES(`role`), `doctor_id` = VALUES(`doctor_id`), `provider_id` = VALUES(`provider_id`), `status` = VALUES(`status`)");
            $stmt->execute([
                ':u_id' => $uId,
                ':name' => $name,
                ':email' => $email,
                ':phone' => $phone ?: null, ':avatar' => $avatar ?: null, ':pass_hash' => $passHash,
                ':role' => $role, ':doctor_id' => $doctorId, ':provider_id' => $providerId,
                ':status' => $status
            ]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO `users`
                (`user_id`, `name`, `email`, `phone`, `avatar`, `role`, `doctor_id`, `provider_id`, `status`)
                VALUES (:u_id, :name, :email, :phone, :avatar, :role, :doctor_id, :provider_id, :status)
                ON DUPLICATE KEY UPDATE
                `name` = VALUES(`name`), `email` = VALUES(`email`), `phone` = VALUES(`phone`), `avatar` = VALUES(`avatar`), `role` = VALUES(`role`), `doctor_id` = VALUES(`doctor_id`), `provider_id` = VALUES(`provider_id`), `status` = VALUES(`status`)");
            $stmt->execute([
                ':u_id' => $uId,
                ':name' => $name, ':phone' => $phone ?: null, ':avatar' => $avatar ?: null,
                ':email' => $email,
                ':role' => $role, ':doctor_id' => $doctorId, ':provider_id' => $providerId,
                ':status' => $status
            ]);
        }
    }
    logActivity('USER_SAVED', 'admin', $_SESSION['admin_email'] ?? 'admin@gmail.com', "Saved system user {$name} ({$email})", ['userId' => $uId, 'email' => $email, 'role' => $role]);
    echo json_encode(['status' => 'ok', 'message' => "System user {$name} saved successfully.", 'userId' => $uId]);
    exit(0);
}

// Action: Delete System User
if ($action === 'delete_user') {
    $uId = trim((string) ($data['id'] ?? $data['userId'] ?? ''));
    if ($uId === '') {
        http_response_code(400); echo json_encode(['status' => 'error', 'message' => 'User ID is required.']); exit(0);
    }
    if ($pdo !== null) {
        if ($uId === (string) ($_SESSION['user_id'] ?? '')) {
            http_response_code(422); echo json_encode(['status' => 'error', 'message' => 'You cannot deactivate your own signed-in account.']); exit(0);
        }
        $stmt = $pdo->prepare("UPDATE `users` SET `status` = 'inactive' WHERE `user_id` = :id");
        $stmt->execute([':id' => $uId]);
    }
    logActivity('USER_DEACTIVATED', 'admin', $_SESSION['user_email'] ?? '', "Deactivated system user {$uId}", ['userId' => $uId]);
    echo json_encode(['status' => 'ok', 'message' => "System user {$uId} deactivated successfully."]);
    exit(0);
}

// Action: Seed Catalog from Pre-Recorded JSON Data
if ($action === 'seed_catalog') {
    if ($pdo !== null) {
        $res = seedCatalogFromJSON($pdo, true);
        seedDefaultUsers($pdo, true);
        logActivity('CATALOG_SEEDED', 'admin', $_SESSION['admin_email'] ?? 'admin@gmail.com', "Seeded doctors, tests & users catalog tables", $res);
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
$usersCatalog = [];

if ($pdo !== null) {
    try {
        seedDiagnosticProviders($pdo, false);
        seedCatalogFromJSON($pdo, false);
        seedDefaultUsers($pdo, false);

        if ($userRole === 'doctor') {
            // Doctors can only view their own doctor bookings
            if (!empty($userDocId)) {
                $stmt = $pdo->prepare("SELECT * FROM `doctor_bookings` WHERE `doctor_id` = :doc_id ORDER BY `id` DESC LIMIT 200");
                $stmt->execute([':doc_id' => $userDocId]);
                $doctorBookings = $stmt->fetchAll();
            }
        } elseif ($userRole === 'diagnostic_provider') {
            // Diagnostic Providers can only view test bookings assigned to their provider ID
            if (!empty($userProvId)) {
                $stmt = $pdo->prepare("SELECT b.* FROM `diagnostic_bookings` b 
                    LEFT JOIN `diagnostic_tests` t ON b.test_id = t.test_id 
                    WHERE b.provider_id = :prov_id OR t.provider_id = :prov_id 
                    ORDER BY b.id DESC LIMIT 200");
                $stmt->execute([':prov_id' => $userProvId]);
                $diagnosticBookings = $stmt->fetchAll();
            }
        } elseif (in_array($userRole, ['admin', 'manager'], true)) {
            // Administrators and managers see operational data.
            $formSubmissions = $pdo->query("SELECT * FROM `form_submissions` ORDER BY `id` DESC LIMIT 200")->fetchAll();
            $doctorBookings = $pdo->query("SELECT * FROM `doctor_bookings` ORDER BY `id` DESC LIMIT 200")->fetchAll();
            $diagnosticBookings = $pdo->query("SELECT * FROM `diagnostic_bookings` ORDER BY `id` DESC LIMIT 200")->fetchAll();
            $emailLogs = $pdo->query("SELECT * FROM `email_logs` ORDER BY `id` DESC LIMIT 200")->fetchAll();
            $activityLogs = $pdo->query("SELECT * FROM `activity_logs` ORDER BY `id` DESC LIMIT 200")->fetchAll();
            $doctorsCatalog = $pdo->query("SELECT * FROM `doctors` WHERE `is_active` = 1 ORDER BY `id` ASC")->fetchAll();
            $diagnosticTestsCatalog = $pdo->query("SELECT * FROM `diagnostic_tests` WHERE `is_active` = 1 ORDER BY `id` ASC")->fetchAll();
            $usersCatalog = $pdo->query("SELECT `id`, `user_id`, `name`, `email`, `phone`, `avatar`, `role`, `doctor_id`, `provider_id`, `status`, `last_login`, `created_at` FROM `users` ORDER BY `id` ASC")->fetchAll();
        } else {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Role is not authorized for the Admin Panel.']);
            exit(0);
        }
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
        'totalUsers' => count($usersCatalog),
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
        'diagnosticTestsCatalog' => array_values($diagnosticTestsCatalog),
        'usersCatalog' => array_values($usersCatalog)
    ]
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
