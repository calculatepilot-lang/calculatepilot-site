/* Quartile & IQR calculator — CalculatePilot (Stitch redesign).
   Methods (Hyndman & Fan 1996 / Tukey 1977):
   inc  R-7  rank L = 1 + p(n−1), linear interpolation (Excel QUARTILE.INC, R & NumPy default)
   exc  R-6  rank L = p(n+1), linear interpolation, needs 1 ≤ L ≤ n (Excel QUARTILE.EXC, Minitab, SPSS)
   tukey     median of each half, median included in both halves when n is odd (Tukey's hinges)
   mm        median of each half, median excluded when n is odd (Moore & McCabe)
   Fences: inner Q1−1.5·IQR / Q3+1.5·IQR (mild outliers), outer ±3·IQR (extreme). */
(function(){
var C=window.CPX,$=C.$,M=C.math,last='',csv=[];
var NAMES={inc:'Inclusive (R-7)',exc:'Exclusive (R-6)',tukey:'Charnières de Tukey',mm:'Moore et McCabe'};
var USED={inc:'Excel QUARTILE.INC, R (par défaut), NumPy (par défaut)',exc:'Excel QUARTILE.EXC, Minitab, SPSS',tukey:'R fivenum(), boîtes à moustaches de Tukey',mm:'De nombreux manuels d\'introduction'};
var HELP={inc:'Rang 1 + p(n − 1), interpolé. Toujours défini ; le réglage par défaut le plus répandu dans les logiciels.',exc:'Rang p(n + 1), interpolé. Non défini pour de très petits n (au moins 3 valeurs requises).',tukey:'Médiane des moitiés inférieure et supérieure ; avec un effectif impair, la médiane fait partie des deux moitiés.',mm:'Médiane des moitiés inférieure et supérieure ; avec un effectif impair, la médiane est exclue des deux moitiés.'};

function fx(x,dp){return isFinite(x)?M.fix(x,dp):'n/a';}
function esc(s){return C.esc(s);}
function nf(x){return esc(M.fmt(x,6));}
function median(a){var n=a.length,m=Math.floor(n/2);return n%2?a[m]:(a[m-1]+a[m])/2;}
function at(x,L){var n=x.length,i=Math.floor(L),f=L-i;if(i<1)return x[0];if(i>=n)return x[n-1];return x[i-1]+f*(x[i]-x[i-1]);}
function halves(x,incl){var n=x.length,h=Math.floor(n/2);return n%2?[x.slice(0,incl?h+1:h),x.slice(incl?h:h+1)]:[x.slice(0,h),x.slice(h)];}
function quart(x,m){var n=x.length,r={q2:median(x)};
  if(m==='inc'){r.q1=at(x,1+0.25*(n-1));r.q3=at(x,1+0.75*(n-1));}
  else if(m==='exc'){var l1=0.25*(n+1),l3=0.75*(n+1);r.q1=(l1>=1&&l1<=n)?at(x,l1):NaN;r.q3=(l3>=1&&l3<=n)?at(x,l3):NaN;}
  else{var h=halves(x,m==='tukey');r.q1=h[0].length?median(h[0]):NaN;r.q3=h[1].length?median(h[1]):NaN;}
  return r;}
function rankStep(x,p,m,val){
  var n=x.length,nm=p===0.25?'Q1':'Q3',L=m==='inc'?1+p*(n-1):p*(n+1),f=L-Math.floor(L),i=Math.floor(L);
  var f1=m==='inc'?'L = 1 + '+p+' × ('+n+' − 1) = '+M.fmt(L,4):'L = '+p+' × ('+n+' + 1) = '+M.fmt(L,4);
  if(!isFinite(val))return f1+'<br><b>'+nm+' n\'est pas défini</b> : le rang se situe en dehors de 1 à '+n+'.';
  if(Math.abs(f)<1e-12)return f1+'<br>Le rang est un entier, donc '+nm+' = x['+i+'] = <b>'+nf(x[i-1])+'</b>';
  return f1+'<br>Entre x['+i+'] = '+nf(x[i-1])+' et x['+(i+1)+'] = '+nf(x[i])+':<br>'+nm+' = '+nf(x[i-1])+' + '+M.fmt(f,4)+' × ('+nf(x[i])+' − '+nf(x[i-1])+') = <b>'+nf(val)+'</b>';
}

function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','siqr','midh','mn','q1','q2','q3','mx','cnt','ilf','iuf','olf','ouf'].forEach(function(i){C.text(i,'—');});['mnN','q1N','q2N','q3N','mxN'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Saisissez au moins deux nombres.');C.text('outN','—');C.text('outTag','—');C.text('whiskTag','—');C.text('plotN','—');$('plot').innerHTML='';$('steps').innerHTML='';$('cmpTbl').tBodies[0].innerHTML='';last='';csv=[];}

