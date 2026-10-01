/* Fiber intake calculator — CalculatePilot (redesign, PSEO standards).
   Calorie-based target = kcal ÷ 1,000 × 14 g (IOM 2005 / DGA). IOM Adequate Intake (g/day): 1–3: 19; 4–8: 25; 9–13 M31 F26;
   14–18 M38 F26; 19–50 M38 F25; 51+ M30 F21; pregnancy 28; lactation 29. Food fiber per serving ≈ USDA FoodData Central, rounded. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var FOOD=[['Pois cassés, bouillis','1 tasse',16],['Lentilles, bouillies','1 tasse',15.5],['Haricots noirs, bouillis','1 tasse',15],['Graines de chia','1 oz (28 g)',10],['Framboises','1 tasse',8],['Poire, avec la peau','1 moyenne',5.5],['Brocoli, bouilli','1 tasse',5],['Pomme, avec la peau','1 moyenne',4.5],['Flocons d\'avoine, secs','½ tasse (40 g)',4],['Amandes','1 oz (28 g)',3.5]];
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
  C.text('rN',kcal.toLocaleString('fr-FR')+' kcal ÷ 1 000 × 14 g = '+t+' g de fibres par jour.'+(Math.abs(t-ref)>=5?' Cela diffère de votre valeur de référence IOM de '+ref+' g car votre apport calorique est '+(t>ref?'above':'below')+' typique pour votre âge et votre sexe.':''));
  C.text('ai',ref+' g');C.text('gapL',hasC?'Écart par rapport à votre '+cur+' g':'Écart par rapport à l\'apport actuel');C.text('gap',hasC?(gap?gap+' g':'Objectif atteint'):'Saisissez l\'apport actuel');
  var wn=$('warn');
  wn.textContent=age<19?'Pour les enfants et les adolescents, suivez la valeur de référence IOM par âge et parlez-en à un pédiatre avant de modifier l\'alimentation.':hasC&&cur>=t?'Vous atteignez déjà l\'objectif calculé à partir des calories — conservez une bonne variété de sources de fibres.':'Augmentez les fibres progressivement et buvez davantage d\'eau en parallèle, pour limiter les ballonnements et les gaz.';
  var ph='',steps=hasC&&gap>0?Math.max(2,Math.min(6,Math.ceil(gap/5))):0;
  if(steps){for(var i=1;i<=steps;i++){var g=Math.round(cur+gap*i/steps);ph+='<div class="l'+(i===steps?' t':'')+'"><span>Semaine '+i+'</span><b>'+g+' g/jour</b></div>';}C.text('planT','Sur '+steps+' weeks');}
  else{ph='<div class="l"><span>'+(hasC?'Aucune montée en charge nécessaire — vous atteignez l\'objectif.':'Saisissez votre apport actuel en fibres pour obtenir un plan progressif semaine par semaine.')+'</span><b>—</b></div>';C.text('planT','—');}
  $('plan').innerHTML=ph;
  C.text('tbT',hasC?'Écart : '+gap+' g':'Objectif complet : '+t+' g');
  $('fdTbl').innerHTML=FOOD.map(function(f){return '<tr><td style="font-family:inherit;font-weight:600">'+f[0]+'</td><td style="font-family:inherit">'+f[1]+'</td><td>'+f[2]+' g</td><td class="b">'+(gap?(gap/f[2]).toFixed(1):'—')+'</td></tr>';}).join('');
  last='Objectif en fibres : '+t+' g/jour (14 g pour 1 000 kcal à '+kcal+' kcal)\nRéférence IOM : '+ref+' g/jour\n— calculatepilot.com/health/fiber-intake-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'fbCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les résultats');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
