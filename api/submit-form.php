<?php
/**
 * AvinyaCareFoundation - Hostinger SSL SMTP Email Dispatch Handler
 * Sends through the configured SMTP provider; acceptance does not guarantee inbox placement.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/rate_limiter.php';
enforcePhpRateLimit(15, 60);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/smtp-mailer.php';
require_once __DIR__ . '/activity-logger.php';

$isStaging = str_contains($_SERVER['HTTP_HOST'] ?? '', 'test.avinyacarefoundation.org');
$defaultAdmin = $isStaging ? 'info@test.avinyacarefoundation.org' : 'info@avinyacarefoundation.org';

$brandName = 'AvinyaCareFoundation';
$brandEmail = getDbEnv('ADMIN_EMAIL', $defaultAdmin);
$brandPhone = '+91 74474 41116';
$isDirectFormSubmission = (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'submit-form.php' || basename($_SERVER['SCRIPT_NAME'] ?? '') === 'submit-form.php');
if (!$isDirectFormSubmission) {
    return;
}

$rawInput = file_get_contents('php://input');
$maxPayloadBytes = 64 * 1024;
if ($rawInput === false || strlen($rawInput) > $maxPayloadBytes) {
    http_response_code(413); echo json_encode(['status' => 'error', 'message' => 'Submission is too large.']); exit(0);
}
$data = json_decode($rawInput, true) ?: $_POST;

$formType = isset($data['form_type']) ? strtolower(trim($data['form_type'])) : (isset($data['formType']) ? strtolower(trim($data['formType'])) : 'contact');
$name = isset($data['name']) ? htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8') : (isset($data['fullName']) ? htmlspecialchars(trim($data['fullName']), ENT_QUOTES, 'UTF-8') : '');
$email = isset($data['email']) ? strtolower(trim((string)$data['email'])) : '';
$phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone'])) : (isset($data['mobile']) ? htmlspecialchars(trim($data['mobile'])) : '');
$amount = isset($data['amount']) ? (float)$data['amount'] : 0;
$frequency = isset($data['frequency']) ? htmlspecialchars(trim($data['frequency'])) : 'one-time';
$pan = isset($data['pan']) ? htmlspecialchars(trim($data['pan'])) : '';
$transactionId = isset($data['transaction_id']) ? htmlspecialchars(trim($data['transaction_id'])) : '';
$organization = isset($data['organization']) ? htmlspecialchars(trim($data['organization'])) : (isset($data['company']) ? htmlspecialchars(trim($data['company'])) : '');
$interest = isset($data['interest']) ? htmlspecialchars(trim($data['interest'])) : (isset($data['subject']) ? htmlspecialchars(trim($data['subject'])) : '');
$message = isset($data['message']) ? htmlspecialchars(trim($data['message'])) : (isset($data['feedback']) ? htmlspecialchars(trim($data['feedback'])) : '');

$submissionId = 'SUB-' . time() . '-' . strtoupper(substr(md5(uniqid()), 0, 5));
date_default_timezone_set('Asia/Kolkata');
$timestampIST = date('d F Y, g:i A \I\S\T');

$allowedFormTypes = ['donation', 'volunteer', 'support', 'contact', 'partnership', 'newsletter', 'feedback', 'guide', 'coming_soon_feedback'];
$errors = [];
if (!in_array($formType, $allowedFormTypes, true)) $errors['form_type'] = ['Unsupported form type.'];
if ((!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) && !($formType === 'support' && $email === '')) $errors['email'] = ['Please provide a valid email address.'];
if (in_array($formType, ['donation', 'volunteer', 'support', 'contact', 'partnership', 'coming_soon_feedback'], true) && $name === '') $errors['name'] = ['Please enter your name.'];
$normalizedPhone = preg_replace('/[\s()\-]/', '', $phone);
if (in_array($formType, ['donation', 'volunteer', 'support', 'coming_soon_feedback'], true) && !preg_match('/^(?:\+91)?[6-9]\d{9}$/', $normalizedPhone)) $errors['phone'] = ['Enter a valid Indian mobile number.'];
if ($formType === 'partnership' && $organization === '') $errors['organization'] = ['Organization name is required.'];
if (in_array($formType, ['feedback', 'contact', 'support', 'coming_soon_feedback'], true) && $message === '') $errors['message'] = ['Please enter a message.'];
if ($errors) { http_response_code(422); echo json_encode(['status' => 'error', 'message' => reset($errors)[0], 'errors' => $errors]); exit(0); }

if ($formType === 'donation') {
    $amountText = trim((string)($data['amount'] ?? ''));
    if (!preg_match('/^\d+(?:\.\d{1,2})?$/', $amountText) || !is_finite($amount) || $amount < 100 || $amount > 10000000) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'Donation amount must be between ₹100 and ₹1,00,00,000.']);
        exit(0);
    }
    $claim = (string)($data['payment_claim'] ?? 'interest');
    $ref = trim((string)($data['transaction_id'] ?? ''));
    if (!in_array($claim, ['interest', 'paid'], true) || (($claim === 'paid' || $ref !== '') && (!preg_match('/^[0-9]{12}$/', $ref) || preg_match('/^([0-9])\1{11}$/', $ref)))) {
        http_response_code(422);
        echo json_encode(['status' => 'error', 'message' => 'Enter a valid 12-digit UPI reference from your bank transaction.', 'errors' => ['transaction_id' => ['Enter a valid 12-digit UPI reference.']]]);
        exit(0);
    }
    // Payment success is set exclusively by an authenticated gateway webhook/verification route.
    $data['payment_status'] = 'PENDING';
}

/**
 * Sends authenticated SSL SMTP emails directly via Hostinger (smtp.hostinger.com:465)
 */


