<?php
/** Public, non-sensitive GA4 bootstrap configuration. */
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: public, max-age=3600');
require_once __DIR__ . '/db.php';

$measurementId = getDbEnv('GA4_MEASUREMENT_ID');
if (!preg_match('/^G-[A-Z0-9]+$/i', $measurementId)) $measurementId = '';
echo json_encode(['measurementId' => $measurementId]);
