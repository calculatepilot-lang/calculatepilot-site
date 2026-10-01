/* Calories burned calculator — CalculatePilot (redesign, PSEO standards).
   METs from the 2024 Adult Compendium of Physical Activities (code in brackets). kcal/min = MET × 3.5 × kg ÷ 200 (ACSM);
   net = (MET − 1) × 3.5 × kg ÷ 200. Corrected MET = MET × 3.5 ÷ RMR (mL/kg/min), RMR from Harris-Benedict (Compendium method):
   m 66.4730 + 5.0033H + 13.7516W − 6.7550A; f 655.0955 + 1.8496H + 9.5634W − 4.6756A; kcal/day ÷ 1440 ÷ 5 ÷ kg × 1000.
   Intensity (PAG): light < 3, moderate 3–5.9, vigorous ≥ 6. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var A=[['Caminar y correr',[['Caminar, 2,8–3,4 mph, ritmo moderado',3.8,17190],['Caminar, 3,5–3,9 mph, a paso ligero',4.8,17200],['Caminar, 4,0–4,4 mph, a paso muy ligero',5.5,17220],['Senderismo, a campo traviesa',6.0,17080],['Correr, 5,0–5,2 mph (12 min/milla)',8.5,12030],['Correr, 6–6,3 mph (10 min/milla)',9.3,12050],['Correr, 7 mph (8,5 min/milla)',11.0,12070],['Correr, 8 mph (7,5 min/milla)',12.0,12090]]],
 ['Ciclismo',[['Ciclismo, <10 mph, recreativo',4.0,1010],['Ciclismo, 12–13,9 mph, moderado',8.0,1030],['Ciclismo, 14–15,9 mph, intenso',10.0,1040],['Bicicleta estática, general',6.8,1200],['Clase de spinning',9.0,1270]]],
 ['Gimnasio y fitness',[['Elíptica, moderada',5.0,2048],['Máquina de remo, moderada (<100 W)',5.0,2071],['Máquina de remo, intensa',7.3,2070],['Entrenamiento con pesas, 8–15 repeticiones',3.5,2054],['Levantamiento de pesas, potencia / culturismo',6.0,2050],['Entrenamiento en circuito, intenso',7.5,2040],['Baile aeróbico, bajo impacto',4.8,2005],['Baile aeróbico, alto impacto',8.0,2006],['Yoga, Hatha',2.3,2150],['Yoga, power',4.0,2160],['Pilates',2.8,2105],['Saltar la cuerda, 100–120 saltos/min',11.8,15551]]],
 ['Natación y deportes',[['Nadar largos, estilo libre, lento',5.8,18240],['Nadar largos, estilo libre, rápido',9.8,18230],['Baloncesto, general',7.5,15055],['Fútbol, informal',7.0,15610],['Tenis, general',6.8,15675],['Golf, caminando y llevando los palos',4.3,15265]]],
 ['Hogar y jardín',[['Jardinería, general',3.8,8245],['Limpieza intensa (p. ej., lavar el coche)',3.5,5020]]]];
var FLAT=[];A.forEach(function(g){g[1].forEach(function(a){FLAT.push(a);});});
var CMP=[0,1,5,9,13,15,16,21,25,27];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('es-ES'):'—';}
function band(m){return m<3?'Ligera':m<6?'Moderada':'Intensa';}

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
  C.text('rN',a[0]+' for '+min+' min a '+(imp?Math.round(kg*2.20462)+' lb':Math.round(kg*10)/10+' kg')+': '+met+' × 3.5 × '+(Math.round(kg*10)/10)+' kg ÷ 200 = '+per.toFixed(1)+' kcal/min.');
  C.text('net',K(net)+' kcal');C.text('ph',K(per*60)+' kcal');C.text('mm',K(met*min));
  var H=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),age=v('age'),male=$('sex').value==='s1',cm=null;
  if(H>100&&age>0){var rmr=male?66.4730+5.0033*H+13.7516*kg-6.7550*age:655.0955+1.8496*H+9.5634*kg-4.6756*age,ml=rmr/1440/5/kg*1000;cm=met*3.5/ml;}
  C.text('pmL',cm?'MET corregido (tu TMR)':'MET personalizado');C.text('pm',cm?cm.toFixed(1)+' · '+band(cm):'Añade sexo, edad y estatura');
  var wn=$('warn');
  if(cm&&band(cm)!==band(met))wn.textContent='Ajustada a tu metabolismo en reposo, esta actividad pasa de '+band(met).toLowerCase()+' to '+band(cm).toLowerCase()+' intensidad para ti.';
  else wn.textContent=met>=6?'Intensa: '+min+' min cuentan como unos '+(min*2)+' min de actividad moderada para la pauta semanal de 150 minutos.':met>=3?'Moderada: '+min+' min es el '+Math.round(min/150*100)+'% de la pauta semanal de 150 minutos.':'Actividad ligera: es buena para moverte, pero no cuenta para la pauta semanal de actividad moderada a intensa.';
  C.text('tbT',min+' min a '+(imp?Math.round(kg*2.20462)+' lb':Math.round(kg)+' kg'));
  var idx=+$('act').value,rows=CMP.indexOf(idx)<0?CMP.concat([idx]):CMP;
  $('cmpTbl').innerHTML=rows.map(function(i){var x=FLAT[i];return '<tr'+(i===idx?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+'</td><td>'+x[1].toFixed(1)+'</td><td class="b">'+K(x[1]*3.5*kg/200*min)+'</td><td style="font-family:inherit">'+band(x[1])+'</td></tr>';}).join('');
  last='Calorías quemadas: '+K(tot)+' kcal ('+K(net)+' netas) — '+a[0]+', '+min+' min\nMET '+met+' (Compendio de Adultos 2024)\n— calculatepilot.com/health/calories-burned-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  var s=$('act'),h='',i=0;A.forEach(function(g){h+='<optgroup label="'+g[0]+'">';g[1].forEach(function(a){h+='<option value="'+i+'"'+(i===5?' selected':'')+'>'+a[0]+'</option>';i++;});h+='</optgroup>';});s.innerHTML=h;
  C.init({root:'cbCalc',compute:compute});
  s.addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
