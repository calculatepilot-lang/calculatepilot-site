/* Target heart rate calculator — CalculatePilot (redesign, PSEO standards).
   Max HR: 220 − age (AHA), 208 − 0.7 × age (Tanaka 2001), 207 − 0.7 × age (Gellish 2007), or measured.
   AHA: moderate 50–70% max, vigorous 70–85%. Karvonen: rest + (max − rest) × %; ACSM moderate 40–59% HRR, vigorous 60–89% HRR.
   5-zone model: 50–60, 60–70, 70–80, 80–90, 90–100% of max. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var Z=[['Zone 1 · Sehr leicht',50,60,'Leicht, Sie können sich frei unterhalten'],['Zone 2 · Leicht',60,70,'Angenehm, ein Gespräch ist möglich'],['Zone 3 · Moderat',70,80,'Schwerer Atem, kurze Sätze'],['Zone 4 · Hart',80,90,'Nur wenige Wörter am Stück'],['Zone 5 · Maximal',90,100,'Volle Anstrengung, sehr kurze Belastungen']];

function compute(){
  var fm=$('fm').value,age=v('age'),rhr=v('rhr');$('mRow').hidden=fm!=='s4';
  if(!(age>0))return;
  var max=fm==='s1'?220-age:fm==='s2'?208-0.7*age:fm==='s3'?207-0.7*age:v('mhr');
  if(!(max>0))return;
  var R=function(x){return Math.round(x+1e-9);},kv=rhr>0&&rhr<max,res=max-rhr,t=function(p){return kv?rhr+res*p:max*p;};
  var m1=R(t(kv?0.40:0.50)),m2=R(t(kv?0.59:0.70)),v1=R(t(kv?0.60:0.70)),v2=R(t(kv?0.89:0.85));
  C.text('resultValue',m1+'–'+v2);C.text('tag',kv?'Karvonen (ACSM)':'AHA % des Maximums');
  C.text('rN',kv?'Mit Ihrer Ruheherzfrequenz von '+rhr+' bpm und einer Herzfrequenzreserve von '+R(res)+' bpm: moderat sind 40–59 % und intensiv 60–89 % der Reserve.':'Moderat sind etwa 50–70 % und intensiv etwa 70–85 % Ihres geschätzten '+R(max)+' bpm Maximums. Geben Sie eine Ruheherzfrequenz ein, um eine persönliche Karvonen-Zone zu erhalten.');
  C.text('mod',m1+'–'+m2+' bpm');C.text('vig',v1+'–'+v2+' bpm');C.text('max',R(max)+' bpm');
  C.text('hrrL',kv?'Herzfrequenzreserve':'AHA-Zone (50–85 %)');C.text('hrr',kv?R(res)+' bpm':R(max*0.5)+'–'+R(max*0.85)+' bpm');
  C.text('p1',Math.round(m1/6)+'–'+Math.round(m2/6)+' beats');C.text('p2',Math.round(v1/6)+'–'+Math.round(v2/6)+' beats');
  var wn=$('warn');
  if(rhr>100)wn.textContent='Eine Ruheherzfrequenz über 100 bpm liegt über dem üblichen Bereich von 60–100 — sprechen Sie darüber am besten mit Ihrem Arzt.';
  else if(age<18)wn.textContent='Die Formeln wurden für Erwachsene entwickelt; bei Kindern und Jugendlichen ist das Anstrengungsempfinden der wichtigste Anhaltspunkt.';
  else wn.textContent='Betablocker und einige andere Medikamente senken die Herzfrequenz — wenn Sie sie einnehmen, fragen Sie Ihren Arzt, welche Zone gilt.';
  C.text('tbT','Max '+R(max)+' bpm');
  $('zTbl').innerHTML=Z.map(function(z){return '<tr><td style="font-family:inherit;font-weight:600">'+z[0]+'</td><td>'+z[1]+'–'+z[2]+'%</td><td class="b">'+R(max*z[1]/100)+'–'+R(max*z[2]/100)+' bpm</td><td style="font-family:inherit">'+z[3]+'</td></tr>';}).join('');
  last='Ziel-Herzfrequenz: moderat '+m1+'–'+m2+' bpm, intensiv '+v1+'–'+v2+' bpm ('+(kv?'Karvonen':'AHA')+')\nMax. HF: '+R(max)+' bpm\n— calculatepilot.com/health/target-heart-rate-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'thrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Zonen kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
