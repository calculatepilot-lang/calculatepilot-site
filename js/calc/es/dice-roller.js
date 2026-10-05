/* Dice roller & probability — CalculatePilot (Stitch redesign).
   Rolls use crypto.getRandomValues with rejection sampling. Odds: exact by convolution (plain sums) or enumeration (keep/drop, small pools); otherwise simulated. */
(function(){
var C=window.CPX,$=C.$,last='',cache={key:'',an:null},emp=null,cur=null;
function rnd(sides){var lim=4294967296-(4294967296%sides),b=new Uint32Array(1);do{crypto.getRandomValues(b);}while(b[0]>=lim);return (b[0]%sides)+1;}
function parse(txt){
  var m=/^\s*(\d*)\s*d\s*(\d+)\s*(?:(kh|kl|dh|dl)\s*(\d+))?\s*(?:([+-])\s*(\d+))?\s*$/i.exec(txt||'');
  if(!m)return {err:'Usa el formato NdS, por ejemplo 2d6+3 o 4d6kh3.'};
  var n=m[1]===''?1:+m[1],s=+m[2],mode=m[3]?m[3].toLowerCase():'',k=m[4]?+m[4]:0,mod=m[6]?(m[5]==='-'?-1:1)*(+m[6]):0;
  if(n<1||n>100)return {err:'Usa entre 1 y 100 dados.'};
  if(s<2||s>1000)return {err:'Los dados necesitan entre 2 y 1,000 caras.'};
  var keep=n,high=true;
  if(mode){if(k<1||k>=n&&(mode==='dh'||mode==='dl'))return {err:'Eso eliminaría todos los dados. Descarta menos de '+n+'.'};
    if(mode==='kh'){keep=Math.min(k,n);high=true;}else if(mode==='kl'){keep=Math.min(k,n);high=false;}else if(mode==='dl'){keep=n-k;high=true;}else{keep=n-k;high=false;}}
  return {n:n,s:s,mode:mode,k:k,mod:mod,keep:keep,high:high,all:keep>=n};
}
function pick(vals,keep,high){var idx=vals.map(function(v,i){return i;}).sort(function(a,b){return high?vals[b]-vals[a]:vals[a]-vals[b];}),kept={};for(var i=0;i<keep;i++)kept[idx[i]]=true;return kept;}
function oneDie(s,ex){var v=rnd(s),chain=[v],c=0;if(ex)while(v===s&&c<20){v=rnd(s);chain.push(v);c++;}return chain;}
function rollOnce(sp,ex){var dice=[],i;for(i=0;i<sp.n;i++)dice.push(oneDie(sp.s,ex));var vals=dice.map(function(c){return c.reduce(function(a,b){return a+b;},0);});var kept=pick(vals,sp.keep,sp.high),tot=sp.mod;for(i=0;i<sp.n;i++)if(kept[i])tot+=vals[i];return {dice:dice,vals:vals,kept:kept,total:tot};}
function totalOnly(sp,ex){var vals=[],i;for(i=0;i<sp.n;i++){var c=oneDie(sp.s,ex);vals.push(c.reduce(function(a,b){return a+b;},0));}if(sp.all){var t=sp.mod;for(i=0;i<sp.n;i++)t+=vals[i];return t;}vals.sort(function(a,b){return sp.high?b-a:a-b;});var t2=sp.mod;for(i=0;i<sp.keep;i++)t2+=vals[i];return t2;}
/* returns {min,p:[...],exact} with p[i] = P(total = min+i) */
function analyse(sp,ex){
  var n=sp.n,s=sp.s,i,j;
  if(!ex&&sp.all){var size=n*s+1,cur=new Float64Array(size);cur[0]=1;
    for(i=0;i<n;i++){var nx=new Float64Array(size),pre=new Float64Array(size+1);for(j=0;j<size;j++)pre[j+1]=pre[j]+cur[j];for(j=0;j<size;j++){var lo=Math.max(0,j-s),hi=j-1;if(hi>=0)nx[j]=(pre[hi+1]-pre[lo])/s;}cur=nx;}
    return {min:n+sp.mod,p:Array.prototype.slice.call(cur,n),exact:true,how:'exact'};}
  var space=Math.pow(s,n);
  if(!ex&&space<=400000){var cnt={},vals=new Array(n),tot=0,idx=0,lo2=Infinity,hi2=-Infinity;for(i=0;i<n;i++)vals[i]=1;
    for(;;){var srt=vals.slice().sort(function(a,b){return sp.high?b-a:a-b;}),sum=0;for(i=0;i<sp.keep;i++)sum+=srt[i];cnt[sum]=(cnt[sum]||0)+1;tot++;
      i=0;while(i<n){vals[i]++;if(vals[i]<=s)break;vals[i]=1;i++;}if(i===n)break;}
    var ks=Object.keys(cnt).map(Number),mn=Math.min.apply(null,ks),mx=Math.max.apply(null,ks),p=[];for(i=mn;i<=mx;i++)p.push((cnt[i]||0)/tot);
    return {min:mn+sp.mod,p:p,exact:true,how:'exact'};}
  var N=100000,c2={};for(i=0;i<N;i++){var t=totalOnly(sp,ex)-sp.mod;c2[t]=(c2[t]||0)+1;}
  var k2=Object.keys(c2).map(Number),a=Math.min.apply(null,k2),b=Math.max.apply(null,k2),pp=[];for(i=a;i<=b;i++)pp.push((c2[i]||0)/N);
  return {min:a+sp.mod,p:pp,exact:false,how:'simulado a partir de 100,000 tiradas'};
}
function stats(an){var mu=0,v=0,i;for(i=0;i<an.p.length;i++)mu+=(an.min+i)*an.p[i];for(i=0;i<an.p.length;i++)v+=Math.pow(an.min+i-mu,2)*an.p[i];return {mu:mu,sd:Math.sqrt(v)};}
function pct(x){return (x*100).toFixed(x<0.001&&x>0?3:x<0.1?2:1)+'%';}
function drawHist(an,total){
  var el=$('hist'),bins=[],per=Math.max(1,Math.ceil(an.p.length/100)),i,j,mx=0;
  for(i=0;i<an.p.length;i+=per){var s=0,e=0,lo=an.min+i,hi=Math.min(an.min+i+per-1,an.min+an.p.length-1);for(j=i;j<Math.min(i+per,an.p.length);j++){s+=an.p[j];e+=emp?(emp.c[an.min+j]||0)/emp.n:0;}bins.push({lo:lo,hi:hi,p:s,e:e});if(s>mx)mx=s;if(e>mx)mx=e;}
  el.innerHTML=bins.map(function(b){var on=total>=b.lo&&total<=b.hi,h=mx?b.p/mx*100:0,eh=mx?b.e/mx*100:0;
    return '<div title="'+(b.lo===b.hi?b.lo:b.lo+' to '+b.hi)+': '+pct(b.p)+'" style="flex:1;height:100%;position:relative"><div style="position:absolute;left:0;right:0;bottom:0;height:'+h+'%;min-height:1px;background:'+(on?'var(--sx-primary)':'var(--sx-hover,#c7d2fe)')+'"></div>'+(emp?'<div style="position:absolute;left:0;right:0;bottom:'+eh+'%;height:2px;background:var(--sx-ink,#111)"></div>':'')+'</div>';}).join('');
  C.text('hMin',String(an.min));C.text('hMax',String(an.min+an.p.length-1));C.text('hN',an.how+(per>1?' · '+per+' totales por barra':''));C.text('hLeg',emp?'líneas: '+C.num(emp.n,0)+' tiradas simuladas':'');
}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oEv','oRg','oPe','oPg','oSd','oPr'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('dieRow').innerHTML='';$('hist').innerHTML='';cur=null;last='';}
function show(){
  var sp=cur.sp,r=cur.r,an=cur.an,t=r.total,st=stats(an),ex=$('xp').checked;
  var i=t-an.min,pe=(i>=0&&i<an.p.length)?an.p[i]:0,pg=0,pl=0,k;for(k=0;k<an.p.length;k++){if(an.min+k>=t)pg+=an.p[k];if(an.min+k<t)pl+=an.p[k];}
  C.text('resultValue',String(t));C.text('tag',$('ex').value.replace(/\s+/g,''));
  var base=t-sp.mod;C.text('interp',(sp.mod?base+' de los dados '+(sp.mod>0?'+ ':'− ')+Math.abs(sp.mod)+' modificador.':'Total de los dados conservados.')+(ex?' Dados explosivos activados.':''));
  $('dieRow').innerHTML=r.dice.map(function(c,i){var kept=r.kept[i];return '<span style="min-width:34px;padding:6px 8px;border-radius:8px;text-align:center;font-weight:700;background:var(--sx-card,#fff);border:1px solid var(--sx-border,#d1d5db);'+(kept?'':'text-decoration:line-through;opacity:.45')+'">'+c.join('+')+'</span>';}).join('');
  C.text('oEv',st.mu.toFixed(2));C.text('oRg',an.min+' to '+(an.min+an.p.length-1));C.text('oPe',pct(pe));C.text('oPg',pct(pg));C.text('oSd',st.sd.toFixed(2));C.text('oPr',((pl+pe/2)*100).toFixed(1)+'th');
  drawHist(an,t);
  last='Dados — calculatepilot.com/other/dice-roller.html\n'+$('ex').value.replace(/\s+/g,'')+' = '+t+' (dice: '+r.vals.map(function(v,i){return r.kept[i]?v:'('+v+')';}).join(', ')+')';
}
function compute(){
  $('err').hidden=true;var sp=parse($('ex').value),ex=$('xp').checked;
  if(sp.err)return fail(sp.err);
  var key=$('ex').value.replace(/\s+/g,'')+'|'+ex;
  if(cache.key!==key){cache={key:key,an:analyse(sp,ex)};emp=null;}
  cur={sp:sp,an:cache.an,r:rollOnce(sp,ex)};show();
}
function roll(){var sp=parse($('ex').value);if(sp.err)return;if(!cur||cache.key!==$('ex').value.replace(/\s+/g,'')+'|'+$('xp').checked){compute();return;}cur.r=rollOnce(sp,$('xp').checked);show();}
function sim(){var sp=parse($('ex').value);if(sp.err)return;if(!cur)compute();var ex=$('xp').checked,N=10000,c={},i;for(i=0;i<N;i++){var t=totalOnly(sp,ex);c[t]=(c[t]||0)+1;}emp={c:c,n:N};show();}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'dcCalc',compute:compute});
  $('rollBtn').addEventListener('click',roll);$('simBtn').addEventListener('click',sim);
  document.querySelectorAll('[data-x]').forEach(function(b){b.addEventListener('click',function(){$('ex').value=b.getAttribute('data-x');$('ex').dispatchEvent(new Event('input',{bubbles:true}));});});
  document.querySelectorAll('[data-die]').forEach(function(b){b.addEventListener('click',function(){var s=b.getAttribute('data-die'),v=$('ex').value.replace(/\s+/g,''),m=/^(\d*)d(\d+)(.*)$/i.exec(v);if(m&&m[2]===s&&!m[3].match(/^(kh|kl|dh|dl)/i)){v=(m[1]===''?2:(+m[1]+1))+'d'+s+m[3];}else v='1d'+s;$('ex').value=v;$('ex').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
});
})();
