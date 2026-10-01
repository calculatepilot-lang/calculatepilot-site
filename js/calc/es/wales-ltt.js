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
function range(r){return r.lo===0?'Hasta '+P(r.hi):r.hi===Infinity?'Más de '+P(r.lo):P(r.lo+1)+' to '+P(r.hi);}

function ltt(price,mode){return slices(price,W[mode]||W.main);}
function sdlt(price,mode){if(mode==='nonres')return slices(price,E.nonres).total;return slices(price,E.std).total+(mode==='higher'&&price>=40000?price*.05:0);}
function lbtt(price,mode){if(mode==='nonres')return slices(price,S.nonres).total;return slices(price,S.std).total+(mode==='higher'&&price>=40000?price*.08:0);}

function compute(){
  var price=Math.max(0,v('price')),mode=$('mode').value,r=ltt(price,mode),p=price||1;
  C.text('resultValue',P(r.total));C.text('effBadge','Tipo efectivo: '+(r.total/p*100).toFixed(2)+'%');
  var nil=r.rows[0].rate===0?r.rows[0].hi:0;
  C.text('aboveNil',nil?(price>nil?P(price-nil)+' por encima del tramo exento':'Dentro del '+P(nil)+' tramo exento'):'Tributa desde la primera libra');
  C.text('tableTag',mode==='higher'?'Tipos residenciales superiores':mode==='nonres'?'Tipos no residenciales':'Tipos residenciales estándar');

  /* composition bar: share of the price in each tranche */
  var parts=r.rows.filter(function(b){return b.part>0;});
  $('tierBar').innerHTML=parts.map(function(b){var i=r.rows.indexOf(b);return '<span style="width:'+(b.part/p*100)+'%;background:'+COL[Math.min(i,COL.length-1)]+'" title="'+range(b)+' at '+pct(b.rate)+': '+P(b.part)+'"></span>';}).join('');
  $('tierLbl').innerHTML=parts.map(function(b){var i=r.rows.indexOf(b);return '<span style="display:flex;align-items:center;gap:4px"><i style="width:8px;height:8px;border-radius:50%;display:inline-block;background:'+COL[Math.min(i,COL.length-1)]+'"></i>'+(b.rate===0?'Tramo exento':pct(b.rate)+' Tramo')+'</span>';}).join('');

  var top=-1;r.rows.forEach(function(b,i){if(b.part>0&&b.rate>0)top=i;});
  $('trancheList').innerHTML=r.rows.map(function(b,i){return '<div class="r'+(i===top?' on':'')+(b.part?'':' z')+'"><div><b>Tramo '+(i+1)+': '+range(b)+'</b><small>Tipo legal: '+pct(b.rate)+'</small></div><div><small>Parte: '+P(b.part)+'</small><span class="tx">'+P(b.tax)+'</span></div></div>';}).join('');

  document.querySelectorAll('#schedTable tr[data-lo]').forEach(function(tr){var lo=+tr.getAttribute('data-lo'),hi=+tr.getAttribute('data-hi');tr.classList.toggle('you',mode!=='nonres'&&price>lo&&price<=hi);});

  var e=sdlt(price,mode),s=lbtt(price,mode),lbl={main:'residencia principal',higher:'propiedad adicional',nonres:'non-residential'}[mode];
  C.text('cbSub','Equivalente '+lbl+' operaciones en los sistemas de impuestos sobre la propiedad de las administraciones descentralizadas del Reino Unido con un '+P(price)+' precio de compra.');
  function card(on,region,tag,code,name,val,desc){return '<div class="sx-card sx-nc3'+(on?' on':'')+'">'+(on?'<span class="tag">ESTA CALCULADORA</span>':'')+'<div class="t"><span>'+region+'</span><em>'+tag+'</em></div><h3>'+code+'</h3><p class="sub">'+name+'</p><div class="v">'+P(val)+'</div><div class="er">Tipo efectivo: '+(val/p*100).toFixed(2)+'%</div><p class="d">'+desc+'</p></div>';}
  var eD=mode==='nonres'?'No residencial: 0 % hasta £150k, 2 % hasta £250k, 5 % por encima.':'tramo exento de £125,000, 2% hasta £250k y luego 5% hasta £925k'+(mode==='higher'?', más un recargo del 5% en cada tramo.':'. First-time buyers pay 0% to £300k (price cap £500k).');
  var wD=mode==='nonres'?'0% hasta £225k, 1% hasta £250k, 5% hasta £1m, 6% por encima.':mode==='higher'?'Tabla separada de tipos superiores desde el 5% sobre las primeras £180,000.':'Tramo exento de £225,000 para todos los compradores de vivienda; el 6% se aplica entre £225k y £400k.';
  var sD=mode==='nonres'?'No residencial: 0 % hasta £150k, 1 % hasta £250k, 5 % por encima.':'Tramo exento de £145,000 (£175k para compradores de primera vivienda); 2% hasta £250k y 5% hasta £325k'+(mode==='higher'?', más un 8 % de ADS sobre el precio total.':'.');
  $('cbGrid').innerHTML=card(false,'Inglaterra e Irlanda del Norte','HMRC','SDLT','Impuesto de timbre sobre la tierra (Stamp Duty Land Tax)',e,eD)+card(true,'Gales','WRA','LTT','Impuesto sobre transacciones de tierras (Land Transaction Tax)',r.total,wD)+card(false,'Escocia','Revenue Scotland','LBTT','Impuesto sobre transacciones de tierras y edificios (Land and Buildings Transaction Tax)',s,sD);
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
