/* CalculatePilot core pages (about, methodology, privacy, terms, embed) - small progressive-enhancement layer. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Privacy page: open the consent control created by consent.js
  $$('[data-cp-consent]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var manage = document.getElementById('cp-consent-manage');
      if (manage) { manage.click(); }
      else if (window.localStorage) {
        try { window.localStorage.removeItem('calculatepilot_analytics_consent_v1'); } catch (e) {}
        window.location.reload();
      }
    });
  });

  // Highlight the active section in sticky tables of contents
  var tocLinks = $$('[data-toc] a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.remove('text-primary', 'bg-surface-accent', 'font-semibold'); });
        var a = map[en.target.id];
        if (a) a.classList.add('text-primary', 'bg-surface-accent', 'font-semibold');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  // ---------- Embed page ----------
  var directory = $('#calculator-directory');
  if (!directory) return;

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'), m = $('#toastMessage');
    if (!t || !m) return;
    m.textContent = msg;
    t.classList.remove('translate-y-24', 'opacity-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('translate-y-24', 'opacity-0'); }, 2600);
  }

  // Plan toggle. Checkout (startCreemCheckout) and server-side license validation
  // (applyLicense, restoreVerifiedLicense) are injected by embed/index.php.
  var plan = 'monthly';
  window.currentPlan = plan;
  var PLANS = { monthly: ['$7.99', 'per month'], yearly: ['$89.99', 'per year'] };
  $$('.plan-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      plan = tab.getAttribute('data-plan');
      window.currentPlan = plan;
      $$('.plan-tab').forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.classList.toggle('bg-primary', on);
        t.classList.toggle('text-on-primary', on);
        t.classList.toggle('text-text-secondary', !on);
      });
      $('#planPrice').textContent = PLANS[plan][0];
      $('#planPer').textContent = PLANS[plan][1];
    });
  });

  var payBtn = $('#payNowBtn');
  if (payBtn) payBtn.addEventListener('click', function () { if (window.startCreemCheckout) window.startCreemCheckout(); });

  var status = $('#licenseStatus');
  window.setLicenseStatus = function (msg, ok) {
    status.textContent = msg;
    status.classList.toggle('text-primary', !!ok);
    status.classList.toggle('text-error', !ok);
  };
  var form = $('#licenseForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (window.applyLicense) window.applyLicense();
  });

  // Fill each card's iframe snippet
  // optional one-line listener: the widget reports its height so the iframe fits the content
  var RESIZE = '<script>addEventListener("message",function(e){if(e.origin==="https://www.calculatepilot.com"&&e.data&&e.data.cpEmbedHeight){document.querySelectorAll("iframe").forEach(function(f){if(f.contentWindow===e.source)f.style.height=e.data.cpEmbedHeight+"px"})}})<\/script>';
  $$('.calc-card').forEach(function (c) {
    var slug = c.querySelector('[data-preview]').getAttribute('data-preview').replace(/^\/embed\//, '').replace(/\.html$/, '');
    var title = c.querySelector('h3').textContent.trim().replace(/"/g, '&quot;');
    var h = c.getAttribute('data-h') || '1500';
    c.querySelector('.embed-code').textContent = '<iframe src="https://www.calculatepilot.com/embed/' + slug + '.html" width="100%" height="' + h + '" frameborder="0" scrolling="auto" title="' + title + '" loading="lazy"></iframe>\n' + RESIZE;
  });

  // Copy code
  directory.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var code = btn.closest('.calc-card').querySelector('.embed-code').textContent;
    var done = function () {
      var label = btn.querySelector('span:last-child');
      var old = label.textContent;
      label.textContent = 'Copied!';
      toast('Embed code copied to clipboard!');
      setTimeout(function () { label.textContent = old; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done);
    else {
      var ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) {}
      document.body.removeChild(ta);
    }
  });

  // Category filter + search
  var cat = 'all';
  var cards = $$('.calc-card');
  var search = $('#embedSearch');
  var empty = $('#noResults');
  function filter() {
    var q = search.value.toLowerCase().trim(), shown = 0;
    cards.forEach(function (c) {
      var ok = (cat === 'all' || c.getAttribute('data-category') === cat) && (!q || c.getAttribute('data-name').indexOf(q) > -1);
      c.classList.toggle('hidden', !ok);
      if (ok) shown++;
    });
    empty.classList.toggle('hidden', shown > 0);
  }
  $$('.category-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      cat = b.getAttribute('data-cat');
      $$('.category-btn').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('active', on);
        x.classList.toggle('bg-text-primary', on);
        x.classList.toggle('text-white', on);
        x.classList.toggle('bg-surface-subtle', !on);
        x.classList.toggle('text-text-secondary', !on);
      });
      filter();
    });
  });
  search.addEventListener('input', filter);

  // Preview modal
  var prev = $('#previewModal'), frame = $('#modalFrame');
  function closePreview() { prev.classList.add('hidden'); frame.setAttribute('src', 'about:blank'); document.body.style.overflow = ''; }
  directory.addEventListener('click', function (e) {
    var b = e.target.closest('[data-preview]');
    if (!b) return;
    $('#modalTitle').textContent = b.closest('.calc-card').querySelector('h3').textContent.trim() + ' preview';
    frame.setAttribute('src', b.getAttribute('data-preview'));
    frame.style.height = '70vh';
    prev.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  $$('[data-close-preview]').forEach(function (b) { b.addEventListener('click', closePreview); });
  prev.addEventListener('click', function (e) { if (e.target === prev) closePreview(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!prev.classList.contains('hidden')) closePreview();
  });
})();
