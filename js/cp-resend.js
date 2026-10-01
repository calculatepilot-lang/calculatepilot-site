/* "Resend my key" form (embed page, pricing page, payment success page). */
(function () {
  'use strict';
  var form = document.getElementById('resendForm');
  if (!form) return;
  var toggle = document.getElementById('resendToggle');
  var input = document.getElementById('resendEmail');
  var status = document.getElementById('resendStatus');
  if (toggle) toggle.addEventListener('click', function () { form.classList.remove('hidden'); input.focus(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim();
    if (!email) return;
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    function show(ok, text) {
      status.textContent = text;
      status.classList.toggle('text-primary', ok);
      status.classList.toggle('text-error', !ok);
      status.style.color = ok ? '#1A7A5E' : '#B3261E';
    }
    fetch('/api/resend-license.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    }).then(function (r) { return r.json(); }).then(function (d) {
      show(!!d.ok, d.message || 'Please try again.');
    }).catch(function () {
      show(false, 'Could not send right now. Please email help@calculatepilot.com.');
    }).then(function () { btn.disabled = false; });
  });
})();