// -------------------------------------------------------------
// Form-Specific Content Generation (Donations, Volunteer, Support, etc.)
// -------------------------------------------------------------
$formattedAmount = number_format($amount);
$paymentStatus = strtoupper((string)($data['payment_status'] ?? 'PENDING'));
$isConfirmedPayment = in_array($paymentStatus, ['SUCCESS', 'CONFIRMED', 'PAID'], true);

if ($formType === 'donation') {
    $userSubject = $isConfirmedPayment ? "Thank You for Your Generous Support of ₹{$formattedAmount} — AvinyaCareFoundation" : "Contribution Interest Received — AvinyaCareFoundation";
    $greeting = "Dear {$name},";
    $bodyText = $isConfirmedPayment ? "Dhanyawad for your generous contribution of <strong>₹{$formattedAmount}</strong> ({$frequency}) towards AvinyaCareFoundation. Your compassionate gift directly funds our life-saving mobile cancer screening camps, diagnostic navigation, and vital clinical nutrition for patients across underserved communities in India." : "We have recorded your donation pledge of <strong>₹{$formattedAmount}</strong>. It will not be counted or receipted until the payment provider verifies the transaction.";
    $adminSubject = "Website contribution enquiry — {$submissionId}";
} elseif ($formType === 'volunteer') {
    $userSubject = "Thank You for Wanting to Volunteer with AvinyaCareFoundation — AvinyaCareFoundation";
    $greeting = "Dear {$name},";
    $bodyText = "Thank you for stepping forward to volunteer with AvinyaCareFoundation. Volunteers like you form the heartbeat of our community outreach, early cancer awareness campaigns, and patient navigation efforts.";
    $adminSubject = "[AvinyaCareFoundation] New Volunteer Application — {$name}";
} elseif ($formType === 'support') {
    $userSubject = "AvinyaCareFoundation Support Helpline — We Have Received Your Request — AvinyaCareFoundation";
    $greeting = "Dear {$name},";
    $bodyText = "We have received your patient care inquiry. Facing cancer can feel overwhelming, but please know you are not alone. Our compassionate patient support navigators will review your details with the utmost confidentiality.";
    $adminSubject = "[AvinyaCareFoundation] URGENT: Patient Support Inquiry — {$name}";
} elseif ($formType === 'partnership') {
    $userSubject = "Partnership & Corporate CSR Inquiry — AvinyaCareFoundation";
    $greeting = "Dear {$name},";
    $bodyText = "Thank you for reaching out regarding partnership and CSR collaboration with AvinyaCareFoundation on behalf of <strong>" . ($organization ?: 'your organization') . "</strong>. Our leadership team will review your proposal.";
    $adminSubject = "[AvinyaCareFoundation] New CSR & Partnership Lead — " . ($organization ?: $name);
} elseif ($formType === 'newsletter') {
    $userSubject = "Welcome to the AvinyaCareFoundation Community Newsletter — AvinyaCareFoundation";
    $greeting = "Hello {$name},";
    $bodyText = "Welcome to the AvinyaCareFoundation community! You are now subscribed to our health bulletin, featuring verified oncology research, early detection screening guidelines, and patient stories.";
    $adminSubject = "[AvinyaCareFoundation] New Newsletter Subscriber — {$name}";
} elseif ($formType === 'feedback') {
    $userSubject = "Thank You for Sharing Your Feedback with AvinyaCareFoundation — AvinyaCareFoundation";
    $greeting = "Hello {$name},";
    $bodyText = "Thank you for sharing your valuable feedback regarding our healthcare services and awareness initiatives. Your insights help us continuously elevate our care and community reach.";
    $adminSubject = "[AvinyaCareFoundation] Website Feedback Received — {$name}";
} elseif ($formType === 'coming_soon_feedback') {
    $userSubject = "Thank You for Your Interest in AvinyaCareFoundation — AvinyaCareFoundation";
    $greeting = "Hello {$name},";
    $bodyText = "Thank you for reaching out! We are currently working hard behind the scenes to launch our new healthcare platform. We have securely recorded your contact details and will notify you the moment our services go live.";
    $adminSubject = "[AvinyaCareFoundation] Coming Soon Subscription/Feedback — {$name}";
} else {
    $userSubject = "We Have Received Your Message — AvinyaCareFoundation";
    $greeting = "Hello {$name},";
    $bodyText = "Thank you for getting in touch with AvinyaCareFoundation. Our team has received your message and will connect with you shortly.";
    $adminSubject = "[AvinyaCareFoundation] New Website Contact Inquiry — {$name}";
}

