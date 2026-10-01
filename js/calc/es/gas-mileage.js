/* Gas mileage & trip fuel cost — CalculatePilot (Stitch redesign).
   Trip: gallons = miles ÷ MPG, cost = gallons × price, CO₂ = gallons × 8.887 kg (US EPA), litres = gallons × 3.785412,
   EV = miles ÷ (mi/kWh) × price. Odometer mode: MPG = miles ÷ gallons. L/100 km = 235.215 ÷ MPG. */
(function(){
var C=window.CPX,$=C.$,last='',prevU='mi',KM=1.609344,L_GAL=3.785411784,CO2=8.887;
var CLASSES=[['electric_bolt','Híbrido compacto / sedán',54,50,52],['directions_car','Sedán compacto',31,38,34],['directions_car','Sedán mediano',28,35,31],['airport_shuttle','SUV compacto y mediano',25,31,27.5],['rv_hookup','SUV grande y monovolumen',18,23,20],['local_shipping','Pickup grande',15,20,17]];
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','g1','g2','g3','g4','evG','evC'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige el dato anterior para ver el resultado.');last='';}
function p(x,d){return C.num(x,d);}
function tables(price){
  C.text('matP','at '+C.money(price,2)+' por galón');
  var h='';CLASSES.forEach(function(c){var per=price/c[4]*1000;h+='<tr><td class="a"><span class="msym" aria-hidden="true" style="vertical-align:-5px;color:var(--sx-pc)">'+c[0]+'</span> '+c[1]+'</td><td class="n">'+c[2]+'</td><td class="n">'+c[3]+'</td><td class="n">'+c[4]+'</td><td class="n">'+C.money(per,2)+'</td><td class="n">'+C.money(per*15,2)+'</td><td><button type="button" class="sx-reset" data-load="'+c[4]+'" style="padding:4px 10px;border:1px solid var(--sx-border);border-radius:6px">Cargar</button></td></tr>';});
  $('matrix').querySelector('tbody').innerHTML=h;
}
function conv(){var h='';[15,25,35,55].forEach(function(m){h+='<tr><td class="a"><b>'+m+' MPG</b></td><td class="n">'+p(235.215/m,2)+'</td><td class="n">'+p(m*1.609344/L_GAL,2)+'</td><td class="n">'+p(100/m,2)+'</td></tr>';});$('conv').querySelector('tbody').innerHTML=h;}
function compute(){
  var mode=$('mode').value,u=$('du').value;
  $('tripBox').hidden=mode!=='trip';$('mpgBox').hidden=mode!=='mpg';$('evCard').hidden=mode!=='trip';
  C.text('formT',mode==='trip'?'Parámetros del viaje':'Datos del repostaje');C.text('ctaT',mode==='trip'?'Calcular coste de combustible del viaje':'Calcular mi MPG');
  if(u!==prevU){var dv=C.val('dist');$('dist').value=+(u==='km'?dv*KM:dv/KM).toFixed(2);prevU=u;}
  C.text('dU',u==='km'?'kilometres':'miles');C.text('pplV',C.val('ppl')+' '+(C.val('ppl')>1?'people':'person'));
  $('err').hidden=true;
  if(mode==='trip'){
    var mi=C.val('dist')/(u==='km'?KM:1)*($('rt').value==='1'?2:1),eff=C.val('eff'),pr=C.val('price'),n=Math.max(1,Math.round(C.val('ppl')));
    if(!(mi>0))return fail('Introduce la distancia del viaje.');
    if(!(eff>0))return fail('Introduce un consumo de combustible superior a cero.');
    var gal=mi/eff,cost=gal*pr,co2=gal*CO2,ev=C.val('evE')>0?mi/C.val('evE')*C.val('evP'):NaN;
    C.text('heroL','Coste de combustible del viaje');C.text('resultValue',C.money(cost,2));C.text('tag',C.money(cost/mi,3)+' por milla');
    C.text('interp',C.num(mi,1)+' millas a '+C.num(eff,1)+' MPG usa '+p(gal,2)+' galones a '+C.money(pr,2)+' el galón.');
    C.text('g1L','Combustible usado');C.text('g1',p(gal,2)+' gal');C.text('g2L','Litros');C.text('g2',p(gal*L_GAL,1)+' L');C.text('g3L','CO₂ producido');C.text('g3',p(co2,1)+' kg');C.text('g4L','Por persona');C.text('g4',n>1?C.money(cost/n,2):C.money(cost,2));
    C.text('evG',C.money(cost,2));C.text('evC',isFinite(ev)?C.money(ev,2):'—');
    if(isFinite(ev)){var sv=cost-ev;C.text('evTag',sv>0?'saves '+p(sv/cost*100,1)+'%':'costs '+p(-sv/cost*100,1)+'% más');C.text('evTxt','Cargar un vehículo eléctrico a '+p(C.val('evE'),1)+' millas por kWh y '+C.money(C.val('evP'),2)+' por kWh consumiría '+p(mi/C.val('evE'),1)+' kWh. '+(sv>0?'Eso ahorra '+C.money(sv,2):'Eso cuesta '+C.money(-sv,2)+' more')+' en este viaje.');}
    else{C.text('evTag','—');C.text('evTxt','Introduce la eficiencia del vehículo eléctrico para comparar.');}
    C.text('metric',p(235.215/eff,2)+' L/100 km · '+p(eff*KM/L_GAL,2)+' km/L · '+p(100/eff,2)+' galones por 100 millas. Distancia del viaje '+p(mi*KM,1)+' km.');
    last='Coste de combustible del viaje — calculatepilot.com/other/gas-mileage-calculator.html\n'+p(mi,1)+' mi a '+p(eff,1)+' MPG: '+p(gal,2)+' gal × '+C.money(pr,2)+' = '+C.money(cost,2)+(n>1?' ('+C.money(cost/n,2)+' cada uno por '+n+')':'')+'\nCO₂ ≈ '+p(co2,1)+' kg';
    tables(pr);
  }else{
    var o0=C.val('o0'),o1=C.val('o1'),g=C.val('gal'),gp=C.val('gp'),m=o1-o0;
    if(!(m>0))return fail('La nueva lectura del odómetro debe ser mayor que la anterior.');
    if(!(g>0))return fail('Introduce los galones añadidos en el repostaje.');
    var mpg=m/g,cpm=g*gp/m;
    C.text('heroL','Tu consumo de combustible');C.text('resultValue',p(mpg,1)+' MPG');C.text('tag',p(235.215/mpg,2)+' L/100 km');
    C.text('interp',p(m,1)+' millas con '+p(g,2)+' galones.');
    C.text('g1L','Coste por milla');C.text('g1',C.money(cpm,3));C.text('g2L','Coste del repostaje');C.text('g2',C.money(g*gp,2));C.text('g3L','km por litro');C.text('g3',p(mpg*KM/L_GAL,2));C.text('g4L','Galones por 100 mi');C.text('g4',p(100/mpg,2));
    C.text('metric',p(235.215/mpg,2)+' L/100 km · '+p(mpg*KM/L_GAL,2)+' km/L · '+p(m*KM,1)+' km recorridos.');
    last='MPG del repostaje — calculatepilot.com/other/gas-mileage-calculator.html\n'+p(m,1)+' mi ÷ '+p(g,2)+' gal = '+p(mpg,1)+' MPG ('+p(235.215/mpg,2)+' L/100 km)\nCoste por milla '+C.money(cpm,3);
    tables(gp);
  }
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  conv();
  C.init({root:'gmCalc',compute:compute});
  $('vpre').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;C.set('eff',b.getAttribute('data-m'));fire($('eff'));});
  document.querySelectorAll('[data-p]').forEach(function(b){b.addEventListener('click',function(){C.set('price',b.getAttribute('data-p'));fire($('price'));});});
  $('matrix').addEventListener('click',function(e){var b=e.target.closest('[data-load]');if(!b)return;$('mode').value='trip';C.set('eff',b.getAttribute('data-load'));fire($('eff'));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
