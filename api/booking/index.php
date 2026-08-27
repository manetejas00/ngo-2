<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Kolkata');

const ACTIVE_STATUSES = ['confirmed', 'rescheduled', 'pending'];
const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled', 'no_show', 'archived'];

$projectRoot = dirname(__DIR__, 2);
$storageDir = $projectRoot . '/storage/bookings';
$bookingFile = $storageDir . '/bookings.json';
$backupDir = $storageDir . '/backups';
$lockFile = $storageDir . '/bookings.lock';
$doctorsFile = $projectRoot . '/api/healthcare/doctors.json';
$legacyHealthcareFile = $projectRoot . '/cache/healthcare_db.json';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respondJson(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function nowIso(): string {
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format(DateTimeInterface::ATOM);
}

function isListArray(array $value): bool {
    return array_keys($value) === range(0, count($value) - 1) || $value === [];
}

function requireStorage(): void {
    global $storageDir, $backupDir, $bookingFile, $legacyHealthcareFile;
    foreach ([$storageDir, $backupDir] as $directory) {
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            throw new RuntimeException('Booking storage directory is not writable.');
        }
    }
    if (!file_exists($bookingFile)) {
        $initial = [];
        if (is_file($legacyHealthcareFile)) {
            $legacyRaw = @file_get_contents($legacyHealthcareFile);
            $legacy = $legacyRaw === false ? null : json_decode($legacyRaw, true);
            if (is_array($legacy) && isset($legacy['appointments']) && is_array($legacy['appointments'])) {
                $initial = array_values($legacy['appointments']);
            }
        }
        $created = file_put_contents($bookingFile, json_encode($initial, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n", LOCK_EX);
        if ($created === false) throw new RuntimeException('Unable to initialize booking storage.');
    }
}

function decodeLedger(string $raw, string $source): array {
    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || !isListArray($decoded)) {
        throw new RuntimeException("Invalid booking ledger: {$source}");
    }
    return $decoded;
}

function latestValidBackup(): ?array {
    global $backupDir;
    $files = glob($backupDir . '/bookings-*.json') ?: [];
    rsort($files, SORT_STRING);
    foreach ($files as $file) {
        $raw = @file_get_contents($file);
        if ($raw === false) continue;
        $decoded = json_decode($raw, true);
        if (is_array($decoded) && isListArray($decoded)) return $decoded;
    }
    return null;
}

function readLedger(): array {
    global $bookingFile, $backupDir;
    requireStorage();
    $raw = @file_get_contents($bookingFile);
    if ($raw === false) throw new RuntimeException('Unable to read booking storage.');
    try {
        return decodeLedger($raw, $bookingFile);
    } catch (Throwable $error) {
        $corruptCopy = $backupDir . '/corrupt-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.json';
        @file_put_contents($corruptCopy, $raw, LOCK_EX);
        $recovered = latestValidBackup();
        if ($recovered !== null) return $recovered;
        throw new RuntimeException('Booking storage is invalid and no valid backup is available. The original file was preserved.');
    }
}

function withLedgerLock(callable $operation) {
    global $lockFile;
    requireStorage();
    $handle = fopen($lockFile, 'c+');
    if ($handle === false) throw new RuntimeException('Unable to open the booking lock.');
    try {
        if (!flock($handle, LOCK_EX)) throw new RuntimeException('Unable to acquire the booking lock.');
        return $operation();
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function atomicSave(array $bookings): void {
    global $bookingFile, $backupDir, $storageDir;
    $json = json_encode(array_values($bookings), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false || !is_array(json_decode($json, true))) {
        throw new RuntimeException('Refusing to write invalid booking data.');
    }

    if (is_file($bookingFile) && filesize($bookingFile) > 0) {
        $backup = $backupDir . '/bookings-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.json';
        if (!copy($bookingFile, $backup)) throw new RuntimeException('Unable to create a booking backup.');
    }

    $temp = tempnam($storageDir, 'bookings-');
    if ($temp === false) throw new RuntimeException('Unable to create a temporary booking file.');
    try {
        if (file_put_contents($temp, $json . "\n", LOCK_EX) === false) {
            throw new RuntimeException('Unable to write booking data.');
        }
        decodeLedger((string) file_get_contents($temp), $temp);
        if (!rename($temp, $bookingFile)) throw new RuntimeException('Unable to atomically replace booking storage.');
        @chmod($bookingFile, 0640);
    } finally {
        if (is_file($temp)) @unlink($temp);
    }
}

function requestBody(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return $_POST;
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) throw new InvalidArgumentException('Request body must be valid JSON.');
    return $decoded;
}

function validDate(string $date): bool {
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date, new DateTimeZone('Asia/Kolkata'));
    return $parsed !== false && $parsed->format('Y-m-d') === $date;
}

function normalizeTime(string $time): string {
    return strtoupper(trim(preg_replace('/\s+/', ' ', $time)));
}

function doctorSchedules(): array {
    global $doctorsFile;
    $raw = @file_get_contents($doctorsFile);
    $data = $raw === false ? null : json_decode($raw, true);
    $doctors = is_array($data) ? ($data['doctors'] ?? []) : [];
    $result = [];
    foreach ($doctors as $doctor) {
        if (!empty($doctor['id'])) $result[$doctor['id']] = $doctor;
    }
    return $result;
}

function minutes(string $time): int {
    [$hour, $minute] = array_map('intval', explode(':', $time));
    return $hour * 60 + $minute;
}

function timeLabel(int $total): string {
    $hour24 = intdiv($total, 60);
    $minute = $total % 60;
    $period = $hour24 >= 12 ? 'PM' : 'AM';
    $hour12 = $hour24 % 12 ?: 12;
    return sprintf('%02d:%02d %s', $hour12, $minute, $period);
}

function availableSlots(string $doctorId, string $date, array $bookings): array {
    if (!validDate($date)) throw new InvalidArgumentException('Date must use YYYY-MM-DD format.');
    $doctors = doctorSchedules();
    if (!isset($doctors[$doctorId])) throw new InvalidArgumentException('Selected doctor was not found.');
    $schedule = $doctors[$doctorId]['schedule'] ?? [];
    $day = (int) (new DateTimeImmutable($date . ' 12:00:00', new DateTimeZone('Asia/Kolkata')))->format('w');
    if (!in_array($day, $schedule['workingDays'] ?? [1,2,3,4,5,6], true)) return [];

    $start = minutes($schedule['startTime'] ?? '09:00');
    $end = minutes($schedule['endTime'] ?? '17:00');
    $duration = max(5, (int) ($schedule['slotDurationMins'] ?? 30));
    $breakStart = isset($schedule['breakStart']) ? minutes($schedule['breakStart']) : -1;
    $breakEnd = isset($schedule['breakEnd']) ? minutes($schedule['breakEnd']) : -1;
    $occupied = [];
    foreach ($bookings as $booking) {
        if (($booking['doctorId'] ?? '') === $doctorId && ($booking['date'] ?? '') === $date && in_array($booking['status'] ?? '', ACTIVE_STATUSES, true)) {
            $occupied[normalizeTime((string) ($booking['time'] ?? $booking['slot'] ?? ''))] = true;
        }
    }

    $slots = [];
    for ($cursor = $start; $cursor + $duration <= $end; $cursor += $duration) {
        if ($breakStart >= 0 && $cursor >= $breakStart && $cursor < $breakEnd) continue;
        $label = timeLabel($cursor);
        if (!isset($occupied[normalizeTime($label)])) {
            $slots[] = ['time' => $label, 'label' => $label, 'available' => true];
        }
    }
    return $slots;
}

function createBooking(array $data): array {
    return withLedgerLock(function () use ($data) {
        $required = ['doctorId', 'date', 'time', 'patientName', 'patientEmail', 'patientPhone'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || trim((string) $data[$field]) === '') throw new InvalidArgumentException("Missing required field: {$field}");
        }
        if (!validDate((string) $data['date'])) throw new InvalidArgumentException('Date must use YYYY-MM-DD format.');
        if (!filter_var($data['patientEmail'], FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('A valid email address is required.');

        $bookings = readLedger();
        $slot = normalizeTime((string) $data['time']);
        $available = availableSlots((string) $data['doctorId'], (string) $data['date'], $bookings);
        $validSlot = false;
        foreach ($available as $candidate) if (normalizeTime($candidate['time']) === $slot) $validSlot = true;
        if (!$validSlot) throw new DomainException('This slot has already been booked or is not available. Please choose another slot.');

        $doctors = doctorSchedules();
        $doctor = $doctors[$data['doctorId']];
        $timestamp = nowIso();
        $id = 'BK-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));
        $booking = [
            'id' => $id,
            'doctorId' => (string) $data['doctorId'],
            'doctorName' => (string) ($doctor['name'] ?? ''),
            'doctorSpeciality' => (string) ($doctor['specialityName'] ?? ''),
            'doctorHospital' => (string) ($doctor['hospitalName'] ?? ''),
            'doctorFee' => (float) ($doctor['consultationFee'] ?? 0),
            'patientName' => trim((string) $data['patientName']),
            'patientEmail' => strtolower(trim((string) $data['patientEmail'])),
            'patientPhone' => trim((string) $data['patientPhone']),
            'patientAge' => (int) ($data['patientAge'] ?? 0),
            'patientGender' => (string) ($data['patientGender'] ?? 'Unspecified'),
            'consultationType' => (string) ($data['consultationType'] ?? 'in-clinic'),
            'originalDate' => (string) $data['date'],
            'originalSlot' => $slot,
            'date' => (string) $data['date'],
            'time' => $slot,
            'slot' => $slot,
            'reason' => trim((string) ($data['reason'] ?? 'General consultation')),
            'notes' => trim((string) ($data['notes'] ?? '')),
            'status' => 'confirmed',
            'createdAt' => $timestamp,
            'updatedAt' => $timestamp,
            'cancelledAt' => null,
            'completedAt' => null,
            'rescheduledAt' => null,
            'rescheduleHistory' => [],
            'history' => [['action' => 'created', 'status' => 'confirmed', 'at' => $timestamp, 'updatedBy' => 'Patient / Web Booking']]
        ];
        $bookings[] = $booking;
        atomicSave($bookings);
        return $booking;
    });
}

function updateBooking(string $id, array $data): array {
    return withLedgerLock(function () use ($id, $data) {
        $bookings = readLedger();
        foreach ($bookings as $index => $booking) {
            if (($booking['id'] ?? '') !== $id) continue;
            $status = str_replace('-', '_', strtolower((string) ($data['status'] ?? '')));
            if (!in_array($status, ALLOWED_STATUSES, true)) throw new InvalidArgumentException('Invalid booking status.');
            $timestamp = nowIso();
            $oldDate = (string) ($booking['date'] ?? '');
            $oldSlot = normalizeTime((string) ($booking['time'] ?? $booking['slot'] ?? ''));

            if ($status === 'rescheduled') {
                $newDate = (string) ($data['date'] ?? $data['newDate'] ?? '');
                $newSlot = normalizeTime((string) ($data['time'] ?? $data['newTime'] ?? ''));
                if (!$newDate || !$newSlot) throw new InvalidArgumentException('A reschedule requires a new date and time.');
                $others = $bookings;
                $others[$index]['status'] = 'cancelled';
                $available = availableSlots((string) $booking['doctorId'], $newDate, $others);
                if (!array_filter($available, fn($slot) => normalizeTime($slot['time']) === $newSlot)) {
                    throw new DomainException('The requested replacement slot is not available.');
                }
                $booking['originalDate'] = $booking['originalDate'] ?? $oldDate;
                $booking['originalSlot'] = $booking['originalSlot'] ?? $oldSlot;
                $booking['date'] = $newDate;
                $booking['time'] = $newSlot;
                $booking['slot'] = $newSlot;
                $booking['rescheduledAt'] = $timestamp;
                $booking['rescheduleHistory'][] = ['fromDate' => $oldDate, 'fromSlot' => $oldSlot, 'toDate' => $newDate, 'toSlot' => $newSlot, 'changedAt' => $timestamp];
            }

            $booking['status'] = $status;
            $booking['updatedAt'] = $timestamp;
            if ($status === 'cancelled') $booking['cancelledAt'] = $timestamp;
            if ($status === 'completed') $booking['completedAt'] = $timestamp;
            $booking['history'][] = ['action' => $status, 'status' => $status, 'at' => $timestamp, 'updatedBy' => (string) ($data['actor'] ?? 'Admin'), 'notes' => (string) ($data['notes'] ?? '')];
            $bookings[$index] = $booking;
            atomicSave($bookings);
            return $booking;
        }
        throw new InvalidArgumentException('Booking not found.');
    });
}

function filteredBookings(array $bookings, array $query): array {
    $search = strtolower(trim((string) ($query['search'] ?? '')));
    $status = strtolower(trim((string) ($query['status'] ?? 'all')));
    $from = (string) ($query['fromDate'] ?? '');
    $to = (string) ($query['toDate'] ?? '');
    $createdFrom = (string) ($query['createdFrom'] ?? '');
    $createdTo = (string) ($query['createdTo'] ?? '');
    $doctorId = (string) ($query['doctorId'] ?? '');
    $list = array_values(array_filter($bookings, function ($booking) use ($search, $status, $from, $to, $createdFrom, $createdTo, $doctorId) {
        if ($doctorId && ($booking['doctorId'] ?? '') !== $doctorId) return false;
        if ($status !== '' && $status !== 'all' && ($booking['status'] ?? '') !== $status) return false;
        $date = (string) ($booking['date'] ?? '');
        $created = substr((string) ($booking['createdAt'] ?? ''), 0, 10);
        if ($from && $date < $from) return false;
        if ($to && $date > $to) return false;
        if ($createdFrom && $created < $createdFrom) return false;
        if ($createdTo && $created > $createdTo) return false;
        if (!$search) return true;
        $haystack = strtolower(implode(' ', [
            $booking['id'] ?? '', $booking['patientName'] ?? '', $booking['patientEmail'] ?? '',
            $booking['patientPhone'] ?? '', $booking['doctorName'] ?? '', $booking['date'] ?? '', $booking['time'] ?? ''
        ]));
        return str_contains($haystack, $search);
    }));
    $sort = (string) ($query['sort'] ?? 'newest');
    usort($list, function ($a, $b) use ($sort) {
        if ($sort === 'oldest') return strcmp((string) ($a['createdAt'] ?? ''), (string) ($b['createdAt'] ?? ''));
        if ($sort === 'booking_date') return strcmp((string) ($a['date'] ?? ''), (string) ($b['date'] ?? ''));
        if ($sort === 'status') return strcmp((string) ($a['status'] ?? ''), (string) ($b['status'] ?? ''));
        return strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? ''));
    });
    return $list;
}

