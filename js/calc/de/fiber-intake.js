/* Fiber intake calculator — CalculatePilot (redesign, PSEO standards).
   Calorie-based target = kcal ÷ 1,000 × 14 g (IOM 2005 / DGA). IOM Adequate Intake (g/day): 1–3: 19; 4–8: 25; 9–13 M31 F26;
   14–18 M38 F26; 19–50 M38 F25; 51+ M30 F21; pregnancy 28; lactation 29. Food fiber per serving ≈ USDA FoodData Central, rounded. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var FOOD=[['Spalterbsen, gekocht','1 Tasse',16],['Linsen, gekocht','1 Tasse',15.5],['Schwarze Bohnen, gekocht','1 Tasse',15],['Chiasamen','1 oz (28 g)',10],['Himbeeren','1 Tasse',8],['Birne, mit Schale','1 mittelgroße',5.5],['Brokkoli, gekocht','1 Tasse',5],['Apfel, mit Schale','1 mittelgroße',4.5],['Haferflocken, trocken','½ Tasse (40 g)',4],['Mandeln','1 oz (28 g)',3.5]];
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
  C.text('rN',kcal.toLocaleString('de-DE')+' kcal ÷ 1,000 × 14 g = '+t+' g Ballaststoffe pro Tag.'+(Math.abs(t-ref)>=5?' Dies weicht von Ihrem IOM-Referenzwert von '+ref+' g ab, weil Ihre Kalorienzufuhr '+(t>ref?'above':'below')+' für Ihr Alter und Geschlecht typisch ist.':''));
  C.text('ai',ref+' g');C.text('gapL',hasC?'Differenz zu Ihrem '+cur+' g':'Lücke zur aktuellen Zufuhr');C.text('gap',hasC?(gap?gap+' g':'Ziel erreicht'):'Aktuelle Zufuhr eingeben');
  var wn=$('warn');
  wn.textContent=age<19?'Folgen Sie bei Kindern und Jugendlichen dem altersbezogenen IOM-Referenzwert und sprechen Sie mit einem Kinderarzt über Ernährungsumstellungen.':hasC&&cur>=t?'Sie erreichen das kalorienbasierte Ziel bereits – achten Sie auf eine abwechslungsreiche Mischung an Ballaststoffquellen.':'Steigern Sie die Ballaststoffe schrittweise und trinken Sie dabei mehr Wasser, um Blähungen und Gase zu begrenzen.';
  var ph='',steps=hasC&&gap>0?Math.max(2,Math.min(6,Math.ceil(gap/5))):0;
  if(steps){for(var i=1;i<=steps;i++){var g=Math.round(cur+gap*i/steps);ph+='<div class="l'+(i===steps?' t':'')+'"><span>Woche '+i+'</span><b>'+g+' g/Tag</b></div>';}C.text('planT','Über '+steps+' weeks');}
  else{ph='<div class="l"><span>'+(hasC?'Keine Steigerung nötig – Sie erreichen das Ziel.':'Geben Sie Ihre aktuelle Ballaststoffzufuhr ein, um einen schrittweisen Wochenplan zu erhalten.')+'</span><b>—</b></div>';C.text('planT','—');}
  $('plan').innerHTML=ph;
  C.text('tbT',hasC?'Differenz: '+gap+' g':'Gesamtziel: '+t+' g');
  $('fdTbl').innerHTML=FOOD.map(function(f){return '<tr><td style="font-family:inherit;font-weight:600">'+f[0]+'</td><td style="font-family:inherit">'+f[1]+'</td><td>'+f[2]+' g</td><td class="b">'+(gap?(gap/f[2]).toFixed(1):'—')+'</td></tr>';}).join('');
  last='Ballaststoffziel: '+t+' g/Tag (14 g pro 1.000 kcal bei '+kcal+' kcal)\nIOM-Referenzwert: '+ref+' g/Tag\n– calculatepilot.com/health/fiber-intake-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'fbCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Ergebnisse kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
