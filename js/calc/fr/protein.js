/* Protein calculator — CalculatePilot (redesign, PSEO standards).
   Daily protein = weight (kg) × g/kg range: sedentary 0.8–1.0 (IOM RDA), adults 65+ 1.0–1.2 (PROT-AGE), moderately active 1.2–1.6,
   athlete 1.6–2.2 (ISSN / Morton 2018), pregnancy 2nd–3rd trimester 1.1 (IOM RDA). Per meal = mid ÷ meals; reference 0.4 g/kg/meal
   (Schoenfeld & Aragon 2018). Food protein per serving from USDA FoodData Central (approximate). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var LV={s1:['Adulte sédentaire',0.8,1.0,'IOM RDA'],s2:['Adulte de 65 ans et plus',1.0,1.2,'PROT-AGE 2013'],s3:['Modérément actif',1.2,1.6,'Plage courante en nutrition sportive'],s4:['Athlète / musculation',1.6,2.2,'ISSN 2017 ; Morton 2018'],s5:['Femme enceinte (2e–3e trimestre)',1.1,1.1,'IOM RDA']};
var FOOD=[['Blanc de poulet, cuit','100 g',31],['Thon en conserve au naturel, égoutté','100 g',25],['Yaourt grec nature 0 %','pot de 170 g',17],['Lentilles, bouillies','1 tasse (198 g)',18],['Œufs, gros','1 œuf',6.3],['Lait','1 tasse (244 g)',8]];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('fr-FR'):'—';}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value)$('wt').value=Math.round(v('wt')*(imp?2.20462:1/2.20462)*10)/10;prevU=$('u').value;C.text('wU',imp?'lb':'kg');
  var w=imp?v('wt')/2.20462:v('wt'),L=LV[$('lvl').value],n=+$('meals').value||4;
  if(!(w>0))return;
  var lo=w*L[1],hi=w*L[2],mid=(lo+hi)/2;
  C.text('lvTag',L[0]);C.text('resultValue',L[1]===L[2]?K(lo):K(lo)+'–'+K(hi));
  C.text('rN',(L[1]===L[2]?L[1]+' g':L[1]+'–'+L[2]+' g')+' par kg de poids corporel ('+(imp?Math.round(w*2.20462)+' lb = '+w.toFixed(1)+' kg':w.toFixed(1)+' kg')+'). Source : '+L[3]+'.');
  C.text('mid',K(mid)+' g');C.text('pmL','Par repas ('+n+' repas)');C.text('pm',K(mid/n)+' g');C.text('kc',K(mid*4)+' kcal');
  var pmRef=w*0.4,wn=$('warn');
  wn.textContent=mid/n<pmRef*0.75&&$('lvl').value==='s4'?'Avec '+n+' repas, chaque repas se situe en dessous des ~'+K(pmRef)+' g (0,4 g/kg) souvent recommandés pour la prise de muscle — envisagez moins de portions de protéines mais plus copieuses, ou davantage de repas contenant des protéines.':'Visez environ '+K(Math.min(pmRef,mid/n))+'–'+K(Math.max(pmRef,mid/n))+' g par repas. Les personnes atteintes d\'une maladie rénale doivent suivre les conseils de leur médecin.';
  C.text('fdN','Portions d\'un seul aliment nécessaires pour atteindre '+K(mid)+' g (le milieu de votre fourchette).');
  $('fdTbl').innerHTML=FOOD.map(function(f){return '<tr><td style="font-family:inherit;font-weight:600">'+f[0]+'</td><td style="font-family:inherit">'+f[1]+'</td><td>'+f[2]+' g</td><td class="b">'+(mid/f[2]).toFixed(1)+'</td></tr>';}).join('');
  $('rgTbl').innerHTML=Object.keys(LV).map(function(k){var x=LV[k];return '<tr'+(k===$('lvl').value?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+'</td><td>'+(x[1]===x[2]?x[1]:x[1]+'–'+x[2])+'</td><td class="b">'+(x[1]===x[2]?K(w*x[1]):K(w*x[1])+'–'+K(w*x[2]))+' g</td><td style="font-family:inherit">'+x[3]+'</td></tr>';}).join('');
  last='Protéines quotidiennes : '+(L[1]===L[2]?K(lo):K(lo)+'–'+K(hi))+' g ('+L[0]+')\nPar repas ('+n+') : environ '+K(mid/n)+' g\n— calculatepilot.com/health/protein-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ptCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier l\'objectif');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpProtein={LV:LV};
})();
