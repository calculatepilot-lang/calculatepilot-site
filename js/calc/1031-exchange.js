/* 1031 exchange calculator — CalculatePilot (Stitch 1:1 redesign).
   Adjusted basis = purchase + improvements − depreciation. Realized gain = sale − costs − basis.
   Tax on gain G: recapture part min(G, depreciation) × recapture rate; rest × LTCG rate; NIIT 3.8% × G (optional); state × G.
   Exchange: equity = sale − costs − old debt; cash in = replacement − new debt; cash boot = max(0, equity − cash in);
   mortgage boot = max(0, old debt − new debt − max(0, cash in − equity)); recognized = min(G, cash boot + mortgage boot).
   Deferred tax = tax(G) − tax(recognized). New basis = replacement price − deferred gain. Deadlines: closing + 45 / + 180 days. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('en-US'):'—';}
function M2(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function tax(g,o){g=Math.max(0,g);var rec=Math.min(g,o.dep)*o.rc,cg=Math.max(0,g-o.dep)*o.cg,ni=o.niit?g*.038:0,st=g*o.st;return {rec:rec,cg:cg,ni:ni,st:st,t:rec+cg+ni+st};}
function addDays(d,n){var x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;}
function fmtD(d){return isNaN(d)?'—':d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}

function compute(){
  var g=function(id){return Math.max(0,v(id));},o={dep:g('dep'),rc:g('rc')/100,cg:+$('cg').value/100,st:g('st')/100,niit:$('niit').checked};
  var basis=g('buy')+g('imp')-o.dep,sale=g('sale'),exp=g('exp'),od=g('odebt'),rep=g('rep'),nd=g('ndebt'),inv=$('inv').checked;
  var netSale=sale-exp,gain=netSale-basis,equity=netSale-od,cashIn=rep-nd,cashBoot=Math.max(0,equity-cashIn),mortBoot=Math.max(0,od-nd-Math.max(0,cashIn-equity));
  var boot=cashBoot+mortBoot,recog=inv?Math.min(Math.max(0,gain),boot):Math.max(0,gain),T=tax(gain,o),Tr=tax(recog,o),def=T.t-Tr.t,defGain=Math.max(0,gain)-recog;
  C.text('expP',sale?(exp/sale*100).toFixed(1)+'% of sale':'');
  C.text('repN',rep>=netSale?'≥ net sale price '+M(netSale)+(rep>netSale?' (+'+M(rep-netSale)+' trade-up)':''):'Below net sale price '+M(netSale)+' by '+M(netSale-rep));
  C.text('debtN',nd>=od?'Covers the '+M(od)+' debt paid off':cashIn-equity>=od-nd?'Shortfall offset by '+M(cashIn-equity)+' added cash':'Debt drops by '+M(od-nd)+' — mortgage boot');
  var full=inv&&gain>0&&recog===0;
  C.text('verd',!inv?'Not eligible — personal-use property':gain<=0?'No gain to defer':full?'Full Tax Deferral':'Partial Deferral — Taxable Boot');
  C.text('bootT',inv?(boot>0?'Boot '+M(boot):'Zero taxable boot'):'—');
  C.text('resultValue',M(inv?def:0));
  $('defN').innerHTML=!inv?'Section 1031 applies only to property held for investment or business use.':gain<=0?'The sale shows no gain after costs, so there is no tax to defer.':(full?'All <b>'+M(T.t)+'</b> of tax on the '+M(gain)+' gain is deferred into the replacement property.':'<b>'+M(Tr.t)+'</b> is due now on '+M(recog)+' of recognized gain from boot; the rest is deferred.');
  C.text('gainT','Gain '+M(gain));C.text('t1L','Depreciation recapture ('+Math.round(o.rc*100)+'% on '+M(Math.min(Math.max(0,gain),o.dep))+')');C.text('t1',M(T.rec));
  C.text('t2L','Federal capital gains ('+Math.round(o.cg*100)+'%)');C.text('t2',M(T.cg));C.text('t3',o.niit?M(T.ni):'Not applied');C.text('t4L','State tax ('+(o.st*100).toFixed(1)+'%)');C.text('t4',M(T.st));C.text('tt',M(T.t));
  var eqX=equity-(inv?Tr.t:T.t),eqS=equity-T.t;C.text('eq1',M(eqX));C.text('eq2',M(eqS));
  C.text('eqN',inv&&def>0?'+'+M(eqX-eqS)+' more to invest (+'+(eqS>0?((eqX-eqS)/eqS*100).toFixed(1):'—')+'%) by deferring the tax. Replacement basis: '+M(rep-defGain)+'.':'No deferral benefit on these numbers.');
  var ok=function(b){return b?'<span style="color:var(--sx-pc)">✓ Passed</span>':'<span style="color:var(--sx-err)">✗ Check</span>';};
  var r1=rep>=netSale,r2=mortBoot===0,r3=cashBoot===0;$('r1').innerHTML=ok(r1);$('r2').innerHTML=ok(r2);$('r3').innerHTML=ok(r3);$('r4').innerHTML=ok(inv);
  C.text('rulesT',[r1,r2,r3,inv].filter(Boolean).length+' of 4 met');
  var d=new Date(($('close').value||'')+'T00:00:00');C.text('d45',fmtD(addDays(d,45)));C.text('d180',fmtD(addDays(d,180)));C.text('r200',M(sale*2));
  var rows=[['Sale price',sale,sale],['Selling & exchange costs',-exp,-exp],['Adjusted basis',basis,basis],['Realized gain',gain,gain],['Recognized (taxable) gain',Math.max(0,gain),recog],['Depreciation recapture tax',-T.rec,-Tr.rec],['Federal capital gains tax',-T.cg,-Tr.cg],['Net investment income tax',-T.ni,-Tr.ni],['State tax',-T.st,-Tr.st],['Total tax due now',-T.t,-Tr.t],['Cash equity to reinvest',eqS,eqX]];
  last={rows:rows};C.text('ledT',full?'Full deferral':inv?'Partial deferral':'Not eligible');
  $('tbl').innerHTML=rows.map(function(r,k){var big=k===rows.length-1||k===9,d2=r[2]-r[1];return '<tr'+(k===rows.length-1?' class="hl"':'')+'><td style="font-family:inherit;font-weight:'+(big?700:600)+'">'+r[0]+'</td><td>'+M2(r[1])+'</td><td>'+M2(r[2])+'</td><td class="'+(d2>0.005?'pos':d2<-0.005?'r':'mu')+'">'+(Math.abs(d2)<0.005?'—':(d2>0?'+':'')+M2(d2))+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  try{var t=new Date();$('close').value=t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);}catch(e){}
  C.init({root:'xcCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('1031-exchange.csv',[{h:'Item',key:'a'},{h:'Taxable sale',key:'b'},{h:'1031 exchange',key:'c'}],last.rows.map(function(r){return {a:r[0],b:r[1].toFixed(2),c:r[2].toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cp1031={tax:tax};
})();
