<?php
declare(strict_types=1);
// Included only after the main admin endpoint authenticates the session.
header('Cache-Control: no-store');
if (!isset($userRole, $action, $data)) { http_response_code(403); echo json_encode(['status'=>'error','message'=>'Authenticated admin access required.']); return; }
if (($_SERVER['REQUEST_METHOD']??'')!=='POST') { http_response_code(405); header('Allow: POST'); echo json_encode(['status'=>'error','message'=>'Use POST for registration actions.']); return; }
if (!in_array(strtolower((string)$userRole), ['admin','manager','superadmin'], true)) { http_response_code(403); echo json_encode(['status'=>'error','message'=>'Administrator permissions required.']); return; }
try {
    require_once __DIR__.'/camp-store.php';
    if (!$pdo) throw new RuntimeException('Database unavailable');
    initializeCampTable($pdo);
    $id=is_string($data['id']??null)?$data['id']:'';
    $stmt=$pdo->prepare('SELECT * FROM camp_registrations WHERE id=?');$stmt->execute([$id]);$row=$stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {http_response_code(404);echo json_encode(['status'=>'error','message'=>'Registration not found. Refresh the list.']);return;}
    $record=json_decode($row['answers_json'],true)?:[];
    if ($action==='camp_delete') {
        $stmt=$pdo->prepare('DELETE FROM camp_registrations WHERE id=?');$stmt->execute([$id]);
        logActivity('CAMP_REGISTRATION_DELETE','admin',$_SESSION['admin_email']??'admin','Deleted camp registration',['id'=>$id]);
        echo json_encode(['status'=>'ok','message'=>'Registration deleted.']);return;
    }
    if ($action==='camp_update') {
        require_once __DIR__.'/camp-validation.php';
        $input=array_merge($record,is_array($data['registration']??null)?$data['registration']:[]);$input['consent']=$record['consent']??false;
        $validated=validateCampRegistration($input);
        if ($validated['errors']) {http_response_code(422);echo json_encode(['status'=>'error','message'=>'Please check the form fields.','errors'=>$validated['errors']]);return;}
        $updated=$validated['data'];
        try {$stmt=$pdo->prepare('UPDATE camp_registrations SET name=?,phone=?,answers_json=?,email_status=? WHERE id=?');$stmt->execute([$updated['name'],$updated['phone'],json_encode($updated),($updated['email']??'')!==($record['email']??'')?($updated['email']!==''?'PENDING':'SKIPPED'):$row['email_status'],$id]);}
        catch(PDOException $error) {if (($error->errorInfo[1]??0)===1062){http_response_code(409);echo json_encode(['status'=>'error','message'=>'These details conflict with another registration.']);return;}throw $error;}
        logActivity('CAMP_REGISTRATION_EDIT','admin',$_SESSION['admin_email']??'admin','Updated camp registration',['id'=>$id]);
        echo json_encode(['status'=>'ok','message'=>'Registration updated.']);return;
    }
    if (empty($record['email']) || !filter_var($record['email'],FILTER_VALIDATE_EMAIL)) {http_response_code(422);echo json_encode(['status'=>'error','message'=>'Add a valid email address before sending.']);return;}
    $pdo->exec('CREATE TABLE IF NOT EXISTS camp_mail_attempts (registration_id VARCHAR(60) PRIMARY KEY, attempted_at BIGINT NOT NULL)');
    $stmt=$pdo->prepare('INSERT INTO camp_mail_attempts VALUES (?,?) ON DUPLICATE KEY UPDATE attempted_at=IF(attempted_at < ?, VALUES(attempted_at), attempted_at)');$now=time();$stmt->execute([$id,$now,$now-60]);
    if ($stmt->rowCount()===0) {http_response_code(429);echo json_encode(['status'=>'error','message'=>'Please wait one minute before sending again.']);return;}
    require_once __DIR__.'/smtp-mailer.php';
    $html=file_get_contents(__DIR__.'/templates/camp-confirmation.html');$html=strtr($html,['__CAMP_NAME__'=>htmlspecialchars($record['name'],ENT_QUOTES,'UTF-8'),'__CAMP_REFERENCE__'=>htmlspecialchars($id,ENT_QUOTES,'UTF-8')]);
    $sent=sendPHPSMTP($record['email'],'Your Mega Health & Screening Camp Registration — AvinyaCareFoundation',$html);
    $stmt=$pdo->prepare('UPDATE camp_registrations SET email_status=? WHERE id=?');$stmt->execute([$sent?'SENT':'FAILED',$id]);
    logActivity('CAMP_REGISTRATION_EMAIL','admin',$_SESSION['admin_email']??'admin','Requested camp confirmation email',['id'=>$id,'sent'=>$sent]);
    if (!$sent) http_response_code(502);
    echo json_encode(['status'=>$sent?'ok':'error','message'=>$sent?'Confirmation email sent.':'Email delivery failed. Registration is still saved.']);
} catch(Throwable $error) {http_response_code(503);echo json_encode(['status'=>'error','message'=>'Unable to complete the action. Refresh and try again.']);}
