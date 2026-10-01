/* Rent calculator — CalculatePilot (Stitch 1:1 redesign).
   Max rent: conservative = 25% of net monthly pay (gross × (1 − effective tax)); standard = 30% of gross monthly;
   40x rule = annual income ÷ 40; custom = target % of gross monthly. Total burden = (rent + debt) ÷ gross monthly
   (≤36% healthy, ≤43% manageable, above that high). Move-in = first month + deposit + broker fee + application/moving. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('es-ES'):'—';}
function P(x){return isFinite(x)?x.toFixed(1)+'%':'—';}
function maxRent(inc,etr,std,pct){var g=inc/12;return std==='s1'?g*(1-etr/100)*.25:std==='s3'?inc/40:std==='s4'?g*pct/100:g*.30;}

function compute(){
  var inc=Math.max(0,v('inc')),g=inc/12,debt=Math.max(0,v('debt')),etr=Math.min(60,Math.max(0,v('etr'))),std=$('std').value,pct=Math.max(0,v('rentPercent')),util=Math.max(0,v('util')),app=Math.max(0,v('app'));
  $('cRow').hidden=std!=='s4';C.text('moInc',M(g)+'/mo gross');
  var r=maxRent(inc,etr,std,pct),x40=inc/40,fe=g?r/g*100:0,be=g?(r+debt)/g*100:0,net=g*(1-etr/100);
  C.text('resultValue',M(r));C.text('outAnnual',M(r*12));C.text('stdT',['25 % del salario neto','30 % del bruto','Ingreso anual ÷ 40','Personalizada '+(+pct)+'% del bruto'][+std.slice(1)-1]);
  var tier=be<=36?'Dentro de la pauta (saludable)':be<=43?'Manejable — vigila la deuda':'Carga alta';C.text('tierT',tier);
  C.text('x40',M(x40));C.text('x40N',M(inc)+' ÷ 40'+(r<=x40+0.5?' — cumples los requisitos':' — tu alquiler lo supera en '+M(r-x40)));
  C.text('true',M(r+util));C.text('fe',P(fe)+' del bruto');C.text('be',P(be));$('be').className=be<=36?'g':be<=43?'':'r';C.text('beN',be<=36?'Saludable (36 % o menos)':be<=43?'Manejable (36–43 %)':'Alta (más del 43 %)');
  C.text('cfN',P(etr)+' impuesto efectivo');C.text('net',M(net));C.text('cf1','−'+M(r+util)+' ('+P(net?(r+util)/net*100:0)+')');C.text('cf2','−'+M(debt)+' ('+P(net?debt/net*100:0)+')');
  var left=net-r-util-debt;C.text('cf3',M(left)+' ('+P(net?left/net*100:0)+')');$('cf3').style.color=left<0?'var(--sx-err)':'';
  var dm=+$('dep').value,bm=+$('bro').value,dep=r*dm,bro=r*bm,mi=r+dep+bro+app;
  C.text('miT',M(mi)+' total');C.text('mi1',M(r));C.text('mi2L','Depósito de garantía ('+(dm?dm+' mo':'none')+')');C.text('mi2',M(dep));
  C.text('mi3L','Comisión del corredor'+(bm===1.8?' (15 % del alquiler anual)':bm?' (1 mes)':' (none)'));C.text('mi3',M(bro));C.text('mi4',M(app));
  var rows=[50000,75000,100000,125000,150000,200000];if(rows.indexOf(inc)<0&&inc>0){rows.push(inc);rows.sort(function(a,b){return a-b;});}
  last={rows:rows.map(function(i){return {i:i,a:i/12*.3,b:i/40,c:i/12*(1-etr/100)*.25};}),r:r,mi:mi};
  $('tbl').innerHTML=last.rows.map(function(x){var you=x.i===inc;return '<tr'+(you?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+M(x.i)+' / yr'+(you?' <small class="p">(tu perfil)</small>':'')+'</td><td>'+M(x.a)+' / mo</td><td>'+M(x.b)+' / mo</td><td>'+M(x.c)+' / mo</td><td class="mu">'+M((x.a+util)*3)+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'rnCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('rent-affordability.csv',[{h:'Ingreso anual',key:'i'},{h:'30 % del bruto',key:'a'},{h:'Regla de 40x',key:'b'},{h:'25 % del neto',key:'c'}],last.rows.map(function(x){return {i:x.i,a:Math.round(x.a),b:Math.round(x.b),c:Math.round(x.c)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpRent={maxRent:maxRent};
})();
