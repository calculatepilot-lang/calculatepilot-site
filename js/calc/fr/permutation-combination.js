/* Permutation & combination calculator — CalculatePilot (Stitch redesign).
   All arithmetic is exact (BigInt): C(n,r)=n!/(r!(n−r)!), P(n,r)=n!/(n−r)!, C(n+r−1,r), n^r. n, r ≤ 1000. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='';
var HELP={c:'Sélections non ordonnées de r éléments distincts parmi n. Chaque élément est utilisé au plus une fois.',p:'Arrangements ordonnés de r éléments distincts parmi n. Chaque élément est utilisé au plus une fois.',cr:'Sélections non ordonnées de r éléments parmi n types, où un même type peut être choisi plusieurs fois (multi-ensembles).',pr:'Séquences ordonnées de longueur r où chaque position peut être n\'importe lequel des n symboles.'};

function fact(n){var c=1n,i;for(i=2n;i<=BigInt(n);i++)c*=i;return c;}
function perm(n,r){var c=1n,i;for(i=0;i<r;i++)c*=BigInt(n-i);return c;}
function comb(n,r){if(r<0||r>n)return 0n;var k=Math.min(r,n-r),c=1n,i;for(i=1;i<=k;i++)c=c*BigInt(n-k+i)/BigInt(i);return c;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function big(b){var s=b.toString();if(s.length<=18)return grp(s);return s[0]+'.'+s.slice(1,7)+' × 10^'+(s.length-1);}
function esc(s){return C.esc(s);}
function prodTxt(n,r){var a=[],i,m=Math.min(r,8);for(i=0;i<m;i++)a.push(n-i);var t=a.join(' × ');if(r>8)t+=' × … × '+(n-r+1);return t;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','one','digits','fn','fr','fnr'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('steps').innerHTML='';$('allTbl').tBodies[0].innerHTML='';last='';}

function compute(){
  var mode=$('mode').value,nr=v('n'),rr=v('r'),n=Math.round(nr),r=Math.round(rr),rep=mode==='cr'||mode==='pr';
  C.text('modeHelp',HELP[mode]);C.text('rH',rep?'0 à 1 000 (peut dépasser n)':'0 à n');$('err').hidden=true;
  if(nr!==n||rr!==r||n<0||r<0)return fail('n et r doivent être des nombres entiers, supérieurs ou égaux à zéro.');
  if(n>1000||r>1000)return fail('Cette calculatrice fonctionne avec n et r jusqu\'à 1 000.');
  if(!rep&&r>n)return fail('Pour '+(mode==='c'?'combinations':'permutations')+' sans répétition, r ne peut pas être supérieur à n ('+r+' > '+n+'). Choisissez « avec répétition » ou réduisez r.');
  if(mode==='cr'&&n===0&&r>0)return fail('Avec n = 0 type, il n\'y a rien à choisir.');
  var res,lab,fx,tag,sentence,Ncr=n+r-1;
  if(mode==='c'){res=comb(n,r);lab='C('+n+', '+r+')';fx='C(n, r) = n! ÷ (r! × (n − r)!)';tag='Ordre sans importance';sentence='Il existe '+big(res)+' façons de choisir '+r+' éléments parmi '+n+' lorsque l\'ordre n\'a pas d\'importance.';}
  else if(mode==='p'){res=perm(n,r);lab='P('+n+', '+r+')';fx='P(n, r) = n! ÷ (n − r)!';tag='L\'ordre compte';sentence='Il existe '+big(res)+' arrangements ordonnés de '+r+' éléments choisis parmi '+n+'.';}
  else if(mode==='cr'){res=comb(Ncr,r);lab='C('+n+' + '+r+' − 1, '+r+') = C('+Ncr+', '+r+')';fx='C(n + r − 1, r) = (n + r − 1)! ÷ (r! × (n − 1)!)';tag='Répétition autorisée';sentence='Il existe '+big(res)+' multi-ensembles de taille '+r+' from '+n+' types.';}
  else{res=BigInt(n)**BigInt(r);lab=n+'^'+r;fx='n^r = n × n × … × n  (r fois)';tag='Répétition autorisée';sentence='Il existe '+big(res)+' séquences ordonnées de longueur '+r+' from '+n+' symboles.';}
  var s=res.toString();
  C.text('heroLbl',lab);C.text('resultValue',big(res));C.text('interp',sentence);C.text('digits',s.length+' digit'+(s.length===1?'':'s'));
  C.text('oneLbl','Probabilité d\'un(e) '+(mode==='c'||mode==='cr'?'selection':'outcome'));C.text('one',res>0n?'1 sur '+big(res):'impossible');
  C.text('fxNow',fx);var t=$('tag');t.textContent=tag;t.className='sx-ef-grade';
  C.text('fn',big(fact(n)));C.text('fr',big(fact(r)));C.text('fnr',r<=n?big(fact(n-r)):'n/a');
  /* all four for the same n, r */
  var rows=[['Combinaisons C(n, r)','n! ÷ (r!(n−r)!)',r<=n?comb(n,r):null,'c'],['Permutations P(n, r)','n! ÷ (n−r)!',r<=n?perm(n,r):null,'p'],['Combinaisons avec répétition','C(n+r−1, r)',(n>0||r===0)?comb(Ncr>=0?Ncr:0,r):null,'cr'],['Permutations avec répétition','n^r',BigInt(n)**BigInt(r),'pr']];
  $('allTbl').tBodies[0].innerHTML=rows.map(function(x){return '<tr'+(x[3]===mode?' class="act"':'')+'><td style="white-space:normal;font-family:inherit">'+esc(x[0])+(x[3]===mode?' <span class="act">sélectionnés</span>':'')+'</td><td class="mono" style="font-size:12px">'+esc(x[1])+'</td><td class="mono">'+(x[2]===null?'n/a':esc(big(x[2])))+'</td></tr>';}).join('');
  /* steps */
  var h='',m=0;function st(a,b,c2){m++;h+='<li><span class="n">'+m+'</span><h4>'+a+'</h4>'+(b?'<p>'+b+'</p>':'')+'<span class="eq">'+c2+'</span></li>';}
  function combSteps(N,k,name){
    var pp=perm(N,k),kf=fact(k),kk=k;
    st('Écrire la formule',"Remplacez par les valeurs.",name+' = '+N+'! ÷ ('+k+'! × '+(N-k)+'!)');
    st('Simplifier les '+(N-k)+'! termes','Tout ce qui va de '+(N-k)+' vers le bas se simplifie entre le numérateur et le dénominateur, ne laissant que les premiers '+k+' facteurs de '+N+'!.',N+'! ÷ '+(N-k)+'! = '+esc(kk===0?'1 (produit vide)':prodTxt(N,k)));
    st('Multiplier les facteurs restants','Ce produit partiel correspond au nombre d\'arrangements ordonnés, P('+N+', '+k+').','P('+N+', '+k+') = <b>'+esc(big(pp))+'</b>');
    st('Divisez par '+k+'!','Supprime les '+k+'! ordres de chaque sélection.',esc(big(pp))+' ÷ '+k+'! ('+esc(big(kf))+') = <b>'+esc(big(pp/kf))+'</b>');
  }
  if(mode==='c')combSteps(n,r,'C('+n+', '+r+')');
  else if(mode==='p'){
    st('Écrire la formule','Remplacez par les valeurs.','P('+n+', '+r+') = '+n+'! ÷ ('+n+' − '+r+')! = '+n+'! ÷ '+(n-r)+'!');
    st('Simplifier les '+(n-r)+'! termes','Seuls les '+r+' facteurs de '+n+'! subsistent.',esc(r===0?'1 (produit vide)':prodTxt(n,r)));
    st('Multiplier','','P('+n+', '+r+') = <b>'+esc(big(res))+'</b>');
  }else if(mode==='cr'){
    st('Convertir en combinaison simple','« Étoiles et barres » : r éléments répartis en n types correspond au choix de positions parmi n + r − 1 emplacements.','C('+n+' + '+r+' − 1, '+r+') = C('+Ncr+', '+r+')');
    combSteps(Ncr,r,'C('+Ncr+', '+r+')');
  }else{
    st('Un choix indépendant par position','Chacune des '+r+' positions peut être n\'importe lequel des '+n+' symboles.',esc(r===0?'séquence vide = 1':(r<=8?Array(r).fill(n).join(' × '):n+' × '+n+' × … × '+n+' ('+r+' fois)')));
    st('Multiplier','','<b>'+n+'^'+r+' = '+esc(big(res))+'</b>'+(n>1&&r>0?'<br>bits d\'entropie = '+r+' × log₂('+n+') = '+(r*Math.log2(n)).toFixed(2):''));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Calcul exact pour '+lab+'.');C.text('stepsTag',mode==='c'||mode==='cr'?'ordre ignoré':mode==='p'?'l\'ordre compte':'l\'ordre compte');
  last=s;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('n').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pcCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;C.set('mode',b.getAttribute('data-m'));C.set('n',b.getAttribute('data-n'));C.set('r',b.getAttribute('data-r'));fire();});
  $('swap').addEventListener('click',function(){var a=$('n').value;C.set('n',$('r').value);C.set('r',a);fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier la valeur exacte');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
