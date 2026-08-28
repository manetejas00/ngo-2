<?php
/**
 * Avinya Care Foundation - Hostinger MySQL Database Manager & Auto-Migrator
 * 
 * Provides PDO database connection and automatic table schema migrations.
 * Every time an API request runs, it checks and creates missing tables automatically,
 * requiring zero manual database setup in phpMyAdmin on Git push.
 */

declare(strict_types=1);

if (!function_exists('loadEnvDatabaseVars')) {
    function loadEnvDatabaseVars(string $envPath): void {
        if (!is_file($envPath) || !is_readable($envPath)) return;
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) return;
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
            [$name, $value] = array_map('trim', explode('=', $line, 2));
            if (!str_starts_with($name, 'DB_')) continue;
            if (getenv($name) !== false) continue;
            if (strlen($value) >= 2 && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))) {
                $value = substr($value, 1, -1);
            }
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
        }
    }
}

loadEnvDatabaseVars(dirname(__DIR__) . '/.env');

function getDbEnv(string $key, string $default = ''): string {
    $val = getenv($key);
    if ($val === false && isset($_ENV[$key])) $val = $_ENV[$key];
    if ($val === false && isset($_SERVER[$key])) $val = $_SERVER[$key];
    return trim((string) ($val === false ? $default : $val));
}

function getDatabaseConnection(): ?PDO {
    static $pdo = null;
    static $attempted = false;

    if ($pdo !== null) return $pdo;
    if ($attempted) return null;
    $attempted = true;

    $host = getDbEnv('DB_HOST', 'localhost');
    $port = (int) getDbEnv('DB_PORT', '3306');
    $dbname = getDbEnv('DB_NAME', 'u382139760_ngo');
    $user = getDbEnv('DB_USER', 'u382139760_ngo');
    $pass = getDbEnv('DB_PASS', '@qLVTyLIJ5');

    if ($dbname === '' || $user === '') return null;

    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ]);

        autoMigrateDatabaseTables($pdo);
        return $pdo;
    } catch (Throwable $e) {
        error_log('AvinyaCare Database Connection/Migration Exception: ' . $e->getMessage());
        return null;
    }
}

function autoMigrateDatabaseTables(PDO $pdo): bool {
    static $migrated = false;
    if ($migrated) return true;

    $queries = [
        // 1. Form Submissions Table (Contact, Newsletter, Volunteer, Support, Donation, CSR, Feedback)
        "CREATE TABLE IF NOT EXISTS `form_submissions` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `submission_id` VARCHAR(100) UNIQUE NOT NULL,
            `form_type` VARCHAR(50) NOT NULL,
            `name` VARCHAR(255) NOT NULL,
            `email` VARCHAR(255) NOT NULL,
            `phone` VARCHAR(50) DEFAULT NULL,
            `amount` DECIMAL(10,2) DEFAULT 0.00,
            `frequency` VARCHAR(50) DEFAULT 'one-time',
            `pan` VARCHAR(50) DEFAULT NULL,
            `transaction_id` VARCHAR(100) DEFAULT NULL,
            `organization` VARCHAR(255) DEFAULT NULL,
            `interest` VARCHAR(255) DEFAULT NULL,
            `message` TEXT DEFAULT NULL,
            `user_email_sent` TINYINT(1) DEFAULT 0,
            `admin_email_sent` TINYINT(1) DEFAULT 0,
            `delivery_status` VARCHAR(50) DEFAULT 'UNKNOWN',
            `raw_payload` JSON DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_form_type` (`form_type`),
            INDEX `idx_email` (`email`),
            INDEX `idx_submission_id` (`submission_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        // 2. Doctor Appointment Bookings Table
        "CREATE TABLE IF NOT EXISTS `doctor_bookings` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `booking_id` VARCHAR(100) UNIQUE NOT NULL,
            `doctor_id` VARCHAR(100) NOT NULL,
            `doctor_name` VARCHAR(255) DEFAULT NULL,
            `doctor_speciality` VARCHAR(255) DEFAULT NULL,
            `doctor_hospital` VARCHAR(255) DEFAULT NULL,
            `patient_name` VARCHAR(255) NOT NULL,
            `patient_email` VARCHAR(255) NOT NULL,
            `patient_phone` VARCHAR(50) NOT NULL,
            `patient_age` INT DEFAULT 0,
            `patient_gender` VARCHAR(50) DEFAULT 'Unspecified',
            `consultation_type` VARCHAR(50) DEFAULT 'in-clinic',
            `booking_date` DATE NOT NULL,
            `booking_time` VARCHAR(50) NOT NULL,
            `reason` TEXT DEFAULT NULL,
            `notes` TEXT DEFAULT NULL,
            `status` VARCHAR(50) DEFAULT 'pending',
            `email_sent` TINYINT(1) DEFAULT 0,
            `whatsapp_sent` TINYINT(1) DEFAULT 0,
            `raw_payload` JSON DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_doctor_slot` (`doctor_id`, `booking_date`, `booking_time`),
            INDEX `idx_patient_email` (`patient_email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        // 3. Diagnostic Test Package Bookings Table
        "CREATE TABLE IF NOT EXISTS `diagnostic_bookings` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `booking_id` VARCHAR(100) UNIQUE NOT NULL,
            `test_id` VARCHAR(100) NOT NULL,
            `test_name` VARCHAR(255) NOT NULL,
            `price` DECIMAL(10,2) DEFAULT 0.00,
            `collection_method` VARCHAR(100) DEFAULT 'home_collection',
            `patient_name` VARCHAR(255) NOT NULL,
            `patient_email` VARCHAR(255) NOT NULL,
            `patient_phone` VARCHAR(50) NOT NULL,
            `patient_age` INT DEFAULT 0,
            `patient_gender` VARCHAR(50) DEFAULT 'Unspecified',
            `home_address` TEXT DEFAULT NULL,
            `pincode` VARCHAR(20) DEFAULT NULL,
            `city` VARCHAR(100) DEFAULT 'Mumbai',
            `booking_date` DATE NOT NULL,
            `time_slot` VARCHAR(100) NOT NULL,
            `status` VARCHAR(50) DEFAULT 'confirmed',
            `email_sent` TINYINT(1) DEFAULT 0,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_test_id` (`test_id`),
            INDEX `idx_diag_email` (`patient_email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        // 4. Audit Email Dispatches Table
        "CREATE TABLE IF NOT EXISTS `email_logs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `reference_id` VARCHAR(100) NOT NULL,
            `form_or_booking_type` VARCHAR(100) NOT NULL,
            `recipient_role` VARCHAR(50) NOT NULL,
            `recipient_email` VARCHAR(255) NOT NULL,
            `subject` VARCHAR(255) DEFAULT NULL,
            `smtp_status` VARCHAR(50) NOT NULL,
            `delivery_method` VARCHAR(100) DEFAULT 'HOSTINGER_SSL_SMTP_465',
            `error_message` TEXT DEFAULT NULL,
            `dispatched_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_ref_id` (`reference_id`),
            INDEX `idx_recip_email` (`recipient_email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
    ];

    foreach ($queries as $sql) {
        $pdo->exec($sql);
    }

    $migrated = true;
    return true;
}
