/* Binary calculator — CalculatePilot (Stitch redesign). Exact BigInt arithmetic masked to the chosen register width.
   Two's complement: negate = flip bits + 1. ASR preserves the sign bit; LSL/LSR fill with 0; ROL/ROR wrap around. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function mask(w){return (1n<<BigInt(w))-1n;}
function parseBin(s,label){
  s=String(s||'').trim().replace(/[\s_]/g,'');
  if(!s)return {err:label+' está vacío.'};
  if(!/^[01]+$/.test(s))return {err:label+' debe contener solo 0 y 1.'};
  if(s.length>64)return {err:label+' tiene más de 64 bits.'};
  return {v:BigInt('0b'+s),bits:s.length};
}
function toBinPad(v,w){var s=(v&mask(w)).toString(2);while(s.length<w)s='0'+s;return s;}
function nibbles(s){var out=[];for(var i=s.length;i>0;i-=4)out.unshift(s.slice(Math.max(0,i-4),i));return out;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function signedVal(v,w){var m=mask(w);v&=m;var sign=1n<<BigInt(w-1);return (v&sign)?v-(m+1n):v;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word;font-family:var(--font-mono)">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function bitViz(binStr,w){
  var nib=nibbles(binStr);
  var html='<div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start">';
  nib.forEach(function(nb,ni){
    html+='<div style="display:flex;gap:3px">';
    nb.split('').forEach(function(bit){
      html+='<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:'+(bit==='1'?'var(--sx-primary)':'var(--sx-low)')+';color:'+(bit==='1'?'#fff':'var(--sx-muted)')+';font:700 15px var(--font-mono)">'+bit+'</span>';
    });
    html+='</div>';
  });
  html+='</div>';
  $('viz').innerHTML=html;
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  var w=parseInt($('width').value,10)||8;
  $('fA').hidden=(m==='s4');$('fB').hidden=(m==='s4'||m==='s3'||(m==='s2'&&$('opBit').value==='not'));
  $('fOpArith').hidden=(m!=='s1');$('fOpBit').hidden=(m!=='s2');$('fOpShift').hidden=(m!=='s3');$('fTC').hidden=(m!=='s4');
  var labels={s1:'Aritmética binaria',s2:'Lógica bit a bit',s3:'Desplazamiento y rotación',s4:'Conversión a complemento a dos'};
  C.html('formH',labels[m]);

  if(m==='s4'){
    var dv=parseInt($('dec').value,10);
    if(!isFinite(dv))return fail('Introduce un número entero.');
    var lo=-(1n<<BigInt(w-1)),hi=(1n<<BigInt(w-1))-1n,dvb=BigInt(dv);
    if(dvb<lo||dvb>hi)return fail('At '+w+' bits de ancho, el rango con signo es ['+lo+', '+hi+']. Elige un registro más ancho o un valor menor.');
    var enc=dvb<0n?(mask(w)+1n+dvb):dvb;
    var bin=toBinPad(enc,w);
    C.text('heroLbl','Complemento a dos ('+w+'-bit)');C.text('resultValue',bin);tg.textContent=dv<0?'negative':'non-negative';
    C.text('ex1L','Valor sin signo de este patrón');C.text('ex1',grp(enc.toString()));
    C.text('ex2L','Hexadecimal');C.text('ex2','0x'+enc.toString(16).toUpperCase());
    C.text('interp',dv<0?'Para codificar un número negativo: escribe |'+dv+'| en binario, invierte cada bit y luego suma 1.':'Los números no negativos se escriben directamente en binario, con un bit de signo 0 al inicio.');
    C.html('fxNow','Codificar '+dv+' as '+w+' bits en complemento a dos');
    var absBin=toBinPad(BigInt(Math.abs(dv)),w),flipped=toBinPad(mask(w)^BigInt(Math.abs(dv)),w);
    tiles([['Valor decimal',String(dv),''],['Bit de signo',bin[0],bin[0]==='1'?'negative':'non-negative'],['Rango a '+w+'-bit',lo+' to '+hi,''],['Hexadecimal',  '0x'+enc.toString(16).toUpperCase(),'']]);
    bitViz(bin,w);C.text('vizTag',w+'-bit');
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    if(dv>=0){st1('Escribe la magnitud directamente en binario','Los números no negativos no necesitan ajuste.','<b>'+bin+'</b>');}
    else{
      st1('Escribe la magnitud en binario','|'+dv+'| = '+Math.abs(dv)+' → '+absBin);
      st1('Invierte cada bit (complemento a uno)','Cambia los 0 por 1 y los 1 por 0.',absBin+' → <b>'+flipped+'</b>');
      st1('Suma 1','Esto da la codificación en complemento a dos.',flipped+' + 1 = <b>'+bin+'</b>');
    }
    st1('Compruébalo decodificándolo de nuevo','Al leer el bit de signo y la magnitud debería obtenerse el valor original.',bin+' → <b>'+dv+'</b> ✓');
    $('steps').innerHTML=h1;C.text('stepsIntro','Codificación '+dv+' in '+w+' bits en complemento a dos.');C.text('stepsTag',w+'-bit');
    last='Complemento a dos — calculatepilot.com/math/binary-calculator.html\n'+dv+' in '+w+' bits en complemento a dos = '+bin;
    return;
  }

  var A=parseBin($('a').value,'Operando A');if(A.err)return fail(A.err);
  var av=A.v&mask(w);

  if(m==='s2'&&$('opBit').value==='not'){
    var rNot=(~av)&mask(w),binN=toBinPad(rNot,w);
    C.html('fxNow','NOT '+toBinPad(av,w));
    C.text('heroLbl','Resultado (binario)');C.text('resultValue',binN);tg.textContent='NOT';
    C.text('ex1L','Decimal (sin signo)');C.text('ex1',grp(rNot.toString()));
    C.text('ex2L','Hexadecimal');C.text('ex2','0x'+rNot.toString(16).toUpperCase());
    C.text('interp','Se invierte cada bit: el 0 pasa a ser 1 y el 1 pasa a ser 0.');
    tiles([['A',toBinPad(av,w),''],['NOT A',binN,''],['Ancho',w+'-bit','']]);
    bitViz(binN,w);C.text('vizTag','NOT, '+w+'-bit');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Invierte cada bit</h4><span class="eq">'+toBinPad(av,w)+' → <b>'+binN+'</b></span></li>';
    C.text('stepsIntro','NOT '+toBinPad(av,w)+'.');C.text('stepsTag','NOT bit a bit');
    last='NOT binario — calculatepilot.com/math/binary-calculator.html\nNOT '+toBinPad(av,w)+' = '+binN;
    return;
  }

  var B=parseBin($('b').value,'Operando B');if(B.err)return fail(B.err);
  var bv=B.v&mask(w);
  var binA=toBinPad(av,w),binB=toBinPad(bv,w);

  if(m==='s1'){
    var op=$('opArith').value,raw,ov=false,opSym={add:'+',sub:'−',mul:'×',div:'÷'}[op];
    if(op==='add')raw=av+bv;
    else if(op==='sub')raw=av-bv;
    else if(op==='mul')raw=av*bv;
    else{if(bv===0n)return fail('No se puede dividir entre cero (B = 0).');raw=av/bv;}
    var result=raw;
    if(op==='sub'&&raw<0n){result=raw&mask(w);ov=true;}
    else if((op==='add'||op==='mul')&&raw>mask(w)){result=raw&mask(w);ov=true;}
    var binR=toBinPad(result,w);
    C.html('fxNow',binA+' '+opSym+' '+binB+' ('+w+'-bit)');
    C.text('heroLbl','Resultado (binario)');C.text('resultValue',binR);tg.textContent=ov?'desbordamiento — truncado a '+w+' bits':'sin desbordamiento';tg.className='sx-ef-grade'+(ov?' mid':'');
    C.text('ex1L','Decimal (sin signo)');C.text('ex1',grp(result.toString()));
    C.text('ex2L','Hexadecimal');C.text('ex2','0x'+result.toString(16).toUpperCase());
    C.text('interp','A = '+grp(av.toString())+', B = '+grp(bv.toString())+(op==='div'?', cociente truncado hacia cero (resto '+grp((av%bv).toString())+').':'.')+(ov?' El resultado real necesita más de '+w+' bits, por lo que se desborda y se reinicia.':''));
    tiles([['A (decimal)',grp(av.toString()),binA],['B (decimal)',grp(bv.toString()),binB],['Resultado exacto (sin límite)',grp(raw.toString()),op==='sub'&&raw<0n?'negativo — se reinicia en sin signo '+w+'-bit':(raw>mask(w)?'exceeds '+w+'bits de rango':'')],['¿Desbordamiento?',ov?'Sí':'No','dado un registro sin signo de '+w+'bits']]);
    bitViz(binR,w);C.text('vizTag',w+'-bit, '+(ov?'overflow':'exact'));
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Convierte ambos operandos a decimal','A = '+binA+' = '+av+',  B = '+binB+' = '+bv);
    st2('Haz la operación en decimal',null,av+' '+opSym+' '+bv+' = <b>'+raw+'</b>');
    if(ov)st2('Aplica la máscara a '+w+' bits','El resultado exacto no cabe en '+w+' bits, así que se descartan los bits altos (se reinicia el valor).',raw+' mod 2^'+w+' = <b>'+result+'</b>');
    st2('Convierte de nuevo a binario',null,result+' = <b>'+binR+'</b>');
    $('steps').innerHTML=h2;C.text('stepsIntro',binA+' '+opSym+' '+binB+' at '+w+'bits de ancho.');C.text('stepsTag',ov?'overflow':'exact');
    last='Aritmética binaria — calculatepilot.com/math/binary-calculator.html\n'+binA+' '+opSym+' '+binB+' = '+binR+' (decimal '+result+')'+(ov?' [overflow]':'');
    return;
  }
  if(m==='s2'){
    var op2=$('opBit').value;
    var r2;
    if(op2==='and')r2=av&bv;else if(op2==='or')r2=av|bv;else if(op2==='xor')r2=av^bv;
    else if(op2==='nand')r2=(~(av&bv))&mask(w);else r2=(~(av|bv))&mask(w);
    var binR2=toBinPad(r2,w),lbl=op2.toUpperCase();
    C.html('fxNow',binA+' '+lbl+' '+binB);
    C.text('heroLbl','Resultado (binario)');C.text('resultValue',binR2);tg.textContent=lbl;
    C.text('ex1L','Decimal (sin signo)');C.text('ex1',grp(r2.toString()));
    C.text('ex2L','Hexadecimal');C.text('ex2','0x'+r2.toString(16).toUpperCase());
    C.text('interp','Cada bit del resultado se obtiene aplicando '+lbl+' a los bits correspondientes de A y B de forma independiente.');
    tiles([['A',binA,''],['B',binB,''],['Puerta',lbl,''],['Resultado',binR2,'']]);
    bitViz(binR2,w);C.text('vizTag',lbl+', '+w+'-bit');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Aplica '+lbl+' bit a bit</h4><span class="eq">'+binA+' '+lbl+' '+binB+' = <b>'+binR2+'</b></span></li>';
    C.text('stepsIntro',binA+' '+lbl+' '+binB+'.');C.text('stepsTag',lbl);
    last='Binario '+lbl+' — calculatepilot.com/math/binary-calculator.html\n'+binA+' '+lbl+' '+binB+' = '+binR2;
    return;
  }
  /* s3: shift/rotate — uses only A */
  var opS=$('opShift').value,sn=parseInt($('shiftN').value,10)||0;
  sn=((sn%w)+w)%w;
  var rS;
  if(opS==='lsl')rS=(av<<BigInt(sn))&mask(w);
  else if(opS==='lsr')rS=av>>BigInt(sn);
  else if(opS==='asr'){var sv=signedVal(av,w);var shifted=sv>>BigInt(sn);rS=shifted&mask(w);}
  else{rS=((av<<BigInt(sn))|(av>>BigInt(w-sn||w)))&mask(w);if(sn===0)rS=av;}
  var binR3=toBinPad(rS,w),lblS={lsl:'LSL (lógico a la izquierda)',lsr:'LSR (lógico a la derecha)',asr:'ASR (aritmético a la derecha)',rol:'ROL (rotar a la izquierda)'}[opS];
  C.html('fxNow',binA+' '+lblS+' by '+sn);
  C.text('heroLbl','Resultado (binario)');C.text('resultValue',binR3);tg.textContent=lblS;
  C.text('ex1L','Decimal (sin signo)');C.text('ex1',grp(rS.toString()));
  C.text('ex2L','Interpretación con signo');C.text('ex2',String(signedVal(rS,w)));
  C.text('interp',opS==='lsl'?'Cada bit se desplaza a la izquierda '+sn+'; los bits bajos que quedan libres se rellenan con 0 (los bits que sobrepasan el extremo superior se descartan).':opS==='lsr'?'Cada bit se desplaza a la derecha '+sn+'; los bits altos que quedan libres se rellenan con 0.':opS==='asr'?'Cada bit se desplaza a la derecha '+sn+', pero el bit de signo se copia en los bits altos que quedan libres, conservando el signo.':'Los bits que salen por la izquierda reaparecen por la derecha: no se pierde ningún bit.');
  tiles([['A',binA,''],['Cantidad de desplazamiento',String(sn),''],['Tipo',lblS,''],['Resultado',binR3,'']]);
  bitViz(binR3,w);C.text('vizTag',lblS);
  $('steps').innerHTML='<li><span class="n">1</span><h4>Aplica el desplazamiento</h4><span class="eq">'+binA+' '+lblS+' '+sn+' = <b>'+binR3+'</b></span></li>';
  C.text('stepsIntro',binA+' '+lblS+' by '+sn+'.');C.text('stepsTag',lblS);
  last='Desplazamiento binario — calculatepilot.com/math/binary-calculator.html\n'+binA+' '+lblS+' '+sn+' = '+binR3;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bnCalc',compute:compute});
  $('presets').addEventListener('click',function(e){
    var b=e.target.closest('button[data-m]');if(!b)return;
    C.set('mode',b.getAttribute('data-m'));
    if(b.hasAttribute('data-a')&&b.getAttribute('data-m')!=='s4')C.set('a',b.getAttribute('data-a'));
    if(b.hasAttribute('data-b'))C.set('b',b.getAttribute('data-b'));
    if(b.hasAttribute('data-op')){var mm=b.getAttribute('data-m');C.set(mm==='s1'?'opArith':mm==='s2'?'opBit':'opShift',b.getAttribute('data-op'));}
    if(b.hasAttribute('data-dec'))C.set('dec',b.getAttribute('data-dec'));
    fire('width');
  });
  $('swap').addEventListener('click',function(){var t=$('a').value;C.set('a',$('b').value);C.set('b',t);fire('a');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
