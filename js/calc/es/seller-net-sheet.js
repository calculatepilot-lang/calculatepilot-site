/* Seller net sheet & real estate commission calculator — CalculatePilot (Stitch 1:1 redesign).
   Net = price − mortgage payoff − (listing % + buyer-agent %) × price − transfer taxes − title/escrow − prorations − credits − other.
   Agent: gross listing commission − franchise royalty (% of gross) → × agent split share − transaction fee. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x,d){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}):'—';}
function P(x,d){return isFinite(x)?x.toFixed(d===undefined?1:d)+'%':'—';}

function compute(){
  var p=Math.max(0,v('price')),lc=Math.max(0,v('lc')),bc=Math.max(0,v('bc')),g=function(id){return Math.max(0,v(id));};
  var mort=g('mort'),tt=g('tt'),ti=g('title'),pr=g('pro'),cr=g('cred'),ot=g('other'),L=p*lc/100,Bc=p*bc/100,com=L+Bc,fees=tt+ti+pr+cr+ot,net=p-mort-com-fees;
  C.text('totC',M(com)+' ('+P(lc+bc,2)+')');C.text('lcN',M(L));C.text('bcN',M(Bc));
  document.querySelectorAll('[data-t]').forEach(function(b){b.setAttribute('aria-pressed',String(Math.abs(+b.getAttribute('data-t')-(lc+bc))<1e-9));});
  C.text('resultValue',M(net));$('resultValue').style.color=net<0?'#fecaca':'';
  $('netN').innerHTML=net<0?'<b>Territorio de venta en pérdida:</b> los costes y las cancelaciones superan el precio de venta en '+M(-net)+'.':'Efectivo al cierre tras '+M(mort)+' cancelación de la hipoteca, '+M(com)+' de comisiones y '+M(fees)+' de costes de cierre.';
  C.text('effT','Costes de venta '+M(com+fees)+' · '+P(p?(com+fees)/p*100:0,2));
  var parts=[['Neto del vendedor',Math.max(0,net),'var(--sx-primary)'],['Hipoteca',mort,'#94a3b8'],['Comisiones',com,'#f59e0b'],['Costes de cierre',fees,'#ef4444']];
  $('alBar').innerHTML=parts.map(function(x){return '<span style="width:'+(p?Math.min(100,x[1]/p*100):0)+'%;background:'+x[2]+'"></span>';}).join('');
  $('alLg').innerHTML=parts.map(function(x){return '<span><i style="background:'+x[2]+'"></i>'+x[0]+' '+P(p?x[1]/p*100:0)+'</span>';}).join('');
  var sp=+$('split').value||80,roy=L*g('roy')/100,after=L-roy,brk=after*(100-sp)/100,tc=g('tc'),ag=after-brk-tc;
  C.text('agT',sp+'/'+(100-sp)+' split');C.text('ag1L','Comisión bruta de listado ('+P(lc,2)+')');C.text('ag1',M(L));
  C.text('ag2L','Regalía de franquicia ('+P(g('roy'),1)+')');C.text('ag2','−'+M(roy));C.text('ag3L','Parte de la agencia ('+(100-sp)+'%)');C.text('ag3','−'+M(brk));C.text('ag4','−'+M(tc));
  C.text('ag5',M(ag)+' ('+P(L?ag/L*100:0)+' del bruto)');
  var rows=[['Precio de venta del contrato','Ingresos brutos',0,p],['Cancelación de la hipoteca (todos los gravámenes)','Cancelación del préstamo',mort,0],['Comisión del agente de listado ('+P(lc,2)+')','Comisión',L,0],['Compensación del agente del comprador ('+P(bc,2)+')','Comisión',Bc,0],['Impuestos de transferencia','Impuestos',tt,0],['Seguro de título y gastos de depósito en garantía','Título y depósito en garantía',ti,0],['Impuestos prediales prorrateados y HOA','Prorrateos',pr,0],['Créditos por reparaciones y garantía de la vivienda','Créditos',cr,0],['Otros costes','Otros',ot,0]].filter(function(r){return r[2]||r[3]||r[1]==='Commission';});
  var run=0;last={rows:rows,net:net};
  $('tbl').innerHTML=rows.map(function(r){run+=r[3]-r[2];return '<tr><td style="font-family:inherit;font-weight:600">'+r[0]+'</td><td style="font-family:inherit">'+r[1]+'</td><td class="r">'+(r[2]?M(r[2],2):'—')+'</td><td class="pos">'+(r[3]?M(r[3],2):'—')+'</td><td>'+M(run,2)+'</td></tr>';}).join('')+
    '<tr style="background:var(--sx-emb)"><td style="font-family:inherit;font-weight:700">Ingresos netos estimados para el vendedor</td><td style="font-family:inherit">Efectivo al cierre</td><td>—</td><td>—</td><td class="b" style="font-size:15px">'+M(net,2)+'</td></tr>';
}

document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('[data-t]').forEach(function(b){b.addEventListener('click',function(){var t=+b.getAttribute('data-t');$('lc').value=t/2;$('bc').value=t/2;$('lc').dispatchEvent(new Event('input',{bubbles:true}));});});
  C.init({root:'nsCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('seller-net-sheet.csv',[{h:'Concepto',key:'a'},{h:'Categoría',key:'b'},{h:'Débito',key:'c'},{h:'Crédito',key:'d'}],last.rows.map(function(r){return {a:r[0],b:r[1],c:r[2].toFixed(2),d:r[3].toFixed(2)};}).concat([{a:'Ingresos netos',b:'',c:'',d:last.net.toFixed(2)}]));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpNetSheet={};
})();
