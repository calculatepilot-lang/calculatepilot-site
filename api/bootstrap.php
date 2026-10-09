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

function cp_client_ip(): string
{
    // Behind Cloudflare the real visitor IP is in CF-Connecting-IP; fall back to the socket address.
    $ip = (string) ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '');
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
}

/**
 * Per-IP sliding-window rate limit using small files in the system temp dir (no DB changes needed).
 * Answers 429 when exceeded. Fails open if the limiter itself cannot run, so it can never take checkout down.
 */
function cp_rate_limit(string $bucket, int $max, int $windowSeconds): void
{
    $over = false;
    try {
        $dir = sys_get_temp_dir() . '/cp-ratelimit';
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            return;
        }
        $fp = @fopen($dir . '/' . hash('sha256', $bucket . '|' . cp_client_ip()) . '.json', 'c+');
        if ($fp === false) {
            return;
        }
        flock($fp, LOCK_EX);
        $hits = json_decode((string) stream_get_contents($fp), true);
        $now = time();
        $hits = array_values(array_filter(is_array($hits) ? $hits : [], static fn($t) => is_int($t) && $t > $now - $windowSeconds));
        if (count($hits) >= $max) {
            $over = true;
        } else {
            $hits[] = $now;
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($hits));
        }
        flock($fp, LOCK_UN);
        fclose($fp);
        if (random_int(1, 200) === 1) {
            foreach (glob($dir . '/*.json') ?: [] as $f) {
                if (@filemtime($f) < $now - 86400) {
                    @unlink($f);
                }
            }
        }
    } catch (Throwable $e) {
        return;
    }
    if ($over) {
        header('Retry-After: ' . $windowSeconds);
        $msg = 'Too many requests. Please try again later.';
        cp_json(['ok' => false, 'valid' => false, 'error' => $msg, 'message' => $msg], 429);
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
    // Delivery (authenticated SMTP with mail() fallback) lives in mail.php.
    require_once __DIR__ . '/mail.php';
    return cp_deliver_license_email($email, $licenseKey, $plan);
}

