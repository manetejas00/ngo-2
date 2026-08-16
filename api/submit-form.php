<?php
/**
 * Avinya Care Foundation - Production PHP Form Submission API Handler
 * Executes real Hostinger email delivery for website form submissions.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: $_POST;

$formType = isset($data['form_type']) ? $data['form_type'] : (isset($data['formType']) ? $data['formType'] : 'contact');
$name = isset($data['name']) ? htmlspecialchars(trim($data['name'])) : 'Valued Supporter';
$email = isset($data['email']) ? filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL) : '';
$submissionId = 'SUB-' . time() . '-' . strtoupper(substr(md5(uniqid()), 0, 5));
$timestampIST = date('d F Y, g:i A \I\S\T');

if (empty($email)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Please provide a valid email address.'
    ]);
    exit(0);
}

// 1. Dispatch Operational Alert to Admin
$adminTo = "info@test.avinyacarefoundation.org";
$adminSubject = "[Avinya Care] New {$formType} Submission - {$name}";
$adminMessage = "AVINYA CARE OPERATIONAL ALERT\n\nForm Type: {$formType}\nSubmission ID: {$submissionId}\nSubmitted At: {$timestampIST}\nName: {$name}\nEmail: {$email}\n";
$adminHeaders = "From: info@test.avinyacarefoundation.org\r\nReply-To: {$email}\r\nX-Mailer: PHP/" . phpversion();
$adminSent = mail($adminTo, $adminSubject, $adminMessage, $adminHeaders);

// 2. Dispatch User Confirmation Email
$userSubject = "Thank You for Reaching Out - Avinya Care Foundation";
$userMessage = "Hello {$name},\n\nThank you for getting in touch with Avinya Care Foundation. We have received your submission regarding \"{$formType}\" and our team will follow up with you shortly.\n\nWith care,\nAvinya Care Foundation Team";
$userHeaders = "From: info@test.avinyacarefoundation.org\r\nReply-To: info@test.avinyacarefoundation.org\r\nX-Mailer: PHP/" . phpversion();
$userSent = mail($email, $userSubject, $userMessage, $userHeaders);

if ($adminSent || $userSent) {
    echo json_encode([
        'status' => 'ok',
        'submissionId' => $submissionId,
        'formType' => $formType,
        'isAIGenerated' => false,
        'timestampIST' => $timestampIST,
        'userEmail' => [
            'subject' => $userSubject,
            'greeting' => "Hello {$name},",
            'body' => "Thank you for getting in touch with Avinya Care Foundation. We have received your submission and sent a confirmation to your email.",
            'closing' => "Best regards,\nAvinya Care Foundation Team"
        ],
        'message' => "Thank you, {$name}. Your submission has been received and confirmed via email."
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to dispatch emails via server mailer. Please try again.'
    ]);
}
?>
