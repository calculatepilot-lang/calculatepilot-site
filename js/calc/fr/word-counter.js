/* Word counter & readability analyzer — CalculatePilot (Stitch redesign). Everything runs in the browser; text is never sent anywhere.
   Flesch Reading Ease 206.835 − 1.015·W/S − 84.6·Syl/W; Flesch-Kincaid grade 0.39·W/S + 11.8·Syl/W − 15.59;
   Gunning Fog 0.4·(W/S + 100·complex/W); Coleman-Liau 0.0588·L − 0.296·S − 15.8; ARI 4.71·chars/W + 0.5·W/S − 21.43.
   Syllables are estimated from vowel groups. */
(function(){
var C=window.CPX,$=C.$,last='',stats=null;
var SAMPLE='Bien écrire, c\'est écrire clairement. Des phrases courtes aident les lecteurs à suivre une idée du début à la fin. Les phrases longues, avec de nombreuses propositions, peuvent en revanche noyer le propos et fatiguer le lecteur avant qu\'il n\'arrive au bout de l\'idée.\n\nLorsque vous relisez, repérez les mots que vous répétez et les expressions qui n\'apportent presque rien. Remplacez les mots compliqués par des mots simples chaque fois que possible. Lisez le texte à voix haute, car votre oreille repérera des problèmes que votre œil laisse passer.\n\nUn bon brouillon n\'est pas parfait du premier coup. Il s\'améliore à chaque relecture attentive, et les scores de lisibilité affichés ici montrent si vos modifications rendent le texte plus facile à lire.';
var STOP='a à au aux avec ce ces dans de des du elle en et eux il ils je la le les leur lui ma mais me même mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous c d j l m n s t y été étée étées étés étant suis es est sommes êtes sont serai seras sera serons serez seront serais serait serions seriez seraient étais était étions étiez étaient fus fut fûmes fûtes furent sois soit soyons soyez soient fusse fusses fût fussions fussiez fussent ayant eu eue eues eus ai as avons avez ont aurai auras aura aurons aurez auront aurais aurait aurions auriez auraient avais avait avions aviez avaient eut eûmes eûtes eurent aie aies ait ayons ayez aient eusse eusses eût eussions eussiez eussent ceci cela celà cet cette ici ils les leurs vos'.split(' ');
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
function band(f){return f>=90?['Très facile','Niveau CM2 environ. Facilement compris par un enfant moyen de 11 ans.']:f>=80?['Facile','Niveau 6e environ. Langage courant.']:f>=70?['Assez facile','Niveau 5e environ.']:f>=60?['Langage clair','Niveau 4e à 3e environ. Facilement compris par les 13 à 15 ans.']:f>=50?['Assez difficile','Niveau seconde à terminale environ.']:f>=30?['Difficile','Niveau universitaire.']:['Très difficile','Niveau diplômé de l\'enseignement supérieur.'];}
function fail(){['resultValue','sFk','sFog','sCl','sAri','rAw','rAs','rSy','rTtr'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Ajoutez du texte pour voir les scores de lisibilité.');$('fbar').style.width='0';}
function keywords(a){
  var n=+$('ng').value,stop=$('stop').checked,map={},cl=a.clean;
  for(var i=0;i+n<=cl.length;i++){var g=cl.slice(i,i+n);if(stop&&(STOPSET[g[0]]||STOPSET[g[n-1]]))continue;if(g.join('').length<2)continue;var k=g.join(' ');map[k]=(map[k]||0)+1;}
  var list=Object.keys(map).map(function(k){return [k,map[k]];}).filter(function(x){return n===1||x[1]>1||true;}).sort(function(x,y){return y[1]-x[1]||(x[0]<y[0]?-1:1);}).slice(0,8),mx=list.length?list[0][1]:1;
  $('kw').querySelector('tbody').innerHTML=list.length?list.map(function(x){return '<tr><td class="a">'+C.esc(x[0])+'</td><td class="n">'+x[1]+'</td><td class="n">'+C.num(x[1]/Math.max(1,cl.length)*100,2)+'%</td><td><div style="height:6px;border-radius:99px;background:var(--sx-low);min-width:80px"><div style="height:100%;border-radius:99px;background:var(--sx-pc);width:'+(x[1]/mx*100)+'%"></div></div></td></tr>';}).join(''):'<tr><td class="a" colspan="4" style="color:var(--sx-muted)">Aucune expression pour l\'instant.</td></tr>';
}
function limits(n){
  var L=[['Publication X (Twitter)',280],['Légende Instagram',2200],['Publication LinkedIn',3000],['SMS, un message',160],['Titre Google (environ)',60],['Méta-description (environ)',160]];
  $('lim').innerHTML=L.map(function(l){var over=n>l[1],p=Math.min(100,n/l[1]*100);return '<div><div style="display:flex;justify-content:space-between;gap:8px;font-size:13px"><span style="color:var(--sx-onv)">'+l[0]+'</span><b style="font-family:var(--font-mono);color:'+(over?'var(--sx-err)':'var(--sx-on)')+'">'+C.num(n,0)+' / '+C.num(l[1],0)+'</b></div><div style="height:6px;border-radius:99px;background:var(--sx-low);margin:5px 0"><div style="height:100%;border-radius:99px;background:'+(over?'var(--sx-err)':'var(--sx-pc)')+';width:'+p+'%"></div></div><div style="font-size:11px;color:var(--sx-muted)">'+(over?'Dépassement de '+C.num(n-l[1],0)+' characters':C.num(l[1]-n,0)+' caractères restants')+'</div></div>';}).join('');
}
function compute(){
  var t=$('txt').value,a=analyse(t);stats=a;
  var wpm=+$('wpm').value;
  C.text('kW',C.num(a.W,0));C.text('kC',C.num(a.chars,0));C.text('kN',C.num(a.noSp,0));C.text('kS',C.num(a.sents,0));C.text('kP',C.num(a.paras,0));
  C.text('kR',a.W?fmtT(a.W/wpm):'0 s');C.text('kRn','at '+wpm+' mots par minute');C.text('kSp',a.W?fmtT(a.W/150):'0 s');C.text('kU',C.num(a.uniq,0));C.text('kUn',a.W?C.num(a.uniq/a.W*100,0)+'% des mots':'—');
  C.text('wcStat',C.num(a.W,0)+' mots · '+C.num(a.chars,0)+' characters');
  limits(a.chars);keywords(a);
  if(!a.W)return fail();
  var b=band(a.fre);C.text('resultValue',C.num(a.fre,1));C.text('tag',b[0]);C.text('interp',b[1]);$('fbar').style.width=Math.max(0,Math.min(100,a.fre))+'%';
  C.text('sFk','Note '+C.num(a.fk,1));C.text('sFog',C.num(a.fog,1));C.text('sCl',C.num(a.cl,1));C.text('sAri',C.num(a.ari,1));
  C.text('rAw',C.num(a.aw,1));C.text('rAs',C.num(a.as,1));
  var mp=a.mono/a.W*100,pp=a.poly/a.W*100;C.text('rSy',C.num(mp,0)+'% / '+C.num(pp,0)+'%');$('bMono').style.width=mp+'%';$('bPoly').style.width=pp+'%';C.text('rTtr',C.num(a.uniq/a.W*100,1)+'%');
  last='Statistiques du texte — calculatepilot.com/other/word-counter.html\n'+a.W+' mots, '+a.chars+' caractères ('+a.noSp+' sans espaces), '+a.sents+' phrases, '+a.paras+' paragraphes\nTemps de lecture '+fmtT(a.W/wpm)+' ; indice de facilité de lecture de Flesch '+C.num(a.fre,1)+' ('+b[0]+') ; niveau '+C.num(a.fk,1);
}
function title(s){return s.toLowerCase().replace(/(^|[\s\-–—(["'])([a-zÀ-ɏ])/g,function(m,p,c){return p+c.toUpperCase();});}
function sentence(s){return s.toLowerCase().replace(/(^\s*|[.!?]\s+|\n+\s*)([a-zÀ-ɏ])/g,function(m,p,c){return p+c.toUpperCase();});}
function fire(){$('txt').dispatchEvent(new Event('input',{bubbles:true}));}
function dl(name,mime,body){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:mime}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  $('txt').value=SAMPLE;
  C.init({root:'wcCalc',compute:compute});
  $('bSample').addEventListener('click',function(){$('txt').value=SAMPLE;fire();});
  $('bClear').addEventListener('click',function(){$('txt').value='';fire();$('txt').focus();});
  $('bCopy').addEventListener('click',function(){copy($('txt').value,'bCopyT','Copier le texte');});
  $('bTrim').addEventListener('click',function(){$('txt').value=$('txt').value.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();fire();});
  $('caseSel').addEventListener('change',function(){var v=this.value,t=$('txt').value;if(v==='up')t=t.toUpperCase();else if(v==='low')t=t.toLowerCase();else if(v==='title')t=title(t);else if(v==='sent')t=sentence(t);$('txt').value=t;this.value='';fire();});
  $('bJson').addEventListener('click',function(){if(!stats)return;var s=stats;dl('text-stats.json','application/json',JSON.stringify({words:s.W,characters:s.chars,charactersNoSpaces:s.noSp,sentences:s.sents,paragraphs:s.paras,uniqueWords:s.uniq,fleschReadingEase:+s.fre.toFixed(2),fleschKincaidGrade:+s.fk.toFixed(2),gunningFog:+s.fog.toFixed(2),colemanLiau:+s.cl.toFixed(2),ari:+s.ari.toFixed(2)},null,2));});
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){setTimeout(function(){$('txt').value=SAMPLE;fire();},0);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les statistiques');});
});
})();
