<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function campReply(int $status, array $body): void { http_response_code($status); echo json_encode($body); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); campReply(405, ['status'=>'error','message'=>'Use POST to register.']); }
if (!preg_match('/^application\/json(?:\s*;|$)/i', $_SERVER['CONTENT_TYPE'] ?? '')) campReply(415,['status'=>'error','message'=>'Send registration as JSON.']);
require_once __DIR__.'/rate_limiter.php';
enforcePhpRateLimit(15,60);
$cutoff = strtotime('2026-11-29T16:00:00+05:30');
if (time() >= $cutoff) campReply(410,['status'=>'error','message'=>'Registration is now closed. Call 7447441116 for assistance.']);
$raw=file_get_contents('php://input',false,null,0,16385);
if ($raw===false || strlen($raw)>16384) campReply(413,['status'=>'error','message'=>'Registration is too large.']);
$input=json_decode($raw,true);
if (!is_array($input) || !str_starts_with(ltrim($raw),'{')) campReply(400,['status'=>'error','message'=>'Invalid registration data.']);
$errors=[]; $data=[];
foreach (['name'=>120,'phone'=>20,'location'=>160,'email'=>254,'testsInterested'=>500,'healthConcerns'=>2000] as $key=>$max) {
    $data[$key]=is_string($input[$key]??null)?trim($input[$key]):'';
    if (mb_strlen($data[$key])>$max || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/',$data[$key])) $errors[$key]='Please shorten this field and remove control characters.';
}
foreach (['name','phone','location'] as $key) if ($data[$key]==='') $errors[$key]='This field is required.';
$data['email']=strtolower($data['email']);
if ($data['email']!=='' && !filter_var($data['email'],FILTER_VALIDATE_EMAIL)) $errors['email']='Enter a valid email address or leave it blank.';
$data['phone']=preg_replace('/[\s()-]/','',$data['phone']); $data['phone']=preg_replace('/^\+91/','',$data['phone']);
if (!preg_match('/^[6-9]\d{9}$/',$data['phone'])) $errors['phone']='Enter a valid 10-digit Indian mobile number.';
$age=(string)($input['age']??'');
if (!preg_match('/^\d{1,3}$/',$age) || (int)$age<1 || (int)$age>120) $errors['age']='Enter an age from 1 to 120 years.';
$data['age']=(int)$age;
foreach (['gender'=>['Female','Male','Other','Prefer not to say'],'previousScreening'=>['','Yes','No','Not sure'],'diagnosedCondition'=>['','Yes','No','Prefer not to say'],'familyHistory'=>['','Yes','No','Not sure','Prefer not to say']] as $key=>$options) {
    $data[$key]=is_string($input[$key]??null)?trim($input[$key]):'';
    if (!in_array($data[$key],$options,true)) $errors[$key]='Choose one of the listed options.';
}
if (($input['consent']??false)!==true) $errors['consent']='Please read the privacy notice and consent to register.';
$data['consent']=true; $data['consentVersion']='camp-registration-2026-10-25';
if ($errors) campReply(422,['status'=>'error','message'=>'Please check the highlighted fields.','errors'=>$errors]);
require_once __DIR__.'/db.php'; require_once __DIR__.'/camp-store.php';
try {
    $pdo=getDatabaseConnection();
    if (!$pdo) throw new RuntimeException('Database unavailable');
    initializeCampTable($pdo);
    $id='ACF-'.bin2hex(random_bytes(16)); $createdAt=gmdate('Y-m-d\TH:i:s\Z');
    $emailStatus=$data['email']===''?'SKIPPED':'PENDING';
    if (time()>=$cutoff) campReply(410,['status'=>'error','message'=>'Registration is now closed.']);
    try {
        $stmt=$pdo->prepare('INSERT INTO camp_registrations (id,camp_id,name,phone,answers_json,email_status,created_at) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([$id,'mega-health-2026-11-29',$data['name'],$data['phone'],json_encode($data),$emailStatus,$createdAt]);
    } catch (PDOException $error) {
        if (($error->errorInfo[1]??0)===1062) campReply(409,['status'=>'error','message'=>'A registration already exists for this name and mobile number. Call 7447441116 for help.']);
        throw $error;
    }
    if ($data['email']!=='') {
        $emailStatus='FAILED';
        try {
            require_once __DIR__.'/smtp-mailer.php';
            $html=file_get_contents(__DIR__.'/templates/camp-confirmation.html');
            $html=strtr($html,['__CAMP_NAME__'=>htmlspecialchars($data['name'],ENT_QUOTES,'UTF-8'),'__CAMP_REFERENCE__'=>htmlspecialchars($id,ENT_QUOTES,'UTF-8')]);
            if (sendPHPSMTP($data['email'],'Your Mega Health & Screening Camp Registration — AvinyaCareFoundation',$html)) $emailStatus='SENT';
        } catch (Throwable $error) { /* Keep the saved registration on mail failure. */ }
        try { $stmt=$pdo->prepare('UPDATE camp_registrations SET email_status=? WHERE id=?'); $stmt->execute([$emailStatus,$id]); } catch (Throwable $error) { /* Delivery audit must not invalidate a saved registration. */ }
    }
    campReply(201,['status'=>'ok','registrationId'=>$id,'emailStatus'=>$emailStatus]);
} catch (Throwable $error) { campReply(503,['status'=>'error','message'=>'Registration is temporarily unavailable. Please try again or call 7447441116.']); }
