/* Mounts BMI-style workspace around existing mortgage IDs. mortgage.js owns math. */
(function () {
  var COPY = {
    en: { chip: function (y) { return y + "-year fixed"; }, empty: "Enter the home price, deposit, rate, and term.", line: function (p, y) { return "Deposit is <strong>" + p + "</strong> of the price on a <strong>" + y + "-year</strong> fixed-rate mortgage."; } },
    fr: { chip: function (y) { return "Taux fixe " + y + " ans"; }, empty: "Saisissez le prix, l'apport, le taux et la durée.", line: function (p, y) { return "L'apport représente <strong>" + p + "</strong> du prix sur <strong>" + y + " ans</strong> à taux fixe."; } },
    de: { chip: function (y) { return y + " Jahre fest"; }, empty: "Geben Sie Kaufpreis, Anzahlung, Zins und Laufzeit ein.", line: function (p, y) { return "Die Anzahlung beträgt <strong>" + p + "</strong> des Preises bei <strong>" + y + " Jahren</strong> fest."; } },
    es: { chip: function (y) { return "Fijo a " + y + " años"; }, empty: "Introduce el precio, la entrada, el tipo y el plazo.", line: function (p, y) { return "La entrada es el <strong>" + p + "</strong> del precio a <strong>" + y + " años</strong> fijo."; } }
  };

  function langCopy() {
    var lang = (document.documentElement.getAttribute("lang") || "en").slice(0, 2);
    return COPY[lang] || COPY.en;
  }

  function injectCss() {
    if (document.querySelector('link[href*="calc-workspace.css"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "/css/calc-workspace.css?v=20260923c";
    document.head.appendChild(l);
  }

  function labelOf(id) {
    var el = document.querySelector('label[for="' + id + '"]');
    return el ? el.textContent.replace(/\s+/g, " ").trim() : id;
  }

  function readoutLabel(id) {
    var node = document.getElementById(id);
    if (!node) return id;
    var row = node.closest(".readout-row");
    if (row && row.querySelector("span")) return row.querySelector("span").textContent.trim();
    return id;
  }

  function field(id, rangeId, min, max, step, wide, suffix) {
    var input = document.getElementById(id);
    if (!input) return document.createTextNode("");
    var wrap = document.createElement("div");
    wrap.className = "calc-workspace__field";
    wrap.innerHTML = '<div class="calc-workspace__row"></div>';
    var row = wrap.firstChild;
    var lab = document.createElement("label");
    lab.htmlFor = id;
    lab.textContent = labelOf(id);
    row.appendChild(lab);
    if (input.tagName === "SELECT") {
      row.appendChild(input);
      return wrap;
    }
    var num = document.createElement("div");
    num.className = "calc-workspace__num";
    if (wide) input.classList.add("w-price");
    num.appendChild(input);
    if (suffix) {
      var s = document.createElement("span");
      s.textContent = suffix;
      num.appendChild(s);
    }
    row.appendChild(num);
    var range = document.createElement("input");
    range.type = "range";
    range.id = rangeId;
    range.min = min; range.max = max; range.step = step;
    range.value = input.value;
    range.setAttribute("aria-label", lab.textContent);
    wrap.appendChild(range);
    return wrap;
  }

  function mount() {
    injectCss();
    var form = document.getElementById("calcForm");
    if (!form) return;
    if (form.classList.contains("calc-workspace")) return bind(form);

    var layout = form.closest(".calc-layout") || form.parentElement;
    var aside = layout ? layout.querySelector(".readout") : null;
    var kicker = aside && aside.querySelector(".readout-label")
      ? aside.querySelector(".readout-label").textContent.trim()
      : "Monthly payment";
    var currencyBox = document.querySelector(".currency-picker");
    var currencyLabel = currencyBox && currencyBox.querySelector("label")
      ? currencyBox.querySelector("label").textContent.trim()
      : "Currency";
    var currencySelect = document.getElementById("cpCurrencySelect");
    var hintEl = form.querySelector(".hint");
    var hint = hintEl ? hintEl.textContent.trim() : "";
    var c = langCopy();

    var shell = document.createElement("form");
    shell.className = "calc-workspace";
    shell.id = "calcForm";
    shell.autocomplete = "off";

    var result = document.createElement("div");
    result.className = "calc-workspace__result";
    result.innerHTML =
      '<p class="calc-workspace__kicker"></p>' +
      '<div class="calc-workspace__hero" id="__hero"></div>' +
      '<div class="calc-workspace__chip" id="mortgageChip"></div>' +
      '<div class="calc-workspace__stats">' +
      '<div class="calc-workspace__stat"><div class="calc-workspace__stat-label"></div><div class="calc-workspace__stat-value" id="__pi"></div></div>' +
      '<div class="calc-workspace__stat"><div class="calc-workspace__stat-label"></div><div class="calc-workspace__stat-value" id="__ti"></div></div>' +
      '</div>' +
      '<div class="calc-workspace__lines">' +
      '<div class="calc-workspace__line"><span></span><span id="__tax"></span></div>' +
      '<div class="calc-workspace__line"><span></span><span id="__ins"></span></div>' +
      '<div class="calc-workspace__line"><span></span><span id="__loan"></span></div>' +
      '</div>' +
      '<p class="calc-workspace__advice" id="mortgageAdvice"></p>';
    result.querySelector(".calc-workspace__kicker").textContent = kicker;
    var hero = document.getElementById("resultValue");
    if (hero) { hero.className = "calc-workspace__hero"; result.querySelector("#__hero").replaceWith(hero); }
    else result.querySelector("#__hero").id = "resultValue";
    result.querySelector("#mortgageChip").textContent = c.chip(30);
    result.querySelector(".calc-workspace__stat-label").textContent = readoutLabel("outPrincipalInterest");
    result.querySelectorAll(".calc-workspace__stat-label")[1].textContent = readoutLabel("outTotalInterest");
    ["outPrincipalInterest", "outTotalInterest", "outTax", "outInsurance", "outLoanAmount"].forEach(function (id, i) {
      var n = document.getElementById(id);
      if (!n) return;
      n.className = i < 2 ? "calc-workspace__stat-value" : "";
      var ph = result.querySelector(i === 0 ? "#__pi" : i === 1 ? "#__ti" : i === 2 ? "#__tax" : i === 3 ? "#__ins" : "#__loan");
      if (ph) ph.replaceWith(n);
    });
    var lineSpans = result.querySelectorAll(".calc-workspace__line span:first-child");
    if (lineSpans[0]) lineSpans[0].textContent = readoutLabel("outTax");
    if (lineSpans[1]) lineSpans[1].textContent = readoutLabel("outInsurance");
    if (lineSpans[2]) lineSpans[2].textContent = readoutLabel("outLoanAmount");
    result.querySelector("#mortgageAdvice").textContent = c.empty;

    var controls = document.createElement("div");
    controls.className = "calc-workspace__controls";
    if (currencySelect) {
      var cur = document.createElement("div");
      cur.className = "calc-workspace__currency";
      var cl = document.createElement("label");
      cl.htmlFor = "cpCurrencySelect";
      cl.textContent = currencyLabel;
      cur.appendChild(cl);
      cur.appendChild(currencySelect);
      controls.appendChild(cur);
    }
    controls.appendChild(field("homePrice", "homePriceRange", "50000", "2000000", "1000", true));
    controls.appendChild(field("downPayment", "downPaymentRange", "0", "800000", "1000", true));
    controls.appendChild(field("loanTerm"));
    controls.appendChild(field("interestRate", "interestRateRange", "0", "15", "0.05", false, "%"));
    controls.appendChild(field("propertyTax", "propertyTaxRange", "0", "30000", "50", true));
    var insField = field("homeInsurance", "homeInsuranceRange", "0", "15000", "50", true);
    if (hint) {
      var h = document.createElement("span");
      h.className = "calc-workspace__hint";
      h.textContent = hint;
      insField.appendChild(h);
    }
    controls.appendChild(insField);

    shell.appendChild(result);
    shell.appendChild(controls);

    var section = document.createElement("section");
    var box = document.createElement("div");
    box.className = "container";
    box.appendChild(shell);
    section.appendChild(box);
    if (layout && layout.parentElement) layout.parentElement.replaceChild(section, layout);
    else form.replaceWith(shell);

    bind(shell);
    if (typeof calculateMortgage === "function") calculateMortgage();
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
    var c = langCopy();
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

  function bind(form) {
    pair("homePrice", "homePriceRange");
    pair("downPayment", "downPaymentRange");
    pair("interestRate", "interestRateRange");
    pair("propertyTax", "propertyTaxRange");
    pair("homeInsurance", "homeInsuranceRange");
    form.addEventListener("input", meta);
    form.addEventListener("change", meta);
    meta();
  }

  function boot() { try { mount(); } catch (e) { console.warn("mortgage workspace", e); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
