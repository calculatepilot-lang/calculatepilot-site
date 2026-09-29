/* CalculatePilot language selector
 * Compatibility wrapper used by English and /es /fr /de pages.
 */
(function () {
  function load(src) {
    if (document.querySelector('script[src*="' + src.split('?')[0].split('/').pop() + '"]')) return;
    var script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  }
  load('/js/favicon.js?v=20260919');
  load('/js/locale-chrome.js?v=20260922');
  if (window.__cpLangInit || document.querySelector('script[src*="language-switcher.js"]')) {
    if (typeof window.__cpMountLanguage === 'function') window.__cpMountLanguage();
    return;
  }
  var script = document.createElement('script');
  script.src = '/js/language-switcher.js?v=20260929a';
  script.onload = function () {
    if (typeof window.__cpMountLanguage === 'function') window.__cpMountLanguage();
  };
  document.head.appendChild(script);
})();
