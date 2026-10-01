/* Binary calculator — CalculatePilot (Stitch redesign). Exact BigInt arithmetic masked to the chosen register width.
   Two's complement: negate = flip bits + 1. ASR preserves the sign bit; LSL/LSR fill with 0; ROL/ROR wrap around. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function mask(w){return (1n<<BigInt(w))-1n;}
function parseBin(s,label){
  s=String(s||'').trim().replace(/[\s_]/g,'');
  if(!s)return {err:label+' est vide.'};
  if(!/^[01]+$/.test(s))return {err:label+' ne doit contenir que des 0 et des 1.'};
  if(s.length>64)return {err:label+' dépasse 64 bits.'};
  return {v:BigInt('0b'+s),bits:s.length};
}
function toBinPad(v,w){var s=(v&mask(w)).toString(2);while(s.length<w)s='0'+s;return s;}
function nibbles(s){var out=[];for(var i=s.length;i>0;i-=4)out.unshift(s.slice(Math.max(0,i-4),i));return out;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function signedVal(v,w){var m=mask(w);v&=m;var sign=1n<<BigInt(w-1);return (v&sign)?v-(m+1n):v;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word;font-family:var(--font-mono)">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

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
  var labels={s1:'Arithmétique binaire',s2:'Logique bit à bit',s3:'Décalage &amp; rotation',s4:'Conversion en complément à deux'};
  C.html('formH',labels[m]);

  if(m==='s4'){
    var dv=parseInt($('dec').value,10);
    if(!isFinite(dv))return fail('Saisissez un entier.');
    var lo=-(1n<<BigInt(w-1)),hi=(1n<<BigInt(w-1))-1n,dvb=BigInt(dv);
    if(dvb<lo||dvb>hi)return fail('At '+w+' bits, la plage signée est ['+lo+', '+hi+']. Choisissez un registre plus large ou une valeur plus petite.');
    var enc=dvb<0n?(mask(w)+1n+dvb):dvb;
    var bin=toBinPad(enc,w);
    C.text('heroLbl','Complément à deux ('+w+'-bit)');C.text('resultValue',bin);tg.textContent=dv<0?'negative':'non-negative';
    C.text('ex1L','Valeur non signée de ce motif');C.text('ex1',grp(enc.toString()));
    C.text('ex2L','Hexadécimal');C.text('ex2','0x'+enc.toString(16).toUpperCase());
    C.text('interp',dv<0?'Pour encoder un nombre négatif : écrivez |'+dv+'| en binaire, inversez chaque bit, puis ajoutez 1.':'Les nombres positifs ou nuls s\'écrivent directement en binaire, avec un bit de signe 0 en tête.');
    C.html('fxNow','Encoder en '+dv+' as '+w+' bits en complément à deux');
    var absBin=toBinPad(BigInt(Math.abs(dv)),w),flipped=toBinPad(mask(w)^BigInt(Math.abs(dv)),w);
    tiles([['Valeur décimale',String(dv),''],['Bit de signe',bin[0],bin[0]==='1'?'negative':'non-negative'],['Plage à '+w+'-bit',lo+' to '+hi,''],['Hex',  '0x'+enc.toString(16).toUpperCase(),'']]);
    bitViz(bin,w);C.text('vizTag',w+'-bit');
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    if(dv>=0){st1('Écrivez la valeur absolue directement en binaire','Les nombres positifs ou nuls n\'ont besoin d\'aucun ajustement.','<b>'+bin+'</b>');}
    else{
      st1('Écrivez la valeur absolue en binaire','|'+dv+'| = '+Math.abs(dv)+' → '+absBin);
      st1('Inversez chaque bit (complément à un)','Inversez les 0 et les 1.',absBin+' → <b>'+flipped+'</b>');
      st1('Ajoutez 1','Cela donne l\'encodage en complément à deux.',flipped+' + 1 = <b>'+bin+'</b>');
    }
    st1('Vérifier en décodant le résultat','La lecture du bit de signe et de la magnitude doit redonner la valeur d’origine.',bin+' → <b>'+dv+'</b> ✓');
    $('steps').innerHTML=h1;C.text('stepsIntro','Encodage '+dv+' in '+w+' bits en complément à deux.');C.text('stepsTag',w+'-bit');
    last='Complément à deux — calculatepilot.com/math/binary-calculator.html\n'+dv+' in '+w+' bits en complément à deux = '+bin;
    return;
  }

  var A=parseBin($('a').value,'Opérande A');if(A.err)return fail(A.err);
  var av=A.v&mask(w);

  if(m==='s2'&&$('opBit').value==='not'){
    var rNot=(~av)&mask(w),binN=toBinPad(rNot,w);
    C.html('fxNow','NOT '+toBinPad(av,w));
    C.text('heroLbl','Résultat (binaire)');C.text('resultValue',binN);tg.textContent='NOT';
    C.text('ex1L','Décimal (non signé)');C.text('ex1',grp(rNot.toString()));
    C.text('ex2L','Hexadécimal');C.text('ex2','0x'+rNot.toString(16).toUpperCase());
    C.text('interp','Chaque bit est inversé : 0 devient 1 et 1 devient 0.');
    tiles([['A',toBinPad(av,w),''],['NON A',binN,''],['Largeur',w+'-bit','']]);
    bitViz(binN,w);C.text('vizTag','NON, '+w+'-bit');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Inverser chaque bit</h4><span class="eq">'+toBinPad(av,w)+' → <b>'+binN+'</b></span></li>';
    C.text('stepsIntro','NOT '+toBinPad(av,w)+'.');C.text('stepsTag','NON bit à bit');
    last='NON binaire — calculatepilot.com/math/binary-calculator.html\nNON '+toBinPad(av,w)+' = '+binN;
    return;
  }

  var B=parseBin($('b').value,'Opérande B');if(B.err)return fail(B.err);
  var bv=B.v&mask(w);
  var binA=toBinPad(av,w),binB=toBinPad(bv,w);

  if(m==='s1'){
    var op=$('opArith').value,raw,ov=false,opSym={add:'+',sub:'−',mul:'×',div:'÷'}[op];
    if(op==='add')raw=av+bv;
    else if(op==='sub')raw=av-bv;
    else if(op==='mul')raw=av*bv;
    else{if(bv===0n)return fail('Division par zéro impossible (B = 0).');raw=av/bv;}
    var result=raw;
    if(op==='sub'&&raw<0n){result=raw&mask(w);ov=true;}
    else if((op==='add'||op==='mul')&&raw>mask(w)){result=raw&mask(w);ov=true;}
    var binR=toBinPad(result,w);
    C.html('fxNow',binA+' '+opSym+' '+binB+' ('+w+'-bit)');
    C.text('heroLbl','Résultat (binaire)');C.text('resultValue',binR);tg.textContent=ov?'dépassement de capacité — tronqué à '+w+' bits':'pas de dépassement';tg.className='sx-ef-grade'+(ov?' mid':'');
    C.text('ex1L','Décimal (non signé)');C.text('ex1',grp(result.toString()));
    C.text('ex2L','Hexadécimal');C.text('ex2','0x'+result.toString(16).toUpperCase());
    C.text('interp','A = '+grp(av.toString())+', B = '+grp(bv.toString())+(op==='div'?', quotient tronqué vers zéro (reste '+grp((av%bv).toString())+').':'.')+(ov?' Le résultat exact nécessite plus de '+w+' bits : il y a donc dépassement et rebouclage.':''));
    tiles([['A (décimal)',grp(av.toString()),binA],['B (décimal)',grp(bv.toString()),binB],['Résultat exact (non borné)',grp(raw.toString()),op==='sub'&&raw<0n?'négatif — reboucle en non signé '+w+'-bit':(raw>mask(w)?'exceeds '+w+' bits':'')],['Dépassement ?',ov?'Oui':'No','pour un registre non signé de '+w+' bits']]);
    bitViz(binR,w);C.text('vizTag',w+'-bit, '+(ov?'overflow':'exact'));
    var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st2('Convertir les deux opérandes en décimal','A = '+binA+' = '+av+',  B = '+binB+' = '+bv);
    st2('Effectuer le calcul en décimal',null,av+' '+opSym+' '+bv+' = <b>'+raw+'</b>');
    if(ov)st2('Masquer sur '+w+' bits','Le résultat exact ne tient pas sur '+w+' bits : les bits de poids fort sont donc supprimés (rebouclage).',raw+' mod 2^'+w+' = <b>'+result+'</b>');
    st2('Reconvertir en binaire',null,result+' = <b>'+binR+'</b>');
    $('steps').innerHTML=h2;C.text('stepsIntro',binA+' '+opSym+' '+binB+' at '+w+' bits de largeur.');C.text('stepsTag',ov?'overflow':'exact');
    last='Arithmétique binaire — calculatepilot.com/math/binary-calculator.html\n'+binA+' '+opSym+' '+binB+' = '+binR+' (decimal '+result+')'+(ov?' [overflow]':'');
    return;
  }
  if(m==='s2'){
    var op2=$('opBit').value;
    var r2;
    if(op2==='and')r2=av&bv;else if(op2==='or')r2=av|bv;else if(op2==='xor')r2=av^bv;
    else if(op2==='nand')r2=(~(av&bv))&mask(w);else r2=(~(av|bv))&mask(w);
    var binR2=toBinPad(r2,w),lbl=op2.toUpperCase();
    C.html('fxNow',binA+' '+lbl+' '+binB);
    C.text('heroLbl','Résultat (binaire)');C.text('resultValue',binR2);tg.textContent=lbl;
    C.text('ex1L','Décimal (non signé)');C.text('ex1',grp(r2.toString()));
    C.text('ex2L','Hexadécimal');C.text('ex2','0x'+r2.toString(16).toUpperCase());
    C.text('interp','Chaque bit du résultat s’obtient en appliquant '+lbl+' aux bits correspondants de A et B, indépendamment.');
    tiles([['A',binA,''],['B',binB,''],['Porte',lbl,''],['Résultat',binR2,'']]);
    bitViz(binR2,w);C.text('vizTag',lbl+', '+w+'-bit');
    $('steps').innerHTML='<li><span class="n">1</span><h4>Appliquer '+lbl+' bit à bit</h4><span class="eq">'+binA+' '+lbl+' '+binB+' = <b>'+binR2+'</b></span></li>';
    C.text('stepsIntro',binA+' '+lbl+' '+binB+'.');C.text('stepsTag',lbl);
    last='Binaire '+lbl+' — calculatepilot.com/math/binary-calculator.html\n'+binA+' '+lbl+' '+binB+' = '+binR2;
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
  var binR3=toBinPad(rS,w),lblS={lsl:'LSL (logique à gauche)',lsr:'LSR (logique à droite)',asr:'ASR (arithmétique à droite)',rol:'ROL (rotation à gauche)'}[opS];
  C.html('fxNow',binA+' '+lblS+' by '+sn);
  C.text('heroLbl','Résultat (binaire)');C.text('resultValue',binR3);tg.textContent=lblS;
  C.text('ex1L','Décimal (non signé)');C.text('ex1',grp(rS.toString()));
  C.text('ex2L','Interprétation signée');C.text('ex2',String(signedVal(rS,w)));
  C.text('interp',opS==='lsl'?'Chaque bit se décale vers la gauche de '+sn+' ; les bits de poids faible libérés sont remplis par 0 (les bits qui dépassent en haut sont supprimés).':opS==='lsr'?'Chaque bit se décale vers la droite de '+sn+' ; les bits de poids fort libérés sont remplis par 0.':opS==='asr'?'Chaque bit se décale vers la droite de '+sn+', mais le bit de signe est recopié dans les bits de poids fort libérés, ce qui préserve le signe.':'Les bits qui sortent à gauche réapparaissent à droite — aucun bit n’est perdu.');
  tiles([['A',binA,''],['Amplitude du décalage',String(sn),''],['Type',lblS,''],['Résultat',binR3,'']]);
  bitViz(binR3,w);C.text('vizTag',lblS);
  $('steps').innerHTML='<li><span class="n">1</span><h4>Appliquer le décalage</h4><span class="eq">'+binA+' '+lblS+' '+sn+' = <b>'+binR3+'</b></span></li>';
  C.text('stepsIntro',binA+' '+lblS+' by '+sn+'.');C.text('stepsTag',lblS);
  last='Décalage binaire — calculatepilot.com/math/binary-calculator.html\n'+binA+' '+lblS+' '+sn+' = '+binR3;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
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
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
