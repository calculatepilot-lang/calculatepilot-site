/* Scotland LBTT — CalculatePilot (Stitch 1:1 redesign).
   Revenue Scotland residential bands (from 1 Apr 2021), first-time buyer nil band £175k,
   ADS 8% of the whole price from £40k (since 5 Dec 2024), non-residential freehold table.
   Comparison matrix uses current England/NI SDLT and Welsh LTT tables. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var T={
  scot:{std:[[145000,0],[250000,.02],[325000,.05],[750000,.10],[Infinity,.12]],ftb:[[175000,0],[250000,.02],[325000,.05],[750000,.10],[Infinity,.12]],nonres:[[150000,0],[250000,.01],[Infinity,.05]]},
  eng:{std:[[125000,0],[250000,.02],[925000,.05],[1500000,.10],[Infinity,.12]],ftb:[[300000,0],[500000,.05]],nonres:[[150000,0],[250000,.02],[Infinity,.05]]},
  wal:{std:[[225000,0],[400000,.06],[750000,.075],[1500000,.10],[Infinity,.12]],high:[[180000,.05],[250000,.085],[400000,.10],[750000,.125],[1500000,.15],[Infinity,.17]],nonres:[[225000,0],[250000,.01],[1000000,.05],[Infinity,.06]]}
};
var COL=['var(--sx-sc)','var(--sx-pc)','var(--sx-secondary)','var(--sx-tertiary)','#293040'];
var gbp=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0});
function P(x){return gbp.format(Math.round(x));}
function pct(x){return (Math.round(x*10000)/100)+'%';}
function slices(price,table){var prev=0,rows=[],tot=0;table.forEach(function(b){var part=Math.max(0,Math.min(price,b[0])-prev),tax=part*b[1];rows.push({lo:prev,hi:b[0],rate:b[1],part:part,tax:tax});tot+=tax;prev=b[0];});return {rows:rows,total:tot};}
function range(r){return r.lo===0?'Jusqu’à '+P(r.hi):r.hi===Infinity?'Sur '+P(r.lo):P(r.lo+1)+' to '+P(r.hi);}

function scot(price,buyer){
  if(buyer==='nonres'){var n=slices(price,T.scot.nonres);return {core:n.total,ads:0,rows:n.rows,total:n.total};}
  var s=slices(price,buyer==='ftb'?T.scot.ftb:T.scot.std),ads=buyer==='ads'&&price>=40000?price*.08:0;
  return {core:s.total,ads:ads,rows:s.rows,total:s.total+ads};
}
function eng(price,buyer){
  if(buyer==='nonres')return slices(price,T.eng.nonres).total;
  var base=slices(price,buyer==='ftb'&&price<=500000?T.eng.ftb:T.eng.std).total;
  return base+(buyer==='ads'&&price>=40000?price*.05:0);
}
function wal(price,buyer){
  if(buyer==='nonres')return slices(price,T.wal.nonres).total;
  return slices(price,buyer==='ads'&&price>=40000?T.wal.high:T.wal.std).total;
}

function compute(){
  var price=Math.max(0,v('price')),buyer=$('buyer').value,r=scot(price,buyer),p=price||1;
  C.text('resultValue',P(r.total));C.text('baseTxt','on '+P(price)+' purchase');
  C.text('effBadge',(r.total/p*100).toFixed(2)+'% de taux effectif');
  var call=$('adsCall');call.hidden=!r.ads;
  C.text('coreAmt',P(r.core));C.text('adsAmt',P(r.ads));C.text('sumAmt',P(r.total));

  /* tier bar: share of the total tax from each band (+ ADS) */
  var parts=r.rows.map(function(b,i){return {v:b.tax,c:COL[i]||COL[4],l:pct(b.rate)+' band'};});
  if(r.ads)parts.push({v:r.ads,c:'var(--sx-err)',l:'ADS'});
  var tot=r.total||1;
  $('tierBar').innerHTML=parts.map(function(x){return x.v>0?'<span style="width:'+(x.v/tot*100)+'%;background:'+x.c+'" title="'+x.l+': '+P(x.v)+'"></span>':'';}).join('');
  $('tierLbl').innerHTML=parts.map(function(x){return '<span>'+x.l+'</span>';}).join('');

  var h=r.rows.map(function(b){return '<tr'+(b.part?'':' class="z"')+'><td>'+range(b)+'</td><td>'+P(b.part)+'</td><td>'+pct(b.rate)+'</td><td>'+P(b.tax)+'</td></tr>';}).join('');
  if(r.ads)h+='<tr class="ads"><td>Supplément pour logement supplémentaire</td><td>'+P(price)+'</td><td>8 % forfaitaire</td><td>'+P(r.ads)+'</td></tr>';
  $('bandBody').innerHTML=h;C.text('totTax',P(r.total));

  var rc=$('reclaimOut'),on=$('reclaim').checked;
  rc.hidden=!on;
  rc.textContent=r.ads?'Remboursement potentiel de l’ADS si vous vendez votre ancienne résidence principale dans les 36 mois : '+P(r.ads)+'.':'Aucun ADS sur cette transaction, donc rien à récupérer.';

  /* comparison matrix */
  var e=eng(price,buyer),w=wal(price,buyer),lbl={ftb:'primo-accédant',main:'résidence principale',ads:'bien supplémentaire',nonres:'non-residential'}[buyer];
  C.text('mxSub','Montant dû au titre des trois taxes britanniques sur les transactions foncières pour le même '+P(price)+' '+lbl+' achat.');
  function vs(x){var d=x-r.total;return Math.abs(d)<1?'<b>Identique</b>':'<b class="'+(d<0?'lo':'hi')+'">'+(d<0?P(-d)+' cheaper':'+'+P(d)+' higher')+'</b>';}
  var sDesc=buyer==='nonres'?'Non résidentiel : 0 % jusqu’à 150 k£, 1 % jusqu’à 250 k£, 5 % au-delà.':buyer==='ftb'?'Primo-accédant : 0 % jusqu’à 175 k£, puis 2 % / 5 % / 10 % / 12 %.':'0 % jusqu’à 145 k£, 2 % jusqu’à 250 k£, 5 % jusqu’à 325 k£, 10 % jusqu’à 750 k£, 12 % au-delà'+(buyer==='ads'?', plus 8 % d’ADS sur la totalité du prix.':'.');
  var eDesc=buyer==='nonres'?'Non résidentiel : 0 % jusqu’à 150 k£, 2 % jusqu’à 250 k£, 5 % au-delà.':buyer==='ftb'&&price<=500000?'Allègement primo-accédant : 0 % jusqu’à 300 k£, 5 % jusqu’à 500 k£.':'0 % jusqu’à 125 k£, 2 % jusqu’à 250 k£, 5 % jusqu’à 925 k£'+(buyer==='ads'?', plus la majoration de 5 % sur chaque tranche.':(buyer==='ftb'?' — au-delà de 500 k£, donc aucun allègement primo-accédant.':'.'));
  var wDesc=buyer==='nonres'?'Non résidentiel : 0 % jusqu’à 225 k£, 1 % jusqu’à 250 k£, 5 % jusqu’à 1 M£, 6 % au-delà.':buyer==='ads'?'Taux résidentiels majorés à partir de 5 % sur les premiers 180 k£.':'0 % jusqu’à 225 k£, 6 % jusqu’à 400 k£, 7,5 % jusqu’à 750 k£'+(buyer==='ftb'?' — aucun allègement distinct pour les primo-accédants.':'.');
  $('mxGrid').innerHTML=
    '<div class="sx-nc on"><div class="t"><b>Écosse (LBTT)</b><em>Revenue Scotland</em></div><div class="v">'+P(r.total)+'</div><p>'+sDesc+'</p><div class="f"><span>Taux effectif :</span><b>'+(r.total/p*100).toFixed(2)+'%</b></div></div>'+
    '<div class="sx-nc"><div class="t"><b>Angleterre &amp; Irlande du Nord (SDLT)</b><em>HMRC</em></div><div class="v">'+P(e)+'</div><p>'+eDesc+'</p><div class="f"><span>Écart par rapport à l’Écosse :</span>'+vs(e)+'</div></div>'+
    '<div class="sx-nc"><div class="t"><b>Pays de Galles (LTT)</b><em>WRA</em></div><div class="v">'+P(w)+'</div><p>'+wDesc+'</p><div class="f"><span>Écart par rapport à l’Écosse :</span>'+vs(w)+'</div></div>';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'lbttCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  var ex=$('load465');
  if(ex) ex.addEventListener('click',function(){
    $('price').value='465000';
    $('buyer').value='nonres';
    $('price').dispatchEvent(new Event('input',{bubbles:true}));
    if(window.innerWidth<1024) $('results').scrollIntoView({behavior:'smooth',block:'start'});
  });
});
window.cpLbtt={scot:scot,eng:eng,wal:wal};
})();
