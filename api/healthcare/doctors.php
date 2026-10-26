<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
// Provider qualifications, affiliations and publication permission await confirmation.
echo json_encode(['status' => 'ok', 'published' => false, 'doctors' => [], 'data' => [], 'message' => 'Contact the foundation to confirm available clinicians.']);
