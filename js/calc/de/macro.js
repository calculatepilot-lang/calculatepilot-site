/* Macro calculator — CalculatePilot (redesign, PSEO standards).
   Grams = calories × % ÷ kcal per gram (protein 4, fat 9, carbohydrate 4).
   Guideline check: AMDR adults — protein 10–35%, fat 20–35%, carbohydrate 45–65% (IOM DRI 2005).
   Protein per kg vs RDA 0.8 g/kg and ISSN 1.4–2.0 g/kg for exercising adults. Fiber 14 g per 1,000 kcal. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var SPLITS=[['Ausgewogen',30,30,40],['Mehr Protein',40,30,30],['Richtwert-Mittelpunkte',20,30,50],['Weniger Kohlenhydrate',35,45,20],['Ketogen',20,75,5],['Ausdauer',20,25,55]];
function K(x){return isFinite(x)?Math.round(x).toLocaleString('de-DE'):'—';}
function inAmdr(p,f,c){return p>=10&&p<=35&&f>=20&&f<=35&&c>=45&&c<=65;}
function ok(b,t){return '<span style="color:'+(b?'var(--sx-pc)':'#b45309')+'">'+(b?'✓ ':'△ ')+t+'</span>';}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value&&v('bw')>0)$('bw').value=Math.round(v('bw')*(imp?2.20462:1/2.20462)*10)/10;prevU=$('u').value;C.text('bwU',imp?'lb':'kg');
  var kc=Math.max(0,v('dailyCalories')),p=Math.max(0,v('proteinPercent')),f=Math.max(0,v('fatPercent')),c=Math.max(0,v('carbPercent')),sum=p+f+c,meals=+$('meals').value||3;
  var bw=v('bw')>0?(imp?v('bw')/2.20462:v('bw')):0;
  var pg=kc*p/100/4,fg=kc*f/100/9,cg=kc*c/100/4;
  document.querySelectorAll('#presets [data-sp]').forEach(function(b){var s=b.getAttribute('data-sp').split(',').map(Number);b.setAttribute('aria-pressed',String(s[0]===p&&s[1]===f&&s[2]===c));});
  var sn=$('sumN');sn.textContent=sum===100?'Aufteilung ergibt 100 % ✓':'Aufteilung ergibt '+sum+'% — passen Sie auf 100 % an, damit die Gramm zu Ihren '+K(kc)+' kcal passen.';sn.style.color=sum===100?'':'var(--sx-err)';
  C.text('kTag',K(kc)+' kcal');C.text('resultValue',K(pg)+' g');C.text('fG',K(fg)+' g');C.text('cG',K(cg)+' g');
  C.text('pN',p+'% · '+K(pg*4)+' kcal');C.text('fN',f+'% · '+K(fg*9)+' kcal');C.text('cN',c+'% · '+K(cg*4)+' kcal');
  var t=sum||1;$('pie').style.background='conic-gradient(var(--sx-primary) 0 '+(p/t*100)+'%,#f59e0b 0 '+((p+f)/t*100)+'%,#34d399 0 100%)';C.text('pieC',sum===100?'100%':sum+'%');
  $('a1').innerHTML=ok(p>=10&&p<=35,p+'%');$('a2').innerHTML=ok(f>=20&&f<=35,f+'%');$('a3').innerHTML=ok(c>=45&&c<=65,c+'%');
  if(bw){var gk=pg/bw;C.text('a4L','Protein pro kg ('+(imp?Math.round(bw*2.20462)+' lb':bw.toFixed(1)+' kg')+')');$('a4').innerHTML=ok(gk>=0.8,gk.toFixed(2)+' g/kg')+(gk>=1.4&&gk<=2.0?' <small style="color:var(--sx-muted)">(ISSN-Bereich)</small>':gk>2.0?' <small style="color:var(--sx-muted)">(über ISSN 2,0)</small>':'');}
  else{C.text('a4L','Protein pro kg Körpergewicht');C.text('a4','Körpergewicht hinzufügen');}
  C.text('fib',K(kc/1000*14)+' g / Tag');
  var nt=$('note');
  if(sum!==100)nt.innerHTML='<b style="color:var(--sx-err)">Die Prozentwerte müssen zusammen 100 % ergeben.</b>';
  else if(!inAmdr(p,f,c))nt.textContent='Diese Aufteilung liegt außerhalb der allgemeinen Bereiche für Erwachsene (AMDR) — das ist bei proteinreicher oder kohlenhydratarmer Ernährung üblich, sollte aber bei einer Erkrankung mit einer Ernährungsfachkraft besprochen werden.';
  else nt.textContent='Diese Aufteilung liegt innerhalb der empfohlenen Verteilungsbereiche für Makronährstoffe (AMDR) für Erwachsene.';
  C.text('mealN','Ihre Tagesziele gleichmäßig verteilt auf '+meals+' Mahlzeiten.');
  $('mealTbl').innerHTML='<tr style="background:var(--sx-emb)"><td style="font-family:inherit;font-weight:700">Tag</td><td class="b">'+K(kc)+' kcal</td><td>'+K(pg)+' g</td><td>'+K(fg)+' g</td><td>'+K(cg)+' g</td></tr><tr><td style="font-family:inherit;font-weight:600">Jede von '+meals+' Mahlzeiten</td><td>'+K(kc/meals)+' kcal</td><td>'+K(pg/meals)+' g</td><td>'+K(fg/meals)+' g</td><td>'+K(cg/meals)+' g</td></tr>';
  C.text('cmpN','Dieselben '+K(kc)+' kcal, verteilt nach gängigen Aufteilungen.');
  $('cmpTbl').innerHTML=SPLITS.map(function(s){var cur=s[1]===p&&s[2]===f&&s[3]===c;return '<tr'+(cur?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+s[0]+'</td><td>'+s[1]+' / '+s[2]+' / '+s[3]+'</td><td class="b">'+K(kc*s[1]/400)+' g</td><td>'+K(kc*s[2]/900)+' g</td><td>'+K(kc*s[3]/400)+' g</td><td style="font-family:inherit">'+(inAmdr(s[1],s[2],s[3])?'<span style="color:var(--sx-pc)">Ja</span>':'<span style="color:#b45309">Nein</span>')+'</td></tr>';}).join('');
  last='Tägliche Makros für '+K(kc)+' kcal ('+p+'/'+f+'/'+c+'):\nProtein '+K(pg)+' g · Fett '+K(fg)+' g · Kohlenhydrate '+K(cg)+' g\nBallaststoffziel: '+K(kc/1000*14)+' g\n— calculatepilot.com/health/macro-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('#presets [data-sp]').forEach(function(b){b.addEventListener('click',function(){var s=b.getAttribute('data-sp').split(',');$('proteinPercent').value=s[0];$('fatPercent').value=s[1];$('carbPercent').value=s[2];$('proteinPercent').dispatchEvent(new Event('input',{bubbles:true}));});});
  C.init({root:'mcCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Makros kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpMacro={};
})();
