/* Bond price calculator — CalculatePilot (Stitch 1:1 redesign).
   Price = Σ C/(1+y)^k + F/(1+y)^n, with C = F × coupon/m, y = YTM/m, n = years × m (priced on a coupon date).
   Macaulay duration = Σ t_k × PV_k ÷ Price (years); modified = Macaulay ÷ (1 + y). Convexity = Σ k(k+1)PV_k ÷ (P(1+y)²m²).
   ±100 bp moves are full repricings. Ledger uses the effective-interest method: interest = book × y, accretion = interest − coupon. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,open=false;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function P(x,d){return isFinite(x)?x.toFixed(d===undefined?2:d)+'%':'—';}
function price(F,cr,ytm,yrs,m){var n=Math.max(1,Math.round(yrs*m)),c=F*cr/100/m,y=ytm/100/m,p=0;for(var k=1;k<=n;k++)p+=(c+(k===n?F:0))/Math.pow(1+y,k);return p;}

function compute(){
  var F=Math.max(0,v('faceValue')),cr=Math.max(0,v('couponRate')),ytm=Math.max(0,v('marketRate')),yrs=Math.max(.5,v('years')),m=+$('paymentsPerYear').value||2,cat=$('cat').value;
  var n=Math.max(1,Math.round(yrs*m)),c=F*cr/100/m,y=ytm/100/m,p=price(F,cr,ytm,yrs,m),fl=['','Anuales','Semi-Annuals','','Trimestrales'][m]||'Periodos';
  C.text('yOut',(+yrs)+' Años ('+n+' '+fl+')');
  var diff=p-F,kind=Math.abs(diff)<0.005?'BONO A LA PAR':diff<0?'BONO CON DESCUENTO':'BONO CON PRIMA';
  C.text('kind',kind);C.text('scen',ytm>cr?'Escenario con descuento (TIR > tasa del cupón)':ytm<cr?'Escenario con prima (TIR < tasa del cupón)':'Escenario a la par (TIR = tasa del cupón)');
  C.text('resultValue',M(p));C.text('prem',Math.abs(diff)<0.005?'Cotiza a la par':(diff<0?'↓ ':'↑ ')+P(Math.abs(diff)/F*100)+' '+(diff<0?'discount':'premium')+' ('+M(Math.abs(diff))+(diff<0?' under':' over')+' a la par)');
  C.text('why',ytm>cr?'El rendimiento requerido ('+P(ytm)+') supera al cupón ('+P(cr)+')':ytm<cr?'El cupón ('+P(cr)+') supera al rendimiento requerido ('+P(ytm)+')':'El cupón es igual al rendimiento de mercado');
  C.text('cy',cr>0?P(F*cr/100/p*100):'0.00%');C.text('cyN',M(F*cr/100)+' cupón anual ÷ '+M(p));
  C.text('ytm',P(ytm));var br=+$('br').value;$('mRow').hidden=cat!=='m';
  C.text('ytmN',cat==='m'?'Rendimiento equivalente antes de impuestos: '+P(ytm/(1-br/100))+' at '+br+'%':cat==='t'?'Exento del impuesto sobre la renta estatal y local':'Interés totalmente sujeto a impuestos');
  C.text('outCoupon',M(c*n));C.text('cpN',n+' periodos × '+M(c));C.text('tr',M(c*n+F-p));C.text('trN','Cupones '+(diff<0?'+ '+M(-diff)+' accretion':diff>0?'− '+M(diff)+' premium':'only'));
  var mac=0,cv=0;for(var k=1;k<=n;k++){var cf=c+(k===n?F:0),pv=cf/Math.pow(1+y,k);mac+=k/m*pv;cv+=k*(k+1)*pv;}mac/=p;var md=mac/(1+y);cv=cv/(p*Math.pow(1+y,2)*m*m);
  C.text('mac',mac.toFixed(2)+' years');C.text('mod',md.toFixed(2)+(md===1?' year':' years')+' (≈'+md.toFixed(2)+'% por cada 1% de variación del rendimiento)');C.text('cvx',cv.toFixed(2));
  var pu=price(F,cr,ytm+1,yrs,m),pd=price(F,cr,Math.max(0,ytm-1),yrs,m);
  C.text('up',M(pu-p)+' ('+P((pu-p)/p*100)+')');C.text('dn','+'+M(pd-p)+' (+'+P((pd-p)/p*100)+')');C.text('mdEx',md.toFixed(2));C.text('mdEx2',md.toFixed(2));
  C.text('ledH',(+yrs)+'-Year '+['','Anual','Semi-Annual','','Trimestral'][m]+' Flujo de caja y '+(diff<=0?'Acreción':'Amortización')+' Libro mayor');C.text('ieH','Interés devengado ('+P(ytm)+' ÷ '+m+')');C.text('acH',diff<=0?'Acreción del descuento':'Amortización de la prima');
  var rows=[{k:0,t:'Liquidación',c:null,ie:null,ac:null,bv:p,pv:p}],bv=p;
  for(var j=1;j<=n;j++){var ie=bv*y,ac=ie-c;bv+=ac;if(j===n)bv=F;rows.push({k:j,t:(j/m%1===0?'Año '+(j/m):j/m<1?'Mes '+Math.round(12*j/m):'Año '+(j/m).toFixed(2).replace(/0$/,''))+(j===n?' (Maturity)':''),c:c+(j===n?F:0),ie:ie,ac:ac,bv:bv,pv:(c+(j===n?F:0))/Math.pow(1+y,j)});}
  last={rows:rows};
  var show=function(k){return open||k<=4||k===Math.round(n/2)||k>=n-1;};
  $('tbl').innerHTML=rows.map(function(x){return '<tr class="bp'+(show(x.k)?'':' hid')+'"'+(x.k===n?' style="background:var(--sx-emb)"':'')+'><td style="font-family:inherit;font-weight:600">'+(x.k?'Periodo '+x.k:'0')+'</td><td style="font-family:inherit">'+x.t+'</td><td>'+(x.c===null?'—':M(x.c)+(x.k===n?' <small class="p">(valor nominal + cupón)</small>':''))+'</td><td>'+(x.ie===null?'—':M(x.ie))+'</td><td class="'+(x.ac>=0?'pos':'r')+'">'+(x.ac===null?'—':(x.ac>=0?'+':'')+M(x.ac))+'</td><td class="b">'+M(x.bv)+'</td><td class="mu">'+M(x.pv)+'</td></tr>';}).join('');
  C.text('expTxt',open?'Contraer a periodos clave':'Expandir todo '+n+' Periodos');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bdCalc',compute:compute});
  $('expBtn').addEventListener('click',function(){open=!open;compute();});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('bond-cash-flows.csv',[{h:'Periodo',key:'k'},{h:'Cronología',key:'t'},{h:'Flujo de caja',key:'c'},{h:'Interés devengado',key:'ie'},{h:'Accretion/amortization',key:'ac'},{h:'Valor en libros',key:'bv'},{h:'Valor presente',key:'pv'}],last.rows.map(function(x){return {k:x.k,t:x.t,c:x.c===null?'':x.c.toFixed(2),ie:x.ie===null?'':x.ie.toFixed(2),ac:x.ac===null?'':x.ac.toFixed(2),bv:x.bv.toFixed(2),pv:x.pv.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpBond={price:price};
})();
