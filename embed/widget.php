<?php
declare(strict_types=1);
require dirname(__DIR__) . '/api/bootstrap.php';

$calculator = (string) ($_GET['calculator'] ?? '');
if (!preg_match('/^[a-z0-9-]+$/', $calculator)) {
    http_response_code(400);
    exit('Invalid calculator.');
}

$file = __DIR__ . '/' . $calculator . '.html';
if (!is_file($file)) {
    http_response_code(404);
    exit('Calculator not found.');
}

$html = file_get_contents($file);
if ($html === false) {
    http_response_code(500);
    exit('Unable to load calculator.');
}

$key = strtoupper(trim((string) ($_GET['license'] ?? '')));
$licensed = false;
if ($key !== '') {
    try {
        $license = cp_find_license($key);
        $licensed = $license !== null && cp_license_is_active($license);
    } catch (Throwable $e) {
        error_log('CalculatePilot widget license validation error: ' . $e->getMessage());
    }
}

if ($licensed) {
    // All current embeds use the shared .embed-brand footer. Strip only that
    // exact wrapper server-side after validating the subscription-backed key.
    $html = preg_replace('~\s*<div class="embed-brand">.*?</div>\s*(?=\n*<script|\n*</body>)~s', "\n", $html, 1) ?? $html;
    header('Cache-Control: private, no-store');
} else {
    header('Cache-Control: public, max-age=300');
}

header('Content-Type: text/html; charset=UTF-8');
echo $html;