$closingText = "With deepest gratitude and care,<br><strong>AvinyaCareFoundation Team</strong>";

// Build User Email HTML Template
$donationBoxHtml = '';
if ($formType === 'donation' && $isConfirmedPayment) {
    $donationBoxHtml = '
    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Official Donation Receipt Details</div>
        <table style="width: 100%; font-size: 14px; color: #111817; line-height: 1.8;">
            <tr><td style="width: 45%; color: #4B5563;">Donation Amount:</td><td><strong style="color: #087F73; font-size: 16px;">₹' . $formattedAmount . ' (' . strtoupper($frequency) . ')</strong></td></tr>
            <tr><td style="color: #4B5563;">Transaction Ref:</td><td><code style="background: #E2E8F0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">' . htmlspecialchars($transactionId) . '</code></td></tr>
            <tr><td style="color: #4B5563;">Payment Status:</td><td><span style="color: #16A34A; font-weight: 700;">✓ SUCCESS</span></td></tr>
            ' . ($pan ? '<tr><td style="color: #4B5563;">PAN (for 80G):</td><td><code style="font-family: monospace;">' . htmlspecialchars($pan) . '</code></td></tr>' : '') . '
            <tr><td style="color: #4B5563;">Tax Deduction:</td><td><span style="color: #087F73; font-weight: 600;">Ask for current approval details; eligibility is not confirmed</span></td></tr>
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
              <div style="display: inline-block; background: #FFFFFF; border-radius: 50%; padding: 6px; margin-bottom: 12px;"><img src="cid:avinya-logo" alt="AvinyaCareFoundation" width="56" height="56" style="display: block; width: 56px; height: 56px; border: 0; border-radius: 50%; object-fit: contain;"></div>
              <div style="color: #F58220; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">' . $brandName . '</div>
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
                ' . $brandName . ' • Registered Public Charitable Trust<br>
                Email: <a href="mailto:' . $brandEmail . '" style="color: #F58220; text-decoration: none; font-weight: 600;">' . $brandEmail . '</a> | Helpline: <a href="tel:+917447441116" style="color: #F58220; text-decoration: none; font-weight: 600;">' . $brandPhone . '</a><br>' . $brandWebsite . '
              </p>
              <p style="margin: 0; font-size: 11px; color: #737373; border-top: 1px dashed #404040; padding-top: 12px;">
                <strong>Medical & Legal Disclaimer:</strong> AvinyaCareFoundation communications provide general health awareness and screening navigation. We do not provide medical prescriptions, diagnoses, or direct clinical medical advice.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

// Dispatch once, alongside the admin notification below.

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
              <div style="display: inline-block; background: #FFFFFF; border-radius: 50%; padding: 5px; margin: 0 12px 8px 0; vertical-align: middle;"><img src="cid:avinya-logo" alt="AvinyaCareFoundation" width="40" height="40" style="display: block; width: 40px; height: 40px; border: 0; border-radius: 50%; object-fit: contain;"></div>
              <div style="color: #F58220; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px;">AvinyaCareFoundation Internal Desk</div>
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

              <p style="font-size: 14px; color: #5F6865; margin: 0;"><strong>Action Required:</strong> Review user submission details and verify payment and applicable receipt requirements or route to the appropriate department.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>';

// Refuse requests when durable storage is unavailable.
if (getDatabaseConnection() === null) {
    http_response_code(503);
    echo json_encode(['status' => 'error', 'message' => 'Requests cannot be saved right now. Please try again later or call the foundation.']);
    exit;
}

// 1. Dispatch User Confirmation HTML Email via Authenticated SSL SMTP
$userSentResult = $email === '' ? true : sendPHPSMTP($email, $userSubject, $userHtmlContent);
$userEmailSent = $email !== '' && ($userSentResult === true || $userSentResult === 1);
$userEmailError = ($email !== '' && !$userEmailSent) ? "User confirmation email delivery failed via Hostinger SSL SMTP." : null;

// 2. Dispatch Admin Alert HTML Email via Authenticated SSL SMTP
$isStaging = str_contains($_SERVER['HTTP_HOST'] ?? '', 'test.avinyacarefoundation.org');
$defaultAdmin = $isStaging ? 'info@test.avinyacarefoundation.org' : 'info@avinyacarefoundation.org';
$defaultAdminRecord = $isStaging ? 'manetejas00@gmail.com' : 'health@avinyacarefoundation.org';

$adminTo = getDbEnv('ADMIN_EMAIL', $defaultAdmin);
$adminSentResult = sendPHPSMTP($adminTo, $adminSubject, $adminHtmlContent, $email);
$adminEmailSent = ($adminSentResult === true || $adminSentResult === 1);
$adminEmailError = !$adminEmailSent ? "Admin operational alert delivery failed via Hostinger SSL SMTP." : null;
$adminRecordTo = getDbEnv('ADMIN_RECORD_EMAIL', $defaultAdminRecord);
$adminRecordEmailSent = true;
if (filter_var($adminRecordTo, FILTER_VALIDATE_EMAIL) && strcasecmp($adminRecordTo, $adminTo) !== 0) {
    $adminRecordResult = sendPHPSMTP($adminRecordTo, '[Admin Record] ' . $adminSubject, $adminHtmlContent, $email);
    $adminRecordEmailSent = ($adminRecordResult === true || $adminRecordResult === 1);
}

// 3. If any email delivery failed, automatically dispatch error diagnostic alert to admin
if ($email !== '' && !$userEmailSent) {
    $errorAlertSubject = "[AvinyaCareFoundation ALERT] Email Delivery Failed — " . strtoupper($formType) . " (ID: {$submissionId})";
    $errorAlertHtml = '<!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>' . htmlspecialchars($errorAlertSubject) . '</title></head>
    <body style="margin: 0; padding: 24px; background-color: #FEF2F2; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; color: #111817;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #FECACA; overflow: hidden;">
        <tr>
          <td style="background-color: #DC2626; color: #FFFFFF; padding: 20px 24px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; color: #FEE2E2;">AvinyaCareFoundation System Diagnostics</div>
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

$userDeliveryComplete = $email === '' || $userEmailSent;
$deliveryStatus = ($userDeliveryComplete && $adminEmailSent) ? 'SENT' : (($userEmailSent || $adminEmailSent) ? 'PARTIAL' : 'FAILED');
$successMessage = ($userDeliveryComplete && $adminEmailSent) ? "All emails dispatched successfully via Hostinger SSL SMTP (Port 465)." : (($userEmailSent || $adminEmailSent) ? "Partial email delivery completed. Error alert sent to admin." : "Email delivery failed. Error alert sent to admin.");
$errorMessage = (!$userEmailSent && !$adminEmailSent) ? "Email dispatch failed on both recipient channels." : ($userEmailError ?: $adminEmailError);

// Save form submission and audit email logs to Hostinger MySQL Database
try {
    $pdo = getDatabaseConnection();
    if ($pdo !== null) {
        if ($formType === 'coming_soon_feedback') {
            $stmt = $pdo->prepare("INSERT INTO `coming_soon_feedbacks`
                (`submission_id`, `name`, `email`, `phone`, `message`, `user_email_sent`, `admin_email_sent`, `delivery_status`, `raw_payload`)
                VALUES (:sub_id, :name, :email, :phone, :msg, :u_sent, :a_sent, :status, :payload)");
            $stmt->execute([
                ':sub_id' => $submissionId,
                ':name' => $name,
                ':email' => $email,
                ':phone' => $phone,
                ':msg' => $message,
                ':u_sent' => $userEmailSent ? 1 : 0,
                ':a_sent' => $adminEmailSent ? 1 : 0,
                ':status' => $deliveryStatus,
                ':payload' => json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            ]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO `form_submissions`
                (`submission_id`, `form_type`, `name`, `email`, `phone`, `amount`, `frequency`, `pan`, `transaction_id`, `organization`, `category`, `interest`, `message`, `payment_status`, `is_anonymous`, `user_email_sent`, `admin_email_sent`, `delivery_status`, `raw_payload`)
                VALUES (:sub_id, :ftype, :name, :email, :phone, :amount, :freq, :pan, :tx_id, :org, :category, :interest, :msg, :pay_stat, :anonymous, :u_sent, :a_sent, :status, :payload)");

            $stmt->execute([
                ':sub_id' => $submissionId,
                ':ftype' => $formType,
                ':name' => $name,
                ':email' => $email,
                ':phone' => $phone,
                ':amount' => $amount,
                ':freq' => $frequency,
                ':pan' => $pan,
                ':tx_id' => $transactionId,
                ':org' => $organization,
                ':category' => $data['category'] ?? null,
                ':interest' => $interest,
                ':msg' => $message,
                ':pay_stat' => $data['payment_status'] ?? 'PENDING',
                ':anonymous' => !empty($data['is_anonymous']) ? 1 : 0,
                ':u_sent' => $userEmailSent ? 1 : 0,
                ':a_sent' => $adminEmailSent ? 1 : 0,
                ':status' => $deliveryStatus,
                ':payload' => json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            ]);
        }

        $logStmt = $pdo->prepare("INSERT INTO `email_logs` (`reference_id`, `form_or_booking_type`, `recipient_role`, `recipient_email`, `subject`, `smtp_status`, `delivery_method`, `error_message`) VALUES (:ref, :type, :role, :to, :subj, :status, 'HOSTINGER_SSL_SMTP_465', :err)");

        $logStmt->execute([
            ':ref' => $submissionId,
            ':type' => $formType,
            ':role' => 'user',
            ':to' => $email,
            ':subj' => $userSubject,
            ':status' => $email === '' ? 'SKIPPED' : ($userEmailSent ? 'SENT' : 'FAILED'),
            ':err' => $userEmailError
        ]);

        $logStmt->execute([
            ':ref' => $submissionId,
            ':type' => $formType,
            ':role' => 'admin',
            ':to' => $adminTo,
            ':subj' => $adminSubject,
            ':status' => $adminEmailSent ? 'SENT' : 'FAILED',
            ':err' => $adminEmailError
        ]);
    }
} catch (Throwable $dbErr) {
    error_log('Form persistence or delivery audit failed.');
    http_response_code(503);
    echo json_encode(['status' => 'error', 'message' => 'We could not confirm that your request was saved. An email may already have been sent. Please contact the foundation before submitting again.']);
    exit;
}

logActivity(
    'FORM_SUBMIT',
    'user',
    $email,
    "Submitted {$formType} form ({$name})",
    [
        'submissionId' => $submissionId,
        'formType' => $formType,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'amount' => $amount,
        'deliveryStatus' => $deliveryStatus
    ]
);

logActivity(
    $userEmailSent ? 'EMAIL_SENT' : ($email === '' ? 'EMAIL_SKIPPED' : 'EMAIL_FAILED'),
    'system',
    $email,
    $email === '' ? "Visitor email skipped because no address was supplied." : ($userEmailSent ? "User confirmation email accepted for {$email}" : "User email delivery failed to {$email}"),
    [
        'submissionId' => $submissionId,
        'subject' => $userSubject,
        'role' => 'user',
        'smtpStatus' => $email === '' ? 'SKIPPED' : ($userEmailSent ? 'SENT' : 'FAILED'),
        'error' => $userEmailError
    ]
);

logActivity(
    $adminEmailSent ? 'EMAIL_SENT' : 'EMAIL_FAILED',
    'system',
    $adminTo,
    $adminEmailSent ? "Admin notification email delivered to {$adminTo}" : "Admin email delivery failed to {$adminTo}",
    [
        'submissionId' => $submissionId,
        'subject' => $adminSubject,
        'role' => 'admin',
        'smtpStatus' => $adminEmailSent ? 'SENT' : 'FAILED',
        'error' => $adminEmailError
    ]
);

echo json_encode([
    'status' => 'ok',
    'submissionId' => $submissionId,
    'formType' => $formType,
    'paymentStatus' => $paymentStatus,
    'isAIGenerated' => false,
    'timestampIST' => $timestampIST,
    'emailDelivery' => [
        'status' => $deliveryStatus,
        'deliveryMethod' => 'HOSTINGER_SSL_SMTP_465',
        'userEmailSent' => $userEmailSent,
        'userEmailStatus' => $email === '' ? 'SKIPPED' : ($userEmailSent ? 'SENT' : 'FAILED'),
        'adminEmailSent' => $adminEmailSent,
        'adminRecordEmailSent' => $adminRecordEmailSent,
        'userEmailRecipient' => $email,

        'successMessage' => $successMessage,
        'errorMessage' => $errorMessage,
        'userEmailError' => $userEmailError,
        'adminEmailError' => $adminEmailError
    ],
    'userEmail' => [
        'subject' => $userSubject,
        'greeting' => $greeting,
        'body' => $bodyText,
        'closing' => "With deepest gratitude and care,\nAvinyaCareFoundation Team"
    ],
    'message' => "Thank you, {$name}. Your request has been received. " . ($email === '' ? 'No email was requested; please save your reference.' : ($userEmailSent ? 'A confirmation email has been sent.' : 'The email could not be sent; please save your reference.'))
]);
?>
