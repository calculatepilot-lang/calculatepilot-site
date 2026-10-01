/* House affordability calculator — CalculatePilot (Stitch 1:1 redesign).
   Allowed housing payment = min(gross × front, gross × back − debts). Max price P solves
   P&I(P − down) + P × tax% / 12 + insurance / 12 + PMI (if down < 20%) = allowed payment (bisection). */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var STD={conv:[.28,.36,'Estándar 28/36'],fha:[.31,.43,'31/43 FHA'],aggr:[.36,.45,'36/45 Agresivo']};

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('es-ES');}
function R(x){return Math.round(x/1000)*1000;}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}

function inputs(){
  return {income:Math.max(0,v('income')),down:Math.max(0,v('down')),debts:Math.max(0,v('debts')),rate:Math.max(0,v('rate')),term:Math.max(1,v('term')),tax:Math.max(0,v('tax')),ins:Math.max(0,v('ins')),pmi:Math.max(0,v('pmi')),std:$('std').value};
}
function parts(o,P,rate){var loan=Math.max(0,P-o.down),pi=pmt(loan,rate,o.term*12),tx=P*o.tax/100/12,ins=o.ins/12,pm=o.down<0.2*P?loan*o.pmi/100/12:0;return {loan:loan,pi:pi,tx:tx,ins:ins,pm:pm,total:pi+tx+ins+pm};}
function solve(o,front,back,income,rate){
  income=income===undefined?o.income:income;rate=rate===undefined?o.rate:rate;
  var g=income/12,A=Math.max(0,Math.min(g*front,back===Infinity?Infinity:g*back-o.debts)),lo=0,hi=Math.max(1e5,o.down+1e8);
  if(parts(o,0,rate).total>A)return {P:0,A:A,frontBinds:g*front<=g*back-o.debts};
  for(var k=0;k<80;k++){var mid=(lo+hi)/2;if(parts(o,mid,rate).total<=A)lo=mid;else hi=mid;}
  return {P:lo,A:A,frontBinds:back===Infinity||g*front<=g*back-o.debts};
}

function compute(){
  var o=inputs(),s=STD[o.std],r=solve(o,s[0],s[1]),P=r.P,p=parts(o,P,o.rate),g=o.income/12;
  C.text('incNote','≈ '+M(g)+' / month gross');
  C.text('resultValue',M(R(P)));C.text('loan',M(R(p.loan)));C.text('dpOut',M(o.down)+' ('+(P>0?(o.down/P*100).toFixed(1):'0')+'%)');
  C.text('bind',r.frontBinds?'Limita el límite de gastos de vivienda':'Limita el límite de endeudamiento total');
  C.text('piti',M(p.total));var t=p.total||1;
  $('pitiBar').innerHTML=[[p.pi,'var(--sx-primary)'],[p.tx,'var(--sx-fdim)'],[p.ins,'var(--sx-sch)'],[p.pm,'var(--sx-ov)']].map(function(x){return '<span style="width:'+(x[0]/t*100)+'%;background:'+x[1]+'"></span>';}).join('');
  C.text('oPI',M(p.pi));C.text('oTax',M(p.tx));C.text('oIns',M(p.ins));C.text('oPmi',p.pm>0?M(p.pm):'$0 (entrada de 20 % o más)');
  C.text('incMo','Ingresos: '+M(g)+' / mo');
  var fe=g>0?p.total/g*100:0,be=g>0?(p.total+o.debts)/g*100:0;
  function tag(id,val,lim){var e=$(id);if(val<=lim*100-2){e.textContent='Saludable (límite '+Math.round(lim*100)+'%)';e.className='';}else if(val<=lim*100+0.05){e.textContent='En el límite ('+Math.round(lim*100)+'%)';e.className='mid';}else{e.textContent='Por encima del límite ('+Math.round(lim*100)+'%)';e.className='hi';}}
  C.text('fe',fe.toFixed(1)+'%');C.text('be',be.toFixed(1)+'%');tag('feTag',fe,s[0]);tag('beTag',be,s[1]);
  C.text('beLbl','DTI total (vivienda + '+M(o.debts)+' deudas)');
  $('feBar').style.width=Math.min(100,fe/s[0])+'%';$('beBar').style.width=Math.min(100,be/s[1])+'%';
  $('feBar').className=fe>s[0]*100+0.05?'hi':'';$('beBar').className=be>s[1]*100+0.05?'hi':'';

  C.text('t1',M(R(solve(o,.25,.36).P)));C.text('t2',M(R(P)));C.text('t2l','Seleccionado ('+s[2].split(' ')[0]+')');C.text('t2t',s[2]+' referencia.');C.text('t3',M(R(solve(o,Infinity,.43).P)));
  document.querySelectorAll('#dpChips button').forEach(function(b){b.setAttribute('aria-pressed',String(P>0&&Math.abs(o.down/P*100-parseFloat(b.getAttribute('data-dp')))<0.6));});

  var incs=[o.income-20000,o.income,o.income+20000].filter(function(x){return x>0;}),rates=[o.rate-0.5,o.rate,o.rate+0.5].filter(function(x){return x>=0;});
  C.text('mxRule',s[2]);C.text('mxSub','Cómo cambia el poder adquisitivo según los ingresos y el tipo de interés ('+M(o.down)+' de entrada como base).');
  $('mxHead').innerHTML='<th scope="col">Ingresos del hogar</th><th scope="col">Límite mensual ('+Math.round(s[0]*100)+'%)</th>'+rates.map(function(x){return '<th scope="col">Capacidad @ '+x.toFixed(2)+'% TAE</th>';}).join('')+'<th scope="col">Diferencia (±50 pb)</th>';
  $('mxBody').innerHTML=incs.map(function(inc){var caps=rates.map(function(rt){return R(solve(o,s[0],s[1],inc,rt).P);}),act=inc===o.income,d=caps[caps.length-1]-caps[0];
    return '<tr'+(act?' class="act"':'')+'><td>'+M(inc)+' / yr'+(act?'<span class="act">Activa</span>':'')+'</td><td>'+M(inc/12*s[0])+' / mo</td>'+caps.map(function(c){return '<td>'+M(c)+'</td>';}).join('')+'<td class="bad">'+(d<0?'−':'+')+M(Math.abs(d))+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'haCalc',compute:compute});
  /* down-payment % chips: find the down payment that is exactly that share of the resulting max price */
  $('dpChips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var pct=parseFloat(b.getAttribute('data-dp'))/100,o=inputs(),s=STD[o.std];
    for(var k=0;k<40;k++){var P=solve(o,s[0],s[1]).P;o.down=pct*P;}
    $('down').value=Math.ceil(o.down/100)*100;$('down').dispatchEvent(new Event('input',{bubbles:true}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpHouseAfford={solve:solve,parts:parts};
})();
