/* Generic, opt-in workspace behaviors — shared across all .calc-workspace pages.
   Does not compute any calculator result; each page's own JS owns that.
   1) Bidirectional number<->range slider sync via [data-pair-range] on a number input.
   2) Copy-to-clipboard for [data-copy-target] buttons. */
(function () {
  function pairRange(num) {
    var rangeId = num.getAttribute("data-pair-range");
    var range = rangeId && document.getElementById(rangeId);
    if (!range) return;
    range.addEventListener("input", function () {
      num.value = range.value;
      num.dispatchEvent(new Event("input", { bubbles: true }));
    });
    num.addEventListener("input", function () {
      var min = parseFloat(range.min);
      var max = parseFloat(range.max);
      var v = parseFloat(num.value);
      if (!isFinite(v)) return;
      if (isFinite(min) && v < min) range.value = String(min);
      else if (isFinite(max) && v > max) range.value = String(max);
      else range.value = String(v);
    });
  }

  function copyButton(btn) {
    var targetId = btn.getAttribute("data-copy-target");
    var target = targetId && document.getElementById(targetId);
    if (!target) return;
    var defaultLabel = btn.textContent;
    btn.addEventListener("click", function () {
      var text = "value" in target ? target.value : target.textContent;
      if (!text) return;
      var done = function () {
        btn.textContent = "Copied!";
        setTimeout(function () {
          btn.textContent = defaultLabel;
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var pairs = document.querySelectorAll("[data-pair-range]");
    for (var i = 0; i < pairs.length; i++) pairRange(pairs[i]);
    var copyBtns = document.querySelectorAll("[data-copy-target]");
    for (var j = 0; j < copyBtns.length; j++) copyButton(copyBtns[j]);
  });
})();
