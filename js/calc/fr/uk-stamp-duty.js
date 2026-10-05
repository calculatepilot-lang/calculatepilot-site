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
function label(r,i){return 'Tranche '+(i+1)+': '+(r.lo===0?'Jusqu’à '+P(r.hi):r.hi===Infinity?'Sur '+P(r.lo):P(r.lo+1)+' to '+P(r.hi));}

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
  C.text('effBadge','Taux effectif : '+(eff*100).toFixed(2)+'%'+(r.kind==='ftb'?' avec l\'exonération primo-accédant':''));
  C.text('rateCode',r.table==='NONRES'?'SDLT-NONRES · usage mixte':r.table==='CORP'?'SDLT-CORP · 17 % forfaitaire':'SDLT-RES · 1er avr. 2025');
  $('ftbBadge').textContent=o.buyer==='ftb'&&!o.corp&&o.price>500000?'Au-delà de £500k — aucune exonération':'Exonération active';

  /* relief / surcharge card */
  var card=$('reliefCard'),warn=false,icon='savings',title,sub,amt;
  var nuTxt=o.nonUk&&res?' Comprend la surtaxe de 2 % pour non-résidents du Royaume-Uni ('+P(o.price*.02)+').':'';
  if(!res){icon='storefront';title='Taux non résidentiels';sub='Les exonérations et surtaxes résidentielles ne s\'appliquent pas aux achats à usage mixte ou commercial.';amt=pct(eff);}
  else if(r.kind==='corp17'){warn=true;icon='corporate_fare';title='Taux forfaitaire de 17 % pour les sociétés';sub='Une société paie '+P(r.total-mover)+' de plus qu\'un particulier qui déménage, à ce prix. Les entreprises éligibles peuvent demander une exonération.'+nuTxt;amt='+'+P(r.total-mover);}
  else if(r.kind==='ftb'){title='Économie liée à l\'exonération primo-accédant';sub='Vous économisez <strong>'+P(mover-r.total)+'</strong> par rapport au taux d\'un particulier qui déménage.'+nuTxt;amt=P(mover-r.total);}
  else if(o.buyer==='ftb'){warn=true;icon='block';title='Exonération primo-accédant non disponible';sub=o.corp?'L\'exonération est réservée aux particuliers achetant leur premier logement.':'Le prix dépasse £500,000, les taux standard s\'appliquent donc à l\'ensemble du prix.';amt=P(0);}
  else if(o.buyer==='add'||o.corp){warn=true;icon='add_home';title='Surtaxe sur propriété supplémentaire';sub=r.sur?'Les taux majorés de 5 % ajoutent <strong>'+P(r.total-mover)+'</strong> par rapport à un particulier qui déménage.'+nuTxt:'Aucune surtaxe en dessous de £40,000.';amt='+'+P(r.total-mover);}
  else{icon='home';var f=calc({price:o.price,buyer:'ftb',nonUk:o.nonUk,corp:false}).total,a=calc({price:o.price,buyer:'add',nonUk:o.nonUk,corp:false}).total;
    title='Taux standard de résidence principale';sub='Aucune surtaxe. Pour une propriété supplémentaire, cela coûterait <strong>'+P(a-r.total)+'</strong> de plus'+(o.price<=500000?' ; un primo-accédant économiserait '+P(r.total-f)+'.':'.')+nuTxt;amt=P(r.total);}
  card.classList.toggle('warn',warn);C.text('reliefIcon',icon);C.text('reliefTitle',title);C.html('reliefSub',sub);C.text('reliefAmt',amt);

  C.text('ratioTxt',P(r.total)+' Impôt / '+P(o.price)+' Prix');$('ratioBar').style.width=Math.min(100,eff*100*4)+'%';
  C.text('ratioL',(eff*100).toFixed(2)+'% d\'impôt payé');

  /* band table */
  var h='';
  if(r.table==='CORP'){var x=r.rows[0];h='<tr><td>Taux forfaitaire sur l\'ensemble du prix<small>Achat par une société d\'un logement de plus de £500,000</small></td><td><span class="rt">17%'+(x.extra?' + 2%':'')+'</span></td><td class="mn">'+P(x.part)+'</td><td class="tx">'+P(x.tax)+'</td></tr>';}
  else r.rows.forEach(function(b,i){var ex=b.extra?' + '+pct(b.extra):'';
    var note=i===0&&r.table==='FTB'?'<small>(Primo-accédant : exonération de 0 % appliquée jusqu\'à £300,000)</small>':'';
    h+='<tr'+(b.part?'':' class="z"')+'><td>'+label(b,i)+note+'</td><td><span class="rt">'+pct(b.rate)+ex+'</span></td><td class="mn">'+P(b.part)+'</td><td class="tx">'+P(b.tax)+'</td></tr>';});
  $('bandBody').innerHTML=h;C.text('totPortion',P(o.price));C.text('totTax',P(r.total));

  document.querySelectorAll('#schedTable tr[data-lo]').forEach(function(tr){var lo=+tr.getAttribute('data-lo'),hi=+tr.getAttribute('data-hi');tr.classList.toggle('you',res&&o.price>lo&&o.price<=hi);});

  var notes=[];
  if(!res&&(o.nonUk||o.corp))notes.push('Les options non-résident du Royaume-Uni et société ne s\'appliquent qu\'aux achats résidentiels ; elles sont donc ignorées pour un bien non résidentiel.');
  if(o.buyer==='add'&&o.price<40000&&o.price>0)notes.push('Les taux majorés pour logements supplémentaires commencent généralement à £40,000 ; aucune surtaxe n\'est donc appliquée.');
  var n=$('sdNote');n.hidden=!notes.length;n.textContent=notes.join(' ');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sdltCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSdlt={calc:calc};
})();
