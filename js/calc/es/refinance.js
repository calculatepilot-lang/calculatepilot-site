/* Refinance calculator — CalculatePilot (Stitch 1:1 redesign).
   Net benefit(m) = Σ(old P&I − new P&I) + (old balance − new balance) − upfront costs + cash-out.
   Break-even = first month the net benefit is ≥ 0; lifetime interest = old remaining vs new full term.
   "Accelerated payoff" pays the new loan on the old remaining term. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('es-ES',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function S(x){return (x>=0?'+':'−')+M(Math.abs(x));}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}

function inputs(){
  return {bal:Math.max(0,v('bal')),r1:Math.max(0,v('r1')),n1:Math.max(1,Math.round(v('n1'))),n2:Math.max(1,v('n2')),r2:Math.max(0,v('r2')),cc:Math.max(0,v('cc')),roll:$('roll').value==='roll',co:Math.max(0,v('co')),match:$('match').value==='1'};
}

function calc(o){
  var N1=o.n1*12,newP=o.bal+o.co+(o.roll?o.cc:0),N2=o.match?N1:o.n2*12,P1=pmt(o.bal,o.r1,N1),P2=pmt(newP,o.r2,N2),up=o.roll?0:o.cc;
  var i1=o.r1/100/12,i2=o.r2/100/12,b1=o.bal,b2=newP,cum=0,net=[-up+o.co+(o.bal-newP)],yrs=[],I1=0,I2=0,y={o:0,n:0,p:0},be=null;
  var N=Math.max(N1,N2);
  for(var m=1;m<=N;m++){
    var a1=b1>0.005?b1*i1:0,pay1=b1>0.005?Math.min(P1,b1+a1):0;b1=Math.max(0,b1+a1-pay1);
    var a2=b2>0.005?b2*i2:0,pay2=b2>0.005?Math.min(P2,b2+a2):0,pr2=pay2-a2;b2=Math.max(0,b2+a2-pay2);
    cum+=pay1-pay2;I1+=a1;I2+=a2;y.o+=a1;y.n+=a2;y.p+=pr2;
    var nb=cum+(b1-b2)-up+o.co;net.push(nb);if(be===null&&nb>=0)be=m;
    if(m%12===0){yrs.push({y:m/12,oi:y.o,ni:y.n,sv:y.o-y.n,pp:y.p,net:nb});y={o:0,n:0,p:0};}
  }
  if(net[0]>=0)be=0;
  return {N1:N1,N2:N2,newP:newP,P1:P1,P2:P2,up:up,net:net,yrs:yrs,be:be,I1:I1,I2:I2,matchPay:pmt(newP,o.r2,N1)};
}

function chart(r){
  var Mx=r.be!==null&&r.be>48?Math.min(r.net.length-1,r.be+12):Math.min(60,r.net.length-1),pts=r.net.slice(0,Mx+1);
  var W=560,H=220,L=56,Rr=14,T=16,B=28,w=W-L-Rr,h=H-T-B,lo=Math.min(0,Math.min.apply(null,pts)),hi=Math.max(0,Math.max.apply(null,pts)),sp=(hi-lo)||1;
  lo-=sp*.08;hi+=sp*.12;sp=hi-lo;
  function X(m){return L+m/Mx*w;}function Y(x){return T+h-(x-lo)/sp*h;}
  var s='';[hi,(hi+lo)/2,lo].forEach(function(g){s+='<line x1="'+L+'" x2="'+(W-Rr)+'" y1="'+Y(g)+'" y2="'+Y(g)+'" stroke="currentColor" stroke-opacity=".07"/><text x="'+(L-6)+'" y="'+(Y(g)+3)+'" text-anchor="end" font-size="9" fill="#94a3b8">'+(g<0?'−':'+')+'$'+Math.round(Math.abs(g)/100)/10+'k</text>';});
  s+='<line x1="'+L+'" x2="'+(W-Rr)+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="#64748b" stroke-dasharray="4 4"/><text x="'+(W-Rr)+'" y="'+(Y(0)-4)+'" text-anchor="end" font-size="9" fill="#64748b">Línea neta de $0</text>';
  var line=pts.map(function(x,m){return X(m).toFixed(1)+','+Y(x).toFixed(1);}).join(' ');
  s+='<polygon points="'+X(0)+','+Y(0)+' '+line+' '+X(Mx)+','+Y(0)+'" fill="var(--sx-pc)" fill-opacity=".08"/>';
  s+='<polyline points="'+line+'" fill="none" stroke="var(--sx-primary)" stroke-width="2.5"/>';
  s+='<circle cx="'+X(0)+'" cy="'+Y(pts[0])+'" r="4" fill="var(--sx-err)"/><text x="'+(X(0)+6)+'" y="'+(Y(pts[0])+(pts[0]<0?14:-6))+'" font-size="9" font-weight="700" fill="var(--sx-err)">'+(pts[0]<0?'−'+M(-pts[0])+' upfront':'')+'</text>';
  if(r.be!==null&&r.be>0&&r.be<=Mx){s+='<line x1="'+X(r.be)+'" x2="'+X(r.be)+'" y1="'+Y(0)+'" y2="'+(T+h)+'" stroke="var(--sx-primary)" stroke-dasharray="2 3"/><circle cx="'+X(r.be)+'" cy="'+Y(0)+'" r="4" fill="var(--sx-primary)"/><text x="'+X(r.be)+'" y="'+(T+h+12)+'" text-anchor="middle" font-size="9" font-weight="700" fill="var(--sx-on)">Mes '+r.be+' (punto de equilibrio)</text>';}
  var e=pts[Mx];s+='<circle cx="'+X(Mx)+'" cy="'+Y(e)+'" r="4" fill="var(--sx-primary)"/><text x="'+(X(Mx)-6)+'" y="'+(Y(e)-8)+'" text-anchor="end" font-size="10" font-weight="700" fill="var(--sx-on)">'+S(e)+' at '+(Mx%12?'Mes '+Mx:Mx/12+' Años')+'</text>';
  s+='<text x="'+L+'" y="'+(H-6)+'" font-size="9" fill="#94a3b8">Mes 0</text><text x="'+(W-Rr)+'" y="'+(H-6)+'" text-anchor="end" font-size="9" fill="#94a3b8">Mes '+Mx+'</text>';
  $('chart').innerHTML=s;C.text('chRange','Del mes 0 al mes '+Mx);
}

function compute(){
  var o=inputs(),r=calc(o),d=r.P1-r.P2;last={o:o,r:r};
  C.text('p1',M(r.P1)+' / mo');var dr=o.r2-o.r1;C.text('drop',(dr<=0?'−':'+')+Math.abs(dr).toFixed(3).replace(/0+$/,'').replace(/[.,]$/,'')+'% '+(dr<=0?'Baja':'Sube'));
  C.text('ccPct','~'+(o.bal>0?(o.cc/o.bal*100).toFixed(1):'0')+'% del saldo');
  C.text('resultValue',r.be===null?'Sin punto de equilibrio':r.be===0?'Punto de equilibrio inmediato':r.be+' Meses hasta el punto de equilibrio');
  var vb=$('viab');if(r.be!==null&&r.be<=24){vb.textContent='Refinanciación muy viable';vb.className='sx-ef-grade';}else if(r.be!==null&&r.be<=60){vb.textContent='Viabilidad moderada';vb.className='sx-ef-grade mid';}else{vb.textContent='Viabilidad baja';vb.className='sx-ef-grade hi';}
  var dm=$('dMo');dm.textContent=S(d)+' / mo';dm.className=d<0?'neg':'';C.text('dMoN',M(r.P2)+' nuevo frente a '+M(r.P1)+' old');
  var n5=r.net[Math.min(60,r.net.length-1)],d5=$('d5');d5.textContent=S(n5);d5.className=n5<0?'neg':'';C.text('d5N',r.up>0?'Neto de '+M(r.up)+' fees':'Costes incluidos en el préstamo');
  var li=r.I1-r.I2,dl=$('dLife');dl.textContent=M(Math.abs(li))+(li>=0?' Ahorro de':' Más');dl.className=li<0?'neg':'';
  chart(r);

  var ext=o.n2*12>r.N1;$('reset').hidden=!(ext||o.match);
  if(o.match){C.text('resetTxt','Estás pagando el nuevo préstamo según tu plan original de '+o.n1+'años: '+M(r.P2)+'/mo at '+o.r2+'% mantiene la misma fecha de liquidación y reduce el interés total.');C.text('matchLbl','');$('matchLbl').innerHTML='Estándar '+o.n2+'-años: <b>'+M(pmt(r.newP,o.r2,o.n2*12))+' / mo</b>';C.text('matchBtnTxt','Usa el pago estándar a '+o.n2+'años');}
  else if(ext){C.text('resetTxt','Pasar tu hipoteca restante de '+o.n1+'años a una nueva de '+o.n2+'años '+(d>=0?'reduce tu pago en '+M(d):'cambia tu pago en '+S(d))+', pero retrasa tu fecha de liquidación '+(o.n2-o.n1)+' year'+(o.n2-o.n1===1?'':'s')+'.');$('matchLbl').innerHTML='Pago para mantener tu '+o.n1+'años de liquidación: <b>'+M(r.matchPay)+' / mo</b>';C.text('matchBtnTxt','Aplicar pago acelerado');}
  var q=d>0?o.cc/d:Infinity;C.text('quickBe',isFinite(q)?'= '+M(o.cc)+' ÷ ('+M(r.P1)+' − '+M(r.P2)+') = '+M(o.cc)+' ÷ '+M(d)+' = '+q.toFixed(2)+' ≈ '+Math.ceil(q)+' months':'El nuevo pago no es menor, así que los costes nunca se recuperan solo con el ahorro en el pago.');
  C.text('noMove',r.be!==null&&r.be>0?'Si vendes o refinancias de nuevo antes del mes '+r.be+', los costes de cierre superan tu ahorro.':'Si vendes o refinancias de nuevo antes de alcanzar el punto de equilibrio, los costes de cierre superan tu ahorro.');

  $('tbl').innerHTML=r.yrs.slice(0,10).map(function(y,k){var passed=r.be!==null&&r.be>k*12&&r.be<=(k+1)*12;
    return '<tr><td>Año '+y.y+(passed?'<span class="be">Punto de equilibrio superado</span>':'')+'</td><td class="mu">'+M(y.oi)+'</td><td class="mu">'+M(y.ni)+'</td><td class="pos">'+S(y.sv)+'</td><td>'+M(y.pp)+'</td><td class="'+(y.net<0?'neg':'pos')+'">'+S(y.net)+'</td></tr>';}).join('');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'rfCalc',compute:compute});
  $('matchBtn').addEventListener('click',function(){$('match').value=$('match').value==='1'?'0':'1';$('match').dispatchEvent(new Event('input',{bubbles:true}));});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('refinance-comparison.csv',[{h:'Año',key:'y'},{h:'Interés del préstamo actual',key:'oi'},{h:'Interés de la refinanciación',key:'ni'},{h:'Ahorro en intereses',key:'sv'},{h:'Capital pagado (refi.)',key:'pp'},{h:'Beneficio neto acumulado',key:'net'}],last.r.yrs);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpRefinance={calc:calc};
})();
