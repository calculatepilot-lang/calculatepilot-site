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
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir un résultat.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}

function svgBase(w,h){return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet">';}
function drawCircle(r,opt){
  var W=760,H=340,R=Math.min(H/2-28,150),cx=W/2,cy=H/2,s=svgBase(W,H),k=R/r;
  function pt(a,rr){return [cx+rr*Math.cos(a),cy-rr*Math.sin(a)];}
  if(opt.ring){var ri=opt.ring*k;s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-primary)" stroke-width="2.5"/><circle cx="'+cx+'" cy="'+cy+'" r="'+ri.toFixed(1)+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5"/>';
    s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+R)+'" y2="'+cy+'" stroke="#d97706" stroke-width="2"/><text class="ax" x="'+(cx+ri+(R-ri)/2).toFixed(1)+'" y="'+(cy-8)+'" text-anchor="middle" style="font-weight:700;fill:#b45309">largeur '+esc(M.fmt(opt.width,4))+'</text><text class="ax" x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle">r = '+esc(M.fmt(opt.ring,4))+'</text><text class="ax" x="'+cx+'" y="'+(cy+R+18)+'" text-anchor="middle">R = '+esc(M.fmt(r,4))+'</text>';
  }else{
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5"/>';
    if(opt.th){var th=opt.th,a0=-th/2+0,p1=pt(a0,R),p2=pt(a0+th,R),large=th>PI?1:0;
      var a1=PI/2-th/2,q1=pt(a1,R),q2=pt(a1+th,R);
      if(opt.seg){/* segment: region between chord and arc */ s+='<path d="M'+q1[0].toFixed(1)+' '+q1[1].toFixed(1)+' A'+R+' '+R+' 0 '+large+' 0 '+q2[0].toFixed(1)+' '+q2[1].toFixed(1)+' Z" fill="#2563eb" fill-opacity=".22" stroke="#2563eb" stroke-width="2"/>';}
      else{s+='<path d="M'+cx+' '+cy+' L'+q1[0].toFixed(1)+' '+q1[1].toFixed(1)+' A'+R+' '+R+' 0 '+large+' 0 '+q2[0].toFixed(1)+' '+q2[1].toFixed(1)+' Z" fill="var(--sx-pc)" fill-opacity=".25" stroke="var(--sx-pc)" stroke-width="2"/>';}
      s+='<line x1="'+q1[0].toFixed(1)+'" y1="'+q1[1].toFixed(1)+'" x2="'+q2[0].toFixed(1)+'" y2="'+q2[1].toFixed(1)+'" stroke="#d97706" stroke-width="2" stroke-dasharray="5 3"/>';
      if(!opt.seg)s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+q1[0].toFixed(1)+'" y2="'+q1[1].toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="1.5"/><line x1="'+cx+'" y1="'+cy+'" x2="'+q2[0].toFixed(1)+'" y2="'+q2[1].toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="1.5"/>';
      s+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="var(--sx-primary)"/><text class="ax" x="'+cx+'" y="'+(cy+18)+'" text-anchor="middle">centre</text>';
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
  C.text('formH',{s1:'Résoudre à partir d\'une seule valeur',s2:'Secteur circulaire et arc',s3:'Segment circulaire à partir de la corde et de la hauteur',s4:'Couronne (anneau entre deux cercles)'}[m]);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));};
  if(m==='s1'){
    var k=$('prim').value,pv=v('pv');C.text('pvL',{r:'Rayon (r)',d:'Diamètre (d)',c:'Circonférence (C)',a:'Aire (A)'}[k]);
    if(!(pv>0))return fail('Saisissez une valeur supérieure à 0.');
    var r={r:pv,d:pv/2,c:pv/(2*PI),a:Math.sqrt(pv/PI)}[k],d=2*r,c=2*PI*r,a=PI*r*r;
    C.text('fxNow',{r:'d = 2r,  C = 2πr,  A = πr²',d:'r = d ÷ 2,  C = πd,  A = πr²',c:'r = C ÷ 2π,  d = C ÷ π,  A = πr²',a:'r = √(A ÷ π),  d = 2r,  C = 2πr'}[k]);
    C.text('heroLbl',k==='c'?'Rayon (r)':'Circonférence (C)');C.text('resultValue',k==='c'?fx(r,dp)+L():fx(c,dp)+L());C.text('ex1L','Circonférence, valeur exacte');C.text('ex1',pi(d)+L());C.text('ex2L','Aire, valeur exacte');C.text('ex2',pi(r*r)+A2());
    tg.textContent='C ÷ d = π';C.text('interp','Un cercle de rayon '+M.fmt(r,6)+L()+' a pour diamètre '+M.fmt(d,6)+', pour circonférence '+M.fmt(c,6)+' et pour aire '+M.fmt(a,6)+'.');
    tiles([['Rayon (r)',fx(r,dp)+L(),'la moitié du diamètre'],['Diamètre (d)',fx(d,dp)+L(),'2 × r'],['Circonférence (C)',fx(c,dp)+L(),'2πr = πd'],['Aire (A)',fx(a,dp)+A2(),'πr²'],['C ÷ d',M.fmt(c/d,10),'toujours π'],['C ÷ r',M.fmt(c/r,10),'toujours 2π']]);
    drawCircle(r,{});C.text('vizTag','r = '+M.fmt(r,4));C.text('vizNote','Le cercle avec son rayon et son diamètre indiqués.');
    st('Obtenir le rayon',{r:'Le rayon est donné.',d:'Divisez le diamètre par 2.',c:'Divisez la circonférence par 2π.',a:'Divisez l’aire par π, puis prenez la racine carrée.'}[k],{r:'r = <b>'+f(r)+'</b>',d:'r = '+f(pv)+' ÷ 2 = <b>'+f(r)+'</b>',c:'r = '+f(pv)+' ÷ (2π) = <b>'+f(r)+'</b>',a:'r = √('+f(pv)+' ÷ π) = <b>'+f(r)+'</b>'}[k]);
    st('Diamètre et circonférence','','d = 2r = <b>'+f(d)+'</b><br>C = 2πr = 2π × '+f(r)+' = <b>'+f(c)+'</b> (valeur exacte : '+esc(pi(d))+')');
    st('Aire','','A = πr² = π × '+f(r)+'² = <b>'+f(a)+'</b> (valeur exacte : '+esc(pi(r*r))+')');
    last='Cercle — calculatepilot.com/math/circle-calculator.html\nr = '+M.fmt(r,6)+', d = '+M.fmt(d,6)+', C = '+M.fmt(c,6)+', A = '+M.fmt(a,6)+L();
    C.text('stepsIntro','Un cercle complet à partir d’une seule mesure connue.');C.text('stepsTag','C = 2πr · A = πr²');
  }else if(m==='s2'){
    var rr=v('sr'),thv=v('th'),th=$('thu').value==='deg'?thv*PI/180:thv;
    if(!(rr>0)||!(thv>0))return fail('Le rayon et l’angle au centre doivent être supérieurs à 0.');if(th>2*PI+1e-12)return fail('L’angle au centre ne peut pas dépasser 360° (2π rad).');
    var arc=rr*th,sec=0.5*rr*rr*th,ch=2*rr*Math.sin(th/2),sag=rr*(1-Math.cos(th/2)),seg=0.5*rr*rr*(th-Math.sin(th)),tri=0.5*rr*rr*Math.sin(th);
    C.text('fxNow','s = rθ,  A = ½r²θ,  c = 2r·sin(θ/2)');C.text('heroLbl','Longueur de l’arc (s)');C.text('resultValue',fx(arc,dp)+L());C.text('ex1L','Aire du secteur');C.text('ex1',fx(sec,dp)+A2());C.text('ex2L','Angle');C.text('ex2',fx(th*180/PI,4)+'° = '+fx(th,4)+' rad');
    tg.textContent=Math.abs(th-2*PI)<1e-9?'Cercle complet':(Math.abs(th-PI)<1e-9?'Demi-cercle':'Secteur '+M.fmt(th/(2*PI)*100,4)+'% du cercle');C.text('interp','A '+M.fmt(th*180/PI,6)+'° d’un cercle de rayon '+M.fmt(rr,6)+L()+'.');
    tiles([['Longueur de l’arc (s)',fx(arc,dp)+L(),'r × θ'],['Aire du secteur',fx(sec,dp)+A2(),'½ × r² × θ'],['Longueur de la corde',fx(ch,dp)+L(),'2r·sin(θ/2)'],['Hauteur / flèche',fx(sag,dp)+L(),'r(1 − cos(θ/2))'],['Aire du segment',fx(seg,dp)+A2(),'½r²(θ − sin θ)'],['Aire du triangle',fx(tri,dp)+A2(),'½r²·sin θ']]);
    drawCircle(rr,{th:th,label:M.fmt(th*180/PI,4)+'°'});C.text('vizTag','θ = '+M.fmt(th*180/PI,4)+'°');C.text('vizNote','Le secteur ombré ; la ligne en pointillés est la corde.');
    st('Convertissez l\'angle en radians','Les formules des arcs et des secteurs nécessitent des radians.','θ = '+f(thv)+($('thu').value==='deg'?'° × π ÷ 180':' rad')+' = <b>'+f(th)+' rad</b>');
    st('Longueur d’arc et aire du secteur','Le secteur représente la fraction θ ÷ 2π du cercle entier.','s = rθ = '+f(rr)+' × '+f(th)+' = <b>'+f(arc)+'</b><br>A = ½r²θ = <b>'+f(sec)+'</b>');
    st('Corde, hauteur et segment','Le segment est le secteur moins le triangle formé par les deux rayons et la corde.','c = 2r·sin(θ/2) = <b>'+f(ch)+'</b> ; h = r(1 − cos(θ/2)) = <b>'+f(sag)+'</b><br>segment = secteur − triangle = '+f(sec)+' − '+f(tri)+' = <b>'+f(seg)+'</b>');
    last='Secteur — calculatepilot.com/math/circle-calculator.html\nr = '+M.fmt(rr,6)+', θ = '+M.fmt(th*180/PI,6)+'°\nArc = '+M.fmt(arc,6)+', aire du secteur = '+M.fmt(sec,6)+', corde = '+M.fmt(ch,6)+', aire du segment = '+M.fmt(seg,6);
    C.text('stepsIntro','Secteur, arc, corde et segment à partir d’un rayon et d’un angle au centre.');C.text('stepsTag','θ en radians');
  }else if(m==='s3'){
    var c3=v('ch'),h3=v('hh');if(!(c3>0)||!(h3>0))return fail('La longueur de la corde et la hauteur doivent toutes deux être supérieures à 0.');
    var r3=c3*c3/(8*h3)+h3/2;if(h3>2*r3+1e-9)return fail('La hauteur ne peut pas dépasser le diamètre.');
    var th3=2*Math.atan2(c3/2,r3-h3),arc3=r3*th3,sec3=0.5*r3*r3*th3,seg3=0.5*r3*r3*(th3-Math.sin(th3)),tri3=0.5*r3*r3*Math.sin(th3);
    C.text('fxNow','r = c² ÷ 8h + h ÷ 2,  θ = 2·atan2(c/2, r − h)');C.text('heroLbl','Rayon du cercle (r)');C.text('resultValue',fx(r3,dp)+L());C.text('ex1L','Aire du segment');C.text('ex1',fx(seg3,dp)+A2());C.text('ex2L','Angle au centre');C.text('ex2',fx(th3*180/PI,4)+'°');
    tg.textContent=h3<r3?'Petit segment':(Math.abs(h3-r3)<1e-9?'Demi-cercle':'Grand segment');C.text('interp','Une corde de '+M.fmt(c3,6)+L()+' et de hauteur '+M.fmt(h3,6)+L()+' appartient à un cercle de rayon '+M.fmt(r3,6)+'.');
    tiles([['Rayon (r)',fx(r3,dp)+L(),'c²/(8h) + h/2'],['Angle au centre (θ)',fx(th3*180/PI,dp)+'° / '+fx(th3,dp)+' rad',''],['Longueur de l\'arc',fx(arc3,dp)+L(),'r × θ'],['Aire du secteur',fx(sec3,dp)+A2(),'½r²θ'],['Aire du segment',fx(seg3,dp)+A2(),'½r²(θ − sin θ)'],['Aire du cercle',fx(PI*r3*r3,dp)+A2(),'πr²']]);
    drawCircle(r3,{th:th3,seg:true,label:M.fmt(th3*180/PI,4)+'°'});C.text('vizTag','r = '+M.fmt(r3,4));C.text('vizNote','Le segment ombré est compris entre la corde et l’arc.');
    st('Rayon à partir de la corde et de la hauteur','La corde et la hauteur déterminent le cercle (théorème des cordes sécantes).','r = c² ÷ (8h) + h ÷ 2 = '+f(c3*c3)+' ÷ '+f(8*h3)+' + '+f(h3/2)+' = <b>'+f(r3)+'</b>');
    st('Angle au centre','L’utilisation de atan2 garantit un résultat correct même pour un grand segment (h > r).','θ = 2·atan2(c ÷ 2, r − h) = <b>'+f(th3)+' rad</b> = '+f(th3*180/PI)+'°');
    st('Arc, secteur et segment','','arc = rθ = <b>'+f(arc3)+'</b> ; secteur = <b>'+f(sec3)+'</b> ; triangle = '+f(tri3)+'<br>segment = secteur − triangle = <b>'+f(seg3)+'</b>');
    last='Segment — calculatepilot.com/math/circle-calculator.html\ncorde = '+M.fmt(c3,6)+', hauteur = '+M.fmt(h3,6)+'\nr = '+M.fmt(r3,6)+', θ = '+M.fmt(th3*180/PI,6)+'°, arc = '+M.fmt(arc3,6)+', aire du segment = '+M.fmt(seg3,6);
    C.text('stepsIntro','Rayon du cercle et aire du segment à partir d’une corde et de sa hauteur.');C.text('stepsTag','r = c²/8h + h/2');
  }else{
    var R=v('ro'),ri=v('ri');if(!(R>0)||!(ri>=0))return fail('Saisissez un rayon extérieur supérieur à 0 et un rayon intérieur supérieur ou égal à 0.');if(ri>=R)return fail('Le rayon intérieur doit être inférieur au rayon extérieur.');
    var ar=PI*(R*R-ri*ri),wd=R-ri;
    C.text('fxNow','A = π(R² − r²)');C.text('heroLbl','Aire de la couronne');C.text('resultValue',fx(ar,dp)+A2());C.text('ex1L','Exact');C.text('ex1',pi(R*R-ri*ri)+A2());C.text('ex2L','Largeur de la couronne');C.text('ex2',fx(wd,dp)+L());
    tg.textContent='Couronne';C.text('interp','La couronne comprise entre les cercles de rayon '+M.fmt(R,6)+L()+' and '+M.fmt(ri,6)+L()+' covers '+M.fmt(ar/(PI*R*R)*100,4)+'% du disque extérieur.');
    tiles([['Aire du cercle extérieur',fx(PI*R*R,dp)+A2(),'πR²'],['Aire du cercle intérieur',fx(PI*ri*ri,dp)+A2(),'πr²'],['Circonférence extérieure',fx(2*PI*R,dp)+L(),'2πR'],['Circonférence intérieure',fx(2*PI*ri,dp)+L(),'2πr'],['Longueur totale du contour',fx(2*PI*(R+ri),dp)+L(),'2π(R + r)'],['Part du disque extérieur',M.fmt(ar/(PI*R*R)*100,4)+'%','couronne ÷ disque extérieur']]);
    drawCircle(R,{ring:ri,width:wd});C.text('vizTag','width '+M.fmt(wd,4));C.text('vizNote','La couronne ombrée entre les cercles extérieur et intérieur.');
    st('Aire du disque extérieur','','πR² = π × '+f(R)+'² = <b>'+f(PI*R*R)+'</b>');
    st('Aire du disque intérieur','Retirez le trou.','πr² = π × '+f(ri)+'² = <b>'+f(PI*ri*ri)+'</b>');
    st('Soustraire','','A = πR² − πr² = π(R² − r²) = <b>'+f(ar)+'</b> (valeur exacte : '+esc(pi(R*R-ri*ri))+')');
    last='Couronne — calculatepilot.com/math/circle-calculator.html\nR = '+M.fmt(R,6)+', r = '+M.fmt(ri,6)+'\nAire = '+M.fmt(ar,6)+', largeur = '+M.fmt(wd,6);
    C.text('stepsIntro','Aire d’une couronne à partir de ses rayons extérieur et intérieur.');C.text('stepsTag','π(R² − r²)');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('pv').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ciCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-r]');if(!b)return;var r=+b.getAttribute('data-r'),m=$('mode').value;
    if(m==='s1'){C.set('prim','r');C.set('pv',r);}else if(m==='s2'){C.set('sr',r);}else{C.set('ro',r);C.set('ri',+(r*0.6).toPrecision(6));}fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier les résultats');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
