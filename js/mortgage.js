function calculateMortgage(){const homePrice=parseFloat(document.getElementById('homePrice').value)||0;const downPayment=parseFloat(document.getElementById('downPayment').value)||0;const termYears=parseFloat(document.getElementById('loanTerm').value)||30;const rate=parseFloat(document.getElementById('interestRate').value)||0;const annualTax=parseFloat(document.getElementById('propertyTax').value)||0;const annualInsurance=parseFloat(document.getElementById('homeInsurance').value)||0;
const principal=Math.max(homePrice-downPayment,0);const n=termYears*12;const monthlyRate=(rate/100)/12;let piPayment=0;if(monthlyRate>0){piPayment=principal*(monthlyRate*Math.pow(1+monthlyRate,n))/(Math.pow(1+monthlyRate,n)-1);}else{piPayment=n>0?principal/n:0;}
const monthlyTax=annualTax/12;const monthlyInsurance=annualInsurance/12;const totalMonthly=piPayment+monthlyTax+monthlyInsurance;const totalRepayment=piPayment*n;const totalInterest=totalRepayment-principal;
var el=document.getElementById('resultValue');if(el)el.textContent=isFinite(totalMonthly)?cpFormatMoney(totalMonthly):'—';
el=document.getElementById('outPrincipalInterest');if(el)el.textContent=isFinite(piPayment)?cpFormatMoney(piPayment):'—';
el=document.getElementById('outTax');if(el)el.textContent=cpFormatMoney(monthlyTax);
el=document.getElementById('outInsurance');if(el)el.textContent=cpFormatMoney(monthlyInsurance);
el=document.getElementById('outLoanAmount');if(el)el.textContent=cpFormatMoney(principal);
el=document.getElementById('outTotalInterest');if(el)el.textContent=isFinite(totalInterest)?cpFormatMoney(totalInterest):'—';
}
document.addEventListener('DOMContentLoaded',()=>{var form=document.getElementById('calcForm');if(form)form.addEventListener('input',calculateMortgage);calculateMortgage();});
(function(){var s=document.createElement('script');s.src='/js/mortgage-workspace.js?v=20260923d';s.defer=true;document.head.appendChild(s);})();
