(function(){
  // Curated, contextual relations per page. Any page not listed here falls back
  // automatically to same-category picks pulled from /calculators.json.
  var RELATIONS = {
    "/financial/cd-vs-hysa-calculator.html": ["/financial/cd-calculator.html", "/financial/savings-calculator.html", "/financial/emergency-fund-calculator.html"],
    "/financial/1031-exchange-calculator.html": ["/financial/rental-yield-calculator.html", "/financial/seller-net-sheet-calculator.html", "/financial/house-flip-calculator.html"],
    "/financial/seller-net-sheet-calculator.html": ["/financial/house-affordability-calculator.html", "/financial/1031-exchange-calculator.html", "/financial/house-flip-calculator.html"],
    "/financial/mortgage-calculator.html": ["/financial/refinance-calculator.html","/financial/heloc-calculator.html","/financial/house-affordability-calculator.html","/financial/down-payment-calculator.html","/financial/amortization-calculator.html","/financial/debt-to-income-ratio-calculator.html"],
    "/financial/refinance-calculator.html": ["/financial/mortgage-calculator.html","/financial/heloc-calculator.html","/financial/amortization-calculator.html","/financial/loan-calculator.html"],
    "/financial/heloc-calculator.html": ["/financial/mortgage-calculator.html","/financial/refinance-calculator.html","/financial/house-affordability-calculator.html","/financial/net-worth-calculator.html"],
    "/financial/house-affordability-calculator.html": ["/financial/mortgage-calculator.html","/financial/down-payment-calculator.html","/financial/debt-to-income-ratio-calculator.html","/financial/rent-calculator.html"],
    "/financial/down-payment-calculator.html": ["/financial/mortgage-calculator.html","/financial/house-affordability-calculator.html","/financial/savings-goal-calculator.html","/financial/amortization-calculator.html"],
    "/financial/amortization-calculator.html": ["/financial/mortgage-calculator.html","/financial/loan-calculator.html","/financial/refinance-calculator.html","/financial/auto-loan-calculator.html"],
    "/financial/auto-loan-calculator.html": ["/financial/lease-calculator.html","/financial/loan-calculator.html","/financial/car-affordability-calculator.html","/other/car-depreciation-calculator.html"],
    "/financial/lease-calculator.html": ["/financial/auto-loan-calculator.html","/financial/car-affordability-calculator.html","/other/car-depreciation-calculator.html"],
    "/financial/car-affordability-calculator.html": ["/financial/auto-loan-calculator.html","/financial/lease-calculator.html","/other/car-depreciation-calculator.html"],
    "/financial/loan-calculator.html": ["/financial/amortization-calculator.html","/financial/auto-loan-calculator.html","/financial/mortgage-calculator.html","/financial/debt-payoff-calculator.html"],
    "/financial/debt-payoff-calculator.html": ["/financial/debt-to-income-ratio-calculator.html","/financial/credit-card-calculator.html","/financial/budget-calculator.html","/financial/loan-calculator.html"],
    "/financial/debt-to-income-ratio-calculator.html": ["/financial/mortgage-calculator.html","/financial/debt-payoff-calculator.html","/financial/budget-calculator.html","/financial/salary-calculator.html"],
    "/financial/credit-card-calculator.html": ["/financial/debt-payoff-calculator.html","/financial/credit-utilization-calculator.html","/financial/budget-calculator.html"],
    "/financial/credit-utilization-calculator.html": ["/financial/credit-card-calculator.html","/financial/debt-payoff-calculator.html"],
    "/financial/budget-calculator.html": ["/financial/savings-calculator.html","/financial/debt-payoff-calculator.html","/financial/emergency-fund-calculator.html","/financial/salary-calculator.html"],
    "/financial/savings-calculator.html": ["/financial/savings-goal-calculator.html","/financial/emergency-fund-calculator.html","/financial/compound-interest-calculator.html","/financial/budget-calculator.html"],
    "/financial/savings-goal-calculator.html": ["/financial/savings-calculator.html","/financial/compound-interest-calculator.html","/financial/emergency-fund-calculator.html"],
    "/financial/emergency-fund-calculator.html": ["/financial/savings-calculator.html","/financial/budget-calculator.html","/financial/savings-goal-calculator.html"],
    "/financial/compound-interest-calculator.html": ["/financial/simple-interest-calculator.html","/financial/investment-calculator.html","/financial/savings-calculator.html","/how-to-calculate-compound-interest.html"],
    "/financial/simple-interest-calculator.html": ["/financial/compound-interest-calculator.html","/financial/loan-calculator.html","/financial/investment-calculator.html"],
    "/financial/investment-calculator.html": ["/financial/compound-interest-calculator.html","/financial/retirement-calculator.html","/financial/roth-ira-calculator.html","/financial/net-worth-calculator.html"],
    "/financial/retirement-calculator.html": ["/financial/401k-calculator.html","/financial/roth-ira-calculator.html","/financial/investment-calculator.html","/financial/net-worth-calculator.html"],
    "/financial/401k-calculator.html": ["/financial/retirement-calculator.html","/financial/roth-ira-calculator.html","/financial/investment-calculator.html","/financial/salary-calculator.html"],
    "/financial/roth-ira-calculator.html": ["/financial/401k-calculator.html","/financial/retirement-calculator.html","/financial/investment-calculator.html"],
    "/financial/net-worth-calculator.html": ["/financial/investment-calculator.html","/financial/savings-calculator.html","/financial/retirement-calculator.html","/financial/budget-calculator.html"],
    "/financial/college-savings-calculator.html": ["/financial/savings-goal-calculator.html","/financial/compound-interest-calculator.html","/financial/investment-calculator.html"],
    "/financial/salary-calculator.html": ["/financial/paycheck-calculator.html","/financial/tax-calculator.html","/financial/budget-calculator.html"],
    "/financial/paycheck-calculator.html": ["/financial/salary-calculator.html","/financial/tax-calculator.html","/financial/budget-calculator.html"],
    "/financial/tax-calculator.html": ["/financial/salary-calculator.html","/financial/paycheck-calculator.html","/financial/sales-tax-calculator.html"],
    "/financial/sales-tax-calculator.html": ["/financial/tax-calculator.html","/financial/vat-calculator.html","/financial/discount-calculator.html"],
    "/financial/vat-calculator.html": ["/financial/sales-tax-calculator.html","/financial/tax-calculator.html"],
    "/financial/discount-calculator.html": ["/financial/sales-tax-calculator.html","/other/markup-margin-calculator.html","/math/percentage-calculator.html","/guides/discount-calculator-guide.html"],
    "/financial/commission-calculator.html": ["/financial/salary-calculator.html","/other/markup-margin-calculator.html","/financial/freelance-rate-calculator.html"],
    "/financial/freelance-rate-calculator.html": ["/financial/salary-calculator.html","/financial/commission-calculator.html","/financial/tax-calculator.html"],
    "/financial/rent-calculator.html": ["/financial/house-affordability-calculator.html","/financial/rental-yield-calculator.html","/financial/budget-calculator.html"],
    "/financial/rental-yield-calculator.html": ["/financial/rent-calculator.html","/financial/house-flip-calculator.html","/financial/mortgage-calculator.html"],
    "/financial/house-flip-calculator.html": ["/financial/rental-yield-calculator.html","/financial/mortgage-calculator.html","/financial/house-affordability-calculator.html"],
    "/financial/bond-calculator.html": ["/financial/cd-calculator.html","/financial/annuity-calculator.html","/financial/investment-calculator.html"],
    "/financial/cd-calculator.html": ["/financial/bond-calculator.html","/financial/savings-calculator.html","/financial/compound-interest-calculator.html"],
    "/financial/annuity-calculator.html": ["/financial/retirement-calculator.html","/financial/bond-calculator.html","/financial/investment-calculator.html"],
    "/financial/inflation-calculator.html": ["/financial/investment-calculator.html","/financial/salary-calculator.html","/financial/retirement-calculator.html"],
    "/financial/student-loan-calculator.html": ["/financial/debt-payoff-calculator.html","/financial/loan-calculator.html","/guides/student-loan-guide.html"],
    "/health/bmi-calculator.html": ["/health/body-fat-calculator.html","/health/healthy-weight-range-calculator.html","/health/ideal-weight-calculator.html","/what-is-a-good-bmi.html"],
    "/health/bmr-calculator.html": ["/health/tdee-calculator.html","/health/calorie-calculator.html","/health/macro-calculator.html"],
    "/health/tdee-calculator.html": ["/health/bmr-calculator.html","/health/calorie-calculator.html","/health/weight-loss-calorie-calculator.html","/health/macro-calculator.html"],
    "/health/calorie-calculator.html": ["/health/tdee-calculator.html","/health/bmr-calculator.html","/health/weight-loss-calorie-calculator.html"],
    "/health/weight-loss-calorie-calculator.html": ["/health/calorie-calculator.html","/health/tdee-calculator.html","/health/macro-calculator.html"],
    "/health/macro-calculator.html": ["/health/calorie-calculator.html","/health/tdee-calculator.html","/health/protein-calculator.html"],
    "/health/protein-calculator.html": ["/health/macro-calculator.html","/health/calorie-calculator.html","/health/lean-body-mass-calculator.html"],
    "/health/body-fat-calculator.html": ["/health/bmi-calculator.html","/health/lean-body-mass-calculator.html","/health/waist-to-height-ratio-calculator.html"],
    "/health/waist-to-hip-ratio-calculator.html": ["/health/waist-to-height-ratio-calculator.html","/health/body-fat-calculator.html","/health/bmi-calculator.html"],
    "/health/waist-to-height-ratio-calculator.html": ["/health/waist-to-hip-ratio-calculator.html","/health/body-fat-calculator.html","/health/bmi-calculator.html"],
    "/health/due-date-calculator.html": ["/health/ovulation-calculator.html","/health/pregnancy-weight-gain-calculator.html","/health/pregnancy-calorie-needs-calculator.html"],
    "/health/ovulation-calculator.html": ["/health/due-date-calculator.html","/health/period-calculator.html"],
    "/health/period-calculator.html": ["/health/ovulation-calculator.html","/health/due-date-calculator.html"],
    "/other/gpa-calculator.html": ["/other/grade-needed-calculator.html","/math/weighted-average-calculator.html"],
    "/other/grade-needed-calculator.html": ["/other/gpa-calculator.html","/math/weighted-average-calculator.html"],
    "/math/percentage-calculator.html": ["/financial/discount-calculator.html","/math/percent-error-calculator.html","/guides/percentage-guide.html"],
    "/other/date-calculator.html": ["/other/hours-calculator.html","/other/time-calculator.html","/other/age-calculator.html"],
    "/other/age-calculator.html": ["/other/date-calculator.html","/other/pet-age-calculator.html"]
  };

  function slugToName(href){
    var seg = href.split('/').pop().replace('.html','');
    return seg.replace(/-/g,' ').replace(/\b\w/g, function(c){return c.toUpperCase();});
  }

  function render(container, links, allCalcs){
    var byHref = {};
    (allCalcs||[]).forEach(function(c){ byHref[c.href] = c.name; });
    container.innerHTML = links.map(function(href){
      var name = byHref[href] || slugToName(href);
      return '<a href="'+href+'" class="tool-link">'+name+' <span class="arrow">\u2192</span></a>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function(){
    var container = document.getElementById('related-calcs');
    if(!container) return;
    var path = window.location.pathname;
    var picks = RELATIONS[path];

    function finish(allCalcs){
      if(!picks || !picks.length){
        var category = path.split('/')[1];
        var pool = (allCalcs||[]).filter(function(c){ return c.href.indexOf('/'+category+'/') === 0 && c.href !== path; });
        for(var i = pool.length - 1; i > 0; i--){
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
        }
        picks = pool.slice(0,6).map(function(c){ return c.href; });
      }
      render(container, picks, allCalcs);
    }

    fetch('/calculators.json').then(function(r){ return r.json(); }).then(finish).catch(function(){ finish([]); });
  });
})();
