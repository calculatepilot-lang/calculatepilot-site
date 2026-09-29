/* Gravel & aggregate calculator — CalculatePilot (Stitch redesign).
   yd³ = area × depth(in) ÷ 12 ÷ 27; tons = yd³ × density(lb/yd³) × (1 + compaction) ÷ 2000; bags = ceil(lb ÷ 50).
   Densities are typical loose bulk densities (ASTM C29) and vary by quarry, so a ticket density can be entered. */
(function(){
var C=window.CPX,$=C.$,last='',xn=0;
var AGG={'57':['Crushed stone #57',2700],pea:['Pea gravel',2600],cr:['Crusher run',2950],river:['River rock',2500],dg:['Decomposed granite',2800]};
function n0(x){return C.num(x,0);}
function extras(){var a=0,q=0;document.querySelectorAll('#extras > div').forEach(function(r){var ar=parseFloat(r.querySelector('.xa').value)||0,d=parseFloat(r.querySelector('.xd').value)||0;a+=ar;q+=ar*d/12;});return {area:a,ft3:q};}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oYd','oFt','oNet','oA','cBulk','cBag'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the estimate.');last='';}
function compute(){
  var mode=$('mode').value;$('g-r').hidden=mode!=='r';$('g-c').hidden=mode!=='c';$('g-a').hidden=mode!=='a';$('extraWrap').hidden=!$('extras').children.length;
  var area=mode==='r'?C.val('L')*C.val('W'):mode==='c'?Math.PI*(Math.pow(C.val('D')/2,2)-Math.pow(C.val('Di')/2,2)):C.val('A'),dep=C.val('dep'),ex=extras();
  var a=AGG[$('agg').value],dens=$('cd').value!==''?C.val('cd'):a[1],cp=C.val('cp');
  C.text('aggN',$('cd').value!==''?'custom '+n0(dens)+' lb/yd³':a[0]+' · '+n0(dens)+' lb/yd³');C.text('cpV','+'+cp+'%');
  $('err').hidden=true;
  var ft3=area*dep/12+ex.ft3,tot=area+ex.area;
  if(!(tot>0&&ft3>0))return fail('Enter an area and a depth above zero.');
  if(mode==='c'&&C.val('Di')>=C.val('D'))return fail('The inner cutout must be smaller than the outer diameter.');
  if(!(dens>0))return fail('Enter a stone density above zero.');
  var yd=ft3/27,lb=yd*dens,net=lb/2000,tons=net*(1+cp/100),lbG=lb*(1+cp/100),bags=Math.ceil(lbG/50-1e-9);
  C.text('resultValue',C.num(tons,2));C.text('tag','+'+cp+'% allowance');
  C.text('interp',C.num(tot,0)+' sq ft, '+C.num(ft3,1)+' ft³ of '+a[0].toLowerCase()+' at '+n0(dens)+' lb per cubic yard.');
  C.text('oYd',C.num(yd,2)+' yd³');C.text('oFt',C.num(ft3,1)+' ft³');C.text('oNet',C.num(net,2)+' tons');C.text('oA',n0(tot)+' sq ft');
  var pt=C.val('pt'),fr=C.val('fr'),pb=C.val('pb'),bulk=tons*pt+fr,bag=bags*pb;
  C.text('cBulk',C.money(bulk,2));C.text('cBulkN',C.num(tons,2)+' t × '+C.money(pt,0)+' + '+C.money(fr,0)+' delivery');C.text('cBag',C.money(bag,2));C.text('cBagN',n0(bags)+' bags at '+C.money(pb,2));
  C.text('costN',bulk<bag?'bulk saves '+C.money(bag-bulk,2):'bags save '+C.money(bulk-bag,2));
  var loads=Math.ceil(tons/12-1e-9);C.text('truck',tons<=0.5?'A small amount like this is easiest to collect in bags or a trailer load.':'A tandem dump truck carries about 10 to 14 tons. This order is about '+loads+' truck load'+(loads>1?'s':'')+' of 12 tons.');
  last='Gravel — calculatepilot.com/other/gravel-calculator.html\n'+C.num(tot,0)+' sq ft, '+a[0]+': '+C.num(yd,2)+' yd³ = '+C.num(net,2)+' tons; with '+cp+'% allowance '+C.num(tons,2)+' tons ('+n0(bags)+' × 50 lb bags)';
}
function addRow(){
  if($('extras').children.length>=5)return;var d=document.createElement('div');d.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:center';
  d.innerHTML='<div class="sx-au-in sm np"><input class="xa" type="number" inputmode="decimal" step="10" min="0" value="200" aria-label="Zone area, sq ft"></div><div class="sx-au-in sm np"><input class="xd" type="number" inputmode="decimal" step="0.25" min="0" value="3" aria-label="Zone depth, inches"></div><button type="button" class="sx-reset" aria-label="Remove zone" style="padding:8px"><span class="msym" aria-hidden="true">close</span></button>';
  d.querySelector('button').addEventListener('click',function(){d.remove();$('mode').dispatchEvent(new Event('input',{bubbles:true}));});$('extras').appendChild(d);$('mode').dispatchEvent(new Event('input',{bubbles:true}));
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'grCalc',compute:compute});
  $('addZone').addEventListener('click',addRow);
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){$('extras').innerHTML='';$('cd').value='';});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
