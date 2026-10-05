/* GCD & LCM calculator — CalculatePilot (Stitch redesign). Exact BigInt arithmetic.
   gcd via Euclid, lcm = |ab| / gcd, Bézout via the extended Euclidean algorithm, factorisation by trial division (|n| ≤ 10^13). */
(function(){
var C=window.CPX,$=C.$,last='';
var ab=function(x){return x<0n?-x:x;};
function gcd(a,b){a=ab(a);b=ab(b);while(b){var t=a%b;a=b;b=t;}return a;}
function lcm(a,b){return a===0n||b===0n?0n:ab(a*b)/gcd(a,b);}
function esc(s){return C.esc(s);}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>40?s.slice(0,12)+'…'+s.slice(-6)+' ('+s.length+' Stellen)':grp(s);}
function egcd(a,b){var x0=1n,y0=0n,x1=0n,y1=1n,r0=a,r1=b;while(r1!==0n){var q=r0/r1,t;t=r0-q*r1;r0=r1;r1=t;t=x0-q*x1;x0=x1;x1=t;t=y0-q*y1;y0=y1;y1=t;}if(r0<0n){r0=-r0;x0=-x0;y0=-y0;}return {g:r0,x:x0,y:y0};}
function factor(n){n=ab(n);if(n<2n||n>10000000000000n)return n<2n?new Map():null;var m=new Map(),x=Number(n),p=2;while(p*p<=x){while(x%p===0){m.set(p,(m.get(p)||0)+1);x/=p;}p+=p===2?1:2;}if(x>1)m.set(x,(m.get(x)||0)+1);return m;}
function fs(m){if(m===null)return 'zu groß für die Faktorisierung hier';if(!m.size)return '1';return Array.from(m.keys()).sort(function(a,b){return a-b;}).map(function(p){var e=m.get(p);return e>1?p+'<sup>'+e+'</sup>':String(p);}).join(' · ');}
function fst(m){if(m===null)return '—';if(!m.size)return '1';return Array.from(m.keys()).sort(function(a,b){return a-b;}).map(function(p){var e=m.get(p);return e>1?p+'^'+e:String(p);}).join(' × ');}
function flat(m){var out=[];Array.from(m.keys()).sort(function(a,b){return a-b;}).forEach(function(p){for(var i=0;i<m.get(p);i++)out.push(p);});return out;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function readInt(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^-?\d+$/.test(s))return {err:label+' muss eine ganze Zahl sein (nur Ziffern).'};if(s.replace('-','').length>60)return {err:label+' ist zu lang (maximal 60 Ziffern).'};return {v:BigInt(s)};}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','lcm','rel'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';$('euTbl').tBodies[0].innerHTML='';C.text('vizTag','—');last='';}

function venn(fa,fb,g,l){
  var W=760,H=280,s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><circle cx="290" cy="140" r="105" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-pc)" stroke-width="2"/><circle cx="470" cy="140" r="105" fill="#d97706" fill-opacity=".2" stroke="#d97706" stroke-width="2"/>';
  function t(x,y,txt,col,sz){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:700;font-size:'+(sz||13)+'px;fill:'+col+'">'+esc(txt)+'</text>';}
  var common=new Map(),onlyA=new Map(),onlyB=new Map();
  fa.forEach(function(e,p){var eb=fb.get(p)||0,c=Math.min(e,eb);if(c)common.set(p,c);if(e-c)onlyA.set(p,e-c);});fb.forEach(function(e,p){var c=common.get(p)||0;if(e-c)onlyB.set(p,e-c);});
  var j=function(m){var f=flat(m);return f.length?f.join(' × '):'—';};
  s+=t(212,138,j(onlyA),'var(--sx-primary)')+t(380,132,j(common),'var(--sx-on)',14)+t(548,138,j(onlyB),'#b45309')+t(290,30,'A','var(--sx-primary)',14)+t(470,30,'B','#b45309',14)+t(380,150,'shared','var(--sx-muted)',10)+t(380,262,'ggT = '+g+'   ·   kgV = '+l,'var(--sx-on)',14);
  $('viz').innerHTML=s+'</svg>';}

