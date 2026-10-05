/* UK take-home pay 2026/27 — CalculatePilot (Stitch 1:1 redesign).
   Figures verified against GOV.UK (rates and thresholds for employers 2026 to 2027, student loan
   thresholds, Blind Person's Allowance). Annualised PAYE, not a cumulative payroll run. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var PA=12570,TAPER_FROM=100000,ADD_FROM=125140,BASIC=37700,NI_PT=12570,NI_UEL=50270,MA=1260,BPA=3250;
var SC={starter:3967,basic:12989,inter:14136,higher:31338};
var PLANS={plan1:{m:2241,r:0.09},plan2:{m:2448,r:0.09},plan4:{m:2816,r:0.09},plan5:{m:2083,r:0.09},pg:{m:1750,r:0.06}};
var gbp=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0});
var gbp2=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',minimumFractionDigits:2,maximumFractionDigits:2});
function P(x){return gbp.format(x);}function P2(x){return gbp2.format(x);}
function pence(n){return Math.round(n*100)/100;}

function taperedPA(income){return income<=TAPER_FROM?PA:Math.max(0,PA-Math.floor((income-TAPER_FROM)/2));}

/* returns {kind:'normal'|'flat'|'nt', allowance, flatBand, label, ok, standard} */
function parseCode(raw){
  var c=String(raw||'').toUpperCase().replace(/\s+/g,'').replace(/(W1|M1|X)$/,'').replace(/^[SC]/,'');
  var m;
  if(c==='NT')return {kind:'nt',label:'NT = no tax deducted',ok:true};
  if(c==='BR')return {kind:'flat',band:1,label:'BR = all pay taxed at the basic rate',ok:true};
  if(c==='D0')return {kind:'flat',band:2,label:'D0 = all pay taxed at the higher rate',ok:true};
  if(c==='D1')return {kind:'flat',band:3,label:'D1 = all pay taxed at the additional rate',ok:true};
  if(c==='0T')return {kind:'normal',allowance:0,label:'0T = no tax-free allowance',ok:true};
  if((m=c.match(/^K(\d{1,4})$/)))return {kind:'normal',allowance:-m[1]*10,label:'K'+m[1]+' = '+P(m[1]*10)+' added to taxable pay',ok:true};
  if((m=c.match(/^(\d{1,4})([LMNT])$/))){var a=m[1]*10;return {kind:'normal',allowance:a,standard:m[1]==='1257',label:(m[1]==='1257'?'Standard ':'')+m[1]+m[2]+' = '+P(a)+' tax-free',ok:true};}
  return {kind:'normal',allowance:PA,standard:true,label:'Unrecognised code — using 1257L',ok:false};
}

function bandsTax(taxable,region){
  taxable=Math.max(0,taxable);
  if(region==='scot'){
    var s=Math.min(taxable,SC.starter),b=Math.min(Math.max(0,taxable-SC.starter),SC.basic),used=SC.starter+SC.basic;
    var i=Math.min(Math.max(0,taxable-used),SC.inter);used+=SC.inter;
    var h=Math.min(Math.max(0,taxable-used),SC.higher);used+=SC.higher;
    var ad=Math.min(Math.max(0,taxable-used),Math.max(0,ADD_FROM-used)),top=Math.max(0,taxable-ADD_FROM);
    var band=top>0?6:ad>0?5:h>0?4:i>0?3:b>0?2:s>0?1:0;
    return {tax:pence(s*.19+b*.20+i*.21+h*.42+ad*.45+top*.48),band:band};
  }
  var bb=Math.min(taxable,BASIC),hh=Math.min(Math.max(0,taxable-BASIC),ADD_FROM-BASIC),aa=Math.max(0,taxable-ADD_FROM);
  return {tax:pence(bb*.2+hh*.4+aa*.45),band:aa>0?3:hh>0?2:bb>0?1:0};
}
function flatTax(pay,band,region){var r=region==='scot'?[0,.20,.42,.45][band]:[0,.20,.40,.45][band];return {tax:pence(pay*r),band:region==='scot'?[0,2,4,5][band]:band};}

