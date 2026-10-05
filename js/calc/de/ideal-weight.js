/* Ideal weight calculator — CalculatePilot (redesign, PSEO standards).
   IBW (kg) = base + per-inch × inches over 60 in. Devine m 50 + 2.3 / f 45.5 + 2.3; Robinson m 52 + 1.9 / f 49 + 1.7;
   Miller m 56.2 + 1.41 / f 53.1 + 1.36; Hamwi m 48 + 2.7 / f 45.5 + 2.2. Frame ±10%. Healthy BMI range 18.5–24.9 × m².
   Adjusted body weight = IBW + 0.4 × (actual − IBW). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var F={m:[[50,2.3],[52,1.9],[56.2,1.41],[48,2.7]],f:[[45.5,2.3],[49,1.7],[53.1,1.36],[45.5,2.2]]};
function ibw(inches,male,fr){var o=inches-60;return F[male?'m':'f'].map(function(c){return (c[0]+c[1]*o)*(1+fr/100);});}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
    if(v('cw')>0)$('cw').value=Math.round(v('cw')*(imp?2.20462:1/2.20462)*10)/10;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');
  var inches=imp?v('ft')*12+v('inch'):v('cm')/2.54,male=$('sex').value==='s1',fr=+$('frame').value,m=inches*0.0254,cw=v('cw')>0?(imp?v('cw')/2.20462:v('cw')):0;
  var W=function(kg){return imp?Math.round(kg*2.20462)+' lb':(Math.round(kg*10)/10).toFixed(1)+' kg';},W2=function(kg){return imp?(Math.round(kg*10)/10).toFixed(1)+' kg':Math.round(kg*2.20462)+' lb';};
  C.text('hAlt',imp?Math.round(inches*2.54)+' cm':Math.floor(inches/12)+'′ '+Math.round(inches%12)+'″');
  if(!(inches>30))return;
  var r=ibw(inches,male,fr),mn=Math.min.apply(null,r),mx=Math.max.apply(null,r),avg=(r[0]+r[1]+r[2]+r[3])/4,bl=18.5*m*m,bh=24.9*m*m;
  C.text('resultValue',W(r[0]));C.text('frTag',fr<0?'Kleiner Körperbau':fr>0?'Großer Körperbau':'Mittlerer Körperbau');C.text('frN',fr<0?'Kleiner Körperbau (−10 %)':fr>0?'Großer Körperbau (+10 %)':'Mittlerer Körperbau');
  C.text('rN','Über uns '+W2(r[0])+'. The four formulas range from '+W(mn)+' to '+W(mx)+' für eine '+(male?'man':'woman')+' Ihrer Körpergröße.');
  C.text('rg',W(mn)+' – '+W(mx));C.text('bmi',W(bl)+' – '+W(bh));
  ['f1','f2','f3','f4'].forEach(function(id,i){C.text(id,W(r[i]));});C.text('fa',W(avg));
  var cb=$('cmpBox');
  if(cw){var d=cw-r[0],pct=cw/r[0]*100;cb.className='gain'+(Math.abs(d)<0.5?'':' neg');C.text('cmpL','Das aktuelle Gewicht beträgt '+Math.round(pct)+'% des Idealgewichts nach Devine');C.text('cmpV',(d>0?'+':d<0?'−':'')+W(Math.abs(d)));}
  else{cb.className='Gewinn neg';C.text('cmpL','Geben Sie Ihr aktuelles Gewicht zum Vergleich ein');C.text('cmpV','—');}
  var wn=$('warn');
  if(inches<60)wn.textContent='Diese Formeln wurden für Körpergrößen ab 5 ft (152 cm) entwickelt — darunter sind die Ergebnisse weniger zuverlässig.';
  else if(cw&&cw>r[0]*1.2)wn.textContent='Klinischer Hinweis: Ein angepasstes Körpergewicht von '+W(r[0]+0.4*(cw-r[0]))+' (Ideal + 0,4 × Übergewicht) wird mitunter für die Medikamentendosierung verwendet, wenn das tatsächliche Gewicht deutlich über dem Ideal liegt.';
  else wn.textContent='Ein Bevölkerungsrichtwert, kein persönliches Ziel — Muskelmasse und Körperbau lassen gesunde Gewichte variieren.';
  var base=Math.round(inches),rows=[-4,-2,0,2,4].map(function(d){return base+d;});
  C.text('tbT',(male?'Männer':'Frauen')+(fr?', '+(fr<0?'small':'large')+' frame':''));
  $('htTbl').innerHTML=rows.map(function(i){var rr=ibw(i,male,fr),mm=i*0.0254,me=i===base;return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+Math.floor(i/12)+'′ '+(i%12)+'″ ('+Math.round(i*2.54)+' cm)'+(me?' <small class="p">(Sie)</small>':'')+'</td><td class="b">'+W(rr[0])+'</td><td>'+W(Math.min.apply(null,rr))+' – '+W(Math.max.apply(null,rr))+'</td><td>'+W(18.5*mm*mm)+' – '+W(24.9*mm*mm)+'</td></tr>';}).join('');
  last='Idealgewicht (Devine): '+W(r[0])+'\nBandbreite nach Devine, Robinson, Miller, Hamwi: '+W(mn)+' – '+W(mx)+'\nGesunder BMI-Bereich: '+W(bl)+' – '+W(bh)+'\n— calculatepilot.com/health/ideal-weight-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'iwCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Ergebnisse kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpIdeal={ibw:ibw};
})();
