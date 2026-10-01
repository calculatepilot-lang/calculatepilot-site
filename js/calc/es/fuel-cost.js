/* Fuel cost calculator — CalculatePilot (Stitch redesign).
   fuel = distance ÷ MPG (or distance × L/100km ÷ 100); cost = fuel × price. 1 US gal = 3.785411784 L, 1 mi = 1.609344 km, L/100km = 235.215 ÷ MPG. */
(function(){
var C=window.CPX,$=C.$,last='',prevU='mi',KM=1.609344,L_GAL=3.785411784,K=235.215;
var CLASSES=[['directions_car','Compacto',34],['directions_car','Sedán mediano',28],['airport_shuttle','SUV',22],['local_shipping','Pickup',17],['electric_bolt','Híbrido',48]];
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','g1','g2','g3','g4'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('rate','—');C.text('rateTxt','—');C.text('metric','—');C.text('fxLive','—');C.text('interp','Corrige el dato anterior para ver el resultado.');last='';}
function p(x,d){return C.num(x,d);}
function rating(mpg){return mpg>=45?['Excelente','Consumo propio de un híbrido.']:mpg>=30?['Bueno','Mejor que el de un coche nuevo típico.']:mpg>=22?['Promedio','Habitual en sedanes y crossovers.']:['Alto consumo','Los vehículos grandes consumen más combustible.'];}
function compute(){
  var km=$('du').value==='km',rt=$('rt').value==='1',mult=rt?2:1;
  if(km!==(prevU==='km')){
    var d=C.val('dist'),e=C.val('eff'),pr=C.val('price');
    $('dist').value=+(km?d*KM:d/KM).toFixed(2);
    if(e>0)$('eff').value=+(K/e).toFixed(2);
    $('price').value=+(km?pr/L_GAL:pr*L_GAL).toFixed(4);
    prevU=km?'km':'mi';
  }
  C.text('dU',km?'kilometres':'miles');C.text('eU',km?'litros por 100 km':'millas por galón (EE. UU.)');C.text('pU',km?'por litro':'por galón');
  $('err').hidden=true;
  var dist=C.val('dist'),eff=C.val('eff'),price=C.val('price'),n=Math.max(1,Math.round(C.val('ppl')));
  if(!(dist>0))return fail('Introduce la distancia del viaje.');
  if(!(eff>0))return fail('Introduce un consumo de combustible superior a cero.');
  if(!(price>=0))return fail('Introduce el precio del combustible.');
  var tot=dist*mult,mpg=km?K/eff:eff,fuel=km?tot*eff/100:tot/eff,cost=fuel*price,cpd=cost/tot,fu=km?'L':'gal',du=km?'km':'mi';
  C.text('resultValue',C.money(cost,2));
  C.text('tag',C.money(cpd,3)+' per '+du);
  C.text('interp',p(tot,1)+' '+du+(rt?' ida y vuelta':'')+' at '+(km?p(eff,1)+' L/100 km':p(eff,1)+' MPG')+' uses '+p(fuel,2)+(km?' litres':' gallons')+' at '+C.money(price,2)+' per '+(km?'litre':'gallon')+'.');
  C.text('g1L',km?'Litros necesarios':'Galones necesarios');C.text('g1',p(fuel,2)+' '+fu);
  C.text('g2L','Coste por '+du);C.text('g2',C.money(cpd,3));
  C.text('g3',p(tot,1)+' '+du);C.text('g4',C.money(cost/n,2));
  var r=rating(mpg);C.text('rate',r[0]);C.text('rateTxt',r[1]+' Acerca de '+p(mpg,1)+' MPG, o '+p(K/mpg,1)+' L/100 km.');
  $('mark').style.left=Math.max(3,Math.min(97,mpg/60*100))+'%';
  var galUS=km?fuel/L_GAL:fuel,miles=km?tot/KM:tot;
  C.text('metric',km?p(miles,1)+' millas, '+p(galUS,2)+' galones estadounidenses a unas '+p(mpg,1)+' MPG.':p(tot*KM,1)+' km, '+p(fuel*L_GAL,1)+' litros a '+p(K/mpg,2)+' L/100 km.');
  C.text('fxLive',km?p(tot,1)+' × '+p(eff,1)+' ÷ 100 = '+p(fuel,2)+' L\n'+p(fuel,2)+' × '+C.money(price,2)+' = '+C.money(cost,2):p(tot,1)+' ÷ '+p(eff,1)+' = '+p(fuel,2)+' gal\n'+p(fuel,2)+' × '+C.money(price,2)+' = '+C.money(cost,2));
  $('fxLive').style.whiteSpace='pre-line';
  last='Coste de combustible — calculatepilot.com/other/fuel-cost-calculator.html\n'+p(tot,1)+' '+du+(rt?' (ida y vuelta)':'')+' at '+(km?p(eff,1)+' L/100 km':p(eff,1)+' MPG')+': '+p(fuel,2)+' '+fu+' × '+C.money(price,2)+' = '+C.money(cost,2)+(n>1?' ('+C.money(cost/n,2)+' cada uno por '+n+')':'');
  var pg=km?price*L_GAL:price,h='';
  C.text('matP',p(tot,0)+' '+du+(rt?' ida y vuelta':'')+' at '+C.money(price,2)+(km?' por litro':' por galón'));
  C.text('thE',km?'L/100 km':'MPG');C.text('thF',km?'Litros':'Galones');C.text('thM','Coste / '+du);
  CLASSES.forEach(function(c){var gal=miles/c[2],cs=gal*pg,f=km?gal*L_GAL:gal;h+='<tr><td class="a"><span class="msym" aria-hidden="true" style="vertical-align:-5px;color:var(--sx-pc)">'+c[0]+'</span> '+c[1]+'</td><td class="n">'+(km?p(K/c[2],1):c[2])+'</td><td class="n">'+p(f,2)+'</td><td class="n">'+C.money(cs,2)+'</td><td class="n">'+C.money(cs/tot,3)+'</td><td><button type="button" class="sx-reset" data-load="'+c[2]+'" style="padding:4px 10px;border:1px solid var(--sx-border);border-radius:6px">Cargar</button></td></tr>';});
  $('matrix').querySelector('tbody').innerHTML=h;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'fcCalc',compute:compute});
  prevU=$('du').value==='km'?'km':'mi';
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){prevU='mi';});
  function setDist(mi){C.set('dist',$('du').value==='km'?+(mi*KM).toFixed(1):mi);fire($('dist'));}
  $('dpre').addEventListener('click',function(e){var b=e.target.closest('button[data-d]');if(!b)return;setDist(+b.getAttribute('data-d'));});
  $('routes').addEventListener('click',function(e){var b=e.target.closest('[data-r]');if(!b)return;setDist(+b.getAttribute('data-r'));$('dist').scrollIntoView({behavior:'smooth',block:'center'});});
  function setEff(mpg){C.set('eff',$('du').value==='km'?+(K/mpg).toFixed(2):mpg);fire($('eff'));}
  $('vpre').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;setEff(+b.getAttribute('data-m'));});
  $('matrix').addEventListener('click',function(e){var b=e.target.closest('[data-load]');if(!b)return;setEff(+b.getAttribute('data-load'));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
