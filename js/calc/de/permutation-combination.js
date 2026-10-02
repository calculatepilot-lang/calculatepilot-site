/* Permutation & combination calculator — CalculatePilot (Stitch redesign).
   All arithmetic is exact (BigInt): C(n,r)=n!/(r!(n−r)!), P(n,r)=n!/(n−r)!, C(n+r−1,r), n^r. n, r ≤ 1000. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='';
var HELP={c:'Ungeordnete Auswahlen von r verschiedenen Elementen aus n. Jedes Element wird höchstens einmal verwendet.',p:'Geordnete Anordnungen von r verschiedenen Elementen aus n. Jedes Element wird höchstens einmal verwendet.',cr:'Ungeordnete Auswahlen von r Elementen aus n Typen, wobei derselbe Typ mehrfach gewählt werden darf (Multimengen).',pr:'Geordnete Folgen der Länge r, bei denen jede Position eines der n Symbole sein kann.'};

function fact(n){var c=1n,i;for(i=2n;i<=BigInt(n);i++)c*=i;return c;}
function perm(n,r){var c=1n,i;for(i=0;i<r;i++)c*=BigInt(n-i);return c;}
function comb(n,r){if(r<0||r>n)return 0n;var k=Math.min(r,n-r),c=1n,i;for(i=1;i<=k;i++)c=c*BigInt(n-k+i)/BigInt(i);return c;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function big(b){var s=b.toString();if(s.length<=18)return grp(s);return s[0]+'.'+s.slice(1,7)+' × 10^'+(s.length-1);}
function esc(s){return C.esc(s);}
function prodTxt(n,r){var a=[],i,m=Math.min(r,8);for(i=0;i<m;i++)a.push(n-i);var t=a.join(' × ');if(r>8)t+=' × … × '+(n-r+1);return t;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','one','digits','fn','fr','fnr'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('steps').innerHTML='';$('allTbl').tBodies[0].innerHTML='';last='';}

function compute(){
  var mode=$('mode').value,nr=v('n'),rr=v('r'),n=Math.round(nr),r=Math.round(rr),rep=mode==='cr'||mode==='pr';
  C.text('modeHelp',HELP[mode]);C.text('rH',rep?'0 bis 1.000 (darf n übersteigen)':'0 bis n');$('err').hidden=true;
  if(nr!==n||rr!==r||n<0||r<0)return fail('n und r müssen ganze Zahlen größer oder gleich null sein.');
  if(n>1000||r>1000)return fail('Dieser Rechner arbeitet mit n und r bis 1.000.');
  if(!rep&&r>n)return fail('Bei '+(mode==='c'?'combinations':'permutations')+' ohne Wiederholung darf r nicht größer als n sein ('+r+' > '+n+'). Wählen Sie „mit Wiederholung“ oder verringern Sie r.');
  if(mode==='cr'&&n===0&&r>0)return fail('Bei n = 0 Typen gibt es nichts zum Auswählen.');
  var res,lab,fx,tag,sentence,Ncr=n+r-1;
  if(mode==='c'){res=comb(n,r);lab='C('+n+', '+r+')';fx='C(n, r) = n! ÷ (r! × (n − r)!)';tag='Reihenfolge unerheblich';sentence='Es gibt '+big(res)+' Möglichkeiten, auszuwählen '+r+' Elemente aus '+n+' wenn die Reihenfolge keine Rolle spielt.';}
  else if(mode==='p'){res=perm(n,r);lab='P('+n+', '+r+')';fx='P(n, r) = n! ÷ (n − r)!';tag='Reihenfolge zählt';sentence='Es gibt '+big(res)+' geordnete Anordnungen von '+r+' Elementen, ausgewählt aus '+n+'.';}
  else if(mode==='cr'){res=comb(Ncr,r);lab='C('+n+' + '+r+' − 1, '+r+') = C('+Ncr+', '+r+')';fx='C(n + r − 1, r) = (n + r − 1)! ÷ (r! × (n − 1)!)';tag='Wiederholung erlaubt';sentence='Es gibt '+big(res)+' Multimengen der Größe '+r+' from '+n+' Typen.';}
  else{res=BigInt(n)**BigInt(r);lab=n+'^'+r;fx='n^r = n × n × … × n  (r-mal)';tag='Wiederholung erlaubt';sentence='Es gibt '+big(res)+' geordnete Folgen der Länge '+r+' from '+n+' Symbolen.';}
  var s=res.toString();
  C.text('heroLbl',lab);C.text('resultValue',big(res));C.text('interp',sentence);C.text('digits',s.length+' digit'+(s.length===1?'':'s'));
  C.text('oneLbl','Wahrscheinlichkeit für eine bestimmte '+(mode==='c'||mode==='cr'?'selection':'outcome'));C.text('one',res>0n?'1 in '+big(res):'impossible');
  C.text('fxNow',fx);var t=$('tag');t.textContent=tag;t.className='sx-ef-grade';
  C.text('fn',big(fact(n)));C.text('fr',big(fact(r)));C.text('fnr',r<=n?big(fact(n-r)):'n/a');
  /* all four for the same n, r */
  var rows=[['Kombinationen C(n, r)','n! ÷ (r!(n−r)!)',r<=n?comb(n,r):null,'c'],['Permutationen P(n, r)','n! ÷ (n−r)!',r<=n?perm(n,r):null,'p'],['Kombinationen mit Wiederholung','C(n+r−1, r)',(n>0||r===0)?comb(Ncr>=0?Ncr:0,r):null,'cr'],['Permutationen mit Wiederholung','n^r',BigInt(n)**BigInt(r),'pr']];
  $('allTbl').tBodies[0].innerHTML=rows.map(function(x){return '<tr'+(x[3]===mode?' class="act"':'')+'><td style="white-space:normal;font-family:inherit">'+esc(x[0])+(x[3]===mode?' <span class="act">ausgewählt</span>':'')+'</td><td class="mono" style="font-size:12px">'+esc(x[1])+'</td><td class="mono">'+(x[2]===null?'n/a':esc(big(x[2])))+'</td></tr>';}).join('');
  /* steps */
  var h='',m=0;function st(a,b,c2){m++;h+='<li><span class="n">'+m+'</span><h4>'+a+'</h4>'+(b?'<p>'+b+'</p>':'')+'<span class="eq">'+c2+'</span></li>';}
  function combSteps(N,k,name){
    var pp=perm(N,k),kf=fact(k),kk=k;
    st('Die Formel aufschreiben',"Die Werte einsetzen.",name+' = '+N+'! ÷ ('+k+'! × '+(N-k)+'!)');
    st('Kürzen Sie die '+(N-k)+'!-Terme','Alles von '+(N-k)+' abwärts kürzt sich zwischen Zähler und Nenner weg, übrig bleiben die ersten '+k+' Faktoren von '+N+'!.',N+'! ÷ '+(N-k)+'! = '+esc(kk===0?'1 (leeres Produkt)':prodTxt(N,k)));
    st('Die verbleibenden Faktoren multiplizieren','Dieses Teilprodukt ist die Anzahl der geordneten Anordnungen, P('+N+', '+k+').','P('+N+', '+k+') = <b>'+esc(big(pp))+'</b>');
    st('Teilen Sie durch '+k+'!','Entfernt die '+k+'! Anordnungen jeder Auswahl.',esc(big(pp))+' ÷ '+k+'! ('+esc(big(kf))+') = <b>'+esc(big(pp/kf))+'</b>');
  }
  if(mode==='c')combSteps(n,r,'C('+n+', '+r+')');
  else if(mode==='p'){
    st('Die Formel aufschreiben','Die Werte einsetzen.','P('+n+', '+r+') = '+n+'! ÷ ('+n+' − '+r+')! = '+n+'! ÷ '+(n-r)+'!');
    st('Kürzen Sie die '+(n-r)+'!-Terme','Nur die ersten '+r+' Faktoren von '+n+'! bleiben übrig.',esc(r===0?'1 (leeres Produkt)':prodTxt(n,r)));
    st('Multiplizieren','','P('+n+', '+r+') = <b>'+esc(big(res))+'</b>');
  }else if(mode==='cr'){
    st('In eine einfache Kombination umwandeln','„Stars and Bars“: r Elemente auf n Typen entspricht der Wahl von Positionen unter n + r − 1 Plätzen.','C('+n+' + '+r+' − 1, '+r+') = C('+Ncr+', '+r+')');
    combSteps(Ncr,r,'C('+Ncr+', '+r+')');
  }else{
    st('Eine unabhängige Wahl pro Position','Jede der '+r+' Positionen kann jedes der '+n+' Symbolen.',esc(r===0?'leere Folge = 1':(r<=8?Array(r).fill(n).join(' × '):n+' × '+n+' × … × '+n+' ('+r+' -mal)')));
    st('Multiplizieren','','<b>'+n+'^'+r+' = '+esc(big(res))+'</b>'+(n>1&&r>0?'<br>Bit Entropie = '+r+' × log₂('+n+') = '+(r*Math.log2(n)).toFixed(2):''));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Exakte Rechnung für '+lab+'.');C.text('stepsTag',mode==='c'||mode==='cr'?'Reihenfolge ignoriert':mode==='p'?'Reihenfolge zählt':'Reihenfolge zählt');
  last=s;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('n').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pcCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;C.set('mode',b.getAttribute('data-m'));C.set('n',b.getAttribute('data-n'));C.set('r',b.getAttribute('data-r'));fire();});
  $('swap').addEventListener('click',function(){var a=$('n').value;C.set('n',$('r').value);C.set('r',a);fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Exakten Wert kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
