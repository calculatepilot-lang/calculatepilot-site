/* Fiber intake calculator — CalculatePilot (redesign, PSEO standards).
   Calorie-based target = kcal ÷ 1,000 × 14 g (IOM 2005 / DGA). IOM Adequate Intake (g/day): 1–3: 19; 4–8: 25; 9–13 M31 F26;
   14–18 M38 F26; 19–50 M38 F25; 51+ M30 F21; pregnancy 28; lactation 29. Food fiber per serving ≈ USDA FoodData Central, rounded. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var FOOD=[['Split peas, boiled','1 cup',16],['Lentils, boiled','1 cup',15.5],['Black beans, boiled','1 cup',15],['Chia seeds','1 oz (28 g)',10],['Raspberries','1 cup',8],['Pear, with skin','1 medium',5.5],['Broccoli, boiled','1 cup',5],['Apple, with skin','1 medium',4.5],['Oats, dry','½ cup (40 g)',4],['Almonds','1 oz (28 g)',3.5]];
function ai(age,male,life){
  if(!male&&life==='s2')return 28;if(!male&&life==='s3')return 29;
  if(age<4)return 19;if(age<9)return 25;if(age<14)return male?31:26;if(age<19)return male?38:26;if(age<51)return male?38:25;return male?30:21;
}

function compute(){
  var male=$('sex').value==='s1',age=v('age'),kcal=v('kcal'),cur=v('cur'),life=$('life').value;
  $('lifeRow').hidden=male||age<14;if(male||age<14)life='s1';
  if(!(kcal>0&&age>0))return;
  var t=Math.round(kcal/1000*14),ref=ai(age,male,life),hasC=cur>0,gap=hasC?Math.max(0,t-cur):t;
  C.text('resultValue',t+' g');
  C.text('rN',kcal.toLocaleString('en-US')+' kcal ÷ 1,000 × 14 g = '+t+' g of fiber a day.'+(Math.abs(t-ref)>=5?' This differs from your IOM reference of '+ref+' g because your calorie intake is '+(t>ref?'above':'below')+' typical for your age and sex.':''));
  C.text('ai',ref+' g');C.text('gapL',hasC?'Gap from your '+cur+' g':'Gap from current intake');C.text('gap',hasC?(gap?gap+' g':'Target met'):'Enter current intake');
  var wn=$('warn');
  wn.textContent=age<19?'For children and teens, follow the IOM reference by age and talk to a pediatrician about diet changes.':hasC&&cur>=t?'You already meet the calorie-based target — keep a varied mix of fiber sources.':'Increase fiber gradually and drink more water as you do, to limit bloating and gas.';
  var ph='',steps=hasC&&gap>0?Math.max(2,Math.min(6,Math.ceil(gap/5))):0;
  if(steps){for(var i=1;i<=steps;i++){var g=Math.round(cur+gap*i/steps);ph+='<div class="l'+(i===steps?' t':'')+'"><span>Week '+i+'</span><b>'+g+' g/day</b></div>';}C.text('planT','Over '+steps+' weeks');}
  else{ph='<div class="l"><span>'+(hasC?'No step-up needed — you meet the target.':'Enter your current fiber intake to get a gradual week-by-week plan.')+'</span><b>—</b></div>';C.text('planT','—');}
  $('plan').innerHTML=ph;
  C.text('tbT',hasC?'Gap: '+gap+' g':'Full target: '+t+' g');
  $('fdTbl').innerHTML=FOOD.map(function(f){return '<tr><td style="font-family:inherit;font-weight:600">'+f[0]+'</td><td style="font-family:inherit">'+f[1]+'</td><td>'+f[2]+' g</td><td class="b">'+(gap?(gap/f[2]).toFixed(1):'—')+'</td></tr>';}).join('');
  last='Fiber target: '+t+' g/day (14 g per 1,000 kcal at '+kcal+' kcal)\nIOM reference: '+ref+' g/day\n— calculatepilot.com/health/fiber-intake-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'fbCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Results');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
