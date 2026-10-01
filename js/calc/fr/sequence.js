/* Sequence calculator — CalculatePilot (Stitch redesign).
   Arithmetic: aₙ=a1+(n-1)d, Sₙ=n/2(a1+aₙ). Geometric: aₙ=a1·r^(n-1), Sₙ=a1(1-r^n)/(1-r), S∞=a1/(1-r) for |r|<1.
   Fibonacci/Lucas: exact BigInt fast doubling. Custom order-2 recurrence aₙ=p·aₙ₋₁+q·aₙ₋₂: exact BigInt 2×2 matrix power. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function fx(x,dp){dp=dp===undefined?6:dp;if(!isFinite(x))return x>0?'∞':'−∞';if(Math.abs(x-Math.round(x))<1e-9)return String(Math.round(x));var s=x.toFixed(dp).replace(/0+$/,'').replace(/[.,]$/,'');return s;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>60?s.slice(0,14)+'…'+s.slice(-6)+' ('+s.length+' chiffres)':grp(s);}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

/* exact Fibonacci/Lucas via fast doubling (BigInt); returns [F(n), F(n+1)] */
function fibPair(n){
  if(n===0)return [0n,1n];
  var p=fibPair(Math.floor(n/2)),a=p[0],b=p[1];
  var c=a*(2n*b-a),d=a*a+b*b;
  return n%2===0?[c,d]:[d,c+d];
}
function fib(n){return n<0?null:fibPair(n)[0];}
function lucas(n){ /* L(n) = F(n-1)+F(n+1) = 2F(n+1)-F(n) */ if(n===0)return 2n;var p=fibPair(n);return 2n*p[1]-p[0];}

/* order-2 linear recurrence a(n)=p*a(n-1)+q*a(n-2) via 2x2 matrix power (BigInt) */
function matmul(A,B){return [
  [A[0][0]*B[0][0]+A[0][1]*B[1][0], A[0][0]*B[0][1]+A[0][1]*B[1][1]],
  [A[1][0]*B[0][0]+A[1][1]*B[1][0], A[1][0]*B[0][1]+A[1][1]*B[1][1]]
];}
function matpow(M,e){
  var r=[[1n,0n],[0n,1n]],base=M;
  while(e>0n){if(e&1n)r=matmul(r,base);base=matmul(base,base);e>>=1n;}
  return r;
}
/* seeds a1,a2 (BigInt); returns a(k) for k>=1 */
function recTerm(p,q,a1,a2,k){
  if(k===1n)return a1;if(k===2n)return a2;
  var M=[[p,q],[1n,0n]],P=matpow(M,k-2n);
  return P[0][0]*a2+P[0][1]*a1;
}

