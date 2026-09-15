/* CalculatePilot language selector
 * Uses language subdirectories on calculatepilot.com.
 * No automatic language redirects are performed.
 */
(function () {
  'use strict';

  var locales = [
    { code: 'en', label: 'English', prefix: '' },
    { code: 'fr', label: 'Français', prefix: '/fr' },
    { code: 'de', label: 'Deutsch', prefix: '/de' },
    { code: 'es', label: 'Español', prefix: '/es' }
  ];

  var path = window.location.pathname || '/';
  var current = locales[0];
  locales.slice(1).some(function (locale) {
    if (path === locale.prefix || path.indexOf(locale.prefix + '/') === 0) {
      current = locale;
      return true;
    }
    return false;
  });

  function localizedUrl(locale) {
    var cleanPath = path;
    if (current.prefix && (cleanPath === current.prefix || cleanPath.indexOf(current.prefix + '/') === 0)) {
      cleanPath = cleanPath.slice(current.prefix.length) || '/';
    }
    if (cleanPath.charAt(0) !== '/') cleanPath = '/' + cleanPath;
    var target = locale.prefix + cleanPath;
    if (target === '') target = '/';
    var query = window.location.search || '';
    var hash = window.location.hash || '';
    return target + query + hash;
  }

  function createSelector(idSuffix) {
    var selectId = 'cp-language-select' + (idSuffix || '');
    var wrapper = document.createElement('div');
    wrapper.className = 'cp-language-selector';

    var label = document.createElement('label');
    label.className = 'cp-language-label';
    label.setAttribute('for', selectId);
    label.textContent = 'Language';

    var select = document.createElement('select');
    select.id = selectId;
    select.setAttribute('aria-label', 'Language');

    locales.forEach(function (locale) {
      var option = document.createElement('option');
      option.value = locale.code;
      option.textContent = locale.label;
      option.selected = locale.code === current.code;
      select.appendChild(option);
    });

    select.addEventListener('change', function () {
      var locale = locales.find(function (item) { return item.code === select.value; });
      if (locale) window.location.href = localizedUrl(locale);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    return wrapper;
  }

  function mount() {
    var headerContainer = document.querySelector('.site-header .container');
    if (!headerContainer || headerContainer.querySelector('.cp-language-selector')) return;
    var selector = createSelector('-header');
    if (!selector) return;
    var toggle = headerContainer.querySelector('.nav-toggle');
    if (toggle) headerContainer.insertBefore(selector, toggle);
    else headerContainer.appendChild(selector);
  }

  var style = document.createElement('style');
  style.textContent = [
    '.cp-language-selector{display:flex;align-items:center;gap:6px;margin-left:12px;flex-shrink:0}',
    '.cp-language-selector--footer{margin:0}',
    '.footer-bottom{flex-wrap:wrap;gap:12px}',
    '.cp-language-label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
    '.cp-language-selector select{appearance:auto;border:1px solid var(--line);border-radius:8px;background:var(--paper-raised);color:var(--slate);font:500 var(--fs-sm) var(--font-body);padding:7px 26px 7px 9px;cursor:pointer}',
    '.cp-language-selector select:hover{border-color:var(--signal);color:var(--signal)}',
    '@media (max-width:720px){.cp-language-selector{margin-left:8px}.cp-language-selector select{font-size:var(--fs-xs);padding:6px 22px 6px 7px}}'
  ].join('');
  document.head.appendChild(style);

  function mountFooter() {
    var footerBottom = document.querySelector('.site-footer .footer-bottom');
    if (!footerBottom) return;
    if (footerBottom.querySelector('.cp-language-selector')) return;
    var selector = createSelector('-footer');
    if (!selector) return;
    selector.classList.add('cp-language-selector--footer');
    footerBottom.appendChild(selector);
  }

  function mountAll() {
    mount();
    mountFooter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountAll);
  else mountAll();
})();
