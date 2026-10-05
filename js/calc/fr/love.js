/* Love calculator (entertainment) — CalculatePilot (Stitch redesign).
   Love percentage: counts of l,o,v,e,s in name1+"loves"+name2, adjacent digits added (two-digit sums split) until two digits remain.
   FLAMES: cancel shared letters, count the rest, eliminate letters of FLAMES cyclically. Love languages: static pairing tips. */
(function(){
var C=window.CPX,$=C.$,last='';
var LANG={words:'Paroles valorisantes',time:'Moments de qualité',acts:'Services rendus',touch:'Toucher physique',gifts:'Cadeaux reçus'};
var GIVE={words:'le dire à voix haute : remercier, complimenter des choses précises, envoyer des messages gentils',time:'accorder une attention exclusive : prévoir du temps ensemble, téléphones rangés',acts:'les soulager d\'une tâche sans qu\'on le leur demande',touch:'offrir des câlins, se tenir la main, être proche',gifts:'faire de petits cadeaux attentionnés qui montrent que vous pensiez à eux'};
var FL={F:'Amis',L:'Amour',A:'Affection',M:'Mariage',E:'Ennemis',S:'Frères et sœurs'};
function letters(s){return (s||'').toLowerCase().replace(/[^a-zÀ-ɏ]/g,'');}
function lovePct(a,b){var s=letters(a)+'loves'+letters(b),d='',steps,i;'loves'.split('').forEach(function(c){var n=0;for(i=0;i<s.length;i++)if(s.charAt(i)===c)n++;d+=n;});steps=[d];var it=0;
  while(d.length>2&&it<12){var nd='';for(i=0;i<d.length-1;i++)nd+=(+d.charAt(i))+(+d.charAt(i+1));d=nd;steps.push(d);it++;}
  while(d.length>2){var nd2='';for(i=0;i<d.length-1;i++)nd2+=((+d.charAt(i))+(+d.charAt(i+1)))%10;d=nd2;steps.push(d);}
  return {pct:parseInt(d,10),steps:steps,counts:steps[0]};}
function flames(a,b){var x=letters(a).split(''),y=letters(b).split(''),i;x.slice().forEach(function(c){var j=y.indexOf(c);if(j>=0){x.splice(x.indexOf(c),1);y.splice(j,1);}});
  var n=x.length+y.length,L='FLAMES'.split(''),idx=0,order=[];if(n===0)return {n:0,res:null};
  while(L.length>1){idx=(idx+n-1)%L.length;order.push(L.splice(idx,1)[0]);}
  return {n:n,res:L[0],order:order,left:x.join('')+y.join('')};}
function band(p){return p>=85?'Match parfait':p>=65?'Très bon match':p>=40?'De bonnes chances':p>=20?'Une marge de progression':'Juste des amis ?';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('wk','—');last='';}
function compute(){
  var mode=$('mode').value;$('err').hidden=true;$('gNames').hidden=mode==='lang';$('gLang').hidden=mode!=='lang';
  if(mode==='lang'){
    var a=$('l1').value,b=$('l2').value;
    C.text('hL','Langages de l\'amour');C.text('resultValue',a===b?'Même langage':'Langages différents');C.text('tag',LANG[a]+' + '+LANG[b]);
    C.text('interp',a===b?'Vous accordez tous deux de la valeur à '+LANG[a].toLowerCase()+'. Lean into it and check in on what that means for each of you.':'Chacun de vous se sent aimé d\'une manière différente ; il est donc utile de dire ce qui fonctionne.');
    C.text('wkH','Idées');C.text('wk','Le partenaire 1 montre son amour au partenaire 2 (qui préfère '+LANG[b].toLowerCase()+'): '+GIVE[b]+'. Partner 2 shows love to Partner 1 (who prefers '+LANG[a].toLowerCase()+'): '+GIVE[a]+'.');
    C.text('note','Les langages de l\'amour sont un point de départ pour échanger. Les recherches ne montrent pas que les faire correspondre permette de prédire des relations plus heureuses.');
    last='Langages de l\'amour — calculatepilot.com/other/love-calculator.html\n'+LANG[a]+' and '+LANG[b];return;}
  var n1=letters($('n1').value),n2=letters($('n2').value);
  if(!n1||!n2)return fail('Saisissez deux prénoms.');
  C.text('wkH','Comment le résultat a été obtenu');
  if(mode==='love'){var r=lovePct($('n1').value,$('n2').value);
    C.text('hL','Pourcentage d\'amour');C.text('resultValue',r.pct+'%');C.text('tag',band(r.pct));C.text('interp',$('n1').value.trim()+' and '+$('n2').value.trim()+'.');
    C.text('wk','Nombre de L, O, V, E, S : '+r.counts.split('').join(' ')+'. Adding neighbours: '+(r.steps.length>7?r.steps.slice(1,6).map(function(s){return s.split('').join(' ');}).join(' → ')+' → … ':r.steps.slice(1).map(function(s){return s.split('').join(' ');}).join(' → '))+' → '+r.pct+'.');
    C.text('note','Ceci est un jeu de divertissement basé sur les lettres des prénoms. Il ne peut ni mesurer ni prédire une vraie relation.');
    last='Calculateur d\'amour — calculatepilot.com/other/love-calculator.html\n'+$('n1').value.trim()+' + '+$('n2').value.trim()+': '+r.pct+'% ('+band(r.pct)+')';}
  else{var f=flames($('n1').value,$('n2').value);
    if(f.n===0){C.text('hL','FLAMES');C.text('resultValue','—');C.text('tag','prénoms identiques');C.text('interp','Toutes les lettres se sont annulées, FLAMES n\'a donc rien à compter.');C.text('wk','Essayez deux prénoms différents.');return;}
    C.text('hL','FLAMES');C.text('resultValue',FL[f.res]);C.text('tag',f.res);C.text('interp',$('n1').value.trim()+' and '+$('n2').value.trim()+'.');
    C.text('wk','Lettres restantes après avoir barré les lettres communes : '+f.left+' ('+f.n+'). On compte '+f.n+' à chaque fois, éliminées : '+f.order.map(function(c){return c+' ('+FL[c]+')';}).join(', ')+'. Left: '+f.res+'.');
    C.text('note','FLAMES est un jeu d\'enfants. Ce n\'est pas une prédiction.');
    last='FLAMES — calculatepilot.com/other/love-calculator.html\n'+$('n1').value.trim()+' + '+$('n2').value.trim()+': '+FL[f.res];}
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'lvCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
