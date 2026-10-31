<?php
declare(strict_types=1);
header('Content-Type: application/json');
header('Cache-Control: no-store');
function syncReply(int $code, array $body): void { http_response_code($code); echo json_encode($body); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') syncReply(405,['status'=>'error']);
require_once __DIR__.'/db.php';
$privateConfig=dirname(__DIR__,2).'/.avinya-google-form.php';
$syncConfig=is_file($privateConfig)?require $privateConfig:[];
$secret=$syncConfig['secret']??getDbEnv('GOOGLE_FORM_SYNC_SECRET','');
$token=preg_replace('/^Bearer /','',$_SERVER['HTTP_AUTHORIZATION']??'');
if (strlen($secret)<32 || !hash_equals($secret,$token)) syncReply(401,['status'=>'error','message'=>'Invalid sync credentials.']);
$raw=file_get_contents('php://input',false,null,0,16385);
if ($raw===false || strlen($raw)>16384) syncReply(413,['status'=>'error']);
$input=json_decode($raw,true);
if (!is_array($input)) syncReply(400,['status'=>'error']);
$formId=$syncConfig['formId']??getDbEnv('GOOGLE_PREREGISTRATION_FORM_ID','');
if (!$formId || ($input['formId']??'')!==$formId) syncReply(403,['status'=>'error','message'=>'Form is not configured.']);
if (!preg_match('/^[A-Za-z0-9_-]{1,200}$/',$input['responseId']??'')) syncReply(422,['status'=>'error']);
$checkups=$input['checkups']??[];
if (!is_array($checkups) || array_diff($checkups,['General health','Eye','Dental','ENT','Cancer screening','Not sure'])) syncReply(422,['status'=>'error']);
require_once __DIR__.'/camp-validation.php';
$validated=validateCampRegistration(array_merge($input,['location'=>$input['area_location']??'', 'healthConcerns'=>$input['health_concerns']??'', 'previousScreening'=>$input['prior_screening']??'', 'diagnosedCondition'=>$input['prior_cancer_diagnosis']??'', 'familyHistory'=>$input['family_cancer_history']??'']));
if ($validated['errors']) syncReply(422,['status'=>'error','errors'=>$validated['errors']]);
$d=$validated['data'];
$id='GFORM-'.hash('sha256',$formId.':'.$input['responseId']);
$record=['source'=>'google_forms','google_form_id'=>$formId,'google_response_id'=>$input['responseId'],'full_name'=>$d['name'],'age'=>$d['age'],'gender'=>$d['gender'],'area_location'=>$d['location'],'checkups'=>$checkups,'health_concerns'=>$d['healthConcerns'],'prior_screening'=>$d['previousScreening'],'prior_cancer_diagnosis'=>$d['diagnosedCondition'],'family_cancer_history'=>$d['familyHistory'],'consent'=>true,'consentVersion'=>$d['consentVersion'],'status'=>'PENDING_REVIEW','review_status'=>'PRIVATE_UNREVIEWED'];
try {
    $pdo=getDatabaseConnection();
    if (!$pdo) throw new RuntimeException('Database unavailable');
    try {
        $stmt=$pdo->prepare("INSERT INTO form_submissions (submission_id,form_type,name,email,phone,delivery_status,raw_payload) VALUES (?,'preregistration',?,?,?,?,?)");
        $stmt->execute([$id,$d['name'],$d['email'],$d['phone'],$d['email']?'PENDING':'SKIPPED',json_encode($record)]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1]??0)===1062) syncReply(200,['status'=>'ok','submissionId'=>$id,'duplicate'=>true]);
        throw $e;
    }
    $status=$d['email']?'FAILED':'SKIPPED';
    if ($d['email']) try {
        require_once __DIR__.'/smtp-mailer.php';
        $html=strtr(file_get_contents(__DIR__.'/templates/camp-confirmation.html'),['__CAMP_NAME__'=>htmlspecialchars($d['name'],ENT_QUOTES,'UTF-8'),'__CAMP_REFERENCE__'=>htmlspecialchars($id,ENT_QUOTES,'UTF-8')]);
        if (sendPHPSMTP($d['email'],'Your Mega Health Camp Registration — AvinyaCareFoundation',$html)) $status='SENT';
    } catch (Throwable $e) {}
    $pdo->prepare('UPDATE form_submissions SET delivery_status=?,user_email_sent=? WHERE submission_id=?')->execute([$status,$status==='SENT'?1:0,$id]);
    syncReply(200,['status'=>'ok','submissionId'=>$id,'duplicate'=>false]);
} catch (Throwable $e) { syncReply(503,['status'=>'error','message'=>'Sync unavailable. Retry later.']); }
