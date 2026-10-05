<?php
declare(strict_types=1);

/**
 * License email delivery.
 *
 * Prefers authenticated SMTP through the real help@ mailbox (the mail host signs the message, so SPF/DKIM align
 * and Gmail does not treat it as spam). Falls back to PHP mail() when no SMTP password is configured or SMTP fails.
 *
 * Settings (environment variable or api/config.local.php):
 *   CP_SMTP_PASS  mailbox password (required to enable SMTP)
 *   CP_SMTP_HOST  default smtp.hostinger.com
 *   CP_SMTP_PORT  default 465 (implicit TLS); any other port uses STARTTLS
 *   CP_SMTP_USER  default = CP_MAIL_FROM (help@calculatepilot.com)
 */

function cp_smtp_settings(): array
{
    global $CP;
    return [
        'host' => (string) cp_config('CP_SMTP_HOST', 'smtp.hostinger.com'),
        'port' => (int) cp_config('CP_SMTP_PORT', 465),
        'user' => (string) cp_config('CP_SMTP_USER', $CP['mail_from']),
        'pass' => (string) cp_config('CP_SMTP_PASS', ''),
    ];
}

function cp_smtp_read($fp): string
{
    $data = '';
    while (($line = fgets($fp, 1024)) !== false) {
        $data .= $line;
        if (strlen($line) < 4 || $line[3] !== '-') {
            break;
        }
    }
    return $data;
}

function cp_smtp_cmd($fp, string $command, array $okCodes): bool
{
    fwrite($fp, $command . "\r\n");
    $reply = cp_smtp_read($fp);
    return $reply !== '' && in_array((int) substr($reply, 0, 3), $okCodes, true);
}

function cp_smtp_send(string $to, string $subject, array $headers, string $body): bool
{
    global $CP;
    $s = cp_smtp_settings();
    if ($s['pass'] === '' || $s['host'] === '' || $s['user'] === '') {
        return false;
    }

    $implicitTls = $s['port'] === 465;
    $errno = 0;
    $errstr = '';
    $fp = @stream_socket_client(($implicitTls ? 'ssl://' : 'tcp://') . $s['host'] . ':' . $s['port'], $errno, $errstr, 15);
    if (!is_resource($fp)) {
        error_log('CalculatePilot SMTP connect failed: ' . $errno . ' ' . $errstr);
        return false;
    }
    stream_set_timeout($fp, 20);

    $helo = (string) (parse_url($CP['site_url'], PHP_URL_HOST) ?: 'localhost');
    $ok = false;
    try {
        $greeting = cp_smtp_read($fp);
        if (substr($greeting, 0, 3) !== '220') {
            throw new RuntimeException('unexpected greeting');
        }
        if (!cp_smtp_cmd($fp, 'EHLO ' . $helo, [250])) {
            throw new RuntimeException('EHLO rejected');
        }
        if (!$implicitTls) {
            if (!cp_smtp_cmd($fp, 'STARTTLS', [220]) || !stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS failed');
            }
            if (!cp_smtp_cmd($fp, 'EHLO ' . $helo, [250])) {
                throw new RuntimeException('EHLO after STARTTLS rejected');
            }
        }
        if (!cp_smtp_cmd($fp, 'AUTH LOGIN', [334])
            || !cp_smtp_cmd($fp, base64_encode($s['user']), [334])
            || !cp_smtp_cmd($fp, base64_encode($s['pass']), [235])) {
            throw new RuntimeException('authentication failed');
        }
        if (!cp_smtp_cmd($fp, 'MAIL FROM:<' . $CP['mail_from'] . '>', [250])) {
            throw new RuntimeException('MAIL FROM rejected');
        }
        if (!cp_smtp_cmd($fp, 'RCPT TO:<' . $to . '>', [250, 251])) {
            throw new RuntimeException('RCPT TO rejected');
        }
        if (!cp_smtp_cmd($fp, 'DATA', [354])) {
            throw new RuntimeException('DATA rejected');
        }
        $message = 'To: ' . $to . "\r\n" . 'Subject: ' . $subject . "\r\n" . implode("\r\n", $headers) . "\r\n\r\n" . $body;
        $message = (string) preg_replace("/\r\n|\r|\n/", "\r\n", $message);
        $message = (string) preg_replace('/^\./m', '..', $message);
        fwrite($fp, $message . "\r\n.\r\n");
        $reply = cp_smtp_read($fp);
        $ok = substr($reply, 0, 3) === '250';
        if (!$ok) {
            error_log('CalculatePilot SMTP rejected message: ' . trim($reply));
        }
        cp_smtp_cmd($fp, 'QUIT', [221]);
    } catch (Throwable $e) {
        error_log('CalculatePilot SMTP error: ' . $e->getMessage());
    }
    fclose($fp);
    return $ok;
}

