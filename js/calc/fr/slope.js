/* Slope calculator — CalculatePilot (Stitch redesign).
   m = Δy/Δx · θ = atan2(Δy, Δx) · grade = 100m · pitch = 12m : 12 · line: y = mx + b, y − y₁ = m(x − x₁), Ax + By = C
   Vertical lines (Δx = 0) have undefined slope, angle 90°, equation x = a. Exact fractions via decimal scaling (≤ 6 dp). */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='';

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function scaleOf(list){for(var k=0;k<=6;k++){var s=Math.pow(10,k);if(list.every(function(x){var y=x*s;return Math.abs(y-Math.round(y))<=1e-9*Math.max(1,Math.abs(y));}))return s;}return null;}
function ratio(n,d){/* exact n/d for decimals → [p,q] with q>0, or null */var s=scaleOf([n,d]);if(!s||d===0)return null;var a=Math.round(n*s),b=Math.round(d*s),g=gcd(a,b)||1;a/=g;b/=g;if(b<0){a=-a;b=-b;}return [a,b];}
function approxFrac(x){/* continued-fraction rational approximation */if(!isFinite(x))return null;if(x===0)return [0,1];var s=x<0?-1:1,y=Math.abs(x),h1=1,h0=0,k1=0,k0=1,i,a;for(i=0;i<25;i++){a=Math.floor(y);var h2=a*h1+h0,k2=a*k1+k0;h0=h1;h1=h2;k0=k1;k1=k2;if(k1>1000)return null;if(Math.abs(h1/k1-Math.abs(x))<1e-9*Math.max(1,Math.abs(x)))return [s*h1,k1];if(y-a<1e-12)break;y=1/(y-a);}return null;}
function fr(pq){return !pq?null:(pq[1]===1?String(pq[0]):pq[0]+'/'+pq[1]);}
function n4(x){return isFinite(x)?M.fmt(x,4):'—';}
function sg(x){return x>0?'+ ':x<0?'− ':'+ ';}
function eqSlopeInt(m,b,mf,bf){var ms=mf||n4(m),bs=bf||n4(b);if(m===0)return 'y = '+bs;var lead=(m===1)?'x':(m===-1)?'−x':ms.replace('-','−')+'x';if(mf&&mf.indexOf('/')>0)lead=(mf.charAt(0)==='-'?'−':'')+'('+mf.replace('-','')+')x';if(b===0)return 'y = '+lead;return 'y = '+lead+' '+(b<0?'− ':'+ ')+String(bf||n4(Math.abs(b))).replace('-','');}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}

