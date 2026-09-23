/* Mortgage workspace helpers. mortgage.js owns the math. */
(function () {
  var COPY = {
    en: {
      chip: function (y) { return y + "-year fixed"; },
      empty: "Enter the home price, deposit, rate, and term.",
      line: function (pct, y) {
        return "Deposit is <strong>" + pct + "</strong> of the price on a <strong>" + y + "-year</strong> fixed-rate mortgage.";
      }
    },
    fr: {
      chip: function (y) { return "Taux fixe " + y + " ans"; },
      empty: "Saisissez le prix, l'apport, le taux et la durée.",
      line: function (pct, y) {
        return "L'apport représente <strong>" + pct + "</strong> du prix sur <strong>" + y + " ans</strong> à taux fixe.";
      }
    },
    de: {
      chip: function (y) { return y + " Jahre fest"; },
      empty: "Geben Sie Kaufpreis, Anzahlung, Zins und Laufzeit ein.",
      line: function (pct, y) {
        return "Die Anzahlung beträgt <strong>" + pct + "</strong> des Preises bei <strong>" + y + " Jahren</strong> fest.";
      }
    },
    es: {
      chip: function (y) { return "Fijo a " + y + " años"; },
      empty: "Introduce el precio, la entrada, el tipo y el plazo.",
      line: function (pct, y) {
        return "La entrada es el <strong>" + pct + "</strong> del precio a <strong>" + y + " años</strong> fijo.";
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
    range.addEventListener("input", function () { num.value = range.value; });
    num.addEventListener("input", function () {
      var min = parseFloat(range.min), max = parseFloat(range.max), v = parseFloat(num.value);
      if (!isFinite(v)) return;
      if (isFinite(min) && v < min) range.value = String(min);
      else if (isFinite(max) && v > max) range.value = String(max);
      else range.value = String(v);
    });
  }

  function meta() {
    var chip = document.getElementById("mortgageChip");
    var advice = document.getElementById("mortgageAdvice");
    var c = t();
    var price = parseFloat((document.getElementById("homePrice") || {}).value) || 0;
    var down = parseFloat((document.getElementById("downPayment") || {}).value) || 0;
    var years = parseFloat((document.getElementById("loanTerm") || {}).value) || 0;
    if (chip) chip.textContent = c.chip(years || 30);
    if (!advice) return;
    if (!price) { advice.innerHTML = c.empty; return; }
    var pct = Math.max(0, Math.min(100, (down / price) * 100));
    var pctLabel = (Math.round(pct * 10) / 10).toFixed(pct % 1 ? 1 : 0) + "%";
    advice.innerHTML = c.line(pctLabel, years || 30);
  }

  document.addEventListener("DOMContentLoaded", function () {
    pair("homePrice", "homePriceRange");
    pair("downPayment", "downPaymentRange");
    pair("interestRate", "interestRateRange");
    pair("propertyTax", "propertyTaxRange");
    pair("homeInsurance", "homeInsuranceRange");
    var form = document.getElementById("calcForm");
    if (form) form.addEventListener("input", meta);
    meta();
  });
})();
