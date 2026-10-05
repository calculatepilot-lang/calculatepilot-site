/* Calories burned calculator — CalculatePilot (redesign, PSEO standards).
   METs from the 2024 Adult Compendium of Physical Activities (code in brackets). kcal/min = MET × 3.5 × kg ÷ 200 (ACSM);
   net = (MET − 1) × 3.5 × kg ÷ 200. Corrected MET = MET × 3.5 ÷ RMR (mL/kg/min), RMR from Harris-Benedict (Compendium method):
   m 66.4730 + 5.0033H + 13.7516W − 6.7550A; f 655.0955 + 1.8496H + 9.5634W − 4.6756A; kcal/day ÷ 1440 ÷ 5 ÷ kg × 1000.
   Intensity (PAG): light < 3, moderate 3–5.9, vigorous ≥ 6. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var A=[['Marche et course',[['Marche, 2,8–3,4 mph, allure modérée',3.8,17190],['Marche, 3,5–3,9 mph, rapide',4.8,17200],['Marche, 4,0–4,4 mph, très rapide',5.5,17220],['Randonnée, hors sentiers',6.0,17080],['Course, 5,0–5,2 mph (12 min/mile)',8.5,12030],['Course, 6–6,3 mph (10 min/mile)',9.3,12050],['Course, 7 mph (8,5 min/mile)',11.0,12070],['Course, 8 mph (7,5 min/mile)',12.0,12090]]],
 ['Vélo',[['Vélo, <10 mph, loisir',4.0,1010],['Vélo, 12–13,9 mph, modéré',8.0,1030],['Vélo, 14–15,9 mph, soutenu',10.0,1040],['Vélo d’appartement, général',6.8,1200],['Cours de spinning',9.0,1270]]],
 ['Salle de sport et fitness',[['Vélo elliptique, modéré',5.0,2048],['Rameur, modéré (<100 W)',5.0,2071],['Rameur, soutenu',7.3,2070],['Musculation, 8–15 répétitions',3.5,2054],['Haltérophilie, force / bodybuilding',6.0,2050],['Circuit training, soutenu',7.5,2040],['Danse aérobique, faible impact',4.8,2005],['Danse aérobique, fort impact',8.0,2006],['Yoga, Hatha',2.3,2150],['Yoga, power',4.0,2160],['Pilates',2.8,2105],['Corde à sauter, 100–120 sauts/min',11.8,15551]]],
 ['Natation et sports',[['Longueurs de natation, crawl, lent',5.8,18240],['Longueurs de natation, crawl, rapide',9.8,18230],['Basket-ball, général',7.5,15055],['Football, loisir',7.0,15610],['Tennis, général',6.8,15675],['Golf, à pied avec ses clubs',4.3,15265]]],
 ['Maison et jardin',[['Jardinage, général',3.8,8245],['Ménage intensif (p. ex. laver la voiture)',3.5,5020]]]];
var FLAT=[];A.forEach(function(g){g[1].forEach(function(a){FLAT.push(a);});});
var CMP=[0,1,5,9,13,15,16,21,25,27];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('fr-FR'):'—';}
function band(m){return m<3?'Léger':m<6?'Modérée':'Soutenu';}

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
  C.text('rN',a[0]+' for '+min+' min à '+(imp?Math.round(kg*2.20462)+' lb':Math.round(kg*10)/10+' kg')+': '+met+' × 3.5 × '+(Math.round(kg*10)/10)+' kg ÷ 200 = '+per.toFixed(1)+' kcal/min.');
  C.text('net',K(net)+' kcal');C.text('ph',K(per*60)+' kcal');C.text('mm',K(met*min));
  var H=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),age=v('age'),male=$('sex').value==='s1',cm=null;
  if(H>100&&age>0){var rmr=male?66.4730+5.0033*H+13.7516*kg-6.7550*age:655.0955+1.8496*H+9.5634*kg-4.6756*age,ml=rmr/1440/5/kg*1000;cm=met*3.5/ml;}
  C.text('pmL',cm?'MET corrigé (votre MB)':'MET personnalisé');C.text('pm',cm?cm.toFixed(1)+' · '+band(cm):'Ajoutez sexe, âge et taille');
  var wn=$('warn');
  if(cm&&band(cm)!==band(met))wn.textContent='Ajustée à votre métabolisme de repos, cette activité passe de '+band(met).toLowerCase()+' to '+band(cm).toLowerCase()+' d’intensité pour vous.';
  else wn.textContent=met>=6?'Soutenue : '+min+' min comptent comme environ '+(min*2)+' min d’activité modérée pour la recommandation hebdomadaire de 150 minutes.':met>=3?'Modérée : '+min+' min représentent '+Math.round(min/150*100)+'% de la recommandation hebdomadaire de 150 minutes.':'Activité légère — bonne pour bouger, mais elle ne compte pas dans la recommandation hebdomadaire d’activité modérée à soutenue.';
  C.text('tbT',min+' min à '+(imp?Math.round(kg*2.20462)+' lb':Math.round(kg)+' kg'));
  var idx=+$('act').value,rows=CMP.indexOf(idx)<0?CMP.concat([idx]):CMP;
  $('cmpTbl').innerHTML=rows.map(function(i){var x=FLAT[i];return '<tr'+(i===idx?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+'</td><td>'+x[1].toFixed(1)+'</td><td class="b">'+K(x[1]*3.5*kg/200*min)+'</td><td style="font-family:inherit">'+band(x[1])+'</td></tr>';}).join('');
  last='Calories brûlées : '+K(tot)+' kcal ('+K(net)+' nettes) — '+a[0]+', '+min+' min\nMET '+met+' (Compendium des adultes 2024)\n— calculatepilot.com/health/calories-burned-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  var s=$('act'),h='',i=0;A.forEach(function(g){h+='<optgroup label="'+g[0]+'">';g[1].forEach(function(a){h+='<option value="'+i+'"'+(i===5?' selected':'')+'>'+a[0]+'</option>';i++;});h+='</optgroup>';});s.innerHTML=h;
  C.init({root:'cbCalc',compute:compute});
  s.addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les résultats');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
