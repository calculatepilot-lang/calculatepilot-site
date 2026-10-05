/* Volume calculator — CalculatePilot (Stitch redesign).
   12 solids with closed-form volume and total surface area; ellipsoid surface uses Thomsen's approximation (p = 1.6075).
   Capacity conversions use exact factors: 1 US gal = 3.785411784 L, 1 imp gal = 4.54609 L, 1 US qt = 0.946352946 L,
   1 ft³ = 28.316846592 L, 1 in³ = 0.016387064 L, 1 petroleum barrel = 42 US gal. Water ≈ 1 kg/L (at about 4 °C). */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='',prev='';
var TOM={mm:0.001,cm:0.01,m:1,'in':0.0254,ft:0.3048,yd:0.9144};
var CFG={
 cube:{h:'Cubo',f:[['Arista (a)',5]],fx:'V = a³'},
 box:{h:'Caja rectangular',f:[['Largo (l)',5],['Ancho (w)',4],['Altura (h)',3]],fx:'V = l × w × h'},
 cyl:{h:'Cilindro',f:[['Radio (r)',28.5],['Altura (h)',85]],fx:'V = π × r² × h'},
 sph:{h:'Esfera',f:[['Radio (r)',6]],fx:'V = (4/3) × π × r³'},
 hemi:{h:'Hemisferio',f:[['Radio (r)',6]],fx:'V = (2/3) × π × r³'},
 cone:{h:'Cono',f:[['Radio (r)',4],['Altura (h)',9]],fx:'V = (1/3) × π × r² × h'},
 frus:{h:'Tronco de cono',f:[['Radio inferior (R)',6],['Radio superior (r)',3],['Altura (h)',8]],fx:'V = (1/3) × π × h × (R² + R·r + r²)'},
 pyr:{h:'Pirámide rectangular',f:[['Largo de la base (l)',6],['Ancho de la base (w)',4],['Altura (h)',9]],fx:'V = (1/3) × l × w × h'},
 tpr:{h:'Prisma triangular (sección transversal isósceles)',f:[['Base del triángulo (b)',6],['Altura del triángulo (t)',4],['Longitud del prisma (L)',10]],fx:'V = ½ × b × t × L'},
 cap:{h:'Cápsula',f:[['Radio (r)',3],['Longitud del cilindro (L)',8]],fx:'V = π × r² × L + (4/3) × π × r³'},
 ell:{h:'Elipsoide',f:[['Semieje a',4],['Semieje b',3],['Semieje c',2]],fx:'V = (4/3) × π × a × b × c'},
 tor:{h:'Toro',f:[['Radio mayor (R)',5],['Radio del tubo (r)',1.5]],fx:'V = 2 × π² × R × r²'}
};

function esc(s){return C.esc(s);}
function un(){return $('un').value;}
function L(){return ' '+un();}
function A2(){return ' '+un()+'²';}
function V3(){return ' '+un()+'³';}
function fx(x,dp){return isFinite(x)?M.fmt(x,dp):'—';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','lit','sa'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';$('cvTbl').tBodies[0].innerHTML='';C.text('vizTag','—');last='';}

