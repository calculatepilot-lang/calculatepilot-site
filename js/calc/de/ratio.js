/* Ratio calculator — CalculatePilot (Stitch redesign).
   Simplify: divide by the GCD (Euclid) after scaling decimals to whole numbers. Proportion: A:B = C:D → D = B·C/A, C = A·D/B.
   Scale: multiply by k. Multi-part: simplify by the GCD of all parts; share of total T for part i = T·pᵢ/Σp. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='',defParts='1, 2, 3';

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function euclid(a,b){var lines=[],x=Math.max(a,b),y=Math.min(a,b),n=0;while(y&&n<14){var q=Math.floor(x/y),r=x%y;lines.push(x+' = '+q+' × '+y+' + '+r);x=y;y=r;n++;}return {g:x,lines:lines};}
function ints(list){for(var k=0;k<=6;k++){var s=Math.pow(10,k),ok=list.every(function(x){var y=x*s;return Math.abs(y-Math.round(y))<=1e-9*Math.max(1,Math.abs(y));});if(ok){var a=list.map(function(x){return Math.round(x*s);});if(a.some(function(x){return x>9e15;}))return null;return {a:a,s:s,k:k};}}return null;}
function reduce(list){var I=ints(list);if(!I)return null;var g=I.a.reduce(function(p,c){return gcd(p,c);});return {ints:I.a,g:g,scale:I.s,red:I.a.map(function(x){return x/g;})};}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function J(a){return a.join(' : ');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';last='';}

function rects(items){
  var W=760,H=170,n=items.length,cw=(W-20)/n,pad=24,s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  items.forEach(function(it,i){var mw=cw-pad*2,mh=H-52,sc=Math.min(mw/it[0],mh/it[1]),w=it[0]*sc,h=it[1]*sc,x=10+i*cw+(cw-w)/2,y=14+(mh-h)/2;
    s+='<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+h.toFixed(1)+'" rx="4" fill="'+(i?'#d97706':'var(--sx-pc)')+'" fill-opacity=".2" stroke="'+(i?'#d97706':'var(--sx-pc)')+'" stroke-width="2"/><line x1="'+x.toFixed(1)+'" y1="'+(y+h).toFixed(1)+'" x2="'+(x+w).toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="'+(i?'#d97706':'var(--sx-pc)')+'" stroke-dasharray="4 3" opacity=".6"/><text class="ax" x="'+(x+w/2).toFixed(1)+'" y="'+(H-24)+'" text-anchor="middle" style="font-weight:600;font-size:12px;fill:var(--sx-on)">'+esc(it[2])+'</text><text class="ax" x="'+(x+w/2).toFixed(1)+'" y="'+(H-9)+'" text-anchor="middle">'+esc(it[3]||'')+'</text>';});
  $('viz').innerHTML=s+'</svg>';
}
function stack(parts,labels){
  var W=760,H=120,tot=parts.reduce(function(p,c){return p+c;},0),x=10,cols=['var(--sx-pc)','#d97706','#2563eb','#dc2626','#7c3aed','#0d9488','#db2777','#65a30d'],s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  parts.forEach(function(p,i){var w=(W-20)*p/tot;s+='<rect x="'+x.toFixed(1)+'" y="20" width="'+Math.max(1,w-2).toFixed(1)+'" height="48" rx="6" fill="'+cols[i%8]+'" fill-opacity=".25" stroke="'+cols[i%8]+'" stroke-width="2"/><text class="ax" x="'+(x+w/2-1).toFixed(1)+'" y="48" text-anchor="middle" style="font-weight:700;font-size:13px;fill:var(--sx-on)">'+esc(labels[i])+'</text><text class="ax" x="'+(x+w/2-1).toFixed(1)+'" y="90" text-anchor="middle">'+(p/tot*100).toFixed(1)+'%</text>';x+=w;});
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,a=v('ra'),b=v('rb'),h='',n=0;
  ['f2'].forEach(function(id){$(id).hidden=m==='s4';});$('fProp').hidden=m!=='s2';$('fScale').hidden=m!=='s3';$('fParts').hidden=m!=='s4';$('pre2').hidden=m==='s4';$('pre4').hidden=m!=='s4';
  C.text('formH',{s1:'Ein Verhältnis kürzen',s2:'Verhältnisgleichung lösen',s3:'Verhältnis skalieren',s4:'Verhältnis mit mehreren Teilen'}[m]);
  C.text('raL',m==='s2'?'A':'Vorderglied (A)');C.text('rbL',m==='s2'?'B':'Hinterglied (B)');
  $('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));},t=$('tag');t.className='sx-ef-grade';
  function eu(R,label){var e=euclid(R.ints[0],R.ints[1]);return e;}
  if(m==='s1'){
    if(!(a>0&&b>0))return fail('Beide Teile müssen größer als 0 sein.');
    var R=reduce([a,b]);if(!R)return fail('Verwenden Sie Zahlen mit höchstens 6 Nachkommastellen.');
    var e=euclid(R.ints[0],R.ints[1]),rr=R.red;
    C.text('fxNow',M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+J(rr));C.text('heroLbl','Vereinfachtes Verhältnis (kleinste Terme)');C.text('resultValue',J(rr));C.text('interp',M.fmt(a,6)+' : '+M.fmt(b,6)+' wird gekürzt zu '+J(rr)+'.');t.textContent=R.g===1&&R.scale===1?'Bereits am einfachsten':'Vereinfacht';
    tiles([['Dezimalwert (A ÷ B)',M.fmt(a/b,8),'A pro 1 von B'],['Umgekehrtes Verhältnis (B : A)',J(rr.slice().reverse()),'die Teile vertauschen'],['Größter gemeinsamer Teiler',String(R.g)+(R.scale>1?' (nach ×'+R.scale+')':''),'größter gemeinsamer Teiler'],['A als Anteil am Ganzen',(a/(a+b)*100).toFixed(2)+'%','A ÷ (A + B)']]);
    rects([[rr[0],rr[1],J(rr),'simplified'],[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'wie eingegeben']]);C.text('vizT','Form des Verhältnisses');C.text('vizN','beide Rechtecke haben dieselbe Form');
    if(R.scale>1)st('Dezimalzahlen in ganze Zahlen umwandeln','Multiplizieren Sie beide Teile mit '+R.scale+'.',f(a)+' : '+f(b)+' → <b>'+R.ints[0]+' : '+R.ints[1]+'</b>');
    st('Den größten gemeinsamen Teiler finden','Euklidischer Algorithmus: dividieren, den Rest behalten und wiederholen, bis er 0 ist.',e.lines.map(esc).join('<br>')+'<br>ggT = <b>'+e.g+'</b>');
    st('Beide Teile durch den ggT teilen','Ergibt das Verhältnis in kleinsten Termen.',R.ints[0]+' ÷ '+R.g+' : '+R.ints[1]+' ÷ '+R.g+' = <b>'+J(rr)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+J(rr);C.text('stepsTag','GCD '+R.g);C.text('stepsIntro','Vereinfachen von '+M.fmt(a,6)+' : '+M.fmt(b,6)+' mit dem euklidischen Algorithmus.');
  }else if(m==='s2'){
    var unkC=$('unk').value==='s1',c=v('rc'),d=v('rd');$('fC').hidden=unkC;$('fD').hidden=!unkC;
    if(!(a>0&&b>0))return fail('A und B müssen größer als 0 sein.');
    var known=unkC?d:c;if(!(known>0))return fail('Geben Sie den bekannten Wert als Zahl größer als 0 ein.');
    var x=unkC?a*d/b:b*c/a,C2=unkC?x:c,D2=unkC?d:x,k=C2/a;
    C.text('fxNow',M.fmt(a,4)+' : '+M.fmt(b,4)+' = '+(unkC?'X':M.fmt(c,4))+' : '+(unkC?M.fmt(d,4):'X'));C.text('heroLbl','Fehlender Wert X ('+(unkC?'C':'D')+')');C.text('resultValue',M.fmt(x,dp));
    C.text('interp','Äquivalente Verhältnisgleichung: '+M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+M.fmt(C2,6)+' : '+M.fmt(D2,6)+'.');t.textContent='Verhältnisgleichung gelöst';
    var R2=reduce([a,b]);
    tiles([['Skalierungsfaktor',M.fmt(k,8),'C ÷ A = D ÷ B'],['Gekürztes Verhältnis',R2?J(R2.red):'—','kleinste Terme von A : B'],['Kreuzprodukt-Prüfung',M.fmt(a*D2,8)+' = '+M.fmt(b*C2,8),'A × D = B × C'],['Dezimalwert (A ÷ B)',M.fmt(a/b,8),'das Verhältnis als eine Zahl']]);
    rects([[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'gegebenes Verhältnis'],[C2,D2,M.fmt(C2,4)+' : '+M.fmt(D2,4),'äquivalentes Verhältnis']]);C.text('vizT','Die beiden Verhältnisse haben dieselbe Form');C.text('vizN','equivalent');
    st('Die Verhältnisgleichung aufstellen','Zwei Verhältnisse sind gleich.',f(a)+' : '+f(b)+' = '+(unkC?'X':f(c))+' : '+(unkC?f(d):'X'));
    st('Cross-multiply','Das Produkt der Außenglieder ist gleich dem Produkt der Innenglieder.',unkC?f(a)+' × '+f(d)+' = '+f(b)+' × X':f(a)+' × X = '+f(b)+' × '+f(c));
    st('X isolieren','Teilen Sie beide Seiten durch den Koeffizienten von X.',unkC?'X = ('+f(a)+' × '+f(d)+') ÷ '+f(b)+' = <b>'+f(x)+'</b>':'X = ('+f(b)+' × '+f(c)+') ÷ '+f(a)+' = <b>'+f(x)+'</b>');
    st('Prüfung','Der Skalierungsfaktor ist auf beiden Seiten derselbe.',f(C2)+' ÷ '+f(a)+' = '+f(D2)+' ÷ '+f(b)+' = <b>'+f(k)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' = '+M.fmt(C2,6)+' : '+M.fmt(D2,6);C.text('stepsTag','cross-multiplication');C.text('stepsIntro','Das fehlende Glied einer Verhältnisgleichung lösen.');
  }else if(m==='s3'){
    var tg=$('tgt').value,tv=v('tv');if(!(a>0&&b>0))return fail('A und B müssen größer als 0 sein.');if(!(tv>0))return fail('Der Zielwert muss größer als 0 sein.');
    C.text('tvL',tg==='k'?'Skalierungsfaktor':tg==='t'?'Zielsumme (A′ + B′)':'Zielwert für '+(tg==='a'?'A′':'B′'));
    var kk=tg==='a'?tv/a:tg==='b'?tv/b:tg==='t'?tv/(a+b):tv,A2=a*kk,B2=b*kk;
    C.text('fxNow',M.fmt(a,4)+' : '+M.fmt(b,4)+'  ×  '+M.fmt(kk,6)+'  =  '+M.fmt(A2,6)+' : '+M.fmt(B2,6));C.text('heroLbl','Skaliertes Verhältnis');C.text('resultValue',M.fmt(A2,dp)+' : '+M.fmt(B2,dp));C.text('interp','Multiplizieren Sie beide Teile von '+M.fmt(a,6)+' : '+M.fmt(b,6)+' by '+M.fmt(kk,6)+'.');t.textContent=kk>1?'Vergrößert':kk<1?'Verkleinert':'Unverändert';
    tiles([['Skalierungsfaktor (k)',M.fmt(kk,8),'multiplier'],['Neues A′',M.fmt(A2,dp),'A × k'],['Neues B′',M.fmt(B2,dp),'B × k'],['Neue Summe',M.fmt(A2+B2,dp),'A′ + B′']]);
    rects([[a,b,M.fmt(a,4)+' : '+M.fmt(b,4),'original'],[A2,B2,M.fmt(A2,4)+' : '+M.fmt(B2,4),'scaled']]);C.text('vizT','Ursprüngliches und skaliertes Verhältnis');C.text('vizN','gleiche Form');
    st('Skalierungsfaktor bestimmen','Vergleichen Sie den Zielwert mit dem Teil, auf den er sich bezieht.',tg==='a'?'k = Zielwert ÷ A = '+f(tv)+' ÷ '+f(a)+' = <b>'+f(kk)+'</b>':tg==='b'?'k = Zielwert ÷ B = '+f(tv)+' ÷ '+f(b)+' = <b>'+f(kk)+'</b>':tg==='t'?'k = Zielsumme ÷ (A + B) = '+f(tv)+' ÷ '+f(a+b)+' = <b>'+f(kk)+'</b>':'k = <b>'+f(kk)+'</b> (vorgegeben)');
    st('Beide Teile mit k multiplizieren','Beim Skalieren bleibt das Verhältnis unverändert.','A′ = '+f(a)+' × '+f(kk)+' = <b>'+f(A2)+'</b><br>B′ = '+f(b)+' × '+f(kk)+' = <b>'+f(B2)+'</b>');
    last=M.fmt(a,6)+' : '+M.fmt(b,6)+' × '+M.fmt(kk,6)+' = '+M.fmt(A2,6)+' : '+M.fmt(B2,6);C.text('stepsTag','Skalierungsfaktor '+M.fmt(kk,4));C.text('stepsIntro','Ein Verhältnis auf einen Zielwert skalieren.');
  }else{
    var raw=String($('parts').value).split(/[\s,:;]+/).filter(Boolean).map(Number);C.text('partsN',raw.length+' parts');
    if(raw.length<2||raw.length>8||raw.some(function(x){return !(x>0)||!isFinite(x);}))return fail('Geben Sie 2 bis 8 Zahlen größer als 0 ein, getrennt durch Kommas oder Doppelpunkte.');
    var R3=reduce(raw);if(!R3)return fail('Verwenden Sie Zahlen mit höchstens 6 Nachkommastellen.');
    var sum=raw.reduce(function(p,c){return p+c;},0),T=v('tot'),hasT=$('tot').value!==''&&T>0,rr3=R3.red,sp=rr3.reduce(function(p,c){return p+c;},0);
    C.text('fxNow',raw.map(function(x){return M.fmt(x,6);}).join(' : ')+' = '+J(rr3));C.text('heroLbl','Gekürztes Verhältnis');C.text('resultValue',J(rr3));C.text('interp',raw.length+'-teiliges Verhältnis in kleinsten Termen; die Teile ergeben zusammen '+sp+' gleiche Anteile.');t.textContent=R3.g===1&&R3.scale===1?'Bereits am einfachsten':'Vereinfacht';
    var pcs=raw.map(function(x){return (x/sum*100).toFixed(2)+'%';}).join(' · ');
    tiles([['Teile gesamt (vereinfacht)',String(sp),'Summe der gekürzten Teile'],['Anteil am Ganzen',pcs,'jeder Teil ÷ Gesamt'],['Größter gemeinsamer Teiler',String(R3.g)+(R3.scale>1?' (nach ×'+R3.scale+')':''),'größter gemeinsamer Teiler'],hasT?['Aufzuteilende Gesamtsumme '+M.fmt(T,6),raw.map(function(x){return M.fmt(T*x/sum,dp);}).join(' · '),'jeder Teil × Gesamt ÷ '+M.fmt(sum,6)]:['Gesamtsumme aufteilen','oben eines eingeben','optionales Feld']]);
    stack(raw,rr3.map(String));C.text('vizT','Anteil am Ganzen');C.text('vizN',raw.length+' parts');
    var g=R3.ints[0],lines=[];R3.ints.slice(1).forEach(function(x){var ng=gcd(g,x);lines.push('gcd('+g+', '+x+') = '+ng);g=ng;});
    if(R3.scale>1)st('Dezimalzahlen in ganze Zahlen umwandeln','Multiplizieren Sie jeden Teil mit '+R3.scale+'.',raw.map(function(x){return f(x);}).join(' : ')+' → <b>'+R3.ints.join(' : ')+'</b>');
    st('Den ggT aller Teile bestimmen','Wenden Sie den euklidischen Algorithmus paarweise an.',lines.map(esc).join('<br>')+'<br>ggT = <b>'+R3.g+'</b>');
    st('Jeden Teil durch den ggT teilen','',R3.ints.join(' : ')+' ÷ '+R3.g+' = <b>'+J(rr3)+'</b>');
    if(hasT)st('Die Gesamtsumme teilen','Wert eines vereinfachten Teils = Gesamtsumme ÷ Summe der Teile.','ein Teil = '+f(T)+' ÷ '+f(sp)+' = <b>'+f(T/sp)+'</b><br>'+rr3.map(function(x){return x+' × '+f(T/sp)+' = <b>'+f(x*T/sp)+'</b>';}).join('<br>'));
    last=raw.map(function(x){return M.fmt(x,6);}).join(' : ')+' = '+J(rr3)+(hasT?'; Anteile von '+M.fmt(T,6)+': '+raw.map(function(x){return M.fmt(T*x/sum,dp);}).join(', '):'');C.text('stepsTag','GCD '+R3.g);C.text('stepsIntro','Ein mehrteiliges Verhältnis vereinfachen und aufteilen.');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('ra').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'rtCalc',compute:compute});
  $('pre2').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;C.set('ra',b.getAttribute('data-a'));C.set('rb',b.getAttribute('data-b'));fire();});
  $('pre4').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;$('parts').value=b.getAttribute('data-p');C.set('tot',b.getAttribute('data-t'));fire();});
  $('swap').addEventListener('click',function(){if($('mode').value==='s4'){$('parts').value=String($('parts').value).split(/[\s,:;]+/).filter(Boolean).reverse().join(', ');}else{var x=$('ra').value;C.set('ra',$('rb').value);C.set('rb',x);}fire();});
  document.querySelector('#rtCalc [data-action=reset]').addEventListener('click',function(){$('parts').value=defParts;fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Gleichung kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
