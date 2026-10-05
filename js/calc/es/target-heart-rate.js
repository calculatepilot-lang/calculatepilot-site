/* Target heart rate calculator — CalculatePilot (redesign, PSEO standards).
   Max HR: 220 − age (AHA), 208 − 0.7 × age (Tanaka 2001), 207 − 0.7 × age (Gellish 2007), or measured.
   AHA: moderate 50–70% max, vigorous 70–85%. Karvonen: rest + (max − rest) × %; ACSM moderate 40–59% HRR, vigorous 60–89% HRR.
   5-zone model: 50–60, 60–70, 70–80, 80–90, 90–100% of max. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var Z=[['Zona 1 · Muy ligera',50,60,'Fácil, puedes conversar con libertad'],['Zona 2 · Ligera',60,70,'Cómoda, puedes mantener una conversación'],['Zona 3 · Moderada',70,80,'Respiras con más dificultad, frases cortas'],['Zona 4 · Intensa',80,90,'Pocas palabras a la vez'],['Zona 5 · Máxima',90,100,'Esfuerzo total, muy breve']];

function compute(){
  var fm=$('fm').value,age=v('age'),rhr=v('rhr');$('mRow').hidden=fm!=='s4';
  if(!(age>0))return;
  var max=fm==='s1'?220-age:fm==='s2'?208-0.7*age:fm==='s3'?207-0.7*age:v('mhr');
  if(!(max>0))return;
  var R=function(x){return Math.round(x+1e-9);},kv=rhr>0&&rhr<max,res=max-rhr,t=function(p){return kv?rhr+res*p:max*p;};
  var m1=R(t(kv?0.40:0.50)),m2=R(t(kv?0.59:0.70)),v1=R(t(kv?0.60:0.70)),v2=R(t(kv?0.89:0.85));
  C.text('resultValue',m1+'–'+v2);C.text('tag',kv?'Karvonen (ACSM)':'% del máx. según la AHA');
  C.text('rN',kv?'Con tu frecuencia cardíaca en reposo de '+rhr+' lpm y una reserva de frecuencia cardíaca de '+R(res)+' lpm: moderada es 40–59 % y vigorosa 60–89 % de la reserva.':'Moderada es aproximadamente 50–70 % y vigorosa aproximadamente 70–85 % de tu máximo estimado de '+R(max)+' lpm. Agrega una frecuencia cardíaca en reposo para obtener una zona Karvonen personalizada.');
  C.text('mod',m1+'–'+m2+' bpm');C.text('vig',v1+'–'+v2+' bpm');C.text('max',R(max)+' bpm');
  C.text('hrrL',kv?'Reserva de frecuencia cardíaca':'Zona AHA (50–85 %)');C.text('hrr',kv?R(res)+' bpm':R(max*0.5)+'–'+R(max*0.85)+' bpm');
  C.text('p1',Math.round(m1/6)+'–'+Math.round(m2/6)+' beats');C.text('p2',Math.round(v1/6)+'–'+Math.round(v2/6)+' beats');
  var wn=$('warn');
  if(rhr>100)wn.textContent='Una frecuencia cardíaca en reposo superior a 100 lpm es más alta que el rango habitual de 60–100: conviene comentarlo con tu médico.';
  else if(age<18)wn.textContent='Las fórmulas se desarrollaron en adultos; en niños y adolescentes, usa el nivel de esfuerzo como guía principal.';
  else wn.textContent='Los betabloqueadores y algunos otros medicamentos reducen la frecuencia cardíaca: si los tomas, pregunta a tu médico qué zona usar.';
  C.text('tbT','Máx. '+R(max)+' bpm');
  $('zTbl').innerHTML=Z.map(function(z){return '<tr><td style="font-family:inherit;font-weight:600">'+z[0]+'</td><td>'+z[1]+'–'+z[2]+'%</td><td class="b">'+R(max*z[1]/100)+'–'+R(max*z[2]/100)+' lpm</td><td style="font-family:inherit">'+z[3]+'</td></tr>';}).join('');
  last='Frecuencia cardíaca objetivo: moderada '+m1+'–'+m2+' lpm, vigorosa '+v1+'–'+v2+' lpm ('+(kv?'Karvonen':'AHA')+')\nFC máx.: '+R(max)+' lpm\n— calculatepilot.com/health/target-heart-rate-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'thrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar zonas');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
