/* TDEE calculator — CalculatePilot (redesign, BMI/Stitch pattern).
   BMR: Mifflin-St Jeor 10W + 6.25H − 5A + 5 (men) / − 161 (women); Harris-Benedict revised (Roza & Shizgal 1984)
   men 88.362 + 13.397W + 4.799H − 5.677A, women 447.593 + 9.247W + 3.098H − 4.330A; Katch-McArdle 370 + 21.6 LBM;
   Cunningham 500 + 22 LBM (LBM = W × (1 − body fat)). TDEE = BMR × activity. TEF ≈ 10% of TDEE.
   Goal = TDEE × (1 + goal%). Weekly change ≈ (goal − TDEE) × 7 ÷ 7,700 kcal per kg. Macros 30/30/40 at 4/9/4 kcal per g. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var ACT=[[1.2,'Sédentaire'],[1.375,'Légèrement actif'],[1.55,'Modérément actif'],[1.725,'Très actif'],[1.9,'Extrêmement actif']];

function K(x){return isFinite(x)?Math.round(x).toLocaleString('fr-FR'):'—';}
function bmrs(w,h,a,male,bf){var lbm=bf>0&&bf<70?w*(1-bf/100):null;
  return {mif:10*w+6.25*h-5*a+(male?5:-161),hb:male?88.362+13.397*w+4.799*h-5.677*a:447.593+9.247*w+3.098*h-4.330*a,km:lbm?370+21.6*lbm:null,cun:lbm?500+22*lbm:null,lbm:lbm};}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;$('wt').value=Math.round(v('wt')*2.20462);}
    else{$('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;$('wt').value=Math.round(v('wt')/2.20462*10)/10;}
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');
  var h=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),w=imp?v('wt')/2.20462:v('wt'),a=v('age'),male=$('sex').value==='s1',bf=v('bf'),act=+$('act').value,g=+$('goal').value;
  C.text('hAlt',imp?Math.round(h)+' cm':Math.floor(h/2.54/12)+'′ '+Math.round((h/2.54)%12)+'″');C.text('actOut','× '+act);
  if(!(h>0&&w>0&&a>0))return;
  var B=bmrs(w,h,a,male,bf),fm=$('fm').value;if((fm==='km'||fm==='cun')&&!B.lbm)fm='mif';
  var names={mif:'Mifflin-St Jeor',hb:'Harris-Benedict',km:'Katch-McArdle',cun:'Cunningham'},bmr=B[fm],tdee=bmr*act,gc=tdee*(1+g/100),dW=(gc-tdee)*7/7700;
  C.text('fmHelp',B.lbm?'Masse maigre : '+(imp?K(B.lbm*2.20462)+' lb':B.lbm.toFixed(1)+' kg')+'. All four formulas are available.':($('fm').value==='km'||$('fm').value==='cun'?'Saisissez votre % de masse grasse pour utiliser une formule basée sur la masse maigre — Mifflin-St Jeor est affichée pour l\'instant.':'Ajoutez un % de masse grasse (par exemple issu du calculateur de masse grasse) pour débloquer Katch-McArdle et Cunningham.'));
  C.text('fmTag',names[fm]);C.text('resultValue',K(tdee));
  C.text('tdN','Calories estimées que vous brûlez par jour à « '+ACT.filter(function(x){return x[0]===act;})[0][1].toLowerCase()+' » — mangez cette quantité pour maintenir votre poids.');
  C.text('bmr',K(bmr)+' kcal');C.text('gL',g===0?'Calories objectif (maintien)':'Calories objectif ('+(g>0?'+':'')+g+'%)');C.text('gc',K(gc)+' kcal');
  var gb=$('gBox');gb.className='gain'+(g<0?'':g===0?' neg':'');
  C.text('gTxt',g===0?'Maintien — aucun changement volontaire':g<0?'Perte initiale approximative':'Prise approximative');
  C.text('gW',g===0?'±0':(g<0?'−':'+')+(imp?(Math.abs(dW)*2.20462).toFixed(2)+' lb':Math.abs(dW).toFixed(2)+' kg')+' / week');
  var wn=$('warn');
  if(gc<800){wn.innerHTML='<b style="color:var(--sx-err)">En dessous de 800 kcal/jour</b>, il s\'agit d\'un régime très hypocalorique qui nécessite un suivi médical.';}
  else if(gc<bmr){wn.innerHTML='<b style="color:var(--sx-err)">Cet objectif est inférieur à votre métabolisme de base.</b> Manger durablement sous vos besoins au repos est difficile à tenir et fait risquer une perte musculaire — envisagez un déficit plus modeste.';}
  else wn.textContent=a<18?'Les formules sont validées pour les adultes ; les besoins énergétiques des adolescents incluent la croissance — consultez un médecin ou un diététicien.':'Estimations uniquement — suivez votre poids pendant 2 à 3 semaines et ajustez de 100 à 200 kcal si nécessaire.';
  var tef=tdee*0.10,actE=Math.max(0,tdee-bmr-tef),parts=[['Métabolisme de base (au repos)',bmr,'var(--sx-primary)'],['Digestion (effet thermique ~10 %)',tef,'#f59e0b'],['Activité et mouvement',actE,'#34d399']];
  $('enBar').innerHTML=parts.map(function(p){return '<span style="width:'+(p[1]/tdee*100)+'%;background:'+p[2]+'"></span>';}).join('');
  $('enLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' '+K(p[1])+' ('+Math.round(p[1]/tdee*100)+'%)</span>';}).join('');
  var show=function(id,x,nid){C.text(id,x?K(x)+' kcal':'Nécessite le % de masse grasse');if(nid)C.text(nid,x?'Métabolisme de base · DEJ '+K(x*act)+' kcal':'Saisissez le % de masse grasse pour calculer');};
  C.text('f1',K(B.mif)+' kcal');C.text('f1n','Métabolisme de base · DEJ '+K(B.mif*act)+' kcal');C.text('f2',K(B.hb)+' kcal');C.text('f2n','Métabolisme de base · DEJ '+K(B.hb*act)+' kcal');show('f3',B.km,'f3n');show('f4',B.cun,'f4n');
  $('actTbl').innerHTML=ACT.map(function(x){var t=bmr*x[0],d=t-tdee;return '<tr'+(x[0]===act?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[1]+(x[0]===act?' <small class="p">(le vôtre)</small>':'')+'</td><td>× '+x[0]+'</td><td class="b">'+K(t)+' kcal</td><td class="'+(d>0?'pos':d<0?'r':'mu')+'">'+(Math.abs(d)<1?'—':(d>0?'+':'−')+K(Math.abs(d))+' kcal')+'</td></tr>';}).join('');
  C.text('actN','Les mêmes '+K(bmr)+' kcal de métabolisme de base varient de '+K(bmr*1.2)+' to '+K(bmr*1.9)+' kcal/jour selon les niveaux d\'activité — choisissez honnêtement ; la plupart des gens surestiment.');
  var n=+$('meals').value||3,P=gc*.3/4,F=gc*.3/9,Cb=gc*.4/4;
  C.text('mealN','30 % de protéines / 30 % de lipides / 40 % de glucides de votre '+K(gc)+' kcal objectif — un point de départ général, réparti sur '+n+' repas.');
  $('mealTbl').innerHTML='<tr style="background:var(--sx-emb)"><td style="font-family:inherit;font-weight:700">Jour</td><td class="b">'+K(gc)+' kcal</td><td>'+K(P)+' g</td><td>'+K(F)+' g</td><td>'+K(Cb)+' g</td></tr><tr><td style="font-family:inherit;font-weight:600">Chacun des '+n+' repas</td><td>'+K(gc/n)+' kcal</td><td>'+K(P/n)+' g</td><td>'+K(F/n)+' g</td><td>'+K(Cb/n)+' g</td></tr>';
  last='DEJ : '+K(tdee)+' kcal/jour ('+names[fm]+', activité × '+act+')\nBMR: '+K(bmr)+' kcal\nCalories objectif : '+K(gc)+' kcal ('+(g>0?'+':'')+g+'%)\nMacros (30/30/40) : '+K(P)+' g de protéines, '+K(F)+' g de lipides, '+K(Cb)+' g de glucides\n— calculatepilot.com/health/tdee-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'tdCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les résultats');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpTdee={bmrs:bmrs};
})();
