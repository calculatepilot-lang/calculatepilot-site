<?php
declare(strict_types=1);

// Keep the existing calculator directory page as the source of layout/content,
// but remove the legacy NOWPayments modal at runtime and attach the Creem flow.
$source = __DIR__ . '/index.html';
$html = is_file($source) ? file_get_contents($source) : false;
if ($html === false) {
    http_response_code(500);
    exit('Unable to load the embed page.');
}

$html = preg_replace(
    '~<!-- Payment modal -->.*?<!-- License key entry \(for Pro users\) -->~s',
    '<!-- License key entry (for Pro users) -->',
    $html,
    1
) ?? $html;

$html = str_replace('onclick="openPayModal()"', 'onclick="startCreemCheckout()"', $html);
$html = str_replace(
    'Pay with Bitcoin, USDT, ETH, SOL, BNB, XRP, DOGE & 50+ more.<br>License key issued within 24 hours.',
    'Secure checkout through Creem.<br>Your license key is automatically emailed after payment confirmation.',
    $html
);

$script = <<<'HTML'
<script>
// ---------- Creem checkout ----------
async function startCreemCheckout() {
  const btn = document.getElementById('payNowBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Opening secure checkout…';
  try {
    const response = await fetch('/api/create-creem-checkout.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({plan: currentPlan})
    });
    const data = await response.json();
    if (!response.ok || !data.checkout_url) {
      throw new Error(data.error || 'Unable to start checkout.');
    }
    window.location.href = data.checkout_url;
  } catch (error) {
    alert(error.message || 'Unable to start checkout. Please try again.');
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ---------- Server-validated license application ----------
const CP_LICENSE_KEY = 'cp_license_validated';

function setLicenseStatus(message, ok) {
  const status = document.getElementById('licenseStatus');
  status.className = 'license-status ' + (ok ? 'ok' : 'err');
  status.textContent = message;
}

function updateEmbedCodesForLicensedUser(key) {
  document.querySelectorAll('.embed-code').forEach(el => {
    const original = el.textContent;
    el.textContent = original.replace(
      /src="https:\/\/www\.calculatepilot\.com\/embed\/([a-z0-9-]+)\.html(?:\?[^\"]*)?"/gi,
      'src="https://www.calculatepilot.com/embed/widget.php?calculator=$1&license=' + encodeURIComponent(key) + '"'
    );
  });
}

async function validateLicenseKey(key, showStatus) {
  const response = await fetch('/api/validate-license.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({license_key: key})
  });
  const data = await response.json();
  if (!response.ok || !data.valid) {
    if (showStatus) setLicenseStatus(data.message || 'This license is not active.', false);
    return false;
  }
  try { localStorage.setItem(CP_LICENSE_KEY, key); } catch (e) {}
  updateEmbedCodesForLicensedUser(key);
  if (showStatus) setLicenseStatus('✓ License verified. Your copied embed codes are now white-label.', true);
  return true;
}

window.applyLicense = async function applyLicense() {
  const input = document.getElementById('licenseInput');
  const key = input.value.trim().toUpperCase();
  if (!key) {
    setLicenseStatus('Please enter your license key.', false);
    return;
  }
  input.disabled = true;
  try {
    const valid = await validateLicenseKey(key, true);
    if (valid) input.value = key;
  } catch (error) {
    setLicenseStatus('Unable to verify the license right now. Please try again.', false);
  } finally {
    input.disabled = false;
  }
};

// Re-check any browser-saved key against the server. A stale or cancelled key
// is never trusted merely because it exists in localStorage.
(async function restoreVerifiedLicense() {
  let saved = '';
  try { saved = localStorage.getItem(CP_LICENSE_KEY) || ''; } catch (e) {}
  if (!saved) return;
  document.getElementById('licenseInput').value = saved;
  try {
    const valid = await validateLicenseKey(saved, false);
    if (valid) {
      setLicenseStatus('✓ License active. White-label embed codes are ready.', true);
    } else {
      try { localStorage.removeItem(CP_LICENSE_KEY); } catch (e) {}
      document.getElementById('licenseInput').value = '';
      setLicenseStatus('Your saved license is no longer active.', false);
    }
  } catch (error) {
    setLicenseStatus('Unable to verify your saved license right now.', false);
  }
})();
</script>
HTML;

$html = str_replace('</body>', $script . "\n</body>", $html);
header('Content-Type: text/html; charset=UTF-8');
echo $html;
