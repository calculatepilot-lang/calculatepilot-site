/* Weight loss calorie calculator — CalculatePilot (redesign, PSEO standards).
   Flat rule: 3,500 kcal per lb (7,700 kcal per kg). By rate: deficit = rate × 3,500 ÷ 7; target = TDEE − deficit; weeks = toLose ÷ rate.
   By goal date: rate = toLose ÷ weeks available. Floors 1,200 kcal (women) / 1,500 kcal (men); rate > 1% body weight/week flagged
   (AHA/ACC/TOS 2013: 1,200–1,500 women, 1,500–1,800 men, or 500–750 kcal/day deficit). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
function K(x){return isFinite(x)?Math.round(x).toLocaleString('es-ES'):'—';}
function fmtD(d){return d.toLocaleDateString('es-ES',{month:'short',day:'numeric',year:'numeric'});}
var RATES=[0.5,1,1.5,2];

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){['wt','gw'].forEach(function(id){$(id).value=Math.round(v(id)*(imp?2.20462:1/2.20462)*(imp?1:10))/(imp?1:10);});}prevU=$('u').value;
  C.text('wU',imp?'lb':'kg');C.text('gU',imp?'lb':'kg');
  ['r1','r2','r3','r4'].forEach(function(id,i){C.text(id,imp?['½','1','1½','2'][i]+' lb':['0.25','0.5','0.75','1'][i]+' kg');});
  var byDate=$('mode').value==='s2';$('rateRow').hidden=byDate;$('dateRow').hidden=!byDate;
  var gd=$('gd');if(!gd.value){var d0=new Date();d0.setDate(d0.getDate()+84);gd.value=d0.toISOString().slice(0,10);}
  var tdee=v('tdee'),wLb=imp?v('wt'):v('wt')*2.20462,gLb=imp?v('gw'):v('gw')*2.20462,male=$('sex').value==='s1',floor=male?1500:1200;
  var W=function(lb){return imp?(Math.round(lb*10)/10)+' lb':(Math.round(lb/2.20462*10)/10)+' kg';};
  if(!(tdee>0&&wLb>0&&gLb>0))return;
  var toLose=wLb-gLb,today=new Date(),rate,weeks;
  if(toLose<=0){C.text('resultValue',K(tdee));C.text('tag','Mantener');C.text('rN','Tu objetivo no es inferior a tu peso actual: come en torno a tus calorías de mantenimiento. Para aumentar de peso, usa la calculadora de calorías.');['def','eta','tl','pct'].forEach(function(id){C.text(id,'—');});$('warn').textContent='No se necesita déficit.';$('rtTbl').innerHTML='';last=null;return;}
  if(byDate){var gdt=new Date(gd.value+'T00:00:00');weeks=(gdt-today)/(7*864e5);if(!(weeks>0.5)){C.text('rN','Elige una fecha objetivo al menos una semana a partir de hoy.');return;}rate=toLose/weeks;}
  else{rate=imp?+$('rate').value:+$('rate').value/2*2.2;weeks=toLose/rate;}
  var def=rate*3500/7,tgt=tdee-def,pct=rate/wLb*100,end=new Date(today.getTime()+weeks*7*864e5);
  C.text('resultValue',K(tgt));C.text('tag',(imp?(Math.round(rate*100)/100)+' lb':(Math.round(rate/2.20462*100)/100)+' kg')+' / week');
  C.text('rN',byDate?'Para llegar a '+W(gLb)+' by '+fmtD(end)+' necesitas perder unos '+W(rate)+' por semana: un '+K(def)+' kcal de déficit diario respecto a tus '+K(tdee)+' kcal de mantenimiento.':K(tdee)+' kcal de mantenimiento − '+K(def)+' kcal de déficit = '+K(tgt)+' kcal al día, perdiendo unos '+W(rate)+' por semana.');
  C.text('def',K(def)+' kcal');C.text('etaL',byDate?'Semanas disponibles':'Fecha meta estimada');C.text('eta',byDate?(Math.round(weeks*10)/10)+' weeks':fmtD(end)+' ('+Math.ceil(weeks)+' sem.)');
  C.text('tl',W(toLose));C.text('pct',pct.toFixed(2)+'%');
  var wn=$('warn');
  if(tgt<floor)wn.innerHTML='<b style="color:var(--sx-err)">Por debajo de '+K(floor)+' kcal/día</b>: las guías aconsejan no bajar tanto sin supervisión médica. '+(byDate?'Elige una fecha objetivo más lejana.':'Elige un ritmo más lento.');
  else if(pct>1)wn.innerHTML='<b style="color:var(--sx-err)">'+pct.toFixed(1)+'% del peso corporal por semana</b> es más rápido que el ~1% que suele recomendarse.';
  else if(def>750)wn.textContent='Un déficit superior a 750 kcal/día es mayor que las 500–750 kcal que sugiere la guía AHA/ACC/TOS: vigila tu energía y tu hambre.';
  else wn.textContent='Estimación con regla fija: el ritmo real suele ralentizarse a medida que baja el mantenimiento. Recalcula cada pocas semanas.';
  C.text('tbT','A perder '+W(toLose));
  $('rtTbl').innerHTML=RATES.map(function(r0){var r=imp?r0:r0/2*2.2,d=r*3500/7,t=tdee-d,wk=toLose/r,e=new Date(today.getTime()+wk*7*864e5),bad=t<floor,me=!byDate&&r0===+$('rate').value;
    return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+(imp?r0+' lb':(r0/2)+' kg')+'</td><td class="b"'+(bad?' style="color:var(--sx-err)"':'')+'>'+K(t)+(bad?' ⚠':'')+'</td><td>'+K(d)+'</td><td>'+Math.ceil(wk)+'</td><td style="font-family:inherit">'+fmtD(e)+'</td></tr>';}).join('');
  last='Objetivo calórico diario: '+K(tgt)+' kcal ('+K(def)+' kcal de déficit desde '+K(tdee)+')\nLose '+W(toLose)+' a unos '+W(rate)+'/week — goal around '+fmtD(end)+'\n— calculatepilot.com/health/weight-loss-calorie-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'wlCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar plan');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
