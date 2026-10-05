/* Circle calculator — CalculatePilot (Stitch redesign).
   C = 2πr, A = πr², d = 2r · sector: arc s = rθ, area ½r²θ · segment: chord 2r·sin(θ/2), height r(1−cos(θ/2)), area ½r²(θ − sinθ)
   Segment from chord c and height h: r = c²/(8h) + h/2, θ = 2·atan2(c/2, r−h) · annulus: π(R²−r²). θ in radians internally. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='',PI=Math.PI;

function esc(s){return C.esc(s);}
function un(){return $('un').value;}
function L(){return un()?' '+un():'';}
function A2(){return un()?' '+un()+'²':'';}
function fx(x,dp){return isFinite(x)?M.fmt(x,dp):'—';}
function pi(x){/* exact multiple of π, e.g. 15π */return M.fmt(x,6)+'π';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:17px">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}

function svgBase(w,h){return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet">';}
function drawCircle(r,opt){
  var W=760,H=340,R=Math.min(H/2-28,150),cx=W/2,cy=H/2,s=svgBase(W,H),k=R/r;
  function pt(a,rr){return [cx+rr*Math.cos(a),cy-rr*Math.sin(a)];}
  if(opt.ring){var ri=opt.ring*k;s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-primary)" stroke-width="2.5"/><circle cx="'+cx+'" cy="'+cy+'" r="'+ri.toFixed(1)+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5"/>';
    s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+R)+'" y2="'+cy+'" stroke="#d97706" stroke-width="2"/><text class="ax" x="'+(cx+ri+(R-ri)/2).toFixed(1)+'" y="'+(cy-8)+'" text-anchor="middle" style="font-weight:700;fill:#b45309">ancho '+esc(M.fmt(opt.width,4))+'</text><text class="ax" x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle">r = '+esc(M.fmt(opt.ring,4))+'</text><text class="ax" x="'+cx+'" y="'+(cy+R+18)+'" text-anchor="middle">R = '+esc(M.fmt(r,4))+'</text>';
  }else{
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5"/>';
    if(opt.th){var th=opt.th,a0=-th/2+0,p1=pt(a0,R),p2=pt(a0+th,R),large=th>PI?1:0;
      var a1=PI/2-th/2,q1=pt(a1,R),q2=pt(a1+th,R);
      if(opt.seg){/* segment: region between chord and arc */ s+='<path d="M'+q1[0].toFixed(1)+' '+q1[1].toFixed(1)+' A'+R+' '+R+' 0 '+large+' 0 '+q2[0].toFixed(1)+' '+q2[1].toFixed(1)+' Z" fill="#2563eb" fill-opacity=".22" stroke="#2563eb" stroke-width="2"/>';}
      else{s+='<path d="M'+cx+' '+cy+' L'+q1[0].toFixed(1)+' '+q1[1].toFixed(1)+' A'+R+' '+R+' 0 '+large+' 0 '+q2[0].toFixed(1)+' '+q2[1].toFixed(1)+' Z" fill="var(--sx-pc)" fill-opacity=".25" stroke="var(--sx-pc)" stroke-width="2"/>';}
      s+='<line x1="'+q1[0].toFixed(1)+'" y1="'+q1[1].toFixed(1)+'" x2="'+q2[0].toFixed(1)+'" y2="'+q2[1].toFixed(1)+'" stroke="#d97706" stroke-width="2" stroke-dasharray="5 3"/>';
      if(!opt.seg)s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+q1[0].toFixed(1)+'" y2="'+q1[1].toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="1.5"/><line x1="'+cx+'" y1="'+cy+'" x2="'+q2[0].toFixed(1)+'" y2="'+q2[1].toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="1.5"/>';
      s+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="var(--sx-primary)"/><text class="ax" x="'+cx+'" y="'+(cy+18)+'" text-anchor="middle">centro</text>';
      var mid=pt(PI/2,R+16);s+='<text class="ax" x="'+mid[0].toFixed(1)+'" y="'+(mid[1]-2).toFixed(1)+'" text-anchor="middle" style="font-weight:700;fill:var(--sx-primary)">'+esc(opt.label||'')+'</text>';
    }else{
      s+='<line x1="'+(cx-R)+'" y1="'+cy+'" x2="'+(cx+R)+'" y2="'+cy+'" stroke="#2563eb" stroke-width="2"/><line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+R*Math.cos(0.9)).toFixed(1)+'" y2="'+(cy-R*Math.sin(0.9)).toFixed(1)+'" stroke="#d97706" stroke-width="2.5"/><circle cx="'+cx+'" cy="'+cy+'" r="3.5" fill="var(--sx-primary)"/>';
      s+='<text class="ax" x="'+(cx+R*0.5*Math.cos(0.9)+10).toFixed(1)+'" y="'+(cy-R*0.5*Math.sin(0.9)-6).toFixed(1)+'" style="font-weight:700;fill:#b45309">r = '+esc(M.fmt(r,4))+'</text><text class="ax" x="'+(cx-R*0.5)+'" y="'+(cy+16)+'" text-anchor="middle" style="font-weight:700;fill:#1d4ed8">d = '+esc(M.fmt(2*r,4))+'</text>';}
  }
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,h='',n=0,tg=$('tag');tg.className='sx-ef-grade';
  ['fS1','fS2','fS3','fS4'].forEach(function(id,i){$(id).hidden=('s'+(i+1))!==m;});$('presets').hidden=m==='s3';
  C.text('formH',{s1:'Resuelve a partir de un solo valor',s2:'Sector y arco circular',s3:'Segmento circular a partir de la cuerda y la altura',s4:'Corona circular (anillo entre dos círculos)'}[m]);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));};
  if(m==='s1'){
    var k=$('prim').value,pv=v('pv');C.text('pvL',{r:'Radio (r)',d:'Diámetro (d)',c:'Circunferencia (C)',a:'Área (A)'}[k]);
    if(!(pv>0))return fail('Introduce un valor mayor que 0.');
    var r={r:pv,d:pv/2,c:pv/(2*PI),a:Math.sqrt(pv/PI)}[k],d=2*r,c=2*PI*r,a=PI*r*r;
    C.text('fxNow',{r:'d = 2r,  C = 2πr,  A = πr²',d:'r = d ÷ 2,  C = πd,  A = πr²',c:'r = C ÷ 2π,  d = C ÷ π,  A = πr²',a:'r = √(A ÷ π),  d = 2r,  C = 2πr'}[k]);
    C.text('heroLbl',k==='c'?'Radio (r)':'Circunferencia (C)');C.text('resultValue',k==='c'?fx(r,dp)+L():fx(c,dp)+L());C.text('ex1L','Circunferencia, exacta');C.text('ex1',pi(d)+L());C.text('ex2L','Área, exacta');C.text('ex2',pi(r*r)+A2());
    tg.textContent='C ÷ d = π';C.text('interp','Un círculo de radio '+M.fmt(r,6)+L()+' tiene un diámetro de '+M.fmt(d,6)+', una circunferencia de '+M.fmt(c,6)+' y un área de '+M.fmt(a,6)+'.');
    tiles([['Radio (r)',fx(r,dp)+L(),'la mitad del diámetro'],['Diámetro (d)',fx(d,dp)+L(),'2 × r'],['Circunferencia (C)',fx(c,dp)+L(),'2πr = πd'],['Área (A)',fx(a,dp)+A2(),'πr²'],['C ÷ d',M.fmt(c/d,10),'siempre es π'],['C ÷ r',M.fmt(c/r,10),'siempre es 2π']]);
    drawCircle(r,{});C.text('vizTag','r = '+M.fmt(r,4));C.text('vizNote','El círculo con su radio y su diámetro marcados.');
    st('Obtén el radio',{r:'Se da el radio.',d:'Divide el diámetro entre 2.',c:'Divide la circunferencia entre 2π.',a:'Divide el área entre π y luego calcula la raíz cuadrada.'}[k],{r:'r = <b>'+f(r)+'</b>',d:'r = '+f(pv)+' ÷ 2 = <b>'+f(r)+'</b>',c:'r = '+f(pv)+' ÷ (2π) = <b>'+f(r)+'</b>',a:'r = √('+f(pv)+' ÷ π) = <b>'+f(r)+'</b>'}[k]);
    st('Diámetro y circunferencia','','d = 2r = <b>'+f(d)+'</b><br>C = 2πr = 2π × '+f(r)+' = <b>'+f(c)+'</b> (exacto: '+esc(pi(d))+')');
    st('Área','','A = πr² = π × '+f(r)+'² = <b>'+f(a)+'</b> (exacto: '+esc(pi(r*r))+')');
    last='Círculo — calculatepilot.com/math/circle-calculator.html\nr = '+M.fmt(r,6)+', d = '+M.fmt(d,6)+', C = '+M.fmt(c,6)+', A = '+M.fmt(a,6)+L();
    C.text('stepsIntro','Un círculo completo a partir de una sola medida conocida.');C.text('stepsTag','C = 2πr · A = πr²');
  }else if(m==='s2'){
    var rr=v('sr'),thv=v('th'),th=$('thu').value==='deg'?thv*PI/180:thv;
    if(!(rr>0)||!(thv>0))return fail('El radio y el ángulo central deben ser mayores que 0.');if(th>2*PI+1e-12)return fail('El ángulo central no puede superar los 360° (2π rad).');
    var arc=rr*th,sec=0.5*rr*rr*th,ch=2*rr*Math.sin(th/2),sag=rr*(1-Math.cos(th/2)),seg=0.5*rr*rr*(th-Math.sin(th)),tri=0.5*rr*rr*Math.sin(th);
    C.text('fxNow','s = rθ,  A = ½r²θ,  c = 2r·sin(θ/2)');C.text('heroLbl','Longitud del arco (s)');C.text('resultValue',fx(arc,dp)+L());C.text('ex1L','Área del sector');C.text('ex1',fx(sec,dp)+A2());C.text('ex2L','Ángulo');C.text('ex2',fx(th*180/PI,4)+'° = '+fx(th,4)+' rad');
    tg.textContent=Math.abs(th-2*PI)<1e-9?'Círculo completo':(Math.abs(th-PI)<1e-9?'Semicírculo':'Sector '+M.fmt(th/(2*PI)*100,4)+'% del círculo');C.text('interp','A '+M.fmt(th*180/PI,6)+'° de un círculo de radio '+M.fmt(rr,6)+L()+'.');
    tiles([['Longitud del arco (s)',fx(arc,dp)+L(),'r × θ'],['Área del sector',fx(sec,dp)+A2(),'½ × r² × θ'],['Longitud de la cuerda',fx(ch,dp)+L(),'2r·sin(θ/2)'],['Altura / sagita',fx(sag,dp)+L(),'r(1 − cos(θ/2))'],['Área del segmento',fx(seg,dp)+A2(),'½r²(θ − sin θ)'],['Área del triángulo',fx(tri,dp)+A2(),'½r²·sin θ']]);
    drawCircle(rr,{th:th,label:M.fmt(th*180/PI,4)+'°'});C.text('vizTag','θ = '+M.fmt(th*180/PI,4)+'°');C.text('vizNote','El sector sombreado; la línea discontinua es la cuerda.');
    st('Convierte el ángulo a radianes','Las fórmulas de arcos y sectores requieren radianes.','θ = '+f(thv)+($('thu').value==='deg'?'° × π ÷ 180':' rad')+' = <b>'+f(th)+' rad</b>');
    st('Longitud del arco y área del sector','El sector es la fracción θ ÷ 2π del círculo completo.','s = rθ = '+f(rr)+' × '+f(th)+' = <b>'+f(arc)+'</b><br>A = ½r²θ = <b>'+f(sec)+'</b>');
    st('Cuerda, altura y segmento','El segmento es el sector menos el triángulo formado por los dos radios y la cuerda.','c = 2r·sin(θ/2) = <b>'+f(ch)+'</b>; h = r(1 − cos(θ/2)) = <b>'+f(sag)+'</b><br>segmento = sector − triángulo = '+f(sec)+' − '+f(tri)+' = <b>'+f(seg)+'</b>');
    last='Sector — calculatepilot.com/math/circle-calculator.html\nr = '+M.fmt(rr,6)+', θ = '+M.fmt(th*180/PI,6)+'°\nArco = '+M.fmt(arc,6)+', área del sector = '+M.fmt(sec,6)+', cuerda = '+M.fmt(ch,6)+', área del segmento = '+M.fmt(seg,6);
    C.text('stepsIntro','Sector, arco, cuerda y segmento a partir de un radio y un ángulo central.');C.text('stepsTag','θ en radianes');
  }else if(m==='s3'){
    var c3=v('ch'),h3=v('hh');if(!(c3>0)||!(h3>0))return fail('La longitud de la cuerda y la altura deben ser mayores que 0.');
    var r3=c3*c3/(8*h3)+h3/2;if(h3>2*r3+1e-9)return fail('La altura no puede superar el diámetro.');
    var th3=2*Math.atan2(c3/2,r3-h3),arc3=r3*th3,sec3=0.5*r3*r3*th3,seg3=0.5*r3*r3*(th3-Math.sin(th3)),tri3=0.5*r3*r3*Math.sin(th3);
    C.text('fxNow','r = c² ÷ 8h + h ÷ 2,  θ = 2·atan2(c/2, r − h)');C.text('heroLbl','Radio del círculo (r)');C.text('resultValue',fx(r3,dp)+L());C.text('ex1L','Área del segmento');C.text('ex1',fx(seg3,dp)+A2());C.text('ex2L','Ángulo central');C.text('ex2',fx(th3*180/PI,4)+'°');
    tg.textContent=h3<r3?'Segmento menor':(Math.abs(h3-r3)<1e-9?'Semicírculo':'Segmento mayor');C.text('interp','Una cuerda de '+M.fmt(c3,6)+L()+' con altura '+M.fmt(h3,6)+L()+' se encuentra en un círculo de radio '+M.fmt(r3,6)+'.');
    tiles([['Radio (r)',fx(r3,dp)+L(),'c²/(8h) + h/2'],['Ángulo central (θ)',fx(th3*180/PI,dp)+'° / '+fx(th3,dp)+' rad',''],['Longitud del arco',fx(arc3,dp)+L(),'r × θ'],['Área del sector',fx(sec3,dp)+A2(),'½r²θ'],['Área del segmento',fx(seg3,dp)+A2(),'½r²(θ − sin θ)'],['Área del círculo',fx(PI*r3*r3,dp)+A2(),'πr²']]);
    drawCircle(r3,{th:th3,seg:true,label:M.fmt(th3*180/PI,4)+'°'});C.text('vizTag','r = '+M.fmt(r3,4));C.text('vizNote','El segmento sombreado queda entre la cuerda y el arco.');
    st('Radio a partir de la cuerda y la altura','La cuerda y la altura determinan el círculo (teorema de las cuerdas que se cortan).','r = c² ÷ (8h) + h ÷ 2 = '+f(c3*c3)+' ÷ '+f(8*h3)+' + '+f(h3/2)+' = <b>'+f(r3)+'</b>');
    st('Ángulo central','Usar atan2 mantiene la respuesta correcta incluso para un segmento mayor (h > r).','θ = 2·atan2(c ÷ 2, r − h) = <b>'+f(th3)+' rad</b> = '+f(th3*180/PI)+'°');
    st('Arco, sector y segmento','','arco = rθ = <b>'+f(arc3)+'</b>; sector = <b>'+f(sec3)+'</b>; triángulo = '+f(tri3)+'<br>segmento = sector − triángulo = <b>'+f(seg3)+'</b>');
    last='Segmento — calculatepilot.com/math/circle-calculator.html\ncuerda = '+M.fmt(c3,6)+', altura = '+M.fmt(h3,6)+'\nr = '+M.fmt(r3,6)+', θ = '+M.fmt(th3*180/PI,6)+'°, arco = '+M.fmt(arc3,6)+', área del segmento = '+M.fmt(seg3,6);
    C.text('stepsIntro','Radio del círculo y área del segmento a partir de una cuerda y su altura.');C.text('stepsTag','r = c²/8h + h/2');
  }else{
    var R=v('ro'),ri=v('ri');if(!(R>0)||!(ri>=0))return fail('Introduce un radio exterior mayor que 0 y un radio interior de 0 o más.');if(ri>=R)return fail('El radio interior debe ser menor que el radio exterior.');
    var ar=PI*(R*R-ri*ri),wd=R-ri;
    C.text('fxNow','A = π(R² − r²)');C.text('heroLbl','Área del anillo');C.text('resultValue',fx(ar,dp)+A2());C.text('ex1L','Exacto');C.text('ex1',pi(R*R-ri*ri)+A2());C.text('ex2L','Ancho del anillo');C.text('ex2',fx(wd,dp)+L());
    tg.textContent='Corona circular';C.text('interp','El anillo entre círculos de radio '+M.fmt(R,6)+L()+' and '+M.fmt(ri,6)+L()+' covers '+M.fmt(ar/(PI*R*R)*100,4)+'% del disco exterior.');
    tiles([['Área del círculo exterior',fx(PI*R*R,dp)+A2(),'πR²'],['Área del círculo interior',fx(PI*ri*ri,dp)+A2(),'πr²'],['Circunferencia exterior',fx(2*PI*R,dp)+L(),'2πR'],['Circunferencia interior',fx(2*PI*ri,dp)+L(),'2πr'],['Longitud total del contorno',fx(2*PI*(R+ri),dp)+L(),'2π(R + r)'],['Proporción del disco exterior',M.fmt(ar/(PI*R*R)*100,4)+'%','anillo ÷ disco exterior']]);
    drawCircle(R,{ring:ri,width:wd});C.text('vizTag','width '+M.fmt(wd,4));C.text('vizNote','El anillo sombreado entre los círculos exterior e interior.');
    st('Área del disco exterior','','πR² = π × '+f(R)+'² = <b>'+f(PI*R*R)+'</b>');
    st('Área del disco interior','Resta el hueco.','πr² = π × '+f(ri)+'² = <b>'+f(PI*ri*ri)+'</b>');
    st('Resta','','A = πR² − πr² = π(R² − r²) = <b>'+f(ar)+'</b> (exacto: '+esc(pi(R*R-ri*ri))+')');
    last='Corona circular — calculatepilot.com/math/circle-calculator.html\nR = '+M.fmt(R,6)+', r = '+M.fmt(ri,6)+'\nÁrea = '+M.fmt(ar,6)+', ancho = '+M.fmt(wd,6);
    C.text('stepsIntro','Área de un anillo a partir de sus radios exterior e interior.');C.text('stepsTag','π(R² − r²)');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('pv').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ciCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-r]');if(!b)return;var r=+b.getAttribute('data-r'),m=$('mode').value;
    if(m==='s1'){C.set('prim','r');C.set('pv',r);}else if(m==='s2'){C.set('sr',r);}else{C.set('ro',r);C.set('ri',+(r*0.6).toPrecision(6));}fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
