<?php
header('Content-Type: application/json');
header('Cache-Control: no-store');
echo json_encode(['status' => 'ok', 'message' => 'Service reachable. This endpoint is not a security certification.']);
