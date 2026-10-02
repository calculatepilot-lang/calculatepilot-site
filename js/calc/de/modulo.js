/* Modulo calculator — CalculatePilot (Stitch redesign). Exact BigInt arithmetic.
   Floored mod: a - n*floor(a/n). Extended Euclidean algorithm for the modular inverse.
   Fast (binary) modular exponentiation for a^b mod n. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function ab(x){return x<0n?-x:x;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>50?s.slice(0,12)+'…'+s.slice(-6)+' ('+s.length+' Stellen)':grp(s);}
function readInt(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^-?\d+$/.test(s))return {err:label+' muss eine ganze Zahl sein (nur Ziffern).'};if(s.replace('-','').length>2000)return {err:label+' ist zu lang.'};return {v:BigInt(s)};}
function floorMod(a,n){var r=a%n;if(r!==0n&&((r<0n)!==(n<0n)))r+=n;return r;}
function truncMod(a,n){return a%n;}
function floorDiv(a,n){var q=a/n;if((a%n!==0n)&&((a<0n)!==(n<0n)))q-=1n;return q;}
function gcd(a,b){a=ab(a);b=ab(b);while(b){var t=a%b;a=b;b=t;}return a;}
function egcd(a,b){var x0=1n,y0=0n,x1=0n,y1=1n,r0=a,r1=b;while(r1!==0n){var q=r0/r1,t;t=r0-q*r1;r0=r1;r1=t;t=x0-q*x1;x0=x1;x1=t;t=y0-q*y1;y0=y1;y1=t;}if(r0<0n){r0=-r0;x0=-x0;y0=-y0;}return {g:r0,x:x0,y:y0};}
function modpow(a,b,n){if(n===1n)return 0n;a=floorMod(a,n);var r=1n;if(b<0n)return null; /* negative exponent handled by caller via inverse */
  while(b>0n){if(b&1n)r=floorMod(r*a,n);a=floorMod(a*a,n);b>>=1n;}return r;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function numberLine(a,n,r){
  var W=760,H=140,pad=40;
  var nn=Number(ab(n))||1,lo=-nn*2,hi=nn*3,rN=Number(r);
  if(nn>1000){lo=-3;hi=4;}
  var kx=(W-2*pad)/(hi-lo),X=function(x){return pad+(x-lo)*kx;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="70" y2="70" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  for(var k=Math.ceil(lo/nn);k*nn<=hi;k++){var x=X(k*nn);s+='<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="62" y2="78" stroke="var(--sx-border)" stroke-width="1.5"/><text class="ax" x="'+x.toFixed(1)+'" y="96" text-anchor="middle">'+esc(String(k*nn))+'</text>';}
  if(nn<=1000){var xr=X(rN);s+='<circle cx="'+xr.toFixed(1)+'" cy="70" r="7" fill="#059669"/><text class="ax" x="'+xr.toFixed(1)+'" y="50" text-anchor="middle" style="font-weight:700;fill:var(--sx-on)">Rest '+esc(String(rN))+'</text>';}
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fB').hidden=(m==='s1'||m==='s3');
  C.text('bL',m==='s2'?'b':'b (Exponent)');
  var labels={s1:'a mod n',s2:'Kongruenz a ≡ b (mod n)',s3:'Modulare Inverse a⁻¹ mod n',s4:'Modulare Potenz aᵇ mod n'};
  C.html('formH',labels[m]);
  var A=readInt('a','a');if(A.err)return fail(A.err);
  var N=readInt('n','n');if(N.err)return fail(N.err);
  if(N.v===0n)return fail('n (der Modul) darf nicht 0 sein — die Division durch null ist nicht definiert.');
  var a=A.v,n=N.v;
  C.html('fxNow',(m==='s1'?bs(a)+' mod '+bs(n):m==='s3'?bs(a)+'⁻¹ mod '+bs(n):m==='s4'?bs(a)+'^b mod '+bs(n):bs(a)+' ≡ ? (mod '+bs(n)+')'));

  if(m==='s1'){
    var r=floorMod(a,n),rt=truncMod(a,n),q=floorDiv(a,n);
    C.text('heroLbl','a mod n (Floor-Division)');C.text('resultValue',bs(r));tg.textContent='Floor-Konvention';
    C.text('ex1L','Abgeschnittener Rest (Stil von C/JS)');C.text('ex1',bs(rt));
    C.text('ex2L','Quotient ⌊a/n⌋');C.text('ex2',bs(q));
    C.text('interp',bs(a)+' geteilt durch '+bs(n)+' lässt den Rest '+bs(r)+', nach der mathematischen (Floor-)Konvention, bei der das Ergebnis immer dasselbe Vorzeichen wie n hat.');
    tiles([['a',bs(a),''],['n',bs(n),''],['⌊a/n⌋',bs(q),'abgerundeter Quotient'],['a − n·⌊a/n⌋',bs(a)+' − '+bs(n)+'×'+bs(q)+' = '+bs(r),'das Modulo-Ergebnis'],['Dasselbe Vorzeichen wie n?',(r===0n||(r<0n)===(n<0n))?'Ja':'No','Eigenschaft der Floor-Konvention'],['Ist a durch n teilbar?',r===0n?'Ja':'No','der Rest ist genau dann null, wenn es aufgeht']]);
    if(ab(n)<=BigInt(1e6))numberLine(a,n,r);else $('viz').innerHTML='';
    C.text('vizTag','residue '+bs(r)+' of '+bs(n));
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Teilen und abrunden','Berechnen Sie ⌊a/n⌋ und runden Sie in Richtung negativ unendlich.','⌊'+bs(a)+' ÷ '+bs(n)+'⌋ = <b>'+bs(q)+'</b>');
    st1('Zurückmultiplizieren und subtrahieren','a mod n = a − n·⌊a/n⌋.',bs(a)+' − '+bs(n)+' × '+bs(q)+' = '+bs(a)+' − '+bs(n*q)+' = <b>'+bs(r)+'</b>');
    st1('Bereich prüfen','Für n > 0 erfüllt das Ergebnis 0 ≤ (a mod n) < n.','0 ≤ '+bs(r)+' < '+bs(ab(n))+' ✓');
    $('steps').innerHTML=h1;C.text('stepsIntro',bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','Floor-Division');
    last='Modulo — calculatepilot.com/math/modulo-calculator.html\n'+a+' mod '+n+' = '+r+'\nabgeschnitten (C/JS) = '+rt;
    return;
  }
  if(m==='s2'){
    var B=readInt('b','b');if(B.err)return fail(B.err);
    var b=B.v,ra=floorMod(a,n),rb=floorMod(b,n),diff=a-b,cong=floorMod(diff,n)===0n;
    C.text('heroLbl','Sind sie kongruent?');C.text('resultValue',cong?'Ja — kongruent':'Nein — nicht kongruent');tg.textContent=cong?'a ≡ b (mod n)':'a ≢ b (mod n)';tg.className='sx-ef-grade'+(cong?'':' mid');
    C.text('ex1L','a mod n');C.text('ex1',bs(ra));C.text('ex2L','b mod n');C.text('ex2',bs(rb));
    C.text('interp',cong?bs(a)+' and '+bs(b)+' lassen denselben Rest modulo '+bs(n)+', sind also kongruent.':bs(a)+' and '+bs(b)+' lassen unterschiedliche Reste modulo '+bs(n)+', sind also nicht kongruent.');
    tiles([['a − b',bs(diff),'die Differenz'],['n teilt (a − b)?',cong?'Ja':'No','der Kongruenztest'],['a mod n',bs(ra),''],['b mod n',bs(rb),'']]);
    if(ab(n)<=BigInt(1e6)){numberLine(a,n,ra);}else $('viz').innerHTML='';
    C.text('vizTag',cong?'congruent':'nicht kongruent');
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Differenz berechnen','a ≡ b (mod n) gilt genau dann, wenn n die Differenz a − b teilt.',bs(a)+' − '+bs(b)+' = <b>'+bs(diff)+'</b>');
    st2('Teilbarkeit prüfen','Teilt n die Differenz ohne Rest, d. h. ist (a − b) mod n gleich 0?','('+bs(diff)+') mod '+bs(n)+' = <b>'+bs(floorMod(diff,n))+'</b>'+(cong?' → geht ohne Rest auf':' → geht nicht ohne Rest auf'));
    st2('Gegenprobe mit den einzelnen Resten','a mod n und b mod n sollten genau dann übereinstimmen, wenn sie kongruent sind.','a mod n = '+bs(ra)+',  b mod n = '+bs(rb)+' → '+(cong?'gleich ✓':'verschieden ✗'));
    $('steps').innerHTML=h2;C.text('stepsIntro','Prüfung von '+bs(a)+' ≡ '+bs(b)+' (mod '+bs(n)+').');C.text('stepsTag','Kongruenztest');
    last='Modulo-Kongruenz — calculatepilot.com/math/modulo-calculator.html\n'+a+' ≡ '+b+' (mod '+n+')? '+(cong?'Ja':'No');
    return;
  }
  if(m==='s3'){
    var g=gcd(a,n);
    if(g!==1n){
      C.text('heroLbl','Modulare Inverse');C.text('resultValue','existiert nicht');tg.textContent='gcd('+bs(a)+', '+bs(n)+') = '+bs(g)+' ≠ 1';tg.className='sx-ef-grade mid';
      C.text('ex1L','ggT(a, n)');C.text('ex1',bs(g));C.text('ex2L','Invertierbar?');C.text('ex2','No');
      C.text('interp','Eine modulare Inverse existiert nur, wenn ggT(a, n) = 1. Hier ist ggT('+bs(a)+', '+bs(n)+') = '+bs(g)+', also '+bs(a)+' hat keine Inverse modulo '+bs(n)+'.');
      tiles([['a',bs(a),''],['n',bs(n),''],['ggT(a, n)',bs(g),'muss 1 sein, damit eine Inverse existiert']]);
      $('viz').innerHTML='';C.text('vizTag','keine Inverse');
      $('steps').innerHTML='<li><span class="n">1</span><h4>ggT(a, n) prüfen</h4><span class="eq">ggT('+bs(a)+', '+bs(n)+') = <b>'+bs(g)+'</b> ≠ 1 → keine Inverse vorhanden</span></li>';
      C.text('stepsIntro','Modulare Inverse von '+bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','nicht invertierbar');
      last='Modulare Inverse — calculatepilot.com/math/modulo-calculator.html\n'+a+'⁻¹ mod '+n+': existiert nicht (ggT = '+g+')';
      return;
    }
    var eg=egcd(ab(a),ab(n)),x=eg.x*(a<0n?-1n:1n),inv=floorMod(x,n);
    C.text('heroLbl','Modulare Inverse a⁻¹ mod n');C.text('resultValue',bs(inv));tg.textContent='eindeutig modulo '+bs(n);
    C.text('ex1L','Probe: a · a⁻¹ mod n');C.text('ex1',bs(floorMod(a*inv,n))+' (sollte 1 sein)');
    C.text('ex2L','ggT(a, n)');C.text('ex2',bs(g));
    C.text('interp',bs(a)+' × '+bs(inv)+' ≡ 1 (mod '+bs(n)+'), also '+bs(inv)+' ist die eindeutige Inverse von '+bs(a)+' im Bereich [0, '+bs(n)+').');
    tiles([['a',bs(a),''],['n',bs(n),''],['Bézout: a·x + n·y = 1',bs(a)+'·('+bs(eg.x)+') + '+bs(n)+'·('+bs(eg.y)+') = 1',''],['Auf [0, n) reduziert',bs(inv),'die modulare Inverse']]);
    $('viz').innerHTML='';C.text('vizTag','a⁻¹ = '+bs(inv));
    var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('ggT(a, n) = 1 bestätigen','Eine Inverse existiert nur, wenn a und n keinen gemeinsamen Teiler haben.','gcd('+bs(a)+', '+bs(n)+') = <b>1</b>');
    st3('Erweiterten euklidischen Algorithmus ausführen','Bestimmen Sie ganze Zahlen x, y mit a·x + n·y = ggT(a, n) = 1.',bs(a)+'·('+bs(eg.x)+') + '+bs(n)+'·('+bs(eg.y)+') = 1');
    st3('x in den Bereich [0, n) reduzieren','x mod n liefert den Standardvertreter der Inversen.','('+bs(eg.x*(a<0n?-1n:1n))+') mod '+bs(n)+' = <b>'+bs(inv)+'</b>');
    st3('Prüfen','a × a⁻¹ sollte ≡ 1 (mod n) sein.',bs(a)+' × '+bs(inv)+' mod '+bs(n)+' = <b>'+bs(floorMod(a*inv,n))+'</b> ✓');
    $('steps').innerHTML=h3;C.text('stepsIntro','Modulare Inverse von '+bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','erweiterter euklidischer Algorithmus');
    last='Modulare Inverse — calculatepilot.com/math/modulo-calculator.html\n'+a+'⁻¹ mod '+n+' = '+inv;
    return;
  }
  /* s4: modular exponentiation */
  var B4=readInt('b','b (Exponent)');if(B4.err)return fail(B4.err);
  var bb=B4.v,neg=bb<0n;
  if(neg){
    var g4=gcd(a,n);
    if(g4!==1n)return fail('Ein negativer Exponent erfordert eine modulare Inverse von a, wofür ggT(a, n) = 1 nötig ist. Hier ist ggT = '+bs(g4)+'.');
  }
  var base=a,exp=neg?-bb:bb;
  if(neg){var eg4=egcd(ab(a),ab(n)),x4=eg4.x*(a<0n?-1n:1n);base=floorMod(x4,n);}
  var result=modpow(base,exp,n);
  C.text('heroLbl','aᵇ mod n');C.text('resultValue',bs(result));tg.textContent=neg?'über die modulare Inverse':'binäre Exponentiation';
  C.text('ex1L','Anzahl der Quadrierungen');C.text('ex1',String(exp.toString(2).length-1));
  C.text('ex2L','Basis modulo n reduziert');C.text('ex2',bs(floorMod(a,n))+(neg?' (danach invertiert)':''));
  C.text('interp','Berechnet durch schnelle Exponentiation: '+bs(a)+' wird wiederholt quadriert modulo '+bs(n)+', wobei die Quadrierungen kombiniert werden, die den Binärziffern von '+bs(bb)+'.');
  var bits=exp.toString(2);
  tiles([['a',bs(a),''],['b (Exponent)',bs(bb),''],['n (Modulus)',bs(n),''],['b binär',bits,bits.length+' Bits, '+(bits.length-1)+' squarings']]);
  $('viz').innerHTML='';C.text('vizTag','aᵇ mod n = '+bs(result));
  var n4=0,h4='';function st4(t,d,e){n4++;h4+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  if(neg)st4('Negativer Exponent: zuerst invertieren','a⁻¹ mod n existiert, da ggT(a, n) = 1; dann ist aᵇ = (a⁻¹)^|b|.','a⁻¹ mod '+bs(n)+' = <b>'+bs(base)+'</b>');
  st4('Exponent binär schreiben','Die schnelle Exponentiation verarbeitet jeweils ein Bit.',bs(exp)+' binär ist '+bits);
  st4('Quadrieren und multiplizieren','Quadrieren Sie in jedem Schritt das laufende Ergebnis; multiplizieren Sie die Basis hinzu, wenn das Bit 1 ist — und reduzieren Sie nach jeder Operation modulo n.','Ergebnis nach allen '+(bits.length-1)+' Quadrierungen: <b>'+bs(result)+'</b>');
  st4('Warum das schnell ist','Es sind nur etwa log₂(b) Multiplikationen nötig statt b − 1 — selbst ein riesiger Exponent ist daher sofort berechnet.','log₂('+bs(bb)+') ≈ '+(bits.length-1)+' Schritte gegenüber '+bs(bb)+' naiven Multiplikationen');
  $('steps').innerHTML=h4;C.text('stepsIntro',bs(a)+'^'+bs(bb)+' mod '+bs(n)+'.');C.text('stepsTag','schnelle Exponentiation');
  last='Modulare Potenz — calculatepilot.com/math/modulo-calculator.html\n'+a+'^'+bb+' mod '+n+' = '+result;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'mdCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b0=e.target.closest('button[data-m]');if(!b0)return;C.set('mode',b0.getAttribute('data-m'));C.set('a',b0.getAttribute('data-a'));if(b0.hasAttribute('data-b'))C.set('b',b0.getAttribute('data-b'));C.set('n',b0.getAttribute('data-n'));fire('a');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
