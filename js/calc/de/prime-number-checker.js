/* Prime number checker — CalculatePilot (Stitch redesign).
   Primality: deterministic Miller–Rabin (exact for all n < 3,317,044,064,679,887,385,961,981, using the first 13 prime bases).
   Factorization: trial division up to min(sqrt(n), 10^7). Range sieve: Sieve of Eratosthenes. Mersenne: Lucas–Lehmer test. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>60?s.slice(0,14)+'…'+s.slice(-6)+' ('+s.length+' Stellen)':grp(s);}

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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}
function readBig(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^\d+$/.test(s))return {err:label+' muss eine nichtnegative ganze Zahl sein.'};if(s.length>25)return {err:label+' ist zu groß (maximal ca. 25 Ziffern für diesen Prüfer).'};return {v:BigInt(s)};}

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
  var labels={s1:'Ist n eine Primzahl?',s2:'Primzahlen in einem Bereich auflisten',s3:'Ist 2ᵖ − 1 eine Primzahl? (Lucas-Lehmer)'};
  C.html('formH',labels[m]);

  if(m==='s1'){
    var N=readBig('n','n');if(N.err)return fail(N.err);
    var n=N.v;
    C.html('fxNow','Ist <b>'+bs(n)+'</b> eine Primzahl?');
    if(n<2n){
      C.text('heroLbl','Primalität');C.text('resultValue',n===0n?'0 ist weder Primzahl noch zusammengesetzte Zahl':'1 ist weder Primzahl noch zusammengesetzte Zahl');tg.textContent='undefined';
      C.text('ex1L','Primfaktorzerlegung');C.text('ex1','—');C.text('ex2L','Nächste Primzahlen');C.text('ex2','—');
      C.text('interp','Per Definition sind Primzahlen ganze Zahlen größer als 1. 0 und 1 haben keine Primzahl-Klassifikation.');
      tiles([]);$('viz').innerHTML='';C.text('vizTag','—');$('steps').innerHTML='';C.text('stepsIntro','');C.text('stepsTag','');
      last='Primzahlprüfung — calculatepilot.com/math/prime-number-checker.html\n'+n+' ist weder Primzahl noch zusammengesetzte Zahl';
      return;
    }
    var prime=isPrimeBig(n);
    C.text('heroLbl','Primalität');C.text('resultValue',prime?'PRIME':'COMPOSITE');tg.textContent=prime?'prime':'composite';tg.className='sx-ef-grade'+(prime?'':' mid');
    var fac=prime?null:factorize(n);
    C.html('ex1L','Primfaktorzerlegung');
    if(prime)C.html('ex1',bs(n)+' (selbst — nicht weiter zerlegbar)');
    else C.html('ex1',factStr(fac.factors)+(fac.complete?'':' … (unvollständig — verbleibender Faktor zu groß für eine vollständige Zerlegung)'));
    var near=nearbyPrimes(n,1);
    C.html('ex2L','Nächste Primzahlen');C.text('ex2',(near.below[0]?bs(near.below[0]):'—')+'  ↔  '+(near.above[0]?bs(near.above[0]):'—'));
    C.text('interp',prime?'Keine ganze Zahl von 2 bis √'+bs(n)+' divides '+bs(n)+' teilt ohne Rest, daher ist sie eine Primzahl.':'Sie lässt sich wie gezeigt zerlegen, ist also zusammengesetzt.');
    var sqrtN=BigInt(Math.floor(Math.sqrt(Number(n>BigInt(Number.MAX_SAFE_INTEGER)?BigInt(Number.MAX_SAFE_INTEGER):n))));
    var gapBelow=near.below[0]?n-near.below[0]:null,gapAbove=near.above[0]?near.above[0]-n:null;
    var tl=[['Testmethode',n<18446744073709551616n?'Deterministischer Miller–Rabin-Test':'Miller-Rabin (probabilistisch für so große n)','exakt für n < 2⁶⁴'],
      ['√n (Grenze für die Probedivision)',bs(sqrtN),'größter Teiler, der geprüft werden muss']];
    if(near.below[0])tl.push(['Vorherige Primzahl',bs(near.below[0]),'Abstand von '+bs(gapBelow)]);
    if(near.above[0])tl.push(['Nächste Primzahl',bs(near.above[0]),'Abstand von '+bs(gapAbove)]);
    tiles(tl);
    numberLine(n,near.below,near.above);C.text('vizTag',prime?'prime':'composite');
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Kleine Faktoren ausschließen','Prüfen Sie zuerst die Teilbarkeit durch 2, 3, 5, 7, … bis zu einer Handvoll kleiner Primzahlen.',n%2n===0n&&n!==2n?bs(n)+' ist gerade → zusammengesetzt':'kein kleiner Primfaktor sofort gefunden');
    st1('Den deterministischen Miller-Rabin-Test durchführen','Mit den Zeugen 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37 ist das Ergebnis für jedes n unterhalb von 2⁶⁴ exakt (nicht probabilistisch).',prime?'jeder Zeuge bestätigt wahrscheinliche Primalität ohne Ausnahme → <b>Primzahl</b>':'ein Zeuge beweist die Zusammengesetztheit → <b>zusammengesetzt</b>');
    if(!prime)st1('Vollständig zerlegen','Die Probedivision liefert die vollständige Primfaktorzerlegung.',bs(n)+' = '+factStr(fac.factors));
    if(near.below[0]||near.above[0])st1('Die benachbarten Primzahlen finden','Gehen Sie von n aus in beide Richtungen und testen Sie jede ganze Zahl, bis auf jeder Seite eine Primzahl gefunden ist.','vorherige: '+(near.below[0]?bs(near.below[0]):'—')+',  nächste: '+(near.above[0]?bs(near.above[0]):'—'));
    $('steps').innerHTML=h1;C.text('stepsIntro','Prüfung von '+bs(n)+' auf Primalität.');C.text('stepsTag',prime?'prime':'composite');
    last='Primzahlprüfung — calculatepilot.com/math/prime-number-checker.html\n'+n+' is '+(prime?'PRIME':'COMPOSITE')+(prime?'':'\nfactors: '+fac.factors.map(function(pe){return pe[0]+(pe[1]>1?'^'+pe[1]:'');}).join(' * '));
    return;
  }

  if(m==='s2'){
    var lo=parseInt($('lo').value,10),hi=parseInt($('hi').value,10);
    if(!isFinite(lo)||!isFinite(hi)||lo<2||hi<lo)return fail('Geben Sie einen gültigen Bereich mit Start ≤ Ende ein, beide ≥ 2.');
    if(hi-lo>200000)return fail('Die Bereichsbreite ist auf 200.000 Zahlen begrenzt.');
    if(hi>50000000)return fail('Das Bereichsende ist auf 50.000.000 begrenzt.');
    var allPrimes=sieveCount(hi),inRange=allPrimes.filter(function(p){return p>=lo;});
    C.text('heroLbl','Primzahlen von '+grp(String(lo))+' to '+grp(String(hi)));C.text('resultValue',String(inRange.length)+' prime'+(inRange.length===1?'':'s'));tg.textContent='Sieb des Eratosthenes';
    C.html('ex1L','Die ersten');C.text('ex1',inRange.slice(0,8).map(function(x){return grp(String(x));}).join(', ')+(inRange.length>8?', …':''));
    C.html('ex2L','Dichte');C.text('ex2',(inRange.length/(hi-lo+1)*100).toFixed(2)+'% der ganzen Zahlen im Bereich');
    C.html('fxNow','Primzahlen p mit '+grp(String(lo))+' ≤ p ≤ '+grp(String(hi)));
    C.text('interp','Per Siebverfahren gefunden: Streichen Sie die Vielfachen jeder Primzahl bis √'+grp(String(hi))+', und was unmarkiert bleibt, ist eine Primzahl.');
    var gaps=[];for(var i=1;i<inRange.length;i++)gaps.push(inRange[i]-inRange[i-1]);
    var maxGap=gaps.length?Math.max.apply(null,gaps):0,avgGap=gaps.length?(gaps.reduce(function(a,b){return a+b;},0)/gaps.length):0;
    tiles([['Anzahl im Bereich',String(inRange.length),''],['Größte Lücke zwischen aufeinanderfolgenden Primzahlen',String(maxGap),''],['Durchschnittliche Lücke',avgGap.toFixed(2),'≈ ln('+grp(String(hi))+') ≈ '+Math.log(hi).toFixed(2)+' (Primzahlsatz)'],['Bereichsbreite',String(hi-lo+1),'geprüfte ganze Zahlen']]);
    var N=Math.min(inRange.length,60),xs=inRange.slice(0,N);
    var W=760,H=90,pad=30,kx=(W-2*pad)/Math.max(1,(xs.length-1||1));
    var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
    s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="45" y2="45" stroke="var(--sx-muted)" stroke-width="1.5"/>';
    xs.forEach(function(p,idx){var x=pad+idx*kx;s+='<circle cx="'+x.toFixed(1)+'" cy="45" r="4" fill="#059669"/>';});
    $('viz').innerHTML=s+'</svg>'+(inRange.length>N?'<p style="margin-top:8px;color:var(--sx-muted);font-size:13px">Angezeigt werden die ersten '+N+' of '+inRange.length+' gefundenen Primzahlen</p>':'');
    C.text('vizTag',inRange.length+' dargestellte Primzahlen');
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Sieben bis zum Bereichsende','Beginnen Sie mit jeder ganzen Zahl von 2 bis '+grp(String(hi))+' als Kandidat markiert.','Siebgröße: '+grp(String(hi)));
    st2('Vielfache streichen','Streichen Sie für jede gefundene Primzahl p die Zahlen 2p, 3p, 4p, … bis zur Grenze.','endet bei p ≤ √'+grp(String(hi))+' ≈ '+Math.floor(Math.sqrt(hi)));
    st2('Behalten, was im Bereich übrig bleibt','Alle ganzen Zahlen von '+grp(String(lo))+' to '+grp(String(hi))+' die noch unmarkiert sind, sind Primzahlen.','<b>'+inRange.length+'</b> Primzahl'+(inRange.length===1?'':'s')+' found');
    $('steps').innerHTML=h2;C.text('stepsIntro','Sieben ['+grp(String(lo))+', '+grp(String(hi))+'].');C.text('stepsTag','Sieb des Eratosthenes');
    last='Primzahlsieb — calculatepilot.com/math/prime-number-checker.html\nBereich ['+lo+', '+hi+']: '+inRange.length+' Primzahlen\ndie ersten: '+inRange.slice(0,10).join(', ');
    return;
  }

  /* s3: Mersenne / Lucas-Lehmer */
  var p=parseInt($('pp').value,10);
  if(!isFinite(p)||p<2||p>4000)return fail('p muss eine ganze Zahl von 2 bis 4000 sein.');
  var M=(1n<<BigInt(p))-1n;
  var pPrime=isPrimeBig(BigInt(p));
  C.html('fxNow','2<sup>'+p+'</sup> − 1 = '+bs(M));
  if(!pPrime){
    C.text('heroLbl','Ist Mₚ eine Primzahl?');C.text('resultValue','COMPOSITE');tg.textContent='p keine Primzahl';tg.className='sx-ef-grade mid';
    C.text('ex1L','Warum');C.text('ex1','p = '+p+' ist keine Primzahl');C.text('ex2L','Mp',);C.html('ex2',bs(M));
    C.text('interp','p muss eine Primzahl sein, damit 2ᵖ − 1 überhaupt eine Primzahl sein kann (notwendig, nicht hinreichend) — da p = '+p+' zusammengesetzt ist, ist auch Mₚ zusammengesetzt.');
    tiles([['p',String(p),'keine Primzahl'],['M_p = 2^p − 1',bs(M),'garantiert zusammengesetzt']]);
    $('viz').innerHTML='';C.text('vizTag','zusammengesetzt (p keine Primzahl)');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Prüfen, ob p eine Primzahl ist</h4><span class="eq">p = '+p+' ist <b>keine Primzahl</b> → 2<sup>p</sup> − 1 kann keine Mersenne-Primzahl sein</span></li>';
    C.text('stepsIntro','Test von M_'+p+' = 2^'+p+' − 1.');C.text('stepsTag','p keine Primzahl');
    last='Mersenne-Prüfung — calculatepilot.com/math/prime-number-checker.html\np='+p+' (keine Primzahl) -> M_p zusammengesetzt';
    return;
  }
  if(p===2){
    C.text('heroLbl','Ist Mₚ eine Primzahl?');C.text('resultValue','PRIME');tg.textContent='M₂ = 3';
    C.text('ex1L','Wert');C.text('ex1','3');C.text('ex2L','Methode');C.text('ex2','Sonderfall p=2');
    C.text('interp','M₂ = 2² − 1 = 3, durch direkte Prüfung eine Primzahl (Lucas-Lehmer gilt für p ≥ 3).');
    tiles([['p',String(p),'prime'],['M_p',bs(M),'prime']]);$('viz').innerHTML='';C.text('vizTag','prime');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Direkte Prüfung</h4><span class="eq">M₂ = 2²−1 = 3, das eine Primzahl ist.</span></li>';
    C.text('stepsIntro','M_2 = 3.');C.text('stepsTag','Sonderfall');
    last='Mersenne-Prüfung — calculatepilot.com/math/prime-number-checker.html\np=2: M_p=3 (Primzahl)';
    return;
  }
  var s=4n,iters=[];
  for(var i=0;i<p-2;i++){s=(s*s-2n)%M;if(s<0n)s+=M;if(i<6||i>p-9)iters.push(s);}
  var mprime=s===0n;
  C.text('heroLbl','Ist Mₚ eine Primzahl?');C.text('resultValue',mprime?'PRIME':'COMPOSITE');tg.textContent='p = '+p+' (Primzahl-Exponent)';tg.className='sx-ef-grade'+(mprime?'':' mid');
  C.html('ex1L','Mₚ = 2<sup>p</sup> − 1');C.html('ex1',bs(M));
  C.text('ex2L','Lucas-Lehmer-Rest');C.text('ex2',mprime?'0 (beweist Primalität)':bs(s)+' (≠ 0, also zusammengesetzt)');
  C.text('interp',mprime?'Die Lucas-Lehmer-Folge erreicht nach p−2 = '+(p-2)+' Schritten genau 0, was beweist, dass Mₚ eine Primzahl ist.':'Die Lucas-Lehmer-Folge erreicht nicht 0, also ist Mₚ zusammengesetzt, obwohl der Exponent p eine Primzahl ist.');
  tiles([['p (Primzahl-Exponent)',String(p),''],['Mₚ = 2ᵖ − 1',bs(M),(M.toString().length)+' digits'],['Lucas-Lehmer-Schritte',String(p-2),'s ← s² − 2 (mod Mₚ), ab s₀ = 4'],['Endrest',mprime?'0':bs(s),mprime?'beweist Primalität':'beweist Zusammengesetztheit']]);
  $('viz').innerHTML='';C.text('vizTag',mprime?'Mersenne-Primzahl':'keine Mersenne-Primzahl');
  var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st3('Bestätigen, dass p eine Primzahl ist','Eine notwendige (nicht hinreichende) Bedingung dafür, dass Mₚ eine Primzahl ist.','p = '+p+' ist eine Primzahl ✓');
  st3('Lucas-Lehmer-Folge starten','s₀ = 4; danach wiederholt s ← s² − 2, jeweils modulo Mₚ reduziert.','s₀ = 4');
  st3('p−2 Iterationen = '+(p-2)+' times',null,'erste Schritte: '+iters.slice(0,6).map(bs).join(', ')+(iters.length>6?' …':''));
  st3('Endrest sₚ₋₂ prüfen','Mₚ ist genau dann eine Primzahl, wenn dieser Rest 0 ist.','sₚ₋₂ = <b>'+(mprime?'0':bs(s))+'</b> → '+(mprime?'<b>Primzahl</b>':'<b>zusammengesetzt</b>'));
  $('steps').innerHTML=h3;C.text('stepsIntro','Lucas-Lehmer-Test für M_'+p+' = 2^'+p+' − 1.');C.text('stepsTag',p-2+' iterations');
  last='Mersenne-Prüfung — calculatepilot.com/math/prime-number-checker.html\np='+p+', M_p='+M+' is '+(mprime?'PRIME':'COMPOSITE');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
