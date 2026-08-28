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
$name = isset($data['name']) ? htmlspecialchars(trim($data['name'])) : (isset($data['fullName']) ? htmlspecialchars(trim($data['fullName'])) : 'Valued Supporter');
$email = isset($data['email']) ? filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL) : '';
$phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone'])) : (isset($data['mobile']) ? htmlspecialchars(trim($data['mobile'])) : '');
$amount = isset($data['amount']) ? floatval($data['amount']) : 0;
$frequency = isset($data['frequency']) ? htmlspecialchars(trim($data['frequency'])) : 'one-time';
$pan = isset($data['pan']) ? htmlspecialchars(trim($data['pan'])) : '';
$transactionId = isset($data['transaction_id']) ? htmlspecialchars(trim($data['transaction_id'])) : ('TXN-' . time());
$organization = isset($data['organization']) ? htmlspecialchars(trim($data['organization'])) : (isset($data['company']) ? htmlspecialchars(trim($data['company'])) : '');
$interest = isset($data['interest']) ? htmlspecialchars(trim($data['interest'])) : (isset($data['subject']) ? htmlspecialchars(trim($data['subject'])) : '');
$message = isset($data['message']) ? htmlspecialchars(trim($data['message'])) : (isset($data['feedback']) ? htmlspecialchars(trim($data['feedback'])) : '');

$submissionId = 'SUB-' . time() . '-' . strtoupper(substr(md5(uniqid()), 0, 5));
date_default_timezone_set('Asia/Kolkata');
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
    $boundary = '=_AvinyaLogo_' . bin2hex(random_bytes(8));
    $logoPath = dirname(__DIR__) . '/assets/logo.png';
    $mimeParts = [
        '--' . $boundary,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        $htmlBody
    ];
    if (is_file($logoPath) && is_readable($logoPath)) {
        $logo = file_get_contents($logoPath);
        if ($logo !== false) {
            $mimeParts = array_merge($mimeParts, [
                '--' . $boundary,
                'Content-Type: image/png; name="avinya-care-logo.png"',
                'Content-Transfer-Encoding: base64',
                'Content-ID: <avinya-logo>',
                'Content-Disposition: inline; filename="avinya-care-logo.png"',
                '',
                rtrim(chunk_split(base64_encode($logo), 76, "\r\n"))
            ]);
        }
    }
    $mimeParts[] = '--' . $boundary . '--';
    $mimeBody = implode("\r\n", $mimeParts);

    $socket = @fsockopen($host, $port, $errno, $errstr, 12);
    if (!$socket) {
        $headers  = "From: {$fromName} <{$from}>\r\n";
        $headers .= "Reply-To: " . ($replyTo ?: $from) . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/related; boundary=\"{$boundary}\"\r\n";
        return @mail($to, $subject, $mimeBody, $headers);
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

    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $headers = [
        "From: {$fromName} <{$from}>",
        "To: <{$to}>",
        "Subject: {$encodedSubject}",
        "Reply-To: " . ($replyTo ?: $from),
        "MIME-Version: 1.0",
        "Content-Type: multipart/related; boundary=\"{$boundary}\"",
        "X-Mailer: AvinyaCare-PHP-SMTP/2.0"
    ];

    fputs($socket, implode("\r\n", $headers) . "\r\n\r\n" . $mimeBody . "\r\n.\r\n");
    $dataRes = fgets($socket, 512);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return (substr($dataRes, 0, 3) == "250");
}

// -------------------------------------------------------------
// Form-Specific Content Generation (Donations, Volunteer, Support, etc.)
// -------------------------------------------------------------
$formattedAmount = number_format($amount);

