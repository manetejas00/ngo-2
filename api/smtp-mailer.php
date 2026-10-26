<?php
function sendPHPSMTP($to, $subject, $htmlBody, $replyTo = '') {
    foreach ([$to, $replyTo] as $address) {
        if ($address !== '' && (!filter_var($address, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $address))) return false;
    }
    $isStaging = str_contains($_SERVER['HTTP_HOST'] ?? '', 'test.avinyacarefoundation.org');
    $defaultUser = $isStaging ? 'info@test.avinyacarefoundation.org' : 'info@avinyacarefoundation.org';

    $host = 'ssl://' . preg_replace('#^ssl://#', '', getDbEnv('SMTP_HOST', 'smtp.hostinger.com'));
    $port = (int) (getDbEnv('SMTP_PORT', '465'));
    $user = getDbEnv('SMTP_USER', $defaultUser);
    if (!$isStaging && str_contains($user, 'test.avinyacarefoundation.org')) {
        $user = 'info@avinyacarefoundation.org';
    }
    $pass = getDbEnv('SMTP_PASS');
    $from = getDbEnv('SMTP_FROM', $user);
    if (!$isStaging && str_contains($from, 'test.avinyacarefoundation.org')) {
        $from = 'info@avinyacarefoundation.org';
    }
    if (!filter_var($from, FILTER_VALIDATE_EMAIL)) return false;
    $fromName = str_replace(["\r", "\n"], '', getDbEnv('SMTP_FROM_NAME', 'AvinyaCareFoundation'));
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
    if (substr((string) fgets($socket, 512), 0, 3) !== "250") { fclose($socket); return false; }
    fputs($socket, "RCPT TO: <{$to}>\r\n");
    if (!in_array(substr((string) fgets($socket, 512), 0, 3), ["250", "251"], true)) { fclose($socket); return false; }
    fputs($socket, "DATA\r\n");
    if (substr((string) fgets($socket, 512), 0, 3) !== "354") { fclose($socket); return false; }

    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $headers = [
        "From: {$fromName} <{$from}>",
        "To: <{$to}>",
        "Subject: {$encodedSubject}",
        "Reply-To: " . ($replyTo ?: $from),
        "MIME-Version: 1.0",
        "Content-Type: multipart/related; boundary=\"{$boundary}\"",
        "X-Mailer: AvinyaCareFoundation-PHP-SMTP/2.0"
    ];

    fputs($socket, implode("\r\n", $headers) . "\r\n\r\n" . preg_replace('/^(\.)/m', '..', $mimeBody) . "\r\n.\r\n");
    $dataRes = fgets($socket, 512);

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return (substr($dataRes, 0, 3) == "250");
}
