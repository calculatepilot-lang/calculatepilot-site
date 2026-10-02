/* Student loan calculator — CalculatePilot (Stitch 1:1 redesign).
   Standard 10-yr, graduated (illustrative +15% every 2 yrs over 10 yrs), extended 25-yr, accelerated (+extra),
   and IBR for new borrowers: 10% of (AGI − 150% poverty guideline) / 12, capped at the standard payment,
   unpaid interest tracked separately (not capitalized), forgiveness at 20 years. PSLF after 120 payments. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}
function dateAfter(m){var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+m);return MON[d.getMonth()]+' '+d.getFullYear();}
function yrs(m){var y=m/12;return (Math.round(y*10)/10)+(y===1?' Jahr':' Jahre');}

/* generic monthly simulation; payFn(month) returns the scheduled payment */
function sim(P,apr,payFn,maxN){
  var i=apr/100/12,bal=P,u=0,rows=[],paid=0,interest=0;
  for(var m=1;m<=maxN&&bal+u>0.005;m++){
    var int=bal*i,due=u+int,pay=Math.min(payFn(m),bal+due),pp=0;
    if(pay>=due){pp=pay-due;bal-=pp;u=0;}else{u=due-pay;}
    paid+=pay;interest+=Math.min(pay,due);
    rows.push({m:m,start:bal+pp,pay:pay,principal:pp,interest:Math.min(pay,due),accrued:int,unpaid:u,end:Math.max(0,bal)});
  }
  var n=rows.length;return {rows:rows,n:n,paid:paid,interest:interest,left:Math.max(0,bal)+u,unpaidInt:u};
}

function gradFirst(P,apr){var i=apr/100/12,sum=0;for(var k=0;k<5;k++){for(var j=1;j<=24;j++){sum+=Math.pow(1.15,k)/Math.pow(1+i,k*24+j);}}return P/sum;}

function inputs(){
  var hh=Math.max(1,Math.round(v('hh')));
  return {P:Math.max(0,v('bal')),rate:Math.max(0,v('rate')),cat:$('cat').value,plan:$('plan').value,agi:Math.max(0,v('agi')),hh:hh,pov:Math.max(0,v('pov')),extra:Math.max(0,v('extra')),made:Math.min(120,Math.max(0,Math.round(v('pslfMade'))))};
}

function ibrPay(o){var povH=o.pov+5500*(o.hh-1),disc=Math.max(0,o.agi-1.5*povH);return {pay:Math.min(disc*0.10/12,pmt(o.P,o.rate,120)),prot:1.5*povH};}

function plans(o){
  var std=pmt(o.P,o.rate,120),g1=gradFirst(o.P,o.rate),ext=pmt(o.P,o.rate,300),ib=ibrPay(o);
  return {
    std:{pay:std,s:sim(o.P,o.rate,function(){return std;},120)},
    acc:{pay:std+o.extra,s:sim(o.P,o.rate,function(){return std+o.extra;},120)},
    grad:{pay:g1,s:sim(o.P,o.rate,function(m){return g1*Math.pow(1.15,Math.floor((m-1)/24));},120)},
    ext:{pay:ext,s:sim(o.P,o.rate,function(){return ext;},300)},
    ibr:{pay:ib.pay,prot:ib.prot,s:sim(o.P,o.rate,function(){return ib.pay;},240)}
  };
}

