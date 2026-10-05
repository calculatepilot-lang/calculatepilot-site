/* Salary calculator — CalculatePilot (Stitch 1:1 redesign).
   Salary mode: nominal hourly = salary ÷ (hours × weeks); real hourly = salary ÷ ((hours + unpaid extra) × weeks);
   desk hours = (hours + extra) × weeks − PTO days × (hours ÷ 5). Hourly mode: annual = rate × hours × weeks, with extra hours paid at 1.5×
   (US non-exempt overtime). Total package = base + bonus + 401(k) match + health subsidy + equity.
   1099 parity = (total package + 7.65% × base) ÷ hours actually worked. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x,d){return isFinite(x)?'$'+x.toLocaleString('de-DE',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}):'—';}
function N(x){return Math.round(x).toLocaleString('de-DE');}

function compute(){
  var hr=$('payType').value==='s1',r=Math.max(0,v('payRate')),h=Math.max(1,v('hoursPerWeek')),w=Math.min(52,Math.max(1,v('wks'))),x=Math.max(0,v('ot'));
  var pto=Math.max(0,v('vac'))+Math.max(0,v('sick'))+Math.max(0,v('hol')),ptoH=pto*h/5;
  C.text('rateL',hr?'Stundenlohn':'Jahresgrundgehalt');C.text('rateU',hr?'/ hour':'/ year');$('salP').hidden=hr;
  C.text('otL',hr?'Überstunden pro Woche (mit 1,5× vergütet)':'Unbezahlte Zusatzstunden / Woche');C.text('otHelp',hr?'Nicht freigestellte Arbeitnehmer in den USA erhalten für Stunden über 40 pro Woche in der Regel das 1,5-Fache.':'Bei Gehaltsstellen fallen oft Stunden über den Vertrag hinaus an.');
  var base=hr?r*h*w:r,nomH=hr?r:base/(h*w),otPay=hr?r*1.5*x*w:0,gross=base+otPay,worked=(h+x)*w,desk=Math.max(1,worked-ptoH);
  var realH=hr?gross/worked:base/worked;
  C.text('otOut','Tatsächliche Woche: '+(+(h+x).toFixed(1))+' hrs');C.text('ptoOut',pto+' Tage ('+N(ptoH)+' Std.)');
  var k=base*Math.max(0,v('k401'))/100,hl=Math.max(0,v('hlth')),bn=base*Math.max(0,v('bon'))/100,eq=Math.max(0,v('eq')),ben=k+hl+bn+eq,tco=gross+ben;
  C.text('benOut','+'+M(ben)+' / yr');
  C.text('resultValue',M(gross));C.text('hrsT',N(h*w)+' bezahlte Stunden / Jahr');
  C.text('outHourly',M(nomH,2));C.text('outWeekly',M(gross/52,2));C.text('outMonthly',M(gross/12,2));
  C.text('real',M(realH,2)+'/hr');C.text('realN',hr?(x?'Beinhaltet '+M(otPay)+' Überstundenvergütung über '+N(worked)+' hours':'Keine Überstunden'):(x?'−'+((1-realH/nomH)*100).toFixed(1)+'% vs. '+M(nomH,2)+' — '+N(worked)+' tatsächlich gearbeitete Stunden':'Keine unbezahlten Stunden'));
  C.text('desk',M(gross/desk,2)+'/hr');C.text('deskN','Ohne '+pto+' bezahlte freie Tage · '+N(desk)+' Stunden am Arbeitsplatz');
  C.text('tco',M(tco));C.text('tcoN',M(tco/(h*w),2)+'/hr on paid hours');
  var par=(tco+.0765*gross)/desk;C.text('c1099',M(par,2)+'/hr');C.text('c1099N','+'+Math.round((par/nomH-1)*100)+'% vs. Grundstundenlohn, Abrechnung '+N(desk)+' hrs');
  var parts=[['Grundseite'+(otPay?' + Überstunden':''),gross,'var(--sx-primary)'],['Bonus / Aktien',bn+eq,'#34d399'],['Sozialleistungen',k+hl,'#a7f3d0']];
  C.text('anN',M(tco)+' Gesamtpaket');
  $('anBar').innerHTML=parts.map(function(p){return '<span style="width:'+(tco?p[1]/tco*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('anLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' ('+(tco?(p[1]/tco*100).toFixed(1):'0.0')+'%)</span>';}).join('');
  C.text('k1',(gross?tco/gross:0).toFixed(3)+'×');C.text('k2',N(desk)+' hours');C.text('k3','+'+M(ptoH*nomH));
  C.text('k4L',hr?'Verdiente Überstundenvergütung':'Unbezahlte Zusatzstunden (Wert zum Grundlohn)');C.text('k4',hr?M(otPay):M(x*w*nomH));
  $('p1').innerHTML='<b>Ihre Zahlen:</b> '+N(h*w)+' bezahlte Stunden − '+N(ptoH)+' Stunden bezahlter Freistellung'+(x&&!hr?' + '+N(x*w)+' unbezahlte Mehrstunden':'')+' = '+N(desk)+' Stunden am Arbeitsplatz, sodass jede Arbeitsstunde einbringt '+M(gross/desk,2)+' statt '+M(nomH,2)+'.';
  var cash=gross+bn,fr=[['Stundenlohn',h*w,'hr','/ hr'],['Pro Tag (8-Stunden-Tag)',h*w/8,'day','/ day'],['Wöchentlich',52,'wk','/ wk'],['Bi-weekly',26,'pay','/ paycheck'],['Semi-monthly',24,'pay','/ paycheck'],['Monatlich',12,'mo','/ month'],['Jährlich',1,'yr','']];
  C.text('thB','Mit Barbonus ('+M(cash)+')');C.text('thT','Gesamtpaket ('+M(tco)+')');C.text('scTag','Standard: '+N(h*w)+' hours');
  last={fr:fr.map(function(f){return {n:f[0],a:gross/f[1],b:cash/f[1],c:tco/f[1],p:f[1]};})};
  $('tbl').innerHTML=fr.map(function(f){return '<tr'+(f[1]===26?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+f[0]+(f[1]===26?' <small class="p">(am häufigsten)</small>':'')+'</td><td class="b">'+M(gross/f[1],2)+' '+f[3]+'</td><td>'+M(cash/f[1],2)+'</td><td>'+M(tco/f[1],2)+'</td><td class="mu">'+(+f[1].toFixed(1)).toLocaleString('de-DE')+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  var prev=null;
  C.init({root:'saCalc',compute:function(){var t=$('payType').value;if(prev!==null&&t!==prev){var h=Math.max(1,v('hoursPerWeek')),w=Math.max(1,v('wks')),r=v('payRate');$('payRate').value=t==='s1'?(r/(h*w)).toFixed(2):Math.round(r*h*w);if(t==='s1')$('ot').value=0;}prev=t;compute();}});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('pay-scales.csv',[{h:'Häufigkeit',key:'n'},{h:'Grundseite',key:'a'},{h:'Mit Bonus',key:'b'},{h:'Gesamtpaket',key:'c'},{h:'Periods/yr',key:'p'}],last.fr.map(function(x){return {n:x.n,a:x.a.toFixed(2),b:x.b.toFixed(2),c:x.c.toFixed(2),p:+x.p.toFixed(1)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSalary={};
})();
