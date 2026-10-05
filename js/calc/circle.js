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
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}

function svgBase(w,h){return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet">';}
function drawCircle(r,opt){
  var W=760,H=340,R=Math.min(H/2-28,150),cx=W/2,cy=H/2,s=svgBase(W,H),k=R/r;
  function pt(a,rr){return [cx+rr*Math.cos(a),cy-rr*Math.sin(a)];}
  if(opt.ring){var ri=opt.ring*k;s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-primary)" stroke-width="2.5"/><circle cx="'+cx+'" cy="'+cy+'" r="'+ri.toFixed(1)+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5"/>';
    s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+R)+'" y2="'+cy+'" stroke="#d97706" stroke-width="2"/><text class="ax" x="'+(cx+ri+(R-ri)/2).toFixed(1)+'" y="'+(cy-8)+'" text-anchor="middle" style="font-weight:700;fill:#b45309">width '+esc(M.fmt(opt.width,4))+'</text><text class="ax" x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle">r = '+esc(M.fmt(opt.ring,4))+'</text><text class="ax" x="'+cx+'" y="'+(cy+R+18)+'" text-anchor="middle">R = '+esc(M.fmt(r,4))+'</text>';
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
  C.text('formH',{s1:'Solve from any one value',s2:'Circular sector & arc',s3:'Circular segment from chord and height',s4:'Annulus (ring between two circles)'}[m]);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));};
  if(m==='s1'){
    var k=$('prim').value,pv=v('pv');C.text('pvL',{r:'Radius (r)',d:'Diameter (d)',c:'Circumference (C)',a:'Area (A)'}[k]);
    if(!(pv>0))return fail('Enter a value greater than 0.');
    var r={r:pv,d:pv/2,c:pv/(2*PI),a:Math.sqrt(pv/PI)}[k],d=2*r,c=2*PI*r,a=PI*r*r;
    C.text('fxNow',{r:'d = 2r,  C = 2πr,  A = πr²',d:'r = d ÷ 2,  C = πd,  A = πr²',c:'r = C ÷ 2π,  d = C ÷ π,  A = πr²',a:'r = √(A ÷ π),  d = 2r,  C = 2πr'}[k]);
    C.text('heroLbl',k==='c'?'Radius (r)':'Circumference (C)');C.text('resultValue',k==='c'?fx(r,dp)+L():fx(c,dp)+L());C.text('ex1L','Circumference, exact');C.text('ex1',pi(d)+L());C.text('ex2L','Area, exact');C.text('ex2',pi(r*r)+A2());
    tg.textContent='C ÷ d = π';C.text('interp','A circle of radius '+M.fmt(r,6)+L()+' has diameter '+M.fmt(d,6)+', circumference '+M.fmt(c,6)+' and area '+M.fmt(a,6)+'.');
    tiles([['Radius (r)',fx(r,dp)+L(),'half the diameter'],['Diameter (d)',fx(d,dp)+L(),'2 × r'],['Circumference (C)',fx(c,dp)+L(),'2πr = πd'],['Area (A)',fx(a,dp)+A2(),'πr²'],['C ÷ d',M.fmt(c/d,10),'always π'],['C ÷ r',M.fmt(c/r,10),'always 2π']]);
    drawCircle(r,{});C.text('vizTag','r = '+M.fmt(r,4));C.text('vizNote','The circle with its radius and diameter marked.');
    st('Get the radius',{r:'The radius is given.',d:'Halve the diameter.',c:'Divide the circumference by 2π.',a:'Divide the area by π, then take the square root.'}[k],{r:'r = <b>'+f(r)+'</b>',d:'r = '+f(pv)+' ÷ 2 = <b>'+f(r)+'</b>',c:'r = '+f(pv)+' ÷ (2π) = <b>'+f(r)+'</b>',a:'r = √('+f(pv)+' ÷ π) = <b>'+f(r)+'</b>'}[k]);
    st('Diameter and circumference','','d = 2r = <b>'+f(d)+'</b><br>C = 2πr = 2π × '+f(r)+' = <b>'+f(c)+'</b>  (exact: '+esc(pi(d))+')');
    st('Area','','A = πr² = π × '+f(r)+'² = <b>'+f(a)+'</b>  (exact: '+esc(pi(r*r))+')');
    last='Circle — calculatepilot.com/math/circle-calculator.html\nr = '+M.fmt(r,6)+', d = '+M.fmt(d,6)+', C = '+M.fmt(c,6)+', A = '+M.fmt(a,6)+L();
    C.text('stepsIntro','A full circle from one known measurement.');C.text('stepsTag','C = 2πr · A = πr²');
  }else if(m==='s2'){
    var rr=v('sr'),thv=v('th'),th=$('thu').value==='deg'?thv*PI/180:thv;
    if(!(rr>0)||!(thv>0))return fail('Radius and central angle must be greater than 0.');if(th>2*PI+1e-12)return fail('The central angle cannot exceed 360° (2π rad).');
    var arc=rr*th,sec=0.5*rr*rr*th,ch=2*rr*Math.sin(th/2),sag=rr*(1-Math.cos(th/2)),seg=0.5*rr*rr*(th-Math.sin(th)),tri=0.5*rr*rr*Math.sin(th);
    C.text('fxNow','s = rθ,  A = ½r²θ,  c = 2r·sin(θ/2)');C.text('heroLbl','Arc length (s)');C.text('resultValue',fx(arc,dp)+L());C.text('ex1L','Sector area');C.text('ex1',fx(sec,dp)+A2());C.text('ex2L','Angle');C.text('ex2',fx(th*180/PI,4)+'° = '+fx(th,4)+' rad');
    tg.textContent=Math.abs(th-2*PI)<1e-9?'Full circle':(Math.abs(th-PI)<1e-9?'Semicircle':'Sector '+M.fmt(th/(2*PI)*100,4)+'% of the circle');C.text('interp','A '+M.fmt(th*180/PI,6)+'° sector of a circle of radius '+M.fmt(rr,6)+L()+'.');
    tiles([['Arc length (s)',fx(arc,dp)+L(),'r × θ'],['Sector area',fx(sec,dp)+A2(),'½ × r² × θ'],['Chord length',fx(ch,dp)+L(),'2r·sin(θ/2)'],['Height / sagitta',fx(sag,dp)+L(),'r(1 − cos(θ/2))'],['Segment area',fx(seg,dp)+A2(),'½r²(θ − sin θ)'],['Triangle area',fx(tri,dp)+A2(),'½r²·sin θ']]);
    drawCircle(rr,{th:th,label:M.fmt(th*180/PI,4)+'°'});C.text('vizTag','θ = '+M.fmt(th*180/PI,4)+'°');C.text('vizNote','The shaded sector; the dashed line is the chord.');
    st('Convert the angle to radians','Formulas for arcs and sectors need radians.','θ = '+f(thv)+($('thu').value==='deg'?'° × π ÷ 180':' rad')+' = <b>'+f(th)+' rad</b>');
    st('Arc length and sector area','The sector is the fraction θ ÷ 2π of the whole circle.','s = rθ = '+f(rr)+' × '+f(th)+' = <b>'+f(arc)+'</b><br>A = ½r²θ = <b>'+f(sec)+'</b>');
    st('Chord, height and segment','The segment is the sector minus the triangle formed by the two radii and the chord.','c = 2r·sin(θ/2) = <b>'+f(ch)+'</b>;  h = r(1 − cos(θ/2)) = <b>'+f(sag)+'</b><br>segment = sector − triangle = '+f(sec)+' − '+f(tri)+' = <b>'+f(seg)+'</b>');
    last='Sector — calculatepilot.com/math/circle-calculator.html\nr = '+M.fmt(rr,6)+', θ = '+M.fmt(th*180/PI,6)+'°\nArc = '+M.fmt(arc,6)+', sector area = '+M.fmt(sec,6)+', chord = '+M.fmt(ch,6)+', segment area = '+M.fmt(seg,6);
    C.text('stepsIntro','Sector, arc, chord and segment from a radius and central angle.');C.text('stepsTag','θ in radians');
  }else if(m==='s3'){
    var c3=v('ch'),h3=v('hh');if(!(c3>0)||!(h3>0))return fail('Chord length and height must both be greater than 0.');
    var r3=c3*c3/(8*h3)+h3/2;if(h3>2*r3+1e-9)return fail('The height cannot exceed the diameter.');
    var th3=2*Math.atan2(c3/2,r3-h3),arc3=r3*th3,sec3=0.5*r3*r3*th3,seg3=0.5*r3*r3*(th3-Math.sin(th3)),tri3=0.5*r3*r3*Math.sin(th3);
    C.text('fxNow','r = c² ÷ 8h + h ÷ 2,  θ = 2·atan2(c/2, r − h)');C.text('heroLbl','Circle radius (r)');C.text('resultValue',fx(r3,dp)+L());C.text('ex1L','Segment area');C.text('ex1',fx(seg3,dp)+A2());C.text('ex2L','Central angle');C.text('ex2',fx(th3*180/PI,4)+'°');
    tg.textContent=h3<r3?'Minor segment':(Math.abs(h3-r3)<1e-9?'Half circle':'Major segment');C.text('interp','A chord of '+M.fmt(c3,6)+L()+' with height '+M.fmt(h3,6)+L()+' lies on a circle of radius '+M.fmt(r3,6)+'.');
    tiles([['Radius (r)',fx(r3,dp)+L(),'c²/(8h) + h/2'],['Central angle (θ)',fx(th3*180/PI,dp)+'° / '+fx(th3,dp)+' rad',''],['Arc length',fx(arc3,dp)+L(),'r × θ'],['Sector area',fx(sec3,dp)+A2(),'½r²θ'],['Segment area',fx(seg3,dp)+A2(),'½r²(θ − sin θ)'],['Circle area',fx(PI*r3*r3,dp)+A2(),'πr²']]);
    drawCircle(r3,{th:th3,seg:true,label:M.fmt(th3*180/PI,4)+'°'});C.text('vizTag','r = '+M.fmt(r3,4));C.text('vizNote','The shaded segment lies between the chord and the arc.');
    st('Radius from chord and height','Chord and height determine the circle (intersecting-chords theorem).','r = c² ÷ (8h) + h ÷ 2 = '+f(c3*c3)+' ÷ '+f(8*h3)+' + '+f(h3/2)+' = <b>'+f(r3)+'</b>');
    st('Central angle','Using atan2 keeps the answer correct even for a major segment (h > r).','θ = 2·atan2(c ÷ 2, r − h) = <b>'+f(th3)+' rad</b> = '+f(th3*180/PI)+'°');
    st('Arc, sector and segment','','arc = rθ = <b>'+f(arc3)+'</b>;  sector = <b>'+f(sec3)+'</b>;  triangle = '+f(tri3)+'<br>segment = sector − triangle = <b>'+f(seg3)+'</b>');
    last='Segment — calculatepilot.com/math/circle-calculator.html\nchord = '+M.fmt(c3,6)+', height = '+M.fmt(h3,6)+'\nr = '+M.fmt(r3,6)+', θ = '+M.fmt(th3*180/PI,6)+'°, arc = '+M.fmt(arc3,6)+', segment area = '+M.fmt(seg3,6);
    C.text('stepsIntro','Circle radius and segment area from a chord and its height.');C.text('stepsTag','r = c²/8h + h/2');
  }else{
    var R=v('ro'),ri=v('ri');if(!(R>0)||!(ri>=0))return fail('Enter an outer radius above 0 and an inner radius of 0 or more.');if(ri>=R)return fail('The inner radius must be smaller than the outer radius.');
    var ar=PI*(R*R-ri*ri),wd=R-ri;
    C.text('fxNow','A = π(R² − r²)');C.text('heroLbl','Ring area');C.text('resultValue',fx(ar,dp)+A2());C.text('ex1L','Exact');C.text('ex1',pi(R*R-ri*ri)+A2());C.text('ex2L','Ring width');C.text('ex2',fx(wd,dp)+L());
    tg.textContent='Annulus';C.text('interp','The ring between circles of radius '+M.fmt(R,6)+L()+' and '+M.fmt(ri,6)+L()+' covers '+M.fmt(ar/(PI*R*R)*100,4)+'% of the outer disc.');
    tiles([['Outer circle area',fx(PI*R*R,dp)+A2(),'πR²'],['Inner circle area',fx(PI*ri*ri,dp)+A2(),'πr²'],['Outer circumference',fx(2*PI*R,dp)+L(),'2πR'],['Inner circumference',fx(2*PI*ri,dp)+L(),'2πr'],['Total boundary length',fx(2*PI*(R+ri),dp)+L(),'2π(R + r)'],['Share of outer disc',M.fmt(ar/(PI*R*R)*100,4)+'%','ring ÷ outer disc']]);
    drawCircle(R,{ring:ri,width:wd});C.text('vizTag','width '+M.fmt(wd,4));C.text('vizNote','The shaded ring between the outer and inner circles.');
    st('Area of the outer disc','','πR² = π × '+f(R)+'² = <b>'+f(PI*R*R)+'</b>');
    st('Area of the inner disc','Remove the hole.','πr² = π × '+f(ri)+'² = <b>'+f(PI*ri*ri)+'</b>');
    st('Subtract','','A = πR² − πr² = π(R² − r²) = <b>'+f(ar)+'</b>  (exact: '+esc(pi(R*R-ri*ri))+')');
    last='Annulus — calculatepilot.com/math/circle-calculator.html\nR = '+M.fmt(R,6)+', r = '+M.fmt(ri,6)+'\nArea = '+M.fmt(ar,6)+', width = '+M.fmt(wd,6);
    C.text('stepsIntro','Area of a ring from its outer and inner radii.');C.text('stepsTag','π(R² − r²)');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('pv').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ciCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-r]');if(!b)return;var r=+b.getAttribute('data-r'),m=$('mode').value;
    if(m==='s1'){C.set('prim','r');C.set('pv',r);}else if(m==='s2'){C.set('sr',r);}else{C.set('ro',r);C.set('ri',+(r*0.6).toPrecision(6));}fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
