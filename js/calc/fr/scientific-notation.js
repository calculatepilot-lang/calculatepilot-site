/* Scientific notation calculator — CalculatePilot (Stitch redesign).
   Mantissa/exponent extracted from the exact decimal digit string (no floating-point rounding);
   half-to-even rounding performed on the digit string, matching the sig-fig calculator's engine. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
var SI=[[24,'yotta','Y'],[21,'zetta','Z'],[18,'exa','E'],[15,'peta','P'],[12,'tera','T'],[9,'giga','G'],[6,'mega','M'],[3,'kilo','k'],[0,'','' ],[-3,'milli','m'],[-6,'micro','µ'],[-9,'nano','n'],[-12,'pico','p'],[-15,'femto','f'],[-18,'atto','a'],[-21,'zepto','z'],[-24,'yocto','y']];

function parseNum(raw){
  var s=String(raw||'').trim();
  if(!s)throw 'Saisissez un nombre.';
  var neg=false;if(s[0]==='+'||s[0]==='-'){neg=s[0]==='-';s=s.slice(1);}
  var m=s.match(/^(\d*)(\.(\d*))?([eE]([+-]?\d+))?$/);
  if(!m||(!m[1]&&!m[3]))throw 'Impossible d\'analyser « '+raw+' » comme un nombre.';
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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';C.text('vizTag','—');}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fDec').hidden=(m!=='s1');$('fSci').hidden=(m!=='s2');$('fArith').hidden=(m!=='s3');
  var labels={s1:'Décimal → notation scientifique',s2:'Notation scientifique → décimal',s3:'Multiplier ou diviser en notation scientifique'};
  C.html('formH',labels[m]);

  if(m==='s1'){
    var p;try{p=parseNum($('v').value);}catch(e){return fail(String(e));}
    var sci=toSci(p),K=+$('k').value;
    var digitsToShow=sci.digits,Eshow=sci.E,carried=false;
    if(K>0&&K<sci.digits.length){var rd=roundDigits(sci.digits,K);digitsToShow=rd.digits;carried=rd.carried;Eshow=sci.E+(carried?1:0);}
    C.text('heroLbl','Notation scientifique standard');C.html('resultValue',fmtSci(digitsToShow,Eshow,sci.neg));tg.textContent='1 ≤ |m| < 10';
    var eng=fmtEng(sci.digits,sci.E,sci.neg);
    C.html('ex1L','Notation ingénieur');C.html('ex1',eng.str);
    var si=siPrefix(eng.E);
    C.html('ex2L','Forme avec préfixe SI');C.html('ex2',eng.mantissaDigits.replace(/^−/,'')+(sci.neg?' (−)':'')+' '+(si[1]?si[1]+' ('+si[2]+')':'(sans préfixe)'));
    C.html('fxNow',esc($('v').value)+' = '+fmtENot(digitsToShow,Eshow,sci.neg));
    C.text('interp','La virgule se déplace de '+Math.abs(sci.E)+' places '+(sci.E>=0?'left':'right')+' pour ramener le nombre à un seul chiffre avant la virgule.');
    tiles([
      ['Mantisse',digitsToShow.length>1?digitsToShow[0]+'.'+digitsToShow.slice(1):digitsToShow[0],'1 ≤ |m| < 10'],
      ['Exposant',String(Eshow),'puissance de 10'],
      ['E-notation',fmtENot(digitsToShow,Eshow,sci.neg),'forme texte pour l’informatique'],
      ['Décimal complet',fmtDecimal(sci.digits,sci.E,sci.neg),'non arrondi, à titre de comparaison']
    ]);
    var n=0,h='';function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st('Trouvez le premier chiffre significatif','Il devient l’unique chiffre avant la virgule.','chiffre « '+sci.digits[0]+'"');
    st('Comptez de combien de rangs la virgule se déplace','Ce nombre (avec son signe) est l’exposant.','moved '+Math.abs(sci.E)+' rangs → exposant = <b>'+sci.E+'</b>');
    if(K>0&&K<toSci(p).digits.length)st('Arrondissez la mantisse à '+K+' chiffres significatifs','Arrondi exact à la valeur paire la plus proche sur la chaîne de chiffres.',toSci(p).digits+' → <b>'+digitsToShow+'</b>'+(carried?' (l’arrondi a produit un nouveau chiffre de tête, exposant +1)':''));
    st('Écrivez sous forme standard',null,'<b>'+fmtSci(digitsToShow,Eshow,sci.neg)+'</b>');
    $('steps').innerHTML=h;C.text('stepsIntro','Conversion en cours '+esc($('v').value)+' en notation scientifique.');C.text('stepsTag','E = '+Eshow);
    last='Notation scientifique — calculatepilot.com/math/scientific-notation-calculator.html\n'+$('v').value+' = '+fmtENot(digitsToShow,Eshow,sci.neg)+'\nengineering: '+eng.str.replace(/<[^>]+>/g,'');
    return;
  }

  if(m==='s2'){
    var mp;try{mp=parseNum($('mant').value);}catch(e){return fail('Mantisse : '+String(e));}
    var expV=parseInt($('exp').value,10);
    if(!isFinite(expV))return fail('Saisissez un exposant entier.');
    var msci=toSci(mp);
    var totalE=msci.E+expV;
    C.text('heroLbl','Valeur décimale');C.html('resultValue',esc(fmtDecimal(msci.digits,totalE,msci.neg)));tg.textContent='exact';
    C.html('ex1L','Forme scientifique standard');C.html('ex1',fmtSci(msci.digits,totalE,msci.neg));
    C.text('ex2L','E-notation');C.text('ex2',fmtENot(msci.digits,totalE,msci.neg));
    C.html('fxNow',esc($('mant').value)+' × 10<sup>'+expV+'</sup>');
    C.text('interp','Déplacez la virgule '+Math.abs(totalE)+' places '+(totalE>=0?'right':'left')+' à partir de la mantisse pour obtenir la valeur décimale complète.');
    tiles([['Mantisse',$('mant').value,''],['Exposant',String(expV),''],['Exposant combiné',String(totalE),'tient compte de tout exposant déjà présent dans la mantisse'],['Valeur décimale',fmtDecimal(msci.digits,totalE,msci.neg),'']]);
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Lisez la mantisse et l’exposant',null,$('mant').value+' × 10<sup>'+expV+'</sup>');
    st2('Décalez la virgule selon l’exposant','Un exposant positif la déplace vers la droite ; un exposant négatif vers la gauche.','décalage de '+totalE+' places');
    st2('Écrivez la valeur décimale complète',null,'<b>'+fmtDecimal(msci.digits,totalE,msci.neg)+'</b>');
    $('steps').innerHTML=h2;C.text('stepsIntro','Conversion en cours '+$('mant').value+'×10^'+expV+' en décimal.');C.text('stepsTag','exponent '+totalE);
    last='Scientifique vers décimal — calculatepilot.com/math/scientific-notation-calculator.html\n'+$('mant').value+'e'+expV+' = '+fmtDecimal(msci.digits,totalE,msci.neg);
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
    if(Bdigits===0n)return fail('Division par zéro impossible.');
    var lenA=pa.digits.length,lenB=pb.digits.length,guard=30;
    var qInt=(Adigits*(10n**BigInt(guard)))/Bdigits;
    var qStr=qInt.toString(),qExp=qStr.length-1-guard;
    rDigits=qStr.replace(/0+$/,'')||'0';
    rE=qExp+lenB-lenA+pa.E-pb.E;
  }
  var K3=8;if(rDigits.length>K3){var rd3=roundDigits(rDigits,K3);rDigits=rd3.digits;if(rd3.carried)rE+=1;}
  C.text('heroLbl','A '+opSym+' B, notation scientifique');C.html('resultValue',fmtSci(rDigits,rE,rNeg));tg.textContent=op==='mul'?'multipliez les mantisses, additionnez les exposants':'divisez les mantisses, soustrayez les exposants';
  C.text('ex1L','E-notation');C.text('ex1',fmtENot(rDigits,rE,rNeg));
  C.html('ex2L','Décimal (peut être tronqué)');C.html('ex2',esc(fmtDecimal(rDigits,rE,rNeg)));
  C.html('fxNow',fmtENot(pa.digits,pa.E,pa.neg)+' '+opSym+' '+fmtENot(pb.digits,pb.E,pb.neg));
  C.text('interp',op==='mul'?'Multipliez les mantisses et additionnez les exposants, puis renormalisez si le produit des mantisses vaut 10 ou plus.':'Divisez les mantisses et soustrayez les exposants, puis renormalisez si nécessaire.');
  tiles([['A',fmtENot(pa.digits,pa.E,pa.neg),''],['B',fmtENot(pb.digits,pb.E,pb.neg),''],['Mantisses '+opSym,op==='mul'?'multiplied':'divided',''],['Exposants',op==='mul'?'additionnés : '+pa.E+' + '+pb.E+' = '+(pa.E+pb.E):'soustraits : '+pa.E+' − '+pb.E+' = '+(pa.E-pb.E)]]);
  var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st3(op==='mul'?'Multipliez les mantisses':'Divisez les mantisses',null,(pa.digits[0]+'.'+pa.digits.slice(1))+' '+opSym+' '+(pb.digits[0]+'.'+pb.digits.slice(1)));
  st3(op==='mul'?'Additionnez les exposants':'Soustrayez les exposants',null,pa.E+(op==='mul'?' + ':' − ')+pb.E+' = '+(op==='mul'?pa.E+pb.E:pa.E-pb.E));
  st3('Renormalisez sous forme standard','Si la mantisse n’est pas dans [1, 10[, décalez la virgule et ajustez l’exposant.','<b>'+fmtSci(rDigits,rE,rNeg)+'</b>');
  $('steps').innerHTML=h3;C.text('stepsIntro',fmtENot(pa.digits,pa.E,pa.neg)+' '+opSym+' '+fmtENot(pb.digits,pb.E,pb.neg)+'.');C.text('stepsTag',op==='mul'?'multiply':'divide');
  last='Arithmétique en notation scientifique — calculatepilot.com/math/scientific-notation-calculator.html\n'+$('aA').value+' '+opSym+' '+$('aB').value+' = '+fmtENot(rDigits,rE,rNeg);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
