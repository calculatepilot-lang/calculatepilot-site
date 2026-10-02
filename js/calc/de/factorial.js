/* Factorial calculator — CalculatePilot (Stitch redesign).
   n! exact (BigInt, n ≤ 3000) · n!! and n!⁽ᵏ⁾ = n(n−k)(n−2k)… · subfactorial !n = n·!(n−1) + (−1)ⁿ · Γ(x+1) via Lanczos (reflection for x < −½)
   Legendre: exponent of p in n! = Σ ⌊n/pⁱ⌋ · trailing zeros = exponent of 5 · Stirling √(2πn)(n/e)ⁿ · Ramanujan √π(n/e)ⁿ(8n³+4n²+n+1/30)^(1/6). */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='',exact='';

function esc(s){return C.esc(s);}
function fact(n){var r=1n,i;for(i=2n;i<=BigInt(n);i++)r*=i;return r;}
function multi(n,k){var r=1n,i;for(i=BigInt(n);i>1n;i-=BigInt(k))r*=i;return r;}
function subfact(n){var i;if(n===0)return 1n;var d=1n;for(i=1;i<=n;i++){d=BigInt(i)*d+(i%2?-1n:1n);}return d;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function show(b){var s=b.toString();return s.length<=30?grp(s):s.slice(0,12)+'…'+s.slice(-6)+'  ('+s.length+' Stellen)';}
function sci(b){var s=b.toString(),L=s.length;if(L<=1)return s;return s[0]+'.'+s.slice(1,10)+' × 10^'+(L-1);}
function primes(n){var s=new Uint8Array(n+1),p=[],i,j;for(i=2;i<=n;i++){if(!s[i]){p.push(i);for(j=i*i;j<=n;j+=i)s[j]=1;}}return p;}
function legendre(n,p){var e=0,q=p;while(q<=n){e+=Math.floor(n/q);q*=p;}return e;}
function lnGammaPos(x){return M.gammaln(x);}
function gammaFn(x){/* Γ(x) real, x not a non-positive integer */if(x<0.5)return PI/(Math.sin(PI*x)*gammaFn(1-x));return Math.exp(M.gammaln(x));}
function lnFactExact(n){return M.gammaln(n+1);}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','sci','dg'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';exact='';}

