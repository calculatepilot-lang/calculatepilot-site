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

  var TRANSLATED_BY = {
   "es": {
    "/financial-calculators.html": 1,
    "/financial/1031-exchange-calculator.html": 1,
    "/financial/401k-calculator.html": 1,
    "/financial/amortization-calculator.html": 1,
    "/financial/annuity-calculator.html": 1,
    "/financial/auto-loan-calculator.html": 1,
    "/financial/bond-calculator.html": 1,
    "/financial/budget-calculator.html": 1,
    "/financial/car-affordability-calculator.html": 1,
    "/financial/cd-calculator.html": 1,
    "/financial/cd-vs-hysa-calculator.html": 1,
    "/financial/college-savings-calculator.html": 1,
    "/financial/commission-calculator.html": 1,
    "/financial/compound-interest-calculator.html": 1,
    "/financial/credit-card-calculator.html": 1,
    "/financial/credit-utilization-calculator.html": 1,
    "/financial/currency-converter.html": 1,
    "/financial/debt-payoff-calculator.html": 1,
    "/financial/debt-to-income-ratio-calculator.html": 1,
    "/financial/discount-calculator.html": 1,
    "/financial/down-payment-calculator.html": 1,
    "/financial/emergency-fund-calculator.html": 1,
    "/financial/freelance-rate-calculator.html": 1,
    "/financial/heloc-calculator.html": 1,
    "/financial/house-affordability-calculator.html": 1,
    "/financial/house-flip-calculator.html": 1,
    "/financial/inflation-calculator.html": 1,
    "/financial/investment-calculator.html": 1,
    "/financial/lease-calculator.html": 1,
    "/financial/loan-calculator.html": 1,
    "/financial/mortgage-calculator.html": 1,
    "/financial/net-worth-calculator.html": 1,
    "/financial/paycheck-calculator.html": 1,
    "/financial/refinance-calculator.html": 1,
    "/financial/rent-calculator.html": 1,
    "/financial/rental-yield-calculator.html": 1,
    "/financial/retirement-calculator.html": 1,
    "/financial/roth-ira-calculator.html": 1,
    "/financial/salary-calculator.html": 1,
    "/financial/sales-tax-calculator.html": 1,
    "/financial/savings-calculator.html": 1,
    "/financial/savings-goal-calculator.html": 1,
    "/financial/scotland-lbtt-calculator.html": 1,
    "/financial/scotland-take-home-pay-calculator.html": 1,
    "/financial/seller-net-sheet-calculator.html": 1,
    "/financial/simple-interest-calculator.html": 1,
    "/financial/student-loan-calculator.html": 1,
    "/financial/tax-calculator.html": 1,
    "/financial/uk-mortgage-overpayment-calculator.html": 1,
    "/financial/uk-mortgage-repayment-calculator.html": 1,
    "/financial/uk-stamp-duty-calculator.html": 1,
    "/financial/uk-stamp-duty-comparison.html": 1,
    "/financial/uk-student-loan-repayment-calculator.html": 1,
    "/financial/uk-take-home-pay-calculator.html": 1,
    "/financial/vat-calculator.html": 1,
    "/financial/wales-ltt-calculator.html": 1,
    "/guides/bmi-calculator-guide.html": 1,
    "/guides/index.html": 1,
    "/health-calculators.html": 1,
    "/health/alcohol-calories-calculator.html": 1,
    "/health/bac-calculator.html": 1,
    "/health/blood-pressure-category-calculator.html": 1,
    "/health/bmi-calculator.html": 1,
    "/health/bmr-calculator.html": 1,
    "/health/body-fat-calculator.html": 1,
    "/health/body-frame-size-calculator.html": 1,
    "/health/calorie-calculator.html": 1,
    "/health/calories-burned-calculator.html": 1,
    "/health/due-date-calculator.html": 1,
    "/health/fiber-intake-calculator.html": 1,
    "/health/healthy-weight-range-calculator.html": 1,
    "/health/ideal-weight-calculator.html": 1,
    "/health/lean-body-mass-calculator.html": 1,
    "/health/macro-calculator.html": 1,
    "/health/one-rep-max-calculator.html": 1,
    "/health/ovulation-calculator.html": 1,
    "/health/pace-calculator.html": 1,
    "/health/period-calculator.html": 1,
    "/health/pregnancy-calorie-needs-calculator.html": 1,
    "/health/pregnancy-weight-gain-calculator.html": 1,
    "/health/protein-calculator.html": 1,
    "/health/steps-to-calories-calculator.html": 1,
    "/health/target-heart-rate-calculator.html": 1,
    "/health/tdee-calculator.html": 1,
    "/health/vo2max-calculator.html": 1,
    "/health/waist-to-height-ratio-calculator.html": 1,
    "/health/waist-to-hip-ratio-calculator.html": 1,
    "/health/water-intake-calculator.html": 1,
    "/health/weight-loss-calorie-calculator.html": 1,
    "/": 1,
    "/math-calculators.html": 1,
    "/math/area-calculator.html": 1,
    "/math/basic-calculator.html": 1,
    "/math/binary-calculator.html": 1,
    "/math/binomial-probability-calculator.html": 1,
    "/math/circle-calculator.html": 1,
    "/math/complex-number-calculator.html": 1,
    "/math/distance-3d-calculator.html": 1,
    "/math/exponent-calculator.html": 1,
    "/math/factorial-calculator.html": 1,
    "/math/fraction-calculator.html": 1,
    "/math/gcd-lcm-calculator.html": 1,
    "/math/log-calculator.html": 1,
    "/math/matrix-calculator.html": 1,
    "/math/mean-median-mode-calculator.html": 1,
    "/math/modulo-calculator.html": 1,
    "/math/number-base-converter.html": 1,
    "/math/number-to-words-calculator.html": 1,
    "/math/percent-error-calculator.html": 1,
    "/math/percentage-calculator.html": 1,
    "/math/permutation-combination-calculator.html": 1,
    "/math/polynomial-calculator.html": 1,
    "/math/prime-number-checker.html": 1,
    "/math/probability-calculator.html": 1,
    "/math/pythagorean-theorem-calculator.html": 1,
    "/math/quadratic-formula-calculator.html": 1,
    "/math/quartile-calculator.html": 1,
    "/math/random-number-generator.html": 1,
    "/math/ratio-calculator.html": 1,
    "/math/scientific-calculator.html": 1,
    "/math/scientific-notation-calculator.html": 1,
    "/math/sequence-calculator.html": 1,
    "/math/sig-fig-calculator.html": 1,
    "/math/slope-calculator.html": 1,
    "/math/standard-deviation-calculator.html": 1,
    "/math/triangle-calculator.html": 1,
    "/math/trigonometry-calculator.html": 1,
    "/math/vector-calculator.html": 1,
    "/math/volume-calculator.html": 1,
    "/math/weighted-average-calculator.html": 1,
    "/math/z-score-calculator.html": 1,
    "/other-calculators.html": 1,
    "/other/age-calculator.html": 1,
    "/other/base64-encode-decode.html": 1,
    "/other/break-even-calculator.html": 1,
    "/other/car-depreciation-calculator.html": 1,
    "/other/carbon-footprint-calculator.html": 1,
    "/other/commute-cost-calculator.html": 1,
    "/other/concrete-calculator.html": 1,
    "/other/conversion-calculator.html": 1,
    "/other/date-calculator.html": 1,
    "/other/density-calculator.html": 1,
    "/other/dice-roller.html": 1,
    "/other/dog-food-portion-calculator.html": 1,
    "/other/electricity-cost-calculator.html": 1,
    "/other/flight-time-calculator.html": 1,
    "/other/fuel-cost-calculator.html": 1,
    "/other/gas-mileage-calculator.html": 1,
    "/other/golf-handicap-calculator.html": 1,
    "/other/gpa-calculator.html": 1,
    "/other/grade-needed-calculator.html": 1,
    "/other/gravel-calculator.html": 1,
    "/other/height-calculator.html": 1,
    "/other/hours-calculator.html": 1,
    "/other/invoice-late-fee-calculator.html": 1,
    "/other/love-calculator.html": 1,
    "/other/lumber-board-feet-calculator.html": 1,
    "/other/markup-margin-calculator.html": 1,
    "/other/moving-cost-estimator.html": 1,
    "/other/mulch-calculator.html": 1,
    "/other/paint-calculator.html": 1,
    "/other/password-generator.html": 1,
    "/other/pet-age-calculator.html": 1,
    "/other/recipe-conversion-calculator.html": 1,
    "/other/roman-numeral-converter.html": 1,
    "/other/shipping-cost-calculator.html": 1,
    "/other/sleep-calculator.html": 1,
    "/other/speed-calculator.html": 1,
    "/other/square-footage-calculator.html": 1,
    "/other/tile-calculator.html": 1,
    "/other/time-calculator.html": 1,
    "/other/tip-calculator.html": 1,
    "/other/unit-price-calculator.html": 1,
    "/other/url-encode-decode.html": 1,
    "/other/utc-time-converter.html": 1,
    "/other/wedding-budget-calculator.html": 1,
    "/other/word-counter.html": 1
   },
   "fr": {
    "/financial-calculators.html": 1,
    "/financial/401k-calculator.html": 1,
    "/financial/amortization-calculator.html": 1,
    "/financial/annuity-calculator.html": 1,
    "/financial/auto-loan-calculator.html": 1,
    "/financial/bond-calculator.html": 1,
    "/financial/budget-calculator.html": 1,
    "/financial/car-affordability-calculator.html": 1,
    "/financial/cd-calculator.html": 1,
    "/financial/college-savings-calculator.html": 1,
    "/financial/commission-calculator.html": 1,
    "/financial/compound-interest-calculator.html": 1,
    "/financial/credit-card-calculator.html": 1,
    "/financial/credit-utilization-calculator.html": 1,
    "/financial/debt-payoff-calculator.html": 1,
    "/financial/debt-to-income-ratio-calculator.html": 1,
    "/financial/investment-calculator.html": 1,
    "/financial/lease-calculator.html": 1,
    "/financial/loan-calculator.html": 1,
    "/financial/mortgage-calculator.html": 1,
    "/financial/net-worth-calculator.html": 1,
    "/financial/retirement-calculator.html": 1,
    "/financial/savings-calculator.html": 1,
    "/guides/bmi-calculator-guide.html": 1,
    "/guides/index.html": 1,
    "/health-calculators.html": 1,
    "/health/bac-calculator.html": 1,
    "/health/bmi-calculator.html": 1,
    "/health/bmr-calculator.html": 1,
    "/health/calorie-calculator.html": 1,
    "/health/macro-calculator.html": 1,
    "/": 1,
    "/math-calculators.html": 1,
    "/math/area-calculator.html": 1,
    "/math/basic-calculator.html": 1,
    "/math/percentage-calculator.html": 1,
    "/math/quadratic-formula-calculator.html": 1,
    "/math/weighted-average-calculator.html": 1,
    "/other-calculators.html": 1,
    "/other/age-calculator.html": 1,
    "/other/date-calculator.html": 1,
    "/other/flight-time-calculator.html": 1,
    "/other/gpa-calculator.html": 1,
    "/other/tip-calculator.html": 1
   },
   "de": {
    "/financial-calculators.html": 1,
    "/financial/401k-calculator.html": 1,
    "/financial/amortization-calculator.html": 1,
    "/financial/annuity-calculator.html": 1,
    "/financial/auto-loan-calculator.html": 1,
    "/financial/bond-calculator.html": 1,
    "/financial/budget-calculator.html": 1,
    "/financial/car-affordability-calculator.html": 1,
    "/financial/cd-calculator.html": 1,
    "/financial/college-savings-calculator.html": 1,
    "/financial/commission-calculator.html": 1,
    "/financial/compound-interest-calculator.html": 1,
    "/financial/credit-card-calculator.html": 1,
    "/financial/credit-utilization-calculator.html": 1,
    "/financial/debt-payoff-calculator.html": 1,
    "/financial/debt-to-income-ratio-calculator.html": 1,
    "/financial/investment-calculator.html": 1,
    "/financial/lease-calculator.html": 1,
    "/financial/loan-calculator.html": 1,
    "/financial/mortgage-calculator.html": 1,
    "/financial/net-worth-calculator.html": 1,
    "/financial/retirement-calculator.html": 1,
    "/financial/savings-calculator.html": 1,
    "/guides/bmi-calculator-guide.html": 1,
    "/guides/index.html": 1,
    "/guides/mortgage-calculator-guide.html": 1,
    "/health-calculators.html": 1,
    "/health/bac-calculator.html": 1,
    "/health/bmi-calculator.html": 1,
    "/health/bmr-calculator.html": 1,
    "/health/calorie-calculator.html": 1,
    "/health/macro-calculator.html": 1,
    "/": 1,
    "/math-calculators.html": 1,
    "/math/area-calculator.html": 1,
    "/math/basic-calculator.html": 1,
    "/math/percentage-calculator.html": 1,
    "/math/quadratic-formula-calculator.html": 1,
    "/math/weighted-average-calculator.html": 1,
    "/other-calculators.html": 1,
    "/other/age-calculator.html": 1,
    "/other/date-calculator.html": 1,
    "/other/flight-time-calculator.html": 1,
    "/other/gpa-calculator.html": 1,
    "/other/tip-calculator.html": 1
   }
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

  function hasTranslation(cleanPath, code) {
    var T = TRANSLATED_BY[code] || {};
    if (T[cleanPath]) return true;
    if (cleanPath.length > 1 && cleanPath.slice(-1) === '/') {
      return !!(T[cleanPath + 'index.html']);
    }
    return false;
  }

  function localizedUrl(locale) {
    var cleanPath = englishPath();
    var target;
    if (!locale.prefix) {
      target = cleanPath;
    } else if (hasTranslation(cleanPath, locale.code)) {
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
      if (!hasTranslation(cleanPath, lang)) tag.parentNode && tag.parentNode.removeChild(tag);
    });
  }

  function injectStyles() {
    if (document.getElementById('cp-lang-css')) return;
    var style = document.createElement('style');
    style.id = 'cp-lang-css';
    style.textContent = [
      '.site-header .lang-switch{position:relative;margin-left:12px;margin-right:10px;flex-shrink:0;z-index:60}',
      '.lang-switch-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 10px;border:1px solid var(--line,#E5E7EB);border-radius:10px;background:var(--paper-raised,#fff);color:var(--ink,#14171A);font:600 12px var(--font-body,Inter,sans-serif);letter-spacing:.04em;cursor:pointer}',
      '.lang-switch-btn:hover,.lang-switch-btn[aria-expanded="true"]{border-color:var(--signal,#1A7A5E);color:var(--signal-dark,#13613B)}',
      '.lang-globe{display:inline-flex;width:16px;height:16px}',
      '.lang-globe svg{width:16px;height:16px}',
      '.lang-caret{color:var(--slate,#6B7280);font-size:11px}',
      '.lang-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:168px;margin:0;padding:6px;list-style:none;background:var(--paper-raised,#fff);border:1px solid var(--line,#E5E7EB);border-radius:12px;box-shadow:0 8px 24px rgba(20,23,26,.08);z-index:70}',
      '.lang-menu a{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;color:var(--ink,#14171A);font-size:13px;text-decoration:none}',
      '.lang-menu a:hover,.lang-menu a[aria-current="true"]{background:var(--signal-soft,#E8F5F0);color:var(--signal-dark,#13613B);text-decoration:none}',
      '.lang-menu a[aria-current="true"]{font-weight:600}',
      '.footer-langs{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.footer-langs a{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:8px;border:1px solid var(--line,#E5E7EB);background:var(--paper-raised,#fff);color:var(--slate,#6B7280);font-size:11px;font-weight:700;text-decoration:none}',
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
