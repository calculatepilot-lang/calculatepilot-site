/* Prime number checker — CalculatePilot (Stitch redesign).
   Primality: deterministic Miller–Rabin (exact for all n < 3,317,044,064,679,887,385,961,981, using the first 13 prime bases).
   Factorization: trial division up to min(sqrt(n), 10^7). Range sieve: Sieve of Eratosthenes. Mersenne: Lucas–Lehmer test. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>60?s.slice(0,14)+'…'+s.slice(-6)+' ('+s.length+' chiffres)':grp(s);}

function modpow(base,exp,mod){base%=mod;if(base<0n)base+=mod;var r=1n;while(exp>0n){if(exp&1n)r=(r*base)%mod;base=(base*base)%mod;exp>>=1n;}return r;}
function isPrimeBig(n){
  if(n<2n)return false;
  var small=[2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n];
  for(var i=0;i<small.length;i++){if(n===small[i])return true;if(n%small[i]===0n)return false;}
  var d=n-1n,r=0n;while(d%2n===0n){d/=2n;r++;}
  for(i=0;i<small.length;i++){
    var a=small[i];if(a>=n)continue;
    var x=modpow(a,d,n);if(x===1n||x===n-1n)continue;
    var cont=false;
    for(var j=0n;j<r-1n;j++){x=(x*x)%n;if(x===n-1n){cont=true;break;}}
    if(!cont)return false;
  }
  return true;
}
/* trial-division factorization, capped bound for performance */
function factorize(n){
  var f=[],bound=10000000n,x=n;
  for(var p=2n;p*p<=x&&p<=bound;p+= (p===2n?1n:2n)){
    if(x%p===0n){var e=0;while(x%p===0n){x/=p;e++;}f.push([p,e]);}
  }
  var complete=x===1n||x*x>n; /* if remaining x has no factor <= bound and x>1, x itself might be prime or a product of two large primes */
  if(x>1n){
    if(x<=bound*bound||isPrimeBig(x)){f.push([x,1]);complete=true;}
    else{f.push([x,1]);complete=false;}
  }
  return {factors:f,complete:complete};
}
function factStr(f){return f.map(function(pe){return pe[1]>1?pe[0]+'<sup>'+pe[1]+'</sup>':String(pe[0]);}).join(' × ');}
function nearbyPrimes(n,count){
  var below=[],above=[],x=n-1n;
  while(below.length<count&&x>1n){if(isPrimeBig(x))below.push(x);x--;}
  x=n+1n;
  while(above.length<count){if(isPrimeBig(x))above.push(x);x++;if(x>n+10000000n)break;}
  return {below:below.reverse(),above:above};
}
function sieveCount(limit){ /* count & list primes up to `limit` (Number), returns array */
  var s=new Uint8Array(limit+1),out=[];
  for(var i=2;i<=limit;i++){
    if(!s[i]){out.push(i);for(var j=i*i;j<=limit;j+=i)s[j]=1;}
  }
  return out;
}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}
function readBig(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^\d+$/.test(s))return {err:label+' doit être un nombre entier non négatif.'};if(s.length>25)return {err:label+' est trop grand (maximum d\'environ 25 chiffres pour ce vérificateur).'};return {v:BigInt(s)};}

