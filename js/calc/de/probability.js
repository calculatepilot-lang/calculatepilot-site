/* Probability calculator — CalculatePilot (Stitch redesign).
   Two events: independent P(A∩B)=P(A)P(B) · mutually exclusive P(A∩B)=0 · custom joint within [max(0,a+b−1), min(a,b)].
   P(A∪B)=P(A)+P(B)−P(A∩B) · P(A|B)=P(A∩B)/P(B).  Bayes: P(A|B)=P(B|A)P(A)/(P(B|A)P(A)+P(B|¬A)P(¬A)).
   Three events: independent or mutually exclusive.  Odds: odds = p/(1−p), p = a/(a+b), 1 in N = 1/p. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last='',prevFmt='s1',PIDS=['pa','pb','pj','pr','se','fp','qa','qb','qc','op'];

function pr4(x){return isFinite(x)?(Math.abs(x)<5e-5&&x!==0?x.toExponential(2):(Math.round(x*1e4)/1e4).toFixed(4)):'—';}
function pc(x){return isFinite(x)?(x*100).toFixed(x*100<0.01&&x>0?4:2)+'%':'—';}
function nf(x,dp){return isFinite(x)?C.math.fmt(x,dp===undefined?6:dp):'—';}
function esc(s){return C.esc(s);}
function pv(id){var r=v(id);return $('fmt').value==='s2'?r/100:r;}
function bad(x){return !(x>=-1e-12&&x<=1+1e-12);}
var E=function(x){return Math.min(1,Math.max(0,x));};

function ratio(x){if(!(x>0)||!isFinite(x))return null;var h1=1,h0=0,k1=0,k0=1,y=x,i,a;for(i=0;i<30;i++){a=Math.floor(y);var h2=a*h1+h0,k2=a*k1+k0;h0=h1;h1=h2;k0=k1;k1=k2;if(k1>100000)return null;if(Math.abs(h1/k1-x)<1e-9*Math.max(1,x))return [h1,k1];if(y-a<1e-12)break;y=1/(y-a);}return null;}
function oddsTxt(x){if(x===0)return '0 : 1';if(!isFinite(x))return '—';var r=ratio(x);return r?r[0]+' : '+r[1]:nf(x,4)+' : 1';}

function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b>'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function clear(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('venn').innerHTML='';last='';return false;}
function steps(list){$('steps').innerHTML=list.map(function(s,i){return '<li><span class="n">'+(i+1)+'</span><h4>'+s[0]+'</h4>'+(s[1]?'<p>'+s[1]+'</p>':'')+'<span class="eq">'+s[2]+'</span></li>';}).join('');}

function venn2(A,B,j){
  var W=600,H=250,s='<svg viewBox="0 0 '+W+' '+H+'"><rect x="2" y="2" width="'+(W-4)+'" height="'+(H-4)+'" rx="8" fill="none" stroke="var(--sx-border)" stroke-width="1.5"/><circle cx="235" cy="125" r="88" fill="var(--sx-pc)" fill-opacity=".22" stroke="var(--sx-pc)" stroke-width="2"/><circle cx="365" cy="125" r="88" fill="#d97706" fill-opacity=".22" stroke="#d97706" stroke-width="2"/>';
  function t(x,y,lab,val){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:600;font-size:11px">'+lab+'</text><text class="ax" x="'+x+'" y="'+(y+15)+'" text-anchor="middle" style="font-size:12px;fill:var(--sx-on)">'+pr4(val)+'</text>';}
  s+=t(178,118,'Nur A',A-j)+t(300,118,'A ∩ B',j)+t(422,118,'Nur B',B-j)+t(46,32,'Keines',1-A-B+j);
  s+='<text class="ax" x="235" y="38" text-anchor="middle" style="font-weight:700;font-size:13px;fill:var(--sx-primary)">A  '+pr4(A)+'</text><text class="ax" x="365" y="38" text-anchor="middle" style="font-weight:700;font-size:13px;fill:#b45309">B  '+pr4(B)+'</text>';
  $('venn').innerHTML=s+'</svg>';
}
function venn3(r){
  var W=600,H=320,s='<svg viewBox="0 0 '+W+' '+H+'"><rect x="2" y="2" width="'+(W-4)+'" height="'+(H-4)+'" rx="8" fill="none" stroke="var(--sx-border)" stroke-width="1.5"/><circle cx="245" cy="125" r="90" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-pc)" stroke-width="2"/><circle cx="355" cy="125" r="90" fill="#d97706" fill-opacity=".2" stroke="#d97706" stroke-width="2"/><circle cx="300" cy="215" r="90" fill="#2563eb" fill-opacity=".18" stroke="#2563eb" stroke-width="2"/>';
  function t(x,y,lab,val){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:600;font-size:10px">'+lab+'</text><text class="ax" x="'+x+'" y="'+(y+13)+'" text-anchor="middle" style="font-size:11px;fill:var(--sx-on)">'+pr4(val)+'</text>';}
  s+=t(205,105,'Nur A',r.a)+t(395,105,'Nur B',r.b)+t(300,285,'Nur C',r.c)+t(300,90,'A∩B',r.ab)+t(245,190,'A∩C',r.ac)+t(355,190,'B∩C',r.bc)+t(300,152,'A∩B∩C',r.abc)+t(50,30,'Keine',r.n);
  $('venn').innerHTML=s+'</svg>';
}

function mode1(){
  var a=pv('pa'),b=pv('pb'),rel=$('rel').value,j;
  if(bad(a))return clear('P(A) muss zwischen 0 und 1 liegen (0 % bis 100 %).');if(bad(b))return clear('P(B) muss zwischen 0 und 1 liegen (0 % bis 100 %).');
  a=E(a);b=E(b);
  C.text('relHelp',rel==='s1'?'Das Eintreten eines Ereignisses verändert das andere nicht: P(A ∩ B) = P(A) × P(B).':rel==='s2'?'Die Ereignisse können nicht gleichzeitig eintreten: P(A ∩ B) = 0.':'Geben Sie P(A ∩ B) selbst ein; der Wert muss zu P(A) und P(B) passen.');
  $('fJoint').hidden=rel!=='s3';
  var lo=Math.max(0,a+b-1),hi=Math.min(a,b);
  if(rel==='s1')j=a*b;else if(rel==='s2'){if(a+b>1+1e-12)return clear('Sich gegenseitig ausschließende Ereignisse können kein P(A) + P(B) über 1 haben — hier ergibt die Summe '+nf(a+b,4)+'.');j=0;}
  else{j=pv('pj');if(bad(j))return clear('P(A ∩ B) muss zwischen 0 und 1 liegen.');C.text('pjH','zulässiger Bereich: '+nf(lo,4)+' to '+nf(hi,4));if(j<lo-1e-12||j>hi+1e-12)return clear('Mit P(A) = '+nf(a,4)+' und P(B) = '+nf(b,4)+', muss P(A ∩ B) zwischen '+nf(lo,4)+' and '+nf(hi,4)+'.');j=Math.min(hi,Math.max(lo,j));}
  var u=a+b-j,ab=b>0?j/b:NaN,ba=a>0?j/a:NaN,ind=Math.abs(j-a*b)<1e-12,ex=j===0&&a>0&&b>0;
  C.text('heroLbl','Beide Ereignisse treten ein, P(A ∩ B)');C.text('resultValue',pr4(j));C.text('interp',pc(j)+' — die Wahrscheinlichkeit, dass A und B beide eintreten.');
  var t=$('tag');t.textContent=ex?'Unvereinbar':ind?'Unabhängig':(j>a*b?'Positiv zusammenhängend':'Negativ zusammenhängend');t.className='sx-ef-grade'+(ind||ex?'':' mid');
  tiles([['Vereinigung, P(A ∪ B)',pr4(u),pc(u)+' — A oder B (oder beide)'],['P(A | B)',pr4(ab),b>0?'A unter der Bedingung, dass B eingetreten ist':'nicht definiert, wenn P(B) = 0'],['P(B | A)',pr4(ba),a>0?'B unter der Bedingung, dass A eingetreten ist':'nicht definiert, wenn P(A) = 0'],['Komplement, P(A′)',pr4(1-a),'A tritt nicht ein'],['Komplement, P(B′)',pr4(1-b),'B tritt nicht ein'],['Nur A',pr4(a-j),'A, aber nicht B'],['Nur B',pr4(b-j),'B, aber nicht A'],['Keines',pr4(1-u),'Weder A noch B']]);
  venn2(a,b,j);C.text('vennTag','nicht maßstabsgetreu');
  steps([['Axiome prüfen','Jede Wahrscheinlichkeit muss in [0, 1] liegen.','0 ≤ P(A) = '+nf(a,4)+' ≤ 1  und  0 ≤ P(B) = '+nf(b,4)+' ≤ 1  ✓'],
    ['Schnittmenge: beide treten ein',rel==='s1'?'Unabhängige Ereignisse werden multipliziert.':rel==='s2'?'Sich gegenseitig ausschließende Ereignisse können sich nicht überschneiden.':'Sie haben die gemeinsame Wahrscheinlichkeit angegeben.',rel==='s1'?'P(A ∩ B) = P(A) × P(B) = '+nf(a,6)+' × '+nf(b,6)+' = <b>'+nf(j,6)+'</b>':rel==='s2'?'P(A ∩ B) = <b>0</b>':'P(A ∩ B) = <b>'+nf(j,6)+'</b>'],
    ['Vereinigung: A oder B','Addieren Sie die beiden Wahrscheinlichkeiten und subtrahieren Sie die Überschneidung, damit sie nicht doppelt gezählt wird.','P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = '+nf(a,6)+' + '+nf(b,6)+' − '+nf(j,6)+' = <b>'+nf(u,6)+'</b>'],
    ['Bedingte Wahrscheinlichkeit','Betrachten Sie nur die Fälle, in denen das andere Ereignis eingetreten ist.','P(A | B) = P(A ∩ B) ÷ P(B) = '+(b>0?nf(j,6)+' ÷ '+nf(b,6)+' = <b>'+nf(ab,6)+'</b>':'nicht definiert (P(B) = 0)')+'<br>P(B | A) = '+(a>0?nf(j,6)+' ÷ '+nf(a,6)+' = <b>'+nf(ba,6)+'</b>':'nicht definiert (P(A) = 0)')]]);
  last='Wahrscheinlichkeit — calculatepilot.com/math/probability-calculator.html\nP(A) = '+nf(a,6)+', P(B) = '+nf(b,6)+' ('+t.textContent.toLowerCase()+')\nP(A ∩ B) = '+nf(j,6)+'\nP(A ∪ B) = '+nf(u,6)+'\nP(A | B) = '+nf(ab,6)+'\nP(B | A) = '+nf(ba,6);
  return true;
}

function mode2(){
  var p=pv('pr'),s=pv('se'),f=pv('fp'),N=Math.max(100,Math.round(v('pn')));
  if(bad(p))return clear('Die A-priori-Wahrscheinlichkeit P(A) muss zwischen 0 und 1 liegen.');if(bad(s))return clear('P(B | A) muss zwischen 0 und 1 liegen.');if(bad(f))return clear('P(B | nicht A) muss zwischen 0 und 1 liegen.');
  p=E(p);s=E(s);f=E(f);var pb=s*p+f*(1-p);if(pb===0)return clear('P(B) ergibt 0, daher ist die A-posteriori-Wahrscheinlichkeit nicht definiert. Erhöhen Sie die Richtig-positiv- oder die Falsch-positiv-Rate.');
  var post=s*p/pb,fdr=1-post,pnb=1-pb,npv=pnb>0?(1-f)*(1-p)/pnb:NaN,aNotB=pnb>0?(1-s)*p/pnb:NaN,lr=f>0?s/f:Infinity;
  C.text('heroLbl','A-posteriori-Wahrscheinlichkeit, P(A | B)');C.text('resultValue',pr4(post));C.text('interp',pc(post)+' — die Wahrscheinlichkeit, dass A zutrifft, nachdem B beobachtet wurde, gegenüber einer A-priori-Wahrscheinlichkeit von '+pc(p)+'.');
  var t=$('tag');t.textContent=post>p?'Die Evidenz erhöht P(A)':post<p?'Die Evidenz senkt P(A)':'Die Evidenz ist nicht aussagekräftig';t.className='sx-ef-grade'+(post>p?'':' mid');
  tiles([['Gesamt-P(B)',pr4(pb),'wie oft die Evidenz auftritt'],['P(nicht A | B)',pr4(fdr),'Evidenz tritt auf, aber A ist falsch'],['P(nicht A | nicht B)',pr4(npv),'Entwarnung, wenn B fehlt'],['P(A | nicht B)',pr4(aNotB),'A trifft zu, obwohl B fehlt'],['Likelihood-Quotient (+)',isFinite(lr)?nf(lr,3):'∞','P(B | A) ÷ P(B | nicht A)'],['A-priori-Odds → A-posteriori',oddsTxt(p/(1-p))+' → '+oddsTxt(post/(1-post)),'Odds-Form des Bayes-Theorems']]);
  var wa=N*p,tp=wa*s,wo=N-wa,fpn=wo*f,pos=tp+fpn,q=function(x){return x.toLocaleString('de-DE',{maximumFractionDigits:1});};
  C.text('vennTag','natürliche Häufigkeiten');
  $('venn').innerHTML='<div class="sx-scroll"><table class="sx-au-cmp plain" style="min-width:0"><thead><tr><th scope="col">Von '+q(N)+' Personen</th><th scope="col">B vorhanden</th><th scope="col">B nicht vorhanden</th><th scope="col">Gesamt</th></tr></thead><tbody><tr><td>A trifft zu</td><td class="mono">'+q(tp)+'</td><td class="mono">'+q(wa-tp)+'</td><td class="mono">'+q(wa)+'</td></tr><tr><td>A trifft nicht zu</td><td class="mono">'+q(fpn)+'</td><td class="mono">'+q(wo-fpn)+'</td><td class="mono">'+q(wo)+'</td></tr><tr class="tot"><td>Gesamt</td><td class="mono">'+q(pos)+'</td><td class="mono">'+q(N-pos)+'</td><td class="mono">'+q(N)+'</td></tr></tbody></table></div><p class="sx-au-help" style="margin-top:8px">Von den '+q(pos)+' Fällen, in denen B vorhanden ist, haben '+q(tp)+' A zutreffend: '+q(tp)+' ÷ '+q(pos)+' = '+pc(post)+'.</p>';
  steps([['Eingaben festlegen','A-priori-Wahrscheinlichkeit, Likelihood und Fehlalarmrate.','P(A) = '+nf(p,6)+',  P(B | A) = '+nf(s,6)+',  P(B | nicht A) = '+nf(f,6)],
    ['Gesamtwahrscheinlichkeit der Evidenz','Addieren Sie die beiden Möglichkeiten, wie B eintreten kann (Satz der totalen Wahrscheinlichkeit).','P(B) = P(B | A)·P(A) + P(B | nicht A)·P(nicht A)<br>= '+nf(s,6)+' × '+nf(p,6)+' + '+nf(f,6)+' × '+nf(1-p,6)+' = <b>'+nf(pb,8)+'</b>'],
    ['Satz von Bayes anwenden','Die bedingte Wahrscheinlichkeit umkehren.','P(A | B) = P(B | A)·P(A) ÷ P(B) = '+nf(s*p,8)+' ÷ '+nf(pb,8)+' = <b>'+nf(post,6)+'</b>']]);
  last='Satz von Bayes — calculatepilot.com/math/probability-calculator.html\nA-priori-Wahrscheinlichkeit P(A) = '+nf(p,6)+', P(B|A) = '+nf(s,6)+', P(B|nicht A) = '+nf(f,6)+'\nP(B) = '+nf(pb,8)+'\nP(A|B) = '+nf(post,6)+' ('+pc(post)+')';
  return true;
}

function mode3(){
  var a=pv('qa'),b=pv('qb'),c=pv('qc'),rel=$('rel3').value;
  if(bad(a)||bad(b)||bad(c))return clear('Jede Wahrscheinlichkeit muss zwischen 0 und 1 liegen (0 % bis 100 %).');
  a=E(a);b=E(b);c=E(c);var r,none,one,two,all,any;
  if(rel==='s2'){if(a+b+c>1+1e-12)return clear('Sich gegenseitig ausschließende Ereignisse können keine Wahrscheinlichkeiten haben, die sich zu mehr als 1 addieren — hier ergibt die Summe '+nf(a+b+c,4)+'.');
    r={a:a,b:b,c:c,ab:0,ac:0,bc:0,abc:0,n:1-a-b-c};}
  else r={a:a*(1-b)*(1-c),b:b*(1-a)*(1-c),c:c*(1-a)*(1-b),ab:a*b*(1-c),ac:a*c*(1-b),bc:b*c*(1-a),abc:a*b*c,n:(1-a)*(1-b)*(1-c)};
  none=r.n;one=r.a+r.b+r.c;two=r.ab+r.ac+r.bc;all=r.abc;any=1-none;
  C.text('heroLbl','Mindestens eines tritt ein, P(A ∪ B ∪ C)');C.text('resultValue',pr4(any));C.text('interp',pc(any)+' — die Wahrscheinlichkeit, dass eines oder mehrere der drei Ereignisse eintreten.');
  var t=$('tag');t.textContent=rel==='s2'?'Unvereinbar':'Unabhängig';t.className='sx-ef-grade';
  tiles([['Keines tritt ein',pr4(none),'(1−A)(1−B)(1−C) für unabhängige Ereignisse'],['Genau eines',pr4(one),'ein Ereignis, und nur eines'],['Genau zwei',pr4(two),'zwei Ereignisse, nicht das dritte'],['Alle drei',pr4(all),rel==='s2'?'unmöglich bei sich gegenseitig ausschließenden Ereignissen':'P(A) × P(B) × P(C)'],['Mindestens zwei',pr4(two+all),'zwei oder drei Ereignisse'],['Summenkontrolle',pr4(none+one+two+all),'muss 1 ergeben']]);
  venn3(r);C.text('vennTag','nicht maßstabsgetreu');
  steps(rel==='s2'?[['Axiome prüfen','Jede Wahrscheinlichkeit liegt in [0, 1] und, da sich die Ereignisse gegenseitig ausschließen, muss die Summe höchstens 1 betragen.','P(A) + P(B) + P(C) = '+nf(a+b+c,6)+' ≤ 1  ✓'],['Mindestens eines tritt ein','Sich gegenseitig ausschließende Ereignisse werden einfach addiert.','P(A ∪ B ∪ C) = P(A) + P(B) + P(C) = <b>'+nf(any,6)+'</b>'],['Keines tritt ein','Das Komplement von „mindestens eines“.','1 − '+nf(any,6)+' = <b>'+nf(none,6)+'</b>']]:
    [['Axiome prüfen','Jede Wahrscheinlichkeit liegt in [0, 1].','P(A) = '+nf(a,4)+', P(B) = '+nf(b,4)+', P(C) = '+nf(c,4)+'  ✓'],
     ['Keines tritt ein','Multiplizieren Sie die Komplemente (Unabhängigkeit).','(1 − '+nf(a,6)+')(1 − '+nf(b,6)+')(1 − '+nf(c,6)+') = <b>'+nf(none,6)+'</b>'],
     ['Mindestens eines tritt ein','Verwenden Sie die Komplementregel.','P(A ∪ B ∪ C) = 1 − '+nf(none,6)+' = <b>'+nf(any,6)+'</b>'],
     ['Genau eines und genau zwei','Summieren Sie die entsprechenden Bereiche des Venn-Diagramms.','genau eines = '+nf(r.a,5)+' + '+nf(r.b,5)+' + '+nf(r.c,5)+' = <b>'+nf(one,6)+'</b><br>genau zwei = '+nf(r.ab,5)+' + '+nf(r.ac,5)+' + '+nf(r.bc,5)+' = <b>'+nf(two,6)+'</b><br>alle drei = '+nf(a,4)+' × '+nf(b,4)+' × '+nf(c,4)+' = <b>'+nf(all,6)+'</b>']]);
  last='Drei Ereignisse ('+t.textContent.toLowerCase()+') — calculatepilot.com/math/probability-calculator.html\nP(A) = '+nf(a,6)+', P(B) = '+nf(b,6)+', P(C) = '+nf(c,6)+'\nMindestens eines: '+nf(any,6)+'\nNone: '+nf(none,6)+'\nGenau eines: '+nf(one,6)+'\nGenau zwei: '+nf(two,6)+'\nAlle drei: '+nf(all,6);
  return true;
}

function mode4(){
  var k=$('ok').value,p,T=Math.max(1,Math.round(v('ot')));
  $('o1').hidden=k!=='p';$('o2').hidden=k!=='o';$('o3').hidden=k!=='n';
  if(k==='p'){p=pv('op');if(bad(p))return clear('Die Wahrscheinlichkeit muss zwischen 0 und 1 liegen (0 % bis 100 %).');p=E(p);}
  else if(k==='o'){var oa=v('oa'),ob=v('ob');if(!(oa>=0&&ob>=0&&oa+ob>0))return clear('Geben Sie nicht negative Quoten a und b ein, die nicht beide 0 sind.');p=oa/(oa+ob);}
  else{var n=v('on');if(!(n>=1))return clear('N muss mindestens 1 sein.');p=1/n;}
  var of=p<1?p/(1-p):Infinity,oa2=p>0?(1-p)/p:Infinity,one=p>0?1/p:Infinity,any=1-Math.pow(1-p,T);
  C.text('heroLbl','Wahrscheinlichkeit');C.text('resultValue',pr4(p));C.text('interp',pc(p)+' — entspricht einer Quote von '+oddsTxt(of)+' dafür.');
  var t=$('tag');t.textContent=p===0?'Unmöglich':p===1?'Sicher':p<0.05?'Unwahrscheinlich':p>0.95?'Sehr wahrscheinlich':'Möglich';t.className='sx-ef-grade';
  tiles([['Prozent',pc(p),'p × 100'],['Quote dafür',oddsTxt(of),'p ÷ (1 − p)'],['Quote dagegen',oddsTxt(oa2),'(1 − p) ÷ p'],['1 zu N',isFinite(one)?'1 in '+nf(one,4):'never','1 ÷ p'],['Erwartet in '+T+' trial'+(T===1?'':'s'),nf(p*T,4),'p × Versuche'],['Mindestens einmal in '+T,pr4(any),'1 − (1 − p)^'+T]]);
  $('venn').innerHTML='';
  steps([['Wahrscheinlichkeit ermitteln',k==='p'?'Sie haben sie direkt eingegeben.':k==='o'?'Aus den Quoten a : b ergibt sich p = a ÷ (a + b).':'Aus „1 zu N“ ergibt sich p = 1 ÷ N.','p = <b>'+nf(p,8)+'</b> = '+pc(p)],
    ['In Quoten umrechnen','Quoten vergleichen die Chance, dass etwas eintritt, mit der Chance, dass es nicht eintritt.','dafür = p ÷ (1 − p) = '+nf(of,6)+'  →  <b>'+oddsTxt(of)+'</b><br>dagegen = (1 − p) ÷ p = '+nf(oa2,6)+'  →  <b>'+oddsTxt(oa2)+'</b>'],
    ['Wiederholung über '+T+' unabhängigen Versuch'+(T===1?'':'s'),'Die erwartete Anzahl ist p × T; „mindestens einmal“ verwendet die Komplementregel.','erwartet = '+nf(p,6)+' × '+T+' = <b>'+nf(p*T,4)+'</b><br>P(mindestens einmal) = 1 − (1 − '+nf(p,6)+')^'+T+' = <b>'+nf(any,6)+'</b>']]);
  last='Quoten &amp; Wahrscheinlichkeit — calculatepilot.com/math/probability-calculator.html\np = '+nf(p,8)+' ('+pc(p)+')\nQuote dafür: '+oddsTxt(of)+'\nQuote dagegen: '+oddsTxt(oa2)+'\n1 in '+nf(one,4)+'\nMindestens einmal in '+T+' Versuche: '+nf(any,6);
  return true;
}

function compute(){
  var m=$('mode').value,f=$('fmt').value;
  if(f!==prevFmt){var k=f==='s2'?100:0.01;PIDS.forEach(function(id){var x=parseFloat($(id).value);if(isFinite(x))$(id).value=+(x*k).toPrecision(12);});prevFmt=f;}
  ['p1','p2','p3','p4'].forEach(function(id,i){$(id).hidden=('s'+(i+1))!==m;});$('vennCard').hidden=m==='s4';$('fFmt').hidden=false;
  $('err').hidden=true;
  var ok=(m==='s1'?mode1:m==='s2'?mode2:m==='s3'?mode3:mode4)();
  if(ok)$('err').hidden=true;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'prCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  document.querySelector('#prCalc [data-action=reset]').addEventListener('click',function(){prevFmt='s1';});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