function chart(n){
  var W=760,H=300,pl=48,pr=16,pt=14,pb=34,N=Math.max(2,Math.min(n,120)),pts=[],i;
  for(i=1;i<=N;i++){var k=n>120?Math.max(1,Math.round(i*n/N)):i,ln=lnFactExact(k),st=0.5*Math.log(2*PI*k)+k*(Math.log(k)-1);pts.push({k:k,ex:ln/Math.LN10,st:st/Math.LN10,ee:k/Math.LN10});}
  var ymax=Math.max.apply(null,pts.map(function(p){return Math.max(p.ex,p.ee,p.st);})),ymin=0,xmax=pts[pts.length-1].k,X=function(k){return pl+(k-1)/(xmax-1||1)*(W-pl-pr);},Y=function(y){return pt+(1-(y-ymin)/(ymax-ymin||1))*(H-pt-pb);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">',g;
  var step=Math.max(1,Math.ceil(ymax/5));for(g=0;g<=ymax+0.01;g+=step)s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(g).toFixed(1)+'" y2="'+Y(g).toFixed(1)+'" stroke="var(--sx-border)"/><text class="ax" x="'+(pl-6)+'" y="'+(Y(g)+3).toFixed(1)+'" text-anchor="end">10^'+g+'</text>';
  [1,Math.round(xmax/2),xmax].forEach(function(k){s+='<text class="ax" x="'+X(k).toFixed(1)+'" y="'+(H-pb+16)+'" text-anchor="middle">n = '+k+'</text>';});
  function path(key,col,dash,w){return '<polyline fill="none" stroke="'+col+'" stroke-width="'+w+'" '+(dash?'stroke-dasharray="6 4"':'')+' points="'+pts.map(function(p){return X(p.k).toFixed(1)+','+Y(p[key]).toFixed(1);}).join(' ')+'"/>';}
  s+=path('ee','#94a3b8',true,2)+path('st','#d97706',false,2)+path('ex','#2563eb',false,2.6);
  var last2=pts[pts.length-1];s+='<circle cx="'+X(last2.k).toFixed(1)+'" cy="'+Y(last2.ex).toFixed(1)+'" r="5" fill="#2563eb"/><text class="ax" x="'+(X(last2.k)-8).toFixed(1)+'" y="'+(Y(last2.ex)-10).toFixed(1)+'" text-anchor="end" style="font-weight:700;fill:#1d4ed8">'+n+'! ≈ 10^'+(lnFactExact(n)/Math.LN10).toFixed(2)+'</text>';
  $('viz').innerHTML=s+'</svg>';}

function compute(){
  var m=$('mode').value,h='',n0=0,tg=$('tag');tg.className='sx-ef-grade';
  $('fN').hidden=m==='s4';$('fK').hidden=m!=='s3';$('fX').hidden=m!=='s4';$('presets').hidden=m==='s4';$('vizCard').hidden=m!=='s1';
  C.text('formH',{s1:'Standardfakultät n!',s2:'Doppelfakultät n!!',s3:'Multifakultät n!⁽ᵏ⁾',s4:'Gebrochene Fakultät x! = Γ(x + 1)'}[m]);$('err').hidden=true;
  function st(t,d,e){n0++;h+='<li><span class="n">'+n0+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var nR=v('n'),n=Math.round(nR),k=Math.round(v('k'));
  if(m==='s4'){
    var x=v('gx');if($('gx').value==='')return fail('Geben Sie einen Wert für x ein.');if(x<=-1&&Math.abs(x-Math.round(x))<1e-12)return fail('x! = Γ(x + 1) ist bei x = −1, −2, −3, … nicht definiert (Pole der Gammafunktion).');if(x>170)return fail('Verwenden Sie für den Gamma-Tab x bis 170; verwenden Sie für größere ganze Zahlen n! mit BigInt.');
    var G=gammaFn(x+1);exact=String(G);var isInt=Math.abs(x-Math.round(x))<1e-12&&x>=0;
    C.text('heroLbl',M.fmt(x,6)+'! = Γ('+M.fmt(x+1,6)+')');C.text('resultValue',M.fmt(G,12));C.text('sci',G.toExponential(9));C.text('dgL','Rekursion');C.text('dg','Γ(x+1) = x·Γ(x)');tg.textContent=isInt?'Ganze Zahl':'Gebrochene Fakultät';
    C.text('fxNow','x! = Γ(x + 1) = ∫₀^∞ tˣ e^(−t) dt');C.text('interp',isInt?M.fmt(x,6)+'! ist eine gewöhnliche Fakultät.':'Die Gammafunktion interpoliert die Fakultät zwischen den ganzen Zahlen.');
    tiles([['Γ(x)',M.fmt(gammaFn(x),12),'eins darunter'],['ln Γ(x + 1)',x>-1?M.fmt(M.gammaln(x+1),10):'—','natürlicher Logarithmus'],['(x − 1)!',M.fmt(x>0?gammaFn(x):NaN,12),'Γ(x)'],['Probe: x · (x − 1)!',x>0?M.fmt(x*gammaFn(x),12):'—','ergibt x!']]);
    st('Die Gammafunktion erweitert die Fakultät','Für ganze Zahlen gilt Γ(n + 1) = n!.','Γ(z) = ∫₀^∞ t^(z−1) e^(−t) dt,  Γ(z + 1) = z·Γ(z)');
    st('Bei x + 1 auswerten','Mit einer Lanczos-Näherung (etwa 15 Stellen).','Γ('+esc(M.fmt(x+1,8))+') = <b>'+esc(M.fmt(G,12))+'</b>');
    if(Math.abs(x-0.5)<1e-12)st('Bekannte geschlossene Form','Γ(1/2) = √π, also (1/2)! = ½√π.','(½)! = ½ · √π = <b>'+M.fmt(0.5*Math.sqrt(PI),12)+'</b>');
    last='Gamma – calculatepilot.com/math/factorial-calculator.html\nx! = Γ(x+1) mit x = '+M.fmt(x,10)+'\n= '+M.fmt(G,15);$('steps').innerHTML=h;C.text('stepsIntro','Gebrochene Fakultät über die Gammafunktion.');C.text('stepsTag','Γ(x + 1)');return;
  }
  if(nR!==n||n<0)return fail('n muss eine ganze Zahl sein, 0 oder größer.');if(n>3000)return fail('Dieser Rechner funktioniert mit n bis 3.000.');
  C.text('nH','0 bis 3,000');
  if(m==='s3'&&!(k>=1&&k<=20&&k===v('k')))return fail('k muss eine ganze Zahl von 1 bis 20 sein.');
  var res,label,mult;
  if(m==='s1'){res=fact(n);label=n+'!';mult=1;}else if(m==='s2'){res=multi(n,2);label=n+'!!';mult=2;}else{res=multi(n,k);label=n+'!'+'⁽'+k+'⁾';mult=k;}
  var s=res.toString(),digits=s.length;exact=s;
  var terms=[],i;for(i=n;i>1&&terms.length<10;i-=mult)terms.push(i);var ell=(n-mult*terms.length>1)?' × … × '+(n-mult*Math.floor((n-2)/mult)):'';
  C.text('fxNow',n<2?'0! = 1! = 1':terms.join(' × ')+ell+' = '+(s.length<=30?grp(s):'…'));
  C.text('heroLbl',label);C.text('resultValue',show(res));C.text('sci',sci(res));C.text('dgL','Stellen');C.text('dg',digits.toLocaleString('de-DE'));
  tg.textContent=digits<=6?'Klein':digits<=15?'Passt exakt in ein Double':'Benötigt große Ganzzahlen';
  C.text('interp',label+' has '+digits+' digit'+(digits===1?'':'s')+(s.length>30?'; hier in verkürzter Form dargestellt. Verwenden Sie „Exakten Wert kopieren“ für alle Stellen.':'.'));
  if(m==='s1'){
    var five=legendre(n,5),ps=primes(n),fac=ps.map(function(p){var e=legendre(n,p);return e>1?p+'^'+e:String(p);}).join(' · ');
    var sub=subfact(n),lnE=lnFactExact(n),lnS=n>0?0.5*Math.log(2*PI*n)+n*(Math.log(n)-1):0,lnR=n>0?0.5*Math.log(PI)+n*(Math.log(n)-1)+Math.log(8*n*n*n+4*n*n+n+1/30)/6:0;
    var eS=n>0?Math.exp(lnS-lnE)-1:NaN,eR=n>0?Math.exp(lnR-lnE)-1:NaN;
    tiles([['Nachfolgende Nullen',String(five),'Legendre: Σ ⌊n/5ⁱ⌋'],['Primfaktorzerlegung',n<2?'1':(fac.length>90?fac.slice(0,90)+'…':fac),'Legendre-Formel'],['Stirling-Näherung',n>0?(lnS/Math.LN10<15?M.fmt(Math.exp(lnS),2):Math.pow(10,(lnS/Math.LN10)%1).toFixed(6)+' × 10^'+Math.floor(lnS/Math.LN10)):'—','√(2πn)(n/e)ⁿ'],['Relativer Stirling-Fehler',isFinite(eS)?(eS*100).toFixed(4)+'%':'—','etwa −1/(12n)'],['Relativer Ramanujan-Fehler',isFinite(eR)?(eR*100).toExponential(2)+'%':'—','deutlich näher'],['ln n!  ·  log₁₀ n!',lnE.toFixed(6)+'  ·  '+(lnE/Math.LN10).toFixed(6),'aus ln Γ(n + 1)'],['Doppelfakultät n!!',show(multi(n,2)),'n(n−2)(n−4)…'],['Subfakultät !n',show(sub),'derangements']]);
    chart(Math.max(2,n));C.text('vizTag','n = '+n);
    st('Die Zahlen von n bis 1 multiplizieren','Per Definition (leeres Produkt für 0! und 1!).',n<2?'0! = 1! = <b>1</b>':terms.join(' × ')+ell+' = <b>'+esc(s.length<=30?grp(s):show(res))+'</b>');
    st('Primfaktorzerlegung nach der Legendre-Formel','Exponent der Primzahl p in n! = ⌊n/p⌋ + ⌊n/p²⌋ + ⌊n/p³⌋ + …',n<2?'keine Primzahlen':ps.slice(0,6).map(function(p){return 'p = '+p+': '+legendre(n,p);}).join(',  ')+(ps.length>6?',  …':'')+'<br><b>'+esc(fac.length>200?fac.slice(0,200)+'…':fac||'1')+'</b>');
    st('Nachfolgende Nullen','Jede Null benötigt einen Faktor 10 = 2 × 5, und die 5er sind die knappen.','⌊'+n+'/5⌋'+(n>=25?' + ⌊'+n+'/25⌋':'')+(n>=125?' + ⌊'+n+'/125⌋':'')+' = <b>'+five+' zero'+(five===1?'':'s')+'</b>');
    if(n>0)st('Stirling-Näherung','Eine geschlossene Form, die n! mit kleinem relativem Fehler folgt.','n! ≈ √(2πn)(n/e)ⁿ ≈ '+(lnS/Math.LN10<15?esc(M.fmt(Math.exp(lnS),2)):'10^'+(lnS/Math.LN10).toFixed(4))+'  (error '+(eS*100).toFixed(4)+'%)<br>Ramanujan: Fehler <b>'+(eR*100).toExponential(2)+'%</b>');
  }else{
    var ex=m==='s2'?'Für ungerades n gilt n!! = n!/(2^((n−1)/2)·((n−1)/2)!); für gerades n gilt n!! = 2^(n/2)·(n/2)!.':'Jede k-te Zahl abwärts ab n multiplizieren, solange der Faktor größer als 1 ist.';
    tiles([['Stellen',String(digits),'Länge des exakten Werts'],['Wissenschaftlich',sci(res),'Mantisse × Zehnerpotenz'],['n!  zum Vergleich',show(fact(n)),'gewöhnliche Fakultät'],['Verhältnis n! ÷ Ergebnis',n>0?M.fmt(Number(fact(n)*1000000n/res)/1000000,6):'—','wie viel größer n! ist']]);
    st('Jede '+(mult===2?'second':mult+'th')+' number','Von n abwärts, solange der Faktor über 1 liegt.',terms.join(' × ')+ell+' = <b>'+esc(show(res))+'</b>');
    st('Zusammenhang mit der gewöhnlichen Fakultät','',esc(ex));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Exakter Wert von '+label+'.');C.text('stepsTag',label);
  last='Fakultät – calculatepilot.com/math/factorial-calculator.html\n'+label+' = '+s;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('n').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'fcCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-n]');if(!b)return;C.set('n',b.getAttribute('data-n'));fire();});
  $('copyBtn').addEventListener('click',function(){if(exact)copy(exact,'copyTxt','Exakten Wert kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
