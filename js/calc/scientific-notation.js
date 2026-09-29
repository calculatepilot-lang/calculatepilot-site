/* Scientific notation calculator — CalculatePilot (Stitch redesign).
   Mantissa/exponent extracted from the exact decimal digit string (no floating-point rounding);
   half-to-even rounding performed on the digit string, matching the sig-fig calculator's engine. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
var SI=[[24,'yotta','Y'],[21,'zetta','Z'],[18,'exa','E'],[15,'peta','P'],[12,'tera','T'],[9,'giga','G'],[6,'mega','M'],[3,'kilo','k'],[0,'','' ],[-3,'milli','m'],[-6,'micro','µ'],[-9,'nano','n'],[-12,'pico','p'],[-15,'femto','f'],[-18,'atto','a'],[-21,'zepto','z'],[-24,'yocto','y']];

function parseNum(raw){
  var s=String(raw||'').trim();
  if(!s)throw 'Enter a number.';
  var neg=false;if(s[0]==='+'||s[0]==='-'){neg=s[0]==='-';s=s.slice(1);}
  var m=s.match(/^(\d*)(\.(\d*))?([eE]([+-]?\d+))?$/);
  if(!m||(!m[1]&&!m[3]))throw 'Could not parse "'+raw+'" as a number.';
  var intPart=m[1]||'0',fracPart=m[3]||'',explicitExp=m[5]?parseInt(m[5],10):0;
  var allDigits=intPart+fracPart;
  return {neg:neg,intPart:intPart,fracPart:fracPart,explicitExp:explicitExp,allDigits:allDigits};
}
function toSci(p){
  var d=p.allDigits,fnz=-1;
  for(var i=0;i<d.length;i++)if(d[i]!=='0'){fnz=i;break;}
  if(fnz<0)return {digits:'0',E:0,neg:p.neg};
  var lnz=d.length-1;while(lnz>fnz&&d[lnz]==='0'&&lnz>=p.intPart.length)lnz--; /* keep all typed digits as significant (no float invented precision) */
  var E=p.intPart.length-1-fnz+p.explicitExp;
  var digits=d.slice(fnz).replace(/0+$/,'')||'0';
  return {digits:digits,E:E,neg:p.neg};
}
function roundDigits(D,K){
  if(K<=0||K>=D.length)return {digits:D,carried:false};
  var kept=D.slice(0,K),rest=D.slice(K);
  var first=rest[0],roundUp;
  if(first>'5')roundUp=true;else if(first<'5')roundUp=false;
  else{var more=/[1-9]/.test(rest.slice(1));roundUp=more?true:(parseInt(kept[K-1],10)%2===1);}
  var carried=false;
  if(roundUp){var arr=kept.split('').map(Number),i=arr.length-1,carry=1;
    while(i>=0&&carry){arr[i]+=carry;if(arr[i]===10){arr[i]=0;carry=1;}else carry=0;i--;}
    if(carry){arr.unshift(1);carried=true;}kept=arr.join('');if(kept.length>K)kept=kept.slice(0,K);}
  return {digits:kept,carried:carried};
}
function fmtSci(digits,E,neg){var m=digits.length>1?digits[0]+'.'+digits.slice(1):digits[0];return (neg?'−':'')+m+' × 10<sup>'+E+'</sup>';}
function fmtENot(digits,E,neg){var m=digits.length>1?digits[0]+'.'+digits.slice(1):digits[0];return (neg?'-':'')+m+'e'+(E>=0?'+':'')+E;}
function fmtDecimal(digits,E,neg){var s;if(E>=0){if(digits.length<=E+1)s=digits+'0'.repeat(E+1-digits.length);else s=digits.slice(0,E+1)+'.'+digits.slice(E+1);}else{s='0.'+'0'.repeat(-E-1)+digits;}return (neg?'−':'')+s;}
function engExponent(E){return Math.floor(E/3)*3;}
function fmtEng(digits,E,neg){
  var eE=engExponent(E),shift=E-eE; /* mantissa digits before point = shift+1 */
  var need=shift+1;
  var d=digits;while(d.length<need)d+='0';
  var m=need>=d.length?d:(d.slice(0,need)+(d.length>need?'.'+d.slice(need):''));
  if(need<d.length)m=d.slice(0,need)+'.'+d.slice(need);else m=d;
  return {str:(neg?'−':'')+m+' × 10<sup>'+eE+'</sup>',E:eE,mantissaDigits:m};
}
function siPrefix(E){
  var best=null;
  for(var i=0;i<SI.length;i++)if(E>=SI[i][0]-2&&E<=24){best=SI[i];if(SI[i][0]<=E)break;}
  for(i=0;i<SI.length;i++)if(SI[i][0]<=E){best=SI[i];break;}
  return best||SI[SI.length-1];
}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';C.text('vizTag','—');}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fDec').hidden=(m!=='s1');$('fSci').hidden=(m!=='s2');$('fArith').hidden=(m!=='s3');
  var labels={s1:'Decimal → scientific notation',s2:'Scientific notation → decimal',s3:'Multiply or divide in scientific notation'};
  C.html('formH',labels[m]);

  if(m==='s1'){
    var p;try{p=parseNum($('v').value);}catch(e){return fail(String(e));}
    var sci=toSci(p),K=+$('k').value;
    var digitsToShow=sci.digits,Eshow=sci.E,carried=false;
    if(K>0&&K<sci.digits.length){var rd=roundDigits(sci.digits,K);digitsToShow=rd.digits;carried=rd.carried;Eshow=sci.E+(carried?1:0);}
    C.text('heroLbl','Standard scientific notation');C.html('resultValue',fmtSci(digitsToShow,Eshow,sci.neg));tg.textContent='1 ≤ |m| < 10';
    var eng=fmtEng(sci.digits,sci.E,sci.neg);
    C.html('ex1L','Engineering notation');C.html('ex1',eng.str);
    var si=siPrefix(eng.E);
    C.html('ex2L','SI prefix form');C.html('ex2',eng.mantissaDigits.replace(/^−/,'')+(sci.neg?' (−)':'')+' '+(si[1]?si[1]+' ('+si[2]+')':'(no prefix)'));
    C.html('fxNow',esc($('v').value)+' = '+fmtENot(digitsToShow,Eshow,sci.neg));
    C.text('interp','The decimal point moves '+Math.abs(sci.E)+' places '+(sci.E>=0?'left':'right')+' to normalize the number to a single leading digit.');
    tiles([
      ['Mantissa',digitsToShow.length>1?digitsToShow[0]+'.'+digitsToShow.slice(1):digitsToShow[0],'1 ≤ |m| < 10'],
      ['Exponent',String(Eshow),'power of 10'],
      ['E-notation',fmtENot(digitsToShow,Eshow,sci.neg),'plain-text computing form'],
      ['Full decimal',fmtDecimal(sci.digits,sci.E,sci.neg),'unrounded, for comparison']
    ]);
    var n=0,h='';function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Find the first significant digit','This becomes the single digit before the decimal point.','digit "'+sci.digits[0]+'"');
    st('Count how many places the decimal point moves','That count (with sign) is the exponent.','moved '+Math.abs(sci.E)+' places → exponent = <b>'+sci.E+'</b>');
    if(K>0&&K<toSci(p).digits.length)st('Round the mantissa to '+K+' significant figures','Using exact half-to-even rounding on the digit string.',toSci(p).digits+' → <b>'+digitsToShow+'</b>'+(carried?' (rounding carried into a new leading digit, exponent +1)':''));
    st('Write in standard form',null,'<b>'+fmtSci(digitsToShow,Eshow,sci.neg)+'</b>');
    $('steps').innerHTML=h;C.text('stepsIntro','Converting '+esc($('v').value)+' to scientific notation.');C.text('stepsTag','E = '+Eshow);
    last='Scientific notation — calculatepilot.com/math/scientific-notation-calculator.html\n'+$('v').value+' = '+fmtENot(digitsToShow,Eshow,sci.neg)+'\nengineering: '+eng.str.replace(/<[^>]+>/g,'');
    return;
  }

  if(m==='s2'){
    var mp;try{mp=parseNum($('mant').value);}catch(e){return fail('Mantissa: '+String(e));}
    var expV=parseInt($('exp').value,10);
    if(!isFinite(expV))return fail('Enter an integer exponent.');
    var msci=toSci(mp);
    var totalE=msci.E+expV;
    C.text('heroLbl','Decimal value');C.html('resultValue',esc(fmtDecimal(msci.digits,totalE,msci.neg)));tg.textContent='exact';
    C.html('ex1L','Standard scientific form');C.html('ex1',fmtSci(msci.digits,totalE,msci.neg));
    C.text('ex2L','E-notation');C.text('ex2',fmtENot(msci.digits,totalE,msci.neg));
    C.html('fxNow',esc($('mant').value)+' × 10<sup>'+expV+'</sup>');
    C.text('interp','Move the decimal point '+Math.abs(totalE)+' places '+(totalE>=0?'right':'left')+' from the mantissa to get the full decimal value.');
    tiles([['Mantissa',$('mant').value,''],['Exponent',String(expV),''],['Combined exponent',String(totalE),'accounts for any exponent already in the mantissa'],['Decimal value',fmtDecimal(msci.digits,totalE,msci.neg),'']]);
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Read the mantissa and exponent',null,$('mant').value+' × 10<sup>'+expV+'</sup>');
    st2('Shift the decimal point by the exponent','Positive exponent moves right; negative moves left.','shift by '+totalE+' places');
    st2('Write the full decimal value',null,'<b>'+fmtDecimal(msci.digits,totalE,msci.neg)+'</b>');
    $('steps').innerHTML=h2;C.text('stepsIntro','Converting '+$('mant').value+'×10^'+expV+' to decimal.');C.text('stepsTag','exponent '+totalE);
    last='Scientific to decimal — calculatepilot.com/math/scientific-notation-calculator.html\n'+$('mant').value+'e'+expV+' = '+fmtDecimal(msci.digits,totalE,msci.neg);
    return;
  }

  /* s3: multiply/divide */
  var pa,pb;try{pa=toSci(parseNum($('aA').value));}catch(e){return fail('A: '+String(e));}
  try{pb=toSci(parseNum($('aB').value));}catch(e){return fail('B: '+String(e));}
  var op=$('opSci').value,opSym=op==='mul'?'×':'÷';
  var Adigits=BigInt(pa.digits),Bdigits=BigInt(pb.digits);
  var rDigits,rE,rNeg=(pa.neg!==pb.neg);
  if(op==='mul'){
    var prod=Adigits*Bdigits;
    rDigits=prod.toString();
    rE=pa.E+pb.E-(pa.digits.length-1)-(pb.digits.length-1)+(rDigits.length-1);
  }else{
    if(Bdigits===0n)return fail('Cannot divide by zero.');
    var lenA=pa.digits.length,lenB=pb.digits.length,guard=30;
    var qInt=(Adigits*(10n**BigInt(guard)))/Bdigits;
    var qStr=qInt.toString(),qExp=qStr.length-1-guard;
    rDigits=qStr.replace(/0+$/,'')||'0';
    rE=qExp+lenB-lenA+pa.E-pb.E;
  }
  var K3=8;if(rDigits.length>K3){var rd3=roundDigits(rDigits,K3);rDigits=rd3.digits;if(rd3.carried)rE+=1;}
  C.text('heroLbl','A '+opSym+' B, scientific notation');C.html('resultValue',fmtSci(rDigits,rE,rNeg));tg.textContent=op==='mul'?'multiply mantissas, add exponents':'divide mantissas, subtract exponents';
  C.text('ex1L','E-notation');C.text('ex1',fmtENot(rDigits,rE,rNeg));
  C.html('ex2L','Decimal (may be truncated)');C.html('ex2',esc(fmtDecimal(rDigits,rE,rNeg)));
  C.html('fxNow',fmtENot(pa.digits,pa.E,pa.neg)+' '+opSym+' '+fmtENot(pb.digits,pb.E,pb.neg));
  C.text('interp',op==='mul'?'Multiply the mantissas and add the exponents, then renormalize if the mantissa product is 10 or more.':'Divide the mantissas and subtract the exponents, then renormalize if needed.');
  tiles([['A',fmtENot(pa.digits,pa.E,pa.neg),''],['B',fmtENot(pb.digits,pb.E,pb.neg),''],['Mantissas '+opSym,op==='mul'?'multiplied':'divided',''],['Exponents',op==='mul'?'added: '+pa.E+' + '+pb.E+' = '+(pa.E+pb.E):'subtracted: '+pa.E+' − '+pb.E+' = '+(pa.E-pb.E)]]);
  var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st3(op==='mul'?'Multiply the mantissas':'Divide the mantissas',null,(pa.digits[0]+'.'+pa.digits.slice(1))+' '+opSym+' '+(pb.digits[0]+'.'+pb.digits.slice(1)));
  st3(op==='mul'?'Add the exponents':'Subtract the exponents',null,pa.E+(op==='mul'?' + ':' − ')+pb.E+' = '+(op==='mul'?pa.E+pb.E:pa.E-pb.E));
  st3('Renormalize to standard form','If the mantissa isn’t in [1, 10), shift the decimal point and adjust the exponent.','<b>'+fmtSci(rDigits,rE,rNeg)+'</b>');
  $('steps').innerHTML=h3;C.text('stepsIntro',fmtENot(pa.digits,pa.E,pa.neg)+' '+opSym+' '+fmtENot(pb.digits,pb.E,pb.neg)+'.');C.text('stepsTag',op==='mul'?'multiply':'divide');
  last='Scientific notation arithmetic — calculatepilot.com/math/scientific-notation-calculator.html\n'+$('aA').value+' '+opSym+' '+$('aB').value+' = '+fmtENot(rDigits,rE,rNeg);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'snCalc',compute:compute});
  $('presets').addEventListener('click',function(e){
    var b=e.target.closest('button[data-m]');if(!b)return;
    C.set('mode',b.getAttribute('data-m'));
    if(b.hasAttribute('data-v'))C.set('v',b.getAttribute('data-v'));
    if(b.hasAttribute('data-a')){C.set('aA',b.getAttribute('data-a'));C.set('aB',b.getAttribute('data-b'));C.set('opSci',b.getAttribute('data-op'));}
    fire('v');
  });
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
