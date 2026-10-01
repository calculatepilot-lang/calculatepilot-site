/* UK mortgage repayment calculator — CalculatePilot (Stitch 1:1 redesign).
   Loan = price − deposit (+ product fee if added). Capital & interest: M = P·i(1+i)^n / ((1+i)^n − 1);
   interest-only: P × rate / 12. Lifetime totals hold the initial rate for the whole term. Stress test: +3 percentage points
   for the full term. SVR line: balance at the end of the initial period re-amortised at the SVR over the remaining term. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x,d){if(!isFinite(x))return '—';return (x<0?'−£':'£')+Math.abs(x).toLocaleString('en-GB',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});}
function K(x){return '£'+(Math.round(x/100)/10)+'k';}
function pc(x,d){return isFinite(x)?x.toFixed(d===undefined?1:d)+'%':'—';}
function pmt(P,r,n){var i=r/1200;return i?P*i/(1-Math.pow(1+i,-n)):P/n;}
function bal(P,r,n,k){var i=r/1200,p=pmt(P,r,n);return i?P*Math.pow(1+i,k)-p*(Math.pow(1+i,k)-1)/i:P-p*k;}
function band(l){var b=[60,75,80,85,90,95];for(var k=0;k<b.length;k++)if(l<=b[k]+1e-9)return '≤'+b[k]+'% LTV';return '>95 % LTV';}

function compute(){
  var price=Math.max(0,v('price')),dep=Math.min(price,Math.max(0,v('dep'))),r=Math.max(0,v('rate')),yrs=Math.max(1,Math.round(v('term'))),n=yrs*12;
  var fee=Math.max(0,v('fee')),add=$('feeMode').value==='s2',fix=Math.min(yrs,Math.round(v('fix'))),svr=Math.max(0,v('svr'));
  var base=price-dep,P=base+(add?fee:0),ltv=price?base/price*100:0;
  var ci=pmt(P,r,n),io=P*r/1200,ciInt=ci*n-P,ioInt=io*n,up=add?0:fee;
  C.text('ltv',pc(ltv)+' LTV');C.text('depPct',pc(price?dep/price*100:0,0)+' Dépôt');C.text('loanOut',M(P));C.text('band',band(ltv));C.text('termOut',yrs+' Années');
  C.text('resultValue',M(ci,2));C.text('io',M(io,2));C.text('ioAdv','↓ '+M(ci-io,2)+'/mo cash-flow advantage');
  C.text('ciIntL','Total des intérêts ('+yrs+' ans) :');C.text('ioIntL','Total des intérêts ('+yrs+' ans) :');
  C.text('ciInt',M(ciInt,2));C.text('ciCap',M(P)+' (100 % remboursé)');C.text('ciTot',M(P+ciInt+up,2));
  C.text('ioInt',M(ioInt,2)+' (+'+K(ioInt-ciInt)+')');C.text('ioBal',M(P)+' unpaid');C.text('ioTot',M(P+ioInt+up,2));
  var i1=P*r/1200,p1=ci-i1,sp=ci?p1/ci*100:0;
  C.text('anatH','Décomposition de la mensualité de l\'année 1 ('+M(ci,2)+')');C.text('anP','Capital : '+M(p1,2)+' ('+pc(sp)+')');C.text('anI','Intérêts : '+M(i1,2)+' ('+pc(100-sp)+')');$('anBar').style.width=Math.max(0,sp)+'%';
  var st=pmt(P,r+3,n);C.text('stH','Test de résistance : taux +3,0 % ('+pc(r+3,2)+')');
  $('stP').innerHTML='Si les taux étaient supérieurs de 3 points de pourcentage pendant toute la durée, votre mensualité de capital &amp; intérêts serait de <b style="color:var(--sx-on)">'+M(st,2)+'/month</b> — <span class="r">+'+M(st-ci,2)+'/month</span> more than today.';
  if(fix<yrs){var b=bal(P,r,n,fix*12),sv=pmt(b,svr,n-fix*12);
    $('svrP').innerHTML='Si vous ne renégociez pas votre prêt à la fin de la période de '+fix+'ans, le solde restant de '+M(b)+' au '+pc(svr,2)+' SVR coûterait <b style="color:var(--sx-on)">'+M(sv,2)+'/month</b> (<span class="r">'+(sv>=ci?'+':'−')+M(Math.abs(sv-ci),2)+'/month</span>, '+(sv>=ci?'+':'−')+M(Math.abs(sv-ci)*12)+' par an).';}
  else $('svrP').textContent='La période de taux initial couvre toute la durée, aucun retour au SVR n\'est donc modélisé.';
  var ys=[1,2,3,5,10,15,20,25,30,35,40].filter(function(y){return y<yrs;});if(ys.indexOf(fix)<0&&fix<yrs)ys.push(fix);ys.push(yrs);ys.sort(function(a,b){return a-b;});
  var rows=ys.map(function(y){var b=Math.max(0,bal(P,r,n,y*12));return {y:y,b:y===yrs?0:b,eq:price-(y===yrs?0:b)};});last={rows:rows,ci:ci,io:io,P:P,price:price};
  C.text('ledN','Prévision du capital restant dû et de la valeur nette, en supposant que la valeur du bien reste stable ('+M(price)+').');
  $('tbl').innerHTML=rows.map(function(x){var end=x.y===yrs;
    return '<tr'+(end?' style="background:var(--sx-emb)"':'')+'><td style="font-family:inherit;font-weight:600">Année '+x.y+(x.y===fix&&!end?'<span class="ms">Fin du taux fixe</span>':'')+(end?'<span class="ms g">Échéance</span>':'')+'</td><td>'+M(ci,2)+'</td><td class="mu">'+M(io,2)+'</td><td class="b">'+M(x.b,end?2:0)+'</td><td class="g">'+M(x.eq)+'<small class="p">('+pc(price?x.eq/price*100:0)+')</small></td><td'+(end?' class="r"':'')+'>'+M(P)+(end?'<br><small style="font-size:10px">(Remboursement du capital in fine requis)</small>':'<small class="p">('+pc(price?(price-P)/price*100:0)+' valeur nette)</small>')+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'urCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('uk-mortgage-repayment.csv',[{h:'Année',key:'y'},{h:'Paiement du capital et des intérêts',key:'c'},{h:'Paiement des intérêts seuls',key:'i'},{h:'Capital restant dû',key:'b'},{h:'Valeur nette (valeur stable)',key:'e'},{h:'Solde en intérêts seuls',key:'o'}],last.rows.map(function(x){return {y:x.y,c:last.ci.toFixed(2),i:last.io.toFixed(2),b:x.b.toFixed(2),e:Math.round(x.eq),o:Math.round(last.P)};}));});
  $('calcForm').addEventListener('submit',function(e){e.preventDefault();});
});
window.cpUkRepay={pmt:pmt,bal:bal};
})();
