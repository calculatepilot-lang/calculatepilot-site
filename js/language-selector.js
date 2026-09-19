/* CalculatePilot language selector
 * Compatibility wrapper used by English and /es /fr /de pages.
 * Delegates to js/language-switcher.js so header + footer stay in sync.
 */
(function () {
  function ready(fn) {
    if (typeof window.__cpMountLanguage === 'function') {
      window.__cpMountLanguage();
      return;
    }
    if (fn) fn();
  }

  if (window.__cpLangInit || document.querySelector('script[src*="language-switcher.js"]')) {
    ready();
    return;
  }

  var script = document.createElement('script');
  script.src = '/js/language-switcher.js?v=20260919';
  script.onload = function () {
    if (typeof window.__cpMountLanguage === 'function') window.__cpMountLanguage();
  };
  document.head.appendChild(script);
})();
