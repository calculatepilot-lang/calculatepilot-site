/* Word counter & readability analyzer — CalculatePilot (Stitch redesign). Everything runs in the browser; text is never sent anywhere.
   Flesch Reading Ease 206.835 − 1.015·W/S − 84.6·Syl/W; Flesch-Kincaid grade 0.39·W/S + 11.8·Syl/W − 15.59;
   Gunning Fog 0.4·(W/S + 100·complex/W); Coleman-Liau 0.0588·L − 0.296·S − 15.8; ARI 4.71·chars/W + 0.5·W/S − 21.43.
   Syllables are estimated from vowel groups. */
(function(){
var C=window.CPX,$=C.$,last='',stats=null;
var SAMPLE='Good writing is clear writing. Short sentences help readers follow an idea from start to finish. Long sentences with many clauses, however, can hide the point and tire the reader before they reach the end of the thought.\n\nWhen you edit, look for words you repeat and phrases that add little. Replace complicated words with simple ones where you can. Read the text aloud, because your ear will catch problems that your eye misses.\n\nA good draft is not perfect on the first try. It improves with each careful pass, and the readability scores here show whether your changes are making the text easier to read.';
var STOP='a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just me more most my no nor not of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours'.split(' ');
var STOPSET={};STOP.forEach(function(w){STOPSET[w]=1;});
function syl(w){w=w.toLowerCase().replace(/[^a-z]/g,'');if(!w)return 0;if(w.length<=3)return 1;w=w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');var m=w.match(/[aeiouy]{1,2}/g);return Math.max(1,m?m.length:1);}
function fmtT(min){var s=Math.round(min*60);if(s<60)return s+' s';var m=Math.floor(s/60),r=s%60;return m+' min'+(r?' '+r+' s':'');}
function analyse(t){
  var words=t.split(/\s+/).filter(function(w){return /[\p{L}\p{N}]/u.test(w);}),W=words.length;
  var clean=words.map(function(w){return w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'').toLowerCase();}).filter(Boolean);
  var sents=t.trim()?t.split(/(?<=[.!?])\s+|\n+/).filter(function(x){return /[\p{L}\p{N}]/u.test(x);}).length:0;
  var paras=t.split(/\n+/).filter(function(x){return x.trim();}).length;
  var letters=(t.match(/\p{L}/gu)||[]).length,alnum=(t.match(/[\p{L}\p{N}]/gu)||[]).length;
  var sy=0,mono=0,poly=0;clean.forEach(function(w){var s=syl(w);sy+=s;if(s===1)mono++;if(s>=3)poly++;});
  var uniq={};clean.forEach(function(w){uniq[w]=1;});var U=Object.keys(uniq).length;
  var S=Math.max(1,sents),ws=W?W/S:0,sw=W?sy/W:0;
  var fre=W?206.835-1.015*ws-84.6*sw:NaN,fk=W?0.39*ws+11.8*sw-15.59:NaN,fog=W?0.4*(ws+100*poly/W):NaN,cl=W?0.0588*(letters/W*100)-0.296*(S/W*100)-15.8:NaN,ari=W?4.71*(alnum/W)+0.5*ws-21.43:NaN;
  return {text:t,W:W,chars:t.length,noSp:t.replace(/\s/g,'').length,sents:sents,paras:paras,letters:letters,sy:sy,mono:mono,poly:poly,uniq:U,clean:clean,fre:fre,fk:fk,fog:fog,cl:cl,ari:ari,aw:W?letters/W:0,as:ws};
}
function band(f){return f>=90?['Very easy','About 5th grade. Easily understood by an average 11-year-old.']:f>=80?['Easy','About 6th grade. Conversational English.']:f>=70?['Fairly easy','About 7th grade.']:f>=60?['Plain English','About 8th to 9th grade. Easily understood by 13 to 15-year-olds.']:f>=50?['Fairly difficult','About 10th to 12th grade.']:f>=30?['Difficult','College level.']:['Very difficult','College graduate level.'];}
function fail(){['resultValue','sFk','sFog','sCl','sAri','rAw','rAs','rSy','rTtr'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Add some text to see readability scores.');$('fbar').style.width='0';}
function keywords(a){
  var n=+$('ng').value,stop=$('stop').checked,map={},cl=a.clean;
  for(var i=0;i+n<=cl.length;i++){var g=cl.slice(i,i+n);if(stop&&(STOPSET[g[0]]||STOPSET[g[n-1]]))continue;if(g.join('').length<2)continue;var k=g.join(' ');map[k]=(map[k]||0)+1;}
  var list=Object.keys(map).map(function(k){return [k,map[k]];}).filter(function(x){return n===1||x[1]>1||true;}).sort(function(x,y){return y[1]-x[1]||(x[0]<y[0]?-1:1);}).slice(0,8),mx=list.length?list[0][1]:1;
  $('kw').querySelector('tbody').innerHTML=list.length?list.map(function(x){return '<tr><td class="a">'+C.esc(x[0])+'</td><td class="n">'+x[1]+'</td><td class="n">'+C.num(x[1]/Math.max(1,cl.length)*100,2)+'%</td><td><div style="height:6px;border-radius:99px;background:var(--sx-low);min-width:80px"><div style="height:100%;border-radius:99px;background:var(--sx-pc);width:'+(x[1]/mx*100)+'%"></div></div></td></tr>';}).join(''):'<tr><td class="a" colspan="4" style="color:var(--sx-muted)">No phrases yet.</td></tr>';
}
function limits(n){
  var L=[['X (Twitter) post',280],['Instagram caption',2200],['LinkedIn post',3000],['SMS, one message',160],['Google title (about)',60],['Meta description (about)',160]];
  $('lim').innerHTML=L.map(function(l){var over=n>l[1],p=Math.min(100,n/l[1]*100);return '<div><div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span style="color:var(--sx-onv)">'+l[0]+'</span><b style="font-family:var(--font-mono);color:'+(over?'var(--sx-err)':'var(--sx-on)')+'">'+C.num(n,0)+' / '+C.num(l[1],0)+'</b></div><div style="height:6px;border-radius:99px;background:var(--sx-low);margin:5px 0"><div style="height:100%;border-radius:99px;background:'+(over?'var(--sx-err)':'var(--sx-pc)')+';width:'+p+'%"></div></div><div style="font-size:11px;color:var(--sx-muted)">'+(over?'Over by '+C.num(n-l[1],0)+' characters':C.num(l[1]-n,0)+' characters left')+'</div></div>';}).join('');
}
function compute(){
  var t=$('txt').value,a=analyse(t);stats=a;
  var wpm=+$('wpm').value;
  C.text('kW',C.num(a.W,0));C.text('kC',C.num(a.chars,0));C.text('kN',C.num(a.noSp,0));C.text('kS',C.num(a.sents,0));C.text('kP',C.num(a.paras,0));
  C.text('kR',a.W?fmtT(a.W/wpm):'0 s');C.text('kRn','at '+wpm+' words a minute');C.text('kSp',a.W?fmtT(a.W/150):'0 s');C.text('kU',C.num(a.uniq,0));C.text('kUn',a.W?C.num(a.uniq/a.W*100,0)+'% of words':'—');
  C.text('wcStat',C.num(a.W,0)+' words · '+C.num(a.chars,0)+' characters');
  limits(a.chars);keywords(a);
  if(!a.W)return fail();
  var b=band(a.fre);C.text('resultValue',C.num(a.fre,1));C.text('tag',b[0]);C.text('interp',b[1]);$('fbar').style.width=Math.max(0,Math.min(100,a.fre))+'%';
  C.text('sFk','Grade '+C.num(a.fk,1));C.text('sFog',C.num(a.fog,1));C.text('sCl',C.num(a.cl,1));C.text('sAri',C.num(a.ari,1));
  C.text('rAw',C.num(a.aw,1));C.text('rAs',C.num(a.as,1));
  var mp=a.mono/a.W*100,pp=a.poly/a.W*100;C.text('rSy',C.num(mp,0)+'% / '+C.num(pp,0)+'%');$('bMono').style.width=mp+'%';$('bPoly').style.width=pp+'%';C.text('rTtr',C.num(a.uniq/a.W*100,1)+'%');
  last='Text statistics — calculatepilot.com/other/word-counter.html\n'+a.W+' words, '+a.chars+' characters ('+a.noSp+' without spaces), '+a.sents+' sentences, '+a.paras+' paragraphs\nReading time '+fmtT(a.W/wpm)+'; Flesch Reading Ease '+C.num(a.fre,1)+' ('+b[0]+'); grade '+C.num(a.fk,1);
}
function title(s){return s.toLowerCase().replace(/(^|[\s\-–—(["'])([a-zÀ-ɏ])/g,function(m,p,c){return p+c.toUpperCase();});}
function sentence(s){return s.toLowerCase().replace(/(^\s*|[.!?]\s+|\n+\s*)([a-zÀ-ɏ])/g,function(m,p,c){return p+c.toUpperCase();});}
function fire(){$('txt').dispatchEvent(new Event('input',{bubbles:true}));}
function dl(name,mime,body){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:mime}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  $('txt').value=SAMPLE;
  C.init({root:'wcCalc',compute:compute});
  $('bSample').addEventListener('click',function(){$('txt').value=SAMPLE;fire();});
  $('bClear').addEventListener('click',function(){$('txt').value='';fire();$('txt').focus();});
  $('bCopy').addEventListener('click',function(){copy($('txt').value,'bCopyT','Copy text');});
  $('bTrim').addEventListener('click',function(){$('txt').value=$('txt').value.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();fire();});
  $('caseSel').addEventListener('change',function(){var v=this.value,t=$('txt').value;if(v==='up')t=t.toUpperCase();else if(v==='low')t=t.toLowerCase();else if(v==='title')t=title(t);else if(v==='sent')t=sentence(t);$('txt').value=t;this.value='';fire();});
  $('bJson').addEventListener('click',function(){if(!stats)return;var s=stats;dl('text-stats.json','application/json',JSON.stringify({words:s.W,characters:s.chars,charactersNoSpaces:s.noSp,sentences:s.sents,paragraphs:s.paras,uniqueWords:s.uniq,fleschReadingEase:+s.fre.toFixed(2),fleschKincaidGrade:+s.fk.toFixed(2),gunningFog:+s.fog.toFixed(2),colemanLiau:+s.cl.toFixed(2),ari:+s.ari.toFixed(2)},null,2));});
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){setTimeout(function(){$('txt').value=SAMPLE;fire();},0);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy stats');});
});
})();
