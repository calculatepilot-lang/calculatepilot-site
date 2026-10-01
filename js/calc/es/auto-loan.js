/* Auto loan calculator — CalculatePilot (Stitch 1:1 redesign).
   Amount financed = price + fees − down − (trade − payoff) + tax (tax on price − trade, rolled in or paid upfront).
   Fixed-rate amortization, estimated car value (−20% year 1, −15%/yr after), equity breakeven, term comparison. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var TERMS=[36,48,60,72,84],last=null,showAll=false;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}
function carValue(price,m){return m<=12?price*Math.pow(0.8,m/12):price*0.8*Math.pow(0.85,(m-12)/12);}

function inputs(){
  return {price:Math.max(0,v('price')),trade:Math.max(0,v('trade')),owed:Math.max(0,v('owed')),down:Math.max(0,v('down')),tax:Math.max(0,v('tax')),
    roll:$('rollTax').checked,term:Math.max(1,v('term')),apr:Math.max(0,v('apr')),fees:Math.max(0,v('fees'))};
}

function calc(o,n){
  n=n||o.term;
  var netTrade=o.trade-o.owed,taxAmt=Math.max(0,o.price-o.trade)*o.tax/100;
  var P=Math.max(0,o.price+o.fees-o.down-netTrade+(o.roll?taxAmt:0)),pay=pmt(P,o.apr,n),i=o.apr/100/12;
  var months=[],bal=P,interest=0;
  for(var m=1;m<=n;m++){var ip=bal*i,pp=Math.min(bal,pay-ip);bal=Math.max(0,bal-pp);interest+=ip;months.push({m:m,start:bal+pp,pay:pp+ip,principal:pp,interest:ip,end:bal,value:carValue(o.price,m)});}
  /* breakeven = the month after the last one where the balance exceeds the car's value (0 = never underwater) */
  var be=P>o.price?1:0;for(var k=0;k<months.length;k++){if(months[k].end>months[k].value)be=months[k].m+1;}
  if(be>n)be=null;
  var upfront=o.down+(o.roll?0:taxAmt);
  return {P:P,pay:pay,interest:interest,taxAmt:taxAmt,netTrade:netTrade,upfront:upfront,total:upfront+pay*n+Math.max(0,netTrade),months:months,be:be,n:n};
}

function chart(o,r){
  var W=320,H=170,L=34,R=8,T=10,B=22,w=W-L-R,h=H-T-B,n=r.n,max=Math.max(r.P,o.price,1)*1.05;
  function X(m){return L+m/n*w;}function Y(y){return T+h-y/max*h;}
  var bal=[[0,r.P]].concat(r.months.map(function(x){return [x.m,x.end];})),val=[[0,o.price]].concat(r.months.map(function(x){return [x.m,x.value];}));
  function line(a){return a.map(function(p){return X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1);}).join(' ');}
  var s='';
  for(var g=0;g<=4;g++){var yy=T+h*g/4;s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="currentColor" stroke-opacity=".08"/>';s+='<text x="'+(L-4)+'" y="'+(yy+3)+'" text-anchor="end" font-size="8" fill="#94a3b8">'+(max*(1-g/4)/1000).toFixed(0)+'k</text>';}
  [0,Math.round(n/2),n].forEach(function(m){s+='<text x="'+X(m)+'" y="'+(H-8)+'" text-anchor="middle" font-size="8" fill="#94a3b8">Mes '+m+'</text>';});
  /* negative equity: balance above value, from month 0 to breakeven */
  if(r.be!==0){var top=bal.map(function(p,k){return [p[0],Math.max(p[1],val[k][1])];}),bot=val.slice().reverse();s+='<polygon points="'+line(top)+' '+line(bot)+'" fill="#fca5a5" fill-opacity=".35"/>';}
  s+='<polyline points="'+line(val)+'" fill="none" stroke="#64748b" stroke-width="2"/>';
  s+='<polyline points="'+line(bal)+'" fill="none" stroke="var(--sx-pc)" stroke-width="2.5"/>';
  if(r.be&&r.months[r.be-1]){var bm=r.months[r.be-1];s+='<circle cx="'+X(r.be)+'" cy="'+Y(bm.end)+'" r="4" fill="var(--sx-pc)" stroke="#fff" stroke-width="1.5"/>';}
  $('eqChart').innerHTML=s;
}

