/* Area calculator — CalculatePilot (Stitch redesign).
   11 shapes. Heron A=√[s(s−a)(s−b)(s−c)] · SAS A=½ab·sin C · Shoelace A=½|Σ(xᵢyᵢ₊₁−xᵢ₊₁yᵢ)| · regular n-gon A=ns²/(4tan(π/n))
   Ellipse perimeter ≈ Ramanujan II: π(a+b)(1+3h/(10+√(4−3h))), h=((a−b)/(a+b))². Unit table uses exact factors to m². */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='',prev='';
var TOM={mm:0.001,cm:0.01,m:1,km:1000,'in':0.0254,ft:0.3048,yd:0.9144,mi:1609.344};
var CFG={
 rect:{h:'Rechteck / Quadrat',f:[['Länge',12],['Breite',8]],fx:'A = l × w'},
 tbh:{h:'Dreieck aus Grundseite und Höhe',f:[['Grundseite',10],['Höhe (senkrecht)',6]],fx:'A = ½ × b × h'},
 tsss:{h:'Dreieck aus drei Seiten',f:[['Seite a',13],['Seite b',14],['Seite c',15]],fx:'A = √[s(s − a)(s − b)(s − c)],  s = (a + b + c) ÷ 2'},
 tsas:{h:'Dreieck aus zwei Seiten und dem eingeschlossenen Winkel',f:[['Seite a',7],['Seite b',10],['Eingeschlossener Winkel C (Grad)',65]],fx:'A = ½ × a × b × sin C'},
 circ:{h:'Kreis',f:[['Radius (r)',6.5]],fx:'A = π × r²'},
 sect:{h:'Kreissektor',f:[['Radius (r)',6.5],['Mittelpunktswinkel (Grad)',60]],fx:'A = ½ × r² × θ  (θ im Bogenmaß)'},
 trap:{h:'Trapez',f:[['Parallele Seite a',8],['Parallele Seite b',5],['Höhe (senkrecht)',4]],fx:'A = ½ × (a + b) × h'},
 para:{h:'Parallelogramm',f:[['Grundseite',9],['Höhe (senkrecht)',5]],fx:'A = Grundseite × Höhe'},
 ell:{h:'Ellipse',f:[['Große Halbachse (a)',5],['Kleine Halbachse (b)',3]],fx:'A = π × a × b'},
 poly:{h:'Regelmäßiges Polygon',f:[['Anzahl der Seiten (n)',6],['Seitenlänge (s)',6]],fx:'A = n × s² ÷ (4 × tan(π ÷ n))'},
 irr:{h:'Unregelmäßiges Vieleck (Gaußsche Trapezformel)',f:[],fx:'A = ½ |Σ (xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ)|'},
 ann:{h:'Kreisring',f:[['Außenradius (R)',10],['Innenradius (r)',6]],fx:'A = π × (R² − r²)'}
};

function esc(s){return C.esc(s);}
function un(){return $('un').value;}
function L(){return ' '+un();}
function A2(){return ' '+un()+'²';}
function fx(x,dp){return isFinite(x)?M.fmt(x,dp):'—';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','per','ex'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';$('cvTbl').tBodies[0].innerHTML='';C.text('vizTag','—');last='';}

