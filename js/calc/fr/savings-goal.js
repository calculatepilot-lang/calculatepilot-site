/* Savings goal calculator — CalculatePilot (Stitch 1:1 redesign).
   Monthly rate r = (1 + APY)^(1/12) − 1. Fixed timeframe: P = (Goal − S(1+r)^n) ÷ [((1+r)^n − 1)/r × (1+r if deposits at start)].
   Fixed budget: months until the balance reaches the goal (up to 50 years). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['janv.','févr.','mars','avr.','Mai','juin','juil.','août','sept.','oct.','nov.','déc.'],FULL=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function K(x){return x>=1000?'$'+(Math.round(x/100)/10)+'k':M(x);}
function r50(x){return Math.max(50,Math.round(x/50)*50);}
function dt(m,full){var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+m);return (full?FULL:MON)[d.getMonth()]+' '+d.getFullYear();}

function inputs(){return {G:Math.max(0,v('goal')),S:Math.max(0,v('start')),mode:$('mode').value,n:Math.max(1,Math.round(v('mon'))),bud:Math.max(0,v('bud')),apy:Math.max(0,v('apy')),due:$('due').value==='1'};}
function rate(o){return Math.pow(1+o.apy/100,1/12)-1;}
function need(o,r,n,due){var g=Math.pow(1+r,n),A=r?(g-1)/r:n;if(due)A*=(1+r);return Math.max(0,(o.G-o.S*g)/A);}
/* simulate: stop at n months, or when the goal is reached if n is null */
function sim(o,r,P,n,due){var b=o.S,ci=0,rows=[{m:0,dep:0,int:0,ci:0,bal:b}],m=0,max=n||600;
  while(m<max){if(!n&&b>=o.G-0.005)break;m++;if(due)b+=P;var it=b*r;b+=it;if(!due)b+=P;ci+=it;rows.push({m:m,dep:P,int:it,ci:ci,bal:b});}
  return {rows:rows,n:m,bal:b,ci:ci,reached:b>=o.G-0.005};}

