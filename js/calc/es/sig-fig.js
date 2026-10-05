/* Significant figures calculator — CalculatePilot (Stitch redesign).
   Digit classification: non-zero always significant; captive zeros (between non-zero digits) significant;
   leading zeros never significant; trailing zeros significant only when a decimal point is present.
   Rounding: exact half-to-even (banker's) rounding performed on the digit string, not on the floating-point value. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';

function parseNum(raw){
  var s=String(raw||'').trim();
  if(!s)throw 'Introduce un número.';
  var neg=false;
  if(s[0]==='+'||s[0]==='-'){neg=s[0]==='-';s=s.slice(1);}
  var m=s.match(/^(\d*)(\.(\d*))?([eE]([+-]?\d+))?$/);
  if(!m||(!m[1]&&!m[3]))throw 'No se pudo interpretar "'+raw+'" como número.';
  var intPart=m[1]||'0',fracPart=m[3]||'',explicitExp=m[5]?parseInt(m[5],10):0;
  var hasDecimal=m[2]!==undefined;
  var allDigits=intPart+fracPart;
  return {neg:neg,intPart:intPart,fracPart:fracPart,hasDecimal:hasDecimal,explicitExp:explicitExp,allDigits:allDigits};
}
function analyze(p){
  var d=p.allDigits;
  var fnz=-1,lnz=-1;
  for(var i=0;i<d.length;i++)if(d[i]!=='0'){if(fnz<0)fnz=i;lnz=i;}
  var allZero=fnz<0;
  var E=p.intPart.length-1-(allZero?0:fnz)+p.explicitExp;
  var sigStart=allZero?0:fnz;
  var sigEnd;
  if(p.hasDecimal)sigEnd=d.length-1;
  else sigEnd=allZero?-1:lnz;
  var sigDigits=allZero?(p.hasDecimal?d.slice(sigStart):'0'):(sigEnd>=sigStart?d.slice(sigStart,sigEnd+1):'');
  var leadingZeros=allZero?0:fnz;
  var captiveZeros=0;
  if(!allZero)for(i=fnz+1;i<lnz;i++)if(d[i]==='0')captiveZeros++;
  var trailingZerosSig=0,trailingZerosAmbig=0;
  if(!allZero){
    var tz=d.length-1-lnz;
    if(p.hasDecimal)trailingZerosSig=tz;else trailingZerosAmbig=tz;
  }
  var nonZeroCount=0;for(i=0;i<d.length;i++)if(d[i]!=='0')nonZeroCount++;
  var sigCount=allZero?(p.hasDecimal?d.length:1):(nonZeroCount+captiveZeros+trailingZerosSig);
  return {digits:d,fnz:allZero?0:fnz,lnz:allZero?d.length-1:lnz,allZero:allZero,E:E,sigDigits:sigDigits,sigCount:sigCount,
    leadingZeros:leadingZeros,captiveZeros:captiveZeros,trailingZerosSig:trailingZerosSig,trailingZerosAmbig:trailingZerosAmbig,nonZeroCount:nonZeroCount,
    intLen:p.intPart.length,hasDecimal:p.hasDecimal,neg:p.neg};
}
/* round the significant-digit string `D` to K digits, half-to-even. Returns {digits, carried} */
function roundDigits(D,K){
  if(K>=D.length)return {digits:D,carried:false};
  var kept=D.slice(0,K),rest=D.slice(K);
  var first=rest[0],roundUp;
  if(first>'5')roundUp=true;
  else if(first<'5')roundUp=false;
  else{
    var moreNonzero=/[1-9]/.test(rest.slice(1));
    if(moreNonzero)roundUp=true;
    else roundUp=(parseInt(kept[K-1],10)%2===1);
  }
  var carried=false;
  if(roundUp){
    var arr=kept.split('').map(Number),i=arr.length-1,carry=1;
    while(i>=0&&carry){arr[i]+=carry;if(arr[i]===10){arr[i]=0;carry=1;}else carry=0;i--;}
    if(carry){arr.unshift(1);carried=true;}
    kept=arr.join('');
    if(kept.length>K)kept=kept.slice(0,K);
  }
  return {digits:kept,carried:carried};
}
function fmtSci(digits,E,neg){
  var m=digits.length>1?digits[0]+'.'+digits.slice(1):digits[0];
  return (neg?'−':'')+m+' × 10<sup>'+E+'</sup>';
}
function fmtDecimal(digits,E,neg){
  var s;
  if(E>=0){
    if(digits.length<=E+1)s=digits+'0'.repeat(E+1-digits.length);
    else s=digits.slice(0,E+1)+'.'+digits.slice(E+1);
  }else{
    s='0.'+'0'.repeat(-E-1)+digits;
  }
  return (neg?'−':'')+s;
}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function digitViz(p,a){
  var d=a.digits,parts=[];
  var pos=0;
  for(var i=0;i<d.length;i++){
    var cls,label;
    if(!a.allZero&&i<a.fnz){cls='#94a3b8';label='leading';}
    else if(!a.allZero&&i>a.fnz&&i<a.lnz&&d[i]==='0'){cls='#059669';label='captive';}
    else if(!a.allZero&&i>a.lnz){cls=a.hasDecimal?'#059669':'#d97706';label=a.hasDecimal?'ceros finales (sig.)':'ceros finales (ambig.)';}
    else{cls='#0f172a';label='sig.';}
    parts.push('<span style="display:inline-block;min-width:26px;text-align:center;padding:6px 4px;margin:2px;border-radius:6px;background:'+cls+';color:#fff;font:700 16px var(--font-mono)" title="'+esc(label)+'">'+esc(d[i])+'</span>');
    pos++;
    if(p.hasDecimal&&i===p.intPart.length-1)parts.push('<span style="display:inline-block;padding:6px 2px;font:700 16px var(--font-mono);color:var(--sx-on)">.</span>');
  }
  var legend='<div style="margin-top:10px;font-size:12px;color:var(--sx-muted)"><span style="color:#0f172a">■</span> significativo &nbsp; <span style="color:#94a3b8">■</span> cero inicial (no sig.) &nbsp; <span style="color:#059669">■</span> cero intermedio/final sig. &nbsp; <span style="color:#d97706">■</span> final, ambiguo</div>';
  $('viz').innerHTML='<div style="display:flex;flex-wrap:wrap;align-items:center">'+parts.join('')+'</div>'+legend;
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fK').hidden=(m!=='s1');$('fArith').hidden=(m!=='s2');
  C.html('formH',m==='s1'?'Contar y redondear cifras significativas':'Aritmética con cifras significativas');

  if(m==='s1'){
    var p;try{p=parseNum($('v').value);}catch(e){return fail(String(e));}
    var a=analyze(p),K=+$('k').value;
    C.text('heroLbl','Cifras significativas');C.text('resultValue',String(a.sigCount));tg.textContent=a.sigCount+' cifra sig.'+(a.sigCount===1?'':'s');
    C.html('ex1L','Notación científica');C.html('ex1',fmtSci(a.sigDigits||'0',a.E,a.neg));
    var rd=roundDigits(a.sigDigits||'0',Math.min(K,(a.sigDigits||'0').length)),rE=a.E+(rd.carried?1:0);
    var roundNote=K>=a.sigCount?'ya tiene ≤ '+K+' cifras sig. — sin cambios':fmtDecimal(rd.digits,rE,a.neg);
    C.text('ex2L','Redondear a '+K+' cifra sig.'+(K===1?'':'s'));C.html('ex2',K>=a.sigCount?esc(fmtDecimal(a.sigDigits||'0',a.E,a.neg)):fmtDecimal(rd.digits,rE,a.neg));
    C.html('fxNow',esc($('v').value)+' &nbsp;→&nbsp; '+a.sigCount+' cifra significativa'+(a.sigCount===1?'':'s'));
    C.text('interp',a.trailingZerosAmbig>0?'Este número tiene '+a.trailingZerosAmbig+' cero final'+(a.trailingZerosAmbig===1?'':'s')+' sin punto decimal, lo cual es ambiguo: escríbelo en notación científica para aclarar la precisión.':'Abajo se muestra la función de cada dígito: los ceros iniciales nunca cuentan; los ceros intermedios y (con punto decimal) los finales sí.');
    tiles([
      ['Ceros iniciales (no significativos)',String(a.leadingZeros),''],
      ['Ceros intermedios (significativos)',String(a.captiveZeros),'entre dos dígitos distintos de cero'],
      ['Ceros finales, significativos',String(a.trailingZerosSig),'presentes porque hay un punto decimal'],
      ['Ceros finales, ambiguos',String(a.trailingZerosAmbig),'sin punto decimal — no se cuentan aquí'],
      ['Dígitos distintos de cero',String(a.nonZeroCount),'siempre significativos'],
      ['Orden de magnitud (10ⁿ)',String(a.E),'exponente del primer dígito']
    ]);
    digitViz(p,a);C.text('vizTag',a.sigCount+' of '+a.digits.length+' dígitos significativos');
    var n=0,h='';function st(t,d0,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Halla la primera cifra significativa','Recorre de izquierda a derecha; el primer dígito distinto de cero inicia la secuencia significativa (los ceros iniciales nunca cuentan).',a.allZero?'el valor es 0':'cifra "'+a.digits[a.fnz]+'" en la posición '+(a.fnz+1));
    st('Decide dónde termina la secuencia significativa','Con punto decimal, llega hasta el último dígito escrito (los ceros finales cuentan). Sin él, se detiene en el último dígito distinto de cero.',a.hasDecimal?'termina en el último dígito escrito (hay punto decimal)':'termina en el último dígito distinto de cero (sin punto decimal)');
    st('Cuenta los dígitos intermedios','Cada dígito, desde la primera hasta la última posición significativa, cuenta, sea cero o no.',(a.sigDigits||'0')+' → <b>'+a.sigCount+' cifra significativa'+(a.sigCount===1?'':'s')+'</b>');
    if(K<a.sigCount)st('Redondear a '+K+' cifra sig.'+(K===1?'':'s'),'Conserva los primeros '+K+' dígitos significativos; redondea el siguiente con el método de redondeo al par.',(a.sigDigits||'0')+' → <b>'+rd.digits+'</b>'+(rd.carried?' (el redondeo se propagó a un nuevo dígito inicial)':''));
    $('steps').innerHTML=h;C.text('stepsIntro','Analizando '+esc($('v').value)+'.');C.text('stepsTag',a.sigCount+' cifras sig.');
    last='Cifras significativas — calculatepilot.com/math/sig-fig-calculator.html\n'+$('v').value+' has '+a.sigCount+' cifras significativas\ncientífica: '+(a.sigDigits||'0')+' x 10^'+a.E+(K<a.sigCount?'\nredondeado a '+K+' s.f.: '+fmtDecimal(rd.digits,rE,a.neg).replace(/<[^>]+>/g,''):'');
    return;
  }

  /* s2: arithmetic — exact BigInt decimal math throughout, so half-to-even ties are never decided by
     binary floating-point noise (e.g. 4.5 x 2.10 must be exactly 9.450, not 9.450000000000001). */
  var pa,pb;try{pa=parseNum($('opA').value);}catch(e){return fail('A: '+String(e));}
  try{pb=parseNum($('opB').value);}catch(e){return fail('B: '+String(e));}
  if(pa.explicitExp||pb.explicitExp)return fail('La notación científica no es compatible con el modo aritmético: introduce un decimal simple.');
  var aa=analyze(pa),ab2=analyze(pb),op=$('op').value;
  function toExact(p){return {mantissa:BigInt((p.intPart+p.fracPart)||'0'),scale:p.fracPart.length,neg:p.neg};}
  function bigDecStr(mantissa,scale){var s=mantissa.toString();if(scale===0)return s;while(s.length<=scale)s='0'+s;return s.slice(0,s.length-scale)+'.'+s.slice(s.length-scale);}
  function roundMantissa(mantissa,fromScale,toScale){
    if(toScale>=fromScale)return mantissa*(10n**BigInt(toScale-fromScale));
    var divisor=10n**BigInt(fromScale-toScale),q=mantissa/divisor,r=mantissa%divisor,half=divisor/2n;
    var up=r>half||(r===half&&(q%2n===1n));
    return up?q+1n:q;
  }
  var A=toExact(pa),B=toExact(pb);
  function decPlaces(p){return p.hasDecimal?p.fracPart.length:0;}
  var targetDP=Math.min(decPlaces(pa),decPlaces(pb));
  var targetSF=Math.min(aa.sigCount,ab2.sigCount);
  var opSym,ruleType,rawStr,resultStr,rneg;
  if(op==='add'||op==='sub'){
    opSym=op==='add'?'+':'−';ruleType='dp';
    var scale=Math.max(A.scale,B.scale);
    var Am=A.mantissa*(10n**BigInt(scale-A.scale))*(A.neg?-1n:1n);
    var Bm=B.mantissa*(10n**BigInt(scale-B.scale))*(B.neg?-1n:1n)*(op==='sub'?-1n:1n);
    var sum=Am+Bm;rneg=sum<0n;if(rneg)sum=-sum;
    rawStr=(rneg&&sum!==0n?'−':'')+bigDecStr(sum,scale);
    var rq=roundMantissa(sum,scale,targetDP);
    resultStr=(rneg&&rq!==0n?'−':'')+bigDecStr(rq,targetDP);
  }else{
    ruleType='sf';
    if(op==='mul'){
      opSym='×';
      var prod=A.mantissa*B.mantissa,pscale=A.scale+B.scale;
      rneg=(A.neg!==B.neg);
      rawStr=(rneg&&prod!==0n?'−':'')+bigDecStr(prod,pscale);
      var rp=parseNum(bigDecStr(prod,pscale)||'0'),ra=analyze(rp);
      var rd2=roundDigits(ra.sigDigits||'0',Math.min(targetSF,(ra.sigDigits||'0').length)),rE2=ra.E+(rd2.carried?1:0);
      resultStr=fmtDecimal(rd2.digits,rE2,rneg);
    }else{
      opSym='÷';
      if(B.mantissa===0n)return fail('No se puede dividir entre cero.');
      rneg=(A.neg!==B.neg);
      var guard=40,num=A.mantissa*(10n**BigInt(guard)),q=num/B.mantissa,qscale=guard+A.scale-B.scale;
      /* normalise so qscale >= 0 for bigDecStr */
      if(qscale<0){q=q*(10n**BigInt(-qscale));qscale=0;}
      rawStr=(rneg&&q!==0n?'−':'')+bigDecStr(q,qscale)+'…';
      var rp2=parseNum(bigDecStr(q,qscale)||'0'),ra2=analyze(rp2);
      var rd3=roundDigits(ra2.sigDigits||'0',Math.min(targetSF,(ra2.sigDigits||'0').length)),rE3=ra2.E+(rd3.carried?1:0);
      resultStr=fmtDecimal(rd3.digits,rE3,rneg);
    }
  }
  C.text('heroLbl','A '+opSym+' B, con cifras sig. correctas');C.html('resultValue',resultStr);
  tg.textContent=ruleType==='dp'?targetDP+' posición decimal'+(targetDP===1?'':'s'):targetSF+' cifra sig.'+(targetSF===1?'':'s');
  C.text('ex1L','Resultado sin redondear');C.text('ex1',rawStr.replace(/<[^>]+>/g,''));
  C.text('ex2L','Regla aplicada');C.text('ex2',ruleType==='dp'?'menos posiciones decimales ('+targetDP+')':'menos cifras significativas ('+targetSF+')');
  C.html('fxNow',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+' = '+resultStr);
  C.text('interp',ruleType==='dp'?'La suma y la resta están limitadas por las posiciones decimales: la respuesta conserva solo tantas posiciones decimales como el operando menos preciso.':'La multiplicación y la división están limitadas por las cifras significativas: la respuesta conserva solo tantas cifras sig. como el operando menos preciso.');
  tiles([
    ['A',$('opA').value,aa.sigCount+' cifras sig., '+decPlaces(pa)+' dp'],
    ['B',$('opB').value,ab2.sigCount+' cifras sig., '+decPlaces(pb)+' dp'],
    ['Resultado sin redondear',rawStr.replace(/<[^>]+>/g,''),'antes de aplicar la regla de cifras sig.'],
    ['Resultado redondeado',resultStr.replace(/<[^>]+>/g,''),ruleType==='dp'?targetDP+' posiciones decimales':targetSF+' cifras sig.']
  ]);
  $('viz').innerHTML='';C.text('vizTag',ruleType==='dp'?'regla de posiciones decimales':'regla de cifras sig.');
  var n2=0,h2='';function st2(t,d0,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st2('Calcula el resultado exacto','Haz la operación sin redondear primero.',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+' = <b>'+rawStr.replace(/<[^>]+>/g,'')+'</b>');
  if(ruleType==='dp'){
    st2('Encuentra el operando con menos posiciones decimales','La suma y la resta solo pueden ser tan precisas como la medición menos precisa.','A tiene '+decPlaces(pa)+' pd, B tiene '+decPlaces(pb)+' pd → usa <b>'+targetDP+'</b>');
    st2('Redondea el resultado a esa cantidad de posiciones decimales',null,'<b>'+resultStr+'</b>');
  }else{
    st2('Encuentra el operando con menos cifras significativas','La multiplicación y la división solo pueden ser tan precisas como la medición menos precisa.','A tiene '+aa.sigCount+' c.s., B tiene '+ab2.sigCount+' c.s. → usa <b>'+targetSF+'</b>');
    st2('Redondea el resultado a esa cantidad de cifras significativas',null,'<b>'+resultStr+'</b>');
  }
  $('steps').innerHTML=h2;C.text('stepsIntro',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+'.');C.text('stepsTag',ruleType==='dp'?'regla de posiciones decimales':'regla de cifras sig.');
  last='Aritmética de cifras sig. — calculatepilot.com/math/sig-fig-calculator.html\n'+$('opA').value+' '+opSym+' '+$('opB').value+' = '+resultStr.replace(/<[^>]+>/g,'')+' (unrounded '+rawStr.replace(/<[^>]+>/g,'')+')';
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sfCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('mode',b.getAttribute('data-m'));C.set('v',b.getAttribute('data-v'));C.set('k',b.getAttribute('data-k'));fire('v');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
