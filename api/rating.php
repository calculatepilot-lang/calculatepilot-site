<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

/**
 * Visitor star ratings for calculator pages.
 *   GET  /api/rating.php?slug=math/basic-calculator  -> {"count":N,"avg":4.6}
 *   POST /api/rating.php  {"slug":"math/basic-calculator","value":5}
 * One vote per visitor per calculator (re-voting replaces the earlier vote).
 * The table is created on first use, so no manual SQL is needed.
 */

function cp_rating_slug(string $slug): ?string
{
    $slug = strtolower(trim($slug));
    if (!preg_match('~^(financial|health|math|other)/[a-z0-9-]{2,80}$~', $slug)) {
        return null;
    }
    // Only real English calculator pages can be rated.
    return is_file(dirname(__DIR__) . '/' . $slug . '.html') ? $slug : null;
}

function cp_rating_table(PDO $db): void
{
    $db->exec('CREATE TABLE IF NOT EXISTS cp_ratings (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        slug VARCHAR(100) NOT NULL,
        voter_hash CHAR(64) NOT NULL,
        value TINYINT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_cp_rating_vote (slug, voter_hash),
        KEY idx_cp_rating_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
}

function cp_rating_summary(PDO $db, string $slug): array
{
    $st = $db->prepare('SELECT COUNT(*) AS c, AVG(value) AS a FROM cp_ratings WHERE slug = ?');
    $st->execute([$slug]);
    $row = $st->fetch() ?: ['c' => 0, 'a' => 0];
    $count = (int) $row['c'];
    return ['count' => $count, 'avg' => $count > 0 ? round((float) $row['a'], 1) : 0];
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'POST') {
        cp_rate_limit('rating', 30, 600);
        $data = cp_request_json();
        $slug = cp_rating_slug((string) ($data['slug'] ?? ''));
        $value = (int) ($data['value'] ?? 0);
        if ($slug === null || $value < 1 || $value > 5) {
            cp_json(['ok' => false, 'error' => 'Invalid rating.'], 422);
        }
        $db = cp_db();
        cp_rating_table($db);
        global $CP;
        $voter = hash_hmac('sha256', cp_client_ip() . '|' . substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200), 'cp-rating|' . (string) ($CP['db_pass'] ?? ''));
        $st = $db->prepare('INSERT INTO cp_ratings (slug, voter_hash, value) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE value = VALUES(value)');
        $st->execute([$slug, $voter, $value]);
        cp_json(['ok' => true] + cp_rating_summary($db, $slug));
    }

    $slug = cp_rating_slug((string) ($_GET['slug'] ?? ''));
    if ($slug === null) {
        cp_json(['ok' => false, 'error' => 'Unknown calculator.'], 404);
    }
    $db = cp_db();
    cp_rating_table($db);
    cp_json(['ok' => true] + cp_rating_summary($db, $slug));
} catch (Throwable $e) {
    cp_json(['ok' => false, 'error' => 'Ratings are temporarily unavailable.'], 503);
}
