<?php
declare(strict_types=1);

interface WhatsAppProvider {
    public function name(): string;
    public function isConfigured(): bool;
    public function sendAppointmentConfirmation(array $booking): array;
}

function loadWhatsAppDotEnv(string $path): void {
    if (!is_file($path) || !is_readable($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) return;
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$name, $value] = array_map('trim', explode('=', $line, 2));
        if (!str_starts_with($name, 'WHATSAPP_') || getenv($name) !== false) continue;
        if (strlen($value) >= 2 && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))) {
            $value = substr($value, 1, -1);
        }
        putenv($name . '=' . $value);
        $_ENV[$name] = $value;
    }
}

loadWhatsAppDotEnv(dirname(__DIR__, 2) . '/.env');

function whatsappEnv(string $name, string $default = ''): string {
    $value = getenv($name);
    if ($value === false && isset($_ENV[$name])) $value = $_ENV[$name];
    if ($value === false && isset($_SERVER[$name])) $value = $_SERVER[$name];
    return trim((string) ($value === false ? $default : $value));
}

function whatsappEnabled(): bool {
    return filter_var(whatsappEnv('WHATSAPP_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN);
}

function normalizeWhatsAppPhone(string $phone): ?string {
    $digits = preg_replace('/\D+/', '', $phone);
    if ($digits === null || $digits === '') return null;
    if (strlen($digits) === 10 && preg_match('/^[6-9]/', $digits)) $digits = '91' . $digits;
    if (strlen($digits) === 12 && str_starts_with($digits, '91') && preg_match('/^[6-9]/', substr($digits, 2))) return $digits;
    if (strlen($digits) >= 8 && strlen($digits) <= 15 && !str_starts_with($digits, '0')) return $digits;
    return null;
}

function maskedWhatsAppPhone(string $phone): string {
    $digits = preg_replace('/\D+/', '', $phone) ?: '';
    return strlen($digits) > 4 ? str_repeat('*', strlen($digits) - 4) . substr($digits, -4) : '****';
}

final class MetaWhatsAppProvider implements WhatsAppProvider {
    private string $token;
    private string $phoneNumberId;
    private string $version;
    private string $template;
    private string $language;

    public function __construct() {
        $this->token = whatsappEnv('WHATSAPP_ACCESS_TOKEN');
        $this->phoneNumberId = whatsappEnv('WHATSAPP_PHONE_NUMBER_ID');
        $this->version = whatsappEnv('WHATSAPP_API_VERSION', 'v23.0');
        $this->template = whatsappEnv('WHATSAPP_TEMPLATE_NAME', 'appointment_confirmation');
        $this->language = whatsappEnv('WHATSAPP_TEMPLATE_LANGUAGE', 'en');
    }

    public function name(): string { return 'meta'; }
    public function isConfigured(): bool { return $this->token !== '' && $this->phoneNumberId !== ''; }

    public function sendAppointmentConfirmation(array $booking): array {
        $phone = normalizeWhatsAppPhone((string) ($booking['patientPhone'] ?? ''));
        if ($phone === null) throw new InvalidArgumentException('Invalid WhatsApp phone number.');
        if (!function_exists('curl_init')) throw new RuntimeException('PHP cURL extension is unavailable.');

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $phone,
            'type' => 'template',
            'template' => [
                'name' => $this->template,
                'language' => ['code' => $this->language],
                'components' => [[
                    'type' => 'body',
                    'parameters' => array_map(fn($text) => ['type' => 'text', 'text' => (string) $text], [
                        $booking['patientName'] ?? '', $booking['id'] ?? '', $booking['date'] ?? '', $booking['time'] ?? ''
                    ])
                ]]
            ]
        ];

        $url = 'https://graph.facebook.com/' . rawurlencode($this->version) . '/' . rawurlencode($this->phoneNumberId) . '/messages';
        $lastError = 'WhatsApp request failed.';
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            $curl = curl_init($url);
            curl_setopt_array($curl, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT => 12,
                CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $this->token, 'Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            ]);
            $raw = curl_exec($curl);
            $curlError = curl_error($curl);
            $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
            curl_close($curl);
            $response = is_string($raw) ? json_decode($raw, true) : null;
            if ($status >= 200 && $status < 300 && is_array($response)) {
                return ['messageId' => (string) ($response['messages'][0]['id'] ?? ''), 'phone' => $phone, 'attempts' => $attempt];
            }
            $lastError = $curlError ?: (string) ($response['error']['message'] ?? "Meta API returned HTTP {$status}.");
            $temporary = $curlError !== '' || $status === 429 || $status >= 500;
            if (!$temporary || $attempt === 3) break;
            usleep($attempt * 250000);
        }
        throw new RuntimeException($lastError);
    }
}

final class WhatsAppService {
    private WhatsAppProvider $provider;

    public function __construct() {
        $provider = strtolower(whatsappEnv('WHATSAPP_PROVIDER', 'meta'));
        if ($provider !== 'meta') throw new RuntimeException("Unsupported WhatsApp provider: {$provider}");
        $this->provider = new MetaWhatsAppProvider();
    }

    public function sendAppointmentConfirmation(array $booking): array {
        $attemptedAt = nowIso();
        if (!whatsappEnabled()) return $this->event('skipped', $attemptedAt, '', 'WhatsApp notifications are disabled.');
        if (!$this->provider->isConfigured()) return $this->event('skipped', $attemptedAt, '', 'WhatsApp provider is not configured.');
        try {
            $result = $this->provider->sendAppointmentConfirmation($booking);
            return array_merge($this->event('sent', $attemptedAt, (string) ($result['messageId'] ?? ''), ''), ['sentAt' => nowIso(), 'attempts' => $result['attempts'] ?? 1]);
        } catch (Throwable $error) {
            return $this->event('failed', $attemptedAt, '', $error->getMessage());
        }
    }

    private function event(string $status, string $attemptedAt, string $messageId, string $error): array {
        return [
            'type' => 'appointment_confirmation', 'status' => $status, 'provider' => $this->provider->name(),
            'attemptedAt' => $attemptedAt, 'sentAt' => $status === 'sent' ? $attemptedAt : null,
            'messageId' => $messageId, 'error' => $error
        ];
    }
}
