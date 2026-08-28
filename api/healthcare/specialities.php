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

$iconMap = [
    'oncology' => '🧬',
    'cardiology' => '🫀',
    'ophthalmology' => '👁️',
    'general-physician' => '🩺',
    'gynecology' => '🌸',
    'pediatrics' => '👶',
    'orthopedics' => '🦴'
];

$descMap = [
    'oncology' => 'Medical, Surgical & Radiation Cancer Care',
    'cardiology' => 'Heart, Vascular & Preventive Cardiac Health',
    'ophthalmology' => 'Cataract, Retina & Vision Diagnostics',
    'general-physician' => 'Primary Care, Fever & Chronic Illness',
    'gynecology' => 'Women\'s Health, Maternity & Preventive Oncology',
    'pediatrics' => 'Child Health, Immunization & Pediatric Care',
    'orthopedics' => 'Joint Care, Spine & Sports Injury Treatment'
];

try {
    $pdo = getDatabaseConnection();
    if ($pdo !== null) {
        seedCatalogFromJSON($pdo);

        $stmt = $pdo->query("SELECT `speciality_id`, `speciality_name`, COUNT(*) as cnt FROM `doctors` WHERE `is_active` = 1 GROUP BY `speciality_id`, `speciality_name` ORDER BY cnt DESC");
        $rows = $stmt->fetchAll();
        $specialities = [];

        foreach ($rows as $r) {
            $sId = $r['speciality_id'];
            $specialities[] = [
                'id' => $sId,
                'name' => $r['speciality_name'],
                'icon' => $iconMap[$sId] ?? '🩺',
                'count' => (int) $r['cnt'],
                'desc' => $descMap[$sId] ?? 'Medical Speciality'
            ];
        }

        echo json_encode(['status' => 'ok', 'specialities' => $specialities], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit(0);
    }
} catch (Throwable $e) {
    error_log("Dynamic specialities API error: " . $e->getMessage());
}

echo json_encode(['status' => 'error', 'message' => 'Unable to fetch specialities from database.'], JSON_UNESCAPED_SLASHES);
exit(0);
