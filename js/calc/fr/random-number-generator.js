/* Random number generator — CalculatePilot (Stitch redesign).
   Integer/Float/Gaussian use crypto.getRandomValues (CSPRNG). Gaussian uses the Box–Muller transform.
   Seeded mode uses mulberry32, a small deterministic PRNG — same seed always reproduces the same sequence. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function fx(x,dp){dp=dp===undefined?4:dp;if(Math.abs(x-Math.round(x))<1e-9)return String(Math.round(x));return x.toFixed(dp).replace(/0+$/,'').replace(/[.,]$/,'');}
function cryptoUint32(){var a=new Uint32Array(1);(window.crypto||window.msCrypto).getRandomValues(a);return a[0];}
function cryptoFloat(){ /* [0,1) with 53 bits of entropy */ var hi=cryptoUint32()>>>5,lo=cryptoUint32()>>>6;return (hi*67108864+lo)/9007199254740992;}
function cryptoInt(min,max){ /* inclusive, unbiased via rejection sampling */
  var range=max-min+1,bits=Math.ceil(Math.log2(range)),max32=Math.pow(2,bits);
  var v;do{v=cryptoUint32()%max32;}while(v>=Math.floor(max32/range)*range&&max32%range!==0);
  return min+(v%range);
}
function mulberry32(seed){var t=seed>>>0;return function(){t|=0;t=t+0x6D2B79F5|0;var r=Math.imul(t^t>>>15,1|t);r=r+Math.imul(r^r>>>7,61|r)^r;return ((r^r>>>14)>>>0)/4294967296;};}
function seedFromStr(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function plotStrip(vals,lo,hi){
  var W=760,H=100,pad=40;
  var kx=(W-2*pad)/((hi-lo)||1),X=function(x){return pad+(x-lo)*kx;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="55" y2="55" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  vals.forEach(function(v){var x=X(Math.max(lo,Math.min(hi,v)));s+='<circle cx="'+x.toFixed(1)+'" cy="55" r="5" fill="var(--sx-primary)" opacity="0.75"/>';});
  s+='<text class="ax" x="'+pad+'" y="80" text-anchor="start">'+esc(fx(lo,3))+'</text><text class="ax" x="'+(W-pad)+'" y="80" text-anchor="end">'+esc(fx(hi,3))+'</text>';
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fInt').hidden=(m!=='s1');$('fGauss').hidden=(m!=='s3');$('fSeed').hidden=(m!=='s4');$('fUniq').hidden=(m!=='s1');
  var labels={s1:'Entiers aléatoires',s2:'Décimaux aléatoires [0, 1)',s3:'Valeurs gaussiennes (normales)',s4:'Suite reproductible avec graine'};
  C.html('formH',labels[m]);
  var n=parseInt($('n').value,10);
  if(!isFinite(n)||n<1||n>1000)return fail('n doit être un entier de 1 à 1000.');
  var sortOrder=$('sortOrder').value;
  var vals=[],lo,hi;

  if(m==='s1'){
    lo=parseInt($('lo').value,10);hi=parseInt($('hi').value,10);
    if(!isFinite(lo)||!isFinite(hi)||hi<lo)return fail('Le maximum doit être ≥ au minimum, tous deux entiers.');
    var uniq=$('uniq').checked,range=hi-lo+1;
    if(uniq&&n>range)return fail('Impossible de tirer '+n+' valeurs uniques dans une plage de seulement '+range+'.');
    if(uniq){
      var pool=[];for(var i=lo;i<=hi;i++)pool.push(i);
      for(i=pool.length-1;i>0;i--){var j=cryptoInt(0,i);var t=pool[i];pool[i]=pool[j];pool[j]=t;}
      vals=pool.slice(0,n);
    }else{for(i=0;i<n;i++)vals.push(cryptoInt(lo,hi));}
    C.html('fxNow','n='+n+' integer'+(n===1?'':'s')+' dans ['+lo+', '+hi+'], '+(uniq?'sans doublons':'doublons autorisés'));
  }else if(m==='s2'){
    lo=0;hi=1;for(var i2=0;i2<n;i2++)vals.push(cryptoFloat());
    C.html('fxNow','n='+n+' float'+(n===1?'':'s')+' dans [0, 1)');
  }else if(m==='s3'){
    var mu=parseFloat($('mu').value),sig=parseFloat($('sig').value);
    if(!isFinite(mu)||!isFinite(sig)||sig<0)return fail('Saisissez une moyenne valide et un écart type positif ou nul.');
    for(var i3=0;i3<n;i3++){
      var u1=Math.max(cryptoFloat(),1e-12),u2=cryptoFloat();
      var z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
      vals.push(mu+sig*z);
    }
    lo=Math.min.apply(null,vals);hi=Math.max.apply(null,vals);
    C.html('fxNow','n='+n+' tirages de N('+fx(mu)+', '+fx(sig)+'²)');
  }else{
    var seedStr=String($('seed').value||'42');
    var seedNum=/^-?\d+$/.test(seedStr.trim())?parseInt(seedStr,10)>>>0:seedFromStr(seedStr);
    var rng=mulberry32(seedNum);
    for(var i4=0;i4<n;i4++)vals.push(rng());
    lo=0;hi=1;
    C.html('fxNow','mulberry32, graine = "'+esc(seedStr)+'" (graine numérique '+seedNum+'), n='+n);
  }

  var display=vals.slice();
  if(sortOrder==='asc')display.sort(function(a,b){return a-b;});
  else if(sortOrder==='desc')display.sort(function(a,b){return b-a;});
  var dp=m==='s1'?0:m==='s4'?8:6;
  var displayStr=display.map(function(v){return fx(v,dp);}).join(display.length>20?', ':',  ');

  C.text('heroLbl',n===1?'Valeur':'Valeurs (n='+n+')');C.text('resultValue',displayStr);
  tg.textContent=m==='s4'?'deterministic':'CSPRNG';
  var mean=vals.reduce(function(a,b){return a+b;},0)/vals.length;
  C.text('ex1L','Moyenne de cet échantillon');C.text('ex1',fx(mean,6));
  C.text('ex2L','Source');C.text('ex2',m==='s4'?'mulberry32 (avec graine)':'crypto.getRandomValues (CSPRNG)');
  C.text('interp',m==='s4'?'Régénérer avec la même graine et le même n produira exactement la même suite — utile pour des tests reproductibles.':'Tirée de la source aléatoire cryptographiquement sûre de votre navigateur — une suite nouvelle et imprévisible à chaque fois.');
  var variance=vals.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/vals.length;
  tiles([
    ['Ajouter',String(n),''],
    ['Moyenne de l\'échantillon',fx(mean,6),''],
    ['Écart type éch.',fx(Math.sqrt(variance),6),''],
    ['Min / Max',fx(Math.min.apply(null,vals),4)+' / '+fx(Math.max.apply(null,vals),4),'']
  ]);
  plotStrip(vals,m==='s1'?lo:Math.min.apply(null,vals),m==='s1'?hi:Math.max.apply(null,vals));
  C.text('vizTag',n+' value'+(n===1?'':'s')+' plotted');
  var k=0,h='';function st(t,d,e){k++;h+='<li><span class="n">'+k+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  if(m==='s1')st('Tirer des bits uniformes et rejeter le biais','L\'échantillonnage par rejet garantit que chaque entier de ['+lo+', '+hi+'] est équiprobable, sans biais de modulo.','taille de la plage = '+(hi-lo+1));
  else if(m==='s2')st('Combiner deux tirages CSPRNG de 32 bits','Fournit 53 bits d\'entropie — la pleine précision d\'un double JavaScript — pour une valeur uniforme dans [0, 1).','');
  else if(m==='s3')st('Appliquer la transformation de Box–Muller','Deux tirages uniformes u₁, u₂ donnent une valeur normale centrée réduite.','z = √(−2ln u₁)·cos(2πu₂), puis mise à l\'échelle par σ et décalage de μ');
  else st('Exécuter mulberry32 à partir de la graine','Un PRNG déterministe, petit et rapide — la même graine donne toujours la même suite de sortie.','graine = '+seedNum);
  st('Générer '+n+' value'+(n===1?'':'s'),null,displayStr.length>200?displayStr.slice(0,200)+'…':displayStr);
  if(sortOrder!=='raw')st('Trier la sortie',null,sortOrder==='asc'?'ascending':'descending');
  $('steps').innerHTML=h;C.text('stepsIntro',labels[m]+', n='+n+'.');C.text('stepsTag',m==='s4'?'seeded':'CSPRNG');
  last='Nombres aléatoires — calculatepilot.com/math/random-number-generator.html\n'+labels[m].replace(/<[^>]+>/g,'')+', n='+n+':\n'+displayStr;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'rgCalc',compute:compute});
  $('presets').addEventListener('click',function(e){
    var b=e.target.closest('button[data-m]');if(!b)return;
    C.set('mode',b.getAttribute('data-m'));
    if(b.hasAttribute('data-lo')){C.set('lo',b.getAttribute('data-lo'));C.set('hi',b.getAttribute('data-hi'));}
    if(b.hasAttribute('data-mu')){C.set('mu',b.getAttribute('data-mu'));C.set('sig',b.getAttribute('data-sig'));}
    if(b.hasAttribute('data-seed'))C.set('seed',b.getAttribute('data-seed'));
    if(b.hasAttribute('data-n'))C.set('n',b.getAttribute('data-n'));
    $('uniq').checked=b.hasAttribute('data-uniq');
    fire('n');
  });
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
