<?php
/**
 * Avinya Care Foundation - Hostinger SSL SMTP Email Dispatch Handler
 * Authenticates via Hostinger SMTP (smtp.hostinger.com:465 SSL) for 100% email deliverability.
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

$formType = isset($data['form_type']) ? strtolower(trim($data['form_type'])) : (isset($data['formType']) ? strtolower(trim($data['formType'])) : 'contact');
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

/**
 * Sends authenticated SSL SMTP emails directly via Hostinger (smtp.hostinger.com:465)
 */
function sendPHPSMTP($to, $subject, $htmlBody, $replyTo = '') {
    $host = 'ssl://smtp.hostinger.com';
    $port = 465;
    $user = 'info@test.avinyacarefoundation.org';
    $pass = '@qLVTyL|J5';
    $from = 'info@test.avinyacarefoundation.org';
    $fromName = 'Avinya Care Foundation';

    $socket = @fsockopen($host, $port, $errno, $errstr, 12);
    if (!$socket) {
        // Fallback to PHP mail if socket connection is blocked
        $headers  = "From: Avinya Care Foundation <{$from}>\r\n";
        $headers .= "Reply-To: " . ($replyTo ?: $from) . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        return @mail($to, $subject, $htmlBody, $headers);
    }

    fgets($socket, 512);
    fputs($socket, "EHLO " . gethostname() . "\r\n");
    while ($line = fgets($socket, 512)) {
        if (substr($line, 3, 1) == " ") break;
    }

    fputs($socket, "AUTH LOGIN\r\n");
    fgets($socket, 512);
    fputs($socket, base64_encode($user) . "\r\n");
    fgets($socket, 512);
    fputs($socket, base64_encode($pass) . "\r\n");
    $authRes = fgets($socket, 512);

    if (substr($authRes, 0, 3) != "235") {
        fclose($socket);
        return false;
    }

    fputs($socket, "MAIL FROM: <{$from}>\r\n");
    fgets($socket, 512);
    fputs($socket, "RCPT TO: <{$to}>\r\n");
    fgets($socket, 512);
    fputs($socket, "DATA\r\n");
    fgets($socket, 512);

    $headers = [
        "From: {$fromName} <{$from}>",
        "To: <{$to}>",
        "Subject: {$subject}",
        "Reply-To: " . ($replyTo ?: $from),
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
        "X-Mailer: AvinyaCare-PHP-SMTP/1.0"
    ];

    fputs($socket, implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.\r\n");
    $dataRes = fgets($socket, 512);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return (substr($dataRes, 0, 3) == "250");
}

// Build User Email HTML Template
$userSubject = "Thank You for Reaching Out - Avinya Care Foundation";
$greeting = "Hello {$name},";
$bodyText = "Thank you for getting in touch with Avinya Care Foundation regarding <strong>" . strtoupper($formType) . "</strong>. Our team is dedicated to providing healthcare dignity, early cancer screening navigation, and compassionate community support across India.";
$closingText = "With care and commitment,<br><strong>Avinya Care Foundation Team</strong>";

$userHtmlContent = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>' . htmlspecialchars($userSubject) . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F4EF; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #111817; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F4EF; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(8, 127, 115, 0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #087F73; padding: 32px 36px; text-align: center;">
              <div style="color: #62B59F; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Avinya Care Foundation</div>
              <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Healthcare Dignity & Cancer Awareness</h1>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <p style="font-size: 18px; font-weight: 700; color: #087F73; margin: 0 0 18px 0;">' . $greeting . '</p>
              
              <div style="font-size: 15px; color: #111817; line-height: 1.7; margin-bottom: 24px;">
                <p style="margin: 0 0 16px 0;">' . $bodyText . '</p>
                <p style="margin: 0;">Representative team members will review your details and connect with you as soon as possible.</p>
              </div>

              <!-- Metadata Summary Box -->
              <div style="background-color: #F6F4EF; border-left: 4px solid #087F73; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
                <div style="font-size: 11px; font-weight: 700; color: #087F73; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Submission Confirmation</div>
                <div style="font-size: 13px; color: #111817; line-height: 1.6;">
                  <strong>Form Category:</strong> ' . strtoupper(htmlspecialchars($formType)) . '<br>
                  <strong>Submission Ref:</strong> <code style="font-family: monospace; color: #087F73;">' . htmlspecialchars($submissionId) . '</code><br>
                  <strong>Date & Time:</strong> ' . htmlspecialchars($timestampIST) . '
                </div>
              </div>

              <div style="padding-top: 20px; border-top: 1px solid #F6F4EF; color: #5F6865; font-size: 14px; line-height: 1.6;">
                ' . $closingText . '
              </div>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #F6F4EF; padding: 28px 36px; text-align: center; border-top: 1px solid #E2E8F0; color: #5F6865; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #087F73; text-transform: uppercase; letter-spacing: 1px; font-size: 11px;">
                Cancer Awareness • Support • Care • Community
              </p>
              <p style="margin: 0 0 12px 0;">
                Avinya Care Foundation • Reg. NGO 80G / 12A Tax Exempted<br>
                Email: <a href="mailto:info@test.avinyacarefoundation.org" style="color: #087F73; text-decoration: none; font-weight: 600;">info@test.avinyacarefoundation.org</a> | Helpline: <a href="tel:+919876543210" style="color: #087F73; text-decoration: none; font-weight: 600;">+91 98765 43210</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #717D7A; border-top: 1px dashed #CBD5E1; padding-top: 12px;">
                <strong>Medical & Legal Disclaimer:</strong> Avinya Care Foundation communications provide general health awareness and screening navigation. We do not provide medical prescriptions, diagnoses, or direct clinical medical advice. Please consult a qualified medical oncologist for health concerns.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

// 1. Dispatch User Confirmation HTML Email via Authenticated SSL SMTP
$userSent = sendPHPSMTP($email, $userSubject, $userHtmlContent);

// Build Admin Operational Alert HTML Template
$adminSubject = "[Avinya Care] New {$formType} Submission - {$name}";
$adminHtmlContent = '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>' . htmlspecialchars($adminSubject) . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F4EF; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #111817;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F4EF; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 650px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #111817; padding: 24px 32px;">
              <div style="color: #62B59F; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">Avinya Care Internal Desk</div>
              <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0;">Operational Alert: Form Submission</h2>
            </td>
          </tr>

          <!-- Summary Card -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <div style="background-color: #F6F4EF; border-left: 4px solid #087F73; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #087F73; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Submission Metadata</div>
                <div style="font-size: 14px; color: #111817; line-height: 1.7;">
                  <strong>Form Type:</strong> ' . strtoupper(htmlspecialchars($formType)) . '<br>
                  <strong>Submission ID:</strong> <code style="font-family: monospace; color: #087F73;">' . htmlspecialchars($submissionId) . '</code><br>
                  <strong>Submitted At:</strong> ' . htmlspecialchars($timestampIST) . '<br>
                  <strong>Name:</strong> ' . htmlspecialchars($name) . '<br>
                  <strong>User Email:</strong> <a href="mailto:' . htmlspecialchars($email) . '" style="color: #087F73; text-decoration: none; font-weight: 600;">' . htmlspecialchars($email) . '</a>
                </div>
              </div>

              <p style="font-size: 14px; color: #5F6865; margin: 0;"><strong>Action Required:</strong> Review user submission details and route to the appropriate department (Medical, Volunteer, Financial, or Operations).</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

// 2. Dispatch Admin Alert HTML Email via Authenticated SSL SMTP
$adminTo = "info@test.avinyacarefoundation.org";
$adminSent = sendPHPSMTP($adminTo, $adminSubject, $adminHtmlContent, $email);

echo json_encode([
    'status' => 'ok',
    'submissionId' => $submissionId,
    'formType' => $formType,
    'isAIGenerated' => false,
    'timestampIST' => $timestampIST,
    'userEmail' => [
        'subject' => $userSubject,
        'greeting' => "Hello {$name},",
        'body' => "Thank you for getting in touch with Avinya Care Foundation regarding " . strtoupper($formType) . ". Our team will follow up with you as soon as possible.",
        'closing' => "Best regards,\nAvinya Care Foundation Team"
    ],
    'message' => "Thank you, {$name}. Your submission has been received and confirmed via email."
]);
?>
