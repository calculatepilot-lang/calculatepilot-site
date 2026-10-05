/* UK Stamp Duty Land Tax (England & NI) — CalculatePilot (Stitch 1:1 redesign).
   Residential bands from 1 April 2025, first-time buyer relief (≤ £500k), 5% additional-dwelling
   surcharge (from £40k), 2% non-UK resident surcharge, 17% corporate flat rate (> £500k),
   non-residential / mixed-use table. Verified against GOV.UK. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var STD=[[125000,0],[250000,.02],[925000,.05],[1500000,.10],[Infinity,.12]];
var FTB=[[300000,0],[500000,.05]];
var NONRES=[[150000,0],[250000,.02],[Infinity,.05]];
var gbp=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0});
function P(x){return gbp.format(Math.round(x));}
function pct(x){return (Math.round(x*10000)/100).toString()+'%';}

function slices(price,table,extra){
  var prev=0,rows=[],total=0;
  table.forEach(function(b){var up=b[0],part=Math.max(0,Math.min(price,up)-prev),tax=part*(b[1]+extra);rows.push({lo:prev,hi:up,rate:b[1],extra:extra,part:part,tax:tax});total+=tax;prev=up;});
  return {rows:rows,total:total};
}
function label(r,i){return 'Band '+(i+1)+': '+(r.lo===0?'Up to '+P(r.hi):r.hi===Infinity?'Over '+P(r.lo):P(r.lo+1)+' to '+P(r.hi));}

function calc(o){
  var price=o.price,res=o.buyer!=='nonres';
  if(!res){var nr=slices(price,NONRES,0);return {kind:'nonres',total:nr.total,rows:nr.rows,table:'NONRES'};}
  var sur=(o.buyer==='add'||o.corp)&&price>=40000?.05:0,nonUk=o.nonUk?.02:0;
  if(o.corp&&price>500000){var rate=.17+nonUk;return {kind:'corp17',total:price*rate,rows:[{flat:true,rate:.17,extra:nonUk,part:price,tax:price*rate}],table:'CORP'};}
  var ftb=o.buyer==='ftb'&&!o.corp&&price<=500000;
  var s=slices(price,ftb?FTB:STD,sur+nonUk);
  return {kind:ftb?'ftb':o.buyer,total:s.total,rows:s.rows,table:ftb?'FTB':'STD',sur:sur,nonUk:nonUk};
}

function compute(){
  var o={price:Math.max(0,v('price')),buyer:$('buyer').value,nonUk:$('nonUk').checked,corp:$('corp').checked};
  var r=calc(o),price=o.price||1,res=o.buyer!=='nonres';
  var mover=calc({price:o.price,buyer:'move',nonUk:o.nonUk,corp:false}).total;
  C.text('resultValue',P(r.total));
  var eff=o.price?r.total/o.price:0;
  C.text('effBadge','Effective Rate: '+(eff*100).toFixed(2)+'%'+(r.kind==='ftb'?' with FTB Relief':''));
  C.text('rateCode',r.table==='NONRES'?'SDLT-NONRES · mixed use':r.table==='CORP'?'SDLT-CORP · 17% flat':'SDLT-RES · 1 Apr 2025');
  $('ftbBadge').textContent=o.buyer==='ftb'&&!o.corp&&o.price>500000?'Over £500k — No Relief':'Relief Active';

  /* relief / surcharge card */
  var card=$('reliefCard'),warn=false,icon='savings',title,sub,amt;
  var nuTxt=o.nonUk&&res?' Includes the 2% non-UK resident surcharge ('+P(o.price*.02)+').':'';
  if(!res){icon='storefront';title='Non-Residential Rates';sub='Residential reliefs and surcharges don\'t apply to mixed-use or commercial purchases.';amt=pct(eff);}
  else if(r.kind==='corp17'){warn=true;icon='corporate_fare';title='Corporate 17% Flat Rate';sub='A company pays '+P(r.total-mover)+' more than an individual home mover at this price. Qualifying businesses can claim relief.'+nuTxt;amt='+'+P(r.total-mover);}
  else if(r.kind==='ftb'){title='First-Time Buyer Relief Saving';sub='You are saving <strong>'+P(mover-r.total)+'</strong> compared to a home mover rate.'+nuTxt;amt=P(mover-r.total);}
  else if(o.buyer==='ftb'){warn=true;icon='block';title='First-Time Buyer Relief Not Available';sub=o.corp?'Relief is only for individuals buying their first home.':'The price is over £500,000, so standard rates apply to the whole price.';amt=P(0);}
  else if(o.buyer==='add'||o.corp){warn=true;icon='add_home';title='Additional Property Surcharge';sub=r.sur?'The 5% higher rates add <strong>'+P(r.total-mover)+'</strong> compared with a home mover.'+nuTxt:'No surcharge below £40,000.';amt='+'+P(r.total-mover);}
  else{icon='home';var f=calc({price:o.price,buyer:'ftb',nonUk:o.nonUk,corp:false}).total,a=calc({price:o.price,buyer:'add',nonUk:o.nonUk,corp:false}).total;
    title='Standard Main Residence Rates';sub='No surcharge. As an additional property this would cost <strong>'+P(a-r.total)+'</strong> more'+(o.price<=500000?'; a first-time buyer would save '+P(r.total-f)+'.':'.')+nuTxt;amt=P(r.total);}
  card.classList.toggle('warn',warn);C.text('reliefIcon',icon);C.text('reliefTitle',title);C.html('reliefSub',sub);C.text('reliefAmt',amt);

  C.text('ratioTxt',P(r.total)+' Tax / '+P(o.price)+' Price');$('ratioBar').style.width=Math.min(100,eff*100*4)+'%';
  C.text('ratioL',(eff*100).toFixed(2)+'% Tax Paid');

  /* band table */
  var h='';
  if(r.table==='CORP'){var x=r.rows[0];h='<tr><td>Flat rate on the whole price<small>Corporate purchase of a dwelling over £500,000</small></td><td><span class="rt">17%'+(x.extra?' + 2%':'')+'</span></td><td class="mn">'+P(x.part)+'</td><td class="tx">'+P(x.tax)+'</td></tr>';}
  else r.rows.forEach(function(b,i){var ex=b.extra?' + '+pct(b.extra):'';
    var note=i===0&&r.table==='FTB'?'<small>(FTB: 0% relief applied up to £300,000)</small>':'';
    h+='<tr'+(b.part?'':' class="z"')+'><td>'+label(b,i)+note+'</td><td><span class="rt">'+pct(b.rate)+ex+'</span></td><td class="mn">'+P(b.part)+'</td><td class="tx">'+P(b.tax)+'</td></tr>';});
  $('bandBody').innerHTML=h;C.text('totPortion',P(o.price));C.text('totTax',P(r.total));

  document.querySelectorAll('#schedTable tr[data-lo]').forEach(function(tr){var lo=+tr.getAttribute('data-lo'),hi=+tr.getAttribute('data-hi');tr.classList.toggle('you',res&&o.price>lo&&o.price<=hi);});

  var notes=[];
  if(!res&&(o.nonUk||o.corp))notes.push('The non-UK resident and corporate options only apply to residential purchases, so they are ignored for non-residential property.');
  if(o.buyer==='add'&&o.price<40000&&o.price>0)notes.push('Higher rates for additional dwellings usually start at £40,000, so no surcharge is applied.');
  var n=$('sdNote');n.hidden=!notes.length;n.textContent=notes.join(' ');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sdltCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSdlt={calc:calc};
})();
