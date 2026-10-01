/* Percent error calculator — CalculatePilot (Stitch redesign).
   Percent error = |measured − accepted| ÷ |accepted| × 100 (signed keeps the direction of the deviation).
   Percent difference = |A − B| ÷ ((A + B)/2) × 100. Tolerance check compares |Δ| with ±% of accepted or ± absolute. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='';

function esc(s){return C.esc(s);}
function fs(x){if(!isFinite(x))return '—';var sig=+$('sig').value;if(x===0)return '0';if(sig===0)return C.math.fmt(x,8);return x.toPrecision(sig).replace(/^(-?)0\.0*$/,'$10');}
function sg(x){return x>0?'+':x<0?'−':'';}
function fsg(x){return sg(x)+fs(Math.abs(x));}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','abs','rel','sd','acc','band','stat'].forEach(function(i){C.text(i,'—');});['sdN','bandN','statN'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');C.text('vizTag','—');$('viz').innerHTML='';$('steps').innerHTML='';last='';}

function viz(a,b,mode,lo,hi,unit){
  var W=760,H=150,pl=30,pr=30,cy=64;if(lo===hi){lo-=1;hi+=1;}var pad=(hi-lo)*0.15;var L=lo-pad,R=hi+pad,X=function(t){return pl+(t-L)/(R-L)*(W-pl-pr);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><line class="bs" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+cy+'" y2="'+cy+'" style="stroke-width:2"/>';
  for(var i=0;i<=4;i++){var t=L+i*(R-L)/4;s+='<line class="bs" x1="'+X(t).toFixed(1)+'" x2="'+X(t).toFixed(1)+'" y1="'+cy+'" y2="'+(cy+5)+'"/><text class="ax" x="'+X(t).toFixed(1)+'" y="'+(cy+18)+'" text-anchor="middle">'+esc(C.math.fmt(t,4))+'</text>';}
  if(mode==='s2'){var m=(a+b)/2;
    s+='<line x1="'+X(m).toFixed(1)+'" x2="'+X(m).toFixed(1)+'" y1="'+(cy-30)+'" y2="'+cy+'" stroke="var(--sx-muted)" stroke-dasharray="4 3"/><text class="ax" x="'+X(m).toFixed(1)+'" y="'+(cy-36)+'" text-anchor="middle">media '+esc(C.math.fmt(m,4))+'</text>';
    s+='<circle cx="'+X(a).toFixed(1)+'" cy="'+cy+'" r="7" fill="var(--sx-primary)"/><text class="ax" x="'+X(a).toFixed(1)+'" y="'+(cy+42)+'" text-anchor="middle" style="font-weight:600">A</text><circle cx="'+X(b).toFixed(1)+'" cy="'+cy+'" r="7" fill="#d97706"/><text class="ax" x="'+X(b).toFixed(1)+'" y="'+(cy+42)+'" text-anchor="middle" style="font-weight:600">B</text>';
  }else{
    var bw=viz.band;if(bw>0)s+='<rect x="'+X(b-bw).toFixed(1)+'" y="'+(cy-16)+'" width="'+Math.max(2,X(b+bw)-X(b-bw)).toFixed(1)+'" height="32" rx="4" fill="var(--sx-pc)" fill-opacity=".18" stroke="var(--sx-pc)" stroke-dasharray="4 3"/>';
    s+='<line x1="'+X(b).toFixed(1)+'" x2="'+X(b).toFixed(1)+'" y1="'+(cy-24)+'" y2="'+(cy+24)+'" stroke="var(--sx-primary)" stroke-width="3"/><text class="ax" x="'+X(b).toFixed(1)+'" y="'+(cy-30)+'" text-anchor="middle" style="font-weight:600">aceptado '+esc(C.math.fmt(b,5))+'</text>';
    s+='<circle cx="'+X(a).toFixed(1)+'" cy="'+cy+'" r="7" fill="'+(viz.ok===false?'#dc2626':'#d97706')+'"/><text class="ax" x="'+X(a).toFixed(1)+'" y="'+(cy+42)+'" text-anchor="middle" style="font-weight:600">medido '+esc(C.math.fmt(a,5))+'</text>';
  }
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var mode=$('mode').value,a=v('a'),b=v('b'),tolT=$('tolT').value,tol=Math.abs(v('tol')),u=$('unit').value.trim(),us=u?' '+u:'',signed=$('sgn').value==='s',dp;
  $('fTolT').hidden=mode!=='s3';$('fTol').hidden=mode==='s2';$('presets').hidden=mode==='s2';
  C.text('aL',mode==='s1'?'Valor experimental (medido)':mode==='s2'?'Valor A':'Valor medido');C.text('aH',mode==='s2'?'primera medición':'de tu medición');
  C.text('bL',mode==='s1'?'Valor teórico (aceptado)':mode==='s2'?'Valor B':'Valor nominal (objetivo)');C.text('bH',mode==='s2'?'segunda medición':mode==='s1'?'el patrón de referencia':'el objetivo de la especificación');
  C.text('tolL',mode==='s3'&&tolT==='a'?'Tolerancia (± '+(u||'units')+')':'Tolerancia (±%)');
  C.text('heroLbl',mode==='s2'?'Diferencia porcentual':mode==='s3'?'Desviación respecto al valor nominal':'Error porcentual');
  C.text('fxNow',mode==='s2'?'% de diferencia = |A − B| ÷ ((A + B) ÷ 2) × 100':'% de error = |medido − aceptado| ÷ |aceptado| × 100');
  $('err').hidden=true;
  if($('a').value===''||$('b').value==='')return fail('Introduce ambos valores.');
  var d=a-b,abs=Math.abs(d),den=mode==='s2'?(a+b)/2:b,rel,pct;
  if(mode==='s3'&&tolT==='a'&&den===0){rel=NaN;pct=NaN;}
  else{if(den===0)return fail(mode==='s2'?'Los dos valores suman 0, por lo que su promedio es 0 y la diferencia porcentual no está definida.':'El valor aceptado es 0, por lo que el error porcentual no está definido. Indica en su lugar el error absoluto'+(mode==='s3'?', o usa una tolerancia absoluta.':'.'));rel=abs/Math.abs(den);pct=rel*100;}
  /* tolerance band */
  var band=NaN,ok=null;
  if(mode!=='s2'){band=(mode==='s3'&&tolT==='a')?tol:Math.abs(b)*tol/100;ok=abs<=band*(1+1e-12);}
  viz.band=isFinite(band)?band:0;viz.ok=ok;
  var showPct=isFinite(pct)?((signed&&mode!=='s2'&&d!==0?sg(d):'')+fs(pct)+'%'):'n/a';
  C.text('resultValue',mode==='s3'&&!isFinite(pct)?fs(abs)+us:showPct);
  C.text('abs',fs(abs)+us);C.text('rel',isFinite(rel)?fs(rel):'n/a');
  var t=$('tag');
  if(mode==='s2'){t.textContent='El orden no importa';t.className='sx-ef-grade';C.text('interp','Los dos valores difieren en '+fs(abs)+us+', que es '+fs(pct)+'% de su promedio ('+fs(den)+us+').');}
  else if(d===0){t.textContent='Coincidencia exacta';t.className='sx-ef-grade';C.text('interp','El valor medido es igual al valor '+(mode==='s1'?'accepted':'nominal')+' .');}
  else{t.textContent=(mode==='s3'?(ok?'Dentro de la tolerancia':'Fuera de la tolerancia'):d<0?'Under-estimated':'Over-estimated');t.className='sx-ef-grade'+(mode==='s3'?(ok?'':' hi'):(ok===false?' mid':''));
    C.text('interp','El valor medido es '+fs(abs)+us+' '+(d<0?'below':'above')+' the '+(mode==='s1'?'accepted':'nominal')+' value'+(isFinite(pct)?', '+fs(pct)+'% del mismo':'')+'.');}
  C.text('sd',mode==='s2'?fsg(a-b)+us:fsg(d)+us);C.text('sdN',mode==='s2'?'A − B':'medido − '+(mode==='s1'?'accepted':'nominal'));
  C.text('acc',isFinite(rel)?fs((1-rel)*100)+'%':'n/a');
  if(mode==='s2'){C.text('band','n/a');C.text('bandN','No se usa para la diferencia porcentual');C.text('stat','n/a');C.text('statN','Dos mediciones, sin referencia');}
  else{C.text('band',fs(b-band)+' to '+fs(b+band));C.text('bandN',(mode==='s3'&&tolT==='a'?'± '+fs(tol)+us:'± '+fs(tol)+'% del valor aceptado = ± '+fs(band)+us));C.text('stat',ok?'Dentro de la tolerancia':'Fuera de la tolerancia');C.text('statN','|Δ| = '+fs(abs)+us+' frente al límite '+fs(band)+us);}
  viz(a,b,mode,mode==='s2'?Math.min(a,b):Math.min(a,b-band),mode==='s2'?Math.max(a,b):Math.max(a,b+band),u);
  C.text('vizTag',mode==='s2'?'dos valores':(ok?'dentro del margen':'fuera del margen'));
  /* steps */
  var f=function(x){return esc(C.math.fmt(x,8));},h='',n=0;function st(tt,dd,eq){n++;h+='<li><span class="n">'+n+'</span><h4>'+tt+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+eq+'</span></li>';}
  if(mode==='s2'){
    st('Calcula la diferencia','Resta un valor del otro y descarta el signo.','|A − B| = |'+f(a)+' − '+f(b)+'| = <b>'+f(abs)+'</b>');
    st('Calcula el promedio de los dos valores','Este es el tamaño de referencia para la comparación.','(A + B) ÷ 2 = ('+f(a)+' + '+f(b)+') ÷ 2 = <b>'+f(den)+'</b>');
    st('Divide (diferencia relativa)','','|A − B| ÷ |promedio| = '+f(abs)+' ÷ '+f(Math.abs(den))+' = <b>'+f(rel)+'</b>');
    st('Convierte a porcentaje','Multiplica por 100.','% de diferencia = '+f(rel)+' × 100 = <b>'+f(pct)+'%</b>');
  }else{
    var nm=mode==='s1'?'accepted':'nominal';
    st('Calcula el error','Resta el valor '+nm+' del valor medido.','Δ = medido − '+nm+' = '+f(a)+' − '+f(b)+' = <b>'+f(d)+'</b>'+esc(us)+'<br>Error absoluto |Δ| = <b>'+f(abs)+'</b>');
    if(isFinite(rel))st('Divide entre el valor '+nm+' (error relativo)','Expresa el error en una escala independiente de las unidades.','|Δ| ÷ |'+nm+'| = '+f(abs)+' ÷ '+f(Math.abs(b))+' = <b>'+f(rel)+'</b>');
    if(isFinite(pct))st('Convierte a porcentaje','Multiplica por 100.','% de error = '+f(rel)+' × 100 = <b>'+f(pct)+'%</b>'+(d!==0?' ('+(d<0?'under':'over')+'-medido, con signo: '+sg(d)+f(pct)+'%)':''));
    st(mode==='s3'?'Compara con la tolerancia':'Compara con el margen de tolerancia','Límite = '+(mode==='s3'&&tolT==='a'?'la tolerancia absoluta':f(tol)+'% de '+f(Math.abs(b))),'|Δ| = '+f(abs)+' '+(ok?'≤':'>')+' limit '+f(band)+' → <b>'+(ok?'dentro de la tolerancia':'fuera de la tolerancia')+'</b>');
  }
  $('steps').innerHTML=h;C.text('stepsIntro',mode==='s2'?'Diferencia porcentual entre dos valores.':mode==='s3'?'Comprobación de tolerancia de una medición frente a su valor nominal.':'Error porcentual de una medición frente a un valor aceptado.');C.text('stepsTag',mode==='s2'?'|A − B| ÷ promedio':'|Δ| ÷ |aceptado|');
  last=(mode==='s2'?'Diferencia porcentual':mode==='s3'?'Comprobación de tolerancia':'Error porcentual')+' — calculatepilot.com/math/percent-error-calculator.html\n'+(mode==='s2'?'A = '+f(a)+', B = '+f(b):'Medido = '+f(a)+', '+nm2(mode)+' = '+f(b))+us+'\nError absoluto: '+fs(abs)+us+'\n'+(isFinite(pct)?(mode==='s2'?'Diferencia porcentual: ':'Error porcentual: ')+showPct:'')+(ok===null?'':'\nTolerance: '+(ok?'within':'outside')+' (limit '+fs(band)+us+')');
}
function nm2(m){return m==='s1'?'accepted':'nominal';}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'peCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;C.set('a',b.getAttribute('data-a'));C.set('b',b.getAttribute('data-b'));C.set('unit',b.getAttribute('data-u'));$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
