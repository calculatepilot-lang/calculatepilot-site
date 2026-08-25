<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

$raw = file_get_contents('php://input');
$signature = $_SERVER['HTTP_CREEM_SIGNATURE'] ?? '';
if ($raw === false || $signature === '' || $CP['creem_webhook_secret'] === '') {
    http_response_code(401);
    exit('Unauthorized');
}

$expected = hash_hmac('sha256', $raw, $CP['creem_webhook_secret']);
if (!hash_equals($expected, trim($signature))) {
    http_response_code(401);
    exit('Invalid signature');
}

$event = json_decode($raw, true);
if (!is_array($event) || empty($event['id']) || empty($event['eventType'])) {
    http_response_code(400);
    exit('Invalid event');
}

$eventId = (string) $event['id'];
$eventType = (string) $event['eventType'];
$object = is_array($event['object'] ?? null) ? $event['object'] : [];

function cp_date_or_null(mixed $value): ?string
{
    if (!is_string($value) || trim($value) === '') {
        return null;
    }
    $timestamp = strtotime($value);
    return $timestamp === false ? null : gmdate('Y-m-d H:i:s', $timestamp);
}

function cp_product_id(array $object): ?string
{
    if (is_array($object['product'] ?? null) && !empty($object['product']['id'])) {
        return (string) $object['product']['id'];
    }
    if (is_string($object['product'] ?? null)) {
        return $object['product'];
    }
    if (is_array($object['order'] ?? null) && !empty($object['order']['product'])) {
        return (string) $object['order']['product'];
    }
    if (is_array($object['items'] ?? null) && !empty($object['items'][0]['product_id'])) {
        return (string) $object['items'][0]['product_id'];
    }
    return null;
}

function cp_customer(array $object): array
{
    if (is_array($object['customer'] ?? null)) {
        return [
            'id' => (string) ($object['customer']['id'] ?? ''),
            'email' => (string) ($object['customer']['email'] ?? ''),
        ];
    }
    return ['id' => '', 'email' => ''];
}

function cp_plan_from_product(?string $productId): string
{
    global $CP;
    if ($productId !== null && $productId === $CP['creem_yearly_product_id']) {
        return 'yearly';
    }
    return 'monthly';
}

