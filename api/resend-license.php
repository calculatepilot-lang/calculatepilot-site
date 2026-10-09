<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mail.php';

// "Resend my key": always answers the same way for a valid-looking address, so it cannot be used to
// discover which emails have a license. Each license is re-sent at most once every 5 minutes.
cp_require_post();
cp_rate_limit('resend', 5, 3600);
$data = cp_request_json();
$email = strtolower(trim((string) ($data['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
    cp_json(['ok' => false, 'message' => 'Please enter the email address you used at checkout.'], 422);
}

try {
    $stmt = cp_db()->prepare('SELECT * FROM cp_licenses WHERE customer_email = ? ORDER BY id DESC LIMIT 5');
    $stmt->execute([$email]);
    foreach ($stmt->fetchAll() as $license) {
        if (!cp_license_is_active($license)) {
            continue;
        }
        if (!empty($license['emailed_at']) && strtotime($license['emailed_at'] . ' UTC') > time() - 300) {
            continue;
        }
        if (cp_deliver_license_email((string) $license['customer_email'], (string) $license['license_key'], ucfirst((string) $license['plan']))) {
            $mark = cp_db()->prepare('UPDATE cp_licenses SET emailed_at = UTC_TIMESTAMP() WHERE id = ?');
            $mark->execute([$license['id']]);
        }
    }
} catch (Throwable $e) {
    error_log('CalculatePilot resend-license: ' . $e->getMessage());
}

cp_json(['ok' => true, 'message' => 'If that email has an active license, we have sent the key again. Please check your spam folder too.']);
