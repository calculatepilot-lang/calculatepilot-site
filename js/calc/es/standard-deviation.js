/* Standard deviation calculator — CalculatePilot (Stitch redesign).
   Two-pass method: mean, then SS = Σ(x − mean)². Sample: s² = SS/(n−1); population: σ² = SS/N.
   SE = s/√n ; 95% CI = mean ± t(0.975, n−1)·SE (sample basis only); CV = SD/|mean|·100. */
(function(){
var C=window.CPX,$=C.$,M=C.math,last='',rows=[],defData='';

function fx(x,dp){if(!isFinite(x))return '—';if(x!==0&&Math.abs(x)<Math.pow(10,-dp)){var e=x.toExponential(3).split('e');return e[0]+'e'+e[1].replace('+','');}return M.fix(x,dp);}
function esc(s){return C.esc(s);}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','vr','mean','cnt','sum','ss','cv','se','ci'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Introduce al menos dos números para ver un resultado.');C.text('within','—');$('plot').innerHTML='';$('steps').innerHTML='';$('devTbl').tBodies[0].innerHTML='';$('devTbl').tFoot.innerHTML='';C.text('devNote','—');C.text('ciN','—');last='';rows=[];}

function plot(a,mean,sd){
  var W=760,H=230,pl=14,pr=14,pt=12,pb=48,mn=Math.min.apply(null,a),mx=Math.max.apply(null,a);
  var lo=Math.min(mean-3*sd,mn),hi=Math.max(mean+3*sd,mx),span=hi-lo||1;lo-=span*0.03;hi+=span*0.03;
  var X=function(t){return pl+(t-lo)/(hi-lo)*(W-pl-pr);},peak=1/(sd*Math.sqrt(2*Math.PI)),Y=function(d){return pt+(1-d/(peak*1.1))*(H-pt-pb);};
  var dens=function(t){return Math.exp(-0.5*Math.pow((t-mean)/sd,2))/(sd*Math.sqrt(2*Math.PI));},N=200,i,t,line='';
  for(i=0;i<=N;i++){t=lo+i*(hi-lo)/N;line+=(i?'L':'M')+X(t).toFixed(1)+' '+Y(dens(t)).toFixed(1);}
  var band='M'+X(mean-sd).toFixed(1)+' '+Y(0);for(i=0;i<=60;i++){t=mean-sd+i*(2*sd)/60;band+='L'+X(t).toFixed(1)+' '+Y(dens(t)).toFixed(1);}band+='L'+X(mean+sd).toFixed(1)+' '+Y(0)+'Z';
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><path class="sh" d="'+band+'"/><line class="bs" x1="'+X(lo)+'" x2="'+X(hi)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/><path class="cv" d="'+line+'"/><line class="ln" x1="'+X(mean).toFixed(1)+'" x2="'+X(mean).toFixed(1)+'" y1="'+pt+'" y2="'+Y(0)+'"/>';
  [-2,-1,0,1,2].forEach(function(k){var v=mean+k*sd;if(v<lo||v>hi)return;s+='<line class="bs" x1="'+X(v).toFixed(1)+'" x2="'+X(v).toFixed(1)+'" y1="'+Y(0)+'" y2="'+(Y(0)+4)+'"/><text class="ax" x="'+X(v).toFixed(1)+'" y="'+(Y(0)+16)+'" text-anchor="middle">'+(k===0?'mean':(k>0?'+':'−')+Math.abs(k)+'s')+'</text><text class="ax" x="'+X(v).toFixed(1)+'" y="'+(Y(0)+29)+'" text-anchor="middle">'+esc(M.fmt(v,3))+'</text>';});
  var cnt={};a.slice(0,300).forEach(function(v){var k=Math.round(X(v)/6),d=cnt[k]=(cnt[k]||0)+1;s+='<circle cx="'+X(v).toFixed(1)+'" cy="'+(Y(0)-6-(d-1)*9).toFixed(1)+'" r="3.5" fill="var(--sx-primary)" opacity=".85"/>';});
  $('plot').innerHTML=s+'</svg>';
}

