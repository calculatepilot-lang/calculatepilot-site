/* Pregnancy calorie needs calculator — CalculatePilot (redesign, PSEO standards).
   Baseline: entered, or Mifflin-St Jeor (women) 10W + 6.25H − 5A − 161 × activity. IOM 2005 EER additions:
   T1 +0, T2 +340, T3 +452, lactation 0–6 mo +330 (500 − 170), 7–12 mo +400.
   Nutrients (women 19+, IOM RDA/AI): protein 46/71/71 g; iron 18/27/9 mg; folate 400/600/500 mcg DFE; calcium 1,000 mg;
   iodine 150/220/290 mcg; choline 425/450/550 mg (AI); vitamin D 600 IU; fiber 25/28/29 g (AI); total water 2.7/3.0/3.8 L (AI). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var ST={s1:['1er trimestre',0],s2:['2e trimestre',340],s3:['3e trimestre',452],s4:['Allaitement 0–6 mois',330],s5:['Allaitement 7–12 mois',400]};
var NU=[['Protéines','46 g','71 g','71 g'],['Fer','18 mg','27 mg','9 mg'],['Folate','400 mcg DFE','600 mcg DFE','500 mcg DFE'],['Calcium','1 000 mg','1 000 mg','1 000 mg'],['Iode','150 mcg','220 mcg','290 mcg'],['Choline (AI)','425 mg','450 mg','550 mg'],['Vitamine D','600 UI','600 UI','600 UI'],['Fibres (AI)','25 g','28 g','29 g'],['Eau totale (AI)','2,7 L','3,0 L','3,8 L']];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('fr-FR'):'—';}

function compute(){
  var imp=$('u').value==='s1',est=$('bm').value==='s2';
  if(prevU!==null&&prevU!==$('u').value){
    $('wt').value=Math.round(v('wt')*(imp?2.20462:1/2.20462)*(imp?1:10))/(imp?1:10);
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
  }prevU=$('u').value;
  $('kRow').hidden=est;$('eRow').hidden=!est;$('hImp').hidden=!imp;$('hImp').style.display=imp?'grid':'none';$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');
  var base;
  if(est){var kg=imp?v('wt')/2.20462:v('wt'),H=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),a=v('age');if(!(kg>0&&H>0&&a>0))return;base=(10*kg+6.25*H-5*a-161)*(+$('act').value);}
  else{base=v('kc');if(!(base>0))return;}
  var s=ST[$('st').value],tot=base+s[1];
  C.text('resultValue',K(tot));C.text('tag',s[0]);
  C.text('rN',K(base)+' kcal de base '+(s[1]?'+ '+s[1]+' kcal ':'')+'for '+(+$('st').value.slice(1)<=3?'the '+s[0]:s[0].toLowerCase())+(est?' (base estimée avec la formule de Mifflin-St Jeor × niveau d\'activité).':'.'));
  C.text('base',K(base)+' kcal');C.text('add',s[1]?'+'+s[1]+' kcal':'Aucun');
  $('stg').innerHTML=Object.keys(ST).map(function(k){var x=ST[k];return '<div class="l'+(k===$('st').value?' t':'')+'"><span>'+x[0]+(x[1]?' (+'+x[1]+')':'')+'</span><b>'+K(base+x[1])+'</b></div>';}).join('');
  var wn=$('warn'),age=v('age');
  wn.textContent=est&&age<19?'Chez les adolescentes, les besoins en énergie et en nutriments sont différents — demandez vos objectifs à votre équipe soignante ou à un(e) diététicien(ne).':'Pour un seul bébé et un poids sain avant la grossesse. En cas de jumeaux, de diabète ou d\'un IMC plus élevé ou plus faible, demandez à votre équipe soignante un objectif personnalisé.';
  var preg=+$('st').value.slice(1)<=3;C.text('tbT',preg?'La colonne grossesse s\'applique':'La colonne allaitement s\'applique');
  $('nuTbl').innerHTML=NU.map(function(n){return '<tr><td style="font-family:inherit;font-weight:600">'+n[0]+'</td><td>'+n[1]+'</td><td'+(preg?' class="b"':'')+'>'+n[2]+'</td><td'+(preg?'':' class="b"')+'>'+n[3]+'</td></tr>';}).join('');
  last='Calories quotidiennes ('+s[0]+'): '+K(tot)+' kcal ('+K(base)+' base + '+s[1]+')\n— calculatepilot.com/health/pregnancy-calorie-needs-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pcnCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les résultats');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
