/* CalculatePilot pricing page: billing tabs, Creem checkout and license check. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var billing = 'yearly';
  var DATA = {
    yearly: ['$89.99', '/ year (billed annually)', 'Equivalent to ~$7.50/mo. Or pay $7.99/month on regular billing.'],
    monthly: ['$7.99', '/ month (flexible billing)', 'Billed month-to-month. Cancel anytime.']
  };
  var ON = 'px-4 py-1.5 rounded-lg bg-text-primary text-surface-card shadow-sm font-label-md text-label-md transition-all font-semibold flex items-center gap-1.5';
  var OFF = 'px-4 py-1.5 rounded-lg font-label-md text-label-md text-text-secondary transition-all font-medium flex items-center gap-1.5';

  function setBilling(cycle) {
    billing = cycle;
    ['monthly', 'yearly'].forEach(function (c) {
      var btn = $('#' + c + 'Btn');
      btn.className = c === cycle ? ON : OFF;
      btn.setAttribute('aria-selected', c === cycle ? 'true' : 'false');
    });
    $('#priceDisplay').textContent = DATA[cycle][0];
    $('#cycleDisplay').textContent = DATA[cycle][1];
    $('#priceSubtext').textContent = DATA[cycle][2];
  }
  ['monthly', 'yearly'].forEach(function (c) {
    $('#' + c + 'Btn').addEventListener('click', function () { setBilling(c); });
  });

  // Creem checkout
  var pay = $('#payNowBtn');
  pay.addEventListener('click', function () {
    var original = pay.innerHTML;
    pay.disabled = true;
    pay.textContent = 'Opening secure checkout…';
    fetch('/api/create-creem-checkout.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: billing })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.ok || !data.checkout_url) throw new Error(data.error || 'Unable to start checkout.');
      window.location.href = data.checkout_url;
    }).catch(function (err) {
      alert(err.message || 'Unable to start checkout. Please try again.');
      pay.disabled = false;
      pay.innerHTML = original;
    });
  });

  // License check (same server-side validation as the embed page)
  var form = $('#licenseForm'), input = $('#licenseKeyInput'), msg = $('#verifyMessage');
  function show(ok, text) {
    msg.className = 'mt-4 pt-4 border-t border-border-subtle flex items-center gap-2 font-body-sm text-body-sm ' + (ok ? 'text-primary' : 'text-error');
    msg.innerHTML = '<span class="material-symbols-outlined text-[18px] check-fill">' + (ok ? 'check_circle' : 'error') + '</span><span></span>';
    msg.lastChild.textContent = text;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var key = input.value.trim().toUpperCase();
    if (!key) { show(false, 'Please enter your license key.'); return; }
    input.disabled = true;
    fetch('/api/validate-license.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key })
    }).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.valid) { show(false, data.message || 'This license is not active.'); return; }
      try { localStorage.setItem('cp_license_validated', key); } catch (err) {}
      show(true, 'License active. Your embed codes on the embed page will be white-label on this browser.');
    }).catch(function () {
      show(false, 'Unable to verify the license right now. Please try again.');
    }).then(function () { input.disabled = false; });
  });
})();
