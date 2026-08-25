-- CalculatePilot Creem subscription and white-label license tables
-- Run this once in the same MySQL/MariaDB database configured in api/config.local.php.

CREATE TABLE IF NOT EXISTS cp_licenses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    license_key VARCHAR(64) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_id VARCHAR(128) DEFAULT NULL,
    subscription_id VARCHAR(128) DEFAULT NULL,
    product_id VARCHAR(128) DEFAULT NULL,
    plan VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    access_until DATETIME DEFAULT NULL,
    current_period_end DATETIME DEFAULT NULL,
    emailed_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cp_license_key (license_key),
    UNIQUE KEY uq_cp_subscription_id (subscription_id),
    KEY idx_cp_customer_email (customer_email),
    KEY idx_cp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_webhook_events (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    creem_event_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cp_creem_event_id (creem_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cp_checkout_requests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    request_id VARCHAR(128) NOT NULL,
    plan VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cp_request_id (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
