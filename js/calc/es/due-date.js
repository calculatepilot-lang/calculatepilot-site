/* Pregnancy due date calculator — CalculatePilot (redesign, PSEO standards).
   LMP: EDD = LMP + 280 + (cycle − 28). Conception: + 266. IVF: transfer + 266 − embryo age (3/5/6).
   GA counted from LMP-equivalent (EDD − 280). Trimesters: ≤13w6d, 14w0d–27w6d, ≥28w0d. ACOG term: early 37w0d–38w6d,
   full 39w0d–40w6d, late 41w0d–41w6d, post ≥42w0d. Dates parsed as local calendar dates (no UTC shift). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
function P(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function A(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;}
function ISO(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function F(d){return d.toLocaleDateString('es-ES',{weekday:'short',month:'short',day:'numeric',year:'numeric'});}
function DD(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);}
var MS=[['Fin del primer trimestre','13w6d',97],['Ecografía morfológica (periodo habitual)','18w0d–22w0d',126,154],['Prueba de detección de diabetes gestacional','24w0d–28w0d',168,196],['Comienza el tercer trimestre','28w0d',196],['Prueba de detección del estreptococo del grupo B','36w0d–37w6d',252,265],['A término temprano','37w0d',259],['A término completo','39w0d',273],['Fecha de vencimiento','40w0d',280],['A término tardío','41w0d',287],['Post-term','42w0d',294]];

function compute(){
  var m=$('m').value,today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  $('cRow').hidden=m!=='s1';$('eRow').hidden=m!=='s3';
  C.text('dL',m==='s1'?'Primer día de la última menstruación':m==='s2'?'Fecha de concepción':'Fecha de transferencia del embrión');
  if(!$('d').value)$('d').value=ISO(A(today,-70));
  var d=P($('d').value);if(!d)return;
  var edd=m==='s1'?A(d,280+(Math.round(v('cl')||28)-28)):m==='s2'?A(d,266):A(d,266-{s1:3,s2:5,s3:6}[$('ea').value]);
  var lmp=A(edd,-280),ga=DD(lmp,today),w=Math.floor(ga/7),dy=ga%7,left=DD(today,edd);
  C.text('resultValue',F(edd));C.text('tag',m==='s1'?'Naegele (FUM)':m==='s2'?'Desde la concepción':'Transferencia de FIV');
  C.text('rN',m==='s1'?'Primer día de la última regla + 280 días'+((v('cl')||28)!==28?' '+((v('cl')-28)>0?'+ ':'− ')+Math.abs(v('cl')-28)+' días para un '+v('cl')+'ciclo de -días':'')+'.':m==='s2'?'Fecha de concepción + 266 días (38 semanas).':'Fecha de transferencia + '+(266-{s1:3,s2:5,s3:6}[$('ea').value])+' días para un '+{s1:'day-3',s2:'day-5',s3:'day-6'}[$('ea').value]+' embrión.');
  var wn=$('warn');
  if(ga<0){C.text('ga','Aún sin embarazo en estas fechas');C.text('tri','—');}
  else if(ga>300){C.text('ga',w+' weeks');C.text('tri','Pasadas las 42 semanas');}
  else{C.text('ga',w+' weeks '+dy+' day'+(dy===1?'':'s'));C.text('tri',ga<98?'Primeros':ga<196?'Segundo':'Tercer');}
  C.text('left',left>=0?left+' days':Math.abs(left)+' días después de');C.text('ft',F(A(lmp,273)).replace(/^\w+, /,'')+' – '+F(A(lmp,286)).replace(/^\w+, /,''));
  wn.textContent=ga>=294?'Las 42 semanas o más se consideran postérmino: contacta con tu equipo médico si aún no lo has hecho.':m==='s1'&&(v('cl')<21||v('cl')>35)?'Con ciclos fuera del rango de 21–35 días, la datación por FUM es menos fiable: una ecografía temprana ofrece una mejor estimación.':'Solo una estimación: tu equipo médico puede ajustar tu fecha de parto tras una ecografía temprana.';
  C.text('tbT','Parto '+F(edd).replace(/^\w+, /,''));
  $('msTbl').innerHTML=MS.map(function(x){var d1=A(lmp,x[2]),d2=x[3]?A(lmp,x[3]):null,past=DD(d2||d1,today)>0,now=ga>=x[2]&&ga<=(x[3]||x[2]);return '<tr'+(x[2]===280?' class="hl"':'')+(past&&x[2]!==280?' style="opacity:.6"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+(now?' <small class="p">(ahora)</small>':'')+'</td><td>'+x[1]+'</td><td class="b" style="font-family:inherit">'+(d2?F(d1).replace(/^\w+, /,'')+' – '+F(d2).replace(/^\w+, /,''):F(d1).replace(/^\w+, /,''))+'</td></tr>';}).join('');
  last='Fecha estimada de parto: '+F(edd)+'\nToday: '+(ga>=0?w+'w'+dy+'d':'—')+'\n— calculatepilot.com/health/due-date-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ddCalc',compute:compute});
  $('d').addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar fechas');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
