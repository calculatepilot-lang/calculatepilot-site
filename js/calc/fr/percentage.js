/* Percentage calculator — CalculatePilot (Stitch redesign).
   s1: Y = P/100 × X · s2: % = X/Y × 100 · s3: change % = (new − old)/|old| × 100 · s4: original = final ÷ (1 ± r/100). */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='';

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function frac(x){/* reduce x/100-style decimals to a fraction, up to 6 decimal places */
  if(!isFinite(x))return '—';var s=1,k=0;while(k<6&&Math.abs(x*s-Math.round(x*s))>1e-9*Math.max(1,Math.abs(x*s))){s*=10;k++;}
  var n=Math.round(x*s),d=s,g=gcd(n,d)||1;n/=g;d/=g;return d===1?String(n):n+' / '+d;}
function fx(x,dp){return isFinite(x)?M.fix(x,dp):'—';}
function sgn(x){return x>0?'+':x<0?'−':'';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:18px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function bar(parts,title,note,labels){$('barT').textContent=title;C.text('barN',note);$('bar').innerHTML=parts.map(function(p){return '<span style="width:'+Math.max(0,Math.min(100,p[0])).toFixed(2)+'%;background:'+p[1]+'"></span>';}).join('');$('barL').innerHTML=labels.map(function(l){return '<span>'+esc(l)+'</span>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('bar').innerHTML='';$('barL').innerHTML='';last='';}

function compute(){
  var m=$('mode').value,a=v('a'),b=v('b'),dp=+$('dp').value,dirDec=$('dir').value==='s2';
  $('fDir').hidden=m!=='s4';$('presets').hidden=m!=='s1';
  var L={s1:['Taux de pourcentage (P)','percent','Valeur de base (X)','n\'importe quel nombre','Combien vaut P % de X ?','Y = (P ÷ 100) × X'],s2:['Partie (X)','le montant','Tout (Y)','le total, pas 0','X représente quel pourcentage de Y ?','% = (X ÷ Y) × 100'],s3:['Ancienne valeur','valeur de départ, pas 0','Nouvelle valeur','valeur d\'arrivée','Variation en pourcentage de l\'ancienne à la nouvelle valeur','% de variation = (nouvelle − ancienne) ÷ |ancienne| × 100'],s4:['Valeur finale','après la variation','Variation en pourcentage appliquée','percent','Retrouver la valeur d\'origine','origine = finale ÷ (1 ± taux ÷ 100)']}[m];
  C.text('aL',L[0]);C.text('aH',L[1]);C.text('bL',L[2]);C.text('bH',L[3]);C.text('formH',L[4]);C.text('fxNow',L[5]);
  $('err').hidden=true;var h='',n=0;function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,8));},res,tg='',sum='';
  if($('a').value===''||$('b').value==='')return fail('Saisissez les deux valeurs.');
  var t=$('tag');t.className='sx-ef-grade';
  if(m==='s1'){
    var r=a/100;res=r*b;
    C.text('heroLbl',M.fmt(a,6)+'% de '+M.fmt(b,6));C.text('resultValue',fx(res,dp));C.text('interp',M.fmt(a,6)+'% de '+M.fmt(b,6)+' is '+fx(res,dp)+'.');t.textContent='Exact';
    tiles([['Multiplicateur décimal',M.fmt(r,8),'P ÷ 100'],['Fraction',frac(r),'sous forme irréductible'],['Base − P %',fx(b-res,dp),'ce qui reste'],['Base + P %',fx(b+res,dp),'la base plus la part']]);
    var pc=Math.max(0,Math.min(100,a));bar([[pc,'var(--sx-pc)']],'Part-to-whole','base = 100 %',['0%',M.fmt(a,4)+'% = '+fx(res,dp),'100% = '+M.fmt(b,6)]);$('barCard').hidden=false;
    st('Convertir le pourcentage en décimal','Divisez par 100.','r = '+f(a)+' ÷ 100 = <b>'+f(r)+'</b>');
    st('Multiplier par la base','Mettez la base à l\'échelle de cette fraction.','Y = '+f(r)+' × '+f(b)+' = <b>'+f(res)+'</b>');
    st('Contrôle','Faites la division inverse pour retrouver le pourcentage.',f(res)+' ÷ '+f(b)+' × 100 = '+(b!==0?f(res/b*100)+'%':'n/a'));
    sum=M.fmt(a,6)+'% de '+M.fmt(b,6)+' = '+fx(res,dp);
  }else if(m==='s2'){
    if(b===0)return fail('Le tout (Y) ne peut pas être 0 — un pourcentage de zéro est indéfini.');
    res=a/b*100;C.text('heroLbl',M.fmt(a,6)+' en pourcentage de '+M.fmt(b,6));C.text('resultValue',fx(res,dp)+'%');C.text('interp',M.fmt(a,6)+' is '+fx(res,dp)+'% de '+M.fmt(b,6)+'.');t.textContent=res>100?'Plus que le tout':'Partie du tout';
    tiles([['Rapport décimal',M.fmt(a/b,8),'X ÷ Y'],['Fraction',(Number.isInteger(a)&&Number.isInteger(b))?frac(a/b):frac(a/b),'sous forme irréductible'],['% restant',fx(100-res,dp)+'%','100 % − résultat'],['Y en pourcentage de X',a!==0?fx(b/a*100,dp)+'%':'n/a','la question inverse']]);
    bar([[Math.min(100,res),'var(--sx-pc)']],'Part-to-whole','tout = 100 %',['0%',fx(res,2)+'%'+(res>100?' (dépasse le tout)':''),'100% = '+M.fmt(b,6)]);$('barCard').hidden=false;
    st('Diviser la partie par le tout','Donne la partie sous forme de fraction du tout.','X ÷ Y = '+f(a)+' ÷ '+f(b)+' = <b>'+f(a/b)+'</b>');
    st('Multiplier par 100','Convertit la fraction en pourcentage.','% = '+f(a/b)+' × 100 = <b>'+f(res)+'%</b>');
    sum=M.fmt(a,6)+' is '+fx(res,dp)+'% de '+M.fmt(b,6);
  }else if(m==='s3'){
    if(a===0)return fail('L\'ancienne valeur ne peut pas être 0 — une variation en pourcentage à partir de zéro est indéfinie. Indiquez plutôt la variation absolue.');
    var d=b-a;res=d/Math.abs(a)*100;C.text('heroLbl','Variation de '+M.fmt(a,6)+' to '+M.fmt(b,6));C.text('resultValue',sgn(res)+fx(Math.abs(res),dp)+'%');
    C.text('interp','La valeur '+(d>0?'increased':d<0?'decreased':'n\'a pas changé')+' by '+fx(Math.abs(d),dp)+', soit '+fx(Math.abs(res),dp)+'% de l\'ancienne valeur.');
    t.textContent=d>0?'Hausse':d<0?'Baisse':'Aucun changement';t.className='sx-ef-grade'+(d<0?' mid':'');
    var back=b!==0?(a-b)/Math.abs(b)*100:NaN;
    tiles([['Variation absolue',sgn(d)+fx(Math.abs(d),dp),'nouvelle − ancienne'],['Multiplicateur',M.fmt(b/a,8),'nouvelle ÷ ancienne'],['Pour annuler la variation',isFinite(back)?sgn(back)+fx(Math.abs(back),dp)+'%':'n/a','pourcentage nécessaire pour revenir à l\'ancienne valeur'],['Sous forme de fraction',frac(d/Math.abs(a)),'variation ÷ ancienne']]);
    var mx=Math.max(Math.abs(a),Math.abs(b))||1;bar([[Math.abs(b)/mx*100,d>=0?'var(--sx-pc)':'#d97706']],'Nouvelle valeur par rapport à la plus grande des deux','ancienne = '+M.fmt(a,6)+' · nouvelle = '+M.fmt(b,6),['0',M.fmt(b,6)+' (new)',M.fmt(mx,6)]);$('barCard').hidden=false;
    st('Calculer la variation','Soustrayez l\'ancienne valeur de la nouvelle valeur.','Δ = nouvelle − ancienne = '+f(b)+' − '+f(a)+' = <b>'+f(d)+'</b>');
    st('Diviser par l\'ancienne valeur','L\'ancienne valeur est la base de la variation en pourcentage.','Δ ÷ |ancienne| = '+f(d)+' ÷ '+f(Math.abs(a))+' = <b>'+f(d/Math.abs(a))+'</b>');
    st('Multiplier par 100','','% de variation = <b>'+sgn(res)+f(Math.abs(res))+'%</b>');
    if(isFinite(back)&&d!==0)st('Annuler la variation','La base est maintenant la nouvelle valeur, le pourcentage inverse est donc différent.','('+f(a)+' − '+f(b)+') ÷ |'+f(b)+'| × 100 = <b>'+sgn(back)+f(Math.abs(back))+'%</b>');
    sum='Variation de '+M.fmt(a,6)+' to '+M.fmt(b,6)+' = '+sgn(res)+fx(Math.abs(res),dp)+'%';
  }else{
    var rate=b/100,fac=dirDec?1-rate:1+rate;if(fac===0)return fail('A '+M.fmt(b,4)+'% de baisse ne laisse rien, la valeur d\'origine ne peut donc pas être retrouvée.');
    res=a/fac;C.text('heroLbl','Valeur d\'origine avant la '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase'));C.text('resultValue',fx(res,dp));
    C.text('interp','Une valeur de '+M.fmt(a,6)+' après une '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase')+' était partie de '+fx(res,dp)+'.');t.textContent=dirDec?'Après une baisse':'Après une hausse';
    tiles([['Facteur de croissance',M.fmt(fac,8),dirDec?'1 − taux':'1 + taux'],['Montant de la variation',sgn(a-res)+fx(Math.abs(a-res),dp),'finale − origine'],['Contrôle',fx(res*fac,dp),'origine × facteur = finale'],['Faux raccourci',fx(a*(dirDec?1+rate:1-rate),dp),'annuler le % sur la valeur finale n\'est pas correct']]);
    $('barCard').hidden=true;$('bar').innerHTML='';$('barL').innerHTML='';
    st('Écrire la relation directe','A '+(dirDec?'decrease':'increase')+' multiplie la valeur d\'origine par un facteur de croissance.','finale = origine × (1 '+(dirDec?'−':'+')+' '+f(rate)+') = origine × '+f(fac));
    st('Résoudre pour la valeur d\'origine','Divisez la valeur finale par le facteur.','origine = '+f(a)+' ÷ '+f(fac)+' = <b>'+f(res)+'</b>');
    st('Contrôle','Appliquez la variation à la valeur d\'origine.',f(res)+' × '+f(fac)+' = '+f(res*fac));
    sum='Origine = '+fx(res,dp)+' (final '+M.fmt(a,6)+' after '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase')+')';
  }
  if(m!=='s4'&&m!=='s3'&&m!=='s2'&&m!=='s1')$('barCard').hidden=true;
  $('steps').innerHTML=h;C.text('stepsIntro',L[4]);C.text('stepsTag',L[5]);last=sum;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pgCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('a',b.getAttribute('data-v'));$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('swap').addEventListener('click',function(){var x=$('a').value;C.set('a',$('b').value);C.set('b',x);$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier l\'équation');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
