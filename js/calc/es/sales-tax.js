/* Sales tax calculator — CalculatePilot (Stitch 1:1 redesign).
   Combined rate = state + county + city + special. Add: tax = price × rate. Extract: pre-tax = total ÷ (1 + rate).
   Tax is split across components in proportion to their rates. Groceries use the entered grocery rate; prescriptions 0%. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevJ=null;
var JUR={ny:[4,0,4.5,0.375],la:[6,1.25,0,2.5],tx:[6.25,0,1,1],tn:[7,2.25,0,0],or:[0,0,0,0]};
var ST=[['Alabama',4,'Sí','Gravado (tasa estatal reducida)'],['Arizona',5.6,'Sí','Exento (estatal)'],['California',7.25,'Sí','Exento'],['Colorado',2.9,'Sí','Exento (estatal)'],['Florida',6,'Sí','Exento'],['Georgia',4,'Sí','Solo impuesto local'],['Illinois',6.25,'Sí','1 % local en algunas zonas (el impuesto estatal terminó en 2026)'],['Indiana',7,'No','Exento'],['Luisiana',5,'Sí','Solo impuesto local'],['Massachusetts',6.25,'No','Exento'],['Misisipi',7,'Sí','Gravado (tasa reducida)'],['Nueva Jersey',6.625,'Limitado','Exento'],['Nueva York',4,'Sí','Exento'],['Carolina del Norte',4.75,'Sí','Solo 2 % local'],['Ohio',5.75,'Sí','Exento'],['Pensilvania',6,'Sí','Exento'],['Rhode Island',7,'No','Exento'],['Tennessee',7,'Sí','Gravado (4 % estatal)'],['Texas',6.25,'Sí','Exento'],['Washington',6.5,'Sí','Exento'],['Delaware, Montana, Nuevo Hampshire, Oregón',0,'No','Sin impuesto sobre las ventas'],['Alaska',0,'Sí (solo local)','Varía según la localidad']];

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function P(x){return (+x.toFixed(3))+'%';}

function compute(){
  var j=$('jur').value;
  if(prevJ!==null&&j!==prevJ&&JUR[j]){JUR[j].forEach(function(x,i){$('r'+(i+1)).value=x;});}prevJ=j;
  var r=[1,2,3,4].map(function(i){return Math.max(0,v('r'+i));}),comb=r[0]+r[1]+r[2]+r[3],cls=$('cls').value,add=$('mode').value==='s1',a=Math.max(0,v('price'));
  var eff=cls==='s2'?Math.max(0,v('gr')):cls==='s3'?0:comb;
  $('grRow').hidden=cls!=='s2';C.text('comb',P(comb));C.text('priceL',add?'Precio antes de impuestos':'Total con impuesto');
  var net=add?a:a/(1+eff/100),tax=net*eff/100,gross=net+tax;
  C.text('resultValue',M(gross));C.text('net',M(net));C.text('tax','+'+M(tax));C.text('rTag',P(eff)+' '+(eff===comb?'combined':'applied'));
  C.text('clsN',['Mercancía general — tasa combinada completa','Alimentos — '+P(eff)+' tasa de alimentos','Medicamentos con receta — exentos','Productos digitales — consulta tu estado (se asume la tasa completa)'][+cls.slice(1)-1]);
  var share=r.map(function(x){return comb?tax*x/comb:0;});if(cls==='s2'&&eff!==comb){share=[tax,0,0,0];}
  [1,2,3,4].forEach(function(i){C.text('t'+i,(cls==='s2'&&eff!==comb&&i===1?'':P(r[i-1])+' · ')+M(share[i-1]));});C.text('tt',M(tax));
  C.text('fx',add?'Total = '+M(net)+' × '+(1+eff/100).toFixed(5).replace(/0+$/,'')+' = '+M(gross):'Antes de impuestos = '+M(a)+' ÷ '+(1+eff/100).toFixed(5).replace(/0+$/,'')+' = '+M(net));
  C.text('fxN',add?'Verificación inversa: '+M(gross)+' ÷ '+(1+eff/100).toFixed(5).replace(/0+$/,'')+' = '+M(gross/(1+eff/100))+' antes de impuestos.':'Impuesto incluido en el total: '+M(tax)+' ('+P(gross?tax/gross*100:0)+' del total — no '+P(eff)+').');
  last={net:net,tax:tax,gross:gross,r:r,share:share,eff:eff};
  $('bTbl').innerHTML=ST.map(function(s,i){return '<tr><td style="font-family:inherit;font-weight:600">'+s[0]+'</td><td class="b">'+P(s[1])+'</td><td style="font-family:inherit">'+s[2]+'</td><td style="font-family:inherit;white-space:normal">'+s[3]+'</td><td><button type="button" class="sx-reset" data-st="'+i+'" style="padding:4px 10px;font-size:12px">Cargar tasa</button></td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'stCalc',compute:compute});
  $('bTbl').addEventListener('click',function(e){var b=e.target.closest('[data-st]');if(!b)return;var s=ST[+b.getAttribute('data-st')];$('jur').value='custom';prevJ='custom';$('r1').value=s[1];['r2','r3','r4'].forEach(function(id){$(id).value=0;});$('r1').dispatchEvent(new Event('input',{bubbles:true}));$('calcForm').scrollIntoView({behavior:'smooth',block:'start'});});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('sales-tax.csv',[{h:'Concepto',key:'i'},{h:'Cantidad',key:'a'}],[{i:'Precio antes de impuestos',a:last.net.toFixed(2)},{i:'Impuesto estatal',a:last.share[0].toFixed(2)},{i:'Impuesto del condado',a:last.share[1].toFixed(2)},{i:'Impuesto de la ciudad',a:last.share[2].toFixed(2)},{i:'Impuesto de distrito especial',a:last.share[3].toFixed(2)},{i:'Impuesto total',a:last.tax.toFixed(2)},{i:'Precio total',a:last.gross.toFixed(2)}]);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSalesTax={};
})();
