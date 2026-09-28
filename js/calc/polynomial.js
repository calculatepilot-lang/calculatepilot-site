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
  if(!s)throw 'Enter a polynomial.';
  s=s.replace(/[−–—]/g,'-').replace(/\s+/g,'');
  s=s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,function(c){return {'⁰':'^0','¹':'^1','²':'^2','³':'^3','⁴':'^4','⁵':'^5','⁶':'^6','⁷':'^7','⁸':'^8','⁹':'^9'}[c];});
  s=s.replace(/\*/g,'');
  if(!/^[0-9a-zA-Z.^+\-]+$/.test(s))throw 'Unrecognised character in "'+raw+'". Use terms like 3x^2 - 5x + 2.';
  if(s[0]!=='+'&&s[0]!=='-')s='+'+s;
  var terms=s.match(/[+-][^+-]+/g);
  if(!terms)throw 'Could not parse "'+raw+'".';
  var map={},maxDeg=0;
  terms.forEach(function(t){
    var sign=t[0]==='-'?-1:1,body=t.slice(1);
    var m=body.match(/^(\d+\.?\d*|\.\d+)?(x(\^(\d{1,2}))?)?$/i);
    if(!m||body==='')throw 'Could not parse the term "'+t+'". Use a single variable x, like 3x^2.';
    var hasX=!!m[2],pow=hasX?(m[4]!==undefined?parseInt(m[4],10):1):0;
    if(pow>12)throw 'Degree is limited to 12 (found x^'+pow+').';
    var coeff=m[1]===undefined?1:parseFloat(m[1]);
    if(!isFinite(coeff))throw 'Could not parse the coefficient in "'+t+'".';
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
  var s=x.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
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
  if(q.length===1&&Math.abs(q[0])<1e-11)throw 'Cannot divide by the zero polynomial.';
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
  C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';
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
  var labels={s1:'Polynomial division P(x) ÷ Q(x)',s2:'Roots &amp; factorization of P(x)',s3:'Polynomial arithmetic: P and Q',s4:'Evaluate P(x) with Horner’s scheme'};
  C.html('formH',labels[m]);
  C.text('qL',m==='s1'?'Divisor Q(x)':m==='s3'?'Second polynomial Q(x)':'Divisor Q(x)');
  updateDeg();
  var P;
  try{P=parsePoly($('pp').value);}catch(e){return fail(String(e));}
  if(m==='s4'){
    var xv=parseFloat($('px').value);
    if(!isFinite(xv))return fail('Enter a number to evaluate at.');
    var val=P[0],steps=[val],h1='';
    for(var i=1;i<P.length;i++){val=val*xv+P[i];steps.push(val);}
    C.text('heroLbl','P('+fmtNum(xv)+')');tg.textContent='Horner’s scheme';
    C.text('resultValue',fmtNum(val));C.text('ex1L','Remainder theorem');C.text('ex1','P('+fmtNum(xv)+') is the remainder of P(x) ÷ (x − '+fmtNum(xv)+')');
    C.text('ex2L','Root?');C.text('ex2',Math.abs(val)<1e-7?'Yes — x = '+fmtNum(xv)+' is a root':'No — remainder ≠ 0');
    C.text('interp','Evaluated by nested multiplication: each running value is multiplied by x and the next coefficient added.');
    C.html('fxNow','P(x) = '+polyStr(P)+',  x = '+fmtNum(xv));
    var rowsT=[];for(i=0;i<P.length;i++)rowsT.push(['Step '+i,fmtNum(P[i])+(i>0?' + '+fmtNum(xv)+'·('+fmtNum(steps[i-1])+')':'')+' = '+fmtNum(steps[i]),i===P.length-1?'this is P('+fmtNum(xv)+')':'running value']);
    tiles(rowsT);
    plot(P,[]);C.text('vizTag','P('+fmtNum(xv)+') = '+fmtNum(val));
    var n=0,hh='';function st1(t,d,e){n++;hh+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Write the coefficients in order','From the leading term down to the constant, including any zero coefficients.',P.map(fmtNum).join(', '));
    st1('Bring down the leading coefficient','This starts the running total.','v<sub>0</sub> = '+fmtNum(P[0]));
    for(i=1;i<P.length;i++)st1('Multiply by x and add the next coefficient','v'+'<sub>'+i+'</sub> = v<sub>'+(i-1)+'</sub>·x + a<sub>'+i+'</sub>','v<sub>'+i+'</sub> = '+fmtNum(steps[i-1])+' × '+fmtNum(xv)+' + '+fmtNum(P[i])+' = <b>'+fmtNum(steps[i])+'</b>');
    $('steps').innerHTML=hh;C.html('stepsIntro','Evaluating P('+fmtNum(xv)+') for P(x) = '+polyStr(P)+'.');C.text('stepsTag','Horner, '+(P.length-1)+' step'+(P.length-1===1?'':'s'));
    last='Polynomial — calculatepilot.com/math/polynomial-calculator.html\nP(x) = '+polyStr(P).replace(/<[^>]+>/g,'')+'\nP('+xv+') = '+val;
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
    C.text('ex1L','Remainder R(x)');C.html('ex1',polyStr(d.remainder));
    var checkPoly=addPoly(mulPoly(Q,d.quotient),d.remainder,1);
    C.text('ex2L','Check: Q(x)·quotient + R(x)');C.html('ex2',polyStr(checkPoly)+' ✓ matches P(x)');
    C.html('interp','P(x) = Q(x) · ['+polyStr(d.quotient)+'] + ['+polyStr(d.remainder)+'], with deg R < deg Q.');
    C.html('fxNow','['+polyStr(P)+'] ÷ ['+polyStr(Q)+']');
    var remIsZero=degOf(trimHL(d.remainder))===0&&Math.abs(d.remainder[0])<1e-9;
    tiles([
      ['Quotient degree',String(degOf(d.quotient)),'deg P − deg Q'],
      ['Remainder',polyStr(d.remainder),remIsZero?'Q divides P exactly':'not a factor'],
      ['Exact division?',remIsZero?'Yes':'No',remIsZero?'(x − r) style factor found':'nonzero remainder'],
      ['Divisor degree',String(degOf(Q)),Q.length===2?'linear — synthetic division applies':'use long division']
    ]);
    plot(P,[]);C.text('vizTag','deg '+degOf(P));
    var n2=0,h2='';function st2(t,dd,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Divide the leading terms','Compare the leading term of the remaining polynomial to the leading term of Q(x).','deg P = '+degOf(P)+', deg Q = '+degOf(Q));
    st2('Long division (schoolbook algorithm)','Repeatedly divide, multiply, subtract, bring down — until the remaining degree is below deg Q.','quotient = <b>'+polyStr(d.quotient)+'</b><br>remainder = <b>'+polyStr(d.remainder)+'</b>');
    st2('Check the result','Multiply the quotient back by Q(x) and add the remainder; it must reproduce P(x).',polyStr(mulPoly(Q,d.quotient))+' + ('+polyStr(d.remainder)+') = <b>'+polyStr(checkPoly)+'</b>');
    if(isMonicLinear){
      var c=-Q[1]/Q[0];
      var sd=syntheticDiv(P,c);
      st2('Synthetic division cross-check','For a monic linear divisor x − c, Ruffini’s rule gives the same quotient directly.','c = '+fmtNum(c)+' → quotient '+polyStr(sd.quotient)+', remainder '+fmtNum(sd.remainder));
      $('synCard').hidden=false;C.text('synTag','c = '+fmtNum(c));
      var head='<thead><tr><th></th>';P.forEach(function(v,i){head+='<th class="mono">'+fmtNum(v)+'</th>';});head+='</tr></thead>';
      var bring=P[0],rowVals=[bring],mulRow=[''];
      for(i=1;i<P.length;i++){var mu=bring*c;mulRow.push(fmtNum(mu));bring=P[i]+mu;rowVals.push(bring);}
      var body='<tbody><tr><td>× '+fmtNum(c)+'</td><td></td>'+mulRow.slice(1).map(function(v){return '<td class="mono">'+v+'</td>';}).join('')+'</tr><tr class="hl"><td>Result</td>'+rowVals.map(function(v){return '<td class="mono">'+fmtNum(v)+'</td>';}).join('')+'</tr></tbody>';
      $('synTbl').innerHTML=head+body;
    }
    $('steps').innerHTML=h2;C.html('stepsIntro','Dividing P(x) = '+polyStr(P)+' by Q(x) = '+polyStr(Q)+'.');C.text('stepsTag',isMonicLinear?'synthetic division':'long division');
    last='Polynomial division — calculatepilot.com/math/polynomial-calculator.html\nP(x) = '+polyStr(P).replace(/<[^>]+>/g,'')+'\nQ(x) = '+polyStr(Q).replace(/<[^>]+>/g,'')+'\nquotient = '+polyStr(d.quotient).replace(/<[^>]+>/g,'')+'\nremainder = '+polyStr(d.remainder).replace(/<[^>]+>/g,'');
    return;
  }
  if(m==='s3'){
    var op=$('op').value,R;
    if(op==='add'){R=addPoly(P,Q,1);}else if(op==='sub'){R=addPoly(P,Q,-1);}else{R=mulPoly(P,Q);}
    var opLabel={add:'P(x) + Q(x)',sub:'P(x) − Q(x)',mul:'P(x) × Q(x)'}[op];
    C.text('heroLbl',opLabel);C.html('resultValue',polyStr(R));tg.textContent='degree '+degOf(R);
    C.text('ex1L','Result degree');C.text('ex1',String(degOf(R)));
    C.text('ex2L','Leading coefficient');C.text('ex2',fmtNum(trimHL(R)[0]));
    C.text('interp',op==='mul'?'Every term of P is multiplied by every term of Q, and like powers of x are combined.':'Coefficients of matching powers of x are combined term by term.');
    C.html('fxNow','['+polyStr(P)+'] '+(op==='add'?'+':op==='sub'?'−':'×')+' ['+polyStr(Q)+'] = '+polyStr(R));
    tiles([['deg P',String(degOf(P)),''],['deg Q',String(degOf(Q)),''],['deg result',String(degOf(R)),op==='mul'?'deg P + deg Q':'max(deg P, deg Q)'],['Constant term',fmtNum(trimHL(R)[trimHL(R).length-1]),'value of the result at x = 0']]);
    plot(R,[]);C.text('vizTag',opLabel);
    var n3=0,h3='';function st3(t,dd,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Align by power of x','Write both polynomials with the same set of powers, using 0 for any missing term.','P(x) = '+polyStr(P)+'<br>Q(x) = '+polyStr(Q));
    if(op==='mul')st3('Multiply every pair of terms','Convolve the coefficients: the result’s coefficient at x<sup>k</sup> sums all a<sub>i</sub>·b<sub>j</sub> with i + j = k.','P(x) × Q(x) = <b>'+polyStr(R)+'</b>');
    else st3('Combine coefficients power by power',op==='add'?'Add matching coefficients.':'Subtract Q’s coefficients from P’s.','result = <b>'+polyStr(R)+'</b>');
    $('steps').innerHTML=h3;C.text('stepsIntro',opLabel+'.');C.text('stepsTag',op);
    last='Polynomial arithmetic — calculatepilot.com/math/polynomial-calculator.html\nP(x) = '+polyStr(P).replace(/<[^>]+>/g,'')+'\nQ(x) = '+polyStr(Q).replace(/<[^>]+>/g,'')+'\n'+opLabel.replace(/<[^>]+>/g,'')+' = '+polyStr(R).replace(/<[^>]+>/g,'');
    return;
  }
  /* s2: roots & factorization */
  var deg=degOf(P);
  if(deg<1)return fail('Enter a non-constant polynomial (degree 1 or higher) to find roots.');
  var roots=findAllRoots(P),groups=groupRoots(roots);
  var realGroups=groups.filter(function(g){return g.r.im===0;});
  var cplxGroups=groups.filter(function(g){return g.r.im>0;});
  var rootStrs=groups.map(function(g){var lbl=g.r.im===0?fmtNum(g.r.re):(fmtNum(g.r.re)+(g.r.im>0?' + ':' − ')+fmtNum(Math.abs(g.r.im))+'i');return lbl+(g.m>1?' (×'+g.m+')':'');});
  C.text('heroLbl','Roots of P(x) = 0');C.text('resultValue',rootStrs.join(',  ')||'none found');
  tg.textContent=realGroups.length+' real, '+(cplxGroups.length*2)+' complex';
  var factParts=[];
  var lead=P[0];
  realGroups.forEach(function(g){var t='(x '+(g.r.re<0?'+ ':'− ')+fmtNum(Math.abs(g.r.re))+')';if(g.m>1)t+='<sup>'+g.m+'</sup>';factParts.push(t);});
  cplxGroups.forEach(function(g){var b=-2*g.r.re,cc=g.r.re*g.r.re+g.r.im*g.r.im;var t='(x<sup>2</sup> '+(b<0?'− '+fmtNum(-b):'+ '+fmtNum(b))+'x '+(cc<0?'− ':'+ ')+fmtNum(Math.abs(cc))+')';if(g.m>1)t+='<sup>'+g.m+'</sup>';factParts.push(t);});
  var factStr=(Math.abs(lead-1)>1e-9?fmtNum(lead)+' ':'')+(factParts.join('') || '1');
  C.text('ex1L','Factored form');C.html('ex1',factStr);
  C.text('ex2L','Derivative P′(x)');C.html('ex2',polyStr(derivative(P)));
  C.text('interp','Found via the rational-root theorem for exact factors, then Durand–Kerner iteration for the remaining irrational or complex roots.');
  C.html('fxNow','P(x) = '+polyStr(P)+' = 0');
  var y0=hornerEval(P,0);
  var dP=derivative(P),critX=[];
  if(degOf(dP)>=1){var cRoots=degOf(dP)===1?[cx(-dP[1]/dP[0],0)]:durandKerner(dP);cRoots.forEach(function(r){if(Math.abs(r.im)<1e-6)critX.push(r.re);});}
  tiles([
    ['y-intercept','(0, '+fmtNum(y0)+')','value of P at x = 0'],
    ['Real roots',String(realGroups.reduce(function(s,g){return s+g.m;},0)),'crossing / touching the x-axis'],
    ['Complex roots',String(cplxGroups.length*2),'in conjugate pairs'],
    ['Derivative P′(x)',polyStr(dP),'slope of P(x)'],
    ['Critical points',critX.length?critX.map(fmtNum).join(', '):'none (real)','where P′(x) = 0'],
    ['Sum of all roots',fmtNum(-P[1]/P[0]),'−a<sub>n-1</sub> ÷ a<sub>n</sub> (Vieta)']
  ]);
  var realXs=[];realGroups.forEach(function(g){for(var i=0;i<g.m;i++)realXs.push(g.r.re);});
  plot(P,realGroups.map(function(g){return g.r.re;}));C.text('vizTag',realGroups.length+' real root'+(realGroups.length===1?'':'s'));
  var n4=0,h4='';function st4(t,dd,e){n4++;h4+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st4('Try the rational root theorem','Any rational root p/q has p dividing the constant term and q dividing the leading coefficient.',peelRational(P).roots.length?'found: '+peelRational(P).roots.map(fmtNum).join(', '):'no rational roots found');
  st4('Divide out each rational root','Synthetic division reduces the degree exactly, with zero remainder.','remaining degree after peeling: '+degOf(peelRational(P).remaining));
  if(degOf(peelRational(P).remaining)>=1)st4('Solve what remains numerically','Durand–Kerner iteration finds every remaining root at once, real or complex.','remaining roots: '+durandKerner(peelRational(P).remaining).map(function(r){return r.im===0||Math.abs(r.im)<1e-6?fmtNum(r.re):fmtNum(r.re)+(r.im>0?'+':'')+fmtNum(r.im)+'i';}).join(', '));
  st4('Write the factored form','Real roots give linear factors; conjugate complex pairs combine into an irreducible quadratic.',factStr);
  $('steps').innerHTML=h4;C.html('stepsIntro','Solving P(x) = 0 for P(x) = '+polyStr(P)+'.');C.text('stepsTag','degree '+deg);
  last='Polynomial roots — calculatepilot.com/math/polynomial-calculator.html\nP(x) = '+polyStr(P).replace(/<[^>]+>/g,'')+'\nroots: '+rootStrs.join(', ')+'\nfactored: '+factStr.replace(/<[^>]+>/g,'');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
