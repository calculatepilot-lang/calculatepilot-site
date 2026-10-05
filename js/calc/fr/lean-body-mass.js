/* Lean body mass calculator — CalculatePilot (redesign, PSEO standards).
   W kg, H cm. Boer 1984: m 0.407W + 0.267H − 19.2 / f 0.252W + 0.473H − 48.3. James 1976: m 1.1W − 128(W/H)² / f 1.07W − 148(W/H)².
   Hume 1966: m 0.32810W + 0.33929H − 29.5336 / f 0.29569W + 0.41813H − 43.2933. From body fat: W(1 − BF/100).
   FFMI = LBM / m²; normalized FFMI = FFMI + 6.1(1.8 − m) (Kouri 1995). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
function lbm(W,H,male){var q=W/H;return male?[0.407*W+0.267*H-19.2,1.1*W-128*q*q,0.32810*W+0.33929*H-29.5336]:[0.252*W+0.473*H-48.3,1.07*W-148*q*q,0.29569*W+0.41813*H-43.2933];}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
    $('wt').value=Math.round(v('wt')*(imp?2.20462:1/2.20462)*10)/10;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');
  var H=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),W=imp?v('wt')/2.20462:v('wt'),male=$('sex').value==='s1',bf=v('bf'),m=H/100;
  var K=function(kg){return imp?Math.round(kg*2.20462)+' lb':(Math.round(kg*10)/10).toFixed(1)+' kg';},K2=function(kg){return imp?(Math.round(kg*10)/10).toFixed(1)+' kg':Math.round(kg*2.20462)+' lb';};
  C.text('hAlt',imp?Math.round(H)+' cm':Math.floor(H/2.54/12)+'′ '+Math.round(H/2.54%12)+'″');
  if(!(W>0&&H>50))return;
  var r=lbm(W,H,male),hasBf=bf>0&&bf<80,d=hasBf?W*(1-bf/100):null,main=hasBf?d:r[0],bmi=W/(m*m);
  var ff=function(l){return l/(m*m);},nf=function(l){return ff(l)+6.1*(1.8-m);};
  C.text('hdL',hasBf?'Masse maigre (à partir de votre % de masse grasse)':'Masse maigre (Boer)');
  C.text('resultValue',K(main));C.text('lbPct',Math.round(main/W*100)+'% du poids corporel');
  C.text('rN','À propos '+K2(main)+'. The three formulas range from '+K(Math.min.apply(null,r))+' to '+K(Math.max.apply(null,r))+'.');
  C.text('fm',K(W-main));C.text('bfo',((1-main/W)*100).toFixed(1)+'%');C.text('ffmi',ff(main).toFixed(1));C.text('nffmi',nf(main).toFixed(1));
  C.text('f1',K(r[0]));C.text('f2',K(r[1]));C.text('f3',K(r[2]));$('f4r').hidden=!hasBf;if(hasBf)C.text('f4',K(d));
  var wn=$('warn');
  if(bmi>=35)wn.textContent='Avec un IMC de '+bmi.toFixed(1)+', la formule de James n’est pas fiable (elle diminue quand le poids augmente) — préférez Boer, Hume ou un % de masse grasse mesuré.';
  else if(!hasBf)wn.textContent='Estimation par formule pour des corpulences typiques. Saisissez un % de masse grasse mesuré pour un chiffre plus direct.';
  else wn.textContent='Basé sur votre % de masse grasse de '+bf+'% — aussi précis que cette mesure.';
  var rows=[['Boer (1984)',r[0]],['James (1976)',r[1]],['Hume (1966)',r[2]]];if(hasBf)rows.push(['À partir du % de masse grasse ('+bf+'%)',d]);
  C.text('tbT',(male?'Homme':'Femme')+', '+K(W)+', '+Math.round(H)+' cm');
  $('cmpTbl').innerHTML=rows.map(function(x){return '<tr'+(x[1]===main?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+'</td><td class="b">'+K(x[1])+'</td><td>'+K(W-x[1])+'</td><td>'+((1-x[1]/W)*100).toFixed(1)+'%</td><td>'+ff(x[1]).toFixed(1)+'</td></tr>';}).join('');
  last='Masse maigre : '+K(main)+(hasBf?' (à partir du % de masse grasse)':' (Boer)')+'\nBoer '+K(r[0])+' · James '+K(r[1])+' · Hume '+K(r[2])+'\nFFMI: '+ff(main).toFixed(1)+' (normalized '+nf(main).toFixed(1)+')\n— calculatepilot.com/health/lean-body-mass-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'lbmCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les résultats');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpLbm={lbm:lbm};
})();
