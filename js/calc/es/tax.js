/* Income tax calculator — CalculatePilot (Stitch 1:1 redesign). Tax year 2026 (IRS Rev. Proc. 2025-32).
   Taxable income = wages − 401(k) − HSA − Section 125 − (standard or itemized deduction); or entered directly.
   Federal tax by bracket. FICA (wages mode only): Social Security 6.2% up to $184,500, Medicare 1.45% + 0.9% above $200,000
   ($250,000 MFJ, $125,000 MFS), on wages less HSA/Section 125 payroll deductions. State = rate × (wages − pre-tax), an estimate. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var B={s1:[12400,50400,105700,201775,256225,640600],s2:[24800,100800,211400,403550,512450,768700],s3:[12400,50400,105700,201775,256225,384350],s4:[17700,67450,105700,201750,256200,640600]};
var R=[.10,.12,.22,.24,.32,.35,.37],SD={s1:16100,s2:32200,s3:16100,s4:24150},AMT={s1:200000,s2:250000,s3:125000,s4:200000},NM={s1:'Soltero',s2:'Casado con declaración conjunta',s3:'Casado con declaración por separado',s4:'Cabeza de familia'};

function M(x,d){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}):'—';}
function P(x){return isFinite(x)?x.toFixed(2)+'%':'—';}
function fed(t,fs){var b=B[fs],lo=0,out=[],tax=0;for(var i=0;i<7;i++){var hi=i<6?b[i]:Infinity,s=Math.max(0,Math.min(t,hi)-lo);out.push({r:R[i],lo:lo,hi:hi,s:s,t:s*R[i]});tax+=s*R[i];lo=hi;}return {tax:tax,rows:out};}

function compute(){
  var fs=$('filingStatus').value,gm=$('mode').value==='s1',inc=Math.max(0,v('taxableIncome'));
  $('grossBox').style.display=gm?'flex':'none';C.text('incL',gm?'Salario bruto anual':'Ingreso gravable');C.text('incN',gm?'Salario y bonos (W-2)':'Después de deducciones');
  var k=gm?Math.max(0,v('k401')):0,h=gm?Math.max(0,v('hsa')):0,s=gm?Math.max(0,v('s125')):0,pre=Math.min(inc,k+h+s);
  var itm=$('ded').value==='s2',sd=SD[fs],dd=itm?Math.max(0,v('itm')):sd;
  $('itRow').hidden=!itm;C.text('sdL','Deducción estándar ('+M(sd)+')');C.text('sdN','Monto de 2026 para '+NM[fs].toLowerCase());
  var stv=$('st').value,stc=stv==='c';$('stRow').hidden=!stc;var sr=stc?Math.max(0,v('stR')):+stv;
  var agi=gm?inc-pre:inc,ti=gm?Math.max(0,agi-dd):inc,F=fed(ti,fs),ft=F.tax;
  var fw=gm?Math.max(0,inc-h-s):0,ss=Math.min(fw,184500)*.062,med=fw*.0145+Math.max(0,fw-AMT[fs])*.009,fica=ss+med,sttx=gm?Math.max(0,agi)*sr/100:0;
  var tot=ft+fica+sttx,base=gm?inc:inc,top=F.rows.filter(function(r){return r.s>0;}).pop();
  C.text('statT','2026 · '+NM[fs]);C.text('totL',gm?'Impuesto total estimado (federal + FICA + estatal)':'Impuesto federal sobre la renta del ingreso gravable');
  C.text('totTax',M(gm?tot:ft));C.text('outEffective',P(base?(gm?tot:ft)/base*100:0));C.text('resultValue',M(ft));C.text('outBracket',top?Math.round(top.r*100)+'%':'0%');
  C.text('fed',M(ft));C.text('fedN','Marginal '+(top?Math.round(top.r*100):0)+'% · '+P(base?ft/base*100:0)+' efec.');
  $('ficaC').style.display=gm?'':'none';$('stC').style.display=gm?'':'none';$('netC').style.display=gm?'':'none';$('shC').style.display=gm?'':'none';$('t3').className='sx-in-t4 '+(gm?'c3':'c1');
  C.text('fica',M(fica));C.text('ficaN','SS '+M(ss)+' + Medicare '+M(med));C.text('stt',M(sttx));C.text('sttN',sr?P(sr)+' of '+M(agi)+(stc?' (tu tasa)':''):'Sin impuesto estatal sobre la renta');
  var net=inc-pre-tot;C.text('net',M(net)+' / yr');C.text('netN',M(net/12)+' / month · '+P(inc?net/inc*100:0)+' del bruto');
  var parts=[['Take-home',net,'var(--sx-primary)'],['Ahorros antes de impuestos',pre,'#34d399'],['Federal',ft,'#f59e0b'],['FICA',fica,'#3b82f6'],['Estado',sttx,'#ef4444']].filter(function(p){return p[1]>0;});
  $('alBar').innerHTML=parts.map(function(p){return '<span style="width:'+(inc?p[1]/inc*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('alLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' '+(inc?(p[1]/inc*100).toFixed(1):'0.0')+'%</span>';}).join('');
  C.text('shT','Escudo total: '+M(pre));
  var noPre=fed(Math.max(0,inc-dd),fs).tax,ficaNo=Math.min(inc,184500)*.062+inc*.0145+Math.max(0,inc-AMT[fs])*.009,stNo=inc*sr/100,saved=(noPre-ft)+(ficaNo-fica)+(stNo-sttx);
  C.text('shTxt',pre?'Tu '+M(pre)+' de aportes antes de impuestos reducen el impuesto de este año en aproximadamente '+M(saved)+' (federal '+M(noPre-ft)+', FICA '+M(ficaNo-fica)+', estatal '+M(stNo-sttx)+') — un rendimiento inmediato del '+Math.round(saved/pre*100)+'% sobre esos dólares.':'No se introdujeron aportes antes de impuestos.');
  var lim=[];if(k>24500)lim.push('401(k) por encima del límite de $24,500 (se permite aporte de recuperación a partir de los 50)');if(h>8750)lim.push('HSA por encima del límite familiar de $8,750');C.text('limN',lim.length?'Comprobación: '+lim.join('; ')+'.':'Límites de 2026: 401(k) $24,500 (menores de 50); HSA $4,400 individual / $8,750 familiar.');
  C.text('brT','2026 '+NM[fs]);C.text('brN',gm?'Ingreso imponible '+M(ti)+' = '+M(inc)+' salarios − '+M(pre)+' antes de impuestos − '+M(dd)+' '+(itm?'itemized':'standard')+' deducción.':'Ingreso gravable de '+M(ti)+' en cada tramo de tasas de 2026.');
  var cum=0;last={rows:F.rows,ti:ti};
  $('tbl').innerHTML=F.rows.map(function(r){cum+=r.t;var act=top&&r===top;return '<tr'+(act?' class="pb"':'')+'><td style="font-family:inherit;font-weight:600">'+Math.round(r.r*100)+'%'+(act?' <small class="p">(marginal)</small>':'')+'</td><td>'+(r.hi===Infinity?'Más de '+M(r.lo):M(r.lo)+' — '+M(r.hi))+'</td><td>'+M(r.s)+'</td><td>'+M(r.t,2)+'</td><td>'+(r.s>0?M(cum,2):'—')+'</td></tr>';}).join('');
  var t2=top?top.r:0;C.text('myth','Con tus ingresos, los próximos $1,000 de ingreso gravable suman '+M(t2*1000)+' de impuesto federal, mientras que tu tasa federal efectiva se mantiene en '+P(ti?ft/ti*100:0)+' del ingreso gravable.');
  C.text('atl','Cada $1,000 aportados antes de impuestos ahorran aproximadamente '+M(1000*(t2+sr/100))+' de impuesto sobre la renta con tu tasa marginal de '+Math.round(t2*100)+'% federal'+(sr?' + '+(+sr)+'% estatal':'')+' tasa marginal.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'txCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('federal-tax-2026.csv',[{h:'Tipo',key:'r'},{h:'De',key:'lo'},{h:'To',key:'hi'},{h:'Ingreso en el tramo',key:'s'},{h:'Impuesto',key:'t'}],last.rows.map(function(x){return {r:Math.round(x.r*100)+'%',lo:x.lo,hi:x.hi===Infinity?'':x.hi,s:Math.round(x.s),t:x.t.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpTax={fed:fed};
})();