function draw(sp){
  var W=760,H=300,pad=28,s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">',bw,bh,k,ox,oy;
  function fit(minx,maxx,miny,maxy){bw=maxx-minx;bh=maxy-miny;k=Math.min((W-2*pad)/bw,(H-2*pad)/bh);ox=(W-bw*k)/2-minx*k;oy=(H-bh*k)/2+maxy*k;}
  var X=function(x){return (ox+x*k).toFixed(1);},Y=function(y){return (oy-y*k).toFixed(1);};
  var fill='fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-primary)" stroke-width="2.5" stroke-linejoin="round"';
  if(sp.t==='poly'){var xs=sp.p.map(function(q){return q[0];}),ys=sp.p.map(function(q){return q[1];});fit(Math.min.apply(null,xs),Math.max.apply(null,xs),Math.min.apply(null,ys),Math.max.apply(null,ys));
    s+='<polygon points="'+sp.p.map(function(q){return X(q[0])+','+Y(q[1]);}).join(' ')+'" '+fill+'/>';
    if(sp.p.length<=12)sp.p.forEach(function(q){s+='<circle cx="'+X(q[0])+'" cy="'+Y(q[1])+'" r="3.5" fill="var(--sx-primary)"/>';});
    (sp.lab||[]).forEach(function(l){s+='<text class="ax" x="'+X(l[0])+'" y="'+(+Y(l[1])+4)+'" text-anchor="middle" style="font-weight:600;font-size:12px;fill:var(--sx-on)">'+esc(l[2])+'</text>';});
  }else if(sp.t==='circle'||sp.t==='ring'||sp.t==='ell'){var a=sp.a,b=sp.b||sp.a;fit(-a,a,-b,b);
    s+='<ellipse cx="'+X(0)+'" cy="'+Y(0)+'" rx="'+(a*k).toFixed(1)+'" ry="'+(b*k).toFixed(1)+'" '+fill+'/>';
    if(sp.t==='ring')s+='<circle cx="'+X(0)+'" cy="'+Y(0)+'" r="'+(sp.r*k).toFixed(1)+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5"/>';
    s+='<line x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(a)+'" y2="'+Y(0)+'" stroke="#d97706" stroke-width="2"/><text class="ax" x="'+(+X(a/2))+'" y="'+(+Y(0)-6)+'" text-anchor="middle" style="font-weight:700;fill:#b45309">'+esc(sp.la||'')+'</text>';
    if(sp.t==='ell')s+='<line x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(0)+'" y2="'+Y(b)+'" stroke="#2563eb" stroke-width="2"/><text class="ax" x="'+(+X(0)+12)+'" y="'+(+Y(b/2))+'" style="font-weight:700;fill:#1d4ed8">'+esc(sp.lb||'')+'</text>';
  }else{/* sector */var r=sp.r,th=sp.th;fit(-r,r,-r,r);var p1=[r*Math.cos(PI/2-th/2),r*Math.sin(PI/2-th/2)],p2=[r*Math.cos(PI/2+th/2),r*Math.sin(PI/2+th/2)];
    s+='<circle cx="'+X(0)+'" cy="'+Y(0)+'" r="'+(r*k).toFixed(1)+'" fill="var(--sx-card)" stroke="var(--sx-border)" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M'+X(0)+' '+Y(0)+' L'+X(p1[0])+' '+Y(p1[1])+' A'+(r*k).toFixed(1)+' '+(r*k).toFixed(1)+' 0 '+(th>PI?1:0)+' 0 '+X(p2[0])+' '+Y(p2[1])+' Z" '+fill+'/>';}
  $('viz').innerHTML=s+'</svg>';
}
function convert(A){var rows=[['Quadratmillimeter (mm²)',1e-6],['Quadratzentimeter (cm²)',1e-4],['Quadratmeter (m²)',1],['Quadratkilometer (km²)',1e6],['Quadratzoll (in²)',0.0254*0.0254],['Quadratfuß (ft²)',0.3048*0.3048],['Quadratyard (yd²)',0.9144*0.9144],['Acres',4046.8564224],['Hektar (ha)',1e4],['Quadratmeilen (mi²)',1609.344*1609.344]],f=TOM[un()],m2=A*f*f;
  var act={mm:0,cm:1,m:2,km:3,'in':4,ft:5,yd:6,mi:9}[un()];
  $('cvTbl').tBodies[0].innerHTML=rows.map(function(r,i){return '<tr'+(i===act?' class="act"':'')+'><td style="font-family:inherit;white-space:normal">'+esc(r[0])+(i===act?' <span class="act">Eingabe</span>':'')+'</td><td class="mono">'+esc(M.fmt(m2/r[1],8))+'</td><td class="mono" style="font-size:12px">'+esc(M.fmt(r[1],10))+'</td></tr>';}).join('');}

function segX(p,q,r,s){function o(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}var d1=o(p,q,r),d2=o(p,q,s),d3=o(r,s,p),d4=o(r,s,q);return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));}

