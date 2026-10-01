/* 1031 exchange calculator — CalculatePilot (Stitch 1:1 redesign).
   Adjusted basis = purchase + improvements − depreciation. Realized gain = sale − costs − basis.
   Tax on gain G: recapture part min(G, depreciation) × recapture rate; rest × LTCG rate; NIIT 3.8% × G (optional); state × G.
   Exchange: equity = sale − costs − old debt; cash in = replacement − new debt; cash boot = max(0, equity − cash in);
   mortgage boot = max(0, old debt − new debt − max(0, cash in − equity)); recognized = min(G, cash boot + mortgage boot).
   Deferred tax = tax(G) − tax(recognized). New basis = replacement price − deferred gain. Deadlines: closing + 45 / + 180 days. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('es-ES'):'—';}
function M2(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function tax(g,o){g=Math.max(0,g);var rec=Math.min(g,o.dep)*o.rc,cg=Math.max(0,g-o.dep)*o.cg,ni=o.niit?g*.038:0,st=g*o.st;return {rec:rec,cg:cg,ni:ni,st:st,t:rec+cg+ni+st};}
function addDays(d,n){var x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;}
function fmtD(d){return isNaN(d)?'—':d.toLocaleDateString('es-ES',{month:'short',day:'numeric',year:'numeric'});}

function compute(){
  var g=function(id){return Math.max(0,v(id));},o={dep:g('dep'),rc:g('rc')/100,cg:+$('cg').value/100,st:g('st')/100,niit:$('niit').checked};
  var basis=g('buy')+g('imp')-o.dep,sale=g('sale'),exp=g('exp'),od=g('odebt'),rep=g('rep'),nd=g('ndebt'),inv=$('inv').checked;
  var netSale=sale-exp,gain=netSale-basis,equity=netSale-od,cashIn=rep-nd,cashBoot=Math.max(0,equity-cashIn),mortBoot=Math.max(0,od-nd-Math.max(0,cashIn-equity));
  var boot=cashBoot+mortBoot,recog=inv?Math.min(Math.max(0,gain),boot):Math.max(0,gain),T=tax(gain,o),Tr=tax(recog,o),def=T.t-Tr.t,defGain=Math.max(0,gain)-recog;
  C.text('expP',sale?(exp/sale*100).toFixed(1)+'% de la venta':'');
  C.text('repN',rep>=netSale?'≥ precio neto de venta '+M(netSale)+(rep>netSale?' (+'+M(rep-netSale)+' cambio a una propiedad de mayor valor)':''):'Por debajo del precio neto de venta '+M(netSale)+' by '+M(netSale-rep));
  C.text('debtN',nd>=od?'Cubre la '+M(od)+' deuda cancelada':cashIn-equity>=od-nd?'Déficit compensado con '+M(cashIn-equity)+' efectivo adicional':'La deuda baja en '+M(od-nd)+' — boot hipotecario');
  var full=inv&&gain>0&&recog===0;
  C.text('verd',!inv?'No elegible — propiedad de uso personal':gain<=0?'No hay ganancia que diferir':full?'Diferimiento fiscal total':'Diferimiento parcial — boot gravable');
  C.text('bootT',inv?(boot>0?'Boot '+M(boot):'Boot gravable cero'):'—');
  C.text('resultValue',M(inv?def:0));
  $('defN').innerHTML=!inv?'La Sección 1031 solo se aplica a propiedades mantenidas con fines de inversión o de negocio.':gain<=0?'La venta no muestra ganancia después de los costos, así que no hay impuesto que diferir.':(full?'Todos los <b>'+M(T.t)+'</b> de impuesto sobre la '+M(gain)+' ganancia se difieren a la propiedad de reemplazo.':'<b>'+M(Tr.t)+'</b> se debe ahora sobre '+M(recog)+' de ganancia reconocida por el boot; el resto se difiere.');
  C.text('gainT','Ganancia '+M(gain));C.text('t1L','Recuperación de depreciación ('+Math.round(o.rc*100)+'% sobre '+M(Math.min(Math.max(0,gain),o.dep))+')');C.text('t1',M(T.rec));
  C.text('t2L','Ganancias de capital federales ('+Math.round(o.cg*100)+'%)');C.text('t2',M(T.cg));C.text('t3',o.niit?M(T.ni):'No se aplica');C.text('t4L','Impuesto estatal ('+(o.st*100).toFixed(1)+'%)');C.text('t4',M(T.st));C.text('tt',M(T.t));
  var eqX=equity-(inv?Tr.t:T.t),eqS=equity-T.t;C.text('eq1',M(eqX));C.text('eq2',M(eqS));
  C.text('eqN',inv&&def>0?'+'+M(eqX-eqS)+' más para invertir (+'+(eqS>0?((eqX-eqS)/eqS*100).toFixed(1):'—')+'%) al diferir el impuesto. Base de la propiedad de reemplazo: '+M(rep-defGain)+'.':'Con estas cifras no hay beneficio por diferir.');
  var ok=function(b){return b?'<span style="color:var(--sx-pc)">✓ Cumple</span>':'<span style="color:var(--sx-err)">✗ Revisar</span>';};
  var r1=rep>=netSale,r2=mortBoot===0,r3=cashBoot===0;$('r1').innerHTML=ok(r1);$('r2').innerHTML=ok(r2);$('r3').innerHTML=ok(r3);$('r4').innerHTML=ok(inv);
  C.text('rulesT',[r1,r2,r3,inv].filter(Boolean).length+' de 4 cumplidos');
  var d=new Date(($('close').value||'')+'T00:00:00');C.text('d45',fmtD(addDays(d,45)));C.text('d180',fmtD(addDays(d,180)));C.text('r200',M(sale*2));
  var rows=[['Precio de venta',sale,sale],['Costos de venta y de intercambio',-exp,-exp],['Base ajustada',basis,basis],['Ganancia realizada',gain,gain],['Ganancia reconocida (gravable)',Math.max(0,gain),recog],['Impuesto por recuperación de depreciación',-T.rec,-Tr.rec],['Impuesto federal sobre ganancias de capital',-T.cg,-Tr.cg],['Impuesto sobre ingresos netos de inversión',-T.ni,-Tr.ni],['Impuesto estatal',-T.st,-Tr.st],['Impuesto total a pagar ahora',-T.t,-Tr.t],['Capital en efectivo para reinvertir',eqS,eqX]];
  last={rows:rows};C.text('ledT',full?'Diferimiento total':inv?'Diferimiento parcial':'No elegible');
  $('tbl').innerHTML=rows.map(function(r,k){var big=k===rows.length-1||k===9,d2=r[2]-r[1];return '<tr'+(k===rows.length-1?' class="hl"':'')+'><td style="font-family:inherit;font-weight:'+(big?700:600)+'">'+r[0]+'</td><td>'+M2(r[1])+'</td><td>'+M2(r[2])+'</td><td class="'+(d2>0.005?'pos':d2<-0.005?'r':'mu')+'">'+(Math.abs(d2)<0.005?'—':(d2>0?'+':'')+M2(d2))+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  try{var t=new Date();$('close').value=t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);}catch(e){}
  C.init({root:'xcCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('1031-exchange.csv',[{h:'Concepto',key:'a'},{h:'Venta imponible',key:'b'},{h:'Intercambio 1031',key:'c'}],last.rows.map(function(r){return {a:r[0],b:r[1].toFixed(2),c:r[2].toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cp1031={tax:tax};
})();
