/* Weight loss calorie calculator — CalculatePilot.
   Flat-rule estimates: 3,500 kcal/lb (7,700 kcal/kg); target = estimated TDEE minus the requested deficit.
   The 1,200/1,500 kcal values are calculator caution flags based on older guideline context, not universal safe minimums. Estimates are not individualized prescriptions. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
function K(x){return isFinite(x)?Math.round(x).toLocaleString('en-US'):'—';}
function fmtD(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
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
  if(toLose<=0){C.text('resultValue',K(tdee));C.text('tag','Maintain');C.text('rN','Your goal is not below your current weight — eat around your maintenance calories. For weight gain, use the Calorie Calculator.');['def','eta','tl','pct'].forEach(function(id){C.text(id,'—');});$('warn').textContent='No deficit needed.';$('rtTbl').innerHTML='';last=null;return;}
  if(byDate){var gdt=new Date(gd.value+'T00:00:00');weeks=(gdt-today)/(7*864e5);if(!(weeks>0.5)){C.text('rN','Choose a goal date at least a week from today.');return;}rate=toLose/weeks;}
  else{rate=imp?+$('rate').value:+$('rate').value/2*2.2;weeks=toLose/rate;}
  var def=rate*3500/7,tgt=tdee-def,pct=rate/wLb*100,end=new Date(today.getTime()+weeks*7*864e5);
  C.text('resultValue',tgt>0?K(tgt):'—');C.text('tag',tgt>0?(imp?(Math.round(rate*100)/100)+' lb':(Math.round(rate/2.20462*100)/100)+' kg')+' / week':'Not feasible');
  C.text('rN',tgt<=0?'The requested deficit equals or exceeds your estimated maintenance calories. This plan does not produce a feasible positive calorie target; choose a slower rate or a later goal date.':byDate?'To reach '+W(gLb)+' by '+fmtD(end)+' you need to lose about '+W(rate)+' a week — a '+K(def)+' kcal daily deficit from your '+K(tdee)+' kcal maintenance.':K(tdee)+' kcal maintenance − '+K(def)+' kcal deficit = '+K(tgt)+' kcal a day, losing about '+W(rate)+' a week.');
  C.text('def',K(def)+' kcal');C.text('etaL',byDate?'Weeks available':'Estimated goal date');C.text('eta',byDate?(Math.round(weeks*10)/10)+' weeks':fmtD(end)+' ('+Math.ceil(weeks)+' wks)');
  C.text('tl',W(toLose));C.text('pct',pct.toFixed(2)+'%');
  var wn=$('warn');
  if(tgt<=0)wn.innerHTML='<b style="color:var(--sx-err)">Not feasible as a calorie target.</b> The requested deficit equals or exceeds estimated maintenance. Choose a slower rate or later goal date.';
  else if(tgt<floor)wn.innerHTML='<b style="color:var(--sx-err)">Below this calculator’s caution flag ('+K(floor)+' kcal/day).</b> This is not a universal safe minimum; individual needs vary. Consider a slower rate and discuss unusually low targets with a qualified professional.';
  else if(pct>1)wn.innerHTML='<b style="color:var(--sx-err)">'+pct.toFixed(1)+'% of body weight a week</b> is an aggressive estimate that may not suit everyone.';
  else if(def>750)wn.textContent='This is a large estimated daily deficit, not a universal safety threshold. Consider a slower rate and seek qualified guidance if unsure.';
  else wn.textContent='Simplified estimate — actual change varies as body weight, activity and energy needs change. Recalculate periodically; this is not an individualized prescription.';
  C.text('tbT','To lose '+W(toLose));
  $('rtTbl').innerHTML=RATES.map(function(r0){var r=imp?r0:r0/2*2.2,d=r*3500/7,t=tdee-d,wk=toLose/r,e=new Date(today.getTime()+wk*7*864e5),bad=t<floor,impossible=t<=0,me=!byDate&&r0===+$('rate').value;
    return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+(imp?r0+' lb':(r0/2)+' kg')+'</td><td class="b"'+((bad||impossible)?' style="color:var(--sx-err)"':'')+'>'+(impossible?'Not feasible':K(t))+((bad||impossible)?' ⚠':'')+'</td><td>'+K(d)+'</td><td>'+Math.ceil(wk)+'</td><td style="font-family:inherit">'+fmtD(e)+'</td></tr>';}).join('');
  last=tgt<=0?'This plan is not feasible as a calorie target. Choose a slower rate or later goal date.\n— calculatepilot.com/health/weight-loss-calorie-calculator.html':'Daily calorie target: '+K(tgt)+' kcal ('+K(def)+' kcal deficit from '+K(tdee)+')\nLose '+W(toLose)+' at about '+W(rate)+'/week — goal around '+fmtD(end)+'\n— calculatepilot.com/health/weight-loss-calorie-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'wlCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Plan');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
