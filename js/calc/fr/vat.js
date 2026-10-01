/* VAT calculator — CalculatePilot (Stitch 1:1 redesign).
   Add: VAT = net × r, gross = net × (1 + r). Extract: net = gross ÷ (1 + r), VAT = gross − net (= gross × r/(1+r)).
   B2B: net payable = output VAT − input VAT. Cross-border B2B reverse charge: supplier charges 0%, customer self-accounts. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevC=null;
var J={
 GB:{n:'Royaume-Uni',s:'£',c:'GBP',auth:'HMRC',law:'VAT Act 1994 s.24',eu:0,t:[['Taux normal',20,'La plupart des biens et services'],['Taux réduit',5,'Carburant et énergie domestiques, sièges auto pour enfants'],['Zero-Rated',0,'La plupart des aliments, livres, vêtements pour enfants']],rc:'Services B2B importés ; autoliquidation nationale pour la construction et certains secteurs'},
 DE:{n:'Allemagne (USt)',s:'€',c:'EUR',auth:'Finanzamt',law:'UStG',eu:1,t:[['Taux normal',19,'La plupart des biens et services'],['Taux réduit',7,'Alimentation, livres, repas au restaurant (à partir de 2026)']],rc:'Services B2B intra-UE (art. 196)'},
 FR:{n:'France (TVA)',s:'€',c:'EUR',auth:'DGFiP',law:'CGI',eu:1,t:[['Taux normal',20,'La plupart des biens et services'],['Intermédiaire',10,'Restaurants, transports, rénovation'],['Taux réduit',5.5,'Alimentation, livres, énergie']],sr:'2,1 % (certains médicaments, presse)',rc:'Services B2B intra-UE (autoliquidation)'},
 IE:{n:'Irlande',s:'€',c:'EUR',auth:'Chiffre d’affaires',law:'VATCA 2010',eu:1,t:[['Taux normal',23,'La plupart des biens et services'],['Taux réduit',13.5,'Carburant, services de construction, réparations'],['Second taux réduit',9,'Journaux, installations sportives, hôtellerie-restauration']],sr:'4,8 % (bétail), 0 %',rc:'Services B2B intra-UE (vérification VIES)'},
 ES:{n:'Espagne (IVA)',s:'€',c:'EUR',auth:'AEAT',law:'LIVA',eu:1,t:[['Taux normal',21,'La plupart des biens et services'],['Taux réduit',10,'Hôtellerie-restauration, transports, certains aliments'],['Super-Reduced',4,'Pain, lait, livres, médicaments']],rc:'Services B2B intra-UE (inversión del sujeto pasivo)'},
 IT:{n:'Italie (IVA)',s:'€',c:'EUR',auth:'Agenzia delle Entrate',law:'DPR 633/1972',eu:1,t:[['Taux normal',22,'La plupart des biens et services'],['Taux réduit',10,'Tourisme, restaurants, certains aliments'],['Super-Reduced',4,'Aliments de base, livres, journaux']],sr:'4 % (5 % s\'applique aussi à certains articles)',rc:'Services B2B intra-UE (inversione contabile)'},
 AU:{n:'Australie (GST)',s:'A$',c:'AUD',auth:'ATO',law:'GST Act 1999',eu:0,t:[['GST standard',10,'La plupart des biens et services'],['GST-Free',0,'Aliments de base, santé, éducation']],rc:'Services B2B importés (acheteurs partiellement crédités)'},
 NZ:{n:'Nouvelle-Zélande (GST)',s:'NZ$',c:'NZD',auth:'IRD',law:'GST Act 1985',eu:0,t:[['GST standard',15,'La plupart des biens et services'],['Zero-Rated',0,'Exportations, certaines transactions foncières']],rc:'Services B2B importés'},
 AE:{n:'Émirats arabes unis',s:'AED ',c:'AED',auth:'FTA',law:'Federal Decree-Law 8/2017',eu:0,t:[['TVA standard',5,'La plupart des biens et services'],['Zero-Rated',0,'Exportations, certains services d\'éducation et de santé']],rc:'Biens et services B2B importés'}
};
var BENCH=[['🇬🇧','Royaume-Uni','GB','20%','5%','0 % (taux zéro)',0,J.GB.rc],['🇩🇪','Allemagne (USt)','DE','19%','7%','—',1,J.DE.rc],['🇫🇷','France (TVA)','FR','20%','10% / 5.5%','2.1%',1,J.FR.rc],['🇮🇹','Italie (IVA)','IT','22%','10% / 5%','4%',1,J.IT.rc],['🇮🇪','Irlande','IE','23%','13.5% / 9%','4.8%',1,J.IE.rc],['🇪🇸','Espagne (IVA)','ES','21%','10%','4%',1,J.ES.rc],['🇩🇰','Danemark (moms)','DK','25%','—','—',1,'Services B2B intra-UE'],['🇸🇪','Suède (moms)','SE','25%','12% / 6%','—',1,'Services B2B intra-UE'],['🇭🇺','Hongrie (ÁFA)','HU','27%','18% / 5%','—',1,'Services B2B intra-UE'],['🇦🇺','Australie (GST)','AU','10%','—','0 % (exonéré de GST)',0,J.AU.rc],['🇳🇿','Nouvelle-Zélande (GST)','NZ','15%','—','0 % (taux zéro)',0,J.NZ.rc],['🇦🇪','Émirats arabes unis','AE','5%','—','0 % (taux zéro)',0,J.AE.rc]];

function F(x,s){if(!isFinite(x))return '—';return (x<0?'−':'')+s+Math.abs(x).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});}
function trim(n){return String(+n.toFixed(4));}

function compute(){
  var k=$('ctry').value,j=J[k]||J.GB;
  if(prevC!==null&&prevC!==k){$('rate').value=j.t[0][1];}prevC=k;
  var r=Math.max(0,v('rate')),add=$('mode').value==='s2',a=Math.max(0,v('amt')),prof=$('prof').value,s=j.s;
  $('tiers').innerHTML=j.t.map(function(t){return '<button type="button" data-for="rate" data-value="'+t[1]+'" aria-pressed="'+(Math.abs(r-t[1])<1e-9)+'"><span>'+t[0]+'</span><b>'+trim(t[1])+'%</b><small>'+t[2]+'</small></button>';}).join('');
  C.text('sym',s.trim());C.text('sym2',s.trim());C.text('iso',j.c);C.text('curL','Devise : '+j.c+' ('+s.trim()+')');C.text('amtL',add?'Montant HT (avant TVA)':'Montant brut (TVA incluse)');
  var rc=prof==='s3',re=rc?0:r/100,net=add?a:a/(1+r/100),vat=add?a*re:a-net;if(rc){net=a;vat=0;}
  var gross=net+vat,inV=prof==='s1'?0:Math.max(0,v('inV')),due=vat-inV;
  $('inRow').hidden=prof==='s1';
  C.text('tag',rc?'Autoliquidation':trim(r)+'% '+(j.t.filter(function(t){return Math.abs(t[1]-r)<1e-9;})[0]||['Custom'])[0]);
  C.text('resultValue',F(gross,s));C.text('net',F(net,s));C.text('vat',(rc?'0.00 (autoliquidation)':'+'+F(vat,s)+' ('+trim(rc?0:r)+'%)'));
  $('led').hidden=prof==='s1';C.text('ledSrc',j.law);C.text('oV',F(vat,s));C.text('iV','−'+F(inV,s));
  C.text('remL',due>=0?'TVA nette à payer à '+j.auth:'TVA nette récupérable auprès de '+j.auth);C.text('rem',F(Math.abs(due),s));
  var f=r>0?r/(100+r)*100:0;
  C.text('fx',add?'Brut = Net × (1 + r) ⇒ '+F(net,s)+' × '+trim(1+r/100)+' = '+F(net*(1+r/100),s):'Net = Brut ÷ (1 + r) ⇒ '+F(a,s)+' ÷ '+trim(1+r/100)+' = '+F(a/(1+r/100),s));
  C.text('fac','À un '+trim(r)+'% de taux, la TVA représente '+trim(f)+'% du prix TVA incluse'+(r===20?' (exactement 1/6)':'')+' — et non '+trim(r)+'%.');
  C.text('note',rc?'Autoliquidation : facturez le montant net sans TVA, indiquez le numéro de TVA du client et précisez que l\'autoliquidation s\'applique. Le client déclare la TVA.':j.eu?'Note sur les opérations B2B transfrontalières : pour des services fournis à une entreprise assujettie à la TVA dans un autre pays de l\'UE, l\'autoliquidation s\'applique généralement — vérifiez le numéro de TVA du client sur VIES.':'Note sur les opérations B2B transfrontalières : les services importés par une entreprise immatriculée sont généralement autoliquidés par le client. Consultez '+j.auth+' les consignes applicables à votre opération.');
  last={k:k,net:net,vat:vat,gross:gross,inV:inV,due:due,r:rc?0:r};
  var fl=$('flt').value;
  $('bTbl').innerHTML=BENCH.filter(function(b){return fl==='s1'||(fl==='s2'?b[6]:!b[6]);}).map(function(b){return '<tr'+(b[2]===k?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+b[0]+' '+b[1]+'</td><td>'+b[2]+'</td><td class="b">'+b[3]+'</td><td>'+b[4]+'</td><td>'+b[5]+'</td><td style="white-space:normal;font-family:inherit;font-size:12px"><span class="msym" aria-hidden="true" style="font-size:15px;color:var(--sx-pc);vertical-align:-3px">check_circle</span> '+b[7]+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'vtCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('vat-ledger.csv',[{h:'Élément',key:'i'},{h:'Quantité',key:'a'}],[{i:'Juridiction',a:last.k},{i:'Taux %',a:last.r},{i:'Net',a:last.net.toFixed(2)},{i:'VAT',a:last.vat.toFixed(2)},{i:'Brut',a:last.gross.toFixed(2)},{i:'TVA déductible',a:last.inV.toFixed(2)},{i:'TVA nette à payer',a:last.due.toFixed(2)}]);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpVat={J:J};
})();
