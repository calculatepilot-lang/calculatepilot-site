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
function show(b){var s=b.toString();return s.length<=30?grp(s):s.slice(0,12)+'…'+s.slice(-6)+'  ('+s.length+' chiffres)';}
function sci(b){var s=b.toString(),L=s.length;if(L<=1)return s;return s[0]+'.'+s.slice(1,10)+' × 10^'+(L-1);}
function primes(n){var s=new Uint8Array(n+1),p=[],i,j;for(i=2;i<=n;i++){if(!s[i]){p.push(i);for(j=i*i;j<=n;j+=i)s[j]=1;}}return p;}
function legendre(n,p){var e=0,q=p;while(q<=n){e+=Math.floor(n/q);q*=p;}return e;}
function lnGammaPos(x){return M.gammaln(x);}
function gammaFn(x){/* Γ(x) real, x not a non-positive integer */if(x<0.5)return PI/(Math.sin(PI*x)*gammaFn(1-x));return Math.exp(M.gammaln(x));}
function lnFactExact(n){return M.gammaln(n+1);}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','sci','dg'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';exact='';}

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
  C.text('formH',{s1:'Factorielle standard n!',s2:'Double factorielle n!!',s3:'Multifactorielle n!⁽ᵏ⁾',s4:'Factorielle fractionnaire x! = Γ(x + 1)'}[m]);$('err').hidden=true;
  function st(t,d,e){n0++;h+='<li><span class="n">'+n0+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var nR=v('n'),n=Math.round(nR),k=Math.round(v('k'));
  if(m==='s4'){
    var x=v('gx');if($('gx').value==='')return fail('Saisissez une valeur pour x.');if(x<=-1&&Math.abs(x-Math.round(x))<1e-12)return fail('x! = Γ(x + 1) n\'est pas défini en x = −1, −2, −3, … (pôles de la fonction Gamma).');if(x>170)return fail('Utilisez x jusqu\'à 170 pour l\'onglet Gamma ; utilisez n! avec BigInt pour les entiers plus grands.');
    var G=gammaFn(x+1);exact=String(G);var isInt=Math.abs(x-Math.round(x))<1e-12&&x>=0;
    C.text('heroLbl',M.fmt(x,6)+'! = Γ('+M.fmt(x+1,6)+')');C.text('resultValue',M.fmt(G,12));C.text('sci',G.toExponential(9));C.text('dgL','Récurrence');C.text('dg','Γ(x+1) = x·Γ(x)');tg.textContent=isInt?'Nombre entier':'Factorielle fractionnaire';
    C.text('fxNow','x! = Γ(x + 1) = ∫₀^∞ tˣ e^(−t) dt');C.text('interp',isInt?M.fmt(x,6)+'! est une factorielle ordinaire.':'La fonction Gamma interpole la factorielle entre les entiers.');
    tiles([['Γ(x)',M.fmt(gammaFn(x),12),'un cran en dessous'],['ln Γ(x + 1)',x>-1?M.fmt(M.gammaln(x+1),10):'—','logarithme naturel'],['(x − 1)!',M.fmt(x>0?gammaFn(x):NaN,12),'Γ(x)'],['Vérification : x · (x − 1)!',x>0?M.fmt(x*gammaFn(x),12):'—','est égal à x!']]);
    st('La fonction Gamma prolonge la factorielle','Pour les entiers, Γ(n + 1) = n!.','Γ(z) = ∫₀^∞ t^(z−1) e^(−t) dt,  Γ(z + 1) = z·Γ(z)');
    st('Évaluer en x + 1','Avec une approximation de Lanczos (environ 15 chiffres).','Γ('+esc(M.fmt(x+1,8))+') = <b>'+esc(M.fmt(G,12))+'</b>');
    if(Math.abs(x-0.5)<1e-12)st('Forme fermée connue','Γ(1/2) = √π, donc (1/2)! = ½√π.','(½)! = ½ · √π = <b>'+M.fmt(0.5*Math.sqrt(PI),12)+'</b>');
    last='Gamma — calculatepilot.com/math/factorial-calculator.html\nx! = Γ(x+1) avec x = '+M.fmt(x,10)+'\n= '+M.fmt(G,15);$('steps').innerHTML=h;C.text('stepsIntro','Factorielle fractionnaire via la fonction Gamma.');C.text('stepsTag','Γ(x + 1)');return;
  }
  if(nR!==n||n<0)return fail('n doit être un entier supérieur ou égal à 0.');if(n>3000)return fail('Cette calculatrice accepte n jusqu\'à 3 000.');
  C.text('nH','0 à 3 000');
  if(m==='s3'&&!(k>=1&&k<=20&&k===v('k')))return fail('k doit être un entier compris entre 1 et 20.');
  var res,label,mult;
  if(m==='s1'){res=fact(n);label=n+'!';mult=1;}else if(m==='s2'){res=multi(n,2);label=n+'!!';mult=2;}else{res=multi(n,k);label=n+'!'+'⁽'+k+'⁾';mult=k;}
  var s=res.toString(),digits=s.length;exact=s;
  var terms=[],i;for(i=n;i>1&&terms.length<10;i-=mult)terms.push(i);var ell=(n-mult*terms.length>1)?' × … × '+(n-mult*Math.floor((n-2)/mult)):'';
  C.text('fxNow',n<2?'0! = 1! = 1':terms.join(' × ')+ell+' = '+(s.length<=30?grp(s):'…'));
  C.text('heroLbl',label);C.text('resultValue',show(res));C.text('sci',sci(res));C.text('dgL','Chiffres');C.text('dg',digits.toLocaleString('fr-FR'));
  tg.textContent=digits<=6?'Fine':digits<=15?'Tient exactement dans un double':'Nécessite de grands entiers';
  C.text('interp',label+' has '+digits+' digit'+(digits===1?'':'s')+(s.length>30?' ; affiché ici sous forme abrégée. Utilisez Copier la valeur exacte pour obtenir tous les chiffres.':'.'));
  if(m==='s1'){
    var five=legendre(n,5),ps=primes(n),fac=ps.map(function(p){var e=legendre(n,p);return e>1?p+'^'+e:String(p);}).join(' · ');
    var sub=subfact(n),lnE=lnFactExact(n),lnS=n>0?0.5*Math.log(2*PI*n)+n*(Math.log(n)-1):0,lnR=n>0?0.5*Math.log(PI)+n*(Math.log(n)-1)+Math.log(8*n*n*n+4*n*n+n+1/30)/6:0;
    var eS=n>0?Math.exp(lnS-lnE)-1:NaN,eR=n>0?Math.exp(lnR-lnE)-1:NaN;
    tiles([['Zéros finaux',String(five),'Legendre : Σ ⌊n/5ⁱ⌋'],['Décomposition en facteurs premiers',n<2?'1':(fac.length>90?fac.slice(0,90)+'…':fac),'Formule de Legendre'],['Approximation de Stirling',n>0?(lnS/Math.LN10<15?M.fmt(Math.exp(lnS),2):Math.pow(10,(lnS/Math.LN10)%1).toFixed(6)+' × 10^'+Math.floor(lnS/Math.LN10)):'—','√(2πn)(n/e)ⁿ'],['Erreur relative de Stirling',isFinite(eS)?(eS*100).toFixed(4)+'%':'—','environ −1/(12n)'],['Erreur relative de Ramanujan',isFinite(eR)?(eR*100).toExponential(2)+'%':'—','beaucoup plus proche'],['ln n!  ·  log₁₀ n!',lnE.toFixed(6)+'  ·  '+(lnE/Math.LN10).toFixed(6),'à partir de ln Γ(n + 1)'],['Double factorielle n!!',show(multi(n,2)),'n(n−2)(n−4)…'],['Sous-factorielle !n',show(sub),'derangements']]);
    chart(Math.max(2,n));C.text('vizTag','n = '+n);
    st('Multipliez les nombres de n jusqu\'à 1','Par définition (produit vide pour 0! et 1!).',n<2?'0! = 1! = <b>1</b>':terms.join(' × ')+ell+' = <b>'+esc(s.length<=30?grp(s):show(res))+'</b>');
    st('Décomposition en facteurs premiers par la formule de Legendre','Exposant du nombre premier p dans n! = ⌊n/p⌋ + ⌊n/p²⌋ + ⌊n/p³⌋ + …',n<2?'aucun nombre premier':ps.slice(0,6).map(function(p){return 'p = '+p+': '+legendre(n,p);}).join(',  ')+(ps.length>6?',  …':'')+'<br><b>'+esc(fac.length>200?fac.slice(0,200)+'…':fac||'1')+'</b>');
    st('Zéros finaux','Chaque zéro demande un facteur 10 = 2 × 5, et ce sont les 5 qui sont rares.','⌊'+n+'/5⌋'+(n>=25?' + ⌊'+n+'/25⌋':'')+(n>=125?' + ⌊'+n+'/125⌋':'')+' = <b>'+five+' zero'+(five===1?'':'s')+'</b>');
    if(n>0)st('Approximation de Stirling','Une forme fermée qui suit n! avec une faible erreur relative.','n! ≈ √(2πn)(n/e)ⁿ ≈ '+(lnS/Math.LN10<15?esc(M.fmt(Math.exp(lnS),2)):'10^'+(lnS/Math.LN10).toFixed(4))+'  (error '+(eS*100).toFixed(4)+' %)<br>Ramanujan : erreur <b>'+(eR*100).toExponential(2)+'%</b>');
  }else{
    var ex=m==='s2'?'Pour n impair, n!! = n!/(2^((n−1)/2)·((n−1)/2)!) ; pour n pair, n!! = 2^(n/2)·(n/2)!.':'Multipliez un nombre sur k en descendant depuis n tant que le facteur est supérieur à 1.';
    tiles([['Chiffres',String(digits),'longueur de la valeur exacte'],['Scientifique',sci(res),'mantisse × puissance de 10'],['n!  à titre de comparaison',show(fact(n)),'factorielle ordinaire'],['Rapport n! ÷ résultat',n>0?M.fmt(Number(fact(n)*1000000n/res)/1000000,6):'—','de combien n! est plus grand']]);
    st('Multipliez un nombre sur '+(mult===2?'second':mult+'th')+' number','De n vers le bas tant que le facteur dépasse 1.',terms.join(' × ')+ell+' = <b>'+esc(show(res))+'</b>');
    st('Lien avec la factorielle ordinaire','',esc(ex));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Valeur exacte de '+label+'.');C.text('stepsTag',label);
  last='Factorielle — calculatepilot.com/math/factorial-calculator.html\n'+label+' = '+s;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('n').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'fcCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-n]');if(!b)return;C.set('n',b.getAttribute('data-n'));fire();});
  $('copyBtn').addEventListener('click',function(){if(exact)copy(exact,'copyTxt','Copier la valeur exacte');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
