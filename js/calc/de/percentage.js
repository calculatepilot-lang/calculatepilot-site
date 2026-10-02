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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('bar').innerHTML='';$('barL').innerHTML='';last='';}

function compute(){
  var m=$('mode').value,a=v('a'),b=v('b'),dp=+$('dp').value,dirDec=$('dir').value==='s2';
  $('fDir').hidden=m!=='s4';$('presets').hidden=m!=='s1';
  var L={s1:['Prozentsatz (P)','percent','Basiswert (X)','beliebige Zahl','Was ist P % von X?','Y = (P ÷ 100) × X'],s2:['Teil (X)','der Betrag','Ganzes (Y)','die Gesamtmenge, nicht 0','Wie viel Prozent von Y ist X?','% = (X ÷ Y) × 100'],s3:['Alter Wert','Ausgangswert, nicht 0','Neuer Wert','Endwert','Prozentuale Änderung vom alten zum neuen Wert','% Änderung = (neu − alt) ÷ |alt| × 100'],s4:['Endwert','nach der Änderung','Angewandte prozentuale Änderung','percent','Ursprünglichen Wert bestimmen','Original = Endwert ÷ (1 ± Satz ÷ 100)']}[m];
  C.text('aL',L[0]);C.text('aH',L[1]);C.text('bL',L[2]);C.text('bH',L[3]);C.text('formH',L[4]);C.text('fxNow',L[5]);
  $('err').hidden=true;var h='',n=0;function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,8));},res,tg='',sum='';
  if($('a').value===''||$('b').value==='')return fail('Geben Sie beide Werte ein.');
  var t=$('tag');t.className='sx-ef-grade';
  if(m==='s1'){
    var r=a/100;res=r*b;
    C.text('heroLbl',M.fmt(a,6)+'% von '+M.fmt(b,6));C.text('resultValue',fx(res,dp));C.text('interp',M.fmt(a,6)+'% von '+M.fmt(b,6)+' is '+fx(res,dp)+'.');t.textContent='Exakt';
    tiles([['Dezimalfaktor',M.fmt(r,8),'P ÷ 100'],['Bruch',frac(r),'in gekürzter Form'],['Basis − P %',fx(b-res,dp),'was übrig bleibt'],['Basis + P %',fx(b+res,dp),'Basis plus Anteil']]);
    var pc=Math.max(0,Math.min(100,a));bar([[pc,'var(--sx-pc)']],'Part-to-whole','Basis = 100 %',['0%',M.fmt(a,4)+'% = '+fx(res,dp),'100% = '+M.fmt(b,6)]);$('barCard').hidden=false;
    st('Prozentsatz in eine Dezimalzahl umwandeln','Durch 100 teilen.','r = '+f(a)+' ÷ 100 = <b>'+f(r)+'</b>');
    st('Mit der Basis multiplizieren','Skalieren Sie die Basis mit diesem Bruch.','Y = '+f(r)+' × '+f(b)+' = <b>'+f(res)+'</b>');
    st('Prüfung','Zurückdividieren, um den Prozentsatz zu ermitteln.',f(res)+' ÷ '+f(b)+' × 100 = '+(b!==0?f(res/b*100)+'%':'n/a'));
    sum=M.fmt(a,6)+'% von '+M.fmt(b,6)+' = '+fx(res,dp);
  }else if(m==='s2'){
    if(b===0)return fail('Das Ganze (Y) darf nicht 0 sein – ein Prozentsatz von null ist nicht definiert.');
    res=a/b*100;C.text('heroLbl',M.fmt(a,6)+' als Prozentsatz von '+M.fmt(b,6));C.text('resultValue',fx(res,dp)+'%');C.text('interp',M.fmt(a,6)+' is '+fx(res,dp)+'% von '+M.fmt(b,6)+'.');t.textContent=res>100?'Mehr als das Ganze':'Teil des Ganzen';
    tiles([['Dezimalverhältnis',M.fmt(a/b,8),'X ÷ Y'],['Bruch',(Number.isInteger(a)&&Number.isInteger(b))?frac(a/b):frac(a/b),'in gekürzter Form'],['Restprozent',fx(100-res,dp)+'%','100 % − Ergebnis'],['Y als Prozentsatz von X',a!==0?fx(b/a*100,dp)+'%':'n/a','die umgekehrte Frage']]);
    bar([[Math.min(100,res),'var(--sx-pc)']],'Part-to-whole','Ganzes = 100 %',['0%',fx(res,2)+'%'+(res>100?' (übersteigt das Ganze)':''),'100% = '+M.fmt(b,6)]);$('barCard').hidden=false;
    st('Den Teil durch das Ganze teilen','Ergibt den Teil als Bruchteil des Ganzen.','X ÷ Y = '+f(a)+' ÷ '+f(b)+' = <b>'+f(a/b)+'</b>');
    st('Mit 100 multiplizieren','Wandelt den Bruch in einen Prozentsatz um.','% = '+f(a/b)+' × 100 = <b>'+f(res)+'%</b>');
    sum=M.fmt(a,6)+' is '+fx(res,dp)+'% von '+M.fmt(b,6);
  }else if(m==='s3'){
    if(a===0)return fail('Der alte Wert darf nicht 0 sein – eine prozentuale Änderung ausgehend von null ist nicht definiert. Geben Sie stattdessen die absolute Änderung an.');
    var d=b-a;res=d/Math.abs(a)*100;C.text('heroLbl','Änderung von '+M.fmt(a,6)+' to '+M.fmt(b,6));C.text('resultValue',sgn(res)+fx(Math.abs(res),dp)+'%');
    C.text('interp','Der Wert '+(d>0?'increased':d<0?'decreased':'hat sich nicht geändert')+' by '+fx(Math.abs(d),dp)+', das sind '+fx(Math.abs(res),dp)+'% des alten Werts.');
    t.textContent=d>0?'Zunahme':d<0?'Abnahme':'Keine Änderung';t.className='sx-ef-grade'+(d<0?' mid':'');
    var back=b!==0?(a-b)/Math.abs(b)*100:NaN;
    tiles([['Absolute Änderung',sgn(d)+fx(Math.abs(d),dp),'neu − alt'],['Faktor',M.fmt(b/a,8),'neu ÷ alt'],['Um die Änderung umzukehren',isFinite(back)?sgn(back)+fx(Math.abs(back),dp)+'%':'n/a','Prozentsatz, der nötig ist, um zum alten Wert zurückzukehren'],['Als Bruch',frac(d/Math.abs(a)),'Änderung ÷ alt']]);
    var mx=Math.max(Math.abs(a),Math.abs(b))||1;bar([[Math.abs(b)/mx*100,d>=0?'var(--sx-pc)':'#d97706']],'Neuer Wert relativ zum größeren der beiden Werte','alt = '+M.fmt(a,6)+' · neu = '+M.fmt(b,6),['0',M.fmt(b,6)+' (new)',M.fmt(mx,6)]);$('barCard').hidden=false;
    st('Änderung bestimmen','Ziehen Sie den alten Wert vom neuen Wert ab.','Δ = neu − alt = '+f(b)+' − '+f(a)+' = <b>'+f(d)+'</b>');
    st('Durch den alten Wert teilen','Der alte Wert ist die Basis für die prozentuale Änderung.','Δ ÷ |alt| = '+f(d)+' ÷ '+f(Math.abs(a))+' = <b>'+f(d/Math.abs(a))+'</b>');
    st('Mit 100 multiplizieren','','% Änderung = <b>'+sgn(res)+f(Math.abs(res))+'%</b>');
    if(isFinite(back)&&d!==0)st('Die Änderung rückgängig machen','Die Basis ist jetzt der neue Wert, daher unterscheidet sich der umgekehrte Prozentsatz.','('+f(a)+' − '+f(b)+') ÷ |'+f(b)+'| × 100 = <b>'+sgn(back)+f(Math.abs(back))+'%</b>');
    sum='Änderung von '+M.fmt(a,6)+' to '+M.fmt(b,6)+' = '+sgn(res)+fx(Math.abs(res),dp)+'%';
  }else{
    var rate=b/100,fac=dirDec?1-rate:1+rate;if(fac===0)return fail('A '+M.fmt(b,4)+'% Rückgang lässt nichts übrig, daher lässt sich der ursprüngliche Wert nicht wiederherstellen.');
    res=a/fac;C.text('heroLbl','Ursprünglicher Wert vor der '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase'));C.text('resultValue',fx(res,dp));
    C.text('interp','Ein Wert von '+M.fmt(a,6)+' nach einer '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase')+' begann bei '+fx(res,dp)+'.');t.textContent=dirDec?'Nach einem Rückgang':'Nach einer Zunahme';
    tiles([['Wachstumsfaktor',M.fmt(fac,8),dirDec?'1 − Satz':'1 + Satz'],['Höhe der Änderung',sgn(a-res)+fx(Math.abs(a-res),dp),'Endwert − Original'],['Prüfung',fx(res*fac,dp),'Original × Faktor = Endwert'],['Falsche Abkürzung',fx(a*(dirDec?1+rate:1-rate),dp),'den Prozentsatz auf den Endwert rückwärts anzuwenden ist nicht korrekt']]);
    $('barCard').hidden=true;$('bar').innerHTML='';$('barL').innerHTML='';
    st('Die Vorwärtsbeziehung aufstellen','A '+(dirDec?'decrease':'increase')+' multipliziert das Original mit einem Wachstumsfaktor.','Endwert = Original × (1 '+(dirDec?'−':'+')+' '+f(rate)+') = Original × '+f(fac));
    st('Nach dem Original auflösen','Teilen Sie den Endwert durch den Faktor.','Original = '+f(a)+' ÷ '+f(fac)+' = <b>'+f(res)+'</b>');
    st('Prüfung','Wenden Sie die Änderung auf das Original an.',f(res)+' × '+f(fac)+' = '+f(res*fac));
    sum='Original = '+fx(res,dp)+' (final '+M.fmt(a,6)+' after '+M.fmt(b,4)+'% '+(dirDec?'decrease':'increase')+')';
  }
  if(m!=='s4'&&m!=='s3'&&m!=='s2'&&m!=='s1')$('barCard').hidden=true;
  $('steps').innerHTML=h;C.text('stepsIntro',L[4]);C.text('stepsTag',L[5]);last=sum;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pgCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('a',b.getAttribute('data-v'));$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('swap').addEventListener('click',function(){var x=$('a').value;C.set('a',$('b').value);C.set('b',x);$('a').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Gleichung kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
