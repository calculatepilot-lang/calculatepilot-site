/* Healthy weight range calculator — CalculatePilot (redesign, PSEO standards).
   Weight = BMI × m². WHO/CDC adult: healthy 18.5–24.9, overweight ≥25, obesity ≥30.
   NICE NG246 1.9.11 (South Asian, Chinese, other Asian, Middle Eastern, Black African, African-Caribbean): overweight 23–27.4, obesity ≥27.5.
   Time to range at 1–2 lb/week (CDC). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
    if(v('cw')>0)$('cw').value=Math.round(v('cw')*(imp?2.20462:1/2.20462)*10)/10;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');
  var nice=$('std').value==='s2',hiB=nice?22.9:24.9,owB=nice?23:25,obB=nice?27.5:30;
  C.text('stdHelp',nice?'For South Asian, Chinese, other Asian, Middle Eastern, Black African or African-Caribbean backgrounds (NICE): overweight from 23, obesity from 27.5.':'WHO adult categories: overweight from 25, obesity from 30.');
  var inches=imp?v('ft')*12+v('inch'):v('cm')/2.54,m=inches*0.0254,m2=m*m,cw=v('cw')>0?(imp?v('cw')/2.20462:v('cw')):0;
  var W=function(kg){return imp?Math.round(kg*2.20462)+' lb':(Math.round(kg*10)/10).toFixed(1)+' kg';},W2=function(kg){return imp?(Math.round(kg*10)/10).toFixed(1)+' kg':Math.round(kg*2.20462)+' lb';};
  C.text('hAlt',imp?Math.round(inches*2.54)+' cm':Math.floor(inches/12)+'′ '+Math.round(inches%12)+'″');
  if(!(m>0.5))return;
  var lo=18.5*m2,hi=hiB*m2;
  C.text('resultValue',W(lo)+' – '+W(hi));C.text('bmiTag','BMI 18.5–'+hiB);
  C.text('rN','About '+W2(lo)+' to '+W2(hi)+' at '+(imp?Math.floor(inches/12)+'′ '+(Math.round(inches%12*2)/2)+'″':Math.round(inches*2.54)+' cm')+(nice?', using the NICE lower thresholds.':', using the WHO adult BMI categories.'));
  C.text('mid',W(21.7*m2));C.text('owL','Overweight from (BMI '+owB+')');C.text('ow',W(owB*m2));
  var cb=$('cmpBox'),wk='—',wkN='At a steady 1–2 lb (0.5–0.9 kg) a week';
  if(cw){
    var b=cw/m2,d=cw>hi?cw-hi:cw<lo?lo-cw:0;
    C.text('bmi',b.toFixed(1));C.text('bmiN',b<18.5?'Below the healthy range':b<owB?'Within the healthy range':b<obB?'Overweight range':'Obesity range');
    if(d===0){cb.className='gain';C.text('cmpL','You are within the healthy range');C.text('cmpV','✓');wkN='Already in range';}
    else{cb.className='gain neg';C.text('cmpL',cw>hi?'Above the top of the range by':'Below the bottom of the range by');C.text('cmpV',W(d));
      if(cw>hi){var lb=d*2.20462;wk=Math.ceil(lb/2)+'–'+Math.ceil(lb)+' weeks';}else wkN='Speak to a GP or dietitian about gaining weight safely';}
  }else{cb.className='gain neg';C.text('cmpL','Add your current weight to compare');C.text('cmpV','—');C.text('bmi','—');C.text('bmiN','Enter your weight');}
  C.text('wk',wk);C.text('wkN',wkN);
  $('warn').textContent='For adults 18+. BMI-based ranges do not separate muscle from fat — use alongside waist measurements.';
  C.text('thOw','Overweight from ('+owB+')');C.text('thOb','Obesity from ('+obB+')');C.text('tbT',nice?'NICE lower thresholds':'WHO thresholds');
  var hcm=inches*2.54,base=imp?Math.round(inches):hcm,rows=[-2,-1,0,1,2].map(function(d){return base+d*(imp?2:5);});
  $('htTbl').innerHTML=rows.map(function(i){var mm=Math.pow(imp?i*0.0254:i/100,2),me=i===base;return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+(imp?Math.floor(i/12)+'′ '+(i%12)+'″ ('+Math.round(i*2.54)+' cm)':(Math.round(i*10)/10)+' cm')+(me?' <small class="p">(you)</small>':'')+'</td><td class="b">'+W(18.5*mm)+' – '+W(hiB*mm)+'</td><td>'+W(owB*mm)+'</td><td>'+W(obB*mm)+'</td></tr>';}).join('');
  last='Healthy weight range: '+W(lo)+' – '+W(hi)+' (BMI 18.5–'+hiB+')\n— calculatepilot.com/health/healthy-weight-range-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'hwrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Results');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
