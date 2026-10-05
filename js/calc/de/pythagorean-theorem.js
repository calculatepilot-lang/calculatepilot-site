/* Pythagorean theorem calculator — CalculatePilot (Stitch redesign).
   c = √(a²+b²) · leg = √(c²−b²) · 3D distance d = √(Δx²+Δy²+Δz²) · triple check a²+b²=c² with integers (gcd for primitive).
   α = arctan(a/b), area ½ab, inradius (a+b−c)/2, circumradius c/2. Exact radical: N = k²·m → k√m for integer N. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='';
var TOM={mm:0.001,cm:0.01,m:1,km:1000,'in':0.0254,ft:0.3048,yd:0.9144,mi:1609.344};

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function radical(N){/* exact form of √N for a non-negative integer N */
  if(!(N>=0)||Math.abs(N-Math.round(N))>1e-9||N>1e14)return null;N=Math.round(N);if(N===0)return '0';
  var k=1,m=N,p;for(p=2;p*p<=m&&p<=1e7;p++){while(m%(p*p)===0){m/=p*p;k*=p;}}
  return m===1?String(k):(k===1?'√'+m:k+'√'+m);}
function fx(x,dp){return isFinite(x)?M.fmt(x,dp):'—';}
function u(){return $('un').value;}
function us(){return u()?' '+u():'';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';$('eqv').innerHTML='';C.text('vizTag','—');last='';}

function viz(a,b,c){
  var W=760,H=340,pad=28,pts=[[0,0],[a,0],[0,b],[0,-a],[a,-a],[-b,b],[-b,0],[b,a+b],[a+b,a],[b,b+a]],xs=pts.map(function(p){return p[0];}),ys=pts.map(function(p){return p[1];});
  var minx=Math.min.apply(null,xs),maxx=Math.max.apply(null,xs),miny=Math.min.apply(null,ys),maxy=Math.max.apply(null,ys),sc=Math.min((W-2*pad)/(maxx-minx),(H-2*pad)/(maxy-miny)),ox=(W-(maxx-minx)*sc)/2-minx*sc,oy=(H-(maxy-miny)*sc)/2+maxy*sc;
  var X=function(x){return (ox+x*sc).toFixed(1);},Y=function(y){return (oy-y*sc).toFixed(1);},P=function(l){return l.map(function(p){return X(p[0])+','+Y(p[1]);}).join(' ');};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  s+='<polygon points="'+P([[0,0],[a,0],[a,-a],[0,-a]])+'" fill="#d97706" fill-opacity=".18" stroke="#d97706" stroke-width="1.5"/><polygon points="'+P([[0,0],[0,b],[-b,b],[-b,0]])+'" fill="#2563eb" fill-opacity=".16" stroke="#2563eb" stroke-width="1.5"/><polygon points="'+P([[a,0],[0,b],[b,a+b],[a+b,a]])+'" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-pc)" stroke-width="1.5"/>';
  s+='<polygon points="'+P([[0,0],[a,0],[0,b]])+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5" stroke-linejoin="round"/>';
  var q=Math.min(a,b)*0.14;s+='<polyline points="'+P([[q,0],[q,q],[0,q]])+'" fill="none" stroke="var(--sx-primary)" stroke-width="1.5"/>';
  function t(x,y,l,l2,col){return '<text class="ax" x="'+X(x)+'" y="'+(+Y(y)-2)+'" text-anchor="middle" style="font-weight:700;font-size:13px;fill:'+col+'">'+esc(l)+'</text><text class="ax" x="'+X(x)+'" y="'+(+Y(y)+13)+'" text-anchor="middle" style="font-size:11px">'+esc(l2)+'</text>';}
  s+=t(a/2,-a/2,'a² = '+M.fmt(a*a,4),'a = '+M.fmt(a,4),'#b45309')+t(-b/2,b/2,'b² = '+M.fmt(b*b,4),'b = '+M.fmt(b,4),'#1d4ed8')+t((a+b)/2+ (0),(a+b)/2,'c² = '+M.fmt(c*c,4),'c = '+M.fmt(c,4),'var(--sx-primary)');
  $('viz').innerHTML=s+'</svg>';
}

function equiv(val){var m=TOM[u()];if(!m){$('eqv').innerHTML='';return;}var s=val*m,rows=[['Millimeter',s/0.001],['Meter',s],['Zoll',s/0.0254],['Fuß',s/0.3048]];$('eqv').innerHTML=rows.map(function(r){return '<div><span class="sx-au-help" style="margin:0">'+r[0]+'</span><br><b class="sx-mt-sym">'+esc(M.fmt(r[1],4))+'</b></div>';}).join('');}

function rightTri(a,b,c,dp,note){
  var al=Math.atan2(a,b)*180/Math.PI,be=90-al;
  tiles([['Winkel α (gegenüber a)',fx(al,dp)+'°','arctan(a ÷ b)'],['Winkel β (gegenüber b)',fx(be,dp)+'°','90° − α'],['Fläche',fx(a*b/2,dp)+(u()?' '+u()+'²':''),'½ × a × b'],['Umfang',fx(a+b+c,dp)+us(),'a + b + c'],['Inkreisradius',fx((a+b-c)/2,dp)+us(),'(a + b − c) ÷ 2'],['Umkreisradius',fx(c/2,dp)+us(),'c ÷ 2 (halbe Hypotenuse)']]);
  viz(a,b,c);C.text('vizTag','a = '+M.fmt(a,4)+' · b = '+M.fmt(b,4)+' · c = '+M.fmt(c,4));
  return {al:al,be:be};
}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,a=v('a'),b=v('b');
  $('fLegs').hidden=m==='s3'||m==='s4';$('fPts').hidden=m!=='s3';$('fTrip').hidden=m!=='s4';$('presets').hidden=m==='s3';$('vizCard').hidden=m==='s3';$('eqCard').hidden=m==='s4';
  C.text('formH',{s1:'Hypotenuse berechnen',s2:'Fehlende Kathete finden',s3:'Abstand zwischen zwei Punkten im 3D-Raum',s4:'Prüfung auf pythagoreisches Tripel'}[m]);
  C.text('aL',m==='s2'?'Bekannte Kathete':'Seite a (Kathete 1)');C.text('bL',m==='s2'?'Hypotenuse (c)':'Seite b (Kathete 2)');$('swap').hidden=m!=='s1';
  $('err').hidden=true;var h='',n=0;function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));},tg=$('tag');tg.className='sx-ef-grade';
  if(m==='s1'||m==='s2'){
    var leg1,leg2,c;
    if(m==='s1'){if(!(a>0&&b>0))return fail('Beide Katheten müssen größer als 0 sein.');leg1=a;leg2=b;c=Math.sqrt(a*a+b*b);
      C.text('fxNow','c = √(a² + b²) = √('+M.fmt(a,4)+'² + '+M.fmt(b,4)+'²)');C.text('heroLbl','Hypotenuse (c)');
      var N=a*a+b*b,rad=radical(N);C.text('ex1L','Exakte Wurzel');C.text('ex1',rad?(rad.indexOf('√')<0?rad+' (exact)':rad):'√'+M.fmt(N,6));C.text('ex2L','c² = a² + b²');C.text('ex2',M.fmt(N,6)+(u()?' '+u()+'²':''));
      st('Den Satz aufstellen','In einem rechtwinkligen Dreieck ist das Quadrat der Hypotenuse gleich der Summe der Quadrate der Katheten.','a² + b² = c²');
      st('Jede Kathete quadrieren','','a² = '+f(a)+'² = <b>'+f(a*a)+'</b><br>b² = '+f(b)+'² = <b>'+f(b*b)+'</b>');
      st('Addieren','','c² = '+f(a*a)+' + '+f(b*b)+' = <b>'+f(N)+'</b>');
      st('Die Quadratwurzel ziehen','Nur die positive Wurzel ist eine Länge.','c = √'+f(N)+' = <b>'+f(c)+esc(us())+'</b>'+(rad&&rad.indexOf('√')>-1?'  (exact: '+esc(rad)+')':''));
    }else{
      if(!(a>0&&b>0))return fail('Die bekannte Kathete und die Hypotenuse müssen beide größer als 0 sein.');if(b<=a)return fail('Die Hypotenuse ('+M.fmt(b,6)+') muss länger sein als die bekannte Kathete ('+M.fmt(a,6)+').');
      leg1=a;c=b;leg2=Math.sqrt(c*c-a*a);var N2=c*c-a*a,rad2=radical(N2);
      C.text('fxNow','b = √(c² − a²) = √('+M.fmt(c,4)+'² − '+M.fmt(a,4)+'²)');C.text('heroLbl','Fehlende Kathete (b)');C.text('ex1L','Exakte Wurzel');C.text('ex1',rad2?(rad2.indexOf('√')<0?rad2+' (exact)':rad2):'√'+M.fmt(N2,6));C.text('ex2L','b² = c² − a²');C.text('ex2',M.fmt(N2,6)+(u()?' '+u()+'²':''));
      st('Den Satz umstellen','Bringen Sie a² auf die andere Seite.','b² = c² − a²');
      st('Die bekannten Seiten quadrieren','','c² = '+f(c)+'² = <b>'+f(c*c)+'</b><br>a² = '+f(a)+'² = <b>'+f(a*a)+'</b>');
      st('Subtrahieren','','b² = '+f(c*c)+' − '+f(a*a)+' = <b>'+f(N2)+'</b>');
      st('Die Quadratwurzel ziehen','','b = √'+f(N2)+' = <b>'+f(leg2)+esc(us())+'</b>'+(rad2&&rad2.indexOf('√')>-1?'  (exact: '+esc(rad2)+')':''));
    }
    var res=m==='s1'?c:leg2;C.text('resultValue',M.fmt(res,dp)+us());
    var ok=leg1===Math.round(leg1)&&leg2===Math.round(leg2)&&c===Math.round(c)&&Math.abs(leg1*leg1+leg2*leg2-c*c)<1e-9;
    var prim=ok&&gcd(gcd(leg1,leg2),c)===1;
    tg.textContent=ok?(prim?'Primitives pythagoreisches Tripel':'Pythagoreisches Tripel (Vielfaches)'):'Rechtwinkliges Dreieck';
    C.text('interp','Katheten '+M.fmt(leg1,6)+' and '+M.fmt(leg2,6)+', Hypotenuse '+M.fmt(c,6)+'; a² + b² = '+M.fmt(leg1*leg1+leg2*leg2,6)+' = c².');
    var r=rightTri(leg1,leg2,c,dp);equiv(res);
    st('Winkel prüfen','Die beiden spitzen Winkel ergeben zusammen 90°.','α = arctan('+f(leg1)+' ÷ '+f(leg2)+') = '+f(r.al)+'°,  β = 90° − α = '+f(r.be)+'°');
    last='Satz des Pythagoras — calculatepilot.com/math/pythagorean-theorem-calculator.html\na = '+M.fmt(leg1,6)+', b = '+M.fmt(leg2,6)+', c = '+M.fmt(c,6)+us()+'\nFläche = '+M.fmt(leg1*leg2/2,6)+'\nAngles: '+M.fmt(r.al,6)+'°, '+M.fmt(r.be,6)+'°, 90°';
    C.text('stepsIntro',m==='s1'?'Hypotenuse aus zwei Katheten.':'Fehlende Kathete aus einer Kathete und der Hypotenuse.');C.text('stepsTag','a² + b² = c²');
  }else if(m==='s3'){
    var d=[v('x2')-v('x1'),v('y2')-v('y1'),v('z2')-v('z1')],N3=d[0]*d[0]+d[1]*d[1]+d[2]*d[2],dist=Math.sqrt(N3),rad3=radical(N3),plane=Math.sqrt(d[0]*d[0]+d[1]*d[1]);
    C.text('fxNow','d = √(Δx² + Δy² + Δz²)');C.text('heroLbl','Abstand zwischen den Punkten');C.text('resultValue',M.fmt(dist,dp)+us());C.text('ex1L','Exakte Wurzel');C.text('ex1',rad3?(rad3.indexOf('√')<0?rad3+' (exact)':rad3):'√'+M.fmt(N3,6));C.text('ex2L','d² = Δx² + Δy² + Δz²');C.text('ex2',M.fmt(N3,6));
    tg.textContent=dist===0?'Gleicher Punkt':'3D-Abstand';C.text('interp','Verschiebung (Δx, Δy, Δz) = ('+M.fmt(d[0],6)+', '+M.fmt(d[1],6)+', '+M.fmt(d[2],6)+').');
    tiles([['Δx · Δy · Δz',M.fmt(d[0],4)+' · '+M.fmt(d[1],4)+' · '+M.fmt(d[2],4),'Koordinatendifferenzen'],['Abstand in der xy-Ebene',fx(plane,dp)+us(),'√(Δx² + Δy²)'],['Quadrierter Abstand',fx(N3,dp),'Δx² + Δy² + Δz²'],['Mittelpunkt',[(v('x1')+v('x2'))/2,(v('y1')+v('y2'))/2,(v('z1')+v('z2'))/2].map(function(x){return M.fmt(x,4);}).join(', '),'auf halbem Weg zwischen']]);
    equiv(dist);$('viz').innerHTML='';
    st('Die Koordinatendifferenzen bestimmen','Subtrahieren Sie Punkt 1 von Punkt 2 auf jeder Achse.','Δx = '+f(d[0])+',  Δy = '+f(d[1])+',  Δz = '+f(d[2]));
    st('Den Satz auf die Grundfläche anwenden','Bestimmen Sie zuerst den Abstand in der xy-Ebene.','√(Δx² + Δy²) = √('+f(d[0]*d[0])+' + '+f(d[1]*d[1])+') = <b>'+f(plane)+'</b>');
    st('Noch einmal anwenden, nach oben','Verbinden Sie den Abstand in der Grundfläche mit der Höhe Δz.','d = √('+f(plane*plane)+' + '+f(d[2]*d[2])+') = √'+f(N3)+' = <b>'+f(dist)+esc(us())+'</b>');
    last='3D-Abstand — calculatepilot.com/math/pythagorean-theorem-calculator.html\nd = '+M.fmt(dist,6)+us()+' (d² = '+M.fmt(N3,6)+')';C.text('stepsIntro','Abstand zwischen zwei Punkten im Raum.');C.text('stepsTag','√(Δx²+Δy²+Δz²)');
  }else{
    var t=[v('t1'),v('t2'),v('t3')];C.text('fxNow','prüfen Sie a² + b² = c², wobei c die größte Zahl ist');
    if(t.some(function(x){return !(x>0)||x!==Math.round(x)||x>9e7;}))return fail('Geben Sie drei ganze Zahlen zwischen 1 und 90.000.000 ein.');
    t.sort(function(p,q){return p-q;});var A=t[0],B=t[1],Cc=t[2],lhs=A*A+B*B,rhs=Cc*Cc,ok2=lhs===rhs,g=gcd(gcd(A,B),Cc);
    C.text('heroLbl','Ist es ein pythagoreisches Tripel?');C.text('resultValue',ok2?'Ja':'No');C.text('ex1L','a² + b²');C.text('ex1',String(lhs));C.text('ex2L','c²');C.text('ex2',String(rhs));
    tg.textContent=ok2?(g===1?'Primitives Tripel':'Vielfaches von '+A/g+'-'+B/g+'-'+Cc/g):(lhs>rhs?'Spitzwinkliges Dreieck':'Stumpfwinkliges Dreieck');tg.className='sx-ef-grade'+(ok2?'':' mid');
    C.text('interp',ok2?A+'² + '+B+'² = '+Cc+'²: Diese Zahlen bilden ein rechtwinkliges Dreieck.':(lhs>rhs?'a² + b² ist größer als c², daher bilden diese Seiten ein spitzwinkliges Dreieck (sofern sie überhaupt ein Dreieck bilden).':'a² + b² ist kleiner als c², daher bilden diese Seiten ein stumpfwinkliges Dreieck oder kein Dreieck, wenn a + b ≤ c.'));
    var mm=null;if(ok2&&g===1){/* Euclid: a=m²−n², b=2mn, c=m²+n² */var mn=(Cc+ (A%2? A : B))/2;var Mv=Math.sqrt((Cc+(A%2?A:B))/2),Nv=Math.sqrt((Cc-(A%2?A:B))/2);if(Number.isInteger(Mv)&&Number.isInteger(Nv))mm=[Mv,Nv];}
    tiles([['Sortierte Seiten',A+', '+B+', '+Cc,'c ist die größte'],['Größter gemeinsamer Teiler',String(g),g===1?'primitive':'skaliert mit '+g],['Euklids m, n',mm?mm[0]+', '+mm[1]:'—','a = m² − n², b = 2mn, c = m² + n²'],['Dreiecksungleichung',(A+B>Cc)?'Gültiges Dreieck':'Kein Dreieck','a + b muss größer sein als c']]);
    if(ok2)rightTri(A,B,Cc,dp);else{$('viz').innerHTML='';C.text('vizTag','kein rechtwinkliges Dreieck');}
    st('Sortieren und quadrieren','Die Hypotenuse ist die größte Zahl.',A+'² = '+A*A+',  '+B+'² = '+B*B+',  '+Cc+'² = '+rhs);
    st('Vergleichen','Ein rechtwinkliges Dreieck erfordert a² + b² = c².',A*A+' + '+B*B+' = <b>'+lhs+'</b>  '+(ok2?'=':'≠')+'  '+rhs);
    st('Einordnen','',ok2?'gcd('+A+', '+B+', '+Cc+') = '+g+' → '+(g===1?'<b>primitives Tripel</b>':'<b>Vielfaches ×'+g+'</b> von '+A/g+'-'+B/g+'-'+Cc/g):(lhs>rhs?'a² + b² > c² → spitzwinklig':'a² + b² < c² → stumpfwinklig'));
    last='Tripel-Prüfung — '+A+', '+B+', '+Cc+': '+(ok2?'Pythagoreisches Tripel':'kein pythagoreisches Tripel')+' (a²+b² = '+lhs+', c² = '+rhs+')';C.text('stepsIntro','Prüfung von '+A+', '+B+', '+Cc+'.');C.text('stepsTag',ok2?'triple':'kein Tripel');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('a').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'pyCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var bt=e.target.closest('button[data-a]');if(!bt)return;var mode=$('mode').value;
    if(mode==='s4'){C.set('t1',bt.getAttribute('data-a'));C.set('t2',bt.getAttribute('data-b'));C.set('t3',bt.getAttribute('data-c'));}
    else if(mode==='s2'){C.set('a',bt.getAttribute('data-a'));C.set('b',bt.getAttribute('data-c'));}
    else{C.set('a',bt.getAttribute('data-a'));C.set('b',bt.getAttribute('data-b'));}fire();});
  $('swap').addEventListener('click',function(){var x=$('a').value;C.set('a',$('b').value);C.set('b',x);fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
