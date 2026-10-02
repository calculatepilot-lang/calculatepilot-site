/* Speed, pace & travel time calculator — CalculatePilot (Stitch redesign). SI base: metres and seconds. */
(function(){
var C=window.CPX,$=C.$,last='';
var MI=1609.344,SPU={mph:MI/3600,kmh:1000/3600,ms:1,kt:1852/3600},SPN={mph:'mph',kmh:'km/h',ms:'m/s',kt:'kt'};
function hms(s){s=Math.round(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;return h>0?h+':'+(m<10?'0':'')+m+':'+(r<10?'0':'')+r:m+':'+(r<10?'0':'')+r;}
function pace(secPerUnit){if(!isFinite(secPerUnit)||secPerUnit<=0)return '—';var s=Math.round(secPerUnit),m=Math.floor(s/60),r=s%60;return m+':'+(r<10?'0':'')+r;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oPm','oPk','oKmh','oMs','oKt','oFps'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  var mode=$('mode').value;$('err').hidden=true;
  $('fD').hidden=mode==='dist';$('fT').hidden=mode==='time';$('fS').hidden=mode==='speed';
  var dv=C.val('dv'),du=parseFloat($('du').value),t=C.val('th')*3600+C.val('tm')*60+C.val('ts'),su=$('su').value,sv=C.val('sv');
  var d=dv*du,v,unit,valTxt,label;
  if(mode==='speed'){if(!(d>0))return fail('Geben Sie eine Entfernung ein.');if(!(t>0))return fail('Geben Sie eine Uhrzeit ein.');v=d/t;}
  else if(mode==='time'){if(!(d>0))return fail('Geben Sie eine Entfernung ein.');if(!(sv>0))return fail('Geben Sie eine Geschwindigkeit ein.');v=sv*SPU[su];t=d/v;}
  else{if(!(t>0))return fail('Geben Sie eine Uhrzeit ein.');if(!(sv>0))return fail('Geben Sie eine Geschwindigkeit ein.');v=sv*SPU[su];d=v*t;}
  var mph=v/SPU.mph,kmh=v/SPU.kmh;
  if(mode==='speed'){label='Durchschnittsgeschwindigkeit';C.text('resultValue',C.num(mph,2));C.text('resU','mph');C.text('interp',C.num(d/1000,2)+' km ('+C.num(d/MI,2)+' mi) in '+hms(t)+'.');}
  else if(mode==='time'){label='Reisezeit';C.text('resultValue',hms(t));C.text('resU','h:mm:ss');C.text('interp',C.num(d/1000,2)+' km ('+C.num(d/MI,2)+' mi) bei '+C.num(sv,2)+' '+SPN[su]+'.');}
  else{label='Distanz';C.text('resultValue',C.num(d/MI,2));C.text('resU','miles');C.text('interp',C.num(d/1000,2)+' km in '+hms(t)+' at '+C.num(sv,2)+' '+SPN[su]+'.');}
  C.text('hL',label);C.text('tag',hms(t));
  C.text('oPm',pace(MI/v)+' /mi');C.text('oPk',pace(1000/v)+' /km');C.text('oKmh',C.num(kmh,2));C.text('oMs',C.num(v,2));C.text('oKt',C.num(v/SPU.kt,2));C.text('oFps',C.num(v/0.3048,2));
  var sp=[['1 Meile',MI],['1 Kilometer',1000],['5K',5000],['10K',10000],['Halbmarathon',21097.5],['Marathon',42195]];
  $('rows').innerHTML=sp.map(function(x){return '<tr><td class="a">'+x[0]+'</td><td class="n"><b>'+hms(x[1]/v)+'</b></td></tr>';}).join('');
  last='Geschwindigkeit — calculatepilot.com/other/speed-calculator.html\n'+label+': '+$('resultValue').textContent+' '+$('resU').textContent+' · '+C.num(d/MI,2)+' mi in '+hms(t)+' · Pace '+pace(MI/v)+'/mi';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'spCalc',compute:compute});
  document.querySelectorAll('[data-d]').forEach(function(b){b.addEventListener('click',function(){var u=parseFloat($('du').value);$('dv').value=+(parseFloat(b.getAttribute('data-d'))/u).toFixed(4);$('dv').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
