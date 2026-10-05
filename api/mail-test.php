<?php
declare(strict_types=1);

// Command-line only: php api/mail-test.php you@example.com
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/mail.php';

$to = (string) ($argv[1] ?? '');
if ($to === '') {
    fwrite(STDERR, "Usage: php api/mail-test.php you@example.com\n");
    exit(1);
}
$settings = cp_smtp_settings();
echo 'SMTP: ' . $settings['host'] . ':' . $settings['port'] . ' user=' . $settings['user'] . ' password=' . ($settings['pass'] !== '' ? 'set' : 'NOT SET') . "\n";
$ok = cp_deliver_license_email($to, 'CPRO-TEST1-TEST2-TEST3-TEST4', 'Test');
echo ($ok ? 'sent' : 'FAILED') . ' via ' . ($GLOBALS['cp_mail_transport'] ?? 'none') . "\n";
exit($ok ? 0 : 1);
