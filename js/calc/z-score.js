/* Z-score calculator — CalculatePilot (Stitch redesign).
   z = (x − μ)/σ ; x = μ + zσ ; percentile = Φ(z) (standard normal CDF, series + continued fraction).
   Modes: single value, raw data set (sample s uses n−1, population σ uses N), inverse (percentile → z → x). */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='';

function pctTxt(p){var x=p*100;return (x>=99.995&&p<1?x.toFixed(4):x<0.005&&x>0?x.toPrecision(2):x.toFixed(2))+'%';}
function probTxt(p){return p<1e-4&&p>0?p.toExponential(3):p.toFixed(5);}
function sgn(z){return (z>0?'+':z<0?'−':'')+Math.abs(z).toFixed(4);}
function esc(s){return C.esc(s);}
function tagFor(z){var a=Math.abs(z);if(a<0.5)return['Near the mean',''];if(a<1)return[z>0?'Slightly above average':'Slightly below average',''];if(a<2)return[z>0?'Above average':'Below average','mid'];if(a<3)return[z>0?'Unusually high':'Unusually low','hi'];return[z>0?'Extremely high':'Extremely low','hi'];}
function interp(z,p){var a=Math.abs(z),dir=z>=0?'above':'below',sdw=a.toFixed(2)+' standard deviation'+(a.toFixed(2)==='1.00'?'':'s');
  if(a<0.005)return 'Exactly at the mean. Half of a normal distribution lies below this value.';
  return sdw+' '+dir+' the mean. On a normal distribution about '+pctTxt(p)+' of values fall below this value and '+pctTxt(1-p)+' above.';}

function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','pct','xOut','pL','pR','pT'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('steps').innerHTML='';$('curve').innerHTML='';$('ptsCard').hidden=true;last='';}

