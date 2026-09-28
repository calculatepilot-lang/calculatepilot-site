/* Area calculator — CalculatePilot (Stitch redesign).
   11 shapes. Heron A=√[s(s−a)(s−b)(s−c)] · SAS A=½ab·sin C · Shoelace A=½|Σ(xᵢyᵢ₊₁−xᵢ₊₁yᵢ)| · regular n-gon A=ns²/(4tan(π/n))
   Ellipse perimeter ≈ Ramanujan II: π(a+b)(1+3h/(10+√(4−3h))), h=((a−b)/(a+b))². Unit table uses exact factors to m². */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='',prev='';
var TOM={mm:0.001,cm:0.01,m:1,km:1000,'in':0.0254,ft:0.3048,yd:0.9144,mi:1609.344};
var CFG={
 rect:{h:'Rectangle / square',f:[['Length',12],['Width',8]],fx:'A = l × w'},
 tbh:{h:'Triangle from base and height',f:[['Base',10],['Height (perpendicular)',6]],fx:'A = ½ × b × h'},
 tsss:{h:'Triangle from three sides',f:[['Side a',13],['Side b',14],['Side c',15]],fx:'A = √[s(s − a)(s − b)(s − c)],  s = (a + b + c) ÷ 2'},
 tsas:{h:'Triangle from two sides and the angle between',f:[['Side a',7],['Side b',10],['Included angle C (degrees)',65]],fx:'A = ½ × a × b × sin C'},
 circ:{h:'Circle',f:[['Radius (r)',6.5]],fx:'A = π × r²'},
 sect:{h:'Circular sector',f:[['Radius (r)',6.5],['Central angle (degrees)',60]],fx:'A = ½ × r² × θ  (θ in radians)'},
 trap:{h:'Trapezoid',f:[['Parallel side a',8],['Parallel side b',5],['Height (perpendicular)',4]],fx:'A = ½ × (a + b) × h'},
 para:{h:'Parallelogram',f:[['Base',9],['Height (perpendicular)',5]],fx:'A = base × height'},
 ell:{h:'Ellipse',f:[['Semi-major axis (a)',5],['Semi-minor axis (b)',3]],fx:'A = π × a × b'},
 poly:{h:'Regular polygon',f:[['Number of sides (n)',6],['Side length (s)',6]],fx:'A = n × s² ÷ (4 × tan(π ÷ n))'},
 irr:{h:'Irregular polygon (Shoelace formula)',f:[],fx:'A = ½ |Σ (xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ)|'},
 ann:{h:'Annulus (ring)',f:[['Outer radius (R)',10],['Inner radius (r)',6]],fx:'A = π × (R² − r²)'}
};

function esc(s){return C.esc(s);}
function un(){return $('un').value;}
function L(){return ' '+un();}
function A2(){return ' '+un()+'²';}
function fx(x,dp){return isFinite(x)?M.fmt(x,dp):'—';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','per','ex'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';$('cvTbl').tBodies[0].innerHTML='';C.text('vizTag','—');last='';}

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
function convert(A){var rows=[['Square millimetres (mm²)',1e-6],['Square centimetres (cm²)',1e-4],['Square metres (m²)',1],['Square kilometres (km²)',1e6],['Square inches (in²)',0.0254*0.0254],['Square feet (ft²)',0.3048*0.3048],['Square yards (yd²)',0.9144*0.9144],['Acres',4046.8564224],['Hectares (ha)',1e4],['Square miles (mi²)',1609.344*1609.344]],f=TOM[un()],m2=A*f*f;
  var act={mm:0,cm:1,m:2,km:3,'in':4,ft:5,yd:6,mi:9}[un()];
  $('cvTbl').tBodies[0].innerHTML=rows.map(function(r,i){return '<tr'+(i===act?' class="act"':'')+'><td style="font-family:inherit;white-space:normal">'+esc(r[0])+(i===act?' <span class="act">input</span>':'')+'</td><td class="mono">'+esc(M.fmt(m2/r[1],8))+'</td><td class="mono" style="font-size:12px">'+esc(M.fmt(r[1],10))+'</td></tr>';}).join('');}

