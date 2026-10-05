/* Dog food portion & calorie calculator — CalculatePilot (Stitch redesign).
   RER = 70 × kg^0.75; DER = RER × life-stage factor; overweight dogs (BCS > 5) are fed for an estimated ideal weight = weight ÷ (1 + 0.10 × (BCS − 5));
   food kcal = DER × (0.9 if treats are capped at 10%); cups = food kcal ÷ kcal per cup. */
(function(){
var C=window.CPX,$=C.$,last='',KG=2.2046226218,prevU='lb';
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oDer','oMeal','oRer','oTreat','oDays','oYear'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um die Portion zu sehen.');last='';}
function compute(){
  var u=$('u').value;if(u!==prevU){$('w').value=+(C.val('w')*(u==='kg'?1/KG:KG)).toFixed(1);prevU=u;}
  C.text('wU',u);var w=C.val('w'),kg=u==='kg'?w:w/KG,bcs=C.val('bcs'),f=parseFloat($('ls').value),kc=C.val('kc'),mp=Math.max(1,Math.round(C.val('mp'))||1),tr=$('tr').checked;
  var bn=bcs<=3?'thin':bcs<=5?'ideal':bcs<=7?'heavy':'obese';C.text('bcsV',bcs+' von 9 · '+bn);
  $('err').hidden=true;
  if(!(kg>0))return fail('Geben Sie das Gewicht Ihres Hundes ein.');
  if(!(kc>0))return fail('Geben Sie die Kalorien pro Tasse laut Etikett Ihres Hundefutters ein.');
  var ideal=bcs>5?kg/(1+0.10*(bcs-5)):kg,rer=70*Math.pow(ideal,0.75),der=rer*f,treat=tr?der*0.10:0,food=der-treat,cups=food/kc;
  C.text('lsN','× '+f+' RER');
  C.text('resultValue',C.num(cups,2));C.text('tag',C.num(der,0)+' kcal pro Tag');
  C.text('interp',bcs>5?'Gefüttert für ein geschätztes Idealgewicht von '+C.num(ideal*(u==='kg'?1:KG),1)+' '+u+', da der Body-Condition-Score '+bcs+' von 9 beträgt.':'Für einen '+C.num(w,1)+' '+u+' Hund mit '+f+' × Ruheenergiebedarf.');
  C.text('oDer',C.num(der,0)+' kcal');C.text('oMeal',C.num(cups/mp,2)+' cups');C.text('oRer',C.num(rer,0)+' kcal');C.text('oTreat',tr?C.num(treat,0)+' kcal max.':'none set');
  var bag=C.val('bg'),cpl=C.val('cl'),bp=C.val('bp'),bc=bag*cpl,days=bc>0&&cups>0?bc/cups:NaN;
  C.text('bagN',bag>0?C.num(bag,0)+' lb-Sack':'');C.text('oDays',isFinite(days)?C.num(days,0)+' days':'—');C.text('oCups',isFinite(days)?C.num(bc,0)+' Tassen pro Sack':'—');
  var bags=isFinite(days)?365/days:NaN;C.text('oYear',isFinite(bags)?C.num(bags,1)+' bags':'—');C.text('oYearN',isFinite(bags)?C.money(bags*bp,0)+' im Jahr bei '+C.money(bp,0)+' ein Sack':'—');
  C.text('note',bcs>=7?'Ein Body-Condition-Score von '+bcs+' deutet darauf hin, dass Ihr Hund Übergewicht hat. Füttern Sie die Portion für das Idealgewicht, wiegen Sie sie ab und kontrollieren Sie den Fortschritt alle paar Wochen mit Ihrem Tierarzt.':bcs<=3?'Ein Wert von '+bcs+' deutet darauf hin, dass Ihr Hund untergewichtig ist. Lassen Sie eine Erkrankung tierärztlich ausschließen, bevor Sie mehr füttern.':'Bei etwa '+C.num(der,0)+' kcal pro Tag sollte dies das Gewicht stabil halten. Passen Sie die Menge um 10 % an, wenn der Hund über einige Wochen zu- oder abnimmt.');
  last='Hundefutter – calculatepilot.com/other/dog-food-portion-calculator.html\n'+C.num(w,1)+' '+u+', BCS '+bcs+': RER '+C.num(rer,0)+', DER '+C.num(der,0)+' kcal\n'+C.num(cups,2)+' Tassen pro Tag ('+C.num(cups/mp,2)+' pro Mahlzeit, '+mp+' Mahlzeiten)';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  var ls=$('ls');ls.querySelector('option[value="2.0p"]').value='2';/* puppy 4-12 months shares the 2x value */
  C.init({root:'dfCalc',compute:compute});
  document.querySelectorAll('[data-k]').forEach(function(b){b.addEventListener('click',function(){C.set('kc',b.getAttribute('data-k'));$('kc').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
