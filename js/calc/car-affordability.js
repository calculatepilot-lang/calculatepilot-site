/* Car affordability calculator (20/4/10 rule) — CalculatePilot (Stitch 1:1 redesign).
   Ceiling = 10% of take-home (or gross); loan payment = ceiling − insurance − running costs;
   max price = min(loan PV + down, down / 20%). Tax and dealer fees excluded. */
(function(){
var C=window.CPX,$=C.$,v=C.val,mode='month';

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}
function pv(pay,apr,n){var i=apr/100/12;if(pay<=0||n<=0)return 0;if(!i)return pay*n;return pay*(1-Math.pow(1+i,-n))/i;}

function inputs(){
  var g=Math.max(0,v('gross'));
  return {grossM:$('incMode').value==='year'?g/12:g,net:Math.max(0,v('net')),anchor:$('anchor').value,down:Math.max(0,v('down')),
    ins:Math.max(0,v('ins')),ops:Math.max(0,v('ops')),debts:Math.max(0,v('debts')),term:Math.max(1,v('term')),apr:Math.max(0,v('apr'))};
}

function calc(o,pct){
  var base=o.anchor==='net'?o.net:o.grossM,ceil=base*pct/100,loanMax=Math.max(0,ceil-o.ins-o.ops);
  var byBudget=pv(loanMax,o.apr,o.term)+o.down,byDown=o.down/0.2,price=Math.min(byBudget,byDown),fin=Math.max(0,price-o.down),pay=pmt(fin,o.apr,o.term);
  return {base:base,ceil:ceil,loanMax:loanMax,price:price,fin:fin,pay:pay,downBinds:byDown<byBudget,total:pay+o.ins+o.ops,repaid:pay*o.term};
}

function audit(id,pass,txt,head){var li=$(id);li.className=pass?'':'fail';li.querySelector('.msym').textContent=pass?'check_circle':'cancel';li.querySelector('em').textContent=pass?'PASSED':'REVIEW';$(id+'t').innerHTML=txt;if(head)C.text(id+'h',head);}

function compute(){
  var o=inputs(),r=calc(o,10),aName=o.anchor==='net'?'Take-Home':'Gross';
  C.text('grossLbl',$('incMode').value==='year'?'Annual Gross Income':'Monthly Gross Income');
  C.text('grossAlt',$('incMode').value==='year'?M(o.grossM)+' / mo':M(o.grossM*12)+' / yr');

  C.text('resultValue',M(r.price));
  C.text('basis','Based on '+M(o.down)+' cash down + '+M(r.fin)+' financed over '+o.term+' months at '+o.apr+'% APR. Sales tax and dealer fees not included.');
  C.text('loanCost','Total Loan Cost: '+M(r.repaid));
  var dti=o.grossM>0?(o.debts+r.pay)/o.grossM*100:0;
  var prudent=o.term<=48&&r.loanMax>0&&dti<=36&&o.down>0,st=$('status');st.textContent='Status: '+(prudent?'Prudent':'Stretched');st.className='sx-au-st8'+(prudent?'':' bad');
  C.text('ceilLbl','Max Total Transportation Ceiling (10% '+aName+')');C.text('ceil',M(r.ceil));
  var t=r.ceil||1;$('barLoan').style.width=Math.min(100,r.pay/t*100)+'%';$('barOps').style.width=Math.max(0,Math.min(100-r.pay/t*100,(o.ins+o.ops)/t*100))+'%';
  C.text('loanPay',M(r.pay)+' / mo');C.text('opsPay',M(o.ins+o.ops)+' / mo');
  C.text('dtiNote',o.grossM>0?'DTI incl. car: '+dti.toFixed(1)+'%':'');$('dtiNote').className=dti>36?'warn':'mu';
  var dn=$('downNote');if(o.down>0){dn.textContent='Meets 20% Baseline';dn.className='ok';}else{dn.textContent='No down payment';dn.className='bad';}

  var dp=r.price>0?o.down/r.price*100:0;
  audit('a1',o.down>0&&dp>=19.99,M(0.2*r.price)+' required for a '+M(r.price)+' price. Available down payment: <b>'+M(o.down,2)+'</b> ('+dp.toFixed(1)+'% of price).'+(r.downBinds?' Your down payment is what caps the price here.':''));
  audit('a2',o.term<=48,o.term<=48?'Loan term of '+o.term+' months stays within the 4-year cap, so the loan is repaid during the steep early part of the depreciation curve.':'A '+o.term+'-month loan exceeds the 4-year cap. It lowers the payment but adds interest and extends the time you may owe more than the car is worth.',(o.term<=48?'4-Year Maximum Loan Duration ('+o.term+' Months)':'4-Year Maximum Loan Duration (Exceeded)'));
  var pct=r.base>0?r.total/r.base*100:0,opsOver=o.ins+o.ops>r.ceil;
  audit('a3',!opsOver&&r.base>0,opsOver?'Insurance and running costs alone ('+M(o.ins+o.ops)+'/mo) exceed the '+M(r.ceil)+' ceiling, so no loan payment fits the 10% rule at this income.':'Total auto costs ('+M(r.total)+'/mo) are '+pct.toFixed(1)+'% of your '+M(r.base)+' '+aName.toLowerCase()+' monthly income. Debt-to-income including this loan: '+dti.toFixed(1)+'% (lenders often prefer under 36%).','10% '+aName+' Allocation Limit');

  [[8,'t8','Low risk, accelerates savings.'],[10,'t10','Target 20/4/10 balance.'],[12,'t12','Caution: limits emergency funds.']].forEach(function(x){var q=calc(o,x[0]);C.text(x[1],M(q.price));C.text(x[1]+'t',M(q.total)+'/mo total cost. '+x[2]);});

  document.querySelectorAll('#bands>div').forEach(function(b,k,all){var lo=+b.getAttribute('data-lo'),hi=+b.getAttribute('data-hi'),mid=(lo+hi)/2;
    b.querySelector('.est').textContent='Est. Loan: '+M(pmt(Math.max(0,mid-o.down),o.apr,o.term))+'/mo';
    b.className=(r.price>=lo&&(r.price<hi||k===all.length-1))?'on':'';});

  $('loanLink').href='/financial/auto-loan-calculator.html?price='+Math.round(r.price)+'&down='+Math.round(o.down)+'&apr='+o.apr+'&term='+o.term+'&trade=0&owed=0&fees=0&tax=0';
  mode=$('incMode').value;
}

document.addEventListener('DOMContentLoaded',function(){
  mode=$('incMode').value;
  /* switching monthly/annual converts the figure so the income itself doesn't change */
  $('incMode').addEventListener('input',function(){var m=this.value;if(m===mode)return;var g=v('gross');$('gross').value=Math.round(m==='year'?g*12:g/12);mode=m;});
  C.init({root:'affCalc',compute:compute});
  mode=$('incMode').value;
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCarAfford={calc:calc};
})();
