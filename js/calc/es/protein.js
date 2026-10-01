/* Protein calculator — CalculatePilot (redesign, PSEO standards).
   Daily protein = weight (kg) × g/kg range: sedentary 0.8–1.0 (IOM RDA), adults 65+ 1.0–1.2 (PROT-AGE), moderately active 1.2–1.6,
   athlete 1.6–2.2 (ISSN / Morton 2018), pregnancy 2nd–3rd trimester 1.1 (IOM RDA). Per meal = mid ÷ meals; reference 0.4 g/kg/meal
   (Schoenfeld & Aragon 2018). Food protein per serving from USDA FoodData Central (approximate). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var LV={s1:['Adulto sedentario',0.8,1.0,'RDA del IOM'],s2:['Adulto de 65 años o más',1.0,1.2,'PROT-AGE 2013'],s3:['Moderadamente activa',1.2,1.6,'Rango habitual en nutrición deportiva'],s4:['Deportista / entrenamiento de fuerza',1.6,2.2,'ISSN 2017; Morton 2018'],s5:['Embarazada (2.º–3.er trimestre)',1.1,1.1,'RDA del IOM']};
var FOOD=[['Pechuga de pollo, cocida','100 g',31],['Atún enlatado al natural, escurrido','100 g',25],['Yogur griego natural desnatado','tarro de 170 g',17],['Lentejas, hervidas','1 taza (198 g)',18],['Huevos, grandes','1 huevo',6.3],['Leche','1 taza (244 g)',8]];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('es-ES'):'—';}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value)$('wt').value=Math.round(v('wt')*(imp?2.20462:1/2.20462)*10)/10;prevU=$('u').value;C.text('wU',imp?'lb':'kg');
  var w=imp?v('wt')/2.20462:v('wt'),L=LV[$('lvl').value],n=+$('meals').value||4;
  if(!(w>0))return;
  var lo=w*L[1],hi=w*L[2],mid=(lo+hi)/2;
  C.text('lvTag',L[0]);C.text('resultValue',L[1]===L[2]?K(lo):K(lo)+'–'+K(hi));
  C.text('rN',(L[1]===L[2]?L[1]+' g':L[1]+'–'+L[2]+' g')+' por kg de peso corporal ('+(imp?Math.round(w*2.20462)+' lb = '+w.toFixed(1)+' kg':w.toFixed(1)+' kg')+'). Fuente: '+L[3]+'.');
  C.text('mid',K(mid)+' g');C.text('pmL','Por comida ('+n+' comidas)');C.text('pm',K(mid/n)+' g');C.text('kc',K(mid*4)+' kcal');
  var pmRef=w*0.4,wn=$('warn');
  wn.textContent=mid/n<pmRef*0.75&&$('lvl').value==='s4'?'Con '+n+' comidas, cada comida queda por debajo de los ~'+K(pmRef)+' g (0,4 g/kg) que a menudo se sugieren para ganar músculo; considera menos raciones de proteína pero más grandes, o más comidas con proteína.':'Apunta a aproximadamente '+K(Math.min(pmRef,mid/n))+'–'+K(Math.max(pmRef,mid/n))+' g por comida. Las personas con enfermedad renal deben seguir las indicaciones de su médico.';
  C.text('fdN','Raciones de un solo alimento necesarias para alcanzar '+K(mid)+' g (el punto medio de tu rango).');
  $('fdTbl').innerHTML=FOOD.map(function(f){return '<tr><td style="font-family:inherit;font-weight:600">'+f[0]+'</td><td style="font-family:inherit">'+f[1]+'</td><td>'+f[2]+' g</td><td class="b">'+(mid/f[2]).toFixed(1)+'</td></tr>';}).join('');
  $('rgTbl').innerHTML=Object.keys(LV).map(function(k){var x=LV[k];return '<tr'+(k===$('lvl').value?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+'</td><td>'+(x[1]===x[2]?x[1]:x[1]+'–'+x[2])+'</td><td class="b">'+(x[1]===x[2]?K(w*x[1]):K(w*x[1])+'–'+K(w*x[2]))+' g</td><td style="font-family:inherit">'+x[3]+'</td></tr>';}).join('');
  last='Proteína diaria: '+(L[1]===L[2]?K(lo):K(lo)+'–'+K(hi))+' g ('+L[0]+')\nPor comida ('+n+'): unos '+K(mid/n)+' g\n— calculatepilot.com/health/protein-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ptCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar objetivo');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpProtein={LV:LV};
})();