function compute(){
  var sh=$('shape').value,cfg=CFG[sh],dp=+$('dp').value,h='',n=0,tg=$('tag');tg.className='sx-ef-grade';
  if(sh!==prev){[1,2,3].forEach(function(i){var d=cfg.f[i-1];if(d){C.set('p'+i,d[1]);}});prev=sh;}
  [1,2,3].forEach(function(i){var d=cfg.f[i-1];$('g'+i).hidden=!d;if(d)C.text('l'+i,d[0]);});$('fNum').hidden=sh==='irr';$('fIrr').hidden=sh!=='irr';
  C.text('formH',cfg.h);C.text('fxNow',cfg.fx);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));},p1=v('p1'),p2=v('p2'),p3=v('p3'),A,P=NaN,ex='—',exL='Exakt',sp,tl=[],note='';
  function pos(){for(var i=0;i<arguments.length;i++)if(!(arguments[i]>0))return false;return true;}
  if(sh==='rect'){if(!pos(p1,p2))return fail('Länge und Breite müssen größer als 0 sein.');A=p1*p2;P=2*(p1+p2);var dg=Math.hypot(p1,p2);ex=p1===p2?'Quadrat':'Rechteck';exL='Art';
    tl=[['Umfang',fx(P,dp)+L(),'2(l + w)'],['Diagonale',fx(dg,dp)+L(),'√(l² + w²)'],['Seitenverhältnis',M.fmt(p1/p2,6),'l ÷ w']];sp={t:'poly',p:[[0,0],[p1,0],[p1,p2],[0,p2]],lab:[[p1/2,-0,'']]};
    st('Länge mit Breite multiplizieren','Fläche eines Rechtecks.','A = '+f(p1)+' × '+f(p2)+' = <b>'+f(A)+esc(A2())+'</b>');st('Umfang','','P = 2(l + w) = 2 × ('+f(p1)+' + '+f(p2)+') = <b>'+f(P)+esc(L())+'</b>');}
  else if(sh==='tbh'){if(!pos(p1,p2))return fail('Grundseite und Höhe müssen größer als 0 sein.');A=p1*p2/2;tl=[['Grundseite × Höhe',fx(p1*p2,dp)+A2(),'Fläche des umschließenden Rechtecks'],['Die Hälfte davon',fx(A,dp)+A2(),'ein Dreieck ist ein halbes Rechteck']];note='Für den Umfang werden alle drei Seiten benötigt.';
    sp={t:'poly',p:[[0,0],[p1,0],[p1*0.35,p2]]};st('Grundseite mit Höhe multiplizieren','Die senkrechte Höhe.','b × h = '+f(p1)+' × '+f(p2)+' = '+f(p1*p2));st('Halbieren','','A = ½ × '+f(p1*p2)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='tsss'){if(!pos(p1,p2,p3))return fail('Alle drei Seiten müssen größer als 0 sein.');if(p1+p2<=p3||p1+p3<=p2||p2+p3<=p1)return fail('Aus diesen Seiten lässt sich kein Dreieck bilden: Jede muss kürzer sein als die Summe der beiden anderen.');
    var s=(p1+p2+p3)/2;A=Math.sqrt(s*(s-p1)*(s-p2)*(s-p3));P=2*s;var x=(p2*p2+p3*p3-p1*p1)/(2*p3),y=Math.sqrt(Math.max(0,p2*p2-x*x));
    tl=[['Halber Umfang (s)',fx(s,dp)+L(),'(a + b + c) ÷ 2'],['Umfang',fx(P,dp)+L(),'a + b + c'],['Höhe auf Seite c',fx(2*A/p3,dp)+L(),'2A ÷ c'],['Inkreisradius',fx(A/s,dp)+L(),'A ÷ s']];sp={t:'poly',p:[[0,0],[p3,0],[x,y]]};
    st('Semi-perimeter','Der halbe Umfang.','s = ('+f(p1)+' + '+f(p2)+' + '+f(p3)+') ÷ 2 = <b>'+f(s)+'</b>');st('Heronsche Formel','','A = √[s(s − a)(s − b)(s − c)] = √['+f(s)+' × '+f(s-p1)+' × '+f(s-p2)+' × '+f(s-p3)+'] = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='tsas'){if(!pos(p1,p2,p3))return fail('Seiten und Winkel müssen größer als 0 sein.');if(p3>=180)return fail('Der eingeschlossene Winkel muss kleiner als 180° sein.');
    var C0=p3*PI/180;A=0.5*p1*p2*Math.sin(C0);var c3=Math.sqrt(p1*p1+p2*p2-2*p1*p2*Math.cos(C0));P=p1+p2+c3;
    tl=[['Dritte Seite (c)',fx(c3,dp)+L(),'Kosinussatz'],['Umfang',fx(P,dp)+L(),'a + b + c']];sp={t:'poly',p:[[0,0],[p1,0],[p2*Math.cos(C0),p2*Math.sin(C0)]]};
    st('Den eingeschlossenen Winkel verwenden','Fläche aus zwei Seiten und dem Winkel dazwischen.','A = ½ × a × b × sin C = ½ × '+f(p1)+' × '+f(p2)+' × sin('+f(p3)+'°) = <b>'+f(A)+esc(A2())+'</b>');st('Dritte Seite','Kosinussatz, für den Umfang.','c = √(a² + b² − 2ab·cos C) = <b>'+f(c3)+'</b>');}
  else if(sh==='circ'){if(!pos(p1))return fail('Der Radius muss größer als 0 sein.');A=PI*p1*p1;P=2*PI*p1;ex=M.fmt(p1*p1,6)+'π'+A2();exL='Exakte Fläche';
    tl=[['Durchmesser',fx(2*p1,dp)+L(),'2r'],['Umfang',fx(P,dp)+L(),'2πr'],['Fläche des Halbkreises',fx(A/2,dp)+A2(),'A ÷ 2'],['Fläche des Viertelkreises',fx(A/4,dp)+A2(),'A ÷ 4']];sp={t:'circle',a:p1,la:'r = '+M.fmt(p1,4)};
    st('Radius quadrieren','','r² = '+f(p1)+'² = '+f(p1*p1));st('Mit π multiplizieren','','A = π × '+f(p1*p1)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='sect'){if(!pos(p1,p2))return fail('Radius und Winkel müssen größer als 0 sein.');if(p2>360)return fail('Der Winkel darf 360° nicht überschreiten.');var th=p2*PI/180;A=0.5*p1*p1*th;var arc=p1*th;P=2*p1+arc;
    tl=[['Bogenlänge',fx(arc,dp)+L(),'r × θ'],['Umfang',fx(P,dp)+L(),'2r + Bogen'],['Anteil am Kreis',M.fmt(p2/360*100,6)+'%','θ ÷ 360°'],['Fläche des ganzen Kreises',fx(PI*p1*p1,dp)+A2(),'πr²']];sp={t:'sector',r:p1,th:th};
    st('Winkel ins Bogenmaß umrechnen','','θ = '+f(p2)+'° × π ÷ 180 = <b>'+f(th)+' rad</b>');st('Sektorfläche','','A = ½ × r² × θ = ½ × '+f(p1*p1)+' × '+f(th)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='trap'){if(!pos(p1,p2,p3))return fail('Beide parallelen Seiten und die Höhe müssen größer als 0 sein.');A=(p1+p2)/2*p3;var mid=(p1+p2)/2;note='Für den Umfang werden die beiden schrägen Seiten benötigt.';
    tl=[['Länge der Mittellinie',fx(mid,dp)+L(),'(a + b) ÷ 2'],['Summe der parallelen Seiten',fx(p1+p2,dp)+L(),'a + b']];var off=(p1-p2)/2;sp={t:'poly',p:[[0,0],[p1,0],[p1-off,p3],[off,p3]]};
    st('Mittelwert der parallelen Seiten','Die Mittellinie.','(a + b) ÷ 2 = ('+f(p1)+' + '+f(p2)+') ÷ 2 = <b>'+f(mid)+'</b>');st('Mit der Höhe multiplizieren','','A = '+f(mid)+' × '+f(p3)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='para'){if(!pos(p1,p2))return fail('Grundseite und Höhe müssen größer als 0 sein.');A=p1*p2;note='Für den Umfang wird die schräge Seite benötigt.';tl=[['Grundseite × Höhe',fx(A,dp)+A2(),'wie ein Rechteck dieser Größe']];sp={t:'poly',p:[[0,0],[p1,0],[p1+p2*0.4,p2],[p2*0.4,p2]]};
    st('Grundseite mit senkrechter Höhe multiplizieren','Die Schräge spielt keine Rolle.','A = '+f(p1)+' × '+f(p2)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='ell'){if(!pos(p1,p2))return fail('Beide Halbachsen müssen größer als 0 sein.');A=PI*p1*p2;var hh=Math.pow((p1-p2)/(p1+p2),2);P=PI*(p1+p2)*(1+3*hh/(10+Math.sqrt(4-3*hh)));ex=M.fmt(p1*p2,6)+'π'+A2();exL='Exakte Fläche';
    tl=[['Umfang (ca.)',fx(P,dp)+L(),'Ramanujan II'],['Exzentrizität',M.fmt(Math.sqrt(1-Math.pow(Math.min(p1,p2)/Math.max(p1,p2),2)),6),'√(1 − (b/a)²)'],['Kreis mit gleichem a',fx(PI*p1*p1,dp)+A2(),'πa²']];sp={t:'ell',a:p1,b:p2,la:'a = '+M.fmt(p1,4),lb:'b = '+M.fmt(p2,4)};
    st('Halbachsen multiplizieren','','a × b = '+f(p1)+' × '+f(p2)+' = '+f(p1*p2));st('Mit π multiplizieren','','A = π × '+f(p1*p2)+' = <b>'+f(A)+esc(A2())+'</b>');st('Umfang (Näherung)','Der exakte Umfang erfordert ein elliptisches Integral.','h = ((a − b) ÷ (a + b))² = '+f(hh)+'<br>P ≈ π(a + b)(1 + 3h ÷ (10 + √(4 − 3h))) = <b>'+f(P)+esc(L())+'</b>');}
  else if(sh==='poly'){var nn=Math.round(p1);if(p1!==nn||nn<3||nn>1000)return fail('Die Anzahl der Seiten muss eine ganze Zahl von 3 bis 1,000 sein.');if(!pos(p2))return fail('Die Seitenlänge muss größer als 0 sein.');
    var ap=p2/(2*Math.tan(PI/nn)),R=p2/(2*Math.sin(PI/nn));A=nn*p2*p2/(4*Math.tan(PI/nn));P=nn*p2;var pts=[];for(var i=0;i<nn;i++)pts.push([R*Math.cos(2*PI*i/nn+PI/2),R*Math.sin(2*PI*i/nn+PI/2)]);
    tl=[['Umfang',fx(P,dp)+L(),'n × s'],['Apothem',fx(ap,dp)+L(),'s ÷ (2 tan(π/n))'],['Umkreisradius',fx(R,dp)+L(),'s ÷ (2 sin(π/n))'],['Innenwinkel',M.fmt((nn-2)*180/nn,8)+'°','(n − 2) × 180° ÷ n']];sp={t:'poly',p:pts};
    st('Apothem bestimmen','Abstand vom Mittelpunkt zur Mitte einer Seite.','a = s ÷ (2·tan(π ÷ n)) = '+f(p2)+' ÷ (2·tan(180° ÷ '+nn+')) = <b>'+f(ap)+'</b>');st('Fläche','Das halbe Apothem mal der Umfang.','A = ½ × a × P = ½ × '+f(ap)+' × '+f(P)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='irr'){
    var pts2=[];String($('co').value).split(/\n+/).forEach(function(l){var m=l.trim().split(/[\s,;]+/).map(Number);if(m.length>=2&&isFinite(m[0])&&isFinite(m[1]))pts2.push([m[0],m[1]]);});C.text('coN',pts2.length+' vertices');
    if(pts2.length<3)return fail('Geben Sie mindestens drei Eckpunkte ein, ein „x, y“-Paar pro Zeile.');
    var sum=0,per=0,terms=[];for(var j=0;j<pts2.length;j++){var a1=pts2[j],b1=pts2[(j+1)%pts2.length],cr=a1[0]*b1[1]-b1[0]*a1[1];sum+=cr;per+=Math.hypot(b1[0]-a1[0],b1[1]-a1[1]);terms.push(cr);}
    var cross=false;if(pts2.length<=300){var N=pts2.length;for(var a2=0;a2<N&&!cross;a2++)for(var b2=a2+2;b2<N;b2++){if(a2===0&&b2===N-1)continue;if(segX(pts2[a2],pts2[(a2+1)%N],pts2[b2],pts2[(b2+1)%N])){cross=true;break;}}}
    if(cross)return fail('Die Kanten dieses Vielecks überschneiden sich, daher würde die Gaußsche Trapezformel nicht die eingeschlossene Fläche liefern. Listen Sie die Eckpunkte der Reihe nach entlang des Randes auf.');
    A=Math.abs(sum)/2;P=per;tl=[['Eckpunkte',String(pts2.length),'corners'],['Orientierung',sum>0?'anticlockwise':sum<0?'clockwise':'degenerate','Vorzeichen der Summe'],['Vorzeichenbehaftete Summe',fx(sum,dp),'Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)']];sp={t:'poly',p:pts2};
    st('Kreuzprodukte entlang des Randes','Bilden Sie für jede Kante xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ.',terms.slice(0,12).map(function(x){return f(x);}).join(' + ')+(terms.length>12?' + …':'')+' = <b>'+f(sum)+'</b>');st('Den Betrag halbieren','','A = ½ × |'+f(sum)+'| = <b>'+f(A)+esc(A2())+'</b>');st('Umfang','Summe der Kantenlängen.','P = <b>'+f(P)+esc(L())+'</b>');}
  else{if(!pos(p1,p2))return fail('Beide Radien müssen größer als 0 sein.');if(p2>=p1)return fail('Der Innenradius muss kleiner als der Außenradius sein.');A=PI*(p1*p1-p2*p2);P=2*PI*(p1+p2);ex=M.fmt(p1*p1-p2*p2,6)+'π'+A2();exL='Exakte Fläche';
    tl=[['Ringbreite',fx(p1-p2,dp)+L(),'R − r'],['Äußere Scheibe',fx(PI*p1*p1,dp)+A2(),'πR²'],['Innere Scheibe',fx(PI*p2*p2,dp)+A2(),'πr²']];sp={t:'ring',a:p1,r:p2,la:'R = '+M.fmt(p1,4)};
    st('Äußere Scheibe minus innere Scheibe','','A = πR² − πr² = π(R² − r²)');st('Einsetzen','','A = π × ('+f(p1*p1)+' − '+f(p2*p2)+') = <b>'+f(A)+esc(A2())+'</b>');}
  C.text('heroLbl','Fläche (A)');C.text('resultValue',fx(A,dp)+A2());C.text('per',isFinite(P)?fx(P,dp)+L():'n/a');C.text('exL',exL);C.text('ex',ex);tg.textContent=cfg.h.split(' (')[0].split(' —')[0].split(' from')[0];
  C.text('interp','Die/Der '+cfg.h.toLowerCase().split(' (')[0]+' hat eine Fläche von '+M.fmt(A,6)+A2()+(isFinite(P)?' und einen Umfang von '+M.fmt(P,6)+L():'')+'.'+(note?' '+note:''));
  tiles(tl.length?tl:[['Fläche',fx(A,dp)+A2(),'']]);draw(sp);C.text('vizTag',cfg.h.split(' (')[0]);C.text('vizNote',sh==='trap'?'Als gleichschenkliges Trapez gezeichnet; die Fläche hängt nicht von der Schräge ab.':sh==='para'||sh==='tbh'?'Mit typischer Schräge gezeichnet; die Fläche hängt nur von Grundseite und Höhe ab.':'Die Form, gezeichnet nach Ihren Maßen.');
  convert(A);$('steps').innerHTML=h;C.text('stepsIntro',cfg.h+'.');C.text('stepsTag',cfg.fx.split(',')[0].split('  (')[0]);
  last='Fläche — calculatepilot.com/math/area-calculator.html\n'+cfg.h+'\nFläche = '+M.fmt(A,6)+A2()+(isFinite(P)?'\nUmfang = '+M.fmt(P,6)+L():'');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'arCalc',compute:compute});prev=$('shape').value;
  document.querySelector('#arCalc [data-action=reset]').addEventListener('click',function(){prev='';$('co').value='0, 0\n100, 0\n100, 60\n40, 90\n0, 60';$('co').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
