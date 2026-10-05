/* CD vs HYSA calculator — CalculatePilot (Stitch 1:1 redesign).
   CD: balance_m = P × (1 + cdAPY)^(m/12). HYSA: APY_m = max(0, start − cut × (m−1)/12), balance grows by (1 + APY_m)^(1/12) each month.
   Early withdrawal penalty = P × cdAPY × days/365 (simple interest). CD "if broken" = CD balance − penalty.
   Monthly deposits go to savings in both strategies, so the comparison uses the initial deposit; totals add the deposits' HYSA growth. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function P(x){return isFinite(x)?x.toFixed(2)+'%':'—';}

function compute(){
  var p=Math.max(0,v('p')),T=Math.max(1,Math.round(v('t'))),cd=Math.max(0,v('cd'))/100,hy=Math.max(0,v('hy'))/100,cut=Math.max(0,+$('path').value)/100,mc=Math.max(0,v('mc')),days=+$('pen').value;
  var pen=p*cd*days/365,rows=[],hb=p,cb2=0,apySum=0,be=null;
  for(var m=1;m<=T;m++){var a=Math.max(0,hy-cut*(m-1)/12);apySum+=a;hb*=Math.pow(1+a,1/12);cb2=cb2*Math.pow(1+a,1/12)+mc;
    var cb=p*Math.pow(1+cd,m/12),brk=m<T?cb-pen:cb;rows.push({m:m,cb:cb,a:a,hb:hb,adv:cb-hb,brk:brk});if(be===null&&m<T&&brk>=hb)be=m;}
  var L=rows[T-1],adv=L.cb-L.hb,cdWins=adv>=0,avg=apySum/T;
  C.text('tOut',T+' Mois');C.text('durT',T+' months');C.text('resultValue',(cdWins?'CD +':'Compte d’épargne +')+M(Math.abs(adv)));
  C.text('verdN',cdWins?'Le '+P(cd*100)+' Le CD rapporte '+M(adv)+' de plus que l’épargne sur '+T+' mois avec cette trajectoire de taux — si vous le conservez jusqu’à l’échéance.':'L’épargne rapporte '+M(-adv)+' de plus que le CD avec cette trajectoire de taux, avec un accès immédiat à votre argent.');
  C.text('rib1',cdWins?'Rendement supérieur':'Taux bloqué');C.text('cdH',T+' mois de CD à taux fixe');C.text('cdB',M(L.cb));C.text('cdI','+'+M(L.cb-p)+' intérêts · '+P(cd*100)+' locked');C.text('cdL','Bloqué ('+days+' jours de pénalité)');
  C.text('hyB',M(L.hb));C.text('hyI','+'+M(L.hb-p)+' intérêts · '+P(hy*100)+' → '+P(L.a*100));C.text('hyA','~'+P(avg*100));
  if(mc>0){C.text('verdN',$('verdN').textContent+' Votre '+M(mc)+' les dépôts mensuels ajoutent '+M(cb2)+' d’épargne dans les deux cas.');}
  C.text('beH',be?'Seuil de rentabilité du retrait anticipé : mois '+be:'Rompre le CD plus tôt ne rattrape pas l’épargne');
  C.text('beT',be?'Le '+days+' jours de pénalité coûtent environ '+M(pen)+'. From month '+be+', le CD moins cette pénalité vaut déjà plus que le solde d’épargne — même en le rompant à ce moment-là, vous resteriez gagnant.':cdWins?'Le '+days+' jours de pénalité d’environ '+M(pen)+' signifient que rompre le CD avant l’échéance vous laisse derrière l’épargne avec cette trajectoire de taux. Ne bloquez que l’argent dont vous n’aurez pas besoin pendant '+T+' mois.':'Avec cette trajectoire de taux, l’épargne reste devant, et rompre le CD plus tôt coûterait encore '+M(pen)+'.');
  C.text('ledT',P(cd*100)+' CD contre '+P(hy*100)+' HYSA'+(cut?' (−'+(cut*100).toFixed(2)+'%/yr)':''));
  var show=[1,3,6,9,12,18,24,36,48,60].filter(function(x){return x<=T;});if(show.indexOf(T)<0)show.push(T);if(be&&show.indexOf(be)<0)show.push(be);show.sort(function(a,b){return a-b;});
  last={rows:rows};
  $('tbl').innerHTML=show.map(function(m){var x=rows[m-1],end=m===T,st=end?'À échéance':m===be?'Break-even':x.brk>=x.hb?'Gagnant même en cas de rupture':'Perdant en cas de rupture';
    return '<tr'+(end?' style="background:var(--sx-emb)"':m===be?' class="pb"':'')+'><td style="font-family:inherit;font-weight:600">Mois '+m+(end?' (Maturity)':'')+'</td><td>'+M(x.cb)+'</td><td class="mu">'+P(x.a*100)+'</td><td>'+M(x.hb)+'</td><td class="'+(x.adv>=0?'pos':'r')+'">'+(x.adv>=0?'+':'')+M(x.adv)+'</td><td>'+(end?M(x.cb)+' <small class="p">(sans pénalité)</small>':M(x.brk))+'</td><td><span class="sx-an-ph'+(end?' a':m===be?' p':x.brk>=x.hb?' a':'')+'">'+st+'</span></td></tr>';}).join('');
  var W=520,H=170,Lp=52,R=10,Tp=12,B=24,w=W-Lp-R,h=H-Tp-B,mx=Math.max(L.cb,L.hb),mn=p,X=function(m){return Lp+m/T*w;},Y=function(y){return Tp+h-(mx>mn?(y-mn)/(mx-mn):0)*h;};
  var line=function(k){return 'M'+X(0)+' '+Y(p)+rows.map(function(x){return ' L'+X(x.m).toFixed(1)+' '+Y(x[k]).toFixed(1);}).join('');},gr='';
  for(var i=0;i<=3;i++){var yy=mn+(mx-mn)*i/3;gr+='<line x1="'+Lp+'" x2="'+(W-R)+'" y1="'+Y(yy)+'" y2="'+Y(yy)+'" stroke="var(--sx-border)" stroke-dasharray="3 3"/><text x="'+(Lp-6)+'" y="'+(Y(yy)+3)+'" text-anchor="end" font-size="9" fill="var(--sx-muted)">$'+(Math.round(yy/10)/100).toFixed(1)+'k</text>';}
  gr+='<text x="'+X(0)+'" y="'+(H-8)+'" font-size="9" fill="var(--sx-muted)">Début</text><text x="'+X(T)+'" y="'+(H-8)+'" text-anchor="end" font-size="9" fill="var(--sx-muted)">Mois '+T+'</text>';
  $('chart').innerHTML=gr+'<path d="'+line('hb')+'" fill="none" stroke="#f59e0b" stroke-width="2.5"/><path d="'+line('cb')+'" fill="none" stroke="var(--sx-primary)" stroke-width="2.5"/>';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'chCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('cd-vs-hysa.csv',[{h:'Mois',key:'m'},{h:'Solde du CD',key:'c'},{h:'TAEA du compte d’épargne %',key:'a'},{h:'Solde du compte d’épargne',key:'h'},{h:'Avantage du CD',key:'d'},{h:'CD en cas de rupture',key:'b'}],last.rows.map(function(x){return {m:x.m,c:x.cb.toFixed(2),a:(x.a*100).toFixed(3),h:x.hb.toFixed(2),d:x.adv.toFixed(2),b:x.brk.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCdHysa={};
})();
