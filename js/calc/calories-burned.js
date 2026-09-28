/* Calories burned calculator — CalculatePilot (redesign, PSEO standards).
   METs from the 2024 Adult Compendium of Physical Activities (code in brackets). kcal/min = MET × 3.5 × kg ÷ 200 (ACSM);
   net = (MET − 1) × 3.5 × kg ÷ 200. Corrected MET = MET × 3.5 ÷ RMR (mL/kg/min), RMR from Harris-Benedict (Compendium method):
   m 66.4730 + 5.0033H + 13.7516W − 6.7550A; f 655.0955 + 1.8496H + 9.5634W − 4.6756A; kcal/day ÷ 1440 ÷ 5 ÷ kg × 1000.
   Intensity (PAG): light < 3, moderate 3–5.9, vigorous ≥ 6. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var A=[['Walking & running',[['Walking, 2.8–3.4 mph, moderate pace',3.8,17190],['Walking, 3.5–3.9 mph, brisk',4.8,17200],['Walking, 4.0–4.4 mph, very brisk',5.5,17220],['Hiking, cross country',6.0,17080],['Running, 5.0–5.2 mph (12 min/mile)',8.5,12030],['Running, 6–6.3 mph (10 min/mile)',9.3,12050],['Running, 7 mph (8.5 min/mile)',11.0,12070],['Running, 8 mph (7.5 min/mile)',12.0,12090]]],
 ['Cycling',[['Cycling, <10 mph, leisure',4.0,1010],['Cycling, 12–13.9 mph, moderate',8.0,1030],['Cycling, 14–15.9 mph, vigorous',10.0,1040],['Stationary bike, general',6.8,1200],['Spin class',9.0,1270]]],
 ['Gym & fitness',[['Elliptical trainer, moderate',5.0,2048],['Rowing machine, moderate (<100 W)',5.0,2071],['Rowing machine, vigorous',7.3,2070],['Weight training, 8–15 reps',3.5,2054],['Weight lifting, power / body building',6.0,2050],['Circuit training, vigorous',7.5,2040],['Aerobic dance, low impact',4.8,2005],['Aerobic dance, high impact',8.0,2006],['Yoga, Hatha',2.3,2150],['Yoga, power',4.0,2160],['Pilates',2.8,2105],['Rope jumping, 100–120 skips/min',11.8,15551]]],
 ['Swimming & sports',[['Swimming laps, freestyle, slow',5.8,18240],['Swimming laps, freestyle, fast',9.8,18230],['Basketball, general',7.5,15055],['Soccer, casual',7.0,15610],['Tennis, general',6.8,15675],['Golf, walking & carrying clubs',4.3,15265]]],
 ['Home & garden',[['Gardening, general',3.8,8245],['Cleaning, heavy (e.g. washing car)',3.5,5020]]]];
var FLAT=[];A.forEach(function(g){g[1].forEach(function(a){FLAT.push(a);});});
var CMP=[0,1,5,9,13,15,16,21,25,27];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('en-US'):'—';}
function band(m){return m<3?'Light':m<6?'Moderate':'Vigorous';}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    $('wt').value=Math.round(v('wt')*(imp?2.20462:1/2.20462)*(imp?1:10))/(imp?1:10);
    if(imp&&v('cm')>0){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else if(!imp&&v('ft')>0)$('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');
  var a=FLAT[+$('act').value]||FLAT[5],met=a[1],kg=imp?v('wt')/2.20462:v('wt'),min=v('min');
  C.text('metL','MET '+met.toFixed(1));
  if(!(kg>0&&min>0))return;
  var per=met*3.5*kg/200,tot=per*min,net=(met-1)*3.5*kg/200*min;
  C.text('resultValue',K(tot));C.text('tag',band(met)+' intensity');
  C.text('rN',a[0]+' for '+min+' min at '+(imp?Math.round(kg*2.20462)+' lb':Math.round(kg*10)/10+' kg')+': '+met+' × 3.5 × '+(Math.round(kg*10)/10)+' kg ÷ 200 = '+per.toFixed(1)+' kcal/min.');
  C.text('net',K(net)+' kcal');C.text('ph',K(per*60)+' kcal');C.text('mm',K(met*min));
  var H=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),age=v('age'),male=$('sex').value==='s1',cm=null;
  if(H>100&&age>0){var rmr=male?66.4730+5.0033*H+13.7516*kg-6.7550*age:655.0955+1.8496*H+9.5634*kg-4.6756*age,ml=rmr/1440/5/kg*1000;cm=met*3.5/ml;}
  C.text('pmL',cm?'Corrected MET (your RMR)':'Personalized MET');C.text('pm',cm?cm.toFixed(1)+' · '+band(cm):'Add sex, age & height');
  var wn=$('warn');
  if(cm&&band(cm)!==band(met))wn.textContent='Adjusted for your resting metabolism, this activity moves from '+band(met).toLowerCase()+' to '+band(cm).toLowerCase()+' intensity for you.';
  else wn.textContent=met>=6?'Vigorous: '+min+' min counts like about '+(min*2)+' min of moderate activity toward the 150-minute weekly guideline.':met>=3?'Moderate: '+min+' min is '+Math.round(min/150*100)+'% of the 150-minute weekly guideline.':'Light activity — good for movement, but it doesn\'t count toward the moderate-to-vigorous weekly guideline.';
  C.text('tbT',min+' min at '+(imp?Math.round(kg*2.20462)+' lb':Math.round(kg)+' kg'));
  var idx=+$('act').value,rows=CMP.indexOf(idx)<0?CMP.concat([idx]):CMP;
  $('cmpTbl').innerHTML=rows.map(function(i){var x=FLAT[i];return '<tr'+(i===idx?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+'</td><td>'+x[1].toFixed(1)+'</td><td class="b">'+K(x[1]*3.5*kg/200*min)+'</td><td style="font-family:inherit">'+band(x[1])+'</td></tr>';}).join('');
  last='Calories burned: '+K(tot)+' kcal ('+K(net)+' net) — '+a[0]+', '+min+' min\nMET '+met+' (2024 Adult Compendium)\n— calculatepilot.com/health/calories-burned-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  var s=$('act'),h='',i=0;A.forEach(function(g){h+='<optgroup label="'+g[0]+'">';g[1].forEach(function(a){h+='<option value="'+i+'"'+(i===5?' selected':'')+'>'+a[0]+'</option>';i++;});h+='</optgroup>';});s.innerHTML=h;
  C.init({root:'cbCalc',compute:compute});
  s.addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Results');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
