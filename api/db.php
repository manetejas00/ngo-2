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
    function loadEnvDatabaseVars(): void {
        $root = dirname(__DIR__);
        $hostHeader = $_SERVER['HTTP_HOST'] ?? '';
        
        $envFile = $root . '/.env';
        if (str_contains($hostHeader, 'test.avinyacarefoundation.org') && is_file($root . '/.env.staging')) {
            $envFile = $root . '/.env.staging';
        } elseif (is_file($root . '/.env.production')) {
            $envFile = $root . '/.env.production';
        }

        if (!is_file($envFile) || !is_readable($envFile)) return;
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) return;
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
            [$name, $value] = array_map('trim', explode('=', $line, 2));
            if (!str_starts_with($name, 'DB_') && !str_starts_with($name, 'NEWS_') && !str_starts_with($name, 'SMTP_')) continue;
            if (strlen($value) >= 2 && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))) {
                $value = substr($value, 1, -1);
            }
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

loadEnvDatabaseVars();

function getDbEnv(string $key, string $default = ''): string {
    $val = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    return trim((string) ($val === false || $val === null ? $default : $val));
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
    $pass = getDbEnv('DB_PASS', '@qLVTyL|J5');

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
            `status` VARCHAR(50) DEFAULT 'pending',
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        // 5. Project-Wide Activity Audit Logs Table
        "CREATE TABLE IF NOT EXISTS `activity_logs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `log_id` VARCHAR(100) UNIQUE NOT NULL,
            `event_type` VARCHAR(100) NOT NULL,
            `actor_type` VARCHAR(50) NOT NULL DEFAULT 'user',
            `actor_identifier` VARCHAR(255) DEFAULT NULL,
            `action` VARCHAR(255) NOT NULL,
            `details` TEXT DEFAULT NULL,
            `ip_address` VARCHAR(100) DEFAULT NULL,
            `user_agent` VARCHAR(255) DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_event_type` (`event_type`),
            INDEX `idx_actor_type` (`actor_type`),
            INDEX `idx_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        // 6. Doctors Catalog Table
        "CREATE TABLE IF NOT EXISTS `doctors` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `doctor_id` VARCHAR(100) UNIQUE NOT NULL,
            `name` VARCHAR(255) NOT NULL,
            `speciality_id` VARCHAR(100) DEFAULT NULL,
            `speciality_name` VARCHAR(255) DEFAULT NULL,
            `qualification` VARCHAR(255) DEFAULT NULL,
            `experience_years` INT DEFAULT 0,
            `hospital_id` VARCHAR(100) DEFAULT NULL,
            `hospital_name` VARCHAR(255) DEFAULT NULL,
            `location` VARCHAR(100) DEFAULT 'Mumbai',
            `consultation_fee` DECIMAL(10,2) DEFAULT 0.00,
            `fee_display` VARCHAR(255) DEFAULT NULL,
            `consultation_types` TEXT DEFAULT NULL,
            `rating` DECIMAL(3,2) DEFAULT 4.90,
            `reviews_count` INT DEFAULT 0,
            `badge` VARCHAR(255) DEFAULT NULL,
            `avatar` TEXT DEFAULT NULL,
            `about` TEXT DEFAULT NULL,
            `areas_of_expertise` TEXT DEFAULT NULL,
            `languages` TEXT DEFAULT NULL,
            `schedule` TEXT DEFAULT NULL,
            `is_active` TINYINT(1) DEFAULT 1,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_doc_id` (`doctor_id`),
            INDEX `idx_spec` (`speciality_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        // 7. Diagnostic Test Packages Catalog Table
        // 7. Diagnostic Test Packages Catalog Table
        "CREATE TABLE IF NOT EXISTS `diagnostic_tests` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `test_id` VARCHAR(100) UNIQUE NOT NULL,
            `name` VARCHAR(255) NOT NULL,
            `category` VARCHAR(100) DEFAULT 'Cancer Screening',
            `tagline` VARCHAR(255) DEFAULT NULL,
            `description` TEXT DEFAULT NULL,
            `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `original_price` DECIMAL(10,2) DEFAULT 0.00,
            `avinya_subsidy` VARCHAR(255) DEFAULT NULL,
            `tests_included` TEXT DEFAULT NULL,
            `preparation` TEXT DEFAULT NULL,
            `report_turnaround` VARCHAR(100) DEFAULT NULL,
            `sample_type` VARCHAR(100) DEFAULT 'Blood / Serum Sample',
            `icon` VARCHAR(255) DEFAULT '🧪',
            `home_collection` TINYINT(1) DEFAULT 1,
            `centre_visit` TINYINT(1) DEFAULT 1,
            `is_priority` TINYINT(1) DEFAULT 0,
            `badge` VARCHAR(255) DEFAULT NULL,
            `is_active` TINYINT(1) DEFAULT 1,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_t_id` (`test_id`),
            INDEX `idx_cat` (`category`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        // 8. Diagnostic / Test Providers Table
        "CREATE TABLE IF NOT EXISTS `diagnostic_providers` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `provider_id` VARCHAR(100) UNIQUE NOT NULL,
            `name` VARCHAR(255) NOT NULL,
            `email` VARCHAR(255) UNIQUE NOT NULL,
            `phone` VARCHAR(50) DEFAULT NULL,
            `city` VARCHAR(100) DEFAULT 'Mumbai',
            `address` TEXT DEFAULT NULL,
            `is_active` TINYINT(1) DEFAULT 1,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_provider_id` (`provider_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        // 9. System Users Table with Role Relationships
        "CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` VARCHAR(100) UNIQUE NOT NULL,
            `name` VARCHAR(255) NOT NULL,
            `email` VARCHAR(255) UNIQUE NOT NULL,
            `password_hash` VARCHAR(255) DEFAULT NULL,
            `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
            `doctor_id` VARCHAR(100) DEFAULT NULL,
            `provider_id` VARCHAR(100) DEFAULT NULL,
            `status` VARCHAR(50) NOT NULL DEFAULT 'active',
            `last_login` DATETIME DEFAULT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_user_email` (`email`),
            INDEX `idx_user_role` (`role`),
            INDEX `idx_user_doc` (`doctor_id`),
            INDEX `idx_user_prov` (`provider_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
    ];

    foreach ($queries as $sql) {
        $pdo->exec($sql);
    }

    try {
        $colsTests = $pdo->query("SHOW COLUMNS FROM `diagnostic_tests`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('sample_type', $colsTests, true)) {
            $pdo->exec("ALTER TABLE `diagnostic_tests` ADD COLUMN `sample_type` VARCHAR(100) DEFAULT 'Blood / Serum Sample' AFTER `report_turnaround`");
        }
        if (!in_array('icon', $colsTests, true)) {
            $pdo->exec("ALTER TABLE `diagnostic_tests` ADD COLUMN `icon` VARCHAR(255) DEFAULT '🧪' AFTER `sample_type`");
        }
        if (!in_array('provider_id', $colsTests, true)) {
            $pdo->exec("ALTER TABLE `diagnostic_tests` ADD COLUMN `provider_id` VARCHAR(100) DEFAULT 'provider-1' AFTER `test_id`");
        }

        $colsUsers = $pdo->query("SHOW COLUMNS FROM `users`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('doctor_id', $colsUsers, true)) {
            $pdo->exec("ALTER TABLE `users` ADD COLUMN `doctor_id` VARCHAR(100) DEFAULT NULL AFTER `role`");
        }
        if (!in_array('provider_id', $colsUsers, true)) {
            $pdo->exec("ALTER TABLE `users` ADD COLUMN `provider_id` VARCHAR(100) DEFAULT NULL AFTER `doctor_id`");
        }

        $colsDiagBookings = $pdo->query("SHOW COLUMNS FROM `diagnostic_bookings`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('provider_id', $colsDiagBookings, true)) {
            $pdo->exec("ALTER TABLE `diagnostic_bookings` ADD COLUMN `provider_id` VARCHAR(100) DEFAULT 'provider-1' AFTER `test_id`");
        }
    } catch (Throwable $e) {
        // Table created or column addition safely handled
    }

    seedDiagnosticProviders($pdo);
    seedCatalogFromJSON($pdo);
    seedDefaultUsers($pdo);

    $migrated = true;
    return true;
}

function seedCatalogFromJSON(PDO $pdo, bool $force = false): array {
    $results = ['doctors_seeded' => 0, 'tests_seeded' => 0];
    try {
        // Seed Doctors if empty or forced
        $docCount = (int) $pdo->query("SELECT COUNT(*) FROM `doctors`")->fetchColumn();
        if ($docCount === 0 || $force) {
            $doctorsFile = __DIR__ . '/healthcare/doctors.json';
            if (file_exists($doctorsFile)) {
                $docData = json_decode((string) file_get_contents($doctorsFile), true);
                $docList = $docData['doctors'] ?? $docData ?? [];
                $stmt = $pdo->prepare("INSERT INTO `doctors`
                    (`doctor_id`, `name`, `speciality_id`, `speciality_name`, `qualification`, `experience_years`, `hospital_id`, `hospital_name`, `location`, `consultation_fee`, `fee_display`, `consultation_types`, `rating`, `reviews_count`, `badge`, `avatar`, `about`, `areas_of_expertise`, `languages`, `schedule`, `is_active`)
                    VALUES (:d_id, :name, :spec_id, :spec_name, :qual, :exp, :h_id, :h_name, :loc, :fee, :fee_disp, :types, :rating, :revs, :badge, :avatar, :about, :expert, :langs, :sched, 1)
                    ON DUPLICATE KEY UPDATE
                    `name` = VALUES(`name`), `speciality_name` = VALUES(`speciality_name`), `qualification` = VALUES(`qualification`), `consultation_fee` = VALUES(`consultation_fee`), `avatar` = VALUES(`avatar`), `about` = VALUES(`about`), `schedule` = VALUES(`schedule`)");
                
                foreach ($docList as $d) {
                    $stmt->execute([
                        ':d_id' => $d['id'] ?? ('doc-' . uniqid()),
                        ':name' => $d['name'] ?? 'Doctor Name',
                        ':spec_id' => $d['specialityId'] ?? 'general',
                        ':spec_name' => $d['specialityName'] ?? 'General Consultation',
                        ':qual' => $d['qualification'] ?? 'MBBS',
                        ':exp' => (int) ($d['experienceYears'] ?? 10),
                        ':h_id' => $d['hospitalId'] ?? 'hospital-1',
                        ':h_name' => $d['hospitalName'] ?? 'Avinya Partner Hospital',
                        ':loc' => $d['location'] ?? 'Mumbai',
                        ':fee' => (float) ($d['consultationFee'] ?? 0),
                        ':fee_disp' => $d['feeDisplay'] ?? 'Free / Avinya Supported',
                        ':types' => json_encode($d['consultationTypes'] ?? ['in-clinic', 'online']),
                        ':rating' => (float) ($d['rating'] ?? 4.90),
                        ':revs' => (int) ($d['reviewsCount'] ?? 100),
                        ':badge' => $d['badge'] ?? 'Medical Specialist',
                        ':avatar' => $d['avatar'] ?? '',
                        ':about' => $d['about'] ?? '',
                        ':expert' => json_encode($d['areasOfExpertise'] ?? []),
                        ':langs' => json_encode($d['languages'] ?? ['English', 'Hindi']),
                        ':sched' => json_encode($d['schedule'] ?? [])
                    ]);
                    $results['doctors_seeded']++;
                }
            }
        }

        // Seed Tests if empty or forced
        $testCount = (int) $pdo->query("SELECT COUNT(*) FROM `diagnostic_tests`")->fetchColumn();
        if ($testCount === 0 || $force) {
            $testsFile = __DIR__ . '/healthcare/tests.json';
            if (file_exists($testsFile)) {
                $testData = json_decode((string) file_get_contents($testsFile), true);
                $testList = $testData['tests'] ?? $testData ?? [];
                $stmt = $pdo->prepare("INSERT INTO `diagnostic_tests`
                    (`test_id`, `name`, `category`, `tagline`, `description`, `price`, `original_price`, `avinya_subsidy`, `tests_included`, `preparation`, `report_turnaround`, `sample_type`, `icon`, `home_collection`, `centre_visit`, `is_priority`, `badge`, `is_active`)
                    VALUES (:t_id, :name, :cat, :tagline, :descr, :price, :orig_price, :subsidy, :inc, :prep, :turnaround, :stype, :icon, :home, :centre, :prio, :badge, 1)
                    ON DUPLICATE KEY UPDATE
                    `name` = VALUES(`name`), `category` = VALUES(`category`), `price` = VALUES(`price`), `description` = VALUES(`description`), `sample_type` = VALUES(`sample_type`), `icon` = VALUES(`icon`)");
                
                foreach ($testList as $t) {
                    $stmt->execute([
                        ':t_id' => $t['id'] ?? ('test-' . uniqid()),
                        ':name' => $t['name'] ?? 'Diagnostic Test',
                        ':cat' => $t['category'] ?? 'Cancer Screening',
                        ':tagline' => $t['tagline'] ?? '',
                        ':descr' => $t['description'] ?? '',
                        ':price' => (float) ($t['price'] ?? 0),
                        ':orig_price' => (float) ($t['originalPrice'] ?? 0),
                        ':subsidy' => $t['avinyaSubsidy'] ?? '',
                        ':inc' => json_encode($t['testsIncluded'] ?? []),
                        ':prep' => $t['preparation'] ?? '',
                        ':turnaround' => $t['reportTurnaround'] ?? '24 Hours',
                        ':stype' => $t['sampleType'] ?? 'Blood / Serum Sample',
                        ':icon' => $t['icon'] ?? '🧪',
                        ':home' => !empty($t['homeCollection']) ? 1 : 0,
                        ':centre' => !empty($t['centreVisit']) ? 1 : 0,
                        ':prio' => !empty($t['isPriority']) ? 1 : 0,
                        ':badge' => $t['badge'] ?? ''
                    ]);
                    $results['tests_seeded']++;
                }
            }
        }
    } catch (Throwable $e) {
        error_log('Error seeding catalog tables: ' . $e->getMessage());
    }
    return $results;
}

function seedDiagnosticProviders(PDO $pdo, bool $force = false): int {
    $seeded = 0;
    try {
        $count = (int) $pdo->query("SELECT COUNT(*) FROM `diagnostic_providers`")->fetchColumn();
        if ($count === 0 || $force) {
            $providers = [
                [
                    'provider_id' => 'provider-1',
                    'name' => 'Avinya Central Diagnostics & Pathology',
                    'email' => 'lab.mumbai@avinyacarefoundation.org',
                    'phone' => '+91 98765 43210',
                    'city' => 'Mumbai',
                    'address' => 'Avinya Center, Bandra West, Mumbai 400050'
                ],
                [
                    'provider_id' => 'provider-2',
                    'name' => 'Metropolis Cancer Diagnostics & Advanced Imaging',
                    'email' => 'lab.delhi@metropolis.in',
                    'phone' => '+91 11 2692 5858',
                    'city' => 'New Delhi',
                    'address' => 'A-23, Hauz Khas Enclave, New Delhi 110016'
                ]
            ];

            $stmt = $pdo->prepare("INSERT INTO `diagnostic_providers`
                (`provider_id`, `name`, `email`, `phone`, `city`, `address`, `is_active`)
                VALUES (:p_id, :name, :email, :phone, :city, :addr, 1)
                ON DUPLICATE KEY UPDATE
                `name` = VALUES(`name`), `email` = VALUES(`email`), `phone` = VALUES(`phone`)");

            foreach ($providers as $p) {
                $stmt->execute([
                    ':p_id' => $p['provider_id'],
                    ':name' => $p['name'],
                    ':email' => $p['email'],
                    ':phone' => $p['phone'],
                    ':city' => $p['city'],
                    ':addr' => $p['address']
                ]);
                $seeded++;
            }
        }
    } catch (Throwable $e) {
        error_log('Error seeding diagnostic providers: ' . $e->getMessage());
    }
    return $seeded;
}

function seedDefaultUsers(PDO $pdo, bool $force = false): int {
    $seeded = 0;
    try {
        $stmt = $pdo->prepare("INSERT INTO `users`
            (`user_id`, `name`, `email`, `password_hash`, `role`, `doctor_id`, `provider_id`, `status`, `last_login`)
            VALUES (:u_id, :name, :email, :pass_hash, :role, :doc_id, :prov_id, 'active', NOW())
            ON DUPLICATE KEY UPDATE
            `name` = VALUES(`name`), `role` = VALUES(`role`), `doctor_id` = VALUES(`doctor_id`), `provider_id` = VALUES(`provider_id`), `status` = 'active'");

        // 1. Seed Super Admin
        $adminPassHash = password_hash('Admin@1230', PASSWORD_DEFAULT);
        $stmt->execute([
            ':u_id' => 'usr-admin-01',
            ':name' => 'Super Admin',
            ':email' => 'admin@gmail.com',
            ':pass_hash' => $adminPassHash,
            ':role' => 'admin',
            ':doc_id' => null,
            ':prov_id' => null
        ]);
        $seeded++;

        // 2. Seed Doctor User Accounts dynamically from `doctors` table
        $doctors = $pdo->query("SELECT `doctor_id`, `name` FROM `doctors`")->fetchAll();
        foreach ($doctors as $d) {
            $docId = $d['doctor_id'];
            $cleanDocId = preg_replace('/[^a-zA-Z0-9_-]/', '', $docId);
            $email = "doctor.{$cleanDocId}@avinyacarefoundation.org";
            $userId = "usr-doc-{$cleanDocId}";
            $passHash = password_hash('Doctor@2026', PASSWORD_DEFAULT);

            $stmt->execute([
                ':u_id' => $userId,
                ':name' => $d['name'],
                ':email' => $email,
                ':pass_hash' => $passHash,
                ':role' => 'doctor',
                ':doc_id' => $docId,
                ':prov_id' => null
            ]);
            $seeded++;
        }

        // 3. Seed Diagnostic Provider User Accounts dynamically from `diagnostic_providers` table
        $providers = $pdo->query("SELECT `provider_id`, `name`, `email` FROM `diagnostic_providers`")->fetchAll();
        foreach ($providers as $p) {
            $provId = $p['provider_id'];
            $cleanProvId = preg_replace('/[^a-zA-Z0-9_-]/', '', $provId);
            $userId = "usr-prov-{$cleanProvId}";
            $email = $p['email'] ?? "provider.{$cleanProvId}@avinyacarefoundation.org";
            $passHash = password_hash('Provider@2026', PASSWORD_DEFAULT);

            $stmt->execute([
                ':u_id' => $userId,
                ':name' => $p['name'],
                ':email' => $email,
                ':pass_hash' => $passHash,
                ':role' => 'diagnostic_provider',
                ':doc_id' => null,
                ':prov_id' => $provId
            ]);
            $seeded++;
        }
    } catch (Throwable $e) {
        error_log('Error seeding default users: ' . $e->getMessage());
    }
    return $seeded;
}

