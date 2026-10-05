/* UK student loan repayment calculator — CalculatePilot (Stitch 1:1 redesign). 2026/27 thresholds (GOV.UK).
   PAYE: monthly pay = salary ÷ 12; excess over the monthly threshold × 9% (6% postgraduate), rounded down to £1.
   Plan 1 £2,241/mo, Plan 2 £2,448, Plan 4 £2,816, Plan 5 £2,083, postgraduate £1,750.
   Projection (estimate): each year interest = balance × rate, repayment = min(balance + interest, annual PAYE at that year's salary);
   thresholds held flat, salary grows at the entered rate; remaining balance at the write-off year is cancelled.
   Marginal stack uses rUK income tax (20% / 40% / 45%, with the £100k allowance taper) and Class 1 NI (8% / 2%). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevPlan=null;
var PL={plan1:{m:2241,r:.09,n:'Plan 1',t:25,ir:3.2},plan2:{m:2448,r:.09,n:'Plan 2',t:30,ir:6.2},plan4:{m:2816,r:.09,n:'Plan 4',t:30,ir:3.2},plan5:{m:2083,r:.09,n:'Plan 5',t:40,ir:3.2},pgl:{m:1750,r:.06,n:'Postgraduate',t:30,ir:6.2}};

function pence(n){return Math.round(n*100)/100;}
function G(x,d){return isFinite(x)?(x<0?'−£':'£')+Math.abs(x).toLocaleString('en-GB',{minimumFractionDigits:d===undefined?2:d,maximumFractionDigits:d===undefined?2:d}):'—';}
function slice(mp,p){var ex=Math.max(0,pence(mp-p.m)),raw=pence(ex*p.r);return {ex:ex,raw:raw,paye:Math.floor(raw)};}
function payeYear(sal,key,pg){var mp=pence(sal/12),u=key==='pgl'?null:PL[key],a=u?slice(mp,u).paye:0,b=(key==='pgl'||pg)?slice(mp,PL.pgl).paye:0;return (a+b)*12;}

function compute(){
  var key=$('plan').value,p=PL[key],pg=key!=='pgl'&&$('alsoPgl').checked,sal=Math.max(0,v('salary')),mp=pence(sal/12);
  $('pglWrap').style.display=key==='pgl'?'none':'flex';
  if(prevPlan!==null&&prevPlan!==key){$('ir').value=p.ir;$('yl').value=p.t;}prevPlan=key;
  var u=key==='pgl'?null:slice(mp,p),g=(key==='pgl'||pg)?slice(mp,PL.pgl):null,paye=(u?u.paye:0)+(g?g.paye:0),raw=pence((u?u.raw:0)+(g?g.raw:0));
  C.text('planT',p.n+(pg?' + Postgraduate':''));C.text('resultValue',G(paye,0));
  C.text('outDetail',paye?'Monatsgehalt '+G(mp)+'. '+(u?'9 % von '+G(u.ex)+' über dem '+G(p.m,0)+' Schwellenwert = '+G(u.raw)+'. ':'')+(g?'6 % von '+G(g.ex)+' über £1.750 = '+G(g.raw)+'. ':'')+'Die Lohnabrechnung rundet auf £1 ab'+(raw!==paye?' ('+G(raw)+' → '+G(paye,0)+')':'')+'.':'Ein Monatsgehalt von '+G(mp)+' liegt auf oder unter dem Schwellenwert — kein Abzug.');
  C.text('aboveT',sal>p.m*12?G(sal-p.m*12,0)+' über dem Schwellenwert':'Unter dem Schwellenwert');C.text('outAnnual',G(paye*12,0));
  var it=sal>125140?.45:sal>100000?.60:sal>50270?.40:sal>12570?.20:0,ni=sal>50270?.02:sal>12570?.08:0,sl=(u&&mp>p.m?.09:0)+(g&&mp>1750?.06:0);
  C.text('marg',Math.round((it+ni+sl)*100)+'%');C.text('margN',Math.round(it*100)+'% Einkommensteuer + '+Math.round(ni*100)+'% NI + '+Math.round(sl*100)+'% Darlehen (Steuer in England, Wales &amp; NI)');
  C.text('irHelp','Standard: '+p.n+' Satz ab September 2025 — '+(key==='plan2'?'RPI + 3 % maximal, niedriger für Geringverdiener':key==='pgl'?'RPI + 3 %':key==='plan5'?'RPI':'der niedrigere Wert aus RPI oder Leitzins + 1 %')+'. Update to the current rate on GOV.UK. Write-off: '+p.t+' Jahre ab der ersten Fälligkeit zur Rückzahlung.');
  // projection
  var B=Math.max(0,v('bal')),r=Math.max(0,v('ir'))/100,gr=v('gr')/100,Y=Math.max(1,Math.round(v('yl'))),s=sal,cum=0,rows=[],cleared=null,intTot=0;
  for(var y=1;y<=Y&&B>0.005;y++){var i=B*r,due=B+i,rep=Math.min(due,payeYear(s,key,pg));B=due-rep;cum+=rep;intTot+=i;rows.push({y:y,s:s,rep:rep,i:i,b:B,c:cum});if(B<=0.005&&cleared===null)cleared=y;s*=1+gr;}
  var wo=cleared?0:B;last={rows:rows};
  C.text('totR',G(cum,0));C.text('totRN',cleared?'Getilgt im Jahr '+cleared:'Über '+Y+' Jahre, danach erlassen');C.text('wo',G(wo,0));C.text('woN',cleared?'Darlehen vollständig zurückgezahlt':'Am Ende der Laufzeit erlassen');
  var adv=$('advI');
  if(!Math.max(0,v('bal'))){C.text('advH','Geben Sie einen Saldo ein, um die Rückzahlung zu berechnen');C.text('advT','Der obige PAYE-Abzug hängt nicht von Ihrem Saldo ab.');adv.textContent='info';}
  else if(!cleared){adv.textContent='gavel';C.text('advH','Sondertilgungen sparen Ihnen wahrscheinlich kein Geld');C.text('advT','Unter diesen Annahmen werden Sie das Darlehen nicht vor dem Erlass tilgen, sodass freiwillige Sondertilgungen vor allem den erlassenen Betrag verringern würden und nicht das, was Sie zahlen. Kleine Änderungen im Karriereverlauf können dies ändern — prüfen Sie es erneut, wenn Ihr Gehalt stark steigt.');}
  else{adv.textContent='savings';C.text('advH','Sie sind auf dem Weg, vollständig zurückzuzahlen');C.text('advT','Unter diesen Annahmen ist das Darlehen im Jahr '+cleared+' getilgt, mit '+G(intTot,0)+' an Zinsen im Verlauf. Sondertilgungen würden diese Zinsen verringern — vergleichen Sie zuerst den Darlehenszins mit dem, was das Geld anderweitig einbringen könnte.');}
  C.text('ledH',Y+'-Jahres-Prognose: Gehalt vs. Darlehenssaldo');C.text('ledN','Anfangsgehalt '+G(sal,0)+' growing '+(v('gr'))+'% pro Jahr; Saldo '+G(Math.max(0,v('bal')),0)+' at '+(+v('ir'))+'% Zinsen.');C.text('ledT',p.n+' · '+Y+'-Jahres-Laufzeit');
  $('tbl').innerHTML=rows.map(function(x,k){var end=k===rows.length-1;return '<tr'+(end?' style="background:var(--sx-emb)"':'')+'><td style="font-family:inherit;font-weight:600">Jahr '+x.y+(end?(cleared?' (Cleared)':' (Write-off)'):'')+'</td><td>'+G(x.s,0)+'</td><td>'+G(x.rep)+'</td><td class="r">+'+G(x.i)+'</td><td class="b">'+G(x.b)+(end&&!cleared?' <small class="p">(erlassen)</small>':'')+'</td><td class="mu">'+G(x.c)+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ukCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('uk-student-loan-projection.csv',[{h:'Jahr',key:'y'},{h:'Gehalt',key:'s'},{h:'Rückzahlung',key:'r'},{h:'Zinsen',key:'i'},{h:'Restschuld',key:'b'},{h:'Insgesamt zurückgezahlt',key:'c'}],last.rows.map(function(x){return {y:x.y,s:Math.round(x.s),r:x.rep.toFixed(2),i:x.i.toFixed(2),b:x.b.toFixed(2),c:x.c.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(e){e.preventDefault();});
});
window.cpUkSl={payeYear:payeYear};
})();
