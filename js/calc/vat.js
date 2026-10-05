/* VAT calculator — CalculatePilot (Stitch 1:1 redesign).
   Add: VAT = net × r, gross = net × (1 + r). Extract: net = gross ÷ (1 + r), VAT = gross − net (= gross × r/(1+r)).
   B2B: net payable = output VAT − input VAT. Cross-border B2B reverse charge: supplier charges 0%, customer self-accounts. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevC=null;
var J={
 GB:{n:'United Kingdom',s:'£',c:'GBP',auth:'HMRC',law:'VAT Act 1994 s.24',eu:0,t:[['Standard Rate',20,'Most goods and services'],['Reduced Rate',5,'Domestic fuel & energy, children\'s car seats'],['Zero-Rated',0,'Most food, books, children\'s clothing']],rc:'Imported B2B services; domestic RC for construction and some sectors'},
 DE:{n:'Germany (USt)',s:'€',c:'EUR',auth:'Finanzamt',law:'UStG',eu:1,t:[['Standard Rate',19,'Most goods and services'],['Reduced Rate',7,'Food, books, restaurant meals (from 2026)']],rc:'Intra-EU B2B services (Art. 196)'},
 FR:{n:'France (TVA)',s:'€',c:'EUR',auth:'DGFiP',law:'CGI',eu:1,t:[['Standard Rate',20,'Most goods and services'],['Intermediate',10,'Restaurants, transport, renovation'],['Reduced Rate',5.5,'Food, books, energy']],sr:'2.1% (some medicines, press)',rc:'Intra-EU B2B services (autoliquidation)'},
 IE:{n:'Ireland',s:'€',c:'EUR',auth:'Revenue',law:'VATCA 2010',eu:1,t:[['Standard Rate',23,'Most goods and services'],['Reduced Rate',13.5,'Fuel, building services, repairs'],['Second Reduced',9,'Newspapers, sports facilities, hospitality']],sr:'4.8% (livestock), 0%',rc:'Intra-EU B2B services (VIES check)'},
 ES:{n:'Spain (IVA)',s:'€',c:'EUR',auth:'AEAT',law:'LIVA',eu:1,t:[['Standard Rate',21,'Most goods and services'],['Reduced Rate',10,'Hospitality, transport, some food'],['Super-Reduced',4,'Bread, milk, books, medicines']],rc:'Intra-EU B2B services (inversión del sujeto pasivo)'},
 IT:{n:'Italy (IVA)',s:'€',c:'EUR',auth:'Agenzia delle Entrate',law:'DPR 633/1972',eu:1,t:[['Standard Rate',22,'Most goods and services'],['Reduced Rate',10,'Tourism, restaurants, some food'],['Super-Reduced',4,'Basic foods, books, newspapers']],sr:'4% (5% also applies to some items)',rc:'Intra-EU B2B services (inversione contabile)'},
 AU:{n:'Australia (GST)',s:'A$',c:'AUD',auth:'ATO',law:'GST Act 1999',eu:0,t:[['Standard GST',10,'Most goods and services'],['GST-Free',0,'Basic food, health, education']],rc:'Imported B2B services (partly creditable purchasers)'},
 NZ:{n:'New Zealand (GST)',s:'NZ$',c:'NZD',auth:'IRD',law:'GST Act 1985',eu:0,t:[['Standard GST',15,'Most goods and services'],['Zero-Rated',0,'Exports, some land transactions']],rc:'Imported B2B services'},
 AE:{n:'United Arab Emirates',s:'AED ',c:'AED',auth:'FTA',law:'Federal Decree-Law 8/2017',eu:0,t:[['Standard VAT',5,'Most goods and services'],['Zero-Rated',0,'Exports, some education & healthcare']],rc:'Imported B2B goods and services'}
};
var BENCH=[['🇬🇧','United Kingdom','GB','20%','5%','0% (zero-rate)',0,J.GB.rc],['🇩🇪','Germany (USt)','DE','19%','7%','—',1,J.DE.rc],['🇫🇷','France (TVA)','FR','20%','10% / 5.5%','2.1%',1,J.FR.rc],['🇮🇹','Italy (IVA)','IT','22%','10% / 5%','4%',1,J.IT.rc],['🇮🇪','Ireland','IE','23%','13.5% / 9%','4.8%',1,J.IE.rc],['🇪🇸','Spain (IVA)','ES','21%','10%','4%',1,J.ES.rc],['🇩🇰','Denmark (moms)','DK','25%','—','—',1,'Intra-EU B2B services'],['🇸🇪','Sweden (moms)','SE','25%','12% / 6%','—',1,'Intra-EU B2B services'],['🇭🇺','Hungary (ÁFA)','HU','27%','18% / 5%','—',1,'Intra-EU B2B services'],['🇦🇺','Australia (GST)','AU','10%','—','0% (GST-free)',0,J.AU.rc],['🇳🇿','New Zealand (GST)','NZ','15%','—','0% (zero-rated)',0,J.NZ.rc],['🇦🇪','United Arab Emirates','AE','5%','—','0% (zero-rated)',0,J.AE.rc]];

function F(x,s){if(!isFinite(x))return '—';return (x<0?'−':'')+s+Math.abs(x).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});}
function trim(n){return String(+n.toFixed(4));}

function compute(){
  var k=$('ctry').value,j=J[k]||J.GB;
  if(prevC!==null&&prevC!==k){$('rate').value=j.t[0][1];}prevC=k;
  var r=Math.max(0,v('rate')),add=$('mode').value==='s2',a=Math.max(0,v('amt')),prof=$('prof').value,s=j.s;
  $('tiers').innerHTML=j.t.map(function(t){return '<button type="button" data-for="rate" data-value="'+t[1]+'" aria-pressed="'+(Math.abs(r-t[1])<1e-9)+'"><span>'+t[0]+'</span><b>'+trim(t[1])+'%</b><small>'+t[2]+'</small></button>';}).join('');
  C.text('sym',s.trim());C.text('sym2',s.trim());C.text('iso',j.c);C.text('curL','Currency: '+j.c+' ('+s.trim()+')');C.text('amtL',add?'Net Amount (Before VAT)':'Gross Amount (VAT Included)');
  var rc=prof==='s3',re=rc?0:r/100,net=add?a:a/(1+r/100),vat=add?a*re:a-net;if(rc){net=a;vat=0;}
  var gross=net+vat,inV=prof==='s1'?0:Math.max(0,v('inV')),due=vat-inV;
  $('inRow').hidden=prof==='s1';
  C.text('tag',rc?'Reverse Charge':trim(r)+'% '+(j.t.filter(function(t){return Math.abs(t[1]-r)<1e-9;})[0]||['Custom'])[0]);
  C.text('resultValue',F(gross,s));C.text('net',F(net,s));C.text('vat',(rc?'0.00 (reverse charge)':'+'+F(vat,s)+' ('+trim(rc?0:r)+'%)'));
  $('led').hidden=prof==='s1';C.text('ledSrc',j.law);C.text('oV',F(vat,s));C.text('iV','−'+F(inV,s));
  C.text('remL',due>=0?'Net VAT Payable to '+j.auth:'Net VAT Reclaimable from '+j.auth);C.text('rem',F(Math.abs(due),s));
  var f=r>0?r/(100+r)*100:0;
  C.text('fx',add?'Gross = Net × (1 + r) ⇒ '+F(net,s)+' × '+trim(1+r/100)+' = '+F(net*(1+r/100),s):'Net = Gross ÷ (1 + r) ⇒ '+F(a,s)+' ÷ '+trim(1+r/100)+' = '+F(a/(1+r/100),s));
  C.text('fac','At a '+trim(r)+'% rate, VAT is '+trim(f)+'% of the VAT-inclusive price'+(r===20?' (exactly 1/6)':'')+' — not '+trim(r)+'%.');
  C.text('note',rc?'Reverse charge: invoice the net amount with no VAT, quote the customer\'s VAT number and state that the reverse charge applies. The customer accounts for the VAT.':j.eu?'B2B cross-border note: when supplying services to a VAT-registered business in another EU country, the reverse charge usually applies — verify the customer\'s VAT number on VIES.':'B2B cross-border note: services imported by a registered business are usually reverse-charged by the customer. Check '+j.auth+' guidance for your supply.');
  last={k:k,net:net,vat:vat,gross:gross,inV:inV,due:due,r:rc?0:r};
  var fl=$('flt').value;
  $('bTbl').innerHTML=BENCH.filter(function(b){return fl==='s1'||(fl==='s2'?b[6]:!b[6]);}).map(function(b){return '<tr'+(b[2]===k?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+b[0]+' '+b[1]+'</td><td>'+b[2]+'</td><td class="b">'+b[3]+'</td><td>'+b[4]+'</td><td>'+b[5]+'</td><td style="white-space:normal;font-family:inherit;font-size:12px"><span class="msym" aria-hidden="true" style="font-size:15px;color:var(--sx-pc);vertical-align:-3px">check_circle</span> '+b[7]+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'vtCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('vat-ledger.csv',[{h:'Item',key:'i'},{h:'Amount',key:'a'}],[{i:'Jurisdiction',a:last.k},{i:'Rate %',a:last.r},{i:'Net',a:last.net.toFixed(2)},{i:'VAT',a:last.vat.toFixed(2)},{i:'Gross',a:last.gross.toFixed(2)},{i:'Input VAT',a:last.inV.toFixed(2)},{i:'Net VAT payable',a:last.due.toFixed(2)}]);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpVat={J:J};
})();
