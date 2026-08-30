<?php
declare(strict_types=1);

function resetMailEnv(string $name, string $default = ''): string {
    $value = $_ENV[$name] ?? $_SERVER[$name] ?? getenv($name);
    return trim((string) ($value === false || $value === null ? $default : $value));
}

function sendPasswordResetEmail(string $to, string $name, string $resetUrl, int $expiryMinutes = 45): array {
    $host = resetMailEnv('SMTP_HOST');
    $port = (int) resetMailEnv('SMTP_PORT', '465');
    $user = resetMailEnv('SMTP_USER');
    $pass = resetMailEnv('SMTP_PASS');
    $from = resetMailEnv('SMTP_FROM', $user);
    $fromName = resetMailEnv('SMTP_FROM_NAME', 'Avinya Care Foundation');

    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return ['sent' => false, 'error' => 'Invalid recipient address.'];
    if ($host === '' || $user === '' || $pass === '' || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        return ['sent' => false, 'error' => 'SMTP is not fully configured.'];
    }

    $secure = filter_var(resetMailEnv('SMTP_SECURE', $port === 465 ? 'true' : 'false'), FILTER_VALIDATE_BOOLEAN);
    $socketHost = $secure ? 'ssl://' . preg_replace('#^ssl://#', '', $host) : $host;
    $socket = @fsockopen($socketHost, $port, $errorNumber, $errorMessage, 12);
    if (!$socket) return ['sent' => false, 'error' => "SMTP connection failed ({$errorNumber})."];
    stream_set_timeout($socket, 12);

    $expect = static function ($socket, array $allowed): string {
        $response = '';
        while (($line = fgets($socket, 2048)) !== false) {
            $response .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $allowed, true)) throw new RuntimeException("SMTP rejected the message (code {$code}).");
        return $response;
    };
    $command = static function ($socket, string $line, array $allowed) use ($expect): string {
        if (fwrite($socket, $line . "\r\n") === false) throw new RuntimeException('SMTP write failed.');
        return $expect($socket, $allowed);
    };

    $safeName = htmlspecialchars($name !== '' ? $name : 'there', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeUrl = htmlspecialchars($resetUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $subject = 'Password Reset — Avinya Care Foundation';
    $html = '<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Arial,sans-serif;color:#111817">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 14px"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#fff;border:1px solid #e2e8f0;border-radius:16px">'
        . '<tr><td style="background:#0a0a0a;padding:28px;text-align:center;color:#fff"><div style="color:#f58220;font-weight:700;letter-spacing:1px">AVINYA CARE FOUNDATION</div><h1 style="font-size:22px">Reset your password</h1></td></tr>'
        . '<tr><td style="padding:34px"><p>Hello ' . $safeName . ',</p><p>We received a request to reset your Admin Panel password.</p>'
        . '<p style="margin:28px 0;text-align:center"><a href="' . $safeUrl . '" style="background:#0d9488;color:#fff;padding:13px 24px;text-decoration:none;border-radius:7px;font-weight:700">Reset Password</a></p>'
        . '<p style="font-size:13px">This link expires in ' . $expiryMinutes . ' minutes and can be used once. If you did not request it, you can ignore this email.</p>'
        . '<p style="font-size:12px;color:#64748b;word-break:break-all">If the button does not work, open:<br>' . $safeUrl . '</p>'
        . '<p>With care,<br><strong>Avinya Care Foundation Team</strong></p></td></tr></table></td></tr></table></body></html>';

    try {
        $expect($socket, [220]);
        $command($socket, 'EHLO ' . (gethostname() ?: 'avinyacarefoundation.org'), [250]);
        $command($socket, 'AUTH LOGIN', [334]);
        $command($socket, base64_encode($user), [334]);
        $command($socket, base64_encode($pass), [235]);
        $command($socket, 'MAIL FROM:<' . $from . '>', [250]);
        $command($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
        $command($socket, 'DATA', [354]);
        $messageId = '<reset-' . bin2hex(random_bytes(12)) . '@' . preg_replace('/[^a-z0-9.-]/i', '', parse_url($resetUrl, PHP_URL_HOST) ?: 'avinyacarefoundation.org') . '>';
        $headers = [
            'From: ' . $fromName . ' <' . $from . '>',
            'To: <' . $to . '>',
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Message-ID: ' . $messageId,
            'X-Mailer: AvinyaCare-PasswordReset/1.0'
        ];
        $payload = implode("\r\n", $headers) . "\r\n\r\n" . preg_replace('/(?m)^\./', '..', $html) . "\r\n.";
        $response = $command($socket, $payload, [250]);
        fwrite($socket, "QUIT\r\n");
        fclose($socket);
        return ['sent' => true, 'providerResponse' => trim($response), 'messageId' => $messageId, 'subject' => $subject];
    } catch (Throwable $error) {
        fclose($socket);
        return ['sent' => false, 'error' => $error->getMessage(), 'subject' => $subject];
    }
}
