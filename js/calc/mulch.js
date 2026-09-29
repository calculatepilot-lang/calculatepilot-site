/* Mulch, compost & topsoil calculator — CalculatePilot (Stitch redesign).
   ft³ = area (ft²) × depth (in) ÷ 12 × (1 + settling); yd³ = ft³ ÷ 27; bags = ceil(ft³ ÷ bag size).
   Weights are typical lb per yd³ and vary with moisture. */
(function(){
var C=window.CPX,$=C.$,last='',xn=0;
var MAT={hardwood:['Shredded hardwood mulch',750],pine:['Pine bark or straw',550],topsoil:['Screened topsoil',2200],compost:['Compost',1300],gravel:['Pea gravel or river stone',2700]};
function n0(x){return C.num(x,0);}
function extraTotal(){var t=0;document.querySelectorAll('#extras input').forEach(function(i){t+=Math.max(0,parseFloat(i.value)||0);});return t;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oFt','oW','oA','oM','g20','g15','g30','cBulk','cBag'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the estimate.');last='';}
function compute(){
  var mode=$('mode').value,area,ex=extraTotal();
  $('g-r').hidden=mode!=='r';$('g-c').hidden=mode!=='c';$('g-a').hidden=mode!=='a';
  $('extraWrap').hidden=!$('extras').children.length;
  if(mode==='r')area=C.val('bl')*C.val('bw');else if(mode==='c'){var r=C.val('bd')/2;area=Math.PI*r*r;}else area=C.val('ba');
  C.text('area',C.num(area,2)+' sq ft'+(ex?' + '+C.num(ex,0)+' extra':''));
  var depth=$('depthC').value!==''?C.val('depthC'):C.val('depth'),st=C.val('settle'),m=MAT[$('mat').value];
  C.text('depthV',C.num(depth,2).replace(/\.?0+$/,'')+' in');C.text('setV','+'+st+'%');C.text('matNote','≈ '+n0(m[1])+' lb per yd³');
  $('err').hidden=true;
  var tot=area+ex;
  if(!(tot>0))return fail('Enter a bed size above zero.');
  if(!(depth>0)||depth>24)return fail('Depth must be between 0 and 24 inches.');
  var ft3=tot*depth/12,net=ft3,v=ft3*(1+st/100),yd=v/27,lb=yd*m[1],tons=lb/2000;
  C.text('resultValue',C.num(yd,2));C.text('tag',m[0]);
  C.text('interp',C.num(tot,1)+' sq ft at '+C.num(depth,2).replace(/\.?0+$/,'')+' in deep = '+C.num(net,2)+' ft³, plus '+st+'% for settling.');
  C.text('oFt',C.num(v,2)+' ft³');C.text('oW',n0(lb)+' lb ('+C.num(tons,2)+' t)');C.text('oA',C.num(tot,0)+' sq ft');C.text('oM',C.num(v*0.028316846592,2)+' m³');
  var pb=C.val('pbg'),py=C.val('pby');
  var b20=Math.ceil(v/2-1e-9),b15=Math.ceil(v/1.5-1e-9),b30=Math.ceil(v/3-1e-9);
  C.text('g20',n0(b20));C.text('g15',n0(b15));C.text('g30',n0(b30));
  C.text('g20c',C.money(b20*pb,2));C.text('g15c',C.money(b15*pb*0.75,2));C.text('g30c',C.money(b30*pb*1.5,2));
  var lbs=lb;
  C.text('haul',lbs>1500?'This load is about '+n0(lbs)+' lb. That is heavy for a half-ton pickup, so plan on a delivery or several trips.':yd<=2?'About '+C.num(yd,2)+' yd³ of this material weighs around '+n0(lbs)+' lb, which a typical half-ton pickup can usually carry.':'About '+C.num(yd,2)+' yd³ is a large load. Ask the supplier about delivery.');
  var bulk=yd*py,bag=b20*pb;
  C.text('cBulk',C.money(bulk,2));C.text('cBulkN',C.num(yd,2)+' yd³ at '+C.money(py,0)+' per yd³');C.text('cBag',C.money(bag,2));C.text('cBagN',n0(b20)+' bags at '+C.money(pb,2));
  C.text('costNote',bulk<bag?'bulk saves '+C.money(bag-bulk,2):bag<bulk?'bags save '+C.money(bulk-bag,2):'same cost');
  last='Mulch & topsoil estimate — calculatepilot.com/other/mulch-calculator.html\n'+m[0]+': '+C.num(tot,1)+' sq ft at '+C.num(depth,2)+' in\n'+C.num(yd,2)+' yd³ ('+C.num(v,2)+' ft³) incl. '+st+'% settling\nBags: '+n0(b20)+' × 2 cu ft, '+n0(b15)+' × 1.5 cu ft, '+n0(b30)+' × 3 cu ft\nWeight ≈ '+n0(lb)+' lb';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function addRow(){
  if($('extras').children.length>=6)return;
  var id='ex'+(xn++),d=document.createElement('div');d.style.cssText='display:flex;gap:8px;align-items:center';
  d.innerHTML='<div class="sx-au-in sm np" style="flex:1"><input id="'+id+'" type="number" inputmode="decimal" step="1" min="0" value="50" aria-label="Additional area in square feet"></div><button type="button" class="sx-reset" aria-label="Remove area" style="padding:8px"><span class="msym" aria-hidden="true">close</span></button>';
  d.querySelector('button').addEventListener('click',function(){d.remove();$('mode').dispatchEvent(new Event('input',{bubbles:true}));});
  $('extras').appendChild(d);$('mode').dispatchEvent(new Event('input',{bubbles:true}));
}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'muCalc',compute:compute});
  $('addArea').addEventListener('click',addRow);
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){$('extras').innerHTML='';$('depthC').value='';});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  $('depthC').addEventListener('input',function(){});
});
})();
