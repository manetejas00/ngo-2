import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDiagnosticRequest } from '../services/healthcare/diagnosticValidation.mjs';
import { diagnosticDetailArticle } from '../services/healthcare/diagnosticDetail.mjs';
import { execFileSync, spawnSync } from 'node:child_process';

const valid = { date: '2026-10-25', timeSlot: '08:30 AM - 09:30 AM', collectionMethod: 'centre_visit', patientGender: 'Female', patientAge: '38', patientEmail: 'patient@example.org', patientPhone: '9876543210' };
test('diagnostic request rejects past/impossible dates and invalid slots', () => {
  assert.doesNotThrow(() => validateDiagnosticRequest(valid, '2026-10-24'));
  for (const change of [{date:'2026-10-23'}, {date:'2026-02-30'}, {timeSlot:'anytime'}, {patientGender:''}, {patientAge:'1.5'}, {patientPhone:'123'}]) {
    assert.throws(() => validateDiagnosticRequest({...valid,...change}, '2026-10-24'));
  }
});
test('home collection requires address and PIN while centre visits do not', () => {
  assert.throws(() => validateDiagnosticRequest({...valid,collectionMethod:'home_collection'}, '2026-10-24'), /address/);
  assert.doesNotThrow(() => validateDiagnosticRequest({...valid,collectionMethod:'home_collection',homeAddress:'Example Road',pincode:'401305'}, '2026-10-24'));
});
test('crawlable diagnostic content escapes stored text and keeps test selection', () => {
  const content = diagnosticDetailArticle({id:'test-cancer-psa-prostate',name:'<img src=x onerror=alert(1)>',testsIncluded:['A & B'],description:'"Cancer"',price:100});
  assert.ok(!content.includes('<img'));
  assert.ok(content.includes('&lt;img'));
  assert.ok(content.includes('/doctors?test=test-cancer-psa-prostate'));
  assert.ok(content.includes('A &amp; B'));
});

test('tumor marker guidance is limited to relevant tests', () => {
  const kidney = diagnosticDetailArticle({id:'test-kidney-creatinine',name:'Creatinine'});
  assert.ok(!kidney.includes('National Cancer Institute'));
  assert.ok(!kidney.includes('Tumor marker tests'));
  assert.ok(kidney.includes('need clinical interpretation'));
  const marker = diagnosticDetailArticle({id:'test-cancer-psa-prostate',name:'PSA'});
  assert.ok(marker.includes('National Cancer Institute'));
  assert.ok(marker.includes('not reliable general population cancer screens'));
});

test('PHP detail routes distinguish an unavailable catalog from a missing test', {skip: Boolean(spawnSync('php', ['-v']).error)}, () => {
  const detailPath = new URL('../api/test-detail.php', import.meta.url).pathname;
  const run = stub => execFileSync('php', ['-r', `
    $_GET['test_id']='test-kidney-creatinine';
    register_shutdown_function(function() { echo "\\nSTATUS:" . http_response_code(); });
    $source=file_get_contents($argv[1]);
    $source=str_replace("require_once __DIR__ . '/db.php';", $argv[2], $source);
    eval(substr($source, 5));
  `, detailPath, stub], {encoding:'utf8',stdio:['ignore','pipe','pipe']});
  assert.match(run('function getDatabaseConnection() { return null; }'), /temporarily unavailable[\s\S]*STATUS:503/);
  assert.match(run('function getDatabaseConnection() { throw new Exception("offline"); }'), /STATUS:503/);
  assert.match(run('function getDatabaseConnection() { return new class { function prepare($sql) { return new class { function execute($params) {} function fetch() { return false; } }; } }; }'), /Test not found[\s\S]*STATUS:404/);
});

test('PHP diagnostic validation follows the same date, collection and patient boundaries', {skip: Boolean(spawnSync('php', ['-v']).error)}, () => {
  const cases = [valid, {...valid,date:'2026-02-30'}, {...valid,date:'2026-10-23'}, {...valid,patientGender:''}, {...valid,collectionMethod:'home_collection'}, {...valid,collectionMethod:'home_collection',homeAddress:'Example Road',pincode:'401305'}];
  const validationPath = new URL('../api/diagnostic-validation.php', import.meta.url).pathname;
  const actual = execFileSync('php', ['-r', 'require $argv[1]; $results=[]; foreach(json_decode($argv[2],true) as $data) { try { validateDiagnosticRequest($data,"2026-10-24"); $results[]=true; } catch (InvalidArgumentException $e) { $results[]=false; } } echo json_encode($results);', validationPath, JSON.stringify(cases)], {encoding:'utf8'});
  assert.deepEqual(JSON.parse(actual), [true,false,false,false,false,true]);
});
