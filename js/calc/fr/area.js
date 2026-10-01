/* Area calculator — CalculatePilot (Stitch redesign).
   11 shapes. Heron A=√[s(s−a)(s−b)(s−c)] · SAS A=½ab·sin C · Shoelace A=½|Σ(xᵢyᵢ₊₁−xᵢ₊₁yᵢ)| · regular n-gon A=ns²/(4tan(π/n))
   Ellipse perimeter ≈ Ramanujan II: π(a+b)(1+3h/(10+√(4−3h))), h=((a−b)/(a+b))². Unit table uses exact factors to m². */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='',prev='';
var TOM={mm:0.001,cm:0.01,m:1,km:1000,'in':0.0254,ft:0.3048,yd:0.9144,mi:1609.344};
var CFG={
 rect:{h:'Rectangle / carré',f:[['Longueur',12],['Largeur',8]],fx:'A = l × w'},
 tbh:{h:'Triangle à partir de la base et de la hauteur',f:[['Base',10],['Hauteur (perpendiculaire)',6]],fx:'A = ½ × b × h'},
 tsss:{h:'Triangle à partir de trois côtés',f:[['Côté a',13],['Côté b',14],['Côté c',15]],fx:'A = √[s(s − a)(s − b)(s − c)],  s = (a + b + c) ÷ 2'},
 tsas:{h:'Triangle à partir de deux côtés et de l\'angle compris',f:[['Côté a',7],['Côté b',10],['Angle compris C (degrés)',65]],fx:'A = ½ × a × b × sin C'},
 circ:{h:'Cercle',f:[['Rayon (r)',6.5]],fx:'A = π × r²'},
 sect:{h:'Secteur circulaire',f:[['Rayon (r)',6.5],['Angle au centre (degrés)',60]],fx:'A = ½ × r² × θ  (θ en radians)'},
 trap:{h:'Trapèze',f:[['Côté parallèle a',8],['Côté parallèle b',5],['Hauteur (perpendiculaire)',4]],fx:'A = ½ × (a + b) × h'},
 para:{h:'Parallélogramme',f:[['Base',9],['Hauteur (perpendiculaire)',5]],fx:'A = base × hauteur'},
 ell:{h:'Ellipse',f:[['Demi-grand axe (a)',5],['Demi-petit axe (b)',3]],fx:'A = π × a × b'},
 poly:{h:'Polygone régulier',f:[['Nombre de côtés (n)',6],['Longueur du côté (s)',6]],fx:'A = n × s² ÷ (4 × tan(π ÷ n))'},
 irr:{h:'Polygone irrégulier (formule du lacet)',f:[],fx:'A = ½ |Σ (xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ)|'},
 ann:{h:'Couronne (anneau)',f:[['Rayon extérieur (R)',10],['Rayon intérieur (r)',6]],fx:'A = π × (R² − r²)'}
};

function esc(s){return C.esc(s);}
function un(){return $('un').value;}
function L(){return ' '+un();}
function A2(){return ' '+un()+'²';}
function fx(x,dp){return isFinite(x)?M.fmt(x,dp):'—';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','per','ex'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';$('cvTbl').tBodies[0].innerHTML='';C.text('vizTag','—');last='';}

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
function convert(A){var rows=[['Millimètres carrés (mm²)',1e-6],['Centimètres carrés (cm²)',1e-4],['Mètres carrés (m²)',1],['Kilomètres carrés (km²)',1e6],['Pouces carrés (in²)',0.0254*0.0254],['Pieds carrés (ft²)',0.3048*0.3048],['Yards carrés (yd²)',0.9144*0.9144],['Acres',4046.8564224],['Hectares (ha)',1e4],['Milles carrés (mi²)',1609.344*1609.344]],f=TOM[un()],m2=A*f*f;
  var act={mm:0,cm:1,m:2,km:3,'in':4,ft:5,yd:6,mi:9}[un()];
  $('cvTbl').tBodies[0].innerHTML=rows.map(function(r,i){return '<tr'+(i===act?' class="act"':'')+'><td style="font-family:inherit;white-space:normal">'+esc(r[0])+(i===act?' <span class="act">saisie</span>':'')+'</td><td class="mono">'+esc(M.fmt(m2/r[1],8))+'</td><td class="mono" style="font-size:12px">'+esc(M.fmt(r[1],10))+'</td></tr>';}).join('');}

