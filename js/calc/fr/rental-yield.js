/* Rental yield calculator — CalculatePilot (Stitch 1:1 redesign).
   EGI = rent × 12 × (1 − vacancy); opex = mgmt% × EGI + tax + insurance + maint% × gross rent + HOA;
   NOI = EGI − opex; cap rate = NOI ÷ price; cash flow = NOI − P&I; CoC = cash flow ÷ (down + closing);
   10-year forecast with appreciation and rent/cost growth. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function S(x){return (x>=0?'+':'')+M(x);}
function pc(x,dp){return isFinite(x)?(x<0?'−':'')+Math.abs(x).toFixed(dp===undefined?2:dp)+'%':'—';}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}
function bal(P,apr,n,k){var i=apr/100/12,pay=pmt(P,apr,n);if(k>=n)return 0;if(!i)return Math.max(0,P-pay*k);var p=Math.pow(1+i,k);return Math.max(0,P*p-pay*(p-1)/i);}

function inputs(){
  return {price:Math.max(0,v('price')),down:Math.max(0,v('down')),rate:Math.max(0,v('rate')),term:Math.max(1,v('term')),closing:Math.max(0,v('closing')),rent:Math.max(0,v('rent')),
    vac:Math.min(100,Math.max(0,v('vac'))),mgmt:Math.max(0,v('mgmt')),ptax:Math.max(0,v('ptax')),ins:Math.max(0,v('ins')),maint:Math.max(0,v('maint')),hoa:Math.max(0,v('hoa')),appr:v('appr'),rg:v('rg')};
}

function year(o,g){ /* g = growth factor applied to rent and costs */
  var gpr=o.rent*12*g,vac=gpr*o.vac/100,egi=gpr-vac,mg=egi*o.mgmt/100,mt=gpr*o.maint/100,tx=o.ptax*g,ins=o.ins*g,hoa=o.hoa*12*g,opex=mg+mt+tx+ins+hoa;
  return {gpr:gpr,vac:vac,egi:egi,mg:mg,mt:mt,tx:tx,ins:ins,hoa:hoa,opex:opex,noi:egi-opex};
}

function calc(o){
  var loan=Math.max(0,o.price-o.down),n=o.term*12,pay=pmt(loan,o.rate,n),ds=pay*12,y1=year(o,1),cf=y1.noi-ds,cashIn=o.down+o.closing;
  var rows=[],cum=0;
  for(var k=1;k<=10;k++){var y=year(o,Math.pow(1+o.rg/100,k-1)),c=y.noi-(k*12<=n?ds:Math.max(0,n-(k-1)*12)/12*ds);cum+=c;
    var val=o.price*Math.pow(1+o.appr/100,k),b=bal(loan,o.rate,n,k*12),eq=val-b;
    rows.push({k:k,val:val,rent:y.gpr,bal:b,eq:eq,cum:cum,roi:cashIn>0?(eq+cum-cashIn)/cashIn*100:0});}
  return {loan:loan,pay:pay,ds:ds,y1:y1,cf:cf,cashIn:cashIn,cap:o.price>0?y1.noi/o.price*100:0,gross:o.price>0?o.rent*12/o.price*100:0,coc:cashIn>0?cf/cashIn*100:0,dscr:ds>0?y1.noi/ds:Infinity,rows:rows};
}

