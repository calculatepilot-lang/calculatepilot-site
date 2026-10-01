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
  C.text('stdHelp',nice?'Para personas de origen surasiático, chino, de otras zonas de Asia, Oriente Medio, africano negro o afrocaribeño (NICE): sobrepeso desde 23, obesidad desde 27.5.':'Categorías de la OMS para adultos: sobrepeso desde 25, obesidad desde 30.');
  var inches=imp?v('ft')*12+v('inch'):v('cm')/2.54,m=inches*0.0254,m2=m*m,cw=v('cw')>0?(imp?v('cw')/2.20462:v('cw')):0;
  var W=function(kg){return imp?Math.round(kg*2.20462)+' lb':(Math.round(kg*10)/10).toFixed(1)+' kg';},W2=function(kg){return imp?(Math.round(kg*10)/10).toFixed(1)+' kg':Math.round(kg*2.20462)+' lb';};
  C.text('hAlt',imp?Math.round(inches*2.54)+' cm':Math.floor(inches/12)+'′ '+Math.round(inches%12)+'″');
  if(!(m>0.5))return;
  var lo=18.5*m2,hi=hiB*m2;
  C.text('resultValue',W(lo)+' – '+W(hi));C.text('bmiTag','IMC 18,5–'+hiB);
  C.text('rN','Acerca de '+W2(lo)+' to '+W2(hi)+' at '+(imp?Math.floor(inches/12)+'′ '+(Math.round(inches%12*2)/2)+'″':Math.round(inches*2.54)+' cm')+(nice?', con los umbrales más bajos de NICE.':', con las categorías de IMC de la OMS para adultos.'));
  C.text('mid',W(21.7*m2));C.text('owL','Sobrepeso desde (IMC '+owB+')');C.text('ow',W(owB*m2));
  var cb=$('cmpBox'),wk='—',wkN='A un ritmo constante de 1–2 lb (0.5–0.9 kg) por semana';
  if(cw){
    var b=cw/m2,d=cw>hi?cw-hi:cw<lo?lo-cw:0;
    C.text('bmi',b.toFixed(1));C.text('bmiN',b<18.5?'Por debajo del rango saludable':b<owB?'Dentro del rango saludable':b<obB?'Rango de sobrepeso':'Rango de obesidad');
    if(d===0){cb.className='gain';C.text('cmpL','Estás dentro del rango saludable');C.text('cmpV','✓');wkN='Ya estás en el rango';}
    else{cb.className='gain neg';C.text('cmpL',cw>hi?'Por encima del límite superior del rango en':'Por debajo del límite inferior del rango en');C.text('cmpV',W(d));
      if(cw>hi){var lb=d*2.20462;wk=Math.ceil(lb/2)+'–'+Math.ceil(lb)+' weeks';}else wkN='Consulta con un médico de cabecera o un dietista cómo aumentar de peso de forma segura';}
  }else{cb.className='gain neg';C.text('cmpL','Añade tu peso actual para comparar');C.text('cmpV','—');C.text('bmi','—');C.text('bmiN','Introduce tu peso');}
  C.text('wk',wk);C.text('wkN',wkN);
  $('warn').textContent='Para adultos de 18 años o más. Los rangos basados en el IMC no distinguen entre músculo y grasa: úsalos junto con la medida de la cintura.';
  C.text('thOw','Sobrepeso desde ('+owB+')');C.text('thOb','Obesidad desde ('+obB+')');C.text('tbT',nice?'Umbrales más bajos del NICE':'Umbrales de la OMS');
  var hcm=inches*2.54,base=imp?Math.round(inches):hcm,rows=[-2,-1,0,1,2].map(function(d){return base+d*(imp?2:5);});
  $('htTbl').innerHTML=rows.map(function(i){var mm=Math.pow(imp?i*0.0254:i/100,2),me=i===base;return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+(imp?Math.floor(i/12)+'′ '+(i%12)+'″ ('+Math.round(i*2.54)+' cm)':(Math.round(i*10)/10)+' cm')+(me?' <small class="p">(tú)</small>':'')+'</td><td class="b">'+W(18.5*mm)+' – '+W(hiB*mm)+'</td><td>'+W(owB*mm)+'</td><td>'+W(obB*mm)+'</td></tr>';}).join('');
  last='Rango de peso saludable: '+W(lo)+' – '+W(hi)+' (IMC 18.5–'+hiB+')\n— calculatepilot.com/health/healthy-weight-range-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'hwrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