function plot(xs,ys,label){
  var W=760,H=300,pad=44;
  var lo=Math.min.apply(null,xs),hi=Math.max.apply(null,xs);if(hi===lo)hi=lo+1;
  var ymin=Math.min.apply(null,ys),ymax=Math.max.apply(null,ys);if(ymax===ymin){ymax+=1;ymin-=1;}
  var sy=(ymax-ymin)*0.12;ymin-=sy;ymax+=sy;
  var kx=(W-2*pad)/(hi-lo),ky=(H-2*pad)/(ymax-ymin);
  var X=function(x){return pad+(x-lo)*kx;},Y=function(y){return H-pad-(y-ymin)*ky;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  if(0>=ymin&&0<=ymax)s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  var pts=[];for(var i=0;i<xs.length;i++)pts.push(X(xs[i]).toFixed(1)+','+Y(ys[i]).toFixed(1));
  s+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--sx-primary)" stroke-width="2"/>';
  for(i=0;i<xs.length;i++)s+='<circle cx="'+X(xs[i]).toFixed(1)+'" cy="'+Y(ys[i]).toFixed(1)+'" r="4" fill="var(--sx-primary)"/>';
  s+='<text class="ax" x="'+pad+'" y="18" style="fill:var(--sx-muted)">'+esc(label||'aₙ')+'</text>';
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fAP').hidden=(m!=='s1');$('fGP').hidden=(m!=='s2');$('fFib').hidden=(m!=='s3');$('fRec').hidden=(m!=='s4');
  var labels={s1:'Suite arithmétique',s2:'Suite géométrique',s3:'Nombres de Fibonacci &amp; de Lucas',s4:'Récurrence d’ordre 2 personnalisée'};
  C.html('formH',labels[m]);
  var n=parseInt($('n').value,10);
  if(!isFinite(n)||n<1||n>5000)return fail('n doit être un nombre entier de 1 à 5000.');

  if(m==='s1'){
    var a1=parseFloat($('a1').value),d=parseFloat($('d').value);
    if(!isFinite(a1)||!isFinite(d))return fail('Saisissez a₁ et d.');
    var an=a1+(n-1)*d,sn=n/2*(a1+an);
    C.html('heroLbl','a<sub>'+n+'</sub> (terme cible)');C.text('resultValue',fx(an));tg.textContent=d===0?'constant':d>0?'increasing':'decreasing';
    C.html('ex1L','Somme partielle S<sub>'+n+'</sub>');C.text('ex1',fx(sn));
    C.html('ex2L','Formule explicite');C.html('ex2','a<sub>n</sub> = '+fx(a1)+' + (n−1)('+fx(d)+')');
    C.text('interp','Chaque terme ajoute '+fx(d)+' au précédent, donc le '+n+'e terme vaut '+fx(a1)+' plus '+(n-1)+' pas de '+fx(d)+'.');
    C.html('fxNow','a<sub>n</sub> = a<sub>1</sub> + (n−1)d, a₁='+fx(a1)+', d='+fx(d));
    tiles([['Premier terme a₁',fx(a1),''],['Raison d',fx(d),''],['Forme récursive','aₙ = aₙ₋₁ + '+fx(d),'a₁ = '+fx(a1)],['Formule de la somme','Sₙ = n/2·(a₁ + aₙ)','Appariement de Gauss']]);
    var N=Math.min(n,8),xs=[],ys=[];for(var i=1;i<=N;i++){xs.push(i);ys.push(a1+(i-1)*d);}if(n>N){xs.push(n);ys.push(an);}
    plot(xs,ys,'aₙ');C.text('vizTag','d = '+fx(d));
    var k1=0,h1='';function st1(t,dd,e){k1++;h1+='<li><span class="n">'+k1+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Appliquez la formule du n-ième terme','aₙ = a₁ + (n−1)d.','a<sub>'+n+'</sub> = '+fx(a1)+' + ('+(n-1)+')('+fx(d)+') = <b>'+fx(an)+'</b>');
    st1('Sommez avec l’astuce de l’appariement de Gauss','Associez le premier et le dernier terme : leur somme multipliée par n/2 donne le total.','S<sub>'+n+'</sub> = '+n+'/2 × ('+fx(a1)+' + '+fx(an)+') = <b>'+fx(sn)+'</b>');
    $('steps').innerHTML=h1;C.text('stepsIntro','Suite arithmétique avec a₁='+fx(a1)+', d='+fx(d)+'.');C.text('stepsTag','n = '+n);
    last='Suite (arithmétique) — calculatepilot.com/math/sequence-calculator.html\na1='+a1+', d='+d+', n='+n+'\na_n='+an+'\nS_n='+sn;
    return;
  }
  if(m==='s2'){
    var ga1=parseFloat($('ga1').value),r=parseFloat($('r').value);
    if(!isFinite(ga1)||!isFinite(r))return fail('Saisissez a₁ et r.');
    var gan=ga1*Math.pow(r,n-1),gsn=r===1?ga1*n:ga1*(1-Math.pow(r,n))/(1-r);
    var converges=Math.abs(r)<1,sInf=converges?ga1/(1-r):(r===1?NaN:(r<=-1?NaN:Infinity));
    C.html('heroLbl','a<sub>'+n+'</sub> (terme cible)');C.text('resultValue',fx(gan));tg.textContent=converges?'|r| < 1':Math.abs(r)===1?'|r| = 1':'|r| > 1';tg.className='sx-ef-grade'+(converges?'':' mid');
    C.html('ex1L','Somme partielle S<sub>'+n+'</sub>');C.text('ex1',fx(gsn));
    C.html('ex2L','Formule explicite');C.html('ex2','a<sub>n</sub> = '+fx(ga1)+' · ('+fx(r)+')<sup>n−1</sup>');
    C.text('interp',converges?'Comme |r| = '+fx(Math.abs(r))+' < 1, the terms shrink toward 0 and the infinite series converges to '+fx(sInf)+'.':'Comme |r| = '+fx(Math.abs(r))+' ≥ 1, les termes ne tendent pas vers zéro, donc la série infinie diverge.');
    C.html('fxNow','a<sub>n</sub> = a<sub>1</sub>·r<sup>n−1</sup>, a₁='+fx(ga1)+', r='+fx(r));
    tiles([['Premier terme a₁',fx(ga1),''],['Raison r',fx(r),''],['Converge quand n → ∞ ?',converges?'Oui':'No',converges?'|r| < 1':'|r| ≥ 1'],['Somme infinie S∞',converges?fx(sInf):'diverges',converges?'a₁ / (1 − r)':'aucune limite finie']]);
    var N2=Math.min(n,8),xs2=[],ys2=[];for(var j=1;j<=N2;j++){xs2.push(j);ys2.push(ga1*Math.pow(r,j-1));}if(n>N2){xs2.push(n);ys2.push(gan);}
    plot(xs2,ys2,'aₙ');C.text('vizTag','r = '+fx(r));
    var k2=0,h2='';function st2(t,dd,e){k2++;h2+='<li><span class="n">'+k2+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Appliquez la formule du n-ième terme','aₙ = a₁·r^(n−1).','a<sub>'+n+'</sub> = '+fx(ga1)+' × ('+fx(r)+')<sup>'+(n-1)+'</sup> = <b>'+fx(gan)+'</b>');
    st2('Sommez la série finie','Sₙ = a₁(1 − rⁿ)/(1 − r) pour r ≠ 1.','S<sub>'+n+'</sub> = '+fx(ga1)+'(1 − ('+fx(r)+')<sup>'+n+'</sup>) ÷ (1 − '+fx(r)+') = <b>'+fx(gsn)+'</b>');
    if(converges)st2('Vérifiez la convergence de la série infinie','|r| < 1, donc lorsque n → ∞ la somme tend vers une limite finie.','S∞ = '+fx(ga1)+' ÷ (1 − '+fx(r)+') = <b>'+fx(sInf)+'</b>');
    $('steps').innerHTML=h2;C.text('stepsIntro','Suite géométrique avec a₁='+fx(ga1)+', r='+fx(r)+'.');C.text('stepsTag','n = '+n);
    last='Suite (géométrique) — calculatepilot.com/math/sequence-calculator.html\na1='+ga1+', r='+r+', n='+n+'\na_n='+gan+'\nS_n='+gsn+(converges?'\nS_inf='+sInf:'');
    return;
  }
  if(m==='s3'){
    var kind=$('fibKind').value;
    if(n>5000)return fail('n est limité à 5000 pour obtenir des résultats exacts.');
    var idx=n-1; /* map "1st term" -> index 0 per typical F1=1,F2=1 convention, but we use F0=0 base; present as term #n starting a1 */
    var Fn=fib(n-1),Fn1=fib(n),phi=(1+Math.sqrt(5))/2;
    var val=kind==='fib'?Fn:lucas(n-1);
    var nextVal=kind==='fib'?Fn1:lucas(n);
    var ratio=Number(nextVal)/Number(val||1n);
    C.html('heroLbl',kind==='fib'?'F<sub>'+(n-1)+'</sub>':'L<sub>'+(n-1)+'</sub>');C.text('resultValue',bs(val));tg.textContent=kind==='fib'?'Fibonacci':'Lucas';
    C.html('ex1L','Terme suivant');C.text('ex1',bs(nextVal));
    C.text('ex2L','Rapport au terme précédent ≈ φ');C.text('ex2',fx(ratio,8)+'  (φ = '+fx(phi,8)+')');
    C.text('interp','Calculé exactement avec le doublement rapide en BigInt : même pour des n de l\'ordre de plusieurs milliers, chaque chiffre est exact, sans approximation en virgule flottante.');
    C.html('fxNow',(kind==='fib'?'F':'L')+'<sub>n</sub> = '+(kind==='fib'?'F':'L')+'<sub>n−1</sub> + '+(kind==='fib'?'F':'L')+'<sub>n−2</sub>,  '+(kind==='fib'?'F₀=0, F₁=1':'L₀=2, L₁=1'));
    tiles([['Suite',kind==='fib'?'Fibonacci':'Lucas',''],['Indice calculé',String(n-1),'Indexation à partir de 0 : il s\'agit donc du terme n°'+n],['Rapport de termes consécutifs',fx(ratio,6),'tend vers le nombre d\'or φ'],['Nombre d\'or φ',fx(phi,10),'(1+√5)/2']]);
    var xs3=[],ys3=[];for(var t=0;t<=Math.min(n-1,10);t++){var v=kind==='fib'?fib(t):lucas(t);xs3.push(t);ys3.push(Number(v));}
    plot(xs3,ys3,kind==='fib'?'Fₙ':'Lₙ');C.text('vizTag',(kind==='fib'?'F':'L')+'ₙ jusqu\'à n ='+Math.min(n-1,10));
    var k3=0,h3='';function st3(t2,dd,e){k3++;h3+='<li><span class="n">'+k3+'</span><h4>'+t2+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Partir des cas de base',kind==='fib'?'F₀ = 0, F₁ = 1.':'L₀ = 2, L₁ = 1.','puis chaque terme est la somme des deux précédents');
    st3('Calculer par doublement rapide','Avec F(2k)=F(k)[2F(k+1)−F(k)] et F(2k+1)=F(k)²+F(k+1)², il suffit d\'environ log₂(n) étapes sur de grands entiers.','('+(kind==='fib'?'F':'L')+')<sub>'+(n-1)+'</sub> = <b>'+bs(val)+'</b>');
    st3('Observer la convergence du rapport vers φ','Les rapports de termes consécutifs se rapprochent du nombre d\'or lorsque n augmente.','rapport ≈ <b>'+fx(ratio,8)+'</b>, φ = '+fx(phi,8));
    $('steps').innerHTML=h3;C.text('stepsIntro',(kind==='fib'?'Fibonacci':'Lucas')+' nombre à l\'indice '+(n-1)+'.');C.text('stepsTag','doublement rapide');
    last='Suite ('+(kind==='fib'?'Fibonacci':'Lucas')+') — calculatepilot.com/math/sequence-calculator.html\n'+(kind==='fib'?'F':'L')+'('+(n-1)+') = '+val;
    return;
  }
  /* s4: custom recurrence */
  var ra1=parseInt($('ra1').value,10),ra2=parseInt($('ra2').value,10),rp=parseInt($('rp').value,10),rq=parseInt($('rq').value,10);
  if(![ra1,ra2,rp,rq].every(isFinite))return fail('Saisissez des valeurs entières pour a₁, a₂, p et q.');
  if(n>5000)return fail('n est limité à 5000 pour obtenir des résultats exacts.');
  var val4=recTerm(BigInt(rp),BigInt(rq),BigInt(ra1),BigInt(ra2),BigInt(Math.max(n,1)));
  var val4prev=n>1?recTerm(BigInt(rp),BigInt(rq),BigInt(ra1),BigInt(ra2),BigInt(n-1)):null;
  C.html('heroLbl','a<sub>'+n+'</sub> (terme cible)');C.text('resultValue',bs(val4));tg.textContent='récurrence linéaire d\'ordre 2';
  C.html('ex1L','Terme précédent a<sub>'+(n-1)+'</sub>');C.text('ex1',n>1?bs(val4prev):'— (n=1)');
  var ratio4=n>1&&val4prev!==0n?Number(val4)/Number(val4prev):NaN;
  C.text('ex2L','Rapport de croissance aₙ/aₙ₋₁');C.text('ex2',isFinite(ratio4)?fx(ratio4,6):'—');
  C.text('interp','Chaque terme vaut p×(terme précédent) + q×(terme d\'avant) ; le calcul se fait par exponentiation matricielle, donc il reste exact même pour de grands n.');
  C.html('fxNow','a<sub>n</sub> = '+rp+'·a<sub>n−1</sub> + '+rq+'·a<sub>n−2</sub>, a₁='+ra1+', a₂='+ra2);
  tiles([['Valeurs initiales (a₁, a₂)','('+ra1+', '+ra2+')',''],['Coefficients (p, q)','('+rp+', '+rq+')',''],['Équation caractéristique','x² − '+rp+'x − '+rq+' = 0','les racines déterminent la croissance à long terme'],['Rapport de croissance',isFinite(ratio4)?fx(ratio4,6):'—','aₙ / aₙ₋₁, tend vers une valeur fixe pour les grands n']]);
  var xs4=[],ys4=[];for(var u=1;u<=Math.min(n,10);u++){var vv=recTerm(BigInt(rp),BigInt(rq),BigInt(ra1),BigInt(ra2),BigInt(u));xs4.push(u);ys4.push(Number(vv));}
  plot(xs4,ys4,'aₙ');C.text('vizTag','p='+rp+', q='+rq);
  var k4=0,h4='';function st4(t,dd,e){k4++;h4+='<li><span class="n">'+k4+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st4('Écrire la récurrence sous forme matricielle','[[aₙ],[aₙ₋₁]] = [[p, q], [1, 0]] · [[aₙ₋₁],[aₙ₋₂]].','M = [['+rp+', '+rq+'], [1, 0]]');
  st4('Élever la matrice à la puissance (n−2)','On obtient ainsi aₙ directement, sans n−2 étapes successives.','M<sup>'+Math.max(n-2,0)+'</sup> appliquée au vecteur initial');
  st4('Lire le résultat','a<sub>'+n+'</sub> = <b>'+bs(val4)+'</b>');
  $('steps').innerHTML=h4;C.text('stepsIntro','Récurrence personnalisée aₙ = '+rp+'aₙ₋₁ + '+rq+'aₙ₋₂.');C.text('stepsTag','puissance de matrice');
  last='Suite (récurrence personnalisée) — calculatepilot.com/math/sequence-calculator.html\na1='+ra1+', a2='+ra2+', p='+rp+', q='+rq+', n='+n+'\na_n='+val4;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sqCalc',compute:compute});
  $('presets').addEventListener('click',function(e){
    var b=e.target.closest('button[data-m]');if(!b)return;
    C.set('mode',b.getAttribute('data-m'));
    if(b.hasAttribute('data-a')&&b.getAttribute('data-m')==='s1'){C.set('a1',b.getAttribute('data-a'));C.set('d',b.getAttribute('data-d'));}
    if(b.getAttribute('data-m')==='s2'){C.set('ga1',b.getAttribute('data-a'));C.set('r',b.getAttribute('data-r'));}
    if(b.hasAttribute('data-fib')){C.set('fibKind',b.getAttribute('data-fib'));}
    if(b.getAttribute('data-m')==='s4'){C.set('ra1',b.getAttribute('data-a'));C.set('ra2',b.getAttribute('data-d2'));C.set('rp',b.getAttribute('data-p'));C.set('rq',b.getAttribute('data-q'));}
    if(b.hasAttribute('data-n'))C.set('n',b.getAttribute('data-n'));
    fire('n');
  });
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
