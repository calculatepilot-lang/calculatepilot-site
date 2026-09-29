/* Sequence calculator — CalculatePilot (Stitch redesign).
   Arithmetic: aₙ=a1+(n-1)d, Sₙ=n/2(a1+aₙ). Geometric: aₙ=a1·r^(n-1), Sₙ=a1(1-r^n)/(1-r), S∞=a1/(1-r) for |r|<1.
   Fibonacci/Lucas: exact BigInt fast doubling. Custom order-2 recurrence aₙ=p·aₙ₋₁+q·aₙ₋₂: exact BigInt 2×2 matrix power. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function fx(x,dp){dp=dp===undefined?6:dp;if(!isFinite(x))return x>0?'∞':'−∞';if(Math.abs(x-Math.round(x))<1e-9)return String(Math.round(x));var s=x.toFixed(dp).replace(/0+$/,'').replace(/\.$/,'');return s;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>60?s.slice(0,14)+'…'+s.slice(-6)+' ('+s.length+' digits)':grp(s);}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

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
  var labels={s1:'Arithmetic sequence',s2:'Geometric sequence',s3:'Fibonacci &amp; Lucas numbers',s4:'Custom order-2 recurrence'};
  C.html('formH',labels[m]);
  var n=parseInt($('n').value,10);
  if(!isFinite(n)||n<1||n>5000)return fail('n must be a whole number from 1 to 5000.');

  if(m==='s1'){
    var a1=parseFloat($('a1').value),d=parseFloat($('d').value);
    if(!isFinite(a1)||!isFinite(d))return fail('Enter a₁ and d.');
    var an=a1+(n-1)*d,sn=n/2*(a1+an);
    C.html('heroLbl','a<sub>'+n+'</sub> (target term)');C.text('resultValue',fx(an));tg.textContent=d===0?'constant':d>0?'increasing':'decreasing';
    C.html('ex1L','Partial sum S<sub>'+n+'</sub>');C.text('ex1',fx(sn));
    C.html('ex2L','Explicit formula');C.html('ex2','a<sub>n</sub> = '+fx(a1)+' + (n−1)('+fx(d)+')');
    C.text('interp','Each term adds '+fx(d)+' to the previous one, so the '+n+'th term is '+fx(a1)+' plus '+(n-1)+' steps of '+fx(d)+'.');
    C.html('fxNow','a<sub>n</sub> = a<sub>1</sub> + (n−1)d,  a₁='+fx(a1)+', d='+fx(d));
    tiles([['First term a₁',fx(a1),''],['Common difference d',fx(d),''],['Recursive form','aₙ = aₙ₋₁ + '+fx(d),'a₁ = '+fx(a1)],['Sum formula','Sₙ = n/2·(a₁ + aₙ)','Gauss pairing']]);
    var N=Math.min(n,8),xs=[],ys=[];for(var i=1;i<=N;i++){xs.push(i);ys.push(a1+(i-1)*d);}if(n>N){xs.push(n);ys.push(an);}
    plot(xs,ys,'aₙ');C.text('vizTag','d = '+fx(d));
    var k1=0,h1='';function st1(t,dd,e){k1++;h1+='<li><span class="n">'+k1+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Apply the nth-term formula','aₙ = a₁ + (n−1)d.','a<sub>'+n+'</sub> = '+fx(a1)+' + ('+(n-1)+')('+fx(d)+') = <b>'+fx(an)+'</b>');
    st1('Sum with the Gauss pairing trick','Pair the first and last term: their sum times n/2 gives the total.','S<sub>'+n+'</sub> = '+n+'/2 × ('+fx(a1)+' + '+fx(an)+') = <b>'+fx(sn)+'</b>');
    $('steps').innerHTML=h1;C.text('stepsIntro','Arithmetic sequence with a₁='+fx(a1)+', d='+fx(d)+'.');C.text('stepsTag','n = '+n);
    last='Sequence (arithmetic) — calculatepilot.com/math/sequence-calculator.html\na1='+a1+', d='+d+', n='+n+'\na_n='+an+'\nS_n='+sn;
    return;
  }
  if(m==='s2'){
    var ga1=parseFloat($('ga1').value),r=parseFloat($('r').value);
    if(!isFinite(ga1)||!isFinite(r))return fail('Enter a₁ and r.');
    var gan=ga1*Math.pow(r,n-1),gsn=r===1?ga1*n:ga1*(1-Math.pow(r,n))/(1-r);
    var converges=Math.abs(r)<1,sInf=converges?ga1/(1-r):(r===1?NaN:(r<=-1?NaN:Infinity));
    C.html('heroLbl','a<sub>'+n+'</sub> (target term)');C.text('resultValue',fx(gan));tg.textContent=converges?'|r| < 1':Math.abs(r)===1?'|r| = 1':'|r| > 1';tg.className='sx-ef-grade'+(converges?'':' mid');
    C.html('ex1L','Partial sum S<sub>'+n+'</sub>');C.text('ex1',fx(gsn));
    C.html('ex2L','Explicit formula');C.html('ex2','a<sub>n</sub> = '+fx(ga1)+' · ('+fx(r)+')<sup>n−1</sup>');
    C.text('interp',converges?'Since |r| = '+fx(Math.abs(r))+' < 1, the terms shrink toward 0 and the infinite series converges to '+fx(sInf)+'.':'Since |r| = '+fx(Math.abs(r))+' ≥ 1, the terms do not shrink to zero, so the infinite series diverges.');
    C.html('fxNow','a<sub>n</sub> = a<sub>1</sub>·r<sup>n−1</sup>,  a₁='+fx(ga1)+', r='+fx(r));
    tiles([['First term a₁',fx(ga1),''],['Common ratio r',fx(r),''],['Converges as n → ∞?',converges?'Yes':'No',converges?'|r| < 1':'|r| ≥ 1'],['Infinite sum S∞',converges?fx(sInf):'diverges',converges?'a₁ / (1 − r)':'no finite limit']]);
    var N2=Math.min(n,8),xs2=[],ys2=[];for(var j=1;j<=N2;j++){xs2.push(j);ys2.push(ga1*Math.pow(r,j-1));}if(n>N2){xs2.push(n);ys2.push(gan);}
    plot(xs2,ys2,'aₙ');C.text('vizTag','r = '+fx(r));
    var k2=0,h2='';function st2(t,dd,e){k2++;h2+='<li><span class="n">'+k2+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Apply the nth-term formula','aₙ = a₁·r^(n−1).','a<sub>'+n+'</sub> = '+fx(ga1)+' × ('+fx(r)+')<sup>'+(n-1)+'</sup> = <b>'+fx(gan)+'</b>');
    st2('Sum the finite series','Sₙ = a₁(1 − rⁿ)/(1 − r) for r ≠ 1.','S<sub>'+n+'</sub> = '+fx(ga1)+'(1 − ('+fx(r)+')<sup>'+n+'</sup>) ÷ (1 − '+fx(r)+') = <b>'+fx(gsn)+'</b>');
    if(converges)st2('Check convergence of the infinite series','|r| < 1, so as n → ∞ the sum approaches a finite limit.','S∞ = '+fx(ga1)+' ÷ (1 − '+fx(r)+') = <b>'+fx(sInf)+'</b>');
    $('steps').innerHTML=h2;C.text('stepsIntro','Geometric sequence with a₁='+fx(ga1)+', r='+fx(r)+'.');C.text('stepsTag','n = '+n);
    last='Sequence (geometric) — calculatepilot.com/math/sequence-calculator.html\na1='+ga1+', r='+r+', n='+n+'\na_n='+gan+'\nS_n='+gsn+(converges?'\nS_inf='+sInf:'');
    return;
  }
  if(m==='s3'){
    var kind=$('fibKind').value;
    if(n>5000)return fail('n is limited to 5000 for exact results.');
    var idx=n-1; /* map "1st term" -> index 0 per typical F1=1,F2=1 convention, but we use F0=0 base; present as term #n starting a1 */
    var Fn=fib(n-1),Fn1=fib(n),phi=(1+Math.sqrt(5))/2;
    var val=kind==='fib'?Fn:lucas(n-1);
    var nextVal=kind==='fib'?Fn1:lucas(n);
    var ratio=Number(nextVal)/Number(val||1n);
    C.html('heroLbl',kind==='fib'?'F<sub>'+(n-1)+'</sub>':'L<sub>'+(n-1)+'</sub>');C.text('resultValue',bs(val));tg.textContent=kind==='fib'?'Fibonacci':'Lucas';
    C.html('ex1L','Next term');C.text('ex1',bs(nextVal));
    C.text('ex2L','Ratio to previous ≈ φ');C.text('ex2',fx(ratio,8)+'  (φ = '+fx(phi,8)+')');
    C.text('interp','Computed exactly with BigInt fast doubling — even for n in the thousands, every digit is exact, not a floating-point approximation.');
    C.html('fxNow',(kind==='fib'?'F':'L')+'<sub>n</sub> = '+(kind==='fib'?'F':'L')+'<sub>n−1</sub> + '+(kind==='fib'?'F':'L')+'<sub>n−2</sub>,  '+(kind==='fib'?'F₀=0, F₁=1':'L₀=2, L₁=1'));
    tiles([['Sequence',kind==='fib'?'Fibonacci':'Lucas',''],['Index computed',String(n-1),'0-indexed, so this is term #'+n],['Consecutive-term ratio',fx(ratio,6),'approaches the golden ratio φ'],['Golden ratio φ',fx(phi,10),'(1+√5)/2']]);
    var xs3=[],ys3=[];for(var t=0;t<=Math.min(n-1,10);t++){var v=kind==='fib'?fib(t):lucas(t);xs3.push(t);ys3.push(Number(v));}
    plot(xs3,ys3,kind==='fib'?'Fₙ':'Lₙ');C.text('vizTag',(kind==='fib'?'F':'L')+'ₙ through n='+Math.min(n-1,10));
    var k3=0,h3='';function st3(t2,dd,e){k3++;h3+='<li><span class="n">'+k3+'</span><h4>'+t2+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Start from the base cases',kind==='fib'?'F₀ = 0, F₁ = 1.':'L₀ = 2, L₁ = 1.','then each term is the sum of the two before it');
    st3('Compute via fast doubling','Using F(2k)=F(k)[2F(k+1)−F(k)] and F(2k+1)=F(k)²+F(k+1)² needs only ~log₂(n) big-integer steps.','('+(kind==='fib'?'F':'L')+')<sub>'+(n-1)+'</sub> = <b>'+bs(val)+'</b>');
    st3('Watch the ratio converge to φ','Consecutive-term ratios approach the golden ratio as n grows.','ratio ≈ <b>'+fx(ratio,8)+'</b>, φ = '+fx(phi,8));
    $('steps').innerHTML=h3;C.text('stepsIntro',(kind==='fib'?'Fibonacci':'Lucas')+' number at index '+(n-1)+'.');C.text('stepsTag','fast doubling');
    last='Sequence ('+(kind==='fib'?'Fibonacci':'Lucas')+') — calculatepilot.com/math/sequence-calculator.html\n'+(kind==='fib'?'F':'L')+'('+(n-1)+') = '+val;
    return;
  }
  /* s4: custom recurrence */
  var ra1=parseInt($('ra1').value,10),ra2=parseInt($('ra2').value,10),rp=parseInt($('rp').value,10),rq=parseInt($('rq').value,10);
  if(![ra1,ra2,rp,rq].every(isFinite))return fail('Enter integer values for a₁, a₂, p and q.');
  if(n>5000)return fail('n is limited to 5000 for exact results.');
  var val4=recTerm(BigInt(rp),BigInt(rq),BigInt(ra1),BigInt(ra2),BigInt(Math.max(n,1)));
  var val4prev=n>1?recTerm(BigInt(rp),BigInt(rq),BigInt(ra1),BigInt(ra2),BigInt(n-1)):null;
  C.html('heroLbl','a<sub>'+n+'</sub> (target term)');C.text('resultValue',bs(val4));tg.textContent='order-2 linear recurrence';
  C.html('ex1L','Previous term a<sub>'+(n-1)+'</sub>');C.text('ex1',n>1?bs(val4prev):'— (n=1)');
  var ratio4=n>1&&val4prev!==0n?Number(val4)/Number(val4prev):NaN;
  C.text('ex2L','Growth ratio aₙ/aₙ₋₁');C.text('ex2',isFinite(ratio4)?fx(ratio4,6):'—');
  C.text('interp','Each term is p×(previous) + q×(term before that); computed by matrix exponentiation, so it stays exact even for large n.');
  C.html('fxNow','a<sub>n</sub> = '+rp+'·a<sub>n−1</sub> + '+rq+'·a<sub>n−2</sub>,  a₁='+ra1+', a₂='+ra2);
  tiles([['Seeds (a₁, a₂)','('+ra1+', '+ra2+')',''],['Coefficients (p, q)','('+rp+', '+rq+')',''],['Characteristic equation','x² − '+rp+'x − '+rq+' = 0','roots control long-run growth'],['Growth ratio',isFinite(ratio4)?fx(ratio4,6):'—','aₙ / aₙ₋₁, approaches a fixed value for large n']]);
  var xs4=[],ys4=[];for(var u=1;u<=Math.min(n,10);u++){var vv=recTerm(BigInt(rp),BigInt(rq),BigInt(ra1),BigInt(ra2),BigInt(u));xs4.push(u);ys4.push(Number(vv));}
  plot(xs4,ys4,'aₙ');C.text('vizTag','p='+rp+', q='+rq);
  var k4=0,h4='';function st4(t,dd,e){k4++;h4+='<li><span class="n">'+k4+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st4('Write the recurrence as a matrix','[[aₙ],[aₙ₋₁]] = [[p, q], [1, 0]] · [[aₙ₋₁],[aₙ₋₂]].','M = [['+rp+', '+rq+'], [1, 0]]');
  st4('Raise the matrix to the (n−2) power','This gives aₙ directly without n−2 sequential steps.','M<sup>'+Math.max(n-2,0)+'</sup> applied to the seed vector');
  st4('Read off the result','a<sub>'+n+'</sub> = <b>'+bs(val4)+'</b>');
  $('steps').innerHTML=h4;C.text('stepsIntro','Custom recurrence aₙ = '+rp+'aₙ₋₁ + '+rq+'aₙ₋₂.');C.text('stepsTag','matrix power');
  last='Sequence (custom recurrence) — calculatepilot.com/math/sequence-calculator.html\na1='+ra1+', a2='+ra2+', p='+rp+', q='+rq+', n='+n+'\na_n='+val4;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
