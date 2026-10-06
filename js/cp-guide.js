/* CalculatePilot guide template: reading progress, TOC spy, copy buttons, loan sandbox. */
(function () {
  'use strict';
  var d = document;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  // Reading progress
  var bar = $('#cpgBar');
  function onScroll() {
    var h = d.documentElement.scrollHeight - d.documentElement.clientHeight;
    if (bar) bar.style.width = (h > 0 ? Math.min(100, (window.pageYOffset / h) * 100) : 0) + '%';
    spy();
  }

  // TOC scroll spy
  var links = $$('.cpg-toc a');
  var targets = links.map(function (a) { return d.getElementById(a.getAttribute('href').slice(1)); });
  var ON = ['border-secondary', 'text-secondary', 'font-semibold'];
  var OFF = ['border-transparent', 'text-on-surface-variant'];
  var cur = -1;
  function spy() {
    var idx = 0;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= 140) idx = i; });
    if (idx === cur) return;
    cur = idx;
    links.forEach(function (a, i) {
      var on = i === idx;
      ON.forEach(function (c) { a.classList.toggle(c, on); });
      OFF.forEach(function (c) { a.classList.toggle(c, !on); });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Copy helpers
  function flash(btn, label, text) {
    if (!label) return;
    var old = label.textContent;
    label.textContent = text;
    setTimeout(function () { label.textContent = old; }, 1800);
  }
  function copy(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var t = d.createElement('textarea'); t.value = text; d.body.appendChild(t); t.select();
      try { d.execCommand('copy'); } catch (e) {}
      d.body.removeChild(t); done();
    }
  }
  $$('[data-cpg-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      copy(b.getAttribute('data-cpg-copy'), function () { flash(b, $('[data-label]', b), 'Copied!'); });
    });
  });
  var link = $('#cpgCopyUrl');
  if (link) link.addEventListener('click', function () {
    copy(location.href.split('#')[0], function () { flash(link, $('[data-label]', link), 'Copied!'); });
  });
  $$('[data-cpg-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  // Loan sandbox
  $$('[data-cpg-sandbox]').forEach(function (box) {
    var P = $('[data-p]', box), PR = $('[data-pr]', box), R = $('[data-r]', box), RR = $('[data-rr]', box), T = $('[data-t]', box);
    var oM = $('[data-o-m]', box), oI = $('[data-o-i]', box), oT = $('[data-o-t]', box), oIp = $('[data-o-ip]', box);
    var lP = $('[data-l-p]', box), lI = $('[data-l-i]', box), bP = $('[data-b-p]', box), bI = $('[data-b-i]', box);
    function money(n, dec) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    function run() {
      var p = parseFloat(P.value) || 0, rate = parseFloat(R.value) || 0, yrs = parseInt(T.value, 10) || 30;
      var r = rate / 100 / 12, n = yrs * 12, m = 0;
      if (p > 0 && n > 0) m = r > 0 ? p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n;
      var total = m * n, interest = Math.max(0, total - p);
      oM.textContent = money(m, 2); oI.textContent = money(interest, 2); oT.textContent = money(total, 2);
      oIp.textContent = p > 0 ? (interest / p * 100).toFixed(1) + '% of borrowed principal' : '';
      if (total > 0) {
        var pp = p / total * 100, ip = interest / total * 100;
        bP.style.width = pp.toFixed(1) + '%'; bI.style.width = ip.toFixed(1) + '%';
        lP.textContent = 'Principal: ' + money(p, 0) + ' (' + pp.toFixed(1) + '%)';
        lI.textContent = 'Interest: ' + money(interest, 0) + ' (' + ip.toFixed(1) + '%)';
      }
    }
    P.addEventListener('input', function () { PR.value = P.value; run(); });
    PR.addEventListener('input', function () { P.value = PR.value; run(); });
    R.addEventListener('input', function () { RR.value = R.value; run(); });
    RR.addEventListener('input', function () { R.value = RR.value; run(); });
    T.addEventListener('change', run);
    run();
  });
})();
