/* Dog food portion & calorie calculator — CalculatePilot (Stitch redesign).
   RER = 70 × kg^0.75; DER = RER × life-stage factor; overweight dogs (BCS > 5) are fed for an estimated ideal weight = weight ÷ (1 + 0.10 × (BCS − 5));
   food kcal = DER × (0.9 if treats are capped at 10%); cups = food kcal ÷ kcal per cup. */
(function(){
var C=window.CPX,$=C.$,last='',KG=2.2046226218,prevU='lb';
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oDer','oMeal','oRer','oTreat','oDays','oYear'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige el dato de arriba para ver la porción.');last='';}
function compute(){
  var u=$('u').value;if(u!==prevU){$('w').value=+(C.val('w')*(u==='kg'?1/KG:KG)).toFixed(1);prevU=u;}
  C.text('wU',u);var w=C.val('w'),kg=u==='kg'?w:w/KG,bcs=C.val('bcs'),f=parseFloat($('ls').value),kc=C.val('kc'),mp=Math.max(1,Math.round(C.val('mp'))||1),tr=$('tr').checked;
  var bn=bcs<=3?'thin':bcs<=5?'ideal':bcs<=7?'heavy':'obese';C.text('bcsV',bcs+' de 9 · '+bn);
  $('err').hidden=true;
  if(!(kg>0))return fail('Introduce el peso de tu perro.');
  if(!(kc>0))return fail('Introduce las calorías por taza de la etiqueta de la comida de tu perro.');
  var ideal=bcs>5?kg/(1+0.10*(bcs-5)):kg,rer=70*Math.pow(ideal,0.75),der=rer*f,treat=tr?der*0.10:0,food=der-treat,cups=food/kc;
  C.text('lsN','× '+f+' RER');
  C.text('resultValue',C.num(cups,2));C.text('tag',C.num(der,0)+' kcal al día');
  C.text('interp',bcs>5?'Alimentado para un peso ideal estimado de '+C.num(ideal*(u==='kg'?1:KG),1)+' '+u+', ya que la puntuación de condición corporal es '+bcs+' de 9.':'Para un perro '+C.num(w,1)+' '+u+' de '+f+' × la energía en reposo.');
  C.text('oDer',C.num(der,0)+' kcal');C.text('oMeal',C.num(cups/mp,2)+' cups');C.text('oRer',C.num(rer,0)+' kcal');C.text('oTreat',tr?C.num(treat,0)+' kcal máx.':'none set');
  var bag=C.val('bg'),cpl=C.val('cl'),bp=C.val('bp'),bc=bag*cpl,days=bc>0&&cups>0?bc/cups:NaN;
  C.text('bagN',bag>0?C.num(bag,0)+' bolsa de lb':'');C.text('oDays',isFinite(days)?C.num(days,0)+' days':'—');C.text('oCups',isFinite(days)?C.num(bc,0)+' tazas por bolsa':'—');
  var bags=isFinite(days)?365/days:NaN;C.text('oYear',isFinite(bags)?C.num(bags,1)+' bags':'—');C.text('oYearN',isFinite(bags)?C.money(bags*bp,0)+' al año a '+C.money(bp,0)+' por bolsa':'—');
  C.text('note',bcs>=7?'Una puntuación de condición corporal de '+bcs+' indica que tu perro tiene sobrepeso. Dale la porción de su peso ideal, pésala y revisa el progreso con tu veterinario cada pocas semanas.':bcs<=3?'Una puntuación de '+bcs+' indica que tu perro tiene bajo peso. Consulta con un veterinario para descartar una enfermedad antes de aumentar la comida.':'Con unas '+C.num(der,0)+' kcal al día esto debería mantener un peso estable. Ajusta un 10% si el perro gana o pierde peso en unas semanas.');
  last='Comida para perros — calculatepilot.com/other/dog-food-portion-calculator.html\n'+C.num(w,1)+' '+u+', BCS '+bcs+': RER '+C.num(rer,0)+', DER '+C.num(der,0)+' kcal\n'+C.num(cups,2)+' tazas al día ('+C.num(cups/mp,2)+' por comida, '+mp+' comidas)';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  var ls=$('ls');ls.querySelector('option[value="2.0p"]').value='2';/* puppy 4-12 months shares the 2x value */
  C.init({root:'dfCalc',compute:compute});
  document.querySelectorAll('[data-k]').forEach(function(b){b.addEventListener('click',function(){C.set('kc',b.getAttribute('data-k'));$('kc').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
