/* CD calculator — CalculatePilot (Stitch 1:1 redesign).
   Value after t months = deposit × (1 + APY)^(t/12). Equivalent APR = n × ((1 + APY)^(1/n) − 1).
   Early withdrawal penalty = deposit × APR × days ÷ 365 (simple interest), applied when broken at 6 months (or half the term).
   Ladder: deposit split into five 1–5 year CDs at the APYs entered. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var MON=['Ene','Feb','Mar','Abr','Mayo','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function M(x,dp){dp=dp===undefined?2:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function dt(m,day){var d=new Date();d.setMonth(d.getMonth()+m);return MON[d.getMonth()]+(day?' '+d.getDate()+',':'')+' '+d.getFullYear();}

function inputs(){return {D:Math.max(0,v('dep')),t:Math.max(1,v('term')),apy:Math.max(0,v('apy'))/100,n:Math.max(1,v('cmp')),pen:Math.max(0,v('pen')),hy:Math.max(0,v('hysa'))/100,l:[1,2,3,4,5].map(function(k){return Math.max(0,v('l'+k))/100;})};}

function compute(){
  var o=inputs(),V=function(m){return o.D*Math.pow(1+o.apy,m/12);},fv=V(o.t),int=fv-o.D,apr=o.n*(Math.pow(1+o.apy,1/o.n)-1),ty=o.t/12;last={o:o};
  C.text('tOut',o.t+' Meses ('+ty.toFixed(1)+' Yr)');C.text('tPill',o.t+' meses de plazo');
  C.text('resultValue',M(fv));C.text('intHero','+'+M(int)+' Interés garantizado');C.text('prin',M(o.D));C.text('int','+'+M(int));
  C.text('intN',(int/o.D*100||0).toFixed(2)+'% de rendimiento total en '+o.t+' months');C.text('mo',M(int/o.t)+' / mo');
  var bm=Math.min(6,o.t/2),pen=o.D*apr*o.pen/365,nb=V(bm)-pen;
  C.text('penL','Neto si se cancela a los '+(Math.round(bm*10)/10)+' Mo');C.text('penV',M(nb));
  $('penN').textContent=o.pen?((nb-o.D>=0?'+':'−')+M(Math.abs(nb-o.D))+(nb>=o.D?' de beneficio neto':' de pérdida del capital')+' tras una '+o.pen+' días de penalización de intereses'):'CD sin penalización: se conserva todo el interés devengado';
  $('tl').innerHTML='<div>Fecha de emisión<b>'+dt(0,true)+'</b><span>'+M(o.D,0)+' Depósito</span></div><div>A mitad de plazo ('+(Math.round(o.t/2*10)/10)+' meses)<b>'+dt(Math.round(o.t/2),true)+'</b><span>'+M(V(o.t/2))+' devengado</span></div><div>Fecha de vencimiento<b>'+dt(o.t,true)+'</b><span>'+M(fv)+' vencido</span></div>';
  C.text('vsL',o.t+' meses de protección de tasa');C.text('vsCdL',o.t+' meses de CD bloqueado');C.text('vsCd',(o.apy*100).toFixed(2)+'% de APY');C.text('vsCdR','+'+M(int,0)+' return');
  var hy=o.D*(Math.pow(1+o.hy,ty)-1);C.text('vsHy',(o.hy*100).toFixed(2)+'% est.');C.text('vsHyR','~'+M(hy,0)+' si la tasa se mantuviera');

  var a=o.D/5,tot=0;C.text('ldLead','Dividida en '+M(o.D,0)+' en cinco CD escalonados de modo que uno venza cada año, manteniendo parte del efectivo accesible mientras el resto gana tasas a más largo plazo.');
  document.querySelectorAll('#tr>div').forEach(function(el,k){var gi=a*(Math.pow(1+o.l[k],k+1)-1);tot+=gi;el.querySelector('.amt').textContent=M(a);el.querySelector('.gi').textContent='+'+M(gi);});
  C.text('blend',(o.l.reduce(function(s,x){return s+x;},0)/5*100).toFixed(2)+'%');
  $('ldTbl').innerHTML=o.l.map(function(r,k){var gi=a*(Math.pow(1+r,k+1)-1),end=k===4;
    return '<tr'+(end?' class="act"':'')+'><td>Año '+(k+1)+' Fin'+(end?' (escalera completa)':'')+'</td><td>'+dt(12*(k+1))+'</td><td>Tramo '+(k+1)+' ('+(k+1)+' años)</td><td class="g">+'+M(gi)+'</td><td style="color:var(--sx-muted)">'+(end?'Los cinco tramos están ahora en CD a 5 años, con uno que vence cada año':'Reinvierte en un nuevo CD a 5 años a la tasa vigente a 5 años')+'</td><td class="b">'+M(a+gi)+'</td></tr>';}).join('');

  var nm={365:'daily',12:'monthly',4:'quarterly',2:'semi-annual',1:'annual'}[o.n];
  C.text('aprTxt','Tu '+(o.apy*100).toFixed(2)+'% de APY equivale a una '+(apr*100).toFixed(3)+'% de TAE con '+nm+' capitalización. Al comparar CD, compara el APY: ya incluye la capitalización.');
  var rem=o.t-bm,need=rem>0&&o.D>0?pen/(o.D*rem/12)*100:0;
  $('penRows').innerHTML='<li>Costo de la penalización ('+o.pen+' días al '+(apr*100).toFixed(2)+'% de TAE)<b style="color:var(--sx-err)">'+(pen?'−':'')+M(pen)+'</b></li><li>Rendimiento adicional necesario para recuperarlo durante los '+(Math.round(rem*10)/10)+' meses restantes<b style="color:var(--sx-pc)">'+(o.pen?'+'+need.toFixed(2)+'% de APY':'Ninguna')+'</b></li>';
  C.text('penTxt',o.pen?'Si un nuevo CD por el plazo restante paga al menos '+need.toFixed(2)+' puntos porcentuales más que tu APY actual, cancelar antes y reinvertir más o menos te deja en equilibrio; si paga más que eso, sales ganando.':'Un CD sin penalización te permite pasarte a una tasa más alta en cualquier momento sin perder intereses.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'cdCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var o=last.o,rows=[];for(var m=0;m<=o.t;m++)rows.push({m:m,v:Math.round(o.D*Math.pow(1+o.apy,m/12)*100)/100});C.csv('cd-ledger.csv',[{h:'Mes',key:'m'},{h:'Valor',key:'v'}],rows);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCD={};
})();
