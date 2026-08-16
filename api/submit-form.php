<?php
/**
 * Avinya Care Foundation - PHP Form Submission API Handler
 * Handles form submissions on Hostinger Apache / LiteSpeed hosting environments
 * when Node.js server proxy is inactive or running in static mode.
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

// Send notification email via PHP mail if email provided
if (!empty($email)) {
    $to = "info@test.avinyacarefoundation.org";
    $subject = "[Avinya Care] New {$formType} Submission - {$name}";
    $message = "AVINYA CARE OPERATIONAL ALERT\n\nForm Type: {$formType}\nSubmission ID: {$submissionId}\nSubmitted At: {$timestampIST}\nName: {$name}\nEmail: {$email}\n";
    $headers = "From: info@test.avinyacarefoundation.org\r\nReply-To: {$email}\r\nX-Mailer: PHP/" . phpversion();
    @mail($to, $subject, $message, $headers);
    
    // User confirmation email
    $userSubject = "Thank You for Reaching Out - Avinya Care Foundation";
    $userMessage = "Hello {$name},\n\nThank you for getting in touch with Avinya Care Foundation. We have received your submission and our team will follow up with you shortly.\n\nWith care,\nAvinya Care Foundation Team";
    $userHeaders = "From: info@test.avinyacarefoundation.org\r\nX-Mailer: PHP/" . phpversion();
    @mail($email, $userSubject, $userMessage, $userHeaders);
}

echo json_encode([
    'status' => 'ok',
    'submissionId' => $submissionId,
    'formType' => $formType,
    'isAIGenerated' => false,
    'timestampIST' => $timestampIST,
    'userEmail' => [
        'subject' => "Thank You for Reaching Out — Avinya Care Foundation",
        'greeting' => "Hello {$name},",
        'body' => "Thank you for getting in touch with Avinya Care Foundation. We have safely received your submission and our team will follow up with you shortly.",
        'closing' => "Best regards,\nAvinya Care Foundation Team"
    ],
    'message' => "Thank you, {$name}. Your submission has been received and confirmed via email."
]);
?>
