/* Discount calculator — CalculatePilot (Stitch 1:1 redesign).
   Sale = price after discount 1 (percent or amount), then discount 2 applied to that sale price. Tax = sale × tax rate.
   Effective discount = 1 − sale/original. Seller margin = (price − COGS) ÷ price; volume to break even = GP_full ÷ GP_sale − 1. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function P(x,d){return isFinite(x)?x.toFixed(d===undefined?1:d)+'%':'—';}
function apply(p,d,pct){return Math.max(0,pct?p*(1-Math.min(100,d)/100):p-d);}

function compute(){
  var o=Math.max(0,v('originalPrice')),d1=Math.max(0,v('discountPercent')),d2=Math.max(0,v('d2')),p1=$('t1').value==='s1',p2=$('t2').value==='s1',tx=Math.max(0,v('tax')),c=Math.max(0,v('cogs'));
  C.text('u1',p1?'%':'$ de descuento');C.text('u2',p2?'%':'$ de descuento');
  var s1=apply(o,d1,p1),s=apply(s1,d2,p2),tax=s*tx/100,tot=s+tax,sav=o-s,eff=o?sav/o*100:0;
  C.text('resultValue',M(s));C.text('outTotal',M(tot));C.text('taxN',tx?'Incluye '+M(tax)+' impuesto sobre las ventas ('+(+tx.toFixed(3))+'%)':'Sin impuesto sobre las ventas');
  C.text('outSavings',M(sav));C.text('saveN',P(eff)+' descuento efectivo');C.text('orig',M(o));C.text('effTag',P(eff,2)+' off');
  var lab1=p1?(+d1)+'%':M(d1)+' off',lab2=p2?(+d2)+'%':M(d2)+' off';
  if(d2>0){C.text('stackH','Por qué '+lab1+' + '+lab2+' no es '+(p1&&p2?(d1+d2)+'% de descuento':'una simple suma'));
    $('stackT').innerHTML='1. Principal '+lab1+': '+M(o)+(p1?' × (1 − '+(d1/100).toFixed(2)+')':' − '+M(d1))+' = '+M(s1)+'<br>2. Acumulado '+lab2+': '+M(s1)+(p2?' × (1 − '+(d2/100).toFixed(2)+')':' − '+M(d2))+' = '+M(s)+(p1&&p2?'<br>Multiplicador combinado: '+(1-d1/100).toFixed(2)+' × '+(1-d2/100).toFixed(2)+' = '+((1-d1/100)*(1-d2/100)).toFixed(4):'')+'<br><b>Descuento efectivo: '+P(eff,2)+'</b>';}
  else{C.text('stackH','Comprobación del descuento');$('stackT').innerHTML=M(o)+(p1?' × (1 − '+(d1/100).toFixed(2)+')':' − '+M(d1))+' = '+M(s)+'<br>Inverso: original = oferta ÷ (1 − descuento) = '+(p1&&d1<100?M(s/(1-d1/100)):M(s+d1));}
  var mb=$('mBox');mb.hidden=!(c>0);
  var gp0=o-c,gp=s-c;C.text('mCogs','COGS '+M(c));
  C.text('m1',M(gp0)+' ('+P(o?gp0/o*100:0)+')');C.text('m2',M(gp)+' ('+P(s?gp/s*100:0)+')');C.text('m3','−'+M(gp0-gp)+' ('+P(gp0>0?(gp0-gp)/gp0*100:0)+' del beneficio bruto)');
  var sc=[['Precio completo (referencia)',0,0],['10% de descuento',10,0],['20% de descuento',20,0],['30% de descuento',30,0],['Tu promoción',null,null],['Acumulado: 30% + 10%',30,10],['Acumulado: 40% + 20%',40,20]];
  var rows=sc.map(function(x){var sp=x[1]===null?s:o*(1-x[1]/100)*(1-x[2]/100),g=sp-c,need=c>0&&gp0>0?(g>0?(gp0/g-1)*100:Infinity):null;return {n:x[1]===null?'Tu promoción (actual)':x[0],e:o?(1-sp/o)*100:0,p:sp,sv:o-sp,g:g,m:sp?g/sp*100:0,need:need,cur:x[1]===null};});
  last={rows:rows};C.text('mxTag','Precio original: '+M(o));
  $('tbl').innerHTML=rows.map(function(x){return '<tr'+(x.cur?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x.n+'</td><td>'+P(x.e)+'</td><td class="b">'+M(x.p)+'</td><td>'+M(x.sv)+'</td><td'+(x.g<0?' class="r"':'')+'>'+(c>0?M(x.g):'—')+'</td><td>'+(c>0?P(x.m):'—')+'</td><td>'+(x.need===null?'—':x.e===0?'Base':x.need===Infinity?'<span style="color:var(--sx-err)">Pérdida: ningún volumen la recupera</span>':'+'+P(x.need)+' units')+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'dcCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('discount-matrix.csv',[{h:'Escenario',key:'n'},{h:'Descuento efectivo %',key:'e'},{h:'Precio',key:'p'},{h:'Ahorros',key:'s'},{h:'Beneficio bruto/unidad',key:'g'},{h:'Volumen adicional necesario %',key:'v'}],last.rows.map(function(x){return {n:x.n,e:x.e.toFixed(2),p:x.p.toFixed(2),s:x.sv.toFixed(2),g:x.g.toFixed(2),v:x.need===null||x.need===Infinity?'':x.need.toFixed(1)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpDiscount={apply:apply};
})();
