/* Weighted average calculator — CalculatePilot (Stitch redesign).
   x̄w = Σ(w·x) ÷ Σw. Simple mean = Σx ÷ n over the same complete rows. Weight share = w ÷ Σw. */
(function(){
var C=window.CPX,$=C.$,M=C.math,last='',csv=[];

var PRESETS={
  grades:{mode:'s1',rows:[['Devoirs',78,20],['Examen de mi-session',85,30],['Examen final',92,50]]},
  gpa:{mode:'s2',rows:[['Analyse (A = 4,0)',4,4],['Physique (B+ = 3,3)',3.3,3],['Anglais (A− = 3,7)',3.7,3],['Séminaire (B = 3,0)',3,1]]},
  port:{mode:'s2',rows:[['Action A (rendement %)',12,50000],['Action B (rendement %)',8,30000],['Obligations (rendement %)',4,20000]]},
  vendor:{mode:'s1',rows:[['Sécurité',8,40],['Coût',6,30],['Facilité d\'utilisation',9,20],['Design',7,10]]},
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
function renumber(){[].forEach.call($('rows').children,function(tr,i){tr.children[0].textContent=i+1;tr.querySelector('.nm').setAttribute('aria-label','Élément '+(i+1)+' name');tr.querySelector('.vx').setAttribute('aria-label','Élément '+(i+1)+' value');tr.querySelector('.wx').setAttribute('aria-label','Élément '+(i+1)+' weight');});}
function load(key){var p=PRESETS[key];$('rows').innerHTML='';p.rows.forEach(function(r){addRow(r[0],r[1],r[2]);});renumber();$('pctMode').value=p.mode;fire();}
function fire(){$('pctMode').dispatchEvent(new Event('input',{bubbles:true}));}

function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','sw','um','impV'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Ajoutez au moins une ligne avec une valeur et un poids.');C.text('wNote','—');$('steps').innerHTML='';[].forEach.call($('rows').children,function(tr){tr.querySelector('.sh').textContent='—';});last='';csv=[];}

function compute(){
  var dp=+$('prec').value,pm=$('pctMode').value==='s1',trs=[].slice.call($('rows').children),items=[];
  C.text('wHelp',pm?'Les poids sont des pourcentages du total ; ils devraient donc totaliser 100. Tout autre total est mis à l\'échelle.':'Les poids peuvent être n\'importe quelle mesure de taille — crédits, dollars, quantités. Ils sont mis à l\'échelle selon leur total.');
  C.text('rowN',trs.length+' row'+(trs.length===1?'':'s'));$('err').hidden=true;renumber();
  trs.forEach(function(tr,i){var v=parseFloat(tr.querySelector('.vx').value),w=parseFloat(tr.querySelector('.wx').value);if(isFinite(v)&&isFinite(w))items.push({tr:tr,name:tr.querySelector('.nm').value.trim()||'Élément '+(i+1),x:v,w:w});});
  if(!items.length)return fail('Saisissez une valeur et un poids dans au moins une ligne.');
  var sw=0,swx=0,sx=0;items.forEach(function(it){sw+=it.w;swx+=it.w*it.x;sx+=it.x;});
  if(sw===0)return fail('Les poids totalisent 0 ; la moyenne pondérée est donc indéfinie. Donnez un poids non nul à au moins un élément.');
  var wm=swx/sw,um=sx/items.length,imp=wm-um;
  trs.forEach(function(tr){tr.querySelector('.sh').textContent='—';});items.forEach(function(it){it.tr.querySelector('.sh').textContent=(it.w/sw*100).toFixed(1)+'%';});
  C.text('resultValue',fixd(wm,dp));C.text('sw',num(sw,4));C.text('um',fixd(um,dp));
  var sg=imp>0?'+':imp<0?'−':'',pc=um!==0?' ('+sg+Math.abs(imp/um*100).toFixed(2)+'%)':'';C.text('impV',sg+fixd(Math.abs(imp),dp)+pc);
  $('impact').className='gain'+(Math.abs(imp)<1e-12?' neg':imp>0?'':' neg');
  var t=$('tag');t.textContent=Math.abs(imp)<1e-12?'Égale la moyenne simple':imp>0?'Supérieure à la moyenne simple':'Inférieure à la moyenne simple';t.className='sx-ef-grade'+(Math.abs(imp)<1e-12?'':imp>0?'':' mid');
  C.text('interp','Basé sur '+items.length+' row'+(items.length===1?'':'s')+'. Weighting moves the result '+(Math.abs(imp)<1e-12?'nulle part — les poids sont en pratique égaux.':(imp>0?'up':'down')+' by '+fixd(Math.abs(imp),dp)+' par rapport à la moyenne simple.'));
  var neg=items.some(function(it){return it.w<0;}),notes=[];
  if(pm){if(Math.abs(sw-100)<1e-9)notes.push('Total des poids : 100 % ✓');else if(Math.abs(sw-1)<1e-9)notes.push('Total des poids : 1,00 — traités comme des fractions ✓');else notes.push('Total des poids : '+num(sw,4)+', et non 100 — le résultat est mis à l\'échelle par Σw ; il reste donc une véritable moyenne pondérée.');}
  if(neg){notes.push('Un poids est négatif, ce qui est inhabituel — le résultat peut sortir de la plage de vos valeurs.');}
  C.text('wNote',notes.join(' '));
  var partial=trs.length-items.length;if(partial>0)C.text('wNote',notes.join(' ')+(notes.length?' ':'')+partial+' ligne incomplète'+(partial===1?' is':'s sont')+' ignorées.');
  var h='',shown=items.slice(0,12);
  h+='<li><span class="n">1</span><h4>Somme des produits (Σ w·x)</h4><p>Multipliez chaque valeur par son poids, puis additionnez.</p><span class="eq">'+shown.map(function(it){return num(it.w)+' × '+num(it.x);}).join(' + ')+(items.length>12?' + … ('+(items.length-12)+' de plus)':'')+'<br>Σ(w·x) = <b>'+esc(num(swx,6))+'</b></span></li>';
  h+='<li><span class="n">2</span><h4>Somme des poids (Σ w)</h4><p>Additionnez les poids.</p><span class="eq">Σw = <b>'+esc(num(sw,6))+'</b></span></li>';
  h+='<li><span class="n">3</span><h4>Divisez le numérateur par le dénominateur</h4><p>La moyenne pondérée.</p><span class="eq">'+esc(num(swx,6))+' ÷ '+esc(num(sw,6))+' = <b>'+esc(num(wm,dp))+'</b></span></li>';
  $('steps').innerHTML=h;
  csv=items.map(function(it){return [it.name,it.x,it.w,it.w*it.x,it.w/sw*100];});
  last='Moyenne pondérée — calculatepilot.com/math/weighted-average-calculator.html\n'+items.map(function(it){return it.name+' : x = '+num(it.x)+', w = '+num(it.w);}).join('\n')+'\nΣ(w·x) = '+num(swx)+'\nΣw = '+num(sw)+'\nMoyenne pondérée = '+num(swx)+' ÷ '+num(sw)+' = '+fixd(wm,dp)+'\nMoyenne simple = '+fixd(um,dp);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  var p=PRESETS.grades;p.rows.forEach(function(r){addRow(r[0],r[1],r[2]);});
  C.init({root:'waCalc',compute:compute});
  $('ex').addEventListener('change',function(){load(this.value);});
  $('addRow').addEventListener('click',function(){addRow('',NaN,NaN);renumber();fire();var r=$('rows').lastElementChild;if(r)r.querySelector('.nm').focus();});
  $('rows').addEventListener('click',function(e){var b=e.target.closest('button.x');if(!b)return;var tr=b.closest('tr');if($('rows').children.length>1){tr.remove();renumber();fire();}else{tr.querySelectorAll('input').forEach(function(i){i.value='';});fire();}});
  document.querySelector('#waCalc [data-action=reset]').addEventListener('click',function(){$('ex').value='grades';load('grades');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les étapes');});
  $('csvBtn').addEventListener('click',function(){if(!csv.length)return;C.csv('weighted-average.csv',[{h:'Élément',key:0},{h:'Valeur (x)',key:1},{h:'Coefficient (w)',key:2},{h:'w × x',key:3},{h:'Part du poids (%)',key:4}],csv);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
