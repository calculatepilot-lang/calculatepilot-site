/* Polynomial calculator — CalculatePilot (Stitch redesign).
   Division: schoolbook coefficient algorithm (low-to-high internal form), P = Q·quotient + remainder.
   Synthetic division (Ruffini) shown only for monic linear divisors x − c.
   Roots: rational-root theorem peeling (exact synthetic division) then Durand–Kerner on the remainder for
   irrational/complex roots. Horner's scheme for evaluation. Arithmetic: coefficient-wise add/sub, convolution for ×. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc;

/* ---------- parsing & formatting (arrays are HIGH-to-LOW, index 0 = leading term) ---------- */
function trimHL(a){var i=0;while(i<a.length-1&&Math.abs(a[i])<1e-11)i++;return a.slice(i);}
function toLH(a){return a.slice().reverse();}
function toHL(a){return a.slice().reverse();}

function parsePoly(raw){
  var s=String(raw||'').trim();
  if(!s)throw 'Saisissez un polynôme.';
  s=s.replace(/[−–—]/g,'-').replace(/\s+/g,'');
  s=s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,function(c){return {'⁰':'^0','¹':'^1','²':'^2','³':'^3','⁴':'^4','⁵':'^5','⁶':'^6','⁷':'^7','⁸':'^8','⁹':'^9'}[c];});
  s=s.replace(/\*/g,'');
  if(!/^[0-9a-zA-Z.^+\-]+$/.test(s))throw 'Caractère non reconnu dans « '+raw+' ». Utilisez des termes comme 3x^2 - 5x + 2.';
  if(s[0]!=='+'&&s[0]!=='-')s='+'+s;
  var terms=s.match(/[+-][^+-]+/g);
  if(!terms)throw 'Impossible d\'analyser « '+raw+'".';
  var map={},maxDeg=0;
  terms.forEach(function(t){
    var sign=t[0]==='-'?-1:1,body=t.slice(1);
    var m=body.match(/^(\d+\.?\d*|\.\d+)?(x(\^(\d{1,2}))?)?$/i);
    if(!m||body==='')throw 'Impossible d\'analyser le terme « '+t+' ». Utilisez une seule variable x, comme 3x^2.';
    var hasX=!!m[2],pow=hasX?(m[4]!==undefined?parseInt(m[4],10):1):0;
    if(pow>12)throw 'Le degré est limité à 12 (trouvé x^'+pow+').';
    var coeff=m[1]===undefined?1:parseFloat(m[1]);
    if(!isFinite(coeff))throw 'Impossible d\'analyser le coefficient dans « '+t+'".';
    coeff*=sign;
    map[pow]=(map[pow]||0)+coeff;
    if(pow>maxDeg)maxDeg=pow;
  });
  var arr=new Array(maxDeg+1).fill(0);
  Object.keys(map).forEach(function(k){arr[maxDeg-(+k)]=map[k];});
  return trimHL(arr);
}

function fmtNum(x){
  if(Math.abs(x)<1e-11)return '0';
  if(Math.abs(x-Math.round(x))<1e-9)return String(Math.round(x));
  var s=x.toFixed(6).replace(/0+$/,'').replace(/[.,]$/,'');
  return s;
}
function polyStr(aHL){
  var a=trimHL(aHL.slice()),deg=a.length-1,s='';
  for(var i=0;i<a.length;i++){
    var c=a[i],p=deg-i;
    if(Math.abs(c)<1e-11)continue;
    var neg=c<0,ac=Math.abs(c);
    var coeffStr=(Math.abs(ac-1)<1e-11&&p!==0)?'':fmtNum(ac);
    var xpart=p===0?'':(p===1?'x':'x<sup>'+p+'</sup>');
    var term=coeffStr+xpart;
    s+=(s===''?(neg?'−':''):(neg?' − ':' + '))+term;
  }
  return s||'0';
}
function degOf(aHL){return trimHL(aHL).length-1;}

