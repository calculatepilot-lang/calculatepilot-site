/* 401(k) calculator — CalculatePilot (Stitch 1:1 redesign).
   Monthly contributions + employer match, monthly compounding, annual salary raises,
   employee deferrals capped at the 2026 IRS limit for the saver's age in each year. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var BASE=24500,CATCH=8000,SUPER=11250;
var showAll=false,last=null;

function M(x,dp){dp=dp||0;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function AX(x){if(x>=1e6)return '$'+(x/1e6).toFixed(1)+'M';if(x>=1e3)return '$'+Math.round(x/1e3)+'K';return '$'+Math.round(x);}
function limitAt(age){return BASE+(age>=60&&age<=63?SUPER:age>=50?CATCH:0);}
function capName(age){return age>=60&&age<=63?'Âge 60–63':age>=50?'Âge 50+':'Moins de 50 ans';}

function inputs(){
  var cur=$('currentAge'),ret=$('retireAge');
  var a=Math.round(v('currentAge')),r=Math.round(v('retireAge'));
  if(r<=a){r=Math.min(80,a+1);if(r<=a)a=r-1;cur.value=a;ret.value=r;}
  return {age:a,ret:r,n:r-a,salary:Math.max(0,v('salary')),g:Math.max(0,v('salaryGrowth'))/100,P:Math.max(0,v('balance')),
    mode:$('cmode').value==='usd'?'usd':'pct',pct:Math.max(0,v('contribPct'))/100,amt:Math.max(0,v('contribAmt')),
    mRate:Math.max(0,v('matchRate'))/100,mCap:Math.max(0,v('matchCap'))/100,rate:v('rate')};
}

function yearContrib(o,sal,age){var want=o.mode==='usd'?o.amt:sal*o.pct;return {want:want,c:Math.min(want,limitAt(age))};}
function matchFor(o,sal,c){if(sal<=0)return 0;return sal*o.mRate*Math.min(c/sal,o.mCap);}

function simulate(o){
  var i=o.rate/100/12,bal=o.P,own=0,emp=0,rows=[],pts=[{age:o.age,p:o.P,m:0,t:o.P}];
  for(var k=0;k<o.n;k++){
    var age=o.age+k,sal=o.salary*Math.pow(1+o.g,k),yc=yearContrib(o,sal,age),mt=matchFor(o,sal,yc.c);
    var start=bal,int=0;
    for(var mo=0;mo<12;mo++){var it=bal*i;int+=it;bal+=it+yc.c/12+mt/12;}
    own+=yc.c;emp+=mt;
    rows.push({age:age,salary:sal,start:start,c:yc.c,match:mt,interest:int,end:bal});
    pts.push({age:age+1,p:o.P+own,m:emp,t:bal});
  }
  return {fv:bal,own:own,emp:emp,rows:rows,pts:pts};
}

function chart(o,res){
  var el=$('areaChart');if(!el)return;
  var W=Math.max(260,el.clientWidth-16),H=Math.max(180,el.clientHeight-16),P={l:42,r:8,t:10,b:8};
  var pts=res.pts,n=pts.length,max=Math.max.apply(null,pts.map(function(p){return p.t;}))||1;
  var raw=max/4,pw=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pw,st=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*pw,lines=Math.ceil(max/st),top=lines*st;
  var fx=function(j){return P.l+j*(W-P.l-P.r)/Math.max(1,n-1);},fy=function(x){return P.t+(H-P.t-P.b)*(1-x/top);};
  var base=fy(0);
  function area(get){var d='M'+fx(0).toFixed(1)+' '+base;pts.forEach(function(p,j){d+=' L'+fx(j).toFixed(1)+' '+fy(get(p)).toFixed(1);});return d+' L'+fx(n-1).toFixed(1)+' '+base+' Z';}
  function line(get){return pts.map(function(p,j){return (j?'L':'M')+fx(j).toFixed(1)+' '+fy(get(p)).toFixed(1);}).join(' ');}
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><defs>'+
    '<linearGradient id="kg1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--sx-pc);stop-opacity:.85"/><stop offset="1" style="stop-color:var(--sx-pc);stop-opacity:.2"/></linearGradient>'+
    '<linearGradient id="kg2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--sx-fdim);stop-opacity:.9"/><stop offset="1" style="stop-color:var(--sx-fdim);stop-opacity:.3"/></linearGradient>'+
    '<linearGradient id="kg3" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--sx-secondary);stop-opacity:.95"/><stop offset="1" style="stop-color:var(--sx-secondary);stop-opacity:.4"/></linearGradient></defs>';
  for(var g=1;g<=lines;g++){var y=fy(g*st);s+='<line class="gl" x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'"/><text class="gt" x="'+(P.l-6)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end">'+AX(g*st)+'</text>';}
  s+='<path d="'+area(function(p){return p.t;})+'" fill="url(#kg1)"/>';
  s+='<path d="'+area(function(p){return p.p+p.m;})+'" fill="url(#kg2)"/>';
  s+='<path d="'+area(function(p){return p.p;})+'" fill="url(#kg3)"/>';
  s+='<path d="'+line(function(p){return p.t;})+'" fill="none" style="stroke:var(--sx-primary)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  s+='<line id="kcur" x1="0" x2="0" y1="'+P.t+'" y2="'+base+'" style="stroke:var(--sx-muted)" stroke-width="1" opacity="0"/>';
  s+='<circle cx="'+fx(n-1).toFixed(1)+'" cy="'+fy(pts[n-1].t).toFixed(1)+'" r="5" style="fill:var(--sx-primary)" stroke="#fff" stroke-width="2"/>';
  s+='<rect class="hit" x="'+P.l+'" y="'+P.t+'" width="'+(W-P.l-P.r)+'" height="'+(base-P.t)+'"/></svg><div class="tip"></div>';
  el.innerHTML=s;
  var svg=el.querySelector('svg'),tip=el.querySelector('.tip'),cur=el.querySelector('#kcur');
  function move(ev){var r=svg.getBoundingClientRect(),cx=((ev.touches?ev.touches[0].clientX:ev.clientX)-r.left)*W/r.width;
    var j=Math.max(0,Math.min(n-1,Math.round((cx-P.l)/(W-P.l-P.r)*(n-1)))),p=pts[j];
    tip.innerHTML='<b>Âge '+p.age+'</b>Solde : '+M(p.t)+'<br>Votre capital : '+M(p.p)+'<br>Abondement de l\'employeur : '+M(p.m)+'<br>Intérêts : '+M(Math.max(0,p.t-p.p-p.m));
    tip.style.left=(8+fx(j)*r.width/W)+'px';tip.style.top=(8+fy(p.t)*r.height/H)+'px';tip.style.opacity=1;cur.setAttribute('x1',fx(j));cur.setAttribute('x2',fx(j));cur.setAttribute('opacity',.5);}
  function out(){tip.style.opacity=0;cur.setAttribute('opacity',0);}
  svg.addEventListener('mousemove',move);svg.addEventListener('touchmove',move,{passive:true});svg.addEventListener('mouseleave',out);svg.addEventListener('touchend',out);
  var lab='';for(var q=0;q<5;q++){var age=o.age+Math.round(q*o.n/4);lab+='<span>Âge '+age+(q===0?' (Today)':q===4?' (objectif de retraite)':'')+'</span>';}
  $('xLabels').innerHTML=lab;
}

function schedule(o,res){
  var rows=res.rows,L=rows.length;
  var body=rows.map(function(r,k){
    var mile=k<4||r.age%10===0||k===L-1;if(!showAll&&!mile)return '';
    return '<tr'+(k===L-1?' class="fin"':'')+'><td class="ag">'+r.age+'</td><td class="mu">'+M(r.salary)+'</td><td>'+M(r.start)+'</td><td class="yc">+'+M(r.c)+'</td><td class="mt">+'+M(r.match)+'</td><td class="in">'+(r.interest<0?'':'+')+M(r.interest)+'</td><td class="eb">'+M(r.end)+'</td></tr>';
  }).join('');
  $('schedBody').innerHTML=body;
  C.text('schedNote',showAll?'Affichage de toutes les '+L+' lignes annuelles':'Affichage d\'étapes représentatives de l\'horizon');
  C.text('schedToggle',showAll?'Afficher uniquement les étapes clés ↑':'Tout afficher '+L+' Lignes annuelles →');
  $('schedToggle').setAttribute('aria-expanded',String(showAll));
}

function compute(){
  var o=inputs(),res=simulate(o),fv=res.fv;
  $('rowPct').hidden=o.mode!=='pct';$('rowUsd').hidden=o.mode!=='usd';
  C.text('ageCurrentVal',o.age+' yrs');C.text('ageRetireVal',o.ret+' yrs');
  C.text('horizonVal',o.n+(o.n===1?' year':' years'));C.text('periodsVal',(o.n*12)+' Périodes de capitalisation');
  C.text('contribPctDisplay',(o.pct*100).toFixed(1)+'%');C.text('contribAmtDisplay',M(o.amt));
  C.text('rateDisplay',(Math.round(o.rate*100)/100)+'%');

  /* IRS gauge for the current year */
  var cap=limitAt(o.age),yc=yearContrib(o,o.salary,o.age),bar=$('capBar'),room=$('capRoom');
  C.text('contribMonthly',M(yc.c/12)+'/mo');C.text('contribAnnual',M(yc.want));C.text('capLimit',M(cap));
  C.text('capLabel','IRS 2026 '+capName(o.age)+' Plafond : '+M(cap));
  bar.style.width=Math.min(100,cap?yc.want/cap*100:0)+'%';bar.classList.toggle('over',yc.want>cap);
  if(yc.want>cap){room.textContent='Plafonné — '+M(yc.want-cap)+' au-dessus de la limite';room.classList.add('warn');}
  else{room.textContent=M(cap-yc.want)+' limite restante';room.classList.remove('warn');}

  /* match presets + callout */
  document.querySelectorAll('.sx-preset').forEach(function(b){var p=b.getAttribute('data-preset').split(',');b.setAttribute('aria-pressed',String(+p[0]===Math.round(o.mRate*100)&&+p[1]===Math.round(o.mCap*1000)/10));});
  var full=o.salary*o.mRate*o.mCap,got=matchFor(o,o.salary,yc.c),call=$('matchCall');
  if(full<=0){call.classList.remove('warn');C.text('callIcon','check');C.text('callTitle','Aucun abondement de l\'employeur saisi');C.text('callText','Ajoutez la formule d\'abondement de votre plan ci-dessus pour voir combien d\'argent gratuit votre employeur ajoute chaque année.');}
  else if(got>=full-0.5){call.classList.remove('warn');C.text('callIcon','check');C.text('callTitle','Abondement complet de l\'employeur capté !');C.html('callText','Vous captez 100 % de votre <strong>'+M(full)+'/yr</strong> employer match. Leaving $0 on the table!');}
  else{call.classList.add('warn');C.text('callIcon','warning');C.text('callTitle','Abondement de l\'employeur non perçu');
    C.html('callText','Vous captez '+M(got)+' de votre <strong>'+M(full)+'/yr</strong> match. Contribute at least <strong>'+(o.mCap*100).toFixed(1).replace(/[.,]0$/,'')+' % du salaire</strong> pour récupérer l\'abondement manquant de '+M(full-got)+' par an.');}

  C.text('heroRetireAge',o.ret);C.text('projBadge',o.n+' ans de projection');C.text('resultValue',M(fv));
  var growth=fv-o.P-res.own-res.emp;
  C.text('statContrib',M(res.own));C.text('statContribPct',(fv>0?res.own/fv*100:0).toFixed(1)+'% du portefeuille');
  C.text('statMatch',M(res.emp));
  C.text('statGrowth',M(growth));C.text('statGrowthPct',(fv>0?Math.max(0,growth)/fv*100:0).toFixed(1)+'% d\'intérêts gagnés');
  C.text('statDraw',M(fv*0.04/12));C.text('statDrawAnnual',M(fv*0.04)+'/yr annual income');

  chart(o,res);schedule(o,res);last={o:o,res:res};
}

