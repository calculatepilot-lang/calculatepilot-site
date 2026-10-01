/* Fuel cost calculator — CalculatePilot (Stitch redesign).
   fuel = distance ÷ MPG (or distance × L/100km ÷ 100); cost = fuel × price. 1 US gal = 3.785411784 L, 1 mi = 1.609344 km, L/100km = 235.215 ÷ MPG. */
(function(){
var C=window.CPX,$=C.$,last='',prevU='mi',KM=1.609344,L_GAL=3.785411784,K=235.215;
var CLASSES=[['directions_car','Compact',34],['directions_car','Mid-size sedan',28],['airport_shuttle','SUV',22],['local_shipping','Pickup',17],['electric_bolt','Hybrid',48]];
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','g1','g2','g3','g4'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('rate','—');C.text('rateTxt','—');C.text('metric','—');C.text('fxLive','—');C.text('interp','Fix the input above to see the result.');last='';}
function p(x,d){return C.num(x,d);}
function rating(mpg){return mpg>=45?['Excellent','Hybrid-level economy.']:mpg>=30?['Good','Better than the typical new car.']:mpg>=22?['Average','Typical for sedans and crossovers.']:['Thirsty','Large vehicles use the most fuel.'];}
function compute(){
  var km=$('du').value==='km',rt=$('rt').value==='1',mult=rt?2:1;
  if(km!==(prevU==='km')){
    var d=C.val('dist'),e=C.val('eff'),pr=C.val('price');
    $('dist').value=+(km?d*KM:d/KM).toFixed(2);
    if(e>0)$('eff').value=+(K/e).toFixed(2);
    $('price').value=+(km?pr/L_GAL:pr*L_GAL).toFixed(4);
    prevU=km?'km':'mi';
  }
  C.text('dU',km?'kilometres':'miles');C.text('eU',km?'litres per 100 km':'miles per gallon (US)');C.text('pU',km?'per litre':'per gallon');
  $('err').hidden=true;
  var dist=C.val('dist'),eff=C.val('eff'),price=C.val('price'),n=Math.max(1,Math.round(C.val('ppl')));
  if(!(dist>0))return fail('Enter the trip distance.');
  if(!(eff>0))return fail('Enter the fuel economy above zero.');
  if(!(price>=0))return fail('Enter the fuel price.');
  var tot=dist*mult,mpg=km?K/eff:eff,fuel=km?tot*eff/100:tot/eff,cost=fuel*price,cpd=cost/tot,fu=km?'L':'gal',du=km?'km':'mi';
  C.text('resultValue',C.money(cost,2));
  C.text('tag',C.money(cpd,3)+' per '+du);
  C.text('interp',p(tot,1)+' '+du+(rt?' round trip':'')+' at '+(km?p(eff,1)+' L/100 km':p(eff,1)+' MPG')+' uses '+p(fuel,2)+(km?' litres':' gallons')+' at '+C.money(price,2)+' per '+(km?'litre':'gallon')+'.');
  C.text('g1L',km?'Litres needed':'Gallons needed');C.text('g1',p(fuel,2)+' '+fu);
  C.text('g2L','Cost per '+du);C.text('g2',C.money(cpd,3));
  C.text('g3',p(tot,1)+' '+du);C.text('g4',C.money(cost/n,2));
  var r=rating(mpg);C.text('rate',r[0]);C.text('rateTxt',r[1]+' About '+p(mpg,1)+' MPG, or '+p(K/mpg,1)+' L/100 km.');
  $('mark').style.left=Math.max(3,Math.min(97,mpg/60*100))+'%';
  var galUS=km?fuel/L_GAL:fuel,miles=km?tot/KM:tot;
  C.text('metric',km?p(miles,1)+' miles, '+p(galUS,2)+' US gallons at about '+p(mpg,1)+' MPG.':p(tot*KM,1)+' km, '+p(fuel*L_GAL,1)+' litres at '+p(K/mpg,2)+' L/100 km.');
  C.text('fxLive',km?p(tot,1)+' × '+p(eff,1)+' ÷ 100 = '+p(fuel,2)+' L\n'+p(fuel,2)+' × '+C.money(price,2)+' = '+C.money(cost,2):p(tot,1)+' ÷ '+p(eff,1)+' = '+p(fuel,2)+' gal\n'+p(fuel,2)+' × '+C.money(price,2)+' = '+C.money(cost,2));
  $('fxLive').style.whiteSpace='pre-line';
  last='Fuel cost — calculatepilot.com/other/fuel-cost-calculator.html\n'+p(tot,1)+' '+du+(rt?' (round trip)':'')+' at '+(km?p(eff,1)+' L/100 km':p(eff,1)+' MPG')+': '+p(fuel,2)+' '+fu+' × '+C.money(price,2)+' = '+C.money(cost,2)+(n>1?' ('+C.money(cost/n,2)+' each for '+n+')':'');
  var pg=km?price*L_GAL:price,h='';
  C.text('matP',p(tot,0)+' '+du+(rt?' round trip':'')+' at '+C.money(price,2)+(km?' per litre':' per gallon'));
  C.text('thE',km?'L/100 km':'MPG');C.text('thF',km?'Litres':'Gallons');C.text('thM','Cost / '+du);
  CLASSES.forEach(function(c){var gal=miles/c[2],cs=gal*pg,f=km?gal*L_GAL:gal;h+='<tr><td class="a"><span class="msym" aria-hidden="true" style="vertical-align:-5px;color:var(--sx-pc)">'+c[0]+'</span> '+c[1]+'</td><td class="n">'+(km?p(K/c[2],1):c[2])+'</td><td class="n">'+p(f,2)+'</td><td class="n">'+C.money(cs,2)+'</td><td class="n">'+C.money(cs/tot,3)+'</td><td><button type="button" class="sx-reset" data-load="'+c[2]+'" style="padding:4px 10px;border:1px solid var(--sx-border);border-radius:6px">Load</button></td></tr>';});
  $('matrix').querySelector('tbody').innerHTML=h;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
