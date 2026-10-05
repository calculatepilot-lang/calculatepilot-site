/* Car lease calculator — CalculatePilot (Stitch 1:1 redesign).
   Money-factor method: depreciation = (net cap − residual) / term, rent = (net cap + residual) × MF.
   Tax on each payment or upfront on the total of payments; lease vs buy comparison at the same APR (MF × 2400). */
(function(){
var C=window.CPX,$=C.$,v=C.val;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function K(x){return '$'+(x/1000).toFixed(1)+'k';}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}
function balAfter(P,apr,n,k){var i=apr/100/12,pay=pmt(P,apr,n);if(!i)return Math.max(0,P-pay*k);var p=Math.pow(1+i,k);return Math.max(0,P*p-pay*(p-1)/i);}

function calc(o){
  var netCap=Math.max(0,o.price-o.down-o.rebate),res=o.msrp*o.resPct/100;
  var dep=(netCap-res)/o.term,rent=(netCap+res)*o.mf,base=Math.max(0,dep+rent);
  var monthlyTax=o.taxMode==='monthly'?base*o.tax/100:0,upTax=o.taxMode==='upfront'?base*o.term*o.tax/100:0;
  var pay=base+monthlyTax,drive=o.down+pay+o.acq+upTax,outlay=o.down+o.acq+upTax+pay*o.term+o.disp;
  return {netCap:netCap,res:res,dep:dep,rent:rent,base:base,monthlyTax:monthlyTax,upTax:upTax,pay:pay,drive:drive,outlay:outlay,apr:o.mf*2400};
}

function buy(o,r,n){
  var cost=Math.max(0,o.price-o.rebate),dn=cost*0.10,taxUp=cost*o.tax/100,P=cost-dn,p=pmt(P,r.apr,n),h=Math.min(o.term,n);
  var bal=balAfter(P,r.apr,n,h),eq=r.res-bal,out=dn+taxUp+p*h;
  return {pay:p,due:dn+taxUp,dn:dn,eq:eq,out:out,net:out-eq,bal:bal};
}

function inputs(){
  return {msrp:Math.max(0,v('msrp')),price:Math.max(0,v('price')),resPct:Math.min(100,Math.max(0,v('resPct'))),term:Math.max(1,v('term')),mf:Math.max(0,v('mf')),
    down:Math.max(0,v('down')),rebate:Math.max(0,v('rebate')),acq:Math.max(0,v('acq')),disp:Math.max(0,v('disp')),tax:Math.max(0,v('tax')),miles:Math.max(0,v('miles')),taxMode:$('taxMode').value};
}

function compute(){
  var o=inputs(),r=calc(o),T=o.term,yrs=T/12,yl=(yrs%1?yrs.toFixed(2).replace(/0$/,''):yrs)+'-Year';
  var disc=o.msrp>0?(o.msrp-o.price)/o.msrp*100:0,dn=$('discNote');
  dn.textContent=disc>=0?disc.toFixed(2)+'% de descuento del concesionario':Math.abs(disc).toFixed(2)+'% sobre el MSRP';dn.className=disc>=0?'':'warn';
  $('resNote').innerHTML=o.resPct.toFixed(1)+'% <small>('+M(r.res)+')</small>';
  C.text('resLo','40% ('+K(o.msrp*0.4)+')');C.text('resHi','75% ('+K(o.msrp*0.75)+')');
  C.text('aprOut',r.apr.toFixed(2)+'%');C.text('aprEq','= '+o.mf+' × 2400');

  C.text('termPill',T+' Meses');C.text('resultValue',M(r.pay));C.text('basePay',M(r.base));
  if(o.taxMode==='monthly'){C.text('taxLbl','Impuesto mensual ('+o.tax+'%):');C.text('taxPay',M(r.monthlyTax));C.text('itTaxLbl','Impuesto sobre las ventas aplicable');}
  else{C.text('taxLbl','Impuesto inicial ('+o.tax+'%):');C.text('taxPay',M(r.upTax));C.text('itTaxLbl','Impuesto sobre las ventas (pagado al inicio)');}
  var t=r.pay||1,dep=Math.max(0,r.dep),segs=[[dep,'var(--sx-pc)'],[r.rent,'var(--sx-secondary)'],[r.monthlyTax,'var(--sx-outline)']];
  $('anatBar').innerHTML=segs.map(function(s){return '<span style="width:'+Math.max(0,s[0]/t*100)+'%;background:'+s[1]+'"></span>';}).join('');
  C.text('anatTot','100 % de '+M(r.pay));
  function it(id,x){$(id).innerHTML=M(x,2)+'<small>('+(r.pay>0?(x/r.pay*100).toFixed(1):'0.0')+'%)</small>';}
  it('itDep',r.dep);it('itRent',r.rent);it('itTax',r.monthlyTax);

  var ratio=o.msrp>0?r.pay/o.msrp*100:0,g=$('grade'),gi=g.querySelector('.msym');
  C.text('ratio',ratio.toFixed(2)+'% del MSRP');$('ratioBar').style.width=Math.min(100,ratio/2*100)+'%';
  if(ratio<=1){C.text('gradeTxt','Excelente relación calidad-precio');g.className='sx-au-grade';gi.textContent='thumb_up';}
  else if(ratio<=1.25){C.text('gradeTxt','Trato justo');g.className='sx-au-grade mid';gi.textContent='thumbs_up_down';}
  else{C.text('gradeTxt','Por encima de lo habitual');g.className='sx-au-grade hi';gi.textContent='thumb_down';}
  C.text('ratioTxt','La cuota mensual del leasing ('+M(r.pay)+') es aproximadamente '+ratio.toFixed(2)+'% del MSRP original ('+K(o.msrp)+'). Una regla práctica habitual considera que una cuota igual o inferior al 1 % del MSRP es un leasing muy bueno.');
  C.text('driveOff',M(r.drive));C.text('driveNote','Inicial + 1.er mes + adquisición'+(r.upTax?' + impuestos':''));
  C.text('outLbl','Total '+yl+' Desembolso');C.text('outlay',M(r.outlay));C.text('outNote',T+' cuotas + pagos iniciales + disposición');

  /* lease vs buy at the same APR, over the lease term */
  var b1=buy(o,r,T),b2=buy(o,r,72),miles=o.miles*T/12;
  C.text('cH1',T+'Leasing de meses (modelado)');C.text('cH2',T+'Compra con préstamo de meses');
  C.text('cPay1',M(r.pay)+' / mo');C.text('cPay2',M(b1.pay)+' / mo');C.text('cPay3',M(b2.pay)+' / mo');
  C.text('cDue1',M(r.drive));C.text('cDue2',M(b1.due)+' (10 % + impuestos)');C.text('cDue3',M(b2.due)+' (10 % + impuestos)');
  C.text('cEqLbl','Capital retenido en el mes '+T);
  C.text('cEq1','$0 (derecho de compra a '+M(r.res)+')');C.text('cEq2',M(b1.eq)+' (100 % en propiedad)');C.text('cEq3','~'+M(b2.eq)+' (Neto tras '+M(b2.bal)+' deuda)');
  C.text('cMi1',miles.toLocaleString('es-ES')+' millas en total, con recargos por exceso a partir de ahí');
  C.text('cMt1',T<=36?'Normalmente dentro de la garantía de fábrica':'La garantía puede vencer antes de que termine el leasing');
  C.text('cMt2',T<=36?'Cubierto durante los años 1–'+Math.ceil(T/12)+' (garantía típica)':'En parte fuera de la garantía típica de 3 años');
  C.text('cMt3','Sin cobertura en los años 4–6 (mayor riesgo)');
  C.text('cOutLbl','Total '+yl+' Desembolso de capital');
  C.text('cOut1',M(r.outlay));C.text('cOut2',M(b1.out));C.text('cOut3',M(b2.out));
  C.text('cNet1',M(r.outlay));C.text('cNet2',M(b1.net));C.text('cNet3',M(b2.net));
  C.text('cmpNote','Las columnas del préstamo suponen una entrada del 10 % sobre el precio tras los descuentos, el impuesto sobre las ventas pagado en la firma y la misma '+r.apr.toFixed(2)+'% de TAE que el factor de dinero del leasing. El capital usa el valor residual del leasing ('+M(r.res)+') como valor del coche en el mes '+T+'. Net cost = outlay minus equity; insurance, registration and maintenance are excluded.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'leaseCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpLease={calc:calc,pmt:pmt};
})();
