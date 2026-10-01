<?php
declare(strict_types=1);
require dirname(__DIR__) . '/api/bootstrap.php';

// The success page is informational only. License activation is performed by the
// signed Creem webhook, never merely because a visitor reaches this URL.
$params = [
    'checkout_id' => (string) ($_GET['checkout_id'] ?? ''),
    'product_id' => (string) ($_GET['product_id'] ?? ''),
    'request_id' => (string) ($_GET['request_id'] ?? ''),
];
$hasPaymentReference = $params['checkout_id'] !== '' || $params['request_id'] !== '';
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Payment Received | CalculatePilot</title>
<link rel="stylesheet" href="/css/styles.css?v=3d1747f9">
<style>
.success-card{max-width:680px;margin:72px auto;padding:32px;border:1px solid var(--line);border-radius:12px;background:var(--paper-raised)}
.success-card h1{margin-bottom:12px}.success-card p{margin:10px 0;color:var(--slate)}
.success-card .btn{display:inline-block;margin-top:18px;background:var(--signal);color:#fff;padding:11px 18px;border-radius:6px;text-decoration:none;font-weight:700}
</style>
</head>
<body>
<main class="content-block"><div class="container"><div class="success-card">
<h1><?php echo $hasPaymentReference ? 'Payment received' : 'Thank you'; ?></h1>
<p>We are confirming your subscription securely with Creem.</p>
<p>Your activation key is generated only after the signed payment webhook confirms the subscription. Once confirmed, it is automatically sent to the email address used during checkout.</p>
<p>If you do not receive the email shortly, please check your spam folder, or request it again below. You can also contact help@calculatepilot.com.</p>
<form id="resendForm" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><input type="email" id="resendEmail" required maxlength="255" placeholder="Email used at checkout" aria-label="Email used at checkout" style="flex:1;min-width:220px;padding:10px;border:1px solid var(--line);border-radius:6px;font-size:1rem"><button type="submit" class="btn" style="margin-top:0;border:0;cursor:pointer;font-size:1rem">Resend my key</button></form>
<p id="resendStatus" style="margin-top:10px;font-weight:600" aria-live="polite"></p>
<a class="btn" href="/embed/">Back to calculator embeds →</a>
</div></div></main>
<script src="/js/cp-resend.js?v=20261001a" defer></script>
</body>
</html>
