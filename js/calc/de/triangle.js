/* Triangle calculator — CalculatePilot (Stitch redesign).
   Sides a,b,c lie opposite angles A,B,C. SSS/SAS: Law of Cosines · ASA/AAS: C = π − A − B, Law of Sines · SSA: sin B = b·sin A / a
   (zero, one or two triangles). Area K = ½ab·sin C, cross-checked with Heron; r = K/s, R = abc/4K, hₐ = 2K/a. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='',prevAu='deg';
var PI=Math.PI,K={deg:180/PI,rad:1,grad:200/PI},SYM={deg:'°',rad:' rad',grad:' gon'};
var SHOW={sss:['fa','fb','fc'],sas:['fa','fb','fC'],asa:['fc','fA','fB'],aas:['fa','fA','fB'],ssa:['fa','fb','fA']};
var HELP={sss:'Drei Seiten bekannt. Jede Seite muss kürzer sein als die Summe der beiden anderen.',sas:'Zwei Seiten und der eingeschlossene Winkel (C liegt zwischen den Seiten a und b).',asa:'Zwei Winkel und die dazwischenliegende Seite (Seite c liegt zwischen den Winkeln A und B).',aas:'Zwei Winkel und eine Seite, die nicht dazwischen liegt (Seite a liegt dem Winkel A gegenüber).',ssa:'Zwei Seiten und ein Winkel, der nicht dazwischen liegt (Winkel A liegt der Seite a gegenüber). Es kann 0, 1 oder 2 Lösungen geben.'};
var METH={sss:'Kosinussatz für jeden Winkel',sas:'Kosinussatz für c, dann Kosinus-/Sinussatz für die Winkel',asa:'C = 180° − A − B, dann der Sinussatz',aas:'C = 180° − A − B, dann der Sinussatz',ssa:'Sinussatz: sin B = b·sin A ÷ a (auf zwei Lösungen prüfen)'};

function esc(s){return C.esc(s);}
function unit(){return $('au').value;}
function toRad(x){return x/K[unit()];}
function fromRad(r){return r*K[unit()];}
function fa(r,dp){var u=unit();return M.fmt(fromRad(r),dp)+SYM[u];}
function deg(r,dp){return M.fmt(r*180/PI,dp)+'°';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','area','per','sp','inr','cir','alt'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');C.text('clsTag','—');$('tri').innerHTML='';$('steps').innerHTML='';$('elTbl').tBodies[0].innerHTML='';$('fSol').hidden=true;last='';return null;}

function solve(mode,dp){
  var a=v('ia'),b=v('ib'),c=v('ic'),A=toRad(v('iA')),B=toRad(v('iB')),Cc=toRad(v('iC')),EPS=1e-12,t={},info={sols:1};
  function need(){for(var i=0;i<arguments.length;i++)if(!(arguments[i]>0))return false;return true;}
  if(mode==='sss'){
    if(!need(a,b,c))return fail('Alle drei Seiten müssen größer als 0 sein.');
    if(a+b<=c*(1+EPS)||a+c<=b*(1+EPS)||b+c<=a*(1+EPS))return fail('Aus diesen Seiten lässt sich kein Dreieck bilden: Jede Seite muss kürzer sein als die Summe der beiden anderen ('+M.fmt(a,6)+', '+M.fmt(b,6)+', '+M.fmt(c,6)+').');
    t={a:a,b:b,c:c,A:Math.acos(Math.max(-1,Math.min(1,(b*b+c*c-a*a)/(2*b*c)))),B:Math.acos(Math.max(-1,Math.min(1,(a*a+c*c-b*b)/(2*a*c))))};t.C=PI-t.A-t.B;
  }else if(mode==='sas'){
    if(!need(a,b,Cc))return fail('Die Seiten a, b und der Winkel C müssen größer als 0 sein.');
    if(Cc>=PI)return fail('Der eingeschlossene Winkel C muss kleiner als 180° sein.');
    var cc=Math.sqrt(a*a+b*b-2*a*b*Math.cos(Cc)),Ac=Math.acos(Math.max(-1,Math.min(1,(b*b+cc*cc-a*a)/(2*b*cc))));t={a:a,b:b,c:cc,A:Ac,C:Cc,B:PI-Ac-Cc};
  }else if(mode==='asa'||mode==='aas'){
    if(!need(A,B,mode==='asa'?c:a))return fail('Beide Winkel und die Seite müssen größer als 0 sein.');
    if(A+B>=PI-EPS)return fail('Die Winkel A und B ergeben zusammen '+deg(A+B,4)+', sodass für Winkel C nichts übrig bleibt. Ihre Summe muss kleiner als 180° sein.');
    var Cx=PI-A-B,sA=Math.sin(A),sB=Math.sin(B),sC=Math.sin(Cx);
    if(mode==='asa'){t={A:A,B:B,C:Cx,c:c,a:c*sA/sC,b:c*sB/sC};}else{t={A:A,B:B,C:Cx,a:a,b:a*sB/sA,c:a*sC/sA};}
  }else{
    if(!need(a,b,A))return fail('Die Seiten a, b und der Winkel A müssen größer als 0 sein.');
    if(A>=PI)return fail('Winkel A muss kleiner als 180° sein.');
    var h=b*Math.sin(A),sB2=b*Math.sin(A)/a;info.h=h;
    if(sB2>1+1e-12)return fail('Es existiert kein Dreieck: Seite a ('+M.fmt(a,6)+') ist kürzer als die Höhe h = b·sin A = '+M.fmt(h,6)+', sie erreicht die Grundlinie daher nicht.');
    var cands=[];
    if(Math.abs(sB2-1)<=1e-12)cands=[PI/2];else{var B1=Math.asin(sB2);cands=[B1,PI-B1];}
    var sols=[];cands.forEach(function(Bx){if(A+Bx<PI-1e-12){var Cy=PI-A-Bx;sols.push({a:a,b:b,A:A,B:Bx,C:Cy,c:a*Math.sin(Cy)/Math.sin(A)});}});
    if(!sols.length)return fail('Für diese Werte gibt es kein gültiges Dreieck.');
    info.sols=sols.length;info.all=sols;var idx=sols.length>1&&$('sol').value==='s2'?1:0;t=sols[idx];info.sinB=sB2;
  }
  t.info=info;return t;
}

function svg(t){
  var W=760,H=300,pad=34,Ax=0,Ay=0,Bx=t.c,By=0,Cx=t.b*Math.cos(t.A),Cy=t.b*Math.sin(t.A);
  var xs=[Ax,Bx,Cx],ys=[Ay,By,Cy],K2=0.5*t.a*t.b*Math.sin(t.C),s=(t.a+t.b+t.c)/2,r=K2/s,R=t.a*t.b*t.c/(4*K2);
  var Ix=(t.a*Ax+t.b*Bx+t.c*Cx)/(t.a+t.b+t.c),Iy=(t.a*Ay+t.b*By+t.c*Cy)/(t.a+t.b+t.c);
  var D=2*(Ax*(By-Cy)+Bx*(Cy-Ay)+Cx*(Ay-By)),Ox=((Ax*Ax+Ay*Ay)*(By-Cy)+(Bx*Bx+By*By)*(Cy-Ay)+(Cx*Cx+Cy*Cy)*(Ay-By))/D,Oy=((Ax*Ax+Ay*Ay)*(Cx-Bx)+(Bx*Bx+By*By)*(Ax-Cx)+(Cx*Cx+Cy*Cy)*(Bx-Ax))/D;
  var circ=$('cCir').checked&&isFinite(Ox);
  var minx=Math.min.apply(null,xs),maxx=Math.max.apply(null,xs),miny=Math.min.apply(null,ys),maxy=Math.max.apply(null,ys);
  if(circ){minx=Math.min(minx,Ox-R);maxx=Math.max(maxx,Ox+R);miny=Math.min(miny,Oy-R);maxy=Math.max(maxy,Oy+R);}
  var sc=Math.min((W-2*pad)/(maxx-minx||1),(H-2*pad)/(maxy-miny||1)),ox=(W-(maxx-minx)*sc)/2-minx*sc,oy=(H-(maxy-miny)*sc)/2+maxy*sc;
  var X=function(x){return ox+x*sc;},Y=function(y){return oy-y*sc;};
  var o='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  if(circ)o+='<circle cx="'+X(Ox).toFixed(1)+'" cy="'+Y(Oy).toFixed(1)+'" r="'+(R*sc).toFixed(1)+'" fill="none" stroke="#7c3aed" stroke-dasharray="5 4" stroke-width="1.5"/>';
  o+='<polygon points="'+[Ax,Bx,Cx].map(function(x,i){return X(x).toFixed(1)+','+Y(ys[i]).toFixed(1);}).join(' ')+'" fill="var(--sx-pc)" fill-opacity=".14" stroke="var(--sx-primary)" stroke-width="2.5" stroke-linejoin="round"/>';
  if($('cIn').checked)o+='<circle cx="'+X(Ix).toFixed(1)+'" cy="'+Y(Iy).toFixed(1)+'" r="'+(r*sc).toFixed(1)+'" fill="none" stroke="#d97706" stroke-width="1.5"/>';
  if($('cAlt').checked)o+='<line x1="'+X(Cx).toFixed(1)+'" y1="'+Y(Cy).toFixed(1)+'" x2="'+X(Cx).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="#2563eb" stroke-dasharray="4 3" stroke-width="1.5"/>';
  function lab(x,y,txt,bold){return '<text class="ax" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle" style="'+(bold?'font-weight:700;font-size:13px;fill:var(--sx-on)':'font-size:11px')+'">'+esc(txt)+'</text>';}
  var cx=(Ax+Bx+Cx)/3,cy=(Ay+By+Cy)/3;
  function side(x1,y1,x2,y2,txt){var mx=(x1+x2)/2,my=(y1+y2)/2,dx=mx-cx,dy=my-cy,l=Math.hypot(dx,dy)||1;return lab(X(mx)+dx/l*16,Y(my)-dy/l*16+4,txt,false);}
  o+=side(Bx,By,Cx,Cy,'a = '+M.fmt(t.a,3))+side(Cx,Cy,Ax,Ay,'b = '+M.fmt(t.b,3))+side(Ax,Ay,Bx,By,'c = '+M.fmt(t.c,3));
  [[Ax,Ay,'A',t.A],[Bx,By,'B',t.B],[Cx,Cy,'C',t.C]].forEach(function(p){var dx=p[0]-cx,dy=p[1]-cy,l=Math.hypot(dx,dy)||1;o+=lab(X(p[0])+dx/l*16,Y(p[1])-dy/l*16+4,p[2],true);
    o+='<text class="ax" x="'+(X(p[0])-dx/l*30).toFixed(1)+'" y="'+(Y(p[1])+dy/l*30+4).toFixed(1)+'" text-anchor="middle" style="font-size:10px;fill:var(--sx-primary);font-weight:600">'+esc(fa(p[3],2))+'</text>';});
  $('tri').innerHTML=o+'</svg>';
}

function compute(){
  var mode=$('mode').value,dp=+$('dp').value,u=unit();
  /* convert angle inputs when the unit changes */
  if(u!==prevAu){['iA','iB','iC'].forEach(function(id){var x=parseFloat($(id).value);if(isFinite(x))$(id).value=+(x/K[prevAu]*K[u]).toPrecision(10);});prevAu=u;}
  ['fa','fb','fc','fA','fB','fC'].forEach(function(id){$(id).hidden=SHOW[mode].indexOf(id)<0;});C.text('caseHelp',HELP[mode]);C.text('fxNow',METH[mode]);
  C.text('hcH',mode==='asa'?'zwischen den Winkeln A und B':'gegenüber Winkel C');C.text('haH',mode==='aas'?'gegenüber von A (nicht zwischen A und B)':'gegenüber Winkel A');C.text('hAH',mode==='ssa'?'gegenüber Seite a':'gegenüber Seite a');C.text('hCH','eingeschlossen zwischen a und b');
  $('err').hidden=true;$('fSol').hidden=true;
  var t=solve(mode,dp);if(!t)return;
  var info=t.info;if(info.sols>1)$('fSol').hidden=false;
  var eps=1e-9,K2=0.5*t.a*t.b*Math.sin(t.C),s=(t.a+t.b+t.c)/2,her=Math.sqrt(Math.max(0,s*(s-t.a)*(s-t.b)*(s-t.c))),P=t.a+t.b+t.c;
  var mx=Math.max(t.A,t.B,t.C),byS=(Math.abs(t.a-t.b)<eps*t.a&&Math.abs(t.b-t.c)<eps*t.a)?'Gleichseitig':(Math.abs(t.a-t.b)<eps*t.a||Math.abs(t.b-t.c)<eps*t.a||Math.abs(t.a-t.c)<eps*t.a)?'Gleichschenklig':'Ungleichseitig',byA=Math.abs(mx-PI/2)<1e-7?'Rechtwinklig':mx>PI/2?'Stumpfwinklig':'Spitzwinklig';
  var hero={sss:['Größter Winkel',fa(mx,dp)],sas:['Unbekannte Seite c',M.fmt(t.c,dp)],asa:['Unbekannte Seite a',M.fmt(t.a,dp)],aas:['Unbekannte Seite b',M.fmt(t.b,dp)],ssa:['Unbekannte Seite c',M.fmt(t.c,dp)]}[mode];
  C.text('heroLbl',hero[0]);C.text('resultValue',hero[1]);C.text('interp','Seiten a = '+M.fmt(t.a,dp)+', b = '+M.fmt(t.b,dp)+', c = '+M.fmt(t.c,dp)+'; Winkel A = '+deg(t.A,dp)+', B = '+deg(t.B,dp)+', C = '+deg(t.C,dp)+'.');
  var tg=$('tag');tg.textContent=byS+' · '+byA;tg.className='sx-ef-grade';C.text('clsTag',byS+' · '+byA+(info.sols>1?' · Lösung '+($('sol').value==='s2'?2:1)+' von 2':''));
  C.text('area',M.fmt(K2,dp));C.text('per',M.fmt(P,dp));C.text('sp',M.fmt(s,dp));C.text('inr',M.fmt(K2/s,dp));C.text('cir',M.fmt(t.a*t.b*t.c/(4*K2),dp));C.text('alt',M.fmt(2*K2/t.a,3)+' · '+M.fmt(2*K2/t.b,3)+' · '+M.fmt(2*K2/t.c,3));
  $('elTbl').tBodies[0].innerHTML=[['a','A'],['b','B'],['c','C']].map(function(p){return '<tr><td class="mono">'+p[0]+' / '+p[1]+'</td><td class="mono">'+M.fmt(t[p[0]],dp)+'</td><td class="mono">'+esc(fa(t[p[1]],dp))+(u!=='deg'?'<br><span style="font-size:11px;color:var(--sx-muted)">'+deg(t[p[1]],dp)+'</span>':'')+'</td></tr>';}).join('');
  svg(t);
  /* steps */
  var h='',n=0,f=function(x){return esc(M.fmt(x,dp));};
  function st(a,b,c2){n++;h+='<li><span class="n">'+n+'</span><h4>'+a+'</h4>'+(b?'<p>'+b+'</p>':'')+'<span class="eq">'+c2+'</span></li>';}
  var A2=deg(t.A,dp),B2=deg(t.B,dp),C2=deg(t.C,dp);
  if(mode==='sss'){
    st('Dreiecksungleichung prüfen','Jede Seite muss kürzer sein als die Summe der beiden anderen.',f(t.a)+' + '+f(t.b)+' > '+f(t.c)+',  '+f(t.a)+' + '+f(t.c)+' > '+f(t.b)+',  '+f(t.b)+' + '+f(t.c)+' > '+f(t.a)+'  ✓');
    st('Winkel A (Kosinussatz)','cos A = (b² + c² − a²) ÷ 2bc','cos A = ('+f(t.b*t.b)+' + '+f(t.c*t.c)+' − '+f(t.a*t.a)+') ÷ '+f(2*t.b*t.c)+' = '+f(Math.cos(t.A))+' → A = <b>'+A2+'</b>');
    st('Winkel B (Kosinussatz)','cos B = (a² + c² − b²) ÷ 2ac','cos B = '+f(Math.cos(t.B))+' → B = <b>'+B2+'</b>');
    st('Winkel C (Winkelsumme)','Die Winkel eines Dreiecks ergeben zusammen 180°.','C = 180° − '+A2+' − '+B2+' = <b>'+C2+'</b>');
  }else if(mode==='sas'){
    st('Seite c (Kosinussatz)','c² = a² + b² − 2ab·cos C','c² = '+f(t.a*t.a)+' + '+f(t.b*t.b)+' − 2·'+f(t.a)+'·'+f(t.b)+'·cos('+deg(t.C,dp)+') = '+f(t.c*t.c)+' → c = <b>'+f(t.c)+'</b>');
    st('Winkel A (Kosinussatz)','cos A = (b² + c² − a²) ÷ 2bc','cos A = '+f(Math.cos(t.A))+' → A = <b>'+A2+'</b>');
    st('Winkel B (Winkelsumme)','','B = 180° − A − C = 180° − '+A2+' − '+C2+' = <b>'+B2+'</b>');
  }else if(mode==='asa'||mode==='aas'){
    st('Dritter Winkel (Winkelsumme)','Die Winkel ergeben zusammen 180°.','C = 180° − A − B = 180° − '+A2+' − '+B2+' = <b>'+C2+'</b>');
    st('Sinussatz','a ÷ sin A = b ÷ sin B = c ÷ sin C','Verhältnis = '+(mode==='asa'?f(t.c)+' ÷ sin('+C2+')':f(t.a)+' ÷ sin('+A2+')')+' = <b>'+f(t.a/Math.sin(t.A))+'</b>');
    st('Übrige Seiten','Multiplizieren Sie das Verhältnis mit dem Sinus des gegenüberliegenden Winkels.','a = '+f(t.a)+',  b = '+f(t.b)+',  c = '+f(t.c));
  }else{
    st('Höhentest','h = b·sin A entscheidet, wie viele Dreiecke existieren.','Std. = '+f(t.b)+' × sin('+A2+') = <b>'+f(info.h)+'</b>; a = '+f(t.a)+(t.a<info.h?' < h':Math.abs(t.a-info.h)<1e-9?' = h':t.a<t.b?' → h < a < b':' ≥ b')+' → <b>'+info.sols+' solution'+(info.sols===1?'':'s')+'</b>');
    st('Winkel B (Sinussatz)','sin B = b·sin A ÷ a','sin B = '+f(info.sinB)+' → B₁ = '+deg(Math.asin(Math.min(1,info.sinB)),dp)+(info.sols>1?',  B₂ = 180° − B₁ = '+deg(PI-Math.asin(info.sinB),dp):''));
    st('Winkel C und Seite c','Mit der '+(info.sols>1?'ausgewählten Lösung ('+($('sol').value==='s2'?'2':'1')+')':'solution'),'C = 180° − A − B = '+C2+'; c = a·sin C ÷ sin A = <b>'+f(t.c)+'</b>');
  }
  st('Fläche und Kontrolle nach Heron','K = ½·a·b·sin C, überprüft mit der Heron-Formel √[s(s−a)(s−b)(s−c)].','s = '+f(s)+'<br>K = ½·'+f(t.a)+'·'+f(t.b)+'·sin('+C2+') = <b>'+f(K2)+'</b><br>Heron = <b>'+f(her)+'</b> (Differenz '+Math.abs(K2-her).toExponential(1)+')');
  $('steps').innerHTML=h;C.text('stepsIntro','Lösen eines '+mode.toUpperCase()+' Dreiecks.');C.text('stepsTag',mode.toUpperCase());
  last='Dreieck ('+mode.toUpperCase()+') — calculatepilot.com/math/triangle-calculator.html\na = '+M.fmt(t.a,6)+', b = '+M.fmt(t.b,6)+', c = '+M.fmt(t.c,6)+'\nA = '+deg(t.A,6)+', B = '+deg(t.B,6)+', C = '+deg(t.C,6)+'\nFläche = '+M.fmt(K2,6)+', Umfang = '+M.fmt(P,6)+'\nInkreisradius = '+M.fmt(K2/s,6)+', Umkreisradius = '+M.fmt(t.a*t.b*t.c/(4*K2),6);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'trCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-m]');if(!b)return;C.set('mode',b.getAttribute('data-m'));b.getAttribute('data-v').split(',').forEach(function(kv){var p=kv.split('='),id=p[0],val=+p[1];if(id.charAt(1)===id.charAt(1).toUpperCase()&&id.charAt(1)!==id.charAt(1).toLowerCase())val=+(val*K[unit()]/K.deg).toPrecision(10);C.set(id,val);});$('sol').value='s1';$('ia').dispatchEvent(new Event('input',{bubbles:true}));});
  ['cAlt','cIn','cCir'].forEach(function(id){$(id).addEventListener('change',function(){});});
  document.querySelector('#trCalc [data-action=reset]').addEventListener('click',function(){prevAu='deg';});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
