/* VO2 max calculator — CalculatePilot (redesign, PSEO standards).
   Uth 2004: 15.3 × HRmax ÷ HRrest (HRmax = 208 − 0.7 × age, Tanaka 2001, unless measured).
   Rockport (Kline 1987): 132.853 − 0.0769 lb − 0.3877 age + 6.315 sex − 3.2649 min − 0.1565 HR.
   Cooper 1968: (m − 504.9) ÷ 44.73. 1.5-mile (ACSM): 3.5 + 483 ÷ min. METs = VO2max ÷ 3.5.
   Kodama 2009: each +1 MET ≈ 13% lower all-cause mortality risk. Activity METs: 2024 Adult Compendium. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevDu=null;
function mmss(mn){var s=Math.round(mn*60);return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}
var ACT=[['Marche, 2,8–3,4 mph',3.8],['Marche, 3,5–3,9 mph, rapide',4.8],['Longueurs de natation, crawl, lent',5.8],['Randonnée, hors sentiers',6.0],['Vélo, 12–13,9 mph',8.0],['Course, 5,0–5,2 mph',8.5],['Course, 6–6,3 mph',9.3],['Course, 7 mph',11.0],['Course, 8 mph',12.0],['Course, 9 mph',13.0],['Course, 10 mph',14.8]];

function compute(){
  var m=$('m').value;['g1','g2','g3','g4'].forEach(function(g,i){$(g).hidden=m!=='s'+(i+1);});
  var mi=$('du').value==='s2';if(prevDu!==null&&prevDu!==$('du').value)$('dist').value=mi?(v('dist')/1609.344).toFixed(2):Math.round(v('dist')*1609.344);prevDu=$('du').value;C.text('dU',mi?'mi':'m');
  var age=v('age'),male=$('sex').value==='s1',vo,x2L='FC maximale utilisée',x2='—',name,wn='';
  var hmax=v('mhr')>0?v('mhr'):208-0.7*age;
  if(m==='s1'){if(!(v('rhr')>0&&age>0))return;vo=15.3*hmax/v('rhr');name='Rapport de fréquence cardiaque au repos (Uth)';x2=Math.round(hmax)+' bpm'+(v('mhr')>0?' (measured)':' (208 − 0,7 × âge)');
    wn=male?'Mise au point chez des hommes entraînés — à utiliser surtout pour suivre votre propre évolution dans le temps.':'Mise au point chez des hommes ; les estimations pour les femmes peuvent être moins précises. À utiliser surtout pour suivre votre propre évolution.';}
  else if(m==='s2'){var t=v('wm')+v('ws')/60;if(!(t>0&&v('wlb')>0))return;vo=132.853-0.0769*v('wlb')-0.3877*age+6.315*(male?1:0)-3.2649*t-0.1565*v('whr');name='Marche d\'1 mile Rockport';x2L='Allure de marche';x2=(60/t).toFixed(1)+' mph';wn='Marchez aussi vite que possible pendant 1 mile sur une piste plane et mesurez votre fréquence cardiaque dès l\'arrivée.';}
  else if(m==='s3'){var d=mi?v('dist')*1609.344:v('dist');if(!(d>0))return;vo=(d-504.9)/44.73;name='Test de course de 12 minutes de Cooper';x2L='Allure moyenne';x2=mmss(12/(d/1609.344))+' /mile';wn='Un effort maximal — échauffez-vous d\'abord et consultez un médecin si vous débutez les efforts intenses.';}
  else{var tr=v('rm')+v('rs')/60;if(!(tr>0))return;vo=3.5+483/tr;name='Course de 1,5 mile (ACSM)';x2L='Allure moyenne';x2=mmss(tr/1.5)+' /mile';wn='Un effort maximal — échauffez-vous d\'abord et consultez un médecin si vous débutez les efforts intenses.';}
  if(!(vo>0)){C.text('resultValue','—');C.text('rN','Vérifiez vos données — cette combinaison ne donne aucune estimation valide.');return;}
  var mets=vo/3.5;
  C.text('resultValue',vo.toFixed(1));C.text('tag',name);C.text('mets',mets.toFixed(1)+' MET');C.text('x2L',x2L);C.text('x2',x2);
  C.text('rN','Votre capacité aérobie maximale estimée est de '+vo.toFixed(1)+' mL d\'oxygène par kg et par minute, soit environ '+mets.toFixed(1)+' fois la dépense au repos (MET).');
  $('warn').textContent=wn;
  $('imp').innerHTML=[1,2,3].map(function(k){return '<div class="l"><span>+'+k+' MET ('+(mets+k).toFixed(1)+' MET)</span><b>'+(vo+3.5*k).toFixed(1)+' mL/kg/min</b></div>';}).join('')+'<div class="l t"><span>Chaque +1 MET : environ 13 % de risque de mortalité toutes causes en moins (Kodama et al., JAMA 2009)</span><b>Association</b></div>';
  C.text('tbT','Max '+mets.toFixed(1)+' MET');
  $('actTbl').innerHTML=ACT.map(function(a){var pct=a[1]/mets*100,c=pct>100?'color:var(--sx-err)':pct<=60?'color:var(--sx-pc)':'';return '<tr><td style="font-family:inherit;font-weight:600">'+a[0]+'</td><td>'+a[1].toFixed(1)+'</td><td class="b" style="'+c+'">'+(pct>100?'Au-dessus du maximum':Math.round(pct)+'%')+'</td></tr>';}).join('');
  last='VO2 max estimée : '+vo.toFixed(1)+' mL/kg/min ('+mets.toFixed(1)+' MET) — '+name+'\n— calculatepilot.com/health/vo2max-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'voCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les résultats');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