function draw(sh,p){
  var W=760,H=320,pad=26,o=[],bbox,s;
  var ell=function(cx,cy,rx,ry,st){return '<ellipse cx="CX" cy="CY" rx="RX" ry="RY" '+st+'/>'.replace('CX',cx);};
  /* we build shapes in model units through closures evaluated after fitting */
  var items=[];
  function poly(pts,st){items.push({t:'poly',pts:pts,st:st});}
  function el(cx,cy,rx,ry,st){items.push({t:'el',cx:cx,cy:cy,rx:rx,ry:ry,st:st});}
  function ln(x1,y1,x2,y2,st){items.push({t:'ln',x1:x1,y1:y1,x2:x2,y2:y2,st:st});}
  function path(pts,st){items.push({t:'path',pts:pts,st:st});}
  var F='fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-primary)" stroke-width="2.2" stroke-linejoin="round"',F2='fill="var(--sx-pc)" fill-opacity=".1" stroke="var(--sx-primary)" stroke-width="2"',D='fill="none" stroke="var(--sx-primary)" stroke-width="1.5" stroke-dasharray="5 4" opacity=".6"';
  var minx,maxx,miny,maxy,ry;
  if(sh==='cube'||sh==='box'||sh==='tpr'){var l=sh==='cube'?p[0]:p[0],hh=sh==='cube'?p[0]:sh==='box'?p[2]:p[1],d=Math.min(l,hh)*0.4,dx=d*0.7,dy=d*0.55;
    if(sh==='tpr'){var b=p[0],t=p[1];poly([[0,0],[dx,dy],[b/2+dx,t+dy],[b/2,t]],F2);poly([[b,0],[b+dx,dy],[b/2+dx,t+dy],[b/2,t]],F2);poly([[0,0],[b,0],[b/2,t]],F);minx=0;maxx=b+dx;miny=0;maxy=t+dy;}
    else{poly([[0,hh],[l,hh],[l+dx,hh+dy],[dx,hh+dy]],F2);poly([[l,0],[l+dx,dy],[l+dx,hh+dy],[l,hh]],F2);poly([[0,0],[l,0],[l,hh],[0,hh]],F);minx=0;maxx=l+dx;miny=0;maxy=hh+dy;}
  }else if(sh==='cyl'){var r=p[0],h=p[1];ry=r*0.3;el(0,0,r,ry,F2);poly([[-r,0],[r,0],[r,h],[-r,h]],F);el(0,h,r,ry,F);minx=-r;maxx=r;miny=-ry;maxy=h+ry;
  }else if(sh==='sph'){var r2=p[0];el(0,0,r2,r2,F);el(0,0,r2,r2*0.3,D);minx=-r2;maxx=r2;miny=-r2;maxy=r2;
  }else if(sh==='hemi'){var r3=p[0];ry=r3*0.3;el(0,0,r3,ry,F2);var pts=[];for(var i=0;i<=60;i++){var a=PI*i/60;pts.push([r3*Math.cos(a),r3*Math.sin(a)]);}path(pts.concat([[-r3,0]]),F);minx=-r3;maxx=r3;miny=-ry;maxy=r3;
  }else if(sh==='cone'){var r4=p[0],h4=p[1];ry=r4*0.3;el(0,0,r4,ry,F2);poly([[-r4,0],[r4,0],[0,h4]],F);minx=-r4;maxx=r4;miny=-ry;maxy=h4;
  }else if(sh==='frus'){var R=p[0],r5=p[1],h5=p[2];var m=Math.max(R,r5);ry=m*0.3;el(0,0,R,R*0.3,F2);poly([[-R,0],[R,0],[r5,h5],[-r5,h5]],F);el(0,h5,r5,r5*0.3,F);minx=-m;maxx=m;miny=-R*0.3;maxy=h5+r5*0.3;
  }else if(sh==='pyr'){var pl=p[0],pw=p[1],ph=p[2],dyy=pw*0.5,dxx=pw*0.5;poly([[0,0],[pl,0],[pl+dxx,dyy],[dxx,dyy]],F2);var ax=(pl+dxx)/2,ay=ph+dyy/2;poly([[0,0],[pl,0],[ax,ay]],F);poly([[pl,0],[pl+dxx,dyy],[ax,ay]],F2);ln(0,0,dxx,dyy,D);ln(dxx,dyy,pl+dxx,dyy,D);ln(dxx,dyy,ax,ay,D);minx=0;maxx=pl+dxx;miny=0;maxy=ay;
  }else if(sh==='cap'){var r6=p[0],L6=p[1];var pts2=[];for(var j=0;j<=30;j++){var a2=-PI/2+PI*j/30;pts2.push([L6+r6*Math.cos(a2)+r6,r6+r6*Math.sin(a2)]);}for(var j2=0;j2<=30;j2++){var a3=PI/2+PI*j2/30;pts2.push([r6+r6*Math.cos(a3),r6+r6*Math.sin(a3)]);}path(pts2,F);ln(r6,0,r6,2*r6,D);ln(r6+L6,0,r6+L6,2*r6,D);minx=0;maxx=L6+2*r6;miny=0;maxy=2*r6;
  }else if(sh==='ell'){var ea=p[0],eb=p[1],ec=p[2];el(0,0,ea,ec,F);el(0,0,ea,Math.min(ea,ec)*0.3,D);minx=-ea;maxx=ea;miny=-ec;maxy=ec;
  }else{var RR=p[0],rt=p[1];el(0,0,RR+rt,RR+rt,F);el(0,0,RR-rt,RR-rt,'fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.2"');el(0,0,RR,RR,D);minx=-RR-rt;maxx=RR+rt;miny=-RR-rt;maxy=RR+rt;}
  var bw=maxx-minx||1,bh=maxy-miny||1,k=Math.min((W-2*pad)/bw,(H-2*pad)/bh),ox=(W-bw*k)/2-minx*k,oy=(H-bh*k)/2+maxy*k,X=function(x){return (ox+x*k).toFixed(1);},Y=function(y){return (oy-y*k).toFixed(1);};
  s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  items.forEach(function(it){
    if(it.t==='poly')s+='<polygon points="'+it.pts.map(function(q){return X(q[0])+','+Y(q[1]);}).join(' ')+'" '+it.st+'/>';
    else if(it.t==='path')s+='<polygon points="'+it.pts.map(function(q){return X(q[0])+','+Y(q[1]);}).join(' ')+'" '+it.st+'/>';
    else if(it.t==='el')s+='<ellipse cx="'+X(it.cx)+'" cy="'+Y(it.cy)+'" rx="'+(it.rx*k).toFixed(1)+'" ry="'+(it.ry*k).toFixed(1)+'" '+it.st+'/>';
    else s+='<line x1="'+X(it.x1)+'" y1="'+Y(it.y1)+'" x2="'+X(it.x2)+'" y2="'+Y(it.y2)+'" '+it.st+'/>';});
  $('viz').innerHTML=s+'</svg>';
}

