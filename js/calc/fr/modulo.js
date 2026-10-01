/* Modulo calculator — CalculatePilot (Stitch redesign). Exact BigInt arithmetic.
   Floored mod: a - n*floor(a/n). Extended Euclidean algorithm for the modular inverse.
   Fast (binary) modular exponentiation for a^b mod n. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function ab(x){return x<0n?-x:x;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>50?s.slice(0,12)+'…'+s.slice(-6)+' ('+s.length+' chiffres)':grp(s);}
function readInt(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^-?\d+$/.test(s))return {err:label+' doit être un nombre entier (chiffres uniquement).'};if(s.replace('-','').length>2000)return {err:label+' est trop long.'};return {v:BigInt(s)};}
function floorMod(a,n){var r=a%n;if(r!==0n&&((r<0n)!==(n<0n)))r+=n;return r;}
function truncMod(a,n){return a%n;}
function floorDiv(a,n){var q=a/n;if((a%n!==0n)&&((a<0n)!==(n<0n)))q-=1n;return q;}
function gcd(a,b){a=ab(a);b=ab(b);while(b){var t=a%b;a=b;b=t;}return a;}
function egcd(a,b){var x0=1n,y0=0n,x1=0n,y1=1n,r0=a,r1=b;while(r1!==0n){var q=r0/r1,t;t=r0-q*r1;r0=r1;r1=t;t=x0-q*x1;x0=x1;x1=t;t=y0-q*y1;y0=y1;y1=t;}if(r0<0n){r0=-r0;x0=-x0;y0=-y0;}return {g:r0,x:x0,y:y0};}
function modpow(a,b,n){if(n===1n)return 0n;a=floorMod(a,n);var r=1n;if(b<0n)return null; /* negative exponent handled by caller via inverse */
  while(b>0n){if(b&1n)r=floorMod(r*a,n);a=floorMod(a*a,n);b>>=1n;}return r;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function numberLine(a,n,r){
  var W=760,H=140,pad=40;
  var nn=Number(ab(n))||1,lo=-nn*2,hi=nn*3,rN=Number(r);
  if(nn>1000){lo=-3;hi=4;}
  var kx=(W-2*pad)/(hi-lo),X=function(x){return pad+(x-lo)*kx;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="70" y2="70" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  for(var k=Math.ceil(lo/nn);k*nn<=hi;k++){var x=X(k*nn);s+='<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="62" y2="78" stroke="var(--sx-border)" stroke-width="1.5"/><text class="ax" x="'+x.toFixed(1)+'" y="96" text-anchor="middle">'+esc(String(k*nn))+'</text>';}
  if(nn<=1000){var xr=X(rN);s+='<circle cx="'+xr.toFixed(1)+'" cy="70" r="7" fill="#059669"/><text class="ax" x="'+xr.toFixed(1)+'" y="50" text-anchor="middle" style="font-weight:700;fill:var(--sx-on)">reste '+esc(String(rN))+'</text>';}
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fB').hidden=(m==='s1'||m==='s3');
  C.text('bL',m==='s2'?'b':'b (exposant)');
  var labels={s1:'a mod n',s2:'Congruence a ≡ b (mod n)',s3:'Inverse modulaire a⁻¹ mod n',s4:'Exponentiation modulaire aᵇ mod n'};
  C.html('formH',labels[m]);
  var A=readInt('a','a');if(A.err)return fail(A.err);
  var N=readInt('n','n');if(N.err)return fail(N.err);
  if(N.v===0n)return fail('n (le module) ne peut pas être 0 — la division par zéro n\'est pas définie.');
  var a=A.v,n=N.v;
  C.html('fxNow',(m==='s1'?bs(a)+' mod '+bs(n):m==='s3'?bs(a)+'⁻¹ mod '+bs(n):m==='s4'?bs(a)+'^b mod '+bs(n):bs(a)+' ≡ ? (mod '+bs(n)+')'));

  if(m==='s1'){
    var r=floorMod(a,n),rt=truncMod(a,n),q=floorDiv(a,n);
    C.text('heroLbl','a mod n (par défaut)');C.text('resultValue',bs(r));tg.textContent='convention par défaut (floor)';
    C.text('ex1L','Reste tronqué (style C/JS)');C.text('ex1',bs(rt));
    C.text('ex2L','Quotient ⌊a/n⌋');C.text('ex2',bs(q));
    C.text('interp',bs(a)+' divisé par '+bs(n)+' donne un reste de '+bs(r)+', selon la convention mathématique (floor) où le résultat a toujours le même signe que n.');
    tiles([['a',bs(a),''],['n',bs(n),''],['⌊a/n⌋',bs(q),'partie entière du quotient'],['a − n·⌊a/n⌋',bs(a)+' − '+bs(n)+'×'+bs(q)+' = '+bs(r),'le résultat du modulo'],['Même signe que n ?',(r===0n||(r<0n)===(n<0n))?'Oui':'No','propriété de la convention floor'],['a est-il divisible par n ?',r===0n?'Oui':'No','le reste est nul exactement lorsque la division tombe juste']]);
    if(ab(n)<=BigInt(1e6))numberLine(a,n,r);else $('viz').innerHTML='';
    C.text('vizTag','residue '+bs(r)+' of '+bs(n));
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Diviser et arrondir par défaut','Calculez ⌊a/n⌋, arrondi vers moins l\'infini.','⌊'+bs(a)+' ÷ '+bs(n)+'⌋ = <b>'+bs(q)+'</b>');
    st1('Multiplier en retour et soustraire','a mod n = a − n·⌊a/n⌋.',bs(a)+' − '+bs(n)+' × '+bs(q)+' = '+bs(a)+' − '+bs(n*q)+' = <b>'+bs(r)+'</b>');
    st1('Vérifier l\'intervalle','Pour n > 0, le résultat vérifie 0 ≤ (a mod n) < n.','0 ≤ '+bs(r)+' < '+bs(ab(n))+' ✓');
    $('steps').innerHTML=h1;C.text('stepsIntro',bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','division par défaut (floor)');
    last='Modulo — calculatepilot.com/math/modulo-calculator.html\n'+a+' mod '+n+' = '+r+'\ntronqué (C/JS) = '+rt;
    return;
  }
  if(m==='s2'){
    var B=readInt('b','b');if(B.err)return fail(B.err);
    var b=B.v,ra=floorMod(a,n),rb=floorMod(b,n),diff=a-b,cong=floorMod(diff,n)===0n;
    C.text('heroLbl','Sont-ils congrus ?');C.text('resultValue',cong?'Oui — congrus':'Non — non congrus');tg.textContent=cong?'a ≡ b (mod n)':'a ≢ b (mod n)';tg.className='sx-ef-grade'+(cong?'':' mid');
    C.text('ex1L','a mod n');C.text('ex1',bs(ra));C.text('ex2L','b mod n');C.text('ex2',bs(rb));
    C.text('interp',cong?bs(a)+' and '+bs(b)+' donnent le même reste modulo '+bs(n)+' ; ils sont donc congrus.':bs(a)+' and '+bs(b)+' donnent des restes différents modulo '+bs(n)+' ; ils ne sont donc pas congrus.');
    tiles([['a − b',bs(diff),'la différence'],['n divise-t-il (a − b) ?',cong?'Oui':'No','le test de congruence'],['a mod n',bs(ra),''],['b mod n',bs(rb),'']]);
    if(ab(n)<=BigInt(1e6)){numberLine(a,n,ra);}else $('viz').innerHTML='';
    C.text('vizTag',cong?'congruent':'non congrus');
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Calculer la différence','a ≡ b (mod n) exactement lorsque n divise a − b.',bs(a)+' − '+bs(b)+' = <b>'+bs(diff)+'</b>');
    st2('Vérifier la divisibilité','n divise-t-il exactement la différence, c\'est-à-dire (a − b) mod n est-il égal à 0 ?','('+bs(diff)+') mod '+bs(n)+' = <b>'+bs(floorMod(diff,n))+'</b>'+(cong?' → divise exactement':' → ne divise pas exactement'));
    st2('Recouper avec les restes individuels','a mod n et b mod n doivent être égaux exactement lorsque a et b sont congrus.','a mod n = '+bs(ra)+',  b mod n = '+bs(rb)+' → '+(cong?'égaux ✓':'différents ✗'));
    $('steps').innerHTML=h2;C.text('stepsIntro','Test de '+bs(a)+' ≡ '+bs(b)+' (mod '+bs(n)+').');C.text('stepsTag','test de congruence');
    last='Congruence modulaire — calculatepilot.com/math/modulo-calculator.html\n'+a+' ≡ '+b+' (mod '+n+')? '+(cong?'Oui':'No');
    return;
  }
  if(m==='s3'){
    var g=gcd(a,n);
    if(g!==1n){
      C.text('heroLbl','Inverse modulaire');C.text('resultValue','n\'existe pas');tg.textContent='gcd('+bs(a)+', '+bs(n)+') = '+bs(g)+' ≠ 1';tg.className='sx-ef-grade mid';
      C.text('ex1L','pgcd(a, n)');C.text('ex1',bs(g));C.text('ex2L','Inversible ?');C.text('ex2','No');
      C.text('interp','Un inverse modulaire n\'existe que si pgcd(a, n) = 1. Ici pgcd('+bs(a)+', '+bs(n)+') = '+bs(g)+', donc '+bs(a)+' n\'a pas d\'inverse modulo '+bs(n)+'.');
      tiles([['a',bs(a),''],['n',bs(n),''],['pgcd(a, n)',bs(g),'doit valoir 1 pour qu\'un inverse existe']]);
      $('viz').innerHTML='';C.text('vizTag','pas d\'inverse');
      $('steps').innerHTML='<li><span class="n">1</span><h4>Vérifier pgcd(a, n)</h4><span class="eq">pgcd('+bs(a)+', '+bs(n)+') = <b>'+bs(g)+'</b> ≠ 1 → aucun inverse n\'existe</span></li>';
      C.text('stepsIntro','Inverse modulaire de '+bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','non inversible');
      last='Inverse modulaire — calculatepilot.com/math/modulo-calculator.html\n'+a+'⁻¹ mod '+n+' : n\'existe pas (pgcd = '+g+')';
      return;
    }
    var eg=egcd(ab(a),ab(n)),x=eg.x*(a<0n?-1n:1n),inv=floorMod(x,n);
    C.text('heroLbl','Inverse modulaire a⁻¹ mod n');C.text('resultValue',bs(inv));tg.textContent='unique modulo '+bs(n);
    C.text('ex1L','Vérification : a · a⁻¹ mod n');C.text('ex1',bs(floorMod(a*inv,n))+' (doit valoir 1)');
    C.text('ex2L','pgcd(a, n)');C.text('ex2',bs(g));
    C.text('interp',bs(a)+' × '+bs(inv)+' ≡ 1 (mod '+bs(n)+'), donc '+bs(inv)+' est l\'unique inverse de '+bs(a)+' dans l\'intervalle [0, '+bs(n)+').');
    tiles([['a',bs(a),''],['n',bs(n),''],['Bézout : a·x + n·y = 1',bs(a)+'·('+bs(eg.x)+') + '+bs(n)+'·('+bs(eg.y)+') = 1',''],['Réduit à [0, n)',bs(inv),'l\'inverse modulaire']]);
    $('viz').innerHTML='';C.text('vizTag','a⁻¹ = '+bs(inv));
    var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Confirmer que pgcd(a, n) = 1','Un inverse n\'existe que si a et n n\'ont aucun facteur commun.','gcd('+bs(a)+', '+bs(n)+') = <b>1</b>');
    st3('Appliquer l\'algorithme d\'Euclide étendu','Trouvez des entiers x, y tels que a·x + n·y = pgcd(a, n) = 1.',bs(a)+'·('+bs(eg.x)+') + '+bs(n)+'·('+bs(eg.y)+') = 1');
    st3('Réduire x dans l\'intervalle [0, n)','x mod n donne le représentant standard de l\'inverse.','('+bs(eg.x*(a<0n?-1n:1n))+') mod '+bs(n)+' = <b>'+bs(inv)+'</b>');
    st3('Vérifier','a × a⁻¹ doit être ≡ 1 (mod n).',bs(a)+' × '+bs(inv)+' mod '+bs(n)+' = <b>'+bs(floorMod(a*inv,n))+'</b> ✓');
    $('steps').innerHTML=h3;C.text('stepsIntro','Inverse modulaire de '+bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','Euclide étendu');
    last='Inverse modulaire — calculatepilot.com/math/modulo-calculator.html\n'+a+'⁻¹ mod '+n+' = '+inv;
    return;
  }
  /* s4: modular exponentiation */
  var B4=readInt('b','b (exposant)');if(B4.err)return fail(B4.err);
  var bb=B4.v,neg=bb<0n;
  if(neg){
    var g4=gcd(a,n);
    if(g4!==1n)return fail('Un exposant négatif nécessite un inverse modulaire de a, ce qui exige pgcd(a, n) = 1. Ici pgcd = '+bs(g4)+'.');
  }
  var base=a,exp=neg?-bb:bb;
  if(neg){var eg4=egcd(ab(a),ab(n)),x4=eg4.x*(a<0n?-1n:1n);base=floorMod(x4,n);}
  var result=modpow(base,exp,n);
  C.text('heroLbl','aᵇ mod n');C.text('resultValue',bs(result));tg.textContent=neg?'via l\'inverse modulaire':'exponentiation binaire';
  C.text('ex1L','Nombre d\'élévations au carré');C.text('ex1',String(exp.toString(2).length-1));
  C.text('ex2L','Base réduite mod n');C.text('ex2',bs(floorMod(a,n))+(neg?' (puis inversée)':''));
  C.text('interp','Calculé par exponentiation rapide : '+bs(a)+' est élevé au carré de façon répétée modulo '+bs(n)+', en combinant les élévations au carré correspondant aux chiffres binaires de '+bs(bb)+'.');
  var bits=exp.toString(2);
  tiles([['a',bs(a),''],['b (exposant)',bs(bb),''],['n (module)',bs(n),''],['b en binaire',bits,bits.length+' bits, '+(bits.length-1)+' squarings']]);
  $('viz').innerHTML='';C.text('vizTag','aᵇ mod n = '+bs(result));
  var n4=0,h4='';function st4(t,d,e){n4++;h4+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  if(neg)st4('Exposant négatif : inverser d\'abord','a⁻¹ mod n existe car pgcd(a, n) = 1 ; alors aᵇ = (a⁻¹)^|b|.','a⁻¹ mod '+bs(n)+' = <b>'+bs(base)+'</b>');
  st4('Écrire l\'exposant en binaire','L\'exponentiation rapide traite un bit à la fois.',bs(exp)+' en binaire s\'écrit '+bits);
  st4('Élever au carré et multiplier','Élevez le résultat courant au carré à chaque étape ; multipliez par la base chaque fois que le bit vaut 1 — en réduisant modulo n après chaque opération.','résultat après les '+(bits.length-1)+' élévations au carré : <b>'+bs(result)+'</b>');
  st4('Pourquoi c\'est rapide','Il ne faut qu\'environ log₂(b) multiplications, au lieu de b − 1 — même un exposant énorme est donc instantané.','log₂('+bs(bb)+') ≈ '+(bits.length-1)+' étapes contre '+bs(bb)+' multiplications naïves');
  $('steps').innerHTML=h4;C.text('stepsIntro',bs(a)+'^'+bs(bb)+' mod '+bs(n)+'.');C.text('stepsTag','exponentiation rapide');
  last='Exponentiation modulaire — calculatepilot.com/math/modulo-calculator.html\n'+a+'^'+bb+' mod '+n+' = '+result;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'mdCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b0=e.target.closest('button[data-m]');if(!b0)return;C.set('mode',b0.getAttribute('data-m'));C.set('a',b0.getAttribute('data-a'));if(b0.hasAttribute('data-b'))C.set('b',b0.getAttribute('data-b'));C.set('n',b0.getAttribute('data-n'));fire('a');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
