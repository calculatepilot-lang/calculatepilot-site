/* 3D distance calculator — CalculatePilot (Stitch redesign).
   d = √(Δx²+Δy²+Δz²) · midpoint · direction cosines Δ/d · spherical r, azimuth atan2(Δy,Δx), polar arccos(Δz/d)
   Manhattan Σ|Δ|, Chebyshev max|Δ|, Minkowski (Σ|Δ|^p)^(1/p) · point-plane |Ax₀+By₀+Cz₀+D|/√(A²+B²+C²) · bounding box of two corners. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='';

function esc(s){return C.esc(s);}
function cl(x){return Math.abs(x)<1e-13?0:x;}
function fx(x,dp){return M.fmt(cl(x),dp);}
function radical(N){if(!(N>=0)||Math.abs(N-Math.round(N))>1e-9||N>1e14)return null;N=Math.round(N);if(N===0)return '0';var k=1,m=N,p;for(p=2;p*p<=m&&p<=1e7;p++){while(m%(p*p)===0){m/=p*p;k*=p;}}return m===1?String(k):(k===1?'√'+m:k+'√'+m);}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}

function draw(a,b,box){
  var W=760,H=340,pad=48,pr=function(p){return [p[0]-0.5*Math.cos(PI/4)*p[2],p[1]-0.5*Math.sin(PI/4)*p[2]];};
  var lo=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.min(a[2],b[2])],hi=[Math.max(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[2],b[2])],cs=[];
  for(var i=0;i<8;i++)cs.push([i&1?hi[0]:lo[0],i&2?hi[1]:lo[1],i&4?hi[2]:lo[2]]);
  var all=cs.map(pr).concat([pr([0,0,0])]),xs=all.map(function(q){return q[0];}),ys=all.map(function(q){return q[1];});
  var minx=Math.min.apply(null,xs),maxx=Math.max.apply(null,xs),miny=Math.min.apply(null,ys),maxy=Math.max.apply(null,ys);if(maxx===minx){maxx+=1;minx-=1;}if(maxy===miny){maxy+=1;miny-=1;}
  var k=Math.min((W-2*pad)/(maxx-minx),(H-2*pad)/(maxy-miny)),ox=(W-(maxx-minx)*k)/2-minx*k,oy=(H-(maxy-miny)*k)/2+maxy*k,X=function(p){return (ox+pr(p)[0]*k).toFixed(1);},Y=function(p){return (oy-pr(p)[1]*k).toFixed(1);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  var edges=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  edges.forEach(function(e){s+='<line x1="'+X(cs[e[0]])+'" y1="'+Y(cs[e[0]])+'" x2="'+X(cs[e[1]])+'" y2="'+Y(cs[e[1]])+'" stroke="var(--sx-primary)" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="4 3"/>';});
  if(!box){s+='<line x1="'+X(a)+'" y1="'+Y(a)+'" x2="'+X(b)+'" y2="'+Y(b)+'" stroke="var(--sx-primary)" stroke-width="3"/>';var mid=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];s+='<circle cx="'+X(mid)+'" cy="'+Y(mid)+'" r="4.5" fill="#d97706"/><text class="ax" x="'+(+X(mid)+8)+'" y="'+(+Y(mid)-8)+'" style="fill:#b45309;font-weight:700">M</text>';}
  else s+='<line x1="'+X(a)+'" y1="'+Y(a)+'" x2="'+X(b)+'" y2="'+Y(b)+'" stroke="#d97706" stroke-width="2.5"/>';
  [[a,'P₁','var(--sx-pc)'],[b,'P₂','#2563eb']].forEach(function(p){s+='<circle cx="'+X(p[0])+'" cy="'+Y(p[0])+'" r="5.5" fill="'+p[2]+'"/><text class="ax" x="'+(+X(p[0])+9)+'" y="'+(+Y(p[0])-9)+'" style="font-weight:700;fill:var(--sx-on)">'+p[1]+' ('+esc(M.fmt(p[0][0],4))+', '+esc(M.fmt(p[0][1],4))+', '+esc(M.fmt(p[0][2],4))+')</text>';});
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,u=$('un').value.trim(),us=u?' '+u:'',h='',n=0;
  $('p1').hidden=!(m==='s1'||m==='s4');$('p2').hidden=m!=='s2';$('p3').hidden=m!=='s3';$('fP').hidden=m!=='s1';$('presets').hidden=!(m==='s1'||m==='s4');$('swap').hidden=!(m==='s1');
  C.text('formH',{s1:'Zwei Punkte im 3D-Raum',s2:'Abstand eines Punktes zu einer Ebene',s3:'Länge eines 3D-Vektors',s4:'Umgebender Quader zweier Eckpunkte'}[m]);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(fx(x,dp));},tg=$('tag');tg.className='sx-ef-grade';
  if(m==='s1'||m==='s4'||m==='s3'){
    var a,b,d;
    if(m==='s3'){d=[v('vx'),v('vy'),v('vz')];a=[0,0,0];b=d.slice();}else{a=[v('x1'),v('y1'),v('z1')];b=[v('x2'),v('y2'),v('z2')];d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];}
    var N=d[0]*d[0]+d[1]*d[1]+d[2]*d[2],dist=Math.sqrt(N),rad=radical(N),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],man=Math.abs(d[0])+Math.abs(d[1])+Math.abs(d[2]),cheb=Math.max(Math.abs(d[0]),Math.abs(d[1]),Math.abs(d[2]));
    C.text('fxNow',m==='s3'?'v = ('+M.fmt(d[0],4)+', '+M.fmt(d[1],4)+', '+M.fmt(d[2],4)+')':'v = P₂ − P₁ = ('+M.fmt(b[0],4)+' − '+M.fmt(a[0],4)+', '+M.fmt(b[1],4)+' − '+M.fmt(a[1],4)+', '+M.fmt(b[2],4)+' − '+M.fmt(a[2],4)+') = ('+M.fmt(d[0],4)+', '+M.fmt(d[1],4)+', '+M.fmt(d[2],4)+')');
    if(m==='s4'){
      var lx=Math.abs(d[0]),ly=Math.abs(d[1]),lz=Math.abs(d[2]);
      C.text('heroLbl','Raumdiagonale');C.text('resultValue',fx(dist,dp)+us);C.text('ex1L','Quadervolumen');C.text('ex1',fx(lx*ly*lz,dp)+(u?' '+u+'³':''));C.text('ex2L','Oberfläche');C.text('ex2',fx(2*(lx*ly+lx*lz+ly*lz),dp)+(u?' '+u+'²':''));tg.textContent='Begrenzungsquader';
      C.text('interp','Die beiden Eckpunkte spannen einen Quader auf '+fx(lx,4)+' × '+fx(ly,4)+' × '+fx(lz,4)+'; die Raumdiagonale ist der geradlinige Abstand zwischen den Eckpunkten.');
      tiles([['Abmessungen (Δx × Δy × Δz)',fx(lx,dp)+' × '+fx(ly,dp)+' × '+fx(lz,dp),'Kantenlängen'],['Flächendiagonalen',fx(Math.hypot(lx,ly),dp)+', '+fx(Math.hypot(lx,lz),dp)+', '+fx(Math.hypot(ly,lz),dp),'xy, xz, yz'],['Mittelpunkt','('+fx(mid[0],4)+', '+fx(mid[1],4)+', '+fx(mid[2],4)+')','Mitte der Diagonale'],['Gesamte Kantenlänge',fx(4*(lx+ly+lz),dp)+us,'4(l + w + h)']]);
      draw(a,b,true);C.text('vizTag',fx(lx,3)+' × '+fx(ly,3)+' × '+fx(lz,3));C.text('vizNote','Der von zwei gegenüberliegenden Eckpunkten aufgespannte Quader; die orangefarbene Linie ist die Raumdiagonale.');
      st('Kantenlängen','Absolute Koordinatendifferenzen.','Δx = '+f(lx)+',  Δy = '+f(ly)+',  Δz = '+f(lz));st('Raumdiagonale','Zweimal der Satz des Pythagoras.','d = √(Δx² + Δy² + Δz²) = √'+f(N)+' = <b>'+f(dist)+esc(us)+'</b>');st('Volumen und Oberfläche','','V = '+f(lx*ly*lz)+',  S = 2(lw + lh + wh) = '+f(2*(lx*ly+lx*lz+ly*lz)));
      last='Umgebender Quader – calculatepilot.com/math/distance-3d-calculator.html\n'+fx(lx,8)+' × '+fx(ly,8)+' × '+fx(lz,8)+'\nRaumdiagonale = '+fx(dist,8)+'\nVolumen = '+fx(lx*ly*lz,8);
    }else{
      var cosd=dist>0?d.map(function(x){return x/dist;}):[NaN,NaN,NaN],ang=cosd.map(function(c){return Math.acos(Math.max(-1,Math.min(1,c)))*180/PI;}),az=Math.atan2(d[1],d[0])*180/PI,pol=dist>0?Math.acos(Math.max(-1,Math.min(1,d[2]/dist)))*180/PI:NaN,p=Math.max(1,v('mp')||3),mk=Math.pow(Math.pow(Math.abs(d[0]),p)+Math.pow(Math.abs(d[1]),p)+Math.pow(Math.abs(d[2]),p),1/p);
      C.text('heroLbl',m==='s3'?'Vektorlänge |v|':'Euklidischer Abstand');C.text('resultValue',fx(dist,dp)+us);C.text('ex1L','Exakte Wurzel');C.text('ex1',rad?(rad.indexOf('√')<0?rad+' (exact)':rad):'√'+fx(N,6));C.text('ex2L','Quadrierte Länge');C.text('ex2',fx(N,dp));
      tg.textContent=dist===0?'Gleicher Punkt':'3D '+(m==='s3'?'vector':'distance');C.text('interp',m==='s3'?'Der Vektor hat die Länge '+fx(dist,6)+'.':'Der geradlinige Abstand zwischen den Punkten beträgt '+fx(dist,6)+(u?' '+u:'')+'.');
      tiles([['Verschiebungsvektor','('+fx(d[0],dp)+', '+fx(d[1],dp)+', '+fx(d[2],dp)+')','P₂ − P₁']].concat(m==='s3'?[]:[['Mittelpunkt M','('+fx(mid[0],4)+', '+fx(mid[1],4)+', '+fx(mid[2],4)+')','auf halbem Weg zwischen']]).concat([['Richtungswinkel (α, β, γ)',isFinite(ang[0])?ang.map(function(x){return fx(x,4)+'°';}).join(', '):'undefined','mit der x-, y-, z-Achse'],['Richtungskosinus',isFinite(cosd[0])?cosd.map(function(x){return fx(x,4);}).join(', '):'undefined','Δ ÷ d; Quadrate ergeben in der Summe 1'],['Manhattan-Distanz',fx(man,dp),'|Δx| + |Δy| + |Δz|'],['Tschebyschow-Distanz',fx(cheb,dp),'max |Δ|'],['Minkowski (p = '+fx(p,3)+')',fx(mk,dp),'(Σ|Δ|ᵖ)^(1/p)'],['Kugelkoordinaten (r, Azimut, Polarwinkel)',isFinite(pol)?fx(dist,4)+', '+fx(az,3)+'°, '+fx(pol,3)+'°':'undefined','r, atan2(Δy, Δx), arccos(Δz/r)']]));
      draw(a,b,false);C.text('vizTag','d = '+fx(dist,4));C.text('vizNote','Schiefe Projektion: der blaue und der grüne Punkt, verbunden durch die Abstandslinie, innerhalb ihres umgebenden Quaders.');
      st('Koordinatendifferenzen','Auf jeder Achse subtrahieren.','Δx = '+f(d[0])+',  Δy = '+f(d[1])+',  Δz = '+f(d[2]));
      st('Den Satz des Pythagoras auf 3D erweitern','Zuerst über den Boden, dann die Höhe hinauf.','d² = Δx² + Δy² + Δz² = '+f(d[0]*d[0])+' + '+f(d[1]*d[1])+' + '+f(d[2]*d[2])+' = <b>'+f(N)+'</b>');
      st('Die Quadratwurzel ziehen','Nur die positive Wurzel ist eine Länge.','d = √'+f(N)+' = <b>'+f(dist)+esc(us)+'</b>'+(rad&&rad.indexOf('√')>-1?'  (exact: '+esc(rad)+')':''));
      st('Richtung und andere Normen','Teilen Sie die Verschiebung durch d, um die Richtungskosinus zu erhalten.',isFinite(ang[0])?'cos α, cos β, cos γ = '+cosd.map(function(x){return f(x);}).join(', ')+'<br>Manhattan = <b>'+f(man)+'</b>, Tschebyschow = <b>'+f(cheb)+'</b>':'Die beiden Punkte fallen zusammen, daher ist die Richtung nicht definiert.');
      last='3D-Abstand – calculatepilot.com/math/distance-3d-calculator.html\n'+(m==='s3'?'v = ':'P1 = ('+a.join(', ')+'), P2 = ('+b.join(', ')+')\nΔ = ')+'('+d.join(', ')+')\nd = '+fx(dist,8)+us+(rad&&rad.indexOf('√')>-1?' = '+rad:'')+'\nMittelpunkt = ('+mid.join(', ')+')\nManhattan = '+fx(man,8)+', Tschebyschow = '+fx(cheb,8);
    }
    C.text('stepsIntro',{s1:'Geradliniger Abstand zwischen zwei Punkten.',s3:'Länge eines Vektors aus seinen Komponenten.',s4:'Umgebender Quader zweier gegenüberliegender Eckpunkte.'}[m]);C.text('stepsTag','√(Δx²+Δy²+Δz²)');
  }else{
    var P=[v('px'),v('py'),v('pz')],A=v('pa'),B=v('pb'),Cc=v('pc'),D=v('pd'),nn=Math.sqrt(A*A+B*B+Cc*Cc);
    if(nn===0)return fail('A, B und C dürfen nicht alle 0 sein: Das ist keine Ebene.');
    var num=A*P[0]+B*P[1]+Cc*P[2]+D,sd=num/nn,dist2=Math.abs(sd),foot=[P[0]-A*num/(nn*nn),P[1]-B*num/(nn*nn),P[2]-Cc*num/(nn*nn)],un=[A/nn,B/nn,Cc/nn];
    var rad2=(function(){var q=Math.abs(num);return null;})();
    C.text('fxNow','Abstand = |A·x₀ + B·y₀ + C·z₀ + D| ÷ √(A² + B² + C²)');C.text('heroLbl','Abstand zur Ebene');C.text('resultValue',fx(dist2,dp)+us);C.text('ex1L','Vorzeichenbehafteter Abstand');C.text('ex1',fx(sd,dp));C.text('ex2L','Lotfußpunkt');C.text('ex2','('+fx(foot[0],4)+', '+fx(foot[1],4)+', '+fx(foot[2],4)+')');
    tg.textContent=Math.abs(num)<1e-12?'Der Punkt liegt auf der Ebene':sd>0?'Auf der Seite der Normalen':'Entgegen der Normalen';C.text('interp','Der kürzeste Abstand vom Punkt zur Ebene beträgt '+fx(dist2,6)+(u?' '+u:'')+'.');
    tiles([['Zähler |A·x₀ + B·y₀ + C·z₀ + D|',fx(Math.abs(num),dp),'Ebenengleichung am Punkt'],['Länge der Normalen √(A² + B² + C²)',fx(nn,dp),'|n|'],['Einheitsnormale n̂','('+fx(un[0],4)+', '+fx(un[1],4)+', '+fx(un[2],4)+')','n ÷ |n|'],['Vorzeichenbehafteter Abstand',fx(sd,dp),'positiv auf der Seite der Normalen']]);
    draw(P,foot,false);C.text('vizTag','d = '+fx(dist2,4));C.text('vizNote','Der Punkt P₁ und der Lotfußpunkt P₂ auf der Ebene (die Ebene selbst ist nicht dargestellt).');
    st('Den Punkt in die Ebenengleichung einsetzen','','A·x₀ + B·y₀ + C·z₀ + D = '+f(A)+'·'+f(P[0])+' + '+f(B)+'·'+f(P[1])+' + '+f(Cc)+'·'+f(P[2])+' + '+f(D)+' = <b>'+f(num)+'</b>');st('Länge des Normalenvektors','','√(A² + B² + C²) = √'+f(nn*nn)+' = <b>'+f(nn)+'</b>');st('Dividieren','Der Betrag ergibt den Abstand.','d = |'+f(num)+'| ÷ '+f(nn)+' = <b>'+f(dist2)+esc(us)+'</b>');st('Lotfußpunkt','Vom Punkt aus um den vorzeichenbehafteten Abstand entlang −n̂ gehen.','Fußpunkt = P − (Zähler ÷ |n|²)·n = <b>('+f(foot[0])+', '+f(foot[1])+', '+f(foot[2])+')</b>');
    last='Punkt zu Ebene – calculatepilot.com/math/distance-3d-calculator.html\nP = ('+P.join(', ')+'), Ebene '+A+'x + '+B+'y + '+Cc+'z + '+D+' = 0\nAbstand = '+fx(dist2,8)+us;C.text('stepsIntro','Senkrechter Abstand von einem Punkt zu einer Ebene.');C.text('stepsTag','|Ax₀+By₀+Cz₀+D| ÷ |n|');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('x1').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'d3Calc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;var a=b.getAttribute('data-p').split(',');['x1','y1','z1','x2','y2','z2'].forEach(function(id,i){C.set(id,a[i]);});fire();});
  $('swap').addEventListener('click',function(){[['x1','x2'],['y1','y2'],['z1','z2']].forEach(function(p){var t=$(p[0]).value;C.set(p[0],$(p[1]).value);C.set(p[1],t);});fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
