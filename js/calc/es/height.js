/* Child adult height predictor — CalculatePilot (Stitch redesign).
   Mid-parental (Tanner): boy (F+M+13)/2, girl (F+M−13)/2, ±8.5 cm. Growth-channel estimate scales the child's height by adult median ÷ median at this age. */
(function(){
var C=window.CPX,$=C.$,last='';
/* approximate median stature (cm), ages 2..18 step 2 (rounded WHO 2006 / CDC 2000) */
var AG=[2,4,6,8,10,12,14,16,18],MED={m:[87,103,116,128,138,149,163,173,177],f:[86,103,115,127,138,151,160,162,163]};
function med(sex,age){var a=MED[sex],i;if(age<=2)return a[0];if(age>=18)return a[8];for(i=0;i<8;i++)if(age<=AG[i+1]){var t=(age-AG[i])/2;return a[i]+t*(a[i+1]-a[i]);}return a[8];}
function ftin(cm){var i=cm/2.54,f=Math.floor(i/12),r=i-12*f;if(r>=11.95){f++;r=0;}return f+' ft '+r.toFixed(1)+' in';}
function h(id,imp){if(imp){var f=C.val(id+'f'),i=C.val(id+'i');return (f*12+i)*2.54;}return C.val(id);}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oRg','oCm','oCh','oMd'].forEach(function(i){C.text(i,'—');});C.text('tag','—');last='';}
function compute(){
  var sex=$('sex').value,imp=$('un').value==='i',age=C.val('ay')+C.val('am')/12;
  document.querySelectorAll('#htCalc .m').forEach(function(e){e.hidden=imp;});document.querySelectorAll('#htCalc .im').forEach(function(e){e.hidden=!imp;});
  $('err').hidden=true;
  var ch=h('ch',imp),fa=h('fa',imp),mo=h('mo',imp);
  if(!(fa>100&&fa<260))return fail('Introduce la estatura del padre.');
  if(!(mo>100&&mo<260))return fail('Introduce la estatura de la madre.');
  var adj=sex==='m'?13:-13,mph=(fa+mo+adj)/2,lo=mph-8.5,hi=mph+8.5;
  C.text('resultValue',ftin(mph));C.text('tag',sex==='m'?'boy':'girl');C.text('interp','Promedio de las estaturas de los padres '+(sex==='m'?'plus':'minus')+' 13 cm, dividido entre dos.');
  C.text('oRg',ftin(lo)+' to '+ftin(hi));C.text('oCm',C.num(mph,1)+' cm ('+C.num(lo,0)+' to '+C.num(hi,0)+')');
  var ok=age>=2&&age<18&&ch>40&&ch<220,note='';
  if(ok){var m0=med(sex,age),adultMed=MED[sex][8],est=ch*adultMed/m0,diff=ch-m0;
    C.text('oCh',ftin(est));C.text('oChN',C.num(est,1)+' cm');C.text('oMd',C.num(m0,0)+' cm');C.text('oMdN',ch>=m0?C.num(diff,1)+' cm por encima de lo habitual':C.num(-diff,1)+' cm por debajo de lo habitual');
    note='La estimación del canal de crecimiento ('+C.num(est,0)+' cm) '+(Math.abs(est-mph)<=8.5?'se sitúa dentro de':'queda fuera de')+' el rango parental. Los niños suelen cambiar de canal en torno a la pubertad, por lo que ambas estimaciones pueden diferir.';}
  else{C.text('oCh','—');C.text('oChN',age<2?'requiere 2 años o más':age>=18?'el crecimiento ya está casi completo':'introduce la estatura del niño');C.text('oMd','—');C.text('oMdN','');note=age<2?'Antes de los 2 años, el método de la estatura media de los padres es la única estimación que se ofrece aquí.':age>=18?'A los 18 años la mayoría de los jóvenes han alcanzado o casi alcanzado su estatura adulta.':'Introduce la estatura actual del niño para obtener una estimación del canal de crecimiento.';}
  C.text('note',note+' Son estimaciones. Un pediatra puede evaluar el crecimiento con las curvas oficiales.');
  last='Estatura infantil — calculatepilot.com/other/height-calculator.html\nObjetivo medio parental '+ftin(mph)+' ('+C.num(mph,1)+' cm), rango '+C.num(lo,0)+' to '+C.num(hi,0)+' cm';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  var prev='m';
  C.init({root:'htCalc',compute:compute});
  $('un').addEventListener('change',function(){var now=$('un').value;if(now===prev)return;['ch','fa','mo'].forEach(function(id){var cm=prev==='m'?C.val(id):(C.val(id+'f')*12+C.val(id+'i'))*2.54;if(now==='i'){var i=cm/2.54;$(id+'f').value=Math.floor(i/12);$(id+'i').value=+(i-12*Math.floor(i/12)).toFixed(1);}else $(id).value=+cm.toFixed(1);});prev=now;});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
