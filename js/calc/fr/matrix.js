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
  C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');
}

function classify(a,b,c,d){
  var det=a*d-b*c,tr=a+d,sym=Math.abs(b-c)<1e-9;
  var isOrtho=Math.abs(a*a+c*c-1)<1e-6&&Math.abs(b*b+d*d-1)<1e-6&&Math.abs(a*b+c*d)<1e-6;
  var isDiag=Math.abs(b)<1e-9&&Math.abs(c)<1e-9;
  var labels=[];
  if(Math.abs(det)<1e-9)labels.push('Singulière');else labels.push('Non-singular');
  if(isOrtho)labels.push('Orthogonale');
  if(sym)labels.push('Symétrique');
  if(isDiag)labels.push('Diagonale');
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
  var labels={s1:'Déterminant, inverse &amp; trace',s2:'Multiplication matricielle A × B',s3:'Valeurs propres &amp; polynôme caractéristique',s4:'Résoudre le système linéaire Ax = b'};
  C.html('formH',labels[m]);
  var a=v('a11'),b=v('a12'),c=v('a21'),d=v('a22');
  if(!isFinite(a)||!isFinite(b)||!isFinite(c)||!isFinite(d))return fail('Saisissez les quatre coefficients de la matrice A.');
  C.html('fxNow','A = '+matHTML(a,b,c,d));
  var det=cl(a*d-b*c),tr=cl(a+d);

  if(m==='s1'){
    C.text('heroLbl','Déterminant det(A)');C.text('resultValue',fxr(det,6));tg.textContent=Math.abs(det)<1e-9?'Singulière (pas d\'inverse)':'Non-singular';tg.className='sx-ef-grade'+(Math.abs(det)<1e-9?' mid':'');
    C.text('ex1L','Inverse A⁻¹');
    if(Math.abs(det)<1e-9)C.text('ex1','undefined');
    else{var ia=d/det,ib=-b/det,ic=-c/det,id=a/det;C.html('ex1',matHTML(ia,ib,ic,id,6));}
    C.text('ex2L','Classification');C.text('ex2',classify(a,b,c,d));
    C.text('interp',Math.abs(det)<1e-9?'Les lignes de A sont linéairement dépendantes : A n\'a donc pas d\'inverse et la transformation écrase le plan.':'A est inversible — elle transforme le carré unité en un parallélogramme d\'aire |det A| = '+fx(Math.abs(det),4)+'.');
    var trans=mat2(a,c,b,d);
    tiles([
      ['Trace tr(A)',fx(tr,6),'a + d, somme de la diagonale'],
      ['Transposée Aᵀ',trans,'lignes et colonnes échangées'],
      ['Rang',Math.abs(det)<1e-9?(a===0&&b===0&&c===0&&d===0?'0':'1'):'2','nombre de lignes indépendantes'],
      ['|det(A)| — facteur d\'échelle des aires',fx(Math.abs(det),6),'facteur par lequel A multiplie les aires']
    ]);
    vizUnitSquare(a,b,c,d);C.text('vizTag','aire × '+fx(Math.abs(det),4));
    var n=0,h='';function st(t,dd,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Calculer le déterminant','det(A) = a·d − b·c, le produit de la diagonale principale moins le produit de l\'antidiagonale.','det(A) = ('+fx(a)+')('+fx(d)+') − ('+fx(b)+')('+fx(c)+') = '+fx(a*d)+' − '+fx(b*c)+' = <b>'+fx(det,6)+'</b>');
    if(Math.abs(det)>=1e-9)st('Construire l\'inverse à partir de l\'adjointe','Échangez les termes de la diagonale principale, changez le signe de l\'antidiagonale, puis divisez chaque coefficient par det(A).','adj(A) = [[d, −b], [−c, a]] = '+mat2(d,-b,-c,a)+'<br>A⁻¹ = (1/'+fx(det,6)+')·adj(A) = <b>'+mat2(d/det,-b/det,-c/det,a/det,6)+'</b>');
    else st('Le déterminant est nul','Une matrice singulière n\'a pas d\'inverse — ses lignes sont des multiples scalaires l\'une de l\'autre.','a/c = '+(c!==0?fx(a/c,4):'—')+' et b/d = '+(d!==0?fx(b/d,4):'—')+' (égaux lorsque la matrice est singulière, par multiple de ligne)');
    if(Math.abs(det)>=1e-9)st('Vérifier A·A⁻¹ = I','Multipliez A par l\'inverse calculé ; le résultat doit être la matrice identité.',(function(){var ia=d/det,ib=-b/det,ic=-c/det,idd=a/det;var r11=a*ia+b*ic,r12=a*ib+b*idd,r21=c*ia+d*ic,r22=c*ib+d*idd;return mat2(r11,r12,r21,r22)+' = I ✓';})());
    $('steps').innerHTML=h;C.text('stepsIntro','A = '+mat2(a,b,c,d)+'.');C.text('stepsTag','det = '+fx(det,4));
    last='Matrice — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\ndet(A) = '+det+'\ntrace = '+tr+(Math.abs(det)>=1e-9?'\ninverse = '+mat2(d/det,-b/det,-c/det,a/det,6):'\ninverse : non défini (singulière)');
    return;
  }

  if(m==='s2'){
    var e=v('b11'),f=v('b12'),g=v('b21'),h2=v('b22');
    if(!isFinite(e)||!isFinite(f)||!isFinite(g)||!isFinite(h2))return fail('Saisissez les quatre coefficients de la matrice B.');
    var r11=a*e+b*g,r12=a*f+b*h2,r21=c*e+d*g,r22=c*f+d*h2;
    C.text('heroLbl','Produit A × B');C.html('resultValue',matHTML(r11,r12,r21,r22,6));tg.textContent='résultat 2×2';
    var s11=e*a+f*c,s12=e*b+f*d,s21=g*a+h2*c,s22=g*b+h2*d;
    var commutes=Math.abs(r11-s11)<1e-7&&Math.abs(r12-s12)<1e-7&&Math.abs(r21-s21)<1e-7&&Math.abs(r22-s22)<1e-7;
    C.text('ex1L','B × A');C.html('ex1',matHTML(s11,s12,s21,s22,6));
    C.text('ex2L','A×B et B×A sont-ils égaux ?');C.text('ex2',commutes?'Oui (ce couple commute)':'Non — la multiplication matricielle n\'est pas commutative');
    C.text('interp','La ligne i de A est multipliée scalairement par la colonne j de B pour donner le coefficient (i, j) du produit.');
    tiles([['det(A)',fx(det,6),''],['det(B)',fx(cl(e*h2-f*g),6),''],['det(A×B)',fx(cl((a*e+b*g)*(c*f+d*h2)-(a*f+b*h2)*(c*e+d*g)),6),'est égal à det(A) × det(B)'],['Vérification : det(A)·det(B)',fx(cl(det*(e*h2-f*g)),6),'la propriété multiplicative']]);
    vizUnitSquare(r11,r12,r21,r22);C.text('vizTag','A × B appliquée au carré unité');
    var n2=0,h3='';function st2(t,dd,ee){n2++;h3+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+ee+'</span></li>';}
    st2('Ligne × colonne','Le coefficient (1,1) de A×B est la ligne 1 de A multipliée scalairement par la colonne 1 de B.','(1,1): ('+fx(a)+')('+fx(e)+') + ('+fx(b)+')('+fx(g)+') = <b>'+fx(r11,6)+'</b>');
    st2('Répéter pour chaque coefficient','Chacun des quatre coefficients suit la même règle ligne par colonne.','(1,2) = <b>'+fx(r12,6)+'</b>, (2,1) = <b>'+fx(r21,6)+'</b>, (2,2) = <b>'+fx(r22,6)+'</b>');
    st2('Vérifier avec l\'identité du déterminant','det(AB) est toujours égal à det(A)·det(B), même si AB ≠ BA en général.','det(A)·det(B) = ('+fx(det,4)+')·('+fx(cl(e*h2-f*g),4)+') = <b>'+fx(cl(det*(e*h2-f*g)),6)+'</b>');
    $('steps').innerHTML=h3;C.text('stepsIntro','A × B pour A = '+mat2(a,b,c,d)+', B = '+mat2(e,f,g,h2)+'.');C.text('stepsTag','2×2 · 2×2');
    last='Multiplication matricielle — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\nB = '+mat2(e,f,g,h2,6)+'\nA×B = '+mat2(r11,r12,r21,r22,6);
    return;
  }

  if(m==='s3'){
    var disc=cl(tr*tr-4*det);
    var l1,l2,re1,im1;
    if(disc>=0){var sq=Math.sqrt(disc);l1=(tr+sq)/2;l2=(tr-sq)/2;
      C.text('heroLbl','Valeurs propres');C.text('resultValue','λ₁ = '+fx(l1,6)+',  λ₂ = '+fx(l2,6));
      tg.textContent=Math.abs(disc)<1e-9?'Une valeur propre réelle double':'Deux valeurs propres réelles';
    }else{re1=tr/2;im1=Math.sqrt(-disc)/2;
      C.text('heroLbl','Valeurs propres (complexes)');C.text('resultValue',fx(re1,6)+' + '+fx(im1,6)+'i,  '+fx(re1,6)+' − '+fx(im1,6)+'i');
      tg.textContent='Paire de complexes conjugués';tg.className='sx-ef-grade mid';
    }
    C.text('ex1L','Polynôme caractéristique');C.html('ex1','λ<sup>2</sup> − '+fx(tr,4)+'λ + '+fx(det,4)+' = 0');
    C.text('ex2L','Discriminant');C.text('ex2',fx(disc,6)+(disc<0?' (valeurs propres complexes)':disc===0?' (valeur propre double)':' (valeurs propres réelles distinctes)'));
    C.text('interp',disc>=0?'Les deux valeurs propres sont réelles : A étire l\'espace de λ₁ et λ₂ selon deux directions fixes (ses vecteurs propres).':'A effectue une rotation en plus d\'un changement d\'échelle — aucune direction réelle n\'est envoyée sur elle-même par A.');
    var tilesArr=[['Trace tr(A)',fx(tr,6),'λ₁ + λ₂ (Viète)'],['Déterminant det(A)',fx(det,6),'λ₁ · λ₂ (Viète)']];
    if(disc>=0){
      function eigvec(l){ /* solve (A - lI)v = 0 */
        var m11=a-l,m12=b,m21=c,m22=d-l,vx,vy;
        if(Math.abs(m12)>1e-9){vx=m12;vy=-m11;}else if(Math.abs(m21)>1e-9){vx=-m22;vy=m21;}else{vx=1;vy=0;}
        var n=Math.sqrt(vx*vx+vy*vy)||1;return [vx/n,vy/n];
      }
      var v1=eigvec(l1),v2=Math.abs(disc)<1e-9?null:eigvec(l2);
      tilesArr.push(['Vecteur propre pour λ₁','('+fx(v1[0],4)+', '+fx(v1[1],4)+')','normalisé, de longueur unité']);
      if(v2)tilesArr.push(['Vecteur propre pour λ₂','('+fx(v2[0],4)+', '+fx(v2[1],4)+')','normalisé, de longueur unité']);
    }
    tiles(tilesArr);
    vizUnitSquare(a,b,c,d);C.text('vizTag',disc>=0?'λ₁='+fx(l1,3)+', λ₂='+fx(l2,3):'spectre complexe');
    var n3=0,h4='';function st3(t,dd,e){n3++;h4+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Former le polynôme caractéristique','det(A − λI) = 0 se développe en λ² − tr(A)λ + det(A) = 0 pour une matrice 2×2.','tr(A) = '+fx(tr,4)+', det(A) = '+fx(det,4)+' → λ² − ('+fx(tr,4)+')λ + ('+fx(det,4)+') = 0');
    st3('Résoudre avec la formule quadratique','λ = [tr(A) ± √(tr(A)² − 4det(A))] / 2.','discriminant = '+fx(tr,4)+'² − 4('+fx(det,4)+') = <b>'+fx(disc,6)+'</b>');
    if(disc>=0)st3('En déduire les valeurs propres','Réelles et distinctes (ou doubles lorsque le discriminant vaut 0).','λ₁ = <b>'+fx(l1,6)+'</b>,  λ₂ = <b>'+fx(l2,6)+'</b>');
    else st3('Valeurs propres complexes conjuguées','Un discriminant négatif donne une paire de complexes conjugués, signe d\'une composante de rotation.','λ = '+fx(re1,6)+' ± '+fx(im1,6)+'i');
    if(disc>=0)st3('Trouver chaque vecteur propre','Résolvez (A − λI)v = 0 pour chaque valeur propre, puis normalisez.','(A − λ₁I)v = 0 donne la direction que A étire uniquement d\'un facteur λ₁, sans rotation.');
    $('steps').innerHTML=h4;C.text('stepsIntro','Décomposition spectrale de A = '+mat2(a,b,c,d)+'.');C.text('stepsTag','polynôme caract. de degré 2');
    last='Valeurs propres d\'une matrice — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\ntrace = '+tr+', det = '+det+'\neigenvalues: '+(disc>=0?l1+', '+l2:re1+' + '+im1+'i, '+re1+' - '+im1+'i');
    return;
  }

  /* s4: solve Ax = b via Cramer's rule */
  var r1=v('r1'),r2=v('r2');
  if(!isFinite(r1)||!isFinite(r2))return fail('Saisissez les deux coefficients du vecteur b.');
  if(Math.abs(det)<1e-9)return fail('det(A) = 0 — le système est singulier. La règle de Cramer exige un déterminant non nul ; utilisez plutôt la réduction par lignes pour vérifier l\'absence de solution ou l\'existence d\'une infinité de solutions.');
  var detA1=cl(r1*d-b*r2),detA2=cl(a*r2-r1*c);
  var x1=detA1/det,x2=detA2/det;
  C.text('heroLbl','Solution x = A⁻¹b');C.text('resultValue','x₁ = '+fxr(x1,6)+',  x₂ = '+fxr(x2,6));tg.textContent='solution unique';
  C.text('ex1L','det(A₁) — colonne 1 remplacée par b');C.text('ex1',fx(detA1,6));
  C.text('ex2L','det(A₂) — colonne 2 remplacée par b');C.text('ex2',fx(detA2,6));
  C.text('interp','Il existe une solution unique car det(A) ≠ 0. Chaque inconnue est un rapport de deux déterminants.');
  var check1=cl(a*x1+b*x2),check2=cl(c*x1+d*x2);
  tiles([
    ['A₁ = [[b₁, a₁₂], [b₂, a₂₂]]',mat2(r1,b,r2,d,4),'colonne 1 de A remplacée par b'],
    ['A₂ = [[a₁₁, b₁], [a₂₁, b₂]]',mat2(a,r1,c,r2,4),'colonne 2 de A remplacée par b'],
    ['Vérification : A·x',fx(check1,6)+', '+fx(check2,6),'doit être égal à b = ('+fx(r1,4)+', '+fx(r2,4)+')'],
    ['det(A)',fx(det,6),'dénominateur des deux rapports']
  ]);
  vizUnitSquare(a,b,c,d);C.text('vizTag','x₁='+fx(x1,3)+', x₂='+fx(x2,3));
  var n4=0,h5='';function st4(t,dd,e){n4++;h5+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st4('Poser le système','Ax = b se développe en deux équations linéaires en x₁ et x₂.',fx(a)+'x₁ + '+fx(b)+'x₂ = '+fx(r1)+'<br>'+fx(c)+'x₁ + '+fx(d)+'x₂ = '+fx(r2));
  st4('Remplacer la colonne 1 par b pour obtenir A₁','det(A₁) = b₁·a₂₂ − a₁₂·b₂.','det(A₁) = ('+fx(r1)+')('+fx(d)+') − ('+fx(b)+')('+fx(r2)+') = <b>'+fx(detA1,6)+'</b>');
  st4('Remplacer la colonne 2 par b pour obtenir A₂','det(A₂) = a₁₁·b₂ − b₁·a₂₁.','det(A₂) = ('+fx(a)+')('+fx(r2)+') − ('+fx(r1)+')('+fx(c)+') = <b>'+fx(detA2,6)+'</b>');
  st4('Diviser chacun par det(A)','xᵢ = det(Aᵢ) ÷ det(A).','x₁ = '+fx(detA1,6)+' ÷ '+fx(det,6)+' = <b>'+fxr(x1,6)+'</b><br>x₂ = '+fx(detA2,6)+' ÷ '+fx(det,6)+' = <b>'+fxr(x2,6)+'</b>');
  $('steps').innerHTML=h5;C.text('stepsIntro','Résolution de Ax = b pour A = '+mat2(a,b,c,d)+', b = ('+fx(r1)+', '+fx(r2)+').');C.text('stepsTag','Règle de Cramer');
  last='Système matriciel — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\nb = ('+r1+', '+r2+')\nx1 = '+x1+'\nx2 = '+x2;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'mxCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;var p=b.getAttribute('data-a').split(',');C.set('a11',p[0]);C.set('a12',p[1]);C.set('a21',p[2]);C.set('a22',p[3]);fire('a11');});
  $('ident').addEventListener('click',function(){C.set('a11',1);C.set('a12',0);C.set('a21',0);C.set('a22',1);fire('a11');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
