/* Commute cost calculator — CalculatePilot (Stitch redesign).
   days/month = days/week × weeks/year ÷ 12; miles = 2 × one-way × days.
   Direct cost = miles × (energy cost per mile + wear) + (tolls + parking) × days; IRS mode replaces energy + wear with rate × miles
   (tolls and parking still added). Time value = 2 × minutes ÷ 60 × days × hourly value (shown separately). */
(function(){
var C=window.CPX,$=C.$,last='',prevU='mi',KM=1.609344;
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oY','oD','oMi','oPm'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige el dato de arriba para ver el costo.');$('break').innerHTML='';$('cmp').innerHTML='';last='';}
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
  C.text('effL',ev?'Eficiencia (millas por kWh)':'Consumo de combustible (MPG)');C.text('fpL',ev?'Precio de la electricidad por kWh':'Precio del combustible por galón');C.text('engNote',ev?'electric':'gasoline');
  C.text('wearNote',irs?'Tarifa estándar del IRS':'desgaste por milla');$('wearBox').hidden=irs;$('irsBox').hidden=!irs;
  $('err').hidden=true;
  var dist=C.val('dist')/(u==='km'?KM:1);
  if(!(dist>0))return fail('Introduce tu distancia de ida.');
  if(!irs&&!(C.val('eff')>0))return fail('Introduce una eficiencia del vehículo mayor que cero.');
  var m=model(dist),days=m.days,timeH=2*C.val('mins')/60*days,timeC=$('tv').checked?timeH*C.val('hr'):0;
  C.text('resultValue',C.money(m.cash,2));C.text('tag',C.num(days,1).replace(/[.,]0$/,'')+' días al mes');
  C.text('interp',C.num(m.miles,0)+' millas al mes durante '+C.num(days,1).replace(/[.,]0$/,'')+' días de trayecto, calculado con '+(irs?'la tarifa del IRS':(ev?'electricity':'fuel')+' y desgaste')+', peajes y estacionamiento.');
  C.text('oY',C.money(m.cash*12,0));C.text('oD',C.money(m.cash/days,2));C.text('oMi',C.num(m.miles,0));C.text('oPm',C.money(m.cash/m.miles,2));
  var h='';
  if(irs){h+=row('Costos del vehículo a la tarifa del IRS',C.money(m.wear,2),C.num(m.miles,0)+' mi × '+C.money(C.val('irs'),3));}
  else{h+=row((ev?'Carga':'Combustible'),C.money(m.energy,2),ev?C.num(m.miles/C.val('eff'),0)+' kWh':C.num(m.miles/C.val('eff'),1)+' gallons');h+=row('Desgaste y mantenimiento',C.money(m.wear,2),C.money(C.val('wr'),3)+' por milla');}
  h+=row('Peajes y estacionamiento',C.money(m.tp,2),C.money(C.val('toll')+C.val('park'),2)+' por día');
  if($('tv').checked)h+=row('Valor del tiempo de trayecto (no es efectivo)',C.money(timeC,2),C.num(timeH,1)+' hours');
  h+=row('Costo mensual directo',C.money(m.cash,2),'',true);
  $('break').innerHTML=h.replace('border-top:1px solid var(--sx-border)','border-top:0');
  /* remote days */
  var w=Math.min(C.val('wfh'),C.val('dpw')),perDay=m.cash/days,saveDays=w*C.val('wpy')/12,save=perDay*saveDays,saveT=2*C.val('mins')/60*saveDays;
  C.text('wfhTag',w+' día remoto'+(w===1?'':'s')+' a la semana');
  C.text('wfhTxt',w>0?'Trabajar desde casa '+w+' day'+(w===1?'':'s')+' a la semana elimina unos '+C.num(saveDays,1).replace(/[.,]0$/,'')+' trayectos al mes. Eso ahorra '+C.money(save,2)+' al mes ('+C.money(save*12,0)+' al año) y devuelve '+C.num(saveT,1)+' horas de tiempo de viaje.':'Fija los días remotos por encima de cero para ver el ahorro.');
  /* comparison */
  var pass=C.val('pass'),ride=C.val('ride')*2*days;
  var c='';c+=row('Conducir (actual)',C.money(m.cash,2),'combustible, desgaste, peajes, estacionamiento');
  if(pass>0){var ds=m.cash-pass;c+=row('Abono de transporte',C.money(pass,2),ds>0?'saves '+C.money(ds,2)+' al mes':'costs '+C.money(-ds,2)+' more');}
  if(C.val('ride')>0){c+=row('Viaje compartido de ida y vuelta',C.money(ride,2),ride>m.cash?C.money(ride-m.cash,2)+' más que conducir':C.money(m.cash-ride,2)+' menos que conducir');}
  $('cmp').innerHTML=c.replace('border-top:1px solid var(--sx-border)','border-top:0');C.text('cmpNote','Mes estándar de '+C.num(days,1).replace(/[.,]0$/,'')+' days');
  /* sensitivity */
  var sd=[5,10,20,30,45],t='';sd.forEach(function(x){var s=model(x);t+='<tr><td class="a">'+x+' millas ('+C.num(x*KM,0)+' km)</td><td class="n">'+C.num(s.miles,0)+'</td><td class="n">'+C.money(s.energy,0)+'</td><td class="n">'+C.money(s.wear,0)+'</td><td class="n">'+C.money(s.tp,0)+'</td><td class="n"><b>'+C.money(s.cash,0)+'</b></td></tr>';});
  $('sens').querySelector('tbody').innerHTML=t;
  last='Costo del trayecto — calculatepilot.com/other/commute-cost-calculator.html\n'+C.num(dist,1)+' mi por trayecto, '+C.val('dpw')+' días a la semana: '+C.money(m.cash,2)+' al mes ('+C.money(m.cash*12,0)+' al año)\n'+(irs?'tarifa del IRS':'Fuel/wear')+' '+C.money(m.energy+m.wear,2)+', peajes y estacionamiento '+C.money(m.tp,2)+(timeC?'\nValor del tiempo '+C.money(timeC,2)+' ('+C.num(timeH,1)+' h)':'');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'cmCalc',compute:compute});
  document.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){var v=+b.getAttribute('data-d');$('dist').value=+(prevU==='km'?v*KM:v).toFixed(2);$('dist').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
