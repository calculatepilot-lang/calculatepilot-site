/* Target heart rate calculator — CalculatePilot (redesign, PSEO standards).
   Max HR: 220 − age (AHA), 208 − 0.7 × age (Tanaka 2001), 207 − 0.7 × age (Gellish 2007), or measured.
   AHA: moderate 50–70% max, vigorous 70–85%. Karvonen: rest + (max − rest) × %; ACSM moderate 40–59% HRR, vigorous 60–89% HRR.
   5-zone model: 50–60, 60–70, 70–80, 80–90, 90–100% of max. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var Z=[['Zone 1 · Very light',50,60,'Easy, can chat freely'],['Zone 2 · Light',60,70,'Comfortable, can hold a conversation'],['Zone 3 · Moderate',70,80,'Breathing harder, short sentences'],['Zone 4 · Hard',80,90,'Few words at a time'],['Zone 5 · Maximum',90,100,'All-out, very short efforts']];

function compute(){
  var fm=$('fm').value,age=v('age'),rhr=v('rhr');$('mRow').hidden=fm!=='s4';
  if(!(age>0))return;
  var max=fm==='s1'?220-age:fm==='s2'?208-0.7*age:fm==='s3'?207-0.7*age:v('mhr');
  if(!(max>0))return;
  var R=function(x){return Math.round(x+1e-9);},kv=rhr>0&&rhr<max,res=max-rhr,t=function(p){return kv?rhr+res*p:max*p;};
  var m1=R(t(kv?0.40:0.50)),m2=R(t(kv?0.59:0.70)),v1=R(t(kv?0.60:0.70)),v2=R(t(kv?0.89:0.85));
  C.text('resultValue',m1+'–'+v2);C.text('tag',kv?'Karvonen (ACSM)':'AHA % of max');
  C.text('rN',kv?'Using your resting heart rate of '+rhr+' bpm and heart rate reserve of '+R(res)+' bpm: moderate is 40–59% and vigorous 60–89% of reserve.':'Moderate is about 50–70% and vigorous about 70–85% of your estimated '+R(max)+' bpm maximum. Add a resting heart rate for a personalized Karvonen zone.');
  C.text('mod',m1+'–'+m2+' bpm');C.text('vig',v1+'–'+v2+' bpm');C.text('max',R(max)+' bpm');
  C.text('hrrL',kv?'Heart rate reserve':'AHA zone (50–85%)');C.text('hrr',kv?R(res)+' bpm':R(max*0.5)+'–'+R(max*0.85)+' bpm');
  C.text('p1',Math.round(m1/6)+'–'+Math.round(m2/6)+' beats');C.text('p2',Math.round(v1/6)+'–'+Math.round(v2/6)+' beats');
  var wn=$('warn');
  if(rhr>100)wn.textContent='A resting heart rate above 100 bpm is higher than the usual 60–100 range — worth mentioning to your doctor.';
  else if(age<18)wn.textContent='Formulas were developed in adults; for children and teens, use effort level as the main guide.';
  else wn.textContent='Beta-blockers and some other medicines lower heart rate — if you take them, ask your doctor which zone to use.';
  C.text('tbT','Max '+R(max)+' bpm');
  $('zTbl').innerHTML=Z.map(function(z){return '<tr><td style="font-family:inherit;font-weight:600">'+z[0]+'</td><td>'+z[1]+'–'+z[2]+'%</td><td class="b">'+R(max*z[1]/100)+'–'+R(max*z[2]/100)+' bpm</td><td style="font-family:inherit">'+z[3]+'</td></tr>';}).join('');
  last='Target heart rate: moderate '+m1+'–'+m2+' bpm, vigorous '+v1+'–'+v2+' bpm ('+(kv?'Karvonen':'AHA')+')\nMax HR: '+R(max)+' bpm\n— calculatepilot.com/health/target-heart-rate-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'thrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Zones');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
