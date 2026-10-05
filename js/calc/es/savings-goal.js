/* Savings goal calculator — CalculatePilot (Stitch 1:1 redesign).
   Monthly rate r = (1 + APY)^(1/12) − 1. Fixed timeframe: P = (Goal − S(1+r)^n) ÷ [((1+r)^n − 1)/r × (1+r if deposits at start)].
   Fixed budget: months until the balance reaches the goal (up to 50 years). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['Ene','Feb','Mar','Abr','Mayo','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],FULL=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function K(x){return x>=1000?'$'+(Math.round(x/100)/10)+'k':M(x);}
function r50(x){return Math.max(50,Math.round(x/50)*50);}
function dt(m,full){var d=new Date();d.setDate(1);d.setMonth(d.getMonth()+m);return (full?FULL:MON)[d.getMonth()]+' '+d.getFullYear();}

function inputs(){return {G:Math.max(0,v('goal')),S:Math.max(0,v('start')),mode:$('mode').value,n:Math.max(1,Math.round(v('mon'))),bud:Math.max(0,v('bud')),apy:Math.max(0,v('apy')),due:$('due').value==='1'};}
function rate(o){return Math.pow(1+o.apy/100,1/12)-1;}
function need(o,r,n,due){var g=Math.pow(1+r,n),A=r?(g-1)/r:n;if(due)A*=(1+r);return Math.max(0,(o.G-o.S*g)/A);}
/* simulate: stop at n months, or when the goal is reached if n is null */
function sim(o,r,P,n,due){var b=o.S,ci=0,rows=[{m:0,dep:0,int:0,ci:0,bal:b}],m=0,max=n||600;
  while(m<max){if(!n&&b>=o.G-0.005)break;m++;if(due)b+=P;var it=b*r;b+=it;if(!due)b+=P;ci+=it;rows.push({m:m,dep:P,int:it,ci:ci,bal:b});}
  return {rows:rows,n:m,bal:b,ci:ci,reached:b>=o.G-0.005};}

