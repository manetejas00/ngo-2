<?php
declare(strict_types=1);
function initializeCampTable(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS camp_registrations (
        id VARCHAR(60) PRIMARY KEY, camp_id VARCHAR(50) NOT NULL,
        name VARCHAR(120) NOT NULL, phone VARCHAR(20) NOT NULL,
        answers_json LONGTEXT NOT NULL, email_status VARCHAR(20) NOT NULL,
        created_at VARCHAR(30) NOT NULL,
        UNIQUE KEY camp_person (camp_id, phone, name)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}
function listCampRegistrations(PDO $pdo): array {
    initializeCampTable($pdo);
    $rows = $pdo->query('SELECT * FROM camp_registrations ORDER BY created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
    return array_map(static function ($row) { return array_merge(json_decode($row['answers_json'], true) ?: [], ['id' => $row['id'], 'createdAt' => $row['created_at'], 'emailStatus' => $row['email_status']]); }, $rows);
}
