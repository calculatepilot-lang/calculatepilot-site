/* Percent error calculator — CalculatePilot (Stitch redesign).
   Percent error = |measured − accepted| ÷ |accepted| × 100 (signed keeps the direction of the deviation).
   Percent difference = |A − B| ÷ ((A + B)/2) × 100. Tolerance check compares |Δ| with ±% of accepted or ± absolute. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='';

function esc(s){return C.esc(s);}
function fs(x){if(!isFinite(x))return '—';var sig=+$('sig').value;if(x===0)return '0';if(sig===0)return C.math.fmt(x,8);return x.toPrecision(sig).replace(/^(-?)0\.0*$/,'$10');}
function sg(x){return x>0?'+':x<0?'−':'';}
function fsg(x){return sg(x)+fs(Math.abs(x));}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','abs','rel','sd','acc','band','stat'].forEach(function(i){C.text(i,'—');});['sdN','bandN','statN'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see a result.');C.text('vizTag','—');$('viz').innerHTML='';$('steps').innerHTML='';last='';}

function viz(a,b,mode,lo,hi,unit){
  var W=760,H=150,pl=30,pr=30,cy=64;if(lo===hi){lo-=1;hi+=1;}var pad=(hi-lo)*0.15;var L=lo-pad,R=hi+pad,X=function(t){return pl+(t-L)/(R-L)*(W-pl-pr);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><line class="bs" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+cy+'" y2="'+cy+'" style="stroke-width:2"/>';
  for(var i=0;i<=4;i++){var t=L+i*(R-L)/4;s+='<line class="bs" x1="'+X(t).toFixed(1)+'" x2="'+X(t).toFixed(1)+'" y1="'+cy+'" y2="'+(cy+5)+'"/><text class="ax" x="'+X(t).toFixed(1)+'" y="'+(cy+18)+'" text-anchor="middle">'+esc(C.math.fmt(t,4))+'</text>';}
  if(mode==='s2'){var m=(a+b)/2;
    s+='<line x1="'+X(m).toFixed(1)+'" x2="'+X(m).toFixed(1)+'" y1="'+(cy-30)+'" y2="'+cy+'" stroke="var(--sx-muted)" stroke-dasharray="4 3"/><text class="ax" x="'+X(m).toFixed(1)+'" y="'+(cy-36)+'" text-anchor="middle">mean '+esc(C.math.fmt(m,4))+'</text>';
    s+='<circle cx="'+X(a).toFixed(1)+'" cy="'+cy+'" r="7" fill="var(--sx-primary)"/><text class="ax" x="'+X(a).toFixed(1)+'" y="'+(cy+42)+'" text-anchor="middle" style="font-weight:600">A</text><circle cx="'+X(b).toFixed(1)+'" cy="'+cy+'" r="7" fill="#d97706"/><text class="ax" x="'+X(b).toFixed(1)+'" y="'+(cy+42)+'" text-anchor="middle" style="font-weight:600">B</text>';
  }else{
    var bw=viz.band;if(bw>0)s+='<rect x="'+X(b-bw).toFixed(1)+'" y="'+(cy-16)+'" width="'+Math.max(2,X(b+bw)-X(b-bw)).toFixed(1)+'" height="32" rx="4" fill="var(--sx-pc)" fill-opacity=".18" stroke="var(--sx-pc)" stroke-dasharray="4 3"/>';
    s+='<line x1="'+X(b).toFixed(1)+'" x2="'+X(b).toFixed(1)+'" y1="'+(cy-24)+'" y2="'+(cy+24)+'" stroke="var(--sx-primary)" stroke-width="3"/><text class="ax" x="'+X(b).toFixed(1)+'" y="'+(cy-30)+'" text-anchor="middle" style="font-weight:600">accepted '+esc(C.math.fmt(b,5))+'</text>';
    s+='<circle cx="'+X(a).toFixed(1)+'" cy="'+cy+'" r="7" fill="'+(viz.ok===false?'#dc2626':'#d97706')+'"/><text class="ax" x="'+X(a).toFixed(1)+'" y="'+(cy+42)+'" text-anchor="middle" style="font-weight:600">measured '+esc(C.math.fmt(a,5))+'</text>';
  }
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var mode=$('mode').value,a=v('a'),b=v('b'),tolT=$('tolT').value,tol=Math.abs(v('tol')),u=$('unit').value.trim(),us=u?' '+u:'',signed=$('sgn').value==='s',dp;
  $('fTolT').hidden=mode!=='s3';$('fTol').hidden=mode==='s2';$('presets').hidden=mode==='s2';
  C.text('aL',mode==='s1'?'Experimental (measured) value':mode==='s2'?'Value A':'Measured value');C.text('aH',mode==='s2'?'first measurement':'from your measurement');
  C.text('bL',mode==='s1'?'Theoretical (accepted) value':mode==='s2'?'Value B':'Nominal (target) value');C.text('bH',mode==='s2'?'second measurement':mode==='s1'?'the reference standard':'the specification target');
  C.text('tolL',mode==='s3'&&tolT==='a'?'Tolerance (± '+(u||'units')+')':'Tolerance (±%)');
  C.text('heroLbl',mode==='s2'?'Percent difference':mode==='s3'?'Deviation from nominal':'Percent error');
  C.text('fxNow',mode==='s2'?'% difference = |A − B| ÷ ((A + B) ÷ 2) × 100':'% error = |measured − accepted| ÷ |accepted| × 100');
  $('err').hidden=true;
  if($('a').value===''||$('b').value==='')return fail('Enter both values.');
  var d=a-b,abs=Math.abs(d),den=mode==='s2'?(a+b)/2:b,rel,pct;
  if(mode==='s3'&&tolT==='a'&&den===0){rel=NaN;pct=NaN;}
  else{if(den===0)return fail(mode==='s2'?'The two values add up to 0, so their average is 0 and percent difference is undefined.':'The accepted value is 0, so percent error is undefined. Report the absolute error instead'+(mode==='s3'?', or use an absolute tolerance.':'.'));rel=abs/Math.abs(den);pct=rel*100;}
  /* tolerance band */
  var band=NaN,ok=null;
  if(mode!=='s2'){band=(mode==='s3'&&tolT==='a')?tol:Math.abs(b)*tol/100;ok=abs<=band*(1+1e-12);}
  viz.band=isFinite(band)?band:0;viz.ok=ok;
  var showPct=isFinite(pct)?((signed&&mode!=='s2'&&d!==0?sg(d):'')+fs(pct)+'%'):'n/a';
  C.text('resultValue',mode==='s3'&&!isFinite(pct)?fs(abs)+us:showPct);
  C.text('abs',fs(abs)+us);C.text('rel',isFinite(rel)?fs(rel):'n/a');
  var t=$('tag');
  if(mode==='s2'){t.textContent='Order does not matter';t.className='sx-ef-grade';C.text('interp','The two values differ by '+fs(abs)+us+', which is '+fs(pct)+'% of their average ('+fs(den)+us+').');}
  else if(d===0){t.textContent='Exact match';t.className='sx-ef-grade';C.text('interp','The measured value equals the '+(mode==='s1'?'accepted':'nominal')+' value.');}
  else{t.textContent=(mode==='s3'?(ok?'Within tolerance':'Outside tolerance'):d<0?'Under-estimated':'Over-estimated');t.className='sx-ef-grade'+(mode==='s3'?(ok?'':' hi'):(ok===false?' mid':''));
    C.text('interp','The measured value is '+fs(abs)+us+' '+(d<0?'below':'above')+' the '+(mode==='s1'?'accepted':'nominal')+' value'+(isFinite(pct)?', '+fs(pct)+'% of it':'')+'.');}
  C.text('sd',mode==='s2'?fsg(a-b)+us:fsg(d)+us);C.text('sdN',mode==='s2'?'A − B':'measured − '+(mode==='s1'?'accepted':'nominal'));
  C.text('acc',isFinite(rel)?fs((1-rel)*100)+'%':'n/a');
  if(mode==='s2'){C.text('band','n/a');C.text('bandN','Not used for percent difference');C.text('stat','n/a');C.text('statN','Two measurements, no reference');}
  else{C.text('band',fs(b-band)+' to '+fs(b+band));C.text('bandN',(mode==='s3'&&tolT==='a'?'± '+fs(tol)+us:'± '+fs(tol)+'% of accepted = ± '+fs(band)+us));C.text('stat',ok?'Within tolerance':'Outside tolerance');C.text('statN','|Δ| = '+fs(abs)+us+' vs limit '+fs(band)+us);}
  viz(a,b,mode,mode==='s2'?Math.min(a,b):Math.min(a,b-band),mode==='s2'?Math.max(a,b):Math.max(a,b+band),u);
  C.text('vizTag',mode==='s2'?'two values':(ok?'inside the band':'outside the band'));
  /* steps */
  var f=function(x){return esc(C.math.fmt(x,8));},h='',n=0;function st(tt,dd,eq){n++;h+='<li><span class="n">'+n+'</span><h4>'+tt+'</h4>'+(dd?'<p>'+dd+'</p>':'')+'<span class="eq">'+eq+'</span></li>';}
  if(mode==='s2'){
    st('Find the difference','Subtract one value from the other and drop the sign.','|A − B| = |'+f(a)+' − '+f(b)+'| = <b>'+f(abs)+'</b>');
    st('Find the average of the two values','This is the reference size for the comparison.','(A + B) ÷ 2 = ('+f(a)+' + '+f(b)+') ÷ 2 = <b>'+f(den)+'</b>');
    st('Divide (relative difference)','','|A − B| ÷ |average| = '+f(abs)+' ÷ '+f(Math.abs(den))+' = <b>'+f(rel)+'</b>');
    st('Convert to a percentage','Multiply by 100.','% difference = '+f(rel)+' × 100 = <b>'+f(pct)+'%</b>');
  }else{
    var nm=mode==='s1'?'accepted':'nominal';
    st('Find the error','Subtract the '+nm+' value from the measured value.','Δ = measured − '+nm+' = '+f(a)+' − '+f(b)+' = <b>'+f(d)+'</b>'+esc(us)+'<br>Absolute error |Δ| = <b>'+f(abs)+'</b>');
    if(isFinite(rel))st('Divide by the '+nm+' value (relative error)','Puts the error on a scale independent of units.','|Δ| ÷ |'+nm+'| = '+f(abs)+' ÷ '+f(Math.abs(b))+' = <b>'+f(rel)+'</b>');
    if(isFinite(pct))st('Convert to percent','Multiply by 100.','% error = '+f(rel)+' × 100 = <b>'+f(pct)+'%</b>'+(d!==0?' ('+(d<0?'under':'over')+'-measured, signed: '+sg(d)+f(pct)+'%)':''));
    st(mode==='s3'?'Compare with the tolerance':'Compare with the tolerance band','Limit = '+(mode==='s3'&&tolT==='a'?'the absolute tolerance':f(tol)+'% of '+f(Math.abs(b))),'|Δ| = '+f(abs)+' '+(ok?'≤':'>')+' limit '+f(band)+' → <b>'+(ok?'within tolerance':'outside tolerance')+'</b>');
  }
  $('steps').innerHTML=h;C.text('stepsIntro',mode==='s2'?'Percent difference between two values.':mode==='s3'?'Tolerance check of a measurement against its nominal value.':'Percent error of a measurement against an accepted value.');C.text('stepsTag',mode==='s2'?'|A − B| ÷ mean':'|Δ| ÷ |accepted|');
  last=(mode==='s2'?'Percent difference':mode==='s3'?'Tolerance check':'Percent error')+' — calculatepilot.com/math/percent-error-calculator.html\n'+(mode==='s2'?'A = '+f(a)+', B = '+f(b):'Measured = '+f(a)+', '+nm2(mode)+' = '+f(b))+us+'\nAbsolute error: '+fs(abs)+us+'\n'+(isFinite(pct)?(mode==='s2'?'Percent difference: ':'Percent error: ')+showPct:'')+(ok===null?'':'\nTolerance: '+(ok?'within':'outside')+' (limit '+fs(band)+us+')');
}
function nm2(m){return m==='s1'?'accepted':'nominal';}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'peCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;C.set('a',b.getAttribute('data-a'));C.set('b',b.getAttribute('data-b'));C.set('unit',b.getAttribute('data-u'));$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
