/* Sleep cycle calculator — CalculatePilot (Stitch redesign).
   90-minute cycles. Mode wake: bedtime = wake − N×90 − latency. Mode bed: wake = bed + latency + N×90. Mode nap: end = start + latency + minutes. */
(function(){
var C=window.CPX,$=C.$,last='';
function hm(m){m=((Math.round(m)%1440)+1440)%1440;var h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM',h12=h%12||12;return h12+':'+(mm<10?'0':'')+mm+' '+ap;}
function dur(m){var h=Math.floor(m/60),r=m%60;return h+'h '+(r<10?'0':'')+r+'m';}
function parse(v){var p=(v||'').split(':');if(p.length<2)return NaN;return (+p[0])*60+(+p[1]);}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oSleep','oBed'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  var mode=$('mode').value,t=parse($('t').value),lat=C.val('lat'),age=$('age').value.split('-'),lo=+age[0],hi=+age[1];
  C.text('latV',lat+' min');C.text('ageN',lo+' to '+hi+' horas recomendadas');$('err').hidden=true;
  $('ageRow').style.display=mode==='nap'?'none':'';
  if(isNaN(t))return fail('Introduce una hora.');
  var rows=[],best;
  if(mode==='nap'){
    C.text('tL','Planeo tomar una siesta a las');C.text('hL','Despierta a las');C.text('lad','Opciones de siesta');C.text('h1','Despertar a las');C.text('h2','Tipo');
    [[20,'Siesta energética'],[30,'Siesta corta'],[60,'Riesgo de sueño profundo'],[90,'Ciclo completo']].forEach(function(o){rows.push({time:hm(t+lat+o[0]),c:o[1],s:o[0]+' min'});});
    best=rows[0];
    C.text('resultValue',best.time);C.text('tag','Siesta energética de 20 minutos');C.text('interp','Duérmete alrededor de las '+hm(t+lat)+' y despierta tras una siesta de 20 minutos para un impulso de alerta con poca somnolencia.');
    C.text('oSleep','20 min');C.text('oBed',(20+lat)+' min');C.text('ladN','after '+lat+' min para dormirte');
    C.text('note','Una siesta de 10 a 20 minutos mejora la alerta con poca somnolencia. Las siestas de 30 a 60 minutos suelen terminar en sueño profundo y mayor aturdimiento. Una siesta de 90 minutos completa un ciclo. Evita dormir siesta en las 6 horas previas a acostarte si te perjudica el sueño nocturno.');
  }else if(mode==='wake'){
    C.text('tL','Necesito despertarme a las');C.text('hL','Mejor hora de acostarte');C.text('lad','Otras horas de acostarse');C.text('h1','Acuéstate a las');C.text('h2','Ciclos');
    [6,5,4,3].forEach(function(n){rows.push({time:hm(t-n*90-lat),c:n+' cycles',s:dur(n*90),n:n});});
    best=rows[1];
    C.text('resultValue',best.time);C.text('tag','5 ciclos');
    C.text('interp','Estar en la cama a las '+best.time+' y dormido hacia las '+hm(t-450)+' para despertar a las '+hm(t)+' tras 5 ciclos completos.');
    C.text('oSleep','7 h 30 min');C.text('oBed',dur(450+lat));C.text('ladN','para una '+hm(t)+' despertar');
    C.text('note',(7.5>=lo&&7.5<=hi?'7,5 horas está dentro de las '+lo+' to '+hi+' horas recomendadas para este grupo de edad.':'7,5 horas está fuera de las '+lo+' to '+hi+' horas recomendadas para este grupo de edad. Elige la opción de 6 ciclos para 9 horas.')+' Menos de 4 ciclos (6 horas) deja a la mayoría de los adultos con falta de sueño.');
  }else{
    C.text('tL','Planeo acostarme a las');C.text('hL','Despierta a las');C.text('lad','Otras horas de despertar');C.text('h1','Despierta a las');C.text('h2','Ciclos');
    [3,4,5,6].forEach(function(n){rows.push({time:hm(t+lat+n*90),c:n+' cycles',s:dur(n*90),n:n});});
    best=rows[2];
    C.text('resultValue',best.time);C.text('tag','5 ciclos');
    C.text('interp','Si te duermes alrededor de las '+hm(t+lat)+', 5 ciclos completos terminan a las '+best.time+'.');
    C.text('oSleep','7 h 30 min');C.text('oBed',dur(450+lat));C.text('ladN','acostarte a las '+hm(t));
    C.text('note',(7.5>=lo&&7.5<=hi?'7,5 horas encaja en las '+lo+' to '+hi+' horas recomendadas para este grupo de edad.':'7,5 horas está fuera de las '+lo+' to '+hi+' horas recomendadas para este grupo de edad. Considera la opción de 6 ciclos.')+' Programa una alarma en una de estas horas en lugar de una al azar.');
  }
  $('rows').innerHTML=rows.map(function(r){return '<tr><td class="a"><b>'+r.time+'</b></td><td class="n">'+r.c+'</td><td class="n">'+r.s+'</td></tr>';}).join('');
  last='Calculadora de sueño — calculatepilot.com/other/sleep-calculator.html\n'+$('hL').textContent+': '+best.time;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'slCalc',compute:compute});
  document.querySelectorAll('[data-t]').forEach(function(b){b.addEventListener('click',function(){$('t').value=b.getAttribute('data-t');$('t').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
