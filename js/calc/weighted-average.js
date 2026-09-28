/* Weighted average calculator — CalculatePilot (Stitch redesign).
   x̄w = Σ(w·x) ÷ Σw. Simple mean = Σx ÷ n over the same complete rows. Weight share = w ÷ Σw. */
(function(){
var C=window.CPX,$=C.$,M=C.math,last='',csv=[];

var PRESETS={
  grades:{mode:'s1',rows:[['Homework',78,20],['Midterm exam',85,30],['Final exam',92,50]]},
  gpa:{mode:'s2',rows:[['Calculus (A = 4.0)',4,4],['Physics (B+ = 3.3)',3.3,3],['English (A− = 3.7)',3.7,3],['Seminar (B = 3.0)',3,1]]},
  port:{mode:'s2',rows:[['Stock A (return %)',12,50000],['Stock B (return %)',8,30000],['Bonds (return %)',4,20000]]},
  vendor:{mode:'s1',rows:[['Security',8,40],['Cost',6,30],['Usability',9,20],['Design',7,10]]},
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
function renumber(){[].forEach.call($('rows').children,function(tr,i){tr.children[0].textContent=i+1;tr.querySelector('.nm').setAttribute('aria-label','Item '+(i+1)+' name');tr.querySelector('.vx').setAttribute('aria-label','Item '+(i+1)+' value');tr.querySelector('.wx').setAttribute('aria-label','Item '+(i+1)+' weight');});}
function load(key){var p=PRESETS[key];$('rows').innerHTML='';p.rows.forEach(function(r){addRow(r[0],r[1],r[2]);});renumber();$('pctMode').value=p.mode;fire();}
function fire(){$('pctMode').dispatchEvent(new Event('input',{bubbles:true}));}

function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','sw','um','impV'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Add at least one row with both a value and a weight.');C.text('wNote','—');$('steps').innerHTML='';[].forEach.call($('rows').children,function(tr){tr.querySelector('.sh').textContent='—';});last='';csv=[];}

function compute(){
  var dp=+$('prec').value,pm=$('pctMode').value==='s1',trs=[].slice.call($('rows').children),items=[];
  C.text('wHelp',pm?'Weights are percentages of the whole, so they should total 100. Any other total is rescaled.':'Weights are any size measure — credits, dollars, counts. They are rescaled by their total.');
  C.text('rowN',trs.length+' row'+(trs.length===1?'':'s'));$('err').hidden=true;renumber();
  trs.forEach(function(tr,i){var v=parseFloat(tr.querySelector('.vx').value),w=parseFloat(tr.querySelector('.wx').value);if(isFinite(v)&&isFinite(w))items.push({tr:tr,name:tr.querySelector('.nm').value.trim()||'Item '+(i+1),x:v,w:w});});
  if(!items.length)return fail('Enter a value and a weight in at least one row.');
  var sw=0,swx=0,sx=0;items.forEach(function(it){sw+=it.w;swx+=it.w*it.x;sx+=it.x;});
  if(sw===0)return fail('The weights add up to 0, so the weighted average is undefined. Give at least one item a non-zero weight.');
  var wm=swx/sw,um=sx/items.length,imp=wm-um;
  trs.forEach(function(tr){tr.querySelector('.sh').textContent='—';});items.forEach(function(it){it.tr.querySelector('.sh').textContent=(it.w/sw*100).toFixed(1)+'%';});
  C.text('resultValue',fixd(wm,dp));C.text('sw',num(sw,4));C.text('um',fixd(um,dp));
  var sg=imp>0?'+':imp<0?'−':'',pc=um!==0?' ('+sg+Math.abs(imp/um*100).toFixed(2)+'%)':'';C.text('impV',sg+fixd(Math.abs(imp),dp)+pc);
  $('impact').className='gain'+(Math.abs(imp)<1e-12?' neg':imp>0?'':' neg');
  var t=$('tag');t.textContent=Math.abs(imp)<1e-12?'Equals simple average':imp>0?'Above simple average':'Below simple average';t.className='sx-ef-grade'+(Math.abs(imp)<1e-12?'':imp>0?'':' mid');
  C.text('interp','Based on '+items.length+' row'+(items.length===1?'':'s')+'. Weighting moves the result '+(Math.abs(imp)<1e-12?'nowhere — the weights are effectively equal.':(imp>0?'up':'down')+' by '+fixd(Math.abs(imp),dp)+' compared with the simple average.'));
  var neg=items.some(function(it){return it.w<0;}),notes=[];
  if(pm){if(Math.abs(sw-100)<1e-9)notes.push('Weights total 100% ✓');else if(Math.abs(sw-1)<1e-9)notes.push('Weights total 1.00 — treated as fractions ✓');else notes.push('Weights total '+num(sw,4)+', not 100 — the result is rescaled by Σw, so it is still a true weighted average.');}
  if(neg){notes.push('A weight is negative, which is unusual — the result can fall outside the range of your values.');}
  C.text('wNote',notes.join(' '));
  var partial=trs.length-items.length;if(partial>0)C.text('wNote',notes.join(' ')+(notes.length?' ':'')+partial+' incomplete row'+(partial===1?' is':'s are')+' ignored.');
  var h='',shown=items.slice(0,12);
  h+='<li><span class="n">1</span><h4>Sum of products (Σ w·x)</h4><p>Multiply each value by its weight and add.</p><span class="eq">'+shown.map(function(it){return num(it.w)+' × '+num(it.x);}).join(' + ')+(items.length>12?' + … ('+(items.length-12)+' more)':'')+'<br>Σ(w·x) = <b>'+esc(num(swx,6))+'</b></span></li>';
  h+='<li><span class="n">2</span><h4>Sum of weights (Σ w)</h4><p>Add the weights.</p><span class="eq">Σw = <b>'+esc(num(sw,6))+'</b></span></li>';
  h+='<li><span class="n">3</span><h4>Divide numerator by denominator</h4><p>The weighted mean.</p><span class="eq">'+esc(num(swx,6))+' ÷ '+esc(num(sw,6))+' = <b>'+esc(num(wm,dp))+'</b></span></li>';
  $('steps').innerHTML=h;
  csv=items.map(function(it){return [it.name,it.x,it.w,it.w*it.x,it.w/sw*100];});
  last='Weighted average — calculatepilot.com/math/weighted-average-calculator.html\n'+items.map(function(it){return it.name+': x = '+num(it.x)+', w = '+num(it.w);}).join('\n')+'\nΣ(w·x) = '+num(swx)+'\nΣw = '+num(sw)+'\nWeighted average = '+num(swx)+' ÷ '+num(sw)+' = '+fixd(wm,dp)+'\nSimple average = '+fixd(um,dp);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  var p=PRESETS.grades;p.rows.forEach(function(r){addRow(r[0],r[1],r[2]);});
  C.init({root:'waCalc',compute:compute});
  $('ex').addEventListener('change',function(){load(this.value);});
  $('addRow').addEventListener('click',function(){addRow('',NaN,NaN);renumber();fire();var r=$('rows').lastElementChild;if(r)r.querySelector('.nm').focus();});
  $('rows').addEventListener('click',function(e){var b=e.target.closest('button.x');if(!b)return;var tr=b.closest('tr');if($('rows').children.length>1){tr.remove();renumber();fire();}else{tr.querySelectorAll('input').forEach(function(i){i.value='';});fire();}});
  document.querySelector('#waCalc [data-action=reset]').addEventListener('click',function(){$('ex').value='grades';load('grades');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy steps');});
  $('csvBtn').addEventListener('click',function(){if(!csv.length)return;C.csv('weighted-average.csv',[{h:'Item',key:0},{h:'Value (x)',key:1},{h:'Weight (w)',key:2},{h:'w × x',key:3},{h:'Share of weight (%)',key:4}],csv);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
