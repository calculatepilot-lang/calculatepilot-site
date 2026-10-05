/* Ratio calculator — CalculatePilot (Stitch redesign).
   Simplify: divide by the GCD (Euclid) after scaling decimals to whole numbers. Proportion: A:B = C:D → D = B·C/A, C = A·D/B.
   Scale: multiply by k. Multi-part: simplify by the GCD of all parts; share of total T for part i = T·pᵢ/Σp. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='',defParts='1, 2, 3';

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function euclid(a,b){var lines=[],x=Math.max(a,b),y=Math.min(a,b),n=0;while(y&&n<14){var q=Math.floor(x/y),r=x%y;lines.push(x+' = '+q+' × '+y+' + '+r);x=y;y=r;n++;}return {g:x,lines:lines};}
function ints(list){for(var k=0;k<=6;k++){var s=Math.pow(10,k),ok=list.every(function(x){var y=x*s;return Math.abs(y-Math.round(y))<=1e-9*Math.max(1,Math.abs(y));});if(ok){var a=list.map(function(x){return Math.round(x*s);});if(a.some(function(x){return x>9e15;}))return null;return {a:a,s:s,k:k};}}return null;}
function reduce(list){var I=ints(list);if(!I)return null;var g=I.a.reduce(function(p,c){return gcd(p,c);});return {ints:I.a,g:g,scale:I.s,red:I.a.map(function(x){return x/g;})};}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function J(a){return a.join(' : ');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';last='';}

function rects(items){
  var W=760,H=170,n=items.length,cw=(W-20)/n,pad=24,s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  items.forEach(function(it,i){var mw=cw-pad*2,mh=H-52,sc=Math.min(mw/it[0],mh/it[1]),w=it[0]*sc,h=it[1]*sc,x=10+i*cw+(cw-w)/2,y=14+(mh-h)/2;
    s+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="4" fill="'+(i?'#d97706':'var(--sx-pc)')+'" fill-opacity=".2" stroke="'+(i?'#d97706':'var(--sx-pc)')+'" stroke-width="2"/><line x1="'+x.toFixed(1)+'" y1="'+(y+h).toFixed(1)+'" x2="'+(x+w).toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+(i?'#d97706':'var(--sx-pc)')+'" stroke-dasharray="4 3" opacity=".6"/><text class="ax" x="'+(x+w/2).toFixed(1)+'" y="'+(H-24)+'" text-anchor="middle" style="font-weight:600;font-size:12px;fill:var(--sx-on)">'+esc(it[2])+'</text><text class="ax" x="'+(x+w/2).toFixed(1)+'" y="'+(H-9)+'" text-anchor="middle">'+esc(it[3]||'')+'</text>';});
  $('viz').innerHTML=s+'</svg>';
}
function stack(parts,labels){
  var W=760,H=120,tot=parts.reduce(function(p,c){return p+c;},0),x=10,cols=['var(--sx-pc)','#d97706','#2563eb','#dc2626','#7c3aed','#0d9488','#db2777','#65a30d'],s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  parts.forEach(function(p,i){var w=(W-20)*p/tot;s+='<rect x="'+x.toFixed(1)+'" y="20" width="'+Math.max(1,w-2).toFixed(1)+'" height="48" rx="6" fill="'+cols[i%8]+'" fill-opacity=".25" stroke="'+cols[i%8]+'" stroke-width="2"/><text class="ax" x="'+(x+w/2-1).toFixed(1)+'" y="48" text-anchor="middle" style="font-weight:700;font-size:13px;fill:var(--sx-on)">'+esc(labels[i])+'</text><text class="ax" x="'+(x+w/2-1).toFixed(1)+'" y="90" text-anchor="middle">'+(p/tot*100).toFixed(1)+'%</text>';x+=w;});
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,a=v('ra'),b=v('rb'),h='',n=0;
  ['f2'].forEach(function(id){$(id).hidden=m==='s4';});$('fProp').hidden=m!=='s2';$('fScale').hidden=m!=='s3';$('fParts').hidden=m!=='s4';$('pre2').hidden=m==='s4';$('pre4').hidden=m!=='s4';
  C.text('formH',{s1:'Simplificar una razón',s2:'Resuelve una proporción',s3:'Escala una razón',s4:'Razón de varias partes'}[m]);
  C.text('raL',m==='s2'?'A':'Antecedente (A)');C.text('rbL',m==='s2'?'B':'Consecuente (B)');
  $('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));},t=$('tag');t.className='sx-ef-grade';
  function eu(R,label){var e=euclid(R.ints[0],R.ints[1]);return e;}
  if(m==='s1'){
    if(!(a>0&&b>0))return fail('Ambas partes deben ser mayores que 0.');
    var R=reduce([a,b]);if(!R)return fail('Usa números con un máximo de 6 decimales.');
    var e=euclid(R.ints[0],R.ints[1]),rr=R.red;
    C.text('fxNow',M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+J(rr));C.text('heroLbl','Razón simplificada (mínima expresión)');C.text('resultValue',J(rr));C.text('interp',M.fmt(a,6)+' : '+M.fmt(b,6)+' se simplifica a '+J(rr)+'.');t.textContent=R.g===1&&R.scale===1?'Ya está simplificada':'Simplificada';
    tiles([['Valor decimal (A ÷ B)',M.fmt(a/b,8),'A por cada 1 de B'],['Razón inversa (B : A)',J(rr.slice().reverse()),'intercambia las partes'],['Máximo común divisor',String(R.g)+(R.scale>1?' (tras ×'+R.scale+')':''),'mayor factor común'],['A como parte del total',(a/(a+b)*100).toFixed(2)+'%','A ÷ (A + B)']]);
    rects([[rr[0],rr[1],J(rr),'simplified'],[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'tal como se introdujeron']]);C.text('vizT','Forma de la razón');C.text('vizN','ambos rectángulos tienen la misma forma');
    if(R.scale>1)st('Convierte los decimales en enteros','Multiplica ambas partes por '+R.scale+'.',f(a)+' : '+f(b)+' → <b>'+R.ints[0]+' : '+R.ints[1]+'</b>');
    st('Halla el máximo común divisor','Algoritmo de Euclides: divide, conserva el resto y repite hasta que sea 0.',e.lines.map(esc).join('<br>')+'<br>MCD = <b>'+e.g+'</b>');
    st('Divide ambas partes por el MCD','Da la razón en su mínima expresión.',R.ints[0]+' ÷ '+R.g+' : '+R.ints[1]+' ÷ '+R.g+' = <b>'+J(rr)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+J(rr);C.text('stepsTag','GCD '+R.g);C.text('stepsIntro','Simplificando '+M.fmt(a,6)+' : '+M.fmt(b,6)+' con el algoritmo de Euclides.');
  }else if(m==='s2'){
    var unkC=$('unk').value==='s1',c=v('rc'),d=v('rd');$('fC').hidden=unkC;$('fD').hidden=!unkC;
    if(!(a>0&&b>0))return fail('A y B deben ser mayores que 0.');
    var known=unkC?d:c;if(!(known>0))return fail('Introduce el valor conocido como un número mayor que 0.');
    var x=unkC?a*d/b:b*c/a,C2=unkC?x:c,D2=unkC?d:x,k=C2/a;
    C.text('fxNow',M.fmt(a,4)+' : '+M.fmt(b,4)+' = '+(unkC?'X':M.fmt(c,4))+' : '+(unkC?M.fmt(d,4):'X'));C.text('heroLbl','Valor desconocido X ('+(unkC?'C':'D')+')');C.text('resultValue',M.fmt(x,dp));
    C.text('interp','Proporción equivalente: '+M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+M.fmt(C2,6)+' : '+M.fmt(D2,6)+'.');t.textContent='Proporción resuelta';
    var R2=reduce([a,b]);
    tiles([['Factor de escala',M.fmt(k,8),'C ÷ A = D ÷ B'],['Razón simplificada',R2?J(R2.red):'—','mínima expresión de A : B'],['Comprobación con productos cruzados',M.fmt(a*D2,8)+' = '+M.fmt(b*C2,8),'A × D = B × C'],['Valor decimal (A ÷ B)',M.fmt(a/b,8),'la razón como un solo número']]);
    rects([[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'razón dada'],[C2,D2,M.fmt(C2,4)+' : '+M.fmt(D2,4),'razón equivalente']]);C.text('vizT','Las dos razones tienen la misma forma');C.text('vizN','equivalent');
    st('Escribe la proporción','Dos razones son iguales.',f(a)+' : '+f(b)+' = '+(unkC?'X':f(c))+' : '+(unkC?f(d):'X'));
    st('Cross-multiply','El producto de los extremos es igual al producto de los medios.',unkC?f(a)+' × '+f(d)+' = '+f(b)+' × X':f(a)+' × X = '+f(b)+' × '+f(c));
    st('Despeja X','Divide ambos lados entre el coeficiente de X.',unkC?'X = ('+f(a)+' × '+f(d)+') ÷ '+f(b)+' = <b>'+f(x)+'</b>':'X = ('+f(b)+' × '+f(c)+') ÷ '+f(a)+' = <b>'+f(x)+'</b>');
    st('Comprobación','El factor de escala es el mismo en ambos lados.',f(C2)+' ÷ '+f(a)+' = '+f(D2)+' ÷ '+f(b)+' = <b>'+f(k)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+M.fmt(C2,6)+' : '+M.fmt(D2,6);C.text('stepsTag','cross-multiplication');C.text('stepsIntro','Resolviendo el término desconocido de una proporción.');
  }else if(m==='s3'){
    var tg=$('tgt').value,tv=v('tv');if(!(a>0&&b>0))return fail('A y B deben ser mayores que 0.');if(!(tv>0))return fail('El valor objetivo debe ser mayor que 0.');
    C.text('tvL',tg==='k'?'Factor de escala':tg==='t'?'Total objetivo (A′ + B′)':'Valor objetivo para '+(tg==='a'?'A′':'B′'));
    var kk=tg==='a'?tv/a:tg==='b'?tv/b:tg==='t'?tv/(a+b):tv,A2=a*kk,B2=b*kk;
    C.text('fxNow',M.fmt(a,4)+' : '+M.fmt(b,4)+'  ×  '+M.fmt(kk,6)+'  =  '+M.fmt(A2,6)+' : '+M.fmt(B2,6));C.text('heroLbl','Razón escalada');C.text('resultValue',M.fmt(A2,dp)+' : '+M.fmt(B2,dp));C.text('interp','Multiplica ambas partes de '+M.fmt(a,6)+' : '+M.fmt(b,6)+' by '+M.fmt(kk,6)+'.');t.textContent=kk>1?'Ampliada':kk<1?'Reducida':'Sin cambios';
    tiles([['Factor de escala (k)',M.fmt(kk,8),'multiplier'],['Nuevo A′',M.fmt(A2,dp),'A × k'],['Nuevo B′',M.fmt(B2,dp),'B × k'],['Nuevo total',M.fmt(A2+B2,dp),'A′ + B′']]);
    rects([[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'original'],[A2,B2,M.fmt(A2,4)+' : '+M.fmt(B2,4),'scaled']]);C.text('vizT','Razón original y escalada');C.text('vizN','misma forma');
    st('Halla el factor de escala','Compara el objetivo con la parte a la que se refiere.',tg==='a'?'k = objetivo ÷ A = '+f(tv)+' ÷ '+f(a)+' = <b>'+f(kk)+'</b>':tg==='b'?'k = objetivo ÷ B = '+f(tv)+' ÷ '+f(b)+' = <b>'+f(kk)+'</b>':tg==='t'?'k = total objetivo ÷ (A + B) = '+f(tv)+' ÷ '+f(a+b)+' = <b>'+f(kk)+'</b>':'k = <b>'+f(kk)+'</b> (dado)');
    st('Multiplica ambas partes por k','Al escalar, la razón no cambia.','A′ = '+f(a)+' × '+f(kk)+' = <b>'+f(A2)+'</b><br>B′ = '+f(b)+' × '+f(kk)+' = <b>'+f(B2)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' × '+M.fmt(kk,6)+' = '+M.fmt(A2,6)+' : '+M.fmt(B2,6);C.text('stepsTag','factor de escala '+M.fmt(kk,4));C.text('stepsIntro','Escalar una razón hasta un objetivo.');
  }else{
    var raw=String($('parts').value).split(/[\s,:;]+/).filter(Boolean).map(Number);C.text('partsN',raw.length+' parts');
    if(raw.length<2||raw.length>8||raw.some(function(x){return !(x>0)||!isFinite(x);}))return fail('Introduce de 2 a 8 números mayores que 0, separados por comas o dos puntos.');
    var R3=reduce(raw);if(!R3)return fail('Usa números con un máximo de 6 decimales.');
    var sum=raw.reduce(function(p,c){return p+c;},0),T=v('tot'),hasT=$('tot').value!==''&&T>0,rr3=R3.red,sp=rr3.reduce(function(p,c){return p+c;},0);
    C.text('fxNow',raw.map(function(x){return M.fmt(x,6);}).join(' : ')+' = '+J(rr3));C.text('heroLbl','Razón simplificada');C.text('resultValue',J(rr3));C.text('interp',raw.length+'-partes en su mínima expresión; las partes suman '+sp+' partes iguales.');t.textContent=R3.g===1&&R3.scale===1?'Ya está simplificada':'Simplificada';
    var pcs=raw.map(function(x){return (x/sum*100).toFixed(2)+'%';}).join(' · ');
    tiles([['Partes totales (simplificadas)',String(sp),'suma de las partes reducidas'],['Proporción del total',pcs,'cada parte ÷ total'],['Máximo común divisor',String(R3.g)+(R3.scale>1?' (tras ×'+R3.scale+')':''),'mayor factor común'],hasT?['Total a repartir '+M.fmt(T,6),raw.map(function(x){return M.fmt(T*x/sum,dp);}).join(' · '),'cada parte × total ÷ '+M.fmt(sum,6)]:['Repartir un total','introduce uno arriba','campo opcional']]);
    stack(raw,rr3.map(String));C.text('vizT','Proporción del total');C.text('vizN',raw.length+' parts');
    var g=R3.ints[0],lines=[];R3.ints.slice(1).forEach(function(x){var ng=gcd(g,x);lines.push('gcd('+g+', '+x+') = '+ng);g=ng;});
    if(R3.scale>1)st('Convierte los decimales en enteros','Multiplica cada parte por '+R3.scale+'.',raw.map(function(x){return f(x);}).join(' : ')+' → <b>'+R3.ints.join(' : ')+'</b>');
    st('Halla el MCD de todas las partes','Aplica el algoritmo de Euclides por pares.',lines.map(esc).join('<br>')+'<br>MCD = <b>'+R3.g+'</b>');
    st('Divide cada parte entre el MCD','',R3.ints.join(' : ')+' ÷ '+R3.g+' = <b>'+J(rr3)+'</b>');
    if(hasT)st('Divide el total','Valor de una parte simplificada = total ÷ suma de las partes.','una parte = '+f(T)+' ÷ '+f(sp)+' = <b>'+f(T/sp)+'</b><br>'+rr3.map(function(x){return x+' × '+f(T/sp)+' = <b>'+f(x*T/sp)+'</b>';}).join('<br>'));
    last=raw.map(function(x){return M.fmt(x,6);}).join(' : ')+' = '+J(rr3)+(hasT?'; proporciones de '+M.fmt(T,6)+': '+raw.map(function(x){return M.fmt(T*x/sum,dp);}).join(', '):'');C.text('stepsTag','GCD '+R3.g);C.text('stepsIntro','Simplificar y repartir una razón de varias partes.');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('ra').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'rtCalc',compute:compute});
  $('pre2').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;C.set('ra',b.getAttribute('data-a'));C.set('rb',b.getAttribute('data-b'));fire();});
  $('pre4').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;$('parts').value=b.getAttribute('data-p');C.set('tot',b.getAttribute('data-t'));fire();});
  $('swap').addEventListener('click',function(){if($('mode').value==='s4'){$('parts').value=String($('parts').value).split(/[\s,:;]+/).filter(Boolean).reverse().join(', ');}else{var x=$('ra').value;C.set('ra',$('rb').value);C.set('rb',x);}fire();});
  document.querySelector('#rtCalc [data-action=reset]').addEventListener('click',function(){$('parts').value=defParts;fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar ecuación');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