function schedule(r){
  var view=$('view').value,rows=[];
  if(view==='month'){rows=r.months.map(function(x){return {lab:'Mes '+x.m,start:x.start,pay:x.pay,pp:x.principal,ip:x.interest,end:x.end,val:x.value};});}
  else{for(var y=0;y*12<r.n;y++){var ms=r.months.slice(y*12,y*12+12);if(!ms.length)break;var a=ms[0].m,b=ms[ms.length-1].m;
    rows.push({lab:'Año '+(y+1)+' (Mo '+a+'-'+b+')',start:ms[0].start,pay:ms.reduce(function(s,x){return s+x.pay;},0),pp:ms.reduce(function(s,x){return s+x.principal;},0),ip:ms.reduce(function(s,x){return s+x.interest;},0),end:ms[ms.length-1].end,val:ms[ms.length-1].value});}}
  var lim=view==='month'&&!showAll?12:rows.length;
  $('schedBody').innerHTML=rows.map(function(x,k){var ltv=x.val>0?x.end/x.val*100:0;
    return '<tr'+(k>=lim?' class="hid"':'')+'><td>'+x.lab+'</td><td class="mu">'+M(x.start,2)+'</td><td>'+M(x.pay,2)+'</td><td>'+M(x.pp,2)+'</td><td class="er">'+M(x.ip,2)+'</td><td>'+M(x.end,2)+'</td><td class="mu">'+M(x.val,2)+'</td><td class="lv '+(ltv>100?'hi':ltv<=80?'ok':'')+'">'+ltv.toFixed(1)+'%</td></tr>';}).join('');
  C.text('sPer',view==='month'?'Mes':'Periodo / año');
  var mb=$('moreBtn');mb.hidden=view!=='month';C.text('moreTxt',showAll?'Mostrar los primeros 12 meses':'Mostrar todo '+rows.length+' months');
  last.rows=rows;
}

function compute(){
  var o=inputs(),r=calc(o),n=o.term;last={o:o,r:r};
  C.text('resultValue',M(r.pay));C.text('financed',M(r.P));C.text('totInt',M(r.interest));C.text('totCost',M(r.total));C.text('upfront',M(r.upfront));
  C.text('tradeNote',r.netTrade<0?M(-r.netTrade)+' capital negativo incluido':r.netTrade>0&&o.owed>0?'Intercambio neto: '+M(r.netTrade):'');
  $('tradeNote').className=r.netTrade<0?'warn':'mu';
  document.querySelectorAll('#dpChips button').forEach(function(b){b.setAttribute('aria-pressed',String(o.price>0&&Math.abs(o.down-o.price*parseFloat(b.getAttribute('data-dp'))/100)<1));});
  C.text('termNote',n===60?'60 meses (estándar común)':n<60?n+' meses (menor interés total)':n+' meses (plazo extendido)');
  $('termNote').className=n>60?'warn':'';$('termWarn').hidden=n<=60;
  C.text('chartTerm',n+' meses de trayectoria');chart(o,r);
  C.text('breakeven',r.be===0?'Mes 0 (sin capital negativo)':r.be?'Mes '+r.be:'Fuera del plazo del préstamo');

  /* term strategy: neighbours of the chosen term */
  var idx=TERMS.indexOf(n),pick=idx<0?[n]:idx===0?TERMS.slice(0,3):idx===TERMS.length-1?TERMS.slice(-3):TERMS.slice(idx-1,idx+2);
  if(pick.length<3&&idx<0)pick=[n];
  $('termCmp').innerHTML=pick.map(function(t){var x=t===n?r:calc(o,t),d=x.interest-r.interest,cls=t===n?' class="on"':'';
    var em=t===n?'<em style="color:var(--sx-muted);font-weight:500">'+M(r.interest)+' Int. total</em>':d<0?'<em>Ahorro '+M(-d)+' Int.</em>':'<em class="bad">+'+M(d)+' Int. extra</em>';
    return '<button type="button"'+cls+' data-for="term" data-value="'+t+'"><span>'+t+' Mo'+(t===n?' (Base)':'')+'</span><b>'+M(x.pay)+'/mo</b>'+em+'</button>';}).join('');

  var gap={down:o.price>0&&(o.down+Math.max(0,r.netTrade))<o.price*0.2,term:n>60,neg:r.netTrade<0,dep:false};
  document.querySelectorAll('#gapList li').forEach(function(li){li.className=gap[li.getAttribute('data-gap')]?'on':'';});
  schedule(r);
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'autoCalc',compute:compute});
  $('dpChips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;$('down').value=Math.round(v('price')*parseFloat(b.getAttribute('data-dp'))/100);$('down').dispatchEvent(new Event('input',{bubbles:true}));});
  $('view').addEventListener('input',function(){showAll=false;});
  $('moreBtn').addEventListener('click',function(){showAll=!showAll;if(last)schedule(last.r);});
  $('csvBtn').addEventListener('click',function(){if(!last||!last.rows)return;
    C.csv('auto-loan-schedule.csv',[{h:'Periodo',key:'lab'},{h:'Saldo inicial',key:'start'},{h:'Pagos',key:'pay'},{h:'Capital pagado',key:'pp'},{h:'Interés pagado',key:'ip'},{h:'Saldo final',key:'end'},{h:'Valor est. del vehículo',key:'val'}],last.rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpAutoLoan={calc:calc,pmt:pmt};
})();
