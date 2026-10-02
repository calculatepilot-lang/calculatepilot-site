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
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}

function svgBase(w,h){return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet">';}
function drawCircle(r,opt){
  var W=760,H=340,R=Math.min(H/2-28,150),cx=W/2,cy=H/2,s=svgBase(W,H),k=R/r;
  function pt(a,rr){return [cx+rr*Math.cos(a),cy-rr*Math.sin(a)];}
  if(opt.ring){var ri=opt.ring*k;s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="var(--sx-pc)" fill-opacity=".2" stroke="var(--sx-primary)" stroke-width="2.5"/><circle cx="'+cx+'" cy="'+cy+'" r="'+ri.toFixed(1)+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5"/>';
    s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+R)+'" y2="'+cy+'" stroke="#d97706" stroke-width="2"/><text class="ax" x="'+(cx+ri+(R-ri)/2).toFixed(1)+'" y="'+(cy-8)+'" text-anchor="middle" style="font-weight:700;fill:#b45309">Breite '+esc(M.fmt(opt.width,4))+'</text><text class="ax" x="'+cx+'" y="'+(cy+4)+'" text-anchor="middle">r = '+esc(M.fmt(opt.ring,4))+'</text><text class="ax" x="'+cx+'" y="'+(cy+R+18)+'" text-anchor="middle">R = '+esc(M.fmt(r,4))+'</text>';
  }else{
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2.5"/>';
    if(opt.th){var th=opt.th,a0=-th/2+0,p1=pt(a0,R),p2=pt(a0+th,R),large=th>PI?1:0;
      var a1=PI/2-th/2,q1=pt(a1,R),q2=pt(a1+th,R);
      if(opt.seg){/* segment: region between chord and arc */ s+='<path d="M'+q1[0].toFixed(1)+' '+q1[1].toFixed(1)+' A'+R+' '+R+' 0 '+large+' 0 '+q2[0].toFixed(1)+' '+q2[1].toFixed(1)+' Z" fill="#2563eb" fill-opacity=".22" stroke="#2563eb" stroke-width="2"/>';}
      else{s+='<path d="M'+cx+' '+cy+' L'+q1[0].toFixed(1)+' '+q1[1].toFixed(1)+' A'+R+' '+R+' 0 '+large+' 0 '+q2[0].toFixed(1)+' '+q2[1].toFixed(1)+' Z" fill="var(--sx-pc)" fill-opacity=".25" stroke="var(--sx-pc)" stroke-width="2"/>';}
      s+='<line x1="'+q1[0].toFixed(1)+'" y1="'+q1[1].toFixed(1)+'" x2="'+q2[0].toFixed(1)+'" y2="'+q2[1].toFixed(1)+'" stroke="#d97706" stroke-width="2" stroke-dasharray="5 3"/>';
      if(!opt.seg)s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+q1[0].toFixed(1)+'" y2="'+q1[1].toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="1.5"/><line x1="'+cx+'" y1="'+cy+'" x2="'+q2[0].toFixed(1)+'" y2="'+q2[1].toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="1.5"/>';
      s+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="var(--sx-primary)"/><text class="ax" x="'+cx+'" y="'+(cy+18)+'" text-anchor="middle">Mittelpunkt</text>';
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
  C.text('formH',{s1:'Aus einem beliebigen Wert berechnen',s2:'Kreissektor &amp; Kreisbogen',s3:'Kreissegment aus Sehne und Höhe',s4:'Kreisring (Ring zwischen zwei Kreisen)'}[m]);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,dp));};
  if(m==='s1'){
    var k=$('prim').value,pv=v('pv');C.text('pvL',{r:'Radius (r)',d:'Durchmesser (d)',c:'Umfang (C)',a:'Fläche (A)'}[k]);
    if(!(pv>0))return fail('Geben Sie einen Wert größer als 0 ein.');
    var r={r:pv,d:pv/2,c:pv/(2*PI),a:Math.sqrt(pv/PI)}[k],d=2*r,c=2*PI*r,a=PI*r*r;
    C.text('fxNow',{r:'d = 2r,  C = 2πr,  A = πr²',d:'r = d ÷ 2,  C = πd,  A = πr²',c:'r = C ÷ 2π,  d = C ÷ π,  A = πr²',a:'r = √(A ÷ π),  d = 2r,  C = 2πr'}[k]);
    C.text('heroLbl',k==='c'?'Radius (r)':'Umfang (C)');C.text('resultValue',k==='c'?fx(r,dp)+L():fx(c,dp)+L());C.text('ex1L','Umfang, exakt');C.text('ex1',pi(d)+L());C.text('ex2L','Fläche, exakt');C.text('ex2',pi(r*r)+A2());
    tg.textContent='C ÷ d = π';C.text('interp','Ein Kreis mit dem Radius '+M.fmt(r,6)+L()+' hat den Durchmesser '+M.fmt(d,6)+', den Umfang '+M.fmt(c,6)+' und die Fläche '+M.fmt(a,6)+'.');
    tiles([['Radius (r)',fx(r,dp)+L(),'halber Durchmesser'],['Durchmesser (d)',fx(d,dp)+L(),'2 × r'],['Umfang (C)',fx(c,dp)+L(),'2πr = πd'],['Fläche (A)',fx(a,dp)+A2(),'πr²'],['C ÷ d',M.fmt(c/d,10),'immer π'],['C ÷ r',M.fmt(c/r,10),'immer 2π']]);
    drawCircle(r,{});C.text('vizTag','r = '+M.fmt(r,4));C.text('vizNote','Der Kreis mit markiertem Radius und Durchmesser.');
    st('Radius ermitteln',{r:'Der Radius ist vorgegeben.',d:'Halbieren Sie den Durchmesser.',c:'Teilen Sie den Umfang durch 2π.',a:'Teilen Sie die Fläche durch π und ziehen Sie anschließend die Quadratwurzel.'}[k],{r:'r = <b>'+f(r)+'</b>',d:'r = '+f(pv)+' ÷ 2 = <b>'+f(r)+'</b>',c:'r = '+f(pv)+' ÷ (2π) = <b>'+f(r)+'</b>',a:'r = √('+f(pv)+' ÷ π) = <b>'+f(r)+'</b>'}[k]);
    st('Durchmesser und Umfang','','d = 2r = <b>'+f(d)+'</b><br>C = 2πr = 2π × '+f(r)+' = <b>'+f(c)+'</b> (exakt: '+esc(pi(d))+')');
    st('Fläche','','A = πr² = π × '+f(r)+'² = <b>'+f(a)+'</b> (exakt: '+esc(pi(r*r))+')');
    last='Kreis — calculatepilot.com/math/circle-calculator.html\nr = '+M.fmt(r,6)+', d = '+M.fmt(d,6)+', C = '+M.fmt(c,6)+', A = '+M.fmt(a,6)+L();
    C.text('stepsIntro','Ein vollständiger Kreis aus einer einzigen bekannten Größe.');C.text('stepsTag','C = 2πr · A = πr²');
  }else if(m==='s2'){
    var rr=v('sr'),thv=v('th'),th=$('thu').value==='deg'?thv*PI/180:thv;
    if(!(rr>0)||!(thv>0))return fail('Radius und Mittelpunktswinkel müssen größer als 0 sein.');if(th>2*PI+1e-12)return fail('Der Mittelpunktswinkel darf 360° (2π rad) nicht überschreiten.');
    var arc=rr*th,sec=0.5*rr*rr*th,ch=2*rr*Math.sin(th/2),sag=rr*(1-Math.cos(th/2)),seg=0.5*rr*rr*(th-Math.sin(th)),tri=0.5*rr*rr*Math.sin(th);
    C.text('fxNow','s = rθ,  A = ½r²θ,  c = 2r·sin(θ/2)');C.text('heroLbl','Bogenlänge (s)');C.text('resultValue',fx(arc,dp)+L());C.text('ex1L','Sektorfläche');C.text('ex1',fx(sec,dp)+A2());C.text('ex2L','Winkel');C.text('ex2',fx(th*180/PI,4)+'° = '+fx(th,4)+' rad');
    tg.textContent=Math.abs(th-2*PI)<1e-9?'Vollkreis':(Math.abs(th-PI)<1e-9?'Halbkreis':'Sektor '+M.fmt(th/(2*PI)*100,4)+'% des Kreises');C.text('interp','A '+M.fmt(th*180/PI,6)+'°-Sektor eines Kreises mit dem Radius '+M.fmt(rr,6)+L()+'.');
    tiles([['Bogenlänge (s)',fx(arc,dp)+L(),'r × θ'],['Sektorfläche',fx(sec,dp)+A2(),'½ × r² × θ'],['Sehnenlänge',fx(ch,dp)+L(),'2r·sin(θ/2)'],['Höhe / Pfeilhöhe',fx(sag,dp)+L(),'r(1 − cos(θ/2))'],['Segmentfläche',fx(seg,dp)+A2(),'½r²(θ − sin θ)'],['Dreiecksfläche',fx(tri,dp)+A2(),'½r²·sin θ']]);
    drawCircle(rr,{th:th,label:M.fmt(th*180/PI,4)+'°'});C.text('vizTag','θ = '+M.fmt(th*180/PI,4)+'°');C.text('vizNote','Der schattierte Sektor; die gestrichelte Linie ist die Sehne.');
    st('Winkel ins Bogenmaß umrechnen','Formeln für Bögen und Sektoren erfordern das Bogenmaß.','θ = '+f(thv)+($('thu').value==='deg'?'° × π ÷ 180':' rad')+' = <b>'+f(th)+' rad</b>');
    st('Bogenlänge und Sektorfläche','Der Sektor ist der Anteil θ ÷ 2π des gesamten Kreises.','s = rθ = '+f(rr)+' × '+f(th)+' = <b>'+f(arc)+'</b><br>A = ½r²θ = <b>'+f(sec)+'</b>');
    st('Sehne, Höhe und Segment','Das Segment ist der Sektor abzüglich des Dreiecks, das von den beiden Radien und der Sehne gebildet wird.','c = 2r·sin(θ/2) = <b>'+f(ch)+'</b>; h = r(1 − cos(θ/2)) = <b>'+f(sag)+'</b><br>Segment = Sektor − Dreieck = '+f(sec)+' − '+f(tri)+' = <b>'+f(seg)+'</b>');
    last='Sektor — calculatepilot.com/math/circle-calculator.html\nr = '+M.fmt(rr,6)+', θ = '+M.fmt(th*180/PI,6)+'°\nBogen = '+M.fmt(arc,6)+', Sektorfläche = '+M.fmt(sec,6)+', Sehne = '+M.fmt(ch,6)+', Segmentfläche = '+M.fmt(seg,6);
    C.text('stepsIntro','Sektor, Bogen, Sehne und Segment aus Radius und Mittelpunktswinkel.');C.text('stepsTag','θ im Bogenmaß');
  }else if(m==='s3'){
    var c3=v('ch'),h3=v('hh');if(!(c3>0)||!(h3>0))return fail('Sehnenlänge und Höhe müssen beide größer als 0 sein.');
    var r3=c3*c3/(8*h3)+h3/2;if(h3>2*r3+1e-9)return fail('Die Höhe darf den Durchmesser nicht überschreiten.');
    var th3=2*Math.atan2(c3/2,r3-h3),arc3=r3*th3,sec3=0.5*r3*r3*th3,seg3=0.5*r3*r3*(th3-Math.sin(th3)),tri3=0.5*r3*r3*Math.sin(th3);
    C.text('fxNow','r = c² ÷ 8h + h ÷ 2,  θ = 2·atan2(c/2, r − h)');C.text('heroLbl','Kreisradius (r)');C.text('resultValue',fx(r3,dp)+L());C.text('ex1L','Segmentfläche');C.text('ex1',fx(seg3,dp)+A2());C.text('ex2L','Mittelpunktswinkel');C.text('ex2',fx(th3*180/PI,4)+'°');
    tg.textContent=h3<r3?'Kleines Segment':(Math.abs(h3-r3)<1e-9?'Halbkreis':'Großes Segment');C.text('interp','Eine Sehne von '+M.fmt(c3,6)+L()+' mit der Höhe '+M.fmt(h3,6)+L()+' liegt auf einem Kreis mit dem Radius '+M.fmt(r3,6)+'.');
    tiles([['Radius (r)',fx(r3,dp)+L(),'c²/(8h) + h/2'],['Mittelpunktswinkel (θ)',fx(th3*180/PI,dp)+'° / '+fx(th3,dp)+' rad',''],['Bogenlänge',fx(arc3,dp)+L(),'r × θ'],['Sektorfläche',fx(sec3,dp)+A2(),'½r²θ'],['Segmentfläche',fx(seg3,dp)+A2(),'½r²(θ − sin θ)'],['Kreisfläche',fx(PI*r3*r3,dp)+A2(),'πr²']]);
    drawCircle(r3,{th:th3,seg:true,label:M.fmt(th3*180/PI,4)+'°'});C.text('vizTag','r = '+M.fmt(r3,4));C.text('vizNote','Das schattierte Segment liegt zwischen der Sehne und dem Bogen.');
    st('Radius aus Sehne und Höhe','Sehne und Höhe bestimmen den Kreis (Sehnensatz).','r = c² ÷ (8h) + h ÷ 2 = '+f(c3*c3)+' ÷ '+f(8*h3)+' + '+f(h3/2)+' = <b>'+f(r3)+'</b>');
    st('Mittelpunktswinkel','Mit atan2 bleibt das Ergebnis auch für ein großes Segment (h > r) korrekt.','θ = 2·atan2(c ÷ 2, r − h) = <b>'+f(th3)+' rad</b> = '+f(th3*180/PI)+'°');
    st('Bogen, Sektor und Segment','','Bogen = rθ = <b>'+f(arc3)+'</b>; Sektor = <b>'+f(sec3)+'</b>; Dreieck = '+f(tri3)+'<br>Segment = Sektor − Dreieck = <b>'+f(seg3)+'</b>');
    last='Segment — calculatepilot.com/math/circle-calculator.html\nSehne = '+M.fmt(c3,6)+', Höhe = '+M.fmt(h3,6)+'\nr = '+M.fmt(r3,6)+', θ = '+M.fmt(th3*180/PI,6)+'°, Bogen = '+M.fmt(arc3,6)+', Segmentfläche = '+M.fmt(seg3,6);
    C.text('stepsIntro','Kreisradius und Segmentfläche aus einer Sehne und ihrer Höhe.');C.text('stepsTag','r = c²/8h + h/2');
  }else{
    var R=v('ro'),ri=v('ri');if(!(R>0)||!(ri>=0))return fail('Geben Sie einen Außenradius größer als 0 und einen Innenradius von 0 oder mehr ein.');if(ri>=R)return fail('Der Innenradius muss kleiner als der Außenradius sein.');
    var ar=PI*(R*R-ri*ri),wd=R-ri;
    C.text('fxNow','A = π(R² − r²)');C.text('heroLbl','Ringfläche');C.text('resultValue',fx(ar,dp)+A2());C.text('ex1L','Exakt');C.text('ex1',pi(R*R-ri*ri)+A2());C.text('ex2L','Ringbreite');C.text('ex2',fx(wd,dp)+L());
    tg.textContent='Kreisring';C.text('interp','Der Ring zwischen Kreisen mit dem Radius '+M.fmt(R,6)+L()+' and '+M.fmt(ri,6)+L()+' covers '+M.fmt(ar/(PI*R*R)*100,4)+'% der äußeren Kreisfläche.');
    tiles([['Fläche des äußeren Kreises',fx(PI*R*R,dp)+A2(),'πR²'],['Fläche des inneren Kreises',fx(PI*ri*ri,dp)+A2(),'πr²'],['Äußerer Umfang',fx(2*PI*R,dp)+L(),'2πR'],['Innerer Umfang',fx(2*PI*ri,dp)+L(),'2πr'],['Gesamte Randlänge',fx(2*PI*(R+ri),dp)+L(),'2π(R + r)'],['Anteil an der äußeren Kreisfläche',M.fmt(ar/(PI*R*R)*100,4)+'%','Ring ÷ äußere Kreisfläche']]);
    drawCircle(R,{ring:ri,width:wd});C.text('vizTag','width '+M.fmt(wd,4));C.text('vizNote','Der schattierte Ring zwischen dem äußeren und dem inneren Kreis.');
    st('Fläche der äußeren Kreisscheibe','','πR² = π × '+f(R)+'² = <b>'+f(PI*R*R)+'</b>');
    st('Fläche der inneren Kreisscheibe','Ziehen Sie das Loch ab.','πr² = π × '+f(ri)+'² = <b>'+f(PI*ri*ri)+'</b>');
    st('Subtrahieren','','A = πR² − πr² = π(R² − r²) = <b>'+f(ar)+'</b> (exakt: '+esc(pi(R*R-ri*ri))+')');
    last='Kreisring — calculatepilot.com/math/circle-calculator.html\nR = '+M.fmt(R,6)+', r = '+M.fmt(ri,6)+'\nFläche = '+M.fmt(ar,6)+', Breite = '+M.fmt(wd,6);
    C.text('stepsIntro','Fläche eines Rings aus äußerem und innerem Radius.');C.text('stepsTag','π(R² − r²)');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('pv').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ciCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-r]');if(!b)return;var r=+b.getAttribute('data-r'),m=$('mode').value;
    if(m==='s1'){C.set('prim','r');C.set('pv',r);}else if(m==='s2'){C.set('sr',r);}else{C.set('ro',r);C.set('ri',+(r*0.6).toPrecision(6));}fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