/** Sends the license email; returns true when a transport accepted the message. */
function cp_deliver_license_email(string $email, string $licenseKey, string $plan): bool
{
    global $CP;
    $GLOBALS['cp_mail_transport'] = 'none';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $safeKey = htmlspecialchars($licenseKey, ENT_QUOTES, 'UTF-8');
    $safePlan = htmlspecialchars($plan, ENT_QUOTES, 'UTF-8');
    $embedUrl = $CP['site_url'] . '/embed/';
    $from = $CP['mail_from'];
    $subject = 'Your CalculatePilot White-Label License is Active';

    $html = '<!doctype html><html><body style="font-family:Arial,sans-serif;color:#14171A;line-height:1.55">'
        . '<h2>Your CalculatePilot White-Label License is Active</h2>'
        . '<p>Thank you for subscribing to CalculatePilot Pro (' . $safePlan . '). Your license is ready to use.</p>'
        . '<p><strong>Activation key</strong></p>'
        . '<p style="font-family:monospace;font-size:20px;padding:14px;background:#EAF4F1;border-radius:6px;display:inline-block">' . $safeKey . '</p>'
        . '<p>Open <a href="' . htmlspecialchars($embedUrl, ENT_QUOTES, 'UTF-8') . '">CalculatePilot embeds</a>, enter this key in the license section, and copy your white-label embed code.</p>'
        . '<p>Your key stays the same while your subscription remains eligible for access. If you need help, contact <a href="mailto:' . htmlspecialchars($from, ENT_QUOTES, 'UTF-8') . '">' . htmlspecialchars($from, ENT_QUOTES, 'UTF-8') . '</a>.</p>'
        . '</body></html>';

    $text = "Your CalculatePilot White-Label License is Active\r\n\r\n"
        . 'Thank you for subscribing to CalculatePilot Pro (' . $plan . "). Your license is ready to use.\r\n\r\n"
        . 'Activation key: ' . $licenseKey . "\r\n\r\n"
        . 'Open ' . $embedUrl . " , enter this key in the license section, and copy your white-label embed code.\r\n\r\n"
        . 'Your key stays the same while your subscription remains eligible for access. If you need help, contact ' . $from . ".\r\n";

    $boundary = 'cp_' . bin2hex(random_bytes(12));
    $domain = substr((string) strrchr($from, '@'), 1);
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
        'From: ' . $CP['mail_name'] . ' <' . $from . '>',
        'Reply-To: ' . $from,
        'Message-ID: <' . bin2hex(random_bytes(16)) . '@' . $domain . '>',
        'Date: ' . date('r'),
        'X-Auto-Response-Suppress: OOF, AutoReply',
    ];
    $body = '--' . $boundary . "\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n" . $text
        . "\r\n--" . $boundary . "\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n" . $html
        . "\r\n--" . $boundary . "--\r\n";

    if (cp_smtp_send($email, $subject, $headers, $body)) {
        $GLOBALS['cp_mail_transport'] = 'smtp';
        return true;
    }

    // Fallback: PHP mail() with the envelope sender on our own domain (-f), then without it if the host rejects it.
    $joined = implode("\r\n", $headers);
    $sent = @mail($email, $subject, $body, $joined, '-f' . $from);
    if (!$sent) {
        $sent = @mail($email, $subject, $body, $joined);
    }
    if ($sent) {
        $GLOBALS['cp_mail_transport'] = 'mail()';
    }
    return $sent;
}
