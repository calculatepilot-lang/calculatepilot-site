/* Simple interest calculator — CalculatePilot (Stitch 1:1 redesign).
   I = P × r × t, A = P + I. Day counts: Actual/365 (t = days/365), 30/360 (30-day months, t = days/360),
   Actual/360 (t = actual days/360). With a monthly principal reduction, interest accrues on the declining balance month by month. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function pc(x){return isFinite(x)?x.toFixed(2)+'%':'—';}
function N(x){return (Math.round(x*10)/10).toLocaleString('de-DE');}

function compute(){
  var P=Math.max(0,v('principal')),r=Math.max(0,v('rate'))/100,q=Math.max(0,v('years')),u=$('unit').value,dc=$('dc').value,red=Math.max(0,v('pr'));
  C.text('unitSuf',u==='s1'?'Jahre':u==='s2'?'Monate':'Tage');
  var days,months,basis=dc==='s1'?365:360;
  if(u==='s1'){months=q*12;days=dc==='s2'?q*360:q*365;}else if(u==='s2'){months=q;days=dc==='s2'?q*30:q*365/12;}else{days=q;months=q/(dc==='s2'?30:365/12);}
  var t=days/basis;C.text('tOut',N(q)+' '+(u==='s1'?'yr':u==='s2'?'mo':'days')+' · t = '+t.toFixed(4)+' yrs');
  // accrue month by month (partial last month) on outstanding principal
  var bal=P,I=0,paid=0,m=0,rows=[],dPer=days/(months||1),step=[1,3,6,12,24,60,120].filter(function(x){return months/x<=8;})[0]||120;
  var chk=function(mm){return mm===Math.ceil(months)||(mm%step===0);};
  while(m<months-1e-9){var f=Math.min(1,months-m),dd=dPer*f;I+=bal*r*dd/basis;m+=f;var pay=Math.min(bal,red*f);bal-=pay;paid+=pay;
    var mm=Math.round(m*1000)/1000;if(chk(Math.ceil(mm-1e-9)))rows.push({m:mm,d:dPer*m,bal:bal,I:I,tot:bal+I,all:bal+paid+I});}
  var A=P+I;last={rows:rows,P:P,r:r};
  C.text('resultValue',M(I));C.text('outTotal',M(A));
  C.text('day',M(P*r/basis));C.text('mon',M(P*r/12));C.text('dbl',r?N(1/r)+' J.':'—');
  var parts=[['Anfangskapital',P,'var(--sx-primary)'],['Einfache Zinsen',I,'#34d399']];
  C.text('ratN',pc(A?P/A*100:0)+' Kapital / '+pc(A?I/A*100:0)+' interest');
  $('ratBar').innerHTML=parts.map(function(x){return '<span style="width:'+(A?x[1]/A*100:0)+'%;background:'+x[2]+'"></span>';}).join('');
  $('ratLg').innerHTML=parts.map(function(x){return '<span><i style="background:'+x[2]+'"></i>'+x[0]+': '+M(x[1])+'</span>';}).join('');
  var yrs=days/365,ci=P*(Math.pow(1+r,yrs)-1);
  $('cmp').innerHTML=red?'Bei Tilgungen fallen Zinsen auf einen sinkenden Saldo an. Jährliche Verzinsung auf den vollen '+M(P)+' über denselben Zeitraum hätte <b>'+M(ci)+'</b> an Zinsen erzeugt.':'Jährliche Verzinsung auf dieselben '+M(P)+' at '+pc(r*100)+' hätte <b style="color:var(--sx-on)">'+M(ci)+'</b> an Zinsen erzeugt. Bei einfachen Zinsen zahlt ein Kreditnehmer <b style="color:var(--sx-pc)">'+M(ci-I)+'</b> weniger'+(Math.abs(basis-365)>0?' (der Unterschied spiegelt auch die '+(dc==='s2'?'30/360':'Actual/360')+' Tageszählung wider)':'')+'.';
  C.text('ledTag',rows.length+' Kontrollpunkte · '+(dc==='s1'?'Actual/365':dc==='s2'?'30/360':'Actual/360'));
  $('tbl').innerHTML=rows.map(function(x,k){var end=k===rows.length-1,ty=x.d/365,eq=ty>0&&P>0?(Math.pow(x.all/P,1/ty)-1)*100:0,lbl=x.m%12===0?'Jahr '+(x.m/12)+' Stichtag':'Monat '+N(x.m);
    return '<tr'+(end?' class="fin"':'')+'><td style="font-family:inherit;font-weight:600">'+(end?'<span class="msym" aria-hidden="true" style="font-size:14px;vertical-align:-2px">flag</span> ':'')+lbl+(end?' (Maturity)':'')+'</td><td>'+N(x.d)+' Tage</td><td>'+M(x.bal)+'</td><td class="pos">+'+M(x.I)+'</td><td class="b">'+M(x.tot)+'</td><td class="mu">'+pc(r*100)+' / '+pc(eq)+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'siCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('simple-interest-schedule.csv',[{h:'Monat',key:'m'},{h:'Tage',key:'d'},{h:'Offenes Kapital',key:'b'},{h:'Kumulierte Zinsen',key:'i'},{h:'Gesamtsaldo',key:'t'}],last.rows.map(function(x){return {m:x.m,d:x.d.toFixed(1),b:x.bal.toFixed(2),i:x.I.toFixed(2),t:x.tot.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSimple={};
})();
