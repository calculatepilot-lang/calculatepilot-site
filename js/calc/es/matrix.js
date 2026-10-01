/* 2×2 Matrix calculator — CalculatePilot (Stitch redesign).
   det(A) = ad − bc. A⁻¹ = (1/det)[[d,−b],[−c,a]]. Eigenvalues solve λ² − tr(A)λ + det(A) = 0 (quadratic formula,
   real or complex conjugate pair). Cramer's rule: xᵢ = det(Aᵢ)/det(A). Rational forms via continued-fraction
   approximation of decimal entries (denominators ≤ 999). */
(function(){
var C=window.CPX,$=C.$,v=C.val,esc=C.esc,last='';

function cl(x){return Math.abs(x)<1e-10?0:x;}
function fx(x,dp){dp=dp===undefined?4:dp;x=cl(x);if(Math.abs(x-Math.round(x))<1e-9)return String(Math.round(x));return x.toFixed(dp).replace(/0+$/,'').replace(/[.,]$/,'');}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function frac(x){ /* best rational approximation with small denominator, or null */
  if(Math.abs(x-Math.round(x))<1e-9)return null;
  for(var d=2;d<=1000;d++){var n=x*d;if(Math.abs(n-Math.round(n))<1e-6*d){var nn=Math.round(n),g=gcd(nn,d)||1;nn/=g;d/=g;if(d!==1)return nn+'/'+d;}}
  return null;
}
function fxr(x,dp){var f=frac(x);var s=fx(x,dp);return f?s+' ('+f+')':s;}
function mat2(a,b,c,d,dp){return '[['+fx(a,dp)+', '+fx(b,dp)+'], ['+fx(c,dp)+', '+fx(d,dp)+']]';}
function matHTML(a,b,c,d,dp){return '<span style="display:inline-block;vertical-align:middle">['+fx(a,dp)+', '+fx(b,dp)+']<br>['+fx(c,dp)+', '+fx(d,dp)+']</span>';}
function tiles(arr){$('tiles').innerHTML=arr.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){
  $('err').hidden=false;C.text('errT',msg);
  C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');
  C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');
}

function classify(a,b,c,d){
  var det=a*d-b*c,tr=a+d,sym=Math.abs(b-c)<1e-9;
  var isOrtho=Math.abs(a*a+c*c-1)<1e-6&&Math.abs(b*b+d*d-1)<1e-6&&Math.abs(a*b+c*d)<1e-6;
  var isDiag=Math.abs(b)<1e-9&&Math.abs(c)<1e-9;
  var labels=[];
  if(Math.abs(det)<1e-9)labels.push('Singular');else labels.push('Non-singular');
  if(isOrtho)labels.push('Ortogonal');
  if(sym)labels.push('Simétrica');
  if(isDiag)labels.push('Diagonal');
  return labels.join(', ');
}

/* Transformation-of-unit-square viz */
function vizUnitSquare(a,b,c,d){
  var W=760,H=340,pad=44;
  var pts=[[0,0],[1,0],[1,1],[0,1]],tpts=pts.map(function(p){return [a*p[0]+b*p[1],c*p[0]+d*p[1]];});
  var xs=pts.concat(tpts).map(function(p){return p[0];}),ys=pts.concat(tpts).map(function(p){return p[1];});
  var lo_x=Math.min.apply(null,xs.concat([0]))-0.6,hi_x=Math.max.apply(null,xs.concat([0]))+0.6;
  var lo_y=Math.min.apply(null,ys.concat([0]))-0.6,hi_y=Math.max.apply(null,ys.concat([0]))+0.6;
  var kx=(W-2*pad)/(hi_x-lo_x),ky=(H-2*pad)/(hi_y-lo_y);
  var X=function(x){return pad+(x-lo_x)*kx;},Y=function(y){return H-pad-(y-lo_y)*ky;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  if(0>=lo_y&&0<=hi_y)s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  if(0>=lo_x&&0<=hi_x)s+='<line x1="'+X(0).toFixed(1)+'" x2="'+X(0).toFixed(1)+'" y1="'+pad+'" y2="'+(H-pad)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  function poly(p,fill,stroke,dash){return '<polygon points="'+p.map(function(pt){return X(pt[0]).toFixed(1)+','+Y(pt[1]).toFixed(1);}).join(' ')+'" fill="'+fill+'" fill-opacity="0.22" stroke="'+stroke+'" stroke-width="2"'+(dash?' stroke-dasharray="5 4"':'')+'/>';}
  s+=poly(pts,'var(--sx-muted)','var(--sx-muted)',true);
  s+=poly(tpts,'var(--sx-primary)','var(--sx-primary)',false);
  function arrow(p,col,lab){s+='<line x1="'+X(0).toFixed(1)+'" y1="'+Y(0).toFixed(1)+'" x2="'+X(p[0]).toFixed(1)+'" y2="'+Y(p[1]).toFixed(1)+'" stroke="'+col+'" stroke-width="2.4"/><circle cx="'+X(p[0]).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="4.5" fill="'+col+'"/><text class="ax" x="'+(X(p[0])+7).toFixed(1)+'" y="'+(Y(p[1])-6).toFixed(1)+'" style="font-weight:700;fill:'+col+'">'+esc(lab)+'</text>';}
  arrow([a,c],'#2563eb','T(e₁) = ('+fx(a,2)+', '+fx(c,2)+')');
  arrow([b,d],'#d97706','T(e₂) = ('+fx(b,2)+', '+fx(d,2)+')');
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fB').hidden=(m!=='s2');$('fRHS').hidden=(m!=='s4');
  var labels={s1:'Determinante, inversa y traza',s2:'Multiplicación de matrices A × B',s3:'Valores propios &amp; polinomio característico',s4:'Resolver el sistema lineal Ax = b'};
  C.html('formH',labels[m]);
  var a=v('a11'),b=v('a12'),c=v('a21'),d=v('a22');
  if(!isFinite(a)||!isFinite(b)||!isFinite(c)||!isFinite(d))return fail('Introduce las cuatro entradas de la matriz A.');
  C.html('fxNow','A = '+matHTML(a,b,c,d));
  var det=cl(a*d-b*c),tr=cl(a+d);

  if(m==='s1'){
    C.text('heroLbl','Determinante det(A)');C.text('resultValue',fxr(det,6));tg.textContent=Math.abs(det)<1e-9?'Singular (sin inversa)':'Non-singular';tg.className='sx-ef-grade'+(Math.abs(det)<1e-9?' mid':'');
    C.text('ex1L','Inversa A⁻¹');
    if(Math.abs(det)<1e-9)C.text('ex1','undefined');
    else{var ia=d/det,ib=-b/det,ic=-c/det,id=a/det;C.html('ex1',matHTML(ia,ib,ic,id,6));}
    C.text('ex2L','Clasificación');C.text('ex2',classify(a,b,c,d));
    C.text('interp',Math.abs(det)<1e-9?'Las filas de A son linealmente dependientes, por lo que A no tiene inversa y la transformación colapsa el plano.':'A es invertible: transforma el cuadrado unitario en un paralelogramo de área |det A| = '+fx(Math.abs(det),4)+'.');
    var trans=mat2(a,c,b,d);
    tiles([
      ['Traza tr(A)',fx(tr,6),'a + d, suma de la diagonal'],
      ['Transpuesta Aᵀ',trans,'filas y columnas intercambiadas'],
      ['Rango',Math.abs(det)<1e-9?(a===0&&b===0&&c===0&&d===0?'0':'1'):'2','número de filas independientes'],
      ['|det(A)| — factor de escala del área',fx(Math.abs(det),6),'factor por el que A escala el área']
    ]);
    vizUnitSquare(a,b,c,d);C.text('vizTag','área × '+fx(Math.abs(det),4));
    var n=0,h='';function st(t,dd,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Calcula el determinante','det(A) = a·d − b·c, el producto de la diagonal principal menos el producto de la antidiagonal.','det(A) = ('+fx(a)+')('+fx(d)+') − ('+fx(b)+')('+fx(c)+') = '+fx(a*d)+' − '+fx(b*c)+' = <b>'+fx(det,6)+'</b>');
    if(Math.abs(det)>=1e-9)st('Construye la inversa a partir de la adjunta','Intercambia la diagonal principal, cambia el signo de la antidiagonal y luego divide cada entrada entre det(A).','adj(A) = [[d, −b], [−c, a]] = '+mat2(d,-b,-c,a)+'<br>A⁻¹ = (1/'+fx(det,6)+')·adj(A) = <b>'+mat2(d/det,-b/det,-c/det,a/det,6)+'</b>');
    else st('El determinante es cero','Una matriz singular no tiene inversa: sus filas son múltiplos escalares una de otra.','a/c = '+(c!==0?fx(a/c,4):'—')+' y b/d = '+(d!==0?fx(b/d,4):'—')+' (iguales cuando es singular por un múltiplo de fila)');
    if(Math.abs(det)>=1e-9)st('Verifica A·A⁻¹ = I','Multiplica A por la inversa calculada; el resultado debe ser la matriz identidad.',(function(){var ia=d/det,ib=-b/det,ic=-c/det,idd=a/det;var r11=a*ia+b*ic,r12=a*ib+b*idd,r21=c*ia+d*ic,r22=c*ib+d*idd;return mat2(r11,r12,r21,r22)+' = I ✓';})());
    $('steps').innerHTML=h;C.text('stepsIntro','A = '+mat2(a,b,c,d)+'.');C.text('stepsTag','det = '+fx(det,4));
    last='Matriz — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\ndet(A) = '+det+'\ntraza = '+tr+(Math.abs(det)>=1e-9?'\ninversa = '+mat2(d/det,-b/det,-c/det,a/det,6):'\ninversa: no definida (singular)');
    return;
  }

  if(m==='s2'){
    var e=v('b11'),f=v('b12'),g=v('b21'),h2=v('b22');
    if(!isFinite(e)||!isFinite(f)||!isFinite(g)||!isFinite(h2))return fail('Introduce las cuatro entradas de la matriz B.');
    var r11=a*e+b*g,r12=a*f+b*h2,r21=c*e+d*g,r22=c*f+d*h2;
    C.text('heroLbl','Producto A × B');C.html('resultValue',matHTML(r11,r12,r21,r22,6));tg.textContent='resultado 2×2';
    var s11=e*a+f*c,s12=e*b+f*d,s21=g*a+h2*c,s22=g*b+h2*d;
    var commutes=Math.abs(r11-s11)<1e-7&&Math.abs(r12-s12)<1e-7&&Math.abs(r21-s21)<1e-7&&Math.abs(r22-s22)<1e-7;
    C.text('ex1L','B × A');C.html('ex1',matHTML(s11,s12,s21,s22,6));
    C.text('ex2L','¿Coinciden A×B y B×A?');C.text('ex2',commutes?'Sí (este par conmuta)':'No — la multiplicación de matrices no es conmutativa');
    C.text('interp','La fila i de A se multiplica escalarmente por la columna j de B para dar la entrada (i, j) del producto.');
    tiles([['det(A)',fx(det,6),''],['det(B)',fx(cl(e*h2-f*g),6),''],['det(A×B)',fx(cl((a*e+b*g)*(c*f+d*h2)-(a*f+b*h2)*(c*e+d*g)),6),'es igual a det(A) × det(B)'],['Comprobación: det(A)·det(B)',fx(cl(det*(e*h2-f*g)),6),'la propiedad multiplicativa']]);
    vizUnitSquare(r11,r12,r21,r22);C.text('vizTag','A × B aplicado al cuadrado unitario');
    var n2=0,h3='';function st2(t,dd,ee){n2++;h3+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+ee+'</span></li>';}
    st2('Fila × columna','La entrada (1,1) de A×B es la fila 1 de A multiplicada escalarmente por la columna 1 de B.','(1,1): ('+fx(a)+')('+fx(e)+') + ('+fx(b)+')('+fx(g)+') = <b>'+fx(r11,6)+'</b>');
    st2('Repite para cada entrada','Cada una de las cuatro entradas sigue la misma regla de fila por columna.','(1,2) = <b>'+fx(r12,6)+'</b>, (2,1) = <b>'+fx(r21,6)+'</b>, (2,2) = <b>'+fx(r22,6)+'</b>');
    st2('Comprueba con la identidad del determinante','det(AB) siempre es igual a det(A)·det(B), aunque en general AB ≠ BA.','det(A)·det(B) = ('+fx(det,4)+')·('+fx(cl(e*h2-f*g),4)+') = <b>'+fx(cl(det*(e*h2-f*g)),6)+'</b>');
    $('steps').innerHTML=h3;C.text('stepsIntro','A × B para A = '+mat2(a,b,c,d)+', B = '+mat2(e,f,g,h2)+'.');C.text('stepsTag','2×2 · 2×2');
    last='Multiplicación de matrices — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\nB = '+mat2(e,f,g,h2,6)+'\nA×B = '+mat2(r11,r12,r21,r22,6);
    return;
  }

  if(m==='s3'){
    var disc=cl(tr*tr-4*det);
    var l1,l2,re1,im1;
    if(disc>=0){var sq=Math.sqrt(disc);l1=(tr+sq)/2;l2=(tr-sq)/2;
      C.text('heroLbl','Valores propios');C.text('resultValue','λ₁ = '+fx(l1,6)+',  λ₂ = '+fx(l2,6));
      tg.textContent=Math.abs(disc)<1e-9?'Un valor propio real repetido':'Dos valores propios reales';
    }else{re1=tr/2;im1=Math.sqrt(-disc)/2;
      C.text('heroLbl','Valores propios (complejos)');C.text('resultValue',fx(re1,6)+' + '+fx(im1,6)+'i,  '+fx(re1,6)+' − '+fx(im1,6)+'i');
      tg.textContent='Par de complejos conjugados';tg.className='sx-ef-grade mid';
    }
    C.text('ex1L','Polinomio característico');C.html('ex1','λ<sup>2</sup> − '+fx(tr,4)+'λ + '+fx(det,4)+' = 0');
    C.text('ex2L','Discriminante');C.text('ex2',fx(disc,6)+(disc<0?' (valores propios complejos)':disc===0?' (valor propio repetido)':' (valores propios reales distintos)'));
    C.text('interp',disc>=0?'Ambos valores propios son reales: A estira el espacio por λ₁ y λ₂ a lo largo de dos direcciones fijas (sus vectores propios).':'A rota además de escalar: no hay ninguna dirección real que A transforme en sí misma.');
    var tilesArr=[['Traza tr(A)',fx(tr,6),'λ₁ + λ₂ (Vieta)'],['Determinante det(A)',fx(det,6),'λ₁ · λ₂ (Vieta)']];
    if(disc>=0){
      function eigvec(l){ /* solve (A - lI)v = 0 */
        var m11=a-l,m12=b,m21=c,m22=d-l,vx,vy;
        if(Math.abs(m12)>1e-9){vx=m12;vy=-m11;}else if(Math.abs(m21)>1e-9){vx=-m22;vy=m21;}else{vx=1;vy=0;}
        var n=Math.sqrt(vx*vx+vy*vy)||1;return [vx/n,vy/n];
      }
      var v1=eigvec(l1),v2=Math.abs(disc)<1e-9?null:eigvec(l2);
      tilesArr.push(['Vector propio de λ₁','('+fx(v1[0],4)+', '+fx(v1[1],4)+')','normalizado, de longitud unitaria']);
      if(v2)tilesArr.push(['Vector propio de λ₂','('+fx(v2[0],4)+', '+fx(v2[1],4)+')','normalizado, de longitud unitaria']);
    }
    tiles(tilesArr);
    vizUnitSquare(a,b,c,d);C.text('vizTag',disc>=0?'λ₁='+fx(l1,3)+', λ₂='+fx(l2,3):'espectro complejo');
    var n3=0,h4='';function st3(t,dd,e){n3++;h4+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Forma el polinomio característico','det(A − λI) = 0 se expande a λ² − tr(A)λ + det(A) = 0 para una matriz 2×2.','tr(A) = '+fx(tr,4)+', det(A) = '+fx(det,4)+' → λ² − ('+fx(tr,4)+')λ + ('+fx(det,4)+') = 0');
    st3('Resuelve con la fórmula cuadrática','λ = [tr(A) ± √(tr(A)² − 4det(A))] / 2.','discriminante = '+fx(tr,4)+'² − 4('+fx(det,4)+') = <b>'+fx(disc,6)+'</b>');
    if(disc>=0)st3('Lee los valores propios','Reales y distintos (o repetidos cuando el discriminante es 0).','λ₁ = <b>'+fx(l1,6)+'</b>,  λ₂ = <b>'+fx(l2,6)+'</b>');
    else st3('Valores propios complejos conjugados','Un discriminante negativo da un par de complejos conjugados, lo que refleja una componente de rotación.','λ = '+fx(re1,6)+' ± '+fx(im1,6)+'i');
    if(disc>=0)st3('Encuentra cada vector propio','Resuelve (A − λI)v = 0 para cada valor propio y luego normaliza.','(A − λ₁I)v = 0 da la dirección que A estira únicamente por λ₁, sin rotación.');
    $('steps').innerHTML=h4;C.text('stepsIntro','Descomposición en valores propios de A = '+mat2(a,b,c,d)+'.');C.text('stepsTag','polinomio caract. de grado 2');
    last='Valores propios de una matriz — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\ntraza = '+tr+', det = '+det+'\neigenvalues: '+(disc>=0?l1+', '+l2:re1+' + '+im1+'i, '+re1+' - '+im1+'i');
    return;
  }

  /* s4: solve Ax = b via Cramer's rule */
  var r1=v('r1'),r2=v('r2');
  if(!isFinite(r1)||!isFinite(r2))return fail('Introduce las dos entradas del vector b.');
  if(Math.abs(det)<1e-9)return fail('det(A) = 0: el sistema es singular. La regla de Cramer necesita un determinante distinto de cero; usa en su lugar la reducción por filas para comprobar si no hay solución o hay infinitas.');
  var detA1=cl(r1*d-b*r2),detA2=cl(a*r2-r1*c);
  var x1=detA1/det,x2=detA2/det;
  C.text('heroLbl','Solución x = A⁻¹b');C.text('resultValue','x₁ = '+fxr(x1,6)+',  x₂ = '+fxr(x2,6));tg.textContent='solución única';
  C.text('ex1L','det(A₁) — columna 1 sustituida por b');C.text('ex1',fx(detA1,6));
  C.text('ex2L','det(A₂) — columna 2 sustituida por b');C.text('ex2',fx(detA2,6));
  C.text('interp','Existe una solución única porque det(A) ≠ 0. Cada incógnita es un cociente de dos determinantes.');
  var check1=cl(a*x1+b*x2),check2=cl(c*x1+d*x2);
  tiles([
    ['A₁ = [[b₁, a₁₂], [b₂, a₂₂]]',mat2(r1,b,r2,d,4),'columna 1 de A sustituida por b'],
    ['A₂ = [[a₁₁, b₁], [a₂₁, b₂]]',mat2(a,r1,c,r2,4),'columna 2 de A sustituida por b'],
    ['Comprobación: A·x',fx(check1,6)+', '+fx(check2,6),'debe ser igual a b = ('+fx(r1,4)+', '+fx(r2,4)+')'],
    ['det(A)',fx(det,6),'denominador de ambos cocientes']
  ]);
  vizUnitSquare(a,b,c,d);C.text('vizTag','x₁='+fx(x1,3)+', x₂='+fx(x2,3));
  var n4=0,h5='';function st4(t,dd,e){n4++;h5+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st4('Plantea el sistema','Ax = b se expande a dos ecuaciones lineales en x₁ y x₂.',fx(a)+'x₁ + '+fx(b)+'x₂ = '+fx(r1)+'<br>'+fx(c)+'x₁ + '+fx(d)+'x₂ = '+fx(r2));
  st4('Sustituye la columna 1 por b para obtener A₁','det(A₁) = b₁·a₂₂ − a₁₂·b₂.','det(A₁) = ('+fx(r1)+')('+fx(d)+') − ('+fx(b)+')('+fx(r2)+') = <b>'+fx(detA1,6)+'</b>');
  st4('Sustituye la columna 2 por b para obtener A₂','det(A₂) = a₁₁·b₂ − b₁·a₂₁.','det(A₂) = ('+fx(a)+')('+fx(r2)+') − ('+fx(r1)+')('+fx(c)+') = <b>'+fx(detA2,6)+'</b>');
  st4('Divide cada uno entre det(A)','xᵢ = det(Aᵢ) ÷ det(A).','x₁ = '+fx(detA1,6)+' ÷ '+fx(det,6)+' = <b>'+fxr(x1,6)+'</b><br>x₂ = '+fx(detA2,6)+' ÷ '+fx(det,6)+' = <b>'+fxr(x2,6)+'</b>');
  $('steps').innerHTML=h5;C.text('stepsIntro','Resolviendo Ax = b para A = '+mat2(a,b,c,d)+', b = ('+fx(r1)+', '+fx(r2)+').');C.text('stepsTag','Regla de Cramer');
  last='Sistema matricial — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\nb = ('+r1+', '+r2+')\nx1 = '+x1+'\nx2 = '+x2;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'mxCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;var p=b.getAttribute('data-a').split(',');C.set('a11',p[0]);C.set('a12',p[1]);C.set('a21',p[2]);C.set('a22',p[3]);fire('a11');});
  $('ident').addEventListener('click',function(){C.set('a11',1);C.set('a12',0);C.set('a21',0);C.set('a22',1);fire('a11');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
