<?php
declare(strict_types=1);

/**
 * CalculatePilot payment/license configuration.
 *
 * Secrets are read from environment variables first. On shared hosting you may
 * alternatively create api/config.local.php from config.local.php.example.
 * Never commit real API keys, database passwords or webhook secrets.
 */
$localConfig = [];
$localPath = __DIR__ . '/config.local.php';
if (is_file($localPath)) {
    $loaded = require $localPath;
    if (is_array($loaded)) {
        $localConfig = $loaded;
    }
}

function cp_config(string $key, mixed $default = null): mixed
{
    global $localConfig;
    $env = getenv($key);
    if ($env !== false && $env !== '') {
        return $env;
    }
    return $localConfig[$key] ?? $default;
}

function cp_bool_config(string $key, bool $default = false): bool
{
    $value = cp_config($key, $default ? '1' : '0');
    return filter_var($value, FILTER_VALIDATE_BOOLEAN);
}

return [
    'site_url' => rtrim((string) cp_config('CP_SITE_URL', 'https://www.calculatepilot.com'), '/'),
    'db_dsn' => (string) cp_config('CP_DB_DSN', ''),
    'db_host' => (string) cp_config('CP_DB_HOST', 'localhost'),
    'db_port' => (string) cp_config('CP_DB_PORT', '3306'),
    'db_name' => (string) cp_config('CP_DB_NAME', ''),
    'db_user' => (string) cp_config('CP_DB_USER', ''),
    'db_pass' => (string) cp_config('CP_DB_PASS', ''),
    'db_charset' => (string) cp_config('CP_DB_CHARSET', 'utf8mb4'),
    'creem_api_key' => (string) cp_config('CREEM_API_KEY', ''),
    'creem_webhook_secret' => (string) cp_config('CREEM_WEBHOOK_SECRET', ''),
    'creem_monthly_product_id' => (string) cp_config('CREEM_MONTHLY_PRODUCT_ID', ''),
    'creem_yearly_product_id' => (string) cp_config('CREEM_YEARLY_PRODUCT_ID', ''),
    'creem_test_mode' => cp_bool_config('CREEM_TEST_MODE', true),
    'mail_from' => (string) cp_config('CP_MAIL_FROM', 'help@calculatepilot.com'),
    'mail_name' => (string) cp_config('CP_MAIL_NAME', 'CalculatePilot'),
];
