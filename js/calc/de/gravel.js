/* Gravel & aggregate calculator — CalculatePilot (Stitch redesign).
   yd³ = area × depth(in) ÷ 12 ÷ 27; tons = yd³ × density(lb/yd³) × (1 + compaction) ÷ 2000; bags = ceil(lb ÷ 50).
   Densities are typical loose bulk densities (ASTM C29) and vary by quarry, so a ticket density can be entered. */
(function(){
var C=window.CPX,$=C.$,last='',xn=0;
var AGG={'57':['Schotter Nr. 57',2700],pea:['Erbsenkies',2600],cr:['Brechsand-Splitt-Gemisch',2950],river:['Flusskiesel',2500],dg:['Granitsplitt (zersetzter Granit)',2800]};
function n0(x){return C.num(x,0);}
function extras(){var a=0,q=0;document.querySelectorAll('#extras > div').forEach(function(r){var ar=parseFloat(r.querySelector('.xa').value)||0,d=parseFloat(r.querySelector('.xd').value)||0;a+=ar;q+=ar*d/12;});return {area:a,ft3:q};}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oYd','oFt','oNet','oA','cBulk','cBag'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um die Schätzung zu sehen.');last='';}
function compute(){
  var mode=$('mode').value;$('g-r').hidden=mode!=='r';$('g-c').hidden=mode!=='c';$('g-a').hidden=mode!=='a';$('extraWrap').hidden=!$('extras').children.length;
  var area=mode==='r'?C.val('L')*C.val('W'):mode==='c'?Math.PI*(Math.pow(C.val('D')/2,2)-Math.pow(C.val('Di')/2,2)):C.val('A'),dep=C.val('dep'),ex=extras();
  var a=AGG[$('agg').value],dens=$('cd').value!==''?C.val('cd'):a[1],cp=C.val('cp');
  C.text('aggN',$('cd').value!==''?'custom '+n0(dens)+' lb/yd³':a[0]+' · '+n0(dens)+' lb/yd³');C.text('cpV','+'+cp+'%');
  $('err').hidden=true;
  var ft3=area*dep/12+ex.ft3,tot=area+ex.area;
  if(!(tot>0&&ft3>0))return fail('Geben Sie eine Fläche und eine Tiefe über null ein.');
  if(mode==='c'&&C.val('Di')>=C.val('D'))return fail('Die innere Aussparung muss kleiner sein als der Außendurchmesser.');
  if(!(dens>0))return fail('Geben Sie eine Steindichte über null ein.');
  var yd=ft3/27,lb=yd*dens,net=lb/2000,tons=net*(1+cp/100),lbG=lb*(1+cp/100),bags=Math.ceil(lbG/50-1e-9);
  C.text('resultValue',C.num(tons,2));C.text('tag','+'+cp+'% Zuschlag');
  C.text('interp',C.num(tot,0)+' sq ft, '+C.num(ft3,1)+' ft³ von '+a[0].toLowerCase()+' at '+n0(dens)+' lb pro Kubikyard.');
  C.text('oYd',C.num(yd,2)+' yd³');C.text('oFt',C.num(ft3,1)+' ft³');C.text('oNet',C.num(net,2)+' tons');C.text('oA',n0(tot)+' sq ft');
  var pt=C.val('pt'),fr=C.val('fr'),pb=C.val('pb'),bulk=tons*pt+fr,bag=bags*pb;
  C.text('cBulk',C.money(bulk,2));C.text('cBulkN',C.num(tons,2)+' t × '+C.money(pt,0)+' + '+C.money(fr,0)+' delivery');C.text('cBag',C.money(bag,2));C.text('cBagN',n0(bags)+' Säcke zu '+C.money(pb,2));
  C.text('costN',bulk<bag?'Schüttgut spart '+C.money(bag-bulk,2):'Säcke sparen '+C.money(bulk-bag,2));
  var loads=Math.ceil(tons/12-1e-9);C.text('truck',tons<=0.5?'Eine kleine Menge wie diese lässt sich am einfachsten in Säcken oder als Anhängerladung holen.':'Ein Dreiachs-Kipper fasst etwa 10 bis 14 Tonnen. Diese Bestellung entspricht etwa '+loads+' Lkw-Ladung'+(loads>1?'s':'')+' von 12 Tonnen.');
  last='Kies — calculatepilot.com/other/gravel-calculator.html\n'+C.num(tot,0)+' sq ft, '+a[0]+': '+C.num(yd,2)+' yd³ = '+C.num(net,2)+' Tonnen; mit '+cp+'% Zuschlag '+C.num(tons,2)+' Tonnen ('+n0(bags)+' × 50-lb-Säcke)';
}
function addRow(){
  if($('extras').children.length>=5)return;var d=document.createElement('div');d.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center';
  d.innerHTML='<div class="sx-au-in sm np"><input class="xa" type="number" inputmode="decimal" step="10" min="0" value="200" aria-label="Zone area, sq ft"></div><div class="sx-au-in sm np"><input class="xd" type="number" inputmode="decimal" step="0.25" min="0" value="3" aria-label="Zone depth, inches"></div><button type="button" class="sx-reset" aria-label="Remove zone" style="padding:8px"><span class="msym" aria-hidden="true">close</span></button>';
  d.querySelector('button').addEventListener('click',function(){d.remove();$('mode').dispatchEvent(new Event('input',{bubbles:true}));});$('extras').appendChild(d);$('mode').dispatchEvent(new Event('input',{bubbles:true}));
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'grCalc',compute:compute});
  $('addZone').addEventListener('click',addRow);
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){$('extras').innerHTML='';$('cd').value='';});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
