/* Weighted average calculator — CalculatePilot (Stitch redesign).
   x̄w = Σ(w·x) ÷ Σw. Simple mean = Σx ÷ n over the same complete rows. Weight share = w ÷ Σw. */
(function(){
var C=window.CPX,$=C.$,M=C.math,last='',csv=[];

var PRESETS={
  grades:{mode:'s1',rows:[['Tareas',78,20],['Examen parcial',85,30],['Examen final',92,50]]},
  gpa:{mode:'s2',rows:[['Cálculo (A = 4.0)',4,4],['Física (B+ = 3.3)',3.3,3],['Inglés (A− = 3.7)',3.7,3],['Seminario (B = 3.0)',3,1]]},
  port:{mode:'s2',rows:[['Acción A (rentabilidad %)',12,50000],['Acción B (rentabilidad %)',8,30000],['Bonos (rentabilidad %)',4,20000]]},
  vendor:{mode:'s1',rows:[['Seguridad',8,40],['Coste',6,30],['Usabilidad',9,20],['Diseño',7,10]]},
  blank:{mode:'s1',rows:[['',NaN,NaN],['',NaN,NaN],['',NaN,NaN]]}
};

function esc(s){return C.esc(s);}
function num(x,dp){return M.fmt(x,dp===undefined?6:dp);}
function fixd(x,dp){return isFinite(x)?M.fix(x,dp):'—';}

function addRow(nm,v,w){
  var t=document.getElementById('rowT').content.firstElementChild.cloneNode(true);
  t.querySelector('.nm').value=nm||'';t.querySelector('.vx').value=isFinite(v)?v:'';t.querySelector('.wx').value=isFinite(w)?w:'';
  $('rows').appendChild(t);
}
function renumber(){[].forEach.call($('rows').children,function(tr,i){tr.children[0].textContent=i+1;tr.querySelector('.nm').setAttribute('aria-label','Concepto '+(i+1)+' name');tr.querySelector('.vx').setAttribute('aria-label','Concepto '+(i+1)+' value');tr.querySelector('.wx').setAttribute('aria-label','Concepto '+(i+1)+' weight');});}
function load(key){var p=PRESETS[key];$('rows').innerHTML='';p.rows.forEach(function(r){addRow(r[0],r[1],r[2]);});renumber();$('pctMode').value=p.mode;fire();}
function fire(){$('pctMode').dispatchEvent(new Event('input',{bubbles:true}));}

function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','sw','um','impV'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Añade al menos una fila con un valor y un peso.');C.text('wNote','—');$('steps').innerHTML='';[].forEach.call($('rows').children,function(tr){tr.querySelector('.sh').textContent='—';});last='';csv=[];}