document.addEventListener('DOMContentLoaded',function(){
  var root=$('k401');
  /* switching % / $ carries the current amount across so the projection doesn't jump */
  $('cmode').addEventListener('input',function(){var o=inputs(),sal=o.salary||1;
    if(o.mode==='usd'){$('contribAmt').value=Math.round(Math.min(35750,sal*o.pct)/50)*50;}
    else{$('contribPct').value=Math.max(1,Math.min(25,Math.round(o.amt/sal*200)/2));}});
  root.addEventListener('click',function(e){var b=e.target.closest('.sx-preset');if(!b)return;var p=b.getAttribute('data-preset').split(',');
    $('matchRate').value=p[0];$('matchCap').value=p[1];$('matchRate').dispatchEvent(new Event('input',{bubbles:true}));});
  C.init({root:'k401',compute:compute});
  $('schedToggle').addEventListener('click',function(){showAll=!showAll;if(last)schedule(last.o,last.res);});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('401k-schedule.csv',[{h:'Âge',key:'age'},{h:'Salaire annuel',key:'salary'},{h:'Solde initial',key:'start'},{h:'Votre cotisation',key:'c'},{h:'Abondement de l\'employeur',key:'match'},{h:'Intérêts annuels',key:'interest'},{h:'Solde final',key:'end'}],last.res.rows);});
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(last)chart(last.o,last.res);},120);});
});
window.cp401k={simulate:simulate,limitAt:limitAt};
})();
