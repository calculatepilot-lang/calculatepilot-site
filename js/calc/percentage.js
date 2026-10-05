/* Percentage calculator — CalculatePilot (Stitch redesign).
   s1: Y = P/100 × X · s2: % = X/Y × 100 · s3: change % = (new − old)/|old| × 100 · s4: original = final ÷ (1 ± r/100). */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='';

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function frac(x){/* reduce x/100-style decimals to a fraction, up to 6 decimal places */
  if(!isFinite(x))return '—';var s=1,k=0;while(k<6&&Math.abs(x*s-Math.round(x*s))>1e-9*Math.max(1,Math.abs(x*s))){s*=10;k++;}
  var n=Math.round(x*s),d=s,g=gcd(n,d)||1;n/=g;d/=g;return d===1?String(n):n+' / '+d;}
function fx(x,dp){return isFinite(x)?M.fix(x,dp):'—';}
function sgn(x){return x>0?'+':x<0?'−':'';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:18px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function bar(parts,title,note,labels){$('barT').textContent=title;C.text('barN',note);$('bar').innerHTML=parts.map(function(p){return '<span style="width:'+Math.max(0,Math.min(100,p[0])).toFixed(2)+'%;background:'+p[1]+'"></span>';}).join('');$('barL').innerHTML=labels.map(function(l){return '<span>'+esc(l)+'</span>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('bar').innerHTML='';$('barL').innerHTML='';last='';}

function compute(){
  var m=$('mode').value,a=v('a'),b=v('b'),dp=+$('dp').value,dirDec=$('dir').value==='s2';
  $('fDir').hidden=m!=='s4';$('presets').hidden=m!=='s1';
  var L={s1:['Percentage rate (P)','percent','Base value (X)','any number','What is P% of X?','Y = (P ÷ 100) × X'],s2:['Part (X)','the amount','Whole (Y)','the total, not 0','X is what percent of Y?','% = (X ÷ Y) × 100'],s3:['Old value','starting value, not 0','New value','ending value','Percentage change from old to new','% change = (new − old) ÷ |old| × 100'],s4:['Final value','after the change','Percentage change applied','percent','Find the original value','original = final ÷ (1 ± rate ÷ 100)']}[m];
  C.text('aL',L[0]);C.text('aH',L[1]);C.text('bL',L[2]);C.text('bH',L[3]);C.text('formH',L[4]);C.text('fxNow',L[5]);
  $('err').hidden=true;var h='',n=0;function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,8));},res,tg='',sum='';
  if($('a').value===''||$('b').value==='')return fail('Enter both values.');
  var t=$('tag');t.className='sx-ef-grade';
  if(m==='s1'){
    var r=a/100;res=r*b;
    C.text('heroLbl',M.fmt(a,6)+'% of '+M.fmt(b,6));C.text('resultValue',fx(res,dp));C.text('interp',M.fmt(a,6)+'% of '+M.fmt(b,6)+' is '+fx(res,dp)+'.');t.textContent='Exact';
    tiles([['Decimal multiplier',M.fmt(r,8),'P ÷ 100'],['Fraction',frac(r),'in lowest terms'],['Base − P%',fx(b-res,dp),'what remains'],['Base + P%',fx(b+res,dp),'base plus the portion']]);
    var pc=Math.max(0,Math.min(100,a));bar([[pc,'var(--sx-pc)']],'Part-to-whole','base = 100%',['0%',M.fmt(a,4)+'% = '+fx(res,dp),'100% = '+M.fmt(b,6)]);$('barCard').hidden=false;
    st('Convert the percentage to a decimal','Divide by 100.','r = '+f(a)+' ÷ 100 = <b>'+f(r)+'</b>');
    st('Multiply by the base','Scale the base by that fraction.','Y = '+f(r)+' × '+f(b)+' = <b>'+f(res)+'</b>');
    st('Check','Divide back to recover the percentage.',f(res)+' ÷ '+f(b)+' × 100 = '+(b!==0?f(res/b*100)+'%':'n/a'));
    sum=M.fmt(a,6)+'% of '+M.fmt(b,6)+' = '+fx(res,dp);
  }else if(m==='s2'){
    if(b===0)return fail('The whole (Y) cannot be 0 — a percentage of zero is undefined.');
    res=a/b*100;C.text('heroLbl',M.fmt(a,6)+' as a percent of '+M.fmt(b,6));C.text('resultValue',fx(res,dp)+'%');C.text('interp',M.fmt(a,6)+' is '+fx(res,dp)+'% of '+M.fmt(b,6)+'.');t.textContent=res>100?'More than the whole':'Part of the whole';
    tiles([['Decimal ratio',M.fmt(a/b,8),'X ÷ Y'],['Fraction',(Number.isInteger(a)&&Number.isInteger(b))?frac(a/b):frac(a/b),'in lowest terms'],['Remaining %',fx(100-res,dp)+'%','100% − result'],['Y as a percent of X',a!==0?fx(b/a*100,dp)+'%':'n/a','the reverse question']]);
    bar([[Math.min(100,res),'var(--sx-pc)']],'Part-to-whole','whole = 100%',['0%',fx(res,2)+'%'+(res>100?' (exceeds the whole)':''),'100% = '+M.fmt(b,6)]);$('barCard').hidden=false;
    st('Divide the part by the whole','Gives the part as a fraction of the whole.','X ÷ Y = '+f(a)+' ÷ '+f(b)+' = <b>'+f(a/b)+'</b>');
    st('Multiply by 100','Converts the fraction to a percentage.','% = '+f(a/b)+' × 100 = <b>'+f(res)+'%</b>');
    sum=M.fmt(a,6)+' is '+fx(res,dp)+'% of '+M.fmt(b,6);
  }else if(m==='s3'){
    if(a===0)return fail('The old value cannot be 0 — percentage change from zero is undefined. Report the absolute change instead.');
    var d=b-a;res=d/Math.abs(a)*100;C.text('heroLbl','Change from '+M.fmt(a,6)+' to '+M.fmt(b,6));C.text('resultValue',sgn(res)+fx(Math.abs(res),dp)+'%');
    C.text('interp','The value '+(d>0?'increased':d<0?'decreased':'did not change')+' by '+fx(Math.abs(d),dp)+', which is '+fx(Math.abs(res),dp)+'% of the old value.');
    t.textContent=d>0?'Increase':d<0?'Decrease':'No change';t.className='sx-ef-grade'+(d<0?' mid':'');
    var back=b!==0?(a-b)/Math.abs(b)*100:NaN;
    tiles([['Absolute change',sgn(d)+fx(Math.abs(d),dp),'new − old'],['Multiplier',M.fmt(b/a,8),'new ÷ old'],['To reverse the change',isFinite(back)?sgn(back)+fx(Math.abs(back),dp)+'%':'n/a','percent needed to return to the old value'],['As a fraction',frac(d/Math.abs(a)),'change ÷ old']]);
    var mx=Math.max(Math.abs(a),Math.abs(b))||1;bar([[Math.abs(b)/mx*100,d>=0?'var(--sx-pc)':'#d97706']],'New value relative to the larger of the two','old = '+M.fmt(a,6)+' · new = '+M.fmt(b,6),['0',M.fmt(b,6)+' (new)',M.fmt(mx,6)]);$('barCard').hidden=false;
    st('Find the change','Subtract the old value from the new value.','Δ = new − old = '+f(b)+' − '+f(a)+' = <b>'+f(d)+'</b>');
    st('Divide by the old value','The old value is the base for percentage change.','Δ ÷ |old| = '+f(d)+' ÷ '+f(Math.abs(a))+' = <b>'+f(d/Math.abs(a))+'</b>');
    st('Multiply by 100','','% change = <b>'+sgn(res)+f(Math.abs(res))+'%</b>');
    if(isFinite(back)&&d!==0)st('Undoing the change','The base is now the new value, so the reverse percentage differs.','('+f(a)+' − '+f(b)+') ÷ |'+f(b)+'| × 100 = <b>'+sgn(back)+f(Math.abs(back))+'%</b>');
    sum='Change from '+M.fmt(a,6)+' to '+M.fmt(b,6)+' = '+sgn(res)+fx(Math.abs(res),dp)+'%';
  }else{
    var rate=b/100,fac=dirDec?1-rate:1+rate;if(fac===0)return fail('A '+M.fmt(b,4)+'% decrease leaves nothing, so the original value cannot be recovered.');
    res=a/fac;C.text('heroLbl','Original value before the '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase'));C.text('resultValue',fx(res,dp));
    C.text('interp','A value of '+M.fmt(a,6)+' after a '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase')+' started at '+fx(res,dp)+'.');t.textContent=dirDec?'After a decrease':'After an increase';
    tiles([['Growth factor',M.fmt(fac,8),dirDec?'1 − rate':'1 + rate'],['Amount of the change',sgn(a-res)+fx(Math.abs(a-res),dp),'final − original'],['Check',fx(res*fac,dp),'original × factor = final'],['Wrong shortcut',fx(a*(dirDec?1+rate:1-rate),dp),'undoing % on the final value is not correct']]);
    $('barCard').hidden=true;$('bar').innerHTML='';$('barL').innerHTML='';
    st('Write the forward relationship','A '+(dirDec?'decrease':'increase')+' multiplies the original by a growth factor.','final = original × (1 '+(dirDec?'−':'+')+' '+f(rate)+') = original × '+f(fac));
    st('Solve for the original','Divide the final value by the factor.','original = '+f(a)+' ÷ '+f(fac)+' = <b>'+f(res)+'</b>');
    st('Check','Apply the change to the original.',f(res)+' × '+f(fac)+' = '+f(res*fac));
    sum='Original = '+fx(res,dp)+' (final '+M.fmt(a,6)+' after '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase')+')';
  }
  if(m!=='s4'&&m!=='s3'&&m!=='s2'&&m!=='s1')$('barCard').hidden=true;
  $('steps').innerHTML=h;C.text('stepsIntro',L[4]);C.text('stepsTag',L[5]);last=sum;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pgCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('a',b.getAttribute('data-v'));$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('swap').addEventListener('click',function(){var x=$('a').value;C.set('a',$('b').value);C.set('b',x);$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy equation');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
