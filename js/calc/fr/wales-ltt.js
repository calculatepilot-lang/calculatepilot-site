/* Wales Land Transaction Tax — CalculatePilot (Stitch 1:1 redesign).
   GOV.WALES main residential rates, higher residential rates (from 11 Dec 2024) and
   non-residential rates (from 22 Dec 2020). Comparison uses current SDLT and LBTT tables. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var W={main:[[225000,0],[400000,.06],[750000,.075],[1500000,.10],[Infinity,.12]],higher:[[180000,.05],[250000,.085],[400000,.10],[750000,.125],[1500000,.15],[Infinity,.17]],nonres:[[225000,0],[250000,.01],[1000000,.05],[Infinity,.06]]};
var E={std:[[125000,0],[250000,.02],[925000,.05],[1500000,.10],[Infinity,.12]],nonres:[[150000,0],[250000,.02],[Infinity,.05]]};
var S={std:[[145000,0],[250000,.02],[325000,.05],[750000,.10],[Infinity,.12]],nonres:[[150000,0],[250000,.01],[Infinity,.05]]};
var COL=['var(--sx-sfd)','var(--sx-pc)','var(--sx-secondary)','var(--sx-tertiary)','#141b2b','#64748b'];
var gbp=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0});
function P(x){return gbp.format(Math.round(x));}
function pct(x){return (Math.round(x*1000)/10)+'%';}
function slices(price,t){var prev=0,rows=[],tot=0;t.forEach(function(b){var part=Math.max(0,Math.min(price,b[0])-prev),tax=part*b[1];rows.push({lo:prev,hi:b[0],rate:b[1],part:part,tax:tax});tot+=tax;prev=b[0];});return {rows:rows,total:tot};}
function range(r){return r.lo===0?'Jusqu’à '+P(r.hi):r.hi===Infinity?'Sur '+P(r.lo):P(r.lo+1)+' to '+P(r.hi);}

function ltt(price,mode){return slices(price,W[mode]||W.main);}
function sdlt(price,mode){if(mode==='nonres')return slices(price,E.nonres).total;return slices(price,E.std).total+(mode==='higher'&&price>=40000?price*.05:0);}
function lbtt(price,mode){if(mode==='nonres')return slices(price,S.nonres).total;return slices(price,S.std).total+(mode==='higher'&&price>=40000?price*.08:0);}

function compute(){
  var price=Math.max(0,v('price')),mode=$('mode').value,r=ltt(price,mode),p=price||1;
  C.text('resultValue',P(r.total));C.text('effBadge','Taux effectif : '+(r.total/p*100).toFixed(2)+'%');
  var nil=r.rows[0].rate===0?r.rows[0].hi:0;
  C.text('aboveNil',nil?(price>nil?P(price-nil)+' au-dessus du seuil d\'exonération':'Dans la '+P(nil)+' tranche à taux zéro'):'Imposé dès la première livre');
  C.text('tableTag',mode==='higher'?'Taux majorés pour résidences':mode==='nonres'?'Taux non résidentiels':'Taux résidentiels standard');

  /* composition bar: share of the price in each tranche */
  var parts=r.rows.filter(function(b){return b.part>0;});
  $('tierBar').innerHTML=parts.map(function(b){var i=r.rows.indexOf(b);return '<span style="width:'+(b.part/p*100)+'%;background:'+COL[Math.min(i,COL.length-1)]+'" title="'+range(b)+' at '+pct(b.rate)+': '+P(b.part)+'"></span>';}).join('');
  $('tierLbl').innerHTML=parts.map(function(b){var i=r.rows.indexOf(b);return '<span style="display:flex;align-items:center;gap:4px"><i style="width:8px;height:8px;border-radius:50%;display:inline-block;background:'+COL[Math.min(i,COL.length-1)]+'"></i>'+(b.rate===0?'Tranche à 0 %':pct(b.rate)+' Tranche')+'</span>';}).join('');

  var top=-1;r.rows.forEach(function(b,i){if(b.part>0&&b.rate>0)top=i;});
  $('trancheList').innerHTML=r.rows.map(function(b,i){return '<div class="r'+(i===top?' on':'')+(b.part?'':' z')+'"><div><b>Tranche '+(i+1)+': '+range(b)+'</b><small>Taux légal : '+pct(b.rate)+'</small></div><div><small>Part : '+P(b.part)+'</small><span class="tx">'+P(b.tax)+'</span></div></div>';}).join('');

  document.querySelectorAll('#schedTable tr[data-lo]').forEach(function(tr){var lo=+tr.getAttribute('data-lo'),hi=+tr.getAttribute('data-hi');tr.classList.toggle('you',mode!=='nonres'&&price>lo&&price<=hi);});

  var e=sdlt(price,mode),s=lbtt(price,mode),lbl={main:'résidence principale',higher:'bien supplémentaire',nonres:'non-residential'}[mode];
  C.text('cbSub','Équivalent '+lbl+' transactions dans les systèmes d\'impôt immobilier des nations du Royaume-Uni à un '+P(price)+' prix d\'achat.');
  function card(on,region,tag,code,name,val,desc){return '<div class="sx-card sx-nc3'+(on?' on':'')+'">'+(on?'<span class="tag">CETTE CALCULATRICE</span>':'')+'<div class="t"><span>'+region+'</span><em>'+tag+'</em></div><h3>'+code+'</h3><p class="sub">'+name+'</p><div class="v">'+P(val)+'</div><div class="er">Taux effectif : '+(val/p*100).toFixed(2)+'%</div><p class="d">'+desc+'</p></div>';}
  var eD=mode==='nonres'?'Non résidentiel : 0 % jusqu’à 150 k£, 2 % jusqu’à 250 k£, 5 % au-delà.':'tranche à 0 % jusqu\'à 125 000 £, 2 % jusqu\'à 250 000 £, puis 5 % jusqu\'à 925 000 £'+(mode==='higher'?', plus une surtaxe de 5 % sur chaque tranche.':'. First-time buyers pay 0% to £300k (price cap £500k).');
  var wD=mode==='nonres'?'0 % jusqu\'à 225 000 £, 1 % jusqu\'à 250 000 £, 5 % jusqu\'à 1 M£, 6 % au-delà.':mode==='higher'?'Barème distinct à taux majorés à partir de 5 % sur les 180 000 premières livres.':'Tranche à 0 % jusqu\'à 225 000 £ pour tous les acheteurs ; 6 % s\'applique entre 225 000 £ et 400 000 £.';
  var sD=mode==='nonres'?'Non résidentiel : 0 % jusqu’à 150 k£, 1 % jusqu’à 250 k£, 5 % au-delà.':'Tranche à 0 % jusqu\'à 145 000 £ (175 000 £ pour les primo-accédants) ; 2 % jusqu\'à 250 000 £ et 5 % jusqu\'à 325 000 £'+(mode==='higher'?', plus 8 % d’ADS sur la totalité du prix.':'.');
  $('cbGrid').innerHTML=card(false,'Angleterre &amp; Irlande du Nord','HMRC','SDLT','Stamp Duty Land Tax',e,eD)+card(true,'Pays de Galles','WRA','LTT','Land Transaction Tax',r.total,wD)+card(false,'Écosse','Revenue Scotland','LBTT','Land and Buildings Transaction Tax',s,sD);
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'lttCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  var ex=$('load300');
  if(ex) ex.addEventListener('click',function(){
    $('price').value='300000';
    $('mode').value='nonres';
    $('price').dispatchEvent(new Event('input',{bubbles:true}));
    if(window.innerWidth<1024) $('results').scrollIntoView({behavior:'smooth',block:'start'});
  });
});
window.cpLtt={ltt:ltt,sdlt:sdlt,lbtt:lbtt};
})();
