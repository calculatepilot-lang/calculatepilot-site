/* Salary calculator — CalculatePilot (Stitch 1:1 redesign).
   Salary mode: nominal hourly = salary ÷ (hours × weeks); real hourly = salary ÷ ((hours + unpaid extra) × weeks);
   desk hours = (hours + extra) × weeks − PTO days × (hours ÷ 5). Hourly mode: annual = rate × hours × weeks, with extra hours paid at 1.5×
   (US non-exempt overtime). Total package = base + bonus + 401(k) match + health subsidy + equity.
   1099 parity = (total package + 7.65% × base) ÷ hours actually worked. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x,d){return isFinite(x)?'$'+x.toLocaleString('es-ES',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}):'—';}
function N(x){return Math.round(x).toLocaleString('es-ES');}

function compute(){
  var hr=$('payType').value==='s1',r=Math.max(0,v('payRate')),h=Math.max(1,v('hoursPerWeek')),w=Math.min(52,Math.max(1,v('wks'))),x=Math.max(0,v('ot'));
  var pto=Math.max(0,v('vac'))+Math.max(0,v('sick'))+Math.max(0,v('hol')),ptoH=pto*h/5;
  C.text('rateL',hr?'Tarifa por hora':'Salario base anual');C.text('rateU',hr?'/ hour':'/ year');$('salP').hidden=hr;
  C.text('otL',hr?'Horas extra / semana (pagadas a 1,5×)':'Horas extra no pagadas / semana');C.text('otHelp',hr?'En EE. UU., los empleados no exentos suelen cobrar 1,5× por las horas que superan las 40 semanales.':'Los puestos asalariados suelen implicar horas más allá del contrato.');
  var base=hr?r*h*w:r,nomH=hr?r:base/(h*w),otPay=hr?r*1.5*x*w:0,gross=base+otPay,worked=(h+x)*w,desk=Math.max(1,worked-ptoH);
  var realH=hr?gross/worked:base/worked;
  C.text('otOut','Semana real: '+(+(h+x).toFixed(1))+' hrs');C.text('ptoOut',pto+' días ('+N(ptoH)+' h)');
  var k=base*Math.max(0,v('k401'))/100,hl=Math.max(0,v('hlth')),bn=base*Math.max(0,v('bon'))/100,eq=Math.max(0,v('eq')),ben=k+hl+bn+eq,tco=gross+ben;
  C.text('benOut','+'+M(ben)+' / yr');
  C.text('resultValue',M(gross));C.text('hrsT',N(h*w)+' horas pagadas / año');
  C.text('outHourly',M(nomH,2));C.text('outWeekly',M(gross/52,2));C.text('outMonthly',M(gross/12,2));
  C.text('real',M(realH,2)+'/hr');C.text('realN',hr?(x?'Incluye '+M(otPay)+' pago de horas extra durante '+N(worked)+' hours':'Sin horas extra'):(x?'−'+((1-realH/nomH)*100).toFixed(1)+'% frente a '+M(nomH,2)+' — '+N(worked)+' horas realmente trabajadas':'Sin horas no remuneradas'));
  C.text('desk',M(gross/desk,2)+'/hr');C.text('deskN','Excluye '+pto+' días pagados de descanso · '+N(desk)+' horas en el trabajo');
  C.text('tco',M(tco));C.text('tcoN',M(tco/(h*w),2)+'/hr on paid hours');
  var par=(tco+.0765*gross)/desk;C.text('c1099',M(par,2)+'/hr');C.text('c1099N','+'+Math.round((par/nomH-1)*100)+'% sobre la tarifa base por hora, facturando '+N(desk)+' hrs');
  var parts=[['Base'+(otPay?' + horas extra':''),gross,'var(--sx-primary)'],['Bonificación / acciones',bn+eq,'#34d399'],['Beneficios',k+hl,'#a7f3d0']];
  C.text('anN',M(tco)+' paquete total');
  $('anBar').innerHTML=parts.map(function(p){return '<span style="width:'+(tco?p[1]/tco*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('anLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' ('+(tco?(p[1]/tco*100).toFixed(1):'0.0')+'%)</span>';}).join('');
  C.text('k1',(gross?tco/gross:0).toFixed(3)+'×');C.text('k2',N(desk)+' hours');C.text('k3','+'+M(ptoH*nomH));
  C.text('k4L',hr?'Pago de horas extra ganado':'Horas extra no pagadas (valor a tarifa base)');C.text('k4',hr?M(otPay):M(x*w*nomH));
  $('p1').innerHTML='<b>Tus datos:</b> '+N(h*w)+' horas pagadas − '+N(ptoH)+' horas de descanso pagado'+(x&&!hr?' + '+N(x*w)+' horas extra no remuneradas':'')+' = '+N(desk)+' horas en el trabajo, por lo que cada hora trabajada rinde '+M(gross/desk,2)+' en lugar de '+M(nomH,2)+'.';
  var cash=gross+bn,fr=[['Por hora',h*w,'hr','/ hr'],['Diario (jornada de 8 horas)',h*w/8,'day','/ day'],['Semanal',52,'wk','/ wk'],['Bi-weekly',26,'pay','/ paycheck'],['Semi-monthly',24,'pay','/ paycheck'],['Mensual',12,'mo','/ month'],['Anual',1,'yr','']];
  C.text('thB','Con bonificación en efectivo ('+M(cash)+')');C.text('thT','Paquete total ('+M(tco)+')');C.text('scTag','Estándar: '+N(h*w)+' hours');
  last={fr:fr.map(function(f){return {n:f[0],a:gross/f[1],b:cash/f[1],c:tco/f[1],p:f[1]};})};
  $('tbl').innerHTML=fr.map(function(f){return '<tr'+(f[1]===26?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+f[0]+(f[1]===26?' <small class="p">(lo más habitual)</small>':'')+'</td><td class="b">'+M(gross/f[1],2)+' '+f[3]+'</td><td>'+M(cash/f[1],2)+'</td><td>'+M(tco/f[1],2)+'</td><td class="mu">'+(+f[1].toFixed(1)).toLocaleString('es-ES')+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  var prev=null;
  C.init({root:'saCalc',compute:function(){var t=$('payType').value;if(prev!==null&&t!==prev){var h=Math.max(1,v('hoursPerWeek')),w=Math.max(1,v('wks')),r=v('payRate');$('payRate').value=t==='s1'?(r/(h*w)).toFixed(2):Math.round(r*h*w);if(t==='s1')$('ot').value=0;}prev=t;compute();}});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('pay-scales.csv',[{h:'Frecuencia',key:'n'},{h:'Base',key:'a'},{h:'Con bonificación',key:'b'},{h:'Paquete total',key:'c'},{h:'Periods/yr',key:'p'}],last.fr.map(function(x){return {n:x.n,a:x.a.toFixed(2),b:x.b.toFixed(2),c:x.c.toFixed(2),p:+x.p.toFixed(1)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSalary={};
})();
