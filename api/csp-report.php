<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

// Collects Content-Security-Policy violation reports (Report-Only rollout).
// Writes one sanitized line per report to the PHP error log (hPanel > Logs); nothing is stored in the web root.
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    exit;
}

cp_rate_limit('csp-report', 60, 600);

$raw = file_get_contents('php://input', false, null, 0, 16384);
$data = is_string($raw) ? json_decode($raw, true) : null;
if (!is_array($data)) {
    http_response_code(204);
    exit;
}

// Legacy "report-uri" format: {"csp-report": {...}}; Reporting API format: [{"type":"csp-violation","body":{...}}]
$reports = [];
if (isset($data['csp-report']) && is_array($data['csp-report'])) {
    $reports[] = $data['csp-report'];
} else {
    foreach ($data as $item) {
        if (is_array($item) && ($item['type'] ?? '') === 'csp-violation' && is_array($item['body'] ?? null)) {
            $reports[] = $item['body'];
        }
    }
}

$clean = static fn($v): string => substr(preg_replace('/[^\x20-\x7E]/', '?', (string) $v) ?? '', 0, 300);
foreach (array_slice($reports, 0, 5) as $r) {
    error_log('CSP-REPORT ' . json_encode([
        'page' => $clean($r['document-uri'] ?? $r['documentURL'] ?? ''),
        'directive' => $clean($r['effective-directive'] ?? $r['effectiveDirective'] ?? $r['violated-directive'] ?? ''),
        'blocked' => $clean($r['blocked-uri'] ?? $r['blockedURL'] ?? ''),
        'source' => $clean($r['source-file'] ?? $r['sourceFile'] ?? ''),
        'line' => (int) ($r['line-number'] ?? $r['lineNumber'] ?? 0),
        'sample' => $clean($r['script-sample'] ?? $r['sample'] ?? ''),
    ], JSON_UNESCAPED_SLASHES));
}
http_response_code(204);
