<?php
/** Public detail route. Resolves catalog IDs only; never serves internal test files. */
declare(strict_types=1);
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache');
$id = (string) ($_GET['test_id'] ?? '');
if (!preg_match('/^test-[a-z0-9-]+$/D', $id)) { http_response_code(404); exit('Test not found.'); }
require_once __DIR__ . '/db.php';
$test = null;
$catalogAvailable = false;
try {
    $pdo = getDatabaseConnection();
    if ($pdo !== null) {
        $query = $pdo->prepare('SELECT * FROM diagnostic_tests WHERE test_id = :id AND is_active = 1 LIMIT 1');
        $query->execute([':id' => $id]);
        $row = $query->fetch();
        $catalogAvailable = true;
        if ($row) $test = [
            'id' => $id, 'name' => $row['name'], 'description' => $row['description'], 'category' => $row['category'] ?? '',
            'price' => $row['price'], 'testsIncluded' => json_decode($row['tests_included'] ?? '[]', true) ?: [],
            'preparation' => $row['preparation'], 'reportTurnaround' => $row['report_turnaround']
        ];
    }
} catch (Throwable $e) { error_log('Diagnostic detail catalog unavailable.'); }
if (!$catalogAvailable) {
    http_response_code(503);
    header('Retry-After: 60');
    exit('The diagnostic catalog is temporarily unavailable. Please try again shortly or call 744 744 1116.');
}
if (!$test) { http_response_code(404); exit('Test not found. Please return to the diagnostic catalog.'); }
$overrides = json_decode(file_get_contents(dirname(__DIR__) . '/data/diagnostic-copy-overrides.json'), true) ?: [];
$test = array_merge($test, $overrides[$id] ?? []);
function detailEscape($value): string { return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
$e = 'detailEscape';
$tumorMarker = (bool) preg_match('/tumor|cancer/i', ($test['category'] ?? '') . ' ' . $id);
?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= $e($test['name']) ?> | Avinya Care Foundation</title>
<meta name="description" content="<?= $e($test['description']) ?>">
<link rel="canonical" href="https://www.avinyacarefoundation.org/test/<?= $e($id) ?>">
<link rel="stylesheet" href="/css/styles.css?v=4.3.4"><link rel="stylesheet" href="/css/radial-menu.css?v=4.3.0"><link rel="stylesheet" href="/css/accessibility.css?v=4.3.0"><link rel="stylesheet" href="/css/information.css?v=4.3.1"><script defer src="/assets/vendor/gsap.min.js?v=3.15.0"></script><script defer src="/js/public-pages.js?v=4.3.0"></script><script defer src="/js/components/navbar-gsap.js?v=4.3.2"></script><script defer src="/js/components/radial-menu.js?v=4.3.0"></script><script defer src="/js/components/layout-injector.js?v=4.3.4"></script></head><body class="information-page">
<a class="skip" href="#content">Skip to content</a><?php include __DIR__ . '/../components/navbar.html'; ?>
<main id="content"><h1><?= $e($test['name']) ?></h1><p class="lead"><?= $e($test['description']) ?></p>
<section><h2>Listed package</h2><ul><?php foreach ($test['testsIncluded'] as $item): ?><li><?= $e($item) ?></li><?php endforeach ?></ul>
<p>Listed package price: ₹<?= $e($test['price']) ?>. Confirm final price, collection charges and availability with the team.</p></section>
<section><h2>Before your test</h2><p>Laboratory preparation information: <?= $e(rtrim($test['preparation'], '. ')) ?>. Confirm with your laboratory or clinician; do not stop medicines without advice.</p>
<p>Listed report turnaround: <?= $e($test['reportTurnaround']) ?>. Confirm when timing starts and exceptions.</p>
<p>Tests may give false positive or false negative results and need medical interpretation. A normal result does not rule out every condition. Discuss appropriate testing with your clinician.</p>
<?php if ($tumorMarker): ?><p>Tumor marker tests are not reliable general population cancer screens. Background information: <a href="https://www.cancer.gov/about-cancer/diagnosis-staging/diagnosis/tumor-markers-fact-sheet">National Cancer Institute: tumor markers</a>. Information updated 24 October 2026.</p><?php endif ?></section>
<p><a href="/doctors?test=<?= $e(rawurlencode($id)) ?>">Request this test →</a> · <a href="/assistance">Ask for help</a></p></main>
<?php include __DIR__ . '/../components/footer.html'; ?></body></html>
