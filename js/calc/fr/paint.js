/* Paint calculator — CalculatePilot (Stitch redesign).
   Net wall area = 2(L+W)H − doors×21 − windows×15 − other; gallons = area × coats ÷ spread × 1.10 (10% waste).
   Ceiling = L×W. Trim = 6 in baseboard around the perimeter + 3.5 in casings (door 17 ft, window 16 ft of casing) at 350 sq ft/gal.
   Purchases are shown as whole gallons + quarts; cost prices quarts at a quarter of the gallon price. */
(function(){
var C=window.CPX,$=C.$,last='',prev='ft',FT=3.280839895,WASTE=1.10;
function buy(g){var w=Math.floor(g+1e-9),q=Math.ceil((g-w)*4-1e-9);if(q>=4){w++;q=0;}if(q<0)q=0;var p=[];if(w)p.push(w+' gal');if(q)p.push(q+' qt');return p.length?p.join(' + '):'0';}
function qty(g){var w=Math.floor(g+1e-9),q=Math.ceil((g-w)*4-1e-9);if(q>=4){w++;q=0;}return w+q/4;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','buy','oL','oNet','oCov','oTot'].forEach(function(i){C.text(i,'—');});C.text('interp','Corrigez la saisie ci-dessus pour voir l’estimation.');$('list').innerHTML='';last='';}
function compute(){
  var u=$('unit').value;
  if(u!==prev){var k=u==='m'?1/FT:FT;['L','W','H'].forEach(function(id){$(id).value=(+(C.val(id)*k).toFixed(2));});prev=u;}
  document.querySelectorAll('[data-u]').forEach(function(e){e.textContent=u==='m'?'m':'ft';});
  var f=u==='m'?FT:1,L=C.val('L')*f,W=C.val('W')*f,H=C.val('H')*f,rooms=Math.max(1,Math.round(C.val('rooms'))||1),coats=C.val('coats'),sp=C.val('sp'),doors=Math.max(0,Math.round(C.val('doors'))),wins=Math.max(0,Math.round(C.val('wins'))),cust=Math.max(0,C.val('cust'));
  C.text('spNote',sp+' pi² par gallon');
  $('err').hidden=true;
  if(!(L>0&&W>0&&H>0))return fail('Saisissez la longueur, la largeur et la hauteur sous plafond de la pièce.');
  var gross=2*(L+W)*H,open=doors*21+wins*15+cust,net=gross-open;
  if(net<=0)return fail('Les ouvertures sont plus grandes que la surface des murs. Réduisez les portes, les fenêtres ou la surface personnalisée.');
  net*=rooms;
  var wallG=net*coats/sp*WASTE,rows=[],total=0,pw=C.val('pw'),pc=C.val('pc'),pp=C.val('pp');
  function add(name,g,price,note){var c=qty(g)*price;total+=c;rows.push([name,buy(g),note,c]);}
  add('Peinture murale',wallG,pw,coats+' coat'+(coats>1?'s':'')+' at '+sp+' pi²/gal');
  var ceilA=0,trimA=0;
  if($('incCeil').checked){ceilA=L*W*rooms;add('Peinture de plafond',ceilA*coats/sp*WASTE,pc,coats+' coat'+(coats>1?'s':'')+', '+C.num(ceilA,0)+' pi²');}
  if($('incTrim').checked){trimA=(2*(L+W)*0.5+doors*17*(3.5/12)+wins*16*(3.5/12))*rooms;add('Peinture pour boiseries (semi-brillante)',trimA*coats/350*WASTE,pw,C.num(trimA,0)+' pi² à 350 pi²/gal');}
  if($('incPrime').checked)add('Sous-couche pour les murs',net/350*WASTE,pp,'1 couche à 350 pi²/gal');
  C.text('resultValue',C.num(wallG,2));
  C.text('buy',buy(wallG));C.text('oL',C.num(wallG*3.785411784,1)+' L');
  C.text('oNet',C.num(net,0)+' pi²');C.text('oCov',C.num(net*coats,0)+' pi²');
  C.text('interp','Murs : '+C.num(net,0)+' pi² nets de '+C.num(open*rooms,0)+' pi² d\'ouvertures, '+coats+' coat'+(coats>1?'s':'')+' at '+sp+' pi² par gallon, plus 10 % de perte.');
  var h='';rows.forEach(function(r,i){h+='<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+'"><div><b style="display:block;font-size:13px;color:var(--sx-on)">'+C.esc(r[0])+' · '+C.esc(r[1])+'</b><span style="font-size:12px;color:var(--sx-muted)">'+C.esc(r[2])+'</span></div><b style="font-family:var(--font-mono);font-size:14px;color:var(--sx-on)">'+C.money(r[3],2)+'</b></div>';});
  $('list').innerHTML=h;C.text('oTot',C.money(total,2));
  last='Estimation de peinture — calculatepilot.com/other/paint-calculator.html\nMurs : '+C.num(net,0)+' pi² nets, '+coats+' couches → '+C.num(wallG,2)+' gal ('+buy(wallG)+')\n'+rows.map(function(r){return r[0]+': '+r[1]+' — '+C.money(r[3],2);}).join('\n')+'\nTotal ≈ '+C.money(total,2);
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'ptCalc',compute:compute});
  document.querySelectorAll('[data-h]').forEach(function(b){b.addEventListener('click',function(){var ft=+b.getAttribute('data-h');$('H').value=$('unit').value==='m'?(+(ft/FT).toFixed(2)):ft;$('H').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