function incomeTax(chargeable,o,region){
  var code=o.code,allow,res;
  if(code.kind==='nt')return {tax:0,allow:0,band:0,ma:0};
  if(code.kind==='flat'){res=flatTax(chargeable,code.band,region);return {tax:res.tax,allow:0,band:res.band,ma:0};}
  allow=code.standard?taperedPA(chargeable):code.allowance;
  if(o.bpa)allow+=BPA;
  res=bandsTax(chargeable-allow,region);
  var ma=0;
  if(o.ma){var basicOnly=region==='scot'?res.band<=3:res.band<=1;if(basicOnly)ma=Math.min(MA*0.2,res.tax);}
  return {tax:pence(res.tax-ma),allow:Math.max(0,allow),band:res.band,ma:ma};
}
function ni(pay){return pence(0.08*Math.max(0,Math.min(pay,NI_UEL)-NI_PT)+0.02*Math.max(0,pay-NI_UEL));}
function loanSlice(monthlyPay,plan){return Math.floor(pence(Math.max(0,pence(monthlyPay-plan.m))*plan.r));}

function inputs(){
  var per=$('period').value,raw=Math.max(0,v('gross')),hours=Math.max(1,v('hours')||37.5);
  var gross=per==='month'?raw*12:per==='week'?raw*52:per==='hour'?raw*hours*52:raw;
  return {per:per,raw:raw,hours:hours,gross:pence(gross),region:$('region').value,pct:Math.max(0,Math.min(20,v('pension')))/100,penType:$('penType').value,
    sl:$('sl').value,code:parseCode($('taxCode').value),ma:$('ma').checked,bpa:$('bpa').checked};
}

function calc(o,region){
  var contrib=pence(o.gross*o.pct),ss=o.penType==='ss';
  var chargeable=ss?Math.max(0,o.gross-contrib):o.gross;
  var it=incomeTax(chargeable,o,region),nic=ni(chargeable);
  var monthly=pence(chargeable/12),sl=0;
  o.sl.split('+').forEach(function(k){if(PLANS[k])sl+=loanSlice(monthly,PLANS[k]);});
  sl*=12;
  var penCost=ss?contrib:pence(contrib*0.8);
  var net=pence(o.gross-penCost-it.tax-nic-sl);
  return {gross:o.gross,contrib:contrib,penCost:penCost,chargeable:chargeable,tax:it.tax,allow:it.allow,band:it.band,ma:it.ma,ni:nic,sl:sl,net:net};
}

