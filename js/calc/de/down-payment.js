/* Down payment calculator — CalculatePilot (Stitch 1:1 redesign).
   Cash to close = down payment + closing costs (% of price) + moving/inspection + post-closing reserve.
   Monthly savings (end-of-month deposits) = (target − S(1+r)^n) ÷ [((1+r)^n − 1)/r], r = monthly rate from APY.
   Conventional PMI uses illustrative rates by LTV band and drops at 78% LTV on schedule; FHA uses 0.55% annual MIP. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}
function dt(m){var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+m);return MON[d.getMonth()]+' '+d.getFullYear();}
function pmiRate(ltv){return ltv>0.95?0.60:ltv>0.90?0.50:ltv>0.85?0.35:ltv>0.80?0.25:0;}
function monthsTo78(price,loan,rate){var i=rate/100/12,pay=pmt(loan,rate,360),b=loan,m=0;while(b>0.78*price&&m<360){b=b*(1+i)-pay;m++;}return m;}

function inputs(){
  var price=Math.max(0,v('price')),mode=$('dpMode').value,pct=Math.min(100,Math.max(0,v('pct'))),down=Math.max(0,v('down'));
  if(mode==='pct')down=price*pct/100;else pct=price>0?down/price*100:0;down=Math.min(down,price);
  return {price:price,down:down,pct:pct,cc:Math.max(0,v('cc')),mov:Math.max(0,v('mov')),res:Math.max(0,v('res')),S:Math.max(0,v('sav')),apy:Math.max(0,v('apy')),n:Math.max(1,v('hz')),rate:Math.max(0,v('rate')),g:v('appr')};
}

function tier(o,p,fha){
  var down=o.price*p/100,loan=o.price-down,ltv=o.price>0?loan/o.price:0,cash=down+o.price*o.cc/100+o.mov+o.res,mo,months,status;
  if(fha){mo=loan*(ltv>0.95?0.55:0.50)/100/12;months=p<10?360:132;status=(ltv*100).toFixed(1)+'% LTV ('+(p<10?'MIP für die gesamte Kreditlaufzeit':'MIP für 11 Jahre')+')';}
  else{var r=pmiRate(ltv);mo=loan*r/100/12;months=r?monthsTo78(o.price,loan,o.rate):0;status=(ltv*100).toFixed(1)+'% LTV ('+(r?'~'+(Math.round(months/12*10)/10)+' Jahre PMI':'Kein PMI')+')';}
  return {p:p,down:down,mo:mo,five:mo*Math.min(60,months),cash:cash,status:status,fha:fha};
}

function compute(){
  var o=inputs(),cc=o.price*o.cc/100,T=o.down+cc+o.mov+o.res,r=Math.pow(1+o.apy/100,1/12)-1,g=Math.pow(1+r,o.n),A=r?(g-1)/r:o.n,P=Math.max(0,(T-o.S*g)/A);
  if(document.activeElement!==$('down'))$('down').value=Math.round(o.down);if(document.activeElement!==$('pct'))$('pct').value=Math.round(o.pct*100)/100;
  document.querySelectorAll('#strat button').forEach(function(b){b.setAttribute('aria-pressed',String(Math.abs(o.pct-parseFloat(b.getAttribute('data-p')))<0.01));});
  C.text('ccOut',o.cc.toFixed(1)+'% ('+M(cc)+')');
  C.text('resultValue',M(T));var rd=$('ready');if(o.S>=T){rd.textContent='Bereit zum Kauf';rd.className='sx-ef-grade';}else{rd.textContent='Sparen läuft';rd.className='sx-ef-grade mid';}
  $('struct').innerHTML='Aufgeteilt in <b>'+M(o.down)+'</b> Anzahlung ('+o.pct.toFixed(1)+'%) + <b>'+M(cc)+'</b> Abschlusskosten + <b>'+M(o.mov+o.res)+'</b> Reserve, Begutachtung &amp; Umzug.';
  var bal=o.S*g+P*A,it=bal-o.S-P*o.n;last={o:o,P:P,r:r,T:T};
  C.text('have',M(o.S));C.text('haveN',(T>0?Math.min(100,o.S/T*100):0).toFixed(1)+'% des Ziels erreicht');
  C.text('gap',M(Math.max(0,T-o.S-(P>0?it:0))));C.text('gapN',P>0?'Nach +'+M(it)+' Sparzinsen':'Bereits durch aktuelle Ersparnisse gedeckt');
  C.text('hzL',o.n+'-Monats-Ziel');C.text('need',M(P));
  $('intNote').innerHTML=P>0?'<b>+'+M(it)+' an Zinsen</b> fallen unterwegs an, bei '+o.apy.toFixed(2)+'% Jahresrendite (APY), wodurch sich Ihr eigener Einzahlungsbedarf verringert.':'Ihre aktuellen Ersparnisse'+(o.S*g>=T?', mit Zinsen,':'')+' decken das gesamte Cash-to-close-Ziel bereits ab.';
  var parts=[['Basis-Anzahlung',o.down,'var(--sx-primary)'],['Abschlusskosten',cc,'var(--sx-pc)'],['Reserve nach Abschluss',o.res,'var(--sx-tertiary)'],['Moving/Inspection',o.mov,'var(--sx-ov)']];
  C.text('stTot','Gesamt: '+M(T));$('stBar').innerHTML=parts.map(function(p){return '<span style="width:'+(T>0?p[1]/T*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('stList').innerHTML=parts.map(function(p){return '<li><span><i style="background:'+p[2]+'"></i>'+p[0]+' ('+(T>0?(p[1]/T*100).toFixed(1):'0')+'%)</span><b>'+M(p[1])+'</b></li>';}).join('');

  var tiers=[tier(o,3.5,true),tier(o,5),tier(o,10),tier(o,20)],base=tiers[0].five;
  C.text('mxSub','Abwägungen bei der Hypothekenversicherung für einen '+M(o.price)+' Kauf bei einem '+o.rate+'% Hypothekenzins.');
  $('mx').innerHTML=tiers.map(function(t){var sel=Math.abs(t.p-o.pct)<0.01;return '<tr'+(sel?' class="act"':'')+'><td>'+(sel?'<span class="msym" aria-hidden="true" style="font-size:14px;color:var(--sx-pc);vertical-align:-2px">check_circle</span> ':'')+t.p.toFixed(1)+'% Anzahlung ('+(t.fha?'FHA-Minimum':t.p>=20?'Stufe ohne PMI':t.p>=10?'Ausgewogen':'Konventionell')+')</td><td>'+M(t.down)+'</td><td class="'+(t.mo>0?'r':'g')+'">'+M(t.mo)+' / mo</td><td class="'+(t.mo>0?'r':'g')+'">'+(t.five>0?M(t.five):'0 $ (gespart in '+M(base)+')')+'</td><td class="b">'+M(t.cash)+'</td><td><span class="sx-dp-tag'+(t.mo?'':' ok')+'">'+t.status+'</span></td></tr>';}).join('');

  C.text('lgH',o.n+'-Monats-Meilenstein-Übersicht');C.text('lgSub','Sparguthaben mit monatlichen Einzahlungen von '+M(P)+' auf ein Konto mit '+o.apy.toFixed(2)+'% APY.');C.text('lgBase','Ausgangswert: '+M(o.S));C.text('lgTgt','Ziel: '+M(T));
  var rows=[],b=o.S,ci=0,marks=[0];for(var m=6;m<o.n;m+=6)marks.push(m);marks.push(o.n);
  for(m=0;m<=o.n;m++){if(m>0){var e=b*r;b+=e+P;ci+=e;}if(marks.indexOf(m)>=0)rows.push({m:m,bal:b,ci:ci});}
  last.rows=rows;
  $('lg').innerHTML=rows.map(function(x){var pc=T>0?Math.min(100,x.bal/T*100):0,end=x.m===o.n,ready=null;tiers.forEach(function(t){if(x.bal>=t.cash-0.5)ready=t;});
    var lbl=x.m===0?'<span class="sx-dp-tag">Anfangskapital</span>':end&&x.bal>=T-0.5?'<span class="sx-dp-tag done">Ziel erreicht</span>':ready?'<span class="sx-dp-tag ok">'+ready.p+'% Stufe bereit</span>':'<span class="sx-dp-tag">Im Aufbau</span>';
    return '<tr'+(end?' class="tg"':'')+'><td>'+(x.m===0?'Ausgangswert (heute)':'Monat '+x.m+' ('+dt(x.m)+')')+'</td><td class="mu">'+(x.m?M(P,2):'—')+'</td><td class="g">'+(x.m?'+'+M(x.ci,2):'—')+'</td><td class="b">'+M(x.bal,2)+'</td><td><span class="sx-dp-prog"><i><span style="width:'+pc+'%"></span></i>'+pc.toFixed(1)+'%</span></td><td>'+lbl+'</td></tr>';}).join('');

  var t5=tiers[1],pm=t5.mo*o.n,ap=o.price*(Math.pow(1+o.g/100,o.n/12)-1),net=ap-pm;
  C.text('waitTxt','Ein Kauf jetzt mit 5 % Anzahlung bedeutet, dass Sie etwa '+M(t5.mo)+'/month in PMI. Waiting '+o.n+' Monate Sparzeit '+o.pct.toFixed(0)+'% vermeidet das – aber wenn die Preise steigen, um '+o.g+'% im Jahr, würde ein '+M(o.price)+' Haus dann etwa '+M(o.price+ap)+' kosten.');
  $('waitRows').innerHTML='<li>PMI über '+o.n+' Monate (5 % Anzahlung)<b style="color:var(--sx-err)">'+M(pm)+'</b></li><li>Preisanstieg während des Wartens<b>'+(ap>=0?'+':'−')+M(Math.abs(ap))+'</b></li><li class="on">'+(net>=0?'Geschätzte Mehrkosten durch Warten':'Geschätzte Ersparnis durch Warten')+'<b>'+M(Math.abs(net))+'</b></li>';
}

document.addEventListener('DOMContentLoaded',function(){
  var root=$('dpCalc');
  root.addEventListener('input',function(e){if(e.target.id==='down')$('dpMode').value='usd';else if(e.target.id==='pct')$('dpMode').value='pct';},true);
  $('strat').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;$('dpMode').value='pct';$('pct').value=b.getAttribute('data-p');$('pct').dispatchEvent(new Event('input',{bubbles:true}));});
  C.init({root:'dpCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var o=last.o,b=o.S,rows=[];for(var m=1;m<=o.n;m++){b=b*(1+last.r)+last.P;rows.push({m:m,dep:Math.round(last.P*100)/100,bal:Math.round(b*100)/100});}C.csv('down-payment-plan.csv',[{h:'Monat',key:'m'},{h:'Einzahlung',key:'dep'},{h:'Restschuld',key:'bal'}],rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpDownPayment={};
})();
