/* Roth IRA calculator — CalculatePilot (Stitch 1:1 redesign).
   Annual contributions at the start of each year, capped at the 2026 IRS limit for the
   saver's age and income; compared with a Traditional IRA funded the same way. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var LIMIT=7500,CATCHUP=1100,YEAR0=new Date().getFullYear();
var PHASE={single:[153000,168000],mfj:[242000,252000],mfs:[0,10000]};
var ledgerRows=[],expanded=false;

/* Roth IRA is a US account, so figures are always USD regardless of the site-wide currency picker */
function M(x,dp){dp=dp||0;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function S(x,dp){var a=Math.abs(x);if(a>=1e6)return '$'+(a/1e6).toFixed(dp===undefined?1:dp)+'M';if(a>=1e3)return '$'+Math.round(a/1e3)+'k';return '$'+Math.round(a);}

function phaseFactor(o,base){
  var r=PHASE[o.filing]||PHASE.single,lo=r[0],hi=r[1];
  if(o.magi<lo)return base;
  if(o.magi>=hi)return 0;
  var red=Math.ceil(base*(hi-o.magi)/(hi-lo)/10)*10;
  return Math.min(base,Math.max(200,red));
}
function limitAt(o,age){return phaseFactor(o,LIMIT+(age>=50?CATCHUP:0));}

function inputs(){
  var age=Math.round(Math.max(18,Math.min(90,v('currentAge')||18)));
  var ret=Math.round(v('retireAge'));if(!(ret>age))ret=age+1;
  return {age:age,ret:ret,n:ret-age,P:Math.max(0,v('startBalance')),contrib:Math.max(0,v('contribution')),maxOut:$('maxOut').checked,
    rate:v('rate'),tNow:Math.min(60,Math.max(0,v('taxNow')))/100,tRet:Math.min(60,Math.max(0,v('taxRet')))/100,
    filing:$('filing').value,magi:Math.max(0,v('magi')),swr:Math.max(0,v('swr'))/100,infl:Math.max(0,v('inflation'))/100};
}

function simulate(o){
  var r=o.rate/100,bal=o.P,principal=o.P,newC=0,rows=[],snaps=[{age:o.age,p:o.P,e:0}];
  for(var k=0;k<o.n;k++){
    var age=o.age+k,cap=limitAt(o,age),c=o.maxOut?cap:Math.min(o.contrib,cap);
    var begin=bal,gain=(begin+c)*r;bal=begin+c+gain;principal+=c;newC+=c;
    rows.push({year:YEAR0+k,age:age,begin:begin,c:c,gain:gain,principal:principal,end:bal});
    snaps.push({age:age+1,p:principal,e:bal-principal});
  }
  return {fv:bal,principal:principal,newC:newC,rows:rows,snaps:snaps};
}

function chart(o,res){
  var el=$('growthChart');if(!el)return;
  var W=Math.max(280,el.clientWidth),H=el.clientHeight||256,P={l:52,r:16,t:34,b:28};
  var n=o.n,step=Math.max(1,Math.round(n/5)),idx=[];
  for(var i=0;i<n;i+=step)idx.push(i);
  if(idx.length>1&&n-idx[idx.length-1]<step/2)idx.pop();
  idx.push(n);
  var pts=idx.map(function(i){return res.snaps[i];});
  var max=Math.max.apply(null,pts.map(function(p){return p.p+Math.max(0,p.e);}))||1;
  var raw=max/4,pow=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pow,st=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*pow;
  var lines=Math.ceil(max/st),top=lines*st,ih=H-P.t-P.b,fy=function(x){return P.t+ih-(x/top)*ih;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true">';
  for(var g=0;g<=lines;g++){var y=fy(g*st);s+='<line class="gl" x1="12" x2="'+(W-12)+'" y1="'+y+'" y2="'+y+'"/><text class="gt" x="12" y="'+(y-4)+'">'+S(g*st)+'</text>';}
  var cw=(W-P.l-P.r)/pts.length,bw=Math.min(28,cw*.5);
  pts.forEach(function(p,j){
    var cx=P.l+cw*j+cw/2,x=cx-bw/2,e=Math.max(0,p.e),yp=fy(p.p),ye=fy(p.p+e),last=j===pts.length-1;
    s+='<g class="col"><title>Age '+p.age+' · Principal '+M(p.p)+' · Earnings '+M(e)+' · Total '+M(p.p+e)+'</title>';
    s+='<rect x="'+x.toFixed(1)+'" y="'+yp.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(0,fy(0)-yp).toFixed(1)+'" rx="2" fill="var(--sx-ov)"/>';
    if(e>0)s+='<rect x="'+x.toFixed(1)+'" y="'+ye.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(0,yp-ye).toFixed(1)+'" rx="2" fill="var(--sx-pc)"/>';
    s+='<text class="xt'+(last?' on':'')+'" x="'+cx.toFixed(1)+'" y="'+(H-9)+'" text-anchor="middle">Age '+p.age+'</text>';
    if(last){var t=S(p.p+e,2),tw=t.length*6.6+14,tx=Math.min(W-tw-4,cx-tw/2),ty=Math.max(2,ye-26);
      s+='<rect class="tagb" x="'+tx.toFixed(1)+'" y="'+ty.toFixed(1)+'" width="'+tw.toFixed(1)+'" height="19" rx="4"/><text class="tagt" x="'+(tx+tw/2).toFixed(1)+'" y="'+(ty+13).toFixed(1)+'" text-anchor="middle">'+t+'</text>';}
    s+='</g>';
  });
  el.innerHTML=s+'</svg>';
}

var COLS=function(o){return [{h:'Year',key:'year'},{h:'Age',key:'age'},{h:'Beginning Balance',key:'begin'},{h:'Annual Contribution',key:'c'},{h:'Investment Gain ('+fmtRate(o.rate)+')',key:'gain'},{h:'Cumulative Principal',key:'principal'},{h:'Ending Balance',key:'end'}];};
function fmtRate(r){return (Math.round(r*10)/10)+'%';}

function ledger(o,res){
  ledgerRows=res.rows;
  var cols=COLS(o),h='<table class="sx-tbl"><thead><tr>'+cols.map(function(c,i){return '<th scope="col"'+(i>1?' class="n"':'')+'>'+C.esc(c.h)+'</th>';}).join('')+'</tr></thead><tbody>';
  res.rows.forEach(function(r,i){h+='<tr'+(!expanded&&i>=10?' class="hid"':'')+'><td class="y">'+r.year+'</td><td class="a">'+r.age+'</td><td class="n">'+M(r.begin)+'</td><td class="n c">+'+M(r.c)+'</td><td class="n gn">'+(r.gain<0?'':'+')+M(r.gain)+'</td><td class="n">'+M(r.principal)+'</td><td class="n e">'+M(r.end)+'</td></tr>';});
  $('ledger').innerHTML=h+'</tbody></table>';
  var more=$('ledgerMore');more.parentNode.style.display=res.rows.length>10?'':'none';
  more.setAttribute('aria-expanded',String(expanded));
  C.text('ledgerMoreTxt',expanded?'Show First 10 Years':'Show Full '+o.n+'-Year Ledger');
}

function compute(){
  var o=inputs(),res=simulate(o),fv=res.fv;
  /* contribution control mirrors the current-year limit */
  var cap=limitAt(o,o.age),sl=$('contribution');
  sl.max=String(Math.max(cap,0));sl.disabled=cap===0;
  if(o.maxOut||+sl.value>cap){sl.value=cap;}
  var cNow=o.maxOut?cap:Math.min(o.contrib,cap);
  C.text('contribYr',M(cNow)+' / yr');C.text('contribMo','('+M(cNow/12,2)+'/mo)');
  C.text('maxTitle','Max Out Annual Contribution ('+M(cap)+'/yr)');
  var reduced=cap<LIMIT+(o.age>=50?CATCHUP:0);
  var sub=reduced?'Reduced by the 2026 income phase-out at '+M(o.magi)+' MAGI':(o.age>=50?'2026 IRS limit including the $1,100 age-50+ catch-up':'2026 IRS statutory limit for individuals under 50');
  if(o.maxOut&&o.age<50&&o.ret>50&&!reduced)sub+=' · rises to '+M(limitAt(o,50))+' at age 50';
  C.text('maxSub',sub);
  var warn=$('limitWarn');
  if(cap===0){warn.textContent='At '+M(o.magi)+' MAGI you can\'t contribute directly to a Roth IRA in 2026, so the projection grows your existing balance only. Many high earners use a "backdoor" Roth (a nondeductible Traditional IRA contribution followed by a conversion).';warn.classList.add('show');}
  else warn.classList.remove('show');
  var ph=PHASE[o.filing];C.text('eligText','2026 phase-out for '+({single:'single filers',mfj:'married couples filing jointly',mfs:'married filing separately'})[o.filing]+': '+M(ph[0])+'–'+M(ph[1])+' MAGI. Your limit this year: '+M(cap)+'.');

  C.text('horizonText',o.n+(o.n===1?' Year':' Years')+' of Exponential Growth');
  C.text('rateVal',o.rate.toFixed(1)+'%');
  C.text('retAgeLbl',o.ret);
  C.text('resultValue',M(fv));
  C.text('realText','≈ '+M(fv/Math.pow(1+o.infl,o.n))+' in today\'s dollars at '+(o.infl*100).toFixed(1)+'% inflation');
  C.text('monthlyIncome',M(fv*o.swr/12)+' / mo');
  C.text('swrLbl','(at safe '+(o.swr*100).toFixed(1)+'% SWR rule)');

  var growth=fv-res.principal,pp=fv>0?res.principal/fv*100:100,gp=fv>0?Math.max(0,growth)/fv*100:0;
  C.text('outContrib',M(res.principal));C.text('outContribPct',pp.toFixed(1)+'% of portfolio');$('barContrib').style.width=Math.min(100,pp)+'%';
  C.text('outGrowth',M(growth));C.text('outGrowthPct',gp.toFixed(1)+'% compound interest');$('barGrowth').style.width=gp+'%';
  var taxSaved=fv*o.tRet;
  C.text('outTaxSaved',M(taxSaved));C.text('outTaxSub','vs Traditional at '+Math.round(o.tRet*100)+'% bracket');

  C.text('chartTitle',o.n+'-Year Wealth Accumulation Trajectory');
  C.text('chartSub','Exponential compounding of annual '+M(cNow)+' deposits at '+o.rate.toFixed(1)+'% annual return');
  chart(o,res);

  var ded=res.newC*o.tNow,adv=taxSaved-ded;
  C.text('vsSub','Comparing terminal net cash flows at '+Math.round(o.tRet*100)+'% retirement ordinary income bracket');
  var b=$('advBadge');b.textContent=(adv>=0?'Roth Advantage: +':'Traditional Advantage: +')+M(Math.abs(adv));b.classList.toggle('neg',adv<0);
  C.text('vsGrossLbl','Gross Ending Balance (Age '+o.ret+')');
  C.text('vsGrossR',M(fv));C.text('vsGrossT',M(fv));
  C.text('vsDed','+'+M(ded)+' ('+Math.round(o.tNow*100)+'% bracket)');
  C.text('vsTax','−'+M(taxSaved)+' ('+Math.round(o.tRet*100)+'% Marginal)');
  C.text('vsNetR',M(fv));C.text('vsNetT',M(fv-taxSaved));

  C.text('ledgerSub','Detailed schedule tracking year-over-year principal infusions and '+o.rate.toFixed(1)+'% annual investment yields.');
  ledger(o,res);
  C.html('formulaVars','Where <strong>P</strong> = Starting Balance, <strong>r</strong> = Annual Rate ('+o.rate.toFixed(1)+'%), <strong>n</strong> = Years ('+o.n+'), <strong>PMT</strong> = '+C.esc(M(cNow))+'.');
  C.text('principalTxt',M(res.principal));
  window._rothLast={o:o,res:res};
}

document.addEventListener('DOMContentLoaded',function(){
  var sl=$('contribution'),mx=$('maxOut');
  /* moving the slider below the limit switches max-out off; dragging to the top switches it back on */
  sl.addEventListener('input',function(){mx.checked=+sl.value>=+sl.max;});
  mx.addEventListener('change',function(){if(!mx.checked&&+sl.value>=+sl.max)sl.value=Math.max(0,+sl.max-500);});
  C.init({root:'rothCalc',compute:compute});
  $('ledgerMore').addEventListener('click',function(){expanded=!expanded;compute();});
  $('csvBtn').addEventListener('click',function(){var L=window._rothLast;if(L)C.csv('roth-ira-ledger.csv',COLS(L.o),L.res.rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){var L=window._rothLast;if(L)chart(L.o,L.res);},120);});
});
})();