function compute(){
  var dp=+$('prec').value,pm=$('pctMode').value==='s1',trs=[].slice.call($('rows').children),items=[];
  C.text('wHelp',pm?'Los pesos son porcentajes del total, por lo que deberían sumar 100. Cualquier otro total se reescala.':'Los pesos pueden ser cualquier medida de tamaño: créditos, dólares, cantidades. Se reescalan según su total.');
  C.text('rowN',trs.length+' row'+(trs.length===1?'':'s'));$('err').hidden=true;renumber();
  trs.forEach(function(tr,i){var v=parseFloat(tr.querySelector('.vx').value),w=parseFloat(tr.querySelector('.wx').value);if(isFinite(v)&&isFinite(w))items.push({tr:tr,name:tr.querySelector('.nm').value.trim()||'Concepto '+(i+1),x:v,w:w});});
  if(!items.length)return fail('Introduce un valor y un peso en al menos una fila.');
  var sw=0,swx=0,sx=0;items.forEach(function(it){sw+=it.w;swx+=it.w*it.x;sx+=it.x;});
  if(sw===0)return fail('Los pesos suman 0, por lo que el promedio ponderado no está definido. Asigna un peso distinto de cero al menos a un elemento.');
  var wm=swx/sw,um=sx/items.length,imp=wm-um;
  trs.forEach(function(tr){tr.querySelector('.sh').textContent='—';});items.forEach(function(it){it.tr.querySelector('.sh').textContent=(it.w/sw*100).toFixed(1)+'%';});
  C.text('resultValue',fixd(wm,dp));C.text('sw',num(sw,4));C.text('um',fixd(um,dp));
  var sg=imp>0?'+':imp<0?'−':'',pc=um!==0?' ('+sg+Math.abs(imp/um*100).toFixed(2)+'%)':'';C.text('impV',sg+fixd(Math.abs(imp),dp)+pc);
  $('impact').className='gain'+(Math.abs(imp)<1e-12?' neg':imp>0?'':' neg');
  var t=$('tag');t.textContent=Math.abs(imp)<1e-12?'Igual al promedio simple':imp>0?'Por encima del promedio simple':'Por debajo del promedio simple';t.className='sx-ef-grade'+(Math.abs(imp)<1e-12?'':imp>0?'':' mid');
  C.text('interp','Basado en '+items.length+' row'+(items.length===1?'':'s')+'. Weighting moves the result '+(Math.abs(imp)<1e-12?'en ningún punto: los pesos son prácticamente iguales.':(imp>0?'up':'down')+' by '+fixd(Math.abs(imp),dp)+' en comparación con el promedio simple.'));
  var neg=items.some(function(it){return it.w<0;}),notes=[];
  if(pm){if(Math.abs(sw-100)<1e-9)notes.push('Los pesos suman 100% ✓');else if(Math.abs(sw-1)<1e-9)notes.push('Los pesos suman 1.00: se tratan como fracciones ✓');else notes.push('Los pesos suman '+num(sw,4)+', no 100: el resultado se reescala por Σw, así que sigue siendo un verdadero promedio ponderado.');}
  if(neg){notes.push('Un peso es negativo, lo cual es inusual: el resultado puede quedar fuera del rango de tus valores.');}
  C.text('wNote',notes.join(' '));
  var partial=trs.length-items.length;if(partial>0)C.text('wNote',notes.join(' ')+(notes.length?' ':'')+partial+' fila incompleta'+(partial===1?' is':'s se')+' ignoran.');
  var h='',shown=items.slice(0,12);
  h+='<li><span class="n">1</span><h4>Suma de productos (Σ w·x)</h4><p>Multiplica cada valor por su peso y suma.</p><span class="eq">'+shown.map(function(it){return num(it.w)+' × '+num(it.x);}).join(' + ')+(items.length>12?' + … ('+(items.length-12)+' más)':'')+'<br>Σ(w·x) = <b>'+esc(num(swx,6))+'</b></span></li>';
  h+='<li><span class="n">2</span><h4>Suma de pesos (Σ w)</h4><p>Suma los pesos.</p><span class="eq">Σw = <b>'+esc(num(sw,6))+'</b></span></li>';
  h+='<li><span class="n">3</span><h4>Divide el numerador entre el denominador</h4><p>La media ponderada.</p><span class="eq">'+esc(num(swx,6))+' ÷ '+esc(num(sw,6))+' = <b>'+esc(num(wm,dp))+'</b></span></li>';
  $('steps').innerHTML=h;
  csv=items.map(function(it){return [it.name,it.x,it.w,it.w*it.x,it.w/sw*100];});
  last='Promedio ponderado — calculatepilot.com/math/weighted-average-calculator.html\n'+items.map(function(it){return it.name+': x = '+num(it.x)+', w = '+num(it.w);}).join('\n')+'\nΣ(w·x) = '+num(swx)+'\nΣw = '+num(sw)+'\nPromedio ponderado = '+num(swx)+' ÷ '+num(sw)+' = '+fixd(wm,dp)+'\nPromedio simple = '+fixd(um,dp);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  var p=PRESETS.grades;p.rows.forEach(function(r){addRow(r[0],r[1],r[2]);});
  C.init({root:'waCalc',compute:compute});
  $('ex').addEventListener('change',function(){load(this.value);});
  $('addRow').addEventListener('click',function(){addRow('',NaN,NaN);renumber();fire();var r=$('rows').lastElementChild;if(r)r.querySelector('.nm').focus();});
  $('rows').addEventListener('click',function(e){var b=e.target.closest('button.x');if(!b)return;var tr=b.closest('tr');if($('rows').children.length>1){tr.remove();renumber();fire();}else{tr.querySelectorAll('input').forEach(function(i){i.value='';});fire();}});
  document.querySelector('#waCalc [data-action=reset]').addEventListener('click',function(){$('ex').value='grades';load('grades');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar pasos');});
  $('csvBtn').addEventListener('click',function(){if(!csv.length)return;C.csv('weighted-average.csv',[{h:'Concepto',key:0},{h:'Valor (x)',key:1},{h:'Peso (w)',key:2},{h:'w × x',key:3},{h:'Parte del peso (%)',key:4}],csv);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
