<?php
declare(strict_types=1);

function loadBookingEmailEnv(string $path): void {
    if (!is_file($path) || !is_readable($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) return;
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$name, $value] = array_map('trim', explode('=', $line, 2));
        if (!str_starts_with($name, 'SMTP_') && $name !== 'ADMIN_EMAIL') continue;
        if (getenv($name) !== false) continue;
        if (strlen($value) >= 2 && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))) $value = substr($value, 1, -1);
        putenv($name . '=' . $value);
        $_ENV[$name] = $value;
    }
}

loadBookingEmailEnv(dirname(__DIR__, 2) . '/.env');

function bookingEmailEnv(string $name, string $default = ''): string {
    $value = getenv($name);
    if ($value === false && isset($_ENV[$name])) $value = $_ENV[$name];
    if ($value === false && isset($_SERVER[$name])) $value = $_SERVER[$name];
    return trim((string) ($value === false ? $default : $value));
}

function emailHtml(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

final class AppointmentEmailService {
    public function sendConfirmation(array $booking): array {
        $attemptedAt = nowIso();
        $to = trim((string) ($booking['patientEmail'] ?? ''));
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return $this->event('failed', $attemptedAt, 'Invalid patient email address.');
        $host = bookingEmailEnv('SMTP_HOST');
        $port = (int) bookingEmailEnv('SMTP_PORT', '465');
        $user = bookingEmailEnv('SMTP_USER');
        $pass = bookingEmailEnv('SMTP_PASS');
        $from = bookingEmailEnv('SMTP_FROM', $user);
        $fromName = bookingEmailEnv('SMTP_FROM_NAME', 'Avinya Care Foundation');
        if ($host === '' || $user === '' || $pass === '' || $from === '') return $this->event('skipped', $attemptedAt, 'Email provider is not configured.');

        $secure = filter_var(bookingEmailEnv('SMTP_SECURE', $port === 465 ? 'true' : 'false'), FILTER_VALIDATE_BOOLEAN);
        $socketHost = $secure ? 'ssl://' . preg_replace('#^ssl://#', '', $host) : $host;
        $socket = @fsockopen($socketHost, $port, $errorNumber, $errorMessage, 12);
        if (!$socket) return $this->event('failed', $attemptedAt, "SMTP connection failed ({$errorNumber}).");
        stream_set_timeout($socket, 12);

        try {
            $this->expect($socket, [220]);
            $this->command($socket, 'EHLO ' . (gethostname() ?: 'localhost'), [250]);
            $this->command($socket, 'AUTH LOGIN', [334]);
            $this->command($socket, base64_encode($user), [334]);
            $this->command($socket, base64_encode($pass), [235]);
            $this->command($socket, 'MAIL FROM:<' . $from . '>', [250]);
            $this->command($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
            $this->command($socket, 'DATA', [354]);

            $subject = 'Appointment Confirmed — ' . (string) ($booking['id'] ?? 'Avinya Care');
            $boundary = '=_AvinyaLogo_' . bin2hex(random_bytes(8));
            $headers = [
                'From: ' . $fromName . ' <' . $from . '>', 'To: <' . $to . '>',
                'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=', 'MIME-Version: 1.0',
                'Content-Type: multipart/related; boundary="' . $boundary . '"',
                'X-Mailer: AvinyaCare-Booking/1.0'
            ];
            $body = $this->template($booking);
            $mimeBody = $this->inlineLogoMimeBody($body, $boundary);
            $message = implode("\r\n", $headers) . "\r\n\r\n" . preg_replace('/(?m)^\./', '..', $mimeBody) . "\r\n.";
            $this->command($socket, $message, [250]);
            fwrite($socket, "QUIT\r\n");
            fclose($socket);
            return $this->event('sent', $attemptedAt, '');
        } catch (Throwable $error) {
            fclose($socket);
            return $this->event('failed', $attemptedAt, $error->getMessage());
        }
    }

    private function command($socket, string $command, array $codes): string {
        if (fwrite($socket, $command . "\r\n") === false) throw new RuntimeException('SMTP write failed.');
        return $this->expect($socket, $codes);
    }

    private function expect($socket, array $codes): string {
        $response = '';
        while (($line = fgets($socket, 1024)) !== false) {
            $response .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        $code = (int) substr($response, 0, 3);
        if (!in_array($code, $codes, true)) throw new RuntimeException('SMTP server rejected the message (code ' . $code . ').');
        return $response;
    }

    private function event(string $status, string $attemptedAt, string $error): array {
        return ['type' => 'appointment_confirmation_fallback', 'status' => $status, 'provider' => 'smtp', 'attemptedAt' => $attemptedAt, 'sentAt' => $status === 'sent' ? nowIso() : null, 'error' => $error];
    }

    private function inlineLogoMimeBody(string $html, string $boundary): string {
        $logoPath = dirname(__DIR__, 2) . '/assets/logo.png';
        $parts = [
            '--' . $boundary,
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            '',
            $html
        ];
        if (is_file($logoPath) && is_readable($logoPath)) {
            $logo = file_get_contents($logoPath);
            if ($logo !== false) {
                $parts = array_merge($parts, [
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
        $parts[] = '--' . $boundary . '--';
        return implode("\r\n", $parts);
    }

    private function template(array $booking): string {
        $name = emailHtml((string) ($booking['patientName'] ?? 'Patient'));
        $id = emailHtml((string) ($booking['id'] ?? ''));
        $doctor = emailHtml((string) ($booking['doctorName'] ?? 'Avinya Care Specialist'));
        $speciality = emailHtml((string) ($booking['doctorSpeciality'] ?? 'Medical Consultation'));
        $date = emailHtml((string) ($booking['date'] ?? ''));
        $time = emailHtml((string) ($booking['time'] ?? $booking['slot'] ?? ''));
        $mode = emailHtml((string) ($booking['consultationType'] ?? 'in-clinic'));
        $hospital = emailHtml((string) ($booking['doctorHospital'] ?? 'Avinya Care Foundation'));
        return '<!doctype html><html><body style="margin:0;background:#F6F4EF;font-family:Arial,sans-serif;color:#111817">'
            . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 14px;background:#F6F4EF"><tr><td align="center">'
            . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden">'
            . '<tr><td style="background:#087F73;padding:32px;text-align:center;color:#fff"><div style="display:inline-block;background:#fff;border-radius:50%;padding:6px;margin-bottom:12px"><img src="cid:avinya-logo" alt="Avinya Care Foundation" width="56" height="56" style="display:block;width:56px;height:56px;border:0;border-radius:50%;object-fit:contain"></div><div style="color:#A7F3D0;font-size:12px;font-weight:700;letter-spacing:2px">AVINYA CARE FOUNDATION</div><h1 style="margin:8px 0 0;font-size:25px">Appointment Confirmed</h1></td></tr>'
            . '<tr><td style="padding:34px"><p style="font-size:18px;font-weight:700;color:#087F73">Hi ' . $name . ',</p><p style="line-height:1.7">Your appointment has been successfully confirmed. Please keep the booking ID below for future reference.</p>'
            . '<div style="background:#F0FDFA;border-left:4px solid #087F73;border-radius:9px;padding:20px;margin:24px 0;line-height:1.9"><strong>Booking ID:</strong> ' . $id . '<br><strong>Doctor:</strong> ' . $doctor . '<br><strong>Service:</strong> ' . $speciality . '<br><strong>Date:</strong> ' . $date . '<br><strong>Time:</strong> ' . $time . '<br><strong>Mode:</strong> ' . $mode . '<br><strong>Location:</strong> ' . $hospital . '</div>'
            . '<p style="line-height:1.7">If you need assistance, reply to this email or contact the Avinya Care team.</p><p style="margin-top:28px;color:#5F6865">With care,<br><strong style="color:#087F73">Avinya Care Foundation Team</strong></p></td></tr>'
            . '<tr><td style="background:#F6F4EF;padding:22px;text-align:center;color:#5F6865;font-size:12px">Cancer Awareness • Support • Care • Community<br>This is a transactional appointment message, not a marketing email.</td></tr>'
            . '</table></td></tr></table></body></html>';
    }
}