function curve(z,mu,sd){
  var W=560,H=210,pl=10,pr=10,pt=10,pb=44,lo=-4,hi=4,top=M.pdf(0)*1.08;
  var X=function(t){return pl+(t-lo)/(hi-lo)*(W-pl-pr);},Y=function(d){return pt+(1-d/top)*(H-pt-pb);};
  var zc=Math.max(lo,Math.min(hi,z)),pts=[],i,t;
  for(i=0;i<=160;i++){t=lo+i*(hi-lo)/160;pts.push([X(t),Y(M.pdf(t))]);}
  var line=pts.map(function(p,k){return (k?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join('');
  var sh='M'+X(lo).toFixed(1)+' '+Y(0);for(i=0;i<=160;i++){t=lo+i*(hi-lo)/160;if(t>zc)break;sh+='L'+X(t).toFixed(1)+' '+Y(M.pdf(t)).toFixed(1);}sh+='L'+X(zc).toFixed(1)+' '+Y(M.pdf(zc)).toFixed(1)+'L'+X(zc).toFixed(1)+' '+Y(0)+'Z';
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><path class="sh" d="'+sh+'"/><line class="bs" x1="'+X(lo)+'" x2="'+X(hi)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/><path class="cv" d="'+line+'"/><line class="ln" x1="'+X(zc).toFixed(1)+'" x2="'+X(zc).toFixed(1)+'" y1="'+Y(M.pdf(zc)).toFixed(1)+'" y2="'+Y(0)+'"/><circle cx="'+X(zc).toFixed(1)+'" cy="'+Y(M.pdf(zc)).toFixed(1)+'" r="4" fill="var(--sx-primary)"/>';
  for(t=-3;t<=3;t++){s+='<line class="bs" x1="'+X(t)+'" x2="'+X(t)+'" y1="'+Y(0)+'" y2="'+(Y(0)+4)+'"/><text class="ax" x="'+X(t)+'" y="'+(Y(0)+16)+'" text-anchor="middle">'+(t===0?'μ':(t>0?'+':'−')+Math.abs(t)+'σ')+'</text><text class="ax" x="'+X(t)+'" y="'+(Y(0)+30)+'" text-anchor="middle">'+esc(M.fmt(mu+t*sd,2))+'</text>';}
  if(Math.abs(z)>4)s+='<text class="ax" x="'+(z>0?W-pr:pl)+'" y="'+(pt+10)+'" text-anchor="'+(z>0?'end':'start')+'">z = '+esc(M.fmt(z,2))+' is off the chart</text>';
  $('curve').innerHTML=s+'</svg>';C.text('curveLbl','z = '+sgn(z));
}

function steps(o){
  var h='',n=0;function st(t,d,eq){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+(eq?'<span class="eq">'+eq+'</span>':'')+'</li>';}
  var f=function(x){return esc(M.fmt(x,4));};
  if(o.mode==='s2'){
    st('Find the mean of the data','Add the '+o.n+' values and divide by '+o.n+'.','x̄ = '+f(o.sum)+' ÷ '+o.n+' = <b>'+f(o.mu)+'</b>');
    st('Sum the squared deviations','Add up (xᵢ − x̄)² over every value.','Σ(xᵢ − x̄)² = <b>'+f(o.ss)+'</b>');
    st('Divide and take the square root',o.pop?'Population standard deviation divides by N = '+o.n+'.':'Sample standard deviation divides by n − 1 = '+(o.n-1)+' (Bessel’s correction).',(o.pop?'σ':'s')+' = √('+f(o.ss)+' ÷ '+(o.pop?o.n:o.n-1)+') = <b>'+f(o.sd)+'</b>');
  }
  if(o.mode==='s3'){
    st('Convert the percentile to an area','Divide by 100 to get the cumulative probability.','p = '+f(o.p*100)+' ÷ 100 = <b>'+f(o.p)+'</b>');
    st('Apply the inverse normal CDF','Find the z-score whose left-tail area equals p.','z = Φ⁻¹('+f(o.p)+') = <b>'+f(o.z)+'</b>');
    st('Convert back to the raw score','Rescale with the mean and standard deviation.','x = μ + zσ = '+f(o.mu)+' + ('+f(o.z)+' × '+f(o.sd)+') = <b>'+f(o.x)+'</b>');
  }else{
    st('Set up the formula','Standardise by subtracting the '+(o.mode==='s2'?'sample mean':'mean')+' and dividing by the standard deviation.','z = (x − '+(o.mode==='s2'?'x̄':'μ')+') ÷ '+(o.mode==='s2'?(o.pop?'σ':'s'):'σ'));
    st('Substitute your values','','z = ('+f(o.x)+' − '+f(o.mu)+') ÷ '+f(o.sd));
    st('Solve','','z = '+f(o.x-o.mu)+' ÷ '+f(o.sd)+' = <b>'+sgn(o.z)+'</b>');
    st('Convert to a percentile','Look up the standard normal cumulative distribution function.','Φ('+f(o.z)+') = <b>'+f(o.p)+'</b> → '+pctTxt(o.p)+' percentile');
  }
  $('steps').innerHTML=h;
}

function compute(){
  var mode=$('mode').value,o={mode:mode},pop=$('basis').value==='s2';
  $('fX').hidden=mode!=='s1';$('fData').hidden=mode!=='s2';$('fMS').hidden=mode==='s2';$('fP').hidden=mode!=='s3';$('presets').hidden=mode==='s2';
  $('err').hidden=true;
  var x,mu,sd,z,p;
  if(mode==='s2'){
    var a=M.list($('data').value);C.text('dataN',a.length+' value'+(a.length===1?'':'s')+(a.bad?' · '+a.bad+' ignored':''));
    if(a.length<2)return fail('Enter at least two numbers in the data set.');
    var ss=M.ss(a),df=pop?a.length:a.length-1;mu=M.mean(a);sd=Math.sqrt(ss/df);x=v('xd');o.n=a.length;o.sum=mu*a.length;o.ss=ss;o.pop=pop;
    if(!(sd>0))return fail('Every value in the data set is the same, so the standard deviation is 0 and z is undefined.');
    z=(x-mu)/sd;
    var rows='';a.slice(0,200).forEach(function(t,i){rows+='<tr><td>'+(i+1)+'</td><td class="mono">'+esc(M.fmt(t,4))+'</td><td class="mono">'+sgn((t-mu)/sd)+'</td></tr>';});
    $('ptsTbl').tBodies[0].innerHTML=rows;C.text('ptsN',a.length>200?'first 200 of '+a.length:a.length+' points');$('ptsCard').hidden=false;
  }else{
    $('ptsCard').hidden=true;mu=v('mu');sd=v('sd');
    if(!(sd>0))return fail('Standard deviation (σ) must be greater than 0.');
    if(mode==='s3'){p=v('pp')/100;if(!(p>0&&p<1))return fail('Enter a percentile strictly between 0 and 100.');z=M.inv(p);x=mu+z*sd;o.p=p;}
    else{x=v('x');z=(x-mu)/sd;}
  }
  if(!isFinite(z))return fail('Check the numbers entered.');
  p=M.cdf(z);Object.assign(o,{x:x,mu:mu,sd:sd,z:z,p:p});
  var tg=tagFor(z),t=$('tag');t.textContent=tg[0];t.className='sx-ef-grade'+(tg[1]?' '+tg[1]:'');
  C.text('resultValue',sgn(z));C.text('interp',interp(z,p));C.text('pct',pctTxt(p));C.text('xOut',M.fmt(x,4));C.text('xLbl',mode==='s3'?'Value at this percentile (x)':'Raw score (x)');
  C.text('pL',probTxt(p));C.text('pR',probTxt(M.sf(z)));C.text('pT',probTxt(2*Math.min(p,M.sf(z))));
  curve(z,mu,sd);steps(o);
  document.querySelectorAll('#ruleTbl tbody tr').forEach(function(r){var a=Math.abs(z);r.className=(a>=+r.getAttribute('data-lo')&&a<+r.getAttribute('data-hi'))?'hl':'';});
  last='Z-score calculator — calculatepilot.com/math/z-score-calculator.html\n'+(mode==='s3'?'Percentile '+pctTxt(p)+' → ':'x = '+M.fmt(x,4)+', ')+'μ = '+M.fmt(mu,4)+', σ = '+M.fmt(sd,4)+'\nz = '+sgn(z)+'\nCumulative percentile: '+pctTxt(p)+'\nP(Z < z) = '+probTxt(p)+' · P(Z > z) = '+probTxt(M.sf(z))+' · two-tailed = '+probTxt(2*Math.min(p,M.sf(z)));
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'zCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-mu]');if(!b)return;C.set('mu',b.getAttribute('data-mu'));C.set('sd',b.getAttribute('data-sd'));$('sd').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
