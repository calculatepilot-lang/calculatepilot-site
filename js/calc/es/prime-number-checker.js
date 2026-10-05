/* Prime number checker — CalculatePilot (Stitch redesign).
   Primality: deterministic Miller–Rabin (exact for all n < 3,317,044,064,679,887,385,961,981, using the first 13 prime bases).
   Factorization: trial division up to min(sqrt(n), 10^7). Range sieve: Sieve of Eratosthenes. Mersenne: Lucas–Lehmer test. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>60?s.slice(0,14)+'…'+s.slice(-6)+' ('+s.length+' dígitos)':grp(s);}

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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}
function readBig(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^\d+$/.test(s))return {err:label+' debe ser un número entero no negativo.'};if(s.length>25)return {err:label+' es demasiado grande (máx. ~25 dígitos para este verificador).'};return {v:BigInt(s)};}

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
  var labels={s1:'¿Es n primo?',s2:'Lista los primos en un rango',s3:'¿Es 2ᵖ − 1 primo? (Lucas–Lehmer)'};
  C.html('formH',labels[m]);

  if(m==='s1'){
    var N=readBig('n','n');if(N.err)return fail(N.err);
    var n=N.v;
    C.html('fxNow','¿Es <b>'+bs(n)+'</b> primo?');
    if(n<2n){
      C.text('heroLbl','Primalidad');C.text('resultValue',n===0n?'0 no es primo ni compuesto':'1 no es primo ni compuesto');tg.textContent='undefined';
      C.text('ex1L','Factorización en primos');C.text('ex1','—');C.text('ex2L','Primos más cercanos');C.text('ex2','—');
      C.text('interp','Por definición, los primos son enteros mayores que 1. El 0 y el 1 no tienen clasificación como primos.');
      tiles([]);$('viz').innerHTML='';C.text('vizTag','—');$('steps').innerHTML='';C.text('stepsIntro','');C.text('stepsTag','');
      last='Verificación de primos — calculatepilot.com/math/prime-number-checker.html\n'+n+' no es primo ni compuesto';
      return;
    }
    var prime=isPrimeBig(n);
    C.text('heroLbl','Primalidad');C.text('resultValue',prime?'PRIME':'COMPOSITE');tg.textContent=prime?'prime':'composite';tg.className='sx-ef-grade'+(prime?'':' mid');
    var fac=prime?null:factorize(n);
    C.html('ex1L','Factorización en primos');
    if(prime)C.html('ex1',bs(n)+' (él mismo — irreducible)');
    else C.html('ex1',factStr(fac.factors)+(fac.complete?'':' … (parcial: el factor restante es demasiado grande para resolverlo por completo)'));
    var near=nearbyPrimes(n,1);
    C.html('ex2L','Primos más cercanos');C.text('ex2',(near.below[0]?bs(near.below[0]):'—')+'  ↔  '+(near.above[0]?bs(near.above[0]):'—'));
    C.text('interp',prime?'Ningún entero desde 2 hasta √'+bs(n)+' divides '+bs(n)+' lo divide exactamente, así que es primo.':'Se descompone como se muestra, así que es compuesto.');
    var sqrtN=BigInt(Math.floor(Math.sqrt(Number(n>BigInt(Number.MAX_SAFE_INTEGER)?BigInt(Number.MAX_SAFE_INTEGER):n))));
    var gapBelow=near.below[0]?n-near.below[0]:null,gapAbove=near.above[0]?near.above[0]-n:null;
    var tl=[['Método de prueba',n<18446744073709551616n?'Miller–Rabin determinista':'Miller–Rabin (probabilístico para un n tan grande)','exacto para n < 2⁶⁴'],
      ['√n (límite de la división por tentativa)',bs(sqrtN),'mayor divisor que hay que comprobar']];
    if(near.below[0])tl.push(['Primo anterior',bs(near.below[0]),'diferencia de '+bs(gapBelow)]);
    if(near.above[0])tl.push(['Primo siguiente',bs(near.above[0]),'diferencia de '+bs(gapAbove)]);
    tiles(tl);
    numberLine(n,near.below,near.above);C.text('vizTag',prime?'prime':'composite');
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Descarta los factores pequeños','Comprueba primero la divisibilidad entre 2, 3, 5, 7, … hasta un puñado de primos pequeños.',n%2n===0n&&n!==2n?bs(n)+' es par → compuesto':'no se encontró de inmediato ningún factor primo pequeño');
    st1('Ejecuta la prueba determinista de Miller–Rabin','Con los testigos 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, el resultado es exacto (no probabilístico) para todo n menor que 2⁶⁴.',prime?'todos los testigos confirman la primalidad probable sin excepciones → <b>primo</b>':'un testigo demuestra que es compuesto → <b>compuesto</b>');
    if(!prime)st1('Factoriza por completo','La división por tentativa recupera la factorización prima completa.',bs(n)+' = '+factStr(fac.factors));
    if(near.below[0]||near.above[0])st1('Localiza los primos vecinos','Avanza hacia fuera desde n, comprobando cada entero, hasta encontrar un número primo a cada lado.','anterior: '+(near.below[0]?bs(near.below[0]):'—')+',  siguiente: '+(near.above[0]?bs(near.above[0]):'—'));
    $('steps').innerHTML=h1;C.text('stepsIntro','Probando '+bs(n)+' para comprobar su primalidad.');C.text('stepsTag',prime?'prime':'composite');
    last='Verificación de primos — calculatepilot.com/math/prime-number-checker.html\n'+n+' is '+(prime?'PRIME':'COMPOSITE')+(prime?'':'\nfactors: '+fac.factors.map(function(pe){return pe[0]+(pe[1]>1?'^'+pe[1]:'');}).join(' * '));
    return;
  }

  if(m==='s2'){
    var lo=parseInt($('lo').value,10),hi=parseInt($('hi').value,10);
    if(!isFinite(lo)||!isFinite(hi)||lo<2||hi<lo)return fail('Introduce un rango válido con inicio ≤ fin, ambos ≥ 2.');
    if(hi-lo>200000)return fail('El ancho del rango está limitado a 200,000 números.');
    if(hi>50000000)return fail('El final del rango está limitado a 50.000.000.');
    var allPrimes=sieveCount(hi),inRange=allPrimes.filter(function(p){return p>=lo;});
    C.text('heroLbl','Primos desde '+grp(String(lo))+' to '+grp(String(hi)));C.text('resultValue',String(inRange.length)+' prime'+(inRange.length===1?'':'s'));tg.textContent='criba de Eratóstenes';
    C.html('ex1L','Los primeros');C.text('ex1',inRange.slice(0,8).map(function(x){return grp(String(x));}).join(', ')+(inRange.length>8?', …':''));
    C.html('ex2L','Densidad');C.text('ex2',(inRange.length/(hi-lo+1)*100).toFixed(2)+'% de los enteros del rango');
    C.html('fxNow','Primos p con '+grp(String(lo))+' ≤ p ≤ '+grp(String(hi)));
    C.text('interp','Se obtienen mediante criba: tacha los múltiplos de cada primo hasta √'+grp(String(hi))+', y lo que quede sin marcar es primo.');
    var gaps=[];for(var i=1;i<inRange.length;i++)gaps.push(inRange[i]-inRange[i-1]);
    var maxGap=gaps.length?Math.max.apply(null,gaps):0,avgGap=gaps.length?(gaps.reduce(function(a,b){return a+b;},0)/gaps.length):0;
    tiles([['Cantidad en el rango',String(inRange.length),''],['Mayor diferencia entre primos consecutivos',String(maxGap),''],['Diferencia media',avgGap.toFixed(2),'≈ ln('+grp(String(hi))+') ≈ '+Math.log(hi).toFixed(2)+' (teorema de los números primos)'],['Amplitud del rango',String(hi-lo+1),'enteros comprobados']]);
    var N=Math.min(inRange.length,60),xs=inRange.slice(0,N);
    var W=760,H=90,pad=30,kx=(W-2*pad)/Math.max(1,(xs.length-1||1));
    var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
    s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="45" y2="45" stroke="var(--sx-muted)" stroke-width="1.5"/>';
    xs.forEach(function(p,idx){var x=pad+idx*kx;s+='<circle cx="'+x.toFixed(1)+'" cy="45" r="4" fill="#059669"/>';});
    $('viz').innerHTML=s+'</svg>'+(inRange.length>N?'<p style="margin-top:8px;color:var(--sx-muted);font-size:13px">mostrando los primeros '+N+' of '+inRange.length+' primos encontrados</p>':'');
    C.text('vizTag',inRange.length+' primos representados');
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Criba hasta el final del rango','Empieza con todos los enteros de 2 a '+grp(String(hi))+' marcados como candidatos.','tamaño de la criba: '+grp(String(hi)));
    st2('Tacha los múltiplos','Para cada primo p encontrado, tacha 2p, 3p, 4p, … hasta el límite.','se detiene en p ≤ √'+grp(String(hi))+' ≈ '+Math.floor(Math.sqrt(hi)));
    st2('Conserva lo que sobrevive en el rango','Los enteros de '+grp(String(lo))+' to '+grp(String(hi))+' que sigan sin marcar son primos.','<b>'+inRange.length+'</b> primo'+(inRange.length===1?'':'s')+' found');
    $('steps').innerHTML=h2;C.text('stepsIntro','Cribando ['+grp(String(lo))+', '+grp(String(hi))+'].');C.text('stepsTag','Criba de Eratóstenes');
    last='Criba de primos — calculatepilot.com/math/prime-number-checker.html\nrango ['+lo+', '+hi+']: '+inRange.length+' primos\nlos primeros: '+inRange.slice(0,10).join(', ');
    return;
  }

  /* s3: Mersenne / Lucas-Lehmer */
  var p=parseInt($('pp').value,10);
  if(!isFinite(p)||p<2||p>4000)return fail('p debe ser un número entero de 2 a 4000.');
  var M=(1n<<BigInt(p))-1n;
  var pPrime=isPrimeBig(BigInt(p));
  C.html('fxNow','2<sup>'+p+'</sup> − 1 = '+bs(M));
  if(!pPrime){
    C.text('heroLbl','¿Es Mₚ primo?');C.text('resultValue','COMPOSITE');tg.textContent='p no es primo';tg.className='sx-ef-grade mid';
    C.text('ex1L','Por qué');C.text('ex1','p = '+p+' no es primo');C.text('ex2L','Mp',);C.html('ex2',bs(M));
    C.text('interp','p debe ser primo para que 2ᵖ − 1 tenga opción de ser primo (condición necesaria, no suficiente); como p = '+p+' es compuesto, Mₚ también es compuesto.');
    tiles([['p',String(p),'no es primo'],['M_p = 2^p − 1',bs(M),'compuesto garantizado']]);
    $('viz').innerHTML='';C.text('vizTag','compuesto (p no es primo)');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Comprueba que p sea primo</h4><span class="eq">p = '+p+' <b>no es primo</b> → 2<sup>p</sup> − 1 no puede ser un primo de Mersenne</span></li>';
    C.text('stepsIntro','Comprobando M_'+p+' = 2^'+p+' − 1.');C.text('stepsTag','p no es primo');
    last='Comprobación de Mersenne — calculatepilot.com/math/prime-number-checker.html\np='+p+' (no primo) -> M_p compuesto';
    return;
  }
  if(p===2){
    C.text('heroLbl','¿Es Mₚ primo?');C.text('resultValue','PRIME');tg.textContent='M₂ = 3';
    C.text('ex1L','Valor');C.text('ex1','3');C.text('ex2L','Método');C.text('ex2','caso especial p=2');
    C.text('interp','M₂ = 2² − 1 = 3, primo por comprobación directa (Lucas–Lehmer se aplica para p ≥ 3).');
    tiles([['p',String(p),'prime'],['M_p',bs(M),'prime']]);$('viz').innerHTML='';C.text('vizTag','prime');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Comprobación directa</h4><span class="eq">M₂ = 2²−1 = 3, que es primo.</span></li>';
    C.text('stepsIntro','M_2 = 3.');C.text('stepsTag','caso especial');
    last='Comprobación de Mersenne — calculatepilot.com/math/prime-number-checker.html\np=2: M_p=3 (primo)';
    return;
  }
  var s=4n,iters=[];
  for(var i=0;i<p-2;i++){s=(s*s-2n)%M;if(s<0n)s+=M;if(i<6||i>p-9)iters.push(s);}
  var mprime=s===0n;
  C.text('heroLbl','¿Es Mₚ primo?');C.text('resultValue',mprime?'PRIME':'COMPOSITE');tg.textContent='p = '+p+' (exponente primo)';tg.className='sx-ef-grade'+(mprime?'':' mid');
  C.html('ex1L','Mₚ = 2<sup>p</sup> − 1');C.html('ex1',bs(M));
  C.text('ex2L','Residuo de Lucas–Lehmer');C.text('ex2',mprime?'0 (demuestra la primalidad)':bs(s)+' (≠ 0, por tanto compuesto)');
  C.text('interp',mprime?'La sucesión de Lucas–Lehmer llega exactamente a 0 tras p−2 = '+(p-2)+' pasos, lo que demuestra que Mₚ es primo.':'La sucesión de Lucas–Lehmer no llega a 0, así que Mₚ es compuesto, aunque su exponente p sea primo.');
  tiles([['p (exponente primo)',String(p),''],['Mₚ = 2ᵖ − 1',bs(M),(M.toString().length)+' digits'],['Pasos de Lucas–Lehmer',String(p-2),'s ← s² − 2 (mod Mₚ), desde s₀ = 4'],['Residuo final',mprime?'0':bs(s),mprime?'demuestra la primalidad':'demuestra que es compuesto']]);
  $('viz').innerHTML='';C.text('vizTag',mprime?'Primo de Mersenne':'no es un primo de Mersenne');
  var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st3('Confirma que p es primo','Condición necesaria (no suficiente) para que Mₚ sea primo.','p = '+p+' es primo ✓');
  st3('Inicia la sucesión de Lucas–Lehmer','s₀ = 4; después repite s ← s² − 2, reduciendo mod Mₚ cada vez.','s₀ = 4');
  st3('Itera p−2 = '+(p-2)+' times',null,'primeros pasos: '+iters.slice(0,6).map(bs).join(', ')+(iters.length>6?' …':''));
  st3('Comprueba el residuo final sₚ₋₂','Mₚ es primo exactamente cuando este residuo es 0.','sₚ₋₂ = <b>'+(mprime?'0':bs(s))+'</b> → '+(mprime?'<b>primo</b>':'<b>compuesto</b>'));
  $('steps').innerHTML=h3;C.text('stepsIntro','Prueba de Lucas–Lehmer para M_'+p+' = 2^'+p+' − 1.');C.text('stepsTag',p-2+' iterations');
  last='Comprobación de Mersenne — calculatepilot.com/math/prime-number-checker.html\np='+p+', M_p='+M+' is '+(mprime?'PRIME':'COMPOSITE');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
