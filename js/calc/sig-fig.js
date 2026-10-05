/* Significant figures calculator — CalculatePilot (Stitch redesign).
   Digit classification: non-zero always significant; captive zeros (between non-zero digits) significant;
   leading zeros never significant; trailing zeros significant only when a decimal point is present.
   Rounding: exact half-to-even (banker's) rounding performed on the digit string, not on the floating-point value. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';

function parseNum(raw){
  var s=String(raw||'').trim();
  if(!s)throw 'Enter a number.';
  var neg=false;
  if(s[0]==='+'||s[0]==='-'){neg=s[0]==='-';s=s.slice(1);}
  var m=s.match(/^(\d*)(\.(\d*))?([eE]([+-]?\d+))?$/);
  if(!m||(!m[1]&&!m[3]))throw 'Could not parse "'+raw+'" as a number.';
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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function digitViz(p,a){
  var d=a.digits,parts=[];
  var pos=0;
  for(var i=0;i<d.length;i++){
    var cls,label;
    if(!a.allZero&&i<a.fnz){cls='#94a3b8';label='leading';}
    else if(!a.allZero&&i>a.fnz&&i<a.lnz&&d[i]==='0'){cls='#059669';label='captive';}
    else if(!a.allZero&&i>a.lnz){cls=a.hasDecimal?'#059669':'#d97706';label=a.hasDecimal?'trailing (sig.)':'trailing (ambig.)';}
    else{cls='#0f172a';label='sig.';}
    parts.push('<span style="display:inline-block;min-width:26px;text-align:center;padding:6px 4px;margin:2px;border-radius:6px;background:'+cls+';color:#fff;font:700 16px var(--font-mono)" title="'+esc(label)+'">'+esc(d[i])+'</span>');
    pos++;
    if(p.hasDecimal&&i===p.intPart.length-1)parts.push('<span style="display:inline-block;padding:6px 2px;font:700 16px var(--font-mono);color:var(--sx-on)">.</span>');
  }
  var legend='<div style="margin-top:10px;font-size:12px;color:var(--sx-muted)"><span style="color:#0f172a">■</span> significant &nbsp; <span style="color:#94a3b8">■</span> leading zero (not sig.) &nbsp; <span style="color:#059669">■</span> captive/trailing sig. &nbsp; <span style="color:#d97706">■</span> trailing, ambiguous</div>';
  $('viz').innerHTML='<div style="display:flex;flex-wrap:wrap;align-items:center">'+parts.join('')+'</div>'+legend;
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fK').hidden=(m!=='s1');$('fArith').hidden=(m!=='s2');
  C.html('formH',m==='s1'?'Count &amp; round significant figures':'Significant-figure arithmetic');

  if(m==='s1'){
    var p;try{p=parseNum($('v').value);}catch(e){return fail(String(e));}
    var a=analyze(p),K=+$('k').value;
    C.text('heroLbl','Significant figures');C.text('resultValue',String(a.sigCount));tg.textContent=a.sigCount+' sig fig'+(a.sigCount===1?'':'s');
    C.html('ex1L','Scientific notation');C.html('ex1',fmtSci(a.sigDigits||'0',a.E,a.neg));
    var rd=roundDigits(a.sigDigits||'0',Math.min(K,(a.sigDigits||'0').length)),rE=a.E+(rd.carried?1:0);
    var roundNote=K>=a.sigCount?'already has ≤ '+K+' sig figs — unchanged':fmtDecimal(rd.digits,rE,a.neg);
    C.text('ex2L','Round to '+K+' sig fig'+(K===1?'':'s'));C.html('ex2',K>=a.sigCount?esc(fmtDecimal(a.sigDigits||'0',a.E,a.neg)):fmtDecimal(rd.digits,rE,a.neg));
    C.html('fxNow',esc($('v').value)+' &nbsp;→&nbsp; '+a.sigCount+' significant figure'+(a.sigCount===1?'':'s'));
    C.text('interp',a.trailingZerosAmbig>0?'This number has '+a.trailingZerosAmbig+' trailing zero'+(a.trailingZerosAmbig===1?'':'s')+' with no decimal point, which is ambiguous — write it in scientific notation to make the precision clear.':'Every digit’s role is shown below: leading zeros never count, captive and (with a decimal point) trailing zeros do.');
    tiles([
      ['Leading zeros (not significant)',String(a.leadingZeros),''],
      ['Captive zeros (significant)',String(a.captiveZeros),'between two non-zero digits'],
      ['Trailing zeros, significant',String(a.trailingZerosSig),'present because there’s a decimal point'],
      ['Trailing zeros, ambiguous',String(a.trailingZerosAmbig),'no decimal point — not counted here'],
      ['Non-zero digits',String(a.nonZeroCount),'always significant'],
      ['Order of magnitude (10ⁿ)',String(a.E),'exponent of the leading digit']
    ]);
    digitViz(p,a);C.text('vizTag',a.sigCount+' of '+a.digits.length+' digits significant');
    var n=0,h='';function st(t,d0,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Find the first significant digit','Scan from the left; the first non-zero digit starts the significant run (leading zeros never count).',a.allZero?'the value is 0':'digit "'+a.digits[a.fnz]+'" at position '+(a.fnz+1));
    st('Decide where the significant run ends','With a decimal point, it runs to the last digit typed (trailing zeros count). Without one, it stops at the last non-zero digit.',a.hasDecimal?'ends at the last digit typed (decimal point present)':'ends at the last non-zero digit (no decimal point)');
    st('Count the digits in between','Every digit from the first to the last significant position counts, whether zero or not.',(a.sigDigits||'0')+' → <b>'+a.sigCount+' significant figure'+(a.sigCount===1?'':'s')+'</b>');
    if(K<a.sigCount)st('Round to '+K+' sig fig'+(K===1?'':'s'),'Keep the first '+K+' significant digits; round the next one with half-to-even.',(a.sigDigits||'0')+' → <b>'+rd.digits+'</b>'+(rd.carried?' (rounding carried into a new leading digit)':''));
    $('steps').innerHTML=h;C.text('stepsIntro','Analyzing '+esc($('v').value)+'.');C.text('stepsTag',a.sigCount+' sig figs');
    last='Significant figures — calculatepilot.com/math/sig-fig-calculator.html\n'+$('v').value+' has '+a.sigCount+' significant figures\nscientific: '+(a.sigDigits||'0')+' x 10^'+a.E+(K<a.sigCount?'\nrounded to '+K+' s.f.: '+fmtDecimal(rd.digits,rE,a.neg).replace(/<[^>]+>/g,''):'');
    return;
  }

  /* s2: arithmetic — exact BigInt decimal math throughout, so half-to-even ties are never decided by
     binary floating-point noise (e.g. 4.5 x 2.10 must be exactly 9.450, not 9.450000000000001). */
  var pa,pb;try{pa=parseNum($('opA').value);}catch(e){return fail('A: '+String(e));}
  try{pb=parseNum($('opB').value);}catch(e){return fail('B: '+String(e));}
  if(pa.explicitExp||pb.explicitExp)return fail('Scientific notation isn’t supported in arithmetic mode — enter a plain decimal.');
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
      if(B.mantissa===0n)return fail('Cannot divide by zero.');
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
  C.text('heroLbl','A '+opSym+' B, sig-fig correct');C.html('resultValue',resultStr);
  tg.textContent=ruleType==='dp'?targetDP+' decimal place'+(targetDP===1?'':'s'):targetSF+' sig fig'+(targetSF===1?'':'s');
  C.text('ex1L','Unrounded result');C.text('ex1',rawStr.replace(/<[^>]+>/g,''));
  C.text('ex2L','Rule applied');C.text('ex2',ruleType==='dp'?'fewest decimal places ('+targetDP+')':'fewest significant figures ('+targetSF+')');
  C.html('fxNow',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+' = '+resultStr);
  C.text('interp',ruleType==='dp'?'Addition and subtraction are limited by decimal places: the answer keeps only as many decimal places as the least-precise operand.':'Multiplication and division are limited by significant figures: the answer keeps only as many sig figs as the least-precise operand.');
  tiles([
    ['A',$('opA').value,aa.sigCount+' sig figs, '+decPlaces(pa)+' dp'],
    ['B',$('opB').value,ab2.sigCount+' sig figs, '+decPlaces(pb)+' dp'],
    ['Unrounded result',rawStr.replace(/<[^>]+>/g,''),'before applying the sig-fig rule'],
    ['Rounded result',resultStr.replace(/<[^>]+>/g,''),ruleType==='dp'?targetDP+' decimal places':targetSF+' sig figs']
  ]);
  $('viz').innerHTML='';C.text('vizTag',ruleType==='dp'?'decimal-place rule':'sig-fig rule');
  var n2=0,h2='';function st2(t,d0,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st2('Compute the exact result','Do the arithmetic without rounding first.',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+' = <b>'+rawStr.replace(/<[^>]+>/g,'')+'</b>');
  if(ruleType==='dp'){
    st2('Find the operand with the fewest decimal places','Addition/subtraction can only be as precise as the least precise measurement.','A has '+decPlaces(pa)+' dp, B has '+decPlaces(pb)+' dp → use <b>'+targetDP+'</b>');
    st2('Round the result to that many decimal places',null,'<b>'+resultStr+'</b>');
  }else{
    st2('Find the operand with the fewest significant figures','Multiplication/division can only be as precise as the least precise measurement.','A has '+aa.sigCount+' s.f., B has '+ab2.sigCount+' s.f. → use <b>'+targetSF+'</b>');
    st2('Round the result to that many significant figures',null,'<b>'+resultStr+'</b>');
  }
  $('steps').innerHTML=h2;C.text('stepsIntro',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+'.');C.text('stepsTag',ruleType==='dp'?'decimal places rule':'sig figs rule');
  last='Sig-fig arithmetic — calculatepilot.com/math/sig-fig-calculator.html\n'+$('opA').value+' '+opSym+' '+$('opB').value+' = '+resultStr.replace(/<[^>]+>/g,'')+' (unrounded '+rawStr.replace(/<[^>]+>/g,'')+')';
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sfCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('mode',b.getAttribute('data-m'));C.set('v',b.getAttribute('data-v'));C.set('k',b.getAttribute('data-k'));fire('v');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
