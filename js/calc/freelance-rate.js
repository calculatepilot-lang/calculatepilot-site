/* Freelance rate calculator — CalculatePilot (Stitch 1:1 redesign).
   Profit X = revenue × (1 − margin) − expenses. SE tax = 12.4% × min(0.9235X, $184,500 [2026]) + 2.9% × 0.9235X
   (+0.9% above $200,000). Income tax = rate × (X − SE/2 − health − retirement). Solve revenue so that
   X − health − retirement − SE − income tax = target take-home; hourly = revenue ÷ billable hours. */
(function(){
var C=window.CPX,$=C.$,v=C.val,SS_BASE=184500;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function N(x){return Math.round(x).toLocaleString('en-US');}

function inputs(){
  return {net:Math.max(0,v('net')),exp:Math.max(0,v('exp')),health:Math.max(0,v('health')),ret:Math.max(0,v('ret')),weeks:Math.min(52,Math.max(1,v('weeks'))),hrs:Math.max(1,v('hrs')),real:Math.min(100,Math.max(1,v('real'))),itax:Math.max(0,v('itax')),margin:Math.min(90,Math.max(0,v('margin')))};
}
function split(o,G,m){
  var X=G*(1-m/100)-o.exp,b=Math.max(0,X*0.9235),se=0.124*Math.min(b,SS_BASE)+0.029*b+0.009*Math.max(0,b-200000);
  var it=o.itax/100*Math.max(0,X-se/2-o.health-o.ret);
  return {X:X,se:se,it:it,take:X-o.health-o.ret-se-it,margin:G*m/100};
}
function solve(o,m){var lo=0,hi=1e8;for(var k=0;k<90;k++){var mid=(lo+hi)/2;if(split(o,mid,m).take<o.net)lo=mid;else hi=mid;}return hi;}

function compute(){
  var o=inputs(),H=o.weeks*o.hrs*o.real/100,G=solve(o,o.margin),s=split(o,G,o.margin),rate=H>0?G/H:0;
  C.text('realOut',Math.round(o.real)+'% Billable');
  C.text('realMid',(Math.round(o.hrs*o.real/10)/10)+' hrs billable, '+(Math.round(o.hrs*(100-o.real)/10)/10)+' hrs overhead');
  C.text('bhTag',N(H)+' Billable Hrs/Yr');C.text('wkNote',(52-o.weeks)+' week'+(52-o.weeks===1?'':'s')+' unpaid (vacation, holidays, sick)');
  C.text('resultValue',M(rate,2));C.text('day',M(rate*8));C.text('ret100',M(rate*100));C.text('gross',M(G)+' / year');

  var parts=[['Net Personal Take-Home',o.net,'var(--sx-primary)'],['Taxes (SE + Income Tax)',s.se+s.it,'var(--sx-pc)'],['Business Overhead & Insurance',o.exp+o.health,'var(--sx-tertiary)'],['Retirement (Solo 401k / SEP)',o.ret,'var(--sx-fdim)'],['Business Growth & Margin Cushion',s.margin,'var(--sx-sf)']];
  C.text('decTot','100% of '+M(G)+' Gross');
  $('decBar').innerHTML=parts.map(function(p){return '<span style="width:'+(G>0?p[1]/G*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('decList').innerHTML=parts.map(function(p){return '<li><span><i style="background:'+p[2]+'"></i>'+p[0]+'</span><b>'+(G>0?(p[1]/G*100).toFixed(1):'0.0')+'% ('+M(p[1])+')</b></li>';}).join('');

  var g0=solve(o,0),g2=solve(o,Math.min(90,o.margin+15));
  C.text('t1',M(g0/H)+' / hr');C.text('t1g',M(g0)+' gross');C.text('t2',M(rate)+' / hr');C.text('t2g',M(G)+' gross');C.text('t3',M(g2/H)+' / hr');C.text('t3g',M(g2)+' gross');
  C.text('t2d',(52-o.weeks)+' wks off, '+M(o.ret)+' retirement, '+o.margin+'% margin');C.text('t3d','+15 points of margin ('+Math.min(90,o.margin+15)+'%)');
  $('quoteTxt').textContent='Freelance rate quote ('+M(o.net)+' take-home target)\nBreak-even: '+M(g0/H,2)+'/hr\nTarget: '+M(rate,2)+'/hr · '+M(rate*8)+'/day · '+M(rate*100)+'/month (100h)\nPremium: '+M(g2/H,2)+'/hr\nBillable hours: '+N(H)+'/yr';

  var tot=o.weeks*o.hrs;C.text('eqOff','− '+(52-o.weeks));C.text('eqHrs','× '+o.hrs);C.text('eqTot','= '+N(tot)+' total working hrs');C.text('eqTrue',N(H)+' True Hours');C.text('eqReal','At '+Math.round(o.real)+'% billable realization');
  C.text('lgH','Required Hourly Rate ('+M(o.net/1000)+'k Net Target)');
  var rs=[Math.max(30,o.real-15),o.real,Math.min(95,o.real+15)];
  $('lgBody').innerHTML=rs.map(function(r,k){var hh=o.weeks*o.hrs*r/100,act=k===1,via=r<55?'High overhead / heavy pitching':r<=75?'Sustainable balance':'Burnout risk / retainer-heavy';
    return '<tr'+(act?' class="act"':'')+'><td>'+Math.round(r)+'% Billable'+(act?' (Current Baseline)':'')+'</td><td>'+(Math.round(o.hrs*r/10)/10)+' hrs / wk</td><td>'+N(hh)+' hrs / yr</td><td class="mono" style="font-size:15px">'+M(G/hh,2)+' / hr</td><td><span class="via">'+via+'</span></td></tr>';}).join('');
  C.text('pmIntro','Your '+M(rate)+'/hr rate is the floor. Pure hourly billing can penalize you for working faster, so consider packaging time differently:');
  C.text('pmDay','Day Rates ('+M(rate*8)+'/day)');C.text('pmRet','Monthly Retainers ('+M(rate*100)+'/mo for 100 hours)');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'frCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpFreelance={solve:solve,split:split};
})();
