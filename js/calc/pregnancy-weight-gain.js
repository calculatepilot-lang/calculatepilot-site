/* Pregnancy weight gain calculator — CalculatePilot (redesign, PSEO standards).
   IOM 2009 (ACOG CO 548). Singleton total (lb): <18.5 28–40; 18.5–24.9 25–35; 25–29.9 15–25; ≥30 11–20.
   Weekly 2nd–3rd trimester (lb): 1–1.3; 0.8–1; 0.5–0.7; 0.4–0.6. Twins (provisional): normal 37–54, overweight 31–50,
   obese 25–42; underweight — no recommendation. Weekly path: first trimester 1.1–4.4 lb by week 13 (linear),
   then linear to the total range at week 40. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var S=[[28,40,1,1.3,'Underweight'],[25,35,0.8,1,'Normal weight'],[15,25,0.5,0.7,'Overweight'],[11,20,0.4,0.6,'Obese']],T=[null,[37,54],[31,50],[25,42]];
// IOM's own metric values
var SK=[[12.5,18,0.44,0.58],[11.5,16,0.35,0.50],[7,11.5,0.23,0.33],[5,9,0.17,0.27]],TK=[null,[17,25],[14,23],[11,19]];
function cat(b){return b<18.5?0:b<25?1:b<30?2:3;}
function path(w,lo,hi,imp){var a=imp?1.1:0.5,z=imp?4.4:2;if(w<=13)return [a*w/13,z*w/13];var f=(w-13)/27;return [a+(lo-a)*f,z+(hi-z)*f];}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    ['pw','cw'].forEach(function(id){if(v(id)>0)$(id).value=Math.round(v(id)*(imp?2.20462:1/2.20462)*(imp?1:10))/(imp?1:10);});
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');C.text('cU',imp?'lb':'kg');
  var m=imp?(v('ft')*12+v('inch'))*0.0254:v('cm')/100,kg=imp?v('pw')/2.20462:v('pw'),tw=$('tw').value==='s2';
  if(!(m>1&&kg>0))return;
  var b=kg/(m*m);
  if(b<12||b>70){C.text('resultValue','Check your inputs');C.text('tag','—');C.text('bmi',b.toFixed(1));C.text('rate','—');C.text('rN','These measurements give a BMI of '+b.toFixed(1)+', which looks like a typing or unit error. Please check your height, weight and units.');$('wkTbl').innerHTML='';C.text('pL','—');C.text('pV','—');$('warn').textContent='Enter your height and your weight from before you were pregnant.';last=null;return;}
  var c=cat(b),s=S[c],sk=SK[c],U=imp?' lb':' kg',r1=function(x){return imp?Math.round(x):Math.round(x*10)/10;},W=function(x){return r1(x)+U;},WR=function(a,z){return r1(a)+'–'+r1(z)+U;};
  var TT=imp?T:TK,lo,hi;if(tw){if(!TT[c]){lo=hi=null;}else{lo=TT[c][0];hi=TT[c][1];}}else{lo=imp?s[0]:sk[0];hi=imp?s[1]:sk[1];}
  var pwLb=imp?kg*2.20462:kg;
  C.text('bmi',b.toFixed(1)+' · '+s[4]);C.text('tag',(tw?'Twins · ':'')+s[4]);
  C.text('rate',tw?'Ask your care team':(imp?s[2]+'–'+s[3]+' lb':sk[2].toFixed(2)+'–'+sk[3].toFixed(2)+' kg')+' / week');
  var wn=$('warn'),pb=$('pBox');
  if(lo===null){C.text('resultValue','No IOM range');C.text('rN','The IOM did not set a twin recommendation for an underweight pre-pregnancy BMI because the evidence was too limited — your care team will advise a target.');$('wkTbl').innerHTML='';pb.className='gain neg';C.text('pL','No range to compare against');C.text('pV','—');wn.textContent='Ask your care team for an individual weight gain target.';last=null;return;}
  C.text('resultValue',WR(lo,hi));
  C.text('rN','For a pre-pregnancy BMI of '+b.toFixed(1)+' ('+s[4].toLowerCase()+')'+(tw?' with twins (provisional IOM range)':'')+', a final weight of about '+WR(pwLb+lo,pwLb+hi)+'.');
  var wk=Math.round(v('wk')),cw=v('cw');
  var gtxt=function(g){return g<0?'lost '+W(-g):'gained '+W(g);};
  if(wk>0&&wk<14&&cw>0){var g1=cw-pwLb;pb.className='gain';C.text('pL','Week '+wk+': '+gtxt(g1)+'. The IOM expects about '+WR(imp?1.1:0.5,imp?4.4:2)+' in total by week 13, with a lot of normal variation');C.text('pV','First trimester');}
  else if(wk>0&&cw>0){var g=cw-pwLb,p=path(Math.min(wk,40),lo,hi,imp),st=g<p[0]-0.05?'Below':g>p[1]+0.05?'Above':'Within';pb.className='gain'+(st==='Within'?'':' neg');C.text('pL','Week '+wk+': '+gtxt(g)+' vs '+WR(p[0],p[1])+' suggested');C.text('pV',st);}
  else{pb.className='gain neg';C.text('pL','Add your week and current weight to compare');C.text('pV','—');}
  wn.textContent=b>=30?'For a BMI of 30 or more, ACOG notes that gaining less than the range can be acceptable if the baby is growing well — follow your care team\'s advice.':'Weight gain varies week to week — the trend over several weeks matters more than one reading.';
  C.text('tbT',WR(lo,hi)+' total');
  $('wkTbl').innerHTML=[8,12,16,20,24,28,32,36,40].map(function(w){var p=path(w,lo,hi,imp);return '<tr'+(wk&&Math.abs(w-wk)<2?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+w+'</td><td class="b">'+WR(p[0],p[1])+'</td><td>'+WR(pwLb+p[0],pwLb+p[1])+'</td></tr>';}).join('');
  last='Recommended pregnancy weight gain: '+WR(lo,hi)+' (IOM, pre-pregnancy BMI '+b.toFixed(1)+')\n— calculatepilot.com/health/pregnancy-weight-gain-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pwCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Results');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
