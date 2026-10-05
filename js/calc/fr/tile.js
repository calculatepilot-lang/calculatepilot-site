/* Tile & grout estimator — CalculatePilot (Stitch redesign).
   tiles = ceil(area ÷ ((L+j)(W+j)/144) × (1+waste)); grout lb = area × 144(L+W)·T·j/(L·W) ÷ 1728 × 112 lb/ft³ × 1.25 allowance;
   thin-set bags = ceil(area × (1+waste) ÷ coverage per 50 lb bag) with typical coverage by notch size. */
(function(){
var C=window.CPX,$=C.$,last='';
var DENS=112,ALLOW=1.25;
var NOTCH={a:{n:'carré de 1/4 × 1/4 in',cov:95},b:{n:'carré de 1/4 × 3/8 in',cov:65},c:{n:'carré de 1/2 × 1/2 in',cov:45}};
function notchFor(mx){return mx>=15?NOTCH.c:mx>8?NOTCH.b:NOTCH.a;}
function groutPerFt2(L,W,T,j){return 144*(L+W)*T*j/(L*W)/1728*DENS*ALLOW;}
function n0(x){return C.num(x,0);}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oBox','oCov','oNet','oWaste','oGrout','oMort','oTot'].forEach(function(i){C.text(i,'—');});C.text('interp','Corrigez la saisie ci-dessus pour voir l’estimation.');C.text('tag','—');$('costs').innerHTML='';last='';}
function matrix(){
  var sizes=[[3,6,'3 × 6 in (métro)'],[6,6,'6 × 6 in'],[12,12,'12 × 12 in'],[12,24,'12 × 24 in (grand format)'],[24,24,'24 × 24 in']],h='';
  sizes.forEach(function(s){h+='<tr><td class="a">'+s[2]+'</td>';[0.0625,0.125,0.1875,0.25].forEach(function(j){h+='<td class="n">'+n0(25/groutPerFt2(s[0],s[1],0.375,j))+' sq ft</td>';});h+='<td class="a">'+notchFor(Math.max(s[0],s[1])).n+'</td></tr>';});
  document.querySelector('#matrix tbody').innerHTML=h;
}
function compute(){
  var mode=$('mode').value;$('g-d').hidden=mode!=='d';$('g-a').hidden=mode!=='a';
  var area=mode==='d'?C.val('rl')*C.val('rw'):C.val('ra'),L=C.val('tl'),W=C.val('tw'),T=C.val('tt'),j=C.val('jw'),waste=C.val('waste')/100,perBox=Math.max(1,Math.round(C.val('box'))||1),gt=$('gt').value;
  C.text('wNote','+'+C.val('waste')+'%');C.text('thkNote',C.num(T,4).replace(/[.,]?0+$/,'')+' po d’épaisseur');
  C.text('jNote',j<=0.0625?'joint fin rectifié':j<=0.125?'joint de sol standard':j<=0.1875?'joint rustique':'joint pour carreaux de carrière');
  $('err').hidden=true;
  if(!(area>0))return fail('Saisissez la surface à carreler.');
  if(!(L>0&&W>0))return fail('Saisissez la largeur et la longueur du carreau.');
  if(!(T>0))return fail('Saisissez l\'épaisseur du carreau.');
  var per=(L+j)*(W+j)/144,net=area/per,tiles=Math.ceil(net*(1+waste)-1e-9),boxes=Math.ceil(tiles/perBox),boxCov=boxes*perBox*per;
  C.text('resultValue',n0(tiles));C.text('tag','+'+C.val('waste')+'% de perte');
  C.text('interp',C.num(area,1)+' sq ft nécessitent '+C.num(net,1)+' carreaux nets ; '+n0(tiles-net)+' en plus pour les coupes et la casse.');
  C.text('oBox',n0(boxes)+' box'+(boxes>1?'es':''));C.text('oCov',C.num(boxCov,1)+' pi²');C.text('oNet',C.num(area,1)+' pi²');C.text('oWaste',n0(tiles-Math.round(net))+' tiles');
  var lb=area*groutPerFt2(L,W,T,j),bags25=Math.max(1,Math.ceil(lb/25-1e-9)),nt=notchFor(Math.max(L,W)),mort=Math.ceil(area*(1+waste)/nt.cov-1e-9);
  C.text('gBadge',gt==='sanded'?'joint sablé':gt==='unsanded'?'joint non sablé':'joint époxy');
  C.text('oGrout',C.num(lb,1)+' lb');
  C.text('oGroutN',lb<=10?'un sac de 10 lb suffit':bags25+' × sac de 25 lb'+(bags25>1?'s':'')+' at '+C.money(C.val('pg'),2));
  C.text('oMort',n0(mort)+' × 50 lb');C.text('oMortN','notch '+nt.n+', environ '+nt.cov+' sq ft par sac');
  var adv=gt==='epoxy'?'Le joint époxy se vend en kits et durcit vite : travaillez par petites sections et vérifiez la couverture du kit.':gt==='sanded'&&j<0.125?'Les joints inférieurs à 1/8 in demandent en général un joint non sablé ; le sable peut empêcher le joint de bien se tasser.':gt==='unsanded'&&j>=0.125?'Les joints de 1/8 in ou plus demandent en général un joint sablé, qui résiste au retrait et à la fissuration.':'Le type de joint convient à cette largeur de joint.';
  C.text('notch',adv+(Math.max(L,W)>=15?' Les carreaux grand format demandent une spatule à plus grandes dents et un support très plan.':''));
  var tileC=tiles*per*C.val('pt'),groutC=(lb<=10?1:bags25)*C.val('pg')*(lb<=10?0.5:1),mortC=mort*C.val('pm'),tot=tileC+groutC+mortC;
  $('costs').innerHTML=[['Carreaux ('+n0(tiles)+' carreaux, '+C.num(tiles*per,1)+' sq ft)',tileC],['Joint',groutC],['Mortier-colle ('+n0(mort)+' sacs)',mortC]].map(function(r,i){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:13px"><span style="color:var(--sx-onv)">'+C.esc(r[0])+'</span><b style="font-family:var(--font-mono);color:var(--sx-on)">'+C.money(r[1],2)+'</b></div>';}).join('');
  C.text('oTot',C.money(tot,2));
  last='Estimation de carrelage — calculatepilot.com/other/tile-calculator.html\n'+C.num(area,1)+' sq ft, '+C.num(W,2)+' × '+C.num(L,2)+' in de carreau, '+j+' in de joint, +'+C.val('waste')+'% de perte\nCarreaux : '+n0(tiles)+' ('+n0(boxes)+' boîtes de '+perBox+')\nGrout: '+C.num(lb,1)+' lb ; mortier-colle : '+n0(mort)+' × 50 lb\nTotal ≈ '+C.money(tot,2);
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  matrix();
  C.init({root:'tlCalc',compute:compute});
  $('tilePre').addEventListener('click',function(e){var b=e.target.closest('button[data-t]');if(!b)return;var p=b.getAttribute('data-t').split('x');C.set('tl',p[0]);C.set('tw',p[1]);$('tw').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
