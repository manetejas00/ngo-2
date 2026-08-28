<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

require_once dirname(__DIR__) . '/db.php';

try {
    $pdo = getDatabaseConnection();
    if ($pdo !== null) {
        // Ensure catalog table is populated if empty
        seedCatalogFromJSON($pdo);

        $stmt = $pdo->query("SELECT * FROM `doctors` WHERE `is_active` = 1 ORDER BY `id` ASC");
        $rows = $stmt->fetchAll();
        $doctors = [];

        foreach ($rows as $r) {
            $docId = $r['doctor_id'] ?? $r['id'];
            $doctors[] = [
                'id' => $docId,
                'name' => $r['name'],
                'specialityId' => $r['speciality_id'],
                'specialityName' => $r['speciality_name'],
                'qualification' => $r['qualification'],
                'experienceYears' => (int) $r['experience_years'],
                'hospitalId' => $r['hospital_id'],
                'hospitalName' => $r['hospital_name'],
                'location' => $r['location'],
                'consultationFee' => (float) $r['consultation_fee'],
                'feeDisplay' => $r['fee_display'],
                'consultationTypes' => json_decode($r['consultation_types'] ?? '[]', true) ?: ['in-clinic', 'online'],
                'rating' => (float) $r['rating'],
                'reviewsCount' => (int) $r['reviews_count'],
                'badge' => $r['badge'],
                'avatar' => $r['avatar'],
                'about' => $r['about'],
                'areasOfExpertise' => json_decode($r['areas_of_expertise'] ?? '[]', true) ?: [],
                'languages' => json_decode($r['languages'] ?? '[]', true) ?: ['English', 'Hindi'],
                'schedule' => json_decode($r['schedule'] ?? '{}', true) ?: []
            ];
        }

        echo json_encode(['status' => 'ok', 'doctors' => $doctors], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit(0);
    }
} catch (Throwable $e) {
    error_log("Dynamic doctors API error: " . $e->getMessage());
}

echo json_encode(['status' => 'error', 'message' => 'Unable to fetch doctors from database.'], JSON_UNESCAPED_SLASHES);
exit(0);