/* ---------- arithmetic (low-to-high helpers) ---------- */
function hornerEval(aHL,x){var acc=aHL[0];for(var i=1;i<aHL.length;i++)acc=acc*x+aHL[i];return acc;}
function derivative(aHL){var a=trimHL(aHL);var n=a.length-1;if(n<1)return [0];var out=[];for(var i=0;i<n;i++)out.push(a[i]*(n-i));return trimHL(out);}
function addPoly(aHL,bHL,sign){
  var n=Math.max(aHL.length,bHL.length),out=new Array(n).fill(0);
  for(var i=0;i<aHL.length;i++)out[n-aHL.length+i]+=aHL[i];
  for(i=0;i<bHL.length;i++)out[n-bHL.length+i]+=sign*bHL[i];
  return trimHL(out);
}
function mulPoly(aHL,bHL){
  var out=new Array(aHL.length+bHL.length-1).fill(0);
  for(var i=0;i<aHL.length;i++)for(var j=0;j<bHL.length;j++)out[i+j]+=aHL[i]*bHL[j];
  return trimHL(out);
}
function polyDivLong(pHL,qHL){
  var p=trimHL(pHL.slice()),q=trimHL(qHL.slice());
  if(q.length===1&&Math.abs(q[0])<1e-11)throw 'Impossible de diviser par le polynôme nul.';
  var dp=p.length-1,dq=q.length-1;
  if(dp<dq)return {quotient:[0],remainder:p};
  var work=p.slice(),quotient=new Array(dp-dq+1).fill(0);
  for(var i=0;i<=dp-dq;i++){
    var coeff=work[i]/q[0];
    quotient[i]=coeff;
    for(var j=0;j<q.length;j++)work[i+j]-=coeff*q[j];
  }
  return {quotient:trimHL(quotient),remainder:trimHL(work.slice(dp-dq+1))};
}
function syntheticDiv(pHL,c){
  var n=pHL.length,q=new Array(n-1),acc=pHL[0];
  q[0]=acc;
  for(var i=1;i<n-1;i++){acc=pHL[i]+acc*c;q[i]=acc;}
  var rem=n>1?pHL[n-1]+acc*c:pHL[0];
  return {quotient:n>1?trimHL(q):[0],remainder:rem};
}

