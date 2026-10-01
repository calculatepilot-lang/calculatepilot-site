/* Steps to calories calculator — CalculatePilot (redesign, PSEO standards).
   Stride = measured, or height × 0.414 (rule of thumb). Distance = steps × stride; time = distance ÷ speed.
   2024 Adult Compendium walking METs: 2.5 mph 3.0 (17170); 2.8–3.4 mph 3.8 (17190); 3.5–3.9 mph 4.8 (17200); 4.0–4.4 mph 5.5 (17220).
   kcal = MET × 3.5 × kg ÷ 200 × min (ACSM); net uses MET − 1. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var P={s1:[2.5,3.0,'slow'],s2:[3.1,3.8,'moderate'],s3:[3.7,4.8,'brisk'],s4:[4.2,5.5,'très soutenu']};
function K(x){return isFinite(x)?Math.round(x).toLocaleString('fr-FR'):'—';}
function hm(min){var m=Math.round(min);return m>=60?Math.floor(m/60)+' h '+m%60+' min':m+' min';}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    $('wt').value=Math.round(v('wt')*(imp?2.20462:1/2.20462)*(imp?1:10))/(imp?1:10);
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
    if(v('sl')>0)$('sl').value=Math.round(v('sl')*(imp?1/2.54:2.54)*10)/10;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hImp').style.display=imp?'grid':'none';$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');C.text('sU',imp?'in':'cm');
  var hIn=imp?v('ft')*12+v('inch'):v('cm')/2.54,kg=imp?v('wt')/2.20462:v('wt'),steps=v('st'),p=P[$('pc').value];
  var sIn=v('sl')>0?(imp?v('sl'):v('sl')/2.54):hIn*0.414;
  $('sl').placeholder='≈ '+(imp?sIn.toFixed(1)+' in':(sIn*2.54).toFixed(0)+' cm')+' d\'après la taille';
  if(!(kg>0&&sIn>0&&steps>=0))return;
  var f=function(n){var mi=n*sIn/63360,min=mi/p[0]*60,k=p[1]*3.5*kg/200*min,nt=(p[1]-1)*3.5*kg/200*min;return {mi:mi,min:min,k:k,nt:nt};},r=f(steps);
  var D=function(mi){return imp?mi.toFixed(2)+' mi':(mi*1.609344).toFixed(2)+' km';};
  C.text('resultValue',K(r.k));C.text('tag',p[2]+' · MET '+p[1].toFixed(1));
  C.text('rN',K(steps)+' pas × '+(imp?sIn.toFixed(1)+' in':(sIn*2.54).toFixed(0)+' cm')+' foulée = '+D(r.mi)+', environ '+hm(r.min)+' at '+(imp?p[0]+' mph':(p[0]*1.609344).toFixed(1)+' km/h')+'.');
  C.text('dist',D(r.mi));C.text('time',hm(r.min));C.text('net',K(r.nt)+' kcal');C.text('per',(f(1000).k).toFixed(0)+' kcal');
  $('warn').textContent=v('sl')>0?'Utilisation de la longueur de foulée que vous avez mesurée.':'Foulée estimée d\'après la taille — mesurez 10 pas et saisissez votre foulée pour obtenir une distance plus précise.';
  C.text('tbT',p[2]+' pace');
  $('scTbl').innerHTML=[2500,5000,7500,10000,12500,15000].map(function(n){var x=f(n);return '<tr'+(n===steps?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+K(n)+'</td><td>'+D(x.mi)+'</td><td style="font-family:inherit">'+hm(x.min)+'</td><td class="b">'+K(x.k)+'</td><td>'+K(x.nt)+'</td></tr>';}).join('');
  last=K(steps)+' pas ≈ '+D(r.mi)+', '+hm(r.min)+', '+K(r.k)+' kcal ('+K(r.nt)+' net)\n— calculatepilot.com/health/steps-to-calories-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'stCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les résultats');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
