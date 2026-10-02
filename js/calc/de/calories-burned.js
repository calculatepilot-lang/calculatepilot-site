/* Calories burned calculator — CalculatePilot (redesign, PSEO standards).
   METs from the 2024 Adult Compendium of Physical Activities (code in brackets). kcal/min = MET × 3.5 × kg ÷ 200 (ACSM);
   net = (MET − 1) × 3.5 × kg ÷ 200. Corrected MET = MET × 3.5 ÷ RMR (mL/kg/min), RMR from Harris-Benedict (Compendium method):
   m 66.4730 + 5.0033H + 13.7516W − 6.7550A; f 655.0955 + 1.8496H + 9.5634W − 4.6756A; kcal/day ÷ 1440 ÷ 5 ÷ kg × 1000.
   Intensity (PAG): light < 3, moderate 3–5.9, vigorous ≥ 6. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var A=[['Gehen &amp; Laufen',[['Gehen, 2,8–3,4 mph, mäßiges Tempo',3.8,17190],['Gehen, 3,5–3,9 mph, zügig',4.8,17200],['Gehen, 4,0–4,4 mph, sehr zügig',5.5,17220],['Wandern, querfeldein',6.0,17080],['Laufen, 5,0–5,2 mph (12 min/Meile)',8.5,12030],['Laufen, 6–6,3 mph (10 min/Meile)',9.3,12050],['Laufen, 7 mph (8,5 min/Meile)',11.0,12070],['Laufen, 8 mph (7,5 min/Meile)',12.0,12090]]],
 ['Radfahren',[['Radfahren, <10 mph, Freizeit',4.0,1010],['Radfahren, 12–13,9 mph, mäßig',8.0,1030],['Radfahren, 14–15,9 mph, intensiv',10.0,1040],['Heimtrainer, allgemein',6.8,1200],['Spinning-Kurs',9.0,1270]]],
 ['Fitnessstudio &amp; Fitness',[['Crosstrainer, mäßig',5.0,2048],['Rudergerät, mäßig (<100 W)',5.0,2071],['Rudergerät, intensiv',7.3,2070],['Krafttraining, 8–15 Wiederholungen',3.5,2054],['Gewichtheben, Kraft / Bodybuilding',6.0,2050],['Zirkeltraining, intensiv',7.5,2040],['Aerobic, geringe Belastung',4.8,2005],['Aerobic, hohe Belastung',8.0,2006],['Yoga, Hatha',2.3,2150],['Yoga, Power',4.0,2160],['Pilates',2.8,2105],['Seilspringen, 100–120 Sprünge/min',11.8,15551]]],
 ['Schwimmen &amp; Sport',[['Bahnen schwimmen, Freistil, langsam',5.8,18240],['Bahnen schwimmen, Freistil, schnell',9.8,18230],['Basketball, allgemein',7.5,15055],['Fußball, locker',7.0,15610],['Tennis, allgemein',6.8,15675],['Golf, zu Fuß mit Schlägern',4.3,15265]]],
 ['Haus &amp; Garten',[['Gartenarbeit, allgemein',3.8,8245],['Putzen, schwer (z. B. Auto waschen)',3.5,5020]]]];
var FLAT=[];A.forEach(function(g){g[1].forEach(function(a){FLAT.push(a);});});
var CMP=[0,1,5,9,13,15,16,21,25,27];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('de-DE'):'—';}
function band(m){return m<3?'Leicht':m<6?'Mäßig':'Intensiv';}

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
  C.text('rN',a[0]+' for '+min+' min bei '+(imp?Math.round(kg*2.20462)+' lb':Math.round(kg*10)/10+' kg')+': '+met+' × 3.5 × '+(Math.round(kg*10)/10)+' kg ÷ 200 = '+per.toFixed(1)+' kcal/min.');
  C.text('net',K(net)+' kcal');C.text('ph',K(per*60)+' kcal');C.text('mm',K(met*min));
  var H=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),age=v('age'),male=$('sex').value==='s1',cm=null;
  if(H>100&&age>0){var rmr=male?66.4730+5.0033*H+13.7516*kg-6.7550*age:655.0955+1.8496*H+9.5634*kg-4.6756*age,ml=rmr/1440/5/kg*1000;cm=met*3.5/ml;}
  C.text('pmL',cm?'Korrigierter MET-Wert (Ihr Ruheumsatz)':'Personalisierter MET');C.text('pm',cm?cm.toFixed(1)+' · '+band(cm):'Geschlecht, Alter und Größe ergänzen');
  var wn=$('warn');
  if(cm&&band(cm)!==band(met))wn.textContent='Angepasst an Ihren Ruhestoffwechsel verschiebt sich diese Aktivität von '+band(met).toLowerCase()+' to '+band(cm).toLowerCase()+' Intensität für Sie.';
  else wn.textContent=met>=6?'Intensiv: '+min+' min zählen etwa wie '+(min*2)+' min moderater Aktivität auf die Wochenempfehlung von 150 Minuten.':met>=3?'Moderat: '+min+' min entsprechen '+Math.round(min/150*100)+'% der Wochenempfehlung von 150 Minuten.':'Leichte Aktivität — gut für die Bewegung, zählt aber nicht zur Wochenempfehlung für moderate bis intensive Aktivität.';
  C.text('tbT',min+' min bei '+(imp?Math.round(kg*2.20462)+' lb':Math.round(kg)+' kg'));
  var idx=+$('act').value,rows=CMP.indexOf(idx)<0?CMP.concat([idx]):CMP;
  $('cmpTbl').innerHTML=rows.map(function(i){var x=FLAT[i];return '<tr'+(i===idx?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+'</td><td>'+x[1].toFixed(1)+'</td><td class="b">'+K(x[1]*3.5*kg/200*min)+'</td><td style="font-family:inherit">'+band(x[1])+'</td></tr>';}).join('');
  last='Verbrannte Kalorien: '+K(tot)+' kcal ('+K(net)+' netto) — '+a[0]+', '+min+' min\nMET '+met+' (2024 Adult Compendium)\n— calculatepilot.com/health/calories-burned-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  var s=$('act'),h='',i=0;A.forEach(function(g){h+='<optgroup label="'+g[0]+'">';g[1].forEach(function(a){h+='<option value="'+i+'"'+(i===5?' selected':'')+'>'+a[0]+'</option>';i++;});h+='</optgroup>';});s.innerHTML=h;
  C.init({root:'cbCalc',compute:compute});
  s.addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Ergebnisse kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
