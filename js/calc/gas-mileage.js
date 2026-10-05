/* Gas mileage & trip fuel cost — CalculatePilot (Stitch redesign).
   Trip: gallons = miles ÷ MPG, cost = gallons × price, CO₂ = gallons × 8.887 kg (US EPA), litres = gallons × 3.785412,
   EV = miles ÷ (mi/kWh) × price. Odometer mode: MPG = miles ÷ gallons. L/100 km = 235.215 ÷ MPG. */
(function(){
var C=window.CPX,$=C.$,last='',prevU='mi',KM=1.609344,L_GAL=3.785411784,CO2=8.887;
var CLASSES=[['electric_bolt','Hybrid compact / sedan',54,50,52],['directions_car','Compact sedan',31,38,34],['directions_car','Midsize sedan',28,35,31],['airport_shuttle','Compact and midsize SUV',25,31,27.5],['rv_hookup','Full-size SUV and minivan',18,23,20],['local_shipping','Full-size pickup',15,20,17]];
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','g1','g2','g3','g4','evG','evC'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the result.');last='';}
function p(x,d){return C.num(x,d);}
function tables(price){
  C.text('matP','at '+C.money(price,2)+' per gallon');
  var h='';CLASSES.forEach(function(c){var per=price/c[4]*1000;h+='<tr><td class="a"><span class="msym" aria-hidden="true" style="vertical-align:-5px;color:var(--sx-pc)">'+c[0]+'</span> '+c[1]+'</td><td class="n">'+c[2]+'</td><td class="n">'+c[3]+'</td><td class="n">'+c[4]+'</td><td class="n">'+C.money(per,2)+'</td><td class="n">'+C.money(per*15,2)+'</td><td><button type="button" class="sx-reset" data-load="'+c[4]+'" style="padding:4px 10px;border:1px solid var(--sx-border);border-radius:6px">Load</button></td></tr>';});
  $('matrix').querySelector('tbody').innerHTML=h;
}
function conv(){var h='';[15,25,35,55].forEach(function(m){h+='<tr><td class="a"><b>'+m+' MPG</b></td><td class="n">'+p(235.215/m,2)+'</td><td class="n">'+p(m*1.609344/L_GAL,2)+'</td><td class="n">'+p(100/m,2)+'</td></tr>';});$('conv').querySelector('tbody').innerHTML=h;}
function compute(){
  var mode=$('mode').value,u=$('du').value;
  $('tripBox').hidden=mode!=='trip';$('mpgBox').hidden=mode!=='mpg';$('evCard').hidden=mode!=='trip';
  C.text('formT',mode==='trip'?'Trip parameters':'Fill-up details');C.text('ctaT',mode==='trip'?'Calculate trip fuel cost':'Calculate my MPG');
  if(u!==prevU){var dv=C.val('dist');$('dist').value=+(u==='km'?dv*KM:dv/KM).toFixed(2);prevU=u;}
  C.text('dU',u==='km'?'kilometres':'miles');C.text('pplV',C.val('ppl')+' '+(C.val('ppl')>1?'people':'person'));
  $('err').hidden=true;
  if(mode==='trip'){
    var mi=C.val('dist')/(u==='km'?KM:1)*($('rt').value==='1'?2:1),eff=C.val('eff'),pr=C.val('price'),n=Math.max(1,Math.round(C.val('ppl')));
    if(!(mi>0))return fail('Enter the trip distance.');
    if(!(eff>0))return fail('Enter the fuel economy above zero.');
    var gal=mi/eff,cost=gal*pr,co2=gal*CO2,ev=C.val('evE')>0?mi/C.val('evE')*C.val('evP'):NaN;
    C.text('heroL','Trip fuel cost');C.text('resultValue',C.money(cost,2));C.text('tag',C.money(cost/mi,3)+' per mile');
    C.text('interp',C.num(mi,1)+' miles at '+C.num(eff,1)+' MPG uses '+p(gal,2)+' gallons at '+C.money(pr,2)+' a gallon.');
    C.text('g1L','Fuel used');C.text('g1',p(gal,2)+' gal');C.text('g2L','Litres');C.text('g2',p(gal*L_GAL,1)+' L');C.text('g3L','CO₂ produced');C.text('g3',p(co2,1)+' kg');C.text('g4L','Per person');C.text('g4',n>1?C.money(cost/n,2):C.money(cost,2));
    C.text('evG',C.money(cost,2));C.text('evC',isFinite(ev)?C.money(ev,2):'—');
    if(isFinite(ev)){var sv=cost-ev;C.text('evTag',sv>0?'saves '+p(sv/cost*100,1)+'%':'costs '+p(-sv/cost*100,1)+'% more');C.text('evTxt','Charging an EV at '+p(C.val('evE'),1)+' miles per kWh and '+C.money(C.val('evP'),2)+' per kWh would use '+p(mi/C.val('evE'),1)+' kWh. '+(sv>0?'That saves '+C.money(sv,2):'That costs '+C.money(-sv,2)+' more')+' on this trip.');}
    else{C.text('evTag','—');C.text('evTxt','Enter EV efficiency to compare.');}
    C.text('metric',p(235.215/eff,2)+' L/100 km · '+p(eff*KM/L_GAL,2)+' km/L · '+p(100/eff,2)+' gallons per 100 miles. Trip distance '+p(mi*KM,1)+' km.');
    last='Trip fuel cost — calculatepilot.com/other/gas-mileage-calculator.html\n'+p(mi,1)+' mi at '+p(eff,1)+' MPG: '+p(gal,2)+' gal × '+C.money(pr,2)+' = '+C.money(cost,2)+(n>1?' ('+C.money(cost/n,2)+' each for '+n+')':'')+'\nCO₂ ≈ '+p(co2,1)+' kg';
    tables(pr);
  }else{
    var o0=C.val('o0'),o1=C.val('o1'),g=C.val('gal'),gp=C.val('gp'),m=o1-o0;
    if(!(m>0))return fail('The new odometer reading must be higher than the last one.');
    if(!(g>0))return fail('Enter the gallons added at the fill-up.');
    var mpg=m/g,cpm=g*gp/m;
    C.text('heroL','Your fuel economy');C.text('resultValue',p(mpg,1)+' MPG');C.text('tag',p(235.215/mpg,2)+' L/100 km');
    C.text('interp',p(m,1)+' miles on '+p(g,2)+' gallons.');
    C.text('g1L','Cost per mile');C.text('g1',C.money(cpm,3));C.text('g2L','Cost of fill-up');C.text('g2',C.money(g*gp,2));C.text('g3L','km per litre');C.text('g3',p(mpg*KM/L_GAL,2));C.text('g4L','Gallons per 100 mi');C.text('g4',p(100/mpg,2));
    C.text('metric',p(235.215/mpg,2)+' L/100 km · '+p(mpg*KM/L_GAL,2)+' km/L · '+p(m*KM,1)+' km driven.');
    last='MPG from fill-up — calculatepilot.com/other/gas-mileage-calculator.html\n'+p(m,1)+' mi ÷ '+p(g,2)+' gal = '+p(mpg,1)+' MPG ('+p(235.215/mpg,2)+' L/100 km)\nCost per mile '+C.money(cpm,3);
    tables(gp);
  }
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  conv();
  C.init({root:'gmCalc',compute:compute});
  $('vpre').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;C.set('eff',b.getAttribute('data-m'));fire($('eff'));});
  document.querySelectorAll('[data-p]').forEach(function(b){b.addEventListener('click',function(){C.set('price',b.getAttribute('data-p'));fire($('price'));});});
  $('matrix').addEventListener('click',function(e){var b=e.target.closest('[data-load]');if(!b)return;$('mode').value='trip';C.set('eff',b.getAttribute('data-load'));fire($('eff'));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
