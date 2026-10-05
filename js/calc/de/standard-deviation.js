/* Standard deviation calculator — CalculatePilot (Stitch redesign).
   Two-pass method: mean, then SS = Σ(x − mean)². Sample: s² = SS/(n−1); population: σ² = SS/N.
   SE = s/√n ; 95% CI = mean ± t(0.975, n−1)·SE (sample basis only); CV = SD/|mean|·100. */
(function(){
var C=window.CPX,$=C.$,M=C.math,last='',rows=[],defData='';

function fx(x,dp){if(!isFinite(x))return '—';if(x!==0&&Math.abs(x)<Math.pow(10,-dp)){var e=x.toExponential(3).split('e');return e[0]+'e'+e[1].replace('+','');}return M.fix(x,dp);}
function esc(s){return C.esc(s);}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','vr','mean','cnt','sum','ss','cv','se','ci'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Geben Sie mindestens zwei Zahlen ein, um ein Ergebnis zu sehen.');C.text('within','—');$('plot').innerHTML='';$('steps').innerHTML='';$('devTbl').tBodies[0].innerHTML='';$('devTbl').tFoot.innerHTML='';C.text('devNote','—');C.text('ciN','—');last='';rows=[];}

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
  C.text('basisHelp',pop?'Grundgesamtheit: Ihre Liste enthält jeden Wert der Gruppe. Teilt durch N.':'Stichprobe: Ihre Liste stammt aus einer größeren Gruppe. Teilt durch n − 1 (Bessel-Korrektur).');
  C.text('fxNow',pop?'σ = √[ Σ(xᵢ − μ)² ÷ N ]':'s = √[ Σ(xᵢ − x̄)² ÷ (n − 1) ]');
  C.text('dataN',a.length+' value'+(a.length===1?'':'s')+(a.bad?' · '+a.bad+' ignored':''));
  $('err').hidden=true;
  var n=a.length;if(n<2)return fail('Geben Sie mindestens zwei Zahlen ein.');
  var mean=M.mean(a),ss=M.ss(a),df=pop?n:n-1,vr=ss/df,sd=Math.sqrt(vr),sum=mean*n,sq=0;a.forEach(function(v){sq+=v*v;});
  var lbl=pop?'Standardabweichung der Grundgesamtheit (σ)':'Stichproben-Standardabweichung (s)';C.text('heroLbl',lbl);
  var cv=mean!==0?sd/Math.abs(mean)*100:NaN,se=sd/Math.sqrt(n);
  C.text('resultValue',fx(sd,dp));C.text('vr',fx(vr,dp));C.text('mean',fx(mean,dp));C.text('cnt',String(n));C.text('sum',fx(sum,dp));C.text('ss',fx(ss,dp));
  C.text('cv',isFinite(cv)?cv.toFixed(2)+'%':'n/a');C.text('se',fx(se,dp));C.text('seN',pop?'σ ÷ √N':'s ÷ √n');
  var ci='—';
  if(!pop){var t=M.tinv(0.975,n-1),h=t*se;ci=fx(mean-h,dp)+' to '+fx(mean+h,dp);C.text('ciN','± '+fx(h,dp)+' (t = '+t.toFixed(3)+', df = '+(n-1)+')');}else C.text('ciN','Nur bei der Einstellung „Stichprobe“ angezeigt');
  C.text('ci',ci);
  var t2=$('tag');if(!(sd>0)){t2.textContent='Keine Streuung';t2.className='sx-ef-grade';C.text('interp','Alle Werte sind identisch, es gibt also keine Streuung.');}
  else{var c=isFinite(cv)?cv:0;t2.textContent=c<10?'Geringe Streuung':c<30?'Mittlere Streuung':'Hohe Streuung';t2.className='sx-ef-grade'+(c<10?'':c<30?' mid':' hi');
    C.text('interp','Die Werte liegen typischerweise etwa '+fx(sd,dp)+' vom Mittelwert von '+fx(mean,dp)+(isFinite(cv)?' entfernt — ein Variationskoeffizient von '+cv.toFixed(1)+'%.':'.'));}
  var in1=0,in2=0;a.forEach(function(v){var d=Math.abs(v-mean);if(d<=sd)in1++;if(d<=2*sd)in2++;});
  C.text('within',in1+' of '+n+' innerhalb von ±1s · '+in2+' innerhalb von ±2s');
  if(sd>0)plot(a,mean,sd);else $('plot').innerHTML='';
  /* working */
  var f4=function(x){return esc(M.fmt(x,4));},sh=a.slice(0,30);rows=a.map(function(v){return [v,v-mean,(v-mean)*(v-mean)];});
  var h='';h+='<li><span class="n">1</span><h4>Den Mittelwert bestimmen</h4><p>Addieren Sie die '+n+' Werte und teilen Sie durch '+n+'.</p><span class="eq">mean = '+f4(sum)+' ÷ '+n+' = <b>'+f4(mean)+'</b></span></li>';
  h+='<li><span class="n">2</span><h4>Jede Abweichung quadrieren und aufsummieren</h4><p>Ziehen Sie von jedem Wert den Mittelwert ab, quadrieren Sie ihn und summieren Sie die Quadrate (Tabelle unten).</p><span class="eq">SS = Σ(x − Mittelwert)² = <b>'+f4(ss)+'</b></span></li>';
  h+='<li><span class="n">3</span><h4>Teilen, um die Varianz zu erhalten</h4><p>'+(pop?'Die Varianz der Grundgesamtheit teilt durch N = '+n+'.':'Die Stichprobenvarianz teilt durch n − 1 = '+(n-1)+'.')+'</p><span class="eq">'+(pop?'σ²':'s²')+' = '+f4(ss)+' ÷ '+df+' = <b>'+f4(vr)+'</b></span></li>';
  h+='<li><span class="n">4</span><h4>Die Quadratwurzel ziehen</h4><p>Bringt die Streuung zurück auf die ursprünglichen Einheiten.</p><span class="eq">'+(pop?'σ':'s')+' = √'+f4(vr)+' = <b>'+f4(sd)+'</b></span></li>';
  $('steps').innerHTML=h;C.text('stepsIntro',(pop?'Grundgesamtheit':'Stichprobe')+' Standardabweichung von '+n+' Werten, berechnet mit dem Zwei-Pass-Verfahren.');C.text('stepsTag',pop?'Divisor N = '+n:'Divisor n − 1 = '+(n-1));
  var tb='';sh.forEach(function(r,i){tb+='<tr><td>'+(i+1)+'</td><td class="mono">'+f4(r[0])+'</td><td class="mono">'+(r[1]>0?'+':r[1]<0?'−':'')+esc(M.fmt(Math.abs(r[1]),4))+'</td><td class="mono">'+f4(r[2])+'</td></tr>';});
  $('devTbl').tBodies[0].innerHTML=tb;$('devTbl').tFoot.innerHTML='<tr class="tot"><td>Summe</td><td class="mono">'+f4(sum)+'</td><td class="mono">'+esc(M.fmt(Math.abs(a.reduce(function(s,v){return s+(v-mean);},0))<1e-9?0:a.reduce(function(s,v){return s+(v-mean);},0),4))+'</td><td class="mono">'+f4(ss)+'</td></tr>';
  C.text('devNote',n>30?'Angezeigt werden die ersten 30 von '+n+' Zeilen; die Summen umfassen alle '+n+'. Export CSV for the full table.':'Die Abweichungen vom Mittelwert summieren sich stets zu null — eine nützliche Probe für die Rechnung.');
  last='Standardabweichung — calculatepilot.com/math/standard-deviation-calculator.html\n'+(pop?'Grundgesamtheit':'Stichprobe')+' Daten, n = '+n+'\nMean: '+fx(mean,dp)+'\nVariance: '+fx(vr,dp)+'\nStandardabweichung: '+fx(sd,dp)+'\nSumme der Quadrate: '+fx(ss,dp)+(isFinite(cv)?'\nVariationskoeffizient: '+cv.toFixed(2)+'%':'')+(pop?'':'\n95-%-Konfidenzintervall für den Mittelwert: '+ci);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('data').dispatchEvent(new Event('input',{bubbles:true}));}

document.addEventListener('DOMContentLoaded',function(){
  defData=$('data').value;
  C.init({root:'sdCalc',compute:compute});
  $('ex').addEventListener('change',function(){if(this.value){$('data').value=this.value;fire();}});
  $('clear').addEventListener('click',function(){$('data').value='';$('ex').value='';fire();$('data').focus();});
  $('rand').addEventListener('click',function(){var out=[],i,u,v;for(i=0;i<12;i++){u=1-Math.random();v=Math.random();out.push(Math.round(50+15*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)));}$('data').value=out.join(', ');$('ex').value='';fire();});
  document.querySelector('#sdCalc [data-action=reset]').addEventListener('click',function(){$('data').value=defData;$('ex').value='';fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('csvBtn').addEventListener('click',function(){if(!rows.length)return;C.csv('standard-deviation-working.csv',[{h:'Wert',key:0},{h:'Abweichung vom Mittelwert',key:1},{h:'Quadrierte Abweichung',key:2}],rows);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
