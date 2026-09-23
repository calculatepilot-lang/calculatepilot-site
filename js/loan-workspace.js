/* Slider sync + advice line. Does not recompute payment — loan.js owns that. */
(function () {
  function pair(numId, rangeId) {
    var num = document.getElementById(numId);
    var range = document.getElementById(rangeId);
    if (!num || !range) return;
    range.addEventListener("input", function () {
      num.value = range.value;
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

  function advice() {
    var el = document.getElementById("loanAdvice");
    if (!el) return;
    var principal = parseFloat(document.getElementById("loanAmount").value) || 0;
    var n = parseFloat(document.getElementById("loanTermMonths").value) || 0;
    if (!n || !principal) {
      el.innerHTML = "Enter the loan amount, rate, and term to see the payment.";
      return;
    }
    var years = n / 12;
    var yrLabel = years === 1 ? "1 year" : (Number.isInteger(years) ? years + " years" : years.toFixed(1) + " years");
    el.innerHTML = "Repaid over <strong>" + yrLabel + "</strong> (" + Math.round(n) + " months) on a fixed-rate loan.";
  }

  document.addEventListener("DOMContentLoaded", function () {
    pair("loanAmount", "loanAmountRange");
    pair("interestRate", "interestRateRange");
    pair("loanTermMonths", "loanTermRange");
    var form = document.getElementById("calcForm");
    if (form) form.addEventListener("input", advice);
    advice();
  });
})();
