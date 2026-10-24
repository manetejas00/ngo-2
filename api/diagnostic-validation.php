<?php
declare(strict_types=1);
function validateDiagnosticRequest(array $data, ?string $today = null): void {
    $today ??= (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format('Y-m-d');
    $date = (string) ($data['date'] ?? '');
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date || $date < $today) throw new InvalidArgumentException('Choose a valid date today or later.');
    if (!in_array($data['timeSlot'] ?? '', ['07:30 AM - 08:30 AM','08:30 AM - 09:30 AM','09:30 AM - 10:30 AM','11:00 AM - 12:00 PM'], true)) throw new InvalidArgumentException('Choose a listed preferred time slot.');
    $method = $data['collectionMethod'] ?? 'home_collection';
    if (!in_array($method, ['home_collection','centre_visit'], true)) throw new InvalidArgumentException('Choose a valid collection method.');
    if ($method === 'home_collection' && (trim((string) ($data['homeAddress'] ?? '')) === '' || !preg_match('/^[1-9]\d{5}$/D', (string) ($data['pincode'] ?? '')))) throw new InvalidArgumentException('Enter your collection address and a valid six-digit PIN. Availability must be confirmed.');
    if (!in_array($data['patientGender'] ?? '', ['Male','Female','Other'], true)) throw new InvalidArgumentException('Select a gender.');
    if (filter_var($data['patientAge'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 120]]) === false) throw new InvalidArgumentException('Enter an age between 1 and 120.');
    if (!filter_var($data['patientEmail'] ?? '', FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Enter a valid email address.');
    if (!preg_match('/^(?:\+91)?[6-9]\d{9}$/D', preg_replace('/[\s()-]/', '', (string) ($data['patientPhone'] ?? '')))) throw new InvalidArgumentException('Enter a valid Indian mobile number.');
}
