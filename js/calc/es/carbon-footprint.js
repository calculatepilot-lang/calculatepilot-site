/* Driving carbon footprint calculator — CalculatePilot (Stitch redesign).
   EPA factors: gasoline 8,887 g CO2/gal, diesel 10,180 g CO2/gal, urban tree seedling 0.060 t CO2 over 10 years. EV: kWh/mi × 1.05 (line loss) × g/kWh. */
(function(){
var C=window.CPX,$=C.$,last='',prevU='i',prevT='g';
var GAS=8887,DIE=10180,MI=1.609344,GAL=3.785411784,LOSS=1.05,TREE=0.06;
var DEF={g:26,d:30,h:50,e:0.30};
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oPm','oPk','o3','o4','oTr','oOf'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function effToImp(v,t,metric){if(!metric)return v;return t==='e'?v*MI/100:235.215/v;}
function effFromImp(v,t,metric){if(!metric)return v;return t==='e'?v*100/MI:235.215/v;}
function fmtT(kg){return kg>=1000?C.num(kg/1000,2)+' t':C.num(kg,0)+' kg';}
function compute(){
  var u=$('un').value,t=$('vt').value,metric=u==='m',ev=t==='e',per=$('per').value;
  /* unit or vehicle change: convert or reset the efficiency box */
  if(u!==prevU||t!==prevT){var wasMetric=prevU==='m';
    if(t!==prevT){$('ef').value=+effFromImp(DEF[t],t,metric).toFixed(2);}
    else{var imp=effToImp(C.val('ef'),t,wasMetric);$('ef').value=+effFromImp(imp,t,metric).toFixed(2);var d=C.val('ds');$('ds').value=+(wasMetric?d/MI:d*MI).toFixed(1);}
    prevU=u;prevT=t;}
  $('gGrid').hidden=!ev;$('efP').hidden=ev||metric;
  C.text('dsL','Distancia '+(per==='y'?'recorridos al año':'del viaje'));C.text('dsU',metric?'kilometres':'miles');
  C.text('efL',ev?'Consumo eléctrico':'Consumo de combustible');C.text('efU',ev?(metric?'kWh por 100 km':'kWh por milla'):(metric?'litros por 100 km':'mpg, combinado'));
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  $('err').hidden=true;
  var ds=C.val('ds'),ef=C.val('ef'),gr=C.val('gr'),op=C.val('op');
  if(!(ds>0))return fail('Introduce una distancia.');if(!(ef>0))return fail('Introduce '+(ev?'el consumo eléctrico.':'el consumo de combustible.'));
  var mi=metric?ds/MI:ds,eff=effToImp(ef,t,metric),kg,unit,fuel;
  if(ev){var kwh=mi*eff*LOSS;kg=kwh*gr/1000;fuel=kwh;}else{var gal=mi/eff;kg=gal*(t==='d'?DIE:GAS)/1000;fuel=gal;}
  var perMi=kg*1000/mi,tonnes=kg/1000,months=per==='y';
  C.text('hL',per==='y'?'Emisiones por año':'Emisiones de este viaje');
  C.text('resultValue',tonnes>=1?C.num(tonnes,2):C.num(kg,1));C.text('resU',tonnes>=1?'toneladas de CO₂e':'kg de CO₂e');
  C.text('tag',({g:'gasoline',d:'diesel',h:'hybrid',e:'electric'})[t]);
  C.text('interp',ev?C.num(fuel,0)+' kWh a '+gr+' g de CO₂e por kWh (incluye un 5 % de pérdidas en la red).':(metric?C.num(fuel*GAL,0)+' litres':C.num(fuel,1)+' gallons')+' of '+(t==='d'?'diesel':'gasoline')+' at '+(t==='d'?'10,180':'8,887')+' g de CO₂ por galón.');
  C.text('oPm',C.num(perMi,0)+' g');C.text('oPk',C.num(perMi/MI,0)+' g');
  if(ev){C.text('l3','Electricidad utilizada');C.text('o3',C.num(fuel,0)+' kWh');}else{C.text('l3','Combustible usado');C.text('o3',metric?C.num(fuel*GAL,0)+' L':C.num(fuel,1)+' gal');}
  if(months){C.text('l4','Por mes');C.text('o4',fmtT(kg/12));}else{C.text('l4','Por 100 millas');C.text('o4',fmtT(perMi*100/1000));}
  C.text('oTr',C.num(tonnes/TREE,0));C.text('oOf',C.money(tonnes*op,2));C.text('oOfN','at '+C.money(op,0)+' por tonelada');
  var g0=mi/DEF.g*GAS/1000/1000,h0=mi/52*GAS/1000/1000,e0=mi*0.30*LOSS*(gr>0?gr:386)/1e6;
  var opts=[['Gasolina, 26 mpg',g0],['Híbrido, 52 mpg',h0],['Electric, 0.30 kWh/mi on this grid',e0]];
  $('rows').innerHTML=opts.map(function(o){var d=(o[1]-tonnes)/tonnes*100;return '<tr><td class="a">'+o[0]+'</td><td class="n">'+C.num(o[1],2)+'</td><td class="n">'+(Math.abs(d)<0.5?'prácticamente lo mismo':(d>0?'+':'−')+Math.abs(d).toFixed(0)+'%')+'</td></tr>';}).join('');
  last='Huella de carbono al conducir — calculatepilot.com/other/carbon-footprint-calculator.html\n'+C.num(mi,0)+' mi, '+$('tag').textContent+': '+C.num(tonnes,2)+' toneladas de CO₂e ('+C.num(perMi,0)+' g por milla), '+C.num(tonnes/TREE,0)+' plántulas de árbol';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'cbCalc',compute:compute});
  function put(id,v){$(id).value=v;$(id).dispatchEvent(new Event('input',{bubbles:true}));}
  document.querySelectorAll('[data-y]').forEach(function(b){b.addEventListener('click',function(){var v=+b.getAttribute('data-y');put('ds',$('un').value==='m'?Math.round(v*MI):v);});});
  document.querySelectorAll('[data-e]').forEach(function(b){b.addEventListener('click',function(){put('ef',b.getAttribute('data-e'));});});
  document.querySelectorAll('[data-g]').forEach(function(b){b.addEventListener('click',function(){put('gr',b.getAttribute('data-g'));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