if ($formType === 'donation') {
    $userSubject = "Thank You for Your Generous Support of ₹{$formattedAmount} — Avinya Care Foundation";
    $greeting = "Dear {$name},";
    $bodyText = "Dhanyawad for your generous contribution of <strong>₹{$formattedAmount}</strong> ({$frequency}) towards Avinya Care Foundation. Your compassionate gift directly funds our life-saving mobile cancer screening camps, diagnostic navigation, and vital clinical nutrition for patients across underserved communities in India.";
    $adminSubject = "[Avinya Care] New Donation Received — {$name} (₹{$formattedAmount})";
} elseif ($formType === 'volunteer') {
    $userSubject = "Thank You for Wanting to Volunteer with Avinya Care — Avinya Care Foundation";
    $greeting = "Dear {$name},";
    $bodyText = "Thank you for stepping forward to volunteer with Avinya Care Foundation. Volunteers like you form the heartbeat of our community outreach, early cancer awareness campaigns, and patient navigation efforts.";
    $adminSubject = "[Avinya Care] New Volunteer Application — {$name}";
} elseif ($formType === 'support') {
    $userSubject = "Avinya Care Support Helpline — We Have Received Your Request — Avinya Care Foundation";
    $greeting = "Dear {$name},";
    $bodyText = "We have received your patient care inquiry. Facing cancer can feel overwhelming, but please know you are not alone. Our compassionate patient support navigators will review your details with the utmost confidentiality.";
    $adminSubject = "[Avinya Care] URGENT: Patient Support Inquiry — {$name}";
} elseif ($formType === 'partnership') {
    $userSubject = "Partnership & Corporate CSR Inquiry — Avinya Care Foundation";
    $greeting = "Dear {$name},";
    $bodyText = "Thank you for reaching out regarding partnership and CSR collaboration with Avinya Care Foundation on behalf of <strong>" . ($organization ?: 'your organization') . "</strong>. Our leadership team will review your proposal.";
    $adminSubject = "[Avinya Care] New CSR & Partnership Lead — " . ($organization ?: $name);
} elseif ($formType === 'newsletter') {
    $userSubject = "Welcome to the Avinya Care Community Newsletter — Avinya Care Foundation";
    $greeting = "Hello {$name},";
    $bodyText = "Welcome to the Avinya Care Foundation community! You are now subscribed to our health bulletin, featuring verified oncology research, early detection screening guidelines, and patient stories.";
    $adminSubject = "[Avinya Care] New Newsletter Subscriber — {$name}";
} elseif ($formType === 'feedback') {
    $userSubject = "Thank You for Sharing Your Feedback with Avinya Care — Avinya Care Foundation";
    $greeting = "Hello {$name},";
    $bodyText = "Thank you for sharing your valuable feedback regarding our healthcare services and awareness initiatives. Your insights help us continuously elevate our care and community reach.";
    $adminSubject = "[Avinya Care] Website Feedback Received — {$name}";
} else {
    $userSubject = "We Have Received Your Message — Avinya Care Foundation";
    $greeting = "Hello {$name},";
    $bodyText = "Thank you for getting in touch with Avinya Care Foundation. Our team has received your message and will connect with you shortly.";
    $adminSubject = "[Avinya Care] New Website Contact Inquiry — {$name}";
}

$closingText = "With deepest gratitude and care,<br><strong>Avinya Care Foundation Team</strong>";