function xmlEscape(string $value): string {
    return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

function excelColumn(int $number): string {
    $name = '';
    while ($number > 0) { $number--; $name = chr(65 + ($number % 26)) . $name; $number = intdiv($number, 26); }
    return $name;
}

function worksheetXml(array $bookings): string {
    $headers = ['Booking ID','Customer Name','Email','Phone','Doctor','Original Booking Date','Original Slot','Current Booking Date','Current Slot','Status','Created At','Updated At','Cancelled At','Completed At','Rescheduled At','Notes','Reschedule History','Audit History'];
    $rows = [$headers];
    foreach ($bookings as $b) {
        $rows[] = [
            $b['id'] ?? '', $b['patientName'] ?? '', $b['patientEmail'] ?? '', $b['patientPhone'] ?? '', $b['doctorName'] ?? '',
            $b['originalDate'] ?? $b['date'] ?? '', $b['originalSlot'] ?? $b['time'] ?? '', $b['date'] ?? '', $b['time'] ?? $b['slot'] ?? '',
            $b['status'] ?? '', $b['createdAt'] ?? '', $b['updatedAt'] ?? '', $b['cancelledAt'] ?? '', $b['completedAt'] ?? '', $b['rescheduledAt'] ?? '',
            $b['notes'] ?? '', json_encode($b['rescheduleHistory'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), json_encode($b['history'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        ];
    }
    $sheetRows = '';
    foreach ($rows as $rowIndex => $row) {
        $cells = '';
        foreach ($row as $columnIndex => $value) {
            $ref = excelColumn($columnIndex + 1) . ($rowIndex + 1);
            $style = $rowIndex === 0 ? ' s="1"' : '';
            $cells .= '<c r="' . $ref . '" t="inlineStr"' . $style . '><is><t>' . xmlEscape((string) $value) . '</t></is></c>';
        }
        $sheetRows .= '<row r="' . ($rowIndex + 1) . '">' . $cells . '</row>';
    }
    $lastColumn = excelColumn(count($headers));
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
        . '<cols><col min="1" max="1" width="23" customWidth="1"/><col min="2" max="5" width="24" customWidth="1"/><col min="6" max="15" width="20" customWidth="1"/><col min="16" max="18" width="42" customWidth="1"/></cols>'
        . '<sheetData>' . $sheetRows . '</sheetData><autoFilter ref="A1:' . $lastColumn . count($rows) . '"/></worksheet>';
}

function exportWorkbook(array $bookings): void {
    if (!class_exists('ZipArchive')) throw new RuntimeException('The PHP Zip extension is required for Excel export.');
    $temp = tempnam(sys_get_temp_dir(), 'bookings-xlsx-');
    $zip = new ZipArchive();
    if ($temp === false || $zip->open($temp, ZipArchive::OVERWRITE) !== true) throw new RuntimeException('Unable to create Excel workbook.');
    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
    $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="All Bookings" sheetId="1" r:id="rId1"/></sheets></workbook>');
    $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    $zip->addFromString('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF087F73"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>');
    $zip->addFromString('xl/worksheets/sheet1.xml', worksheetXml($bookings));
    $zip->close();
    $filename = 'all-bookings-' . date('Y-m-d') . '.xlsx';
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($temp));
    header('Cache-Control: no-store');
    readfile($temp);
    @unlink($temp);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = strtolower((string) ($_GET['action'] ?? ($method === 'POST' ? 'create' : 'slots')));

    if ($method === 'GET' && $action === 'slots') {
        $doctorId = trim((string) ($_GET['doctorId'] ?? ''));
        $date = trim((string) ($_GET['date'] ?? ''));
        $slots = availableSlots($doctorId, $date, readLedger());
        respondJson(200, ['success' => true, 'status' => 'ok', 'doctorId' => $doctorId, 'date' => $date, 'slots' => $slots]);
    }
    if ($method === 'POST' && $action === 'create') {
        $booking = createBooking(requestBody());
        respondJson(201, ['success' => true, 'status' => 'ok', 'booking' => $booking, 'appointment' => $booking, 'message' => 'Appointment confirmed.']);
    }
    if (($method === 'PATCH' || $method === 'POST') && $action === 'status') {
        $data = requestBody();
        $id = trim((string) ($_GET['id'] ?? $data['id'] ?? ''));
        $booking = updateBooking($id, $data);
        respondJson(200, ['success' => true, 'status' => 'ok', 'booking' => $booking, 'appointment' => $booking]);
    }
    if ($method === 'GET' && $action === 'list') {
        $all = readLedger();
        $filtered = filteredBookings($all, $_GET);
        respondJson(200, ['success' => true, 'status' => 'ok', 'bookings' => $filtered, 'appointments' => $filtered, 'count' => count($filtered), 'total' => count($all)]);
    }
    if ($method === 'GET' && $action === 'export') {
        exportWorkbook(readLedger());
    }
    if ($method === 'GET' && $action === 'export_filtered') {
        exportWorkbook(filteredBookings(readLedger(), $_GET));
    }
    respondJson(404, ['success' => false, 'status' => 'error', 'message' => 'Booking API action not found.']);
} catch (DomainException $error) {
    respondJson(409, ['success' => false, 'status' => 'error', 'message' => $error->getMessage()]);
} catch (InvalidArgumentException $error) {
    respondJson(400, ['success' => false, 'status' => 'error', 'message' => $error->getMessage()]);
} catch (Throwable $error) {
    error_log('[Booking API] ' . $error->getMessage());
    respondJson(500, ['success' => false, 'status' => 'error', 'message' => 'Booking service is temporarily unavailable. Existing records were not modified.']);
}
