/* CalculatePilot language selector
 * Keeps the existing primary navigation unchanged and adds a compact selector.
 * No automatic language redirects are performed.
 */
(function () {
  'use strict';

  var locales = [
    { code: 'en', label: 'English', host: 'www.calculatepilot.com' },
    { code: 'fr', label: 'Français', host: 'fr.calculatepilot.com' },
    { code: 'de', label: 'Deutsch', host: 'de.calculatepilot.com' },
    { code: 'es', label: 'Español', host: 'es.calculatepilot.com' }
  ];

  var hostname = window.location.hostname.toLowerCase();
  var current = locales.find(function (locale) {
    return hostname === locale.host;
  }) || locales[0];

  function localizedUrl(locale) {
    var path = window.location.pathname || '/';
    var query = window.location.search || '';
    var hash = window.location.hash || '';
    return 'https://' + locale.host + (path === '' ? '/' : path) + query + hash;
  }

  function createSelector() {
    if (!document.querySelector('.cp-language-selector')) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'cp-language-selector';

    var label = document.createElement('label');
    label.className = 'cp-language-label';
    label.setAttribute('for', 'cp-language-select');
    label.textContent = 'Language';

    var select = document.createElement('select');
    select.id = 'cp-language-select';
    select.setAttribute('aria-label', 'Language');

    locales.forEach(function (locale) {
      var option = document.createElement('option');
      option.value = locale.code;
      option.textContent = locale.label;
      option.selected = locale.code === current.code;
      select.appendChild(option);
    });

    select.addEventListener('change', function () {
      var locale = locales.find(function (item) {
        return item.code === select.value;
      });
      if (locale) window.location.href = localizedUrl(locale);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    return wrapper;
  }

  function mount() {
    var headerContainer = document.querySelector('.site-header .container');
    if (!headerContainer || headerContainer.querySelector('.cp-language-selector')) return;

    var selector = createSelector();
    if (!selector) return;

    var toggle = headerContainer.querySelector('.nav-toggle');
    if (toggle) {
      headerContainer.insertBefore(selector, toggle);
    } else {
      headerContainer.appendChild(selector);
    }
  }

  var style = document.createElement('style');
  style.textContent = [
    '.cp-language-selector{display:flex;align-items:center;gap:6px;margin-left:auto;margin-right:14px;flex-shrink:0}',
    '.cp-language-label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
    '.cp-language-selector select{appearance:auto;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--paper-raised);color:var(--ink);font:500 var(--fs-sm) var(--font-body);padding:7px 26px 7px 9px;cursor:pointer}',
    '.cp-language-selector select:hover{border-color:var(--signal)}',
    '@media (max-width:720px){.cp-language-selector{margin-left:auto;margin-right:8px}.cp-language-selector select{font-size:var(--fs-xs);padding:6px 22px 6px 7px}}'
  ].join('');
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
