/* Loan calculator — CalculatePilot (Stitch 1:1 redesign).
   Payment M = P·i(1+i)^n / ((1+i)^n − 1). Origination fee either deducted from the cash disbursed
   (balance = amount) or rolled in (balance = amount ÷ (1 − fee), cash = amount). Effective APR solves
   PV(payments at r) = cash received. Consolidation compares paying the cards at the current payment and APR. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,open=false;

function M(x,d){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:d||0,maximumFractionDigits:d||0});}
function pc(x,d){return isFinite(x)?x.toFixed(d===undefined?2:d)+'%':'—';}
function pmt(P,apr,n){var i=apr/1200;return i?P*i/(1-Math.pow(1+i,-n)):P/n;}
function pv(p,apr,n){var i=apr/1200;return i?p*(1-Math.pow(1+i,-n))/i:p*n;}
function effApr(p,cash,n,apr){if(cash<=0)return NaN;var lo=0,hi=Math.max(apr,1)*3+50;for(var k=0;k<80;k++){var m=(lo+hi)/2;if(pv(p,m,n)>cash)lo=m;else hi=m;}return (lo+hi)/2;}
function cardPayoff(bal,apr,pay){var i=apr/1200,m=0,int=0;if(bal<=0)return {m:0,int:0};if(pay<=bal*i)return null;
  while(bal>0.005&&m<1200){var t=bal*i;int+=t;bal=bal+t-pay;m++;}return {m:m,int:int+Math.min(0,bal)};}

function calc(){
  var amt=Math.max(0,v('amt')),n=Math.max(1,Math.round(v('term'))),apr=Math.max(0,v('rate')),fee=Math.min(15,Math.max(0,v('fee'))),roll=$('feeMode').value==='roll';
  var bal=roll?amt/(1-fee/100):amt,feeAmt=bal*fee/100,cash=bal-feeAmt,p=pmt(bal,apr,n),rows=[],b=bal,ci=0;
  for(var m=1;m<=n;m++){var t=b*apr/1200,pr=Math.min(b,p-t);ci+=t;rows.push({m:m,s:b,p:pr+t,pr:pr,i:t,ci:ci,e:Math.max(0,b-pr)});b-=pr;}
  return {amt:amt,n:n,apr:apr,fee:fee,roll:roll,bal:bal,feeAmt:feeAmt,cash:cash,p:p,int:ci,eff:effApr(p,cash,n,apr),rows:rows};
}

function chart(r){
  var W=520,H=170,L=46,R=10,T=12,B=24,w=W-L-R,h=H-T-B,max=r.bal||1,pts=[[0,r.bal]].concat(r.rows.map(function(x){return [x.m,x.e];}));
  var X=function(m){return L+m/r.n*w;},Y=function(y){return T+h-(y/max)*h;},d=pts.map(function(q,k){return (k?'L':'M')+X(q[0]).toFixed(1)+' '+Y(q[1]).toFixed(1);}).join(' ');
  var g='';for(var k=0;k<=4;k++){var y=max*k/4;g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(y)+'" y2="'+Y(y)+'" stroke="var(--sx-border)" stroke-dasharray="3 3"/><text x="'+(L-6)+'" y="'+(Y(y)+3)+'" text-anchor="end" font-size="9" fill="var(--sx-muted)">$'+(Math.round(y/100)/10)+'k</text>';}
  var yrs=Math.ceil(r.n/12);for(var j=0;j<=yrs;j++){var mm=Math.min(r.n,j*12);g+='<text x="'+X(mm)+'" y="'+(H-8)+'" text-anchor="middle" font-size="9" fill="var(--sx-muted)">'+(j?'Yr '+(mm/12%1?(mm/12).toFixed(1):mm/12):'Start')+'</text>';}
  $('chart').innerHTML=g+'<path d="'+d+' L'+X(r.n)+' '+Y(0)+' L'+X(0)+' '+Y(0)+'Z" fill="var(--sx-primary)" opacity=".1"/><path d="'+d+'" fill="none" stroke="var(--sx-primary)" stroke-width="2.5"/>';
}

function ledger(r){
  var h='';for(var y=0;y*12<r.n;y++){var s=r.rows.slice(y*12,y*12+12),sum=function(k){return s.reduce(function(a,x){return a+x[k];},0);};
    h+='<tr class="yr"><td>Year '+(y+1)+' ('+s.length+' Mo)</td><td>'+M(s[0].s,2)+'</td><td>'+M(sum('p'),2)+'</td><td>'+M(sum('pr'),2)+'</td><td class="r">'+M(sum('i'),2)+'</td><td>'+M(s[s.length-1].ci,2)+'</td><td>'+M(s[s.length-1].e,2)+'</td></tr>';
    h+=s.map(function(x){return '<tr class="mo'+(open?'':' hid')+'"><td>Month '+x.m+'</td><td>'+M(x.s,2)+'</td><td>'+M(x.p,2)+'</td><td>'+M(x.pr,2)+'</td><td class="r">'+M(x.i,2)+'</td><td>'+M(x.ci,2)+'</td><td>'+M(x.e,2)+'</td></tr>';}).join('');}
  $('tbl').innerHTML=h;
}

function compute(){
  var r=calc(),cons=$('mode').value==='cons';last=r;
  C.text('amtOut',M(r.amt));C.text('rateOut',pc(r.apr));C.text('feeOut',M(r.feeAmt)+' fee');
  C.text('fmD','Deduct fee from disbursement'+(r.roll?'':' (receive '+M(r.cash)+')'));C.text('fmR','Roll fee into the loan balance'+(r.roll?' (borrow '+M(r.bal)+')':''));
  $('consBox').hidden=!cons;
  C.text('resultValue',M(r.p,2));C.text('eff','Effective APR: '+pc(r.eff));C.text('effN','Nominal rate: '+pc(r.apr));
  C.text('net',M(r.cash));C.text('netN',r.fee?'After '+M(r.feeAmt)+' origination fee':'No origination fee');
  C.text('int',M(r.int));C.text('intN','Over '+r.n+' months');C.text('cost',M(r.bal+r.int));
  C.text('perTag',r.n+' Monthly Periods');C.text('trR',M(r.bal)+' → $0 over '+r.n+' mo');
  var st=$('savT');
  if(cons){var cc=cardPayoff(r.cash,v('ccApr'),Math.max(0,v('ccPay')));C.text('savL','Net Savings vs Cards');
    if(!cc){C.text('sav','Cards never paid');C.text('savN','Current payment doesn\'t cover card interest');$('sav').className='g';}
    else{var diff=cc.int-(r.int+r.feeAmt);C.text('sav',M(diff));$('sav').className=diff>=0?'g':'neg';C.text('savN','Cards: '+cc.m+' mo, '+M(cc.int)+' interest');}
    st.style.display='';}
  else{C.text('savL','Monthly Payment × Term');C.text('sav',M(r.p*r.n));$('sav').className='';C.text('savN','Total of all payments');}
  var ratio=r.bal?r.int/r.bal*100:0;C.text('a1h','Interest Burden: '+pc(ratio,1)+' of principal');
  C.text('a1','You repay '+M(r.p*r.n)+' on a '+M(r.bal)+' balance'+(r.fee?', plus the '+M(r.feeAmt)+' fee'+(r.roll?' financed in the balance':' taken from your proceeds'):'')+'.');
  var sh=r.n>24?calc2(r,r.n-12):null;
  C.text('a2','Fixed '+r.n+'-month payoff'+(sh?'. A '+(r.n-12)+'-month term would cost '+M(sh.p-r.p,2)+'/mo more but save '+M(r.int-sh.int)+' in interest.':'.'));
  $('feeTake').innerHTML=r.fee?'<b>This loan:</b> the '+pc(r.fee,2)+' fee ('+M(r.feeAmt)+') lifts your effective APR from '+pc(r.apr)+' to <b>'+pc(r.eff)+'</b>. '+(r.roll?'Rolling it in means you borrow '+M(r.bal)+' to receive '+M(r.cash)+'.':'You receive '+M(r.cash)+' but repay the full '+M(r.bal)+'. To receive '+M(r.amt)+' in hand, borrow about '+M(r.amt/(1-r.fee/100))+'.'):'<b>No origination fee:</b> your effective APR equals the stated rate of '+pc(r.apr)+'.';
  chart(r);ledger(r);
}
function calc2(r,n){var p=pmt(r.bal,r.apr,n);return {p:p,int:p*n-r.bal};}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'plCalc',compute:compute});
  var exp=function(){open=!open;C.text('expTxt',open?'Collapse Monthly Detail':'Expand Monthly Detail');document.querySelectorAll('#tbl tr.mo').forEach(function(t){t.classList.toggle('hid',!open);});};
  $('expBtn').addEventListener('click',exp);
  var csv=function(){if(!last)return;C.csv('loan-amortization.csv',[{h:'Month',key:'m'},{h:'Starting balance',key:'s'},{h:'Payment',key:'p'},{h:'Principal',key:'pr'},{h:'Interest',key:'i'},{h:'Cumulative interest',key:'ci'},{h:'Ending balance',key:'e'}],last.rows.map(function(x){return {m:x.m,s:x.s.toFixed(2),p:x.p.toFixed(2),pr:x.pr.toFixed(2),i:x.i.toFixed(2),ci:x.ci.toFixed(2),e:x.e.toFixed(2)};}));};
  $('csvBtn').addEventListener('click',csv);$('csvBtn2').addEventListener('click',csv);
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpLoan={pmt:pmt,effApr:effApr};
})();
