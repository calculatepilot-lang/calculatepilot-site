/* Commission calculator — CalculatePilot (redesign).
   Flat: gross = sale × rate. Tiered (marginal): rate_i × portion of sale within band i.
   Take-home = gross × split − fees; house = gross × (1 − split). Volume for goal = goal ÷ (take-home ÷ sale). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
function $0(x){return (x<0?'−$':'$')+Math.round(Math.abs(x)).toLocaleString('es-ES');}
function $2(x){return '$'+x.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});}

function compute(){
  var tier=$('mode').value==='s2';$('fRow').hidden=tier;$('tRow').hidden=!tier;$('tierCard').hidden=!tier;
  var sale=v('sale'),split=Math.min(100,Math.max(0,v('split')))/100,fee=Math.max(0,v('fee'));
  if(!(sale>0))return;
  var t1=v('t1'),t2=Math.max(v('t2'),t1),bands=[[0,t1,v('r1')],[t1,t2,v('r2')],[t2,Infinity,v('r3')]];
  function gross(s){if(!tier)return s*v('rate')/100;return bands.reduce(function(a,b){return a+Math.max(0,Math.min(s,b[1])-b[0])*b[2]/100;},0);}
  var g=gross(sale),take=g*split-fee,eff=g/sale*100;
  C.text('resultValue',$2(Math.max(0,take)));C.text('tag',Math.round(split*100)+'/'+Math.round((1-split)*100)+' split');
  C.text('rN',$0(sale)+' × '+(tier?'tarifas escalonadas':v('rate')+'%')+' = '+$2(g)+' bruto; × '+Math.round(split*100)+'% de reparto'+(fee?' − '+$0(fee)+' fees':'')+'.');
  C.text('gross',$2(g));C.text('eff',eff.toFixed(2)+'%');C.text('house',$2(g*(1-split)));C.text('fees',fee?$0(fee):'Ninguna');
  if(tier)$('tierL').innerHTML=bands.map(function(b,i){var part=Math.max(0,Math.min(sale,b[1])-b[0]);return '<div class="l"><span>'+(i<2?$0(b[0])+'–'+$0(b[1]):'Por encima de '+$0(b[0]))+' at '+b[2]+'%</span><b>'+$2(part*b[2]/100)+'</b></div>';}).join('');
  var gb=$('gBox'),goal=v('goal');
  if(goal>0&&take>0){var vol=goal/(take/sale);gb.className='gain';C.text('gL','Volumen de ventas para '+$0(goal)+' al año ≈ '+Math.ceil(goal/take)+' operaciones como esta');C.text('gV',$0(vol));}
  else{gb.className='gain neg';C.text('gL',take<=0?'Las comisiones superan tu parte de la comisión':'Añade una meta de ingresos para ver el volumen de ventas necesario');C.text('gV','—');}
  C.text('tbT',tier?'Escalonada':v('rate')+'% fijo');
  $('cmpTbl').innerHTML=[0.5,0.75,1,1.25,1.5,2].map(function(f){var s=sale*f,gg=gross(s);return '<tr'+(f===1?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+$0(s)+'</td><td>'+$2(gg)+'</td><td>'+(gg/s*100).toFixed(2)+'%</td><td class="b">'+$2(Math.max(0,gg*split-fee))+'</td></tr>';}).join('');
  last='Venta: '+$0(sale)+'\nComisión bruta: '+$2(g)+' ('+eff.toFixed(2)+'%)\nLo que te llevas: '+$2(Math.max(0,take))+'\n— calculatepilot.com/financial/commission-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'cmCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultado');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
