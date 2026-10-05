/* Love calculator (entertainment) — CalculatePilot (Stitch redesign).
   Love percentage: counts of l,o,v,e,s in name1+"loves"+name2, adjacent digits added (two-digit sums split) until two digits remain.
   FLAMES: cancel shared letters, count the rest, eliminate letters of FLAMES cyclically. Love languages: static pairing tips. */
(function(){
var C=window.CPX,$=C.$,last='';
var LANG={words:'Palabras de afirmación',time:'Tiempo de calidad',acts:'Actos de servicio',touch:'Contacto físico',gifts:'Recibir regalos'};
var GIVE={words:'dilo en voz alta: da las gracias, elogia cosas concretas, envía mensajes cariñosos',time:'dedica atención plena: planea tiempo juntos sin teléfonos',acts:'quítale una tarea de encima sin que te lo pida',touch:'ofrece abrazos, tomarse de la mano y cercanía',gifts:'haz pequeños regalos con detalle que muestren que pensaste en esa persona'};
var FL={F:'Amistad',L:'Amor',A:'Cariño',M:'Matrimonio',E:'Enemigos',S:'Hermanos'};
function letters(s){return (s||'').toLowerCase().replace(/[^a-zÀ-ɏ]/g,'');}
function lovePct(a,b){var s=letters(a)+'loves'+letters(b),d='',steps,i;'loves'.split('').forEach(function(c){var n=0;for(i=0;i<s.length;i++)if(s.charAt(i)===c)n++;d+=n;});steps=[d];var it=0;
  while(d.length>2&&it<12){var nd='';for(i=0;i<d.length-1;i++)nd+=(+d.charAt(i))+(+d.charAt(i+1));d=nd;steps.push(d);it++;}
  while(d.length>2){var nd2='';for(i=0;i<d.length-1;i++)nd2+=((+d.charAt(i))+(+d.charAt(i+1)))%10;d=nd2;steps.push(d);}
  return {pct:parseInt(d,10),steps:steps,counts:steps[0]};}
function flames(a,b){var x=letters(a).split(''),y=letters(b).split(''),i;x.slice().forEach(function(c){var j=y.indexOf(c);if(j>=0){x.splice(x.indexOf(c),1);y.splice(j,1);}});
  var n=x.length+y.length,L='FLAMES'.split(''),idx=0,order=[];if(n===0)return {n:0,res:null};
  while(L.length>1){idx=(idx+n-1)%L.length;order.push(L.splice(idx,1)[0]);}
  return {n:n,res:L[0],order:order,left:x.join('')+y.join('')};}
function band(p){return p>=85?'Pareja perfecta':p>=65?'Muy buena pareja':p>=40?'Buenas posibilidades':p>=20?'Margen para crecer':'¿Solo amigos?';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('wk','—');last='';}
function compute(){
  var mode=$('mode').value;$('err').hidden=true;$('gNames').hidden=mode==='lang';$('gLang').hidden=mode!=='lang';
  if(mode==='lang'){
    var a=$('l1').value,b=$('l2').value;
    C.text('hL','Lenguajes del amor');C.text('resultValue',a===b?'Mismo lenguaje':'Lenguajes distintos');C.text('tag',LANG[a]+' + '+LANG[b]);
    C.text('interp',a===b?'Ambos valoran '+LANG[a].toLowerCase()+'. Lean into it and check in on what that means for each of you.':'Cada uno se siente querido de una forma distinta, así que ayuda decir qué funciona.');
    C.text('wkH','Ideas');C.text('wk','La persona 1 muestra amor a la persona 2 (que prefiere '+LANG[b].toLowerCase()+'): '+GIVE[b]+'. Partner 2 shows love to Partner 1 (who prefers '+LANG[a].toLowerCase()+'): '+GIVE[a]+'.');
    C.text('note','Los lenguajes del amor son un punto de partida para conversar. La investigación no muestra que coincidir en ellos permita predecir relaciones más felices.');
    last='Lenguajes del amor — calculatepilot.com/other/love-calculator.html\n'+LANG[a]+' and '+LANG[b];return;}
  var n1=letters($('n1').value),n2=letters($('n2').value);
  if(!n1||!n2)return fail('Introduce dos nombres.');
  C.text('wkH','Cómo se calculó');
  if(mode==='love'){var r=lovePct($('n1').value,$('n2').value);
    C.text('hL','Porcentaje de amor');C.text('resultValue',r.pct+'%');C.text('tag',band(r.pct));C.text('interp',$('n1').value.trim()+' and '+$('n2').value.trim()+'.');
    C.text('wk','Recuento de L, O, V, E, S: '+r.counts.split('').join(' ')+'. Adding neighbours: '+(r.steps.length>7?r.steps.slice(1,6).map(function(s){return s.split('').join(' ');}).join(' → ')+' → … ':r.steps.slice(1).map(function(s){return s.split('').join(' ');}).join(' → '))+' → '+r.pct+'.');
    C.text('note','Este es un juego de entretenimiento basado en las letras de los nombres. No puede medir ni predecir una relación real.');
    last='Calculadora del amor — calculatepilot.com/other/love-calculator.html\n'+$('n1').value.trim()+' + '+$('n2').value.trim()+': '+r.pct+'% ('+band(r.pct)+')';}
  else{var f=flames($('n1').value,$('n2').value);
    if(f.n===0){C.text('hL','FLAMES');C.text('resultValue','—');C.text('tag','nombres idénticos');C.text('interp','Se cancelaron todas las letras, así que FLAMES no tiene nada que contar.');C.text('wk','Prueba con dos nombres distintos.');return;}
    C.text('hL','FLAMES');C.text('resultValue',FL[f.res]);C.text('tag',f.res);C.text('interp',$('n1').value.trim()+' and '+$('n2').value.trim()+'.');
    C.text('wk','Letras restantes tras tachar las compartidas: '+f.left+' ('+f.n+'). Contando '+f.n+' cada vez, eliminado: '+f.order.map(function(c){return c+' ('+FL[c]+')';}).join(', ')+'. Left: '+f.res+'.');
    C.text('note','FLAMES es un juego infantil. No es una predicción.');
    last='FLAMES — calculatepilot.com/other/love-calculator.html\n'+$('n1').value.trim()+' + '+$('n2').value.trim()+': '+FL[f.res];}
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'lvCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
