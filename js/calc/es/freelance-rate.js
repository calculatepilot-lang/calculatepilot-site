/* Freelance rate calculator — CalculatePilot (Stitch 1:1 redesign).
   Profit X = revenue × (1 − margin) − expenses. SE tax = 12.4% × min(0.9235X, $184,500 [2026]) + 2.9% × 0.9235X
   (+0.9% above $200,000). Income tax = rate × (X − SE/2 − health − retirement). Solve revenue so that
   X − health − retirement − SE − income tax = target take-home; hourly = revenue ÷ billable hours. */
(function(){
var C=window.CPX,$=C.$,v=C.val,SS_BASE=184500;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function N(x){return Math.round(x).toLocaleString('es-ES');}

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
  C.text('realOut',Math.round(o.real)+'% facturable');
  C.text('realMid',(Math.round(o.hrs*o.real/10)/10)+' h facturables, '+(Math.round(o.hrs*(100-o.real)/10)/10)+' h de gastos generales');
  C.text('bhTag',N(H)+' Horas facturables/año');C.text('wkNote',(52-o.weeks)+' week'+(52-o.weeks===1?'':'s')+' sin remunerar (vacaciones, festivos, bajas por enfermedad)');
  C.text('resultValue',M(rate,2));C.text('day',M(rate*8));C.text('ret100',M(rate*100));C.text('gross',M(G)+' / year');

  var parts=[['Ingresos personales netos',o.net,'var(--sx-primary)'],['Impuestos (autónomo + renta)',s.se+s.it,'var(--sx-pc)'],['Gastos generales del negocio y seguros',o.exp+o.health,'var(--sx-tertiary)'],['Jubilación (Solo 401k / SEP)',o.ret,'var(--sx-fdim)'],['Crecimiento del negocio y margen de seguridad',s.margin,'var(--sx-sf)']];
  C.text('decTot','100 % de '+M(G)+' Bruto');
  $('decBar').innerHTML=parts.map(function(p){return '<span style="width:'+(G>0?p[1]/G*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('decList').innerHTML=parts.map(function(p){return '<li><span><i style="background:'+p[2]+'"></i>'+p[0]+'</span><b>'+(G>0?(p[1]/G*100).toFixed(1):'0.0')+'% ('+M(p[1])+')</b></li>';}).join('');

  var g0=solve(o,0),g2=solve(o,Math.min(90,o.margin+15));
  C.text('t1',M(g0/H)+' / hr');C.text('t1g',M(g0)+' gross');C.text('t2',M(rate)+' / hr');C.text('t2g',M(G)+' gross');C.text('t3',M(g2/H)+' / hr');C.text('t3g',M(g2)+' gross');
  C.text('t2d',(52-o.weeks)+' semanas libres, '+M(o.ret)+' jubilación, '+o.margin+'% de margen');C.text('t3d','+15 puntos de margen ('+Math.min(90,o.margin+15)+'%)');
  $('quoteTxt').textContent='Presupuesto de tarifa freelance ('+M(o.net)+' objetivo de ingresos netos)\nPunto de equilibrio: '+M(g0/H,2)+'/hr\nTarget: '+M(rate,2)+'/hr · '+M(rate*8)+'/day · '+M(rate*100)+'/month (100h)\nPremium: '+M(g2/H,2)+'/hr\nBillable hours: '+N(H)+'/yr';

  var tot=o.weeks*o.hrs;C.text('eqOff','− '+(52-o.weeks));C.text('eqHrs','× '+o.hrs);C.text('eqTot','= '+N(tot)+' horas de trabajo totales');C.text('eqTrue',N(H)+' Horas reales');C.text('eqReal','At '+Math.round(o.real)+'% de realización facturable');
  C.text('lgH','Tarifa por hora necesaria ('+M(o.net/1000)+'k de objetivo neto)');
  var rs=[Math.max(30,o.real-15),o.real,Math.min(95,o.real+15)];
  $('lgBody').innerHTML=rs.map(function(r,k){var hh=o.weeks*o.hrs*r/100,act=k===1,via=r<55?'Gastos generales altos / mucha prospección':r<=75?'Equilibrio sostenible':'Riesgo de agotamiento / mucha dependencia de iguales';
    return '<tr'+(act?' class="act"':'')+'><td>'+Math.round(r)+'% facturable'+(act?' (base actual)':'')+'</td><td>'+(Math.round(o.hrs*r/10)/10)+' h / sem</td><td>'+N(hh)+' h / año</td><td class="mono" style="font-size:15px">'+M(G/hh,2)+' / hr</td><td><span class="via">'+via+'</span></td></tr>';}).join('');
  C.text('pmIntro','Tu '+M(rate)+'/hr rate is the floor. Pure hourly billing can penalize you for working faster, so consider packaging time differently:');
  C.text('pmDay','Tarifas por día ('+M(rate*8)+'/day)');C.text('pmRet','Iguales mensuales ('+M(rate*100)+'/mo for 100 hours)');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'frCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpFreelance={solve:solve,split:split};
})();
