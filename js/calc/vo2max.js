/* VO2 max calculator — CalculatePilot (redesign, PSEO standards).
   Uth 2004: 15.3 × HRmax ÷ HRrest (HRmax = 208 − 0.7 × age, Tanaka 2001, unless measured).
   Rockport (Kline 1987): 132.853 − 0.0769 lb − 0.3877 age + 6.315 sex − 3.2649 min − 0.1565 HR.
   Cooper 1968: (m − 504.9) ÷ 44.73. 1.5-mile (ACSM): 3.5 + 483 ÷ min. METs = VO2max ÷ 3.5.
   Kodama 2009: each +1 MET ≈ 13% lower all-cause mortality risk. Activity METs: 2024 Adult Compendium. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevDu=null;
function mmss(mn){var s=Math.round(mn*60);return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}
var ACT=[['Walking, 2.8–3.4 mph',3.8],['Walking, 3.5–3.9 mph, brisk',4.8],['Swimming laps, freestyle, slow',5.8],['Hiking, cross country',6.0],['Cycling, 12–13.9 mph',8.0],['Running, 5.0–5.2 mph',8.5],['Running, 6–6.3 mph',9.3],['Running, 7 mph',11.0],['Running, 8 mph',12.0],['Running, 9 mph',13.0],['Running, 10 mph',14.8]];

function compute(){
  var m=$('m').value;['g1','g2','g3','g4'].forEach(function(g,i){$(g).hidden=m!=='s'+(i+1);});
  var mi=$('du').value==='s2';if(prevDu!==null&&prevDu!==$('du').value)$('dist').value=mi?(v('dist')/1609.344).toFixed(2):Math.round(v('dist')*1609.344);prevDu=$('du').value;C.text('dU',mi?'mi':'m');
  var age=v('age'),male=$('sex').value==='s1',vo,x2L='Max heart rate used',x2='—',name,wn='';
  var hmax=v('mhr')>0?v('mhr'):208-0.7*age;
  if(m==='s1'){if(!(v('rhr')>0&&age>0))return;vo=15.3*hmax/v('rhr');name='Resting heart rate ratio (Uth)';x2=Math.round(hmax)+' bpm'+(v('mhr')>0?' (measured)':' (208 − 0.7 × age)');
    wn=male?'Developed in trained men — best used to track your own trend over time.':'Developed in men; estimates for women may be less accurate. Best used to track your own trend.';}
  else if(m==='s2'){var t=v('wm')+v('ws')/60;if(!(t>0&&v('wlb')>0))return;vo=132.853-0.0769*v('wlb')-0.3877*age+6.315*(male?1:0)-3.2649*t-0.1565*v('whr');name='Rockport 1-mile walk';x2L='Walk pace';x2=(60/t).toFixed(1)+' mph';wn='Walk as fast as you can for 1 mile on a flat track and take your heart rate right at the finish.';}
  else if(m==='s3'){var d=mi?v('dist')*1609.344:v('dist');if(!(d>0))return;vo=(d-504.9)/44.73;name='Cooper 12-minute run';x2L='Average pace';x2=mmss(12/(d/1609.344))+' /mile';wn='A maximal effort — warm up first, and check with a doctor if you are new to hard exercise.';}
  else{var tr=v('rm')+v('rs')/60;if(!(tr>0))return;vo=3.5+483/tr;name='1.5-mile run (ACSM)';x2L='Average pace';x2=mmss(tr/1.5)+' /mile';wn='A maximal effort — warm up first, and check with a doctor if you are new to hard exercise.';}
  if(!(vo>0)){C.text('resultValue','—');C.text('rN','Check your inputs — this combination gives no valid estimate.');return;}
  var mets=vo/3.5;
  C.text('resultValue',vo.toFixed(1));C.text('tag',name);C.text('mets',mets.toFixed(1)+' METs');C.text('x2L',x2L);C.text('x2',x2);
  C.text('rN','Your estimated maximum aerobic capacity is '+vo.toFixed(1)+' mL of oxygen per kg per minute, or about '+mets.toFixed(1)+' times resting (METs).');
  $('warn').textContent=wn;
  $('imp').innerHTML=[1,2,3].map(function(k){return '<div class="l"><span>+'+k+' MET ('+(mets+k).toFixed(1)+' METs)</span><b>'+(vo+3.5*k).toFixed(1)+' mL/kg/min</b></div>';}).join('')+'<div class="l t"><span>Each +1 MET: about 13% lower all-cause mortality risk (Kodama et al., JAMA 2009)</span><b>Association</b></div>';
  C.text('tbT','Max '+mets.toFixed(1)+' METs');
  $('actTbl').innerHTML=ACT.map(function(a){var pct=a[1]/mets*100,c=pct>100?'color:var(--sx-err)':pct<=60?'color:var(--sx-pc)':'';return '<tr><td style="font-family:inherit;font-weight:600">'+a[0]+'</td><td>'+a[1].toFixed(1)+'</td><td class="b" style="'+c+'">'+(pct>100?'Above max':Math.round(pct)+'%')+'</td></tr>';}).join('');
  last='Estimated VO2 max: '+vo.toFixed(1)+' mL/kg/min ('+mets.toFixed(1)+' METs) — '+name+'\n— calculatepilot.com/health/vo2max-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'voCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Results');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
