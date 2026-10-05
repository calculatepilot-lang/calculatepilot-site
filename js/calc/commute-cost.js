/* Commute cost calculator — CalculatePilot (Stitch redesign).
   days/month = days/week × weeks/year ÷ 12; miles = 2 × one-way × days.
   Direct cost = miles × (energy cost per mile + wear) + (tolls + parking) × days; IRS mode replaces energy + wear with rate × miles
   (tolls and parking still added). Time value = 2 × minutes ÷ 60 × days × hourly value (shown separately). */
(function(){
var C=window.CPX,$=C.$,last='',prevU='mi',KM=1.609344;
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oY','oD','oMi','oPm'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the cost.');$('break').innerHTML='';$('cmp').innerHTML='';last='';}
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
  C.text('effL',ev?'Efficiency (miles per kWh)':'Fuel economy (MPG)');C.text('fpL',ev?'Electricity price per kWh':'Fuel price per gallon');C.text('engNote',ev?'electric':'gasoline');
  C.text('wearNote',irs?'IRS standard rate':'per-mile wear');$('wearBox').hidden=irs;$('irsBox').hidden=!irs;
  $('err').hidden=true;
  var dist=C.val('dist')/(u==='km'?KM:1);
  if(!(dist>0))return fail('Enter your one-way distance.');
  if(!irs&&!(C.val('eff')>0))return fail('Enter the vehicle efficiency above zero.');
  var m=model(dist),days=m.days,timeH=2*C.val('mins')/60*days,timeC=$('tv').checked?timeH*C.val('hr'):0;
  C.text('resultValue',C.money(m.cash,2));C.text('tag',C.num(days,1).replace(/\.0$/,'')+' days a month');
  C.text('interp',C.num(m.miles,0)+' miles a month over '+C.num(days,1).replace(/\.0$/,'')+' commute days, priced for '+(irs?'the IRS rate':(ev?'electricity':'fuel')+' and wear')+', tolls and parking.');
  C.text('oY',C.money(m.cash*12,0));C.text('oD',C.money(m.cash/days,2));C.text('oMi',C.num(m.miles,0));C.text('oPm',C.money(m.cash/m.miles,2));
  var h='';
  if(irs){h+=row('Vehicle costs at IRS rate',C.money(m.wear,2),C.num(m.miles,0)+' mi × '+C.money(C.val('irs'),3));}
  else{h+=row((ev?'Charging':'Fuel'),C.money(m.energy,2),ev?C.num(m.miles/C.val('eff'),0)+' kWh':C.num(m.miles/C.val('eff'),1)+' gallons');h+=row('Wear and maintenance',C.money(m.wear,2),C.money(C.val('wr'),3)+' per mile');}
  h+=row('Tolls and parking',C.money(m.tp,2),C.money(C.val('toll')+C.val('park'),2)+' per day');
  if($('tv').checked)h+=row('Value of commute time (not cash)',C.money(timeC,2),C.num(timeH,1)+' hours');
  h+=row('Direct monthly cost',C.money(m.cash,2),'',true);
  $('break').innerHTML=h.replace('border-top:1px solid var(--sx-border)','border-top:0');
  /* remote days */
  var w=Math.min(C.val('wfh'),C.val('dpw')),perDay=m.cash/days,saveDays=w*C.val('wpy')/12,save=perDay*saveDays,saveT=2*C.val('mins')/60*saveDays;
  C.text('wfhTag',w+' remote day'+(w===1?'':'s')+' a week');
  C.text('wfhTxt',w>0?'Working from home '+w+' day'+(w===1?'':'s')+' a week removes about '+C.num(saveDays,1).replace(/\.0$/,'')+' commutes a month. That saves '+C.money(save,2)+' a month ('+C.money(save*12,0)+' a year) and gives back '+C.num(saveT,1)+' hours of travel time.':'Set remote days above zero to see the saving.');
  /* comparison */
  var pass=C.val('pass'),ride=C.val('ride')*2*days;
  var c='';c+=row('Drive (current)',C.money(m.cash,2),'fuel, wear, tolls, parking');
  if(pass>0){var ds=m.cash-pass;c+=row('Transit pass',C.money(pass,2),ds>0?'saves '+C.money(ds,2)+' a month':'costs '+C.money(-ds,2)+' more');}
  if(C.val('ride')>0){c+=row('Rideshare both ways',C.money(ride,2),ride>m.cash?C.money(ride-m.cash,2)+' more than driving':C.money(m.cash-ride,2)+' less than driving');}
  $('cmp').innerHTML=c.replace('border-top:1px solid var(--sx-border)','border-top:0');C.text('cmpNote','Standard month of '+C.num(days,1).replace(/\.0$/,'')+' days');
  /* sensitivity */
  var sd=[5,10,20,30,45],t='';sd.forEach(function(x){var s=model(x);t+='<tr><td class="a">'+x+' miles ('+C.num(x*KM,0)+' km)</td><td class="n">'+C.num(s.miles,0)+'</td><td class="n">'+C.money(s.energy,0)+'</td><td class="n">'+C.money(s.wear,0)+'</td><td class="n">'+C.money(s.tp,0)+'</td><td class="n"><b>'+C.money(s.cash,0)+'</b></td></tr>';});
  $('sens').querySelector('tbody').innerHTML=t;
  last='Commute cost — calculatepilot.com/other/commute-cost-calculator.html\n'+C.num(dist,1)+' mi each way, '+C.val('dpw')+' days a week: '+C.money(m.cash,2)+' a month ('+C.money(m.cash*12,0)+' a year)\n'+(irs?'IRS rate':'Fuel/wear')+' '+C.money(m.energy+m.wear,2)+', tolls and parking '+C.money(m.tp,2)+(timeC?'\nTime value '+C.money(timeC,2)+' ('+C.num(timeH,1)+' h)':'');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'cmCalc',compute:compute});
  document.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){var v=+b.getAttribute('data-d');$('dist').value=+(prevU==='km'?v*KM:v).toFixed(2);$('dist').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
