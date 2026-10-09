<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

try {
    cp_require_post();
    cp_rate_limit('checkout', 10, 3600);
    $data = cp_request_json();
    $plan = $data['plan'] ?? '';
    if (!in_array($plan, ['monthly', 'yearly'], true)) {
        cp_json(['error' => 'Invalid plan.'], 422);
    }

    $productId = $plan === 'monthly' ? $CP['creem_monthly_product_id'] : $CP['creem_yearly_product_id'];
    if ($CP['creem_api_key'] === '' || $productId === '') {
        cp_json(['error' => 'Checkout is not configured yet. Please contact support.'], 503);
    }

    if (!function_exists('curl_init')) {
        cp_json(['error' => 'Server configuration error: PHP cURL is not enabled.'], 500);
    }

    $requestId = cp_random_id('cp_');
    $stmt = cp_db()->prepare('INSERT INTO cp_checkout_requests (request_id, plan) VALUES (?, ?)');
    $stmt->execute([$requestId, $plan]);

    $payload = [
        'product_id' => $productId,
        'request_id' => $requestId,
        'success_url' => $CP['site_url'] . '/embed/payment-success.php',
        'metadata' => [
            'source' => 'calculatepilot_embed',
            'plan' => $plan,
            'request_id' => $requestId,
        ],
    ];

    $baseUrl = $CP['creem_test_mode'] ? 'https://test-api.creem.io/v1' : 'https://api.creem.io/v1';
    $ch = curl_init($baseUrl . '/checkouts');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . $CP['creem_api_key'],
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
    ]);
    $response = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    // NOTE: we deliberately respond with HTTP 200 here even on a Creem-side
    // failure. Cloudflare silently replaces the body of any 5xx response
    // from this origin with its own branded error page, which was masking
    // these errors during the last incident. The client checks the `ok`
    // field, not the HTTP status, to detect failure.
    if ($response === false || $status < 200 || $status >= 300) {
        error_log('Creem checkout error: HTTP ' . $status . ' ' . $error . ' ' . (string) $response);

        $creemBody = is_string($response) ? json_decode($response, true) : null;
        $creemMessage = is_array($creemBody) ? (string) ($creemBody['message'] ?? $creemBody['error'] ?? '') : '';

        if ($response === false) {
            $userError = 'Could not reach the payment provider. Please try again in a moment.';
        } elseif ($status === 401 || $status === 403) {
            $userError = 'Checkout is misconfigured (invalid API key). Please contact support.';
        } elseif ($status === 404) {
            $userError = 'Checkout is misconfigured (unknown product). Please contact support.';
        } elseif ($status >= 500) {
            $userError = 'The payment provider is temporarily unavailable. Please try again shortly.';
        } elseif ($creemMessage !== '') {
            $userError = $creemMessage;
        } else {
            $userError = 'Unable to create checkout. Please try again.';
        }

        cp_json(['ok' => false, 'error' => $userError], 200);
    }

    $result = json_decode($response, true);
    if (!is_array($result) || empty($result['checkout_url'])) {
        error_log('Unexpected Creem checkout response: ' . $response);
        cp_json(['ok' => false, 'error' => 'Unable to start checkout.'], 200);
    }

    cp_json([
        'ok' => true,
        'checkout_url' => $result['checkout_url'],
        'request_id' => $requestId,
    ]);
} catch (Throwable $e) {
    error_log('CalculatePilot checkout fatal error: ' . $e->getMessage());
    cp_json(['ok' => false, 'error' => 'Server configuration error while starting checkout.'], 200);
}
