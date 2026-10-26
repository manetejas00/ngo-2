<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
// No publication consent or independently verified reporting is available.
$isStats = str_contains($_SERVER['REQUEST_URI'] ?? '', '/stats') || ($_GET['action'] ?? '') === 'stats';
echo json_encode($isStats
    ? ['status' => 'ok', 'published' => false, 'stats' => ['total' => null], 'message' => 'Verified contribution reporting is not published.']
    : ['status' => 'ok', 'published' => false, 'count' => 0, 'donations' => []]);
