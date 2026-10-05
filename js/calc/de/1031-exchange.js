/* 1031 exchange calculator — CalculatePilot (Stitch 1:1 redesign).
   Adjusted basis = purchase + improvements − depreciation. Realized gain = sale − costs − basis.
   Tax on gain G: recapture part min(G, depreciation) × recapture rate; rest × LTCG rate; NIIT 3.8% × G (optional); state × G.
   Exchange: equity = sale − costs − old debt; cash in = replacement − new debt; cash boot = max(0, equity − cash in);
   mortgage boot = max(0, old debt − new debt − max(0, cash in − equity)); recognized = min(G, cash boot + mortgage boot).
   Deferred tax = tax(G) − tax(recognized). New basis = replacement price − deferred gain. Deadlines: closing + 45 / + 180 days. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('de-DE'):'—';}
function M2(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function tax(g,o){g=Math.max(0,g);var rec=Math.min(g,o.dep)*o.rc,cg=Math.max(0,g-o.dep)*o.cg,ni=o.niit?g*.038:0,st=g*o.st;return {rec:rec,cg:cg,ni:ni,st:st,t:rec+cg+ni+st};}
function addDays(d,n){var x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;}
function fmtD(d){return isNaN(d)?'—':d.toLocaleDateString('de-DE',{month:'short',day:'numeric',year:'numeric'});}

function compute(){
  var g=function(id){return Math.max(0,v(id));},o={dep:g('dep'),rc:g('rc')/100,cg:+$('cg').value/100,st:g('st')/100,niit:$('niit').checked};
  var basis=g('buy')+g('imp')-o.dep,sale=g('sale'),exp=g('exp'),od=g('odebt'),rep=g('rep'),nd=g('ndebt'),inv=$('inv').checked;
  var netSale=sale-exp,gain=netSale-basis,equity=netSale-od,cashIn=rep-nd,cashBoot=Math.max(0,equity-cashIn),mortBoot=Math.max(0,od-nd-Math.max(0,cashIn-equity));
  var boot=cashBoot+mortBoot,recog=inv?Math.min(Math.max(0,gain),boot):Math.max(0,gain),T=tax(gain,o),Tr=tax(recog,o),def=T.t-Tr.t,defGain=Math.max(0,gain)-recog;
  C.text('expP',sale?(exp/sale*100).toFixed(1)+'% des Verkaufspreises':'');
  C.text('repN',rep>=netSale?'≥ Netto-Verkaufspreis '+M(netSale)+(rep>netSale?' (+'+M(rep-netSale)+' Trade-up)':''):'Unter dem Netto-Verkaufspreis '+M(netSale)+' by '+M(netSale-rep));
  C.text('debtN',nd>=od?'Deckt die '+M(od)+' getilgte Schuld':cashIn-equity>=od-nd?'Fehlbetrag ausgeglichen durch '+M(cashIn-equity)+' zusätzliches Bargeld':'Die Schulden sinken um '+M(od-nd)+' — Hypotheken-Boot');
  var full=inv&&gain>0&&recog===0;
  C.text('verd',!inv?'Nicht zulässig — privat genutzte Immobilie':gain<=0?'Kein Gewinn zum Aufschieben':full?'Vollständige Steueraufschiebung':'Teilweise Aufschiebung — steuerpflichtiges Boot');
  C.text('bootT',inv?(boot>0?'Boot '+M(boot):'Kein steuerpflichtiges Boot'):'—');
  C.text('resultValue',M(inv?def:0));
  $('defN').innerHTML=!inv?'Section 1031 gilt nur für Immobilien, die zu Anlage- oder Geschäftszwecken gehalten werden.':gain<=0?'Der Verkauf zeigt nach Kosten keinen Gewinn, daher gibt es keine Steuer aufzuschieben.':(full?'Die gesamte <b>'+M(T.t)+'</b> Steuer auf den '+M(gain)+' Gewinn wird in die Ersatzimmobilie aufgeschoben.':'<b>'+M(Tr.t)+'</b> sind jetzt fällig auf '+M(recog)+' des realisierten Gewinns aus dem Boot; der Rest wird aufgeschoben.');
  C.text('gainT','Gewinn '+M(gain));C.text('t1L','Abschreibungsrückforderung ('+Math.round(o.rc*100)+'% auf '+M(Math.min(Math.max(0,gain),o.dep))+')');C.text('t1',M(T.rec));
  C.text('t2L','Bundessteuer auf Kapitalgewinne ('+Math.round(o.cg*100)+'%)');C.text('t2',M(T.cg));C.text('t3',o.niit?M(T.ni):'Nicht angewendet');C.text('t4L','Staatssteuer ('+(o.st*100).toFixed(1)+'%)');C.text('t4',M(T.st));C.text('tt',M(T.t));
  var eqX=equity-(inv?Tr.t:T.t),eqS=equity-T.t;C.text('eq1',M(eqX));C.text('eq2',M(eqS));
  C.text('eqN',inv&&def>0?'+'+M(eqX-eqS)+' mehr zum Investieren (+'+(eqS>0?((eqX-eqS)/eqS*100).toFixed(1):'—')+'%) durch die Steueraufschiebung. Basis der Ersatzimmobilie: '+M(rep-defGain)+'.':'Bei diesen Zahlen kein Vorteil durch Aufschiebung.');
  var ok=function(b){return b?'<span style="color:var(--sx-pc)">✓ Bestanden</span>':'<span style="color:var(--sx-err)">✗ Prüfen</span>';};
  var r1=rep>=netSale,r2=mortBoot===0,r3=cashBoot===0;$('r1').innerHTML=ok(r1);$('r2').innerHTML=ok(r2);$('r3').innerHTML=ok(r3);$('r4').innerHTML=ok(inv);
  C.text('rulesT',[r1,r2,r3,inv].filter(Boolean).length+' von 4 erfüllt');
  var d=new Date(($('close').value||'')+'T00:00:00');C.text('d45',fmtD(addDays(d,45)));C.text('d180',fmtD(addDays(d,180)));C.text('r200',M(sale*2));
  var rows=[['Verkaufspreis',sale,sale],['Verkaufs- und Tauschkosten',-exp,-exp],['Bereinigte Basis',basis,basis],['Realisierter Gewinn',gain,gain],['Anerkannter (steuerpflichtiger) Gewinn',Math.max(0,gain),recog],['Steuer auf Abschreibungsrückforderung',-T.rec,-Tr.rec],['Bundessteuer auf Kapitalgewinne',-T.cg,-Tr.cg],['Steuer auf Kapitaleinkünfte (NIIT)',-T.ni,-Tr.ni],['Steuer des Bundesstaats',-T.st,-Tr.st],['Jetzt fällige Gesamtsteuer',-T.t,-Tr.t],['Zu reinvestierendes Eigenkapital in bar',eqS,eqX]];
  last={rows:rows};C.text('ledT',full?'Vollständige Aufschiebung':inv?'Teilweise Aufschiebung':'Nicht zulässig');
  $('tbl').innerHTML=rows.map(function(r,k){var big=k===rows.length-1||k===9,d2=r[2]-r[1];return '<tr'+(k===rows.length-1?' class="hl"':'')+'><td style="font-family:inherit;font-weight:'+(big?700:600)+'">'+r[0]+'</td><td>'+M2(r[1])+'</td><td>'+M2(r[2])+'</td><td class="'+(d2>0.005?'pos':d2<-0.005?'r':'mu')+'">'+(Math.abs(d2)<0.005?'—':(d2>0?'+':'')+M2(d2))+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  try{var t=new Date();$('close').value=t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);}catch(e){}
  C.init({root:'xcCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('1031-exchange.csv',[{h:'Position',key:'a'},{h:'Steuerpflichtiger Verkauf',key:'b'},{h:'1031-Tausch',key:'c'}],last.rows.map(function(r){return {a:r[0],b:r[1].toFixed(2),c:r[2].toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cp1031={tax:tax};
})();