function graph(L,pts){
  var W=760,H=340,pad=36,xs=[0],ys=[0];pts.forEach(function(p){xs.push(p[0]);ys.push(p[1]);});
  if(!L.vert&&!pts.length){xs.push(-5,5);ys.push(L.b-5*L.m,L.b+5*L.m);}if(L.vert&&!pts.length){xs.push(L.x0);ys.push(-5,5);}
  if(!L.vert&&isFinite(L.b)){ys.push(L.b);}if(!L.vert&&L.m!==0&&isFinite(L.xint)&&Math.abs(L.xint)<1e6)xs.push(L.xint);
  var minx=Math.min.apply(null,xs),maxx=Math.max.apply(null,xs),miny=Math.min.apply(null,ys),maxy=Math.max.apply(null,ys);
  var sx=(maxx-minx)||2,sy=(maxy-miny)||2;minx-=sx*0.18;maxx+=sx*0.18;miny-=sy*0.18;maxy+=sy*0.18;
  var k=Math.min((W-2*pad)/(maxx-minx),(H-2*pad)/(maxy-miny)),ox=(W-(maxx-minx)*k)/2-minx*k,oy=(H-(maxy-miny)*k)/2+maxy*k;
  var X=function(x){return ox+x*k;},Y=function(y){return oy-y*k;},s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  var step=Math.pow(10,Math.floor(Math.log10(Math.max(maxx-minx,maxy-miny)/6)));var nice=[1,2,5,10].map(function(f){return f*step;}).filter(function(t){return (Math.max(maxx-minx,maxy-miny))/t<=10;})[0]||step*10;
  var gx0=Math.ceil(minx/nice)*nice,gy0=Math.ceil(miny/nice)*nice,x,y;
  for(x=gx0;x<=maxx;x+=nice)s+='<line x1="'+X(x).toFixed(1)+'" x2="'+X(x).toFixed(1)+'" y1="'+Y(miny).toFixed(1)+'" y2="'+Y(maxy).toFixed(1)+'" stroke="var(--sx-border)" stroke-width="1"/><text class="ax" x="'+X(x).toFixed(1)+'" y="'+(Y(0)+14).toFixed(1)+'" text-anchor="middle" style="font-size:10px">'+esc(M.fmt(x,4))+'</text>';
  for(y=gy0;y<=maxy;y+=nice)s+='<line x1="'+X(minx).toFixed(1)+'" x2="'+X(maxx).toFixed(1)+'" y1="'+Y(y).toFixed(1)+'" y2="'+Y(y).toFixed(1)+'" stroke="var(--sx-border)" stroke-width="1"/><text class="ax" x="'+(X(0)-6).toFixed(1)+'" y="'+(Y(y)+3).toFixed(1)+'" text-anchor="end" style="font-size:10px">'+esc(M.fmt(y,4))+'</text>';
  s+='<line x1="'+X(minx).toFixed(1)+'" x2="'+X(maxx).toFixed(1)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--sx-muted)" stroke-width="1.5"/><line x1="'+X(0).toFixed(1)+'" x2="'+X(0).toFixed(1)+'" y1="'+Y(miny).toFixed(1)+'" y2="'+Y(maxy).toFixed(1)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  if(L.vert)s+='<line x1="'+X(L.x0).toFixed(1)+'" x2="'+X(L.x0).toFixed(1)+'" y1="'+Y(miny).toFixed(1)+'" y2="'+Y(maxy).toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="2.5"/>';
  else s+='<line x1="'+X(minx).toFixed(1)+'" y1="'+Y(L.m*minx+L.b).toFixed(1)+'" x2="'+X(maxx).toFixed(1)+'" y2="'+Y(L.m*maxx+L.b).toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="2.5"/>';
  if(pts.length===2&&!L.vert&&pts[0][1]!==pts[1][1]){var a=pts[0],b=pts[1];s+='<polyline points="'+X(a[0]).toFixed(1)+','+Y(a[1]).toFixed(1)+' '+X(b[0]).toFixed(1)+','+Y(a[1]).toFixed(1)+' '+X(b[0]).toFixed(1)+','+Y(b[1]).toFixed(1)+'" fill="none" stroke="#d97706" stroke-width="1.8" stroke-dasharray="5 4"/><text class="ax" x="'+((X(a[0])+X(b[0]))/2).toFixed(1)+'" y="'+(Y(a[1])+(b[1]>a[1]?16:-6)).toFixed(1)+'" text-anchor="middle" style="fill:#b45309;font-weight:600">course '+esc(M.fmt(b[0]-a[0],4))+'</text><text class="ax" x="'+(X(b[0])+8).toFixed(1)+'" y="'+((Y(a[1])+Y(b[1]))/2).toFixed(1)+'" style="fill:#b45309;font-weight:600">élévation '+esc(M.fmt(b[1]-a[1],4))+'</text>';}
  pts.forEach(function(p,i){s+='<circle cx="'+X(p[0]).toFixed(1)+'" cy="'+Y(p[1]).toFixed(1)+'" r="5" fill="'+(i?'#2563eb':'var(--sx-pc)')+'"/><text class="ax" x="'+(X(p[0])+8).toFixed(1)+'" y="'+(Y(p[1])-8).toFixed(1)+'" style="font-weight:700;fill:var(--sx-on)">P'+(i+1)+' ('+esc(M.fmt(p[0],4))+', '+esc(M.fmt(p[1],4))+')</text>';});
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,h='',n=0;['p1','p2','p3','p4'].forEach(function(id,i){$(id).hidden=('s'+(i+1))!==m;});$('presets').hidden=m!=='s1';$('swap').hidden=m!=='s1';
  C.text('formH',{s1:'Deux points',s2:'Un point et une pente',s3:'Angle d\'inclinaison et ordonnée à l\'origine',s4:'Droite à partir de Ax + By = C'}[m]);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,6));},L={vert:false,m:0,b:0,x0:0},pts=[],x1,y1,x2,y2,dx,dy,mf=null,pqx=null,stdD=null,extra=[];
  if(m==='s1'){x1=v('x1');y1=v('y1');x2=v('x2');y2=v('y2');dx=x2-x1;dy=y2-y1;
    if(dx===0&&dy===0)return fail('Les deux points sont identiques : ils ne définissent pas de droite.');
    pts=[[x1,y1],[x2,y2]];C.text('fxNow','m = (y₂ − y₁) ÷ (x₂ − x₁) = ('+M.fmt(y2,6)+' − '+M.fmt(y1,6)+') ÷ ('+M.fmt(x2,6)+' − '+M.fmt(x1,6)+')');
    if(dx===0){L={vert:true,x0:x1};}else{var mm=dy/dx;L={vert:false,m:mm,b:y1-mm*x1,x0:x1,y0:y1};pqx=ratio(dy,dx);mf=fr(pqx);}
    extra=[['Parcours horizontal (Δx)',M.fmt(dx,6),'x₂ − x₁'],['Élévation (Δy)',M.fmt(dy,6),'y₂ − y₁'],['Distance entre les points',n4(Math.hypot(dx,dy)),'√(Δx² + Δy²)'],['Milieu','('+M.fmt((x1+x2)/2,6)+', '+M.fmt((y1+y2)/2,6)+')','((x₁+x₂)/2, (y₁+y₂)/2)']];
    st('Élévation et parcours horizontal','Soustrayez le premier point du second.','Δy = '+f(y2)+' − '+f(y1)+' = <b>'+f(dy)+'</b><br>Δx = '+f(x2)+' − '+f(x1)+' = <b>'+f(dx)+'</b>');
    if(dx===0)st('Droite verticale','Δx = 0 : la formule de la pente diviserait par zéro, la pente est donc indéfinie.','droite : <b>x = '+f(x1)+'</b>,  θ = 90°');
    else{st('Diviser l\'élévation par le parcours horizontal','','m = Δy ÷ Δx = '+f(dy)+' ÷ '+f(dx)+' = <b>'+f(L.m)+'</b>'+(mf&&mf.indexOf('/')>0?'  = <b>'+esc(mf)+'</b> sous forme irréductible':''));}
  }else if(m==='s2'){x1=v('sx1');y1=v('sy1');var sl=v('sm');L={vert:false,m:sl,b:y1-sl*x1,x0:x1,y0:y1};mf=fr(approxFrac(sl));pts=[[x1,y1],[v('sxe'),sl*(v('sxe')-x1)+y1]];if(v('sxe')===x1)pts=[[x1,y1]];
    C.text('fxNow','y − y₁ = m(x − x₁)');extra=[['y en x = '+M.fmt(v('sxe'),6),M.fmt(sl*(v('sxe')-x1)+y1,6),'y₁ + m(x − x₁)']];
    st('Utiliser la forme point-pente','Une droite passant par (x₁, y₁) de pente m.','y − '+f(y1)+' = '+f(sl)+'(x − '+f(x1)+')');st('Résoudre pour y','Développez et regroupez les termes.','y = '+f(sl)+'x + <b>'+f(L.b)+'</b> (b = y₁ − m·x₁ = '+f(y1)+' − '+f(sl*x1)+')');
  }else if(m==='s3'){var th=v('th');if(!(Math.abs(th)<90))return fail('L\'angle d\'inclinaison doit être strictement compris entre −90° et 90° (±90° correspond à une droite verticale).');var mt=Math.tan(th*PI/180),bb=v('tb');L={vert:false,m:mt,b:bb,x0:0,y0:bb};mf=fr(approxFrac(mt));pts=[[0,bb]];
    C.text('fxNow','m = tan θ,  y = m·x + b');st('Pente à partir de l\'angle','La tangente de l\'angle d\'inclinaison.','m = tan('+f(th)+'°) = <b>'+f(mt)+'</b>');st('Forme pente-ordonnée à l\'origine','','y = <b>'+f(mt)+'x '+(bb<0?'− ':'+ ')+f(Math.abs(bb))+'</b>');
  }else{var A=v('la'),B=v('lb'),Cc=v('lc');if(A===0&&B===0)return fail('A et B ne peuvent pas être tous les deux égaux à 0.');var sc4=scaleOf([A,B,Cc]);if(sc4){var a4=Math.round(A*sc4),b4=Math.round(B*sc4),c4=Math.round(Cc*sc4),g4=gcd(gcd(a4,b4),c4)||1;a4/=g4;b4/=g4;c4/=g4;if(a4<0||(a4===0&&b4<0)){a4=-a4;b4=-b4;c4=-c4;}stdD=(a4===0?'':(a4===1?'':a4===-1?'−':a4)+'x ')+(a4!==0?(b4>=0?'+ ':'− '):(b4<0?'−':''))+(Math.abs(b4)===1?'':Math.abs(b4))+(b4===0?'':'y')+' = '+c4;}C.text('fxNow','Ax + By = C  →  m = −A ÷ B,  b = C ÷ B');
    if(B===0){L={vert:true,x0:Cc/A};pts=[];st('B = 0','L\'équation se réduit à Ax = C, une droite verticale.','x = C ÷ A = <b>'+f(Cc/A)+'</b> ; la pente est indéfinie.');}
    else{var mm2=-A/B;L={vert:false,m:mm2,b:Cc/B,x0:0,y0:Cc/B};pqx=ratio(-A,B);mf=fr(pqx)||fr(approxFrac(mm2));pts=[[0,Cc/B]];st('Résoudre pour y','Isolez y d\'un côté.','By = −Ax + C  →  y = (−A ÷ B)x + C ÷ B');st('Lire m et b','','m = −'+f(A)+' ÷ '+f(B)+' = <b>'+f(mm2)+'</b>, b = '+f(Cc)+' ÷ '+f(B)+' = <b>'+f(Cc/B)+'</b>');}}
  /* derived values */
  var vert=L.vert,slope=vert?Infinity:L.m,theta=vert?90:Math.atan(slope)*180/PI,grade=vert?Infinity:slope*100;
  if(!vert){L.xint=slope!==0?-L.b/slope:NaN;}
  C.text('resultValue',vert?'undefined':M.fmt(slope,6));C.text('ex1',vert?'x = '+M.fmt(L.x0,6):(mf&&mf.indexOf('/')>0?'m = '+mf:'m = '+M.fmt(slope,6)));C.text('ex2',vert?'∞':M.fmt(grade,6)+'%');
  var tg=$('tag');tg.className='sx-ef-grade';tg.textContent=vert?'Droite verticale':slope>0?'Droite croissante':slope<0?'Droite décroissante':'Droite horizontale';
  C.text('interp',vert?'La droite est verticale (x = '+M.fmt(L.x0,6)+'), sa pente est donc indéfinie et son angle vaut 90°.':'Pour chaque unité de déplacement horizontal, la droite '+(slope>0?'rises':slope<0?'falls':'reste à niveau')+' '+M.fmt(Math.abs(slope),6)+' — un angle de '+M.fmt(theta,6)+'° avec l\'axe des x.');
  var forms;
  if(vert){forms=[['Équation','x = '+M.fmt(L.x0,6),'droite verticale'],['Pente perpendiculaire','0','droites horizontales']];}
  else{
    var bf=null;if(mf!==null&&L.y0!==undefined){var pq=ratio(L.b,1);bf=pq?fr(pq):null;}
    var pqm=approxFrac(slope),si=eqSlopeInt(slope,L.b,mf&&mf.indexOf('/')>0?mf:null,null);
    var std;var mp=(pqx||pqm);if(mp&&L.y0!==undefined){var sc=scaleOf([L.x0,L.y0]);if(sc){var num=mp[0],den=mp[1],A2=-num*sc,B2=den*sc,C2=den*Math.round(L.y0*sc)-num*Math.round(L.x0*sc);var g=gcd(gcd(A2,B2),C2)||1;A2/=g;B2/=g;C2/=g;if(A2<0||(A2===0&&B2<0)){A2=-A2;B2=-B2;C2=-C2;}std=(A2===0?'':(A2===1?'':A2===-1?'−':A2)+'x ')+(A2!==0?(B2>=0?'+ ':'− '):(B2<0?'−':''))+(Math.abs(B2)===1?'':Math.abs(B2))+'y = '+C2;}}
    if(stdD)std=stdD;if(!std){std=(n4(-slope)+'x + y = '+n4(L.b)).replace('+ -','− ');}
    forms=[['Forme pente-ordonnée à l\'origine',si,'y = mx + b'],['Forme point-pente','y − '+M.fmt(L.y0!==undefined?L.y0:L.b,6)+' = '+(mf&&mf.indexOf('/')>0?'('+mf+')':M.fmt(slope,6))+'(x − '+M.fmt(L.x0,6)+')','y − y₁ = m(x − x₁)'],['Forme standard',std,'Ax + By = C'],['Pente perpendiculaire',slope===0?'indéfinie (verticale)':M.fmt(-1/slope,6),'−1 ÷ m']];
  }
  var ang=[['Angle d\'inclinaison θ',M.fmt(theta,6)+'° = '+M.fmt(theta*PI/180,6)+' rad','arctan(m)'],['Pente de toit',vert?'—':M.fmt(slope*12,4)+' : 12','élévation pour 12 de parcours']];
  var ints=vert?[['x-intercept',M.fmt(L.x0,6),'où elle coupe l\'axe des x'],['y-intercept','none','ne coupe jamais l\'axe des y']]:[['ordonnée à l\'origine (b)',M.fmt(L.b,6),'où x = 0'],['x-intercept',slope===0?'none':M.fmt(L.xint,6),'où y = 0']];
  tiles(ang.concat(extra,ints,forms));
  graph(L,pts);C.text('vizTag',vert?'x = '+M.fmt(L.x0,4):'m = '+M.fmt(slope,4)+' · b = '+M.fmt(L.b,4));C.text('vizNote',pts.length===2?'La droite passant par vos deux points, avec l\'élévation et le parcours tracés en escalier pointillé.':'La droite avec ses points d\'intersection avec les axes.');
  if(!vert){st('Angle d\'inclinaison','La pente est la tangente de l\'angle.','θ = arctan(m) = arctan('+f(slope)+') = <b>'+f(theta)+'°</b>');st('Pente en pourcentage et inclinaison','','pente = 100 × m = <b>'+f(grade)+'%</b> ; inclinaison = 12m : 12 = <b>'+f(slope*12)+' : 12</b>');
    st('Équation de la droite','Forme pente-ordonnée à l\'origine.','y = <b>'+esc(eqSlopeInt(slope,L.b,null,null).replace('y = ',''))+'</b>');}
  $('steps').innerHTML=h;C.text('stepsIntro',{s1:'Pente et équation de la droite à partir de deux points.',s2:'Droite à partir d\'un point et d\'une pente.',s3:'Droite à partir d\'un angle et d\'une ordonnée à l\'origine.',s4:'Pente et points d\'intersection à partir d\'une équation sous forme standard.'}[m]);C.text('stepsTag','m = Δy ÷ Δx');
  last='Pente — calculatepilot.com/math/slope-calculator.html\n'+(vert?'Droite verticale x = '+M.fmt(L.x0,6):'m = '+M.fmt(slope,8)+(mf&&mf.indexOf('/')>0?' ('+mf+')':'')+', angle = '+M.fmt(theta,6)+'°, pente = '+M.fmt(grade,6)+'%\ny = '+M.fmt(slope,6)+'x + '+M.fmt(L.b,6));
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('x1').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'slCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;var a=b.getAttribute('data-p').split(',');C.set('x1',a[0]);C.set('y1',a[1]);C.set('x2',a[2]);C.set('y2',a[3]);fire();});
  $('swap').addEventListener('click',function(){var a=[$('x1').value,$('y1').value];C.set('x1',$('x2').value);C.set('y1',$('y2').value);C.set('x2',a[0]);C.set('y2',a[1]);fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
