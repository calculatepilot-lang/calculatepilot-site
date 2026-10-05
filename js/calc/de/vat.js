/* VAT calculator — CalculatePilot (Stitch 1:1 redesign).
   Add: VAT = net × r, gross = net × (1 + r). Extract: net = gross ÷ (1 + r), VAT = gross − net (= gross × r/(1+r)).
   B2B: net payable = output VAT − input VAT. Cross-border B2B reverse charge: supplier charges 0%, customer self-accounts. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevC=null;
var J={
 GB:{n:'Vereinigtes Königreich',s:'£',c:'GBP',auth:'HMRC',law:'VAT Act 1994 s.24',eu:0,t:[['Regelsatz',20,'Die meisten Waren und Dienstleistungen'],['Ermäßigter Satz',5,'Haushaltsbrennstoffe &amp; Energie, Kinderautositze'],['Zero-Rated',0,'Die meisten Lebensmittel, Bücher, Kinderkleidung']],rc:'Importierte B2B-Dienstleistungen; inländisches Reverse-Charge-Verfahren für das Baugewerbe und einige Branchen'},
 DE:{n:'Deutschland (USt)',s:'€',c:'EUR',auth:'Finanzamt',law:'UStG',eu:1,t:[['Regelsatz',19,'Die meisten Waren und Dienstleistungen'],['Ermäßigter Satz',7,'Lebensmittel, Bücher, Restaurantmahlzeiten (ab 2026)']],rc:'Innergemeinschaftliche B2B-Dienstleistungen (Art. 196)'},
 FR:{n:'Frankreich (TVA)',s:'€',c:'EUR',auth:'DGFiP',law:'CGI',eu:1,t:[['Regelsatz',20,'Die meisten Waren und Dienstleistungen'],['Intermediate',10,'Restaurants, Transport, Renovierung'],['Ermäßigter Satz',5.5,'Lebensmittel, Bücher, Energie']],sr:'2,1 % (einige Arzneimittel, Presse)',rc:'Innergemeinschaftliche B2B-Dienstleistungen (autoliquidation)'},
 IE:{n:'Irland',s:'€',c:'EUR',auth:'Umsatz',law:'VATCA 2010',eu:1,t:[['Regelsatz',23,'Die meisten Waren und Dienstleistungen'],['Ermäßigter Satz',13.5,'Kraftstoff, Bauleistungen, Reparaturen'],['Zweiter ermäßigter Satz',9,'Zeitungen, Sportanlagen, Gastgewerbe']],sr:'4,8 % (Vieh), 0 %',rc:'Innergemeinschaftliche B2B-Dienstleistungen (VIES-Prüfung)'},
 ES:{n:'Spanien (IVA)',s:'€',c:'EUR',auth:'AEAT',law:'LIVA',eu:1,t:[['Regelsatz',21,'Die meisten Waren und Dienstleistungen'],['Ermäßigter Satz',10,'Gastgewerbe, Transport, einige Lebensmittel'],['Super-Reduced',4,'Brot, Milch, Bücher, Arzneimittel']],rc:'Innergemeinschaftliche B2B-Dienstleistungen (inversión del sujeto pasivo)'},
 IT:{n:'Italien (IVA)',s:'€',c:'EUR',auth:'Agenzia delle Entrate',law:'DPR 633/1972',eu:1,t:[['Regelsatz',22,'Die meisten Waren und Dienstleistungen'],['Ermäßigter Satz',10,'Tourismus, Restaurants, einige Lebensmittel'],['Super-Reduced',4,'Grundnahrungsmittel, Bücher, Zeitungen']],sr:'4 % (5 % gilt auch für einige Artikel)',rc:'Innergemeinschaftliche B2B-Dienstleistungen (inversione contabile)'},
 AU:{n:'Australien (GST)',s:'A$',c:'AUD',auth:'ATO',law:'GST Act 1999',eu:0,t:[['Normaler GST-Satz',10,'Die meisten Waren und Dienstleistungen'],['GST-Free',0,'Grundnahrungsmittel, Gesundheit, Bildung']],rc:'Importierte B2B-Dienstleistungen (teilweise vorsteuerabzugsberechtigte Erwerber)'},
 NZ:{n:'Neuseeland (GST)',s:'NZ$',c:'NZD',auth:'IRD',law:'GST Act 1985',eu:0,t:[['Normaler GST-Satz',15,'Die meisten Waren und Dienstleistungen'],['Zero-Rated',0,'Exporte, einige Grundstücksgeschäfte']],rc:'Importierte B2B-Dienstleistungen'},
 AE:{n:'Vereinigte Arabische Emirate',s:'AED ',c:'AED',auth:'FTA',law:'Federal Decree-Law 8/2017',eu:0,t:[['Normaler Mehrwertsteuersatz',5,'Die meisten Waren und Dienstleistungen'],['Zero-Rated',0,'Exporte, einige Bildungs- und Gesundheitsleistungen']],rc:'Importierte B2B-Waren und -Dienstleistungen'}
};
var BENCH=[['🇬🇧','Vereinigtes Königreich','GB','20%','5%','0 % (Nullsatz)',0,J.GB.rc],['🇩🇪','Deutschland (USt)','DE','19%','7%','—',1,J.DE.rc],['🇫🇷','Frankreich (TVA)','FR','20%','10% / 5.5%','2.1%',1,J.FR.rc],['🇮🇹','Italien (IVA)','IT','22%','10% / 5%','4%',1,J.IT.rc],['🇮🇪','Irland','IE','23%','13.5% / 9%','4.8%',1,J.IE.rc],['🇪🇸','Spanien (IVA)','ES','21%','10%','4%',1,J.ES.rc],['🇩🇰','Dänemark (moms)','DK','25%','—','—',1,'Innergemeinschaftliche B2B-Dienstleistungen'],['🇸🇪','Schweden (moms)','SE','25%','12% / 6%','—',1,'Innergemeinschaftliche B2B-Dienstleistungen'],['🇭🇺','Ungarn (ÁFA)','HU','27%','18% / 5%','—',1,'Innergemeinschaftliche B2B-Dienstleistungen'],['🇦🇺','Australien (GST)','AU','10%','—','0 % (GST-frei)',0,J.AU.rc],['🇳🇿','Neuseeland (GST)','NZ','15%','—','0 % (Nullsatz)',0,J.NZ.rc],['🇦🇪','Vereinigte Arabische Emirate','AE','5%','—','0 % (Nullsatz)',0,J.AE.rc]];

function F(x,s){if(!isFinite(x))return '—';return (x<0?'−':'')+s+Math.abs(x).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});}
function trim(n){return String(+n.toFixed(4));}

function compute(){
  var k=$('ctry').value,j=J[k]||J.GB;
  if(prevC!==null&&prevC!==k){$('rate').value=j.t[0][1];}prevC=k;
  var r=Math.max(0,v('rate')),add=$('mode').value==='s2',a=Math.max(0,v('amt')),prof=$('prof').value,s=j.s;
  $('tiers').innerHTML=j.t.map(function(t){return '<button type="button" data-for="rate" data-value="'+t[1]+'" aria-pressed="'+(Math.abs(r-t[1])<1e-9)+'"><span>'+t[0]+'</span><b>'+trim(t[1])+'%</b><small>'+t[2]+'</small></button>';}).join('');
  C.text('sym',s.trim());C.text('sym2',s.trim());C.text('iso',j.c);C.text('curL','Währung: '+j.c+' ('+s.trim()+')');C.text('amtL',add?'Nettobetrag (vor MwSt.)':'Bruttobetrag (inkl. MwSt.)');
  var rc=prof==='s3',re=rc?0:r/100,net=add?a:a/(1+r/100),vat=add?a*re:a-net;if(rc){net=a;vat=0;}
  var gross=net+vat,inV=prof==='s1'?0:Math.max(0,v('inV')),due=vat-inV;
  $('inRow').hidden=prof==='s1';
  C.text('tag',rc?'Reverse-Charge-Verfahren':trim(r)+'% '+(j.t.filter(function(t){return Math.abs(t[1]-r)<1e-9;})[0]||['Custom'])[0]);
  C.text('resultValue',F(gross,s));C.text('net',F(net,s));C.text('vat',(rc?'0,00 (Reverse Charge)':'+'+F(vat,s)+' ('+trim(rc?0:r)+'%)'));
  $('led').hidden=prof==='s1';C.text('ledSrc',j.law);C.text('oV',F(vat,s));C.text('iV','−'+F(inV,s));
  C.text('remL',due>=0?'Zahllast an '+j.auth:'Erstattungsanspruch gegenüber '+j.auth);C.text('rem',F(Math.abs(due),s));
  var f=r>0?r/(100+r)*100:0;
  C.text('fx',add?'Brutto = Netto × (1 + r) ⇒ '+F(net,s)+' × '+trim(1+r/100)+' = '+F(net*(1+r/100),s):'Netto = Brutto ÷ (1 + r) ⇒ '+F(a,s)+' ÷ '+trim(1+r/100)+' = '+F(a/(1+r/100),s));
  C.text('fac','Bei einem '+trim(r)+'% Satz beträgt die MwSt. '+trim(f)+'% des Preises inkl. MwSt.'+(r===20?' (genau 1/6)':'')+' — nicht '+trim(r)+'%.');
  C.text('note',rc?'Reverse Charge: Stellen Sie den Nettobetrag ohne MwSt. in Rechnung, geben Sie die USt-IdNr. des Kunden an und vermerken Sie, dass das Reverse-Charge-Verfahren gilt. Der Kunde schuldet die MwSt.':j.eu?'Hinweis zu grenzüberschreitendem B2B: Bei Dienstleistungen an ein umsatzsteuerlich registriertes Unternehmen in einem anderen EU-Land gilt in der Regel das Reverse-Charge-Verfahren — prüfen Sie die USt-IdNr. des Kunden im VIES.':'Hinweis zu grenzüberschreitendem B2B: Von einem registrierten Unternehmen importierte Dienstleistungen unterliegen in der Regel dem Reverse-Charge-Verfahren des Kunden. Prüfen Sie '+j.auth+' die Hinweise für Ihre Leistung.');
  last={k:k,net:net,vat:vat,gross:gross,inV:inV,due:due,r:rc?0:r};
  var fl=$('flt').value;
  $('bTbl').innerHTML=BENCH.filter(function(b){return fl==='s1'||(fl==='s2'?b[6]:!b[6]);}).map(function(b){return '<tr'+(b[2]===k?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+b[0]+' '+b[1]+'</td><td>'+b[2]+'</td><td class="b">'+b[3]+'</td><td>'+b[4]+'</td><td>'+b[5]+'</td><td style="white-space:normal;font-family:inherit;font-size:12px"><span class="msym" aria-hidden="true" style="font-size:15px;color:var(--sx-pc);vertical-align:-3px">check_circle</span> '+b[7]+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'vtCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('vat-ledger.csv',[{h:'Position',key:'i'},{h:'Menge',key:'a'}],[{i:'Jurisdiktion',a:last.k},{i:'Satz %',a:last.r},{i:'Netto',a:last.net.toFixed(2)},{i:'VAT',a:last.vat.toFixed(2)},{i:'Brutto',a:last.gross.toFixed(2)},{i:'Vorsteuer',a:last.inV.toFixed(2)},{i:'Zahllast (MwSt.)',a:last.due.toFixed(2)}]);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpVat={J:J};
})();
