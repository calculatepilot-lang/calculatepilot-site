/* CD calculator — CalculatePilot (Stitch 1:1 redesign).
   Value after t months = deposit × (1 + APY)^(t/12). Equivalent APR = n × ((1 + APY)^(1/n) − 1).
   Early withdrawal penalty = deposit × APR × days ÷ 365 (simple interest), applied when broken at 6 months (or half the term).
   Ladder: deposit split into five 1–5 year CDs at the APYs entered. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function M(x,dp){dp=dp===undefined?2:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function dt(m,day){var d=new Date();d.setMonth(d.getMonth()+m);return MON[d.getMonth()]+(day?' '+d.getDate()+',':'')+' '+d.getFullYear();}

function inputs(){return {D:Math.max(0,v('dep')),t:Math.max(1,v('term')),apy:Math.max(0,v('apy'))/100,n:Math.max(1,v('cmp')),pen:Math.max(0,v('pen')),hy:Math.max(0,v('hysa'))/100,l:[1,2,3,4,5].map(function(k){return Math.max(0,v('l'+k))/100;})};}

function compute(){
  var o=inputs(),V=function(m){return o.D*Math.pow(1+o.apy,m/12);},fv=V(o.t),int=fv-o.D,apr=o.n*(Math.pow(1+o.apy,1/o.n)-1),ty=o.t/12;last={o:o};
  C.text('tOut',o.t+' Months ('+ty.toFixed(1)+' Yr)');C.text('tPill',o.t+'-Month Term');
  C.text('resultValue',M(fv));C.text('intHero','+'+M(int)+' Guaranteed Interest');C.text('prin',M(o.D));C.text('int','+'+M(int));
  C.text('intN',(int/o.D*100||0).toFixed(2)+'% total return over '+o.t+' months');C.text('mo',M(int/o.t)+' / mo');
  var bm=Math.min(6,o.t/2),pen=o.D*apr*o.pen/365,nb=V(bm)-pen;
  C.text('penL','Net if Broken at '+(Math.round(bm*10)/10)+' Mo');C.text('penV',M(nb));
  $('penN').textContent=o.pen?((nb-o.D>=0?'+':'−')+M(Math.abs(nb-o.D))+(nb>=o.D?' net profit':' loss of principal')+' after a '+o.pen+'-day interest penalty'):'No-penalty CD: full accrued interest kept';
  $('tl').innerHTML='<div>Issue Date<b>'+dt(0,true)+'</b><span>'+M(o.D,0)+' Deposit</span></div><div>Halfway ('+(Math.round(o.t/2*10)/10)+' Mo)<b>'+dt(Math.round(o.t/2),true)+'</b><span>'+M(V(o.t/2))+' accrued</span></div><div>Maturity Date<b>'+dt(o.t,true)+'</b><span>'+M(fv)+' matured</span></div>';
  C.text('vsL',o.t+'-Month Rate Protection');C.text('vsCdL',o.t+'-Month Locked CD');C.text('vsCd',(o.apy*100).toFixed(2)+'% APY');C.text('vsCdR','+'+M(int,0)+' return');
  var hy=o.D*(Math.pow(1+o.hy,ty)-1);C.text('vsHy',(o.hy*100).toFixed(2)+'% Est.');C.text('vsHyR','~'+M(hy,0)+' if the rate held');

  var a=o.D/5,tot=0;C.text('ldLead','Split '+M(o.D,0)+' across five staggered CDs so one matures every year, keeping some cash accessible while the rest earns longer-term rates.');
  document.querySelectorAll('#tr>div').forEach(function(el,k){var gi=a*(Math.pow(1+o.l[k],k+1)-1);tot+=gi;el.querySelector('.amt').textContent=M(a);el.querySelector('.gi').textContent='+'+M(gi);});
  C.text('blend',(o.l.reduce(function(s,x){return s+x;},0)/5*100).toFixed(2)+'%');
  $('ldTbl').innerHTML=o.l.map(function(r,k){var gi=a*(Math.pow(1+r,k+1)-1),end=k===4;
    return '<tr'+(end?' class="act"':'')+'><td>Year '+(k+1)+' End'+(end?' (Complete Ladder)':'')+'</td><td>'+dt(12*(k+1))+'</td><td>Tranche '+(k+1)+' ('+(k+1)+'-Yr)</td><td class="g">+'+M(gi)+'</td><td style="color:var(--sx-muted)">'+(end?'All five tranches are now on 5-year CDs, with one maturing every year':'Reinvest in a new 5-year CD at the prevailing 5-year rate')+'</td><td class="b">'+M(a+gi)+'</td></tr>';}).join('');

  var nm={365:'daily',12:'monthly',4:'quarterly',2:'semi-annual',1:'annual'}[o.n];
  C.text('aprTxt','Your '+(o.apy*100).toFixed(2)+'% APY equals a '+(apr*100).toFixed(3)+'% APR with '+nm+' compounding. When comparing CDs, compare APYs — they already include compounding.');
  var rem=o.t-bm,need=rem>0&&o.D>0?pen/(o.D*rem/12)*100:0;
  $('penRows').innerHTML='<li>Penalty cost ('+o.pen+' days @ '+(apr*100).toFixed(2)+'% APR)<b style="color:var(--sx-err)">'+(pen?'−':'')+M(pen)+'</b></li><li>Extra yield needed to recoup over the remaining '+(Math.round(rem*10)/10)+' months<b style="color:var(--sx-pc)">'+(o.pen?'+'+need.toFixed(2)+'% APY':'None')+'</b></li>';
  C.text('penTxt',o.pen?'If a new CD for the remaining term pays at least '+need.toFixed(2)+' percentage points more than your current APY, breaking early and reinvesting roughly breaks even; more than that comes out ahead.':'A no-penalty CD lets you move to a higher rate at any time without losing interest.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'cdCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var o=last.o,rows=[];for(var m=0;m<=o.t;m++)rows.push({m:m,v:Math.round(o.D*Math.pow(1+o.apy,m/12)*100)/100});C.csv('cd-ledger.csv',[{h:'Month',key:'m'},{h:'Value',key:'v'}],rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCD={};
})();
