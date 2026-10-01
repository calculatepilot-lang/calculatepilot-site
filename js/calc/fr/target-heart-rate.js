/* Target heart rate calculator — CalculatePilot (redesign, PSEO standards).
   Max HR: 220 − age (AHA), 208 − 0.7 × age (Tanaka 2001), 207 − 0.7 × age (Gellish 2007), or measured.
   AHA: moderate 50–70% max, vigorous 70–85%. Karvonen: rest + (max − rest) × %; ACSM moderate 40–59% HRR, vigorous 60–89% HRR.
   5-zone model: 50–60, 60–70, 70–80, 80–90, 90–100% of max. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var Z=[['Zone 1 · Très légère',50,60,'Facile, on peut parler librement'],['Zone 2 · Légère',60,70,'Confortable, on peut tenir une conversation'],['Zone 3 · Modérée',70,80,'Respiration plus rapide, phrases courtes'],['Zone 4 · Intense',80,90,'Quelques mots à la fois'],['Zone 5 · Maximale',90,100,'Effort total, très courts']];

function compute(){
  var fm=$('fm').value,age=v('age'),rhr=v('rhr');$('mRow').hidden=fm!=='s4';
  if(!(age>0))return;
  var max=fm==='s1'?220-age:fm==='s2'?208-0.7*age:fm==='s3'?207-0.7*age:v('mhr');
  if(!(max>0))return;
  var R=function(x){return Math.round(x+1e-9);},kv=rhr>0&&rhr<max,res=max-rhr,t=function(p){return kv?rhr+res*p:max*p;};
  var m1=R(t(kv?0.40:0.50)),m2=R(t(kv?0.59:0.70)),v1=R(t(kv?0.60:0.70)),v2=R(t(kv?0.89:0.85));
  C.text('resultValue',m1+'–'+v2);C.text('tag',kv?'Karvonen (ACSM)':'AHA, % du max');
  C.text('rN',kv?'En utilisant votre fréquence cardiaque au repos de '+rhr+' bpm et votre réserve de fréquence cardiaque de '+R(res)+' bpm : modéré correspond à 40–59 % et intense à 60–89 % de la réserve.':'Modéré correspond à environ 50–70 % et intense à environ 70–85 % de votre maximum estimé de '+R(max)+' bpm. Ajoutez une fréquence cardiaque au repos pour obtenir une zone Karvonen personnalisée.');
  C.text('mod',m1+'–'+m2+' bpm');C.text('vig',v1+'–'+v2+' bpm');C.text('max',R(max)+' bpm');
  C.text('hrrL',kv?'Réserve de fréquence cardiaque':'Zone AHA (50–85 %)');C.text('hrr',kv?R(res)+' bpm':R(max*0.5)+'–'+R(max*0.85)+' bpm');
  C.text('p1',Math.round(m1/6)+'–'+Math.round(m2/6)+' beats');C.text('p2',Math.round(v1/6)+'–'+Math.round(v2/6)+' beats');
  var wn=$('warn');
  if(rhr>100)wn.textContent='Une fréquence cardiaque au repos supérieure à 100 bpm dépasse la plage habituelle de 60–100 — il vaut la peine d\'en parler à votre médecin.';
  else if(age<18)wn.textContent='Les formules ont été développées chez l\'adulte ; pour les enfants et les adolescents, prenez le niveau d\'effort comme principal repère.';
  else wn.textContent='Les bêtabloquants et certains autres médicaments abaissent la fréquence cardiaque — si vous en prenez, demandez à votre médecin quelle zone utiliser.';
  C.text('tbT','Max '+R(max)+' bpm');
  $('zTbl').innerHTML=Z.map(function(z){return '<tr><td style="font-family:inherit;font-weight:600">'+z[0]+'</td><td>'+z[1]+'–'+z[2]+'%</td><td class="b">'+R(max*z[1]/100)+'–'+R(max*z[2]/100)+' bpm</td><td style="font-family:inherit">'+z[3]+'</td></tr>';}).join('');
  last='Fréquence cardiaque cible : modérée '+m1+'–'+m2+' bpm, intense '+v1+'–'+v2+' bpm ('+(kv?'Karvonen':'AHA')+')\nFC max : '+R(max)+' bpm\n— calculatepilot.com/health/target-heart-rate-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'thrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les zones');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
