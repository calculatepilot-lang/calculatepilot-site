/* Gas mileage & trip fuel cost — CalculatePilot (Stitch redesign).
   Trip: gallons = miles ÷ MPG, cost = gallons × price, CO₂ = gallons × 8.887 kg (US EPA), litres = gallons × 3.785412,
   EV = miles ÷ (mi/kWh) × price. Odometer mode: MPG = miles ÷ gallons. L/100 km = 235.215 ÷ MPG. */
(function(){
var C=window.CPX,$=C.$,last='',prevU='mi',KM=1.609344,L_GAL=3.785411784,CO2=8.887;
var CLASSES=[['electric_bolt','Hybrid-Kompaktwagen / Limousine',54,50,52],['directions_car','Kompakte Limousine',31,38,34],['directions_car','Mittelklasse-Limousine',28,35,31],['airport_shuttle','Kompakt- und Mittelklasse-SUV',25,31,27.5],['rv_hookup','Großes SUV und Minivan',18,23,20],['local_shipping','Großer Pick-up',15,20,17]];
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','g1','g2','g3','g4','evG','evC'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um das Ergebnis zu sehen.');last='';}
function p(x,d){return C.num(x,d);}
function tables(price){
  C.text('matP','at '+C.money(price,2)+' pro Gallone');
  var h='';CLASSES.forEach(function(c){var per=price/c[4]*1000;h+='<tr><td class="a"><span class="msym" aria-hidden="true" style="vertical-align:-5px;color:var(--sx-pc)">'+c[0]+'</span> '+c[1]+'</td><td class="n">'+c[2]+'</td><td class="n">'+c[3]+'</td><td class="n">'+c[4]+'</td><td class="n">'+C.money(per,2)+'</td><td class="n">'+C.money(per*15,2)+'</td><td><button type="button" class="sx-reset" data-load="'+c[4]+'" style="padding:4px 10px;border:1px solid var(--sx-border);border-radius:6px">Laden</button></td></tr>';});
  $('matrix').querySelector('tbody').innerHTML=h;
}
function conv(){var h='';[15,25,35,55].forEach(function(m){h+='<tr><td class="a"><b>'+m+' MPG</b></td><td class="n">'+p(235.215/m,2)+'</td><td class="n">'+p(m*1.609344/L_GAL,2)+'</td><td class="n">'+p(100/m,2)+'</td></tr>';});$('conv').querySelector('tbody').innerHTML=h;}
function compute(){
  var mode=$('mode').value,u=$('du').value;
  $('tripBox').hidden=mode!=='trip';$('mpgBox').hidden=mode!=='mpg';$('evCard').hidden=mode!=='trip';
  C.text('formT',mode==='trip'?'Fahrtparameter':'Details zur Tankfüllung');C.text('ctaT',mode==='trip'?'Spritkosten der Fahrt berechnen':'Meinen Verbrauch berechnen');
  if(u!==prevU){var dv=C.val('dist');$('dist').value=+(u==='km'?dv*KM:dv/KM).toFixed(2);prevU=u;}
  C.text('dU',u==='km'?'kilometres':'miles');C.text('pplV',C.val('ppl')+' '+(C.val('ppl')>1?'people':'person'));
  $('err').hidden=true;
  if(mode==='trip'){
    var mi=C.val('dist')/(u==='km'?KM:1)*($('rt').value==='1'?2:1),eff=C.val('eff'),pr=C.val('price'),n=Math.max(1,Math.round(C.val('ppl')));
    if(!(mi>0))return fail('Geben Sie die Fahrstrecke ein.');
    if(!(eff>0))return fail('Geben Sie einen Kraftstoffverbrauch über null ein.');
    var gal=mi/eff,cost=gal*pr,co2=gal*CO2,ev=C.val('evE')>0?mi/C.val('evE')*C.val('evP'):NaN;
    C.text('heroL','Spritkosten der Fahrt');C.text('resultValue',C.money(cost,2));C.text('tag',C.money(cost/mi,3)+' pro Meile');
    C.text('interp',C.num(mi,1)+' Meilen bei '+C.num(eff,1)+' MPG verwendet '+p(gal,2)+' Gallonen bei '+C.money(pr,2)+' pro Gallone.');
    C.text('g1L','Verbrauchter Kraftstoff');C.text('g1',p(gal,2)+' gal');C.text('g2L','Litern');C.text('g2',p(gal*L_GAL,1)+' L');C.text('g3L','Erzeugtes CO₂');C.text('g3',p(co2,1)+' kg');C.text('g4L','Pro Person');C.text('g4',n>1?C.money(cost/n,2):C.money(cost,2));
    C.text('evG',C.money(cost,2));C.text('evC',isFinite(ev)?C.money(ev,2):'—');
    if(isFinite(ev)){var sv=cost-ev;C.text('evTag',sv>0?'saves '+p(sv/cost*100,1)+'%':'costs '+p(-sv/cost*100,1)+'% mehr');C.text('evTxt','Ein E-Auto laden bei '+p(C.val('evE'),1)+' Meilen pro kWh und '+C.money(C.val('evP'),2)+' pro kWh würde verbrauchen '+p(mi/C.val('evE'),1)+' kWh. '+(sv>0?'Das spart '+C.money(sv,2):'Das kostet '+C.money(-sv,2)+' more')+' auf dieser Fahrt.');}
    else{C.text('evTag','—');C.text('evTxt','Geben Sie die E-Auto-Effizienz zum Vergleich ein.');}
    C.text('metric',p(235.215/eff,2)+' L/100 km · '+p(eff*KM/L_GAL,2)+' km/L · '+p(100/eff,2)+' Gallonen pro 100 Meilen. Fahrstrecke '+p(mi*KM,1)+' km.');
    last='Kraftstoffkosten der Fahrt — calculatepilot.com/other/gas-mileage-calculator.html\n'+p(mi,1)+' mi bei '+p(eff,1)+' MPG: '+p(gal,2)+' gal × '+C.money(pr,2)+' = '+C.money(cost,2)+(n>1?' ('+C.money(cost/n,2)+' jeweils für '+n+')':'')+'\nCO₂ ≈ '+p(co2,1)+' kg';
    tables(pr);
  }else{
    var o0=C.val('o0'),o1=C.val('o1'),g=C.val('gal'),gp=C.val('gp'),m=o1-o0;
    if(!(m>0))return fail('Der neue Kilometerstand muss höher sein als der letzte.');
    if(!(g>0))return fail('Geben Sie die beim Tanken nachgefüllten Gallonen ein.');
    var mpg=m/g,cpm=g*gp/m;
    C.text('heroL','Ihr Kraftstoffverbrauch');C.text('resultValue',p(mpg,1)+' MPG');C.text('tag',p(235.215/mpg,2)+' L/100 km');
    C.text('interp',p(m,1)+' Meilen mit '+p(g,2)+' Gallonen.');
    C.text('g1L','Kosten pro Meile');C.text('g1',C.money(cpm,3));C.text('g2L','Kosten der Tankfüllung');C.text('g2',C.money(g*gp,2));C.text('g3L','km pro Liter');C.text('g3',p(mpg*KM/L_GAL,2));C.text('g4L','Gallonen pro 100 mi');C.text('g4',p(100/mpg,2));
    C.text('metric',p(235.215/mpg,2)+' L/100 km · '+p(mpg*KM/L_GAL,2)+' km/L · '+p(m*KM,1)+' km gefahren.');
    last='MPG aus Tankfüllung — calculatepilot.com/other/gas-mileage-calculator.html\n'+p(m,1)+' mi ÷ '+p(g,2)+' gal = '+p(mpg,1)+' MPG ('+p(235.215/mpg,2)+' L/100 km)\nKosten pro Meile '+C.money(cpm,3);
    tables(gp);
  }
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  conv();
  C.init({root:'gmCalc',compute:compute});
  $('vpre').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;C.set('eff',b.getAttribute('data-m'));fire($('eff'));});
  document.querySelectorAll('[data-p]').forEach(function(b){b.addEventListener('click',function(){C.set('price',b.getAttribute('data-p'));fire($('price'));});});
  $('matrix').addEventListener('click',function(e){var b=e.target.closest('[data-load]');if(!b)return;$('mode').value='trip';C.set('eff',b.getAttribute('data-load'));fire($('eff'));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
