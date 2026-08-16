<?php
/**
 * Avinya Care Foundation - Responsive HTML Email Dispatch API Handler
 * Generates brand-aligned responsive HTML email templates for website form submissions.
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

// User Headers with MIME HTML
$userHeaders  = "From: Avinya Care Foundation <info@test.avinyacarefoundation.org>\r\n";
$userHeaders .= "Reply-To: info@test.avinyacarefoundation.org\r\n";
$userHeaders .= "MIME-Version: 1.0\r\n";
$userHeaders .= "Content-Type: text/html; charset=UTF-8\r\n";
$userHeaders .= "X-Mailer: PHP/" . phpversion();

// 1. Send User Confirmation HTML Email
$userSent = mail($email, $userSubject, $userHtmlContent, $userHeaders);

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

// Admin Headers with MIME HTML
$adminHeaders  = "From: Avinya Care System <info@test.avinyacarefoundation.org>\r\n";
$adminHeaders .= "Reply-To: {$email}\r\n";
$adminHeaders .= "MIME-Version: 1.0\r\n";
$adminHeaders .= "Content-Type: text/html; charset=UTF-8\r\n";
$adminHeaders .= "X-Mailer: PHP/" . phpversion();

// 2. Send Admin Alert HTML Email
$adminTo = "info@test.avinyacarefoundation.org";
$adminSent = mail($adminTo, $adminSubject, $adminHtmlContent, $adminHeaders);

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
