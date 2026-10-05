/* Debt-to-income calculator — CalculatePilot (Stitch 1:1 redesign).
   Front-end DTI = housing (P&I + tax + insurance + HOA/PMI) ÷ gross monthly income.
   Back-end DTI = (housing + all recurring debt payments) ÷ gross monthly income, compared with program guidelines. */
(function(){
var C=window.CPX,$=C.$,v=C.val,mode='month',last=null;
var P={conv:{n:'Convencional',f:28,b:36,x:50},fha:{n:'FHA',f:31,b:43,x:50},va:{n:'VA',f:null,b:41,x:50},jumbo:{n:'Jumbo',f:null,b:43,x:43}};
var DEBTS=[['auto','préstamo de auto'],['stu','préstamo estudiantil'],['cc','tarjeta de crédito'],['oth','préstamo personal'],['cs','manutención / pensión alimenticia']];

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('es-ES');}
function pc(x){return isFinite(x)?x.toFixed(1)+'%':'—';}

function scale(id,val,max,cuts,labels){
  var segs=[[0,cuts[0],'var(--sx-primary)'],[cuts[0],cuts[1],'#f5b53f'],[cuts[1],max,'#e2556b']];
  $(id+'T').innerHTML=segs.map(function(s){return '<span style="width:'+((s[1]-s[0])/max*100)+'%;background:'+s[2]+'"></span>';}).join('');
  $(id+'M').style.left=Math.min(100,Math.max(0,val/max*100))+'%';
  $(id+'L').innerHTML=labels.map(function(l){return '<span class="'+(l[2]||'')+'" style="left:'+(l[0]/max*100)+'%">'+l[1]+'</span>';}).join('');
}

function compute(){
  var inc=Math.max(0,v('inc')),g=$('mode').value==='year'?inc/12:inc,pr=P[$('prog').value];
  var house=['pi','ptax','hins','hoa'].reduce(function(s,k){return s+Math.max(0,v(k));},0),debts=DEBTS.map(function(d){return [d[1],Math.max(0,v(d[0]))];}),dsum=debts.reduce(function(s,d){return s+d[1];},0);
  var fe=g>0?house/g*100:0,be=g>0?(house+dsum)/g*100:0;last={g:g,house:house,dsum:dsum,fe:fe,be:be};
  C.text('yrBtn','Anual ('+M(g*12/1000).replace('$','$')+'k)');C.text('incAlt',$('mode').value==='year'?M(g)+' / month':M(g*12)+' / year');
  C.text('hTot',M(house)+' / mo');C.text('dTot',M(dsum)+' / mo');

  var feOK=pr.f===null||fe<=pr.f+1e-9,beOK=be<=pr.b+1e-9,ext=be<=pr.x+1e-9,gr=$('grade'),pl=$('pill');
  if(feOK&&beOK){C.text('resultValue','Calificación de aprobación: dentro de '+pr.n+' las pautas');C.text('gradeTxt','Ambas razones se sitúan dentro de la '+pr.n+' limits'+(pr.f?' ('+pr.f+'% / '+pr.b+'%)':' ('+pr.b+'% de razón final)')+'. Lenders also weigh credit score, reserves and employment.');gr.className='sx-dt-grade';pl.textContent='Listo según las pautas';pl.className='sx-ef-grade';}
  else if(ext){C.text('resultValue','Calificación de aprobación: posible con factores compensatorios');C.text('gradeTxt','Por encima de la '+pr.n+' pauta estándar, pero dentro del rango que la suscripción automatizada puede aprobar con buen crédito, reservas de efectivo o ingresos residuales.');gr.className='sx-dt-grade mid';pl.textContent='Requiere un perfil sólido';pl.className='sx-ef-grade mid';}
  else{C.text('resultValue','Calificación de aprobación: por encima de lo habitual '+pr.n+' los límites');C.text('gradeTxt','Tu razón final está por encima de lo que aceptan la mayoría de los '+pr.n+' programas. Reducir la deuda mensual o aumentar los ingresos mejoraría tus probabilidades de aprobación.');gr.className='sx-dt-grade hi';pl.textContent='DTI alto';pl.className='sx-ef-grade hi';}

  var fc=fe<=28?'':fe<=(pr.f||36)?'mid':'hi',bc=be<=36?'':be<=43?'mid':'hi';
  C.text('fe',pc(fe));$('fe').className=fc;$('feDot').className=fc;
  $('feS').innerHTML='<span class="msym" aria-hidden="true">'+(fc?'info':'shield')+'</span>'+(fe<=28?'Zona segura (≤28%)':pr.f===null?'Sin límite de razón inicial para '+pr.n:fe<=pr.f?'Dentro de '+pr.f+'% '+pr.n+' limit':'Por encima de '+(pr.f)+'% de la pauta');$('feS').className='s '+fc;
  C.text('be',pc(be));$('be').className=bc;$('beDot').className=bc;
  $('beS').innerHTML='<span class="msym" aria-hidden="true">'+(bc?'info':'verified')+'</span>'+(be<=36?'Riesgo bajo (≤36%)':be<=43?'Moderado (36–43%)':'Alto (por encima del 43%)');$('beS').className='s '+bc;
  scale('fe',fe,50,[28,36],[[0,'0%'],[28,'Referencia del 28%','b'],[50,'50%']]);
  scale('be',be,60,[36,43],[[0,'0%'],[36,'36% óptimo','b'],[43,'43% techo habitual','r'],[60,'60%']]);
  var cush=0.43*g-house-dsum;C.text('cush',(cush>=0?'':'−')+M(Math.abs(cush))+' / month'+(cush<0?' over':''));

  var tip;var sorted=debts.filter(function(d){return d[1]>0;}).sort(function(a,b){return a[1]-b[1];});
  var target=beOK?36:pr.b,hit=null;for(var k=0;k<sorted.length;k++){var nb=(house+dsum-sorted[k][1])/g*100;if(nb<=target){hit=[sorted[k],nb];break;}}
  if(!sorted.length)tip='No tienes deudas recurrentes que no sean de vivienda, por lo que tu razón final es igual a tu razón de vivienda. Reducir el pago de la vivienda (un préstamo menor o un pago inicial mayor) es la palanca aquí.';
  else if(hit)tip='Liquidar el '+M(hit[0][1])+'/mo '+hit[0][0]+' pago reduciría tu DTI final a '+pc(hit[1])+(target===36?', dentro de la referencia del 36% que los prestamistas consideran de bajo riesgo.':', llevándolo dentro de la '+pr.b+'% '+pr.n+' pauta.');
  else{var big=sorted[sorted.length-1],nb2=(house+dsum-big[1])/g*100;tip='Tu mayor pago de deuda es el '+M(big[1])+'/mo '+big[0]+'. Clearing it would lower your back-end DTI to '+pc(nb2)+'; necesitarías aproximadamente '+M(Math.max(0,(house+dsum)-target/100*g))+'/mo less debt (or '+M(Math.max(0,(house+dsum)/(target/100)-g))+'/mo more income) to reach '+target+'%.';}
  C.text('tip',tip);
  var tot=house+dsum;C.text('outT','Total de obligaciones mensuales: '+M(tot));C.text('outN',tot>0?'Compuesto por '+pc(house/tot*100)+' de vivienda y '+pc(dsum/tot*100)+' de otros pagos de deuda.':'No se han introducido obligaciones.');
  document.querySelectorAll('#mxBody tr').forEach(function(tr){tr.className=tr.getAttribute('data-p')===$('prog').value?'act':'';});
  mode=$('mode').value;
}

document.addEventListener('DOMContentLoaded',function(){
  mode=$('mode').value;
  $('mode').addEventListener('input',function(){var m=this.value;if(m===mode)return;var x=v('inc');$('inc').value=Math.round(m==='year'?x*12:x/12);mode=m;});
  C.init({root:'dtCalc',compute:compute});mode=$('mode').value;
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('dti-report.csv',[{h:'Concepto',key:'k'},{h:'Valor',key:'v'}],[{k:'Ingreso mensual bruto',v:Math.round(last.g)},{k:'Pagos de vivienda',v:Math.round(last.house)},{k:'Otros pagos de deuda',v:Math.round(last.dsum)},{k:'DTI inicial %',v:last.fe.toFixed(1)},{k:'DTI final %',v:last.be.toFixed(1)}]);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpDTI={};
})();
