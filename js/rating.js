(function(){
  'use strict';
  var MIN_FOR_SCHEMA = 5; // only publish aggregateRating once there are enough real votes
  var m = location.pathname.match(/^\/(?:(es|fr|de)\/)?((?:financial|health|math|other)\/[a-z0-9-]+)\.html$/);
  if (!m || document.getElementById('cp-rating')) return;
  var lang = m[1] || 'en', slug = m[2];
  var T = {
    en:{title:'Rate this calculator',first:'Be the first to rate it',thanks:'Thanks for rating!',some:'ratings so far',one:'rating so far',of:'out of 5',rate:'Rate %n out of 5 stars',err:'Ratings are unavailable right now.'},
    es:{title:'Valora esta calculadora',first:'Sé la primera persona en valorarla',thanks:'¡Gracias por tu valoración!',some:'valoraciones hasta ahora',one:'valoración hasta ahora',of:'de 5',rate:'Valorar con %n de 5 estrellas',err:'Las valoraciones no están disponibles ahora.'},
    fr:{title:'Notez ce calculateur',first:'Soyez le premier à le noter',thanks:'Merci pour votre note !',some:'avis pour le moment',one:'avis pour le moment',of:'sur 5',rate:'Noter %n sur 5 étoiles',err:'Les notes sont indisponibles pour le moment.'},
    de:{title:'Bewerten Sie diesen Rechner',first:'Seien Sie der Erste, der bewertet',thanks:'Danke für Ihre Bewertung!',some:'Bewertungen bisher',one:'Bewertung bisher',of:'von 5',rate:'Mit %n von 5 Sternen bewerten',err:'Bewertungen sind derzeit nicht verfügbar.'}
  }[lang] || null;
  if (!T) return;
  var API = '/api/rating.php', KEY = 'cp-rated:' + slug, mine = 0;
  try { mine = parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) {}

  if (!document.getElementById('cp-rating-css')) {
    var st = document.createElement('style'); st.id = 'cp-rating-css';
    st.textContent = '#cp-rating{max-width:960px;margin:32px auto;padding:18px 20px;border:1px solid rgba(15,107,92,.25);border-radius:12px;text-align:center}' +
      '#cp-rating h2{font-size:1.05rem;margin:0 0 8px}' +
      '#cp-rating .cpr-stars{display:inline-flex;gap:2px}' +
      '#cp-rating button{background:none;border:0;padding:2px 3px;font-size:1.9rem;line-height:1;cursor:pointer;color:#c9d3d0}' +
      '#cp-rating button.on{color:#e6a700}' +
      '#cp-rating button:focus-visible{outline:2px solid #0F6B5C;outline-offset:2px;border-radius:4px}' +
      '#cp-rating .cpr-note{margin:6px 0 0;font-size:.92rem;opacity:.85}';
    document.head.appendChild(st);
  }
  var box = document.createElement('section');
  box.id = 'cp-rating'; box.setAttribute('aria-label', T.title);
  box.innerHTML = '<h2>' + T.title + '</h2><div class="cpr-stars" role="group" aria-label="' + T.title + '"></div><p class="cpr-note" aria-live="polite"></p>';
  var stars = box.querySelector('.cpr-stars'), note = box.querySelector('.cpr-note'), btns = [];
  for (var i = 1; i <= 5; i++) (function(n){
    var b = document.createElement('button'); b.type = 'button'; b.textContent = '★';
    b.setAttribute('aria-label', T.rate.replace('%n', n));
    b.addEventListener('click', function(){ vote(n); });
    b.addEventListener('mouseenter', function(){ paint(n); });
    b.addEventListener('mouseleave', function(){ paint(mine); });
    stars.appendChild(b); btns.push(b);
  })(i);
  function paint(n){ btns.forEach(function(b, k){ b.className = k < n ? 'on' : ''; }); }
  function show(d, thanks){
    var c = d.count || 0, text;
    if (c === 0) text = T.first;
    else if (c < MIN_FOR_SCHEMA) text = c + ' ' + (c === 1 ? T.one : T.some);
    else text = d.avg.toFixed(1) + ' ' + T.of + ' · ' + c + ' ' + T.some;
    note.textContent = (thanks ? T.thanks + ' ' : '') + text;
    if (c >= MIN_FOR_SCHEMA) addSchema(d);
  }
  function addSchema(d){
    var nodes = document.querySelectorAll('script[type="application/ld+json"]');
    for (var k = 0; k < nodes.length; k++) {
      try {
        var j = JSON.parse(nodes[k].textContent), list = Array.isArray(j) ? j : (j['@graph'] || [j]), hit = false;
        list.forEach(function(x){
          if (x && (x['@type'] === 'WebApplication' || x['@type'] === 'SoftwareApplication')) {
            x.aggregateRating = {'@type':'AggregateRating', ratingValue: String(d.avg), ratingCount: String(d.count), bestRating: '5', worstRating: '1'};
            hit = true;
          }
        });
        if (hit) { nodes[k].textContent = JSON.stringify(j); return; }
      } catch (e) {}
    }
  }
  function vote(n){
    mine = n; paint(n);
    fetch(API, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({slug: slug, value: n})})
      .then(function(r){ return r.json(); })
      .then(function(d){ if (d && d.ok) { try { localStorage.setItem(KEY, String(n)); } catch (e) {} show(d, true); } else note.textContent = T.err; })
      .catch(function(){ note.textContent = T.err; });
  }
  fetch(API + '?slug=' + encodeURIComponent(slug))
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (!d || !d.ok) return; // API not ready: show nothing rather than a broken widget
      var host = document.querySelector('footer.site-footer');
      if (!host || !host.parentNode) return;
      host.parentNode.insertBefore(box, host);
      paint(mine); show(d, false);
    })
    .catch(function(){});
})();