function plot(x,q,fn){
  var W=760,H=170,pl=20,pr=20,mn=x[0],mx=x[x.length-1],lo=mn,hi=mx;if(lo===hi){lo-=1;hi+=1;}var pad=(hi-lo)*0.05;lo-=pad;hi+=pad;
  var X=function(v){return pl+(v-lo)/(hi-lo)*(W-pl-pr);},cy=70,bh=46;
  var inside=x.filter(function(v){return v>=fn.ilf&&v<=fn.iuf;}),wl=inside[0],wh=inside[inside.length-1];
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><line class="bs" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+(cy+bh/2+22)+'" y2="'+(cy+bh/2+22)+'"/>';
  for(var i=0;i<=5;i++){var t=lo+i*(hi-lo)/5;s+='<line class="bs" x1="'+X(t).toFixed(1)+'" x2="'+X(t).toFixed(1)+'" y1="'+(cy+bh/2+22)+'" y2="'+(cy+bh/2+27)+'"/><text class="ax" x="'+X(t).toFixed(1)+'" y="'+(cy+bh/2+40)+'" text-anchor="middle">'+esc(M.fmt(t,3))+'</text>';}
  [fn.ilf,fn.iuf].forEach(function(v){if(v>lo&&v<hi)s+='<line x1="'+X(v).toFixed(1)+'" x2="'+X(v).toFixed(1)+'" y1="'+(cy-bh/2-12)+'" y2="'+(cy+bh/2+22)+'" stroke="#d97706" stroke-width="1.5" stroke-dasharray="5 4"/>';});
  if(isFinite(q.q1)&&isFinite(q.q3)){
    s+='<line x1="'+X(wl).toFixed(1)+'" x2="'+X(q.q1).toFixed(1)+'" y1="'+cy+'" y2="'+cy+'" stroke="var(--sx-primary)" stroke-width="2"/><line x1="'+X(q.q3).toFixed(1)+'" x2="'+X(wh).toFixed(1)+'" y1="'+cy+'" y2="'+cy+'" stroke="var(--sx-primary)" stroke-width="2"/>';
    s+='<line x1="'+X(wl).toFixed(1)+'" x2="'+X(wl).toFixed(1)+'" y1="'+(cy-10)+'" y2="'+(cy+10)+'" stroke="var(--sx-primary)" stroke-width="2"/><line x1="'+X(wh).toFixed(1)+'" x2="'+X(wh).toFixed(1)+'" y1="'+(cy-10)+'" y2="'+(cy+10)+'" stroke="var(--sx-primary)" stroke-width="2"/>';
    s+='<rect x="'+X(q.q1).toFixed(1)+'" y="'+(cy-bh/2)+'" width="'+Math.max(2,X(q.q3)-X(q.q1)).toFixed(1)+'" height="'+bh+'" rx="3" fill="var(--sx-pc)" fill-opacity=".18" stroke="var(--sx-primary)" stroke-width="2"/>';}
  s+='<line x1="'+X(q.q2).toFixed(1)+'" x2="'+X(q.q2).toFixed(1)+'" y1="'+(cy-bh/2)+'" y2="'+(cy+bh/2)+'" stroke="var(--sx-primary)" stroke-width="3"/>';
  x.forEach(function(v){if(v<fn.ilf||v>fn.iuf){var ex=v<fn.olf||v>fn.ouf;s+='<circle cx="'+X(v).toFixed(1)+'" cy="'+cy+'" r="5" fill="'+(ex?'#dc2626':'#f59e0b')+'"><title>'+esc(M.fmt(v,6))+(ex?' (valeur aberrante extrême)':' (valeur aberrante modérée)')+'</title></circle>';}});
  [[q.q1,'Q1'],[q.q2,'Médiane'],[q.q3,'Q3']].forEach(function(p){if(isFinite(p[0]))s+='<text class="ax" x="'+X(p[0]).toFixed(1)+'" y="'+(cy-bh/2-16+(p[1]==='Median'?-0:0))+'" text-anchor="middle" style="font-weight:600">'+p[1]+' '+esc(M.fmt(p[0],3))+'</text>';});
  $('plot').innerHTML=s+'</svg>';
  C.text('whiskTag',isFinite(wl)?'whiskers '+M.fmt(wl,4)+' to '+M.fmt(wh,4):'—');
}

