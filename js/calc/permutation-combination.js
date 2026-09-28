/* Permutation & combination calculator — CalculatePilot (Stitch redesign).
   All arithmetic is exact (BigInt): C(n,r)=n!/(r!(n−r)!), P(n,r)=n!/(n−r)!, C(n+r−1,r), n^r. n, r ≤ 1000. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='';
var HELP={c:'Unordered selections of r distinct items from n. Each item is used at most once.',p:'Ordered arrangements of r distinct items from n. Each item is used at most once.',cr:'Unordered selections of r items from n types, where the same type may be chosen repeatedly (multisets).',pr:'Ordered sequences of length r where each position can be any of the n symbols.'};

function fact(n){var c=1n,i;for(i=2n;i<=BigInt(n);i++)c*=i;return c;}
function perm(n,r){var c=1n,i;for(i=0;i<r;i++)c*=BigInt(n-i);return c;}
function comb(n,r){if(r<0||r>n)return 0n;var k=Math.min(r,n-r),c=1n,i;for(i=1;i<=k;i++)c=c*BigInt(n-k+i)/BigInt(i);return c;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function big(b){var s=b.toString();if(s.length<=18)return grp(s);return s[0]+'.'+s.slice(1,7)+' × 10^'+(s.length-1);}
function esc(s){return C.esc(s);}
function prodTxt(n,r){var a=[],i,m=Math.min(r,8);for(i=0;i<m;i++)a.push(n-i);var t=a.join(' × ');if(r>8)t+=' × … × '+(n-r+1);return t;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','one','digits','fn','fr','fnr'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('steps').innerHTML='';$('allTbl').tBodies[0].innerHTML='';last='';}

function compute(){
  var mode=$('mode').value,nr=v('n'),rr=v('r'),n=Math.round(nr),r=Math.round(rr),rep=mode==='cr'||mode==='pr';
  C.text('modeHelp',HELP[mode]);C.text('rH',rep?'0 to 1,000 (may exceed n)':'0 to n');$('err').hidden=true;
  if(nr!==n||rr!==r||n<0||r<0)return fail('n and r must be whole numbers, zero or greater.');
  if(n>1000||r>1000)return fail('This calculator works with n and r up to 1,000.');
  if(!rep&&r>n)return fail('For '+(mode==='c'?'combinations':'permutations')+' without repetition, r cannot be larger than n ('+r+' > '+n+'). Choose “with repetition” or reduce r.');
  if(mode==='cr'&&n===0&&r>0)return fail('With n = 0 types there is nothing to choose from.');
  var res,lab,fx,tag,sentence,Ncr=n+r-1;
  if(mode==='c'){res=comb(n,r);lab='C('+n+', '+r+')';fx='C(n, r) = n! ÷ (r! × (n − r)!)';tag='Order irrelevant';sentence='There are '+big(res)+' ways to choose '+r+' items from '+n+' when order does not matter.';}
  else if(mode==='p'){res=perm(n,r);lab='P('+n+', '+r+')';fx='P(n, r) = n! ÷ (n − r)!';tag='Order matters';sentence='There are '+big(res)+' ordered arrangements of '+r+' items chosen from '+n+'.';}
  else if(mode==='cr'){res=comb(Ncr,r);lab='C('+n+' + '+r+' − 1, '+r+') = C('+Ncr+', '+r+')';fx='C(n + r − 1, r) = (n + r − 1)! ÷ (r! × (n − 1)!)';tag='Repetition allowed';sentence='There are '+big(res)+' multisets of size '+r+' from '+n+' types.';}
  else{res=BigInt(n)**BigInt(r);lab=n+'^'+r;fx='n^r = n × n × … × n  (r times)';tag='Repetition allowed';sentence='There are '+big(res)+' ordered sequences of length '+r+' from '+n+' symbols.';}
  var s=res.toString();
  C.text('heroLbl',lab);C.text('resultValue',big(res));C.text('interp',sentence);C.text('digits',s.length+' digit'+(s.length===1?'':'s'));
  C.text('oneLbl','Chance of one specific '+(mode==='c'||mode==='cr'?'selection':'outcome'));C.text('one',res>0n?'1 in '+big(res):'impossible');
  C.text('fxNow',fx);var t=$('tag');t.textContent=tag;t.className='sx-ef-grade';
  C.text('fn',big(fact(n)));C.text('fr',big(fact(r)));C.text('fnr',r<=n?big(fact(n-r)):'n/a');
  /* all four for the same n, r */
  var rows=[['Combinations C(n, r)','n! ÷ (r!(n−r)!)',r<=n?comb(n,r):null,'c'],['Permutations P(n, r)','n! ÷ (n−r)!',r<=n?perm(n,r):null,'p'],['Combinations with repetition','C(n+r−1, r)',(n>0||r===0)?comb(Ncr>=0?Ncr:0,r):null,'cr'],['Permutations with repetition','n^r',BigInt(n)**BigInt(r),'pr']];
  $('allTbl').tBodies[0].innerHTML=rows.map(function(x){return '<tr'+(x[3]===mode?' class="act"':'')+'><td style="white-space:normal;font-family:inherit">'+esc(x[0])+(x[3]===mode?' <span class="act">selected</span>':'')+'</td><td class="mono" style="font-size:12px">'+esc(x[1])+'</td><td class="mono">'+(x[2]===null?'n/a':esc(big(x[2])))+'</td></tr>';}).join('');
  /* steps */
  var h='',m=0;function st(a,b,c2){m++;h+='<li><span class="n">'+m+'</span><h4>'+a+'</h4>'+(b?'<p>'+b+'</p>':'')+'<span class="eq">'+c2+'</span></li>';}
  function combSteps(N,k,name){
    var pp=perm(N,k),kf=fact(k),kk=k;
    st('Write the formula',"Substitute the values.",name+' = '+N+'! ÷ ('+k+'! × '+(N-k)+'!)');
    st('Cancel the '+(N-k)+'! terms','Everything from '+(N-k)+' downwards cancels between numerator and denominator, leaving the first '+k+' factors of '+N+'!.',N+'! ÷ '+(N-k)+'! = '+esc(kk===0?'1 (empty product)':prodTxt(N,k)));
    st('Multiply the remaining factors','This partial product is the number of ordered arrangements, P('+N+', '+k+').','P('+N+', '+k+') = <b>'+esc(big(pp))+'</b>');
    st('Divide by '+k+'!','Removes the '+k+'! orderings of each selection.',esc(big(pp))+' ÷ '+k+'! ('+esc(big(kf))+') = <b>'+esc(big(pp/kf))+'</b>');
  }
  if(mode==='c')combSteps(n,r,'C('+n+', '+r+')');
  else if(mode==='p'){
    st('Write the formula','Substitute the values.','P('+n+', '+r+') = '+n+'! ÷ ('+n+' − '+r+')! = '+n+'! ÷ '+(n-r)+'!');
    st('Cancel the '+(n-r)+'! terms','Only the first '+r+' factors of '+n+'! survive.',esc(r===0?'1 (empty product)':prodTxt(n,r)));
    st('Multiply','','P('+n+', '+r+') = <b>'+esc(big(res))+'</b>');
  }else if(mode==='cr'){
    st('Convert to a plain combination','“Stars and bars”: r items into n types corresponds to choosing positions among n + r − 1 slots.','C('+n+' + '+r+' − 1, '+r+') = C('+Ncr+', '+r+')');
    combSteps(Ncr,r,'C('+Ncr+', '+r+')');
  }else{
    st('One independent choice per position','Each of the '+r+' positions can be any of the '+n+' symbols.',esc(r===0?'empty sequence = 1':(r<=8?Array(r).fill(n).join(' × '):n+' × '+n+' × … × '+n+' ('+r+' times)')));
    st('Multiply','','<b>'+n+'^'+r+' = '+esc(big(res))+'</b>'+(n>1&&r>0?'<br>bits of entropy = '+r+' × log₂('+n+') = '+(r*Math.log2(n)).toFixed(2):''));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Exact working for '+lab+'.');C.text('stepsTag',mode==='c'||mode==='cr'?'order ignored':mode==='p'?'order counts':'order counts');
  last=s;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('n').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pcCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;C.set('mode',b.getAttribute('data-m'));C.set('n',b.getAttribute('data-n'));C.set('r',b.getAttribute('data-r'));fire();});
  $('swap').addEventListener('click',function(){var a=$('n').value;C.set('n',$('r').value);C.set('r',a);fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy exact value');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
