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
var STATUS={single:'Célibataire',mfj:'Marié, déclaration commune',mfs:'Marié, déclaration séparée',hoh:'Chef de famille'};
var FREQ={52:'Hebdomadaire',26:'Bi-Weekly',24:'Semi-Monthly',12:'Mensuel'};

function M(x,dp){dp=dp===undefined?2:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
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
  C.text('hrBtn','Horaire ('+M(o.G/(o.hrs*52))+'/hr)');
  $('stRow').hidden=o.st!=='custom';

  C.text('resultValue',M(r.net/P));C.text('perLbl','/ '+FREQ[P].toLowerCase()+' paycheck');C.text('annNet',M(r.net)+' / year');
  C.text('grossPer',M(o.G/P));C.text('grossNote','('+M(o.G,0)+' / '+P+' périodes)');
  C.text('effRate',pc(r.taxes/G*100));C.text('dedRate',pc((o.G-r.net)/G*100));C.text('taxWages',M(r.itW/P));
  C.text('k401Amt',M(r.k/P)+'/pay');C.text('k401Pct',o.k401+'%');
  var sh=(r0.taxes-r.taxes)/P;C.text('shield','+'+M(sh));

  var seg=[['Salaire net',r.net,'var(--sx-pc)'],['Impôt fédéral',r.fed,'var(--sx-primary)'],['FICA',r.ss+r.med,'var(--sx-secondary)'],['Impôt de l\'État',r.state,'var(--sx-outline)'],['Avantages avant impôt',r.k+r.s125,'var(--sx-fixed)'],['Post-Tax',r.post,'var(--sx-sch)']].filter(function(s){return s[1]>0.005;});
  $('distBar').innerHTML=seg.map(function(s){return '<span style="width:'+(s[1]/G*100)+'%;background:'+s[2]+'"></span>';}).join('');
  $('distLg').innerHTML=seg.map(function(s){return '<span><i style="background:'+s[2]+'"></i>'+s[0]+' ('+pc(s[1]/G*100)+')</span>';}).join('');

  C.text('cycleLbl',FREQ[P]+' Cycle de paie');
  var g=o.G/P,rows=[
    ['top','<span><span class="msym" aria-hidden="true">payments</span>Revenus bruts (référence)</span>',M(g)+'<small>100.0%</small>'],
    ['h g','Sous-total des déductions avant impôt','−'+M((r.k+r.s125)/P)+'<small>'+pc((r.k+r.s125)/G*100)+'</small>'],
    ['sub','Cotisation 401(k) traditionnelle ('+o.k401+'%)','−'+M(r.k/P)],
    ['sub','Médical / dentaire / optique (Section 125)','−'+M(o.health)],
    ['sub','Compte épargne santé (HSA) / FSA','−'+M(o.hsa)],
    ['sub','Transports domicile-travail et stationnement','−'+M(o.commute)],
    ['h b','Salaires imposables fédéral et État',M(r.itW/P)],
    ['h','Sous-total des impôts obligatoires','<b class="r" style="display:inline">−'+M(r.taxes/P)+'</b><small>'+pc(r.taxes/G*100)+'</small>'],
    ['sub','Retenue d\'impôt fédéral sur le revenu (formulaire W-4)','−'+M(r.fed/P)],
    ['sub','Social Security (OASDI 6,2 %)','−'+M(r.ss/P)],
    ['sub','Medicare (1,45 %'+(r.ficaW>200000?' + 0.9%':'')+')','−'+M(r.med/P)],
    ['sub','Impôt de l\'État sur le revenu ('+o.stRate+'%)','−'+M(r.state/P)]];
  if(r.post>0)rows.push(['h','Déductions après impôt (Roth 401(k), autres)','−'+M(r.post/P)]);
  rows.push(['net','<span><span class="msym" aria-hidden="true">check_circle</span>Salaire net perçu</span>',M(r.net/P)+'<small>'+pc(r.net/G*100)+'</small>']);
  $('items').innerHTML=rows.map(function(x){return '<li class="'+x[0]+'">'+(x[1].indexOf('<span')===0?x[1]:'<span>'+x[1]+'</span>')+'<b>'+x[2]+'</b></li>';}).join('');

  $('freqs').innerHTML=[[12,'Mensuel (12x)','/ month'],[24,'Bimensuel (24x)','/ pay period'],[26,'Toutes les deux semaines (26x)','/ pay period'],[52,'Hebdomadaire (52x)','/ week']].map(function(f){return '<div'+(f[0]===P?' class="on"':'')+'><span>'+f[1]+'</span><b>'+M(r.net/f[0])+'</b><span>'+f[2]+'</span></div>';}).join('');

  C.text('brSub','Progression de votre '+M(r.ti,0)+' revenu imposable à travers les tranches 2026 '+STATUS[o.status]+' de l\'impôt.');
  C.text('brTag','Tranches IRS 2026 '+STATUS[o.status]+' après déduction forfaitaire');
  var html='<div class="row"><div class="r"><span>Déduction forfaitaire ('+M(STD[o.status],0)+' exonéré)</span><b>0,00 $ d\'impôt fédéral</b></div><div class="t"><span style="width:'+(o.G>0?Math.min(100,STD[o.status]/Math.max(r.itW,1)*100):0)+'%;background:var(--sx-sf)"></span></div></div>';
  r.parts.forEach(function(p){if(p.amt<=0)return;var size=isFinite(p.hi)?p.hi-p.lo:p.amt;
    html+='<div class="row"><div class="r"><span>'+Math.round(p.rate*100)+'% de tranche fédérale ('+M(p.lo,0)+(isFinite(p.hi)?' – '+M(p.hi,0):'+')+')</span><b>'+M(p.tax)+' d\'impôt fédéral</b></div><div class="t"><span style="width:'+Math.min(100,p.amt/size*100)+'%;background:var(--sx-pc)"></span></div></div>';});
  if(o.stRate>0)html+='<div class="row"><div class="r"><span>Impôt de l\'État sur le revenu (taux unique '+o.stRate+' % sur '+M(r.itW,0)+')</span><b>'+M(r.state)+' d\'impôt de l\'État</b></div><div class="t"><span style="width:'+Math.min(100,o.stRate/10*100)+'%;background:var(--sx-outline)"></span></div></div>';
  if(o.deps>0)html+='<p class="sx-au-help" style="margin:-6px 0 12px">Moins les crédits de l\'étape 3 du formulaire W-4 : −'+M(Math.min(o.deps,fedTax(r.ti,o.status).tax))+' par an.</p>';
  $('brRows').innerHTML=html;
  $('shieldTxt').innerHTML='<b>Économie d\'impôt réalisée grâce aux déductions avant impôt :</b> vos '+M((r.k+r.s125)/P)+' de déductions avant impôt vous font économiser <b>'+M(sh)+' d\'impôts par paie</b> ('+M(sh*P,0)+'/year) by reducing your federal, state and — for Section 125 items — FICA taxes.';
  var er=.062*Math.min(r.ficaW,SS_BASE)+.0145*r.ficaW;C.text('erFica',M(er,0));C.text('erTotal',M(o.G+er,0));
  C.text('relBudget','Répartissez votre '+M(r.net/P,0)+' salaire net entre besoins, envies et épargne.');
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
