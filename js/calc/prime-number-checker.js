/* Prime number checker — CalculatePilot (Stitch redesign).
   Primality: deterministic Miller–Rabin (exact for all n < 3,317,044,064,679,887,385,961,981, using the first 13 prime bases).
   Factorization: trial division up to min(sqrt(n), 10^7). Range sieve: Sieve of Eratosthenes. Mersenne: Lucas–Lehmer test. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>60?s.slice(0,14)+'…'+s.slice(-6)+' ('+s.length+' digits)':grp(s);}

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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}
function readBig(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^\d+$/.test(s))return {err:label+' must be a non-negative whole number.'};if(s.length>25)return {err:label+' is too large (max ~25 digits for this checker).'};return {v:BigInt(s)};}

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
  var labels={s1:'Is n prime?',s2:'List primes in a range',s3:'Is 2ᵖ − 1 prime? (Lucas–Lehmer)'};
  C.html('formH',labels[m]);

  if(m==='s1'){
    var N=readBig('n','n');if(N.err)return fail(N.err);
    var n=N.v;
    C.html('fxNow','Is <b>'+bs(n)+'</b> prime?');
    if(n<2n){
      C.text('heroLbl','Primality');C.text('resultValue',n===0n?'0 is neither prime nor composite':'1 is neither prime nor composite');tg.textContent='undefined';
      C.text('ex1L','Prime factorization');C.text('ex1','—');C.text('ex2L','Nearest primes');C.text('ex2','—');
      C.text('interp','By definition, primes are integers greater than 1. 0 and 1 have no prime classification.');
      tiles([]);$('viz').innerHTML='';C.text('vizTag','—');$('steps').innerHTML='';C.text('stepsIntro','');C.text('stepsTag','');
      last='Prime check — calculatepilot.com/math/prime-number-checker.html\n'+n+' is neither prime nor composite';
      return;
    }
    var prime=isPrimeBig(n);
    C.text('heroLbl','Primality');C.text('resultValue',prime?'PRIME':'COMPOSITE');tg.textContent=prime?'prime':'composite';tg.className='sx-ef-grade'+(prime?'':' mid');
    var fac=prime?null:factorize(n);
    C.html('ex1L','Prime factorization');
    if(prime)C.html('ex1',bs(n)+' (itself — irreducible)');
    else C.html('ex1',factStr(fac.factors)+(fac.complete?'':' … (partial — remaining factor too large to fully resolve)'));
    var near=nearbyPrimes(n,1);
    C.html('ex2L','Nearest primes');C.text('ex2',(near.below[0]?bs(near.below[0]):'—')+'  ↔  '+(near.above[0]?bs(near.above[0]):'—'));
    C.text('interp',prime?'No integer from 2 up to √'+bs(n)+' divides '+bs(n)+' evenly, so it is prime.':'It factors as shown, so it is composite.');
    var sqrtN=BigInt(Math.floor(Math.sqrt(Number(n>BigInt(Number.MAX_SAFE_INTEGER)?BigInt(Number.MAX_SAFE_INTEGER):n))));
    var gapBelow=near.below[0]?n-near.below[0]:null,gapAbove=near.above[0]?near.above[0]-n:null;
    var tl=[['Test method',n<18446744073709551616n?'Deterministic Miller–Rabin':'Miller–Rabin (probabilistic for n this large)','exact for n < 2⁶⁴'],
      ['√n (trial-division bound)',bs(sqrtN),'largest divisor that needs checking']];
    if(near.below[0])tl.push(['Previous prime',bs(near.below[0]),'gap of '+bs(gapBelow)]);
    if(near.above[0])tl.push(['Next prime',bs(near.above[0]),'gap of '+bs(gapAbove)]);
    tiles(tl);
    numberLine(n,near.below,near.above);C.text('vizTag',prime?'prime':'composite');
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Rule out small factors','Check divisibility by 2, 3, 5, 7, … up to a handful of small primes first.',n%2n===0n&&n!==2n?bs(n)+' is even → composite':'no small prime factor found immediately');
    st1('Run the deterministic Miller–Rabin test','With witnesses 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, the result is exact (not probabilistic) for every n below 2⁶⁴.',prime?'every witness confirms probable primality with no exceptions → <b>prime</b>':'a witness proves compositeness → <b>composite</b>');
    if(!prime)st1('Factor completely','Trial division recovers the full prime factorization.',bs(n)+' = '+factStr(fac.factors));
    if(near.below[0]||near.above[0])st1('Locate the neighboring primes','Step outward from n, testing each integer, until a prime is found on each side.','previous: '+(near.below[0]?bs(near.below[0]):'—')+',  next: '+(near.above[0]?bs(near.above[0]):'—'));
    $('steps').innerHTML=h1;C.text('stepsIntro','Testing '+bs(n)+' for primality.');C.text('stepsTag',prime?'prime':'composite');
    last='Prime check — calculatepilot.com/math/prime-number-checker.html\n'+n+' is '+(prime?'PRIME':'COMPOSITE')+(prime?'':'\nfactors: '+fac.factors.map(function(pe){return pe[0]+(pe[1]>1?'^'+pe[1]:'');}).join(' * '));
    return;
  }

  if(m==='s2'){
    var lo=parseInt($('lo').value,10),hi=parseInt($('hi').value,10);
    if(!isFinite(lo)||!isFinite(hi)||lo<2||hi<lo)return fail('Enter a valid range with start ≤ end, both ≥ 2.');
    if(hi-lo>200000)return fail('Range width is limited to 200,000 numbers.');
    if(hi>50000000)return fail('Range end is limited to 50,000,000.');
    var allPrimes=sieveCount(hi),inRange=allPrimes.filter(function(p){return p>=lo;});
    C.text('heroLbl','Primes from '+grp(String(lo))+' to '+grp(String(hi)));C.text('resultValue',String(inRange.length)+' prime'+(inRange.length===1?'':'s'));tg.textContent='sieve of Eratosthenes';
    C.html('ex1L','First few');C.text('ex1',inRange.slice(0,8).map(function(x){return grp(String(x));}).join(', ')+(inRange.length>8?', …':''));
    C.html('ex2L','Density');C.text('ex2',(inRange.length/(hi-lo+1)*100).toFixed(2)+'% of integers in range');
    C.html('fxNow','Primes p with '+grp(String(lo))+' ≤ p ≤ '+grp(String(hi)));
    C.text('interp','Found by sieving: cross out multiples of every prime up to √'+grp(String(hi))+', and whatever remains unmarked is prime.');
    var gaps=[];for(var i=1;i<inRange.length;i++)gaps.push(inRange[i]-inRange[i-1]);
    var maxGap=gaps.length?Math.max.apply(null,gaps):0,avgGap=gaps.length?(gaps.reduce(function(a,b){return a+b;},0)/gaps.length):0;
    tiles([['Count in range',String(inRange.length),''],['Largest gap between consecutive primes',String(maxGap),''],['Average gap',avgGap.toFixed(2),'≈ ln('+grp(String(hi))+') ≈ '+Math.log(hi).toFixed(2)+' (prime number theorem)'],['Range width',String(hi-lo+1),'integers checked']]);
    var N=Math.min(inRange.length,60),xs=inRange.slice(0,N);
    var W=760,H=90,pad=30,kx=(W-2*pad)/Math.max(1,(xs.length-1||1));
    var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
    s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="45" y2="45" stroke="var(--sx-muted)" stroke-width="1.5"/>';
    xs.forEach(function(p,idx){var x=pad+idx*kx;s+='<circle cx="'+x.toFixed(1)+'" cy="45" r="4" fill="#059669"/>';});
    $('viz').innerHTML=s+'</svg>'+(inRange.length>N?'<p style="margin-top:8px;color:var(--sx-muted);font-size:13px">showing the first '+N+' of '+inRange.length+' primes found</p>':'');
    C.text('vizTag',inRange.length+' primes plotted');
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Sieve up to the range end','Start with every integer from 2 to '+grp(String(hi))+' marked as a candidate.','sieve size: '+grp(String(hi)));
    st2('Cross out multiples','For each prime p found, cross out 2p, 3p, 4p, … up to the limit.','stops at p ≤ √'+grp(String(hi))+' ≈ '+Math.floor(Math.sqrt(hi)));
    st2('Keep what survives in range','Whatever integers from '+grp(String(lo))+' to '+grp(String(hi))+' are still unmarked are prime.','<b>'+inRange.length+'</b> prime'+(inRange.length===1?'':'s')+' found');
    $('steps').innerHTML=h2;C.text('stepsIntro','Sieving ['+grp(String(lo))+', '+grp(String(hi))+'].');C.text('stepsTag','Sieve of Eratosthenes');
    last='Prime sieve — calculatepilot.com/math/prime-number-checker.html\nrange ['+lo+', '+hi+']: '+inRange.length+' primes\nfirst few: '+inRange.slice(0,10).join(', ');
    return;
  }

  /* s3: Mersenne / Lucas-Lehmer */
  var p=parseInt($('pp').value,10);
  if(!isFinite(p)||p<2||p>4000)return fail('p must be a whole number from 2 to 4000.');
  var M=(1n<<BigInt(p))-1n;
  var pPrime=isPrimeBig(BigInt(p));
  C.html('fxNow','2<sup>'+p+'</sup> − 1 = '+bs(M));
  if(!pPrime){
    C.text('heroLbl','Is Mₚ prime?');C.text('resultValue','COMPOSITE');tg.textContent='p not prime';tg.className='sx-ef-grade mid';
    C.text('ex1L','Why');C.text('ex1','p = '+p+' is not prime');C.text('ex2L','Mp',);C.html('ex2',bs(M));
    C.text('interp','p must be prime for 2ᵖ − 1 to have a chance of being prime (necessary, not sufficient) — since p = '+p+' is composite, Mₚ is composite too.');
    tiles([['p',String(p),'not prime'],['M_p = 2^p − 1',bs(M),'guaranteed composite']]);
    $('viz').innerHTML='';C.text('vizTag','composite (p not prime)');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Check that p is prime</h4><span class="eq">p = '+p+' is <b>not prime</b> → 2<sup>p</sup> − 1 cannot be a Mersenne prime</span></li>';
    C.text('stepsIntro','Testing M_'+p+' = 2^'+p+' − 1.');C.text('stepsTag','p not prime');
    last='Mersenne check — calculatepilot.com/math/prime-number-checker.html\np='+p+' (not prime) -> M_p composite';
    return;
  }
  if(p===2){
    C.text('heroLbl','Is Mₚ prime?');C.text('resultValue','PRIME');tg.textContent='M₂ = 3';
    C.text('ex1L','Value');C.text('ex1','3');C.text('ex2L','Method');C.text('ex2','special case p=2');
    C.text('interp','M₂ = 2² − 1 = 3, prime by direct check (Lucas–Lehmer applies for p ≥ 3).');
    tiles([['p',String(p),'prime'],['M_p',bs(M),'prime']]);$('viz').innerHTML='';C.text('vizTag','prime');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Direct check</h4><span class="eq">M₂ = 2²−1 = 3, which is prime.</span></li>';
    C.text('stepsIntro','M_2 = 3.');C.text('stepsTag','special case');
    last='Mersenne check — calculatepilot.com/math/prime-number-checker.html\np=2: M_p=3 (prime)';
    return;
  }
  var s=4n,iters=[];
  for(var i=0;i<p-2;i++){s=(s*s-2n)%M;if(s<0n)s+=M;if(i<6||i>p-9)iters.push(s);}
  var mprime=s===0n;
  C.text('heroLbl','Is Mₚ prime?');C.text('resultValue',mprime?'PRIME':'COMPOSITE');tg.textContent='p = '+p+' (prime exponent)';tg.className='sx-ef-grade'+(mprime?'':' mid');
  C.html('ex1L','Mₚ = 2<sup>p</sup> − 1');C.html('ex1',bs(M));
  C.text('ex2L','Lucas–Lehmer residue');C.text('ex2',mprime?'0 (proves primality)':bs(s)+' (≠ 0, so composite)');
  C.text('interp',mprime?'The Lucas–Lehmer sequence reaches exactly 0 after p−2 = '+(p-2)+' steps, which proves Mₚ is prime.':'The Lucas–Lehmer sequence does not reach 0, so Mₚ is composite, even though its exponent p is prime.');
  tiles([['p (prime exponent)',String(p),''],['Mₚ = 2ᵖ − 1',bs(M),(M.toString().length)+' digits'],['Lucas–Lehmer steps',String(p-2),'s ← s² − 2 (mod Mₚ), from s₀ = 4'],['Final residue',mprime?'0':bs(s),mprime?'proves primality':'proves compositeness']]);
  $('viz').innerHTML='';C.text('vizTag',mprime?'Mersenne prime':'not a Mersenne prime');
  var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st3('Confirm p is prime','A necessary (not sufficient) condition for Mₚ to be prime.','p = '+p+' is prime ✓');
  st3('Start the Lucas–Lehmer sequence','s₀ = 4; then repeatedly s ← s² − 2, reducing mod Mₚ each time.','s₀ = 4');
  st3('Iterate p−2 = '+(p-2)+' times',null,'first steps: '+iters.slice(0,6).map(bs).join(', ')+(iters.length>6?' …':''));
  st3('Check the final residue sₚ₋₂','Mₚ is prime exactly when this residue is 0.','sₚ₋₂ = <b>'+(mprime?'0':bs(s))+'</b> → '+(mprime?'<b>prime</b>':'<b>composite</b>'));
  $('steps').innerHTML=h3;C.text('stepsIntro','Lucas–Lehmer test for M_'+p+' = 2^'+p+' − 1.');C.text('stepsTag',p-2+' iterations');
  last='Mersenne check — calculatepilot.com/math/prime-number-checker.html\np='+p+', M_p='+M+' is '+(mprime?'PRIME':'COMPOSITE');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
