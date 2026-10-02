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
  C.text('stdHelp',nice?'Für südasiatische, chinesische, andere asiatische, nahöstliche, schwarzafrikanische oder afrokaribische Herkunft (NICE): Übergewicht ab 23, Adipositas ab 27,5.':'WHO-Kategorien für Erwachsene: Übergewicht ab 25, Adipositas ab 30.');
  var inches=imp?v('ft')*12+v('inch'):v('cm')/2.54,m=inches*0.0254,m2=m*m,cw=v('cw')>0?(imp?v('cw')/2.20462:v('cw')):0;
  var W=function(kg){return imp?Math.round(kg*2.20462)+' lb':(Math.round(kg*10)/10).toFixed(1)+' kg';},W2=function(kg){return imp?(Math.round(kg*10)/10).toFixed(1)+' kg':Math.round(kg*2.20462)+' lb';};
  C.text('hAlt',imp?Math.round(inches*2.54)+' cm':Math.floor(inches/12)+'′ '+Math.round(inches%12)+'″');
  if(!(m>0.5))return;
  var lo=18.5*m2,hi=hiB*m2;
  C.text('resultValue',W(lo)+' – '+W(hi));C.text('bmiTag','BMI 18,5–'+hiB);
  C.text('rN','Über uns '+W2(lo)+' to '+W2(hi)+' at '+(imp?Math.floor(inches/12)+'′ '+(Math.round(inches%12*2)/2)+'″':Math.round(inches*2.54)+' cm')+(nice?', unter Verwendung der niedrigeren NICE-Grenzwerte.':', unter Verwendung der BMI-Kategorien der WHO für Erwachsene.'));
  C.text('mid',W(21.7*m2));C.text('owL','Übergewicht ab (BMI '+owB+')');C.text('ow',W(owB*m2));
  var cb=$('cmpBox'),wk='—',wkN='Bei stetigen 1–2 lb (0.5–0.9 kg) pro Woche';
  if(cw){
    var b=cw/m2,d=cw>hi?cw-hi:cw<lo?lo-cw:0;
    C.text('bmi',b.toFixed(1));C.text('bmiN',b<18.5?'Unter dem gesunden Bereich':b<owB?'Im gesunden Bereich':b<obB?'Übergewichtsbereich':'Adipositasbereich');
    if(d===0){cb.className='gain';C.text('cmpL','Sie liegen im gesunden Bereich');C.text('cmpV','✓');wkN='Bereits im Bereich';}
    else{cb.className='Gewinn neg';C.text('cmpL',cw>hi?'Über der Obergrenze des Bereichs um':'Unter der Untergrenze des Bereichs um');C.text('cmpV',W(d));
      if(cw>hi){var lb=d*2.20462;wk=Math.ceil(lb/2)+'–'+Math.ceil(lb)+' weeks';}else wkN='Sprechen Sie mit Ihrem Hausarzt oder einer Ernährungsberatung über eine sichere Gewichtszunahme';}
  }else{cb.className='Gewinn neg';C.text('cmpL','Geben Sie Ihr aktuelles Gewicht zum Vergleich ein');C.text('cmpV','—');C.text('bmi','—');C.text('bmiN','Geben Sie Ihr Gewicht ein');}
  C.text('wk',wk);C.text('wkN',wkN);
  $('warn').textContent='Für Erwachsene ab 18. BMI-basierte Bereiche unterscheiden nicht zwischen Muskel- und Fettmasse — nutzen Sie sie zusammen mit dem Taillenumfang.';
  C.text('thOw','Übergewicht ab ('+owB+')');C.text('thOb','Adipositas ab ('+obB+')');C.text('tbT',nice?'Niedrigere NICE-Schwellenwerte':'WHO-Grenzwerte');
  var hcm=inches*2.54,base=imp?Math.round(inches):hcm,rows=[-2,-1,0,1,2].map(function(d){return base+d*(imp?2:5);});
  $('htTbl').innerHTML=rows.map(function(i){var mm=Math.pow(imp?i*0.0254:i/100,2),me=i===base;return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+(imp?Math.floor(i/12)+'′ '+(i%12)+'″ ('+Math.round(i*2.54)+' cm)':(Math.round(i*10)/10)+' cm')+(me?' <small class="p">(Sie)</small>':'')+'</td><td class="b">'+W(18.5*mm)+' – '+W(hiB*mm)+'</td><td>'+W(owB*mm)+'</td><td>'+W(obB*mm)+'</td></tr>';}).join('');
  last='Gesunder Gewichtsbereich: '+W(lo)+' – '+W(hi)+' (BMI 18,5–'+hiB+')\n— calculatepilot.com/health/healthy-weight-range-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'hwrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Ergebnisse kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
