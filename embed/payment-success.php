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
<p>If you do not receive the email shortly, please check your spam folder and then contact help@calculatepilot.com.</p>
<a class="btn" href="/embed/">Back to calculator embeds →</a>
</div></div></main>
</body>
</html>
