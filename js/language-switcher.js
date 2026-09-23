/* CalculatePilot language switcher
 * Injects the same header dropdown + footer pills on every page
 * (English root and /es /fr /de). Does not auto-redirect.
 * Only links to locale URLs that actually exist; otherwise the locale home.
 */
(function () {
  'use strict';
  if (window.__cpLangInit) return;
  window.__cpLangInit = true;

  var locales = [
    { code: 'en', label: 'English', short: 'EN', flag: '\uD83C\uDDFA\uD83C\uDDF8', prefix: '' },
    { code: 'es', label: 'Espa\u00f1ol', short: 'ES', flag: '\uD83C\uDDEA\uD83C\uDDF8', prefix: '/es' },
    { code: 'fr', label: 'Fran\u00e7ais', short: 'FR', flag: '\uD83C\uDDEB\uD83C\uDDF7', prefix: '/fr' },
    { code: 'de', label: 'Deutsch', short: 'DE', flag: '\uD83C\uDDE9\uD83C\uDDEA', prefix: '/de' }
  ];

  var TRANSLATED = {
    '/': 1,
    '/index.html': 1,
    '/financial-calculators.html': 1,
    '/health-calculators.html': 1,
    '/math-calculators.html': 1,
    '/other-calculators.html': 1,
    '/financial/401k-calculator.html': 1,
    '/financial/amortization-calculator.html': 1,
    '/financial/annuity-calculator.html': 1,
    '/financial/auto-loan-calculator.html': 1,
    '/financial/bond-calculator.html': 1,
    '/financial/budget-calculator.html': 1,
    '/financial/car-affordability-calculator.html': 1,
    '/financial/cd-calculator.html': 1,
    '/financial/college-savings-calculator.html': 1,
    '/financial/commission-calculator.html': 1,
    '/financial/compound-interest-calculator.html': 1,
    '/financial/credit-card-calculator.html': 1,
    '/financial/credit-utilization-calculator.html': 1,
    '/financial/debt-payoff-calculator.html': 1,
    '/financial/debt-to-income-ratio-calculator.html': 1,
    '/financial/investment-calculator.html': 1,
    '/financial/lease-calculator.html': 1,
    '/financial/loan-calculator.html': 1,
    '/financial/mortgage-calculator.html': 1,
    '/financial/net-worth-calculator.html': 1,
    '/financial/retirement-calculator.html': 1,
    '/financial/savings-calculator.html': 1,
    '/guides/': 1,
    '/guides/index.html': 1,
    '/guides/bmi-calculator-guide.html': 1,
    '/guides/mortgage-calculator-guide.html': 1,
    '/health/bac-calculator.html': 1,
    '/health/bmi-calculator.html': 1,
    '/health/bmr-calculator.html': 1,
    '/health/calorie-calculator.html': 1,
    '/health/macro-calculator.html': 1,
    '/math/area-calculator.html': 1,
    '/math/basic-calculator.html': 1,
    '/math/percentage-calculator.html': 1,
    '/math/quadratic-formula-calculator.html': 1,
    '/math/weighted-average-calculator.html': 1,
    '/other/age-calculator.html': 1,
    '/other/date-calculator.html': 1,
    '/other/flight-time-calculator.html': 1,
    '/other/gpa-calculator.html': 1,
    '/other/tip-calculator.html': 1
  };

  var path = window.location.pathname || '/';
  var current = locales[0];
  locales.slice(1).some(function (locale) {
    if (path === locale.prefix || path.indexOf(locale.prefix + '/') === 0) {
      current = locale;
      return true;
    }
    return false;
  });

  function englishPath() {
    var cleanPath = path;
    if (current.prefix && (cleanPath === current.prefix || cleanPath.indexOf(current.prefix + '/') === 0)) {
      cleanPath = cleanPath.slice(current.prefix.length) || '/';
    }
    if (cleanPath.charAt(0) !== '/') cleanPath = '/' + cleanPath;
    return cleanPath;
  }

  function hasTranslation(cleanPath) {
    if (TRANSLATED[cleanPath]) return true;
    if (cleanPath.length > 1 && cleanPath.slice(-1) === '/') {
      return !!(TRANSLATED[cleanPath] || TRANSLATED[cleanPath + 'index.html']);
    }
    return false;
  }

  function localizedUrl(locale) {
    var cleanPath = englishPath();
    var target;
    if (!locale.prefix) {
      target = cleanPath;
    } else if (hasTranslation(cleanPath)) {
      target = locale.prefix + (cleanPath === '/' ? '/' : cleanPath);
    } else {
      target = locale.prefix + '/';
    }
    if (target === '') target = '/';
    return target + (window.location.search || '') + (window.location.hash || '');
  }

  function pruneBrokenHreflang() {
    var tags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    if (!tags.length) return;
    var cleanPath = englishPath();
    tags.forEach(function (tag) {
      var lang = (tag.getAttribute('hreflang') || '').toLowerCase();
      if (lang === 'x-default' || lang === 'en') return;
      if (!hasTranslation(cleanPath)) tag.parentNode && tag.parentNode.removeChild(tag);
    });
  }

  function injectStyles() {
    if (document.getElementById('cp-lang-css')) return;
    var style = document.createElement('style');
    style.id = 'cp-lang-css';
    style.textContent = [
      '.site-header .lang-switch{position:relative;margin-left:12px;margin-right:10px;flex-shrink:0;z-index:60}',
      '.lang-switch-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 10px;border:1px solid var(--line,#E5E7EB);border-radius:10px;background:#fff;color:var(--ink,#14171A);font:600 12px var(--font-body,Inter,sans-serif);letter-spacing:.04em;cursor:pointer}',
      '.lang-switch-btn:hover,.lang-switch-btn[aria-expanded="true"]{border-color:var(--signal,#1A7A5E);color:var(--signal-dark,#13613B)}',
      '.lang-globe{display:inline-flex;width:16px;height:16px}',
      '.lang-globe svg{width:16px;height:16px}',
      '.lang-caret{color:var(--slate,#6B7280);font-size:11px}',
      '.lang-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:168px;margin:0;padding:6px;list-style:none;background:#fff;border:1px solid var(--line,#E5E7EB);border-radius:12px;box-shadow:0 8px 24px rgba(20,23,26,.08);z-index:70}',
      '.lang-menu a{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;color:var(--ink,#14171A);font-size:13px;text-decoration:none}',
      '.lang-menu a:hover,.lang-menu a[aria-current="true"]{background:var(--signal-soft,#E8F5F0);color:var(--signal-dark,#13613B);text-decoration:none}',
      '.lang-menu a[aria-current="true"]{font-weight:600}',
      '.footer-langs{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.footer-langs a{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:8px;border:1px solid var(--line,#E5E7EB);background:#fff;color:var(--slate,#6B7280);font-size:11px;font-weight:700;text-decoration:none}',
      '.footer-langs a span{font-weight:500}',
      '.footer-langs a:hover,.footer-langs a[aria-current="true"]{border-color:var(--signal,#1A7A5E);color:var(--signal-dark,#13613B);background:var(--signal-soft,#E8F5F0);text-decoration:none}',
      '.site-footer .footer-langs{margin-top:16px}',
      '.footer-bottom .footer-langs{margin-top:0}',
      '@media (max-width:720px){.site-header .lang-switch{margin-right:8px}.lang-switch-btn{padding:0 8px}}',
      '@media (max-width:520px){.footer-langs a span{display:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function headerHTML() {
    var items = locales.map(function (locale) {
      var currentAttr = locale.code === current.code ? ' aria-current="true"' : '';
      return '<li><a href="' + localizedUrl(locale) + '" hreflang="' + locale.code + '" data-lang="' + locale.code + '"' + currentAttr + '>' + locale.flag + ' ' + locale.label + '</a></li>';
    }).join('');
    return (
      '<button class="lang-switch-btn" type="button" aria-expanded="false" aria-haspopup="listbox" aria-label="Change language">' +
        '<span class="lang-globe" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg></span>' +
        '<span class="lang-current">' + current.short + '</span>' +
        '<span class="lang-caret" aria-hidden="true">\u25BE</span>' +
      '</button>' +
      '<ul class="lang-menu" role="listbox" hidden>' + items + '</ul>'
    );
  }

  function footerHTML() {
    return locales.map(function (locale) {
      var currentAttr = locale.code === current.code ? ' aria-current="true"' : '';
      return '<a href="' + localizedUrl(locale) + '" hreflang="' + locale.code + '" data-lang="' + locale.code + '"' + currentAttr + '>' + locale.short + ' <span>' + locale.label + '</span></a>';
    }).join('');
  }

  function ensureHeader() {
    var container = document.querySelector('.site-header .container');
    if (!container) return null;
    var oldSelect = container.querySelector('.cp-language-selector:not(.lang-switch)');
    if (oldSelect) oldSelect.remove();
    var root = container.querySelector('.lang-switch');
    if (!root) {
      root = document.createElement('div');
      root.className = 'lang-switch cp-language-selector';
      root.setAttribute('data-lang-switch', '');
      var tools = container.querySelector('.header-tools');
      var toggle = container.querySelector('.nav-toggle');
      if (tools) container.insertBefore(root, tools);
      else if (toggle) container.insertBefore(root, toggle);
      else container.appendChild(root);
    }
    root.innerHTML = headerHTML();
    var label = root.querySelector('.lang-current');
    if (label) label.textContent = current.short;
    return root;
  }

  function ensureFooter() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return null;
    var root = footer.querySelector('.footer-langs');
    if (!root) {
      root = document.createElement('nav');
      root.className = 'footer-langs';
      root.setAttribute('data-lang-switch', '');
      root.setAttribute('aria-label', 'Language');
      var bottom = footer.querySelector('.footer-bottom');
      if (bottom) bottom.appendChild(root);
      else {
        var box = footer.querySelector('.container') || footer;
        box.appendChild(root);
      }
    }
    root.innerHTML = footerHTML();
    return root;
  }

  function bindHeader(root) {
    if (!root) return;
    var btn = root.querySelector('.lang-switch-btn');
    var menu = root.querySelector('.lang-menu');
    if (!btn || !menu) return;
    function close() {
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    function open() {
      menu.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
    }
    if (btn.getAttribute('data-bound') === '1') return;
    btn.setAttribute('data-bound', '1');
    btn.addEventListener('click', function (event) {
      event.stopPropagation();
      if (menu.hidden) open();
      else close();
    });
    document.addEventListener('click', function (event) {
      if (!root.contains(event.target)) close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });
  }

  function init() {
    injectStyles();
    pruneBrokenHreflang();
    bindHeader(ensureHeader());
    ensureFooter();
  }

  window.__cpMountLanguage = init;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
