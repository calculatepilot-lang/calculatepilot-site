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
  C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');
}

function classify(a,b,c,d){
  var det=a*d-b*c,tr=a+d,sym=Math.abs(b-c)<1e-9;
  var isOrtho=Math.abs(a*a+c*c-1)<1e-6&&Math.abs(b*b+d*d-1)<1e-6&&Math.abs(a*b+c*d)<1e-6;
  var isDiag=Math.abs(b)<1e-9&&Math.abs(c)<1e-9;
  var labels=[];
  if(Math.abs(det)<1e-9)labels.push('Singulär');else labels.push('Non-singular');
  if(isOrtho)labels.push('Orthogonal');
  if(sym)labels.push('Symmetrisch');
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
  var labels={s1:'Determinante, Inverse &amp; Spur',s2:'Matrixmultiplikation A × B',s3:'Eigenwerte &amp; charakteristisches Polynom',s4:'Lineares Gleichungssystem Ax = b lösen'};
  C.html('formH',labels[m]);
  var a=v('a11'),b=v('a12'),c=v('a21'),d=v('a22');
  if(!isFinite(a)||!isFinite(b)||!isFinite(c)||!isFinite(d))return fail('Geben Sie alle vier Einträge der Matrix A ein.');
  C.html('fxNow','A = '+matHTML(a,b,c,d));
  var det=cl(a*d-b*c),tr=cl(a+d);

  if(m==='s1'){
    C.text('heroLbl','Determinante det(A)');C.text('resultValue',fxr(det,6));tg.textContent=Math.abs(det)<1e-9?'Singulär (keine Inverse)':'Non-singular';tg.className='sx-ef-grade'+(Math.abs(det)<1e-9?' mid':'');
    C.text('ex1L','Inverse A⁻¹');
    if(Math.abs(det)<1e-9)C.text('ex1','undefined');
    else{var ia=d/det,ib=-b/det,ic=-c/det,id=a/det;C.html('ex1',matHTML(ia,ib,ic,id,6));}
    C.text('ex2L','Klassifizierung');C.text('ex2',classify(a,b,c,d));
    C.text('interp',Math.abs(det)<1e-9?'Die Zeilen von A sind linear abhängig, daher hat A keine Inverse und die Transformation bildet die Ebene auf eine niedrigere Dimension ab.':'A ist invertierbar — sie bildet das Einheitsquadrat auf ein Parallelogramm mit dem Flächeninhalt |det A| ab = '+fx(Math.abs(det),4)+'.');
    var trans=mat2(a,c,b,d);
    tiles([
      ['Spur tr(A)',fx(tr,6),'a + d, Summe der Diagonale'],
      ['Transponierte Aᵀ',trans,'Zeilen und Spalten vertauscht'],
      ['Rang',Math.abs(det)<1e-9?(a===0&&b===0&&c===0&&d===0?'0':'1'):'2','Anzahl der linear unabhängigen Zeilen'],
      ['|det(A)| — Flächenskalierungsfaktor',fx(Math.abs(det),6),'Faktor, um den A die Fläche skaliert']
    ]);
    vizUnitSquare(a,b,c,d);C.text('vizTag','Fläche × '+fx(Math.abs(det),4));
    var n=0,h='';function st(t,dd,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Determinante berechnen','det(A) = a·d − b·c, das Produkt der Hauptdiagonale minus das Produkt der Nebendiagonale.','det(A) = ('+fx(a)+')('+fx(d)+') − ('+fx(b)+')('+fx(c)+') = '+fx(a*d)+' − '+fx(b*c)+' = <b>'+fx(det,6)+'</b>');
    if(Math.abs(det)>=1e-9)st('Inverse aus der Adjunkten bilden','Vertauschen Sie die Hauptdiagonale, kehren Sie das Vorzeichen der Nebendiagonale um und teilen Sie dann jeden Eintrag durch det(A).','adj(A) = [[d, −b], [−c, a]] = '+mat2(d,-b,-c,a)+'<br>A⁻¹ = (1/'+fx(det,6)+')·adj(A) = <b>'+mat2(d/det,-b/det,-c/det,a/det,6)+'</b>');
    else st('Determinante ist null','Eine singuläre Matrix hat keine Inverse — ihre Zeilen sind Vielfache voneinander.','a/c = '+(c!==0?fx(a/c,4):'—')+' und b/d = '+(d!==0?fx(b/d,4):'—')+' (gleich, wenn singulär durch ein Zeilenvielfaches)');
    if(Math.abs(det)>=1e-9)st('A·A⁻¹ = I prüfen','Multiplizieren Sie A mit der berechneten Inversen; das Ergebnis sollte die Einheitsmatrix sein.',(function(){var ia=d/det,ib=-b/det,ic=-c/det,idd=a/det;var r11=a*ia+b*ic,r12=a*ib+b*idd,r21=c*ia+d*ic,r22=c*ib+d*idd;return mat2(r11,r12,r21,r22)+' = I ✓';})());
    $('steps').innerHTML=h;C.text('stepsIntro','A = '+mat2(a,b,c,d)+'.');C.text('stepsTag','det = '+fx(det,4));
    last='Matrix — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\ndet(A) = '+det+'\nSpur = '+tr+(Math.abs(det)>=1e-9?'\nInverse = '+mat2(d/det,-b/det,-c/det,a/det,6):'\nInverse: nicht definiert (singulär)');
    return;
  }

  if(m==='s2'){
    var e=v('b11'),f=v('b12'),g=v('b21'),h2=v('b22');
    if(!isFinite(e)||!isFinite(f)||!isFinite(g)||!isFinite(h2))return fail('Geben Sie alle vier Einträge der Matrix B ein.');
    var r11=a*e+b*g,r12=a*f+b*h2,r21=c*e+d*g,r22=c*f+d*h2;
    C.text('heroLbl','Produkt A × B');C.html('resultValue',matHTML(r11,r12,r21,r22,6));tg.textContent='2×2-Ergebnis';
    var s11=e*a+f*c,s12=e*b+f*d,s21=g*a+h2*c,s22=g*b+h2*d;
    var commutes=Math.abs(r11-s11)<1e-7&&Math.abs(r12-s12)<1e-7&&Math.abs(r21-s21)<1e-7&&Math.abs(r22-s22)<1e-7;
    C.text('ex1L','B × A');C.html('ex1',matHTML(s11,s12,s21,s22,6));
    C.text('ex2L','Stimmen A×B und B×A überein?');C.text('ex2',commutes?'Ja (dieses Paar ist vertauschbar)':'Nein — die Matrixmultiplikation ist nicht kommutativ');
    C.text('interp','Zeile i von A wird mit Spalte j von B skalar multipliziert und ergibt den Eintrag (i, j) des Produkts.');
    tiles([['det(A)',fx(det,6),''],['det(B)',fx(cl(e*h2-f*g),6),''],['det(A×B)',fx(cl((a*e+b*g)*(c*f+d*h2)-(a*f+b*h2)*(c*e+d*g)),6),'entspricht det(A) × det(B)'],['Probe: det(A)·det(B)',fx(cl(det*(e*h2-f*g)),6),'die Multiplikativität']]);
    vizUnitSquare(r11,r12,r21,r22);C.text('vizTag','A × B angewendet auf das Einheitsquadrat');
    var n2=0,h3='';function st2(t,dd,ee){n2++;h3+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+ee+'</span></li>';}
    st2('Zeile × Spalte','Eintrag (1,1) von A×B ist Zeile 1 von A skalar multipliziert mit Spalte 1 von B.','(1,1): ('+fx(a)+')('+fx(e)+') + ('+fx(b)+')('+fx(g)+') = <b>'+fx(r11,6)+'</b>');
    st2('Für jeden Eintrag wiederholen','Jeder der vier Einträge folgt derselben Regel „Zeile mal Spalte“.','(1,2) = <b>'+fx(r12,6)+'</b>, (2,1) = <b>'+fx(r21,6)+'</b>, (2,2) = <b>'+fx(r22,6)+'</b>');
    st2('Mit der Determinantenregel prüfen','det(AB) ist stets gleich det(A)·det(B), obwohl AB ≠ BA im Allgemeinen gilt.','det(A)·det(B) = ('+fx(det,4)+')·('+fx(cl(e*h2-f*g),4)+') = <b>'+fx(cl(det*(e*h2-f*g)),6)+'</b>');
    $('steps').innerHTML=h3;C.text('stepsIntro','A × B für A = '+mat2(a,b,c,d)+', B = '+mat2(e,f,g,h2)+'.');C.text('stepsTag','2×2 · 2×2');
    last='Matrixmultiplikation — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\nB = '+mat2(e,f,g,h2,6)+'\nA×B = '+mat2(r11,r12,r21,r22,6);
    return;
  }

  if(m==='s3'){
    var disc=cl(tr*tr-4*det);
    var l1,l2,re1,im1;
    if(disc>=0){var sq=Math.sqrt(disc);l1=(tr+sq)/2;l2=(tr-sq)/2;
      C.text('heroLbl','Eigenwerte');C.text('resultValue','λ₁ = '+fx(l1,6)+',  λ₂ = '+fx(l2,6));
      tg.textContent=Math.abs(disc)<1e-9?'Ein doppelter reeller Eigenwert':'Zwei reelle Eigenwerte';
    }else{re1=tr/2;im1=Math.sqrt(-disc)/2;
      C.text('heroLbl','Eigenwerte (komplex)');C.text('resultValue',fx(re1,6)+' + '+fx(im1,6)+'i,  '+fx(re1,6)+' − '+fx(im1,6)+'i');
      tg.textContent='Komplex konjugiertes Paar';tg.className='sx-ef-grade mid';
    }
    C.text('ex1L','Charakteristisches Polynom');C.html('ex1','λ<sup>2</sup> − '+fx(tr,4)+'λ + '+fx(det,4)+' = 0');
    C.text('ex2L','Diskriminante');C.text('ex2',fx(disc,6)+(disc<0?' (komplexe Eigenwerte)':disc===0?' (doppelter Eigenwert)':' (verschiedene reelle Eigenwerte)'));
    C.text('interp',disc>=0?'Beide Eigenwerte sind reell: A streckt den Raum um λ₁ und λ₂ entlang zweier fester Richtungen (ihrer Eigenvektoren).':'A dreht und skaliert zugleich — es gibt keine reelle Richtung, die A auf sich selbst abbildet.');
    var tilesArr=[['Spur tr(A)',fx(tr,6),'λ₁ + λ₂ (Vieta)'],['Determinante det(A)',fx(det,6),'λ₁ · λ₂ (Vieta)']];
    if(disc>=0){
      function eigvec(l){ /* solve (A - lI)v = 0 */
        var m11=a-l,m12=b,m21=c,m22=d-l,vx,vy;
        if(Math.abs(m12)>1e-9){vx=m12;vy=-m11;}else if(Math.abs(m21)>1e-9){vx=-m22;vy=m21;}else{vx=1;vy=0;}
        var n=Math.sqrt(vx*vx+vy*vy)||1;return [vx/n,vy/n];
      }
      var v1=eigvec(l1),v2=Math.abs(disc)<1e-9?null:eigvec(l2);
      tilesArr.push(['Eigenvektor zu λ₁','('+fx(v1[0],4)+', '+fx(v1[1],4)+')','normiert, Einheitslänge']);
      if(v2)tilesArr.push(['Eigenvektor zu λ₂','('+fx(v2[0],4)+', '+fx(v2[1],4)+')','normiert, Einheitslänge']);
    }
    tiles(tilesArr);
    vizUnitSquare(a,b,c,d);C.text('vizTag',disc>=0?'λ₁='+fx(l1,3)+', λ₂='+fx(l2,3):'komplexes Spektrum');
    var n3=0,h4='';function st3(t,dd,e){n3++;h4+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Charakteristisches Polynom aufstellen','det(A − λI) = 0 ergibt für eine 2×2-Matrix λ² − tr(A)λ + det(A) = 0.','tr(A) = '+fx(tr,4)+', det(A) = '+fx(det,4)+' → λ² − ('+fx(tr,4)+')λ + ('+fx(det,4)+') = 0');
    st3('Mit der Lösungsformel für quadratische Gleichungen lösen','λ = [tr(A) ± √(tr(A)² − 4det(A))] / 2.','Diskriminante = '+fx(tr,4)+'² − 4('+fx(det,4)+') = <b>'+fx(disc,6)+'</b>');
    if(disc>=0)st3('Eigenwerte ablesen','Reell und verschieden (oder doppelt, wenn die Diskriminante 0 ist).','λ₁ = <b>'+fx(l1,6)+'</b>,  λ₂ = <b>'+fx(l2,6)+'</b>');
    else st3('Komplex konjugierte Eigenwerte','Eine negative Diskriminante ergibt ein komplex konjugiertes Paar und zeigt eine Drehkomponente an.','λ = '+fx(re1,6)+' ± '+fx(im1,6)+'i');
    if(disc>=0)st3('Jeden Eigenvektor bestimmen','Lösen Sie (A − λI)v = 0 für jeden Eigenwert und normieren Sie anschließend.','(A − λ₁I)v = 0 liefert die Richtung, die A rein um λ₁ streckt, ohne Drehung.');
    $('steps').innerHTML=h4;C.text('stepsIntro','Eigenzerlegung von A = '+mat2(a,b,c,d)+'.');C.text('stepsTag','char. Polynom Grad 2');
    last='Matrix-Eigenwerte — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\nSpur = '+tr+', det = '+det+'\neigenvalues: '+(disc>=0?l1+', '+l2:re1+' + '+im1+'i, '+re1+' - '+im1+'i');
    return;
  }

  /* s4: solve Ax = b via Cramer's rule */
  var r1=v('r1'),r2=v('r2');
  if(!isFinite(r1)||!isFinite(r2))return fail('Geben Sie beide Einträge des Vektors b ein.');
  if(Math.abs(det)<1e-9)return fail('det(A) = 0 — das System ist singulär. Die Cramersche Regel benötigt eine Determinante ungleich null; prüfen Sie stattdessen per Zeilenreduktion, ob es keine oder unendlich viele Lösungen gibt.');
  var detA1=cl(r1*d-b*r2),detA2=cl(a*r2-r1*c);
  var x1=detA1/det,x2=detA2/det;
  C.text('heroLbl','Lösung x = A⁻¹b');C.text('resultValue','x₁ = '+fxr(x1,6)+',  x₂ = '+fxr(x2,6));tg.textContent='eindeutige Lösung';
  C.text('ex1L','det(A₁) — Spalte 1 durch b ersetzt');C.text('ex1',fx(detA1,6));
  C.text('ex2L','det(A₂) — Spalte 2 durch b ersetzt');C.text('ex2',fx(detA2,6));
  C.text('interp','Es gibt eine eindeutige Lösung, weil det(A) ≠ 0. Jede Unbekannte ist ein Quotient zweier Determinanten.');
  var check1=cl(a*x1+b*x2),check2=cl(c*x1+d*x2);
  tiles([
    ['A₁ = [[b₁, a₁₂], [b₂, a₂₂]]',mat2(r1,b,r2,d,4),'Spalte 1 von A durch b ersetzt'],
    ['A₂ = [[a₁₁, b₁], [a₂₁, b₂]]',mat2(a,r1,c,r2,4),'Spalte 2 von A durch b ersetzt'],
    ['Probe: A·x',fx(check1,6)+', '+fx(check2,6),'sollte b = ('+fx(r1,4)+', '+fx(r2,4)+')'],
    ['det(A)',fx(det,6),'Nenner für beide Quotienten']
  ]);
  vizUnitSquare(a,b,c,d);C.text('vizTag','x₁='+fx(x1,3)+', x₂='+fx(x2,3));
  var n4=0,h5='';function st4(t,dd,e){n4++;h5+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st4('System aufstellen','Ax = b ergibt zwei lineare Gleichungen in x₁ und x₂.',fx(a)+'x₁ + '+fx(b)+'x₂ = '+fx(r1)+'<br>'+fx(c)+'x₁ + '+fx(d)+'x₂ = '+fx(r2));
  st4('Spalte 1 durch b ersetzen, um A₁ zu erhalten','det(A₁) = b₁·a₂₂ − a₁₂·b₂.','det(A₁) = ('+fx(r1)+')('+fx(d)+') − ('+fx(b)+')('+fx(r2)+') = <b>'+fx(detA1,6)+'</b>');
  st4('Spalte 2 durch b ersetzen, um A₂ zu erhalten','det(A₂) = a₁₁·b₂ − b₁·a₂₁.','det(A₂) = ('+fx(a)+')('+fx(r2)+') − ('+fx(r1)+')('+fx(c)+') = <b>'+fx(detA2,6)+'</b>');
  st4('Jeweils durch det(A) teilen','xᵢ = det(Aᵢ) ÷ det(A).','x₁ = '+fx(detA1,6)+' ÷ '+fx(det,6)+' = <b>'+fxr(x1,6)+'</b><br>x₂ = '+fx(detA2,6)+' ÷ '+fx(det,6)+' = <b>'+fxr(x2,6)+'</b>');
  $('steps').innerHTML=h5;C.text('stepsIntro','Lösen von Ax = b für A = '+mat2(a,b,c,d)+', b = ('+fx(r1)+', '+fx(r2)+').');C.text('stepsTag','Cramersche Regel');
  last='Matrixsystem — calculatepilot.com/math/matrix-calculator.html\nA = '+mat2(a,b,c,d,6)+'\nb = ('+r1+', '+r2+')\nx1 = '+x1+'\nx2 = '+x2;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'mxCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;var p=b.getAttribute('data-a').split(',');C.set('a11',p[0]);C.set('a12',p[1]);C.set('a21',p[2]);C.set('a22',p[3]);fire('a11');});
  $('ident').addEventListener('click',function(){C.set('a11',1);C.set('a12',0);C.set('a21',0);C.set('a22',1);fire('a11');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
