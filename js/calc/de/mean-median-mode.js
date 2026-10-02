/* Mean, median & mode calculator — CalculatePilot (Stitch redesign).
   Mean Σx/n · median = middle of the sorted list · mode(s) = highest frequency (none if all unique)
   Geometric (all x>0) exp(mean ln x) · Harmonic (all x>0) n/Σ(1/x) · trimmed mean drops floor(10% n) from each end.
   Skewness = Pearson's second coefficient, 3(mean − median)/s with the sample standard deviation. */
(function(){
var C=window.CPX,$=C.$,M=C.math,last='',rows=[],defData='';

function fx(x,dp){if(!isFinite(x))return '—';if(x!==0&&Math.abs(x)<Math.pow(10,-dp)){var e=x.toExponential(3).split('e');return e[0]+'e'+e[1].replace('+','');}return M.fix(x,dp);}
function esc(s){return C.esc(s);}
function nf(x){return esc(M.fmt(x,6));}

function parse(txt,pairs){
  if(!pairs){var a=M.list(txt);return {a:a,bad:a.bad};}
  var out=[],bad=0,total=0;
  String(txt||'').split(/[,;\n]+/).forEach(function(t){t=t.trim();if(!t)return;var m=t.match(/^(-?\d*\.?\d+(?:e[+-]?\d+)?)\s*(?::|x|×)\s*(\d+)$/i);
    if(m){var v=Number(m[1]),f=Math.min(+m[2],200000);total+=f;if(total>200000){bad++;return;}for(var i=0;i<f;i++)out.push(v);}
    else if(isFinite(Number(t.replace(/,/g,''))))out.push(Number(t));else bad++;});
  out.bad=bad;return {a:out,bad:bad};
}

function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','med','mode','gm','hm','tm','mid','cnt','rng','skw'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('meanN','Geben Sie mindestens eine Zahl ein, um ein Ergebnis zu sehen.');C.text('modeN','—');C.text('sumN','—');C.text('rngN','—');C.text('tmN','—');$('plot').innerHTML='';$('steps').innerHTML='';$('frqTbl').tBodies[0].innerHTML='';C.text('plotTag','—');C.text('legend','—');C.text('frqNote','—');last='';rows=[];}

function plot(sorted,freqs,mean,median,modes,binned){
  var W=760,H=250,pl=34,pr=16,pt=12,pb=34,mn=sorted[0],mx=sorted[sorted.length-1],bars=[],i;
  if(!binned){freqs.forEach(function(f){bars.push({x0:f.v,x1:f.v,n:f.n,mode:modes.indexOf(f.v)>-1});});}
  else{var nb=Math.min(20,Math.max(5,Math.ceil(Math.sqrt(sorted.length)))),w=(mx-mn)/nb||1;for(i=0;i<nb;i++)bars.push({x0:mn+i*w,x1:mn+(i+1)*w,n:0,mode:false});sorted.forEach(function(v){var k=Math.min(nb-1,Math.floor((v-mn)/w));bars[k].n++;});}
  var gap=Infinity;if(!binned){for(i=1;i<freqs.length;i++)gap=Math.min(gap,freqs[i].v-freqs[i-1].v);if(!isFinite(gap))gap=1;}
  var lo=binned?mn:mn-gap,hi=binned?mx:mx+gap;if(lo===hi){lo-=1;hi+=1;}
  var maxN=0;bars.forEach(function(b){if(b.n>maxN)maxN=b.n;});var top=Math.max(2,maxN);
  var X=function(t){return pl+(t-lo)/(hi-lo)*(W-pl-pr);},Y=function(n){return pt+(1-n/top)*(H-pt-pb);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">',step=top<=6?1:Math.ceil(top/5);
  for(i=0;i<=top;i+=step){s+='<line class="bs" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(i)+'" y2="'+Y(i)+'"/><text class="ax" x="'+(pl-6)+'" y="'+(Y(i)+3)+'" text-anchor="end">'+i+'</text>';}
  bars.forEach(function(b){var x0,x1;if(binned){x0=X(b.x0)+1;x1=X(b.x1)-1;}else{var bw=Math.max(6,(X(lo+gap)-X(lo))*0.6);x0=X(b.x0)-bw/2;x1=X(b.x0)+bw/2;}
    if(b.n>0)s+='<rect class="bar'+(b.mode?' on':'')+'" x="'+x0.toFixed(1)+'" y="'+Y(b.n).toFixed(1)+'" width="'+Math.max(2,x1-x0).toFixed(1)+'" height="'+(Y(0)-Y(b.n)).toFixed(1)+'" rx="2"><title>'+esc(binned?M.fmt(b.x0,4)+' to '+M.fmt(b.x1,4):M.fmt(b.x0,6))+': '+b.n+'</title></rect>';
    if(!binned&&bars.length<=24)s+='<text class="ax" x="'+X(b.x0).toFixed(1)+'" y="'+(H-pb+14)+'" text-anchor="middle">'+esc(M.fmt(b.x0,3))+'</text>';});
  if(binned){for(i=0;i<=4;i++){var t=lo+i*(hi-lo)/4;s+='<text class="ax" x="'+X(t).toFixed(1)+'" y="'+(H-pb+14)+'" text-anchor="middle">'+esc(M.fmt(t,3))+'</text>';}}
  s+='<line class="bs" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/>';
  var lm=X(mean),ld=X(median);
  s+='<line x1="'+lm.toFixed(1)+'" x2="'+lm.toFixed(1)+'" y1="'+pt+'" y2="'+Y(0)+'" stroke="#d97706" stroke-width="2" stroke-dasharray="5 4"/><line x1="'+ld.toFixed(1)+'" x2="'+ld.toFixed(1)+'" y1="'+pt+'" y2="'+Y(0)+'" stroke="var(--sx-primary)" stroke-width="2" stroke-dasharray="2 3"/>';
  $('plot').innerHTML=s+'</svg>';
  C.text('legend','Gestrichelte bernsteinfarbene Linie: Mittelwert ('+M.fmt(mean,4)+'). Gepunktete grüne Linie: Median ('+M.fmt(median,4)+').'+(binned?' Die Werte werden in gleich breite Bereiche gruppiert, da es viele verschiedene Werte gibt.':' Ausgefüllte Balken markieren den Modus'+(modes.length>1?'s':'')+'.'));
  C.text('plotTag',binned?'in Bereiche gruppiert':freqs.length+' verschiedener Wert'+(freqs.length===1?'':'s'));
}

function compute(){
  var pairs=$('grp').value==='s2',dp=+$('prec').value;
  C.text('grpHelp',pairs?'Geben Sie Wert:Häufigkeit-Paare ein, zum Beispiel bedeutet 5:2, 8:4 zweimal die 5 und viermal die 8.':'Geben Sie jeden Wert ein; Wiederholungen werden einzeln gezählt.');
  var pr=parse($('data').value,pairs),a=pr.a,n=a.length;
  C.text('dataN',n+' value'+(n===1?'':'s')+(pr.bad?' · '+pr.bad+' ignored':''));$('err').hidden=true;
  if(n<1)return fail('Geben Sie mindestens eine Zahl ein.');
  var sorted=a.slice().sort(function(x,y){return x-y;}),mn=sorted[0],mx=sorted[n-1],sum=0;a.forEach(function(v){sum+=v;});var mean=sum/n;
  var mid=Math.floor(n/2),median=n%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
  var fm=new Map();sorted.forEach(function(v){fm.set(v,(fm.get(v)||0)+1);});var freqs=[];fm.forEach(function(c,v){freqs.push({v:v,n:c});});freqs.sort(function(p,q){return p.v-q.v;});
  var maxF=0;freqs.forEach(function(f){if(f.n>maxF)maxF=f.n;});var modes=maxF>1?freqs.filter(function(f){return f.n===maxF;}).map(function(f){return f.v;}):[];
  var pos=sorted.every(function(v){return v>0;}),gm=NaN,hm=NaN;
  if(pos){var sl=0,sr=0;sorted.forEach(function(v){sl+=Math.log(v);sr+=1/v;});gm=Math.exp(sl/n);hm=n/sr;}
  var k=Math.floor(0.1*n),tm=NaN;if(n-2*k>=1){var ts=0;for(var i=k;i<n-k;i++)ts+=sorted[i];tm=ts/(n-2*k);}
  var sd=NaN;if(n>1){sd=Math.sqrt(M.ss(a)/(n-1));}
  var sk=(sd>0)?3*(mean-median)/sd:NaN;
  C.text('resultValue',fx(mean,dp));C.text('meanN','Summe von '+n+' value'+(n===1?'':'s')+' ('+esc(M.fmt(sum,dp))+') geteilt durch '+n+'.');
  C.text('med',fx(median,dp));
  C.text('modeLbl',modes.length>1?'Modi':'Modus');
  var mtxt=!modes.length?'Kein Modus':modes.length>6?modes.slice(0,6).map(function(v){return M.fmt(v,dp);}).join(', ')+' …':modes.map(function(v){return M.fmt(v,dp);}).join(', ');C.text('mode',mtxt);
  C.text('modeN',!modes.length?'Jeder Wert kommt einmal vor, daher gibt es keinen Modus.':(modes.length===1?'Kommt vor: '+maxF+' times':modes.length===2?'Bimodal — jeder kommt vor: '+maxF+' times':'Multimodal — '+modes.length+' Werte kommen jeweils vor: '+maxF+' times'));
  C.text('gm',pos?fx(gm,dp):'n/a');C.text('gmN',pos?'n-te Wurzel des Produkts':'benötigt, dass jeder Wert größer als 0 ist');
  C.text('hm',pos?fx(hm,dp):'n/a');C.text('hmN',pos?'n ÷ Σ(1/x)':'benötigt, dass jeder Wert größer als 0 ist');
  C.text('tm',isFinite(tm)?fx(tm,dp):'n/a');C.text('tmN',k===0?'n < 10: nichts wird abgeschnitten, entspricht dem Mittelwert':'drops '+k+' niedrigste und '+k+' highest');
  C.text('mid',fx((mn+mx)/2,dp));C.text('cnt',n+' · '+M.fmt(sum,dp));C.text('sumN','n Werte · Summe');C.text('rng',fx(mx-mn,dp));C.text('rngN','min '+M.fmt(mn,dp)+' · Max. '+M.fmt(mx,dp));
  var tag=$('tag'),sl='—';
  if(isFinite(sk)){var as=Math.abs(sk);sl=as<0.5?'Ungefähr symmetrisch':(sk>0?'Right-skewed':'Left-skewed');tag.textContent=sl;tag.className='sx-ef-grade'+(as<0.5?'':as<1?' mid':' hi');C.text('skw',(sk>0?'+':sk<0?'−':'')+Math.abs(sk).toFixed(3));
    C.text('skwN',as<0.5?'Mittelwert und Median liegen nah beieinander (|Koeffizient| unter 0,5).':'Der Mittelwert ist '+(sk>0?'above':'below')+' der Median, daher neigt sich die Verteilung nach '+(sk>0?'rechts (Ausläufer hoher Werte)':'links (Ausläufer niedriger Werte)')+'.');}
  else{tag.textContent=n<2?'Einzelner Wert':'Keine Streuung';tag.className='sx-ef-grade';C.text('skw','n/a');C.text('skwN','Benötigt mindestens zwei verschiedene Werte.');}
  var binned=freqs.length>30;plot(sorted,freqs,mean,median,modes,binned);
  /* working */
  var so=$('sortb').value,list=so==='asc'?sorted:so==='desc'?sorted.slice().reverse():a,shown=list.slice(0,40).map(nf).join(', ')+(list.length>40?' … (+'+(list.length-40)+' weitere)':'');
  var h='<li><span class="n">1</span><h4>Werte auflisten '+(so==='asc'?'in aufsteigender Reihenfolge':so==='desc'?'in absteigender Reihenfolge':'wie eingegeben')+'</h4><p>'+n+' Werte. Der Median verwendet immer die aufsteigende Reihenfolge.</p><span class="eq">'+shown+'</span></li>';
  h+='<li><span class="n">2</span><h4>Mittelwert</h4><p>Addieren Sie alle Werte und teilen Sie durch die Anzahl.</p><span class="eq">x̄ = '+nf(sum)+' ÷ '+n+' = <b>'+nf(mean)+'</b></span></li>';
  h+='<li><span class="n">3</span><h4>Median</h4><p>'+(n%2?'n = '+n+' ist ungerade, daher ist der Median der Wert an Position (n + 1) ÷ 2 = '+((n+1)/2)+'.':'n = '+n+' ist gerade, daher wird der Durchschnitt der Werte an den Positionen gebildet '+(n/2)+' and '+(n/2+1)+'.')+'</p><span class="eq">'+(n%2?'Median = <b>'+nf(median)+'</b>':'Median = ('+nf(sorted[mid-1])+' + '+nf(sorted[mid])+') ÷ 2 = <b>'+nf(median)+'</b>')+'</span></li>';
  h+='<li><span class="n">4</span><h4>Modus</h4><p>Zählen Sie, wie oft jeder Wert vorkommt (Tabelle unten), und wählen Sie die höchste Anzahl.</p><span class="eq">'+(modes.length?'höchste Häufigkeit = '+maxF+' → Modus'+(modes.length>1?'s':'')+' = <b>'+modes.slice(0,10).map(nf).join(', ')+'</b>':'jede Häufigkeit ist 1 → <b>kein Modus</b>')+'</span></li>';
  $('steps').innerHTML=h;C.text('stepsIntro','Rechenweg für '+n+' value'+(n===1?'':'s')+'.');C.text('stepsTag',sl==='—'?'':sl);
  var ft=freqs.slice(),lim=20;if(ft.length>lim){ft.sort(function(p,q){return q.n-p.n||p.v-q.v;});ft=ft.slice(0,lim);}
  var tb='';ft.forEach(function(f){var isM=modes.indexOf(f.v)>-1;tb+='<tr'+(isM?' class="hl"':'')+'><td class="mono">'+nf(f.v)+'</td><td class="mono">'+f.n+'</td><td class="mono">'+(f.n/n*100).toFixed(2)+'%</td><td>'+(isM?(modes.length>1?'Modus (gleichauf)':'Modus'):'—')+'</td></tr>';});
  $('frqTbl').tBodies[0].innerHTML=tb;C.text('frqNote',freqs.length>lim?'Angezeigt werden die '+lim+' häufigsten von '+freqs.length+' verschiedenen Werten. Exportieren Sie die CSV für alle.':freqs.length+' verschiedener Wert'+(freqs.length===1?'':'s')+'.');
  rows=freqs.map(function(f){return [f.v,f.n,f.n/n*100];});
  last='Mittelwert, Median &amp; Modus — calculatepilot.com/math/mean-median-mode-calculator.html\nn = '+n+'\nMean: '+fx(mean,dp)+'\nMedian: '+fx(median,dp)+'\nMode: '+mtxt+(pos?'\nGeometrisches Mittel: '+fx(gm,dp)+'\nHarmonisches Mittel: '+fx(hm,dp):'')+'\nRange: '+M.fmt(mx-mn,dp)+' (min '+M.fmt(mn,dp)+', Max. '+M.fmt(mx,dp)+')';
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('data').dispatchEvent(new Event('input',{bubbles:true}));}

document.addEventListener('DOMContentLoaded',function(){
  defData=$('data').value;
  C.init({root:'mmCalc',compute:compute});
  $('ex').addEventListener('change',function(){if(this.value){$('grp').value='s1';$('data').value=this.value;fire();}});
  $('clear').addEventListener('click',function(){$('data').value='';$('ex').value='';fire();$('data').focus();});
  $('rand').addEventListener('click',function(){var o=[],i;for(i=0;i<15;i++)o.push(Math.floor(Math.random()*20)+1);$('grp').value='s1';$('data').value=o.join(', ');$('ex').value='';fire();});
  document.querySelector('#mmCalc [data-action=reset]').addEventListener('click',function(){$('data').value=defData;$('ex').value='';fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('csvBtn').addEventListener('click',function(){if(!rows.length)return;C.csv('frequency-table.csv',[{h:'Wert',key:0},{h:'Häufigkeit',key:1},{h:'Anteil der Daten (%)',key:2}],rows);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
