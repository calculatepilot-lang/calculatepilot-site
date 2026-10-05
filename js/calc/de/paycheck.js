/* Paycheck calculator — CalculatePilot (Stitch 1:1 redesign).
   2026 federal brackets & standard deductions (IRS Rev. Proc. 2025-32), SS 6.2% to $184,500 (SSA 2026),
   Medicare 1.45% + 0.9% over $200,000. 401(k) reduces income-tax wages only; Sec. 125 health, payroll HSA
   and commuter benefits reduce income-tax and FICA wages. State tax = flat rate on income-tax wages. */
(function(){
var C=window.CPX,$=C.$,v=C.val,mode='annual';
var BR={single:[[0,.10],[12400,.12],[50400,.22],[105700,.24],[201775,.32],[256225,.35],[640600,.37]],
  mfj:[[0,.10],[24800,.12],[100800,.22],[211400,.24],[403550,.32],[512450,.35],[768700,.37]],
  hoh:[[0,.10],[17700,.12],[67450,.22],[105700,.24],[201750,.32],[256200,.35],[640600,.37]],
  mfs:[[0,.10],[12400,.12],[50400,.22],[105700,.24],[201775,.32],[256225,.35],[384350,.37]]};
var STD={single:16100,mfs:16100,mfj:32200,hoh:24150},SS_BASE=184500;
var STATUS={single:'Alleinstehend',mfj:'Verheiratet, gemeinsame Veranlagung',mfs:'Verheiratet, getrennte Veranlagung',hoh:'Haushaltsvorstand'};
var FREQ={52:'Wöchentlich',26:'Bi-Weekly',24:'Semi-Monthly',12:'Monatlich'};

function M(x,dp){dp=dp===undefined?2:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function pc(x,dp){return isFinite(x)?x.toFixed(dp===undefined?1:dp)+'%':'—';}
function fedTax(ti,st){var b=BR[st],t=0,parts=[];for(var i=0;i<b.length;i++){var lo=b[i][0],hi=i+1<b.length?b[i+1][0]:Infinity,amt=Math.max(0,Math.min(ti,hi)-lo);t+=amt*b[i][1];parts.push({lo:lo,hi:hi,rate:b[i][1],amt:amt,tax:amt*b[i][1]});}return {tax:t,parts:parts};}

function inputs(){
  var st=$('state').value,rate=st==='none'?0:st==='il'?4.95:st==='pa'?3.07:Math.max(0,v('stRate')),hrs=Math.max(1,v('hrs')||40),pay=Math.max(0,v('pay'));
  return {G:$('mode').value==='hourly'?pay*hrs*52:pay,hrs:hrs,P:Math.max(1,v('freq')),status:$('status').value,st:st,stRate:rate,k401:Math.min(100,Math.max(0,v('k401'))),
    health:Math.max(0,v('health')),hsa:Math.max(0,v('hsa')),commute:Math.max(0,v('commute')),roth:Math.max(0,v('roth')),other:Math.max(0,v('other')),deps:Math.max(0,v('deps')),xtra:Math.max(0,v('xtra'))};
}

function calc(o,noPretax){
  var P=o.P,k=noPretax?0:o.G*o.k401/100,s125=noPretax?0:(o.health+o.hsa+o.commute)*P,itW=Math.max(0,o.G-k-s125),ficaW=Math.max(0,o.G-s125);
  var ti=Math.max(0,itW-STD[o.status]),f=fedTax(ti,o.status),fed=Math.max(0,f.tax-o.deps)+o.xtra*P;
  var ss=.062*Math.min(ficaW,SS_BASE),med=.0145*ficaW+.009*Math.max(0,ficaW-200000),state=itW*o.stRate/100,post=(o.roth+o.other)*P;
  var net=o.G-k-s125-fed-ss-med-state-post;
  return {k:k,s125:s125,itW:itW,ficaW:ficaW,ti:ti,parts:f.parts,fed:fed,ss:ss,med:med,state:state,post:post,net:net,taxes:fed+ss+med+state};
}

function compute(){
  var o=inputs(),r=calc(o),r0=calc(o,true),P=o.P,G=o.G||1;
  $('hrsRow').hidden=$('mode').value!=='hourly';C.text('payUnit',$('mode').value==='hourly'?'/hr':'/yr');
  C.text('hrBtn','Stündlich ('+M(o.G/(o.hrs*52))+'/hr)');
  $('stRow').hidden=o.st!=='custom';

  C.text('resultValue',M(r.net/P));C.text('perLbl','/ '+FREQ[P].toLowerCase()+' paycheck');C.text('annNet',M(r.net)+' / year');
  C.text('grossPer',M(o.G/P));C.text('grossNote','('+M(o.G,0)+' / '+P+' Zeiträume)');
  C.text('effRate',pc(r.taxes/G*100));C.text('dedRate',pc((o.G-r.net)/G*100));C.text('taxWages',M(r.itW/P));
  C.text('k401Amt',M(r.k/P)+'/pay');C.text('k401Pct',o.k401+'%');
  var sh=(r0.taxes-r.taxes)/P;C.text('shield','+'+M(sh));

  var seg=[['Nettogehalt',r.net,'var(--sx-pc)'],['Bundessteuer',r.fed,'var(--sx-primary)'],['FICA',r.ss+r.med,'var(--sx-secondary)'],['Staatssteuer',r.state,'var(--sx-outline)'],['Vorsteuer-Leistungen',r.k+r.s125,'var(--sx-fixed)'],['Post-Tax',r.post,'var(--sx-sch)']].filter(function(s){return s[1]>0.005;});
  $('distBar').innerHTML=seg.map(function(s){return '<span style="width:'+(s[1]/G*100)+'%;background:'+s[2]+'"></span>';}).join('');
  $('distLg').innerHTML=seg.map(function(s){return '<span><i style="background:'+s[2]+'"></i>'+s[0]+' ('+pc(s[1]/G*100)+')</span>';}).join('');

  C.text('cycleLbl',FREQ[P]+' Zahlungszyklus');
  var g=o.G/P,rows=[
    ['top','<span><span class="msym" aria-hidden="true">payments</span>Bruttoverdienst (Basis)</span>',M(g)+'<small>100.0%</small>'],
    ['h g','Zwischensumme Vorsteuer-Abzüge','−'+M((r.k+r.s125)/P)+'<small>'+pc((r.k+r.s125)/G*100)+'</small>'],
    ['sub','401(k) Traditional Deferral ('+o.k401+'%)','−'+M(r.k/P)],
    ['sub','Kranken-/Zahn-/Sehversicherung (Section 125)','−'+M(o.health)],
    ['sub','Health Savings Account (HSA) / FSA','−'+M(o.hsa)],
    ['sub','Pendler-Nahverkehr &amp; Parken','−'+M(o.commute)],
    ['h b','Steuerpflichtiges Bundes- &amp; Staatseinkommen',M(r.itW/P)],
    ['h','Zwischensumme gesetzliche Steuern','<b class="r" style="display:inline">−'+M(r.taxes/P)+'</b><small>'+pc(r.taxes/G*100)+'</small>'],
    ['sub','Einbehaltene Bundeseinkommensteuer (Form W-4)','−'+M(r.fed/P)],
    ['sub','Social Security (OASDI 6,2 %)','−'+M(r.ss/P)],
    ['sub','Medicare (1,45 %'+(r.ficaW>200000?' + 0.9%':'')+')','−'+M(r.med/P)],
    ['sub','Einkommensteuer des Bundesstaats ('+o.stRate+'%)','−'+M(r.state/P)]];
  if(r.post>0)rows.push(['h','Nachsteuer-Abzüge (Roth 401(k), Sonstiges)','−'+M(r.post/P)]);
  rows.push(['net','<span><span class="msym" aria-hidden="true">check_circle</span>Netto-Auszahlungsbetrag</span>',M(r.net/P)+'<small>'+pc(r.net/G*100)+'</small>']);
  $('items').innerHTML=rows.map(function(x){return '<li class="'+x[0]+'">'+(x[1].indexOf('<span')===0?x[1]:'<span>'+x[1]+'</span>')+'<b>'+x[2]+'</b></li>';}).join('');

  $('freqs').innerHTML=[[12,'Monatlich (12x)','/ month'],[24,'Halbmonatlich (24x)','/ pay period'],[26,'Zweiwöchentlich (26x)','/ pay period'],[52,'Wöchentlich (52x)','/ week']].map(function(f){return '<div'+(f[0]===P?' class="on"':'')+'><span>'+f[1]+'</span><b>'+M(r.net/f[0])+'</b><span>'+f[2]+'</span></div>';}).join('');

  C.text('brSub','Verlauf Ihres '+M(r.ti,0)+' zu versteuernden Einkommens durch die Stufen von 2026 '+STATUS[o.status]+' Steuerstufen.');
  C.text('brTag','IRS 2026 '+STATUS[o.status]+' Steuerstufen nach Standardabzug');
  var html='<div class="row"><div class="r"><span>Standardabzug ('+M(STD[o.status],0)+' steuerfrei)</span><b>$0.00 Bundessteuer</b></div><div class="t"><span style="width:'+(o.G>0?Math.min(100,STD[o.status]/Math.max(r.itW,1)*100):0)+'%;background:var(--sx-sf)"></span></div></div>';
  r.parts.forEach(function(p){if(p.amt<=0)return;var size=isFinite(p.hi)?p.hi-p.lo:p.amt;
    html+='<div class="row"><div class="r"><span>'+Math.round(p.rate*100)+'% Bundessteuerstufe ('+M(p.lo,0)+(isFinite(p.hi)?' – '+M(p.hi,0):'+')+')</span><b>'+M(p.tax)+' Bundessteuer</b></div><div class="t"><span style="width:'+Math.min(100,p.amt/size*100)+'%;background:var(--sx-pc)"></span></div></div>';});
  if(o.stRate>0)html+='<div class="row"><div class="r"><span>Einkommensteuer des Bundesstaats (pauschal '+o.stRate+'% auf '+M(r.itW,0)+')</span><b>'+M(r.state)+' Staatssteuer</b></div><div class="t"><span style="width:'+Math.min(100,o.stRate/10*100)+'%;background:var(--sx-outline)"></span></div></div>';
  if(o.deps>0)html+='<p class="sx-au-help" style="margin:-6px 0 12px">Abzüglich Form-W-4-Step-3-Gutschriften: −'+M(Math.min(o.deps,fedTax(r.ti,o.status).tax))+' pro Jahr.</p>';
  $('brRows').innerHTML=html;
  $('shieldTxt').innerHTML='<b>Realisierter Steuervorteil durch Vorsteuer-Abzüge:</b> Ihre '+M((r.k+r.s125)/P)+' an Vorsteuer-Abzügen sparen Ihnen <b>'+M(sh)+' an Steuern pro Gehaltsabrechnung</b> ('+M(sh*P,0)+'/year) by reducing your federal, state and — for Section 125 items — FICA taxes.';
  var er=.062*Math.min(r.ficaW,SS_BASE)+.0145*r.ficaW;C.text('erFica',M(er,0));C.text('erTotal',M(o.G+er,0));
  C.text('relBudget','Gliedern Sie Ihr '+M(r.net/P,0)+' Nettogehalt in Bedürfnisse, Wünsche und Ersparnisse.');
  mode=$('mode').value;
}

document.addEventListener('DOMContentLoaded',function(){
  mode=$('mode').value;
  /* switching annual/hourly converts the figure so pay itself doesn't change */
  $('mode').addEventListener('input',function(){var m=this.value;if(m===mode)return;var h=Math.max(1,v('hrs')||40),p=v('pay');$('pay').value=m==='hourly'?(p/(h*52)).toFixed(2):Math.round(p*h*52);mode=m;});
  C.init({root:'pcCalc',compute:compute});mode=$('mode').value;
  var px=$('ptx');px.querySelector('button').addEventListener('click',function(){var open=!px.classList.contains('open');px.classList.toggle('open',open);this.setAttribute('aria-expanded',String(open));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpPaycheck={calc:calc,fedTax:fedTax};
})();