function chart(o,p){
  var W=520,H=200,L=44,R=10,T=12,B=26,w=W-L-R,h=H-T-B,fed=o.cat==='undergrad'||o.cat==='grad';
  var N=Math.max(120,fed?p.ibr.s.n:0),max=o.P*1.05||1;
  function X(m){return L+m/N*w;}function Y(y){return T+h-Math.min(y,max)/max*h;}
  function pts(s){return [[0,o.P]].concat(s.rows.map(function(r){return [r.m,r.end+r.unpaid];})).map(function(q){return X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1);}).join(' ');}
  var s='';
  [0,.5,1].forEach(function(f){var yy=T+h*f;s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="currentColor" stroke-opacity=".08"/><text x="'+(L-6)+'" y="'+(yy+3)+'" text-anchor="end" font-size="9" fill="#94a3b8">'+M(max/1.05*(1-f))+'</text>';});
  var yr=new Date().getFullYear(),ticks=[[0,'Heute ('+yr+')'],[p.acc.s.n,'Yr '+(Math.round(p.acc.s.n/12*10)/10)+' (Payoff)'],[120,'Jahr 10 (Standard)']];
  if(N>120)ticks.push([N,'Yr '+Math.round(N/12)+(fed&&p.ibr.s.left>0.5?' (Forgiveness)':'')]);
  ticks.forEach(function(t,k){s+='<text x="'+X(t[0])+'" y="'+(H-8)+'" text-anchor="'+(k===0?'start':t[0]>=N?'end':'middle')+'" font-size="9" fill="#94a3b8"'+(k===1?' font-weight="700"':'')+'>'+t[1]+'</text>';});
  s+='<polyline points="'+pts(p.std.s)+'" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 4"/>';
  if(fed){s+='<polyline points="'+pts(p.ibr.s)+'" fill="none" stroke="var(--sx-secondary)" stroke-opacity=".7" stroke-width="2"/>';
    if(p.ibr.s.left>0.5){var xe=X(p.ibr.s.n);s+='<line x1="'+xe+'" x2="'+xe+'" y1="'+Y(p.ibr.s.left)+'" y2="'+Y(0)+'" stroke="var(--sx-secondary)" stroke-width="2"/>';}}
  s+='<polyline points="'+pts(p.acc.s)+'" fill="none" stroke="var(--sx-pc)" stroke-width="2.5"/>';
  s+='<circle cx="'+X(p.acc.s.n)+'" cy="'+Y(0)+'" r="4" fill="var(--sx-pc)" stroke="#fff" stroke-width="1.5"/>';
  $('trajChart').innerHTML=s;
  C.text('trajSub','Restsaldo über einen '+Math.round(N/12)+'-Jahres-Zeitraum');
}

function ledger(o,sel){
  var rows=sel.s.rows,out=[],yr=new Date().getFullYear();
  for(var y=0;y*12<rows.length;y++){var ms=rows.slice(y*12,y*12+12);
    out.push({lab:'Jahr '+(y+1)+' ('+(yr+y)+')',start:ms[0].start+(y?rows[y*12-1].unpaid:0),pay:ms.reduce(function(a,r){return a+r.pay;},0),pp:ms.reduce(function(a,r){return a+r.principal;},0),ip:ms.reduce(function(a,r){return a+r.interest;},0),un:ms[ms.length-1].unpaid,end:ms[ms.length-1].end+ms[ms.length-1].unpaid});}
  var html=out.map(function(r,k){var lastRow=k===out.length-1;return '<tr><td>'+r.lab+'</td><td>'+M(r.start,2)+'</td><td>'+M(r.pay,2)+'</td><td class="b">'+M(r.pp,2)+'</td><td class="mu">'+M(r.ip,2)+'</td><td class="g">'+M(r.un,2)+'</td><td class="b">'+(lastRow&&r.end<0.5?'0,00 $ (BEZAHLT)':M(r.end,2))+'</td></tr>';}).join('');
  if(sel.s.left>0.5)html+='<tr class="sum"><td colspan="6">Restsaldo erlassen nach '+Math.round(sel.s.n/12)+' Jahren (möglicherweise steuerpflichtig)</td><td class="b">'+M(sel.s.left,2)+'</td></tr>';
  $('ledger').innerHTML=html;last.rows=out;
}

function compute(){
  var o=inputs(),p=plans(o),fed=o.cat==='undergrad'||o.cat==='grad';
  C.text('rateOut',o.rate.toFixed(2)+'%');C.text('extraNote','+'+M(o.extra)+' / mo');
  var povH=o.pov+5500*(o.hh-1);
  C.text('povNote','HHS-Richtlinie 2025 (48 Bundesstaaten): 15.650 $ für 1 Person, plus 5.500 $ je weitere Person — '+M(povH)+' for '+o.hh+'. IBR protects 150% ('+M(1.5*povH)+') von der Rückzahlung. Aktualisieren, falls eine neuere Richtlinie gilt.');
  var notes={std:'10 Jahre, feste gleichbleibende Rate.',ibr:'Die Rate richtet sich nach dem Einkommen; ein nach 20 Jahren verbleibender Saldo wird erlassen.',grad:'Beginnt niedriger und steigt alle 2 Jahre (modelliert mit +15 % pro Stufe), Rückzahlung in 10 Jahren.',ext:'25 Jahre, feste Rate. Erfordert mehr als 30.000 $ an bundesstaatlichen Direct Loans.'};
  var pn=notes[o.plan];if(o.plan==='ext'&&o.P<=30000)pn+=' Ihr Saldo liegt unter dieser Schwelle.';if(o.plan==='ibr'&&!fed)pn='IBR gilt nur für bundesstaatliche Direct Loans; '+(o.cat==='private'?'private Kredite folgen den Bedingungen des Kreditgebers.':'Parent PLUS loans need consolidation and ICR (not modeled).');
  C.text('planNote',pn);

  var selKey=o.plan==='ibr'&&!fed?'std':o.plan,sel=p[selKey],names={std:'Standard 10 Jahre',ibr:'IBR-Plan',grad:'Gestaffelt 10 Jahre',ext:'Verlängert 25 Jahre'};
  C.text('selLbl',names[selKey]+(selKey==='grad'?' (Starting)':'')+' Verpflichtung');C.text('resultValue',M(sel.pay));C.text('selTerm',sel.s.n+' Monatsraten');

  if(fed){C.text('ibrPay',M(p.ibr.pay));var d=sel.pay-p.ibr.pay;C.text('ibrDelta',d>0.5?'↓ '+M(d)+'/mo retained':'Nicht niedriger als '+names[selKey]);$('ibrTag').hidden=!(d>0.5);}
  else{C.text('ibrPay','N/A');C.text('ibrDelta',o.cat==='private'?'Private Kredite: kein IDR':'Parent PLUS: nur ICR');$('ibrTag').hidden=true;}

  C.text('s1d',dateAfter(p.std.s.n));C.text('s1i',M(p.std.s.interest));C.text('s1o',M(p.std.s.paid));
  C.text('s2x','+ '+M(o.extra)+'/mo');C.text('s2d',dateAfter(p.acc.s.n));C.text('s2i',M(p.acc.s.interest));C.text('s2s','+'+M(p.std.s.interest-p.acc.s.interest)+' saved');
  var early=p.std.s.n-p.acc.s.n;C.text('s2e',early>0?'Schuldenfrei '+yrs(early)+' früher!':'Eine Sonderzahlung hinzufügen, um früher abzuzahlen');
  if(fed){C.text('s3p',M(p.ibr.pay)+' / mo');C.text('s3f',M(p.ibr.s.left));C.text('s3u',M(p.ibr.s.unpaidInt+(p.ibr.s.left>0?0:0)));
    C.text('s3n',p.ibr.s.left>0.5?'Der nach 20 Jahren verbleibende Saldo wird erlassen (möglicherweise steuerpflichtig). Rate = 10 % des Einkommens über '+M(p.ibr.prot)+'.':'Abgezahlt in '+yrs(p.ibr.s.n)+' — vor dem Erlass nach 20 Jahren. Rate = 10 % des Einkommens über '+M(p.ibr.prot)+', begrenzt auf die Standardrate.');}
  else{C.text('s3p','N/A');C.text('s3f','—');C.text('s3u','—');C.text('s3n','Einkommensabhängige Pläne und Schuldenerlass gelten nur für bundesstaatliche Direct Loans.');}

  /* PSLF: remaining qualifying payments on IBR */
  var left=120-o.made;C.text('pMade',o.made+' / 120');$('pBar').style.width=(o.made/120*100)+'%';
  if(fed){var ps=sim(o.P,o.rate,function(){return p.ibr.pay;},left);var dis=ps.n<left?0:ps.left,yrD=new Date().getFullYear()+Math.ceil(left/12);
    C.text('pLeft',left+' Verbleibende Zahlungen ('+(Math.round(left/12*10)/10)+' Jahre)');
    C.text('pPaid','Bisher geleistet: '+o.made+' Zahlungen · nächste '+left+' bei IBR ≈ '+M(ps.paid));
    C.text('pDis',left===0?'Jetzt berechtigt':dis>0.5?M(dis)+' in '+yrD:'Keine — vorher abgezahlt');}
  else{C.text('pLeft','Nicht zulässig');C.text('pPaid','PSLF gilt nur für bundesstaatliche Direct Loans');C.text('pDis','—');}

  last={o:o,p:p};chart(o,p);ledger(o,sel);
  C.text('ledgerSub','Jährliche Aufschlüsselung für den '+names[selKey]+' Plan (ohne Sonderzahlungen): Zinsen, Tilgung und nicht gezahlte Zinsen.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'slCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last||!last.rows)return;
    C.csv('student-loan-schedule.csv',[{h:'Jahr',key:'lab'},{h:'Anfangskapital',key:'start'},{h:'Jährliche Zahlungen',key:'pay'},{h:'Gezahlte Tilgung',key:'pp'},{h:'Gezahlte Zinsen',key:'ip'},{h:'Unbezahlte Zinsen',key:'un'},{h:'Endguthaben',key:'end'}],last.rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpStudentLoan={plans:plans,pmt:pmt,sim:sim};
})();
