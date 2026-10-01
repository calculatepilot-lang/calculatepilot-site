/* Amortization calculator — CalculatePilot (redesign).
   M = P·r / (1 − (1+r)^−n), r = APR/12. Monthly: interest = bal·r (to the cent), principal = M − interest,
   balance −= principal + extra (final payment capped at balance + interest). Crossover = first month principal > interest. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
function $$(x){return '$'+x.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});}
function $0(x){return '$'+Math.round(x).toLocaleString('es-ES');}
function R2(x){return Math.round(x*100)/100;}
function mon(y,m){return new Date(y,m,1).toLocaleDateString('es-ES',{month:'short',year:'numeric'});}
function run(P,r,n,M,x){var b=P,rows=[],ti=0,xo=null;for(var k=1;k<=n*2&&b>0.005;k++){var i=R2(b*r),p=k>=n?b:Math.min(R2(M-i),b),e=Math.min(x,R2(b-p));if(p<0){return null;}b=R2(b-p-e);ti+=i;if(xo===null&&p>i)xo=k;rows.push([k,i+p+e,p+e,i,b]);}return {rows:rows,ti:ti,xo:xo};}

function compute(){
  var P=v('amt'),apr=v('rate'),yrs=v('yrs'),x=Math.max(0,v('xtra')),n=Math.round(yrs*12),r=apr/1200;
  var st=$('start');if(!st.value){var d=new Date();d.setMonth(d.getMonth()+1);st.value=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2);}
  var sm=/^(\d{4})-(\d{2})$/.exec(st.value),y0=sm?+sm[1]:2026,m0=sm?+sm[2]-1:0;
  if(!(P>0&&n>0))return;
  var M=r>0?R2(P*r/(1-Math.pow(1+r,-n))):R2(P/n);
  var base=run(P,r,n,M,0),ex=x>0?run(P,r,n,M,x):null,use=ex||base;
  C.text('resultValue',$$(M));C.text('tag',n+' payments');
  C.text('rN',$0(P)+' at '+apr+'% durante '+yrs+' years'+(x>0?', más '+$0(x)+' adicionales al mes.':'.'));
  C.text('ti',$0(use.ti));C.text('tp',$0(P+use.ti));
  var L=use.rows.length;C.text('pd',mon(y0,m0+L-1)+' ('+Math.floor(L/12)+' yr '+(L%12)+' mo)');
  C.text('xo',use.xo?'Pago '+use.xo+' · '+mon(y0,m0+use.xo-1):'Desde el primer pago');
  var sb=$('svBox');
  if(ex){var ms=base.rows.length-ex.rows.length;sb.className='gain';C.text('svL','Extra '+$0(x)+'/mo saves '+Math.floor(ms/12)+' yr '+(ms%12)+' meses y');C.text('svV',$0(base.ti-ex.ti));}
  else{sb.className='gain neg';C.text('svL','Añade un pago mensual extra para ver el ahorro');C.text('svV','—');}
  var f=base.rows[0];C.text('fpT',mon(y0,m0));C.text('fi',$$(f[3]));C.text('fp',$$(M-f[3]));C.text('fs',Math.round(f[3]/M*100)+'%');
  var monthly=$('view').value==='s2',h='';C.text('thP',monthly?'Pago':'Año');
  if(monthly){use.rows.forEach(function(q){h+='<tr'+(q[0]===use.xo?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+q[0]+' <small>'+mon(y0,m0+q[0]-1)+'</small></td><td>'+$$(q[1])+'</td><td>'+$$(q[2])+'</td><td>'+$$(q[3])+'</td><td class="b">'+$$(q[4])+'</td></tr>';});}
  else{var agg={};use.rows.forEach(function(q){var yy=Math.floor((q[0]-1)/12)+1;agg[yy]=agg[yy]||[0,0,0,0];agg[yy][0]+=q[1];agg[yy][1]+=q[2];agg[yy][2]+=q[3];agg[yy][3]=q[4];});
    Object.keys(agg).forEach(function(yy){var a=agg[yy],xy=use.xo&&Math.floor((use.xo-1)/12)+1===+yy;h+='<tr'+(xy?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+yy+' <small>'+(y0+Math.floor((m0+(yy-1)*12)/12))+'</small></td><td>'+$0(a[0])+'</td><td>'+$0(a[1])+'</td><td>'+$0(a[2])+'</td><td class="b">'+$0(a[3])+'</td></tr>';});}
  $('schTbl').innerHTML=h;C.text('schN',monthly?'Cada pago mensual — la fila resaltada es donde el capital supera al interés.':'Totales anuales — el año resaltado es cuando el capital supera al interés.');
  last='Préstamo: '+$0(P)+' at '+apr+'% durante '+yrs+' años\nPago mensual: '+$$(M)+'\nInterés total: '+$0(use.ti)+(ex?'\nExtra '+$0(x)+'/mo saves '+$0(base.ti-ex.ti):'')+'\n— calculatepilot.com/financial/amortization-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'amCalc',compute:compute});
  $('start').addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resumen');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