function conv(V){/* V in input unit³ → litres */var f=TOM[un()],m3=V*f*f*f,Lt=m3*1000;
  var rows=[['Mililitros (mL)',Lt*1000,'laboratorio y dosificación'],['Litros (L)',Lt,'capacidad de líquidos en todo el mundo'],['Metros cúbicos (m³)',m3,'construcción, material a granel'],['Centímetros cúbicos (cm³)',m3*1e6,'cilindrada de motores, piezas pequeñas'],['Galones líquidos de EE. UU.',Lt/3.785411784,'combustible y envases en EE. UU.'],['Galones imperiales (Reino Unido)',Lt/4.54609,'combustible en Reino Unido y la Commonwealth'],['Cuartos de galón de EE. UU.',Lt/0.946352946,'lubricants'],['Pies cúbicos (ft³)',Lt/28.316846592,'climatización y transporte'],['Pulgadas cúbicas (in³)',Lt/0.016387064,'mecanizado, motores'],['Barriles de petróleo (42 gal EE. UU.)',Lt/158.987294928,'industria petrolera']];
  $('cvTbl').tBodies[0].innerHTML=rows.map(function(r){return '<tr><td style="font-family:inherit;white-space:normal">'+esc(r[0])+'</td><td class="mono">'+esc(M.fmt(r[1],8))+'</td><td style="font-family:inherit;white-space:normal;color:var(--sx-muted)">'+esc(r[2])+'</td></tr>';}).join('');
  C.text('cvTag',un()+'³ → litros: ×'+M.fmt(f*f*f*1000,8));C.text('massN','El agua que llena este volumen tiene una masa de aproximadamente '+M.fmt(Lt,6)+' kg (densidad ≈ 1 kg/L a unos 4 °C).');return Lt;}

