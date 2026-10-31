<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
function syncReply(int $status, array $data): never { http_response_code($status); echo json_encode($data); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') syncReply(405, ['status'=>'error']);
require_once __DIR__ . '/db.php';
loadEnvDatabaseVars();
$secret = getDbEnv('GOOGLE_FORMS_SYNC_SECRET', '');
if (strlen($secret) < 32) syncReply(503, ['status'=>'unconfigured']);
$raw = file_get_contents('php://input', false, null, 0, 65537);
if ($raw === false || strlen($raw) > 65536) syncReply(413, ['status'=>'error']);
$timestamp = $_SERVER['HTTP_X_AVINYA_TIMESTAMP'] ?? '';
$signature = $_SERVER['HTTP_X_AVINYA_SIGNATURE'] ?? '';
if (!ctype_digit($timestamp) || abs(time() - (int)$timestamp) > 300 || !hash_equals(hash_hmac('sha256', $timestamp.'.'.$raw, $secret), $signature)) syncReply(401, ['status'=>'unauthorized']);
$data = json_decode($raw, true);
if (!is_array($data) || ($data['form_id'] ?? '') !== '1UVgzhzhWTUvwals3B997bIdFKocLsxWUiveiP93APjU') syncReply(422, ['status'=>'invalid_form']);
$responseId = (string)($data['response_id'] ?? '');
$answers = $data['answers'] ?? [];
if ($responseId === '' || strlen($responseId) > 256 || !is_array($answers)) syncReply(422, ['status'=>'invalid_response']);
$find = function(string $prefix) use ($answers): string { foreach ($answers as $title=>$value) { if (str_starts_with(strtolower((string)$title), strtolower($prefix))) return is_array($value) ? implode('; ', $value) : trim((string)$value); } return ''; };
$name = $find('Full name'); $phone = $find('Mobile / WhatsApp'); $age = $find('Age');
if ($name === '' || strlen($name) > 160 || !preg_match('/^(?:\+91)?[6-9][0-9]{9}$/', preg_replace('/[\s()\-]/', '', $phone)) || !ctype_digit($age) || (int)$age < 18 || (int)$age > 120 || $find('Declaration and Consent') === '') syncReply(422, ['status'=>'invalid_fields']);
$reference = $find('Payment reference');
if ($reference !== '' && $reference !== 'WAIVER' && (!preg_match('/^[0-9]{12}$/', $reference) || preg_match('/^([0-9])\1{11}$/', $reference))) syncReply(422, ['status'=>'invalid_reference']);
$pdo = getDatabaseConnection();
if (!$pdo) syncReply(503, ['status'=>'unavailable']);
try {
    $pdo->exec('CREATE TABLE IF NOT EXISTS google_form_sync_receipts (response_key CHAR(64) PRIMARY KEY, submission_id VARCHAR(100) NOT NULL, received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    $key = hash('sha256', $data['form_id'].':'.$responseId);
    $id = 'VOL-GF-'.substr($key, 0, 24);
    $pdo->beginTransaction();
    $claim = $pdo->prepare('INSERT IGNORE INTO google_form_sync_receipts (response_key, submission_id) VALUES (?, ?)');
    $claim->execute([$key, $id]);
    if ($claim->rowCount() === 0) { $pdo->commit(); syncReply(200, ['status'=>'ok','duplicate'=>true]); }
    // Optional health information is retained only when its explicit sharing consent was given.
    $permissions = $find('Optional Permissions');
    if (!str_contains($permissions, 'I consent to sharing my blood group')) foreach (array_keys($answers) as $title) { if (str_starts_with($title, 'Blood Group') || str_starts_with($title, 'Any health condition')) unset($answers[$title]); }
    $payload = ['source'=>'google_forms','form_id'=>$data['form_id'],'response_id'=>$responseId,'submitted_at'=>$data['submitted_at'] ?? '', 'answers'=>$answers];
    $stmt = $pdo->prepare("INSERT INTO form_submissions (submission_id, form_type, name, email, phone, amount, frequency, transaction_id, category, interest, message, payment_status, raw_payload) VALUES (?, 'volunteer', ?, '', ?, ?, 'one-time', ?, 'Volunteer registration', ?, ?, 'PENDING', ?)");
    $stmt->execute([$id,$name,$phone,$reference==='WAIVER'?0:99,$reference==='WAIVER'?'':$reference,$find('Interested in Volunteering'),json_encode($answers,JSON_UNESCAPED_UNICODE),json_encode($payload,JSON_UNESCAPED_UNICODE)]);
    $pdo->commit();
    syncReply(200, ['status'=>'ok','submission_id'=>$id]);
} catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); error_log('Google volunteer sync failed; response not acknowledged.'); syncReply(503, ['status'=>'retry']); }