function compute(){
  var o=inputs(),r=calc(o),y=r.y1;last={o:o,r:r};
  C.text('downLbl','Apport ('+(o.price>0?Math.round(o.down/o.price*1000)/10:0)+'%)');C.text('cashIn',M(r.cashIn));
  C.text('rentYr','Annualisé : '+M(o.rent*12)+'/yr');C.text('vacNote',o.vac.toFixed(1)+'% ('+Math.round(o.vac/100*365)+' days/yr)');
  C.text('mgmtMo',M(y.mg/12)+' / mo');C.text('ptaxMo',M(y.tx/12)+' / mo');C.text('insMo',M(y.ins/12)+' / mo');C.text('maintMo',M(y.mt/12)+' / mo');C.text('hoaMo',M(y.hoa/12)+' / mo');
  C.text('opxTot',M(y.opex/12)+' / mo ('+M(y.opex)+'/yr)');

  C.text('resultValue',pc(r.cap));var ct=$('capTag');if(r.cap>=7){ct.textContent='Rendement élevé';ct.className='';}else if(r.cap>=5){ct.textContent='Rendement modéré';ct.className='mid';}else{ct.textContent='Rendement faible';ct.className='lo';}
  C.text('gross',pc(r.gross));C.text('coc',pc(r.coc));
  C.text('cfMo',S(r.cf/12));C.text('cfYr',S(r.cf)+' / yr');C.text('cfLbl',r.cf>=0?'Excédent de liquidités annuel':'Déficit annuel');$('cfBox').className='sx-ry-cf'+(r.cf<0?' neg':'');

  C.text('w1',M(y.gpr));C.text('w2l','(−) Perte due à la vacance ('+o.vac+'%)');C.text('w2','−'+M(y.vac));C.text('w3',M(y.egi));C.text('w4','−'+M(y.opex));C.text('w5',M(y.noi));C.text('w6','−'+M(r.ds));C.text('w7',M(r.cf));
  $('wTot').className='tot'+(r.cf<0?' neg':'');

  var d=r.dscr,db=$('dscrBar'),dt=$('dscr');C.text('dscr',isFinite(d)?d.toFixed(2)+'x':'Sans dette');
  db.style.width=(isFinite(d)?Math.min(100,d/2*100):100)+'%';db.className=d<1.2?'bad':'';dt.className=d<1.2?'bad':'';
  C.text('dscrTxt',!isFinite(d)?'Achat comptant':d>=1.25?'Couverture confortable':d>=1.2?'Respecte le minimum habituel':d>=1?'Juste — sous le minimum de la plupart des prêteurs':'Le résultat net d’exploitation ne couvre pas le prêt immobilier');
  var op=o.price>0?o.rent/o.price*100:0;C.text('onep',pc(op));
  C.text('onepTxt','Le loyer mensuel représente '+pc(op)+' du prix d’achat. La règle des 1 % est un filtre rapide qui favorise les marchés à fort flux de trésorerie ; de nombreuses régions sont bien en dessous.');
  C.text('opexRatio','Vos données : '+pc(y.gpr>0?(y.vac+y.opex)/y.gpr*100:0,1)+' du loyer brut (vacance comprise).');

  C.text('fcSub','Suppose '+o.appr+'% de valorisation annuelle et '+o.rg+'% de croissance annuelle des loyers et des charges ; le prêt s’amortit selon l’échéancier.');
  var show=[1,2,3,4,5,7,10];
  $('fcBody').innerHTML=r.rows.filter(function(x){return show.indexOf(x.k)>=0;}).map(function(x){var hl=x.k===5||x.k===10;
    return '<tr'+(hl?' class="hl"':'')+'><td>Année '+x.k+'</td><td>'+M(x.val)+'</td><td>'+M(x.rent)+'</td><td class="mu">'+M(x.bal)+'</td><td>'+M(x.eq)+'</td><td>'+M(x.cum)+'</td><td class="'+(x.roi>=0?'up':'dn')+'">'+(x.roi>=0?'+':'')+x.roi.toFixed(1)+'%</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ryCalc',compute:compute});
  var ox=$('opx');ox.querySelector('button').addEventListener('click',function(){var open=!ox.classList.contains('open');ox.classList.toggle('open',open);this.setAttribute('aria-expanded',String(open));});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('rental-property-10-year.csv',[{h:'Année',key:'k'},{h:'Valeur du bien',key:'val'},{h:'Loyer brut / an',key:'rent'},{h:'Capital restant dû',key:'bal'},{h:'Capital net (equity)',key:'eq'},{h:'Flux de trésorerie cumulé',key:'cum'},{h:'ROI total (%)',key:'roi'}],last.r.rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpRentalYield={calc:calc};
})();