function compute(){
  var sh=$('shape').value,cfg=CFG[sh],dp=+$('dp').value,h='',n=0,tg=$('tag');tg.className='sx-ef-grade';
  if(sh!==prev){[1,2,3].forEach(function(i){var d=cfg.f[i-1];if(d)C.set('p'+i,d[1]);});prev=sh;}
  [1,2,3].forEach(function(i){var d=cfg.f[i-1];$('g'+i).hidden=!d;if(d)C.text('l'+i,d[0]);});C.text('formH',cfg.h);C.text('fxNow',cfg.fx);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));},p=[v('p1'),v('p2'),v('p3')].slice(0,cfg.f.length);
  if(p.some(function(x){return !(x>0);}))return fail('Todas las dimensiones deben ser mayores que 0.');
  var V,S,tl=[],a=p[0],b=p[1],c=p[2];
  if(sh==='cube'){V=a*a*a;S=6*a*a;tl=[['Diagonal espacial',fx(a*Math.sqrt(3),dp)+L(),'a√3'],['Diagonal de la cara',fx(a*Math.SQRT2,dp)+L(),'a√2'],['Área de la cara',fx(a*a,dp)+A2(),'a²']];st('Eleva la arista al cubo','','V = a³ = '+f(a)+'³ = <b>'+f(V)+esc(V3())+'</b>');st('Seis caras iguales','','S = 6a² = 6 × '+f(a*a)+' = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='box'){V=a*b*c;S=2*(a*b+a*c+b*c);tl=[['Diagonal espacial',fx(Math.sqrt(a*a+b*b+c*c),dp)+L(),'√(l² + w² + h²)'],['Área de la base',fx(a*b,dp)+A2(),'l × w'],['Perímetro de la base',fx(2*(a+b),dp)+L(),'2(l + w)']];st('Multiplica las tres aristas','','V = '+f(a)+' × '+f(b)+' × '+f(c)+' = <b>'+f(V)+esc(V3())+'</b>');st('Suma los tres pares de caras','','S = 2(lw + lh + wh) = 2 × ('+f(a*b)+' + '+f(a*c)+' + '+f(b*c)+') = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='cyl'){V=PI*a*a*b;S=2*PI*a*(a+b);tl=[['Área de la base',fx(PI*a*a,dp)+A2(),'πr²'],['Área lateral (curva)',fx(2*PI*a*b,dp)+A2(),'2πrh'],['Altura ÷ radio',M.fmt(b/a,6),'superficie mínima en 2'],['Cubo del mismo volumen, arista',fx(Math.cbrt(V),dp)+L(),'∛V']];st('Área de la base','Un círculo de radio r.','πr² = π × '+f(a)+'² = '+f(PI*a*a)+esc(A2()));st('Multiplica por la altura','','V = πr²h = '+f(PI*a*a)+' × '+f(b)+' = <b>'+f(V)+esc(V3())+'</b>');st('Área de superficie','Dos bases circulares más la cara curva.','S = 2πr(r + h) = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='sph'){V=4/3*PI*a*a*a;S=4*PI*a*a;tl=[['Diámetro',fx(2*a,dp)+L(),'2r'],['Área del círculo máximo',fx(PI*a*a,dp)+A2(),'πr²'],['Superficie ÷ volumen',M.fmt(S/V,6),'3 ÷ r']];st('Eleva el radio al cubo','','r³ = '+f(a)+'³ = '+f(a*a*a));st('Aplica la fórmula de Arquímedes','','V = (4/3)πr³ = <b>'+f(V)+esc(V3())+'</b>');st('Área de superficie','Cuatro círculos máximos.','S = 4πr² = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='hemi'){V=2/3*PI*a*a*a;S=3*PI*a*a;tl=[['Superficie curva',fx(2*PI*a*a,dp)+A2(),'2πr²'],['Área de la base plana',fx(PI*a*a,dp)+A2(),'πr²'],['Volumen de la esfera completa',fx(4/3*PI*a*a*a,dp)+V3(),'el doble de la semiesfera']];st('Media esfera','','V = ½ × (4/3)πr³ = (2/3)πr³ = <b>'+f(V)+esc(V3())+'</b>');st('Área de superficie','La parte curva más la base circular plana.','S = 2πr² + πr² = 3πr² = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='cone'){var sl=Math.sqrt(a*a+b*b);V=PI*a*a*b/3;S=PI*a*(a+sl);tl=[['Generatriz',fx(sl,dp)+L(),'√(r² + h²)'],['Área de la base',fx(PI*a*a,dp)+A2(),'πr²'],['Área lateral',fx(PI*a*sl,dp)+A2(),'πrl'],['Cilindro del mismo r y h',fx(PI*a*a*b,dp)+V3(),'3 × volumen del cono']];st('Generatriz','Pitágoras con el radio y la altura.','l = √(r² + h²) = √('+f(a*a)+' + '+f(b*b)+') = <b>'+f(sl)+'</b>');st('Volumen','Un tercio del cilindro que lo contiene.','V = (1/3)πr²h = <b>'+f(V)+esc(V3())+'</b>');st('Área de superficie','La base más la superficie lateral.','S = πr(r + l) = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='frus'){var R=a,r2=b,hh=c,s2=Math.sqrt((R-r2)*(R-r2)+hh*hh);V=PI*hh*(R*R+R*r2+r2*r2)/3;S=PI*(R*R+r2*r2+(R+r2)*s2);tl=[['Generatriz',fx(s2,dp)+L(),'√((R − r)² + h²)'],['Área lateral',fx(PI*(R+r2)*s2,dp)+A2(),'π(R + r)s'],['Área inferior + superior',fx(PI*(R*R+r2*r2),dp)+A2(),'π(R² + r²)']];st('Generatriz','','s = √((R − r)² + h²) = <b>'+f(s2)+'</b>');st('Volumen','El cono menos el cono retirado de la parte superior.','V = (1/3)πh(R² + Rr + r²) = <b>'+f(V)+esc(V3())+'</b>');st('Área de superficie','Ambas bases circulares más la banda lateral.','S = π[R² + r² + (R + r)s] = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='pyr'){var s1=Math.sqrt(c*c+b*b/4),s22=Math.sqrt(c*c+a*a/4),lat=a*s1+b*s22;V=a*b*c/3;S=a*b+lat;tl=[['Área de la base',fx(a*b,dp)+A2(),'l × w'],['Área lateral',fx(lat,dp)+A2(),'cuatro caras triangulares'],['Alturas inclinadas',fx(s1,3)+' · '+fx(s22,3)+L(),'sobre las aristas de largo y ancho']];st('Volumen','Un tercio de la base × la altura.','V = (1/3) × '+f(a)+' × '+f(b)+' × '+f(c)+' = <b>'+f(V)+esc(V3())+'</b>');st('Alturas inclinadas','Altura de cada par de caras triangulares.','√(h² + (w/2)²) = '+f(s1)+',  √(h² + (l/2)²) = '+f(s22));st('Área de superficie','La base más cuatro triángulos.','S = lw + l·'+f(s1)+' + w·'+f(s22)+' = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='tpr'){var eq=Math.sqrt(b*b+a*a/4),per=a+2*eq;V=0.5*a*b*c;S=a*b+per*c;tl=[['Área del triángulo',fx(a*b/2,dp)+A2(),'½ b t'],['Perímetro del triángulo',fx(per,dp)+L(),'b + 2√(t² + b²/4)'],['Área lateral',fx(per*c,dp)+A2(),'perímetro × L']];st('Sección transversal triangular','Triángulo isósceles de base b y altura t.','área = ½ × '+f(a)+' × '+f(b)+' = '+f(a*b/2)+esc(A2()));st('Volumen','Sección transversal por la longitud.','V = '+f(a*b/2)+' × '+f(c)+' = <b>'+f(V)+esc(V3())+'</b>');st('Área de superficie','Dos bases triangulares más tres rectángulos.','S = 2 × '+f(a*b/2)+' + '+f(per)+' × '+f(c)+' = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='cap'){V=PI*a*a*b+4/3*PI*a*a*a;S=2*PI*a*b+4*PI*a*a;tl=[['Longitud total',fx(b+2*a,dp)+L(),'L + 2r'],['Parte cilíndrica',fx(PI*a*a*b,dp)+V3(),'πr²L'],['Dos extremos semiesféricos',fx(4/3*PI*a*a*a,dp)+V3(),'(4/3)πr³']];st('Sección cilíndrica','','πr²L = π × '+f(a*a)+' × '+f(b)+' = '+f(PI*a*a*b)+esc(V3()));st('Dos semiesferas forman una esfera','','(4/3)πr³ = '+f(4/3*PI*a*a*a)+esc(V3()));st('Súmalos','','V = <b>'+f(V)+esc(V3())+'</b>; S = 2πrL + 4πr² = <b>'+f(S)+esc(A2())+'</b>');}
  else if(sh==='ell'){var pp=1.6075,ap=Math.pow(a,pp),bp=Math.pow(b,pp),cp=Math.pow(c,pp);V=4/3*PI*a*b*c;S=4*PI*Math.pow((ap*bp+ap*cp+bp*cp)/3,1/pp);tl=[['Superficie (aprox.)',fx(S,dp)+A2(),'Thomsen, error ≤ 1.06%'],['Esfera del mismo volumen, radio',fx(Math.cbrt(a*b*c),dp)+L(),'∛(abc)']];st('Volumen','Una esfera estirada por a, b, c.','V = (4/3)πabc = <b>'+f(V)+esc(V3())+'</b>');st('Área de la superficie (aproximación)','No existe una forma cerrada en funciones elementales.','S ≈ 4π[(aᵖbᵖ + aᵖcᵖ + bᵖcᵖ) ÷ 3]^(1/p), p = 1.6075 → <b>'+f(S)+esc(A2())+'</b>');}
  else{var Rm=a,rt=b;if(rt>=Rm)return fail('El radio del tubo debe ser menor que el radio mayor.');V=2*PI*PI*Rm*rt*rt;S=4*PI*PI*Rm*rt;tl=[['Sección transversal del tubo',fx(PI*rt*rt,dp)+A2(),'πr²'],['Longitud de la línea central',fx(2*PI*Rm,dp)+L(),'2πR'],['Diámetro exterior',fx(2*(Rm+rt),dp)+L(),'2(R + r)']];st('Teorema de Pappus','Volumen = área de la sección transversal × distancia recorrida por su centro.','V = πr² × 2πR = 2π²Rr² = <b>'+f(V)+esc(V3())+'</b>');st('Área de superficie','Circunferencia del tubo × longitud de la línea central.','S = 2πr × 2πR = 4π²Rr = <b>'+f(S)+esc(A2())+'</b>');}
  var Lt=conv(V);
  C.text('resultValue',fx(V,dp)+V3());C.text('lit',fx(Lt,dp)+' L');C.text('sa',fx(S,dp)+A2());tg.textContent=cfg.h.split(' (')[0];
  C.text('interp','El '+cfg.h.toLowerCase().split(' (')[0]+' tiene un volumen de '+M.fmt(V,6)+V3()+', que es '+M.fmt(Lt,6)+' litros o '+M.fmt(Lt/3.785411784,6)+' galones de EE. UU.');
  tiles(tl);draw(sh,p);C.text('vizTag',cfg.f.map(function(d,i){return d[0].replace(/ \(.*\)/,'').toLowerCase()+' '+M.fmt(p[i],4);}).join(' · '));
  $('steps').innerHTML=h;C.text('stepsIntro',cfg.h+'.');C.text('stepsTag',cfg.fx.split(' ×')[0].split(' =')[0]);
  last='Volumen — calculatepilot.com/math/volume-calculator.html\n'+cfg.h+'\nVolumen = '+M.fmt(V,6)+V3()+' ('+M.fmt(Lt,6)+' L, '+M.fmt(Lt/3.785411784,6)+' gal EE. UU.)\nÁrea de la superficie = '+M.fmt(S,6)+A2();
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('p1').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'voCalc',compute:compute});prev=$('shape').value;
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-s]');if(!b)return;var s=b.getAttribute('data-s'),vals=b.getAttribute('data-v').split(',');$('shape').value=s;prev=s;C.set('un',b.getAttribute('data-u'));vals.forEach(function(x,i){C.set('p'+(i+1),x);});fire();});
  document.querySelector('#voCalc [data-action=reset]').addEventListener('click',function(){prev='';});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
