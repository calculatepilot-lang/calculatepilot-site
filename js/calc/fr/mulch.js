/* Mulch, compost & topsoil calculator — CalculatePilot (Stitch redesign).
   ft³ = area (ft²) × depth (in) ÷ 12 × (1 + settling); yd³ = ft³ ÷ 27; bags = ceil(ft³ ÷ bag size).
   Weights are typical lb per yd³ and vary with moisture. */
(function(){
var C=window.CPX,$=C.$,last='',xn=0;
var MAT={hardwood:['Paillis de bois dur broyé',750],pine:['Écorce de pin ou paille',550],topsoil:['Terre végétale tamisée',2200],compost:['Compost',1300],gravel:['Gravier fin ou galets de rivière',2700]};
function n0(x){return C.num(x,0);}
function extraTotal(){var t=0;document.querySelectorAll('#extras input').forEach(function(i){t+=Math.max(0,parseFloat(i.value)||0);});return t;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oFt','oW','oA','oM','g20','g15','g30','cBulk','cBag'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir l’estimation.');last='';}
function compute(){
  var mode=$('mode').value,area,ex=extraTotal();
  $('g-r').hidden=mode!=='r';$('g-c').hidden=mode!=='c';$('g-a').hidden=mode!=='a';
  $('extraWrap').hidden=!$('extras').children.length;
  if(mode==='r')area=C.val('bl')*C.val('bw');else if(mode==='c'){var r=C.val('bd')/2;area=Math.PI*r*r;}else area=C.val('ba');
  C.text('area',C.num(area,2)+' pi²'+(ex?' + '+C.num(ex,0)+' extra':''));
  var depth=$('depthC').value!==''?C.val('depthC'):C.val('depth'),st=C.val('settle'),m=MAT[$('mat').value];
  C.text('depthV',C.num(depth,2).replace(/[.,]?0+$/,'')+' in');C.text('setV','+'+st+'%');C.text('matNote','≈ '+n0(m[1])+' lb par yd³');
  $('err').hidden=true;
  var tot=area+ex;
  if(!(tot>0))return fail('Saisissez une surface de massif supérieure à zéro.');
  if(!(depth>0)||depth>24)return fail('La profondeur doit être comprise entre 0 et 24 pouces.');
  var ft3=tot*depth/12,net=ft3,v=ft3*(1+st/100),yd=v/27,lb=yd*m[1],tons=lb/2000;
  C.text('resultValue',C.num(yd,2));C.text('tag',m[0]);
  C.text('interp',C.num(tot,1)+' pi² sur '+C.num(depth,2).replace(/[.,]?0+$/,'')+' po de profondeur = '+C.num(net,2)+' pi³, plus '+st+' % pour le tassement.');
  C.text('oFt',C.num(v,2)+' ft³');C.text('oW',n0(lb)+' lb ('+C.num(tons,2)+' t)');C.text('oA',C.num(tot,0)+' pi²');C.text('oM',C.num(v*0.028316846592,2)+' m³');
  var pb=C.val('pbg'),py=C.val('pby');
  var b20=Math.ceil(v/2-1e-9),b15=Math.ceil(v/1.5-1e-9),b30=Math.ceil(v/3-1e-9);
  C.text('g20',n0(b20));C.text('g15',n0(b15));C.text('g30',n0(b30));
  C.text('g20c',C.money(b20*pb,2));C.text('g15c',C.money(b15*pb*0.75,2));C.text('g30c',C.money(b30*pb*1.5,2));
  var lbs=lb;
  C.text('haul',lbs>1500?'Cette charge pèse environ '+n0(lbs)+' lb. C\'est lourd pour une camionnette demi-tonne ; prévoyez une livraison ou plusieurs trajets.':yd<=2?'À propos '+C.num(yd,2)+' yd³ de ce matériau pèsent environ '+n0(lbs)+' lb, ce qu\'une camionnette demi-tonne classique peut généralement transporter.':'À propos '+C.num(yd,2)+' yd³ est une grosse quantité. Renseignez-vous auprès du fournisseur sur la livraison.');
  var bulk=yd*py,bag=b20*pb;
  C.text('cBulk',C.money(bulk,2));C.text('cBulkN',C.num(yd,2)+' yd³ à '+C.money(py,0)+' par yd³');C.text('cBag',C.money(bag,2));C.text('cBagN',n0(b20)+' sacs à '+C.money(pb,2));
  C.text('costNote',bulk<bag?'le vrac permet d’économiser '+C.money(bag-bulk,2):bag<bulk?'les sacs permettent d’économiser '+C.money(bulk-bag,2):'même coût');
  last='Estimation paillis et terre végétale — calculatepilot.com/other/mulch-calculator.html\n'+m[0]+': '+C.num(tot,1)+' pi² sur '+C.num(depth,2)+' in\n'+C.num(yd,2)+' yd³ ('+C.num(v,2)+' pi³) dont '+st+' % de tassement\nSacs : '+n0(b20)+' × 2 pi³, '+n0(b15)+' × 1,5 pi³, '+n0(b30)+' × 3 pi³\nPoids ≈ '+n0(lb)+' lb';
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  $('depthC').addEventListener('input',function(){});
});
})();
