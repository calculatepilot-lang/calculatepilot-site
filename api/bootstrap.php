<?php
declare(strict_types=1);

$CP = require __DIR__ . '/config.php';

function cp_db(): PDO
{
    global $CP;
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = $CP['db_dsn'];
    if ($dsn === '') {
        if ($CP['db_name'] === '' || $CP['db_user'] === '') {
            throw new RuntimeException('Database configuration is incomplete.');
        }
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $CP['db_host'],
            $CP['db_port'],
            $CP['db_name'],
            $CP['db_charset']
        );
    }

    $pdo = new PDO($dsn, $CP['db_user'], $CP['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function cp_json(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function cp_request_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        cp_json(['error' => 'Invalid JSON request body.'], 400);
    }
    return $data;
}

function cp_require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        cp_json(['error' => 'Method not allowed.'], 405);
    }
}

function cp_random_id(string $prefix = ''): string
{
    return $prefix . bin2hex(random_bytes(16));
}

function cp_generate_license_key(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $groups = [];
    for ($g = 0; $g < 4; $g++) {
        $part = '';
        for ($i = 0; $i < 5; $i++) {
            $part .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $groups[] = $part;
    }
    return 'CPRO-' . implode('-', $groups);
}

function cp_license_is_active(array $license): bool
{
    if ($license['status'] === 'active') {
        return true;
    }
    if ($license['status'] === 'canceled' && !empty($license['access_until'])) {
        return strtotime($license['access_until']) >= time();
    }
    return false;
}

function cp_find_license(string $key): ?array
{
    $stmt = cp_db()->prepare('SELECT * FROM cp_licenses WHERE license_key = ? LIMIT 1');
    $stmt->execute([trim($key)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function cp_send_license_email(string $email, string $licenseKey, string $plan): bool
{
    global $CP;
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $safeKey = htmlspecialchars($licenseKey, ENT_QUOTES, 'UTF-8');
    $safePlan = htmlspecialchars($plan, ENT_QUOTES, 'UTF-8');
    $subject = 'Your CalculatePilot White-Label License is Active';
    $message = '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#14171A;line-height:1.55">'
        . '<h2>Your CalculatePilot White-Label License is Active</h2>'
        . '<p>Thank you for subscribing to CalculatePilot Pro (' . $safePlan . '). Your license is ready to use.</p>'
        . '<p><strong>Activation key</strong></p>'
        . '<p style="font-family:monospace;font-size:20px;padding:14px;background:#EAF4F1;border-radius:6px;display:inline-block">' . $safeKey . '</p>'
        . '<p>Open <a href="' . htmlspecialchars($CP['site_url'] . '/embed/', ENT_QUOTES, 'UTF-8') . '">CalculatePilot embeds</a>, enter this key in the license section, and copy your white-label embed code.</p>'
        . '<p>Your key stays the same while your subscription remains eligible for access. If you need help, contact <a href="mailto:' . htmlspecialchars($CP['mail_from'], ENT_QUOTES, 'UTF-8') . '">' . htmlspecialchars($CP['mail_from'], ENT_QUOTES, 'UTF-8') . '</a>.</p>'
        . '</body></html>';

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . $CP['mail_name'] . ' <' . $CP['mail_from'] . '>',
        'Reply-To: ' . $CP['mail_from'],
    ];

    return @mail($email, $subject, $message, implode("\r\n", $headers));
}
