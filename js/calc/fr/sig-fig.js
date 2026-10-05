/* Significant figures calculator — CalculatePilot (Stitch redesign).
   Digit classification: non-zero always significant; captive zeros (between non-zero digits) significant;
   leading zeros never significant; trailing zeros significant only when a decimal point is present.
   Rounding: exact half-to-even (banker's) rounding performed on the digit string, not on the floating-point value. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';

function parseNum(raw){
  var s=String(raw||'').trim();
  if(!s)throw 'Saisissez un nombre.';
  var neg=false;
  if(s[0]==='+'||s[0]==='-'){neg=s[0]==='-';s=s.slice(1);}
  var m=s.match(/^(\d*)(\.(\d*))?([eE]([+-]?\d+))?$/);
  if(!m||(!m[1]&&!m[3]))throw 'Impossible d\'analyser « '+raw+' » comme un nombre.';
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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function digitViz(p,a){
  var d=a.digits,parts=[];
  var pos=0;
  for(var i=0;i<d.length;i++){
    var cls,label;
    if(!a.allZero&&i<a.fnz){cls='#94a3b8';label='leading';}
    else if(!a.allZero&&i>a.fnz&&i<a.lnz&&d[i]==='0'){cls='#059669';label='captive';}
    else if(!a.allZero&&i>a.lnz){cls=a.hasDecimal?'#059669':'#d97706';label=a.hasDecimal?'zéros finaux (sig.)':'zéros finaux (ambigus)';}
    else{cls='#0f172a';label='sig.';}
    parts.push('<span style="display:inline-block;min-width:26px;text-align:center;padding:6px 4px;margin:2px;border-radius:6px;background:'+cls+';color:#fff;font:700 16px var(--font-mono)" title="'+esc(label)+'">'+esc(d[i])+'</span>');
    pos++;
    if(p.hasDecimal&&i===p.intPart.length-1)parts.push('<span style="display:inline-block;padding:6px 2px;font:700 16px var(--font-mono);color:var(--sx-on)">.</span>');
  }
  var legend='<div style="margin-top:10px;font-size:12px;color:var(--sx-muted)"><span style="color:#0f172a">■</span> significatif &nbsp; <span style="color:#94a3b8">■</span> zéro initial (non sig.) &nbsp; <span style="color:#059669">■</span> zéro intercalé/final sig. &nbsp; <span style="color:#d97706">■</span> zéro final, ambigu</div>';
  $('viz').innerHTML='<div style="display:flex;flex-wrap:wrap;align-items:center">'+parts.join('')+'</div>'+legend;
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fK').hidden=(m!=='s1');$('fArith').hidden=(m!=='s2');
  C.html('formH',m==='s1'?'Compter et arrondir les chiffres significatifs':'Calcul avec chiffres significatifs');

  if(m==='s1'){
    var p;try{p=parseNum($('v').value);}catch(e){return fail(String(e));}
    var a=analyze(p),K=+$('k').value;
    C.text('heroLbl','Chiffres significatifs');C.text('resultValue',String(a.sigCount));tg.textContent=a.sigCount+' chiffre significatif'+(a.sigCount===1?'':'s');
    C.html('ex1L','Notation scientifique');C.html('ex1',fmtSci(a.sigDigits||'0',a.E,a.neg));
    var rd=roundDigits(a.sigDigits||'0',Math.min(K,(a.sigDigits||'0').length)),rE=a.E+(rd.carried?1:0);
    var roundNote=K>=a.sigCount?'a déjà ≤ '+K+' chiffres significatifs — inchangé':fmtDecimal(rd.digits,rE,a.neg);
    C.text('ex2L','Arrondir à '+K+' chiffre significatif'+(K===1?'':'s'));C.html('ex2',K>=a.sigCount?esc(fmtDecimal(a.sigDigits||'0',a.E,a.neg)):fmtDecimal(rd.digits,rE,a.neg));
    C.html('fxNow',esc($('v').value)+' &nbsp;→&nbsp; '+a.sigCount+' chiffre significatif'+(a.sigCount===1?'':'s'));
    C.text('interp',a.trailingZerosAmbig>0?'Ce nombre comporte '+a.trailingZerosAmbig+' zéro final'+(a.trailingZerosAmbig===1?'':'s')+' sans virgule décimale, ce qui est ambigu : écrivez-le en notation scientifique pour préciser la précision.':'Le rôle de chaque chiffre est indiqué ci-dessous : les zéros initiaux ne comptent jamais, les zéros intercalés et (avec une virgule décimale) les zéros finaux comptent.');
    tiles([
      ['Zéros initiaux (non significatifs)',String(a.leadingZeros),''],
      ['Zéros intercalés (significatifs)',String(a.captiveZeros),'entre deux chiffres non nuls'],
      ['Zéros finaux, significatifs',String(a.trailingZerosSig),'présents car il y a une virgule décimale'],
      ['Zéros finaux, ambigus',String(a.trailingZerosAmbig),'pas de virgule décimale — non comptés ici'],
      ['Chiffres non nuls',String(a.nonZeroCount),'toujours significatifs'],
      ['Ordre de grandeur (10ⁿ)',String(a.E),'exposant du premier chiffre']
    ]);
    digitViz(p,a);C.text('vizTag',a.sigCount+' of '+a.digits.length+' chiffres significatifs');
    var n=0,h='';function st(t,d0,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Trouvez le premier chiffre significatif','Parcourez de gauche à droite ; le premier chiffre non nul démarre la série significative (les zéros initiaux ne comptent jamais).',a.allZero?'la valeur est 0':'chiffre « '+a.digits[a.fnz]+'" à la position '+(a.fnz+1));
    st('Déterminer où s\'arrête la série significative','Avec une virgule décimale, elle va jusqu\'au dernier chiffre saisi (les zéros finaux comptent). Sans virgule, elle s\'arrête au dernier chiffre non nul.',a.hasDecimal?'s\'arrête au dernier chiffre saisi (virgule décimale présente)':'s\'arrête au dernier chiffre non nul (pas de virgule décimale)');
    st('Compter les chiffres intermédiaires','Chaque chiffre, du premier au dernier rang significatif, compte, qu\'il soit nul ou non.',(a.sigDigits||'0')+' → <b>'+a.sigCount+' chiffre significatif'+(a.sigCount===1?'':'s')+'</b>');
    if(K<a.sigCount)st('Arrondir à '+K+' chiffre significatif'+(K===1?'':'s'),'Conserver les '+K+' premiers chiffres significatifs ; arrondir le suivant à l\'entier pair le plus proche en cas d\'égalité.',(a.sigDigits||'0')+' → <b>'+rd.digits+'</b>'+(rd.carried?' (l\'arrondi a été reporté sur un nouveau premier chiffre)':''));
    $('steps').innerHTML=h;C.text('stepsIntro','Analyse de '+esc($('v').value)+'.');C.text('stepsTag',a.sigCount+' chiffres significatifs');
    last='Chiffres significatifs — calculatepilot.com/math/sig-fig-calculator.html\n'+$('v').value+' has '+a.sigCount+' chiffres significatifs\nnotation scientifique : '+(a.sigDigits||'0')+' x 10^'+a.E+(K<a.sigCount?'\narrondi à '+K+' s.f.: '+fmtDecimal(rd.digits,rE,a.neg).replace(/<[^>]+>/g,''):'');
    return;
  }

  /* s2: arithmetic — exact BigInt decimal math throughout, so half-to-even ties are never decided by
     binary floating-point noise (e.g. 4.5 x 2.10 must be exactly 9.450, not 9.450000000000001). */
  var pa,pb;try{pa=parseNum($('opA').value);}catch(e){return fail('A: '+String(e));}
  try{pb=parseNum($('opB').value);}catch(e){return fail('B: '+String(e));}
  if(pa.explicitExp||pb.explicitExp)return fail('La notation scientifique n\'est pas prise en charge en mode arithmétique : saisissez un nombre décimal simple.');
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
      if(B.mantissa===0n)return fail('Division par zéro impossible.');
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
  C.text('heroLbl','A '+opSym+' B, correct en chiffres significatifs');C.html('resultValue',resultStr);
  tg.textContent=ruleType==='dp'?targetDP+' décimale'+(targetDP===1?'':'s'):targetSF+' chiffre significatif'+(targetSF===1?'':'s');
  C.text('ex1L','Résultat non arrondi');C.text('ex1',rawStr.replace(/<[^>]+>/g,''));
  C.text('ex2L','Règle appliquée');C.text('ex2',ruleType==='dp'?'moins de décimales ('+targetDP+')':'moins de chiffres significatifs ('+targetSF+')');
  C.html('fxNow',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+' = '+resultStr);
  C.text('interp',ruleType==='dp'?'L\'addition et la soustraction sont limitées par les décimales : le résultat ne garde que autant de décimales que l\'opérande le moins précis.':'La multiplication et la division sont limitées par les chiffres significatifs : le résultat ne garde que autant de chiffres significatifs que l\'opérande le moins précis.');
  tiles([
    ['A',$('opA').value,aa.sigCount+' chiffres significatifs, '+decPlaces(pa)+' dp'],
    ['B',$('opB').value,ab2.sigCount+' chiffres significatifs, '+decPlaces(pb)+' dp'],
    ['Résultat non arrondi',rawStr.replace(/<[^>]+>/g,''),'avant application de la règle des chiffres significatifs'],
    ['Résultat arrondi',resultStr.replace(/<[^>]+>/g,''),ruleType==='dp'?targetDP+' décimales':targetSF+' chiffres significatifs']
  ]);
  $('viz').innerHTML='';C.text('vizTag',ruleType==='dp'?'règle des décimales':'règle des chiffres significatifs');
  var n2=0,h2='';function st2(t,d0,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st2('Calculer le résultat exact','Effectuez d\'abord le calcul sans arrondir.',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+' = <b>'+rawStr.replace(/<[^>]+>/g,'')+'</b>');
  if(ruleType==='dp'){
    st2('Trouver l\'opérande ayant le moins de décimales','Une addition ou une soustraction ne peut pas être plus précise que la mesure la moins précise.','A a '+decPlaces(pa)+' déc., B a '+decPlaces(pb)+' déc. → utiliser <b>'+targetDP+'</b>');
    st2('Arrondir le résultat à ce nombre de décimales',null,'<b>'+resultStr+'</b>');
  }else{
    st2('Trouver l\'opérande ayant le moins de chiffres significatifs','Une multiplication ou une division ne peut pas être plus précise que la mesure la moins précise.','A a '+aa.sigCount+' c.s., B a '+ab2.sigCount+' c.s. → utiliser <b>'+targetSF+'</b>');
    st2('Arrondir le résultat à ce nombre de chiffres significatifs',null,'<b>'+resultStr+'</b>');
  }
  $('steps').innerHTML=h2;C.text('stepsIntro',esc($('opA').value)+' '+opSym+' '+esc($('opB').value)+'.');C.text('stepsTag',ruleType==='dp'?'règle des décimales':'règle des chiffres significatifs');
  last='Calcul avec chiffres significatifs — calculatepilot.com/math/sig-fig-calculator.html\n'+$('opA').value+' '+opSym+' '+$('opB').value+' = '+resultStr.replace(/<[^>]+>/g,'')+' (unrounded '+rawStr.replace(/<[^>]+>/g,'')+')';
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'sfCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('mode',b.getAttribute('data-m'));C.set('v',b.getAttribute('data-v'));C.set('k',b.getAttribute('data-k'));fire('v');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
