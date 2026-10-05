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
function range(r){return r.lo===0?'Up to '+P(r.hi):r.hi===Infinity?'Over '+P(r.lo):P(r.lo+1)+' to '+P(r.hi);}

function ltt(price,mode){return slices(price,W[mode]||W.main);}
function sdlt(price,mode){if(mode==='nonres')return slices(price,E.nonres).total;return slices(price,E.std).total+(mode==='higher'&&price>=40000?price*.05:0);}
function lbtt(price,mode){if(mode==='nonres')return slices(price,S.nonres).total;return slices(price,S.std).total+(mode==='higher'&&price>=40000?price*.08:0);}

function compute(){
  var price=Math.max(0,v('price')),mode=$('mode').value,r=ltt(price,mode),p=price||1;
  C.text('resultValue',P(r.total));C.text('effBadge','Effective Rate: '+(r.total/p*100).toFixed(2)+'%');
  var nil=r.rows[0].rate===0?r.rows[0].hi:0;
  C.text('aboveNil',nil?(price>nil?P(price-nil)+' above nil-rate band':'Within the '+P(nil)+' nil-rate band'):'Taxed from the first pound');
  C.text('tableTag',mode==='higher'?'Higher Residential Rates':mode==='nonres'?'Non-Residential Rates':'Standard Residential Rates');

  /* composition bar: share of the price in each tranche */
  var parts=r.rows.filter(function(b){return b.part>0;});
  $('tierBar').innerHTML=parts.map(function(b){var i=r.rows.indexOf(b);return '<span style="width:'+(b.part/p*100)+'%;background:'+COL[Math.min(i,COL.length-1)]+'" title="'+range(b)+' at '+pct(b.rate)+': '+P(b.part)+'"></span>';}).join('');
  $('tierLbl').innerHTML=parts.map(function(b){var i=r.rows.indexOf(b);return '<span style="display:flex;align-items:center;gap:4px"><i style="width:8px;height:8px;border-radius:50%;display:inline-block;background:'+COL[Math.min(i,COL.length-1)]+'"></i>'+(b.rate===0?'Nil Band':pct(b.rate)+' Band')+'</span>';}).join('');

  var top=-1;r.rows.forEach(function(b,i){if(b.part>0&&b.rate>0)top=i;});
  $('trancheList').innerHTML=r.rows.map(function(b,i){return '<div class="r'+(i===top?' on':'')+(b.part?'':' z')+'"><div><b>Band '+(i+1)+': '+range(b)+'</b><small>Statutory Rate: '+pct(b.rate)+'</small></div><div><small>Portion: '+P(b.part)+'</small><span class="tx">'+P(b.tax)+'</span></div></div>';}).join('');

  document.querySelectorAll('#schedTable tr[data-lo]').forEach(function(tr){var lo=+tr.getAttribute('data-lo'),hi=+tr.getAttribute('data-hi');tr.classList.toggle('you',mode!=='nonres'&&price>lo&&price<=hi);});

  var e=sdlt(price,mode),s=lbtt(price,mode),lbl={main:'main residence',higher:'additional property',nonres:'non-residential'}[mode];
  C.text('cbSub','Equivalent '+lbl+' transactions across the devolved UK property tax systems at a '+P(price)+' purchase price.');
  function card(on,region,tag,code,name,val,desc){return '<div class="sx-card sx-nc3'+(on?' on':'')+'">'+(on?'<span class="tag">THIS CALCULATOR</span>':'')+'<div class="t"><span>'+region+'</span><em>'+tag+'</em></div><h3>'+code+'</h3><p class="sub">'+name+'</p><div class="v">'+P(val)+'</div><div class="er">Effective rate: '+(val/p*100).toFixed(2)+'%</div><p class="d">'+desc+'</p></div>';}
  var eD=mode==='nonres'?'Non-residential: 0% to £150k, 2% to £250k, 5% above.':'£125,000 nil-rate band, 2% to £250k, then 5% to £925k'+(mode==='higher'?', plus a 5% surcharge on every band.':'. First-time buyers pay 0% to £300k (price cap £500k).');
  var wD=mode==='nonres'?'0% to £225k, 1% to £250k, 5% to £1m, 6% above.':mode==='higher'?'Separate higher-rate table from 5% on the first £180,000.':'£225,000 nil-rate band for all home buyers; 6% applies between £225k and £400k.';
  var sD=mode==='nonres'?'Non-residential: 0% to £150k, 1% to £250k, 5% above.':'£145,000 nil-rate band (£175k for first-time buyers); 2% to £250k and 5% to £325k'+(mode==='higher'?', plus 8% ADS on the whole price.':'.');
  $('cbGrid').innerHTML=card(false,'England &amp; Northern Ireland','HMRC','SDLT','Stamp Duty Land Tax',e,eD)+card(true,'Wales','WRA','LTT','Land Transaction Tax',r.total,wD)+card(false,'Scotland','Revenue Scotland','LBTT','Land and Buildings Transaction Tax',s,sD);
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
