/* Salary calculator — CalculatePilot (Stitch 1:1 redesign).
   Salary mode: nominal hourly = salary ÷ (hours × weeks); real hourly = salary ÷ ((hours + unpaid extra) × weeks);
   desk hours = (hours + extra) × weeks − PTO days × (hours ÷ 5). Hourly mode: annual = rate × hours × weeks, with extra hours paid at 1.5×
   (US non-exempt overtime). Total package = base + bonus + 401(k) match + health subsidy + equity.
   1099 parity = (total package + 7.65% × base) ÷ hours actually worked. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x,d){return isFinite(x)?'$'+x.toLocaleString('fr-FR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}):'—';}
function N(x){return Math.round(x).toLocaleString('fr-FR');}

function compute(){
  var hr=$('payType').value==='s1',r=Math.max(0,v('payRate')),h=Math.max(1,v('hoursPerWeek')),w=Math.min(52,Math.max(1,v('wks'))),x=Math.max(0,v('ot'));
  var pto=Math.max(0,v('vac'))+Math.max(0,v('sick'))+Math.max(0,v('hol')),ptoH=pto*h/5;
  C.text('rateL',hr?'Taux horaire':'Salaire annuel de base');C.text('rateU',hr?'/ hour':'/ year');$('salP').hidden=hr;
  C.text('otL',hr?'Heures supplémentaires / semaine (payées 1,5×)':'Heures supplémentaires non payées / semaine');C.text('otHelp',hr?'Aux États-Unis, les salariés non exemptés sont généralement payés 1,5× pour les heures au-delà de 40 par semaine.':'Les postes salariés impliquent souvent des heures au-delà du contrat.');
  var base=hr?r*h*w:r,nomH=hr?r:base/(h*w),otPay=hr?r*1.5*x*w:0,gross=base+otPay,worked=(h+x)*w,desk=Math.max(1,worked-ptoH);
  var realH=hr?gross/worked:base/worked;
  C.text('otOut','Semaine réelle : '+(+(h+x).toFixed(1))+' hrs');C.text('ptoOut',pto+' jours ('+N(ptoH)+' h)');
  var k=base*Math.max(0,v('k401'))/100,hl=Math.max(0,v('hlth')),bn=base*Math.max(0,v('bon'))/100,eq=Math.max(0,v('eq')),ben=k+hl+bn+eq,tco=gross+ben;
  C.text('benOut','+'+M(ben)+' / yr');
  C.text('resultValue',M(gross));C.text('hrsT',N(h*w)+' heures payées / an');
  C.text('outHourly',M(nomH,2));C.text('outWeekly',M(gross/52,2));C.text('outMonthly',M(gross/12,2));
  C.text('real',M(realH,2)+'/hr');C.text('realN',hr?(x?'Comprend '+M(otPay)+' de supplément pour heures supplémentaires sur '+N(worked)+' hours':'Aucune heure supplémentaire'):(x?'−'+((1-realH/nomH)*100).toFixed(1)+'% contre '+M(nomH,2)+' — '+N(worked)+' heures réellement travaillées':'Aucune heure non rémunérée'));
  C.text('desk',M(gross/desk,2)+'/hr');C.text('deskN','Exclut '+pto+' jours de congé payés · '+N(desk)+' heures au travail');
  C.text('tco',M(tco));C.text('tcoN',M(tco/(h*w),2)+'/hr on paid hours');
  var par=(tco+.0765*gross)/desk;C.text('c1099',M(par,2)+'/hr');C.text('c1099N','+'+Math.round((par/nomH-1)*100)+'% par rapport au taux horaire de base, facturation '+N(desk)+' hrs');
  var parts=[['Base'+(otPay?' + heures supplémentaires':''),gross,'var(--sx-primary)'],['Prime / actions',bn+eq,'#34d399'],['Avantages',k+hl,'#a7f3d0']];
  C.text('anN',M(tco)+' rémunération globale');
  $('anBar').innerHTML=parts.map(function(p){return '<span style="width:'+(tco?p[1]/tco*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('anLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' ('+(tco?(p[1]/tco*100).toFixed(1):'0.0')+'%)</span>';}).join('');
  C.text('k1',(gross?tco/gross:0).toFixed(3)+'×');C.text('k2',N(desk)+' hours');C.text('k3','+'+M(ptoH*nomH));
  C.text('k4L',hr?'Heures supplémentaires rémunérées':'Heures supplémentaires non payées (valeur au taux de base)');C.text('k4',hr?M(otPay):M(x*w*nomH));
  $('p1').innerHTML='<b>Vos chiffres :</b> '+N(h*w)+' heures payées − '+N(ptoH)+' heures de congés payés'+(x&&!hr?' + '+N(x*w)+' heures supplémentaires non rémunérées':'')+' = '+N(desk)+' heures au travail, donc chaque heure travaillée rapporte '+M(gross/desk,2)+' au lieu de '+M(nomH,2)+'.';
  var cash=gross+bn,fr=[['Horaire',h*w,'hr','/ hr'],['Journalier (journée de 8 heures)',h*w/8,'day','/ day'],['Hebdomadaire',52,'wk','/ wk'],['Bi-weekly',26,'pay','/ paycheck'],['Semi-monthly',24,'pay','/ paycheck'],['Mensuel',12,'mo','/ month'],['Annuel',1,'yr','']];
  C.text('thB','Avec prime en espèces ('+M(cash)+')');C.text('thT','Rémunération globale ('+M(tco)+')');C.text('scTag','Standard : '+N(h*w)+' hours');
  last={fr:fr.map(function(f){return {n:f[0],a:gross/f[1],b:cash/f[1],c:tco/f[1],p:f[1]};})};
  $('tbl').innerHTML=fr.map(function(f){return '<tr'+(f[1]===26?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+f[0]+(f[1]===26?' <small class="p">(le plus courant)</small>':'')+'</td><td class="b">'+M(gross/f[1],2)+' '+f[3]+'</td><td>'+M(cash/f[1],2)+'</td><td>'+M(tco/f[1],2)+'</td><td class="mu">'+(+f[1].toFixed(1)).toLocaleString('fr-FR')+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  var prev=null;
  C.init({root:'saCalc',compute:function(){var t=$('payType').value;if(prev!==null&&t!==prev){var h=Math.max(1,v('hoursPerWeek')),w=Math.max(1,v('wks')),r=v('payRate');$('payRate').value=t==='s1'?(r/(h*w)).toFixed(2):Math.round(r*h*w);if(t==='s1')$('ot').value=0;}prev=t;compute();}});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('pay-scales.csv',[{h:'Fréquence',key:'n'},{h:'Base',key:'a'},{h:'Avec prime',key:'b'},{h:'Rémunération globale',key:'c'},{h:'Periods/yr',key:'p'}],last.fr.map(function(x){return {n:x.n,a:x.a.toFixed(2),b:x.b.toFixed(2),c:x.c.toFixed(2),p:+x.p.toFixed(1)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSalary={};
})();
