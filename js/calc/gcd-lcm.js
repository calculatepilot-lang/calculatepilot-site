/* GCD & LCM calculator — CalculatePilot (Stitch redesign). Exact BigInt arithmetic.
   gcd via Euclid, lcm = |ab| / gcd, Bézout via the extended Euclidean algorithm, factorisation by trial division (|n| ≤ 10^13). */
(function(){
var C=window.CPX,$=C.$,last='';
var ab=function(x){return x<0n?-x:x;};
function gcd(a,b){a=ab(a);b=ab(b);while(b){var t=a%b;a=b;b=t;}return a;}
function lcm(a,b){return a===0n||b===0n?0n:ab(a*b)/gcd(a,b);}
function esc(s){return C.esc(s);}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>40?s.slice(0,12)+'…'+s.slice(-6)+' ('+s.length+' digits)':grp(s);}
function egcd(a,b){var x0=1n,y0=0n,x1=0n,y1=1n,r0=a,r1=b;while(r1!==0n){var q=r0/r1,t;t=r0-q*r1;r0=r1;r1=t;t=x0-q*x1;x0=x1;x1=t;t=y0-q*y1;y0=y1;y1=t;}if(r0<0n){r0=-r0;x0=-x0;y0=-y0;}return {g:r0,x:x0,y:y0};}
function factor(n){n=ab(n);if(n<2n||n>10000000000000n)return n<2n?new Map():null;var m=new Map(),x=Number(n),p=2;while(p*p<=x){while(x%p===0){m.set(p,(m.get(p)||0)+1);x/=p;}p+=p===2?1:2;}if(x>1)m.set(x,(m.get(x)||0)+1);return m;}
function fs(m){if(m===null)return 'too large to factor here';if(!m.size)return '1';return Array.from(m.keys()).sort(function(a,b){return a-b;}).map(function(p){var e=m.get(p);return e>1?p+'<sup>'+e+'</sup>':String(p);}).join(' · ');}
function fst(m){if(m===null)return '—';if(!m.size)return '1';return Array.from(m.keys()).sort(function(a,b){return a-b;}).map(function(p){var e=m.get(p);return e>1?p+'^'+e:String(p);}).join(' × ');}
function flat(m){var out=[];Array.from(m.keys()).sort(function(a,b){return a-b;}).forEach(function(p){for(var i=0;i<m.get(p);i++)out.push(p);});return out;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function readInt(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^-?\d+$/.test(s))return {err:label+' must be a whole number (digits only).'};if(s.replace('-','').length>60)return {err:label+' is too long (60 digits maximum).'};return {v:BigInt(s)};}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','lcm','rel'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';$('euTbl').tBodies[0].innerHTML='';C.text('vizTag','—');last='';}

function venn(fa,fb,g,l){
  var W=760,H=280,s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><circle cx="290" cy="140" r="105" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-pc)" stroke-width="2"/><circle cx="470" cy="140" r="105" fill="#d97706" fill-opacity=".2" stroke="#d97706" stroke-width="2"/>';
  function t(x,y,txt,col,sz){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:700;font-size:'+(sz||13)+'px;fill:'+col+'">'+esc(txt)+'</text>';}
  var common=new Map(),onlyA=new Map(),onlyB=new Map();
  fa.forEach(function(e,p){var eb=fb.get(p)||0,c=Math.min(e,eb);if(c)common.set(p,c);if(e-c)onlyA.set(p,e-c);});fb.forEach(function(e,p){var c=common.get(p)||0;if(e-c)onlyB.set(p,e-c);});
  var j=function(m){var f=flat(m);return f.length?f.join(' × '):'—';};
  s+=t(212,138,j(onlyA),'var(--sx-primary)')+t(380,132,j(common),'var(--sx-on)',14)+t(548,138,j(onlyB),'#b45309')+t(290,30,'A','var(--sx-primary)',14)+t(470,30,'B','#b45309',14)+t(380,150,'shared','var(--sx-muted)',10)+t(380,262,'GCD = '+g+'   ·   LCM = '+l,'var(--sx-on)',14);
  $('viz').innerHTML=s+'</svg>';}

