/* Probability calculator — CalculatePilot (Stitch redesign).
   Two events: independent P(A∩B)=P(A)P(B) · mutually exclusive P(A∩B)=0 · custom joint within [max(0,a+b−1), min(a,b)].
   P(A∪B)=P(A)+P(B)−P(A∩B) · P(A|B)=P(A∩B)/P(B).  Bayes: P(A|B)=P(B|A)P(A)/(P(B|A)P(A)+P(B|¬A)P(¬A)).
   Three events: independent or mutually exclusive.  Odds: odds = p/(1−p), p = a/(a+b), 1 in N = 1/p. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='',prevFmt='s1',PIDS=['pa','pb','pj','pr','se','fp','qa','qb','qc','op'];

function pr4(x){return isFinite(x)?(Math.abs(x)<5e-5&&x!==0?x.toExponential(2):(Math.round(x*1e4)/1e4).toFixed(4)):'—';}
function pc(x){return isFinite(x)?(x*100).toFixed(x*100<0.01&&x>0?4:2)+'%':'—';}
function nf(x,dp){return isFinite(x)?C.math.fmt(x,dp===undefined?6:dp):'—';}
function esc(s){return C.esc(s);}
function pv(id){var r=v(id);return $('fmt').value==='s2'?r/100:r;}
function bad(x){return !(x>=-1e-12&&x<=1+1e-12);}
var E=function(x){return Math.min(1,Math.max(0,x));};

function ratio(x){if(!(x>0)||!isFinite(x))return null;var h1=1,h0=0,k1=0,k0=1,y=x,i,a;for(i=0;i<30;i++){a=Math.floor(y);var h2=a*h1+h0,k2=a*k1+k0;h0=h1;h1=h2;k0=k1;k1=k2;if(k1>100000)return null;if(Math.abs(h1/k1-x)<1e-9*Math.max(1,x))return [h1,k1];if(y-a<1e-12)break;y=1/(y-a);}return null;}
function oddsTxt(x){if(x===0)return '0 : 1';if(!isFinite(x))return '—';var r=ratio(x);return r?r[0]+' : '+r[1]:nf(x,4)+' : 1';}

function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b>'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function clear(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('venn').innerHTML='';last='';return false;}
function steps(list){$('steps').innerHTML=list.map(function(s,i){return '<li><span class="n">'+(i+1)+'</span><h4>'+s[0]+'</h4>'+(s[1]?'<p>'+s[1]+'</p>':'')+'<span class="eq">'+s[2]+'</span></li>';}).join('');}

function venn2(A,B,j){
  var W=600,H=250,s='<svg viewBox="0 0 '+W+' '+H+'"><rect x="2" y="2" width="'+(W-4)+'" height="'+(H-4)+'" rx="8" fill="none" stroke="var(--sx-border)" stroke-width="1.5"/><circle cx="235" cy="125" r="88" fill="var(--sx-pc)" fill-opacity=".22" stroke="var(--sx-pc)" stroke-width="2"/><circle cx="365" cy="125" r="88" fill="#d97706" fill-opacity=".22" stroke="#d97706" stroke-width="2"/>';
  function t(x,y,lab,val){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:600;font-size:11px">'+lab+'</text><text class="ax" x="'+x+'" y="'+(y+15)+'" text-anchor="middle" style="font-size:12px;fill:var(--sx-on)">'+pr4(val)+'</text>';}
  s+=t(178,118,'Solo A',A-j)+t(300,118,'A ∩ B',j)+t(422,118,'Solo B',B-j)+t(46,32,'Ninguno',1-A-B+j);
  s+='<text class="ax" x="235" y="38" text-anchor="middle" style="font-weight:700;font-size:13px;fill:var(--sx-primary)">A  '+pr4(A)+'</text><text class="ax" x="365" y="38" text-anchor="middle" style="font-weight:700;font-size:13px;fill:#b45309">B  '+pr4(B)+'</text>';
  $('venn').innerHTML=s+'</svg>';
}
function venn3(r){
  var W=600,H=320,s='<svg viewBox="0 0 '+W+' '+H+'"><rect x="2" y="2" width="'+(W-4)+'" height="'+(H-4)+'" rx="8" fill="none" stroke="var(--sx-border)" stroke-width="1.5"/><circle cx="245" cy="125" r="90" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-pc)" stroke-width="2"/><circle cx="355" cy="125" r="90" fill="#d97706" fill-opacity=".2" stroke="#d97706" stroke-width="2"/><circle cx="300" cy="215" r="90" fill="#2563eb" fill-opacity=".18" stroke="#2563eb" stroke-width="2"/>';
  function t(x,y,lab,val){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:600;font-size:10px">'+lab+'</text><text class="ax" x="'+x+'" y="'+(y+13)+'" text-anchor="middle" style="font-size:11px;fill:var(--sx-on)">'+pr4(val)+'</text>';}
  s+=t(205,105,'Solo A',r.a)+t(395,105,'Solo B',r.b)+t(300,285,'Solo C',r.c)+t(300,90,'A∩B',r.ab)+t(245,190,'A∩C',r.ac)+t(355,190,'B∩C',r.bc)+t(300,152,'A∩B∩C',r.abc)+t(50,30,'Ninguna',r.n);
  $('venn').innerHTML=s+'</svg>';
}

function mode1(){
  var a=pv('pa'),b=pv('pb'),rel=$('rel').value,j;
  if(bad(a))return clear('P(A) debe estar entre 0 y 1 (0 % a 100 %).');if(bad(b))return clear('P(B) debe estar entre 0 y 1 (0 % a 100 %).');
  a=E(a);b=E(b);
  C.text('relHelp',rel==='s1'?'Saber que ocurrió un suceso no cambia el otro: P(A ∩ B) = P(A) × P(B).':rel==='s2'?'Los sucesos no pueden ocurrir a la vez: P(A ∩ B) = 0.':'Introduce tú mismo P(A ∩ B); debe ser coherente con P(A) y P(B).');
  $('fJoint').hidden=rel!=='s3';
  var lo=Math.max(0,a+b-1),hi=Math.min(a,b);
  if(rel==='s1')j=a*b;else if(rel==='s2'){if(a+b>1+1e-12)return clear('Los sucesos mutuamente excluyentes no pueden tener P(A) + P(B) por encima de 1; aquí suman '+nf(a+b,4)+'.');j=0;}
  else{j=pv('pj');if(bad(j))return clear('P(A ∩ B) debe estar entre 0 y 1.');C.text('pjH','rango permitido: '+nf(lo,4)+' to '+nf(hi,4));if(j<lo-1e-12||j>hi+1e-12)return clear('Con P(A) = '+nf(a,4)+' y P(B) = '+nf(b,4)+', P(A ∩ B) debe estar entre '+nf(lo,4)+' and '+nf(hi,4)+'.');j=Math.min(hi,Math.max(lo,j));}
  var u=a+b-j,ab=b>0?j/b:NaN,ba=a>0?j/a:NaN,ind=Math.abs(j-a*b)<1e-12,ex=j===0&&a>0&&b>0;
  C.text('heroLbl','Ocurren ambos eventos, P(A ∩ B)');C.text('resultValue',pr4(j));C.text('interp',pc(j)+' — la probabilidad de que A y B ocurran a la vez.');
  var t=$('tag');t.textContent=ex?'Mutuamente excluyentes':ind?'Independientes':(j>a*b?'Asociación positiva':'Asociación negativa');t.className='sx-ef-grade'+(ind||ex?'':' mid');
  tiles([['Unión, P(A ∪ B)',pr4(u),pc(u)+' — A o B (o ambos)'],['P(A | B)',pr4(ab),b>0?'A dado que ha ocurrido B':'indefinida cuando P(B) = 0'],['P(B | A)',pr4(ba),a>0?'B dado que ha ocurrido A':'indefinida cuando P(A) = 0'],['Complemento, P(A′)',pr4(1-a),'A no ocurre'],['Complemento, P(B′)',pr4(1-b),'B no ocurre'],['Solo A',pr4(a-j),'A pero no B'],['Solo B',pr4(b-j),'B pero no A'],['Ninguno',pr4(1-u),'Ni A ni B']]);
  venn2(a,b,j);C.text('vennTag','sin escala');
  steps([['Comprueba los axiomas','Toda probabilidad debe estar en [0, 1].','0 ≤ P(A) = '+nf(a,4)+' ≤ 1  y  0 ≤ P(B) = '+nf(b,4)+' ≤ 1  ✓'],
    ['Intersección: ocurren ambos',rel==='s1'?'Los sucesos independientes se multiplican.':rel==='s2'?'Los sucesos mutuamente excluyentes no pueden solaparse.':'Has indicado la probabilidad conjunta.',rel==='s1'?'P(A ∩ B) = P(A) × P(B) = '+nf(a,6)+' × '+nf(b,6)+' = <b>'+nf(j,6)+'</b>':rel==='s2'?'P(A ∩ B) = <b>0</b>':'P(A ∩ B) = <b>'+nf(j,6)+'</b>'],
    ['Unión: A o B','Suma las dos probabilidades y resta el solapamiento para no contarlo dos veces.','P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = '+nf(a,6)+' + '+nf(b,6)+' − '+nf(j,6)+' = <b>'+nf(u,6)+'</b>'],
    ['Probabilidad condicionada','Limita la atención a los casos en que ocurrió el otro suceso.','P(A | B) = P(A ∩ B) ÷ P(B) = '+(b>0?nf(j,6)+' ÷ '+nf(b,6)+' = <b>'+nf(ab,6)+'</b>':'indefinida (P(B) = 0)')+'<br>P(B | A) = '+(a>0?nf(j,6)+' ÷ '+nf(a,6)+' = <b>'+nf(ba,6)+'</b>':'indefinida (P(A) = 0)')]]);
  last='Probabilidad — calculatepilot.com/math/probability-calculator.html\nP(A) = '+nf(a,6)+', P(B) = '+nf(b,6)+' ('+t.textContent.toLowerCase()+')\nP(A ∩ B) = '+nf(j,6)+'\nP(A ∪ B) = '+nf(u,6)+'\nP(A | B) = '+nf(ab,6)+'\nP(B | A) = '+nf(ba,6);
  return true;
}

function mode2(){
  var p=pv('pr'),s=pv('se'),f=pv('fp'),N=Math.max(100,Math.round(v('pn')));
  if(bad(p))return clear('La probabilidad a priori P(A) debe estar entre 0 y 1.');if(bad(s))return clear('P(B | A) debe estar entre 0 y 1.');if(bad(f))return clear('P(B | no A) debe estar entre 0 y 1.');
  p=E(p);s=E(s);f=E(f);var pb=s*p+f*(1-p);if(pb===0)return clear('P(B) resulta ser 0, así que la probabilidad a posteriori no está definida. Aumenta la tasa de verdaderos positivos o la de falsos positivos.');
  var post=s*p/pb,fdr=1-post,pnb=1-pb,npv=pnb>0?(1-f)*(1-p)/pnb:NaN,aNotB=pnb>0?(1-s)*p/pnb:NaN,lr=f>0?s/f:Infinity;
  C.text('heroLbl','Probabilidad a posteriori, P(A | B)');C.text('resultValue',pr4(post));C.text('interp',pc(post)+' — la probabilidad de que A sea cierto tras observar B, frente a una probabilidad a priori de '+pc(p)+'.');
  var t=$('tag');t.textContent=post>p?'La evidencia aumenta P(A)':post<p?'La evidencia reduce P(A)':'La evidencia no aporta información';t.className='sx-ef-grade'+(post>p?'':' mid');
  tiles([['P(B) total',pr4(pb),'con qué frecuencia aparece la evidencia'],['P(no A | B)',pr4(fdr),'la evidencia aparece pero A es falso'],['P(no A | no B)',pr4(npv),'tranquilidad cuando B está ausente'],['P(A | no B)',pr4(aNotB),'A es cierto aunque B esté ausente'],['Razón de verosimilitud (+)',isFinite(lr)?nf(lr,3):'∞','P(B | A) ÷ P(B | no A)'],['Odds a priori → a posteriori',oddsTxt(p/(1-p))+' → '+oddsTxt(post/(1-post)),'forma de odds de Bayes']]);
  var wa=N*p,tp=wa*s,wo=N-wa,fpn=wo*f,pos=tp+fpn,q=function(x){return x.toLocaleString('es-ES',{maximumFractionDigits:1});};
  C.text('vennTag','frecuencias naturales');
  $('venn').innerHTML='<div class="sx-scroll"><table class="sx-au-cmp plain" style="min-width:0"><thead><tr><th scope="col">De '+q(N)+' personas</th><th scope="col">B presente</th><th scope="col">B ausente</th><th scope="col">Total</th></tr></thead><tbody><tr><td>A cierto</td><td class="mono">'+q(tp)+'</td><td class="mono">'+q(wa-tp)+'</td><td class="mono">'+q(wa)+'</td></tr><tr><td>A falso</td><td class="mono">'+q(fpn)+'</td><td class="mono">'+q(wo-fpn)+'</td><td class="mono">'+q(wo)+'</td></tr><tr class="tot"><td>Total</td><td class="mono">'+q(pos)+'</td><td class="mono">'+q(N-pos)+'</td><td class="mono">'+q(N)+'</td></tr></tbody></table></div><p class="sx-au-help" style="margin-top:8px">De los '+q(pos)+' casos en que B está presente, '+q(tp)+' tienen A cierto: '+q(tp)+' ÷ '+q(pos)+' = '+pc(post)+'.</p>';
  steps([['Indica los datos de entrada','Probabilidad a priori, verosimilitud y tasa de falsas alarmas.','P(A) = '+nf(p,6)+',  P(B | A) = '+nf(s,6)+',  P(B | no A) = '+nf(f,6)],
    ['Probabilidad total de la evidencia','Suma las dos formas en que puede ocurrir B (ley de la probabilidad total).','P(B) = P(B | A)·P(A) + P(B | no A)·P(no A)<br>= '+nf(s,6)+' × '+nf(p,6)+' + '+nf(f,6)+' × '+nf(1-p,6)+' = <b>'+nf(pb,8)+'</b>'],
    ['Aplica el teorema de Bayes','Invierte la probabilidad condicionada.','P(A | B) = P(B | A)·P(A) ÷ P(B) = '+nf(s*p,8)+' ÷ '+nf(pb,8)+' = <b>'+nf(post,6)+'</b>']]);
  last='Teorema de Bayes — calculatepilot.com/math/probability-calculator.html\nA priori P(A) = '+nf(p,6)+', P(B|A) = '+nf(s,6)+', P(B|no A) = '+nf(f,6)+'\nP(B) = '+nf(pb,8)+'\nP(A|B) = '+nf(post,6)+' ('+pc(post)+')';
  return true;
}

function mode3(){
  var a=pv('qa'),b=pv('qb'),c=pv('qc'),rel=$('rel3').value;
  if(bad(a)||bad(b)||bad(c))return clear('Cada probabilidad debe estar entre 0 y 1 (0 % a 100 %).');
  a=E(a);b=E(b);c=E(c);var r,none,one,two,all,any;
  if(rel==='s2'){if(a+b+c>1+1e-12)return clear('Los sucesos mutuamente excluyentes no pueden tener probabilidades que sumen más de 1; aquí suman '+nf(a+b+c,4)+'.');
    r={a:a,b:b,c:c,ab:0,ac:0,bc:0,abc:0,n:1-a-b-c};}
  else r={a:a*(1-b)*(1-c),b:b*(1-a)*(1-c),c:c*(1-a)*(1-b),ab:a*b*(1-c),ac:a*c*(1-b),bc:b*c*(1-a),abc:a*b*c,n:(1-a)*(1-b)*(1-c)};
  none=r.n;one=r.a+r.b+r.c;two=r.ab+r.ac+r.bc;all=r.abc;any=1-none;
  C.text('heroLbl','Ocurre al menos uno, P(A ∪ B ∪ C)');C.text('resultValue',pr4(any));C.text('interp',pc(any)+' — la probabilidad de que ocurran uno o más de los tres sucesos.');
  var t=$('tag');t.textContent=rel==='s2'?'Mutuamente excluyentes':'Independientes';t.className='sx-ef-grade';
  tiles([['No ocurre ninguno',pr4(none),'(1−A)(1−B)(1−C) para sucesos independientes'],['Exactamente uno',pr4(one),'un suceso, y solo uno'],['Exactamente dos',pr4(two),'dos sucesos, no el tercero'],['Los tres',pr4(all),rel==='s2'?'imposible si son mutuamente excluyentes':'P(A) × P(B) × P(C)'],['Al menos dos',pr4(two+all),'dos o tres sucesos'],['Comprobación del total',pr4(none+one+two+all),'debe ser igual a 1']]);
  venn3(r);C.text('vennTag','sin escala');
  steps(rel==='s2'?[['Comprueba los axiomas','Cada probabilidad está en [0, 1] y, al ser mutuamente excluyentes, deben sumar como máximo 1.','P(A) + P(B) + P(C) = '+nf(a+b+c,6)+' ≤ 1  ✓'],['Ocurre al menos uno','Los sucesos mutuamente excluyentes simplemente se suman.','P(A ∪ B ∪ C) = P(A) + P(B) + P(C) = <b>'+nf(any,6)+'</b>'],['No ocurre ninguno','El complemento de «ocurre al menos uno».','1 − '+nf(any,6)+' = <b>'+nf(none,6)+'</b>']]:
    [['Comprueba los axiomas','Cada probabilidad está en [0, 1].','P(A) = '+nf(a,4)+', P(B) = '+nf(b,4)+', P(C) = '+nf(c,4)+'  ✓'],
     ['No ocurre ninguno','Multiplica los complementos (independencia).','(1 − '+nf(a,6)+')(1 − '+nf(b,6)+')(1 − '+nf(c,6)+') = <b>'+nf(none,6)+'</b>'],
     ['Ocurre al menos uno','Usa la regla del complemento.','P(A ∪ B ∪ C) = 1 − '+nf(none,6)+' = <b>'+nf(any,6)+'</b>'],
     ['Exactamente uno y exactamente dos','Suma las regiones correspondientes del diagrama de Venn.','exactamente uno = '+nf(r.a,5)+' + '+nf(r.b,5)+' + '+nf(r.c,5)+' = <b>'+nf(one,6)+'</b><br>exactamente dos = '+nf(r.ab,5)+' + '+nf(r.ac,5)+' + '+nf(r.bc,5)+' = <b>'+nf(two,6)+'</b><br>los tres = '+nf(a,4)+' × '+nf(b,4)+' × '+nf(c,4)+' = <b>'+nf(all,6)+'</b>']]);
  last='Tres sucesos ('+t.textContent.toLowerCase()+') — calculatepilot.com/math/probability-calculator.html\nP(A) = '+nf(a,6)+', P(B) = '+nf(b,6)+', P(C) = '+nf(c,6)+'\nAl menos uno: '+nf(any,6)+'\nNone: '+nf(none,6)+'\nExactamente uno: '+nf(one,6)+'\nExactamente dos: '+nf(two,6)+'\nLos tres: '+nf(all,6);
  return true;
}

function mode4(){
  var k=$('ok').value,p,T=Math.max(1,Math.round(v('ot')));
  $('o1').hidden=k!=='p';$('o2').hidden=k!=='o';$('o3').hidden=k!=='n';
  if(k==='p'){p=pv('op');if(bad(p))return clear('La probabilidad debe estar entre 0 y 1 (0 % a 100 %).');p=E(p);}
  else if(k==='o'){var oa=v('oa'),ob=v('ob');if(!(oa>=0&&ob>=0&&oa+ob>0))return clear('Introduce odds a y b no negativos que no sean ambos 0.');p=oa/(oa+ob);}
  else{var n=v('on');if(!(n>=1))return clear('N debe ser al menos 1.');p=1/n;}
  var of=p<1?p/(1-p):Infinity,oa2=p>0?(1-p)/p:Infinity,one=p>0?1/p:Infinity,any=1-Math.pow(1-p,T);
  C.text('heroLbl','Probabilidad');C.text('resultValue',pr4(p));C.text('interp',pc(p)+' — equivale a unas odds de '+oddsTxt(of)+' a favor.');
  var t=$('tag');t.textContent=p===0?'Imposible':p===1?'Seguro':p<0.05?'Poco probable':p>0.95?'Muy probable':'Posible';t.className='sx-ef-grade';
  tiles([['Porcentaje',pc(p),'p × 100'],['Odds a favor',oddsTxt(of),'p ÷ (1 − p)'],['Odds en contra',oddsTxt(oa2),'(1 − p) ÷ p'],['1 entre N',isFinite(one)?'1 entre '+nf(one,4):'never','1 ÷ p'],['Esperado en '+T+' trial'+(T===1?'':'s'),nf(p*T,4),'p × intentos'],['Al menos una vez en '+T,pr4(any),'1 − (1 − p)^'+T]]);
  $('venn').innerHTML='';
  steps([['Obtén la probabilidad',k==='p'?'La has introducido directamente.':k==='o'?'A partir de las odds a : b, p = a ÷ (a + b).':'A partir de «1 entre N», p = 1 ÷ N.','p = <b>'+nf(p,8)+'</b> = '+pc(p)],
    ['Convierte a odds','Las odds comparan la probabilidad de que ocurra con la de que no ocurra.','a favor = p ÷ (1 − p) = '+nf(of,6)+'  →  <b>'+oddsTxt(of)+'</b><br>en contra = (1 − p) ÷ p = '+nf(oa2,6)+'  →  <b>'+oddsTxt(oa2)+'</b>'],
    ['Repite en '+T+' intento independiente'+(T===1?'':'s'),'El recuento esperado es p × T; «al menos una vez» usa la regla del complemento.','esperado = '+nf(p,6)+' × '+T+' = <b>'+nf(p*T,4)+'</b><br>P(al menos una vez) = 1 − (1 − '+nf(p,6)+')^'+T+' = <b>'+nf(any,6)+'</b>']]);
  last='Odds y probabilidad — calculatepilot.com/math/probability-calculator.html\np = '+nf(p,8)+' ('+pc(p)+')\nOdds a favor: '+oddsTxt(of)+'\nOdds en contra: '+oddsTxt(oa2)+'\n1 entre '+nf(one,4)+'\nAl menos una vez en '+T+' intentos: '+nf(any,6);
  return true;
}

function compute(){
  var m=$('mode').value,f=$('fmt').value;
  if(f!==prevFmt){var k=f==='s2'?100:0.01;PIDS.forEach(function(id){var x=parseFloat($(id).value);if(isFinite(x))$(id).value=+(x*k).toPrecision(12);});prevFmt=f;}
  ['p1','p2','p3','p4'].forEach(function(id,i){$(id).hidden=('s'+(i+1))!==m;});$('vennCard').hidden=m==='s4';$('fFmt').hidden=false;
  $('err').hidden=true;
  var ok=(m==='s1'?mode1:m==='s2'?mode2:m==='s3'?mode3:mode4)();
  if(ok)$('err').hidden=true;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'prCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  document.querySelector('#prCalc [data-action=reset]').addEventListener('click',function(){prevFmt='s1';});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
