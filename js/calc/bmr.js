/* BMR calculator — CalculatePilot (redesign, PSEO standards). Same equations as the TDEE page:
   Mifflin-St Jeor, Harris-Benedict revised (Roza & Shizgal 1984), Katch-McArdle 370 + 21.6 LBM, Cunningham 500 + 22 LBM. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
function K(x){return isFinite(x)?Math.round(x).toLocaleString('en-US'):'—';}
function mif(w,h,a,m){return 10*w+6.25*h-5*a+(m?5:-161);}
function hb(w,h,a,m){return m?88.362+13.397*w+4.799*h-5.677*a:447.593+9.247*w+3.098*h-4.330*a;}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;$('wt').value=Math.round(v('wt')*2.20462);}
    else{$('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;$('wt').value=Math.round(v('wt')/2.20462*10)/10;}
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');
  var h=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),w=imp?v('wt')/2.20462:v('wt'),a=v('age'),m=$('sex').value==='s1',bf=v('bf');
  C.text('hAlt',imp?Math.round(h)+' cm':Math.floor(h/2.54/12)+'′ '+Math.round((h/2.54)%12)+'″');
  if(!(h>0&&w>0&&a>0))return;
  var lbm=bf>0&&bf<70?w*(1-bf/100):null,b1=mif(w,h,a,m),b2=hb(w,h,a,m),b3=lbm?370+21.6*lbm:null,b4=lbm?500+22*lbm:null,all=[b1,b2,b3,b4].filter(function(x){return x!==null;});
  var avg=all.reduce(function(s,x){return s+x;},0)/all.length,mn=Math.min.apply(null,all),mx=Math.max.apply(null,all);
  C.text('resultValue',K(b1));C.text('rgTag',all.length+' formulas: '+K(mn)+'–'+K(mx));
  C.text('bN','Calories your body uses in 24 hours at complete rest — about '+(b1/w).toFixed(1)+' kcal per kg of body weight.');
  C.text('hr',(b1/24).toFixed(1)+' kcal');C.text('avg',K(avg)+' kcal');C.text('rng',K(b1*1.2)+' – '+K(b1*1.725)+' kcal');
  C.text('f1',K(b1)+' kcal');C.text('f2',K(b2)+' kcal');C.text('f3',b3?K(b3)+' kcal':'Needs body fat %');C.text('f4',b4?K(b4)+' kcal':'Needs body fat %');C.text('sprT','Spread '+K(mx-mn)+' kcal');
  var ages=[20,30,40,50,60,70,80].filter(function(x){return x!==Math.round(a);});ages.push(Math.round(a));ages.sort(function(x,y){return x-y;});
  $('ageTbl').innerHTML=ages.map(function(x){var b=mif(w,h,x,m),d=b-b1,me=x===Math.round(a);return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x+(me?' <small class="p">(you)</small>':'')+'</td><td class="b">'+K(b)+' kcal</td><td>'+(b/24).toFixed(1)+' kcal</td><td class="'+(d>0?'pos':d<0?'r':'mu')+'">'+(Math.abs(d)<1?'—':(d>0?'+':'−')+K(Math.abs(d))+' kcal')+'</td></tr>';}).join('');
  last='BMR: '+K(b1)+' kcal/day (Mifflin-St Jeor)\nHarris-Benedict: '+K(b2)+(b3?'\nKatch-McArdle: '+K(b3)+'\nCunningham: '+K(b4):'')+'\nPer hour at rest: '+(b1/24).toFixed(1)+' kcal\n— calculatepilot.com/health/bmr-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'brCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Results');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpBmr={mif:mif,hb:hb};
})();