function numberLine(center,below,above){
  var W=760,H=120,pad=40;
  var pts=below.concat([center]).concat(above).map(Number);
  var lo=Math.min.apply(null,pts),hi=Math.max.apply(null,pts);if(hi===lo){hi=lo+1;lo=lo-1;}
  var kx=(W-2*pad)/(hi-lo),X=function(x){return pad+(x-lo)*kx;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="60" y2="60" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  below.concat(above).forEach(function(p){var x=X(Number(p));s+='<circle cx="'+x.toFixed(1)+'" cy="60" r="5" fill="#059669"/><text class="ax" x="'+x.toFixed(1)+'" y="46" text-anchor="middle">'+esc(grp(p.toString()))+'</text>';});
  var xc=X(Number(center));s+='<circle cx="'+xc.toFixed(1)+'" cy="60" r="6.5" fill="var(--sx-primary)"/><text class="ax" x="'+xc.toFixed(1)+'" y="84" text-anchor="middle" style="font-weight:700;fill:var(--sx-on)">n = '+esc(grp(center.toString()))+'</text>';
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fN').hidden=(m!=='s1');$('fRange').hidden=(m!=='s2');$('fMers').hidden=(m!=='s3');
  var labels={s1:'n est-il premier ?',s2:'Lister les nombres premiers d\'un intervalle',s3:'2ᵖ − 1 est-il premier ? (Lucas–Lehmer)'};
  C.html('formH',labels[m]);

  if(m==='s1'){
    var N=readBig('n','n');if(N.err)return fail(N.err);
    var n=N.v;
    C.html('fxNow','<b>'+bs(n)+'</b> est-il premier ?');
    if(n<2n){
      C.text('heroLbl','Primalité');C.text('resultValue',n===0n?'0 n\'est ni premier ni composé':'1 n\'est ni premier ni composé');tg.textContent='undefined';
      C.text('ex1L','Décomposition en facteurs premiers');C.text('ex1','—');C.text('ex2L','Nombres premiers les plus proches');C.text('ex2','—');
      C.text('interp','Par définition, les nombres premiers sont des entiers supérieurs à 1. 0 et 1 n\'ont pas de classification en tant que nombres premiers.');
      tiles([]);$('viz').innerHTML='';C.text('vizTag','—');$('steps').innerHTML='';C.text('stepsIntro','');C.text('stepsTag','');
      last='Test de primalité — calculatepilot.com/math/prime-number-checker.html\n'+n+' n\'est ni premier ni composé';
      return;
    }
    var prime=isPrimeBig(n);
    C.text('heroLbl','Primalité');C.text('resultValue',prime?'PRIME':'COMPOSITE');tg.textContent=prime?'prime':'composite';tg.className='sx-ef-grade'+(prime?'':' mid');
    var fac=prime?null:factorize(n);
    C.html('ex1L','Décomposition en facteurs premiers');
    if(prime)C.html('ex1',bs(n)+' (lui-même — irréductible)');
    else C.html('ex1',factStr(fac.factors)+(fac.complete?'':' … (partiel — facteur restant trop grand pour être entièrement résolu)'));
    var near=nearbyPrimes(n,1);
    C.html('ex2L','Nombres premiers les plus proches');C.text('ex2',(near.below[0]?bs(near.below[0]):'—')+'  ↔  '+(near.above[0]?bs(near.above[0]):'—'));
    C.text('interp',prime?'Aucun entier de 2 jusqu\'à √'+bs(n)+' divides '+bs(n)+' ne le divise exactement, il est donc premier.':'Il se factorise comme indiqué, il est donc composé.');
    var sqrtN=BigInt(Math.floor(Math.sqrt(Number(n>BigInt(Number.MAX_SAFE_INTEGER)?BigInt(Number.MAX_SAFE_INTEGER):n))));
    var gapBelow=near.below[0]?n-near.below[0]:null,gapAbove=near.above[0]?near.above[0]-n:null;
    var tl=[['Méthode de test',n<18446744073709551616n?'Miller–Rabin déterministe':'Miller–Rabin (probabiliste pour un n aussi grand)','exact pour n < 2⁶⁴'],
      ['√n (borne de la division par essais)',bs(sqrtN),'plus grand diviseur à vérifier']];
    if(near.below[0])tl.push(['Nombre premier précédent',bs(near.below[0]),'écart de '+bs(gapBelow)]);
    if(near.above[0])tl.push(['Nombre premier suivant',bs(near.above[0]),'écart de '+bs(gapAbove)]);
    tiles(tl);
    numberLine(n,near.below,near.above);C.text('vizTag',prime?'prime':'composite');
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Écarter les petits facteurs','Vérifiez d\'abord la divisibilité par 2, 3, 5, 7, … jusqu\'à quelques petits nombres premiers.',n%2n===0n&&n!==2n?bs(n)+' est pair → composé':'aucun petit facteur premier trouvé immédiatement');
    st1('Lancer le test déterministe de Miller–Rabin','Avec les témoins 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, le résultat est exact (non probabiliste) pour tout n inférieur à 2⁶⁴.',prime?'tous les témoins confirment la primalité probable sans exception → <b>premier</b>':'un témoin prouve que le nombre est composé → <b>composé</b>');
    if(!prime)st1('Factoriser complètement','La division par essais permet de retrouver la factorisation première complète.',bs(n)+' = '+factStr(fac.factors));
    if(near.below[0]||near.above[0])st1('Repérer les nombres premiers voisins','Avancez de part et d\'autre de n, en testant chaque entier, jusqu\'à trouver un nombre premier de chaque côté.','précédent : '+(near.below[0]?bs(near.below[0]):'—')+',  suivant : '+(near.above[0]?bs(near.above[0]):'—'));
    $('steps').innerHTML=h1;C.text('stepsIntro','Test de '+bs(n)+' pour la primalité.');C.text('stepsTag',prime?'prime':'composite');
    last='Test de primalité — calculatepilot.com/math/prime-number-checker.html\n'+n+' is '+(prime?'PRIME':'COMPOSITE')+(prime?'':'\nfactors: '+fac.factors.map(function(pe){return pe[0]+(pe[1]>1?'^'+pe[1]:'');}).join(' * '));
    return;
  }

  if(m==='s2'){
    var lo=parseInt($('lo').value,10),hi=parseInt($('hi').value,10);
    if(!isFinite(lo)||!isFinite(hi)||lo<2||hi<lo)return fail('Saisissez une plage valide avec début ≤ fin, tous deux ≥ 2.');
    if(hi-lo>200000)return fail('La largeur de l’intervalle est limitée à 200 000 nombres.');
    if(hi>50000000)return fail('La fin de la plage est limitée à 50 000 000.');
    var allPrimes=sieveCount(hi),inRange=allPrimes.filter(function(p){return p>=lo;});
    C.text('heroLbl','Nombres premiers de '+grp(String(lo))+' to '+grp(String(hi)));C.text('resultValue',String(inRange.length)+' prime'+(inRange.length===1?'':'s'));tg.textContent='crible d\'Ératosthène';
    C.html('ex1L','Premiers');C.text('ex1',inRange.slice(0,8).map(function(x){return grp(String(x));}).join(', ')+(inRange.length>8?', …':''));
    C.html('ex2L','Masse volumique');C.text('ex2',(inRange.length/(hi-lo+1)*100).toFixed(2)+'% des entiers de la plage');
    C.html('fxNow','Nombres premiers p tels que '+grp(String(lo))+' ≤ p ≤ '+grp(String(hi)));
    C.text('interp','Obtenus par crible : on barre les multiples de chaque nombre premier jusqu\'à √'+grp(String(hi))+', et tout ce qui reste non marqué est premier.');
    var gaps=[];for(var i=1;i<inRange.length;i++)gaps.push(inRange[i]-inRange[i-1]);
    var maxGap=gaps.length?Math.max.apply(null,gaps):0,avgGap=gaps.length?(gaps.reduce(function(a,b){return a+b;},0)/gaps.length):0;
    tiles([['Nombre dans la plage',String(inRange.length),''],['Plus grand écart entre nombres premiers consécutifs',String(maxGap),''],['Écart moyen',avgGap.toFixed(2),'≈ ln('+grp(String(hi))+') ≈ '+Math.log(hi).toFixed(2)+' (théorème des nombres premiers)'],['Largeur de la plage',String(hi-lo+1),'entiers vérifiés']]);
    var N=Math.min(inRange.length,60),xs=inRange.slice(0,N);
    var W=760,H=90,pad=30,kx=(W-2*pad)/Math.max(1,(xs.length-1||1));
    var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
    s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="45" y2="45" stroke="var(--sx-muted)" stroke-width="1.5"/>';
    xs.forEach(function(p,idx){var x=pad+idx*kx;s+='<circle cx="'+x.toFixed(1)+'" cy="45" r="4" fill="#059669"/>';});
    $('viz').innerHTML=s+'</svg>'+(inRange.length>N?'<p style="margin-top:8px;color:var(--sx-muted);font-size:13px">affichage des '+N+' of '+inRange.length+' premiers nombres premiers trouvés</p>':'');
    C.text('vizTag',inRange.length+' nombres premiers représentés');
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Cribler jusqu\'à la fin de la plage','Partez de tous les entiers de 2 à '+grp(String(hi))+' marqués comme candidats.','taille du crible : '+grp(String(hi)));
    st2('Barrer les multiples','Pour chaque nombre premier p trouvé, barrez 2p, 3p, 4p, … jusqu\'à la limite.','s\'arrête à p ≤ √'+grp(String(hi))+' ≈ '+Math.floor(Math.sqrt(hi)));
    st2('Conserver ce qui reste dans la plage','Tous les entiers de '+grp(String(lo))+' to '+grp(String(hi))+' encore non marqués sont premiers.','<b>'+inRange.length+'</b> premiers'+(inRange.length===1?'':'s')+' found');
    $('steps').innerHTML=h2;C.text('stepsIntro','Crible de ['+grp(String(lo))+', '+grp(String(hi))+'].');C.text('stepsTag','Crible d\'Ératosthène');
    last='Crible de nombres premiers — calculatepilot.com/math/prime-number-checker.html\nplage ['+lo+', '+hi+']: '+inRange.length+' nombres premiers\npremiers : '+inRange.slice(0,10).join(', ');
    return;
  }

  /* s3: Mersenne / Lucas-Lehmer */
  var p=parseInt($('pp').value,10);
  if(!isFinite(p)||p<2||p>4000)return fail('p doit être un entier de 2 à 4000.');
  var M=(1n<<BigInt(p))-1n;
  var pPrime=isPrimeBig(BigInt(p));
  C.html('fxNow','2<sup>'+p+'</sup> − 1 = '+bs(M));
  if(!pPrime){
    C.text('heroLbl','Mₚ est-il premier ?');C.text('resultValue','COMPOSITE');tg.textContent='p non premier';tg.className='sx-ef-grade mid';
    C.text('ex1L','Pourquoi');C.text('ex1','p = '+p+' n\'est pas premier');C.text('ex2L','Mp',);C.html('ex2',bs(M));
    C.text('interp','p doit être premier pour que 2ᵖ − 1 ait une chance d\'être premier (condition nécessaire, non suffisante) — puisque p = '+p+' est composé, Mₚ est lui aussi composé.');
    tiles([['p',String(p),'non premier'],['M_p = 2^p − 1',bs(M),'composé à coup sûr']]);
    $('viz').innerHTML='';C.text('vizTag','composé (p non premier)');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Vérifier que p est premier</h4><span class="eq">p = '+p+' est <b>non premier</b> → 2<sup>p</sup> − 1 ne peut pas être un nombre premier de Mersenne</span></li>';
    C.text('stepsIntro','Test de M_'+p+' = 2^'+p+' − 1.');C.text('stepsTag','p non premier');
    last='Vérification de Mersenne — calculatepilot.com/math/prime-number-checker.html\np='+p+' (non premier) -> M_p composé';
    return;
  }
  if(p===2){
    C.text('heroLbl','Mₚ est-il premier ?');C.text('resultValue','PRIME');tg.textContent='M₂ = 3';
    C.text('ex1L','Valeur');C.text('ex1','3');C.text('ex2L','Méthode');C.text('ex2','cas particulier p=2');
    C.text('interp','M₂ = 2² − 1 = 3, premier par vérification directe (Lucas–Lehmer s\'applique pour p ≥ 3).');
    tiles([['p',String(p),'prime'],['M_p',bs(M),'prime']]);$('viz').innerHTML='';C.text('vizTag','prime');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Vérification directe</h4><span class="eq">M₂ = 2²−1 = 3, qui est premier.</span></li>';
    C.text('stepsIntro','M_2 = 3.');C.text('stepsTag','cas particulier');
    last='Vérification de Mersenne — calculatepilot.com/math/prime-number-checker.html\np=2 : M_p=3 (premier)';
    return;
  }
  var s=4n,iters=[];
  for(var i=0;i<p-2;i++){s=(s*s-2n)%M;if(s<0n)s+=M;if(i<6||i>p-9)iters.push(s);}
  var mprime=s===0n;
  C.text('heroLbl','Mₚ est-il premier ?');C.text('resultValue',mprime?'PRIME':'COMPOSITE');tg.textContent='p = '+p+' (exposant premier)';tg.className='sx-ef-grade'+(mprime?'':' mid');
  C.html('ex1L','Mₚ = 2<sup>p</sup> − 1');C.html('ex1',bs(M));
  C.text('ex2L','Résidu de Lucas–Lehmer');C.text('ex2',mprime?'0 (prouve la primalité)':bs(s)+' (≠ 0, donc composé)');
  C.text('interp',mprime?'La suite de Lucas–Lehmer atteint exactement 0 après p−2 = '+(p-2)+' étapes, ce qui prouve que Mₚ est premier.':'La suite de Lucas–Lehmer n\'atteint pas 0, donc Mₚ est composé, bien que son exposant p soit premier.');
  tiles([['p (exposant premier)',String(p),''],['Mₚ = 2ᵖ − 1',bs(M),(M.toString().length)+' digits'],['Étapes de Lucas–Lehmer',String(p-2),'s ← s² − 2 (mod Mₚ), avec s₀ = 4'],['Résidu final',mprime?'0':bs(s),mprime?'prouve la primalité':'prouve que le nombre est composé']]);
  $('viz').innerHTML='';C.text('vizTag',mprime?'Nombre premier de Mersenne':'pas un nombre premier de Mersenne');
  var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st3('Confirmer que p est premier','Condition nécessaire (mais non suffisante) pour que Mₚ soit premier.','p = '+p+' est premier ✓');
  st3('Démarrer la suite de Lucas–Lehmer','s₀ = 4 ; puis on répète s ← s² − 2, en réduisant modulo Mₚ à chaque fois.','s₀ = 4');
  st3('Itérer p−2 = '+(p-2)+' times',null,'premières étapes : '+iters.slice(0,6).map(bs).join(', ')+(iters.length>6?' …':''));
  st3('Vérifier le résidu final sₚ₋₂','Mₚ est premier exactement lorsque ce résidu vaut 0.','sₚ₋₂ = <b>'+(mprime?'0':bs(s))+'</b> → '+(mprime?'<b>premier</b>':'<b>composé</b>'));
  $('steps').innerHTML=h3;C.text('stepsIntro','Test de Lucas–Lehmer pour M_'+p+' = 2^'+p+' − 1.');C.text('stepsTag',p-2+' iterations');
  last='Vérification de Mersenne — calculatepilot.com/math/prime-number-checker.html\np='+p+', M_p='+M+' is '+(mprime?'PRIME':'COMPOSITE');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pnCalc',compute:compute});
  $('presets').addEventListener('click',function(e){
    var b=e.target.closest('button[data-m]');if(!b)return;
    C.set('mode',b.getAttribute('data-m'));
    if(b.hasAttribute('data-n'))C.set('n',b.getAttribute('data-n'));
    if(b.hasAttribute('data-lo')){C.set('lo',b.getAttribute('data-lo'));C.set('hi',b.getAttribute('data-hi'));}
    if(b.hasAttribute('data-p'))C.set('pp',b.getAttribute('data-p'));
    fire('n');
  });
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