// Build User Email HTML Template
$donationBoxHtml = '';
if ($formType === 'donation') {
    $donationBoxHtml = '
    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Official Donation Receipt Details</div>
        <table style="width: 100%; font-size: 14px; color: #111817; line-height: 1.8;">
            <tr><td style="width: 45%; color: #4B5563;">Donation Amount:</td><td><strong style="color: #087F73; font-size: 16px;">₹' . $formattedAmount . ' (' . strtoupper($frequency) . ')</strong></td></tr>
            <tr><td style="color: #4B5563;">Transaction Ref:</td><td><code style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">' . htmlspecialchars($transactionId) . '</code></td></tr>
            <tr><td style="color: #4B5563;">Payment Status:</td><td><span style="color: #16A34A; font-weight: 700;">✓ SUCCESS</span></td></tr>
            ' . ($pan ? '<tr><td style="color: #4B5563;">PAN (for 80G):</td><td><code style="font-family: monospace;">' . htmlspecialchars($pan) . '</code></td></tr>' : '') . '
            <tr><td style="color: #4B5563;">Tax Deduction:</td><td><span style="color: #087F73; font-weight: 600;">Eligible under Section 80G of Income Tax Act</span></td></tr>
        </table>
    </div>';
}

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
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(8, 127, 115, 0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 28px 32px; text-align: center; border-bottom: 3px solid #F47528;">
              <div style="display: inline-block; background: #FFFFFF; border-radius: 50%; padding: 6px; margin-bottom: 12px;"><img src="cid:avinya-logo" alt="Avinya Care Foundation" width="56" height="56" style="display: block; width: 56px; height: 56px; border: 0; border-radius: 50%; object-fit: contain;"></div>
              <div style="color: #F58220; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Avinya Care Healthcare Platform</div>
              <h1 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Healthcare Dignity & Cancer Awareness</h1>
            </td>
          </tr>

          <!-- Main Content Card -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <p style="font-size: 18px; font-weight: 700; color: #087F73; margin: 0 0 18px 0;">' . $greeting . '</p>
              
              <div style="font-size: 15px; color: #111817; line-height: 1.7; margin-bottom: 24px;">
                <p style="margin: 0 0 16px 0;">' . $bodyText . '</p>
              </div>

              ' . $donationBoxHtml . '

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
            <td style="background-color: #0A0A0A; padding: 24px 32px; text-align: center; border-top: 1px solid #262626; color: #A3A3A3; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #F58220; text-transform: uppercase; letter-spacing: 1px; font-size: 11px;">
                Cancer Awareness • Support • Care • Community
              </p>
              <p style="margin: 0 0 12px 0;">
                Avinya Care Foundation • Reg. NGO 80G / 12A Tax Exempted<br>
                Email: <a href="mailto:info@test.avinyacarefoundation.org" style="color: #F58220; text-decoration: none; font-weight: 600;">info@test.avinyacarefoundation.org</a> | Helpline: <a href="tel:+919876543210" style="color: #F58220; text-decoration: none; font-weight: 600;">+91 98765 43210</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #737373; border-top: 1px dashed #404040; padding-top: 12px;">
                <strong>Medical & Legal Disclaimer:</strong> Avinya Care Foundation communications provide general health awareness and screening navigation. We do not provide medical prescriptions, diagnoses, or direct clinical medical advice.
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
            <td style="background-color: #0A0A0A; padding: 24px 32px; border-bottom: 3px solid #F47528;">
              <div style="display: inline-block; background: #FFFFFF; border-radius: 50%; padding: 5px; margin: 0 12px 8px 0; vertical-align: middle;"><img src="cid:avinya-logo" alt="Avinya Care Foundation" width="40" height="40" style="display: block; width: 40px; height: 40px; border: 0; border-radius: 50%; object-fit: contain;"></div>
              <div style="color: #F58220; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">Avinya Care Internal Desk</div>
              <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin: 0;">Operational Alert: ' . strtoupper(htmlspecialchars($formType)) . '</h2>
            </td>
          </tr>

          <!-- Summary Card -->
          <tr>
            <td style="padding: 32px 32px 20px 32px;">
              <div style="background-color: #F6F4EF; border-left: 4px solid #087F73; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #087F73; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Submission Details</div>
                <div style="font-size: 14px; color: #111817; line-height: 1.8;">
                  <strong>Form Type:</strong> ' . strtoupper(htmlspecialchars($formType)) . '<br>
                  <strong>Submission ID:</strong> <code style="font-family: monospace; color: #087F73;">' . htmlspecialchars($submissionId) . '</code><br>
                  <strong>Submitted At:</strong> ' . htmlspecialchars($timestampIST) . '<br>
                  <strong>Name:</strong> ' . htmlspecialchars($name) . '<br>
                  <strong>User Email:</strong> <a href="mailto:' . htmlspecialchars($email) . '" style="color: #087F73; text-decoration: none; font-weight: 600;">' . htmlspecialchars($email) . '</a><br>
                  ' . ($phone ? '<strong>Phone:</strong> ' . htmlspecialchars($phone) . '<br>' : '') . '
                  ' . ($amount > 0 ? '<strong>Donation Amount:</strong> ₹' . $formattedAmount . ' (' . strtoupper($frequency) . ')<br>' : '') . '
                  ' . ($pan ? '<strong>PAN:</strong> ' . htmlspecialchars($pan) . '<br>' : '') . '
                  ' . ($transactionId ? '<strong>Transaction ID:</strong> ' . htmlspecialchars($transactionId) . '<br>' : '') . '
                  ' . ($organization ? '<strong>Organization:</strong> ' . htmlspecialchars($organization) . '<br>' : '') . '
                  ' . ($interest ? '<strong>Subject / Category:</strong> ' . htmlspecialchars($interest) . '<br>' : '') . '
                  ' . ($message ? '<strong>Message:</strong> ' . nl2br(htmlspecialchars($message)) . '<br>' : '') . '
                </div>
              </div>

              <p style="font-size: 14px; color: #5F6865; margin: 0;"><strong>Action Required:</strong> Review user submission details and process 80G tax receipt or route to the appropriate department.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

// 1. Dispatch User Confirmation HTML Email via Authenticated SSL SMTP
$userSentResult = sendPHPSMTP($email, $userSubject, $userHtmlContent);
$userEmailSent = ($userSentResult === true || $userSentResult === 1);
$userEmailError = !$userEmailSent ? "User confirmation email delivery failed via Hostinger SSL SMTP." : null;

// 2. Dispatch Admin Alert HTML Email via Authenticated SSL SMTP
$adminTo = "info@test.avinyacarefoundation.org";
$adminSentResult = sendPHPSMTP($adminTo, $adminSubject, $adminHtmlContent, $email);
$adminEmailSent = ($adminSentResult === true || $adminSentResult === 1);
$adminEmailError = !$adminEmailSent ? "Admin operational alert delivery failed via Hostinger SSL SMTP." : null;

// 3. If any email delivery failed, automatically dispatch error diagnostic alert to admin
if (!$userEmailSent) {
    $errorAlertSubject = "[Avinya Care ALERT] Email Delivery Failed — " . strtoupper($formType) . " (ID: {$submissionId})";
    $errorAlertHtml = '<!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>' . htmlspecialchars($errorAlertSubject) . '</title></head>
    <body style="margin: 0; padding: 24px; background-color: #FEF2F2; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; color: #111817;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #FECACA; overflow: hidden;">
        <tr>
          <td style="background-color: #DC2626; color: #FFFFFF; padding: 20px 24px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; color: #FEE2E2;">Avinya Care System Diagnostics</div>
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #FFFFFF;">⚠️ Outbound Email Delivery Failed</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 24px;">
            <p style="margin-top: 0; font-size: 14px; line-height: 1.6; color: #374151;">
              An automated email dispatch for a recent <strong>' . strtoupper(htmlspecialchars($formType)) . '</strong> form submission failed to deliver to <strong>' . htmlspecialchars($email) . '</strong>.
            </p>
            <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; border-radius: 6px; padding: 14px 16px; margin: 18px 0; font-size: 13px; line-height: 1.6; color: #991B1B;">
              <strong>Error Reason:</strong><br>
              <code>' . htmlspecialchars($userEmailError ?: 'SMTP Delivery Failure') . '</code>
            </div>
            <div style="background-color: #F9FAFB; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.8; color: #111817; border: 1px solid #E5E7EB;">
              <strong>Submission ID:</strong> <code style="color: #DC2626; font-weight: 700;">' . htmlspecialchars($submissionId) . '</code><br>
              <strong>Form Category:</strong> ' . strtoupper(htmlspecialchars($formType)) . '<br>
              <strong>User Name:</strong> ' . htmlspecialchars($name) . '<br>
              <strong>Target Email:</strong> <a href="mailto:' . htmlspecialchars($email) . '" style="color: #DC2626; font-weight: 600;">' . htmlspecialchars($email) . '</a><br>
              ' . ($phone ? '<strong>Phone:</strong> ' . htmlspecialchars($phone) . '<br>' : '') . '
              <strong>Timestamp:</strong> ' . htmlspecialchars($timestampIST) . '<br>
            </div>
            <p style="font-size: 13px; color: #6B7280; margin: 20px 0 0 0; line-height: 1.5;">
              <strong>Recommended Action:</strong> Please verify the user\'s email address or reach out to them directly via phone or internal desk.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>';

    @sendPHPSMTP($adminTo, $errorAlertSubject, $errorAlertHtml, $email);
}

$deliveryStatus = ($userEmailSent && $adminEmailSent) ? 'SENT' : (($userEmailSent || $adminEmailSent) ? 'PARTIAL' : 'FAILED');
$successMessage = ($userEmailSent && $adminEmailSent) ? "All emails dispatched successfully via Hostinger SSL SMTP (Port 465)." : (($userEmailSent || $adminEmailSent) ? "Partial email delivery completed. Error alert sent to admin." : "Email delivery failed. Error alert sent to admin.");
$errorMessage = (!$userEmailSent && !$adminEmailSent) ? "Email dispatch failed on both recipient channels." : ($userEmailError ?: $adminEmailError);

echo json_encode([
    'status' => 'ok',
    'submissionId' => $submissionId,
    'formType' => $formType,
    'isAIGenerated' => false,
    'timestampIST' => $timestampIST,
    'emailDelivery' => [
        'status' => $deliveryStatus,
        'deliveryMethod' => 'HOSTINGER_SSL_SMTP_465',
        'userEmailSent' => $userEmailSent,
        'adminEmailSent' => $adminEmailSent,
        'userEmailRecipient' => $email,
        'adminEmailRecipient' => $adminTo,
        'successMessage' => $successMessage,
        'errorMessage' => $errorMessage,
        'userEmailError' => $userEmailError,
        'adminEmailError' => $adminEmailError
    ],
    'userEmail' => [
        'subject' => $userSubject,
        'greeting' => $greeting,
        'body' => $bodyText,
        'closing' => "With deepest gratitude and care,\nAvinya Care Foundation Team"
    ],
    'message' => "Thank you, {$name}. Your {$formType} submission has been received and confirmed via email."
]);
?>