/* ---------- complex numbers & Durand–Kerner root finder ---------- */
function cx(re,im){return {re:re,im:im||0};}
function cadd(a,b){return cx(a.re+b.re,a.im+b.im);}
function csub(a,b){return cx(a.re-b.re,a.im-b.im);}
function cmul(a,b){return cx(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);}
function cdiv(a,b){var d=b.re*b.re+b.im*b.im||1e-300;return cx((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);}
function cabs(a){return Math.sqrt(a.re*a.re+a.im*a.im);}
function evalC(aHL,x){var acc=cx(aHL[0],0);for(var i=1;i<aHL.length;i++)acc=cadd(cmul(acc,x),cx(aHL[i],0));return acc;}
function durandKerner(aHL){
  var mono=aHL.map(function(v){return v/aHL[0];}),n=mono.length-1;
  if(n<1)return [];
  if(n===1)return [cx(-mono[1],0)];
  var roots=[],seed=cx(1,0),step=cx(0.4,0.9);
  for(var k=0;k<n;k++){roots.push(seed);seed=cmul(seed,step);}
  for(var iter=0;iter<300;iter++){
    var maxD=0,next=roots.slice();
    for(k=0;k<n;k++){
      var num=evalC(mono,roots[k]),den=cx(1,0);
      for(var j=0;j<n;j++)if(j!==k)den=cmul(den,csub(roots[k],roots[j]));
      var delta=cdiv(num,den);
      next[k]=csub(roots[k],delta);
      maxD=Math.max(maxD,cabs(delta));
    }
    roots=next;
    if(maxD<1e-13)break;
  }
  return roots;
}

/* ---------- rational-root peeling ---------- */
function divisorsOf(n){n=Math.round(Math.abs(n));if(n===0)return [1];var d=[];for(var i=1;i<=n;i++)if(n%i===0)d.push(i);return d;}
function isIntArr(a){return a.every(function(c){return Math.abs(c-Math.round(c))<1e-7;});}
function ratCandidates(aHL){
  var n=aHL.length,a0=Math.round(aHL[n-1]),an=Math.round(aHL[0]);
  var ps=divisorsOf(a0||1),qs=divisorsOf(an||1),set={};
  ps.forEach(function(p){qs.forEach(function(q){set[p/q]=1;set[-p/q]=1;});});
  return Object.keys(set).map(Number).sort(function(x,y){return Math.abs(x)-Math.abs(y);});
}
function peelRational(aHL){
  var work=trimHL(aHL.slice()),found=[];
  while(work.length>1&&Math.abs(work[work.length-1])<1e-9){found.push(0);work=work.slice(0,work.length-1);}
  if(work.length<=1)return {roots:found,remaining:work};
  if(!isIntArr(work))return {roots:found,remaining:work};
  var guard=0;
  while(work.length>2&&guard<80){
    guard++;
    var cands=ratCandidates(work),hit=null;
    for(var i=0;i<cands.length;i++){
      var c=cands[i],val=hornerEval(work,c);
      if(Math.abs(val)<1e-6){hit=c;break;}
    }
    if(hit===null)break;
    var sd=syntheticDiv(work,hit);
    if(Math.abs(sd.remainder)>1e-4)break;
    found.push(hit);work=trimHL(sd.quotient);
  }
  return {roots:found,remaining:work};
}
function findAllRoots(aHL){
  var mono=aHL.slice(),peeled=peelRational(mono);
  var roots=peeled.roots.map(function(r){return cx(r,0);});
  var rem=trimHL(peeled.remaining);
  if(rem.length-1===1)roots.push(cx(-rem[1]/rem[0],0));
  else if(rem.length-1>=2)durandKerner(rem).forEach(function(r){roots.push(r);});
  roots.forEach(function(r){if(Math.abs(r.im)<1e-6*Math.max(1,Math.abs(r.re)))r.im=0;var rr=Math.round(r.re);if(Math.abs(r.re-rr)<1e-6)r.re=rr;var ri=Math.round(r.im);if(Math.abs(r.im-ri)<1e-6)r.im=ri;});
  roots.sort(function(a,b){return a.re-b.re||a.im-b.im;});
  return roots;
}
function groupRoots(roots){
  var groups=[];
  roots.forEach(function(r){
    var g=groups.find(function(x){return Math.abs(x.r.re-r.re)<1e-5&&Math.abs(x.r.im-r.im)<1e-5;});
    if(g)g.m++;else groups.push({r:r,m:1});
  });
  return groups;
}

/* ---------- viz ---------- */
function plot(aHL,realRoots){
  var W=760,H=320,pad=40;
  var xs=realRoots.length?realRoots.slice():[0];
  var lo=Math.min.apply(null,xs.concat([0]))-2,hi=Math.max.apply(null,xs.concat([0]))+2;
  if(hi-lo<4){var mid=(hi+lo)/2;lo=mid-2;hi=mid+2;}
  var N=240,pts=[],ys=[];
  for(var i=0;i<=N;i++){var x=lo+(hi-lo)*i/N,y=hornerEval(aHL,x);ys.push(y);}
  var finite=ys.filter(isFinite);
  var ymax=Math.max.apply(null,finite),ymin=Math.min.apply(null,finite);
  if(!isFinite(ymax)||!isFinite(ymin)||ymax-ymin<1e-6){ymax=1;ymin=-1;}
  var cap=Math.max(Math.abs(ymax),Math.abs(ymin));cap=Math.min(cap,Math.max(10,cap));
  ymax=Math.min(ymax,cap);ymin=Math.max(ymin,-cap);
  if(ymax<=ymin){ymax=ymin+2;}
  var sy=(ymax-ymin)||2;ymin-=sy*0.12;ymax+=sy*0.12;
  var kx=(W-2*pad)/(hi-lo),ky=(H-2*pad)/(ymax-ymin);
  var X=function(x){return pad+(x-lo)*kx;},Y=function(y){return H-pad-(Math.max(ymin,Math.min(ymax,y))-ymin)*ky;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  if(0>=ymin&&0<=ymax)s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  if(0>=lo&&0<=hi)s+='<line x1="'+X(0).toFixed(1)+'" x2="'+X(0).toFixed(1)+'" y1="'+pad+'" y2="'+(H-pad)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  var pp=[];for(i=0;i<=N;i++){var xx=lo+(hi-lo)*i/N;pp.push(X(xx).toFixed(1)+','+Y(ys[i]).toFixed(1));}
  s+='<polyline points="'+pp.join(' ')+'" fill="none" stroke="var(--sx-primary)" stroke-width="2.6"/>';
  realRoots.forEach(function(r){s+='<circle cx="'+X(r).toFixed(1)+'" cy="'+Y(0).toFixed(1)+'" r="5.5" fill="#059669"/><text class="ax" x="'+(X(r)+7).toFixed(1)+'" y="'+(Y(0)-10).toFixed(1)+'" style="font-weight:700;fill:var(--sx-on)">'+esc(fmtNum(r))+'</text>';});
  var y0=hornerEval(aHL,0);
  if(0>=lo&&0<=hi&&isFinite(y0))s+='<circle cx="'+X(0).toFixed(1)+'" cy="'+Y(y0).toFixed(1)+'" r="5" fill="var(--sx-primary)"/><text class="ax" x="'+(X(0)+7).toFixed(1)+'" y="'+(Y(y0)-8).toFixed(1)+'" style="fill:var(--sx-on)">(0, '+esc(fmtNum(y0))+')</text>';
  $('viz').innerHTML=s+'</svg>';
}

/* ---------- UI plumbing ---------- */
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){
  $('err').hidden=false;C.text('errT',msg);
  C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');
  C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';
  $('synCard').hidden=true;C.text('vizTag','—');
}
var last='';

function updateDeg(){
  try{var p=parsePoly($('pp').value);C.text('pDeg','degree '+degOf(p));}catch(e){C.text('pDeg','—');}
  var m=$('mode').value;
  if(m==='s1'||m==='s2'||m==='s3'){try{var q=parsePoly($('qq').value);C.text('qDeg','degree '+degOf(q));}catch(e){C.text('qDeg','—');}}
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fQ').hidden=(m==='s4');$('fX').hidden=(m!=='s4');$('opWrap').hidden=(m!=='s3');$('synCard').hidden=true;
  var labels={s1:'Division polynomiale P(x) ÷ Q(x)',s2:'Racines &amp; factorisation de P(x)',s3:'Arithmétique des polynômes : P et Q',s4:'Évaluer P(x) avec la méthode de Horner'};
  C.html('formH',labels[m]);
  C.text('qL',m==='s1'?'Diviseur Q(x)':m==='s3'?'Second polynôme Q(x)':'Diviseur Q(x)');
  updateDeg();
  var P;
  try{P=parsePoly($('pp').value);}catch(e){return fail(String(e));}
  if(m==='s4'){
    var xv=parseFloat($('px').value);
    if(!isFinite(xv))return fail('Saisissez un nombre en lequel évaluer.');
    var val=P[0],steps=[val],h1='';
    for(var i=1;i<P.length;i++){val=val*xv+P[i];steps.push(val);}
    C.text('heroLbl','P('+fmtNum(xv)+')');tg.textContent='Méthode de Horner';
    C.text('resultValue',fmtNum(val));C.text('ex1L','Théorème du reste');C.text('ex1','P('+fmtNum(xv)+') est le reste de P(x) ÷ (x − '+fmtNum(xv)+')');
    C.text('ex2L','Racine ?');C.text('ex2',Math.abs(val)<1e-7?'Oui — x = '+fmtNum(xv)+' est une racine':'Non — reste ≠ 0');
    C.text('interp','Évalué par multiplications imbriquées : chaque valeur courante est multipliée par x puis le coefficient suivant est ajouté.');
    C.html('fxNow','P(x) = '+polyStr(P)+',  x = '+fmtNum(xv));
    var rowsT=[];for(i=0;i<P.length;i++)rowsT.push(['Étape '+i,fmtNum(P[i])+(i>0?' + '+fmtNum(xv)+'·('+fmtNum(steps[i-1])+')':'')+' = '+fmtNum(steps[i]),i===P.length-1?'c\'est P('+fmtNum(xv)+')':'valeur courante']);
    tiles(rowsT);
    plot(P,[]);C.text('vizTag','P('+fmtNum(xv)+') = '+fmtNum(val));
    var n=0,hh='';function st1(t,d,e){n++;hh+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Écrire les coefficients dans l\'ordre','Du terme de plus haut degré jusqu\'à la constante, y compris les coefficients nuls.',P.map(fmtNum).join(', '));
    st1('Abaisser le coefficient dominant','Cela initialise le total courant.','v<sub>0</sub> = '+fmtNum(P[0]));
    for(i=1;i<P.length;i++)st1('Multiplier par x et ajouter le coefficient suivant','v'+'<sub>'+i+'</sub> = v<sub>'+(i-1)+'</sub>·x + a<sub>'+i+'</sub>','v<sub>'+i+'</sub> = '+fmtNum(steps[i-1])+' × '+fmtNum(xv)+' + '+fmtNum(P[i])+' = <b>'+fmtNum(steps[i])+'</b>');
    $('steps').innerHTML=hh;C.html('stepsIntro','Évaluation de P('+fmtNum(xv)+') pour P(x) = '+polyStr(P)+'.');C.text('stepsTag','Horner, '+(P.length-1)+' step'+(P.length-1===1?'':'s'));
    last='Polynôme — calculatepilot.com/math/polynomial-calculator.html\nP(x) = '+polyStr(P).replace(/<[^>]+>/g,'')+'\nP('+xv+') = '+val;
    return;
  }
  var Q=null;
  if(m==='s1'||m==='s3'){
    try{Q=parsePoly($('qq').value);}catch(e){return fail(String(e));}
  }
  if(m==='s1'){
    var isMonicLinear=Q.length===2&&Math.abs(Math.abs(Q[0])-1)<1e-11;
    var d=polyDivLong(P,Q);
    C.text('heroLbl','Quotient Q(x)');C.html('resultValue',polyStr(d.quotient));
    tg.textContent='deg '+degOf(P)+' ÷ deg '+degOf(Q);
    C.text('ex1L','Reste R(x)');C.html('ex1',polyStr(d.remainder));
    var checkPoly=addPoly(mulPoly(Q,d.quotient),d.remainder,1);
    C.text('ex2L','Vérification : Q(x)·quotient + R(x)');C.html('ex2',polyStr(checkPoly)+' ✓ correspond à P(x)');
    C.html('interp','P(x) = Q(x) · ['+polyStr(d.quotient)+'] + ['+polyStr(d.remainder)+'], avec deg R < deg Q.');
    C.html('fxNow','['+polyStr(P)+'] ÷ ['+polyStr(Q)+']');
    var remIsZero=degOf(trimHL(d.remainder))===0&&Math.abs(d.remainder[0])<1e-9;
    tiles([
      ['Degré du quotient',String(degOf(d.quotient)),'deg P − deg Q'],
      ['Reste',polyStr(d.remainder),remIsZero?'Q divise exactement P':'n\'est pas un facteur'],
      ['Division exacte ?',remIsZero?'Oui':'No',remIsZero?'facteur de type (x − r) trouvé':'reste non nul'],
      ['Degré du diviseur',String(degOf(Q)),Q.length===2?'linéaire — la division synthétique s\'applique':'utilisez la division euclidienne']
    ]);
    plot(P,[]);C.text('vizTag','deg '+degOf(P));
    var n2=0,h2='';function st2(t,dd,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Diviser les termes dominants','Comparez le terme dominant du polynôme restant au terme dominant de Q(x).','deg P = '+degOf(P)+', deg Q = '+degOf(Q));
    st2('Division euclidienne (algorithme scolaire)','Diviser, multiplier, soustraire, abaisser, en répétant jusqu\'à ce que le degré restant soit inférieur à deg Q.','quotient = <b>'+polyStr(d.quotient)+'</b><br>reste = <b>'+polyStr(d.remainder)+'</b>');
    st2('Vérifier le résultat','Multipliez le quotient par Q(x) et ajoutez le reste ; vous devez retrouver P(x).',polyStr(mulPoly(Q,d.quotient))+' + ('+polyStr(d.remainder)+') = <b>'+polyStr(checkPoly)+'</b>');
    if(isMonicLinear){
      var c=-Q[1]/Q[0];
      var sd=syntheticDiv(P,c);
      st2('Vérification par division synthétique','Pour un diviseur linéaire unitaire x − c, la règle de Ruffini donne directement le même quotient.','c = '+fmtNum(c)+' → quotient '+polyStr(sd.quotient)+', reste '+fmtNum(sd.remainder));
      $('synCard').hidden=false;C.text('synTag','c = '+fmtNum(c));
      var head='<thead><tr><th></th>';P.forEach(function(v,i){head+='<th class="mono">'+fmtNum(v)+'</th>';});head+='</tr></thead>';
      var bring=P[0],rowVals=[bring],mulRow=[''];
      for(i=1;i<P.length;i++){var mu=bring*c;mulRow.push(fmtNum(mu));bring=P[i]+mu;rowVals.push(bring);}
      var body='<tbody><tr><td>× '+fmtNum(c)+'</td><td></td>'+mulRow.slice(1).map(function(v){return '<td class="mono">'+v+'</td>';}).join('')+'</tr><tr class="hl"><td>Résultat</td>'+rowVals.map(function(v){return '<td class="mono">'+fmtNum(v)+'</td>';}).join('')+'</tr></tbody>';
      $('synTbl').innerHTML=head+body;
    }
    $('steps').innerHTML=h2;C.html('stepsIntro','Division de P(x) = '+polyStr(P)+' par Q(x) = '+polyStr(Q)+'.');C.text('stepsTag',isMonicLinear?'division synthétique':'division euclidienne');
    last='Division de polynômes — calculatepilot.com/math/polynomial-calculator.html\nP(x) = '+polyStr(P).replace(/<[^>]+>/g,'')+'\nQ(x) = '+polyStr(Q).replace(/<[^>]+>/g,'')+'\nquotient = '+polyStr(d.quotient).replace(/<[^>]+>/g,'')+'\nreste = '+polyStr(d.remainder).replace(/<[^>]+>/g,'');
    return;
  }
  if(m==='s3'){
    var op=$('op').value,R;
    if(op==='add'){R=addPoly(P,Q,1);}else if(op==='sub'){R=addPoly(P,Q,-1);}else{R=mulPoly(P,Q);}
    var opLabel={add:'P(x) + Q(x)',sub:'P(x) − Q(x)',mul:'P(x) × Q(x)'}[op];
    C.text('heroLbl',opLabel);C.html('resultValue',polyStr(R));tg.textContent='degree '+degOf(R);
    C.text('ex1L','Degré du résultat');C.text('ex1',String(degOf(R)));
    C.text('ex2L','Coefficient dominant');C.text('ex2',fmtNum(trimHL(R)[0]));
    C.text('interp',op==='mul'?'Chaque terme de P est multiplié par chaque terme de Q, et les puissances de x identiques sont regroupées.':'Les coefficients des puissances de x correspondantes sont combinés terme à terme.');
    C.html('fxNow','['+polyStr(P)+'] '+(op==='add'?'+':op==='sub'?'−':'×')+' ['+polyStr(Q)+'] = '+polyStr(R));
    tiles([['deg P',String(degOf(P)),''],['deg Q',String(degOf(Q)),''],['deg résultat',String(degOf(R)),op==='mul'?'deg P + deg Q':'max(deg P, deg Q)'],['Terme constant',fmtNum(trimHL(R)[trimHL(R).length-1]),'valeur du résultat en x = 0']]);
    plot(R,[]);C.text('vizTag',opLabel);
    var n3=0,h3='';function st3(t,dd,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Aligner par puissance de x','Écrivez les deux polynômes avec le même ensemble de puissances, en utilisant 0 pour tout terme manquant.','P(x) = '+polyStr(P)+'<br>Q(x) = '+polyStr(Q));
    if(op==='mul')st3('Multiplier chaque paire de termes','Faites le produit de convolution des coefficients : le coefficient du résultat en x<sup>k</sup> est la somme de tous les a<sub>i</sub>·b<sub>j</sub> avec i + j = k.','P(x) × Q(x) = <b>'+polyStr(R)+'</b>');
    else st3('Combiner les coefficients puissance par puissance',op==='add'?'Additionnez les coefficients correspondants.':'Soustrayez les coefficients de Q de ceux de P.','résultat = <b>'+polyStr(R)+'</b>');
    $('steps').innerHTML=h3;C.text('stepsIntro',opLabel+'.');C.text('stepsTag',op);
    last='Arithmétique des polynômes — calculatepilot.com/math/polynomial-calculator.html\nP(x) = '+polyStr(P).replace(/<[^>]+>/g,'')+'\nQ(x) = '+polyStr(Q).replace(/<[^>]+>/g,'')+'\n'+opLabel.replace(/<[^>]+>/g,'')+' = '+polyStr(R).replace(/<[^>]+>/g,'');
    return;
  }
  /* s2: roots & factorization */
  var deg=degOf(P);
  if(deg<1)return fail('Saisissez un polynôme non constant (de degré 1 ou plus) pour trouver ses racines.');
  var roots=findAllRoots(P),groups=groupRoots(roots);
  var realGroups=groups.filter(function(g){return g.r.im===0;});
  var cplxGroups=groups.filter(function(g){return g.r.im>0;});
  var rootStrs=groups.map(function(g){var lbl=g.r.im===0?fmtNum(g.r.re):(fmtNum(g.r.re)+(g.r.im>0?' + ':' − ')+fmtNum(Math.abs(g.r.im))+'i');return lbl+(g.m>1?' (×'+g.m+')':'');});
  C.text('heroLbl','Racines de P(x) = 0');C.text('resultValue',rootStrs.join(',  ')||'none found');
  tg.textContent=realGroups.length+' réelles, '+(cplxGroups.length*2)+' complex';
  var factParts=[];
  var lead=P[0];
  realGroups.forEach(function(g){var t='(x '+(g.r.re<0?'+ ':'− ')+fmtNum(Math.abs(g.r.re))+')';if(g.m>1)t+='<sup>'+g.m+'</sup>';factParts.push(t);});
  cplxGroups.forEach(function(g){var b=-2*g.r.re,cc=g.r.re*g.r.re+g.r.im*g.r.im;var t='(x<sup>2</sup> '+(b<0?'− '+fmtNum(-b):'+ '+fmtNum(b))+'x '+(cc<0?'− ':'+ ')+fmtNum(Math.abs(cc))+')';if(g.m>1)t+='<sup>'+g.m+'</sup>';factParts.push(t);});
  var factStr=(Math.abs(lead-1)>1e-9?fmtNum(lead)+' ':'')+(factParts.join('') || '1');
  C.text('ex1L','Forme factorisée');C.html('ex1',factStr);
  C.text('ex2L','Dérivée P′(x)');C.html('ex2',polyStr(derivative(P)));
  C.text('interp','Obtenues grâce au théorème des racines rationnelles pour les facteurs exacts, puis par l\'itération de Durand–Kerner pour les racines irrationnelles ou complexes restantes.');
  C.html('fxNow','P(x) = '+polyStr(P)+' = 0');
  var y0=hornerEval(P,0);
  var dP=derivative(P),critX=[];
  if(degOf(dP)>=1){var cRoots=degOf(dP)===1?[cx(-dP[1]/dP[0],0)]:durandKerner(dP);cRoots.forEach(function(r){if(Math.abs(r.im)<1e-6)critX.push(r.re);});}
  tiles([
    ['y-intercept','(0, '+fmtNum(y0)+')','valeur de P en x = 0'],
    ['Racines réelles',String(realGroups.reduce(function(s,g){return s+g.m;},0)),'croisent / touchent l\'axe des x'],
    ['Racines complexes',String(cplxGroups.length*2),'par paires conjuguées'],
    ['Dérivée P′(x)',polyStr(dP),'pente de P(x)'],
    ['Points critiques',critX.length?critX.map(fmtNum).join(', '):'aucun (réel)','où P′(x) = 0'],
    ['Somme de toutes les racines',fmtNum(-P[1]/P[0]),'−a<sub>n-1</sub> ÷ a<sub>n</sub> (Viète)']
  ]);
  var realXs=[];realGroups.forEach(function(g){for(var i=0;i<g.m;i++)realXs.push(g.r.re);});
  plot(P,realGroups.map(function(g){return g.r.re;}));C.text('vizTag',realGroups.length+' racine réelle'+(realGroups.length===1?'':'s'));
  var n4=0,h4='';function st4(t,dd,e){n4++;h4+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st4('Essayer le théorème des racines rationnelles','Toute racine rationnelle p/q a p qui divise le terme constant et q qui divise le coefficient dominant.',peelRational(P).roots.length?'trouvées : '+peelRational(P).roots.map(fmtNum).join(', '):'aucune racine rationnelle trouvée');
  st4('Diviser par chaque racine rationnelle','La division synthétique réduit exactement le degré, avec un reste nul.','degré restant après réduction : '+degOf(peelRational(P).remaining));
  if(degOf(peelRational(P).remaining)>=1)st4('Résoudre numériquement ce qui reste','L\'itération de Durand–Kerner trouve en une fois toutes les racines restantes, réelles ou complexes.','racines restantes : '+durandKerner(peelRational(P).remaining).map(function(r){return r.im===0||Math.abs(r.im)<1e-6?fmtNum(r.re):fmtNum(r.re)+(r.im>0?'+':'')+fmtNum(r.im)+'i';}).join(', '));
  st4('Écrire la forme factorisée','Les racines réelles donnent des facteurs linéaires ; les paires de racines complexes conjuguées se combinent en un trinôme du second degré irréductible.',factStr);
  $('steps').innerHTML=h4;C.html('stepsIntro','Résolution de P(x) = 0 pour P(x) = '+polyStr(P)+'.');C.text('stepsTag','degree '+deg);
  last='Racines du polynôme — calculatepilot.com/math/polynomial-calculator.html\nP(x) = '+polyStr(P).replace(/<[^>]+>/g,'')+'\nroots: '+rootStrs.join(', ')+'\nfactored: '+factStr.replace(/<[^>]+>/g,'');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'plCalc',compute:compute});
  $('presets').addEventListener('click',function(e){
    var b=e.target.closest('button[data-m]');if(!b)return;
    C.set('mode',b.getAttribute('data-m'));
    C.set('pp',b.getAttribute('data-p'));
    if(b.hasAttribute('data-q'))C.set('qq',b.getAttribute('data-q'));
    if(b.hasAttribute('data-x'))C.set('px',b.getAttribute('data-x'));
    fire('pp');
  });
  $('swap').addEventListener('click',function(){var t=$('pp').value;C.set('pp',$('qq').value);C.set('qq',t);fire('pp');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
