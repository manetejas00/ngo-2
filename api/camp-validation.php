<?php
declare(strict_types=1);
function validateCampRegistration(array $input): array {
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
return ['data'=>$data,'errors'=>$errors];
}