function segX(p,q,r,s){function o(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}var d1=o(p,q,r),d2=o(p,q,s),d3=o(r,s,p),d4=o(r,s,q);return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));}

function compute(){
  var sh=$('shape').value,cfg=CFG[sh],dp=+$('dp').value,h='',n=0,tg=$('tag');tg.className='sx-ef-grade';
  if(sh!==prev){[1,2,3].forEach(function(i){var d=cfg.f[i-1];if(d){C.set('p'+i,d[1]);}});prev=sh;}
  [1,2,3].forEach(function(i){var d=cfg.f[i-1];$('g'+i).hidden=!d;if(d)C.text('l'+i,d[0]);});$('fNum').hidden=sh==='irr';$('fIrr').hidden=sh!=='irr';
  C.text('formH',cfg.h);C.text('fxNow',cfg.fx);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));},p1=v('p1'),p2=v('p2'),p3=v('p3'),A,P=NaN,ex='—',exL='Exact',sp,tl=[],note='';
  function pos(){for(var i=0;i<arguments.length;i++)if(!(arguments[i]>0))return false;return true;}
  if(sh==='rect'){if(!pos(p1,p2))return fail('Length and width must be greater than 0.');A=p1*p2;P=2*(p1+p2);var dg=Math.hypot(p1,p2);ex=p1===p2?'Square':'Rectangle';exL='Type';
    tl=[['Perimeter',fx(P,dp)+L(),'2(l + w)'],['Diagonal',fx(dg,dp)+L(),'√(l² + w²)'],['Aspect ratio',M.fmt(p1/p2,6),'l ÷ w']];sp={t:'poly',p:[[0,0],[p1,0],[p1,p2],[0,p2]],lab:[[p1/2,-0,'']]};
    st('Multiply length by width','Area of a rectangle.','A = '+f(p1)+' × '+f(p2)+' = <b>'+f(A)+esc(A2())+'</b>');st('Perimeter','','P = 2(l + w) = 2 × ('+f(p1)+' + '+f(p2)+') = <b>'+f(P)+esc(L())+'</b>');}
  else if(sh==='tbh'){if(!pos(p1,p2))return fail('Base and height must be greater than 0.');A=p1*p2/2;tl=[['Base × height',fx(p1*p2,dp)+A2(),'area of the enclosing rectangle'],['Half of that',fx(A,dp)+A2(),'a triangle is half a rectangle']];note='Perimeter needs all three sides.';
    sp={t:'poly',p:[[0,0],[p1,0],[p1*0.35,p2]]};st('Multiply base by height','The perpendicular height.','b × h = '+f(p1)+' × '+f(p2)+' = '+f(p1*p2));st('Halve it','','A = ½ × '+f(p1*p2)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='tsss'){if(!pos(p1,p2,p3))return fail('All three sides must be greater than 0.');if(p1+p2<=p3||p1+p3<=p2||p2+p3<=p1)return fail('These sides cannot form a triangle: each must be shorter than the sum of the other two.');
    var s=(p1+p2+p3)/2;A=Math.sqrt(s*(s-p1)*(s-p2)*(s-p3));P=2*s;var x=(p2*p2+p3*p3-p1*p1)/(2*p3),y=Math.sqrt(Math.max(0,p2*p2-x*x));
    tl=[['Semi-perimeter (s)',fx(s,dp)+L(),'(a + b + c) ÷ 2'],['Perimeter',fx(P,dp)+L(),'a + b + c'],['Height on side c',fx(2*A/p3,dp)+L(),'2A ÷ c'],['Inradius',fx(A/s,dp)+L(),'A ÷ s']];sp={t:'poly',p:[[0,0],[p3,0],[x,y]]};
    st('Semi-perimeter','Half the perimeter.','s = ('+f(p1)+' + '+f(p2)+' + '+f(p3)+') ÷ 2 = <b>'+f(s)+'</b>');st('Heron’s formula','','A = √[s(s − a)(s − b)(s − c)] = √['+f(s)+' × '+f(s-p1)+' × '+f(s-p2)+' × '+f(s-p3)+'] = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='tsas'){if(!pos(p1,p2,p3))return fail('Sides and angle must be greater than 0.');if(p3>=180)return fail('The included angle must be less than 180°.');
    var C0=p3*PI/180;A=0.5*p1*p2*Math.sin(C0);var c3=Math.sqrt(p1*p1+p2*p2-2*p1*p2*Math.cos(C0));P=p1+p2+c3;
    tl=[['Third side (c)',fx(c3,dp)+L(),'Law of Cosines'],['Perimeter',fx(P,dp)+L(),'a + b + c']];sp={t:'poly',p:[[0,0],[p1,0],[p2*Math.cos(C0),p2*Math.sin(C0)]]};
    st('Use the included angle','Area from two sides and the angle between them.','A = ½ × a × b × sin C = ½ × '+f(p1)+' × '+f(p2)+' × sin('+f(p3)+'°) = <b>'+f(A)+esc(A2())+'</b>');st('Third side','Law of Cosines, for the perimeter.','c = √(a² + b² − 2ab·cos C) = <b>'+f(c3)+'</b>');}
  else if(sh==='circ'){if(!pos(p1))return fail('The radius must be greater than 0.');A=PI*p1*p1;P=2*PI*p1;ex=M.fmt(p1*p1,6)+'π'+A2();exL='Exact area';
    tl=[['Diameter',fx(2*p1,dp)+L(),'2r'],['Circumference',fx(P,dp)+L(),'2πr'],['Semicircle area',fx(A/2,dp)+A2(),'A ÷ 2'],['Quadrant area',fx(A/4,dp)+A2(),'A ÷ 4']];sp={t:'circle',a:p1,la:'r = '+M.fmt(p1,4)};
    st('Square the radius','','r² = '+f(p1)+'² = '+f(p1*p1));st('Multiply by π','','A = π × '+f(p1*p1)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='sect'){if(!pos(p1,p2))return fail('Radius and angle must be greater than 0.');if(p2>360)return fail('The angle cannot exceed 360°.');var th=p2*PI/180;A=0.5*p1*p1*th;var arc=p1*th;P=2*p1+arc;
    tl=[['Arc length',fx(arc,dp)+L(),'r × θ'],['Perimeter',fx(P,dp)+L(),'2r + arc'],['Share of the circle',M.fmt(p2/360*100,6)+'%','θ ÷ 360°'],['Full circle area',fx(PI*p1*p1,dp)+A2(),'πr²']];sp={t:'sector',r:p1,th:th};
    st('Convert the angle to radians','','θ = '+f(p2)+'° × π ÷ 180 = <b>'+f(th)+' rad</b>');st('Sector area','','A = ½ × r² × θ = ½ × '+f(p1*p1)+' × '+f(th)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='trap'){if(!pos(p1,p2,p3))return fail('Both parallel sides and the height must be greater than 0.');A=(p1+p2)/2*p3;var mid=(p1+p2)/2;note='Perimeter needs the two slanted sides.';
    tl=[['Mid-segment length',fx(mid,dp)+L(),'(a + b) ÷ 2'],['Sum of the parallel sides',fx(p1+p2,dp)+L(),'a + b']];var off=(p1-p2)/2;sp={t:'poly',p:[[0,0],[p1,0],[p1-off,p3],[off,p3]]};
    st('Average the parallel sides','The mid-segment.','(a + b) ÷ 2 = ('+f(p1)+' + '+f(p2)+') ÷ 2 = <b>'+f(mid)+'</b>');st('Multiply by the height','','A = '+f(mid)+' × '+f(p3)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='para'){if(!pos(p1,p2))return fail('Base and height must be greater than 0.');A=p1*p2;note='Perimeter needs the slanted side.';tl=[['Base × height',fx(A,dp)+A2(),'same as a rectangle of that size']];sp={t:'poly',p:[[0,0],[p1,0],[p1+p2*0.4,p2],[p2*0.4,p2]]};
    st('Multiply base by perpendicular height','The slant does not matter.','A = '+f(p1)+' × '+f(p2)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='ell'){if(!pos(p1,p2))return fail('Both semi-axes must be greater than 0.');A=PI*p1*p2;var hh=Math.pow((p1-p2)/(p1+p2),2);P=PI*(p1+p2)*(1+3*hh/(10+Math.sqrt(4-3*hh)));ex=M.fmt(p1*p2,6)+'π'+A2();exL='Exact area';
    tl=[['Perimeter (approx.)',fx(P,dp)+L(),'Ramanujan II'],['Eccentricity',M.fmt(Math.sqrt(1-Math.pow(Math.min(p1,p2)/Math.max(p1,p2),2)),6),'√(1 − (b/a)²)'],['Circle of the same a',fx(PI*p1*p1,dp)+A2(),'πa²']];sp={t:'ell',a:p1,b:p2,la:'a = '+M.fmt(p1,4),lb:'b = '+M.fmt(p2,4)};
    st('Multiply the semi-axes','','a × b = '+f(p1)+' × '+f(p2)+' = '+f(p1*p2));st('Multiply by π','','A = π × '+f(p1*p2)+' = <b>'+f(A)+esc(A2())+'</b>');st('Perimeter (approximation)','The exact perimeter needs an elliptic integral.','h = ((a − b) ÷ (a + b))² = '+f(hh)+'<br>P ≈ π(a + b)(1 + 3h ÷ (10 + √(4 − 3h))) = <b>'+f(P)+esc(L())+'</b>');}
  else if(sh==='poly'){var nn=Math.round(p1);if(p1!==nn||nn<3||nn>1000)return fail('The number of sides must be a whole number from 3 to 1,000.');if(!pos(p2))return fail('The side length must be greater than 0.');
    var ap=p2/(2*Math.tan(PI/nn)),R=p2/(2*Math.sin(PI/nn));A=nn*p2*p2/(4*Math.tan(PI/nn));P=nn*p2;var pts=[];for(var i=0;i<nn;i++)pts.push([R*Math.cos(2*PI*i/nn+PI/2),R*Math.sin(2*PI*i/nn+PI/2)]);
    tl=[['Perimeter',fx(P,dp)+L(),'n × s'],['Apothem',fx(ap,dp)+L(),'s ÷ (2 tan(π/n))'],['Circumradius',fx(R,dp)+L(),'s ÷ (2 sin(π/n))'],['Interior angle',M.fmt((nn-2)*180/nn,8)+'°','(n − 2) × 180° ÷ n']];sp={t:'poly',p:pts};
    st('Find the apothem','Distance from the centre to the middle of a side.','a = s ÷ (2·tan(π ÷ n)) = '+f(p2)+' ÷ (2·tan(180° ÷ '+nn+')) = <b>'+f(ap)+'</b>');st('Area','Half the apothem times the perimeter.','A = ½ × a × P = ½ × '+f(ap)+' × '+f(P)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='irr'){
    var pts2=[];String($('co').value).split(/\n+/).forEach(function(l){var m=l.trim().split(/[\s,;]+/).map(Number);if(m.length>=2&&isFinite(m[0])&&isFinite(m[1]))pts2.push([m[0],m[1]]);});C.text('coN',pts2.length+' vertices');
    if(pts2.length<3)return fail('Enter at least three vertices, one “x, y” pair per line.');
    var sum=0,per=0,terms=[];for(var j=0;j<pts2.length;j++){var a1=pts2[j],b1=pts2[(j+1)%pts2.length],cr=a1[0]*b1[1]-b1[0]*a1[1];sum+=cr;per+=Math.hypot(b1[0]-a1[0],b1[1]-a1[1]);terms.push(cr);}
    var cross=false;if(pts2.length<=300){var N=pts2.length;for(var a2=0;a2<N&&!cross;a2++)for(var b2=a2+2;b2<N;b2++){if(a2===0&&b2===N-1)continue;if(segX(pts2[a2],pts2[(a2+1)%N],pts2[b2],pts2[(b2+1)%N])){cross=true;break;}}}
    if(cross)return fail('The edges of this polygon cross each other, so the Shoelace formula would not give the enclosed area. List the vertices in order around the boundary.');
    A=Math.abs(sum)/2;P=per;tl=[['Vertices',String(pts2.length),'corners'],['Orientation',sum>0?'anticlockwise':sum<0?'clockwise':'degenerate','sign of the sum'],['Signed sum',fx(sum,dp),'Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)']];sp={t:'poly',p:pts2};
    st('Cross products around the boundary','For each edge take xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ.',terms.slice(0,12).map(function(x){return f(x);}).join(' + ')+(terms.length>12?' + …':'')+' = <b>'+f(sum)+'</b>');st('Halve the absolute value','','A = ½ × |'+f(sum)+'| = <b>'+f(A)+esc(A2())+'</b>');st('Perimeter','Sum of the edge lengths.','P = <b>'+f(P)+esc(L())+'</b>');}
  else{if(!pos(p1,p2))return fail('Both radii must be greater than 0.');if(p2>=p1)return fail('The inner radius must be smaller than the outer radius.');A=PI*(p1*p1-p2*p2);P=2*PI*(p1+p2);ex=M.fmt(p1*p1-p2*p2,6)+'π'+A2();exL='Exact area';
    tl=[['Ring width',fx(p1-p2,dp)+L(),'R − r'],['Outer disc',fx(PI*p1*p1,dp)+A2(),'πR²'],['Inner disc',fx(PI*p2*p2,dp)+A2(),'πr²']];sp={t:'ring',a:p1,r:p2,la:'R = '+M.fmt(p1,4)};
    st('Outer disc minus inner disc','','A = πR² − πr² = π(R² − r²)');st('Substitute','','A = π × ('+f(p1*p1)+' − '+f(p2*p2)+') = <b>'+f(A)+esc(A2())+'</b>');}
  C.text('heroLbl','Area (A)');C.text('resultValue',fx(A,dp)+A2());C.text('per',isFinite(P)?fx(P,dp)+L():'n/a');C.text('exL',exL);C.text('ex',ex);tg.textContent=cfg.h.split(' (')[0].split(' —')[0].split(' from')[0];
  C.text('interp','The '+cfg.h.toLowerCase().split(' (')[0]+' has an area of '+M.fmt(A,6)+A2()+(isFinite(P)?' and a perimeter of '+M.fmt(P,6)+L():'')+'.'+(note?' '+note:''));
  tiles(tl.length?tl:[['Area',fx(A,dp)+A2(),'']]);draw(sp);C.text('vizTag',cfg.h.split(' (')[0]);C.text('vizNote',sh==='trap'?'Drawn as an isosceles trapezoid; the area does not depend on the slant.':sh==='para'||sh==='tbh'?'Drawn with a typical slant; the area depends only on base and height.':'The shape drawn from your dimensions.');
  convert(A);$('steps').innerHTML=h;C.text('stepsIntro',cfg.h+'.');C.text('stepsTag',cfg.fx.split(',')[0].split('  (')[0]);
  last='Area — calculatepilot.com/math/area-calculator.html\n'+cfg.h+'\nArea = '+M.fmt(A,6)+A2()+(isFinite(P)?'\nPerimeter = '+M.fmt(P,6)+L():'');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'arCalc',compute:compute});prev=$('shape').value;
  document.querySelector('#arCalc [data-action=reset]').addEventListener('click',function(){prev='';$('co').value='0, 0\n100, 0\n100, 60\n40, 90\n0, 60';$('co').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
