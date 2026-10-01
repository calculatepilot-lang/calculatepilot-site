/* BMI calculator — CalculatePilot (Stitch 1:1 redesign).
   BMI = kg ÷ m² (imperial: 703 × lb ÷ in²). BMI Prime = BMI ÷ 25. New Oxford (Trefethen) = 1.3 × kg ÷ m^2.5.
   Ponderal Index = kg ÷ m³. Healthy range = 18.5–24.9 × m² (WHO), or 18.5–22.9 below the WHO 2004 Asian action point of 23.
   Categories: WHO adult; Asian populations use WHO 2004 action points (23 increased risk, 27.5 high risk). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;

function f1(x){return isFinite(x)?(Math.round(x*10)/10).toFixed(1):'—';}
function whoCat(b){return b<18.5?['Insuffisance pondérale','hi']:b<25?['Poids santé','']:b<30?['Surpoids','mid']:b<35?['Obésité de classe I','hi']:b<40?['Obésité de classe II','hi']:['Obésité de classe III','hi'];}
function asCat(b){return b<18.5?['Insuffisance pondérale','hi']:b<23?['Risque en hausse mais acceptable','']:b<27.5?['Risque accru','mid']:['Risque élevé','hi'];}
function kgTxt(kg,imp){return imp?Math.round(kg*2.20462)+' lb':f1(kg)+' kg';}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=(Math.round((ti%12)*2)/2);$('lb').value=Math.round(v('kg')*2.20462);$('lbR').value=$('lb').value;}
    else{$('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;$('kg').value=Math.round(v('lb')/2.20462*10)/10;$('kgR').value=$('kg').value;}
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;$('wImp').hidden=!imp;$('wMet').hidden=imp;
  var inches=imp?Math.max(0,v('ft'))*12+Math.max(0,v('inch')):v('cm')/2.54,m=inches*0.0254,kg=imp?v('lb')/2.20462:v('kg'),age=v('age'),as=$('std').value==='s2';
  C.text('hAlt',imp?(Math.round(inches*2.54))+' cm':Math.floor(inches/12)+'′ '+(Math.round((inches%12)*10)/10)+'″');C.text('wAlt',imp?f1(kg)+' kg':Math.round(kg*2.20462)+' lb');
  if(!(m>0.5&&kg>0)){C.text('resultValue','—');return;}
  var b=kg/(m*m),cat=as?asCat(b):whoCat(b),who=whoCat(b);
  C.text('resultValue',f1(b));var t=$('catTag');t.textContent=cat[0];t.className='sx-ef-grade'+(cat[1]?' '+cat[1]:'');
  C.text('stdHelp',as?'Seuils d’action de l’OMS 2004 pour les populations asiatiques : 23 = risque accru, 27,5 = risque élevé.':'Catégories adultes de l’OMS : 18,5–24,9 poids normal, 25–29,9 surpoids, 30+ obésité.');
  C.text('catN',as?('Catégorie standard de l’OMS : '+who[0]+'. On the WHO 2004 action points for Asian populations, a BMI of '+f1(b)+' se situe dans la tranche « '+cat[0].toLowerCase()+' ».'):(b>=23&&b<25?'Poids normal selon les catégories de l’OMS — notez que pour les populations asiatiques, 23 et plus constitue un seuil d’action de « risque accru ».':cat[0]+' selon les catégories d’IMC adultes de l’OMS.'));
  var segs=as?[[18.5,'#60a5fa','<18.5'],[23,'#22c55e','18.5–22.9'],[27.5,'#f59e0b','23–27.4'],[40,'#ef4444','27.5+']]:[[18.5,'#60a5fa','<18.5'],[25,'#22c55e','18.5–24.9'],[30,'#f59e0b','25–29.9'],[35,'#fb923c','30–34.9'],[40,'#ef4444','35+']];
  var lo=15,hi=40,prev=lo;
  $('specBar').innerHTML=segs.map(function(s){var w=(s[0]-prev)/(hi-lo)*100;prev=s[0];return '<span style="width:'+w+'%;background:'+s[1]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(b-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=segs.map(function(s){return '<span>'+s[2]+'</span>';}).join('');C.text('specV',f1(b));
  var an=$('ageNote');
  if(age&&age<20){an.innerHTML='<b>Moins de 20 ans :</b> les catégories adultes ne s’appliquent pas. Les enfants et adolescents sont évalués avec les percentiles d’IMC pour l’âge du CDC, selon leur âge et leur sexe — voir ci-dessous.';an.style.color='var(--sx-err)';}
  else if(age>=65){an.innerHTML='<b>65 ans et plus :</b> la perte de masse musculaire avec l’âge fait que l’IMC peut sous-estimer la masse grasse, et un IMC bas peut révéler une fragilité. Discutez de votre résultat avec un médecin.';an.style.color='';}
  else{an.textContent='Les catégories d’IMC adultes s’appliquent à partir de 20 ans. L’IMC est un outil de dépistage, pas un diagnostic.';an.style.color='';}
  var up=as?22.9:24.9,rl=18.5*m*m,rh=up*m*m;
  C.text('rng',kgTxt(rl,imp)+' – '+kgTxt(rh,imp));C.text('rngN','IMC 18,5–'+up+' pour votre taille'+(imp?' ('+f1(rl)+'–'+f1(rh)+' kg)':''));
  var pr=b/25;C.text('prime',pr.toFixed(2));C.text('primeN',pr<1?Math.round((1-pr)*100)+'% sous le seuil de surpoids (25)':pr===1?'Exactement au seuil de surpoids':Math.round((pr-1)*100)+'% au-dessus du seuil de surpoids (25)');
  C.text('ox',f1(1.3*kg/Math.pow(m,2.5))+' kg/m²');C.text('pi',f1(kg/Math.pow(m,3))+' kg/m³');
  var tb=Math.max(10,v('tb')),tw=tb*m*m,d=tw-kg;C.text('tOut','BMI '+f1(tb));
  $('tTxt').innerHTML='À votre taille, un IMC de '+f1(tb)+' correspond à <b style="color:var(--sx-on)">'+kgTxt(tw,imp)+'</b>'+(Math.abs(d)<0.05?' — votre poids actuel.':' ('+(d<0?'−':'+')+kgTxt(Math.abs(d),imp)+' à partir de maintenant).');
  document.querySelectorAll('#catTbl tbody tr').forEach(function(r){r.className=(b>=+r.getAttribute('data-lo')&&b<+r.getAttribute('data-hi'))?'hl':'';});
  last='IMC : '+f1(b)+' kg/m² ('+who[0]+(as?' ; seuils d’action asiatiques : '+cat[0]:'')+')\nPlage de poids normal : '+kgTxt(rl,imp)+' – '+kgTxt(rh,imp)+'\nIMC Prime : '+pr.toFixed(2)+'\nNouvel IMC d’Oxford : '+f1(1.3*kg/Math.pow(m,2.5))+'\nIndice pondéral : '+f1(kg/Math.pow(m,3))+' kg/m³\n— calculatepilot.com/health/bmi-calculator.html';
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bmCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpBmi={};
})();
