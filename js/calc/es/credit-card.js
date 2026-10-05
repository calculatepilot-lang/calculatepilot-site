/* Credit card payoff calculator — CalculatePilot (Stitch 1:1 redesign).
   Monthly simulation at APR ÷ 12. Minimum formulas: 1% of balance + interest (min $25), 2.5% (min $25), 3% (min $35).
   Plan payment = fixed budget, or the level payment for a target horizon, or the minimum — plus extra principal. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function yrs(m){return (Math.round(m/12*10)/10)+' yrs';}
function ym(m){var y=Math.floor(m/12),r=m%12;return (y?y+' Año'+(y===1?'':'s')+' ':'')+r+' Mes'+(r===1?'':'s');}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}
function r50(x){return Math.max(50,Math.round(x/50)*50);}

function minPay(f,b,i){var m=f==='flat'?Math.max(25,b*.025):f==='tier'?Math.max(35,b*.03):Math.max(25,b*.01+b*i);return m;}
function sim(B,apr,payFn){
  var i=apr/100/12,b=B,m=0,int=0,paid=0,bals=[B];
  while(b>0.005&&m<1200){var a=b*i,p=Math.min(payFn(b,i),b+a);if(p<=a+1e-9)return null;b=b+a-p;int+=a;paid+=p;m++;bals.push(Math.max(0,b));}
  return m>=1200?null:{n:m,int:int,paid:paid,bals:bals};
}

function inputs(){return {B:Math.max(0,v('bal')),apr:Math.max(0,v('apr')),f:$('minf').value,mode:$('mode').value,pay:Math.max(0,v('pay')),hz:Math.max(1,Math.round(v('hz'))),extra:Math.max(0,v('extra'))};}

function compute(){
  var o=inputs(),i=o.apr/100/12,mn=sim(o.B,o.apr,function(b,i){return minPay(o.f,b,i);});
  var base=o.mode==='pay'?o.pay:o.mode==='hz'?pmt(o.B,o.apr,o.hz):null;
  var plan=sim(o.B,o.apr,function(b,i){var mp=minPay(o.f,b,i);return (base===null?mp:Math.max(base,mp))+o.extra;});
  $('payRow').hidden=o.mode!=='pay';$('hzRow').hidden=o.mode!=='hz';$('minRow').hidden=o.mode!=='min';
  C.text('payOut',M(o.pay)+' / mo');C.text('hzOut',o.hz+' Meses');C.text('extraOut','+'+M(o.extra)+' / month');
  var first=base===null?minPay(o.f,o.B,i)+o.extra:Math.max(base,minPay(o.f,o.B,i))+o.extra;last={o:o,mn:mn,plan:plan,first:first};

  if(!plan){C.text('resultValue','Nunca se liquida');C.text('saved','El pago no cubre el interés mensual');['int','intMin','out','msav','ysav','date'].forEach(function(k){C.text(k,'—');});}
  else{
    C.text('resultValue','Sin deudas en '+plan.n+' Mes'+(plan.n===1?'':'s'));
    C.text('int',M(plan.int));C.text('out',M(plan.paid));
    if(mn){C.text('saved','+'+M(Math.max(0,mn.int-plan.int))+' Interés ahorrado frente al pago mínimo');C.text('intMin',M(mn.int)+' min');C.text('msav',Math.max(0,mn.n-plan.n)+' Meses');C.text('ysav',yrs(Math.max(0,mn.n-plan.n))+' accelerated');}
    else{C.text('saved','Los pagos mínimos nunca liquidan este saldo');C.text('intMin','');C.text('msav','—');C.text('ysav','');}
    var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+plan.n);C.text('date',MON[d.getMonth()]+' '+d.getFullYear());
  }
  $('trap').innerHTML=mn?'Pagando solo el mínimo requerido (<b style="color:var(--sx-on)">'+M(minPay(o.f,o.B,i))+'/mo initial</b>) drags payoff out to <b>'+ym(mn.n)+' ('+mn.n+' meses)</b> y cuesta <b>'+M(mn.int)+' en intereses</b>'+(mn.int>o.B?' — más que el saldo original.':'.'):'Con esta TAE, el pago mínimo nunca liquida el saldo.';

  var mx=Math.max(plan?plan.n:0,mn?mn.n:0)||1;
  C.text('b1',plan?plan.n+' Meses ('+yrs(plan.n)+')':'Nunca');$('b1b').style.width=(plan?plan.n/mx*100:100)+'%';
  C.text('b2',mn?mn.n+' Meses ('+yrs(mn.n)+')':'Nunca');$('b2b').style.width=(mn?mn.n/mx*100:100)+'%';
  if(plan){var m1=Math.max(1,Math.round(plan.n*0.25)),m2=Math.max(1,Math.round(plan.n*0.7));
    $('ms').innerHTML='<div><span>Mes '+m1+' Saldo</span><b>'+M(plan.bals[m1])+'</b></div><div><span>Mes '+m2+' Saldo</span><b>'+M(plan.bals[m2])+'</b></div><div><span>Mes '+plan.n+' Completado</span><b>$0.00 Sin deudas</b></div>';}
  else $('ms').innerHTML='';

  var rows=[];
  if(mn)rows.push({k:'Solo pagos mínimos',dot:'r',pay:M(minPay(o.f,o.B,i))+' falling',s:mn,base:true});
  var f1=r50(first*0.65);if(f1<first-1){var s1=sim(o.B,o.apr,function(){return f1;});if(s1)rows.push({k:'Fijos '+M(f1)+' / month',dot:'',pay:M(f1)+' / mo',s:s1});}
  if(plan)rows.push({k:(o.mode==='min'?'Mínimo':'Tu plan')+(o.extra?' + '+M(o.extra)+' Extra':'')+' (Selected)',dot:'g',pay:M(first)+(o.mode==='min'?' falling':' / mo'),s:plan,sel:true});
  var f3=r50(first*1.3);if(f3>first+1){var s3=sim(o.B,o.apr,function(){return f3;});if(s3)rows.push({k:'Agresiva '+M(f3)+' / month',dot:'',pay:M(f3)+' / mo',s:s3});}
  last.rows=rows;
  $('lg').innerHTML=rows.map(function(r){var sv=mn?mn.int-r.s.int:0;return '<tr'+(r.sel?' class="act"':'')+'><td><span class="dot '+r.dot+'"></span>'+r.k+'</td><td>'+r.pay+'</td><td class="'+(r.base?'r':'')+'">'+r.s.n+' Meses ('+yrs(r.s.n)+')</td><td class="'+(r.base?'r':'')+'">'+M(r.s.int)+'</td><td>'+M(r.s.paid)+'</td><td class="'+(r.base?'':'g')+'">'+(r.base?'Referencia (peor caso)':'+'+M(sv)+' saved')+'</td></tr>';}).join('');

  var dpr=o.apr/365;C.text('dprTxt','Con una '+o.apr+'% de TAE, tu tasa periódica diaria es de aproximadamente '+dpr.toFixed(5)+'% por día. En un saldo de '+M(o.B)+' , un ciclo de facturación de 30 días suma aproximadamente '+M(o.B*dpr/100*30,2)+' de interés. Un mínimo que cubre el interés más solo una pequeña parte del capital mantiene la mayor parte del saldo mes tras mes.');
  var bi=pmt(o.B,o.apr,18)*18-o.B;
  $('bt').innerHTML='<li>Comisión única de transferencia del 3%–5%<b>'+M(o.B*.03)+' – '+M(o.B*.05)+'</b></li><li>18 meses de pago con una TAE del '+o.apr+'% (interés)<b style="color:var(--sx-err)">'+M(bi)+'</b></li><li class="on">Ahorro neto estimado con una transferencia al 0%<b>'+(bi-o.B*.05>=0?'+':'')+M(bi-o.B*.05)+' to '+(bi-o.B*.03>=0?'+':'')+M(bi-o.B*.03)+'</b></li>';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ccCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last||!last.rows)return;C.csv('credit-card-payoff.csv',[{h:'Estrategia',key:'k'},{h:'Meses',key:'n'},{h:'Interés total',key:'int'},{h:'Total pagado',key:'paid'}],last.rows.map(function(r){return {k:r.k,n:r.s.n,int:Math.round(r.s.int*100)/100,paid:Math.round(r.s.paid*100)/100};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCreditCard={sim:sim,minPay:minPay};
})();
