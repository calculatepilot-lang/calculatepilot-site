/* Binomial probability calculator — CalculatePilot (Stitch redesign).
   P(X=k) = C(n,k) p^k q^(n−k), evaluated as exp(lnC + k ln p + (n−k) ln q) with ln Γ from CPX.math.
   Cumulative results sum the PMF terms (from the smaller side for accuracy). n ≤ 1000.
   μ = np, σ² = npq, skewness = (1−2p)/σ, excess kurtosis = (1−6pq)/σ², mode = floor((n+1)p) (n if p = 1). */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='',rows=[];

function lnC(n,k){return M.gammaln(n+1)-M.gammaln(k+1)-M.gammaln(n-k+1);}
function pmf(n,p,k){if(p===0)return k===0?1:0;if(p===1)return k===n?1:0;return Math.exp(lnC(n,k)+k*Math.log(p)+(n-k)*Math.log1p(-p));}
function sum(n,p,a,b){var s=0,i;for(i=a;i<=b;i++)s+=pmf(n,p,i);return s;}
function probs(n,p,k){
  var eq=pmf(n,p,k),le,ge;
  le=k<=n/2?sum(n,p,0,k):1-sum(n,p,k+1,n);ge=k>=n/2?sum(n,p,k,n):1-sum(n,p,0,k-1);
  var lt=Math.max(0,le-eq),gt=Math.max(0,ge-eq);
  return {eq:eq,le:Math.min(1,Math.max(0,le)),lt:lt,ge:Math.min(1,Math.max(0,ge)),gt:gt};}
