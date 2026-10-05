/* Compound interest calculator — CalculatePilot (Stitch 1:1 redesign).
   Per-contribution-period simulation: the nominal rate compounded n times a year is converted to the
   equivalent rate per contribution period, (1 + r/n)^(n/p) − 1 (continuous: e^(r/p) − 1).
   Deposits at the start or end of each period; optional inflation-adjusted value. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var FREQ={365:'Daily',52:'Weekly',12:'Monthly',4:'Quarterly',1:'Annual',inf:'Continuous'};
var PER={52:'week',26:'2 weeks',12:'month',4:'quarter',1:'year'};
var showAll=false,last=null;
function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.round(Math.abs(x)).toLocaleString('en-US');}
function S(x){var a=Math.abs(x);if(a>=1e6)return '$'+(a/1e6).toFixed(a>=1e7?1:2)+'M';if(a>=1e3)return '$'+Math.round(a/1e3)+'K';return '$'+Math.round(a);}

function inputs(){
  var cf=$('compound').value;
  return {P:Math.max(0,v('principal')),pmt:Math.max(0,v('contribution')),p:parseInt($('contribFreq').value,10)||12,due:$('timing').value==='start',
    years:Math.max(1,Math.round(v('years'))),rate:v('rate'),n:cf==='inf'?Infinity:(parseInt(cf,10)||12),inflOn:$('inflOn').checked,infl:Math.max(0,v('inflation'))/100};
}
function simulate(o){
  var r=o.rate/100,i=o.n===Infinity?Math.exp(r/o.p)-1:Math.pow(1+r/o.n,o.n/o.p)-1;
  var bal=o.P,contrib=o.P,cumInt=0,years=[],pts=[{t:0,bal:o.P,contrib:o.P}];
  for(var y=1;y<=o.years;y++){
    var start=bal,dep=0,int=0;
    for(var k=0;k<o.p;k++){
      if(o.due){bal+=o.pmt;dep+=o.pmt;}
      var it=bal*i;bal+=it;int+=it;
      if(!o.due){bal+=o.pmt;dep+=o.pmt;}
    }
    contrib+=dep;cumInt+=int;
    years.push({year:y,start:start,dep:dep,int:int,cum:cumInt,bal:bal,contrib:contrib});
    pts.push({t:y,bal:bal,contrib:contrib});
  }
  return {fv:bal,contrib:contrib,interest:cumInt,years:years,pts:pts};
}

function chart(o,res){
  var el=$('ciChart');if(!el)return;
  var W=Math.max(260,el.clientWidth-24),H=Math.max(160,el.clientHeight-34),P0={l:38,r:6,t:8,b:4},pts=res.pts,n=pts.length;
  var max=Math.max.apply(null,pts.map(function(p){return Math.max(p.bal,p.contrib);}))||1,raw=max/4,pw=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pw,st=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*pw,top=Math.ceil(max/st)*st;
  var fx=function(j){return P0.l+j*(W-P0.l-P0.r)/(n-1);},fy=function(x){return P0.t+(H-P0.t-P0.b)*(1-Math.max(0,x)/top);};
  function path(get){return pts.map(function(p,j){return (j?'L':'M')+fx(j).toFixed(1)+' '+fy(get(p)).toFixed(1);}).join(' ');}
  var base=fy(0),s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="cig1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--sx-pc);stop-opacity:.25"/><stop offset="1" style="stop-color:var(--sx-pc);stop-opacity:.01"/></linearGradient><linearGradient id="cig2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--sx-onv);stop-opacity:.12"/><stop offset="1" style="stop-color:var(--sx-onv);stop-opacity:0"/></linearGradient></defs>';
  for(var g=0;g<=top+1e-9;g+=st){var y=fy(g);s+='<line class="gl" x1="'+P0.l+'" x2="'+(W-P0.r)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'"/><text class="gt" x="'+(P0.l-6)+'" y="'+(y+3).toFixed(1)+'" text-anchor="end">'+S(g)+'</text>';}
  var tot=path(function(p){return p.bal;}),con=path(function(p){return p.contrib;});
  s+='<path d="'+tot+' L'+fx(n-1).toFixed(1)+' '+base+' L'+fx(0)+' '+base+' Z" fill="url(#cig1)"/>';
  s+='<path d="'+con+' L'+fx(n-1).toFixed(1)+' '+base+' L'+fx(0)+' '+base+' Z" fill="url(#cig2)"/>';
  s+='<path d="'+con+'" fill="none" style="stroke:var(--sx-outline)" stroke-width="2" stroke-dasharray="4 4"/>';
  s+='<path d="'+tot+'" fill="none" style="stroke:var(--sx-pc)" stroke-width="3" stroke-linejoin="round"/>';
  s+='<circle cx="'+fx(0)+'" cy="'+fy(pts[0].bal).toFixed(1)+'" r="4" style="fill:var(--sx-pc)"/><circle cx="'+fx(n-1).toFixed(1)+'" cy="'+fy(pts[n-1].bal).toFixed(1)+'" r="5" style="fill:var(--sx-pc)" stroke="#fff" stroke-width="2"/>';
  s+='<line id="cicur" x1="0" x2="0" y1="'+P0.t+'" y2="'+base+'" style="stroke:var(--sx-muted)" opacity="0"/><rect x="'+P0.l+'" y="0" width="'+(W-P0.l-P0.r)+'" height="'+H+'" fill="transparent" style="cursor:crosshair"/></svg><div class="tip"></div>';
  s+='<div class="ax"><span>Year 0</span><span>Year '+Math.round(o.years/2)+'</span><span>Year '+o.years+'</span></div>';
  el.innerHTML=s;
  var svg=el.querySelector('svg'),tip=el.querySelector('.tip'),cur=el.querySelector('#cicur');
  function move(ev){var r=svg.getBoundingClientRect(),x=((ev.touches?ev.touches[0].clientX:ev.clientX)-r.left)*W/r.width,j=Math.max(0,Math.min(n-1,Math.round((x-P0.l)/(W-P0.l-P0.r)*(n-1)))),p=pts[j];
    tip.innerHTML='<b>Year '+p.t+'</b>Total wealth: '+M(p.bal)+'<br>Contributions: '+M(p.contrib);tip.style.left=(12+fx(j)*r.width/W)+'px';tip.style.top=(12+fy(p.bal)*r.height/H)+'px';tip.style.opacity=1;cur.setAttribute('x1',fx(j));cur.setAttribute('x2',fx(j));cur.setAttribute('opacity',.4);}
  function out(){tip.style.opacity=0;cur.setAttribute('opacity',0);}
  svg.addEventListener('mousemove',move);svg.addEventListener('touchmove',move,{passive:true});svg.addEventListener('mouseleave',out);svg.addEventListener('touchend',out);
}

function schedule(res){
  var ys=res.years,L=ys.length,lim=20;
  $('schedBody').innerHTML=ys.map(function(y,k){return '<tr'+(!showAll&&k>=lim?' class="hid"':'')+'><td>Year '+y.year+'</td><td>'+M(y.start)+'</td><td>'+M(y.dep)+'</td><td class="in">+'+M(y.int)+'</td><td>'+M(y.cum)+'</td><td>'+M(y.bal)+'</td></tr>';}).join('');
  C.text('schedNote','Displaying '+(showAll||L<=lim?L:lim)+' of '+L+' annual growth intervals');
  var b=$('schedMore');b.style.display=L>lim?'':'none';b.textContent=showAll?'Show first 20 years':'Show all years';b.setAttribute('aria-expanded',String(showAll));
}

function milestones(o,res){
  var marks=[1e4,25e3,5e4,1e5,25e4,5e5,1e6,25e5,5e6,1e7,25e6],out=[];
  marks.filter(function(x){return x>o.P;}).some(function(x){for(var j=0;j<res.years.length;j++){var y=res.years[j];if(y.bal>=x){out.push({k:'First '+S(x).replace('.00',''),t:'Year '+y.year,d:'Requires '+Math.round(y.contrib/y.bal*100)+'% self-funded capital'});break;}}return out.length>=2;});
  while(out.length<2){var nx=marks.filter(function(x){return x>Math.max(o.P,res.fv);})[out.length]||1e8;out.push({k:'First '+S(nx),t:'Beyond year '+o.years,d:'Extend the horizon or add more to reach it'});}
  var cross=null;res.years.some(function(y){if(y.dep>0&&y.int>y.dep){cross=y;return true;}return false;});
  var third=o.pmt>0?{k:'Crossover Point',t:cross?'Year '+cross.year:'Not reached',d:cross?'Annual interest exceeds contributions':'Interest stays below yearly deposits in this term'}:{k:'Doubling Time',t:(function(){var r=o.rate/100,a=o.n===Infinity?Math.exp(r)-1:Math.pow(1+r/o.n,o.n)-1;return a>0?(Math.log(2)/Math.log(1+a)).toFixed(1)+' years':'Never';})(),d:'Time for the balance to double at this rate'};
  $('miles').innerHTML=out.slice(0,2).map(function(m){return '<div class="sx-card"><span class="k">'+m.k+'</span><div class="v">'+m.t+'</div><p>'+m.d+'</p></div>';}).join('')+'<div class="sx-card hl"><span class="k">'+third.k+'</span><div class="v">'+third.t+'</div><p>'+third.d+'</p></div>';
}

function compute(){
  var o=inputs(),res=simulate(o),fv=res.fv,tot=Math.max(1,res.contrib+Math.max(0,res.interest));
  C.text('yearsVal',o.years);C.text('yearTarget',o.years);
  C.text('modeLbl',FREQ[o.n===Infinity?'inf':o.n]+' Compounding');
  C.text('resultValue',M(fv));C.text('multTag',(res.contrib?fv/res.contrib:0).toFixed(2)+'× return');
  C.text('outPrincipal',M(res.contrib));C.text('outPrincipalPct',(res.contrib/tot*100).toFixed(1)+'% of total value');
  C.text('outInterest',M(res.interest));C.text('outInterestPct',(Math.max(0,res.interest)/tot*100).toFixed(1)+'% of total value');
  if(o.inflOn){C.text('outReal',M(fv/Math.pow(1+o.infl,o.years)));C.text('outRealSub','Adjusted for '+(o.infl*100).toFixed(1)+'% inflation');}
  else{C.text('outReal',M(fv));C.text('outRealSub','Inflation adjustment off');}
  $('barP').style.width=(res.contrib/tot*100)+'%';$('barI').style.width=(Math.max(0,res.interest)/tot*100)+'%';
  chart(o,res);milestones(o,res);schedule(res);
  C.text('varP','The starting capital deposited at inception ('+M(o.P)+').');
  C.text('varPmt','Recurrent cash addition ('+M(o.pmt)+'/'+PER[o.p]+').');
  var art=/^(8|11|18)(\D|$)/.test(String(o.rate))?'an ':'a ';var ly=res.years[res.years.length-1],ratio=ly&&ly.dep>0?ly.int/ly.dep:0;
  C.html('mechTxt',ly&&ly.dep>0?(ratio>=1?'At year '+o.years+' with '+art+o.rate+'% return, annual earned interest outpaces annual deposits by <b>'+ratio.toFixed(1)+' to 1</b> — growth has switched from contribution-driven to yield-driven.':'At year '+o.years+' with '+art+o.rate+'% return, annual interest is still <b>'+Math.round(ratio*100)+'%</b> of your yearly deposits — a longer horizon shifts growth from contributions to compounding.'):'With no regular contributions, the balance grows purely by compounding: it multiplies by <b>'+(o.P?(fv/o.P).toFixed(2):'—')+'×</b> over '+o.years+' years.');
  last={o:o,res:res};
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ciCalc',compute:compute});
  $('schedMore').addEventListener('click',function(){showAll=!showAll;if(last)schedule(last.res);});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('compound-interest-schedule.csv',[{h:'Year',key:'year'},{h:'Starting Amount',key:'start'},{h:'Yearly Contribution',key:'dep'},{h:'Annual Interest Earned',key:'int'},{h:'Total Cumulative Interest',key:'cum'},{h:'End of Year Balance',key:'bal'}],last.res.years);});
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(last)chart(last.o,last.res);},120);});
});
window.cpCompound={simulate:simulate};
})();
