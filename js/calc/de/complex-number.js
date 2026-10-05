/* Complex number calculator — CalculatePilot (Stitch redesign).
   Arithmetic: standard algebraic rules (i²=−1), division by conjugate. Polar form via atan2. Powers/roots via De Moivre's theorem. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
function fx(x,dp){dp=dp===undefined?4:dp;if(!isFinite(x))return x>0?'∞':'−∞';if(Math.abs(x)<1e-10)x=0;if(Math.abs(x-Math.round(x))<1e-9)return String(Math.round(x));return x.toFixed(dp).replace(/0+$/,'').replace(/[.,]$/,'');}
function cstr(re,im,dp){
  re=Math.abs(re)<1e-10?0:re;im=Math.abs(im)<1e-10?0:im;
  if(im===0)return fx(re,dp);
  var imstr=(Math.abs(im-1)<1e-9?'':Math.abs(im+1)<1e-9?'−':(im<0?'− '+fx(Math.abs(im),dp):fx(im,dp)))+'i';
  if(re===0)return (im<0&&Math.abs(im+1)>=1e-9?'−':'')+imstr.replace('− ','−');
  var sign=im<0?' − ':' + ';
  var absImStr=(Math.abs(im-1)<1e-9||Math.abs(im+1)<1e-9)?'':fx(Math.abs(im),dp);
  return fx(re,dp)+sign+absImStr+'i';
}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function plotArgand(points){ /* points: [{re,im,label,color}] */
  var W=760,H=380,pad=44;
  var xs=points.map(function(p){return p.re;}).concat([0]),ys=points.map(function(p){return p.im;}).concat([0]);
  var lo=Math.min.apply(null,xs)-1,hi=Math.max.apply(null,xs)+1,loy=Math.min.apply(null,ys)-1,hiy=Math.max.apply(null,ys)+1;
  if(hi-lo<2){var mx=(hi+lo)/2;lo=mx-1;hi=mx+1;}
  if(hiy-loy<2){var my=(hiy+loy)/2;loy=my-1;hiy=my+1;}
  var kx=(W-2*pad)/(hi-lo),ky=(H-2*pad)/(hiy-loy);
  var X=function(x){return pad+(x-lo)*kx;},Y=function(y){return H-pad-(y-loy)*ky;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  if(0>=loy&&0<=hiy)s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  if(0>=lo&&0<=hi)s+='<line x1="'+X(0).toFixed(1)+'" x2="'+X(0).toFixed(1)+'" y1="'+pad+'" y2="'+(H-pad)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  points.forEach(function(p){
    s+='<line x1="'+X(0).toFixed(1)+'" y1="'+Y(0).toFixed(1)+'" x2="'+X(p.re).toFixed(1)+'" y2="'+Y(p.im).toFixed(1)+'" stroke="'+p.color+'" stroke-width="2" stroke-dasharray="4 3" opacity="0.7"/>';
    s+='<circle cx="'+X(p.re).toFixed(1)+'" cy="'+Y(p.im).toFixed(1)+'" r="5.5" fill="'+p.color+'"/><text class="ax" x="'+(X(p.re)+8).toFixed(1)+'" y="'+(Y(p.im)-8).toFixed(1)+'" style="font-weight:700;fill:'+p.color+'">'+esc(p.label)+'</text>';
  });
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  $('fOp').hidden=(m!=='s1');$('fZ2').hidden=(m!=='s1');$('fN').hidden=(m!=='s3');
  var labels={s1:'Komplexe Arithmetik',s2:'Analyse einer einzelnen komplexen Zahl',s3:'Potenzen &amp; Wurzeln nach De Moivre'};
  C.html('formH',labels[m]);
  var a=parseFloat($('a').value),b=parseFloat($('b').value);
  if(!isFinite(a)||!isFinite(b))return fail('Geben Sie beide Teile von z₁ ein.');
  var modA=Math.sqrt(a*a+b*b),argA=Math.atan2(b,a);

  if(m==='s2'){
    C.html('fxNow','z = '+cstr(a,b));
    C.text('heroLbl','z (gegeben)');C.text('resultValue',cstr(a,b));tg.textContent='Argand: ('+fx(a)+', '+fx(b)+')';
    C.text('ex1L','Betrag |z|');C.text('ex1',fx(modA,6));
    C.text('ex2L','Argument (Bogenmaß / Grad)');C.text('ex2',fx(argA,6)+' rad = '+fx(argA*180/Math.PI,4)+'°');
    C.text('interp','Der Betrag ist der Abstand vom Ursprung; das Argument ist der Winkel zur positiven reellen Achse.');
    tiles([['Konjugierte z̄',cstr(a,-b),''],['Polarform','r(cosθ + i·sinθ) = '+fx(modA,4)+'(cos '+fx(argA*180/Math.PI,2)+'° + i·sin '+fx(argA*180/Math.PI,2)+'°)',''],['Kehrwert 1/z',modA>0?cstr(a/(modA*modA),-b/(modA*modA),6):'nicht definiert (z = 0)',''],['|z|² = z·z̄',fx(modA*modA,6),'immer reell']]);
    plotArgand([{re:a,im:b,label:'z',color:'var(--sx-primary)'},{re:a,im:-b,label:'z̄',color:'#d97706'}]);
    C.text('vizTag','|z| = '+fx(modA,4));
    var n1=0,h1='';function st1(t,d,e){n1++;h1+='<li><span class="n">'+n1+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
    st1('Betrag berechnen','|z| = √(a² + b²), der Abstand vom Ursprung.','√('+fx(a)+'² + '+fx(b)+'²) = √'+fx(a*a+b*b,4)+' = <b>'+fx(modA,6)+'</b>');
    st1('Argument berechnen','θ = atan2(b, a), der Winkel zur positiven reellen Achse, in (−π, π].','atan2('+fx(b)+', '+fx(a)+') = <b>'+fx(argA,6)+' rad</b> = '+fx(argA*180/Math.PI,4)+'°');
    st1('Polarform aufstellen','z = r(cosθ + i·sinθ).','z = '+fx(modA,4)+'(cos '+fx(argA*180/Math.PI,2)+'° + i·sin '+fx(argA*180/Math.PI,2)+'°)');
    $('steps').innerHTML=h1;C.text('stepsIntro','Analyse von z = '+cstr(a,b)+'.');C.text('stepsTag','|z| = '+fx(modA,4));
    last='Komplexe Zahl — calculatepilot.com/math/complex-number-calculator.html\nz = '+a+(b>=0?'+':'')+b+'i\n|z| = '+modA+'\narg(z) = '+argA+' rad';
    return;
  }

  if(m==='s3'){
    var nn=parseInt($('nn').value,10),pm=$('powMode').value;
    if(!isFinite(nn)||nn<1||nn>12)return fail('n muss eine ganze Zahl von 1 bis 12 sein.');
    if(pm==='pow'){
      var rN=Math.pow(modA,nn),thN=argA*nn;
      /* normalize thN to (-pi,pi] for display, but keep exact value for computation */
      var reN=rN*Math.cos(thN),imN=rN*Math.sin(thN);
      C.html('fxNow','z<sup>'+nn+'</sup>, z = '+cstr(a,b));
      C.text('heroLbl','zⁿ');C.text('resultValue',cstr(reN,imN,6));tg.textContent='n = '+nn;
      C.text('ex1L','Betrag rⁿ');C.text('ex1',fx(rN,6));
      C.text('ex2L','Winkel nθ');C.text('ex2',fx(thN,6)+' rad = '+fx(thN*180/Math.PI,4)+'°');
      C.text('interp','Satz von De Moivre: Potenzieren Sie den Betrag mit n und multiplizieren Sie den Winkel mit n.');
      tiles([['r = |z|',fx(modA,6),''],['θ = arg(z)',fx(argA,6)+' rad',''],['rⁿ',fx(rN,6),''],['nθ',fx(thN,6)+' rad','']]);
      plotArgand([{re:a,im:b,label:'z',color:'var(--sx-primary)'},{re:reN,im:imN,label:'zⁿ',color:'#059669'}]);
      C.text('vizTag','zⁿ, n = '+nn);
      var n2=0,h2='';function st2(t,d,e){n2++;h2+='<li><span class="n">'+n2+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
      st2('z in Polarform umwandeln','r(cosθ + i·sinθ).','r = '+fx(modA,6)+', θ = '+fx(argA,6)+' rad');
      st2('Satz von De Moivre anwenden','[r(cosθ+i·sinθ)]ⁿ = rⁿ(cos nθ + i·sin nθ).','rⁿ = '+fx(modA,4)+'<sup>'+nn+'</sup> = '+fx(rN,6)+',  nθ = '+nn+'×'+fx(argA,4)+' = '+fx(thN,6));
      st2('Zurück in die Form a+bi umwandeln',null,'<b>'+cstr(reN,imN,6)+'</b>');
      $('steps').innerHTML=h2;C.text('stepsIntro','('+cstr(a,b)+')^'+nn+'.');C.text('stepsTag','De Moivre');
      last='Komplexe Potenz — calculatepilot.com/math/complex-number-calculator.html\n('+cstr(a,b)+')^'+nn+' = '+cstr(reN,imN,6);
    }else{
      var rootR=Math.pow(modA,1/nn),roots=[];
      for(var k=0;k<nn;k++){var th=(argA+2*Math.PI*k)/nn;roots.push({re:rootR*Math.cos(th),im:rootR*Math.sin(th),th:th});}
      C.html('fxNow','ⁿ√z, n='+nn+', z = '+cstr(a,b));
      C.text('heroLbl','Alle '+nn+' roots');C.html('resultValue',roots.map(function(r){return cstr(r.re,r.im,4);}).join(',  '));tg.textContent=nn+' roots';
      C.text('ex1L','Gemeinsamer Betrag');C.text('ex1',fx(rootR,6));
      C.text('ex2L','Winkelabstand');C.text('ex2',fx(360/nn,4)+'° auseinander');
      C.text('interp','Alle Wurzeln haben denselben Betrag |z|^(1/n); ihre Winkel sind gleichmäßig um 360°/'+nn+' um den Ursprung verteilt.');
      tiles(roots.map(function(r,i){return ['Wurzel k='+i,cstr(r.re,r.im,4),'angle '+fx(r.th*180/Math.PI,2)+'°'];}));
      plotArgand([{re:a,im:b,label:'z',color:'var(--sx-primary)'}].concat(roots.map(function(r,i){return {re:r.re,im:r.im,label:'k='+i,color:'#059669'};})));
      C.text('vizTag',nn+' Wurzeln eingezeichnet');
      var n3=0,h3='';function st3(t,d,e){n3++;h3+='<li><span class="n">'+n3+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
      st3('z in Polarform umwandeln',null,'r = '+fx(modA,6)+', θ = '+fx(argA,6)+' rad');
      st3('n-te Wurzel des Betrags ziehen','Alle Wurzeln haben denselben Betrag.','|z|^(1/'+nn+') = <b>'+fx(rootR,6)+'</b>');
      st3('Addieren Sie 2πk für k = 0, …, n−1, bevor Sie durch n teilen','Jedes k liefert einen anderen, gleichmäßig verteilten Winkel.','θₖ = (θ + 2πk) / '+nn);
      st3('Alle '+nn+' roots',null,roots.map(function(r,i){return 'k='+i+': '+cstr(r.re,r.im,4);}).join('<br>'));
      $('steps').innerHTML=h3;C.text('stepsIntro',nn+'-ten Wurzeln von '+cstr(a,b)+'.');C.text('stepsTag',nn+' roots');
      last='Komplexe Wurzeln — calculatepilot.com/math/complex-number-calculator.html\n'+nn+'-ten Wurzeln von '+cstr(a,b)+': '+roots.map(function(r){return cstr(r.re,r.im,4);}).join(', ');
    }
    return;
  }

  /* s1: arithmetic */
  var c=parseFloat($('c').value),d=parseFloat($('d').value);
  if(!isFinite(c)||!isFinite(d))return fail('Geben Sie beide Teile von z₂ ein.');
  var op=$('op').value,opSym={add:'+',sub:'−',mul:'×',div:'÷'}[op],re,im;
  if(op==='add'){re=a+c;im=b+d;}
  else if(op==='sub'){re=a-c;im=b-d;}
  else if(op==='mul'){re=a*c-b*d;im=a*d+b*c;}
  else{var denom=c*c+d*d;if(denom===0)return fail('Division durch z₂ = 0 ist nicht möglich.');re=(a*c+b*d)/denom;im=(b*c-a*d)/denom;}
  C.html('fxNow','('+cstr(a,b)+') '+opSym+' ('+cstr(c,d)+')');
  C.text('heroLbl','Ergebnis z₁ '+opSym+' z₂');C.text('resultValue',cstr(re,im,6));tg.textContent=op;
  var modR=Math.sqrt(re*re+im*im);
  C.text('ex1L','Betrag des Ergebnisses');C.text('ex1',fx(modR,6));
  C.text('ex2L','Argument des Ergebnisses');C.text('ex2',fx(Math.atan2(im,re)*180/Math.PI,4)+'°');
  C.text('interp',op==='mul'?'Beträge werden multipliziert und Argumente addiert: |z₁z₂| = |z₁||z₂|, arg = arg(z₁)+arg(z₂).':op==='div'?'Beträge werden dividiert und Argumente subtrahiert.':'Real- und Imaginärteil werden unabhängig voneinander verknüpft.');
  var modC=Math.sqrt(c*c+d*d);
  tiles([['z₁',cstr(a,b),'|z₁|='+fx(modA,4)],['z₂',cstr(c,d),'|z₂|='+fx(modC,4)],['Ergebnis',cstr(re,im,6),''],['Kontrolle über die Beträge',op==='mul'?fx(modA*modC,6)+' (sollte mit |Ergebnis| übereinstimmen)':op==='div'?fx(modA/modC,6)+' (sollte mit |Ergebnis| übereinstimmen)':'—','']]);
  plotArgand([{re:a,im:b,label:'z₁',color:'var(--sx-primary)'},{re:c,im:d,label:'z₂',color:'#d97706'},{re:re,im:im,label:'result',color:'#059669'}]);
  C.text('vizTag',opSym);
  var n4=0,h4='';function st4(t,d0,e){n4++;h4+='<li><span class="n">'+n4+'</span><h4>'+t+'</h4>'+(d0?'<p>'+d0+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  if(op==='add'||op==='sub')st4('Real- und Imaginärteil getrennt verknüpfen','(a+bi) '+opSym+' (c+di) = (a '+opSym+' c) + (b '+opSym+' d)i.','('+fx(a)+opSym+fx(c)+') + ('+fx(b)+opSym+fx(d)+')i = <b>'+cstr(re,im,6)+'</b>');
  else if(op==='mul')st4('Mit i² = −1 ausmultiplizieren','(a+bi)(c+di) = (ac−bd) + (ad+bc)i.','('+fx(a*c)+'−('+fx(b*d)+')) + ('+fx(a*d)+'+'+fx(b*c)+')i = <b>'+cstr(re,im,6)+'</b>');
  else{st4('Mit der Konjugierten von z₂ multiplizieren','z₁/z₂ = z₁z̄₂ / |z₂|².','|z₂|² = '+fx(c*c+d*d,6));st4('Kürzen',null,'<b>'+cstr(re,im,6)+'</b>');}
  $('steps').innerHTML=h4;C.text('stepsIntro','('+cstr(a,b)+') '+opSym+' ('+cstr(c,d)+').');C.text('stepsTag',op);
  last='Komplexe Arithmetik — calculatepilot.com/math/complex-number-calculator.html\n('+cstr(a,b)+') '+opSym+' ('+cstr(c,d)+') = '+cstr(re,im,6);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'cxCalc',compute:compute});
  $('presets').addEventListener('click',function(e){
    var b=e.target.closest('button[data-m]');if(!b)return;
    C.set('mode',b.getAttribute('data-m'));
    C.set('a',b.getAttribute('data-a'));C.set('b',b.getAttribute('data-b'));
    if(b.hasAttribute('data-c')){C.set('c',b.getAttribute('data-c'));C.set('d',b.getAttribute('data-d'));}
    if(b.hasAttribute('data-n'))C.set('nn',b.getAttribute('data-n'));
    if(b.hasAttribute('data-root'))C.set('powMode','root');else C.set('powMode','pow');
    fire('a');
  });
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
