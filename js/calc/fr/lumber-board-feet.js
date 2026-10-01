/* Lumber board feet calculator — CalculatePilot (Stitch redesign).
   BF = T(in) × W(in) × L(ft) ÷ 12, priced on nominal size; softwood cubic volume uses the dressed (actual) size.
   Waste multiplies board feet: gross = net × (1 + waste). A cut list keeps several board specs and totals them. */
(function(){
var C=window.CPX,$=C.$,last='',list=[];
var NOM=[['1×4',1,4,0.75,3.5],['1×6',1,6,0.75,5.5],['1×8',1,8,0.75,7.25],['1×10',1,10,0.75,9.25],['1×12',1,12,0.75,11.25],['2×4',2,4,1.5,3.5],['2×6',2,6,1.5,5.5],['2×8',2,8,1.5,7.25],['2×10',2,10,1.5,9.25],['2×12',2,12,1.5,11.25],['4×4',4,4,3.5,3.5],['4×6',4,6,3.5,5.5],['6×6',6,6,5.5,5.5]];
function frac(x){var w=Math.floor(x),f=x-w,m={0.25:'1/4',0.5:'1/2',0.75:'3/4'},s=m[f]||(f?String(f):'');return w?(s?w+'-'+s:String(w)):s;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oNet','oLin','oCu','oM3','oPlf'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir l’estimation.');$('costs').innerHTML='';last='';}
function spec(){
  var std=$('std').value,T,W,aT,aW,name;
  if(std==='sw'){var n=NOM[$('nom').selectedIndex]||NOM[5];T=n[1];W=n[2];aT=n[3];aW=n[4];name=n[0].replace('×',' × ')+' en bois tendre';}
  else{T=$('thC').value!==''?C.val('thC'):C.val('th');W=C.val('wd');aT=T;aW=W;name=(T===1?'4/4':T===1.25?'5/4':T===1.5?'6/4':T===2?'8/4':C.num(T,3).replace(/[.,]?0+$/,'')+' in')+' × '+C.num(W,2).replace(/[.,]?0+$/,'')+' en bois dur';}
  return {std:std,T:T,W:W,aT:aT,aW:aW,name:name};
}
function calc(s){
  var L=C.val('len'),q=Math.max(1,Math.round(C.val('qty'))||1),w=C.val('waste')/100,pr=C.val('pr');
  var per=s.T*s.W*L/12,net=per*q,gross=net*(1+w),cu=s.aT*s.aW*L/144*q*(1+w);
  return {L:L,q:q,w:w,pr:pr,per:per,net:net,gross:gross,cost:gross*pr,netCost:net*pr,lin:L*q,cu:cu};
}
function compute(){
  var std=$('std').value;$('g-hw').hidden=std!=='hw';$('g-sw').hidden=std!=='sw';
  var s=spec();C.text('wNote','+'+C.val('waste')+'%');
  if(std==='hw')C.text('tNote',s.T+' in');else C.text('actNote','actual '+frac(s.aT)+' × '+frac(s.aW)+' in');
  $('err').hidden=true;
  if(!(s.T>0&&s.W>0&&C.val('len')>0))return fail('Saisissez une épaisseur, une largeur et une longueur supérieures à zéro.');
  var r=calc(s);
  C.text('resultValue',C.num(r.gross,2));C.text('tag',s.name);
  C.text('interp',r.q+' piece'+(r.q>1?'s':'')+' at '+C.num(s.T,2).replace(/[.,]?0+$/,'')+' × '+C.num(s.W,2).replace(/[.,]?0+$/,'')+' po × '+C.num(r.L,1).replace(/[.,]0$/,'')+' pi = '+C.num(r.per,3)+' BF chacune.');
  C.text('oNet',C.num(r.net,2)+' BF');C.text('oLin',C.num(r.lin,1)+' ft');C.text('oCu',C.num(r.cu,2)+' ft³');C.text('oM3',C.num(r.cu*0.028316846592,3)+' m³');
  C.text('rateNote',C.money(r.pr,2)+' par BF');
  $('costs').innerHTML=[['Bois net ('+C.num(r.net,2)+' BF)',r.netCost],['Marge pour pertes (+'+C.val('waste')+'%)',r.cost-r.netCost],['Total ('+C.num(r.gross,2)+' BF)',r.cost]].map(function(x,i){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:'+(i===2?'15':'13')+'px"><span style="color:var(--sx-onv);'+(i===2?'font-weight:700':'')+'">'+C.esc(x[0])+'</span><b style="font-family:var(--font-mono);color:var(--sx-on)">'+C.money(x[1],2)+'</b></div>';}).join('');
  C.text('oPlf',C.money(r.lin?r.cost/r.lin:0,2)+' / ft');
  last='Pieds-planche — calculatepilot.com/other/lumber-board-feet-calculator.html\n'+s.name+': '+r.q+' × '+C.num(r.L,1)+' pi = '+C.num(r.net,2)+' BF nets, '+C.num(r.gross,2)+' BF avec '+C.val('waste')+' % de pertes\nCoût à '+C.money(r.pr,2)+'/BF: '+C.money(r.cost,2);
  renderList();
}
function renderList(){
  var tb=0,tc=0,h='';
  list.forEach(function(it,i){tb+=it.gross;tc+=it.cost;h+='<tr><td class="a" style="white-space:normal">'+C.esc(it.name)+'<br><small style="color:var(--sx-muted)">'+C.esc(it.L)+' pi · '+C.money(it.pr,2)+'/BF · +'+it.wp+'%</small></td><td class="n">'+it.q+'</td><td class="n">'+C.num(it.gross,2)+'</td><td class="n">'+C.money(it.cost,2)+'</td><td><button type="button" class="sx-reset" data-rm="'+i+'" aria-label="Remove" style="padding:4px"><span class="msym" aria-hidden="true">close</span></button></td></tr>';});
  $('led').innerHTML=h||'<tr><td class="a" colspan="5" style="white-space:normal;color:var(--sx-muted)">Ajoutez des planches avec « Ajouter à la liste de coupe » pour totaliser plusieurs dimensions.</td></tr>';
  C.text('ledN',list.length?list.length+' item'+(list.length>1?'s':''):'empty');C.text('ledT',list.length?C.num(tb,2)+' BF · '+C.money(tc,2):'—');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  $('nom').innerHTML=NOM.map(function(n,i){return '<option value="'+i+'"'+(i===5?' selected':'')+'>'+n[0].replace('×',' × ')+'</option>';}).join('');
  C.init({root:'lbCalc',compute:compute});
  document.querySelectorAll('[data-w]').forEach(function(b){b.addEventListener('click',function(){C.set('wd',b.getAttribute('data-w'));$('wd').dispatchEvent(new Event('input',{bubbles:true}));});});
  document.querySelectorAll('[data-l]').forEach(function(b){b.addEventListener('click',function(){C.set('len',b.getAttribute('data-l'));$('len').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('thC').addEventListener('input',function(){if(this.value!=='')$('th').value='';});
  $('addBtn').addEventListener('click',function(){var s=spec();if(!(s.T>0&&s.W>0&&C.val('len')>0))return;var r=calc(s);list.push({name:s.name,L:C.num(r.L,1).replace(/[.,]0$/,''),q:r.q,pr:r.pr,wp:C.val('waste'),gross:r.gross,cost:r.cost});renderList();});
  $('clrBtn').addEventListener('click',function(){list=[];renderList();});
  $('led').addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;list.splice(+b.getAttribute('data-rm'),1);renderList();});
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){$('thC').value='';});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last+(list.length?'\nTotal de la liste de coupe : '+$('ledT').textContent:''),'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  renderList();
});
})();
