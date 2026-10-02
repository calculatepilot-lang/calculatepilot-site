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
  if(!(fa>100&&fa<260))return fail('Geben Sie die Körpergröße des Vaters ein.');
  if(!(mo>100&&mo<260))return fail('Geben Sie die Körpergröße der Mutter ein.');
  var adj=sex==='m'?13:-13,mph=(fa+mo+adj)/2,lo=mph-8.5,hi=mph+8.5;
  C.text('resultValue',ftin(mph));C.text('tag',sex==='m'?'boy':'girl');C.text('interp','Durchschnitt der Körpergrößen der Eltern '+(sex==='m'?'plus':'minus')+' 13 cm, halbiert.');
  C.text('oRg',ftin(lo)+' to '+ftin(hi));C.text('oCm',C.num(mph,1)+' cm ('+C.num(lo,0)+' to '+C.num(hi,0)+')');
  var ok=age>=2&&age<18&&ch>40&&ch<220,note='';
  if(ok){var m0=med(sex,age),adultMed=MED[sex][8],est=ch*adultMed/m0,diff=ch-m0;
    C.text('oCh',ftin(est));C.text('oChN',C.num(est,1)+' cm');C.text('oMd',C.num(m0,0)+' cm');C.text('oMdN',ch>=m0?C.num(diff,1)+' cm über dem Durchschnitt':C.num(-diff,1)+' cm unter dem Durchschnitt');
    note='Die Schätzung nach der Wachstumsperzentile ('+C.num(est,0)+' cm) '+(Math.abs(est-mph)<=8.5?'liegt innerhalb':'liegt außerhalb')+' des elterlichen Bereichs. Kinder wechseln um die Pubertät oft die Perzentilenkurve, daher können die beiden Schätzungen abweichen.';}
  else{C.text('oCh','—');C.text('oChN',age<2?'ab 2 Jahren möglich':age>=18?'Wachstum ist meist abgeschlossen':'Körpergröße des Kindes eingeben');C.text('oMd','—');C.text('oMdN','');note=age<2?'Unter 2 Jahren ist die Methode der elterlichen Zielgröße die einzige hier angegebene Schätzung.':age>=18?'Mit 18 haben die meisten jungen Menschen ihre Erwachsenengröße erreicht oder fast erreicht.':'Geben Sie die aktuelle Körpergröße des Kindes ein, um eine Schätzung nach der Wachstumsperzentile zu erhalten.';}
  C.text('note',note+' Dies sind Schätzwerte. Ein Kinderarzt kann das Wachstum anhand der offiziellen Wachstumskurven beurteilen.');
  last='Körpergröße des Kindes — calculatepilot.com/other/height-calculator.html\nElterliche Zielgröße '+ftin(mph)+' ('+C.num(mph,1)+' cm), Bereich '+C.num(lo,0)+' to '+C.num(hi,0)+' cm';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  var prev='m';
  C.init({root:'htCalc',compute:compute});
  $('un').addEventListener('change',function(){var now=$('un').value;if(now===prev)return;['ch','fa','mo'].forEach(function(id){var cm=prev==='m'?C.val(id):(C.val(id+'f')*12+C.val(id+'i'))*2.54;if(now==='i'){var i=cm/2.54;$(id+'f').value=Math.floor(i/12);$(id+'i').value=+(i-12*Math.floor(i/12)).toFixed(1);}else $(id).value=+cm.toFixed(1);});prev=now;});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
