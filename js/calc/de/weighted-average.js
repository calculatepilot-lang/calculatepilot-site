/* Weighted average calculator — CalculatePilot (Stitch redesign).
   x̄w = Σ(w·x) ÷ Σw. Simple mean = Σx ÷ n over the same complete rows. Weight share = w ÷ Σw. */
(function(){
var C=window.CPX,$=C.$,M=C.math,last='',csv=[];

var PRESETS={
  grades:{mode:'s1',rows:[['Hausaufgaben',78,20],['Zwischenprüfung',85,30],['Abschlussprüfung',92,50]]},
  gpa:{mode:'s2',rows:[['Analysis (A = 4,0)',4,4],['Physik (B+ = 3,3)',3.3,3],['Englisch (A− = 3,7)',3.7,3],['Seminar (B = 3,0)',3,1]]},
  port:{mode:'s2',rows:[['Aktie A (Rendite %)',12,50000],['Aktie B (Rendite %)',8,30000],['Anleihen (Rendite %)',4,20000]]},
  vendor:{mode:'s1',rows:[['Sicherheit',8,40],['Aufwand',6,30],['Benutzerfreundlichkeit',9,20],['Design',7,10]]},
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
function renumber(){[].forEach.call($('rows').children,function(tr,i){tr.children[0].textContent=i+1;tr.querySelector('.nm').setAttribute('aria-label','Position '+(i+1)+' name');tr.querySelector('.vx').setAttribute('aria-label','Position '+(i+1)+' value');tr.querySelector('.wx').setAttribute('aria-label','Position '+(i+1)+' weight');});}
function load(key){var p=PRESETS[key];$('rows').innerHTML='';p.rows.forEach(function(r){addRow(r[0],r[1],r[2]);});renumber();$('pctMode').value=p.mode;fire();}
function fire(){$('pctMode').dispatchEvent(new Event('input',{bubbles:true}));}

function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','sw','um','impV'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fügen Sie mindestens eine Zeile mit Wert und Gewichtung hinzu.');C.text('wNote','—');$('steps').innerHTML='';[].forEach.call($('rows').children,function(tr){tr.querySelector('.sh').textContent='—';});last='';csv=[];}

function compute(){
  var dp=+$('prec').value,pm=$('pctMode').value==='s1',trs=[].slice.call($('rows').children),items=[];
  C.text('wHelp',pm?'Gewichtungen sind Prozentanteile des Ganzen und sollten sich zu 100 summieren. Jede andere Summe wird umskaliert.':'Gewichtungen können beliebige Größenmaße sein — Credits, Dollar, Anzahlen. Sie werden anhand ihrer Summe umskaliert.');
  C.text('rowN',trs.length+' row'+(trs.length===1?'':'s'));$('err').hidden=true;renumber();
  trs.forEach(function(tr,i){var v=parseFloat(tr.querySelector('.vx').value),w=parseFloat(tr.querySelector('.wx').value);if(isFinite(v)&&isFinite(w))items.push({tr:tr,name:tr.querySelector('.nm').value.trim()||'Position '+(i+1),x:v,w:w});});
  if(!items.length)return fail('Geben Sie in mindestens einer Zeile einen Wert und eine Gewichtung ein.');
  var sw=0,swx=0,sx=0;items.forEach(function(it){sw+=it.w;swx+=it.w*it.x;sx+=it.x;});
  if(sw===0)return fail('Die Gewichtungen summieren sich zu 0, daher ist der gewichtete Mittelwert nicht definiert. Geben Sie mindestens einem Eintrag eine Gewichtung ungleich null.');
  var wm=swx/sw,um=sx/items.length,imp=wm-um;
  trs.forEach(function(tr){tr.querySelector('.sh').textContent='—';});items.forEach(function(it){it.tr.querySelector('.sh').textContent=(it.w/sw*100).toFixed(1)+'%';});
  C.text('resultValue',fixd(wm,dp));C.text('sw',num(sw,4));C.text('um',fixd(um,dp));
  var sg=imp>0?'+':imp<0?'−':'',pc=um!==0?' ('+sg+Math.abs(imp/um*100).toFixed(2)+'%)':'';C.text('impV',sg+fixd(Math.abs(imp),dp)+pc);
  $('impact').className='gain'+(Math.abs(imp)<1e-12?' neg':imp>0?'':' neg');
  var t=$('tag');t.textContent=Math.abs(imp)<1e-12?'Entspricht dem einfachen Mittelwert':imp>0?'Über dem einfachen Mittelwert':'Unter dem einfachen Mittelwert';t.className='sx-ef-grade'+(Math.abs(imp)<1e-12?'':imp>0?'':' mid');
  C.text('interp','Basierend auf '+items.length+' row'+(items.length===1?'':'s')+'. Weighting moves the result '+(Math.abs(imp)<1e-12?'nirgends — die Gewichtungen sind praktisch gleich.':(imp>0?'up':'down')+' by '+fixd(Math.abs(imp),dp)+' im Vergleich zum einfachen Mittelwert.'));
  var neg=items.some(function(it){return it.w<0;}),notes=[];
  if(pm){if(Math.abs(sw-100)<1e-9)notes.push('Gewichtungen summieren sich zu 100 % ✓');else if(Math.abs(sw-1)<1e-9)notes.push('Gewichtungen summieren sich zu 1,00 — als Bruchteile behandelt ✓');else notes.push('Gewichtungen summieren sich zu '+num(sw,4)+', nicht 100 — das Ergebnis wird durch Σw umskaliert und ist daher weiterhin ein korrekter gewichteter Mittelwert.');}
  if(neg){notes.push('Eine Gewichtung ist negativ, was ungewöhnlich ist — das Ergebnis kann außerhalb des Wertebereichs Ihrer Werte liegen.');}
  C.text('wNote',notes.join(' '));
  var partial=trs.length-items.length;if(partial>0)C.text('wNote',notes.join(' ')+(notes.length?' ':'')+partial+' unvollständige Zeile'+(partial===1?' is':'n werden')+' ignoriert.');
  var h='',shown=items.slice(0,12);
  h+='<li><span class="n">1</span><h4>Summe der Produkte (Σ w·x)</h4><p>Multiplizieren Sie jeden Wert mit seiner Gewichtung und addieren Sie.</p><span class="eq">'+shown.map(function(it){return num(it.w)+' × '+num(it.x);}).join(' + ')+(items.length>12?' + … ('+(items.length-12)+' weitere)':'')+'<br>Σ(w·x) = <b>'+esc(num(swx,6))+'</b></span></li>';
  h+='<li><span class="n">2</span><h4>Summe der Gewichtungen (Σ w)</h4><p>Addieren Sie die Gewichtungen.</p><span class="eq">Σw = <b>'+esc(num(sw,6))+'</b></span></li>';
  h+='<li><span class="n">3</span><h4>Zähler durch Nenner teilen</h4><p>Der gewichtete Mittelwert.</p><span class="eq">'+esc(num(swx,6))+' ÷ '+esc(num(sw,6))+' = <b>'+esc(num(wm,dp))+'</b></span></li>';
  $('steps').innerHTML=h;
  csv=items.map(function(it){return [it.name,it.x,it.w,it.w*it.x,it.w/sw*100];});
  last='Gewichteter Mittelwert — calculatepilot.com/math/weighted-average-calculator.html\n'+items.map(function(it){return it.name+': x = '+num(it.x)+', w = '+num(it.w);}).join('\n')+'\nΣ(w·x) = '+num(swx)+'\nΣw = '+num(sw)+'\nGewichteter Mittelwert = '+num(swx)+' ÷ '+num(sw)+' = '+fixd(wm,dp)+'\nEinfacher Mittelwert = '+fixd(um,dp);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  var p=PRESETS.grades;p.rows.forEach(function(r){addRow(r[0],r[1],r[2]);});
  C.init({root:'waCalc',compute:compute});
  $('ex').addEventListener('change',function(){load(this.value);});
  $('addRow').addEventListener('click',function(){addRow('',NaN,NaN);renumber();fire();var r=$('rows').lastElementChild;if(r)r.querySelector('.nm').focus();});
  $('rows').addEventListener('click',function(e){var b=e.target.closest('button.x');if(!b)return;var tr=b.closest('tr');if($('rows').children.length>1){tr.remove();renumber();fire();}else{tr.querySelectorAll('input').forEach(function(i){i.value='';});fire();}});
  document.querySelector('#waCalc [data-action=reset]').addEventListener('click',function(){$('ex').value='grades';load('grades');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Schritte kopieren');});
  $('csvBtn').addEventListener('click',function(){if(!csv.length)return;C.csv('weighted-average.csv',[{h:'Position',key:0},{h:'Wert (x)',key:1},{h:'Gewicht (w)',key:2},{h:'w × x',key:3},{h:'Gewichtungsanteil (%)',key:4}],csv);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
