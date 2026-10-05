/* Retirement & safe withdrawal rate (FIRE) calculator — CalculatePilot (Stitch 1:1 redesign).
   Monthly simulation to age 95: saving at the pre-retirement return until the target age, then
   inflation-adjusted withdrawals at the post-retirement return. Targets are in today's dollars. */
(function(){
var C=window.CPX,$=C.$,v=C.val,END=95;
var expanded=false,last=null;
var MON=['janv.','févr.','mars','avr.','Mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

function M(x,dp){dp=dp||0;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function S(x){var a=Math.abs(x);if(a>=1e6)return '$'+(a/1e6).toFixed(a>=1e7?1:2).replace(/0$/,'')+'M';if(a>=1e3)return '$'+Math.round(a/1e3)+'k';return '$'+Math.round(a);}
function mrate(a){return Math.pow(1+a,1/12)-1;}

function inputs(){
  var age=Math.round(Math.min(90,Math.max(18,v('currentAge')||18))),ret=Math.round(v('retireAge'));
  if(!(ret>age))ret=age+1;if(ret>END-1)ret=END-1;
  var mode=$('swrMode').value,swr=mode==='custom'?v('swrCustom'):parseFloat(mode);
  return {age:age,ret:ret,spend:Math.max(0,v('spending')),nw:Math.max(0,v('netWorth')),save:Math.max(0,v('savings')),
    swr:Math.max(0.5,Math.min(15,swr||4))/100,mode:mode,pre:v('preRoi')/100,post:v('postRoi')/100,inf:Math.max(0,v('inflation'))/100};
}

/* keepSaving: ignore retirement and keep contributing (used for "when would I reach FI") */
function simulate(o,keepSaving){
  var ip=mrate(o.pre),iq=mrate(o.post),months=(END-o.age)*12,bal=o.nw,years=[],depleted=null,yStart=bal,yIn=0,yOut=0,yGrow=0,real=[{age:o.age,v:bal}];
  for(var m=0;m<months;m++){
    var age=o.age+Math.floor(m/12),retired=!keepSaving&&age>=o.ret,g;
    if(retired){var w=o.spend*Math.pow(1+o.inf,m/12)/12,take=Math.min(bal,w);bal-=take;yOut+=take;g=bal*iq;bal+=g;yGrow+=g;if(bal<=0.005&&depleted===null&&w>0)depleted=o.age+m/12;}
    else{g=bal*ip;bal+=g+o.save/12;yGrow+=g;yIn+=o.save/12;}
    if(m%12===11){years.push({age:age,start:yStart,inflow:yIn,out:yOut,growth:yGrow,end:bal,retired:retired});real.push({age:age+1,v:bal/Math.pow(1+o.inf,(m+1)/12)});yStart=bal;yIn=0;yOut=0;yGrow=0;}
  }
  return {years:years,real:real,depleted:depleted,end:bal};
}
/* first month the inflation-adjusted balance reaches target (today's $); null if never by 95 */
function reachMonth(o,target){
  if(o.nw>=target)return 0;var ip=mrate(o.pre),bal=o.nw;
  for(var m=1;m<=(END-o.age)*12;m++){bal+=bal*ip+o.save/12;if(bal/Math.pow(1+o.inf,m/12)>=target)return m;}
  return null;
}

function chart(o,sim,fire,fiAge){
  var el=$('trajChart');if(!el)return;
  var W=Math.max(260,el.clientWidth),H=el.clientHeight||224,P={l:4,r:6,t:18,b:6},pts=sim.real,n=pts.length;
  var max=Math.max(fire*1.25,Math.max.apply(null,pts.map(function(p){return p.v;})))*1.05;
  var fx=function(j){return P.l+j*(W-P.l-P.r)/(n-1);},fy=function(x){return P.t+(H-P.t-P.b)*(1-Math.max(0,x)/max);};
  var line=pts.map(function(p,j){return (j?'L':'M')+fx(j).toFixed(1)+' '+fy(p.v).toFixed(1);}).join(' ');
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="rg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--sx-primary);stop-opacity:.32"/><stop offset=".7" style="stop-color:var(--sx-fdim);stop-opacity:.08"/><stop offset="1" style="stop-color:var(--sx-card);stop-opacity:0"/></linearGradient></defs>';
  for(var g=1;g<=4;g++){var y=P.t+(H-P.t-P.b)*g/4.3;s+='<line class="gl" x1="0" x2="'+W+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'"/>';}
  var ty=fy(fire);s+='<line class="thr" x1="0" x2="'+W+'" y1="'+ty.toFixed(1)+'" y2="'+ty.toFixed(1)+'"/><text class="thl" x="8" y="'+(ty-6).toFixed(1)+'">Nombre FIRE : '+M(fire)+'</text>';
  var rj=o.ret-o.age,rx=fx(rj);s+='<line class="ph" x1="'+rx.toFixed(1)+'" x2="'+rx.toFixed(1)+'" y1="4" y2="'+(H-2)+'"/><text class="phl" x="'+(rx+5).toFixed(1)+'" y="12"'+(rx>W-110?' text-anchor="end" dx="-10"':'')+'>Retraite : âge '+o.ret+'</text>';
  s+='<path d="'+line+' L'+fx(n-1).toFixed(1)+' '+fy(0).toFixed(1)+' L'+fx(0).toFixed(1)+' '+fy(0).toFixed(1)+' Z" fill="url(#rg)"/>';
  s+='<path d="'+line+'" fill="none" style="stroke:var(--sx-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
  var node=function(j,r,c){return '<circle cx="'+fx(j).toFixed(1)+'" cy="'+fy(pts[j].v).toFixed(1)+'" r="'+r+'" style="fill:'+c+'" stroke="#fff" stroke-width="2"/>';};
  s+=node(0,4.5,'var(--sx-primary)');if(fiAge!==null&&fiAge-o.age<n)s+='<circle cx="'+fx(fiAge-o.age).toFixed(1)+'" cy="'+ty.toFixed(1)+'" r="5.5" style="fill:var(--sx-pc)" stroke="#fff" stroke-width="2"/>';s+=node(n-1,4.5,'var(--sx-primary)');
  s+='<line id="rcur" x1="0" x2="0" y1="0" y2="'+H+'" style="stroke:var(--sx-muted)" opacity="0"/><rect x="0" y="0" width="'+W+'" height="'+H+'" fill="transparent" style="cursor:crosshair"/></svg><div class="tip"></div>';
  el.innerHTML=s;
  var svg=el.querySelector('svg'),tip=el.querySelector('.tip'),cur=el.querySelector('#rcur');
  function move(ev){var r=svg.getBoundingClientRect(),x=((ev.touches?ev.touches[0].clientX:ev.clientX)-r.left)*W/r.width,j=Math.max(0,Math.min(n-1,Math.round((x-P.l)/(W-P.l-P.r)*(n-1)))),p=pts[j];
    tip.innerHTML='<b>Âge '+p.age+'</b>'+M(p.v)+' en dollars d’aujourd’hui'+(p.age<o.ret?'<br>Épargne':'<br>Retraits');tip.style.left=(fx(j)*r.width/W)+'px';tip.style.top=(fy(p.v)*r.height/H)+'px';tip.style.opacity=1;cur.setAttribute('x1',fx(j));cur.setAttribute('x2',fx(j));cur.setAttribute('opacity',.4);}
  function out(){tip.style.opacity=0;cur.setAttribute('opacity',0);}
  svg.addEventListener('mousemove',move);svg.addEventListener('touchmove',move,{passive:true});svg.addEventListener('mouseleave',out);svg.addEventListener('touchend',out);
  var ages=[o.age,Math.round((o.age+o.ret)/2),o.ret,Math.round(o.ret+(END-o.ret)/3),Math.round(o.ret+2*(END-o.ret)/3),END],seen={};
  $('trajX').innerHTML=ages.filter(function(a){if(seen[a])return false;seen[a]=1;return true;}).map(function(a){var p=pts[a-o.age],t='Âge '+a+' ('+(a===o.ret?'Retraite ':'')+S(p.v)+')';return a===o.ret?'<b>'+t+'</b>':'<span>'+t+'</span>';}).join('');
}

function ledger(o,sim){
  var ys=sim.years,L=ys.length,rows='';
  ys.forEach(function(y,k){
    var mile=k===0||y.age===o.ret||(y.age<o.ret&&y.age%5===0)||(y.age>o.ret&&y.age%10===5)||k===L-1;
    var cls=[];if(y.age===o.ret)cls.push('hl');if(y.retired)cls.push('ret');if(y.retired&&y.end<=0.005&&y.out>0)cls.push('dep');if(!expanded&&!mile)cls.push('hid');
    var label='Âge '+y.age+(k===0?' (Current)':y.age===o.ret?' (Retirement)':'');
    rows+='<tr'+(cls.length?' class="'+cls.join(' ')+'"':'')+'><td class="ag"><i></i>'+label+'</td><td>'+M(y.start)+'</td>'+
      (y.retired?'<td class="mu">$0'+(y.age===o.ret?' (travail facultatif)':'')+'</td>'+(y.start<=0.005?'<td class="mu">Épuisé</td>':'<td>'+M(y.out)+' / yr</td>'):'<td class="in">+'+M(y.inflow)+' / yr</td><td class="mu">— (Accumulating)</td>')+
      '<td>'+(y.growth<0?'':'+')+M(y.growth)+' ('+((y.retired?o.post:o.pre)*100).toFixed(1)+'%)</td><td class="eb">'+M(y.end)+'</td></tr>';
  });
  $('ledgerBody').innerHTML=rows;
  C.text('expandTxt',expanded?'Afficher uniquement les jalons':'Tout développer '+L+' Années');$('expandBtn').setAttribute('aria-expanded',String(expanded));
}

function compute(){
  var o=inputs();
  $('swrCustomRow').hidden=o.mode!=='custom';
  var swrPct=(o.swr*100),swrLbl=(Math.round(swrPct*100)/100).toFixed(swrPct%1?2:1)+'%';
  C.text('swrTag',o.mode==='4'?'4,0 % Bengen classique':o.mode==='3.5'?'3,5 % haute sécurité':o.mode==='3.25'?'3,25 % perpétuel':swrLbl+' Personnalisé');
  C.text('spendMo',M(o.spend/12)+' / month');C.text('saveMo',M(o.save/12)+' / month');

  var fire=o.spend/o.swr,sim=simulate(o,false),fm=reachMonth(o,fire);
  C.text('resultValue',M(fire));
  C.text('fireSub','Capital requis pour financer un '+M(o.spend)+'/yr of inflation-adjusted income at a '+swrLbl+' taux de retrait (en dollars d’aujourd’hui).');
  var pb=$('projBox'),fiAge=null;
  if(fm===0){pb.classList.remove('warn');C.text('projDate','Atteint');C.text('projAge','Vous êtes déjà financièrement indépendant');fiAge=o.age;}
  else if(fm===null){pb.classList.add('warn');C.text('projDate','Pas d’ici '+END);C.text('projAge','Augmentez votre épargne ou réduisez vos dépenses');}
  else{var d=new Date();d.setMonth(d.getMonth()+fm);fiAge=o.age+Math.floor(fm/12);var diff=o.ret-(o.age+fm/12);
    C.text('projDate',MON[d.getMonth()]+' '+d.getFullYear());pb.classList.toggle('warn',diff<-0.5);
    C.html('projAge','Âge '+fiAge+' • <b>'+(Math.abs(diff)<0.5?'dans les temps':Math.round(Math.abs(diff))+' yrs '+(diff>0?'early':'late'))+'</b>');}
  var pct=fire>0?Math.min(100,o.nw/fire*100):100;
  C.text('fundedTxt',pct.toFixed(1)+'% financé ('+S(o.nw)+' of '+S(fire)+')');$('fundedBar').style.width=pct+'%';
  C.text('curTxt','Actuel : '+M(o.nw));C.text('remTxt','Restant : '+M(Math.max(0,fire-o.nw)));

  /* longevity of the actual plan (retire at target age) */
  var ok=sim.depleted===null,endReal=sim.real[sim.real.length-1].v;
  $('lgIcon').classList.toggle('warn',!ok);$('lgValue').classList.toggle('warn',!ok);$('lgBadge').classList.toggle('warn',!ok);
  if(ok){C.text('lgValue','Tient jusqu’à '+END+'+');C.text('lgBadge',endReal>=fire*0.5?'Ultra résilient':'Soutenable');
    C.text('lgText','Finance '+M(o.spend)+'/yr (inflation-adjusted) from age '+o.ret+' to '+END+' at '+(o.post*100).toFixed(1)+'% de rendement, laissant '+M(endReal)+' en dollars d’aujourd’hui.');}
  else{var da=Math.floor(sim.depleted);C.text('lgValue','Épuisé à '+da);C.text('lgBadge','Déficit');
    C.text('lgText','Des retraits de '+M(o.spend)+'/yr from age '+o.ret+' épuisent le portefeuille '+(END-da)+' ans avant '+END+'. Save more, retire later or lower spending.');}

  /* coast FIRE: amount needed today to grow into the FIRE number by the target age with no more saving */
  var realPre=(1+o.pre)/(1+o.inf)-1,coast=fire/Math.pow(1+realPre,o.ret-o.age);
  C.text('coastValue',M(coast));
  if(o.nw>=coast)C.text('coastTxt','Atteint à l’âge de '+o.age+' ✓');
  else{var cm=null,ip=mrate(o.pre),b=o.nw;for(var m=1;m<(o.ret-o.age)*12;m++){b+=b*ip+o.save/12;var need=fire*Math.pow(1+o.inf,o.ret-o.age)/Math.pow(1+o.pre,(o.ret-o.age)-m/12);if(b>=need){cm=m;break;}}
    C.text('coastTxt',cm===null?'Non atteint avant l’âge de '+o.ret:'Atteint à l’âge de '+(o.age+Math.floor(cm/12)));}

  C.text('chartSub','Phase d’accumulation ('+o.age+'-'+o.ret+') et phase de décumulation ('+o.ret+'-'+END+'), exprimées en dollars d’aujourd’hui');
  C.text('thrLegend','Seuil FIRE ('+S(fire)+')');
  chart(o,sim,fire,fiAge);

  /* milestones: first age each target is reached if you kept saving */
  var ms=[{k:'FIRE quart',t:fire*0.25,ic:'check_circle'},{k:'Lean FIRE (⅔ des dépenses)',t:fire*2/3,ic:'calendar_today'},{k:'FIRE complet',t:fire,ic:'flag',on:true},{k:'Fat FIRE ('+S(o.spend*1.5)+'/yr)',t:fire*1.5,ic:'schedule'}];
  $('miles').innerHTML=ms.map(function(x){var r=reachMonth(o,x.t),a=r===null?null:o.age+Math.floor(r/12);
    var when=r===0?'Atteint':a===null?'Pas d’ici '+END:(x.on?'Cible : âge ':'Âge ')+a;
    return '<div class="sx-card'+(x.on?' on':'')+'"><span class="k">'+C.esc(x.k)+(x.on?'<i></i>':'')+'</span><span class="v">'+S(x.t)+'</span><span class="s'+(a===null&&r!==0?' mu':'')+'"><span class="msym" aria-hidden="true">'+(r===0?'check_circle':x.ic)+'</span>'+when+'</span></div>';}).join('');

  ledger(o,sim);
  C.html('fxExample','At '+swrLbl+' Taux de retrait : '+M(o.spend)+' / '+(o.swr).toFixed(4).replace(/0+$/,'')+' = <strong>'+M(fire)+'</strong> (la règle des '+(Math.round(1/o.swr*10)/10)+'x les dépenses annuelles)');
  C.text('assumeTxt','Rendements déterministes supposés : '+(o.pre*100).toFixed(1)+'% avant la retraite, '+(o.post*100).toFixed(1)+'% après, '+(o.inf*100).toFixed(1)+'% d’inflation.');
  last={o:o,sim:sim,fire:fire,fiAge:fiAge};
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'retCalc',compute:compute});
  $('expandBtn').addEventListener('click',function(){expanded=!expanded;if(last)ledger(last.o,last.sim);});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('retirement-cashflow.csv',[{h:'Âge',key:'age'},{h:'Solde de début',key:'start'},{h:'Épargne',key:'inflow'},{h:'Retrait',key:'out'},{h:'Croissance des investissements',key:'growth'},{h:'Solde final',key:'end'}],last.sim.years);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(last)chart(last.o,last.sim,last.fire,last.fiAge);},120);});
});
window.cpRetire={simulate:simulate,reachMonth:reachMonth};
})();