$pdo = cp_db();
try {
    $pdo->beginTransaction();
    $insertEvent = $pdo->prepare('INSERT INTO cp_webhook_events (creem_event_id, event_type, payload) VALUES (?, ?, ?)');
    try {
        $insertEvent->execute([$eventId, $eventType, $raw]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            $pdo->rollBack();
            http_response_code(200);
            exit('Already processed');
        }
        throw $e;
    }

    $subscriptionId = (string) ($object['id'] ?? ($object['subscription']['id'] ?? ''));
    if ($eventType === 'checkout.completed' && is_array($object['subscription'] ?? null)) {
        $subscriptionId = (string) ($object['subscription']['id'] ?? $subscriptionId);
    }
    $productId = cp_product_id($object);
    if ($eventType === 'checkout.completed' && $productId === null && is_array($object['subscription'] ?? null)) {
        $productId = cp_product_id($object['subscription']);
    }
    $customer = cp_customer($object);
    if ($customer['email'] === '' && is_array($object['subscription'] ?? null)) {
        $customer = cp_customer($object['subscription']);
    }

    $license = null;
    if ($subscriptionId !== '') {
        $find = $pdo->prepare('SELECT * FROM cp_licenses WHERE subscription_id = ? LIMIT 1 FOR UPDATE');
        $find->execute([$subscriptionId]);
        $license = $find->fetch() ?: null;
    }

    if ($eventType === 'subscription.paid') {
        if ($subscriptionId === '' || !filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Paid subscription event is missing subscription or customer data.');
        }

        $plan = cp_plan_from_product($productId);
        $periodEnd = cp_date_or_null($object['current_period_end_date'] ?? null);
        $newLicense = false;

        if ($license === null) {
            for ($attempt = 0; $attempt < 5; $attempt++) {
                $key = cp_generate_license_key();
                try {
                    $create = $pdo->prepare('INSERT INTO cp_licenses (license_key, customer_email, customer_id, subscription_id, product_id, plan, status, access_until, current_period_end) VALUES (?, ?, ?, ?, ?, ?, \'active\', ?, ?)');
                    $create->execute([$key, $customer['email'], $customer['id'] ?: null, $subscriptionId, $productId, $plan, $periodEnd, $periodEnd]);
                    $newLicense = true;
                    $license = [
                        'license_key' => $key,
                        'customer_email' => $customer['email'],
                        'plan' => $plan,
                    ];
                    break;
                } catch (PDOException $e) {
                    if (($e->errorInfo[1] ?? null) !== 1062 || $attempt === 4) {
                        throw $e;
                    }
                }
            }
        } else {
            $update = $pdo->prepare('UPDATE cp_licenses SET customer_email = ?, customer_id = ?, product_id = ?, plan = ?, status = \'active\', access_until = ?, current_period_end = ? WHERE subscription_id = ?');
            $update->execute([$customer['email'], $customer['id'] ?: null, $productId, $plan, $periodEnd, $periodEnd, $subscriptionId]);
            $license['customer_email'] = $customer['email'];
            $license['plan'] = $plan;
        }

        $pdo->commit();

        if ($newLicense && $license !== null) {
            $sent = cp_send_license_email($license['customer_email'], $license['license_key'], ucfirst($license['plan']));
            if ($sent) {
                $mark = cp_db()->prepare('UPDATE cp_licenses SET emailed_at = UTC_TIMESTAMP() WHERE subscription_id = ?');
                $mark->execute([$subscriptionId]);
            } else {
                error_log('CalculatePilot license email could not be accepted for delivery to ' . $license['customer_email']);
            }
        }

        http_response_code(200);
        exit('OK');
    }

    if ($subscriptionId !== '' && $license !== null) {
        $periodEnd = cp_date_or_null($object['current_period_end_date'] ?? null);
        if ($eventType === 'subscription.scheduled_cancel') {
            $update = $pdo->prepare('UPDATE cp_licenses SET status = \'canceled\', access_until = COALESCE(?, access_until), current_period_end = COALESCE(?, current_period_end) WHERE subscription_id = ?');
            $update->execute([$periodEnd, $periodEnd, $subscriptionId]);
        } elseif ($eventType === 'subscription.canceled') {
            $update = $pdo->prepare('UPDATE cp_licenses SET status = \'canceled\', access_until = COALESCE(?, access_until), current_period_end = COALESCE(?, current_period_end) WHERE subscription_id = ?');
            $update->execute([$periodEnd, $periodEnd, $subscriptionId]);
        } elseif ($eventType === 'subscription.paused') {
            $update = $pdo->prepare('UPDATE cp_licenses SET status = \'paused\' WHERE subscription_id = ?');
            $update->execute([$subscriptionId]);
        } elseif ($eventType === 'subscription.active' || $eventType === 'subscription.trialing') {
            $update = $pdo->prepare('UPDATE cp_licenses SET status = \'active\', current_period_end = COALESCE(?, current_period_end) WHERE subscription_id = ?');
            $update->execute([$periodEnd, $subscriptionId]);
        } elseif ($eventType === 'subscription.update') {
            $status = (string) ($object['status'] ?? 'active');
            $allowed = ['active', 'paused', 'canceled'];
            if (!in_array($status, $allowed, true)) {
                $status = 'active';
            }
            $update = $pdo->prepare('UPDATE cp_licenses SET status = ?, current_period_end = COALESCE(?, current_period_end) WHERE subscription_id = ?');
            $update->execute([$status, $periodEnd, $subscriptionId]);
        }
    }

    $pdo->commit();
    http_response_code(200);
    exit('OK');
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('CalculatePilot Creem webhook error: ' . $e->getMessage());
    http_response_code(500);
    exit('Temporary processing failure');
}
