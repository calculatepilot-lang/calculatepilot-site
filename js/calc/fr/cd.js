/* CD calculator — CalculatePilot (Stitch 1:1 redesign).
   Value after t months = deposit × (1 + APY)^(t/12). Equivalent APR = n × ((1 + APY)^(1/n) − 1).
   Early withdrawal penalty = deposit × APR × days ÷ 365 (simple interest), applied when broken at 6 months (or half the term).
   Ladder: deposit split into five 1–5 year CDs at the APYs entered. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['janv.','févr.','mars','avr.','Mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

function M(x,dp){dp=dp===undefined?2:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function dt(m,day){var d=new Date();d.setMonth(d.getMonth()+m);return MON[d.getMonth()]+(day?' '+d.getDate()+',':'')+' '+d.getFullYear();}

function inputs(){return {D:Math.max(0,v('dep')),t:Math.max(1,v('term')),apy:Math.max(0,v('apy'))/100,n:Math.max(1,v('cmp')),pen:Math.max(0,v('pen')),hy:Math.max(0,v('hysa'))/100,l:[1,2,3,4,5].map(function(k){return Math.max(0,v('l'+k))/100;})};}

function compute(){
  var o=inputs(),V=function(m){return o.D*Math.pow(1+o.apy,m/12);},fv=V(o.t),int=fv-o.D,apr=o.n*(Math.pow(1+o.apy,1/o.n)-1),ty=o.t/12;last={o:o};
  C.text('tOut',o.t+' Mois ('+ty.toFixed(1)+' Yr)');C.text('tPill',o.t+' mois de durée');
  C.text('resultValue',M(fv));C.text('intHero','+'+M(int)+' Intérêts garantis');C.text('prin',M(o.D));C.text('int','+'+M(int));
  C.text('intN',(int/o.D*100||0).toFixed(2)+'% de rendement total sur '+o.t+' months');C.text('mo',M(int/o.t)+' / mo');
  var bm=Math.min(6,o.t/2),pen=o.D*apr*o.pen/365,nb=V(bm)-pen;
  C.text('penL','Net en cas de rupture à '+(Math.round(bm*10)/10)+' Mo');C.text('penV',M(nb));
  $('penN').textContent=o.pen?((nb-o.D>=0?'+':'−')+M(Math.abs(nb-o.D))+(nb>=o.D?' de bénéfice net':' de perte en capital')+' après une '+o.pen+' jours d’intérêts de pénalité'):'CD sans pénalité : tous les intérêts courus sont conservés';
  $('tl').innerHTML='<div>Date d’émission<b>'+dt(0,true)+'</b><span>'+M(o.D,0)+' Dépôt</span></div><div>Mi-parcours ('+(Math.round(o.t/2*10)/10)+'  mois)<b>'+dt(Math.round(o.t/2),true)+'</b><span>'+M(V(o.t/2))+' courus</span></div><div>Date d’échéance<b>'+dt(o.t,true)+'</b><span>'+M(fv)+' à échéance</span></div>';
  C.text('vsL',o.t+' mois de protection du taux');C.text('vsCdL',o.t+' mois de CD bloqué');C.text('vsCd',(o.apy*100).toFixed(2)+'% de TAEA');C.text('vsCdR','+'+M(int,0)+' return');
  var hy=o.D*(Math.pow(1+o.hy,ty)-1);C.text('vsHy',(o.hy*100).toFixed(2)+'% est.');C.text('vsHyR','~'+M(hy,0)+' si le taux était maintenu');

  var a=o.D/5,tot=0;C.text('ldLead','Partagé en '+M(o.D,0)+' répartis sur cinq CD échelonnés afin qu’un arrive à échéance chaque année, ce qui garde une partie des liquidités accessible pendant que le reste rapporte des taux à plus long terme.');
  document.querySelectorAll('#tr>div').forEach(function(el,k){var gi=a*(Math.pow(1+o.l[k],k+1)-1);tot+=gi;el.querySelector('.amt').textContent=M(a);el.querySelector('.gi').textContent='+'+M(gi);});
  C.text('blend',(o.l.reduce(function(s,x){return s+x;},0)/5*100).toFixed(2)+'%');
  $('ldTbl').innerHTML=o.l.map(function(r,k){var gi=a*(Math.pow(1+r,k+1)-1),end=k===4;
    return '<tr'+(end?' class="act"':'')+'><td>Année '+(k+1)+' Fin'+(end?' (échelle complète)':'')+'</td><td>'+dt(12*(k+1))+'</td><td>Tranche '+(k+1)+' ('+(k+1)+' ans)</td><td class="g">+'+M(gi)+'</td><td style="color:var(--sx-muted)">'+(end?'Les cinq tranches sont désormais placées en CD à 5 ans, avec une échéance chaque année':'Réinvestir dans un nouveau CD à 5 ans au taux en vigueur à 5 ans')+'</td><td class="b">'+M(a+gi)+'</td></tr>';}).join('');

  var nm={365:'daily',12:'monthly',4:'quarterly',2:'semi-annual',1:'annual'}[o.n];
  C.text('aprTxt','Votre '+(o.apy*100).toFixed(2)+'% de TAEA équivaut à un '+(apr*100).toFixed(3)+'% de TAEG avec '+nm+' capitalisation. Pour comparer des CD, comparez les TAEA — ils incluent déjà la capitalisation.');
  var rem=o.t-bm,need=rem>0&&o.D>0?pen/(o.D*rem/12)*100:0;
  $('penRows').innerHTML='<li>Coût de la pénalité ('+o.pen+' jours à '+(apr*100).toFixed(2)+'% de TAEG)<b style="color:var(--sx-err)">'+(pen?'−':'')+M(pen)+'</b></li><li>Rendement supplémentaire nécessaire pour compenser sur les '+(Math.round(rem*10)/10)+' mois restants<b style="color:var(--sx-pc)">'+(o.pen?'+'+need.toFixed(2)+'% de TAEA':'Aucun')+'</b></li>';
  C.text('penTxt',o.pen?'Si un nouveau CD pour la durée restante rapporte au moins '+need.toFixed(2)+' points de pourcentage de plus que votre TAEA actuel, rompre le contrat avant l’échéance et réinvestir revient à peu près à l’équilibre ; au-delà, vous y gagnez.':'Un CD sans pénalité permet de passer à un taux plus élevé à tout moment sans perdre d’intérêts.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'cdCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var o=last.o,rows=[];for(var m=0;m<=o.t;m++)rows.push({m:m,v:Math.round(o.D*Math.pow(1+o.apy,m/12)*100)/100});C.csv('cd-ledger.csv',[{h:'Mois',key:'m'},{h:'Valeur',key:'v'}],rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCD={};
})();
