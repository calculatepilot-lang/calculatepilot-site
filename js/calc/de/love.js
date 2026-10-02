/* Love calculator (entertainment) — CalculatePilot (Stitch redesign).
   Love percentage: counts of l,o,v,e,s in name1+"loves"+name2, adjacent digits added (two-digit sums split) until two digits remain.
   FLAMES: cancel shared letters, count the rest, eliminate letters of FLAMES cyclically. Love languages: static pairing tips. */
(function(){
var C=window.CPX,$=C.$,last='';
var LANG={words:'Lob und Anerkennung',time:'Gemeinsame Zeit',acts:'Hilfsbereitschaft',touch:'Körperliche Berührung',gifts:'Geschenke erhalten'};
var GIVE={words:'sagen Sie es laut: danken Sie, loben Sie konkrete Dinge, schicken Sie liebevolle Nachrichten',time:'schenken Sie ungeteilte Aufmerksamkeit: planen Sie gemeinsame Zeit ohne Handys',acts:'nehmen Sie ihm oder ihr eine Aufgabe ab, ohne darum gebeten zu werden',touch:'bieten Sie Umarmungen, Händchenhalten und Nähe',gifts:'machen Sie kleine, durchdachte Geschenke, die zeigen, dass Sie an die Person gedacht haben'};
var FL={F:'Freunde',L:'Liebe',A:'Zuneigung',M:'Ehe',E:'Feinde',S:'Geschwister'};
function letters(s){return (s||'').toLowerCase().replace(/[^a-zÀ-ɏ]/g,'');}
function lovePct(a,b){var s=letters(a)+'loves'+letters(b),d='',steps,i;'loves'.split('').forEach(function(c){var n=0;for(i=0;i<s.length;i++)if(s.charAt(i)===c)n++;d+=n;});steps=[d];var it=0;
  while(d.length>2&&it<12){var nd='';for(i=0;i<d.length-1;i++)nd+=(+d.charAt(i))+(+d.charAt(i+1));d=nd;steps.push(d);it++;}
  while(d.length>2){var nd2='';for(i=0;i<d.length-1;i++)nd2+=((+d.charAt(i))+(+d.charAt(i+1)))%10;d=nd2;steps.push(d);}
  return {pct:parseInt(d,10),steps:steps,counts:steps[0]};}
function flames(a,b){var x=letters(a).split(''),y=letters(b).split(''),i;x.slice().forEach(function(c){var j=y.indexOf(c);if(j>=0){x.splice(x.indexOf(c),1);y.splice(j,1);}});
  var n=x.length+y.length,L='FLAMES'.split(''),idx=0,order=[];if(n===0)return {n:0,res:null};
  while(L.length>1){idx=(idx+n-1)%L.length;order.push(L.splice(idx,1)[0]);}
  return {n:n,res:L[0],order:order,left:x.join('')+y.join('')};}
function band(p){return p>=85?'Perfekte Übereinstimmung':p>=65?'Sehr gute Übereinstimmung':p>=40?'Gute Chancen':p>=20?'Luft nach oben':'Nur Freunde?';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('wk','—');last='';}
function compute(){
  var mode=$('mode').value;$('err').hidden=true;$('gNames').hidden=mode==='lang';$('gLang').hidden=mode!=='lang';
  if(mode==='lang'){
    var a=$('l1').value,b=$('l2').value;
    C.text('hL','Liebessprachen');C.text('resultValue',a===b?'Gleiche Sprache':'Unterschiedliche Sprachen');C.text('tag',LANG[a]+' + '+LANG[b]);
    C.text('interp',a===b?'Ihnen beiden ist wichtig: '+LANG[a].toLowerCase()+'. Lean into it and check in on what that means for each of you.':'Sie fühlen sich jeweils auf unterschiedliche Weise umsorgt, deshalb hilft es, auszusprechen, was funktioniert.');
    C.text('wkH','Ideen');C.text('wk','Partner 1 zeigt Partner 2 Liebe (der bevorzugt: '+LANG[b].toLowerCase()+'): '+GIVE[b]+'. Partner 2 shows love to Partner 1 (who prefers '+LANG[a].toLowerCase()+'): '+GIVE[a]+'.');
    C.text('note','Liebessprachen sind ein Gesprächsanstoß. Die Forschung zeigt nicht, dass übereinstimmende Liebessprachen glücklichere Beziehungen vorhersagen.');
    last='Liebessprachen — calculatepilot.com/other/love-calculator.html\n'+LANG[a]+' and '+LANG[b];return;}
  var n1=letters($('n1').value),n2=letters($('n2').value);
  if(!n1||!n2)return fail('Geben Sie zwei Namen ein.');
  C.text('wkH','So wurde es berechnet');
  if(mode==='love'){var r=lovePct($('n1').value,$('n2').value);
    C.text('hL','Liebesprozentsatz');C.text('resultValue',r.pct+'%');C.text('tag',band(r.pct));C.text('interp',$('n1').value.trim()+' and '+$('n2').value.trim()+'.');
    C.text('wk','Anzahl von L, O, V, E, S: '+r.counts.split('').join(' ')+'. Adding neighbours: '+(r.steps.length>7?r.steps.slice(1,6).map(function(s){return s.split('').join(' ');}).join(' → ')+' → … ':r.steps.slice(1).map(function(s){return s.split('').join(' ');}).join(' → '))+' → '+r.pct+'.');
    C.text('note','Dies ist ein Unterhaltungsspiel auf Basis der Buchstaben in Namen. Es kann eine echte Beziehung weder messen noch vorhersagen.');
    last='Liebesrechner — calculatepilot.com/other/love-calculator.html\n'+$('n1').value.trim()+' + '+$('n2').value.trim()+': '+r.pct+'% ('+band(r.pct)+')';}
  else{var f=flames($('n1').value,$('n2').value);
    if(f.n===0){C.text('hL','FLAMES');C.text('resultValue','—');C.text('tag','identische Namen');C.text('interp','Alle Buchstaben haben sich aufgehoben, daher gibt es bei FLAMES nichts zu zählen.');C.text('wk','Versuchen Sie es mit zwei verschiedenen Namen.');return;}
    C.text('hL','FLAMES');C.text('resultValue',FL[f.res]);C.text('tag',f.res);C.text('interp',$('n1').value.trim()+' and '+$('n2').value.trim()+'.');
    C.text('wk','Übrige Buchstaben nach dem Streichen gemeinsamer Buchstaben: '+f.left+' ('+f.n+'). Gezählt wird '+f.n+' jeweils, ausgeschieden: '+f.order.map(function(c){return c+' ('+FL[c]+')';}).join(', ')+'. Left: '+f.res+'.');
    C.text('note','FLAMES ist ein Spiel für den Schulhof. Es ist keine Vorhersage.');
    last='FLAMES — calculatepilot.com/other/love-calculator.html\n'+$('n1').value.trim()+' + '+$('n2').value.trim()+': '+FL[f.res];}
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'lvCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