function compute(){
  var o=inputs(),r=calc(o,o.region),other=calc(o,o.region==='scot'?'ruk':'scot'),g=r.gross||1;
  $('hoursRow').hidden=o.per!=='hour';
  C.text('grossHint',{year:'Pre-tax annual base',month:'Pre-tax monthly pay',week:'Pre-tax weekly pay',hour:'Pre-tax hourly rate'}[o.per]);
  C.text('penLbl',(o.pct*100).toString().replace(/\.0$/,'')+'% ('+P(r.contrib)+' / yr)');
  var ci=$('taxCode');ci.classList.toggle('bad',!o.code.ok);C.text('codeHint',o.code.label+(o.bpa&&o.code.kind==='normal'?' + £3,250 BPA':''));

  C.text('resultValue',P(r.net/12));C.text('annNet',P(r.net));
  C.text('weekNet',P2(r.net/52));C.text('dayNet',P2(r.net/260));
  C.text('effBadge','Effective Deductions: '+((g-r.net)/g*100).toFixed(1)+'%');
  var segs=[['Net Pay',r.net,'#b0ecd3'],['Tax',r.tax,'#fbbf24'],['NI',r.ni,'#93c5fd'],['Pension',r.penCost,'#6ee7b7'],['Student Loan',r.sl,'#c4b5fd']];
  $('ukBar').innerHTML=segs.map(function(s){return s[1]>0?'<span style="width:'+(s[1]/g*100)+'%;background:'+s[2]+'" title="'+s[0]+': '+P(s[1])+'"></span>':'';}).join('');
  $('ukLeg').innerHTML=segs.filter(function(s,i){return i<4||s[1]>0;}).map(function(s){return '<span><i style="background:'+s[2]+'"></i>'+s[0]+' ('+(s[1]/g*100).toFixed(1)+'%)</span>';}).join('');

  var scot=o.region==='scot',ras=o.penType==='ras';
  function row(cls,label,dot,y,pct,neg){return '<tr class="'+cls+'"><td><span>'+(dot?dot:'')+label+'</span></td><td class="'+(neg&&y>0?'neg':'')+'">'+(neg?(y>0?'-':'-')+P(y).replace('-',''):P(y))+'</td><td class="'+(neg&&y>0?'neg':'')+'">'+(neg?'-':'')+P(y/12).replace('-','')+'</td><td>'+pct+'</td></tr>';}
  var ded=r.gross-r.net;
  var h=row('g','Gross Total Salary','<i style="background:var(--sx-pc)"></i>',r.gross,'100.0%',false)+
    '<tr class="pa"><td><span><span class="msym" aria-hidden="true">shield</span>Tax-Free Personal Allowance</span></td><td>'+P(r.allow)+'</td><td>'+P(r.allow/12)+'</td><td>0.0% Tax</td></tr>'+
    row('','Income Tax ('+(scot?'Scottish ':'')+'PAYE)'+(r.ma?' after £252 Marriage Allowance':''),'<i style="background:#f59e0b"></i>',r.tax,(r.tax/g*100).toFixed(1)+'%',true)+
    row('','National Insurance (Class 1 @ 8%)','<i style="background:#3b82f6"></i>',r.ni,(r.ni/g*100).toFixed(1)+'%',true)+
    row('','Workplace Pension (Employee)'+(ras&&r.contrib?' — '+P(r.contrib)+' incl. 20% relief':''),'<i style="background:#10b981"></i>',r.penCost,(r.penCost/g*100).toFixed(1)+'%',true)+
    row('','Student Loan Repayment','<i style="background:#8b5cf6"></i>',r.sl,(r.sl/g*100).toFixed(1)+'%',true)+
    '<tr class="tot"><td><span><span class="msym" aria-hidden="true">do_not_disturb_on</span>Total Deductions</span></td><td class="neg">-'+P(ded)+'</td><td class="neg">-'+P(ded/12)+'</td><td>'+(ded/g*100).toFixed(1)+'%</td></tr>'+
    '<tr class="net"><td><span><span class="msym" aria-hidden="true">check_circle</span>Net Take-Home Pay</span></td><td>'+P(r.net)+'</td><td>'+P(r.net/12)+'</td><td>'+(r.net/g*100).toFixed(1)+'%</td></tr>';
  $('wfBody').innerHTML=h;
  C.text('wfTag',scot?'Scottish PAYE Schedule':'UK PAYE Schedule');
  C.text('cmpTxt',scot?'Compare rUK Rates':'Compare Scottish Rates');

  document.querySelectorAll('#rukTable tr[data-b]').forEach(function(tr){tr.classList.toggle('you',!scot&&+tr.getAttribute('data-b')===r.band);});
  document.querySelectorAll('#scotTable tr[data-b]').forEach(function(tr){tr.classList.toggle('you',scot&&+tr.getAttribute('data-b')===r.band);});

  var notes=[],diff=r.tax-other.tax;
  if(Math.abs(diff)>=1)notes.push((scot?'In Scotland you pay ':'In Scotland you would pay ')+P(Math.abs(scot?diff:-diff))+(((scot?diff:-diff)>0)?' more':' less')+' income tax a year than in England, Wales & NI on this salary.');
  if(o.code.standard&&r.chargeable>TAPER_FROM)notes.push('Personal allowance is tapered above £100,000 (reduced by £1 for every £2).');
  if(o.ma&&!r.ma)notes.push('Marriage Allowance only applies to basic-rate taxpayers'+(scot?' (starter, basic or intermediate in Scotland)':'')+', so it is not applied here.');
  if(ras&&r.contrib&&r.band>=(scot?4:2))notes.push('Higher-rate relief on relief-at-source contributions is claimed through Self Assessment and is not included.');
  if(!o.code.ok)notes.push('Tax code not recognised — showing the standard 1257L allowance.');
  var n=$('calcNote');n.hidden=!notes.length;n.textContent=notes.join(' ');n.classList.toggle('warn',!o.code.ok);
}

document.addEventListener('DOMContentLoaded',function(){
  /* switching the period converts the amount so the salary stays the same */
  var prevPer='year';
  $('period').addEventListener('input',function(){var o=inputs(),per=$('period').value,h=o.hours;var annual=prevPer==='month'?o.raw*12:prevPer==='week'?o.raw*52:prevPer==='hour'?o.raw*h*52:o.raw;
    var val=per==='month'?annual/12:per==='week'?annual/52:per==='hour'?annual/52/h:annual;$('gross').value=Math.round(val*100)/100;prevPer=per;});
  $('cmpBtn').addEventListener('click',function(){var r=$('region');r.value=r.value==='scot'?'ruk':'scot';r.dispatchEvent(new Event('input',{bubbles:true}));});
  C.init({root:'ukPay',compute:compute});
  prevPer=$('period').value;
});
window.cpUkPay={calc:calc,parseCode:parseCode};
})();
