<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

cp_require_post();
$data = cp_request_json();
$key = strtoupper(trim((string) ($data['license_key'] ?? '')));
if ($key === '' || strlen($key) > 64) {
    cp_json(['valid' => false, 'message' => 'Please enter a valid license key.'], 422);
}

$license = cp_find_license($key);
if ($license === null || !cp_license_is_active($license)) {
    cp_json(['valid' => false, 'message' => 'This license is not active.'], 200);
}

cp_json([
    'valid' => true,
    'plan' => $license['plan'],
    'access_until' => $license['access_until'],
]);