function compute(){
  var m=$('method').value,dp=+$('prec').value,a=M.list($('data').value),n=a.length;
  C.text('methodHelp',HELP[m]);C.text('dataN',n+' value'+(n===1?'':'s')+(a.bad?' · '+a.bad+' ignored':''));$('err').hidden=true;
  if(n<2)return fail('Saisissez au moins deux nombres.');
  var x=a.slice().sort(function(p,q){return p-q;}),q=quart(x,m);
  if(!isFinite(q.q1)||!isFinite(q.q3))return fail('Le '+NAMES[m]+' la méthode requiert au moins 3 valeurs pour placer Q1 et Q3. Ajoutez des données ou choisissez une autre méthode.');
  var iqr=q.q3-q.q1,fn={ilf:q.q1-1.5*iqr,iuf:q.q3+1.5*iqr,olf:q.q1-3*iqr,ouf:q.q3+3*iqr};
  C.text('resultValue',fx(iqr,dp));C.text('siqr',fx(iqr/2,dp));C.text('midh',fx((q.q1+q.q3)/2,dp));
  C.text('mn',fx(x[0],dp));C.text('mnN','x[1]');C.text('q1',fx(q.q1,dp));C.text('q2',fx(q.q2,dp));C.text('q3',fx(q.q3,dp));C.text('mx',fx(x[n-1],dp));C.text('mxN','x['+n+']');C.text('cnt',String(n));
  C.text('q1N',NAMES[m]);C.text('q2N','valeur centrale');C.text('q3N',NAMES[m]);
  C.text('ilf',fx(fn.ilf,dp));C.text('iuf',fx(fn.iuf,dp));C.text('olf',fx(fn.olf,dp));C.text('ouf',fx(fn.ouf,dp));
  var mild=[],ext=[];x.forEach(function(v){if(v<fn.olf||v>fn.ouf)ext.push(v);else if(v<fn.ilf||v>fn.iuf)mild.push(v);});
  var no=mild.length+ext.length,t=$('tag');t.textContent=no?no+' outlier'+(no===1?'':'s')+' flagged':'Aucune valeur aberrante';t.className='sx-ef-grade'+(no?(ext.length?' hi':' mid'):'');C.text('outTag',no?no+' flagged':'none');
  C.text('outN',no?(ext.length?'Extrêmes (au-delà des clôtures extérieures) : '+ext.map(function(v){return M.fmt(v,6);}).join(', ')+'. ':'')+(mild.length?'Modérées (au-delà des clôtures intérieures) : '+mild.map(function(v){return M.fmt(v,6);}).join(', ')+'.':''):'Aucune valeur ne se situe en dehors des clôtures intérieures.');
  C.text('interp','La moitié centrale des données s\'étend sur '+fx(q.q1,dp)+' to '+fx(q.q3,dp)+' ('+NAMES[m]+' méthode).');
  C.text('plotN',no?'Les points orange sont des valeurs aberrantes modérées ; les points rouges, des valeurs aberrantes extrêmes. Les lignes en pointillés indiquent les clôtures intérieures.':'Aucune valeur ne se situe en dehors des clôtures intérieures (lignes en pointillés, lorsqu\'elles sont dans la plage représentée).');
  plot(x,q,fn);
  /* steps */
  var h='',lis=x.slice(0,40).map(nf).join(', ')+(n>40?' … (+'+(n-40)+' de plus)':'');
  h+='<li><span class="n">1</span><h4>Trier les données</h4><p>Classez les '+n+' valeurs par ordre croissant.</p><span class="eq">x = { '+lis+' }</span></li>';
  if(m==='inc'||m==='exc'){
    h+='<li><span class="n">2</span><h4>Premier quartile (Q1)</h4><p>Rang pour p = 0,25, puis interpolation.</p><span class="eq">'+rankStep(x,0.25,m,q.q1)+'</span></li>';
    h+='<li><span class="n">3</span><h4>Médiane (Q2)</h4><p>Le milieu de la liste triée.</p><span class="eq">'+(n%2?'n = '+n+' est impair → x['+((n+1)/2)+'] = <b>'+nf(q.q2)+'</b>':'n = '+n+' est pair → (x['+(n/2)+'] + x['+(n/2+1)+']) ÷ 2 = ('+nf(x[n/2-1])+' + '+nf(x[n/2])+') ÷ 2 = <b>'+nf(q.q2)+'</b>')+'</span></li>';
    h+='<li><span class="n">4</span><h4>Troisième quartile (Q3)</h4><p>Rang pour p = 0,75, puis interpolation.</p><span class="eq">'+rankStep(x,0.75,m,q.q3)+'</span></li>';
  }else{
    var hv=halves(x,m==='tukey');
    h+='<li><span class="n">2</span><h4>Médiane (Q2)</h4><p>Le milieu de la liste triée.</p><span class="eq">'+(n%2?'n = '+n+' est impair → <b>'+nf(q.q2)+'</b>':'n = '+n+' est pair → ('+nf(x[n/2-1])+' + '+nf(x[n/2])+') ÷ 2 = <b>'+nf(q.q2)+'</b>')+'</span></li>';
    h+='<li><span class="n">3</span><h4>Q1 = médiane de la moitié inférieure</h4><p>'+(n%2?(m==='tukey'?'n est impair, donc la médiane est incluse dans les deux moitiés (Tukey).':'n est impair : la médiane est exclue des deux moitiés (Moore et McCabe).'):'n est pair, donc les moitiés correspondent exactement aux '+n/2+' valeurs inférieures et supérieures.')+'</p><span class="eq">moitié inférieure ('+hv[0].length+' valeurs) = { '+hv[0].slice(0,25).map(nf).join(', ')+(hv[0].length>25?' …':'')+' }<br>Q1 = <b>'+nf(q.q1)+'</b></span></li>';
    h+='<li><span class="n">4</span><h4>Q3 = médiane de la moitié supérieure</h4><p>La même règle appliquée à la moitié haute.</p><span class="eq">moitié supérieure ('+hv[1].length+' valeurs) = { '+hv[1].slice(0,25).map(nf).join(', ')+(hv[1].length>25?' …':'')+' }<br>Q3 = <b>'+nf(q.q3)+'</b></span></li>';
  }
  h+='<li><span class="n">5</span><h4>EIQ et clôtures des valeurs aberrantes</h4><p>Convention de Tukey : 1,5 × EIQ pour les clôtures intérieures, 3 × EIQ pour les clôtures extérieures.</p><span class="eq">EIQ = Q3 − Q1 = '+nf(q.q3)+' − '+nf(q.q1)+' = <b>'+nf(iqr)+'</b><br>Clôtures intérieures : '+nf(q.q1)+' − 1.5 × '+nf(iqr)+' = '+nf(fn.ilf)+'   and   '+nf(q.q3)+' + 1.5 × '+nf(iqr)+' = '+nf(fn.iuf)+'<br>'+(no?'<b>'+no+' value'+(no===1?'':'s')+' en dehors des clôtures intérieures</b> : '+mild.concat(ext).sort(function(p,r){return p-r;}).map(nf).join(', '):'Aucune valeur ne se situe en dehors des clôtures intérieures.')+'</span></li>';
  $('steps').innerHTML=h;C.text('stepsIntro','Détail du calcul pour '+n+' valeurs selon la '+NAMES[m]+' méthode.');C.text('stepsTag',NAMES[m]);
  /* comparison */
  var tb='';['inc','exc','tukey','mm'].forEach(function(k){var r=quart(x,k),ok=isFinite(r.q1)&&isFinite(r.q3);tb+='<tr'+(k===m?' class="act"':'')+'><td style="white-space:normal">'+esc(NAMES[k])+(k===m?' <span class="act">sélectionnés</span>':'')+'</td><td class="mono">'+fx(r.q1,dp)+'</td><td class="mono">'+fx(r.q2,dp)+'</td><td class="mono">'+fx(r.q3,dp)+'</td><td class="mono">'+(ok?fx(r.q3-r.q1,dp):'n/a')+'</td><td style="font-family:inherit;white-space:normal;font-size:12px">'+esc(USED[k])+'</td></tr>';});
  $('cmpTbl').tBodies[0].innerHTML=tb;
  csv=[['Minimum',x[0]],['Q1',q.q1],['Médiane',q.q2],['Q3',q.q3],['Maximum',x[n-1]],['IQR',iqr],['Clôture intérieure inférieure',fn.ilf],['Clôture intérieure supérieure',fn.iuf],['Clôture extérieure inférieure',fn.olf],['Clôture extérieure supérieure',fn.ouf]];
  last='Quartiles — calculatepilot.com/math/quartile-calculator.html\nMéthode : '+NAMES[m]+', n = '+n+'\nMin '+fx(x[0],dp)+' · Q1 '+fx(q.q1,dp)+' · Médiane '+fx(q.q2,dp)+' · Q3 '+fx(q.q3,dp)+' · Max '+fx(x[n-1],dp)+'\nIQR '+fx(iqr,dp)+'\nClôtures intérieures '+fx(fn.ilf,dp)+' to '+fx(fn.iuf,dp)+'\nOutliers: '+(no?mild.concat(ext).map(function(v){return M.fmt(v,6);}).join(', '):'none');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('data').dispatchEvent(new Event('input',{bubbles:true}));}
var defData='';
document.addEventListener('DOMContentLoaded',function(){
  defData=$('data').value;
  C.init({root:'qCalc',compute:compute});
  $('ex').addEventListener('change',function(){if(this.value){$('data').value=this.value;fire();}});
  $('clear').addEventListener('click',function(){$('data').value='';$('ex').value='';fire();$('data').focus();});
  document.querySelector('#qCalc [data-action=reset]').addEventListener('click',function(){$('data').value=defData;$('ex').value='';fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résumé');});
  $('csvBtn').addEventListener('click',function(){if(!csv.length)return;C.csv('quartiles.csv',[{h:'Statistique',key:0},{h:'Valeur',key:1}],csv);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