function ci(n,k){var c=1n,i,N=BigInt(n),K=BigInt(k);for(i=1n;i<=K;i++)c=c*(N-K+i)/i;return c;}
function big(b){var s=b.toString();if(s.length<=15)return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');return s[0]+'.'+s.slice(1,5)+'×10^'+(s.length-1);}
function pf(x){if(!isFinite(x))return '—';if(x===0)return '0';if(x<1e-6)return x.toExponential(3);return x.toFixed(6);}
function pc(x){return x*100<0.0001&&x>0?(x*100).toExponential(2)+'%':(x*100).toFixed(x*100<0.01?4:2)+'%';}
function esc(s){return C.esc(s);}
function odds(x){if(x<=0)return 'never';if(x>=1)return 'certain';return '1 in '+M.fmt(1/x,4);}

var LBL={eq:'P(X = k)',le:'P(X ≤ k)',ge:'P(X ≥ k)',lt:'P(X < k)',gt:'P(X > k)'};
function range(q,n,k){return q==='eq'?[k,k]:q==='le'?[0,k]:q==='lt'?[0,k-1]:q==='ge'?[k,n]:[k+1,n];}

function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','pctV','oddsV','t_eq','t_le','t_ge','t_lt','t_gt','mode','mu','va','sd','sk','ku','qq'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('plot').innerHTML='';$('steps').innerHTML='';C.text('plotTag','—');last='';rows=[];}

function plot(n,p,k,q){
  var mu=n*p,sd=Math.sqrt(n*p*(1-p)),lo=0,hi=n;if(n>40){lo=Math.max(0,Math.floor(mu-4.5*sd));hi=Math.min(n,Math.ceil(mu+4.5*sd));}
  var W=760,H=250,pl=40,pr=14,pt=14,pb=34,vals=[],i,mx=0,r=range(q,n,k);
  for(i=lo;i<=hi;i++){var t=pmf(n,p,i);vals.push(t);if(t>mx)mx=t;}
  if(mx===0)mx=1;var top=mx*1.15,cnt=hi-lo+1,bw=(W-pl-pr)/cnt;
  var X=function(j){return pl+(j-lo+0.5)*bw;},Y=function(t){return pt+(1-t/top)*(H-pt-pb);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  for(i=0;i<=4;i++){var tv=top*i/4;s+='<line class="bs" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(tv).toFixed(1)+'" y2="'+Y(tv).toFixed(1)+'"/><text class="ax" x="'+(pl-6)+'" y="'+(Y(tv)+3).toFixed(1)+'" text-anchor="end">'+tv.toFixed(3)+'</text>';}
  var every=Math.max(1,Math.ceil(cnt/16));
  vals.forEach(function(t,j){var kk=lo+j,on=kk>=r[0]&&kk<=r[1],x=pl+j*bw+bw*0.12;
    s+='<rect class="bar'+(on?' on':'')+'" x="'+x.toFixed(1)+'" y="'+Y(t).toFixed(1)+'" width="'+Math.max(1.5,bw*0.76).toFixed(1)+'" height="'+Math.max(0,Y(0)-Y(t)).toFixed(1)+'" rx="2"><title>P(X = '+kk+') = '+pf(t)+'</title></rect>';
    if(j%every===0)s+='<text class="ax" x="'+X(kk).toFixed(1)+'" y="'+(H-pb+14)+'" text-anchor="middle">'+kk+'</text>';});
  var mx2=pl+(mu-lo+0.5)*bw;
  s+='<line x1="'+mx2.toFixed(1)+'" x2="'+mx2.toFixed(1)+'" y1="'+pt+'" y2="'+Y(0)+'" stroke="#d97706" stroke-width="2" stroke-dasharray="5 4"/><text class="ax" x="'+(mx2+4).toFixed(1)+'" y="'+(pt+10)+'" style="fill:#b45309;font-weight:600">μ = '+M.fmt(mu,4)+'</text>';
  $('plot').innerHTML=s+'</svg>';C.text('plotTag',(n>40?'dargestellt: k = '+lo+' to '+hi+' (der Hauptteil der Verteilung)':'k = 0 bis '+n));
}

function compute(){
  var n=Math.round(v('n')),k=Math.round(v('k')),p=v('p'),q=$('q').value;
  C.text('kH','0 bis '+(n>0?n:'n'));$('err').hidden=true;
  if(!(n>=1&&n<=1000)||v('n')!==n)return fail('Die Anzahl der Versuche n muss eine ganze Zahl von 1 bis 1.000 sein.');
  if(!(p>=0&&p<=1))return fail('Die Erfolgswahrscheinlichkeit p muss zwischen 0 und 1 liegen.');
  if(v('k')!==k||k<0||k>n)return fail('Die Anzahl der Erfolge k muss eine ganze Zahl von 0 bis '+n+'.');
  var P=probs(n,p,k),qq=1-p,mu=n*p,va=n*p*qq,sd=Math.sqrt(va),r=range(q,n,k),val=P[q];
  C.text('heroLbl',LBL[q].replace('k',k));C.text('resultValue',pf(val));C.text('pctV',pc(val));C.text('oddsV',odds(val));
  C.text('interp','Bei n = '+n+' Versuchen und p = '+M.fmt(p,6)+', '+LBL[q].replace('k',k)+' is '+pc(val)+'.');
  var t=$('tag');t.textContent=val<0.05?'Unwahrscheinlich':val>0.95?'Sehr wahrscheinlich':'Plausibel';t.className='sx-ef-grade'+(val<0.05?' mid':'');
  ['eq','le','ge','lt','gt'].forEach(function(z){C.text('t_'+z,pf(P[z]));C.text('t_'+z+'N',pc(P[z])+' · '+odds(P[z]));});
  var mode=p===1?n:Math.floor((n+1)*p);C.text('mode',String(mode));C.text('modeN','P(X = '+mode+') = '+pf(pmf(n,p,mode)));
  C.text('mu',M.fmt(mu,6));C.text('va',M.fmt(va,6));C.text('sd',M.fmt(sd,6));C.text('sk',sd>0?((1-2*p)/sd>0?'+':'')+M.fmt((1-2*p)/sd,4):'n/a');C.text('ku',sd>0?M.fmt((1-6*p*qq)/va,4):'n/a');C.text('qq',M.fmt(qq,6));
  plot(n,p,k,q);
  /* steps */
  var f=function(x){return esc(M.fmt(x,6));},h='',c=ci(n,k),ps=Math.pow(p,k),qs=Math.pow(qq,n-k),cf=Number(c),m=0;
  function st(a,b,c2){m++;h+='<li><span class="n">'+m+'</span><h4>'+a+'</h4><p>'+b+'</p><span class="eq">'+c2+'</span></li>';}
  if(q==='eq'){
    st('Binomialkoeffizient C(n, k)','Die Anzahl der verschiedenen Möglichkeiten, auszuwählen, welche '+k+' der '+n+' Versuche Erfolge sind.','C('+n+', '+k+') = '+n+'! ÷ ('+k+'! × '+(n-k)+'!) = <b>'+big(c)+'</b>');
    st('Wahrscheinlichkeit der Erfolge, pᵏ','Alle '+k+' ausgewählten Versuche gelingen.','p^k = '+f(p)+'^'+k+' = <b>'+esc(ps===0?'0':ps.toExponential(6))+'</b>');
    st('Wahrscheinlichkeit der Misserfolge, (1 − p)ⁿ⁻ᵏ','Die übrigen '+(n-k)+' Versuche schlagen alle fehl.','(1 − p)^(n − k) = '+f(qq)+'^'+(n-k)+' = <b>'+esc(qs===0?'0':qs.toExponential(6))+'</b>');
    st('Multiplizieren','Koeffizient × Erfolge × Misserfolge.','P(X = '+k+') = '+big(c)+' × '+esc(ps.toExponential(4))+' × '+esc(qs.toExponential(4))+' = <b>'+f(P.eq)+'</b> ('+pc(P.eq)+')');
  }else{
    var a=r[0],b=r[1],terms=[];for(var i=a;i<=b&&terms.length<12;i++)terms.push('P(X = '+i+') = '+pf(pmf(n,p,i)));
    st('Das Ereignis als Summe schreiben',LBL[q].replace('k',k)+' addiert jedes Ergebnis im Bereich '+(a>b?'(empty)':a+' to '+b)+'.',LBL[q].replace('k',k)+' = Σ<sub>i='+a+'</sub><sup>'+b+'</sup> C('+n+', i) · '+f(p)+'^i · '+f(qq)+'^('+n+' − i)');
    st('Die Summanden berechnen','Jeder Summand ist eine Binomialwahrscheinlichkeit.',terms.map(esc).join('<br>')+(b-a+1>12?'<br>… ('+(b-a+1-12)+' weitere Summanden)':''));
    st('Alles addieren','',LBL[q].replace('k',k)+' = <b>'+f(val)+'</b> ('+pc(val)+')<br>Gegenprobe mit dem Komplement: 1 − '+f(1-val)+' = '+f(val));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Binomial('+n+', '+M.fmt(p,6)+'), k = '+k+'.');C.text('stepsTag',LBL[q].replace('k',k));
  rows=[];var lo=0,hi=n,cum=0;for(var j=lo;j<=hi&&j<=1000;j++){var pj=pmf(n,p,j);cum+=pj;rows.push([j,pj,Math.min(1,cum)]);}
  last='Binomialwahrscheinlichkeit — calculatepilot.com/math/binomial-probability-calculator.html\nn = '+n+', p = '+M.fmt(p,6)+', k = '+k+'\nP(X = k) = '+pf(P.eq)+'\nP(X ≤ k) = '+pf(P.le)+'\nP(X < k) = '+pf(P.lt)+'\nP(X ≥ k) = '+pf(P.ge)+'\nP(X > k) = '+pf(P.gt)+'\nMittelwert = '+M.fmt(mu,6)+', Standardabweichung = '+M.fmt(sd,6);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('n').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'biCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-n]');if(!b)return;C.set('n',b.getAttribute('data-n'));C.set('p',b.getAttribute('data-p'));C.set('k',b.getAttribute('data-k'));fire();});
  $('fracs').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;C.set('p',b.getAttribute('data-p'));fire();});
  $('rand').addEventListener('click',function(){var n=Math.floor(Math.random()*40)+5,p=Math.round((Math.random()*0.8+0.05)*100)/100;C.set('n',n);C.set('p',p);C.set('k',Math.round(n*p));fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Zusammenfassung kopieren');});
  $('csvBtn').addEventListener('click',function(){if(!rows.length)return;C.csv('binomial-distribution.csv',[{h:'k',key:0},{h:'P(X = k)',key:1},{h:'P(X ≤ k)',key:2}],rows);});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
