/* Commute cost calculator — CalculatePilot (Stitch redesign).
   days/month = days/week × weeks/year ÷ 12; miles = 2 × one-way × days.
   Direct cost = miles × (energy cost per mile + wear) + (tolls + parking) × days; IRS mode replaces energy + wear with rate × miles
   (tolls and parking still added). Time value = 2 × minutes ÷ 60 × days × hourly value (shown separately). */
(function(){
var C=window.CPX,$=C.$,last='',prevU='mi',KM=1.609344;
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oY','oD','oMi','oPm'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um die Kosten zu sehen.');$('break').innerHTML='';$('cmp').innerHTML='';last='';}
function row(l,v,s,b){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--sx-border);font-size:'+(b?'15':'13')+'px"><span style="color:var(--sx-onv);'+(b?'font-weight:700':'')+'">'+l+(s?'<small style="display:block;color:var(--sx-muted);font-size:11px">'+s+'</small>':'')+'</span><b style="font-family:var(--font-mono);color:var(--sx-on);white-space:nowrap">'+v+'</b></div>';}
function model(distMi){
  var d=C.val('dpw'),wk=C.val('wpy'),days=d*wk/12,miles=2*distMi*days,ev=$('pt').value==='ev',irs=$('wm').value==='irs';
  var eff=C.val('eff'),fp=C.val('fp'),perMiEnergy=eff>0?fp/eff:0,energy=irs?0:miles*perMiEnergy,wear=irs?miles*C.val('irs'):miles*C.val('wr');
  var tp=(C.val('toll')+C.val('park'))*days;
  return {days:days,miles:miles,energy:energy,wear:wear,tp:tp,cash:energy+wear+tp,irs:irs,ev:ev,perMi:perMiEnergy};
}
function compute(){
  var u=$('du').value,ev=$('pt').value==='ev',irs=$('wm').value==='irs';
  if(u!==prevU){var dv=C.val('dist');$('dist').value=+(u==='km'?dv*KM:dv/KM).toFixed(2);prevU=u;}
  C.text('dU',u==='km'?'kilometres':'miles');
  C.text('effL',ev?'Effizienz (Meilen pro kWh)':'Kraftstoffverbrauch (MPG)');C.text('fpL',ev?'Strompreis pro kWh':'Kraftstoffpreis pro Gallone');C.text('engNote',ev?'electric':'gasoline');
  C.text('wearNote',irs?'IRS-Standardsatz':'Verschleiß pro Meile');$('wearBox').hidden=irs;$('irsBox').hidden=!irs;
  $('err').hidden=true;
  var dist=C.val('dist')/(u==='km'?KM:1);
  if(!(dist>0))return fail('Geben Sie Ihre einfache Entfernung ein.');
  if(!irs&&!(C.val('eff')>0))return fail('Geben Sie eine Fahrzeugeffizienz größer als null ein.');
  var m=model(dist),days=m.days,timeH=2*C.val('mins')/60*days,timeC=$('tv').checked?timeH*C.val('hr'):0;
  C.text('resultValue',C.money(m.cash,2));C.text('tag',C.num(days,1).replace(/[.,]0$/,'')+' Tage im Monat');
  C.text('interp',C.num(m.miles,0)+' Meilen im Monat über '+C.num(days,1).replace(/[.,]0$/,'')+' Pendeltage, berechnet mit '+(irs?'dem IRS-Satz':(ev?'electricity':'fuel')+' und Verschleiß')+', Maut und Parkgebühren.');
  C.text('oY',C.money(m.cash*12,0));C.text('oD',C.money(m.cash/days,2));C.text('oMi',C.num(m.miles,0));C.text('oPm',C.money(m.cash/m.miles,2));
  var h='';
  if(irs){h+=row('Fahrzeugkosten zum IRS-Satz',C.money(m.wear,2),C.num(m.miles,0)+' Meilen × '+C.money(C.val('irs'),3));}
  else{h+=row((ev?'Laden':'Kraftstoff'),C.money(m.energy,2),ev?C.num(m.miles/C.val('eff'),0)+' kWh':C.num(m.miles/C.val('eff'),1)+' gallons');h+=row('Verschleiß und Wartung',C.money(m.wear,2),C.money(C.val('wr'),3)+' pro Meile');}
  h+=row('Maut und Parken',C.money(m.tp,2),C.money(C.val('toll')+C.val('park'),2)+' pro Tag');
  if($('tv').checked)h+=row('Wert der Pendelzeit (kein Bargeld)',C.money(timeC,2),C.num(timeH,1)+' hours');
  h+=row('Direkte monatliche Kosten',C.money(m.cash,2),'',true);
  $('break').innerHTML=h.replace('border-top:1px solid var(--sx-border)','border-top:0');
  /* remote days */
  var w=Math.min(C.val('wfh'),C.val('dpw')),perDay=m.cash/days,saveDays=w*C.val('wpy')/12,save=perDay*saveDays,saveT=2*C.val('mins')/60*saveDays;
  C.text('wfhTag',w+' Homeoffice-Tag'+(w===1?'':'s')+' pro Woche');
  C.text('wfhTxt',w>0?'Arbeiten von zu Hause aus '+w+' day'+(w===1?'':'s')+' pro Woche spart etwa '+C.num(saveDays,1).replace(/[.,]0$/,'')+' Pendelfahrten im Monat. Das spart '+C.money(save,2)+' im Monat ('+C.money(save*12,0)+' im Jahr) und schenkt Ihnen '+C.num(saveT,1)+' Stunden Reisezeit zurück.':'Setzen Sie die Homeoffice-Tage über null, um die Einsparung zu sehen.');
  /* comparison */
  var pass=C.val('pass'),ride=C.val('ride')*2*days;
  var c='';c+=row('Auto (aktuell)',C.money(m.cash,2),'Kraftstoff, Verschleiß, Maut, Parken');
  if(pass>0){var ds=m.cash-pass;c+=row('ÖPNV-Ticket',C.money(pass,2),ds>0?'saves '+C.money(ds,2)+' pro Monat':'costs '+C.money(-ds,2)+' more');}
  if(C.val('ride')>0){c+=row('Fahrdienst hin und zurück',C.money(ride,2),ride>m.cash?C.money(ride-m.cash,2)+' mehr als Autofahren':C.money(m.cash-ride,2)+' weniger als Autofahren');}
  $('cmp').innerHTML=c.replace('border-top:1px solid var(--sx-border)','border-top:0');C.text('cmpNote','Standardmonat mit '+C.num(days,1).replace(/[.,]0$/,'')+' days');
  /* sensitivity */
  var sd=[5,10,20,30,45],t='';sd.forEach(function(x){var s=model(x);t+='<tr><td class="a">'+x+' Meilen ('+C.num(x*KM,0)+' km)</td><td class="n">'+C.num(s.miles,0)+'</td><td class="n">'+C.money(s.energy,0)+'</td><td class="n">'+C.money(s.wear,0)+'</td><td class="n">'+C.money(s.tp,0)+'</td><td class="n"><b>'+C.money(s.cash,0)+'</b></td></tr>';});
  $('sens').querySelector('tbody').innerHTML=t;
  last='Pendelkosten — calculatepilot.com/other/commute-cost-calculator.html\n'+C.num(dist,1)+' Meilen je Strecke, '+C.val('dpw')+' Tage pro Woche: '+C.money(m.cash,2)+' im Monat ('+C.money(m.cash*12,0)+' im Jahr)\n'+(irs?'IRS-Satz':'Fuel/wear')+' '+C.money(m.energy+m.wear,2)+', Maut und Parkgebühren '+C.money(m.tp,2)+(timeC?'\nZeitwert '+C.money(timeC,2)+' ('+C.num(timeH,1)+' h)':'');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'cmCalc',compute:compute});
  document.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){var v=+b.getAttribute('data-d');$('dist').value=+(prevU==='km'?v*KM:v).toFixed(2);$('dist').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
