/* Probability calculator — CalculatePilot (Stitch redesign).
   Two events: independent P(A∩B)=P(A)P(B) · mutually exclusive P(A∩B)=0 · custom joint within [max(0,a+b−1), min(a,b)].
   P(A∪B)=P(A)+P(B)−P(A∩B) · P(A|B)=P(A∩B)/P(B).  Bayes: P(A|B)=P(B|A)P(A)/(P(B|A)P(A)+P(B|¬A)P(¬A)).
   Three events: independent or mutually exclusive.  Odds: odds = p/(1−p), p = a/(a+b), 1 in N = 1/p. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='',prevFmt='s1',PIDS=['pa','pb','pj','pr','se','fp','qa','qb','qc','op'];

function pr4(x){return isFinite(x)?(Math.abs(x)<5e-5&&x!==0?x.toExponential(2):(Math.round(x*1e4)/1e4).toFixed(4)):'—';}
function pc(x){return isFinite(x)?(x*100).toFixed(x*100<0.01&&x>0?4:2)+'%':'—';}
function nf(x,dp){return isFinite(x)?C.math.fmt(x,dp===undefined?6:dp):'—';}
function esc(s){return C.esc(s);}
function pv(id){var r=v(id);return $('fmt').value==='s2'?r/100:r;}
function bad(x){return !(x>=-1e-12&&x<=1+1e-12);}
var E=function(x){return Math.min(1,Math.max(0,x));};

function ratio(x){if(!(x>0)||!isFinite(x))return null;var h1=1,h0=0,k1=0,k0=1,y=x,i,a;for(i=0;i<30;i++){a=Math.floor(y);var h2=a*h1+h0,k2=a*k1+k0;h0=h1;h1=h2;k0=k1;k1=k2;if(k1>100000)return null;if(Math.abs(h1/k1-x)<1e-9*Math.max(1,x))return [h1,k1];if(y-a<1e-12)break;y=1/(y-a);}return null;}
function oddsTxt(x){if(x===0)return '0 : 1';if(!isFinite(x))return '—';var r=ratio(x);return r?r[0]+' : '+r[1]:nf(x,4)+' : 1';}

function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b>'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function clear(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('venn').innerHTML='';last='';return false;}
function steps(list){$('steps').innerHTML=list.map(function(s,i){return '<li><span class="n">'+(i+1)+'</span><h4>'+s[0]+'</h4>'+(s[1]?'<p>'+s[1]+'</p>':'')+'<span class="eq">'+s[2]+'</span></li>';}).join('');}

function venn2(A,B,j){
  var W=600,H=250,s='<svg viewBox="0 0 '+W+' '+H+'"><rect x="2" y="2" width="'+(W-4)+'" height="'+(H-4)+'" rx="8" fill="none" stroke="var(--sx-border)" stroke-width="1.5"/><circle cx="235" cy="125" r="88" fill="var(--sx-pc)" fill-opacity=".22" stroke="var(--sx-pc)" stroke-width="2"/><circle cx="365" cy="125" r="88" fill="#d97706" fill-opacity=".22" stroke="#d97706" stroke-width="2"/>';
  function t(x,y,lab,val){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:600;font-size:11px">'+lab+'</text><text class="ax" x="'+x+'" y="'+(y+15)+'" text-anchor="middle" style="font-size:12px;fill:var(--sx-on)">'+pr4(val)+'</text>';}
  s+=t(178,118,'A only',A-j)+t(300,118,'A ∩ B',j)+t(422,118,'B only',B-j)+t(46,32,'Neither',1-A-B+j);
  s+='<text class="ax" x="235" y="38" text-anchor="middle" style="font-weight:700;font-size:13px;fill:var(--sx-primary)">A  '+pr4(A)+'</text><text class="ax" x="365" y="38" text-anchor="middle" style="font-weight:700;font-size:13px;fill:#b45309">B  '+pr4(B)+'</text>';
  $('venn').innerHTML=s+'</svg>';
}
function venn3(r){
  var W=600,H=320,s='<svg viewBox="0 0 '+W+' '+H+'"><rect x="2" y="2" width="'+(W-4)+'" height="'+(H-4)+'" rx="8" fill="none" stroke="var(--sx-border)" stroke-width="1.5"/><circle cx="245" cy="125" r="90" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-pc)" stroke-width="2"/><circle cx="355" cy="125" r="90" fill="#d97706" fill-opacity=".2" stroke="#d97706" stroke-width="2"/><circle cx="300" cy="215" r="90" fill="#2563eb" fill-opacity=".18" stroke="#2563eb" stroke-width="2"/>';
  function t(x,y,lab,val){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:600;font-size:10px">'+lab+'</text><text class="ax" x="'+x+'" y="'+(y+13)+'" text-anchor="middle" style="font-size:11px;fill:var(--sx-on)">'+pr4(val)+'</text>';}
  s+=t(205,105,'A only',r.a)+t(395,105,'B only',r.b)+t(300,285,'C only',r.c)+t(300,90,'A∩B',r.ab)+t(245,190,'A∩C',r.ac)+t(355,190,'B∩C',r.bc)+t(300,152,'A∩B∩C',r.abc)+t(50,30,'None',r.n);
  $('venn').innerHTML=s+'</svg>';
}

function mode1(){
  var a=pv('pa'),b=pv('pb'),rel=$('rel').value,j;
  if(bad(a))return clear('P(A) must be between 0 and 1 (0% to 100%).');if(bad(b))return clear('P(B) must be between 0 and 1 (0% to 100%).');
  a=E(a);b=E(b);
  C.text('relHelp',rel==='s1'?'Knowing one event happened does not change the other: P(A ∩ B) = P(A) × P(B).':rel==='s2'?'The events cannot both happen: P(A ∩ B) = 0.':'Enter P(A ∩ B) yourself; it must be consistent with P(A) and P(B).');
  $('fJoint').hidden=rel!=='s3';
  var lo=Math.max(0,a+b-1),hi=Math.min(a,b);
  if(rel==='s1')j=a*b;else if(rel==='s2'){if(a+b>1+1e-12)return clear('Mutually exclusive events cannot have P(A) + P(B) above 1 — here they add to '+nf(a+b,4)+'.');j=0;}
  else{j=pv('pj');if(bad(j))return clear('P(A ∩ B) must be between 0 and 1.');C.text('pjH','allowed range: '+nf(lo,4)+' to '+nf(hi,4));if(j<lo-1e-12||j>hi+1e-12)return clear('With P(A) = '+nf(a,4)+' and P(B) = '+nf(b,4)+', P(A ∩ B) must lie between '+nf(lo,4)+' and '+nf(hi,4)+'.');j=Math.min(hi,Math.max(lo,j));}
  var u=a+b-j,ab=b>0?j/b:NaN,ba=a>0?j/a:NaN,ind=Math.abs(j-a*b)<1e-12,ex=j===0&&a>0&&b>0;
  C.text('heroLbl','Both events occur, P(A ∩ B)');C.text('resultValue',pr4(j));C.text('interp',pc(j)+' — the probability that A and B both happen.');
  var t=$('tag');t.textContent=ex?'Mutually exclusive':ind?'Independent':(j>a*b?'Positively associated':'Negatively associated');t.className='sx-ef-grade'+(ind||ex?'':' mid');
  tiles([['Union, P(A ∪ B)',pr4(u),pc(u)+' — A or B (or both)'],['P(A | B)',pr4(ab),b>0?'A given B has occurred':'undefined when P(B) = 0'],['P(B | A)',pr4(ba),a>0?'B given A has occurred':'undefined when P(A) = 0'],['Complement, P(A′)',pr4(1-a),'A does not occur'],['Complement, P(B′)',pr4(1-b),'B does not occur'],['A only',pr4(a-j),'A but not B'],['B only',pr4(b-j),'B but not A'],['Neither',pr4(1-u),'Neither A nor B']]);
  venn2(a,b,j);C.text('vennTag','not to scale');
  steps([['Check the axioms','Every probability must lie in [0, 1].','0 ≤ P(A) = '+nf(a,4)+' ≤ 1  and  0 ≤ P(B) = '+nf(b,4)+' ≤ 1  ✓'],
    ['Intersection: both occur',rel==='s1'?'Independent events multiply.':rel==='s2'?'Mutually exclusive events cannot overlap.':'You supplied the joint probability.',rel==='s1'?'P(A ∩ B) = P(A) × P(B) = '+nf(a,6)+' × '+nf(b,6)+' = <b>'+nf(j,6)+'</b>':rel==='s2'?'P(A ∩ B) = <b>0</b>':'P(A ∩ B) = <b>'+nf(j,6)+'</b>'],
    ['Union: A or B','Add the two probabilities and subtract the overlap so it is not counted twice.','P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = '+nf(a,6)+' + '+nf(b,6)+' − '+nf(j,6)+' = <b>'+nf(u,6)+'</b>'],
    ['Conditional probability','Restrict attention to the cases where the other event happened.','P(A | B) = P(A ∩ B) ÷ P(B) = '+(b>0?nf(j,6)+' ÷ '+nf(b,6)+' = <b>'+nf(ab,6)+'</b>':'undefined (P(B) = 0)')+'<br>P(B | A) = '+(a>0?nf(j,6)+' ÷ '+nf(a,6)+' = <b>'+nf(ba,6)+'</b>':'undefined (P(A) = 0)')]]);
  last='Probability — calculatepilot.com/math/probability-calculator.html\nP(A) = '+nf(a,6)+', P(B) = '+nf(b,6)+' ('+t.textContent.toLowerCase()+')\nP(A ∩ B) = '+nf(j,6)+'\nP(A ∪ B) = '+nf(u,6)+'\nP(A | B) = '+nf(ab,6)+'\nP(B | A) = '+nf(ba,6);
  return true;
}

function mode2(){
  var p=pv('pr'),s=pv('se'),f=pv('fp'),N=Math.max(100,Math.round(v('pn')));
  if(bad(p))return clear('The prior P(A) must be between 0 and 1.');if(bad(s))return clear('P(B | A) must be between 0 and 1.');if(bad(f))return clear('P(B | not A) must be between 0 and 1.');
  p=E(p);s=E(s);f=E(f);var pb=s*p+f*(1-p);if(pb===0)return clear('P(B) works out to 0, so the posterior is undefined. Increase the true-positive or false-positive rate.');
  var post=s*p/pb,fdr=1-post,pnb=1-pb,npv=pnb>0?(1-f)*(1-p)/pnb:NaN,aNotB=pnb>0?(1-s)*p/pnb:NaN,lr=f>0?s/f:Infinity;
  C.text('heroLbl','Posterior probability, P(A | B)');C.text('resultValue',pr4(post));C.text('interp',pc(post)+' — the chance A is true after observing B, up from a prior of '+pc(p)+'.');
  var t=$('tag');t.textContent=post>p?'Evidence raises P(A)':post<p?'Evidence lowers P(A)':'Evidence is uninformative';t.className='sx-ef-grade'+(post>p?'':' mid');
  tiles([['Overall P(B)',pr4(pb),'how often the evidence appears'],['P(not A | B)',pr4(fdr),'evidence appears but A is false'],['P(not A | not B)',pr4(npv),'reassurance when B is absent'],['P(A | not B)',pr4(aNotB),'A is true although B is absent'],['Likelihood ratio (+)',isFinite(lr)?nf(lr,3):'∞','P(B | A) ÷ P(B | not A)'],['Prior odds → posterior',oddsTxt(p/(1-p))+' → '+oddsTxt(post/(1-post)),'odds form of Bayes']]);
  var wa=N*p,tp=wa*s,wo=N-wa,fpn=wo*f,pos=tp+fpn,q=function(x){return x.toLocaleString('en-US',{maximumFractionDigits:1});};
  C.text('vennTag','natural frequencies');
  $('venn').innerHTML='<div class="sx-scroll"><table class="sx-au-cmp plain" style="min-width:0"><thead><tr><th scope="col">Of '+q(N)+' people</th><th scope="col">B present</th><th scope="col">B absent</th><th scope="col">Total</th></tr></thead><tbody><tr><td>A true</td><td class="mono">'+q(tp)+'</td><td class="mono">'+q(wa-tp)+'</td><td class="mono">'+q(wa)+'</td></tr><tr><td>A false</td><td class="mono">'+q(fpn)+'</td><td class="mono">'+q(wo-fpn)+'</td><td class="mono">'+q(wo)+'</td></tr><tr class="tot"><td>Total</td><td class="mono">'+q(pos)+'</td><td class="mono">'+q(N-pos)+'</td><td class="mono">'+q(N)+'</td></tr></tbody></table></div><p class="sx-au-help" style="margin-top:8px">Of the '+q(pos)+' cases where B is present, '+q(tp)+' have A true: '+q(tp)+' ÷ '+q(pos)+' = '+pc(post)+'.</p>';
  steps([['State the inputs','Prior, likelihood and false-alarm rate.','P(A) = '+nf(p,6)+',  P(B | A) = '+nf(s,6)+',  P(B | not A) = '+nf(f,6)],
    ['Total probability of the evidence','Add the two ways B can occur (law of total probability).','P(B) = P(B | A)·P(A) + P(B | not A)·P(not A)<br>= '+nf(s,6)+' × '+nf(p,6)+' + '+nf(f,6)+' × '+nf(1-p,6)+' = <b>'+nf(pb,8)+'</b>'],
    ['Apply Bayes’ theorem','Reverse the conditional probability.','P(A | B) = P(B | A)·P(A) ÷ P(B) = '+nf(s*p,8)+' ÷ '+nf(pb,8)+' = <b>'+nf(post,6)+'</b>']]);
  last='Bayes’ theorem — calculatepilot.com/math/probability-calculator.html\nPrior P(A) = '+nf(p,6)+', P(B|A) = '+nf(s,6)+', P(B|not A) = '+nf(f,6)+'\nP(B) = '+nf(pb,8)+'\nP(A|B) = '+nf(post,6)+' ('+pc(post)+')';
  return true;
}

function mode3(){
  var a=pv('qa'),b=pv('qb'),c=pv('qc'),rel=$('rel3').value;
  if(bad(a)||bad(b)||bad(c))return clear('Each probability must be between 0 and 1 (0% to 100%).');
  a=E(a);b=E(b);c=E(c);var r,none,one,two,all,any;
  if(rel==='s2'){if(a+b+c>1+1e-12)return clear('Mutually exclusive events cannot have probabilities that add above 1 — here they add to '+nf(a+b+c,4)+'.');
    r={a:a,b:b,c:c,ab:0,ac:0,bc:0,abc:0,n:1-a-b-c};}
  else r={a:a*(1-b)*(1-c),b:b*(1-a)*(1-c),c:c*(1-a)*(1-b),ab:a*b*(1-c),ac:a*c*(1-b),bc:b*c*(1-a),abc:a*b*c,n:(1-a)*(1-b)*(1-c)};
  none=r.n;one=r.a+r.b+r.c;two=r.ab+r.ac+r.bc;all=r.abc;any=1-none;
  C.text('heroLbl','At least one occurs, P(A ∪ B ∪ C)');C.text('resultValue',pr4(any));C.text('interp',pc(any)+' — the probability that one or more of the three events happens.');
  var t=$('tag');t.textContent=rel==='s2'?'Mutually exclusive':'Independent';t.className='sx-ef-grade';
  tiles([['None occur',pr4(none),'(1−A)(1−B)(1−C) for independent events'],['Exactly one',pr4(one),'one event, and only one'],['Exactly two',pr4(two),'two events, not the third'],['All three',pr4(all),rel==='s2'?'impossible when mutually exclusive':'P(A) × P(B) × P(C)'],['At least two',pr4(two+all),'two or three events'],['Total check',pr4(none+one+two+all),'must equal 1']]);
  venn3(r);C.text('vennTag','not to scale');
  steps(rel==='s2'?[['Check the axioms','Each probability lies in [0, 1] and, being mutually exclusive, they must add to at most 1.','P(A) + P(B) + P(C) = '+nf(a+b+c,6)+' ≤ 1  ✓'],['At least one occurs','Mutually exclusive events simply add.','P(A ∪ B ∪ C) = P(A) + P(B) + P(C) = <b>'+nf(any,6)+'</b>'],['None occur','The complement of “at least one”.','1 − '+nf(any,6)+' = <b>'+nf(none,6)+'</b>']]:
    [['Check the axioms','Each probability lies in [0, 1].','P(A) = '+nf(a,4)+', P(B) = '+nf(b,4)+', P(C) = '+nf(c,4)+'  ✓'],
     ['None occur','Multiply the complements (independence).','(1 − '+nf(a,6)+')(1 − '+nf(b,6)+')(1 − '+nf(c,6)+') = <b>'+nf(none,6)+'</b>'],
     ['At least one occurs','Use the complement rule.','P(A ∪ B ∪ C) = 1 − '+nf(none,6)+' = <b>'+nf(any,6)+'</b>'],
     ['Exactly one and exactly two','Sum the matching regions of the Venn diagram.','exactly one = '+nf(r.a,5)+' + '+nf(r.b,5)+' + '+nf(r.c,5)+' = <b>'+nf(one,6)+'</b><br>exactly two = '+nf(r.ab,5)+' + '+nf(r.ac,5)+' + '+nf(r.bc,5)+' = <b>'+nf(two,6)+'</b><br>all three = '+nf(a,4)+' × '+nf(b,4)+' × '+nf(c,4)+' = <b>'+nf(all,6)+'</b>']]);
  last='Three events ('+t.textContent.toLowerCase()+') — calculatepilot.com/math/probability-calculator.html\nP(A) = '+nf(a,6)+', P(B) = '+nf(b,6)+', P(C) = '+nf(c,6)+'\nAt least one: '+nf(any,6)+'\nNone: '+nf(none,6)+'\nExactly one: '+nf(one,6)+'\nExactly two: '+nf(two,6)+'\nAll three: '+nf(all,6);
  return true;
}

function mode4(){
  var k=$('ok').value,p,T=Math.max(1,Math.round(v('ot')));
  $('o1').hidden=k!=='p';$('o2').hidden=k!=='o';$('o3').hidden=k!=='n';
  if(k==='p'){p=pv('op');if(bad(p))return clear('The probability must be between 0 and 1 (0% to 100%).');p=E(p);}
  else if(k==='o'){var oa=v('oa'),ob=v('ob');if(!(oa>=0&&ob>=0&&oa+ob>0))return clear('Enter non-negative odds a and b that are not both 0.');p=oa/(oa+ob);}
  else{var n=v('on');if(!(n>=1))return clear('N must be at least 1.');p=1/n;}
  var of=p<1?p/(1-p):Infinity,oa2=p>0?(1-p)/p:Infinity,one=p>0?1/p:Infinity,any=1-Math.pow(1-p,T);
  C.text('heroLbl','Probability');C.text('resultValue',pr4(p));C.text('interp',pc(p)+' — equivalent to odds of '+oddsTxt(of)+' in favour.');
  var t=$('tag');t.textContent=p===0?'Impossible':p===1?'Certain':p<0.05?'Unlikely':p>0.95?'Very likely':'Possible';t.className='sx-ef-grade';
  tiles([['Percent',pc(p),'p × 100'],['Odds in favour',oddsTxt(of),'p ÷ (1 − p)'],['Odds against',oddsTxt(oa2),'(1 − p) ÷ p'],['1 in N',isFinite(one)?'1 in '+nf(one,4):'never','1 ÷ p'],['Expected in '+T+' trial'+(T===1?'':'s'),nf(p*T,4),'p × trials'],['At least once in '+T,pr4(any),'1 − (1 − p)^'+T]]);
  $('venn').innerHTML='';
  steps([['Get the probability',k==='p'?'You entered it directly.':k==='o'?'From odds a : b, p = a ÷ (a + b).':'From “1 in N”, p = 1 ÷ N.','p = <b>'+nf(p,8)+'</b> = '+pc(p)],
    ['Convert to odds','Odds compare the chance it happens with the chance it does not.','in favour = p ÷ (1 − p) = '+nf(of,6)+'  →  <b>'+oddsTxt(of)+'</b><br>against = (1 − p) ÷ p = '+nf(oa2,6)+'  →  <b>'+oddsTxt(oa2)+'</b>'],
    ['Repeat over '+T+' independent trial'+(T===1?'':'s'),'Expected count is p × T; “at least once” uses the complement rule.','expected = '+nf(p,6)+' × '+T+' = <b>'+nf(p*T,4)+'</b><br>P(at least once) = 1 − (1 − '+nf(p,6)+')^'+T+' = <b>'+nf(any,6)+'</b>']]);
  last='Odds & probability — calculatepilot.com/math/probability-calculator.html\np = '+nf(p,8)+' ('+pc(p)+')\nOdds in favour: '+oddsTxt(of)+'\nOdds against: '+oddsTxt(oa2)+'\n1 in '+nf(one,4)+'\nAt least once in '+T+' trials: '+nf(any,6);
  return true;
}

function compute(){
  var m=$('mode').value,f=$('fmt').value;
  if(f!==prevFmt){var k=f==='s2'?100:0.01;PIDS.forEach(function(id){var x=parseFloat($(id).value);if(isFinite(x))$(id).value=+(x*k).toPrecision(12);});prevFmt=f;}
  ['p1','p2','p3','p4'].forEach(function(id,i){$(id).hidden=('s'+(i+1))!==m;});$('vennCard').hidden=m==='s4';$('fFmt').hidden=false;
  $('err').hidden=true;
  var ok=(m==='s1'?mode1:m==='s2'?mode2:m==='s3'?mode3:mode4)();
  if(ok)$('err').hidden=true;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'prCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  document.querySelector('#prCalc [data-action=reset]').addEventListener('click',function(){prevFmt='s1';});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