function compute(){
  var m=$('mode').value,h='',n0=0,tg=$('tag');tg.className='sx-ef-grade';
  $('p1').hidden=m==='s2';$('p2').hidden=m!=='s2';$('presets').hidden=m==='s2';$('swap').hidden=m==='s2';$('vennCard').hidden=m==='s2';
  C.text('formH',{s1:'Two integers',s2:'A list of integers',s3:'Bézout identity',s4:'Coprimality test'}[m]);$('err').hidden=true;
  function st(t,d,e){n0++;h+='<li><span class="n">'+n0+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  if(m==='s2'){
    var toks=String($('lst').value).split(/[\s,;]+/).filter(Boolean),arr=[],bad=0;toks.forEach(function(t){if(/^-?\d+$/.test(t))arr.push(BigInt(t));else bad++;});C.text('lstN',arr.length+' number'+(arr.length===1?'':'s')+(bad?' · '+bad+' ignored':''));
    if(arr.length<2)return fail('Enter at least two integers.');if(arr.length>30)return fail('Enter at most 30 integers.');
    var g=0n,l=1n,gs=[],ls=[],pairwise=true,i,j2;arr.forEach(function(x){g=gcd(g,x);l=lcm(l,x);gs.push(g);ls.push(l);});
    for(i=0;i<arr.length&&pairwise;i++)for(j2=i+1;j2<arr.length;j2++)if(gcd(arr[i],arr[j2])!==1n){pairwise=false;break;}
    C.text('heroLbl','GCD of the list');C.text('resultValue',bs(g));C.text('lcm',bs(l));C.text('rel','not gcd × lcm for 3+ numbers');tg.textContent=g===1n?(pairwise?'Pairwise coprime':'Coprime overall'):'Common factor '+bs(g);
    C.text('interp','GCD and LCM of '+arr.length+' integers, computed pair by pair.');C.text('fxNow','gcd('+arr.map(bs).join(', ')+') = '+bs(g)+',  lcm = '+bs(l));
    tiles([['Running GCD',gs.map(bs).join(' → '),'gcd of the first k numbers'],['Running LCM',ls.map(bs).join(' → '),'lcm of the first k numbers'],['Pairwise coprime?',pairwise?'Yes':'No','every pair has gcd 1'],['Coprime overall?',g===1n?'Yes':'No','gcd of all = 1'],['Numbers ÷ GCD',arr.map(function(x){return g?bs(x/g):'—';}).join(', '),'each divided by the GCD']]);
    $('viz').innerHTML='';var rows='';gs.forEach(function(gv,k){if(k>0)rows+='<tr><td>'+k+'</td><td class="mono">gcd('+bs(gs[k-1])+', '+bs(arr[k])+')</td><td class="mono">'+bs(gcd(gs[k-1],arr[k]))+'</td><td class="mono">lcm → '+bs(ls[k])+'</td></tr>';});$('euTbl').tBodies[0].innerHTML=rows;C.text('euN','Fold the list: the GCD of the first two, then that result with the third, and so on.');C.text('euTag',arr.length-1+' steps');
    st('Reduce the list pair by pair','gcd(a, b, c) = gcd(gcd(a, b), c).',gs.map(function(x,k){return k===0?bs(arr[0]):'gcd('+bs(gs[k-1])+', '+bs(arr[k])+') = <b>'+bs(x)+'</b>';}).slice(1).join('<br>'));
    st('Do the same for the LCM','lcm(a, b, c) = lcm(lcm(a, b), c).',ls.map(function(x,k){return k===0?'':'lcm('+bs(ls[k-1])+', '+bs(arr[k])+') = <b>'+bs(x)+'</b>';}).slice(1).join('<br>'));
    $('steps').innerHTML=h;C.text('stepsIntro','List of '+arr.length+' integers.');C.text('stepsTag','fold gcd, lcm');
    last='GCD & LCM — calculatepilot.com/math/gcd-lcm-calculator.html\nnumbers: '+arr.join(', ')+'\nGCD = '+g+'\nLCM = '+l;return;
  }
  var A=readInt('a','The first integer'),B=readInt('b','The second integer');if(A.err)return fail(A.err);if(B.err)return fail(B.err);
  var a=A.v,b=B.v,g2=gcd(a,b),l2=lcm(a,b),fa=factor(a),fb=factor(b),eg=egcd(ab(a),ab(b));
  var sa=a<0n?-1n:1n,sb=b<0n?-1n:1n;var bx=eg.x*(a<0n?-1n:1n),by=eg.y*(b<0n?-1n:1n);
  C.text('fxNow','gcd('+bs(a)+', '+bs(b)+') = '+bs(g2)+'  and  lcm = ('+bs(ab(a))+' × '+bs(ab(b))+') ÷ '+bs(g2)+' = '+bs(l2));
  C.text('rel',g2===0n?'gcd(0, 0) = 0':bs(g2)+' × '+bs(l2)+' = '+bs(g2*l2)+' = |'+bs(a)+' × '+bs(b)+'|');
  var cop=g2===1n;
  if(m==='s4'){C.text('heroLbl','Are they coprime?');C.text('resultValue',cop?'Yes':'No');tg.textContent=cop?'Coprime (gcd = 1)':'Not coprime';tg.className='sx-ef-grade'+(cop?'':' mid');C.text('interp',cop?bs(a)+' and '+bs(b)+' share no prime factor.':bs(a)+' and '+bs(b)+' share the factor '+bs(g2)+'.');}
  else if(m==='s3'){C.text('heroLbl','Bézout: a·x + b·y = gcd');C.text('resultValue',bs(a)+'·('+bs(bx)+') + '+bs(b)+'·('+bs(by)+') = '+bs(g2));tg.textContent='gcd = '+bs(g2);C.text('interp','Integers x = '+bs(bx)+' and y = '+bs(by)+' satisfy the identity. Others are x + k·b/g, y − k·a/g.');}
  else{C.text('heroLbl','Greatest common divisor');C.text('resultValue',bs(g2));tg.textContent=cop?'Coprime':'Common factor found';C.text('interp','The largest integer dividing both '+bs(a)+' and '+bs(b)+' is '+bs(g2)+'.');}
  C.text('lcm',bs(l2));
  /* euclid table */
  var x=ab(a),y=ab(b),rows2='',cnt=0,elines=[];if(x<y){var t=x;x=y;y=t;}var xs=x,ys=y;
  while(y&&cnt<60){var q=x/y,r=x%y;cnt++;elines.push(bs(x)+' = '+bs(q)+' × '+bs(y)+' + '+bs(r));rows2+='<tr'+(r===0n?' class="hl"':'')+'><td>'+cnt+'</td><td class="mono">'+bs(x)+' = '+bs(q)+' × '+bs(y)+' + '+bs(r)+'</td><td class="mono">'+bs(q)+'</td><td class="mono">'+bs(r)+(r===0n?'  ← stop':'')+'</td></tr>';x=y;y=r;}
  if(!cnt)rows2='<tr><td>—</td><td class="mono">gcd(x, 0) = |x|</td><td class="mono">—</td><td class="mono">—</td></tr>';
  $('euTbl').tBodies[0].innerHTML=rows2;C.text('euN','Repeated division: the last non-zero remainder, '+bs(x)+', is the GCD.');C.text('euTag',cnt+' step'+(cnt===1?'':'s'));
  var gf=null,lf=null;if(fa&&fb){gf=new Map();lf=new Map();var keys=new Set(Array.from(fa.keys()).concat(Array.from(fb.keys())));keys.forEach(function(p){var ea=fa.get(p)||0,eb=fb.get(p)||0;if(Math.min(ea,eb))gf.set(p,Math.min(ea,eb));lf.set(p,Math.max(ea,eb));});}
  tiles([['Factorisation of '+bs(a),fst(fa)==='—'?'—':esc(fst(fa)),'prime factors'],['Factorisation of '+bs(b),fst(fb)==='—'?'—':esc(fst(fb)),'prime factors'],['GCD from primes (min exponents)',gf?esc(fst(gf))+' = '+bs(g2):'—','shared part'],['LCM from primes (max exponents)',lf?esc(fst(lf))+' = '+bs(l2):'—','all primes'],['Multipliers to reach the LCM',g2?bs(l2/ab(a===0n?1n:a))+' × '+bs(a)+' = '+bs(l2/ab(b===0n?1n:b))+' × '+bs(b):'—','lcm ÷ each number'],['Bézout coefficients','x = '+bs(bx)+', y = '+bs(by),'ax + by = gcd']]);
  if(fa&&fb&&a!==0n&&b!==0n){venn(fa,fb,bs(g2),bs(l2));C.text('vizTag','GCD '+bs(g2)+' · LCM '+bs(l2));}else{$('viz').innerHTML='';C.text('vizTag','—');}
  if(fa&&fb)st('Prime decomposition','Write each number as a product of primes (unique, by the Fundamental Theorem of Arithmetic).',bs(a)+' = <b>'+fs(fa)+'</b><br>'+bs(b)+' = <b>'+fs(fb)+'</b>');
  st('Euclid’s algorithm','Divide, keep the remainder, repeat until it is 0.',(elines.length?elines.join('<br>')+'<br>':'')+'GCD = <b>'+bs(g2)+'</b>');
  if(gf)st('Check with the prime exponents','GCD takes the smallest exponent of each prime; LCM the largest.','gcd = '+esc(fst(gf))+' = <b>'+bs(g2)+'</b><br>lcm = '+esc(fst(lf))+' = <b>'+bs(l2)+'</b>');
  st('LCM from the product duality','For two numbers, gcd × lcm = |a × b|.','lcm = |'+bs(a)+' × '+bs(b)+'| ÷ '+bs(g2)+' = <b>'+bs(l2)+'</b>');
  if(m==='s3')st('Bézout coefficients (extended Euclid)','Back-substitute through the division steps.',bs(a)+'·('+bs(bx)+') + '+bs(b)+'·('+bs(by)+') = '+bs(a*bx)+' + '+bs(b*by)+' = <b>'+bs(a*bx+b*by)+'</b>');
  $('steps').innerHTML=h;C.text('stepsIntro','gcd('+bs(a)+', '+bs(b)+').');C.text('stepsTag','Euclid');
  last='GCD & LCM — calculatepilot.com/math/gcd-lcm-calculator.html\na = '+a+', b = '+b+'\nGCD = '+g2+'\nLCM = '+l2+'\nBézout: '+a+'·('+bx+') + '+b+'·('+by+') = '+g2;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('a').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'gcCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;C.set('a',b.getAttribute('data-a'));C.set('b',b.getAttribute('data-b'));fire();});
  $('swap').addEventListener('click',function(){var t=$('a').value;C.set('a',$('b').value);C.set('b',t);fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