function segX(p,q,r,s){function o(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}var d1=o(p,q,r),d2=o(p,q,s),d3=o(r,s,p),d4=o(r,s,q);return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));}

function compute(){
  var sh=$('shape').value,cfg=CFG[sh],dp=+$('dp').value,h='',n=0,tg=$('tag');tg.className='sx-ef-grade';
  if(sh!==prev){[1,2,3].forEach(function(i){var d=cfg.f[i-1];if(d){C.set('p'+i,d[1]);}});prev=sh;}
  [1,2,3].forEach(function(i){var d=cfg.f[i-1];$('g'+i).hidden=!d;if(d)C.text('l'+i,d[0]);});$('fNum').hidden=sh==='irr';$('fIrr').hidden=sh!=='irr';
  C.text('formH',cfg.h);C.text('fxNow',cfg.fx);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));},p1=v('p1'),p2=v('p2'),p3=v('p3'),A,P=NaN,ex='—',exL='Exact',sp,tl=[],note='';
  function pos(){for(var i=0;i<arguments.length;i++)if(!(arguments[i]>0))return false;return true;}
  if(sh==='rect'){if(!pos(p1,p2))return fail('La longueur et la largeur doivent être supérieures à 0.');A=p1*p2;P=2*(p1+p2);var dg=Math.hypot(p1,p2);ex=p1===p2?'Carré':'Rectangle';exL='Type';
    tl=[['Périmètre',fx(P,dp)+L(),'2(l + w)'],['Diagonale',fx(dg,dp)+L(),'√(l² + w²)'],['Rapport d\'aspect',M.fmt(p1/p2,6),'l ÷ w']];sp={t:'poly',p:[[0,0],[p1,0],[p1,p2],[0,p2]],lab:[[p1/2,-0,'']]};
    st('Multipliez la longueur par la largeur','Aire d\'un rectangle.','A = '+f(p1)+' × '+f(p2)+' = <b>'+f(A)+esc(A2())+'</b>');st('Périmètre','','P = 2(l + w) = 2 × ('+f(p1)+' + '+f(p2)+') = <b>'+f(P)+esc(L())+'</b>');}
  else if(sh==='tbh'){if(!pos(p1,p2))return fail('La base et la hauteur doivent être supérieures à 0.');A=p1*p2/2;tl=[['Base × hauteur',fx(p1*p2,dp)+A2(),'aire du rectangle englobant'],['La moitié',fx(A,dp)+A2(),'un triangle est un demi-rectangle']];note='Le périmètre nécessite les trois côtés.';
    sp={t:'poly',p:[[0,0],[p1,0],[p1*0.35,p2]]};st('Multipliez la base par la hauteur','La hauteur perpendiculaire.','b × h = '+f(p1)+' × '+f(p2)+' = '+f(p1*p2));st('Divisez par deux','','A = ½ × '+f(p1*p2)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='tsss'){if(!pos(p1,p2,p3))return fail('Les trois côtés doivent être supérieurs à 0.');if(p1+p2<=p3||p1+p3<=p2||p2+p3<=p1)return fail('Ces côtés ne peuvent pas former un triangle : chacun doit être plus court que la somme des deux autres.');
    var s=(p1+p2+p3)/2;A=Math.sqrt(s*(s-p1)*(s-p2)*(s-p3));P=2*s;var x=(p2*p2+p3*p3-p1*p1)/(2*p3),y=Math.sqrt(Math.max(0,p2*p2-x*x));
    tl=[['Demi-périmètre (s)',fx(s,dp)+L(),'(a + b + c) ÷ 2'],['Périmètre',fx(P,dp)+L(),'a + b + c'],['Hauteur sur le côté c',fx(2*A/p3,dp)+L(),'2A ÷ c'],['Rayon du cercle inscrit',fx(A/s,dp)+L(),'A ÷ s']];sp={t:'poly',p:[[0,0],[p3,0],[x,y]]};
    st('Semi-perimeter','Le demi-périmètre.','s = ('+f(p1)+' + '+f(p2)+' + '+f(p3)+') ÷ 2 = <b>'+f(s)+'</b>');st('Formule de Héron','','A = √[s(s − a)(s − b)(s − c)] = √['+f(s)+' × '+f(s-p1)+' × '+f(s-p2)+' × '+f(s-p3)+'] = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='tsas'){if(!pos(p1,p2,p3))return fail('Les côtés et l\'angle doivent être supérieurs à 0.');if(p3>=180)return fail('L\'angle compris doit être inférieur à 180°.');
    var C0=p3*PI/180;A=0.5*p1*p2*Math.sin(C0);var c3=Math.sqrt(p1*p1+p2*p2-2*p1*p2*Math.cos(C0));P=p1+p2+c3;
    tl=[['Troisième côté (c)',fx(c3,dp)+L(),'Loi des cosinus'],['Périmètre',fx(P,dp)+L(),'a + b + c']];sp={t:'poly',p:[[0,0],[p1,0],[p2*Math.cos(C0),p2*Math.sin(C0)]]};
    st('Utilisez l\'angle compris','Aire à partir de deux côtés et de l\'angle compris entre eux.','A = ½ × a × b × sin C = ½ × '+f(p1)+' × '+f(p2)+' × sin('+f(p3)+'°) = <b>'+f(A)+esc(A2())+'</b>');st('Troisième côté','Loi des cosinus, pour le périmètre.','c = √(a² + b² − 2ab·cos C) = <b>'+f(c3)+'</b>');}
  else if(sh==='circ'){if(!pos(p1))return fail('Le rayon doit être supérieur à 0.');A=PI*p1*p1;P=2*PI*p1;ex=M.fmt(p1*p1,6)+'π'+A2();exL='Aire exacte';
    tl=[['Diamètre',fx(2*p1,dp)+L(),'2r'],['Circonférence',fx(P,dp)+L(),'2πr'],['Aire du demi-cercle',fx(A/2,dp)+A2(),'A ÷ 2'],['Aire du quart de cercle',fx(A/4,dp)+A2(),'A ÷ 4']];sp={t:'circle',a:p1,la:'r = '+M.fmt(p1,4)};
    st('Élevez le rayon au carré','','r² = '+f(p1)+'² = '+f(p1*p1));st('Multipliez par π','','A = π × '+f(p1*p1)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='sect'){if(!pos(p1,p2))return fail('Le rayon et l\'angle doivent être supérieurs à 0.');if(p2>360)return fail('L\'angle ne peut pas dépasser 360°.');var th=p2*PI/180;A=0.5*p1*p1*th;var arc=p1*th;P=2*p1+arc;
    tl=[['Longueur de l\'arc',fx(arc,dp)+L(),'r × θ'],['Périmètre',fx(P,dp)+L(),'2r + arc'],['Part du cercle',M.fmt(p2/360*100,6)+'%','θ ÷ 360°'],['Aire du cercle entier',fx(PI*p1*p1,dp)+A2(),'πr²']];sp={t:'sector',r:p1,th:th};
    st('Convertissez l\'angle en radians','','θ = '+f(p2)+'° × π ÷ 180 = <b>'+f(th)+' rad</b>');st('Aire du secteur','','A = ½ × r² × θ = ½ × '+f(p1*p1)+' × '+f(th)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='trap'){if(!pos(p1,p2,p3))return fail('Les deux côtés parallèles et la hauteur doivent être supérieurs à 0.');A=(p1+p2)/2*p3;var mid=(p1+p2)/2;note='Le périmètre nécessite les deux côtés obliques.';
    tl=[['Longueur de la ligne médiane',fx(mid,dp)+L(),'(a + b) ÷ 2'],['Somme des côtés parallèles',fx(p1+p2,dp)+L(),'a + b']];var off=(p1-p2)/2;sp={t:'poly',p:[[0,0],[p1,0],[p1-off,p3],[off,p3]]};
    st('Faites la moyenne des côtés parallèles','La ligne médiane.','(a + b) ÷ 2 = ('+f(p1)+' + '+f(p2)+') ÷ 2 = <b>'+f(mid)+'</b>');st('Multipliez par la hauteur','','A = '+f(mid)+' × '+f(p3)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='para'){if(!pos(p1,p2))return fail('La base et la hauteur doivent être supérieures à 0.');A=p1*p2;note='Le périmètre nécessite le côté oblique.';tl=[['Base × hauteur',fx(A,dp)+A2(),'identique à un rectangle de cette taille']];sp={t:'poly',p:[[0,0],[p1,0],[p1+p2*0.4,p2],[p2*0.4,p2]]};
    st('Multipliez la base par la hauteur perpendiculaire','L\'inclinaison n\'a pas d\'importance.','A = '+f(p1)+' × '+f(p2)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='ell'){if(!pos(p1,p2))return fail('Les deux demi-axes doivent être supérieurs à 0.');A=PI*p1*p2;var hh=Math.pow((p1-p2)/(p1+p2),2);P=PI*(p1+p2)*(1+3*hh/(10+Math.sqrt(4-3*hh)));ex=M.fmt(p1*p2,6)+'π'+A2();exL='Aire exacte';
    tl=[['Périmètre (approx.)',fx(P,dp)+L(),'Ramanujan II'],['Excentricité',M.fmt(Math.sqrt(1-Math.pow(Math.min(p1,p2)/Math.max(p1,p2),2)),6),'√(1 − (b/a)²)'],['Cercle de même a',fx(PI*p1*p1,dp)+A2(),'πa²']];sp={t:'ell',a:p1,b:p2,la:'a = '+M.fmt(p1,4),lb:'b = '+M.fmt(p2,4)};
    st('Multipliez les demi-axes','','a × b = '+f(p1)+' × '+f(p2)+' = '+f(p1*p2));st('Multipliez par π','','A = π × '+f(p1*p2)+' = <b>'+f(A)+esc(A2())+'</b>');st('Périmètre (approximation)','Le périmètre exact nécessite une intégrale elliptique.','h = ((a − b) ÷ (a + b))² = '+f(hh)+'<br>P ≈ π(a + b)(1 + 3h ÷ (10 + √(4 − 3h))) = <b>'+f(P)+esc(L())+'</b>');}
  else if(sh==='poly'){var nn=Math.round(p1);if(p1!==nn||nn<3||nn>1000)return fail('Le nombre de côtés doit être un entier de 3 à 1 000.');if(!pos(p2))return fail('La longueur du côté doit être supérieure à 0.');
    var ap=p2/(2*Math.tan(PI/nn)),R=p2/(2*Math.sin(PI/nn));A=nn*p2*p2/(4*Math.tan(PI/nn));P=nn*p2;var pts=[];for(var i=0;i<nn;i++)pts.push([R*Math.cos(2*PI*i/nn+PI/2),R*Math.sin(2*PI*i/nn+PI/2)]);
    tl=[['Périmètre',fx(P,dp)+L(),'n × s'],['Apothème',fx(ap,dp)+L(),'s ÷ (2 tan(π/n))'],['Rayon circonscrit',fx(R,dp)+L(),'s ÷ (2 sin(π/n))'],['Angle intérieur',M.fmt((nn-2)*180/nn,8)+'°','(n − 2) × 180° ÷ n']];sp={t:'poly',p:pts};
    st('Trouvez l\'apothème','Distance entre le centre et le milieu d\'un côté.','a = s ÷ (2·tan(π ÷ n)) = '+f(p2)+' ÷ (2·tan(180° ÷ '+nn+')) = <b>'+f(ap)+'</b>');st('Aire','La moitié de l\'apothème multipliée par le périmètre.','A = ½ × a × P = ½ × '+f(ap)+' × '+f(P)+' = <b>'+f(A)+esc(A2())+'</b>');}
  else if(sh==='irr'){
    var pts2=[];String($('co').value).split(/\n+/).forEach(function(l){var m=l.trim().split(/[\s,;]+/).map(Number);if(m.length>=2&&isFinite(m[0])&&isFinite(m[1]))pts2.push([m[0],m[1]]);});C.text('coN',pts2.length+' vertices');
    if(pts2.length<3)return fail('Saisissez au moins trois sommets, une paire « x, y » par ligne.');
    var sum=0,per=0,terms=[];for(var j=0;j<pts2.length;j++){var a1=pts2[j],b1=pts2[(j+1)%pts2.length],cr=a1[0]*b1[1]-b1[0]*a1[1];sum+=cr;per+=Math.hypot(b1[0]-a1[0],b1[1]-a1[1]);terms.push(cr);}
    var cross=false;if(pts2.length<=300){var N=pts2.length;for(var a2=0;a2<N&&!cross;a2++)for(var b2=a2+2;b2<N;b2++){if(a2===0&&b2===N-1)continue;if(segX(pts2[a2],pts2[(a2+1)%N],pts2[b2],pts2[(b2+1)%N])){cross=true;break;}}}
    if(cross)return fail('Les côtés de ce polygone se croisent, la formule du lacet ne donnerait donc pas l\'aire délimitée. Listez les sommets dans l\'ordre le long du contour.');
    A=Math.abs(sum)/2;P=per;tl=[['Sommets',String(pts2.length),'corners'],['Orientation',sum>0?'anticlockwise':sum<0?'clockwise':'degenerate','signe de la somme'],['Somme signée',fx(sum,dp),'Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)']];sp={t:'poly',p:pts2};
    st('Produits en croix le long du contour','Pour chaque côté, calculez xᵢ·yᵢ₊₁ − xᵢ₊₁·yᵢ.',terms.slice(0,12).map(function(x){return f(x);}).join(' + ')+(terms.length>12?' + …':'')+' = <b>'+f(sum)+'</b>');st('Divisez la valeur absolue par deux','','A = ½ × |'+f(sum)+'| = <b>'+f(A)+esc(A2())+'</b>');st('Périmètre','Somme des longueurs des côtés.','P = <b>'+f(P)+esc(L())+'</b>');}
  else{if(!pos(p1,p2))return fail('Les deux rayons doivent être supérieurs à 0.');if(p2>=p1)return fail('Le rayon intérieur doit être inférieur au rayon extérieur.');A=PI*(p1*p1-p2*p2);P=2*PI*(p1+p2);ex=M.fmt(p1*p1-p2*p2,6)+'π'+A2();exL='Aire exacte';
    tl=[['Largeur de la couronne',fx(p1-p2,dp)+L(),'R − r'],['Disque extérieur',fx(PI*p1*p1,dp)+A2(),'πR²'],['Disque intérieur',fx(PI*p2*p2,dp)+A2(),'πr²']];sp={t:'ring',a:p1,r:p2,la:'R = '+M.fmt(p1,4)};
    st('Disque extérieur moins disque intérieur','','A = πR² − πr² = π(R² − r²)');st('Remplacez','','A = π × ('+f(p1*p1)+' − '+f(p2*p2)+') = <b>'+f(A)+esc(A2())+'</b>');}
  C.text('heroLbl','Aire (A)');C.text('resultValue',fx(A,dp)+A2());C.text('per',isFinite(P)?fx(P,dp)+L():'n/a');C.text('exL',exL);C.text('ex',ex);tg.textContent=cfg.h.split(' (')[0].split(' —')[0].split(' from')[0];
  C.text('interp','Le '+cfg.h.toLowerCase().split(' (')[0]+' a une aire de '+M.fmt(A,6)+A2()+(isFinite(P)?' et un périmètre de '+M.fmt(P,6)+L():'')+'.'+(note?' '+note:''));
  tiles(tl.length?tl:[['Aire',fx(A,dp)+A2(),'']]);draw(sp);C.text('vizTag',cfg.h.split(' (')[0]);C.text('vizNote',sh==='trap'?'Dessiné comme un trapèze isocèle ; l\'aire ne dépend pas de l\'inclinaison.':sh==='para'||sh==='tbh'?'Dessiné avec une inclinaison typique ; l\'aire ne dépend que de la base et de la hauteur.':'La forme dessinée d\'après vos dimensions.');
  convert(A);$('steps').innerHTML=h;C.text('stepsIntro',cfg.h+'.');C.text('stepsTag',cfg.fx.split(',')[0].split('  (')[0]);
  last='Aire — calculatepilot.com/math/area-calculator.html\n'+cfg.h+'\nAire = '+M.fmt(A,6)+A2()+(isFinite(P)?'\nPérimètre = '+M.fmt(P,6)+L():'');
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'arCalc',compute:compute});prev=$('shape').value;
  document.querySelector('#arCalc [data-action=reset]').addEventListener('click',function(){prev='';$('co').value='0, 0\n100, 0\n100, 60\n40, 90\n0, 60';$('co').dispatchEvent(new Event('input',{bubbles:true}));});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
