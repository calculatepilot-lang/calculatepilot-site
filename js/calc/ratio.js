/* Ratio calculator — CalculatePilot (Stitch redesign).
   Simplify: divide by the GCD (Euclid) after scaling decimals to whole numbers. Proportion: A:B = C:D → D = B·C/A, C = A·D/B.
   Scale: multiply by k. Multi-part: simplify by the GCD of all parts; share of total T for part i = T·pᵢ/Σp. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='',defParts='1, 2, 3';

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function euclid(a,b){var lines=[],x=Math.max(a,b),y=Math.min(a,b),n=0;while(y&&n<14){var q=Math.floor(x/y),r=x%y;lines.push(x+' = '+q+' × '+y+' + '+r);x=y;y=r;n++;}return {g:x,lines:lines};}
function ints(list){for(var k=0;k<=6;k++){var s=Math.pow(10,k),ok=list.every(function(x){var y=x*s;return Math.abs(y-Math.round(y))<=1e-9*Math.max(1,Math.abs(y));});if(ok){var a=list.map(function(x){return Math.round(x*s);});if(a.some(function(x){return x>9e15;}))return null;return {a:a,s:s,k:k};}}return null;}
function reduce(list){var I=ints(list);if(!I)return null;var g=I.a.reduce(function(p,c){return gcd(p,c);});return {ints:I.a,g:g,scale:I.s,red:I.a.map(function(x){return x/g;})};}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function J(a){return a.join(' : ');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';last='';}

function rects(items){
  var W=760,H=170,n=items.length,cw=(W-20)/n,pad=24,s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  items.forEach(function(it,i){var mw=cw-pad*2,mh=H-52,sc=Math.min(mw/it[0],mh/it[1]),w=it[0]*sc,h=it[1]*sc,x=10+i*cw+(cw-w)/2,y=14+(mh-h)/2;
    s+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="4" fill="'+(i?'#d97706':'var(--sx-pc)')+'" fill-opacity=".2" stroke="'+(i?'#d97706':'var(--sx-pc)')+'" stroke-width="2"/><line x1="'+x.toFixed(1)+'" y1="'+(y+h).toFixed(1)+'" x2="'+(x+w).toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+(i?'#d97706':'var(--sx-pc)')+'" stroke-dasharray="4 3" opacity=".6"/><text class="ax" x="'+(x+w/2).toFixed(1)+'" y="'+(H-24)+'" text-anchor="middle" style="font-weight:600;font-size:12px;fill:var(--sx-on)">'+esc(it[2])+'</text><text class="ax" x="'+(x+w/2).toFixed(1)+'" y="'+(H-9)+'" text-anchor="middle">'+esc(it[3]||'')+'</text>';});
  $('viz').innerHTML=s+'</svg>';
}
function stack(parts,labels){
  var W=760,H=120,tot=parts.reduce(function(p,c){return p+c;},0),x=10,cols=['var(--sx-pc)','#d97706','#2563eb','#dc2626','#7c3aed','#0d9488','#db2777','#65a30d'],s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  parts.forEach(function(p,i){var w=(W-20)*p/tot;s+='<rect x="'+x.toFixed(1)+'" y="20" width="'+Math.max(1,w-2).toFixed(1)+'" height="48" rx="6" fill="'+cols[i%8]+'" fill-opacity=".25" stroke="'+cols[i%8]+'" stroke-width="2"/><text class="ax" x="'+(x+w/2-1).toFixed(1)+'" y="48" text-anchor="middle" style="font-weight:700;font-size:13px;fill:var(--sx-on)">'+esc(labels[i])+'</text><text class="ax" x="'+(x+w/2-1).toFixed(1)+'" y="90" text-anchor="middle">'+(p/tot*100).toFixed(1)+'%</text>';x+=w;});
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,a=v('ra'),b=v('rb'),h='',n=0;
  ['f2'].forEach(function(id){$(id).hidden=m==='s4';});$('fProp').hidden=m!=='s2';$('fScale').hidden=m!=='s3';$('fParts').hidden=m!=='s4';$('pre2').hidden=m==='s4';$('pre4').hidden=m!=='s4';
  C.text('formH',{s1:'Simplify a ratio',s2:'Solve a proportion',s3:'Scale a ratio',s4:'Multi-part ratio'}[m]);
  C.text('raL',m==='s2'?'A':'Antecedent (A)');C.text('rbL',m==='s2'?'B':'Consequent (B)');
  $('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));},t=$('tag');t.className='sx-ef-grade';
  function eu(R,label){var e=euclid(R.ints[0],R.ints[1]);return e;}
  if(m==='s1'){
    if(!(a>0&&b>0))return fail('Both parts must be greater than 0.');
    var R=reduce([a,b]);if(!R)return fail('Use numbers with at most 6 decimal places.');
    var e=euclid(R.ints[0],R.ints[1]),rr=R.red;
    C.text('fxNow',M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+J(rr));C.text('heroLbl','Simplified ratio (lowest terms)');C.text('resultValue',J(rr));C.text('interp',M.fmt(a,6)+' : '+M.fmt(b,6)+' simplifies to '+J(rr)+'.');t.textContent=R.g===1&&R.scale===1?'Already simplest':'Simplified';
    tiles([['Decimal value (A ÷ B)',M.fmt(a/b,8),'A per 1 of B'],['Inverse ratio (B : A)',J(rr.slice().reverse()),'swap the parts'],['Greatest common divisor',String(R.g)+(R.scale>1?' (after ×'+R.scale+')':''),'largest common factor'],['A as a share of the whole',(a/(a+b)*100).toFixed(2)+'%','A ÷ (A + B)']]);
    rects([[rr[0],rr[1],J(rr),'simplified'],[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'as entered']]);C.text('vizT','Ratio shape');C.text('vizN','both rectangles have the same shape');
    if(R.scale>1)st('Scale decimals to whole numbers','Multiply both parts by '+R.scale+'.',f(a)+' : '+f(b)+' → <b>'+R.ints[0]+' : '+R.ints[1]+'</b>');
    st('Find the greatest common divisor','Euclid’s algorithm: divide, keep the remainder, repeat until it is 0.',e.lines.map(esc).join('<br>')+'<br>GCD = <b>'+e.g+'</b>');
    st('Divide both parts by the GCD','Gives the ratio in lowest terms.',R.ints[0]+' ÷ '+R.g+' : '+R.ints[1]+' ÷ '+R.g+' = <b>'+J(rr)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+J(rr);C.text('stepsTag','GCD '+R.g);C.text('stepsIntro','Simplifying '+M.fmt(a,6)+' : '+M.fmt(b,6)+' with Euclid’s algorithm.');
  }else if(m==='s2'){
    var unkC=$('unk').value==='s1',c=v('rc'),d=v('rd');$('fC').hidden=unkC;$('fD').hidden=!unkC;
    if(!(a>0&&b>0))return fail('A and B must be greater than 0.');
    var known=unkC?d:c;if(!(known>0))return fail('Enter the known value as a number greater than 0.');
    var x=unkC?a*d/b:b*c/a,C2=unkC?x:c,D2=unkC?d:x,k=C2/a;
    C.text('fxNow',M.fmt(a,4)+' : '+M.fmt(b,4)+' = '+(unkC?'X':M.fmt(c,4))+' : '+(unkC?M.fmt(d,4):'X'));C.text('heroLbl','Missing value X ('+(unkC?'C':'D')+')');C.text('resultValue',M.fmt(x,dp));
    C.text('interp','Equivalent proportion: '+M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+M.fmt(C2,6)+' : '+M.fmt(D2,6)+'.');t.textContent='Proportion solved';
    var R2=reduce([a,b]);
    tiles([['Scale factor',M.fmt(k,8),'C ÷ A = D ÷ B'],['Simplified ratio',R2?J(R2.red):'—','lowest terms of A : B'],['Cross-product check',M.fmt(a*D2,8)+' = '+M.fmt(b*C2,8),'A × D = B × C'],['Decimal value (A ÷ B)',M.fmt(a/b,8),'the ratio as one number']]);
    rects([[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'given ratio'],[C2,D2,M.fmt(C2,4)+' : '+M.fmt(D2,4),'equivalent ratio']]);C.text('vizT','The two ratios have the same shape');C.text('vizN','equivalent');
    st('Write the proportion','Two ratios are equal.',f(a)+' : '+f(b)+' = '+(unkC?'X':f(c))+' : '+(unkC?f(d):'X'));
    st('Cross-multiply','The product of the extremes equals the product of the means.',unkC?f(a)+' × '+f(d)+' = '+f(b)+' × X':f(a)+' × X = '+f(b)+' × '+f(c));
    st('Isolate X','Divide both sides by the coefficient of X.',unkC?'X = ('+f(a)+' × '+f(d)+') ÷ '+f(b)+' = <b>'+f(x)+'</b>':'X = ('+f(b)+' × '+f(c)+') ÷ '+f(a)+' = <b>'+f(x)+'</b>');
    st('Check','The scale factor is the same on both sides.',f(C2)+' ÷ '+f(a)+' = '+f(D2)+' ÷ '+f(b)+' = <b>'+f(k)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+M.fmt(C2,6)+' : '+M.fmt(D2,6);C.text('stepsTag','cross-multiplication');C.text('stepsIntro','Solving the missing term of a proportion.');
  }else if(m==='s3'){
    var tg=$('tgt').value,tv=v('tv');if(!(a>0&&b>0))return fail('A and B must be greater than 0.');if(!(tv>0))return fail('The target value must be greater than 0.');
    C.text('tvL',tg==='k'?'Scale factor':tg==='t'?'Target total (A′ + B′)':'Target value for '+(tg==='a'?'A′':'B′'));
    var kk=tg==='a'?tv/a:tg==='b'?tv/b:tg==='t'?tv/(a+b):tv,A2=a*kk,B2=b*kk;
    C.text('fxNow',M.fmt(a,4)+' : '+M.fmt(b,4)+'  ×  '+M.fmt(kk,6)+'  =  '+M.fmt(A2,6)+' : '+M.fmt(B2,6));C.text('heroLbl','Scaled ratio');C.text('resultValue',M.fmt(A2,dp)+' : '+M.fmt(B2,dp));C.text('interp','Multiply both parts of '+M.fmt(a,6)+' : '+M.fmt(b,6)+' by '+M.fmt(kk,6)+'.');t.textContent=kk>1?'Scaled up':kk<1?'Scaled down':'Unchanged';
    tiles([['Scale factor (k)',M.fmt(kk,8),'multiplier'],['New A′',M.fmt(A2,dp),'A × k'],['New B′',M.fmt(B2,dp),'B × k'],['New total',M.fmt(A2+B2,dp),'A′ + B′']]);
    rects([[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'original'],[A2,B2,M.fmt(A2,4)+' : '+M.fmt(B2,4),'scaled']]);C.text('vizT','Original and scaled ratio');C.text('vizN','same shape');
    st('Find the scale factor','Compare the target with the part it refers to.',tg==='a'?'k = target ÷ A = '+f(tv)+' ÷ '+f(a)+' = <b>'+f(kk)+'</b>':tg==='b'?'k = target ÷ B = '+f(tv)+' ÷ '+f(b)+' = <b>'+f(kk)+'</b>':tg==='t'?'k = target total ÷ (A + B) = '+f(tv)+' ÷ '+f(a+b)+' = <b>'+f(kk)+'</b>':'k = <b>'+f(kk)+'</b> (given)');
    st('Multiply both parts by k','Scaling keeps the ratio unchanged.','A′ = '+f(a)+' × '+f(kk)+' = <b>'+f(A2)+'</b><br>B′ = '+f(b)+' × '+f(kk)+' = <b>'+f(B2)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' × '+M.fmt(kk,6)+' = '+M.fmt(A2,6)+' : '+M.fmt(B2,6);C.text('stepsTag','scale factor '+M.fmt(kk,4));C.text('stepsIntro','Scaling a ratio to a target.');
  }else{
    var raw=String($('parts').value).split(/[\s,:;]+/).filter(Boolean).map(Number);C.text('partsN',raw.length+' parts');
    if(raw.length<2||raw.length>8||raw.some(function(x){return !(x>0)||!isFinite(x);}))return fail('Enter 2 to 8 numbers greater than 0, separated by commas or colons.');
    var R3=reduce(raw);if(!R3)return fail('Use numbers with at most 6 decimal places.');
    var sum=raw.reduce(function(p,c){return p+c;},0),T=v('tot'),hasT=$('tot').value!==''&&T>0,rr3=R3.red,sp=rr3.reduce(function(p,c){return p+c;},0);
    C.text('fxNow',raw.map(function(x){return M.fmt(x,6);}).join(' : ')+' = '+J(rr3));C.text('heroLbl','Simplified ratio');C.text('resultValue',J(rr3));C.text('interp',raw.length+'-part ratio in lowest terms; the parts make up '+sp+' equal shares.');t.textContent=R3.g===1&&R3.scale===1?'Already simplest':'Simplified';
    var pcs=raw.map(function(x){return (x/sum*100).toFixed(2)+'%';}).join(' · ');
    tiles([['Total parts (simplified)',String(sp),'sum of the reduced parts'],['Share of the whole',pcs,'each part ÷ total'],['Greatest common divisor',String(R3.g)+(R3.scale>1?' (after ×'+R3.scale+')':''),'largest common factor'],hasT?['Total to divide '+M.fmt(T,6),raw.map(function(x){return M.fmt(T*x/sum,dp);}).join(' · '),'each part × total ÷ '+M.fmt(sum,6)]:['Split a total','enter one above','optional field']]);
    stack(raw,rr3.map(String));C.text('vizT','Share of the whole');C.text('vizN',raw.length+' parts');
    var g=R3.ints[0],lines=[];R3.ints.slice(1).forEach(function(x){var ng=gcd(g,x);lines.push('gcd('+g+', '+x+') = '+ng);g=ng;});
    if(R3.scale>1)st('Scale decimals to whole numbers','Multiply every part by '+R3.scale+'.',raw.map(function(x){return f(x);}).join(' : ')+' → <b>'+R3.ints.join(' : ')+'</b>');
    st('Find the GCD of all parts','Apply Euclid’s algorithm pair by pair.',lines.map(esc).join('<br>')+'<br>GCD = <b>'+R3.g+'</b>');
    st('Divide every part by the GCD','',R3.ints.join(' : ')+' ÷ '+R3.g+' = <b>'+J(rr3)+'</b>');
    if(hasT)st('Divide the total','Value of one simplified part = total ÷ sum of parts.','one part = '+f(T)+' ÷ '+f(sp)+' = <b>'+f(T/sp)+'</b><br>'+rr3.map(function(x){return x+' × '+f(T/sp)+' = <b>'+f(x*T/sp)+'</b>';}).join('<br>'));
    last=raw.map(function(x){return M.fmt(x,6);}).join(' : ')+' = '+J(rr3)+(hasT?'; shares of '+M.fmt(T,6)+': '+raw.map(function(x){return M.fmt(T*x/sum,dp);}).join(', '):'');C.text('stepsTag','GCD '+R3.g);C.text('stepsIntro','Simplifying and splitting a multi-part ratio.');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('ra').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'rtCalc',compute:compute});
  $('pre2').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;C.set('ra',b.getAttribute('data-a'));C.set('rb',b.getAttribute('data-b'));fire();});
  $('pre4').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;$('parts').value=b.getAttribute('data-p');C.set('tot',b.getAttribute('data-t'));fire();});
  $('swap').addEventListener('click',function(){if($('mode').value==='s4'){$('parts').value=String($('parts').value).split(/[\s,:;]+/).filter(Boolean).reverse().join(', ');}else{var x=$('ra').value;C.set('ra',$('rb').value);C.set('rb',x);}fire();});
  document.querySelector('#rtCalc [data-action=reset]').addEventListener('click',function(){$('parts').value=defParts;fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy equation');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
