/* VAT calculator — CalculatePilot (Stitch 1:1 redesign).
   Add: VAT = net × r, gross = net × (1 + r). Extract: net = gross ÷ (1 + r), VAT = gross − net (= gross × r/(1+r)).
   B2B: net payable = output VAT − input VAT. Cross-border B2B reverse charge: supplier charges 0%, customer self-accounts. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevC=null;
var J={
 GB:{n:'Reino Unido',s:'£',c:'GBP',auth:'HMRC',law:'VAT Act 1994 s.24',eu:0,t:[['Tipo estándar',20,'La mayoría de bienes y servicios'],['Tipo reducido',5,'Combustible y energía doméstica, asientos de coche para niños'],['Zero-Rated',0,'La mayoría de alimentos, libros, ropa infantil']],rc:'Servicios B2B importados; inversión del sujeto pasivo nacional en construcción y algunos sectores'},
 DE:{n:'Alemania (USt)',s:'€',c:'EUR',auth:'Finanzamt',law:'UStG',eu:1,t:[['Tipo estándar',19,'La mayoría de bienes y servicios'],['Tipo reducido',7,'Alimentos, libros, comidas en restaurantes (desde 2026)']],rc:'Servicios B2B intracomunitarios (art. 196)'},
 FR:{n:'Francia (TVA)',s:'€',c:'EUR',auth:'DGFiP',law:'CGI',eu:1,t:[['Tipo estándar',20,'La mayoría de bienes y servicios'],['Intermedio',10,'Restaurantes, transporte, reformas'],['Tipo reducido',5.5,'Alimentos, libros, energía']],sr:'2,1 % (algunos medicamentos, prensa)',rc:'Servicios B2B intracomunitarios (autoliquidación)'},
 IE:{n:'Irlanda',s:'€',c:'EUR',auth:'Ingresos',law:'VATCA 2010',eu:1,t:[['Tipo estándar',23,'La mayoría de bienes y servicios'],['Tipo reducido',13.5,'Combustible, servicios de construcción, reparaciones'],['Segundo tipo reducido',9,'Periódicos, instalaciones deportivas, hostelería']],sr:'4,8 % (ganado), 0 %',rc:'Servicios B2B intracomunitarios (comprobación VIES)'},
 ES:{n:'España (IVA)',s:'€',c:'EUR',auth:'AEAT',law:'LIVA',eu:1,t:[['Tipo estándar',21,'La mayoría de bienes y servicios'],['Tipo reducido',10,'Hostelería, transporte, algunos alimentos'],['Super-Reduced',4,'Pan, leche, libros, medicamentos']],rc:'Servicios B2B intracomunitarios (inversión del sujeto pasivo)'},
 IT:{n:'Italia (IVA)',s:'€',c:'EUR',auth:'Agenzia delle Entrate',law:'DPR 633/1972',eu:1,t:[['Tipo estándar',22,'La mayoría de bienes y servicios'],['Tipo reducido',10,'Turismo, restaurantes, algunos alimentos'],['Super-Reduced',4,'Alimentos básicos, libros, periódicos']],sr:'4 % (también se aplica un 5 % a algunos artículos)',rc:'Servicios B2B intracomunitarios (inversione contabile)'},
 AU:{n:'Australia (GST)',s:'A$',c:'AUD',auth:'ATO',law:'GST Act 1999',eu:0,t:[['GST estándar',10,'La mayoría de bienes y servicios'],['GST-Free',0,'Alimentos básicos, salud, educación']],rc:'Servicios B2B importados (compradores parcialmente acreditables)'},
 NZ:{n:'Nueva Zelanda (GST)',s:'NZ$',c:'NZD',auth:'IRD',law:'GST Act 1985',eu:0,t:[['GST estándar',15,'La mayoría de bienes y servicios'],['Zero-Rated',0,'Exportaciones, algunas transacciones de terrenos']],rc:'Servicios B2B importados'},
 AE:{n:'Emiratos Árabes Unidos',s:'AED ',c:'AED',auth:'FTA',law:'Federal Decree-Law 8/2017',eu:0,t:[['IVA estándar',5,'La mayoría de bienes y servicios'],['Zero-Rated',0,'Exportaciones, parte de la educación y la sanidad']],rc:'Bienes y servicios B2B importados'}
};
var BENCH=[['🇬🇧','Reino Unido','GB','20%','5%','0 % (tipo cero)',0,J.GB.rc],['🇩🇪','Alemania (USt)','DE','19%','7%','—',1,J.DE.rc],['🇫🇷','Francia (TVA)','FR','20%','10% / 5.5%','2.1%',1,J.FR.rc],['🇮🇹','Italia (IVA)','IT','22%','10% / 5%','4%',1,J.IT.rc],['🇮🇪','Irlanda','IE','23%','13.5% / 9%','4.8%',1,J.IE.rc],['🇪🇸','España (IVA)','ES','21%','10%','4%',1,J.ES.rc],['🇩🇰','Dinamarca (moms)','DK','25%','—','—',1,'Servicios B2B intracomunitarios'],['🇸🇪','Suecia (moms)','SE','25%','12% / 6%','—',1,'Servicios B2B intracomunitarios'],['🇭🇺','Hungría (ÁFA)','HU','27%','18% / 5%','—',1,'Servicios B2B intracomunitarios'],['🇦🇺','Australia (GST)','AU','10%','—','0 % (exento de GST)',0,J.AU.rc],['🇳🇿','Nueva Zelanda (GST)','NZ','15%','—','0 % (tipo cero)',0,J.NZ.rc],['🇦🇪','Emiratos Árabes Unidos','AE','5%','—','0 % (tipo cero)',0,J.AE.rc]];

function F(x,s){if(!isFinite(x))return '—';return (x<0?'−':'')+s+Math.abs(x).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2});}
function trim(n){return String(+n.toFixed(4));}

function compute(){
  var k=$('ctry').value,j=J[k]||J.GB;
  if(prevC!==null&&prevC!==k){$('rate').value=j.t[0][1];}prevC=k;
  var r=Math.max(0,v('rate')),add=$('mode').value==='s2',a=Math.max(0,v('amt')),prof=$('prof').value,s=j.s;
  $('tiers').innerHTML=j.t.map(function(t){return '<button type="button" data-for="rate" data-value="'+t[1]+'" aria-pressed="'+(Math.abs(r-t[1])<1e-9)+'"><span>'+t[0]+'</span><b>'+trim(t[1])+'%</b><small>'+t[2]+'</small></button>';}).join('');
  C.text('sym',s.trim());C.text('sym2',s.trim());C.text('iso',j.c);C.text('curL','Moneda: '+j.c+' ('+s.trim()+')');C.text('amtL',add?'Importe neto (antes del IVA)':'Importe bruto (IVA incluido)');
  var rc=prof==='s3',re=rc?0:r/100,net=add?a:a/(1+r/100),vat=add?a*re:a-net;if(rc){net=a;vat=0;}
  var gross=net+vat,inV=prof==='s1'?0:Math.max(0,v('inV')),due=vat-inV;
  $('inRow').hidden=prof==='s1';
  C.text('tag',rc?'Inversión del sujeto pasivo':trim(r)+'% '+(j.t.filter(function(t){return Math.abs(t[1]-r)<1e-9;})[0]||['Custom'])[0]);
  C.text('resultValue',F(gross,s));C.text('net',F(net,s));C.text('vat',(rc?'0.00 (inversión del sujeto pasivo)':'+'+F(vat,s)+' ('+trim(rc?0:r)+'%)'));
  $('led').hidden=prof==='s1';C.text('ledSrc',j.law);C.text('oV',F(vat,s));C.text('iV','−'+F(inV,s));
  C.text('remL',due>=0?'IVA neto a pagar a '+j.auth:'IVA neto a recuperar de '+j.auth);C.text('rem',F(Math.abs(due),s));
  var f=r>0?r/(100+r)*100:0;
  C.text('fx',add?'Bruto = Neto × (1 + r) ⇒ '+F(net,s)+' × '+trim(1+r/100)+' = '+F(net*(1+r/100),s):'Neto = Bruto ÷ (1 + r) ⇒ '+F(a,s)+' ÷ '+trim(1+r/100)+' = '+F(a/(1+r/100),s));
  C.text('fac','Con una '+trim(r)+'% de tipo, el IVA es '+trim(f)+'% del precio con IVA incluido'+(r===20?' (exactamente 1/6)':'')+' — no '+trim(r)+'%.');
  C.text('note',rc?'Inversión del sujeto pasivo: factura el importe neto sin IVA, indica el número de IVA del cliente y señala que se aplica la inversión del sujeto pasivo. El cliente declara el IVA.':j.eu?'Nota sobre B2B transfronterizo: cuando prestas servicios a una empresa registrada a efectos de IVA en otro país de la UE, normalmente se aplica la inversión del sujeto pasivo; verifica el número de IVA del cliente en VIES.':'Nota sobre B2B transfronterizo: los servicios importados por una empresa registrada normalmente los autoliquida el cliente. Consulta '+j.auth+' la guía para tu operación.');
  last={k:k,net:net,vat:vat,gross:gross,inV:inV,due:due,r:rc?0:r};
  var fl=$('flt').value;
  $('bTbl').innerHTML=BENCH.filter(function(b){return fl==='s1'||(fl==='s2'?b[6]:!b[6]);}).map(function(b){return '<tr'+(b[2]===k?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+b[0]+' '+b[1]+'</td><td>'+b[2]+'</td><td class="b">'+b[3]+'</td><td>'+b[4]+'</td><td>'+b[5]+'</td><td style="white-space:normal;font-family:inherit;font-size:12px"><span class="msym" aria-hidden="true" style="font-size:15px;color:var(--sx-pc);vertical-align:-3px">check_circle</span> '+b[7]+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'vtCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('vat-ledger.csv',[{h:'Concepto',key:'i'},{h:'Cantidad',key:'a'}],[{i:'Jurisdicción',a:last.k},{i:'Tipo %',a:last.r},{i:'Netas',a:last.net.toFixed(2)},{i:'VAT',a:last.vat.toFixed(2)},{i:'Bruto',a:last.gross.toFixed(2)},{i:'IVA soportado',a:last.inV.toFixed(2)},{i:'IVA neto a pagar',a:last.due.toFixed(2)}]);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpVat={J:J};
})();
