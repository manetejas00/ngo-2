<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['status' => 'error', 'message' => 'Method not allowed']); exit; }

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/activity-logger.php';


function diagnosticEnv(string $name, string $default = ''): string {
    $envFile = dirname(__DIR__) . '/.env';
    static $loaded = false;
    if (!$loaded && is_readable($envFile)) {
        foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
            [$key, $value] = array_map('trim', explode('=', $line, 2));
            if (getenv($key) === false) putenv($key . '=' . trim($value, "\"'"));
        }
        $loaded = true;
    }
    $value = getenv($name);
    return trim((string) ($value === false ? $default : $value));
}

function diagnosticHtml(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function smtpResponse($socket, array $codes): void {
    $response = '';
    while (($line = fgets($socket, 1024)) !== false) {
        $response .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') break;
    }
    if (!in_array((int) substr($response, 0, 3), $codes, true)) throw new RuntimeException('SMTP rejected the message.');
}

function smtpCommand($socket, string $command, array $codes): void {
    if (fwrite($socket, $command . "\r\n") === false) throw new RuntimeException('SMTP write failed.');
    smtpResponse($socket, $codes);
}

function diagnosticTemplate(array $booking): string {
    $collection = $booking['collectionMethod'] === 'home_collection' ? 'Home Sample Collection' : 'Diagnostic Centre Visit';
    $location = $booking['collectionMethod'] === 'home_collection'
        ? trim($booking['homeAddress'] . ', ' . $booking['city'] . ' - ' . $booking['pincode'], ', -')
        : 'Avinya Partner Diagnostic Centre';
    return '<!doctype html><html><body style="margin:0;background:#F8FAFC;font-family:Arial,sans-serif;color:#0F172A">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 14px;background:#F8FAFC"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden">'
        . '<tr><td style="background:#0A0A0A;padding:28px 32px;text-align:center;color:#fff;border-bottom:3px solid #F47528"><div style="display:inline-block;background:#fff;border-radius:50%;padding:6px;margin-bottom:12px"><img src="cid:avinya-logo" alt="Avinya Care Foundation" width="56" height="56" style="display:block;width:56px;height:56px;border:0;border-radius:50%"></div><div style="color:#F58220;font-size:11px;font-weight:700;letter-spacing:2px">AVINYA CARE HEALTHCARE PLATFORM</div><h1 style="margin:6px 0 0;font-size:20px">Diagnostic Test Confirmed</h1></td></tr>'
        . '<tr><td style="padding:34px"><p style="font-size:16px">Dear <strong>' . diagnosticHtml($booking['patientName']) . '</strong>,</p><p style="line-height:1.7;color:#334155">Your diagnostic test booking has been scheduled successfully.</p>'
        . '<div style="border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;margin:24px 0"><div style="background:#087F73;color:#fff;padding:12px 18px;font-size:12px;font-weight:700;letter-spacing:1px">DIAGNOSTIC TEST BOOKING SUMMARY</div><div style="background:#F8FAFC;padding:20px;line-height:1.9"><strong>Booking ID:</strong> ' . diagnosticHtml($booking['id']) . '<br><strong>Test Package:</strong> ' . diagnosticHtml($booking['testName']) . '<br><strong>Collection Mode:</strong> ' . diagnosticHtml($collection) . '<br><strong>Date &amp; Time:</strong> ' . diagnosticHtml($booking['date'] . ' (' . $booking['timeSlot'] . ')') . '<br><strong>Location:</strong> ' . diagnosticHtml($location) . '<br><strong>Total Package Fee:</strong> ₹' . diagnosticHtml((string) $booking['price']) . '</div></div></td></tr>'
        . '<tr><td style="background:#0A0A0A;padding:24px 32px;text-align:center;color:#A3A3A3;font-size:11px"><strong style="display:block;color:#fff;font-size:13px;margin-bottom:6px">Avinya Care Foundation</strong>A humanitarian oncology and healthcare initiative.<br>80G &amp; 12A Tax Exempted under the Indian IT Act.</td></tr>'
        . '</table></td></tr></table></body></html>';
}

function sendDiagnosticEmail(array $booking, bool $sendAdminRecord = true): bool {
    $host = diagnosticEnv('SMTP_HOST', 'smtp.hostinger.com');
    $port = (int) diagnosticEnv('SMTP_PORT', '465');
    $user = diagnosticEnv('SMTP_USER');
    $pass = diagnosticEnv('SMTP_PASS');
    $from = diagnosticEnv('SMTP_FROM', $user);
    if ($user === '' || $pass === '' || $from === '') return false;
    $socket = @fsockopen('ssl://' . preg_replace('#^ssl://#', '', $host), $port, $errno, $error, 12);
    if (!$socket) return false;
    try {
        smtpResponse($socket, [220]);
        smtpCommand($socket, 'EHLO ' . (gethostname() ?: 'localhost'), [250]);
        smtpCommand($socket, 'AUTH LOGIN', [334]);
        smtpCommand($socket, base64_encode($user), [334]);
        smtpCommand($socket, base64_encode($pass), [235]);
        smtpCommand($socket, 'MAIL FROM:<' . $from . '>', [250]);
        smtpCommand($socket, 'RCPT TO:<' . $booking['patientEmail'] . '>', [250, 251]);
        smtpCommand($socket, 'DATA', [354]);
        $boundary = '=_AvinyaDiagnostic_' . bin2hex(random_bytes(8));
        $subjectPrefix = !empty($booking['_adminRecord']) ? '[Admin Record] ' : '';
        $headers = ['From: Avinya Care Foundation <' . $from . '>', 'To: <' . $booking['patientEmail'] . '>', 'Subject: =?UTF-8?B?' . base64_encode($subjectPrefix . 'Diagnostic Test Booking Confirmation – Avinyacare [' . $booking['id'] . ']') . '?=', 'MIME-Version: 1.0', 'Content-Type: multipart/related; boundary="' . $boundary . '"', 'X-Mailer: AvinyaCare-Diagnostic/1.0'];
        $parts = ['--' . $boundary, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', diagnosticTemplate($booking)];
        $logoPath = dirname(__DIR__) . '/assets/logo.png';
        if (is_readable($logoPath)) {
            $parts = array_merge($parts, ['--' . $boundary, 'Content-Type: image/png; name="avinya-care-logo.png"', 'Content-Transfer-Encoding: base64', 'Content-ID: <avinya-logo>', 'Content-Disposition: inline; filename="avinya-care-logo.png"', '', rtrim(chunk_split(base64_encode((string) file_get_contents($logoPath)), 76, "\r\n"))]);
        }
        $parts[] = '--' . $boundary . '--';
        $message = implode("\r\n", $headers) . "\r\n\r\n" . preg_replace('/(?m)^\./', '..', implode("\r\n", $parts)) . "\r\n.";
        smtpCommand($socket, $message, [250]);
        fwrite($socket, "QUIT\r\n"); fclose($socket);
        if ($sendAdminRecord) {
            $adminRecord = diagnosticEnv('ADMIN_RECORD_EMAIL');
            if (filter_var($adminRecord, FILTER_VALIDATE_EMAIL)) {
                $adminBooking = $booking;
                $adminBooking['patientEmail'] = $adminRecord;
                $adminBooking['_adminRecord'] = true;
                sendDiagnosticEmail($adminBooking, false);
            }
        }
        return true;
    } catch (Throwable $exception) { fclose($socket); return false; }
}

try {
    $data = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($data)) throw new InvalidArgumentException('Invalid JSON payload.');
    foreach (['testId','date','timeSlot','patientName','patientEmail','patientPhone'] as $field) if (trim((string) ($data[$field] ?? '')) === '') throw new InvalidArgumentException('Missing required field: ' . $field);
    if (!filter_var($data['patientEmail'], FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('A valid email address is required.');
    $tests = json_decode((string) file_get_contents(__DIR__ . '/healthcare/tests.json'), true);
    $catalog = isset($tests['tests']) ? $tests['tests'] : $tests;
    $test = null; foreach ($catalog as $candidate) if (($candidate['id'] ?? '') === $data['testId']) { $test = $candidate; break; }
    if (!$test) throw new InvalidArgumentException('Selected diagnostic test package not found.');
    $booking = ['id' => 'AVC-TST-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4))), 'testId' => $data['testId'], 'testName' => $test['name'], 'price' => $test['price'], 'collectionMethod' => $data['collectionMethod'] ?? 'home_collection', 'homeAddress' => trim((string) ($data['homeAddress'] ?? '')), 'pincode' => trim((string) ($data['pincode'] ?? '')), 'city' => trim((string) ($data['city'] ?? 'Mumbai')), 'date' => $data['date'], 'timeSlot' => $data['timeSlot'], 'patientName' => trim($data['patientName']), 'patientEmail' => strtolower(trim($data['patientEmail'])), 'patientPhone' => trim($data['patientPhone']), 'patientAge' => (int) ($data['patientAge'] ?? 0), 'patientGender' => $data['patientGender'] ?? 'Unspecified', 'status' => 'confirmed', 'createdAt' => date(DATE_ATOM)];
    $dataDir = __DIR__ . '/diagnostic/data'; if (!is_dir($dataDir)) mkdir($dataDir, 0775, true);
    $ledgerPath = $dataDir . '/test-bookings.json'; $ledger = is_readable($ledgerPath) ? json_decode((string) file_get_contents($ledgerPath), true) : []; if (!is_array($ledger)) $ledger = [];
    $ledger[] = $booking; file_put_contents($ledgerPath, json_encode($ledger, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
    $emailSent = sendDiagnosticEmail($booking);
    
    try {
        $pdo = getDatabaseConnection();
        if ($pdo !== null) {
            $stmt = $pdo->prepare("INSERT INTO `diagnostic_bookings`
                (`booking_id`, `test_id`, `test_name`, `price`, `collection_method`, `patient_name`, `patient_email`, `patient_phone`, `patient_age`, `patient_gender`, `home_address`, `pincode`, `city`, `booking_date`, `time_slot`, `status`, `email_sent`)
                VALUES (:b_id, :t_id, :t_name, :price, :coll, :p_name, :p_email, :p_phone, :p_age, :p_gender, :addr, :pin, :city, :b_date, :slot, :status, :e_sent)");
            
            $stmt->execute([
                ':b_id' => $booking['id'],
                ':t_id' => $booking['testId'],
                ':t_name' => $booking['testName'],
                ':price' => $booking['price'],
                ':coll' => $booking['collectionMethod'],
                ':p_name' => $booking['patientName'],
                ':p_email' => $booking['patientEmail'],
                ':p_phone' => $booking['patientPhone'],
                ':p_age' => $booking['patientAge'],
                ':p_gender' => $booking['patientGender'],
                ':addr' => $booking['homeAddress'],
                ':pin' => $booking['pincode'],
                ':city' => $booking['city'],
                ':b_date' => $booking['date'],
                ':slot' => $booking['timeSlot'],
                ':status' => $booking['status'],
                ':e_sent' => $emailSent ? 1 : 0
            ]);

            if ($emailSent) {
                $logStmt = $pdo->prepare("INSERT INTO `email_logs` (`reference_id`, `form_or_booking_type`, `recipient_role`, `recipient_email`, `subject`, `smtp_status`, `delivery_method`) VALUES (:ref, 'diagnostic_booking', 'patient', :to, :subj, 'SENT', 'HOSTINGER_SSL_SMTP_465')");
                $logStmt->execute([
                    ':ref' => $booking['id'],
                    ':to' => $booking['patientEmail'],
                    ':subj' => 'Diagnostic Booking Confirmed — ' . $booking['id']
                ]);
            }
        }
    } catch (Throwable $dbErr) {
        error_log('Database Insert Warning (diagnostic_bookings): ' . $dbErr->getMessage());
    }

    logActivity(
        'DIAGNOSTIC_BOOKING',
        'user',
        $booking['patientEmail'],
        "Booked diagnostic package '{$booking['testName']}' for {$booking['date']}",
        [
            'bookingId' => $booking['id'],
            'testId' => $booking['testId'],
            'testName' => $booking['testName'],
            'price' => $booking['price'],
            'patientName' => $booking['patientName'],
            'patientEmail' => $booking['patientEmail'],
            'patientPhone' => $booking['patientPhone'],
            'date' => $booking['date'],
            'timeSlot' => $booking['timeSlot'],
            'city' => $booking['city']
        ]
    );

    http_response_code(201); echo json_encode(['status' => 'ok', 'booking' => $booking, 'emailSent' => $emailSent]);
} catch (InvalidArgumentException $exception) { http_response_code(400); echo json_encode(['status' => 'error', 'message' => $exception->getMessage()]); }
catch (Throwable $exception) { http_response_code(500); echo json_encode(['status' => 'error', 'message' => 'Diagnostic booking service is temporarily unavailable.']); }
