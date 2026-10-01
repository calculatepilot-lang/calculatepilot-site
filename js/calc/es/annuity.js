/* Annuity calculator — CalculatePilot (Stitch 1:1 redesign).
   Deferral: B = premium × (1+g)^years. Payout = B ÷ annuity factor, where the factor is Σ v^k · (payment growth) · P(pays in month k)
   at the insurer pricing rate. Survival: Gompertz S(x,t) = exp(e^((x−m)/b) · (1 − e^(t/b))), m = 90, b = 10.
   Life-only uses S; 10-year certain pays months 1–120 in full; joint & survivor uses 1 − (1 − S)² (same-age spouse);
   fixed period pays 240 months. COLA raises payments each contract year. PV/FV section: ordinary annuity, monthly. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,GM=90,GB=10;

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('es-ES');}
function M2(x){return isFinite(x)?'$'+x.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function pc(x,d){return isFinite(x)?x.toFixed(d===undefined?2:d)+'%':'—';}
function surv(x,t){return Math.exp(Math.exp((x-GM)/GB)*(1-Math.exp(t/GB)));}
function pays(opt,x,k){var t=k/12,s=surv(x,t);return opt==='s4'?(k<=240?1:0):opt==='s2'?(k<=120?1:s):opt==='s3'?1-(1-s)*(1-s):s;}
function factor(opt,x,r,c){var i=r/1200,f=0,K=(120-x)*12;if(opt==='s4')K=240;for(var k=1;k<=K;k++){f+=pays(opt,x,k)*Math.pow(1+c/100,Math.floor((k-1)/12))/Math.pow(1+i,k);}return f;}

function tvm(){
  var p=Math.max(0,v('payment')),r=Math.max(0,v('annualRate'))/1200,n=Math.max(0,Math.round(v('years')*12));
  var fv=r?p*(Math.pow(1+r,n)-1)/r:p*n,pv=r?p*(1-Math.pow(1+r,-n))/r:p*n;
  C.text('fv',M(fv));C.text('pv',M(pv));C.text('paid',M(p*n));C.text('paidN',n+' payments');
}

function compute(){
  tvm();
  var imm=$('mode').value==='s1',P=Math.max(0,v('prem')),D=imm?0:Math.max(1,Math.round(v('def'))),g=Math.max(0,v('g')),age=Math.max(30,Math.min(90,Math.round(v('age')))),x=age+D;
  var r=Math.max(0,v('pr')),opt=$('opt').value,cola=$('cola').checked?Math.max(0,v('colaR')):0,hz=Math.max(x+1,+$('hz').value);
  $('defBox').hidden=imm;C.text('defOut',D+' Años');C.text('gOut',pc(g)+' APY');C.text('payAge','Edad '+x);C.text('colaTxt',pc(cola,1));
  var B=P*Math.pow(1+g/100,D),f=factor(opt,x,r,cola),pm=B/f,yr=pm*12;
  C.text('resultValue',M2(pm));C.text('ageTag','Edad '+x+'+');
  $('yrTxt').innerHTML='Equivale a <b style="color:var(--sx-on)">'+M2(yr)+' / year</b> starting at age '+x+(cola?', subiendo '+pc(cola,1)+' al año':'')+'. Payout rate '+pc(yr/B*100)+' del saldo.';
  C.text('balL',(imm?'Prima convertida':'Saldo acumulado')+' @ '+x);C.text('bal',M(B));
  // payouts to horizon (assuming alive), notional ledger
  var i=r/1200,rows=[],R=B,cum=0,cumH=0,be=null,maxY=Math.max(hz,95)-age,k=0;
  for(var y=0;y<=maxY;y++){var a=age+y,ph,beg,pay=0;
    if(y<D){ph=y===0?'Emisión inicial':'Acumulación';beg=P*Math.pow(1+g/100,y);rows.push({y:y,a:a,ph:ph,cls:y===0?'':'a',beg:beg,pay:null,cum:0,end:P*Math.pow(1+g/100,y+1)});continue;}
    beg=R;var py=y-D;
    for(var m=0;m<12;m++){k++;var pmk=(opt==='s4'&&k>240)?0:pm*Math.pow(1+cola/100,py);R=R*(1+i)-pmk;pay+=pmk;}
    cum+=pay;if(a<hz)cumH=cum;if(be===null&&cum>=P)be=a+1;
    var ph2=py===0?'Inicio de los pagos':beg<=0?'Fondo de longevidad':'Distribución';if(opt==='s4'&&k>240&&pay===0)ph2='Plazo completado';
    rows.push({y:y,a:a,ph:ph2,cls:py===0?'p':beg<=0?'l':'',beg:beg,pay:pay,cum:cum,end:R});}
  C.text('totL','Pagos totales (hasta los '+hz+')');C.text('tot',M(cumH));
  var gain=cumH-B,gb=$('gainBox');gb.className='gain'+(gain<0?' neg':'');C.text('gainL',gain>=0?'Pagos por encima del valor de la cuenta:':'Pagos aún por debajo del valor de la cuenta:');C.text('gain',(gain>=0?'+':'−')+M(Math.abs(gain)));
  var sH=opt==='s4'?null:(opt==='s3'?1-Math.pow(1-surv(x,hz-x),2):surv(x,hz-x));
  C.text('note',(sH!==null?'Probabilidad de '+(opt==='s3'?'al menos un cónyuge':'a '+x+'-year-old')+' reaching '+hz+' con esta mortalidad: '+pc(sH*100,0)+'. ':'')+'Los pagos acumulados superan el original '+M(P)+' premium '+(be?'a los '+be:'después de los '+(age+maxY))+'.');
  var parts=[['Inversión principal original',P,'var(--sx-primary)'],[(D?D+' años de crecimiento diferido ('+pc(g)+' APY)':'Crecimiento diferido (ninguno)'),B-P,'var(--sx-pc)'],[opt==='s4'?'Intereses acreditados durante el pago':'Fondo de mortalidad e intereses acreditados',Math.max(0,gain),'#a7f3d0']],S=parts.reduce(function(s,p){return s+p[1];},0);
  C.text('wfN','Desglose de los pagos totales esperados hasta los '+hz+(gain<0?' — los pagos hasta los '+hz+' aún no superan el valor de la cuenta.':'.'));
  $('wfBar').innerHTML=parts.map(function(p){return '<span style="width:'+(S?p[1]/S*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('wfList').innerHTML=parts.map(function(p){return '<li><span><i style="background:'+p[2]+'"></i>'+p[0]+'</span><b>'+M(p[1])+' <small>('+pc(S?p[1]/S*100:0,1)+')</small></b></li>';}).join('');
  var sb=$('surBox');if(imm)sb.setAttribute('data-off','');else sb.removeAttribute('data-off');
  C.text('surTxt',imm?'Las rentas vitalicias inmediatas suelen ser irrevocables una vez que empiezan los pagos, por lo que normalmente no hay valor de rescate en efectivo; los calendarios de rescate se aplican a los contratos diferidos.':'Se aplican cargos por rescate a los retiros que superan el monto libre durante los primeros años. Muchos contratos diferidos permiten retirar cerca del 10% al año sin penalización; revisa tu contrato. Los retiros antes de los 59½ también pueden conllevar una penalización del 10% del IRS.');
  var step=+$('step').value||5;last={rows:rows};
  C.text('allBtn','Anual (todos los '+maxY+' años)');
  $('tbl').innerHTML=rows.filter(function(x){return step===1||x.y%step===0||x.y===D;}).map(function(x){
    return '<tr'+(x.cls==='p'?' class="pb"':'')+'><td style="font-family:inherit">Año '+x.y+'</td><td style="font-family:inherit">Edad '+x.a+'</td><td><span class="sx-an-ph '+x.cls+'">'+x.ph+'</span></td><td>'+(x.beg<=0?'$0 (Agotado)':M(x.beg))+'</td><td class="b">'+(x.pay===null?'—':M(x.pay))+'</td><td class="mu">'+M(x.cum)+'</td><td>'+(x.end<=0?(opt==='s4'?'$0':'$0 (Asegurado de por vida)'):M(x.end))+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'anCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('annuity-ledger.csv',[{h:'Año del contrato',key:'y'},{h:'Edad',key:'a'},{h:'Fase',key:'ph'},{h:'Saldo inicial',key:'b'},{h:'Pago anual',key:'p'},{h:'Pagos acumulados',key:'c'},{h:'Saldo nocional final',key:'e'}],last.rows.map(function(x){return {y:x.y,a:x.a,ph:x.ph,b:Math.round(Math.max(0,x.beg)),p:x.pay===null?0:Math.round(x.pay),c:Math.round(x.cum),e:Math.round(Math.max(0,x.end))};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpAnnuity={factor:factor,surv:surv};
})();
