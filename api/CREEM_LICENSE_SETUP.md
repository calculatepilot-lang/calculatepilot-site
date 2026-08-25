# CalculatePilot Creem subscription and license automation

## What this system does

1. A visitor chooses Monthly or Yearly on `/embed/`.
2. The site creates the correct Creem checkout session server-side.
3. Creem sends a signed webhook after a successful subscription payment.
4. `subscription.paid` creates one permanent-format `CPRO-...` license key for that subscription.
5. The key is stored in MySQL and automatically emailed to the customer.
6. Renewal payments keep the same key active and update the access period.
7. Cancellation keeps access until Creem's current period end; paused subscriptions are disabled.
8. The `/embed/` page validates keys with the server before generating white-label embed URLs.
9. Licensed URLs use `embed/widget.php`, which validates the subscription-backed key and removes the shared CalculatePilot branding footer server-side.

## 1. Create the Creem products

Create two recurring products in the same Creem mode you intend to test:

- Monthly: `$7.99`, recurring, every month.
- Yearly: `$89.99`, recurring, every year.

Copy both product IDs.

## 2. Create the database tables

Import:

`api/database/schema.sql`

into the MySQL/MariaDB database used by the website.

## 3. Add private configuration

On the production server, copy:

`api/config.local.php.example`

to:

`api/config.local.php`

Then set:

- database name, user and password;
- `CREEM_API_KEY`;
- `CREEM_WEBHOOK_SECRET`;
- `CREEM_MONTHLY_PRODUCT_ID`;
- `CREEM_YEARLY_PRODUCT_ID`;
- `CREEM_TEST_MODE`.

Do not commit `config.local.php`.

## 4. Configure Creem webhooks

In Creem, register the public HTTPS endpoint:

`https://www.calculatepilot.com/api/creem-webhook.php`

Use the matching webhook secret in `config.local.php`.

The endpoint verifies the `creem-signature` HMAC-SHA256 against the exact raw request body. It also records Creem event IDs uniquely, so retries cannot issue duplicate keys.

## 5. Test before production

Set `CREEM_TEST_MODE` to `true`, use Creem test products/API key, and complete a successful test subscription. Confirm that:

- checkout opens from `/embed/`;
- the signed webhook returns HTTP 200;
- one license row is created;
- one email is sent;
- entering the key on `/embed/` verifies it;
- copied code points to `embed/widget.php`;
- the widget has no CalculatePilot branding;
- a cancelled/paused key no longer receives new white-label access according to its subscription status.

Only then switch to live mode, use the live API key and live product IDs, register the production webhook, and set `CREEM_TEST_MODE` to `false`.

## Email note

The implementation uses PHP's `mail()` function with an HTML content type and configured From/Reply-To address. Verify that the hosting environment is configured to deliver PHP mail reliably. If it is not, replace `cp_send_license_email()` in `api/bootstrap.php` with the site's preferred authenticated SMTP or transactional email provider.
