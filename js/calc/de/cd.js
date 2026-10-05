/* CD calculator — CalculatePilot (Stitch 1:1 redesign).
   Value after t months = deposit × (1 + APY)^(t/12). Equivalent APR = n × ((1 + APY)^(1/n) − 1).
   Early withdrawal penalty = deposit × APR × days ÷ 365 (simple interest), applied when broken at 6 months (or half the term).
   Ladder: deposit split into five 1–5 year CDs at the APYs entered. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];

function M(x,dp){dp=dp===undefined?2:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function dt(m,day){var d=new Date();d.setMonth(d.getMonth()+m);return MON[d.getMonth()]+(day?' '+d.getDate()+',':'')+' '+d.getFullYear();}

function inputs(){return {D:Math.max(0,v('dep')),t:Math.max(1,v('term')),apy:Math.max(0,v('apy'))/100,n:Math.max(1,v('cmp')),pen:Math.max(0,v('pen')),hy:Math.max(0,v('hysa'))/100,l:[1,2,3,4,5].map(function(k){return Math.max(0,v('l'+k))/100;})};}

function compute(){
  var o=inputs(),V=function(m){return o.D*Math.pow(1+o.apy,m/12);},fv=V(o.t),int=fv-o.D,apr=o.n*(Math.pow(1+o.apy,1/o.n)-1),ty=o.t/12;last={o:o};
  C.text('tOut',o.t+' Monate ('+ty.toFixed(1)+' Yr)');C.text('tPill',o.t+'-Monats-Laufzeit');
  C.text('resultValue',M(fv));C.text('intHero','+'+M(int)+' Garantierte Zinsen');C.text('prin',M(o.D));C.text('int','+'+M(int));
  C.text('intN',(int/o.D*100||0).toFixed(2)+'% Gesamtrendite über '+o.t+' months');C.text('mo',M(int/o.t)+' / mo');
  var bm=Math.min(6,o.t/2),pen=o.D*apr*o.pen/365,nb=V(bm)-pen;
  C.text('penL','Netto bei Auflösung nach '+(Math.round(bm*10)/10)+' Mo');C.text('penV',M(nb));
  $('penN').textContent=o.pen?((nb-o.D>=0?'+':'−')+M(Math.abs(nb-o.D))+(nb>=o.D?' Nettogewinn':' Verlust von Kapital')+' nach einer '+o.pen+'-Tage-Zinsstrafe'):'Festgeld ohne Strafgebühr: aufgelaufene Zinsen bleiben vollständig erhalten';
  $('tl').innerHTML='<div>Ausgabedatum<b>'+dt(0,true)+'</b><span>'+M(o.D,0)+' Einzahlung</span></div><div>Halbzeit ('+(Math.round(o.t/2*10)/10)+' Mon.)<b>'+dt(Math.round(o.t/2),true)+'</b><span>'+M(V(o.t/2))+' aufgelaufen</span></div><div>Fälligkeitsdatum<b>'+dt(o.t,true)+'</b><span>'+M(fv)+' fällig geworden</span></div>';
  C.text('vsL',o.t+'-Monats-Zinsschutz');C.text('vsCdL',o.t+'-Monats-Festgeld, gebunden');C.text('vsCd',(o.apy*100).toFixed(2)+'% effektiver Jahreszins (APY)');C.text('vsCdR','+'+M(int,0)+' return');
  var hy=o.D*(Math.pow(1+o.hy,ty)-1);C.text('vsHy',(o.hy*100).toFixed(2)+'% gesch.');C.text('vsHyR','~'+M(hy,0)+' wenn der Zinssatz gehalten wird');

  var a=o.D/5,tot=0;C.text('ldLead','Aufgeteilt in '+M(o.D,0)+' auf fünf gestaffelte Festgelder, sodass jedes Jahr eines fällig wird; so bleibt ein Teil des Geldes verfügbar, während der Rest längerfristige Zinsen erzielt.');
  document.querySelectorAll('#tr>div').forEach(function(el,k){var gi=a*(Math.pow(1+o.l[k],k+1)-1);tot+=gi;el.querySelector('.amt').textContent=M(a);el.querySelector('.gi').textContent='+'+M(gi);});
  C.text('blend',(o.l.reduce(function(s,x){return s+x;},0)/5*100).toFixed(2)+'%');
  $('ldTbl').innerHTML=o.l.map(function(r,k){var gi=a*(Math.pow(1+r,k+1)-1),end=k===4;
    return '<tr'+(end?' class="act"':'')+'><td>Jahr '+(k+1)+' Ende'+(end?' (Vollständige Leiter)':'')+'</td><td>'+dt(12*(k+1))+'</td><td>Tranche '+(k+1)+' ('+(k+1)+'-Jahre)</td><td class="g">+'+M(gi)+'</td><td style="color:var(--sx-muted)">'+(end?'Alle fünf Tranchen liegen nun in 5-Jahres-Festgeldern, von denen jedes Jahr eines fällig wird':'In ein neues 5-Jahres-Festgeld zum aktuellen 5-Jahres-Zinssatz reinvestieren')+'</td><td class="b">'+M(a+gi)+'</td></tr>';}).join('');

  var nm={365:'daily',12:'monthly',4:'quarterly',2:'semi-annual',1:'annual'}[o.n];
  C.text('aprTxt','Ihr '+(o.apy*100).toFixed(2)+'% effektiver Jahreszins (APY) entspricht einem '+(apr*100).toFixed(3)+'% nominalen Jahreszins (APR) mit '+nm+' Zinseszins. Vergleichen Sie bei Festgeldern die APY — sie enthalten den Zinseszins bereits.');
  var rem=o.t-bm,need=rem>0&&o.D>0?pen/(o.D*rem/12)*100:0;
  $('penRows').innerHTML='<li>Strafkosten ('+o.pen+' Tage zu '+(apr*100).toFixed(2)+'% APR)<b style="color:var(--sx-err)">'+(pen?'−':'')+M(pen)+'</b></li><li>Zusätzliche Rendite, die nötig ist, um über die verbleibenden '+(Math.round(rem*10)/10)+' Monate auszugleichen<b style="color:var(--sx-pc)">'+(o.pen?'+'+need.toFixed(2)+'% effektiver Jahreszins (APY)':'Keine')+'</b></li>';
  C.text('penTxt',o.pen?'Wenn ein neues Festgeld für die Restlaufzeit mindestens '+need.toFixed(2)+' Prozentpunkte mehr zahlt als Ihre aktuelle APY, gleicht eine vorzeitige Auflösung mit Wiederanlage sich in etwa aus; bei mehr als dem kommen Sie besser weg.':'Mit einem Festgeld ohne Strafgebühr können Sie jederzeit zu einem höheren Zinssatz wechseln, ohne Zinsen zu verlieren.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'cdCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var o=last.o,rows=[];for(var m=0;m<=o.t;m++)rows.push({m:m,v:Math.round(o.D*Math.pow(1+o.apy,m/12)*100)/100});C.csv('cd-ledger.csv',[{h:'Monat',key:'m'},{h:'Wert',key:'v'}],rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCD={};
})();
