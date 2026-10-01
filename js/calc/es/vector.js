/* Vector calculator — CalculatePilot (Stitch redesign).
   |u| = √Σuᵢ² · u·v = Σuᵢvᵢ · θ = arccos(u·v/|u||v|) · u×v (3D determinant; 2D → scalar z) · proj_v u = (u·v/|v|²)v, comp_v u = u·v/|v|
   Direction angles α, β, γ = arccos(component/|v|). Cosine argument is clamped to [−1, 1] before arccos. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='';

function esc(s){return C.esc(s);}
function cl(x){return Math.abs(x)<1e-13?0:x;}
function fx(x,dp){return M.fmt(cl(x),dp);}
function vec(a,dp){return '('+a.map(function(x){return fx(x,dp);}).join(', ')+')';}
function mag(a){return Math.sqrt(a.reduce(function(s,x){return s+x*x;},0));}
function dot(a,b){var s=0;for(var i=0;i<a.length;i++)s+=a[i]*b[i];return s;}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}

function draw(list,dim){
  var W=760,H=340,pad=40,pr=function(p){return dim===3?[p[0]-0.5*Math.cos(PI/4)*p[2],p[1]-0.5*Math.sin(PI/4)*p[2]]:[p[0],p[1]];};
  var pts=[[0,0]],segs=[];list.forEach(function(it){var q=pr(it.v);pts.push(q);});
  var axes=dim===3?[[1,0,0],[0,1,0],[0,0,1]]:[[1,0],[0,1]];
  var xs=pts.map(function(q){return q[0];}),ys=pts.map(function(q){return q[1];});
  var ext=Math.max(1,Math.max.apply(null,xs.map(Math.abs)),Math.max.apply(null,ys.map(Math.abs)));
  var minx=Math.min(0,Math.min.apply(null,xs))-ext*0.15,maxx=Math.max(0,Math.max.apply(null,xs))+ext*0.15,miny=Math.min(0,Math.min.apply(null,ys))-ext*0.15,maxy=Math.max(0,Math.max.apply(null,ys))+ext*0.15;
  var k=Math.min((W-2*pad)/(maxx-minx),(H-2*pad)/(maxy-miny)),ox=(W-(maxx-minx)*k)/2-minx*k,oy=(H-(maxy-miny)*k)/2+maxy*k,X=function(x){return (ox+x*k).toFixed(1);},Y=function(y){return (oy-y*k).toFixed(1);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><defs>';
  list.forEach(function(it,i){s+='<marker id="ar'+i+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="'+it.c+'"/></marker>';});
  s+='</defs>';
  var lim=ext*1.05;[['x',[lim,0,0]],['y',[0,lim,0]]].concat(dim===3?[['z',[0,0,lim]]]:[]).forEach(function(a){var e=pr(a[1]);s+='<line x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(e[0])+'" y2="'+Y(e[1])+'" stroke="var(--sx-border)" stroke-width="1.5"/><text class="ax" x="'+(+X(e[0])+6)+'" y="'+(+Y(e[1])-4)+'">'+a[0]+'</text>';});
  list.forEach(function(it,i){var e=pr(it.v);s+='<line x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(e[0])+'" y2="'+Y(e[1])+'" stroke="'+it.c+'" stroke-width="'+(it.w||2.6)+'" '+(it.d?'stroke-dasharray="6 4"':'')+' marker-end="url(#ar'+i+')"/><text class="ax" x="'+(+X(e[0])+8)+'" y="'+(+Y(e[1])-8)+'" style="font-weight:700;fill:'+it.c+'">'+esc(it.n)+'</text>';});
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,dim=$('dim').value==='s3'?3:2,h='',n=0;
  $('uzW').hidden=dim===2;$('vzW').hidden=dim===2;$('vBlock').hidden=m==='s2';$('presets').hidden=m==='s2';$('swap').hidden=m==='s2';
  C.text('formH',{s1:'Operaciones con u y v',s2:'Propiedades de un vector',s3:'Proyección de u sobre v'}[m]);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var u=[v('ux'),v('uy'),v('uz')].slice(0,dim),w=[v('vx'),v('vy'),v('vz')].slice(0,dim),f=function(x){return esc(fx(x,dp));},tg=$('tag');tg.className='sx-ef-grade';
  var mu=mag(u),mv=mag(w);C.text('uMag','|u| = '+fx(mu,dp));C.text('vMag','|v| = '+fx(mv,dp));
  var lab=['x','y','z'].slice(0,dim);
  if(m==='s2'){
    if(mu===0)return fail('El vector cero no tiene dirección: su vector unitario y sus ángulos directores no están definidos.');
    var un=u.map(function(x){return x/mu;}),ang=un.map(function(x){return Math.acos(Math.max(-1,Math.min(1,x)))*180/PI;});
    C.text('heroLbl','Módulo |u|');C.text('resultValue',fx(mu,dp));C.text('ex1L','Vector unitario û');C.text('ex1',vec(un,dp));C.text('ex2L',dim===3?'Ángulos directores (α, β, γ)':'Ángulo de dirección θ');C.text('ex2',dim===3?ang.map(function(a){return fx(a,3)+'°';}).join(', '):fx(Math.atan2(u[1],u[0])*180/PI,dp)+'°');
    tg.textContent=dim+'Vector D';C.text('fxNow','|u| = √('+u.map(function(x){return M.fmt(x,4)+'²';}).join(' + ')+')');C.text('interp','Un vector de longitud '+fx(mu,6)+'. Dividing each component by the length gives a vector of length 1 pointing the same way.');
    tiles([['Módulo al cuadrado',fx(mu*mu,dp),'u · u'],['Vector unitario',vec(un,dp),'u ÷ |u|'],['Cosenos directores',vec(un,dp),'cos α, cos β'+(dim===3?', cos γ':'')],['Opuesto −u',vec(u.map(function(x){return -x;}),dp),'dirección contraria'],['Comprobación de la suma de cuadrados',fx(dot(un,un),8),'|û|² = 1'],['Componentes',vec(u,dp),lab.join(', ')]]);
    draw([{v:u.concat(dim===2?[0]:[]),c:'#2563eb',n:'u'},{v:un.concat(dim===2?[0]:[]),c:'#d97706',n:'û',w:2.6}],dim);C.text('vizTag','|u| = '+fx(mu,4));
    st('Eleva al cuadrado y suma las componentes','Pitágoras en '+dim+'D.','|u|² = '+u.map(function(x){return f(x)+'²';}).join(' + ')+' = '+f(mu*mu));st('Calcula la raíz','','|u| = √'+f(mu*mu)+' = <b>'+f(mu)+'</b>');st('Normaliza','Divide cada componente entre el módulo.','û = u ÷ |u| = <b>'+esc(vec(un,dp))+'</b>');st('Ángulos directores','Ángulo con cada eje: arccos de los cosenos directores.',dim===3?'α = '+f(ang[0])+'°,  β = '+f(ang[1])+'°,  γ = '+f(ang[2])+'°':'θ = atan2('+f(u[1])+', '+f(u[0])+') = <b>'+f(Math.atan2(u[1],u[0])*180/PI)+'°</b>');
    last='Vector — calculatepilot.com/math/vector-calculator.html\nu = '+vec(u,dp)+'\n|u| = '+fx(mu,8)+'\nvector unitario = '+vec(un,dp);C.text('stepsIntro','Módulo, vector unitario y dirección de un vector.');C.text('stepsTag','|u|, û');
  }else if(m==='s3'){
    if(mv===0)return fail('No se puede proyectar sobre el vector cero.');
    var d=dot(u,w),sc=d/mv,pj=w.map(function(x){return d/(mv*mv)*x;}),rj=u.map(function(x,i){return x-pj[i];});
    C.text('heroLbl','Proyección escalar comp_v u');C.text('resultValue',fx(sc,dp));C.text('ex1L','Proyección vectorial proj_v u');C.text('ex1',vec(pj,dp));C.text('ex2L','Parte perpendicular u − proj');C.text('ex2',vec(rj,dp));
    tg.textContent=Math.abs(d)<1e-12?'Perpendicular':d>0?'Misma dirección general':'Dirección general contraria';C.text('fxNow','proj_v u = (u · v ÷ |v|²) v');C.text('interp','La componente de u a lo largo de v es '+fx(sc,6)+'; esa parte de u es el vector '+vec(pj,dp)+'.');
    tiles([['Producto escalar u · v',fx(d,dp),'numerator'],['|v|²',fx(mv*mv,dp),'denominator'],['Factor de proyección',fx(d/(mv*mv),dp),'(u·v) ÷ |v|²'],['|proj_v u|',fx(Math.abs(sc),dp),'longitud de la sombra'],['|u − proj|',fx(mag(rj),dp),'distancia de u a la recta de v']]);
    draw([{v:u.concat(dim===2?[0]:[]),c:'#2563eb',n:'u'},{v:w.concat(dim===2?[0]:[]),c:'#047857',n:'v'},{v:pj.concat(dim===2?[0]:[]),c:'#d97706',n:'proj_v u',d:true}],dim);C.text('vizTag','comp = '+fx(sc,4));
    st('Producto escalar','','u · v = '+u.map(function(x,i){return '('+f(x)+')('+f(w[i])+')';}).join(' + ')+' = <b>'+f(d)+'</b>');st('Longitud de v','','|v|² = '+f(mv*mv)+',  |v| = '+f(mv));st('Proyección escalar','Hasta dónde llega u a lo largo de v.','comp_v u = (u · v) ÷ |v| = '+f(d)+' ÷ '+f(mv)+' = <b>'+f(sc)+'</b>');st('Proyección vectorial','Escala v por el factor de proyección.','proj_v u = ('+f(d)+' ÷ '+f(mv*mv)+') · '+esc(vec(w,dp))+' = <b>'+esc(vec(pj,dp))+'</b>');
    last='Proyección — calculatepilot.com/math/vector-calculator.html\nu = '+vec(u,dp)+', v = '+vec(w,dp)+'\ncomp_v u = '+fx(sc,8)+'\nproj_v u = '+vec(pj,dp);C.text('stepsIntro','Proyección de u sobre v.');C.text('stepsTag','proj_v u');
  }else{
    if(mu===0||mv===0)return fail('El ángulo no está definido cuando alguno de los vectores es el vector cero.');
    var dp2=dot(u,w),cs=Math.max(-1,Math.min(1,dp2/(mu*mv))),th=Math.acos(cs)*180/PI,cr=dim===3?cross(u,w):[0,0,u[0]*w[1]-u[1]*w[0]],crm=mag(cr),sum=u.map(function(x,i){return x+w[i];}),df=u.map(function(x,i){return x-w[i];});
    var perp=Math.abs(dp2)<1e-9*mu*mv,par=crm<1e-9*mu*mv;
    C.text('heroLbl','Producto escalar (u · v)');C.text('resultValue',fx(dp2,dp));C.text('ex1L','Ángulo entre u y v');C.text('ex1',fx(th,dp)+'° ('+fx(th*PI/180,dp)+' rad)');C.text('ex2L',dim===3?'Producto vectorial (u × v)':'Producto vectorial (componente z)');C.text('ex2',dim===3?vec(cr,dp):fx(cr[2],dp));
    tg.textContent=perp?'Perpendicular':par?(dp2>0?'Paralelos (misma dirección)':'Antiparalelos'):th<90?'Ángulo agudo':'Ángulo obtuso';
    C.text('fxNow','u · v = '+u.map(function(x,i){return '('+M.fmt(x,4)+')('+M.fmt(w[i],4)+')';}).join(' + ')+' = '+fx(dp2,dp));C.text('interp','cos θ = '+fx(cs,6)+', por lo que el ángulo entre los vectores es '+fx(th,6)+'°.');
    tiles([['|u|  ·  |v|',fx(mu,dp)+'  ·  '+fx(mv,dp),'magnitudes'],['u + v',vec(sum,dp),'component-wise'],['u − v',vec(df,dp),'component-wise'],['|u × v|',fx(crm,dp),'área del paralelogramo'],['Área del triángulo',fx(crm/2,dp),'½ |u × v|'],['Comprobación de ortogonalidad',perp?'orthogonal':par?'parallel':'neither','u·v = 0 → perpendiculares; u×v = 0 → paralelos']]);
    draw([{v:u.concat(dim===2?[0]:[]),c:'#2563eb',n:'u'},{v:w.concat(dim===2?[0]:[]),c:'#047857',n:'v'}].concat(dim===3&&crm>0?[{v:cr,c:'#7c3aed',n:'u×v',d:true}]:[]),dim);C.text('vizTag','θ = '+fx(th,4)+'°');
    st('Módulos','Raíz de la suma de cuadrados.','|u| = √'+f(mu*mu)+' = <b>'+f(mu)+'</b>, |v| = √'+f(mv*mv)+' = <b>'+f(mv)+'</b>');
    st('Producto escalar','Multiplica las componentes correspondientes y suma.','u · v = '+u.map(function(x,i){return '('+f(x)+')('+f(w[i])+')';}).join(' + ')+' = <b>'+f(dp2)+'</b>');
    st('Ángulo entre los vectores','A partir de la definición geométrica u · v = |u||v| cos θ.','cos θ = '+f(dp2)+' ÷ ('+f(mu)+' × '+f(mv)+') = '+f(cs)+'  → θ = arccos = <b>'+f(th)+'°</b>');
    if(dim===3)st('Producto vectorial (desarrollo del determinante)','Desarrolla el determinante 3×3 por la fila superior de vectores unitarios.','u × v = i(u_y·v_z − u_z·v_y) − j(uₓ·v_z − u_z·vₓ) + k(uₓ·v_y − u_y·vₓ)<br>= i('+f(u[1]*w[2])+' − '+f(u[2]*w[1])+') − j('+f(u[0]*w[2])+' − '+f(u[2]*w[0])+') + k('+f(u[0]*w[1])+' − '+f(u[1]*w[0])+')<br>= <b>'+esc(vec(cr,dp))+'</b>, |u × v| = <b>'+f(crm)+'</b>');
    else st('Producto vectorial (2D)','La única componente distinta de cero apunta fuera del plano.','(u × v)_z = uₓ·v_y − u_y·vₓ = '+f(u[0]*w[1])+' − '+f(u[1]*w[0])+' = <b>'+f(cr[2])+'</b>');
    last='Vectores — calculatepilot.com/math/vector-calculator.html\nu = '+vec(u,dp)+', v = '+vec(w,dp)+'\nu · v = '+fx(dp2,8)+'\nángulo = '+fx(th,8)+'°\nu × v = '+(dim===3?vec(cr,dp):fx(cr[2],dp))+'\nu + v = '+vec(sum,dp)+', u − v = '+vec(df,dp);C.text('stepsIntro','Producto escalar, ángulo y producto vectorial de dos vectores.');C.text('stepsTag','u · v, u × v');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('ux').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'veCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-u]');if(!b)return;var a=b.getAttribute('data-u').split(','),c=b.getAttribute('data-v').split(',');['ux','uy','uz'].forEach(function(id,i){C.set(id,a[i]);});['vx','vy','vz'].forEach(function(id,i){C.set(id,c[i]);});fire();});
  $('swap').addEventListener('click',function(){[['ux','vx'],['uy','vy'],['uz','vz']].forEach(function(p){var t=$(p[0]).value;C.set(p[0],$(p[1]).value);C.set(p[1],t);});fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
