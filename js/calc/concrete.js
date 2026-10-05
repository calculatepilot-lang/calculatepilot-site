/* Concrete volume & bag calculator — CalculatePilot (Stitch redesign).
   Slab/footing = L × W × T; round column = π r² h; steps = width × run × rise × n(n+1)/2 (solid to the ground).
   yd³ = ft³ ÷ 27; weight uses 145 lb/ft³; bags = ceil(ft³ ÷ yield) with 0.60 / 0.45 / 0.375 ft³ per 80 / 60 / 50 lb bag. */
(function(){
var C=window.CPX,$=C.$,last='',DENS=145,SH=['slab','footing','column','steps'];
function n0(x){return C.num(x,0);}
function compute(){
  var sh=$('shape').value,qty=Math.max(1,Math.round(C.val('qty'))||1),w=Math.max(0,C.val('waste')),ft3=0,desc='';
  SH.forEach(function(s){$('g-'+s).hidden=s!==sh;});
  C.text('wasteV',w+'%');
  $('err').hidden=true;
  var need={slab:['sl','sw','st'],footing:['fl','fw','fd'],column:['cdi','chh'],steps:['sn','swd','sr','sru']}[sh];
  for(var i=0;i<need.length;i++){if($(need[i]).value===''||C.val(need[i])<=0){return fail('Enter every dimension above zero.');}}
  if(sh==='slab'){ft3=C.val('sl')*C.val('sw')*C.val('st')/12;desc=C.val('sl')+' × '+C.val('sw')+' ft, '+C.val('st')+' in thick';}
  else if(sh==='footing'){ft3=C.val('fl')*(C.val('fw')/12)*(C.val('fd')/12);desc=C.val('fl')+' ft of footing, '+C.val('fw')+' × '+C.val('fd')+' in';}
  else if(sh==='column'){var r=C.val('cdi')/24;ft3=Math.PI*r*r*C.val('chh');desc=C.val('cdi')+' in round, '+C.val('chh')+' ft deep';}
  else{var nn=Math.round(C.val('sn'));ft3=C.val('swd')*(C.val('sru')/12)*(C.val('sr')/12)*nn*(nn+1)/2;desc=nn+' steps, '+C.val('swd')+' ft wide';}
  ft3*=qty;
  var tot=ft3*(1+w/100),yd=tot/27,lb=tot*DENS;
  C.text('resultValue',C.num(yd,2));
  C.text('tag',w+'% waste');
  C.text('interp',desc+(qty>1?' × '+qty:'')+': '+C.num(ft3,2)+' ft³ solid, '+C.num(tot,2)+' ft³ with waste.');
  C.text('oFt',C.num(tot,2)+' ft³');C.text('oM',C.num(tot*0.028316846592,2)+' m³');C.text('oW',n0(lb)+' lb');C.text('oNet',C.num(ft3/27,2)+' yd³');
  var b80=Math.ceil(tot/0.6-1e-9),b60=Math.ceil(tot/0.45-1e-9),b50=Math.ceil(tot/0.375-1e-9);
  C.text('b80',n0(b80));C.text('b60',n0(b60));C.text('b50',n0(b50));
  C.text('advice',yd>1?'This pour is over 1 cubic yard ('+n0(b80)+' bags of 80 lb). A ready-mix truck is usually the better choice: it saves labour, gives a more even mix and avoids cold joints.':'Under about 1 cubic yard, premix bags are practical. Mix in batches and pour without long breaks.');
  var py=C.val('pyd'),pb=C.val('pbg');
  C.text('cTruck',C.money(yd*py,2));C.text('cTruckN','at '+C.money(py,0)+' per yd³, excluding delivery and short-load fees');
  C.text('cBag',C.money(b80*pb,2));C.text('cBagN',n0(b80)+' bags at '+C.money(pb,2));
  C.text('costNote',yd<1?'trucks often have a minimum load':yd*py<b80*pb?'truck is cheaper':'bags are cheaper');
  last='Concrete estimate — calculatepilot.com/other/concrete-calculator.html\n'+desc+(qty>1?' × '+qty:'')+'\n'+C.num(yd,2)+' yd³ ('+C.num(tot,2)+' ft³) with '+w+'% waste\n80 lb bags: '+n0(b80)+', 60 lb: '+n0(b60)+', 50 lb: '+n0(b50)+'\nWeight ≈ '+n0(lb)+' lb';
}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oFt','oM','oW','oNet','b80','b60','b50','cTruck','cBag'].forEach(function(i){C.text(i,'—');});C.text('interp','Fix the input above to see the estimate.');C.text('tag','—');last='';}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'ccCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
