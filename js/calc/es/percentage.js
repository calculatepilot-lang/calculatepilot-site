/* Percentage calculator — CalculatePilot (Stitch redesign).
   s1: Y = P/100 × X · s2: % = X/Y × 100 · s3: change % = (new − old)/|old| × 100 · s4: original = final ÷ (1 ± r/100). */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='';

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function frac(x){/* reduce x/100-style decimals to a fraction, up to 6 decimal places */
  if(!isFinite(x))return '—';var s=1,k=0;while(k<6&&Math.abs(x*s-Math.round(x*s))>1e-9*Math.max(1,Math.abs(x*s))){s*=10;k++;}
  var n=Math.round(x*s),d=s,g=gcd(n,d)||1;n/=g;d/=g;return d===1?String(n):n+' / '+d;}
function fx(x,dp){return isFinite(x)?M.fix(x,dp):'—';}
function sgn(x){return x>0?'+':x<0?'−':'';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:18px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function bar(parts,title,note,labels){$('barT').textContent=title;C.text('barN',note);$('bar').innerHTML=parts.map(function(p){return '<span style="width:'+Math.max(0,Math.min(100,p[0])).toFixed(2)+'%;background:'+p[1]+'"></span>';}).join('');$('barL').innerHTML=labels.map(function(l){return '<span>'+esc(l)+'</span>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('bar').innerHTML='';$('barL').innerHTML='';last='';}

function compute(){
  var m=$('mode').value,a=v('a'),b=v('b'),dp=+$('dp').value,dirDec=$('dir').value==='s2';
  $('fDir').hidden=m!=='s4';$('presets').hidden=m!=='s1';
  var L={s1:['Tasa porcentual (P)','percent','Valor base (X)','cualquier número','¿Cuánto es el P % de X?','Y = (P ÷ 100) × X'],s2:['Parte (X)','la cantidad','Todo (Y)','el total, no 0','¿X es qué porcentaje de Y?','% = (X ÷ Y) × 100'],s3:['Valor anterior','valor inicial, no 0','Valor nuevo','valor final','Cambio porcentual del valor anterior al nuevo','% de cambio = (nuevo − anterior) ÷ |anterior| × 100'],s4:['Valor final','después del cambio','Cambio porcentual aplicado','percent','Calcula el valor original','original = final ÷ (1 ± tasa ÷ 100)']}[m];
  C.text('aL',L[0]);C.text('aH',L[1]);C.text('bL',L[2]);C.text('bH',L[3]);C.text('formH',L[4]);C.text('fxNow',L[5]);
  $('err').hidden=true;var h='',n=0;function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,8));},res,tg='',sum='';
  if($('a').value===''||$('b').value==='')return fail('Introduce ambos valores.');
  var t=$('tag');t.className='sx-ef-grade';
  if(m==='s1'){
    var r=a/100;res=r*b;
    C.text('heroLbl',M.fmt(a,6)+'% de '+M.fmt(b,6));C.text('resultValue',fx(res,dp));C.text('interp',M.fmt(a,6)+'% de '+M.fmt(b,6)+' is '+fx(res,dp)+'.');t.textContent='Exacto';
    tiles([['Multiplicador decimal',M.fmt(r,8),'P ÷ 100'],['Fracción',frac(r),'en su mínima expresión'],['Base − P %',fx(b-res,dp),'lo que queda'],['Base + P %',fx(b+res,dp),'la base más la parte']]);
    var pc=Math.max(0,Math.min(100,a));bar([[pc,'var(--sx-pc)']],'Part-to-whole','base = 100 %',['0%',M.fmt(a,4)+'% = '+fx(res,dp),'100% = '+M.fmt(b,6)]);$('barCard').hidden=false;
    st('Convierte el porcentaje a decimal','Divide entre 100.','r = '+f(a)+' ÷ 100 = <b>'+f(r)+'</b>');
    st('Multiplica por la base','Escala la base con esa fracción.','Y = '+f(r)+' × '+f(b)+' = <b>'+f(res)+'</b>');
    st('Comprobación','Divide de vuelta para recuperar el porcentaje.',f(res)+' ÷ '+f(b)+' × 100 = '+(b!==0?f(res/b*100)+'%':'n/a'));
    sum=M.fmt(a,6)+'% de '+M.fmt(b,6)+' = '+fx(res,dp);
  }else if(m==='s2'){
    if(b===0)return fail('El total (Y) no puede ser 0: un porcentaje de cero no está definido.');
    res=a/b*100;C.text('heroLbl',M.fmt(a,6)+' como porcentaje de '+M.fmt(b,6));C.text('resultValue',fx(res,dp)+'%');C.text('interp',M.fmt(a,6)+' is '+fx(res,dp)+'% de '+M.fmt(b,6)+'.');t.textContent=res>100?'Más que el total':'Parte del total';
    tiles([['Razón decimal',M.fmt(a/b,8),'X ÷ Y'],['Fracción',(Number.isInteger(a)&&Number.isInteger(b))?frac(a/b):frac(a/b),'en su mínima expresión'],['% restante',fx(100-res,dp)+'%','100 % − resultado'],['Y como porcentaje de X',a!==0?fx(b/a*100,dp)+'%':'n/a','la pregunta inversa']]);
    bar([[Math.min(100,res),'var(--sx-pc)']],'Part-to-whole','total = 100 %',['0%',fx(res,2)+'%'+(res>100?' (supera el total)':''),'100% = '+M.fmt(b,6)]);$('barCard').hidden=false;
    st('Divide la parte entre el total','Da la parte como una fracción del total.','X ÷ Y = '+f(a)+' ÷ '+f(b)+' = <b>'+f(a/b)+'</b>');
    st('Multiplica por 100','Convierte la fracción en porcentaje.','% = '+f(a/b)+' × 100 = <b>'+f(res)+'%</b>');
    sum=M.fmt(a,6)+' is '+fx(res,dp)+'% de '+M.fmt(b,6);
  }else if(m==='s3'){
    if(a===0)return fail('El valor anterior no puede ser 0: el cambio porcentual desde cero no está definido. Indica en su lugar el cambio absoluto.');
    var d=b-a;res=d/Math.abs(a)*100;C.text('heroLbl','Cambio de '+M.fmt(a,6)+' to '+M.fmt(b,6));C.text('resultValue',sgn(res)+fx(Math.abs(res),dp)+'%');
    C.text('interp','El valor '+(d>0?'increased':d<0?'decreased':'no cambió')+' by '+fx(Math.abs(d),dp)+', que es '+fx(Math.abs(res),dp)+'% del valor anterior.');
    t.textContent=d>0?'Aumento':d<0?'Disminución':'Sin cambio';t.className='sx-ef-grade'+(d<0?' mid':'');
    var back=b!==0?(a-b)/Math.abs(b)*100:NaN;
    tiles([['Cambio absoluto',sgn(d)+fx(Math.abs(d),dp),'nuevo − anterior'],['Multiplicador',M.fmt(b/a,8),'nuevo ÷ anterior'],['Para revertir el cambio',isFinite(back)?sgn(back)+fx(Math.abs(back),dp)+'%':'n/a','porcentaje necesario para volver al valor anterior'],['Como fracción',frac(d/Math.abs(a)),'cambio ÷ anterior']]);
    var mx=Math.max(Math.abs(a),Math.abs(b))||1;bar([[Math.abs(b)/mx*100,d>=0?'var(--sx-pc)':'#d97706']],'Valor nuevo en relación con el mayor de los dos','anterior = '+M.fmt(a,6)+' · nuevo = '+M.fmt(b,6),['0',M.fmt(b,6)+' (new)',M.fmt(mx,6)]);$('barCard').hidden=false;
    st('Calcula el cambio','Resta el valor anterior del valor nuevo.','Δ = nuevo − anterior = '+f(b)+' − '+f(a)+' = <b>'+f(d)+'</b>');
    st('Divide entre el valor anterior','El valor anterior es la base del cambio porcentual.','Δ ÷ |anterior| = '+f(d)+' ÷ '+f(Math.abs(a))+' = <b>'+f(d/Math.abs(a))+'</b>');
    st('Multiplica por 100','','% de cambio = <b>'+sgn(res)+f(Math.abs(res))+'%</b>');
    if(isFinite(back)&&d!==0)st('Deshacer el cambio','La base ahora es el valor nuevo, por lo que el porcentaje inverso es distinto.','('+f(a)+' − '+f(b)+') ÷ |'+f(b)+'| × 100 = <b>'+sgn(back)+f(Math.abs(back))+'%</b>');
    sum='Cambio de '+M.fmt(a,6)+' to '+M.fmt(b,6)+' = '+sgn(res)+fx(Math.abs(res),dp)+'%';
  }else{
    var rate=b/100,fac=dirDec?1-rate:1+rate;if(fac===0)return fail('A '+M.fmt(b,4)+'% de disminución no deja nada, así que no se puede recuperar el valor original.');
    res=a/fac;C.text('heroLbl','Valor original antes del '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase'));C.text('resultValue',fx(res,dp));
    C.text('interp','Un valor de '+M.fmt(a,6)+' tras una '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase')+' partió de '+fx(res,dp)+'.');t.textContent=dirDec?'Después de una disminución':'Después de un aumento';
    tiles([['Factor de crecimiento',M.fmt(fac,8),dirDec?'1 − tasa':'1 + tasa'],['Magnitud del cambio',sgn(a-res)+fx(Math.abs(a-res),dp),'final − original'],['Comprobación',fx(res*fac,dp),'original × factor = final'],['Atajo incorrecto',fx(a*(dirDec?1+rate:1-rate),dp),'deshacer el % sobre el valor final no es correcto']]);
    $('barCard').hidden=true;$('bar').innerHTML='';$('barL').innerHTML='';
    st('Escribe la relación directa','A '+(dirDec?'decrease':'increase')+' multiplica el original por un factor de crecimiento.','final = original × (1 '+(dirDec?'−':'+')+' '+f(rate)+') = original × '+f(fac));
    st('Despeja el original','Divide el valor final entre el factor.','original = '+f(a)+' ÷ '+f(fac)+' = <b>'+f(res)+'</b>');
    st('Comprobación','Aplica el cambio al original.',f(res)+' × '+f(fac)+' = '+f(res*fac));
    sum='Original = '+fx(res,dp)+' (final '+M.fmt(a,6)+' after '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase')+')';
  }
  if(m!=='s4'&&m!=='s3'&&m!=='s2'&&m!=='s1')$('barCard').hidden=true;
  $('steps').innerHTML=h;C.text('stepsIntro',L[4]);C.text('stepsTag',L[5]);last=sum;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pgCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('a',b.getAttribute('data-v'));$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('swap').addEventListener('click',function(){var x=$('a').value;C.set('a',$('b').value);C.set('b',x);$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar ecuación');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
