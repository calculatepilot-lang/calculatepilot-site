/* Slider sync + advice line. Does not recompute payment — loan.js owns that. */
(function () {
  var COPY = {
    en: {
      empty: "Enter the loan amount, rate, and term to see the payment.",
      year: "1 year",
      years: function (n) { return n + " years"; },
      line: function (yr, n) {
        return "Repaid over <strong>" + yr + "</strong> (" + n + " months) on a fixed-rate loan.";
      }
    },
    fr: {
      empty: "Saisissez le montant, le taux et la durée pour voir la mensualité.",
      year: "1 an",
      years: function (n) { return n + " ans"; },
      line: function (yr, n) {
        return "Remboursé sur <strong>" + yr + "</strong> (" + n + " mois) pour un prêt à taux fixe.";
      }
    },
    de: {
      empty: "Geben Sie Betrag, Zinssatz und Laufzeit ein, um die Rate zu sehen.",
      year: "1 Jahr",
      years: function (n) { return n + " Jahre"; },
      line: function (yr, n) {
        return "Rückzahlung über <strong>" + yr + "</strong> (" + n + " Monate) bei einem Festzinskredit.";
      }
    },
    es: {
      empty: "Introduce el importe, el tipo y el plazo para ver la cuota.",
      year: "1 año",
      years: function (n) { return n + " años"; },
      line: function (yr, n) {
        return "Se amortiza en <strong>" + yr + "</strong> (" + n + " meses) con un préstamo a tipo fijo.";
      }
    }
  };

  function t() {
    var lang = (document.documentElement.getAttribute("lang") || "en").slice(0, 2);
    return COPY[lang] || COPY.en;
  }

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
    var c = t();
    var principal = parseFloat(document.getElementById("loanAmount").value) || 0;
    var n = parseFloat(document.getElementById("loanTermMonths").value) || 0;
    if (!n || !principal) {
      el.innerHTML = c.empty;
      return;
    }
    var years = n / 12;
    var yrLabel = years === 1 ? c.year : c.years(Number.isInteger(years) ? years : years.toFixed(1));
    el.innerHTML = c.line(yrLabel, Math.round(n));
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
