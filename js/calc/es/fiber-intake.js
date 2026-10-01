/* Fiber intake calculator — CalculatePilot (redesign, PSEO standards).
   Calorie-based target = kcal ÷ 1,000 × 14 g (IOM 2005 / DGA). IOM Adequate Intake (g/day): 1–3: 19; 4–8: 25; 9–13 M31 F26;
   14–18 M38 F26; 19–50 M38 F25; 51+ M30 F21; pregnancy 28; lactation 29. Food fiber per serving ≈ USDA FoodData Central, rounded. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var FOOD=[['Guisantes partidos, hervidos','1 taza',16],['Lentejas, hervidas','1 taza',15.5],['Frijoles negros, hervidos','1 taza',15],['Semillas de chía','1 oz (28 g)',10],['Frambuesas','1 taza',8],['Pera, con piel','1 mediana',5.5],['Brócoli, hervido','1 taza',5],['Manzana, con piel','1 mediana',4.5],['Avena, en seco','½ taza (40 g)',4],['Almendras','1 oz (28 g)',3.5]];
function ai(age,male,life){
  if(!male&&life==='s2')return 28;if(!male&&life==='s3')return 29;
  if(age<4)return 19;if(age<9)return 25;if(age<14)return male?31:26;if(age<19)return male?38:26;if(age<51)return male?38:25;return male?30:21;
}

function compute(){
  var male=$('sex').value==='s1',age=v('age'),kcal=v('kcal'),cur=v('cur'),life=$('life').value;
  $('lifeRow').hidden=male||age<14;if(male||age<14)life='s1';
  if(!(kcal>0&&age>0))return;
  var t=Math.round(kcal/1000*14),ref=ai(age,male,life),hasC=cur>0,gap=hasC?Math.max(0,t-cur):t;
  C.text('resultValue',t+' g');
  C.text('rN',kcal.toLocaleString('es-ES')+' kcal ÷ 1,000 × 14 g = '+t+' g de fibra al día.'+(Math.abs(t-ref)>=5?' Esto difiere de tu referencia del IOM de '+ref+' g porque tu ingesta de calorías es '+(t>ref?'above':'below')+' habitual para tu edad y sexo.':''));
  C.text('ai',ref+' g');C.text('gapL',hasC?'Diferencia con tu '+cur+' g':'Diferencia con la ingesta actual');C.text('gap',hasC?(gap?gap+' g':'Objetivo cumplido'):'Introduce tu ingesta actual');
  var wn=$('warn');
  wn.textContent=age<19?'En niños y adolescentes, sigue la referencia del IOM según la edad y consulta con un pediatra antes de cambiar la dieta.':hasC&&cur>=t?'Ya alcanzas el objetivo basado en calorías: mantén una combinación variada de fuentes de fibra.':'Aumenta la fibra poco a poco y bebe más agua al hacerlo, para limitar la hinchazón y los gases.';
  var ph='',steps=hasC&&gap>0?Math.max(2,Math.min(6,Math.ceil(gap/5))):0;
  if(steps){for(var i=1;i<=steps;i++){var g=Math.round(cur+gap*i/steps);ph+='<div class="l'+(i===steps?' t':'')+'"><span>Semana '+i+'</span><b>'+g+' g/día</b></div>';}C.text('planT','Más de '+steps+' weeks');}
  else{ph='<div class="l"><span>'+(hasC?'No hace falta aumentar: alcanzas el objetivo.':'Introduce tu ingesta actual de fibra para obtener un plan gradual semana a semana.')+'</span><b>—</b></div>';C.text('planT','—');}
  $('plan').innerHTML=ph;
  C.text('tbT',hasC?'Diferencia: '+gap+' g':'Objetivo completo: '+t+' g');
  $('fdTbl').innerHTML=FOOD.map(function(f){return '<tr><td style="font-family:inherit;font-weight:600">'+f[0]+'</td><td style="font-family:inherit">'+f[1]+'</td><td>'+f[2]+' g</td><td class="b">'+(gap?(gap/f[2]).toFixed(1):'—')+'</td></tr>';}).join('');
  last='Objetivo de fibra: '+t+' g/día (14 g por cada 1,000 kcal a '+kcal+' kcal)\nReferencia del IOM: '+ref+' g/día\n— calculatepilot.com/health/fiber-intake-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'fbCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
