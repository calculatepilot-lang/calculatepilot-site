/* Dog food portion & calorie calculator — CalculatePilot (Stitch redesign).
   RER = 70 × kg^0.75; DER = RER × life-stage factor; overweight dogs (BCS > 5) are fed for an estimated ideal weight = weight ÷ (1 + 0.10 × (BCS − 5));
   food kcal = DER × (0.9 if treats are capped at 10%); cups = food kcal ÷ kcal per cup. */
(function(){
var C=window.CPX,$=C.$,last='',KG=2.2046226218,prevU='lb';
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oDer','oMeal','oRer','oTreat','oDays','oYear'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the portion.');last='';}
function compute(){
  var u=$('u').value;if(u!==prevU){$('w').value=+(C.val('w')*(u==='kg'?1/KG:KG)).toFixed(1);prevU=u;}
  C.text('wU',u);var w=C.val('w'),kg=u==='kg'?w:w/KG,bcs=C.val('bcs'),f=parseFloat($('ls').value),kc=C.val('kc'),mp=Math.max(1,Math.round(C.val('mp'))||1),tr=$('tr').checked;
  var bn=bcs<=3?'thin':bcs<=5?'ideal':bcs<=7?'heavy':'obese';C.text('bcsV',bcs+' of 9 · '+bn);
  $('err').hidden=true;
  if(!(kg>0))return fail('Enter your dog’s weight.');
  if(!(kc>0))return fail('Enter the calories per cup from your dog food label.');
  var ideal=bcs>5?kg/(1+0.10*(bcs-5)):kg,rer=70*Math.pow(ideal,0.75),der=rer*f,treat=tr?der*0.10:0,food=der-treat,cups=food/kc;
  C.text('lsN','× '+f+' RER');
  C.text('resultValue',C.num(cups,2));C.text('tag',C.num(der,0)+' kcal a day');
  C.text('interp',bcs>5?'Fed for an estimated ideal weight of '+C.num(ideal*(u==='kg'?1:KG),1)+' '+u+', since the body condition score is '+bcs+' of 9.':'For a '+C.num(w,1)+' '+u+' dog at '+f+' × resting energy.');
  C.text('oDer',C.num(der,0)+' kcal');C.text('oMeal',C.num(cups/mp,2)+' cups');C.text('oRer',C.num(rer,0)+' kcal');C.text('oTreat',tr?C.num(treat,0)+' kcal max':'none set');
  var bag=C.val('bg'),cpl=C.val('cl'),bp=C.val('bp'),bc=bag*cpl,days=bc>0&&cups>0?bc/cups:NaN;
  C.text('bagN',bag>0?C.num(bag,0)+' lb bag':'');C.text('oDays',isFinite(days)?C.num(days,0)+' days':'—');C.text('oCups',isFinite(days)?C.num(bc,0)+' cups per bag':'—');
  var bags=isFinite(days)?365/days:NaN;C.text('oYear',isFinite(bags)?C.num(bags,1)+' bags':'—');C.text('oYearN',isFinite(bags)?C.money(bags*bp,0)+' a year at '+C.money(bp,0)+' a bag':'—');
  C.text('note',bcs>=7?'A body condition score of '+bcs+' suggests your dog is carrying extra weight. Feed the ideal-weight portion, weigh it, and check progress with your vet every few weeks.':bcs<=3?'A score of '+bcs+' suggests your dog is underweight. See a vet to rule out illness before increasing food.':'At about '+C.num(der,0)+' kcal a day this should maintain a steady weight. Adjust by 10% if the dog gains or loses weight over a few weeks.');
  last='Dog food — calculatepilot.com/other/dog-food-portion-calculator.html\n'+C.num(w,1)+' '+u+', BCS '+bcs+': RER '+C.num(rer,0)+', DER '+C.num(der,0)+' kcal\n'+C.num(cups,2)+' cups a day ('+C.num(cups/mp,2)+' per meal, '+mp+' meals)';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  var ls=$('ls');ls.querySelector('option[value="2.0p"]').value='2';/* puppy 4-12 months shares the 2x value */
  C.init({root:'dfCalc',compute:compute});
  document.querySelectorAll('[data-k]').forEach(function(b){b.addEventListener('click',function(){C.set('kc',b.getAttribute('data-k'));$('kc').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
