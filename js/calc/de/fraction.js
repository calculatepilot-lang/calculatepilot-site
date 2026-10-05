/* Fraction calculator — CalculatePilot (Stitch redesign). Exact BigInt arithmetic.
   a/b ± c/d via LCD · a/b × c/d = ac/bd · a/b ÷ c/d = ad/bc · reduce by GCD (Euclid) · mixed number · repeating decimal by long division
   · continued fraction from Euclid's quotients. Mixed number sign: from the whole part, else from the numerator. */
(function(){
var C=window.CPX,$=C.$,last='';
var ab=function(x){return x<0n?-x:x;};
function gcd(a,b){a=ab(a);b=ab(b);while(b){var t=a%b;a=b;b=t;}return a;}
function lcm(a,b){return a===0n||b===0n?0n:ab(a*b)/gcd(a,b);}
function esc(s){return C.esc(s);}
function bstr(b){var s=b.toString();return s.length>28?s[0]+'.'+s.slice(1,8)+'e+'+(s.length-1):s;}
function fstr(n,d){return d===1n?bstr(n):bstr(n)+'/'+bstr(d);}
function euclidLines(a,b){var lines=[],x=ab(a),y=ab(b),c=0;if(x<y){var t=x;x=y;y=t;}while(y&&c<14){lines.push(bstr(x)+' = '+bstr(x/y)+' × '+bstr(y)+' + '+bstr(x%y));var r=x%y;x=y;y=r;c++;}return {g:x,lines:lines};}
function mixed(n,d){var neg=n<0n,a=ab(n),q=a/d,r=a%d,s=neg?'−':'';if(r===0n)return s+bstr(q);if(q===0n)return s+bstr(r)+'/'+bstr(d);return s+bstr(q)+' '+bstr(r)+'/'+bstr(d);}
function decimal(n,d){/* returns {txt, rep, period} using long division */
  var neg=n<0n,a=ab(n),q=a/d,r=a%d,digits=[],seen=new Map(),start=-1,i=0,LIM=60;
  while(r!==0n&&i<LIM){var k=r.toString();if(seen.has(k)){start=seen.get(k);break;}seen.set(k,i);r*=10n;digits.push((r/d).toString());r%=d;i++;}
  var base=(neg?'−':'')+q.toString(),period=0,txt;
  if(r===0n)txt=digits.length?base+'.'+digits.join(''):base;
  else if(start>=0){period=digits.length-start;txt=base+'.'+digits.slice(0,start).join('')+'('+digits.slice(start).join('')+')';}
  else txt=base+'.'+digits.join('')+'…';
  return {txt:txt,period:period,terminates:r===0n};}
function num(n,d){/* approximate Number value */var sn=n.toString(),sd=d.toString();if(sn.length<300&&sd.length<300)return Number(n)/Number(d);return NaN;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','mixed','dec'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}
function readF(w,n,d,label){var sw=String($(w).value).trim(),sn=String($(n).value).trim(),sd=String($(d).value).trim();if(!/^-?\d+$/.test(sw)||!/^-?\d+$/.test(sn)||!/^-?\d+$/.test(sd))return {err:label+': Geben Sie in jedes Feld nur ganze Zahlen ein (keine Dezimalstellen).'};
  var W=BigInt(sw),N=BigInt(sn),D=BigInt(sd);if(D<=0n)return {err:label+': Der Nenner muss mindestens 1 sein.'};
  var num2=W!==0n?(W<0n?-1n:1n)*(ab(W)*D+ab(N)):N;return {n:num2,d:D,w:W,nn:N};}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}

function line(vals,labels){
  var W=760,H=150,pad=40,mn=Math.min(0,Math.floor(Math.min.apply(null,vals))),mx=Math.max(1,Math.ceil(Math.max.apply(null,vals))),X=function(v){return pad+(v-mn)/(mx-mn)*(W-2*pad);},cy=76,i;
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+cy+'" y2="'+cy+'" stroke="var(--sx-muted)" stroke-width="2"/>';
  for(i=mn;i<=mx;i++)s+='<line x1="'+X(i)+'" x2="'+X(i)+'" y1="'+(cy-9)+'" y2="'+(cy+9)+'" stroke="var(--sx-muted)" stroke-width="2"/><text class="ax" x="'+X(i)+'" y="'+(cy+26)+'" text-anchor="middle">'+i+'</text>';
  vals.forEach(function(v,i2){if(!isFinite(v))return;var col=['#d97706','#2563eb','var(--sx-pc)'][i2]||'var(--sx-pc)',up=i2!==1;s+='<line x1="'+X(v).toFixed(1)+'" x2="'+X(v).toFixed(1)+'" y1="'+cy+'" y2="'+(cy+(up?-30:30)+(i2===2?-12:0))+'" stroke="'+col+'" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="'+X(v).toFixed(1)+'" cy="'+cy+'" r="6" fill="'+col+'"/><text class="ax" x="'+X(v).toFixed(1)+'" y="'+(cy+(up?-42:46)+(i2===2?-12:0))+'" text-anchor="middle" style="font-weight:700;fill:'+col+'">'+esc(labels[i2])+'</text>';});
  $('viz').innerHTML=s+'</svg>';}

function compute(){
  var op=$('op').value,h='',n=0;$('f2').hidden=op==='simp';$('err').hidden=true;
  var A=readF('w1','n1','d1','Bruch 1');if(A.err)return fail(A.err);var B=op==='simp'?{n:1n,d:1n}:readF('w2','n2','d2','Bruch 2');if(B.err)return fail(B.err);
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var n1=A.n,d1=A.d,n2=B.n,d2=B.d,N,D,sym={add:'+',sub:'−',mul:'×',div:'÷',simp:''}[op],f1=fstr(n1,d1),f2=fstr(n2,d2),L=null;
  var shown1=A.w!==0n?(bstr(A.w)+' '+bstr(ab(A.nn))+'/'+bstr(A.d)):f1,shown2=op==='simp'?'':(B.w!==0n?(bstr(B.w)+' '+bstr(ab(B.nn))+'/'+bstr(B.d)):f2);
  C.text('fxNow',op==='simp'?'simplify  '+shown1:shown1+'  '+sym+'  '+shown2);
  if(A.w!==0n||(op!=='simp'&&B.w!==0n))st('Gemischte Zahlen in unechte Brüche umwandeln','Ganze Zahl × Nenner + Zähler, über demselben Nenner.',(A.w!==0n?shown1+' = <b>'+esc(f1)+'</b>':'')+(A.w!==0n&&B.w!==0n&&op!=='simp'?'<br>':'')+(op!=='simp'&&B.w!==0n?shown2+' = <b>'+esc(f2)+'</b>':''));
  if(op==='add'||op==='sub'){
    L=lcm(d1,d2);var a1=n1*(L/d1),a2=n2*(L/d2);N=op==='add'?a1+a2:a1-a2;D=L;
    st('Den kleinsten gemeinsamen Nenner finden','Die kleinste Zahl, durch die beide Nenner teilbar sind.','LCD('+bstr(d1)+', '+bstr(d2)+') = '+bstr(d1)+' × '+bstr(d2)+' ÷ ggT = <b>'+bstr(L)+'</b>');
    st('Beide Brüche auf den Hauptnenner bringen','Zähler und Nenner mit dem Faktor multiplizieren, der erreicht '+bstr(L)+'.',esc(f1)+' = '+bstr(a1)+'/'+bstr(L)+' (× '+bstr(L/d1)+')<br>'+esc(f2)+' = '+bstr(a2)+'/'+bstr(L)+' (× '+bstr(L/d2)+')');
    st(op==='add'?'Die Zähler addieren':'Die Zähler subtrahieren','Der Nenner bleibt gleich.',bstr(a1)+'/'+bstr(L)+' '+sym+' '+bstr(a2)+'/'+bstr(L)+' = <b>'+bstr(N)+'/'+bstr(D)+'</b>');
  }else if(op==='mul'){N=n1*n2;D=d1*d2;st('Geradeaus multiplizieren','Zähler mit Zähler, Nenner mit Nenner.',esc(f1)+' × '+esc(f2)+' = ('+bstr(n1)+' × '+bstr(n2)+') / ('+bstr(d1)+' × '+bstr(d2)+') = <b>'+bstr(N)+'/'+bstr(D)+'</b>');}
  else if(op==='div'){if(n2===0n)return fail('Sie können nicht durch null teilen: Der zweite Bruch ist gleich 0.');N=n1*d2;D=d1*n2;if(D<0n){N=-N;D=-D;}st('Den zweiten Bruch umkehren','Das Teilen durch einen Bruch ist das Multiplizieren mit seinem Kehrwert.',esc(f2)+' → Kehrwert '+bstr(d2)+'/'+bstr(n2));st('Multiplizieren','',esc(f1)+' × '+bstr(d2)+'/'+bstr(n2)+' = <b>'+bstr(N)+'/'+bstr(D)+'</b>');}
  else{N=n1;D=d1;}
  var g=gcd(N,D)||1n,rn=N/g,rd=D/g,eu=euclidLines(N===0n?1n:N,D);
  if(N===0n){rn=0n;rd=1n;}
  st(op==='simp'?'Den größten gemeinsamen Teiler finden':'Auf kleinste Terme kürzen','Euklidischer Algorithmus: dividieren, den Rest behalten und wiederholen, bis er 0 ist.',(eu.lines.length?eu.lines.map(esc).join('<br>')+'<br>':'')+'ggT = <b>'+bstr(N===0n?D:eu.g)+'</b>');
  st('Zähler und Nenner durch den ggT teilen','',bstr(N)+' ÷ '+bstr(g)+' / '+bstr(D)+' ÷ '+bstr(g)+' = <b>'+esc(fstr(rn,rd))+'</b>'+(g===1n?'  (bereits vollständig gekürzt)':''));
  var mx=mixed(rn,rd);
  if(rd!==1n&&ab(rn)>rd)st('Als gemischte Zahl schreiben','Teilen Sie den Zähler durch den Nenner.',bstr(ab(rn))+' ÷ '+bstr(rd)+' = '+bstr(ab(rn)/rd)+' remainder '+bstr(ab(rn)%rd)+'  →  <b>'+esc(mx)+'</b>');
  var dc=decimal(rn,rd),val=num(rn,rd),pct=isFinite(val)?Math.round(val*1e6)/1e4:NaN,inv=rn===0n?null:(rn<0n?[-rd,-rn]:[rd,rn]);
  C.text('heroLbl',op==='simp'?'Gekürzter Bruch':'Ergebnis (gekürzt)');C.text('resultValue',fstr(rn,rd));C.text('mixed',mx);C.text('dec',dc.txt);
  var tg=$('tag');tg.className='sx-ef-grade';tg.textContent=rn===0n?'Null':rd===1n?'Ganze Zahl':ab(rn)<rd?'Echter Bruch':'Unechter Bruch';
  C.text('interp',(op==='simp'?shown1+' wird gekürzt zu ':shown1+' '+sym+' '+shown2+' = ')+fstr(rn,rd)+(rd!==1n&&ab(rn)>rd?' = '+mx:'')+'.');
  var cf=[],x=ab(rn),y=rd,t2;if(rn!==0n){while(y&&cf.length<12){cf.push((x/y).toString());t2=x%y;x=y;y=t2;}}
  var inch=isFinite(val)?[16,32,64].map(function(q){var k=Math.round(Math.abs(val)*q),gg=Number(gcd(BigInt(k),BigInt(q)))||1;return (val<0?'−':'')+(k/gg)+'/'+(q/gg)+' (Δ '+Math.abs(Math.abs(val)-k/q).toFixed(4)+')';}):null;
  tiles([['Dezimalzahl',dc.txt,dc.terminates?'terminating':dc.period?'periodisch, Periode '+dc.period:'lange Dezimalentwicklung'],['Prozent',isFinite(pct)?pct+'%':'—','Wert × 100'],['Kehrwert',inv?fstr(inv[0],inv[1]):'undefined','Bruch kehrwertig umdrehen'],['kgV der Nenner',bstr(lcm(d1,op==='simp'?1n:d2)),'der gemeinsame Nenner'],['Kettenbruch',cf.length?'['+cf[0]+(cf.length>1?'; '+cf.slice(1).join(', '):'')+']':'0','aus den Quotienten des euklidischen Algorithmus'],['Nächstes 1/16 · 1/32 · 1/64',inch?inch.join('  ·  '):'—','nützlich für Maßangaben']]);
  var v1=Number(n1)/Number(d1),v2=Number(n2)/Number(d2);
  if(isFinite(val)&&Math.abs(val)<1e6)line(op==='simp'?[v1,val]:[v1,v2,val],op==='simp'?[shown1,'simplified']:['f₁ = '+fstr(n1,d1),'f₂ = '+fstr(n2,d2),'result']);else $('viz').innerHTML='';
  C.text('vizTag',isFinite(val)?'Ergebnis ≈ '+val.toFixed(4):'—');
  $('steps').innerHTML=h;C.text('stepsIntro',op==='simp'?'Einen Bruch auf kleinste Terme kürzen.':'Exakte Rechnung mit '+shown1+' and '+shown2+'.');C.text('stepsTag',{add:'Hauptnennermethode',sub:'Hauptnennermethode',mul:'ac / bd',div:'mit dem Kehrwert multiplizieren',simp:'÷ ggT'}[op]);
  last='Bruch — calculatepilot.com/math/fraction-calculator.html\n'+(op==='simp'?'simplify '+shown1:shown1+' '+sym+' '+shown2)+' = '+fstr(rn,rd)+(rd!==1n&&ab(rn)>rd?' = '+mx:'')+'\ndecimal: '+dc.txt+(isFinite(pct)?'\npercent: '+pct+'%':'');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('n1').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'frCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;var p=b.getAttribute('data-p').split('|'),a=p[1].split(','),c=p[2].split(',');C.set('op',p[0]);C.set('w1',a[0]);C.set('n1',a[1]);C.set('d1',a[2]);C.set('w2',c[0]);C.set('n2',c[1]);C.set('d2',c[2]);fire();});
  $('swap').addEventListener('click',function(){[['w1','w2'],['n1','n2'],['d1','d2']].forEach(function(p){var t=$(p[0]).value;C.set(p[0],$(p[1]).value);C.set(p[1],t);});fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
