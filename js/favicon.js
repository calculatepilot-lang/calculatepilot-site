/* Inject CP favicon on every page. */
(function () {
  if (document.getElementById('cp-favicon')) return;
  var v = '20260919';
  var tags = [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg?v=' + v, id: 'cp-favicon' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png?v=' + v },
    { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192.png?v=' + v },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png?v=' + v }
  ];
  tags.forEach(function (spec) {
    var link = document.createElement('link');
    Object.keys(spec).forEach(function (key) { link.setAttribute(key, spec[key]); });
    document.head.appendChild(link);
  });
})();
