/* Log calculator — CalculatePilot (Stitch redesign).
   log_b(x) = ln x / ln b (b > 0, b ≠ 1, x > 0; x < 0 gives the principal complex value ln|x| + πi divided by ln b).
   Common-log characteristic/mantissa: x = m·10^c, 1 ≤ m < 10 → log₁₀x = c + log₁₀m. Antilog: bʸ. */
(function(){
var C=window.CPX,$=C.$,M=C.math,PI=Math.PI,LN10=Math.LN10,last='',lastY=NaN;

function esc(s){return C.esc(s);}
function sup(n){return String(n).replace(/[-0-9]/g,function(c){return {'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}[c];});}
function parseBase(s){s=String(s).trim().toLowerCase();if(s==='e')return Math.E;var n=Number(s);return s!==''&&isFinite(n)?n:NaN;}
function bl(b){return Math.abs(b-Math.E)<1e-15?'e':M.fmt(b,8);}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';lastY=NaN;}

function curve(b,x,y){
  var W=760,H=320,pl=46,pr=20,pt=16,pb=34,xmax=Math.max(x*1.6,2),xmin=Math.max(1e-9,Math.min(xmax/200,0.05)),N=240,pts=[],i,yv=[];
  for(i=0;i<=N;i++){var t=xmin+(xmax-xmin)*Math.pow(i/N,2),v=Math.log(t)/Math.log(b);pts.push([t,v]);yv.push(v);}
  var ymin=Math.max(Math.min.apply(null,yv),y-6),ymax=Math.max(Math.max.apply(null,yv),y+1);if(ymax-ymin<1){ymax+=1;}
  var X=function(t){return pl+(t-xmin)/(xmax-xmin)*(W-pl-pr);},Y=function(v){return pt+(1-(v-ymin)/(ymax-ymin))*(H-pt-pb);},s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">',k;
  for(k=Math.ceil(ymin);k<=ymax;k+=Math.max(1,Math.ceil((ymax-ymin)/6)))s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(k).toFixed(1)+'" y2="'+Y(k).toFixed(1)+'" stroke="var(--sx-border)"/><text class="ax" x="'+(pl-6)+'" y="'+(Y(k)+3).toFixed(1)+'" text-anchor="end">'+k+'</text>';
  var xs=Math.pow(10,Math.floor(Math.log10(xmax)));[0,1,2,3,4,5,6,7,8,9].map(function(m){return m*xs;}).filter(function(t){return t>0&&t<=xmax;}).forEach(function(t){s+='<text class="ax" x="'+X(t).toFixed(1)+'" y="'+(H-pb+16)+'" text-anchor="middle">'+M.fmt(t,3)+'</text>';});
  if(ymin<=0&&ymax>=0)s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  s+='<line x1="'+pl+'" x2="'+pl+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="#dc2626" stroke-dasharray="4 3"/><text class="ax" x="'+(pl+6)+'" y="'+(pt+10)+'" style="fill:#b91c1c;font-weight:600">asymptote x = 0</text>';
  s+='<polyline fill="none" stroke="var(--sx-primary)" stroke-width="2.6" points="'+pts.filter(function(p){return p[1]>=ymin-1&&p[1]<=ymax+1;}).map(function(p){return X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1);}).join(' ')+'"/>';
  s+='<line x1="'+X(x).toFixed(1)+'" x2="'+X(x).toFixed(1)+'" y1="'+Y(y).toFixed(1)+'" y2="'+(H-pb)+'" stroke="#2563eb" stroke-dasharray="5 4"/><circle cx="'+X(x).toFixed(1)+'" cy="'+Y(y).toFixed(1)+'" r="6" fill="#2563eb"/><text class="ax" x="'+(X(x)+10).toFixed(1)+'" y="'+(Y(y)+16).toFixed(1)+'" style="font-weight:700;fill:#1d4ed8">('+esc(M.fmt(x,5))+', '+esc(M.fmt(y,5))+')</text>';
  $('viz').innerHTML=s+'</svg>';}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,h='',n0=0,tg=$('tag');tg.className='sx-ef-grade';
  $('p1').hidden=m==='s3';$('p3').hidden=m!=='s3';$('presets').hidden=m==='s3';$('lb').parentNode.parentNode.hidden=m==='s2';
  C.text('formH',{s1:'log_b(x), toute base',s2:'Logarithmes naturel, décimal et binaire',s3:'Antilogarithme bʸ'}[m]);$('err').hidden=true;
  function st(t,d,e){n0++;h+='<li><span class="n">'+n0+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));};
  if(m==='s3'){
    var ab=parseBase($('ab').value),y=Number($('ay').value);if(!(ab>0)||ab===1)return fail('La base doit être positive et différente de 1 (saisissez e pour le nombre d’Euler).');if($('ay').value===''||!isFinite(y))return fail('Saisissez l’exposant y.');
    var r=Math.pow(ab,y);if(!isFinite(r))return fail('Le résultat est trop grand ou trop petit pour la double précision.');lastY=y;
    C.text('heroLbl','Antilog : '+bl(ab)+'^'+M.fmt(y,8));C.text('resultValue',M.fmt(r,dp));C.text('ex1L','Notation scientifique');C.text('ex1',r.toExponential(8));C.text('ex2L','Vérification : log_b(résultat)');C.text('ex2',M.fmt(Math.log(r)/Math.log(ab),dp));tg.textContent='Antilogarithme';C.text('fxNow','x = '+bl(ab)+sup(M.fmt(y,8))+' = '+M.fmt(r,dp));C.text('interp',bl(ab)+' élevé à '+M.fmt(y,8)+' is '+M.fmt(r,dp)+'.');
    tiles([['log₁₀ du résultat',M.fmt(r>0?Math.log10(r):NaN,dp),'chiffres avant la virgule ≈ ⌊log₁₀ x⌋ + 1'],['Logarithme naturel du résultat',M.fmt(Math.log(r),dp),'y · ln b'],['Fonction inverse','log_'+bl(ab)+'(x)','ramène le résultat à y']]);curve(ab,r,y);C.text('vizH','La relation inverse');C.text('vizNote','La courbe du logarithme y = log_b(x) ; le point marqué est (bʸ, y).');C.text('vizTag','b = '+bl(ab));
    st('Définition','L’antilogarithme annule le logarithme.','Si y = log_'+bl(ab)+'(x) alors x = '+bl(ab)+'^y');st('Évaluer','','x = '+bl(ab)+'^'+f(y)+' = e^('+f(y)+' × ln '+bl(ab)+') = <b>'+f(r)+'</b>');
    last='Antilogarithme — calculatepilot.com/math/log-calculator.html\n'+bl(ab)+'^'+M.fmt(y,10)+' = '+M.fmt(r,12);$('steps').innerHTML=h;C.text('stepsIntro','On élève la base à la puissance y.');C.text('stepsTag','bʸ');return;
  }
  var x=Number($('lx').value),b=m==='s2'?10:parseBase($('lb').value);if($('lx').value==='')return fail('Saisissez l\'argument x.');
  if(m==='s1'&&!(b>0&&b!==1))return fail('La base doit être positive et différente de 1 (saisissez e pour le nombre d’Euler).');
  if(x===0)return fail('log(0) n\'est pas défini : il tend vers −∞ lorsque x se rapproche de 0 par valeurs positives.');
  C.text('lxH','x > 0 (un x négatif donne une valeur complexe)');
  var neg=x<0,ax=Math.abs(x),lnx=Math.log(ax);
  if(m==='s2'){
    var l10=neg?[Math.log10(ax),PI/LN10]:[Math.log10(ax),0],l2=[Math.log2(ax),neg?PI/Math.LN2:0],le=[lnx,neg?PI:0],fm=function(a){return a[1]?M.fmt(a[0],dp)+' + '+M.fmt(a[1],dp)+'i':M.fmt(a[0],dp);};lastY=l10[0];
    C.text('heroLbl','ln('+M.fmt(x,8)+')');C.text('resultValue',fm(le));C.text('ex1L','log₁₀');C.text('ex1',fm(l10));C.text('ex2L','log₂');C.text('ex2',fm(l2));tg.textContent=neg?'Complexe (valeur principale)':'Réel';tg.className='sx-ef-grade'+(neg?' mid':'');
    C.text('fxNow','ln '+M.fmt(x,8)+' = '+fm(le)+',  log₁₀ = '+fm(l10)+',  log₂ = '+fm(l2));C.text('interp','Les trois logarithmes usuels de '+M.fmt(x,8)+(neg?' (valeurs principales complexes pour un nombre négatif)':'')+'.');
    var ex10=neg?null:Math.floor(l10[0]),mant=neg?null:l10[0]-ex10;
    tiles([['Logarithme népérien ln x',fm(le),'base e'],['Logarithme décimal log₁₀ x',fm(l10),'base 10'],['Logarithme binaire log₂ x',fm(l2),'base 2'],['Caractéristique · mantisse',neg?'—':ex10+' · '+M.fmt(mant,dp),'log₁₀ x = c + mantisse'],['Chiffres de la partie entière',neg||ax<1?'—':String(Math.floor(l10[0])+1),'⌊log₁₀ x⌋ + 1'],['Bits nécessaires',neg||ax<1?'—':String(Math.floor(l2[0])+1),'⌊log₂ x⌋ + 1']]);
    if(!neg){curve(10,ax,l10[0]);C.text('vizH','Courbe du logarithme (base 10)');C.text('vizNote','y = log₁₀(x) avec votre point repéré.');C.text('vizTag','x = '+M.fmt(ax,5));}else{$('viz').innerHTML='';C.text('vizTag','—');}
    st('Logarithme népérien','ln x est la puissance de e qui donne x.','ln '+f(x)+(neg?' = ln '+f(ax)+' + πi':'')+' = <b>'+esc(fm(le))+'</b>');st('Changement de base','Pour les autres bases, on divise par ln de la base.','log₁₀ x = ln x ÷ ln 10 = <b>'+esc(fm(l10))+'</b> ; log₂ x = ln x ÷ ln 2 = <b>'+esc(fm(l2))+'</b>');
    last='Logarithmes — calculatepilot.com/math/log-calculator.html\nx = '+M.fmt(x,12)+'\nln = '+fm(le)+'\nlog10 = '+fm(l10)+'\nlog2 = '+fm(l2);$('steps').innerHTML=h;C.text('stepsIntro','ln, log₁₀ et log₂ de '+M.fmt(x,8)+'.');C.text('stepsTag','ln x ÷ ln b');return;
  }
  var lb=Math.log(b),re=lnx/lb,im=neg?PI/lb:0,res=neg?M.fmt(re,dp)+' + '+M.fmt(im,dp)+'i':M.fmt(re,dp);lastY=re;
  C.text('heroLbl','log_'+bl(b)+'('+M.fmt(x,8)+')');C.text('resultValue',res);
  if(b===10&&!neg){var c=Math.floor(re+1e-12),mt=re-c;C.text('ex1L','Caractéristique (partie entière)');C.text('ex1',String(c));C.text('ex2L','Mantisse (partie fractionnaire)');C.text('ex2',M.fmt(mt,dp));}else{C.text('ex1L','Logarithme népérien ln x');C.text('ex1',M.fmt(lnx,dp)+(neg?' + πi':''));C.text('ex2L','Vérification : b^résultat');C.text('ex2',neg?'—':M.fmt(Math.pow(b,re),dp));}
  tg.textContent=neg?'Complexe (valeur principale)':(Number.isInteger(re)?'Entier exact':'Logarithme réel');tg.className='sx-ef-grade'+(neg?' mid':'');
  C.text('fxNow','log_'+bl(b)+' '+M.fmt(x,8)+' = ln '+M.fmt(ax,8)+' ÷ ln '+bl(b)+' = '+res);C.text('interp',neg?'Un argument négatif n\'a pas de logarithme réel ; voici la valeur principale complexe.':bl(b)+' élevé à '+M.fmt(re,dp)+' equals '+M.fmt(x,8)+'.');
  var others=[[Math.E,'ln (base e)'],[10,'log₁₀'],[2,'log₂'],[3,'log₃']].filter(function(o){return Math.abs(o[0]-b)>1e-12;});
  tiles([['Logarithme népérien ln x',M.fmt(lnx,dp)+(neg?' + πi':''),'le logarithme en base e']].concat(others.filter(function(o){return o[0]!==Math.E;}).map(function(o){return [o[1]+' x',neg?'—':M.fmt(lnx/Math.log(o[0]),dp),'ln x ÷ ln '+(o[0]===10?'10':o[0])];})).concat([['Taux de variation d/dx',neg?'—':M.fmt(1/(ax*lb),dp),'1 ÷ (x · ln b)'],['Identité réciproque',neg?'—':M.fmt(re*(Math.log(b)/lnx),8),'log_b x · log_x b = 1'],['Ordre de grandeur',neg?'—':M.fmt(Math.floor(Math.log10(ax)),0),'⌊log₁₀|x|⌋']]));
  if(!neg&&x>0){curve(b,ax,re);C.text('vizH','Courbe du logarithme y = log_'+bl(b)+'(x)');C.text('vizNote','La courbe avec votre point repéré ; l\'asymptote verticale est x = 0.');C.text('vizTag','base '+bl(b));}else{$('viz').innerHTML='';C.text('vizTag','—');}
  st('Définition','Le logarithme est l\'exposant qui produit x à partir de la base.','log_'+bl(b)+'(x) = y  ⇔  '+bl(b)+'^y = x');
  st('Changement de base','Utilisez les logarithmes népériens, présents sur toutes les calculatrices.','y = ln x ÷ ln b = '+f(lnx)+' ÷ '+f(lb)+' = <b>'+esc(res)+'</b>');
  if(b===10&&!neg){var e10=Math.floor(Math.log10(ax)),mm=ax/Math.pow(10,e10);st('Caractéristique et mantisse','Écrivez x = m × 10ᶜ avec 1 ≤ m &lt; 10.',f(ax)+' = '+f(mm)+' × 10'+sup(e10)+'  →  log₁₀ x = '+e10+' + log₁₀('+f(mm)+') = '+e10+' + <b>'+f(Math.log10(mm))+'</b>');}
  if(!neg)st('Vérifier','Élevez la base au résultat pour retrouver x.',bl(b)+'^'+f(re)+' = <b>'+f(Math.pow(b,re))+'</b>');
  last='Logarithme — calculatepilot.com/math/log-calculator.html\nlog_'+bl(b)+'('+M.fmt(x,12)+') = '+res;$('steps').innerHTML=h;C.text('stepsIntro','Logarithme de '+M.fmt(x,8)+' en base '+bl(b)+'.');C.text('stepsTag','ln x ÷ ln b');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('lx').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'lgCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-b]');if(!b)return;C.set('mode','s1');C.set('lb',b.getAttribute('data-b'));C.set('lx',b.getAttribute('data-x'));fire();});
  $('inv').addEventListener('click',function(){var y=lastY;if(isFinite(y)){C.set('ab',$('lb').value||'10');C.set('ay',+y.toPrecision(12));}C.set('mode','s3');fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
