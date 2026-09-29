/* Love calculator (entertainment) — CalculatePilot (Stitch redesign).
   Love percentage: counts of l,o,v,e,s in name1+"loves"+name2, adjacent digits added (two-digit sums split) until two digits remain.
   FLAMES: cancel shared letters, count the rest, eliminate letters of FLAMES cyclically. Love languages: static pairing tips. */
(function(){
var C=window.CPX,$=C.$,last='';
var LANG={words:'Words of affirmation',time:'Quality time',acts:'Acts of service',touch:'Physical touch',gifts:'Receiving gifts'};
var GIVE={words:'say it out loud: thank them, praise specific things, send kind messages',time:'give undivided attention: plan time together with phones away',acts:'take a task off their plate without being asked',touch:'offer hugs, hand-holding and closeness',gifts:'give small, thoughtful gifts that show you were thinking of them'};
var FL={F:'Friends',L:'Love',A:'Affection',M:'Marriage',E:'Enemies',S:'Siblings'};
function letters(s){return (s||'').toLowerCase().replace(/[^a-zÀ-ɏ]/g,'');}
function lovePct(a,b){var s=letters(a)+'loves'+letters(b),d='',steps,i;'loves'.split('').forEach(function(c){var n=0;for(i=0;i<s.length;i++)if(s.charAt(i)===c)n++;d+=n;});steps=[d];var it=0;
  while(d.length>2&&it<12){var nd='';for(i=0;i<d.length-1;i++)nd+=(+d.charAt(i))+(+d.charAt(i+1));d=nd;steps.push(d);it++;}
  while(d.length>2){var nd2='';for(i=0;i<d.length-1;i++)nd2+=((+d.charAt(i))+(+d.charAt(i+1)))%10;d=nd2;steps.push(d);}
  return {pct:parseInt(d,10),steps:steps,counts:steps[0]};}
function flames(a,b){var x=letters(a).split(''),y=letters(b).split(''),i;x.slice().forEach(function(c){var j=y.indexOf(c);if(j>=0){x.splice(x.indexOf(c),1);y.splice(j,1);}});
  var n=x.length+y.length,L='FLAMES'.split(''),idx=0,order=[];if(n===0)return {n:0,res:null};
  while(L.length>1){idx=(idx+n-1)%L.length;order.push(L.splice(idx,1)[0]);}
  return {n:n,res:L[0],order:order,left:x.join('')+y.join('')};}
function band(p){return p>=85?'Perfect match':p>=65?'Great match':p>=40?'Good chance':p>=20?'Room to grow':'Just friends?';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('wk','—');last='';}
function compute(){
  var mode=$('mode').value;$('err').hidden=true;$('gNames').hidden=mode==='lang';$('gLang').hidden=mode!=='lang';
  if(mode==='lang'){
    var a=$('l1').value,b=$('l2').value;
    C.text('hL','Love languages');C.text('resultValue',a===b?'Same language':'Different languages');C.text('tag',LANG[a]+' + '+LANG[b]);
    C.text('interp',a===b?'You both value '+LANG[a].toLowerCase()+'. Lean into it and check in on what that means for each of you.':'You each feel cared for in a different way, so it helps to say what works.');
    C.text('wkH','Ideas');C.text('wk','Partner 1 shows love to Partner 2 (who prefers '+LANG[b].toLowerCase()+'): '+GIVE[b]+'. Partner 2 shows love to Partner 1 (who prefers '+LANG[a].toLowerCase()+'): '+GIVE[a]+'.');
    C.text('note','Love languages are a conversation starter. Research does not show that matching them predicts happier relationships.');
    last='Love languages — calculatepilot.com/other/love-calculator.html\n'+LANG[a]+' and '+LANG[b];return;}
  var n1=letters($('n1').value),n2=letters($('n2').value);
  if(!n1||!n2)return fail('Enter two names.');
  C.text('wkH','How it was worked out');
  if(mode==='love'){var r=lovePct($('n1').value,$('n2').value);
    C.text('hL','Love percentage');C.text('resultValue',r.pct+'%');C.text('tag',band(r.pct));C.text('interp',$('n1').value.trim()+' and '+$('n2').value.trim()+'.');
    C.text('wk','Counts of L, O, V, E, S: '+r.counts.split('').join(' ')+'. Adding neighbours: '+(r.steps.length>7?r.steps.slice(1,6).map(function(s){return s.split('').join(' ');}).join(' → ')+' → … ':r.steps.slice(1).map(function(s){return s.split('').join(' ');}).join(' → '))+' → '+r.pct+'.');
    C.text('note','This is an entertainment game based on letters in names. It cannot measure or predict a real relationship.');
    last='Love calculator — calculatepilot.com/other/love-calculator.html\n'+$('n1').value.trim()+' + '+$('n2').value.trim()+': '+r.pct+'% ('+band(r.pct)+')';}
  else{var f=flames($('n1').value,$('n2').value);
    if(f.n===0){C.text('hL','FLAMES');C.text('resultValue','—');C.text('tag','identical names');C.text('interp','Every letter cancelled, so FLAMES has nothing to count.');C.text('wk','Try two different names.');return;}
    C.text('hL','FLAMES');C.text('resultValue',FL[f.res]);C.text('tag',f.res);C.text('interp',$('n1').value.trim()+' and '+$('n2').value.trim()+'.');
    C.text('wk','Letters left after crossing out shared ones: '+f.left+' ('+f.n+'). Counting '+f.n+' each time, eliminated: '+f.order.map(function(c){return c+' ('+FL[c]+')';}).join(', ')+'. Left: '+f.res+'.');
    C.text('note','FLAMES is a playground game. It is not a prediction.');
    last='FLAMES — calculatepilot.com/other/love-calculator.html\n'+$('n1').value.trim()+' + '+$('n2').value.trim()+': '+FL[f.res];}
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'lvCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
