/* Debt payoff (snowball vs avalanche) — CalculatePilot (Stitch 1:1 redesign).
   Monthly simulation: interest on every debt, minimums on all, extra + freed minimums roll into the
   current target (highest APR for avalanche, smallest balance for snowball). Total outlay stays constant. */
(function(){
var C=window.CPX,$=C.$,v=C.val,MAXM=600;
var MON=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
var COLORS=['#f87171','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#64748b'];
var TINTS=[['#fef2f2','#ba1a1a'],['#eff6ff','#1d4ed8'],['#ecfdf5','#065F46'],['#fffbeb','#b45309'],['#f5f3ff','#6d28d9'],['#fdf2f8','#be185d'],['#f0fdfa','#0f766e'],['#f1f5f9','#475569']];
var DEFAULTS=[{name:'Carte de crédit A',bal:6500,apr:22.4,min:160},{name:'Prêt auto',bal:14000,apr:6.2,min:320},{name:'Prêt personnel',bal:4800,apr:11.5,min:135}];
var debts=[],uid=0,last=null;

function M(x,dp){dp=dp||0;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function icon(n){n=n.toLowerCase();return /card|visa|amex|master/.test(n)?'credit_card':/car|auto|vehicle/.test(n)?'directions_car':/student|school|college/.test(n)?'school':/mortgage|home|house/.test(n)?'home':/medical|hospital/.test(n)?'medical_services':'receipt_long';}
function add(d){debts.push({id:++uid,name:d.name,bal:d.bal,apr:d.apr,min:d.min,c:(uid-1)%COLORS.length});}
function esc(s){return C.esc(s);}

function order(list,strategy){
  return list.slice().sort(strategy==='snowball'?function(a,b){return a.bal-b.bal||b.apr-a.apr;}:function(a,b){return b.apr-a.apr||a.bal-b.bal;});
}
/* returns months, interest, per-debt payoff month, phases and a balance snapshot per month */
function simulate(list,extra,strategy){
  var ds=order(list.filter(function(d){return d.bal>0;}),strategy).map(function(d){return {id:d.id,name:d.name,bal:d.bal,apr:d.apr,min:d.min,paidAt:null};});
  var budget=ds.reduce(function(s,d){return s+d.min;},0)+extra,interest=0,paid=0,m=0,snaps=[ds.map(function(d){return d.bal;})],phases=[];
  if(!ds.length)return {months:0,interest:0,paid:0,order:[],snaps:snaps,phases:[],stuck:false,budget:budget};
  var phaseStart=1,phaseTarget=null,phasePay=0;
  while(m<MAXM&&ds.some(function(d){return d.bal>0.005;})){
    m++;
    ds.forEach(function(d){if(d.bal>0.005){var i=d.bal*d.apr/100/12;d.bal+=i;interest+=i;}});
    var left=budget,target=null;
    ds.forEach(function(d){if(d.bal>0.005){var p=Math.min(d.min,d.bal);d.bal-=p;left-=p;paid+=p;}});
    for(var k=0;k<ds.length&&left>0.005;k++){var d=ds[k];if(d.bal>0.005){if(!target)target=d;var p=Math.min(left,d.bal);d.bal-=p;left-=p;paid+=p;}}
    if(!phaseTarget&&target){phaseTarget=target;phasePay=Math.min(budget,target.min+(budget-ds.reduce(function(s,x){return s+(x!==target&&x.bal>0.005?x.min:0);},0)-target.min));}
    ds.forEach(function(d){if(d.bal<=0.005&&d.paidAt===null){d.bal=0;d.paidAt=m;}});
    if(phaseTarget&&phaseTarget.paidAt!==null){
      var others=ds.filter(function(x){return x!==phaseTarget&&(x.paidAt===null||x.paidAt>=phaseStart);});
      phases.push({target:phaseTarget.name,from:phaseStart,to:m,pay:phasePay,others:others.map(function(x){return x.name;}),last:ds.every(function(x){return x.paidAt!==null;})});
      phaseStart=m+1;phaseTarget=null;
    }
    snaps.push(ds.map(function(d){return d.bal;}));
  }
  var stuck=ds.some(function(d){return d.bal>0.005;});
  return {months:m,interest:interest,paid:paid,order:ds,snaps:snaps,phases:phases,stuck:stuck,budget:budget};
}

function ym(months){var y=Math.floor(months/12),r=months%12;return (y?y+(y===1?' Année':' Années'):'')+(y&&r?', ':'')+(r||!y?r+(r===1?' Mois':' Mois'):'');}
function dateAfter(months){var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+months);return MON[d.getMonth()]+' '+d.getFullYear();}

function renderDebts(){
  var ranks={};order(debts,$('strategy').value).forEach(function(d,i){ranks[d.id]=i+1;});
  var snow={};order(debts,'snowball').forEach(function(d,i){snow[d.id]=i+1;});
  var strat=$('strategy').value==='snowball'?'Boule de neige':'Avalanche';
  $('debts').innerHTML=debts.map(function(d){var t=TINTS[d.c%TINTS.length],r=ranks[d.id];
    var sub=r===1?'Priorité n° 1 dans '+strat+(strat==='Avalanche'?' (TAEG élevé)':' ('+M(d.bal)+' Solde le plus bas)'):'Priorité n°'+r+' in '+strat;
    return '<div class="sx-card sx-debt" data-id="'+d.id+'"><div class="dh"><div><span class="dic" style="background:'+t[0]+';color:'+t[1]+'"><span class="msym" aria-hidden="true">'+icon(d.name)+'</span></span><div style="min-width:0;flex:1"><input class="nm" data-k="name" value="'+esc(d.name)+'" aria-label="Debt name"><span class="pr'+(r===1?(strat==='Avalanche'?' hi':' lo'):'')+'" data-pr="'+d.id+'">'+esc(sub)+'</span></div></div>'+
      '<button type="button" class="del" data-del="'+d.id+'" title="Delete debt" aria-label="Delete '+esc(d.name)+'"><span class="msym" aria-hidden="true">delete</span></button></div>'+
      '<div class="g3"><div><label>Solde restant dû</label><div class="sx-df"><span class="pre">$</span><input type="number" inputmode="decimal" min="0" step="100" data-k="bal" value="'+d.bal+'" aria-label="'+esc(d.name)+' balance"></div></div>'+
      '<div><label>Taux d’intérêt (TAEG)</label><div class="sx-df pc"><input type="number" inputmode="decimal" min="0" max="100" step="0.1" data-k="apr" value="'+d.apr+'" aria-label="'+esc(d.name)+' APR"><span class="suf">%</span></div></div>'+
      '<div><label>Paiement minimum</label><div class="sx-df"><span class="pre">$</span><input type="number" inputmode="decimal" min="0" step="5" data-k="min" value="'+d.min+'" aria-label="'+esc(d.name)+' minimum payment"></div></div></div><p class="warn" data-warn="'+d.id+'" hidden></p></div>';}).join('');
}
function refreshLabels(){
  var ranks={};order(debts,$('strategy').value).forEach(function(d,i){ranks[d.id]=i+1;});
  var strat=$('strategy').value==='snowball'?'Boule de neige':'Avalanche';
  debts.forEach(function(d){var el=document.querySelector('[data-pr="'+d.id+'"]');if(!el)return;var r=ranks[d.id];
    el.textContent=r===1?'Priorité n° 1 dans '+strat+(strat==='Avalanche'?' (TAEG élevé)':' ('+M(d.bal)+' Solde le plus bas)'):'Priorité n°'+r+' in '+strat;
    el.className='pr'+(r===1?(strat==='Avalanche'?' hi':' lo'):'');
    var w=document.querySelector('[data-warn="'+d.id+'"]'),int=d.bal*d.apr/1200;
    if(d.bal>0&&d.min<=int){w.hidden=false;w.textContent='Le minimum ('+M(d.min)+') ne couvre pas les '+M(int)+' intérêts mensuels — cette dette ne diminue que lorsque des paiements supplémentaires l’atteignent.';}else w.hidden=true;});
}

function compute(){
  var extra=Math.max(0,v('extra')),strat=$('strategy').value,sname=strat==='snowball'?'Boule de neige':'Avalanche';
  refreshLabels();
  var totMin=debts.reduce(function(s,d){return s+d.min;},0),principal=debts.reduce(function(s,d){return s+Math.max(0,d.bal);},0);
  C.text('debtCount',debts.length+(debts.length===1?' Responsabilité':' Passifs'));C.text('totalMin',M(totMin)+' / mo');
  var sel=simulate(debts,extra,strat),alt=simulate(debts,extra,strat==='snowball'?'avalanche':'snowball'),mins=simulate(debts,0,'avalanche');
  var hero=$('heroCard');hero.classList.toggle('bad',sel.stuck);
  if(!debts.length||principal<=0){C.text('resultValue','Aucune dette');C.text('durTxt','Ajoutez une dette pour construire votre plan');}
  else if(sel.stuck){C.text('resultValue','Pas dans les 50 ans');C.text('durTxt','Les paiements ne dépassent pas les intérêts — augmentez le montant supplémentaire ou les minimums');}
  else{C.text('resultValue',dateAfter(sel.months));C.text('durTxt','('+ym(sel.months)+' / '+sel.months+' Nombre total de mois de remboursement)');}
  C.text('totPrin',M(principal));C.text('totInt',M(sel.interest));

  var av=strat==='avalanche'?sel:alt,sb=strat==='snowball'?sel:alt,best=av.interest<=sb.interest+0.5?'avalanche':'snowball';
  function card(key,s,title,icn){var on=key===strat,diff=s.interest-sel.interest;
    var tag=key===best&&!on?'<span class="tag">Intérêts les plus bas</span>':on?(key===best?'<span class="tag best">Économies optimales</span>':'<span class="tag best">Actif</span>'):'<span class="tag">'+(diff>=0?'+':'−')+M(Math.abs(diff))+' Intérêts</span>';
    return '<button type="button" class="sx-scn'+(on?' on':'')+'" data-for="strategy" data-value="'+key+'"><span class="top"><span><span class="msym" aria-hidden="true">'+icn+'</span>'+title+'</span>'+tag+'</span><span class="g3"><span><span>Durée</span><b>'+(s.stuck?'50+ ans':s.months+' Mois')+'</b></span><span><span>Total des intérêts</span><b>'+M(s.interest)+'</b></span><span><span>Total remboursé</span><b>'+M(s.paid)+'</b></span></span></button>';}
  var lost=mins.interest-sel.interest;
  $('scenarios').innerHTML='<div style="display:flex;flex-direction:column;gap:14px">'+card('avalanche',av,'Stratégie Avalanche',strat==='avalanche'?'verified':'trending_down')+card('snowball',sb,'Stratégie Boule de neige',strat==='snowball'?'verified':'psychology')+
    '<div class="sx-scn min"><span class="top"><span><span class="msym" aria-hidden="true">warning</span>Minimums uniquement ('+M(totMin)+'/mo)</span><span class="tag lost">'+(lost>0.5?'+'+M(lost)+' Perdu':'Sans supplément')+'</span></span><span class="g3"><span><span>Durée</span><b>'+(mins.stuck?'50+ ans':mins.months+' Mois')+'</b></span><span><span>Total des intérêts</span><b class="er">'+M(mins.interest)+'</b></span><span><span>Total remboursé</span><b>'+M(mins.paid)+'</b></span></span></div></div>';
  var yrs=(mins.months-sel.months)/12;
  $('saveBox').hidden=!(extra>0&&!sel.stuck);
  C.html('saveTxt',mins.stuck?'En ajoutant <strong>'+M(extra)+'/mo</strong>, you turn a debt that would never clear into one paid off in <strong>'+ym(sel.months)+'</strong>!':'En ajoutant <strong>'+M(extra)+'/mo</strong>, you save <strong>'+M(lost)+'</strong> d’intérêts et gagnez <strong>'+(yrs>=1?yrs.toFixed(1)+' years':Math.round(mins.months-sel.months)+' months')+'</strong> sur votre dette !');

  /* paydown bars: today, each payoff event, debt free */
  var total=principal||1,ord=sel.order,colorOf={};debts.forEach(function(d){colorOf[d.id]=COLORS[d.c%COLORS.length];});
  function bar(m){var s=sel.snaps[Math.min(m,sel.snaps.length-1)];return '<div class="b">'+ord.map(function(d,i){return s[i]>0.005?'<span style="width:'+(s[i]/total*100)+'%;background:'+colorOf[d.id]+'" title="'+esc(d.name)+': '+M(s[i])+'"></span>':'';}).join('')+'</div>';}
  var ev=ord.filter(function(d){return d.paidAt!==null;}).sort(function(a,b){return a.paidAt-b.paidAt;}),h='<div><div class="r"><span>Aujourd’hui ('+M(principal)+')</span><span>Mois 0</span></div>'+bar(0)+'</div>';
  ev.forEach(function(d,i){if(i===ev.length-1&&!sel.stuck)return;h+='<div><div class="r ev"><span>'+esc(d.name)+' Éliminée</span><span>Mois '+d.paidAt+'</span></div>'+bar(d.paidAt)+'</div>';});
  if(!sel.stuck&&sel.months)h+='<div><div class="r fin"><span>100 % sans dette</span><span>Mois '+sel.months+'</span></div><div class="b z">SOLDE NUL</div></div>';
  $('bars').innerHTML=h;
  $('legend').innerHTML=order(debts,'avalanche').map(function(d){return '<span><i style="background:'+colorOf[d.id]+'"></i>'+esc(d.name)+' ('+d.apr+'%)</span>';}).join('');

  /* rollout cascade */
  C.text('cascSub','Affectation séquentielle étape par étape selon le '+sname+' modèle');C.text('cashflow',M(sel.budget,2));
  $('phases').innerHTML=sel.phases.map(function(p,i){var others=p.others.filter(function(n){return n!==p.target;});
    var desc=i===0?(others.length?'Payez les minimums sur '+others.join(' & ')+'. Focus all '+M(extra)+' excédent sur '+p.target+'.':'Mettez tout sur '+p.target+'.'):'Reportez les paiements libérés de '+sel.phases[i-1].target+' into '+p.target+(p.last?' — toute la capacité de remboursement mensuelle ('+M(sel.budget)+').':'.');
    return '<div class="sx-phase"><div><div class="t"><span class="tg">Phase '+(i+1)+'</span><span class="mo">Mois '+p.from+' – '+p.to+'</span></div><h4>Cible : '+esc(p.target)+'</h4><p>'+esc(desc)+'</p></div><div class="ft"><div><span>Paiement mensuel cible :</span><b>'+M(p.pay)+' / mo</b></div><div><span>Status at Month '+p.to+':</span><b class="ok">'+(p.last?'100 % SANS DETTE':'ENTIÈREMENT REMBOURSÉ')+'</b></div></div></div>';}).join('')||'<p class="sx-sm sx-muted" style="margin:0">Ajoutez des dettes avec leurs soldes pour voir les phases de remboursement.</p>';

  var top=order(debts,'avalanche')[0];
  if(top)C.html('mechTxt','La <strong>méthode Avalanche</strong> est mathématiquement optimale, car chaque dollar supplémentaire va au solde portant le taux le plus élevé, ce qui minimise le total des intérêts courus sur l’ensemble de vos dettes. Chaque dollar affecté à votre '+esc(top.apr+'%')+' APR '+esc(top.name)+' rapporte un rendement garanti de '+esc(top.apr+'%')+'.');
  last={sel:sel};
}

document.addEventListener('DOMContentLoaded',function(){
  DEFAULTS.forEach(add);renderDebts();
  var list=$('debts');
  list.addEventListener('input',function(e){var t=e.target,card=t.closest('[data-id]');if(!card)return;var d=debts.filter(function(x){return x.id===+card.getAttribute('data-id');})[0],k=t.getAttribute('data-k');if(!d||!k)return;
    if(k==='name'){d.name=t.value||'Dette';var ic=card.querySelector('.dic .msym');if(ic)ic.textContent=icon(d.name);}else d[k]=Math.max(0,parseFloat(t.value)||0);});
  list.addEventListener('click',function(e){var b=e.target.closest('[data-del]');if(!b)return;debts=debts.filter(function(x){return x.id!==+b.getAttribute('data-del');});renderDebts();compute();});
  $('addDebt').addEventListener('click',function(){add({name:'Dette '+(debts.length+1),bal:2500,apr:18,min:75});renderDebts();compute();var inp=list.querySelector('.sx-debt:last-child .nm');if(inp){inp.focus();inp.select();}});
  C.init({root:'debtCalc',compute:compute});
});
window.cpDebt={simulate:simulate};
})();
