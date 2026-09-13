/* Compatibility shim used by /es /fr /de pages.
   Loads the shared header + footer language switcher.
 */
(function () {
  if (window.__cpLangInit || document.querySelector('script[src*="language-switcher.js"]')) return;
  var script = document.createElement('script');
  script.src = '/js/language-switcher.js?v=20260914';
  script.defer = true;
  document.head.appendChild(script);
})();
