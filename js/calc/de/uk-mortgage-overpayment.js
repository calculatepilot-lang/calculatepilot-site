/* UK mortgage overpayment — CalculatePilot (Stitch 1:1 redesign).
   Contractual payment from balance/rate/term; lump sum off the opening balance; regular overpayment
   each month shortens the term. ERC guardrail compares year-1 overpayments with 10% of the balance. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var MON=['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];
var FULL=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
var gbp=new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0});
function P(x){return gbp.format(Math.round(x));}
function K(x){return x>=1e6?'£'+(x/1e6).toFixed(1)+'m':'£'+Math.round(x/1e3)+'k';}
var showAll=false,last=null;

function pmt(B,annual,n){var i=annual/100/12;if(B<=0||n<=0)return 0;if(!i)return B/n;var p=Math.pow(1+i,n);return B*i*p/(p-1);}
function ym(m){var y=Math.floor(m/12),r=m%12;return (y?y+(y===1?' Yr':' J.'):'')+(y&&r?' ':'')+(r?r+(r===1?' Mo':' Mon.'):(y?'':'0 Mon.'));}
function when(m,full){var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+m-1);return (full?FULL:MON)[d.getMonth()]+' '+d.getFullYear();}

function simulate(B,annual,M,over,lump){
  var i=annual/100/12,bal=Math.max(0,B-lump),m=0,interest=0,paid=0,bals=[B],years=[],cur=null,y0=new Date().getFullYear();
  if(lump>0)bals[0]=B;
  while(bal>0.005&&m<1200){
    if(m%12===0){cur={year:m/12+1,cal:y0+m/12,start:m===0?B:bal,sched:0,over:m===0?Math.min(lump,B):0,lump:m===0?Math.min(lump,B):0,interest:0,end:0};years.push(cur);}
    m++;var it=bal*i,due=bal+it,s=Math.min(M,due),o=Math.min(over,due-s);
    if(M<=it&&over<=0){m=Infinity;break;}
    bal=due-s-o;interest+=it;paid+=s+o;cur.sched+=s;cur.over+=o;cur.interest+=it;cur.end=Math.max(0,bal);bals.push(Math.max(0,bal));
  }
  if(lump>0&&!years.length){years.push({year:1,cal:y0,start:B,sched:0,over:Math.min(lump,B),lump:Math.min(lump,B),interest:0,end:0});}
  return {months:m,interest:interest,paid:paid+Math.min(lump,B),bals:bals,years:years};
}

function chart(o,base,acc){
  var el=$('ovChart');if(!el)return;
  var W=Math.max(280,el.clientWidth),H=el.clientHeight||256,P0={l:44,r:14,t:10,b:10},n=base.bals.length-1||1,top=o.B||1;
  var fx=function(m){return P0.l+m*(W-P0.l-P0.r)/n;},fy=function(x){return P0.t+(H-P0.t-P0.b)*(1-x/top);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true">';
  for(var g=0;g<=4;g++){var val=top*(1-g/4),y=fy(val);s+='<line class="gl" x1="'+P0.l+'" x2="'+(W-P0.r)+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'"'+(g===4?' style="stroke-dasharray:none"':'')+'/><text class="gt" x="4" y="'+(y+3).toFixed(1)+'">'+(val?K(val):'£0')+'</text>';}
  function line(b){var step=Math.max(1,Math.floor(b.length/200)),d='';for(var k=0;k<b.length;k+=step)d+=(d?'L':'M')+fx(k).toFixed(1)+' '+fy(b[k]).toFixed(1);d+='L'+fx(b.length-1).toFixed(1)+' '+fy(b[b.length-1]).toFixed(1);return d;}
  s+='<path d="'+line(base.bals)+'" fill="none" style="stroke:var(--sx-ov)" stroke-width="2.5" stroke-dasharray="5 4"/>';
  var accB=acc.bals;
  s+='<path d="'+line(accB)+'" fill="none" style="stroke:var(--sx-primary)" stroke-width="3" stroke-linejoin="round"/>';
  var ex=fx(acc.months),ey=fy(0);
  s+='<circle cx="'+fx(base.months).toFixed(1)+'" cy="'+ey.toFixed(1)+'" r="4" style="fill:var(--sx-outline)"/>';
  s+='<circle cx="'+ex.toFixed(1)+'" cy="'+ey.toFixed(1)+'" r="5" style="fill:var(--sx-primary)" stroke="#fff" stroke-width="2"/>';
  if(acc.months<base.months){var fw=118,fxp=Math.min(W-P0.r-fw,Math.max(P0.l,ex-fw/2)),fyp=ey-60;
    s+='<rect x="'+fxp.toFixed(1)+'" y="'+fyp+'" width="'+fw+'" height="38" rx="6" style="fill:var(--sx-primary)"/><text x="'+(fxp+fw/2).toFixed(1)+'" y="'+(fyp+16)+'" text-anchor="middle" style="fill:#fff;font:600 10px var(--font-body)">Schuldenfrei '+when(acc.months)+'</text><text x="'+(fxp+fw/2).toFixed(1)+'" y="'+(fyp+29)+'" text-anchor="middle" style="fill:#abf1d2;font:9px var(--font-body)">'+ym(base.months-acc.months)+' Früher</text>';}
  s+='<line id="ocur" x1="0" x2="0" y1="'+P0.t+'" y2="'+ey+'" style="stroke:var(--sx-muted)" opacity="0"/><rect x="'+P0.l+'" y="0" width="'+(W-P0.l-P0.r)+'" height="'+H+'" fill="transparent" style="cursor:crosshair"/></svg><div class="tip"></div>';
  el.innerHTML=s;
  var svg=el.querySelector('svg'),tip=el.querySelector('.tip'),cur=el.querySelector('#ocur');
  function move(ev){var r=svg.getBoundingClientRect(),x=((ev.touches?ev.touches[0].clientX:ev.clientX)-r.left)*W/r.width,m=Math.max(0,Math.min(n,Math.round((x-P0.l)/(W-P0.l-P0.r)*n)));
    var a=m<accB.length?accB[m]:0;tip.innerHTML='<b>'+(m?when(m):'Heute')+'</b>Ausgangswert: '+P(base.bals[m]||0)+'<br>Mit Sondertilgungen: '+P(a);tip.style.left=(fx(m)*r.width/W)+'px';tip.style.top=(fy(Math.max(base.bals[m]||0,a))*r.height/H)+'px';tip.style.opacity=1;cur.setAttribute('x1',fx(m));cur.setAttribute('x2',fx(m));cur.setAttribute('opacity',.4);}
  function out(){tip.style.opacity=0;cur.setAttribute('opacity',0);}
  svg.addEventListener('mousemove',move);svg.addEventListener('touchmove',move,{passive:true});svg.addEventListener('mouseleave',out);svg.addEventListener('touchend',out);
  var paidY=acc.months/12,baseY=base.months/12,labels=['Year 0'];
  for(var yy=5;yy<paidY-1.5&&labels.length<4;yy+=5)labels.push('Jahr '+yy);
  if(acc.months<base.months)labels.push('Jahr '+(Math.round(paidY*10)/10)+' (Paid)');
  labels.push('Jahr '+(Math.round(baseY*10)/10));
  $('ovXl').innerHTML=labels.map(function(t){return '<span>'+t+'</span>';}).join('');
}

function ledger(acc){
  var ys=acc.years,L=ys.length,fin=acc.months/12;
  $('ledBody').innerHTML=ys.map(function(y,k){var last=k===L-1,mile=y.year<=5||y.year%5===0||last;if(!showAll&&!mile)return '';
    var label=last&&acc.months%12?'Jahr '+(Math.round(fin*10)/10)+' ('+y.cal+')':'Jahr '+y.year+' ('+y.cal+')';
    var ov=P(y.over)+(y.lump?' <small>('+P(y.lump)+' Einmalzahlung + '+P(y.over-y.lump)+' reg.)</small>':'');
    return '<tr class="'+(last?'fin':y.year%5===0?'m5':'')+'"><td class="y">'+(last?'<span><span class="msym" aria-hidden="true">stars</span>'+label+'</span>':label)+'</td><td>'+P(y.start)+'</td><td>'+P(y.sched)+'</td><td class="op">'+ov+'</td><td class="in">'+P(y.interest)+'</td><td class="eb">'+(last?'£0 (Hypothek getilgt)':P(y.end))+'</td></tr>';}).join('');
  C.text('ledNote',showAll?'Alle '+L+' years':'Angezeigt werden Meilensteinjahre · '+L+' Jahre insgesamt');
  C.text('ledMore',showAll?'Nur Meilensteine anzeigen':'Jedes Jahr anzeigen');$('ledMore').setAttribute('aria-expanded',String(showAll));
}

function compute(){
  var o={B:Math.max(0,v('balance')),years:Math.max(1,Math.round(v('term'))),rate:Math.max(0,v('rate')),over:Math.max(0,v('overpay')),lump:Math.max(0,v('lump'))};
  o.lump=Math.min(o.lump,o.B);
  var n=o.years*12,M=pmt(o.B,o.rate,n),base=simulate(o.B,o.rate,M,0,0),acc=simulate(o.B,o.rate,M,o.over,o.lump);
  C.text('termVal',o.years+(o.years===1?' Jahr':' Jahre'));
  C.text('mRate','Monatlicher Zinssatz: '+(o.rate/12).toFixed(3)+'%');
  C.text('contract',P(M));C.text('overpayVal',P(o.over)+' / month');
  var saved=Math.max(0,base.interest-acc.interest),sooner=Math.max(0,base.months-acc.months);
  C.text('resultValue',P(saved));
  C.text('earlier',sooner?ym(sooner):'Keine Änderung');C.text('earlierSub',sooner?'Früher!':'Sondertilgung hinzufügen, um die Laufzeit zu verkürzen');
  C.text('newTerm',ym(acc.months));C.text('oldTerm','(statt '+ym(base.months)+')');
  C.text('bInt',P(base.interest));C.text('bPay',when(base.months,true));C.text('bOut',P(base.paid));
  C.text('aTag','+'+P(o.over)+'/mo'+(o.lump?' + '+K(o.lump):''));C.text('aInt',P(acc.interest));C.text('aPay',when(acc.months,true));C.text('aSave',P(saved)+' Gespart');
  C.text('isaRate',o.rate+'% steuerfrei');

  var allow=o.B*0.10,y1=acc.years.length?acc.years[0].over:0,box=$('ercBox'),over=y1>allow+0.5;
  box.classList.toggle('warn',over);
  C.text('ercMax',P(allow));$('ercBar').style.width=Math.min(100,allow?y1/allow*100:0)+'%';
  C.text('ercPill',over?'Über dem Freibetrag':'Sicherer Bereich');
  C.text('ercTxt',over?'Voraussichtlicher Gesamtbetrag im 1. Jahr ('+P(y1)+') überschreitet den üblichen 10-%-Freibetrag ('+P(allow)+'). Wenn Sie sich in einer Festzins- oder Rabattphase befinden, kann eine Vorfälligkeitsentschädigung (oft 1–5 % des überschreitenden Betrags) anfallen — prüfen Sie Ihr Angebot.':'Voraussichtlicher Gesamtbetrag im 1. Jahr ('+P(y1)+') liegt innerhalb des üblichen jährlichen 10-%-Freibetrags ('+P(allow)+'). Die genaue Grenze entnehmen Sie bitte Ihrem eigenen Angebot.');

  chart(o,base,acc);ledger(acc);last={o:o,base:base,acc:acc};
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ovCalc',compute:compute});
  $('ledMore').addEventListener('click',function(){showAll=!showAll;if(last)ledger(last.acc);});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('uk-mortgage-overpayment.csv',[{h:'Jahr',key:'year'},{h:'Kalenderjahr',key:'cal'},{h:'Anfangsguthaben',key:'start'},{h:'Planmäßige Zahlungen',key:'sched'},{h:'Sondertilgungskapital',key:'over'},{h:'Aufgelaufene Zinsen',key:'interest'},{h:'Saldo am Jahresende',key:'end'}],last.acc.years);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(last)chart(last.o,last.base,last.acc);},120);});
});
window.cpOverpay={simulate:simulate,pmt:pmt};
})();
