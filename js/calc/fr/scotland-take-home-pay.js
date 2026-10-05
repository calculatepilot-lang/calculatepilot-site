/* Scotland take-home pay calculator — CalculatePilot (Stitch 1:1 redesign). Tax year 2026/27.
   Scottish non-savings income tax on taxable income after the personal allowance (£12,570, tapered £1 per £2 above £100,000):
   starter 19% on £3,967, basic 20% on £12,989, intermediate 21% on £14,136, higher 42% on £31,338, advanced 45% to £125,140, top 48%.
   rUK: 20% on £37,700, 40%, 45% from £125,140. Employee Class 1 NI: 8% £12,570–£50,270, 2% above.
   Student loans: monthly pay above threshold × rate, rounded down to £1 (Plan 1 £2,241, Plan 2 £2,448, Plan 4 £2,816, Plan 5 £2,083, PGL £1,750 @ 6%).
   Salary sacrifice reduces pay for tax, NI and student loan. Relief at source: contribution paid from net pay, 20% relief added in the pension;
   the pension-scheme band extension that gives Scottish 21%+ taxpayers extra relief is noted, not claimed. Benefits in kind are taxable, not NI-able. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var PA=12570,TAPER_FROM=100000,BASIC_WIDTH=37700,ADD_FROM=125140,NI_PT=12570,NI_UEL=50270;
var SB=[['Taux de départ (Starter)',3967,.19],['Taux de base',12989,.20],['Taux intermédiaire',14136,.21],['Taux supérieur',31338,.42]];
var PLANS={plan1:{m:2241,r:.09,n:'Plan 1'},plan2:{m:2448,r:.09,n:'Plan 2'},plan4:{m:2816,r:.09,n:'Plan 4 Écosse'},plan5:{m:2083,r:.09,n:'Plan 5'}},PGL={m:1750,r:.06};

function pence(n){return Math.round(n*100)/100;}
function G(x){return isFinite(x)?(x<0?'−£':'£')+Math.abs(x).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function G0(x){return '£'+Math.round(x).toLocaleString('en-GB');}
function pa(i){return i<=TAPER_FROM?PA:Math.max(0,PA-Math.floor((i-TAPER_FROM)/2));}
function scot(i){var t=Math.max(0,i-pa(i)),left=t,out=[],cum=0,lo=0;
  SB.forEach(function(b){var s=Math.min(left,b[1]);out.push({n:b[0],r:b[2],s:s,t:s*b[2],lo:lo,w:b[1]});left-=s;lo+=b[1];});
  var used=lo,adv=Math.min(Math.max(0,t-used),Math.max(0,ADD_FROM-used)),top=Math.max(0,t-ADD_FROM);
  out.push({n:'Taux avancé',r:.45,s:adv,t:adv*.45,lo:used,w:ADD_FROM-used});out.push({n:'Taux maximal',r:.48,s:top,t:top*.48,lo:ADD_FROM,w:Infinity});
  var tax=pence(out.reduce(function(a,b){return a+b.t;},0));return {tax:tax,bands:out,taxable:t,pa:pa(i)};}
function ruk(i){var a=pa(i),t=Math.max(0,i-a),addFrom=ADD_FROM-a,b=Math.min(t,BASIC_WIDTH),h=Math.min(Math.max(0,t-BASIC_WIDTH),Math.max(0,addFrom-BASIC_WIDTH)),ad=Math.max(0,t-Math.max(BASIC_WIDTH,addFrom));return pence(b*.2+h*.4+ad*.45);}
function ni(i){return pence(.08*Math.max(0,Math.min(i,NI_UEL)-NI_PT)+.02*Math.max(0,i-NI_UEL));}
function slice(mp,p){return Math.floor(pence(Math.max(0,pence(mp-p.m))*p.r));}

function compute(){
  var gross=Math.max(0,v('salary')),pct=Math.max(0,Math.min(40,v('pension'))),ss=$('pm').value==='s1',bik=Math.max(0,v('bik')),f=+$('freq').value||12;
  var contrib=pence(gross*pct/100),pay=ss?pence(gross-contrib):gross,taxInc=pay+bik;
  var S=scot(taxInc),tax=S.tax,rk=ruk(taxInc),delta=pence(tax-rk),n=ni(pay),mp=pence(pay/12),k=$('plan').value,ug=k==='none'?null:PLANS[k];
  var sl=((ug?slice(mp,ug):0)+($('alsoPgl').checked?slice(mp,PGL):0))*12,net=pence(pay-tax-n-sl-(ss?0:contrib));
  var per=function(x){return x/f;},lbl=f===1?'/ year':f===12?'/ month':'/ week';
  C.text('resultValue',G(per(net)));C.text('perT',lbl);C.text('retTag',(gross?(net/gross*100).toFixed(1):'0.0')+'% du brut conservé');
  $('altP').innerHTML=[[1,'year'],[12,'month'],[52,'week']].filter(function(x){return x[0]!==f;}).map(function(x){return '<b>'+G(net/x[0])+'</b> / '+x[1];}).join(' · ');
  C.text('penOut',G0(contrib)+'/yr');C.text('paNote','Abattement personnel '+G0(S.pa)+(S.pa<PA?' (dégressif au-delà de 100 000 £)':' (taux de 0 %)')+'. Taxable income '+G0(S.taxable)+'.');
  C.text('outTax','−'+G(tax));C.text('taxE',taxInc?'('+(tax/taxInc*100).toFixed(2)+'% eff.)':'');C.text('outNi','−'+G(n));
  C.text('penL','Retraite ('+pct+'%, '+(ss?'sacrifice de salaire':'avantage fiscal à la source — net')+')');C.text('outPen',contrib?'−'+G(contrib):'—');
  C.text('slL','Prêt étudiant'+(ug?' ('+ug.n+')':'')+($('alsoPgl').checked?' + PGL':''));C.text('outSl',sl?'−'+G(sl):'—');
  var ded=tax+n+sl+contrib;C.text('outDed',G(ded)+' ('+(gross?(ded/gross*100).toFixed(2):'0.00')+'%)');
  C.text('outDelta',delta===0?'£0.00':G(Math.abs(delta))+' / year '+(delta>0?'more':'less'));
  var note='Estimation annualisée 2026/27 ; le PAYE réel peut différer de quelques livres chaque mois.';
  if(delta>0)note='L’impôt écossais sur le revenu est '+G(delta)+' par an plus élevé qu’en Angleterre, au Pays de Galles et en Irlande du Nord sur ce revenu — les taux intermédiaire de 21 % et supérieur de 42 % l’emportent sur la tranche d’entrée de 19 %. L’assurance nationale est identique. '+note;
  else if(delta<0)note='L’impôt écossais sur le revenu est '+G(-delta)+' par an plus bas qu’en Angleterre, au Pays de Galles et en Irlande du Nord sur ce revenu, grâce à la tranche d’entrée de 19 %. L’assurance nationale est identique. '+note;
  if(!ss&&contrib)note+=' Votre prestataire de retraite ajoute '+G(contrib*.25)+' l’avantage fiscal au taux de base'+(taxInc>29526?' ; vous pouvez demander un avantage supplémentaire auprès de HMRC à votre taux écossais':'')+'.';
  if(bik)note+=' Les avantages en nature sont imposés mais n’entraînent aucune cotisation d’assurance nationale salariale.';
  C.text('outNote',note);
  C.text('bandN','Revenu imposable '+G0(S.taxable)+' après une '+G0(S.pa)+' abattement personnel'+(ss&&contrib?' (gross '+G0(gross)+' less '+G0(contrib)+' sacrifice de salaire'+(bik?', plus '+G0(bik)+' benefits':'')+')':bik?' (includes '+G0(bik)+' avantages en nature)':'')+'.');
  var cum=0,paRow='<tr><td style="font-family:inherit;font-weight:600">Abattement personnel</td><td>0 £ — '+G0(S.pa)+'</td><td>0 %</td><td>0,00 £</td><td>0,00 £</td><td><span class="sx-an-ph">Exonéré</span></td></tr>',active=null;
  S.bands.forEach(function(b,i){if(b.s>0)active=i;});
  $('tbl').innerHTML=paRow+S.bands.map(function(b,i){cum+=b.t;var lo=S.pa+b.lo+1,hi=b.w===Infinity?null:S.pa+b.lo+b.w;if(b.n==='Advanced Rate'){hi=ADD_FROM;}if(b.n==='Top Rate')lo=ADD_FROM+1;
    var st=b.s<=0?'Intact':i===active?'Marginal actif':'Plafonné';
    return '<tr'+(i===active?' class="pb"':'')+'><td style="font-family:inherit;font-weight:600">'+b.n+(i===active?' (marginal)':'')+'</td><td>'+(hi===null?'Sur '+G0(lo-1):G0(lo)+' — '+G0(hi))+'</td><td>'+Math.round(b.r*100)+'%</td><td>'+G(b.t)+(i===active&&b.s<b.w?' <small class="p">(sur '+G0(b.s)+')</small>':'')+'</td><td>'+(b.s>0?G(cum):'—')+'</td><td><span class="sx-an-ph'+(st==='Active Marginal'?' p':st==='Maxed'?' a':'')+'">'+st+'</span></td></tr>';}).join('');
  last={gross:gross,tax:tax,rk:rk,n:n,sl:sl,contrib:contrib,net:net};
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'spCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var L=last;C.csv('scotland-vs-ruk-take-home.csv',[{h:'Élément',key:'i'},{h:'Écosse',key:'s'},{h:'Angleterre, Pays de Galles et Irlande du Nord',key:'r'}],[{i:'Salaire brut',s:L.gross,r:L.gross},{i:'Impôt sur le revenu',s:L.tax,r:L.rk},{i:'Assurance nationale',s:L.n,r:L.n},{i:'Prêt étudiant',s:L.sl,r:L.sl},{i:'Retraite',s:L.contrib,r:L.contrib},{i:'Take-home',s:L.net,r:pence(L.net+L.tax-L.rk)}]);});
  $('calcForm').addEventListener('submit',function(e){e.preventDefault();});
});
window.cpScotPay={scot:scot,ruk:ruk,ni:ni};
})();