function compute(){
  var pop=$('basis').value==='s2',dp=+$('prec').value,a=M.list($('data').value);
  C.text('basisHelp',pop?'Población: tu lista contiene todos los valores del grupo. Divide entre N.':'Muestra: tu lista proviene de un grupo mayor. Divide entre n − 1 (corrección de Bessel).');
  C.text('fxNow',pop?'σ = √[ Σ(xᵢ − μ)² ÷ N ]':'s = √[ Σ(xᵢ − x̄)² ÷ (n − 1) ]');
  C.text('dataN',a.length+' value'+(a.length===1?'':'s')+(a.bad?' · '+a.bad+' ignored':''));
  $('err').hidden=true;
  var n=a.length;if(n<2)return fail('Introduce al menos dos números.');
  var mean=M.mean(a),ss=M.ss(a),df=pop?n:n-1,vr=ss/df,sd=Math.sqrt(vr),sum=mean*n,sq=0;a.forEach(function(v){sq+=v*v;});
  var lbl=pop?'Desviación estándar poblacional (σ)':'Desviación estándar muestral (s)';C.text('heroLbl',lbl);
  var cv=mean!==0?sd/Math.abs(mean)*100:NaN,se=sd/Math.sqrt(n);
  C.text('resultValue',fx(sd,dp));C.text('vr',fx(vr,dp));C.text('mean',fx(mean,dp));C.text('cnt',String(n));C.text('sum',fx(sum,dp));C.text('ss',fx(ss,dp));
  C.text('cv',isFinite(cv)?cv.toFixed(2)+'%':'n/a');C.text('se',fx(se,dp));C.text('seN',pop?'σ ÷ √N':'s ÷ √n');
  var ci='—';
  if(!pop){var t=M.tinv(0.975,n-1),h=t*se;ci=fx(mean-h,dp)+' to '+fx(mean+h,dp);C.text('ciN','± '+fx(h,dp)+' (t = '+t.toFixed(3)+', gl = '+(n-1)+')');}else C.text('ciN','Se muestra solo para la opción de muestra');
  C.text('ci',ci);
  var t2=$('tag');if(!(sd>0)){t2.textContent='Sin dispersión';t2.className='sx-ef-grade';C.text('interp','Todos los valores son idénticos, por lo que no hay variación.');}
  else{var c=isFinite(cv)?cv:0;t2.textContent=c<10?'Dispersión baja':c<30?'Dispersión moderada':'Dispersión alta';t2.className='sx-ef-grade'+(c<10?'':c<30?' mid':' hi');
    C.text('interp','Los valores suelen estar a unos '+fx(sd,dp)+' de la media de '+fx(mean,dp)+(isFinite(cv)?' — un coeficiente de variación de '+cv.toFixed(1)+'%.':'.'));}
  var in1=0,in2=0;a.forEach(function(v){var d=Math.abs(v-mean);if(d<=sd)in1++;if(d<=2*sd)in2++;});
  C.text('within',in1+' of '+n+' dentro de ±1s · '+in2+' dentro de ±2s');
  if(sd>0)plot(a,mean,sd);else $('plot').innerHTML='';
  /* working */
  var f4=function(x){return esc(M.fmt(x,4));},sh=a.slice(0,30);rows=a.map(function(v){return [v,v-mean,(v-mean)*(v-mean)];});
  var h='';h+='<li><span class="n">1</span><h4>Calcula la media</h4><p>Suma los '+n+' valores y divide entre '+n+'.</p><span class="eq">mean = '+f4(sum)+' ÷ '+n+' = <b>'+f4(mean)+'</b></span></li>';
  h+='<li><span class="n">2</span><h4>Eleva al cuadrado cada desviación y súmalas</h4><p>Resta la media a cada valor, elévalo al cuadrado y suma los cuadrados (tabla de abajo).</p><span class="eq">SC = Σ(x − media)² = <b>'+f4(ss)+'</b></span></li>';
  h+='<li><span class="n">3</span><h4>Divide para obtener la varianza</h4><p>'+(pop?'La varianza poblacional divide entre N = '+n+'.':'La varianza muestral divide entre n − 1 = '+(n-1)+'.')+'</p><span class="eq">'+(pop?'σ²':'s²')+' = '+f4(ss)+' ÷ '+df+' = <b>'+f4(vr)+'</b></span></li>';
  h+='<li><span class="n">4</span><h4>Calcula la raíz cuadrada</h4><p>Devuelve la dispersión a las unidades originales.</p><span class="eq">'+(pop?'σ':'s')+' = √'+f4(vr)+' = <b>'+f4(sd)+'</b></span></li>';
  $('steps').innerHTML=h;C.text('stepsIntro',(pop?'Poblacional':'Muestral')+' desviación estándar de '+n+' valores, calculada con el método de dos pasadas.');C.text('stepsTag',pop?'divisor N = '+n:'divisor n − 1 = '+(n-1));
  var tb='';sh.forEach(function(r,i){tb+='<tr><td>'+(i+1)+'</td><td class="mono">'+f4(r[0])+'</td><td class="mono">'+(r[1]>0?'+':r[1]<0?'−':'')+esc(M.fmt(Math.abs(r[1]),4))+'</td><td class="mono">'+f4(r[2])+'</td></tr>';});
  $('devTbl').tBodies[0].innerHTML=tb;$('devTbl').tFoot.innerHTML='<tr class="tot"><td>Total</td><td class="mono">'+f4(sum)+'</td><td class="mono">'+esc(M.fmt(Math.abs(a.reduce(function(s,v){return s+(v-mean);},0))<1e-9?0:a.reduce(function(s,v){return s+(v-mean);},0),4))+'</td><td class="mono">'+f4(ss)+'</td></tr>';
  C.text('devNote',n>30?'Se muestran las primeras 30 de '+n+' filas; los totales abarcan las '+n+'. Export CSV for the full table.':'Las desviaciones respecto a la media siempre suman cero: una comprobación útil de la aritmética.');
  last='Desviación estándar — calculatepilot.com/math/standard-deviation-calculator.html\n'+(pop?'Poblacional':'Muestral')+' datos, n = '+n+'\nMean: '+fx(mean,dp)+'\nVariance: '+fx(vr,dp)+'\nDesviación estándar: '+fx(sd,dp)+'\nSuma de cuadrados: '+fx(ss,dp)+(isFinite(cv)?'\nCoeficiente de variación: '+cv.toFixed(2)+'%':'')+(pop?'':'\nIC del 95 % para la media: '+ci);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('data').dispatchEvent(new Event('input',{bubbles:true}));}

document.addEventListener('DOMContentLoaded',function(){
  defData=$('data').value;
  C.init({root:'sdCalc',compute:compute});
  $('ex').addEventListener('change',function(){if(this.value){$('data').value=this.value;fire();}});
  $('clear').addEventListener('click',function(){$('data').value='';$('ex').value='';fire();$('data').focus();});
  $('rand').addEventListener('click',function(){var out=[],i,u,v;for(i=0;i<12;i++){u=1-Math.random();v=Math.random();out.push(Math.round(50+15*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)));}$('data').value=out.join(', ');$('ex').value='';fire();});
  document.querySelector('#sdCalc [data-action=reset]').addEventListener('click',function(){$('data').value=defData;$('ex').value='';fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('csvBtn').addEventListener('click',function(){if(!rows.length)return;C.csv('standard-deviation-working.csv',[{h:'Valor',key:0},{h:'Desviación respecto a la media',key:1},{h:'Desviación al cuadrado',key:2}],rows);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