function compute(){
  var m=$('mode').value,h='',n0=0,tg=$('tag');tg.className='sx-ef-grade';
  $('p1').hidden=m==='s2';$('p2').hidden=m!=='s2';$('presets').hidden=m==='s2';$('swap').hidden=m==='s2';$('vennCard').hidden=m==='s2';
  C.text('formH',{s1:'Zwei ganze Zahlen',s2:'Eine Liste ganzer Zahlen',s3:'Bézout-Identität',s4:'Teilerfremdheitstest'}[m]);$('err').hidden=true;
  function st(t,d,e){n0++;h+='<li><span class="n">'+n0+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  if(m==='s2'){
    var toks=String($('lst').value).split(/[\s,;]+/).filter(Boolean),arr=[],bad=0;toks.forEach(function(t){if(/^-?\d+$/.test(t))arr.push(BigInt(t));else bad++;});C.text('lstN',arr.length+' number'+(arr.length===1?'':'s')+(bad?' · '+bad+' ignored':''));
    if(arr.length<2)return fail('Geben Sie mindestens zwei ganze Zahlen ein.');if(arr.length>30)return fail('Geben Sie höchstens 30 ganze Zahlen ein.');
    var g=0n,l=1n,gs=[],ls=[],pairwise=true,i,j2;arr.forEach(function(x){g=gcd(g,x);l=lcm(l,x);gs.push(g);ls.push(l);});
    for(i=0;i<arr.length&&pairwise;i++)for(j2=i+1;j2<arr.length;j2++)if(gcd(arr[i],arr[j2])!==1n){pairwise=false;break;}
    C.text('heroLbl','ggT der Liste');C.text('resultValue',bs(g));C.text('lcm',bs(l));C.text('rel','bei 3 oder mehr Zahlen nicht ggT × kgV');tg.textContent=g===1n?(pairwise?'Paarweise teilerfremd':'Insgesamt teilerfremd'):'Gemeinsamer Teiler '+bs(g);
    C.text('interp','ggT und kgV von '+arr.length+' ganzen Zahlen, paarweise berechnet.');C.text('fxNow','gcd('+arr.map(bs).join(', ')+') = '+bs(g)+',  kgV = '+bs(l));
    tiles([['Laufender ggT',gs.map(bs).join(' → '),'ggT der ersten k Zahlen'],['Laufendes kgV',ls.map(bs).join(' → '),'kgV der ersten k Zahlen'],['Paarweise teilerfremd?',pairwise?'Ja':'No','jedes Paar hat den ggT 1'],['Insgesamt teilerfremd?',g===1n?'Ja':'No','ggT aller Zahlen = 1'],['Zahlen ÷ ggT',arr.map(function(x){return g?bs(x/g):'—';}).join(', '),'jeweils durch den ggT geteilt']]);
    $('viz').innerHTML='';var rows='';gs.forEach(function(gv,k){if(k>0)rows+='<tr><td>'+k+'</td><td class="mono">ggT('+bs(gs[k-1])+', '+bs(arr[k])+')</td><td class="mono">'+bs(gcd(gs[k-1],arr[k]))+'</td><td class="mono">kgV → '+bs(ls[k])+'</td></tr>';});$('euTbl').tBodies[0].innerHTML=rows;C.text('euN','Die Liste zusammenfassen: der ggT der ersten beiden Zahlen, dann dieses Ergebnis mit der dritten Zahl und so weiter.');C.text('euTag',arr.length-1+' steps');
    st('Die Liste paarweise reduzieren','ggT(a, b, c) = ggT(ggT(a, b), c).',gs.map(function(x,k){return k===0?bs(arr[0]):'gcd('+bs(gs[k-1])+', '+bs(arr[k])+') = <b>'+bs(x)+'</b>';}).slice(1).join('<br>'));
    st('Dasselbe für das kgV','kgV(a, b, c) = kgV(kgV(a, b), c).',ls.map(function(x,k){return k===0?'':'lcm('+bs(ls[k-1])+', '+bs(arr[k])+') = <b>'+bs(x)+'</b>';}).slice(1).join('<br>'));
    $('steps').innerHTML=h;C.text('stepsIntro','Liste von '+arr.length+' ganzen Zahlen.');C.text('stepsTag','ggT, kgV zusammenfassen');
    last='ggT &amp; kgV — calculatepilot.com/math/gcd-lcm-calculator.html\nZahlen: '+arr.join(', ')+'\nggT = '+g+'\nkgV = '+l;return;
  }
  var A=readInt('a','Die erste ganze Zahl'),B=readInt('b','Die zweite ganze Zahl');if(A.err)return fail(A.err);if(B.err)return fail(B.err);
  var a=A.v,b=B.v,g2=gcd(a,b),l2=lcm(a,b),fa=factor(a),fb=factor(b),eg=egcd(ab(a),ab(b));
  var sa=a<0n?-1n:1n,sb=b<0n?-1n:1n;var bx=eg.x*(a<0n?-1n:1n),by=eg.y*(b<0n?-1n:1n);
  C.text('fxNow','gcd('+bs(a)+', '+bs(b)+') = '+bs(g2)+'  und  kgV = ('+bs(ab(a))+' × '+bs(ab(b))+') ÷ '+bs(g2)+' = '+bs(l2));
  C.text('rel',g2===0n?'ggT(0, 0) = 0':bs(g2)+' × '+bs(l2)+' = '+bs(g2*l2)+' = |'+bs(a)+' × '+bs(b)+'|');
  var cop=g2===1n;
  if(m==='s4'){C.text('heroLbl','Sind sie teilerfremd?');C.text('resultValue',cop?'Ja':'No');tg.textContent=cop?'Teilerfremd (ggT = 1)':'Nicht teilerfremd';tg.className='sx-ef-grade'+(cop?'':' mid');C.text('interp',cop?bs(a)+' and '+bs(b)+' haben keinen gemeinsamen Primfaktor.':bs(a)+' and '+bs(b)+' haben den gemeinsamen Faktor '+bs(g2)+'.');}
  else if(m==='s3'){C.text('heroLbl','Bézout: a·x + b·y = ggT');C.text('resultValue',bs(a)+'·('+bs(bx)+') + '+bs(b)+'·('+bs(by)+') = '+bs(g2));tg.textContent='ggT = '+bs(g2);C.text('interp','Ganze Zahlen x = '+bs(bx)+' und y = '+bs(by)+' erfüllen die Gleichung. Weitere sind x + k·b/g, y − k·a/g.');}
  else{C.text('heroLbl','Größter gemeinsamer Teiler');C.text('resultValue',bs(g2));tg.textContent=cop?'Teilerfremd':'Gemeinsamer Teiler gefunden';C.text('interp','Die größte ganze Zahl, die beide teilt '+bs(a)+' and '+bs(b)+' is '+bs(g2)+'.');}
  C.text('lcm',bs(l2));
  /* euclid table */
  var x=ab(a),y=ab(b),rows2='',cnt=0,elines=[];if(x<y){var t=x;x=y;y=t;}var xs=x,ys=y;
  while(y&&cnt<60){var q=x/y,r=x%y;cnt++;elines.push(bs(x)+' = '+bs(q)+' × '+bs(y)+' + '+bs(r));rows2+='<tr'+(r===0n?' class="hl"':'')+'><td>'+cnt+'</td><td class="mono">'+bs(x)+' = '+bs(q)+' × '+bs(y)+' + '+bs(r)+'</td><td class="mono">'+bs(q)+'</td><td class="mono">'+bs(r)+(r===0n?'  ← Stopp':'')+'</td></tr>';x=y;y=r;}
  if(!cnt)rows2='<tr><td>—</td><td class="mono">ggT(x, 0) = |x|</td><td class="mono">—</td><td class="mono">—</td></tr>';
  $('euTbl').tBodies[0].innerHTML=rows2;C.text('euN','Wiederholte Division: der letzte von null verschiedene Rest, '+bs(x)+', ist der ggT.');C.text('euTag',cnt+' step'+(cnt===1?'':'s'));
  var gf=null,lf=null;if(fa&&fb){gf=new Map();lf=new Map();var keys=new Set(Array.from(fa.keys()).concat(Array.from(fb.keys())));keys.forEach(function(p){var ea=fa.get(p)||0,eb=fb.get(p)||0;if(Math.min(ea,eb))gf.set(p,Math.min(ea,eb));lf.set(p,Math.max(ea,eb));});}
  tiles([['Faktorisierung von '+bs(a),fst(fa)==='—'?'—':esc(fst(fa)),'Primfaktoren'],['Faktorisierung von '+bs(b),fst(fb)==='—'?'—':esc(fst(fb)),'Primfaktoren'],['ggT aus Primzahlen (kleinste Exponenten)',gf?esc(fst(gf))+' = '+bs(g2):'—','gemeinsamer Anteil'],['kgV aus Primzahlen (größte Exponenten)',lf?esc(fst(lf))+' = '+bs(l2):'—','alle Primzahlen'],['Multiplikatoren bis zum kgV',g2?bs(l2/ab(a===0n?1n:a))+' × '+bs(a)+' = '+bs(l2/ab(b===0n?1n:b))+' × '+bs(b):'—','kgV ÷ jede Zahl'],['Bézout-Koeffizienten','x = '+bs(bx)+', y = '+bs(by),'ax + by = ggT']]);
  if(fa&&fb&&a!==0n&&b!==0n){venn(fa,fb,bs(g2),bs(l2));C.text('vizTag','GCD '+bs(g2)+' · kgV '+bs(l2));}else{$('viz').innerHTML='';C.text('vizTag','—');}
  if(fa&&fb)st('Primfaktorzerlegung','Schreiben Sie jede Zahl als Produkt von Primzahlen (eindeutig, nach dem Fundamentalsatz der Arithmetik).',bs(a)+' = <b>'+fs(fa)+'</b><br>'+bs(b)+' = <b>'+fs(fb)+'</b>');
  st('Euklidischer Algorithmus','Teilen, den Rest behalten und wiederholen, bis er 0 ist.',(elines.length?elines.join('<br>')+'<br>':'')+'ggT = <b>'+bs(g2)+'</b>');
  if(gf)st('Kontrolle mit den Primzahlexponenten','Der ggT nimmt von jeder Primzahl den kleinsten Exponenten, das kgV den größten.','ggT = '+esc(fst(gf))+' = <b>'+bs(g2)+'</b><br>kgV = '+esc(fst(lf))+' = <b>'+bs(l2)+'</b>');
  st('kgV über die Produktbeziehung','Für zwei Zahlen gilt: ggT × kgV = |a × b|.','kgV = |'+bs(a)+' × '+bs(b)+'| ÷ '+bs(g2)+' = <b>'+bs(l2)+'</b>');
  if(m==='s3')st('Bézout-Koeffizienten (erweiterter euklidischer Algorithmus)','Durch die Divisionsschritte rückwärts einsetzen.',bs(a)+'·('+bs(bx)+') + '+bs(b)+'·('+bs(by)+') = '+bs(a*bx)+' + '+bs(b*by)+' = <b>'+bs(a*bx+b*by)+'</b>');
  $('steps').innerHTML=h;C.text('stepsIntro','gcd('+bs(a)+', '+bs(b)+').');C.text('stepsTag','Euklid');
  last='ggT &amp; kgV — calculatepilot.com/math/gcd-lcm-calculator.html\na = '+a+', b = '+b+'\nggT = '+g2+'\nkgV = '+l2+'\nBézout: '+a+'·('+bx+') + '+b+'·('+by+') = '+g2;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('a').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'gcCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;C.set('a',b.getAttribute('data-a'));C.set('b',b.getAttribute('data-b'));fire();});
  $('swap').addEventListener('click',function(){var t=$('a').value;C.set('a',$('b').value);C.set('b',t);fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
