/* Modulo calculator — CalculatePilot (Stitch redesign). Exact BigInt arithmetic.
   Floored mod: a - n*floor(a/n). Extended Euclidean algorithm for the modular inverse.
   Fast (binary) modular exponentiation for a^b mod n. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function ab(x){return x<0n?-x:x;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function bs(b){var s=b.toString();return s.length>50?s.slice(0,12)+'…'+s.slice(-6)+' ('+s.length+' dígitos)':grp(s);}
function readInt(id,label){var s=String($(id).value).trim().replace(/[,\s_]/g,'');if(!/^-?\d+$/.test(s))return {err:label+' debe ser un número entero (solo dígitos).'};if(s.replace('-','').length>2000)return {err:label+' es demasiado largo.'};return {v:BigInt(s)};}
function floorMod(a,n){var r=a%n;if(r!==0n&&((r<0n)!==(n<0n)))r+=n;return r;}
function truncMod(a,n){return a%n;}
function floorDiv(a,n){var q=a/n;if((a%n!==0n)&&((a<0n)!==(n<0n)))q-=1n;return q;}
function gcd(a,b){a=ab(a);b=ab(b);while(b){var t=a%b;a=b;b=t;}return a;}
function egcd(a,b){var x0=1n,y0=0n,x1=0n,y1=1n,r0=a,r1=b;while(r1!==0n){var q=r0/r1,t;t=r0-q*r1;r0=r1;r1=t;t=x0-q*x1;x0=x1;x1=t;t=y0-q*y1;y0=y1;y1=t;}if(r0<0n){r0=-r0;x0=-x0;y0=-y0;}return {g:r0,x:x0,y:y0};}
function modpow(a,b,n){if(n===1n)return 0n;a=floorMod(a,n);var r=1n;if(b<0n)return null; /* negative exponent handled by caller via inverse */
  while(b>0n){if(b&1n)r=floorMod(r*a,n);a=floorMod(a*a,n);b>>=1n;}return r;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function numberLine(a,n,r){
  var W=760,H=140,pad=40;
  var nn=Number(ab(n))||1,lo=-nn*2,hi=nn*3,rN=Number(r);
  if(nn>1000){lo=-3;hi=4;}
  var kx=(W-2*pad)/(hi-lo),X=function(x){return pad+(x-lo)*kx;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="70" y2="70" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  for(var k=Math.ceil(lo/nn);k*nn<=hi;k++){var x=X(k*nn);s+='<line x1="'+x.toFixed(1)+'" x2="'+x.toFixed(1)+'" y1="62" y2="78" stroke="var(--sx-border)" stroke-width="1.5"/><text class="ax" x="'+x.toFixed(1)+'" y="96" text-anchor="middle">'+esc(String(k*nn))+'</text>';}
  if(nn<=1000){var xr=X(rN);s+='<circle cx="'+xr.toFixed(1)+'" cy="70" r="7" fill="#059669"/><text class="ax" x="'+xr.toFixed(1)+'" y="50" text-anchor="middle" style="font-weight:700;fill:var(--sx-on)">residuo '+esc(String(rN))+'</text>';}
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fB').hidden=(m==='s1'||m==='s3');
  C.text('bL',m==='s2'?'b':'b (exponente)');
  var labels={s1:'a mod n',s2:'Congruencia a ≡ b (mod n)',s3:'Inverso modular a⁻¹ mod n',s4:'Exponenciación modular aᵇ mod n'};
  C.html('formH',labels[m]);
  var A=readInt('a','a');if(A.err)return fail(A.err);
  var N=readInt('n','n');if(N.err)return fail(N.err);
  if(N.v===0n)return fail('n (el módulo) no puede ser 0: la división entre cero no está definida.');
  var a=A.v,n=N.v;
  C.html('fxNow',(m==='s1'?bs(a)+' mod '+bs(n):m==='s3'?bs(a)+'⁻¹ mod '+bs(n):m==='s4'?bs(a)+'^b mod '+bs(n):bs(a)+' ≡ ? (mod '+bs(n)+')'));

  if(m==='s1'){
    var r=floorMod(a,n),rt=truncMod(a,n),q=floorDiv(a,n);
    C.text('heroLbl','a mod n (con piso)');C.text('resultValue',bs(r));tg.textContent='convención de piso';
    C.text('ex1L','Residuo truncado (estilo C/JS)');C.text('ex1',bs(rt));
    C.text('ex2L','Cociente ⌊a/n⌋');C.text('ex2',bs(q));
    C.text('interp',bs(a)+' dividido entre '+bs(n)+' deja un residuo de '+bs(r)+', usando la convención matemática (con piso), donde el resultado siempre tiene el mismo signo que n.');
    tiles([['a',bs(a),''],['n',bs(n),''],['⌊a/n⌋',bs(q),'parte entera inferior del cociente'],['a − n·⌊a/n⌋',bs(a)+' − '+bs(n)+'×'+bs(q)+' = '+bs(r),'el resultado del módulo'],['¿Mismo signo que n?',(r===0n||(r<0n)===(n<0n))?'Sí':'No','propiedad de la convención de piso'],['¿Es a divisible entre n?',r===0n?'Sí':'No','el residuo es cero exactamente cuando divide']]);
    if(ab(n)<=BigInt(1e6))numberLine(a,n,r);else $('viz').innerHTML='';
    C.text('vizTag','residue '+bs(r)+' of '+bs(n));
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Divide y aplica el piso','Calcula ⌊a/n⌋, redondeando hacia menos infinito.','⌊'+bs(a)+' ÷ '+bs(n)+'⌋ = <b>'+bs(q)+'</b>');
    st1('Multiplica de vuelta y resta','a mod n = a − n·⌊a/n⌋.',bs(a)+' − '+bs(n)+' × '+bs(q)+' = '+bs(a)+' − '+bs(n*q)+' = <b>'+bs(r)+'</b>');
    st1('Comprueba el rango','Para n > 0, el resultado cumple 0 ≤ (a mod n) < n.','0 ≤ '+bs(r)+' < '+bs(ab(n))+' ✓');
    $('steps').innerHTML=h1;C.text('stepsIntro',bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','división con piso');
    last='Módulo — calculatepilot.com/math/modulo-calculator.html\n'+a+' mod '+n+' = '+r+'\ntruncado (C/JS) = '+rt;
    return;
  }
  if(m==='s2'){
    var B=readInt('b','b');if(B.err)return fail(B.err);
    var b=B.v,ra=floorMod(a,n),rb=floorMod(b,n),diff=a-b,cong=floorMod(diff,n)===0n;
    C.text('heroLbl','¿Son congruentes?');C.text('resultValue',cong?'Sí — congruentes':'No — no congruentes');tg.textContent=cong?'a ≡ b (mod n)':'a ≢ b (mod n)';tg.className='sx-ef-grade'+(cong?'':' mid');
    C.text('ex1L','a mod n');C.text('ex1',bs(ra));C.text('ex2L','b mod n');C.text('ex2',bs(rb));
    C.text('interp',cong?bs(a)+' and '+bs(b)+' dejan el mismo residuo mod '+bs(n)+', así que son congruentes.':bs(a)+' and '+bs(b)+' dejan residuos distintos mod '+bs(n)+', así que no son congruentes.');
    tiles([['a − b',bs(diff),'la diferencia'],['¿n divide a (a − b)?',cong?'Sí':'No','la prueba de congruencia'],['a mod n',bs(ra),''],['b mod n',bs(rb),'']]);
    if(ab(n)<=BigInt(1e6)){numberLine(a,n,ra);}else $('viz').innerHTML='';
    C.text('vizTag',cong?'congruent':'no congruentes');
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Calcula la diferencia','a ≡ b (mod n) exactamente cuando n divide a a − b.',bs(a)+' − '+bs(b)+' = <b>'+bs(diff)+'</b>');
    st2('Comprueba la divisibilidad','¿Divide n exactamente a la diferencia, es decir, es (a − b) mod n igual a 0?','('+bs(diff)+') mod '+bs(n)+' = <b>'+bs(floorMod(diff,n))+'</b>'+(cong?' → divide exactamente':' → no divide exactamente'));
    st2('Verifica con los residuos individuales','a mod n y b mod n deben coincidir exactamente cuando son congruentes.','a mod n = '+bs(ra)+',  b mod n = '+bs(rb)+' → '+(cong?'iguales ✓':'distintos ✗'));
    $('steps').innerHTML=h2;C.text('stepsIntro','Probando '+bs(a)+' ≡ '+bs(b)+' (mod '+bs(n)+').');C.text('stepsTag','prueba de congruencia');
    last='Congruencia modular — calculatepilot.com/math/modulo-calculator.html\n'+a+' ≡ '+b+' (mod '+n+')? '+(cong?'Sí':'No');
    return;
  }
  if(m==='s3'){
    var g=gcd(a,n);
    if(g!==1n){
      C.text('heroLbl','Inverso modular');C.text('resultValue','no existe');tg.textContent='gcd('+bs(a)+', '+bs(n)+') = '+bs(g)+' ≠ 1';tg.className='sx-ef-grade mid';
      C.text('ex1L','mcd(a, n)');C.text('ex1',bs(g));C.text('ex2L','¿Es invertible?');C.text('ex2','No');
      C.text('interp','Un inverso modular existe solo cuando mcd(a, n) = 1. Aquí mcd('+bs(a)+', '+bs(n)+') = '+bs(g)+', así que '+bs(a)+' no tiene inverso mod '+bs(n)+'.');
      tiles([['a',bs(a),''],['n',bs(n),''],['mcd(a, n)',bs(g),'debe ser igual a 1 para que exista un inverso']]);
      $('viz').innerHTML='';C.text('vizTag','sin inverso');
      $('steps').innerHTML='<li><span class="n">1</span><h4>Comprueba mcd(a, n)</h4><span class="eq">mcd('+bs(a)+', '+bs(n)+') = <b>'+bs(g)+'</b> ≠ 1 → no existe inverso</span></li>';
      C.text('stepsIntro','Inverso modular de '+bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','no invertible');
      last='Inverso modular — calculatepilot.com/math/modulo-calculator.html\n'+a+'⁻¹ mod '+n+': no existe (mcd = '+g+')';
      return;
    }
    var eg=egcd(ab(a),ab(n)),x=eg.x*(a<0n?-1n:1n),inv=floorMod(x,n);
    C.text('heroLbl','Inverso modular a⁻¹ mod n');C.text('resultValue',bs(inv));tg.textContent='único mod '+bs(n);
    C.text('ex1L','Comprobación: a · a⁻¹ mod n');C.text('ex1',bs(floorMod(a*inv,n))+' (debe ser 1)');
    C.text('ex2L','mcd(a, n)');C.text('ex2',bs(g));
    C.text('interp',bs(a)+' × '+bs(inv)+' ≡ 1 (mod '+bs(n)+'), así que '+bs(inv)+' es el único inverso de '+bs(a)+' en el rango [0, '+bs(n)+').');
    tiles([['a',bs(a),''],['n',bs(n),''],['Bézout: a·x + n·y = 1',bs(a)+'·('+bs(eg.x)+') + '+bs(n)+'·('+bs(eg.y)+') = 1',''],['Reducido a [0, n)',bs(inv),'el inverso modular']]);
    $('viz').innerHTML='';C.text('vizTag','a⁻¹ = '+bs(inv));
    var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st3('Confirma que mcd(a, n) = 1','Un inverso existe solo cuando a y n no comparten ningún factor común.','gcd('+bs(a)+', '+bs(n)+') = <b>1</b>');
    st3('Ejecuta el algoritmo de Euclides extendido','Encuentra enteros x, y tales que a·x + n·y = mcd(a, n) = 1.',bs(a)+'·('+bs(eg.x)+') + '+bs(n)+'·('+bs(eg.y)+') = 1');
    st3('Reduce x al rango [0, n)','x mod n da el representante estándar del inverso.','('+bs(eg.x*(a<0n?-1n:1n))+') mod '+bs(n)+' = <b>'+bs(inv)+'</b>');
    st3('Verificar','a × a⁻¹ debe ser ≡ 1 (mod n).',bs(a)+' × '+bs(inv)+' mod '+bs(n)+' = <b>'+bs(floorMod(a*inv,n))+'</b> ✓');
    $('steps').innerHTML=h3;C.text('stepsIntro','Inverso modular de '+bs(a)+' mod '+bs(n)+'.');C.text('stepsTag','Euclides extendido');
    last='Inverso modular — calculatepilot.com/math/modulo-calculator.html\n'+a+'⁻¹ mod '+n+' = '+inv;
    return;
  }
  /* s4: modular exponentiation */
  var B4=readInt('b','b (exponente)');if(B4.err)return fail(B4.err);
  var bb=B4.v,neg=bb<0n;
  if(neg){
    var g4=gcd(a,n);
    if(g4!==1n)return fail('Un exponente negativo requiere el inverso modular de a, lo cual exige mcd(a, n) = 1. Aquí mcd = '+bs(g4)+'.');
  }
  var base=a,exp=neg?-bb:bb;
  if(neg){var eg4=egcd(ab(a),ab(n)),x4=eg4.x*(a<0n?-1n:1n);base=floorMod(x4,n);}
  var result=modpow(base,exp,n);
  C.text('heroLbl','aᵇ mod n');C.text('resultValue',bs(result));tg.textContent=neg?'mediante el inverso modular':'exponenciación binaria';
  C.text('ex1L','Número de cuadrados');C.text('ex1',String(exp.toString(2).length-1));
  C.text('ex2L','Base reducida mod n');C.text('ex2',bs(floorMod(a,n))+(neg?' (luego invertida)':''));
  C.text('interp','Calculado con exponenciación rápida: '+bs(a)+' se eleva al cuadrado repetidamente mod '+bs(n)+', combinando los cuadrados que corresponden a los dígitos binarios de '+bs(bb)+'.');
  var bits=exp.toString(2);
  tiles([['a',bs(a),''],['b (exponente)',bs(bb),''],['n (módulo)',bs(n),''],['b en binario',bits,bits.length+' bits, '+(bits.length-1)+' squarings']]);
  $('viz').innerHTML='';C.text('vizTag','aᵇ mod n = '+bs(result));
  var n4=0,h4='';function st4(t,d,e){n4++;h4+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  if(neg)st4('Exponente negativo: invierte primero','a⁻¹ mod n existe porque mcd(a, n) = 1; entonces aᵇ = (a⁻¹)^|b|.','a⁻¹ mod '+bs(n)+' = <b>'+bs(base)+'</b>');
  st4('Escribe el exponente en binario','La exponenciación rápida procesa un bit a la vez.',bs(exp)+' en binario es '+bits);
  st4('Eleva al cuadrado y multiplica','Eleva al cuadrado el resultado acumulado en cada paso; multiplica por la base siempre que el bit sea 1, reduciendo mod n tras cada operación.','resultado tras los '+(bits.length-1)+' cuadrados: <b>'+bs(result)+'</b>');
  st4('Por qué es rápido','Solo se necesitan unas log₂(b) multiplicaciones, en lugar de b − 1, así que incluso un exponente enorme es instantáneo.','log₂('+bs(bb)+') ≈ '+(bits.length-1)+' pasos frente a '+bs(bb)+' multiplicaciones directas');
  $('steps').innerHTML=h4;C.text('stepsIntro',bs(a)+'^'+bs(bb)+' mod '+bs(n)+'.');C.text('stepsTag','exponenciación rápida');
  last='Exponenciación modular — calculatepilot.com/math/modulo-calculator.html\n'+a+'^'+bb+' mod '+n+' = '+result;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'mdCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b0=e.target.closest('button[data-m]');if(!b0)return;C.set('mode',b0.getAttribute('data-m'));C.set('a',b0.getAttribute('data-a'));if(b0.hasAttribute('data-b'))C.set('b',b0.getAttribute('data-b'));C.set('n',b0.getAttribute('data-n'));fire('a');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