function compute(){
  var o=inputs(),r=rate(o),time=o.mode==='time',P,s;
  $('timeRow').hidden=!time;$('budRow').hidden=time;
  C.text('mT','Plazo fijo ('+(Math.round(o.n/12*10)/10)+' años)');C.text('mB','Presupuesto mensual fijo ('+M(o.bud)+')');
  C.text('monOut',o.n+' Meses ('+(o.n/12).toFixed(1)+' años)');C.text('ctaTxt',time?'Calcular el ahorro mensual necesario':'Calcular el tiempo hasta la meta');
  document.querySelectorAll('#goalChips button').forEach(function(b){var g=b.getAttribute('data-g');b.setAttribute('aria-pressed',String(g==='custom'?[60000,15000,30000,25000].indexOf(o.G)<0:+g===o.G));});
  if(time){P=need(o,r,o.n,o.due);s=sim(o,r,P,o.n,o.due);}else{P=o.bud;s=sim(o,r,P,null,o.due);}
  last={o:o,r:r,P:P,s:s};
  var ok=s.reached||o.S>=o.G,hit=$('hit');
  if(time){C.text('heroK','Ahorro mensual necesario');C.text('resultValue',M(P,2));C.text('heroU','/ month');
    C.text('heroNote','At '+o.apy.toFixed(2)+'% de APY con depósitos a '+(o.due?'start':'end')+'del mes, ahorrar esta cantidad cada mes alcanza tu '+M(o.G)+' meta en exactamente '+o.n+' meses.');
    hit.textContent='Meta lograda en '+o.n+' meses ('+dt(o.n)+')';hit.className='sx-ef-grade';}
  else if(!ok){C.text('heroK','Tiempo para alcanzar tu meta');C.text('resultValue','No en 50 años');C.text('heroU','');C.text('heroNote','At '+M(P)+'/month and '+o.apy.toFixed(2)+'% de APY no la alcanzarías '+M(o.G)+' en 50 años. Aumenta tu aportación o ajusta la meta.');hit.textContent='Meta inalcanzable';hit.className='sx-ef-grade hi';}
  else{C.text('heroK','Tiempo para alcanzar tu meta');C.text('resultValue',s.n+' Meses');C.text('heroU','('+(s.n/12).toFixed(1)+' años)');
    C.text('heroNote','Ahorrar '+M(P)+' al mes con un '+o.apy.toFixed(2)+'% de APY alcanza tu '+M(o.G)+' meta para '+dt(s.n,true)+'.');hit.textContent='Meta lograda en '+s.n+' meses ('+dt(s.n)+')';hit.className='sx-ef-grade';}
  var deps=P*s.n,fin=time?o.G:s.bal,it=s.ci;
  C.text('need',M(Math.max(0,o.G-o.S)));C.text('needN',K(o.G)+' objetivo − '+K(o.S)+' base');
  C.text('dep',M(deps));C.text('depN',s.n+' aportaciones mensuales');C.text('int','+'+M(it));C.text('intN',o.apy.toFixed(2)+'% de capitalización APY');
  C.text('cush',(o.G>0?it/o.G*100:0).toFixed(1)+'%');
  C.text('goalLbl',M(o.G)+' Objetivo');var tot=o.S+deps+it||1,parts=[[o.S,'var(--sx-secondary)','Fondos actuales',M(o.S)+' pago único inicial'],[deps,'var(--sx-primary)','Ahorro mensual',M(deps)+' ('+M(P,2)+'/mo)'],[it,'var(--sx-fdim)','Rendimiento por intereses','+'+M(it)+' bonificación por capitalización']];
  $('cBar').innerHTML=parts.map(function(p){return '<span style="width:'+(p[0]/tot*100)+'%;background:'+p[1]+'"></span>';}).join('');
  $('cLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[1]+'"></i><span>'+Math.round(p[0]/tot*100)+'% '+p[2]+'<small>'+p[3]+'</small></span></span>';}).join('');

  var hi=r50(P*1.27),lo=r50(P*0.76),base=time?o.n:s.n,sh=sim(o,r,hi,null,o.due),sl=sim(o,r,lo,null,o.due);
  function card(t,p,x,fast){var d=x.n-base,ok=x.reached;return '<div><div class="k">'+t+'<em class="'+(fast?'':'slow')+'">'+(ok?(d<=0?d:'+'+d)+' Meses':'—')+'</em></div><b>'+M(p)+' <small>/ mes</small></b><p>'+(ok?'Alcanza '+M(o.G)+' en <b>'+x.n+' meses</b> ('+dt(x.n)+').'+(fast?' Terminas '+Math.abs(d)+' meses antes.':' Reduce tu compromiso mensual en '+M(Math.abs(P-p))+'.'):'No alcanza la meta en 50 años.')+'</p><div class="f"><span class="msym" aria-hidden="true">'+(fast?'bolt':'timelapse')+'</span>Interés ganado: +'+M(x.ci)+'</div></div>';}
  $('pace').innerHTML=card('Ritmo agresivo',hi,sh,true)+card('Ritmo relajado',lo,sl,false);
  C.text('bwTxt','Equivalente quincenal: '+M(P*12/26,2)+' cada dos semanas (26 depósitos al año).');
  var alt=time?need(o,r,o.n,!o.due):null;
  C.text('dueTake',time?'Con tus datos: depositar al inicio de cada mes requiere '+M(Math.min(P,alt),2)+'/mo versus '+M(Math.max(P,alt),2)+'/mo at month end.':'Consejo: cambia al modo de plazo fijo para ver cuánto modifica el momento del depósito el importe mensual.');

  C.text('allBtn','Vista mensual ('+s.n+')');
  var view=$('view').value,keys=[0,6,12,24,36,48,60,84,120].filter(function(m){return m<s.n;});keys.push(s.n);
  var rows=view==='all'?s.rows:s.rows.filter(function(x){return keys.indexOf(x.m)>=0;});
  $('tbl').innerHTML=rows.map(function(x){var p=o.G>0?Math.min(100,x.bal/o.G*100):0,end=x.m===s.n&&ok,st=x.m===0?'<span class="sx-sg-st">Línea base</span>':end?'<span class="sx-sg-st done">✓ Meta lograda</span>':p>=75?'<span class="sx-sg-st ok">Cuartil superior</span>':p>=50?'<span class="sx-sg-st ok">Hito de la mitad</span>':'<span class="sx-sg-st ok">Según lo previsto</span>';
    return '<tr'+(end?' class="tg"':'')+'><td>'+(x.m===0?'Saldo inicial':'Mes '+x.m+' ('+dt(x.m)+')')+'</td><td class="mu">'+M(x.dep,2)+'</td><td class="g">+'+M(x.int,2)+'</td><td class="g">+'+M(x.ci,2)+'</td><td class="b">'+M(x.bal,2)+'</td><td>'+p.toFixed(1)+'%</td><td>'+st+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sgCalc',compute:compute});
  $('goalChips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var g=b.getAttribute('data-g');if(g==='custom'){$('goal').focus();$('goal').select();return;}$('goal').value=g;$('goal').dispatchEvent(new Event('input',{bubbles:true}));});
  $('bwBtn').addEventListener('click',function(){$('bwTxt').hidden=!$('bwTxt').hidden;});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('savings-goal-roadmap.csv',[{h:'Mes',key:'m'},{h:'Depósito',key:'dep'},{h:'Interés',key:'int'},{h:'Interés acumulado',key:'ci'},{h:'Saldo',key:'bal'}],last.s.rows.map(function(x){return {m:x.m,dep:Math.round(x.dep*100)/100,int:Math.round(x.int*100)/100,ci:Math.round(x.ci*100)/100,bal:Math.round(x.bal*100)/100};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSavingsGoal={need:need,sim:sim};
})();