function compute(){
  var o=inputs(),r=rate(o),time=o.mode==='time',P,s;
  $('timeRow').hidden=!time;$('budRow').hidden=time;
  C.text('mT','Durée fixe ('+(Math.round(o.n/12*10)/10)+' années)');C.text('mB','Budget mensuel fixe ('+M(o.bud)+')');
  C.text('monOut',o.n+' Mois ('+(o.n/12).toFixed(1)+' ans)');C.text('ctaTxt',time?'Calculer l\'épargne mensuelle requise':'Calculer le temps nécessaire');
  document.querySelectorAll('#goalChips button').forEach(function(b){var g=b.getAttribute('data-g');b.setAttribute('aria-pressed',String(g==='custom'?[60000,15000,30000,25000].indexOf(o.G)<0:+g===o.G));});
  if(time){P=need(o,r,o.n,o.due);s=sim(o,r,P,o.n,o.due);}else{P=o.bud;s=sim(o,r,P,null,o.due);}
  last={o:o,r:r,P:P,s:s};
  var ok=s.reached||o.S>=o.G,hit=$('hit');
  if(time){C.text('heroK','Épargne mensuelle requise');C.text('resultValue',M(P,2));C.text('heroU','/ month');
    C.text('heroNote','At '+o.apy.toFixed(2)+'% de rendement annuel effectif avec des dépôts en '+(o.due?'start':'end')+'de mois, épargner ce montant chaque mois atteint votre '+M(o.G)+' objectif en exactement '+o.n+' mois.');
    hit.textContent='Objectif atteint en '+o.n+' mois ('+dt(o.n)+')';hit.className='sx-ef-grade';}
  else if(!ok){C.text('heroK','Temps pour atteindre votre objectif');C.text('resultValue','Pas dans les 50 ans');C.text('heroU','');C.text('heroNote','At '+M(P)+'/month and '+o.apy.toFixed(2)+'% de rendement annuel effectif, vous n’atteindriez pas '+M(o.G)+' en 50 ans. Augmentez votre versement ou ajustez l’objectif.');hit.textContent='Objectif inatteignable';hit.className='sx-ef-grade hi';}
  else{C.text('heroK','Temps pour atteindre votre objectif');C.text('resultValue',s.n+' Mois');C.text('heroU','('+(s.n/12).toFixed(1)+' ans)');
    C.text('heroNote','Épargner '+M(P)+' par mois à '+o.apy.toFixed(2)+'% de rendement annuel effectif atteint votre '+M(o.G)+' objectif d’ici '+dt(s.n,true)+'.');hit.textContent='Objectif atteint en '+s.n+' mois ('+dt(s.n)+')';hit.className='sx-ef-grade';}
  var deps=P*s.n,fin=time?o.G:s.bal,it=s.ci;
  C.text('need',M(Math.max(0,o.G-o.S)));C.text('needN',K(o.G)+' cible − '+K(o.S)+' base');
  C.text('dep',M(deps));C.text('depN',s.n+' versements mensuels');C.text('int','+'+M(it));C.text('intN',o.apy.toFixed(2)+'% de capitalisation du rendement annuel effectif');
  C.text('cush',(o.G>0?it/o.G*100:0).toFixed(1)+'%');
  C.text('goalLbl',M(o.G)+' Objectif');var tot=o.S+deps+it||1,parts=[[o.S,'var(--sx-secondary)','Fonds actuels',M(o.S)+' capital initial'],[deps,'var(--sx-primary)','Épargne mensuelle',M(deps)+' ('+M(P,2)+'/mo)'],[it,'var(--sx-fdim)','Rendement des intérêts','+'+M(it)+' bonus de capitalisation']];
  $('cBar').innerHTML=parts.map(function(p){return '<span style="width:'+(p[0]/tot*100)+'%;background:'+p[1]+'"></span>';}).join('');
  $('cLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[1]+'"></i><span>'+Math.round(p[0]/tot*100)+'% '+p[2]+'<small>'+p[3]+'</small></span></span>';}).join('');

  var hi=r50(P*1.27),lo=r50(P*0.76),base=time?o.n:s.n,sh=sim(o,r,hi,null,o.due),sl=sim(o,r,lo,null,o.due);
  function card(t,p,x,fast){var d=x.n-base,ok=x.reached;return '<div><div class="k">'+t+'<em class="'+(fast?'':'slow')+'">'+(ok?(d<=0?d:'+'+d)+' Mois':'—')+'</em></div><b>'+M(p)+' <small>/ mois</small></b><p>'+(ok?'Atteint '+M(o.G)+' en <b>'+x.n+' mois</b> ('+dt(x.n)+').'+(fast?' Vous terminez '+Math.abs(d)+' mois plus tôt.':' Réduit votre engagement mensuel de '+M(Math.abs(P-p))+'.'):'N’atteint pas l’objectif en 50 ans.')+'</p><div class="f"><span class="msym" aria-hidden="true">'+(fast?'bolt':'timelapse')+'</span>Intérêts gagnés : +'+M(x.ci)+'</div></div>';}
  $('pace').innerHTML=card('Rythme soutenu',hi,sh,true)+card('Rythme détendu',lo,sl,false);
  C.text('bwTxt','Équivalent toutes les deux semaines : '+M(P*12/26,2)+' toutes les deux semaines (26 dépôts par an).');
  var alt=time?need(o,r,o.n,!o.due):null;
  C.text('dueTake',time?'Avec vos données : déposer au début de chaque mois nécessite '+M(Math.min(P,alt),2)+'/mo versus '+M(Math.max(P,alt),2)+'/mo at month end.':'Astuce : passez en mode Durée fixe pour voir combien le moment du dépôt modifie le montant mensuel.');

  C.text('allBtn','Vue mensuelle ('+s.n+')');
  var view=$('view').value,keys=[0,6,12,24,36,48,60,84,120].filter(function(m){return m<s.n;});keys.push(s.n);
  var rows=view==='all'?s.rows:s.rows.filter(function(x){return keys.indexOf(x.m)>=0;});
  $('tbl').innerHTML=rows.map(function(x){var p=o.G>0?Math.min(100,x.bal/o.G*100):0,end=x.m===s.n&&ok,st=x.m===0?'<span class="sx-sg-st">Référence</span>':end?'<span class="sx-sg-st done">✓ Objectif atteint</span>':p>=75?'<span class="sx-sg-st ok">Quartile supérieur</span>':p>=50?'<span class="sx-sg-st ok">Jalon à mi-parcours</span>':'<span class="sx-sg-st ok">Dans les temps</span>';
    return '<tr'+(end?' class="tg"':'')+'><td>'+(x.m===0?'Solde initial':'Mois '+x.m+' ('+dt(x.m)+')')+'</td><td class="mu">'+M(x.dep,2)+'</td><td class="g">+'+M(x.int,2)+'</td><td class="g">+'+M(x.ci,2)+'</td><td class="b">'+M(x.bal,2)+'</td><td>'+p.toFixed(1)+'%</td><td>'+st+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sgCalc',compute:compute});
  $('goalChips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var g=b.getAttribute('data-g');if(g==='custom'){$('goal').focus();$('goal').select();return;}$('goal').value=g;$('goal').dispatchEvent(new Event('input',{bubbles:true}));});
  $('bwBtn').addEventListener('click',function(){$('bwTxt').hidden=!$('bwTxt').hidden;});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('savings-goal-roadmap.csv',[{h:'Mois',key:'m'},{h:'Dépôt',key:'dep'},{h:'Intérêts',key:'int'},{h:'Intérêts cumulés',key:'ci'},{h:'Solde',key:'bal'}],last.s.rows.map(function(x){return {m:x.m,dep:Math.round(x.dep*100)/100,int:Math.round(x.int*100)/100,ci:Math.round(x.ci*100)/100,bal:Math.round(x.bal*100)/100};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSavingsGoal={need:need,sim:sim};
})();
