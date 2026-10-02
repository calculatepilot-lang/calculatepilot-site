/* Significant figures calculator — CalculatePilot (Stitch redesign).
   Digit classification: non-zero always significant; captive zeros (between non-zero digits) significant;
   leading zeros never significant; trailing zeros significant only when a decimal point is present.
   Rounding: exact half-to-even (banker's) rounding performed on the digit string, not on the floating-point value. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';

function parseNum(raw){
  var s=String(raw||'').trim();
  if(!s)throw 'Geben Sie eine Zahl ein.';
  var neg=false;
  if(s[0]==='+'||s[0]==='-'){neg=s[0]==='-';s=s.slice(1);}
  var m=s.match(/^(\d*)(\.(\d*))?([eE]([+-]?\d+))?$/);
  if(!m||(!m[1]&&!m[3]))throw 'Nicht interpretierbar: "'+raw+'“ als Zahl.';
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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function digitViz(p,a){
  var d=a.digits,parts=[];
  var pos=0;
  for(var i=0;i<d.length;i++){
    var cls,label;
    if(!a.allZero&&i<a.fnz){cls='#94a3b8';label='leading';}
    else if(!a.allZero&&i>a.fnz&&i<a.lnz&&d[i]==='0'){cls='#059669';label='captive';}
    else if(!a.allZero&&i>a.lnz){cls=a.hasDecimal?'#059669':'#d97706';label=a.hasDecimal?'nachgestellt (sig.)':'nachgestellt (mehrdeut.)';}
    else{cls='#0f172a';label='sig.';}
    parts.push('<span style="display:inline-block;min-width:26px;text-align:center;padding:6px 4px;margin:2px;border-radius:6px;background:'+cls+';color:#fff;font:700 16px var(--font-mono)" title="'+esc(label)+'">'+esc(d[i])+'</span>');
    pos++;
    if(p.hasDecimal&&i===p.intPart.length-1)parts.push('<span style="display:inline-block;padding:6px 2px;font:700 16px var(--font-mono);color:var(--sx-on)">.</span>');
  }
  var legend='<div style="margin-top:10px;font-size:12px;color:var(--sx-muted)"><span style="color:#0f172a">■</span> signifikant &nbsp; <span style="color:#94a3b8">■</span> führende Null (nicht sig.) &nbsp; <span style="color:#059669">■</span> eingeschlossen/nachgestellt sig. &nbsp; <span style="color:#d97706">■</span> nachgestellt, mehrdeutig</div>';
  $('viz').innerHTML='<div style="display:flex;flex-wrap:wrap;align-items:center">'+parts.join('')+'</div>'+legend;
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fK').hidden=(m!=='s1');$('fArith').hidden=(m!=='s2');
  C.html('formH',m==='s1'?'Signifikante Stellen zählen &amp; runden':'Rechnen mit signifikanten Stellen');

  if(m==='s1'){
    var p;try{p=parseNum($('v').value);}catch(e){return fail(String(e));}
    var a=analyze(p),K=+$('k').value;
    C.text('heroLbl','Signifikante Stellen');C.text('resultValue',String(a.sigCount));tg.textContent=a.sigCount+' signifikante Stelle'+(a.sigCount===1?'':'s');
    C.html('ex1L','Wissenschaftliche Schreibweise');C.html('ex1',fmtSci(a.sigDigits||'0',a.E,a.neg));
    var rd=roundDigits(a.sigDigits||'0',Math.min(K,(a.sigDigits||'0').length)),rE=a.E+(rd.carried?1:0);
    var roundNote=K>=a.sigCount?'hat bereits ≤ '+K+' signifikante Stellen — unverändert':fmtDecimal(rd.digits,rE,a.neg);
    C.text('ex2L','Runden auf '+K+' signifikante Stelle'+(K===1?'':'s'));C.html('ex2',K>=a.sigCount?esc(fmtDecimal(a.sigDigits||'0',a.E,a.neg)):fmtDecimal(rd.digits,rE,a.neg));
    C.html('fxNow',esc($('v').value)+' &nbsp;→&nbsp; '+a.sigCount+' signifikante Stelle'+(a.sigCount===1?'':'s'));
    C.text('interp',a.trailingZerosAmbig>0?'Diese Zahl hat '+a.trailingZerosAmbig+' nachgestellte Null'+(a.trailingZerosAmbig===1?'':'s')+' ohne Dezimalpunkt, was mehrdeutig ist – schreiben Sie sie in wissenschaftlicher Notation, um die Genauigkeit klarzustellen.':'Die Rolle jeder Ziffer ist unten dargestellt: Führende Nullen zählen nie, eingeschlossene Nullen und (mit Dezimalpunkt) nachgestellte Nullen schon.');
    tiles([
      ['Führende Nullen (nicht signifikant)',String(a.leadingZeros),''],
      ['Eingeschlossene Nullen (signifikant)',String(a.captiveZeros),'zwischen zwei Ziffern ungleich null'],
      ['Nachgestellte Nullen, signifikant',String(a.trailingZerosSig),'vorhanden, weil ein Dezimalpunkt steht'],
      ['Nachgestellte Nullen, mehrdeutig',String(a.trailingZerosAmbig),'kein Dezimalpunkt – hier nicht mitgezählt'],
      ['Von null verschiedene Ziffern',String(a.nonZeroCount),'immer signifikant'],
      ['Größenordnung (10ⁿ)',String(a.E),'Exponent der führenden Ziffer']
    ]);
    digitViz(p,a);C.text('vizTag',a.sigCount+' of '+a.digits.length+' signifikante Ziffern');
    var n=0,h='';function st(t,d0,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Erste signifikante Ziffer finden','Von links scannen; die erste Ziffer ungleich null beginnt die signifikante Folge (führende Nullen zählen nie).',a.allZero?'der Wert ist 0':'Ziffer „'+a.digits[a.fnz]+'" an Position '+(a.fnz+1));
    st('Festlegen, wo die signifikante Folge endet','Mit Dezimalpunkt reicht sie bis zur zuletzt eingegebenen Ziffer (nachgestellte Nullen zählen). Ohne Dezimalpunkt endet sie bei der letzten Ziffer ungleich null.',a.hasDecimal?'endet bei der zuletzt eingegebenen Ziffer (Dezimalpunkt vorhanden)':'endet bei der letzten Ziffer ungleich null (kein Dezimalpunkt)');
    st('Die Ziffern dazwischen zählen','Jede Ziffer von der ersten bis zur letzten signifikanten Stelle zählt, egal ob null oder nicht.',(a.sigDigits||'0')+' → <b>'+a.sigCount+' signifikante Stelle'+(a.sigCount===1?'':'s')+'</b>');
    if(K<a.sigCount)st('Runden auf '+K+' signifikante Stelle'+(K===1?'':'s'),'Die ersten '+K+' signifikanten Ziffern behalten; die nächste mit Runden zur nächsten geraden Zahl runden.',(a.sigDigits||'0')+' → <b>'+rd.digits+'</b>'+(rd.carried?' (Rundung führte zu einer neuen führenden Ziffer)':''));
    $('steps').innerHTML=h;C.text('stepsIntro','Analysiert: '+esc($('v').value)+'.');C.text('stepsTag',a.sigCount+' signifikante Stellen');
    last='Signifikante Stellen — calculatepilot.com/math/sig-fig-calculator.html\n'+$('v').value+' has '+a.sigCount+' signifikante Stellen\nwissenschaftlich: '+(a.sigDigits||'0')+' x 10^'+a.E+(K<a.sigCount?'\ngerundet auf '+K+' s.f.: '+fmtDecimal(rd.digits,rE,a.neg).replace(/<[^>]+>/g,''):'');
    return;
  }

  /* s2: arithmetic — exact BigInt decimal math throughout, so half-to-even ties are never decided by
     binary floating-point noise (e.g. 4.5 x 2.10 must be exactly 9.450, not 9.450000000000001). */
  var pa,pb;try{pa=parseNum($('opA').value);}catch(e){return fail('A: '+String(e));}
  try{pb=parseNum($('opB').value);}catch(e){return fail('B: '+String(e));}
  if(pa.explicitExp||pb.explicitExp)return fail('Wissenschaftliche Notation wird im Rechenmodus nicht unterstützt – geben Sie eine einfache Dezimalzahl ein.');
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
      if(B.mantissa===0n)return fail('Division durch null ist nicht möglich.');
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
  C.text('heroLbl','A '+opSym+' B, korrekt nach signifikanten Stellen');C.html('resultValue',resultStr);
  tg.textContent=ruleType==='dp'?targetDP+' Dezimalstelle'+(targetDP===1?'':'s'):targetSF+' signifikante Stelle'+(targetSF===1?'':'s');
  C.text('ex1L','Ungerundetes Ergebnis');C.text('ex1',rawStr.replace(/<[^>]+>/g,''));
  C.text('ex2L','Angewandte Regel');C.text('ex2',ruleType==='dp'?'wenigste Dezimalstellen ('+targetDP+')':'wenigste signifikante Stellen ('+targetSF+')');
  C.html('fxNow',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+' = '+resultStr);
  C.text('interp',ruleType==='dp'?'Addition und Subtraktion werden durch die Dezimalstellen begrenzt: Das Ergebnis behält nur so viele Dezimalstellen wie der ungenaueste Operand.':'Multiplikation und Division werden durch die signifikanten Stellen begrenzt: Das Ergebnis behält nur so viele signifikante Stellen wie der ungenaueste Operand.');
  tiles([
    ['A',$('opA').value,aa.sigCount+' signifikante Stellen, '+decPlaces(pa)+' dp'],
    ['B',$('opB').value,ab2.sigCount+' signifikante Stellen, '+decPlaces(pb)+' dp'],
    ['Ungerundetes Ergebnis',rawStr.replace(/<[^>]+>/g,''),'vor Anwendung der Regel für signifikante Stellen'],
    ['Gerundetes Ergebnis',resultStr.replace(/<[^>]+>/g,''),ruleType==='dp'?targetDP+' Dezimalstellen':targetSF+' signifikante Stellen']
  ]);
  $('viz').innerHTML='';C.text('vizTag',ruleType==='dp'?'Dezimalstellen-Regel':'Regel für signifikante Stellen');
  var n2=0,h2='';function st2(t,d0,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st2('Das exakte Ergebnis berechnen','Zuerst ohne Rundung rechnen.',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+' = <b>'+rawStr.replace(/<[^>]+>/g,'')+'</b>');
  if(ruleType==='dp'){
    st2('Den Operanden mit den wenigsten Dezimalstellen finden','Addition/Subtraktion kann nur so genau sein wie die ungenaueste Messung.','A hat '+decPlaces(pa)+' DS, B hat '+decPlaces(pb)+' DS → verwenden <b>'+targetDP+'</b>');
    st2('Das Ergebnis auf so viele Dezimalstellen runden',null,'<b>'+resultStr+'</b>');
  }else{
    st2('Den Operanden mit den wenigsten signifikanten Stellen finden','Multiplikation/Division kann nur so genau sein wie die ungenaueste Messung.','A hat '+aa.sigCount+' sig. Stellen, B hat '+ab2.sigCount+' sig. Stellen → verwenden <b>'+targetSF+'</b>');
    st2('Das Ergebnis auf so viele signifikante Stellen runden',null,'<b>'+resultStr+'</b>');
  }
  $('steps').innerHTML=h2;C.text('stepsIntro',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+'.');C.text('stepsTag',ruleType==='dp'?'Dezimalstellen-Regel':'Regel für signifikante Stellen');
  last='Rechnen mit signifikanten Stellen — calculatepilot.com/math/sig-fig-calculator.html\n'+$('opA').value+' '+opSym+' '+$('opB').value+' = '+resultStr.replace(/<[^>]+>/g,'')+' (unrounded '+rawStr.replace(/<[^>]+>/g,'')+')';
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sfCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('mode',b.getAttribute('data-m'));C.set('v',b.getAttribute('data-v'));C.set('k',b.getAttribute('data-k'));fire('v');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
