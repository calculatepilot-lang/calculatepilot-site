/* Permutation & combination calculator — CalculatePilot (Stitch redesign).
   All arithmetic is exact (BigInt): C(n,r)=n!/(r!(n−r)!), P(n,r)=n!/(n−r)!, C(n+r−1,r), n^r. n, r ≤ 1000. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='';
var HELP={c:'Selecciones sin orden de r elementos distintos de n. Cada elemento se usa como máximo una vez.',p:'Disposiciones ordenadas de r elementos distintos de n. Cada elemento se usa como máximo una vez.',cr:'Selecciones sin orden de r elementos de n tipos, donde se puede elegir el mismo tipo varias veces (multiconjuntos).',pr:'Secuencias ordenadas de longitud r en las que cada posición puede ser cualquiera de los n símbolos.'};

function fact(n){var c=1n,i;for(i=2n;i<=BigInt(n);i++)c*=i;return c;}
function perm(n,r){var c=1n,i;for(i=0;i<r;i++)c*=BigInt(n-i);return c;}
function comb(n,r){if(r<0||r>n)return 0n;var k=Math.min(r,n-r),c=1n,i;for(i=1;i<=k;i++)c=c*BigInt(n-k+i)/BigInt(i);return c;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function big(b){var s=b.toString();if(s.length<=18)return grp(s);return s[0]+'.'+s.slice(1,7)+' × 10^'+(s.length-1);}
function esc(s){return C.esc(s);}
function prodTxt(n,r){var a=[],i,m=Math.min(r,8);for(i=0;i<m;i++)a.push(n-i);var t=a.join(' × ');if(r>8)t+=' × … × '+(n-r+1);return t;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','one','digits','fn','fr','fnr'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('steps').innerHTML='';$('allTbl').tBodies[0].innerHTML='';last='';}

function compute(){
  var mode=$('mode').value,nr=v('n'),rr=v('r'),n=Math.round(nr),r=Math.round(rr),rep=mode==='cr'||mode==='pr';
  C.text('modeHelp',HELP[mode]);C.text('rH',rep?'0 a 1,000 (puede superar n)':'De 0 a n');$('err').hidden=true;
  if(nr!==n||rr!==r||n<0||r<0)return fail('n y r deben ser números enteros, cero o mayores.');
  if(n>1000||r>1000)return fail('Esta calculadora admite n y r hasta 1,000.');
  if(!rep&&r>n)return fail('Para '+(mode==='c'?'combinations':'permutations')+' sin repetición, r no puede ser mayor que n ('+r+' > '+n+'). Elige “con repetición” o reduce r.');
  if(mode==='cr'&&n===0&&r>0)return fail('Con n = 0 tipos no hay nada entre lo que elegir.');
  var res,lab,fx,tag,sentence,Ncr=n+r-1;
  if(mode==='c'){res=comb(n,r);lab='C('+n+', '+r+')';fx='C(n, r) = n! ÷ (r! × (n − r)!)';tag='El orden no importa';sentence='Hay '+big(res)+' formas de elegir '+r+' elementos de '+n+' cuando el orden no importa.';}
  else if(mode==='p'){res=perm(n,r);lab='P('+n+', '+r+')';fx='P(n, r) = n! ÷ (n − r)!';tag='El orden importa';sentence='Hay '+big(res)+' disposiciones ordenadas de '+r+' elementos elegidos de '+n+'.';}
  else if(mode==='cr'){res=comb(Ncr,r);lab='C('+n+' + '+r+' − 1, '+r+') = C('+Ncr+', '+r+')';fx='C(n + r − 1, r) = (n + r − 1)! ÷ (r! × (n − 1)!)';tag='Se permite la repetición';sentence='Hay '+big(res)+' multiconjuntos de tamaño '+r+' from '+n+' tipos.';}
  else{res=BigInt(n)**BigInt(r);lab=n+'^'+r;fx='n^r = n × n × … × n  (r veces)';tag='Se permite la repetición';sentence='Hay '+big(res)+' secuencias ordenadas de longitud '+r+' from '+n+' símbolos.';}
  var s=res.toString();
  C.text('heroLbl',lab);C.text('resultValue',big(res));C.text('interp',sentence);C.text('digits',s.length+' digit'+(s.length===1?'':'s'));
  C.text('oneLbl','Probabilidad de un resultado específico '+(mode==='c'||mode==='cr'?'selection':'outcome'));C.text('one',res>0n?'1 entre '+big(res):'impossible');
  C.text('fxNow',fx);var t=$('tag');t.textContent=tag;t.className='sx-ef-grade';
  C.text('fn',big(fact(n)));C.text('fr',big(fact(r)));C.text('fnr',r<=n?big(fact(n-r)):'n/a');
  /* all four for the same n, r */
  var rows=[['Combinaciones C(n, r)','n! ÷ (r!(n−r)!)',r<=n?comb(n,r):null,'c'],['Permutaciones P(n, r)','n! ÷ (n−r)!',r<=n?perm(n,r):null,'p'],['Combinaciones con repetición','C(n+r−1, r)',(n>0||r===0)?comb(Ncr>=0?Ncr:0,r):null,'cr'],['Permutaciones con repetición','n^r',BigInt(n)**BigInt(r),'pr']];
  $('allTbl').tBodies[0].innerHTML=rows.map(function(x){return '<tr'+(x[3]===mode?' class="act"':'')+'><td style="white-space:normal;font-family:inherit">'+esc(x[0])+(x[3]===mode?' <span class="act">seleccionados</span>':'')+'</td><td class="mono" style="font-size:12px">'+esc(x[1])+'</td><td class="mono">'+(x[2]===null?'n/a':esc(big(x[2])))+'</td></tr>';}).join('');
  /* steps */
  var h='',m=0;function st(a,b,c2){m++;h+='<li><span class="n">'+m+'</span><h4>'+a+'</h4>'+(b?'<p>'+b+'</p>':'')+'<span class="eq">'+c2+'</span></li>';}
  function combSteps(N,k,name){
    var pp=perm(N,k),kf=fact(k),kk=k;
    st('Escribe la fórmula',"Sustituye los valores.",name+' = '+N+'! ÷ ('+k+'! × '+(N-k)+'!)');
    st('Cancela los términos '+(N-k)+'!','Todo desde '+(N-k)+' hacia abajo se cancela entre numerador y denominador, y quedan los primeros '+k+' factores de '+N+'!.',N+'! ÷ '+(N-k)+'! = '+esc(kk===0?'1 (producto vacío)':prodTxt(N,k)));
    st('Multiplica los factores restantes','Este producto parcial es el número de disposiciones ordenadas, P('+N+', '+k+').','P('+N+', '+k+') = <b>'+esc(big(pp))+'</b>');
    st('Divide entre '+k+'!','Elimina los '+k+'! ordenamientos de cada selección.',esc(big(pp))+' ÷ '+k+'! ('+esc(big(kf))+') = <b>'+esc(big(pp/kf))+'</b>');
  }
  if(mode==='c')combSteps(n,r,'C('+n+', '+r+')');
  else if(mode==='p'){
    st('Escribe la fórmula','Sustituye los valores.','P('+n+', '+r+') = '+n+'! ÷ ('+n+' − '+r+')! = '+n+'! ÷ '+(n-r)+'!');
    st('Cancela los términos '+(n-r)+'!','Solo quedan los primeros '+r+' factores de '+n+'! términos.',esc(r===0?'1 (producto vacío)':prodTxt(n,r)));
    st('Multiplicación','','P('+n+', '+r+') = <b>'+esc(big(res))+'</b>');
  }else if(mode==='cr'){
    st('Convierte a una combinación simple','“Estrellas y barras”: repartir r elementos en n tipos equivale a elegir posiciones entre n + r − 1 espacios.','C('+n+' + '+r+' − 1, '+r+') = C('+Ncr+', '+r+')');
    combSteps(Ncr,r,'C('+Ncr+', '+r+')');
  }else{
    st('Una elección independiente por posición','Cada una de las '+r+' posiciones puede ser cualquiera de los '+n+' símbolos.',esc(r===0?'secuencia vacía = 1':(r<=8?Array(r).fill(n).join(' × '):n+' × '+n+' × … × '+n+' ('+r+' veces)')));
    st('Multiplicación','','<b>'+n+'^'+r+' = '+esc(big(res))+'</b>'+(n>1&&r>0?'<br>bits de entropía = '+r+' × log₂('+n+') = '+(r*Math.log2(n)).toFixed(2):''));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Desarrollo exacto para '+lab+'.');C.text('stepsTag',mode==='c'||mode==='cr'?'sin importar el orden':mode==='p'?'importa el orden':'importa el orden');
  last=s;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('n').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pcCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;C.set('mode',b.getAttribute('data-m'));C.set('n',b.getAttribute('data-n'));C.set('r',b.getAttribute('data-r'));fire();});
  $('swap').addEventListener('click',function(){var a=$('n').value;C.set('n',$('r').value);C.set('r',a);fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar valor exacto');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
