/* Inflation calculator — CalculatePilot (Stitch 1:1 redesign).
   Future cost = A × (1 + i)^n; real value = A ÷ (1 + i)^n, where i = your rate + optional category premium.
   Past mode: what an amount from n years ago is equivalent to today at the same average rate.
   Asset comparison uses stated illustrative nominal returns (cash 0%, savings 0.5%, stocks 9.5%). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var ASSETS=[['Efectivo bajo el colchón / caja fuerte física',0,'money_off','lose'],['Ahorros en banco tradicional (0.50 % APY)',0.5,'account_balance','lose'],['Índice bursátil amplio (9.5 % nominal supuesto)',9.5,'trending_up','win']];

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function P(x,dp){return (x<0?'−':'+')+Math.abs(x).toFixed(dp===undefined?1:dp)+'%';}

function inputs(){return {mode:$('mode').value,A:Math.max(0,v('amt')),n:Math.max(1,Math.round(v('yrs'))),base:v('rate'),bk:v('bk')};}

function chart(o,r){
  var W=520,H=200,L=52,R=14,T=14,B=26,w=W-L-R,h=H-T-B,n=o.n,lo=Math.min(o.A/Math.pow(1+r,n),o.A)*0.92,hi=Math.max(o.A,o.A/Math.pow(1+r,n))*1.03,sp=hi-lo||1;
  function X(k){return L+k/n*w;}function Y(x){return T+h-(x-lo)/sp*h;}
  var s='';[hi,lo+sp*2/3,lo+sp/3,lo].forEach(function(g){s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(g)+'" y2="'+Y(g)+'" stroke="currentColor" stroke-opacity=".07"/><text x="'+(L-6)+'" y="'+(Y(g)+3)+'" text-anchor="end" font-size="9" font-family="monospace" fill="#94a3b8">'+M(g)+'</text>';});
  s+='<line x1="'+X(0)+'" x2="'+X(n)+'" y1="'+Y(o.A)+'" y2="'+Y(o.A)+'" stroke="#94a3b8" stroke-dasharray="4 4"/>';
  var pts=[];for(var k=0;k<=n;k++)pts.push(X(k).toFixed(1)+','+Y(o.A/Math.pow(1+r,k)).toFixed(1));
  s+='<polygon points="'+X(0)+','+Y(o.A)+' '+pts.join(' ')+' '+X(n)+','+Y(o.A)+'" fill="var(--sx-err)" fill-opacity=".08"/><polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--sx-err)" stroke-width="2.5"/>';
  [0,Math.round(n/3),Math.round(2*n/3),n].forEach(function(k,j){var y=o.A/Math.pow(1+r,k);s+='<circle cx="'+X(k)+'" cy="'+Y(y)+'" r="3.5" fill="'+(j===3?'var(--sx-err)':'#fff')+'" stroke="var(--sx-err)" stroke-width="1.5"/>';if(j>0)s+='<text x="'+(X(k)-(j===3?4:0))+'" y="'+(Y(y)-8)+'" text-anchor="'+(j===3?'end':'middle')+'" font-size="9" font-family="monospace" font-weight="700" fill="'+(j===3?'var(--sx-err)':'var(--sx-on)')+'">'+M(y)+(j===3?' ('+P((y/o.A-1)*100)+')':'')+'</text>';
    s+='<text x="'+X(k)+'" y="'+(H-8)+'" text-anchor="'+(j===0?'start':j===3?'end':'middle')+'" font-size="9" font-family="monospace" fill="#94a3b8">Año '+k+'</text>';});
  $('chart').innerHTML=s;
}

function compute(){
  var o=inputs(),rp=o.base+o.bk,r=rp/100,n=o.n,f=Math.pow(1+r,n),real=o.A/f,fc=o.A*f,past=o.mode==='past';last={o:o,r:r};
  C.text('modeTag',past?'Modelo histórico':'Modelo hacia adelante');C.text('yrsOut',n+' Años');
  C.text('amtLbl',past?'Importe de hace '+n+' años ($)':'Monto base en dólares ($)');C.text('amtNote',past?'Base histórica de poder adquisitivo':'Base de compra de hoy');
  var lossPct=(real/o.A-1)*100;
  if(past){C.text('heroK','Valor equivalente hoy');C.text('resultValue',M(fc));C.text('heroSub','for '+M(o.A)+' from '+n+' años a '+rp.toFixed(2)+'%');C.text('lossTxt',P((f-1)*100)+' Subida acumulada de precios');$('lossPill').className='';C.text('lossNote','Los precios subieron esto durante el período a tu tasa media.');}
  else{C.text('heroK','Poder adquisitivo real futuro');C.text('resultValue',M(real));C.text('heroSub','after '+n+' años a '+rp.toFixed(2)+'%');C.text('lossTxt',P(lossPct)+' Poder adquisitivo perdido');$('lossPill').className=lossPct>=0?'up':'';C.text('lossNote',lossPct<0?'El valor real se deteriora si no se invierte.':'La deflación aumenta el valor real del efectivo.');}
  C.text('fcL',past?'Coste de entonces actualizado a hoy':'Coste futuro de los '+M(o.A));C.text('fc',M(fc));C.text('fcT',(past?'Necesario hoy para igualar ':'Requiere ')+'+'+M(fc-o.A)+' más dólares nominales'+(past?' que entonces.':' para mantener el mismo nivel de vida.'));
  C.text('loss','−'+M(o.A-real));C.text('cola',(rp>=0?'+':'')+rp.toFixed(2)+'% / año');C.text('c100',M(100/f,2));C.text('c100T','Poder adquisitivo de un billete de $100 tras '+n+' años.');
  C.text('trSub','Nominal '+M(o.A)+' efectivo frente a valor real en dólares constantes durante '+n+' years');chart(o,r);
  C.text('asSub','Poder adquisitivo real tras '+n+' años con una '+rp.toFixed(2)+'% de inflación. Los supuestos de rentabilidad son ilustrativos, no están garantizados.');
  $('assets').innerHTML=ASSETS.map(function(a){var nom=o.A*Math.pow(1+a[1]/100,n),rv=nom/f,chg=(rv/o.A-1)*100,cls=chg>=0?'win':'lose';
    return '<li class="'+cls+'"><span class="ic"><span class="msym" aria-hidden="true">'+a[2]+'</span></span><div><div class="n">'+a[0]+'</div><div class="d">Nominal: '+M(nom)+'</div></div><div class="v"><b>'+M(rv)+' Valor real</b><span>'+P(chg)+(chg>=0?' Ganancia real':' Pérdida real neta')+'</span></div></li>';}).join('');
  C.text('tbSub','Poder adquisitivo a '+rp.toFixed(2)+'% de inflación anual compuesta');C.text('tbTag','Base constante, año 0 = '+M(o.A));
  var ys=[1,3,5,7,10,12,15,20,25,30,40,50].filter(function(k){return k<n;});ys.push(n);
  $('tbl').innerHTML=ys.map(function(k){var g=Math.pow(1+r,k),rv=o.A/g,t=k===n;return '<tr'+(t?' class="tg"':'')+'><td>Año '+k+(t?' (Target)':'')+'</td><td>'+M(o.A)+'</td><td class="'+(t?'r':'')+'">'+P((g-1)*100,2)+'</td><td>'+M(o.A*g)+'</td><td class="g">'+M(rv)+'</td><td class="r">−'+M(o.A-rv)+' ('+P((rv/o.A-1)*100)+')</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'inCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var rows=[];for(var k=1;k<=last.o.n;k++){var g=Math.pow(1+last.r,k);rows.push({y:k,inf:Math.round((g-1)*10000)/100,cost:Math.round(last.o.A*g),real:Math.round(last.o.A/g)});}
    C.csv('inflation-report.csv',[{h:'Año',key:'y'},{h:'Inflación acumulada %',key:'inf'},{h:'Coste equivalente',key:'cost'},{h:'Poder adquisitivo real',key:'real'}],rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpInflation={};
})();
