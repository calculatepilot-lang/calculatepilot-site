/* Exponent calculator — CalculatePilot (Stitch redesign).
   bˣ: exact BigInt for integer b and integer x; rational exponents p/q (q ≤ 1000) give exact integer roots when they exist;
   negative bases: real if q is odd, else principal complex value |b|ˣ(cos πx + i sin πx). Roots: b^(1/n) with radical simplification k·ⁿ√m.
   Scientific/engineering notation from toExponential. Growth N(t)=N₀e^(kt): doubling/half-time = ln2/|k|. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='',rawRes='';

function esc(s){return C.esc(s);}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function ratio(x){/* p/q with q ≤ 1000 */if(x===Math.round(x))return [x,1];var s=x<0?-1:1,y=Math.abs(x),h1=1,h0=0,k1=0,k0=1,i,a;for(i=0;i<25;i++){a=Math.floor(y);var h2=a*h1+h0,k2=a*k1+k0;h0=h1;h1=h2;k0=k1;k1=k2;if(k1>1000)return null;if(Math.abs(h1/k1-Math.abs(x))<1e-12*Math.max(1,Math.abs(x)))return [s*h1,k1];if(y-a<1e-14)break;y=1/(y-a);}return null;}
function sup(n){return String(n).replace(/[-0-9]/g,function(c){return {'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'}[c];});}
function sci(x){if(x===0)return '0';if(!isFinite(x))return String(x);var e=x.toExponential(9).split('e');var m=e[0].replace(/[.,]?0+$/,''),p=+e[1];return m+' × 10'+sup(p);}
function eng(x){if(x===0||!isFinite(x))return String(x);var p=Math.floor(Math.log10(Math.abs(x))/3)*3,m=x/Math.pow(10,p);return M.fmt(m,9)+' × 10'+sup(p);}
function fmtNum(x){if(!isFinite(x))return x>0?'∞':x<0?'−∞':'undefined';var a=Math.abs(x);if(a!==0&&(a>=1e15||a<1e-6))return sci(x);return M.fmt(x,12);}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';rawRes='';}
function factor(n){var m=new Map(),p=2;while(p*p<=n&&p<=1e6){while(n%p===0){m.set(p,(m.get(p)||0)+1);n/=p;}p+=p===2?1:2;}if(n>1)m.set(n,(m.get(n)||0)+1);return m;}

function curve(fn,t0,t1,mark,lab,logY){
  var W=760,H=300,pl=54,pr=20,pt=16,pb=34,N=200,pts=[],i,ys=[];
  for(i=0;i<=N;i++){var t=t0+(t1-t0)*i/N,y=fn(t);if(isFinite(y)){pts.push([t,y]);ys.push(y);}}
  var ymax=Math.max.apply(null,ys.concat([mark[1]*1.5])),ymin=Math.min(0,Math.min.apply(null,ys));if(Math.max.apply(null,ys)>mark[1]*40)ymax=mark[1]*1.8;if(ymax<=ymin)ymax=ymin+1;
  var X=function(t){return pl+(t-t0)/(t1-t0)*(W-pl-pr);},Y=function(y){return pt+(1-(y-ymin)/(ymax-ymin))*(H-pt-pb);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">',k;
  for(k=0;k<=4;k++){var yy=ymin+(ymax-ymin)*k/4;s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(yy).toFixed(1)+'" y2="'+Y(yy).toFixed(1)+'" stroke="var(--sx-border)"/><text class="ax" x="'+(pl-6)+'" y="'+(Y(yy)+3).toFixed(1)+'" text-anchor="end">'+esc(M.fmt(yy,3))+'</text>';}
  var tk=Math.max(1,Math.ceil((t1-t0)/8));for(k=Math.ceil(t0);k<=t1;k+=tk)s+='<text class="ax" x="'+X(k).toFixed(1)+'" y="'+(H-pb+16)+'" text-anchor="middle">t = '+k+'</text>';
  if(t0<0&&t1>0)s+='<line x1="'+X(0).toFixed(1)+'" x2="'+X(0).toFixed(1)+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="var(--sx-muted)"/>';
  s+='<polyline fill="none" stroke="var(--sx-primary)" stroke-width="2.6" points="'+pts.filter(function(p){return p[1]<=ymax*1.2&&p[1]>=ymin-1;}).map(function(p){return X(p[0]).toFixed(1)+','+Y(Math.min(ymax*1.2,p[1])).toFixed(1);}).join(' ')+'"/>';
  s+='<line x1="'+X(mark[0]).toFixed(1)+'" x2="'+X(mark[0]).toFixed(1)+'" y1="'+Y(mark[1]).toFixed(1)+'" y2="'+(H-pb)+'" stroke="#dc2626" stroke-dasharray="5 4"/><line x1="'+pl+'" x2="'+X(mark[0]).toFixed(1)+'" y1="'+Y(mark[1]).toFixed(1)+'" y2="'+Y(mark[1]).toFixed(1)+'" stroke="#dc2626" stroke-dasharray="5 4"/><circle cx="'+X(mark[0]).toFixed(1)+'" cy="'+Y(mark[1]).toFixed(1)+'" r="6" fill="#dc2626"/><text class="ax" x="'+(X(mark[0])+10).toFixed(1)+'" y="'+(Y(mark[1])-10).toFixed(1)+'" style="font-weight:700;fill:#b91c1c">'+esc(lab)+'</text>';
  $('viz').innerHTML=s+'</svg>';}

function compute(){
  var m=$('mode').value,h='',n0=0,tg=$('tag');tg.className='sx-ef-grade';
  ['p1','p2','p3','p4'].forEach(function(id,i){$(id).hidden=('s'+(i+1))!==m;});$('presets').hidden=m!=='s1';$('vizCard').hidden=m==='s2';
  C.text('formH',{s1:'Potencia bˣ',s2:'Notación científica',s3:'Crecimiento y decaimiento exponencial',s4:'Raíz b^(1/n)'}[m]);$('err').hidden=true;
  function st(t,d,e){n0++;h+='<li><span class="n">'+n0+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(M.fmt(x,10));};
  if(m==='s1'){
    var b=v('bb'),x=v('bx');if($('bb').value===''||$('bx').value==='')return fail('Introduce una base y un exponente.');
    if(b===0&&x===0)return fail('0⁰ es indeterminado: 0ˣ = 0 para x > 0, pero x⁰ = 1 para x ≠ 0. Las convenciones difieren, por lo que no se da ningún valor.');if(b===0&&x<0)return fail('0 elevado a una potencia negativa no está definido (división entre cero).');
    var pq=ratio(x),res,cplx=null,exactTxt='',radTxt='',isInt=b===Math.round(b)&&x===Math.round(x);
    if(isInt&&Math.abs(x)<=20000&&Math.abs(x)*Math.log10(Math.abs(b)||1)<4000){var big=BigInt(b)**BigInt(Math.abs(x));if(x>=0){exactTxt=big.toString();res=Number(big);rawRes=exactTxt;}else{exactTxt='1 / '+big.toString();res=1/Number(big);rawRes=exactTxt;}if(exactTxt.length>60)exactTxt=exactTxt.slice(0,20)+'…'+exactTxt.slice(-10)+' ('+(x>=0?big.toString().length:big.toString().length)+' dígitos)';}
    else if(b>0){res=Math.pow(b,x);rawRes=String(res);}
    else{/* negative base */if(pq&&pq[1]%2===1){var sg=Math.abs(pq[0])%2===1?-1:1;res=sg*Math.pow(-b,x);rawRes=String(res);}else{var mg=Math.pow(-b,x);cplx=[mg*Math.cos(PI*x),mg*Math.sin(PI*x)];res=NaN;rawRes=M.fmt(cplx[0],12)+' + '+M.fmt(cplx[1],12)+'i';}}
    if(b>0&&pq&&pq[1]>1&&b===Math.round(b)){var q=pq[1],r=Math.round(Math.pow(b,1/q));if(Math.pow(r,q)===b){var pw=Math.abs(pq[0]);exactTxt=pq[0]>=0?String(Math.pow(r,pw)):'1 / '+Math.pow(r,pw);}}
    if(pq&&pq[1]>1)radTxt=(pq[1]===2?'√':pq[1]+'√')+'('+M.fmt(b,6)+')'+(Math.abs(pq[0])===1?'':sup(Math.abs(pq[0])))+(pq[0]<0?' en el denominador':'');
    C.text('fxNow',M.fmt(b,8)+sup(M.fmt(x,8))+' = '+(cplx?rawRes:fmtNum(res)));C.text('heroLbl',M.fmt(b,6)+(x<0?'':'')+' elevado a '+M.fmt(x,6));
    if(cplx){C.text('resultValue',M.fmt(cl(cplx[0]),10)+' + '+M.fmt(cl(cplx[1]),10)+'i');C.text('ex1L','Módulo · argumento');C.text('ex1',M.fmt(Math.hypot(cplx[0],cplx[1]),10)+' · '+M.fmt(PI*x,8)+' rad');tg.textContent='Complejo (valor principal)';tg.className='sx-ef-grade mid';C.text('interp','Una base negativa con un exponente no entero (de denominador par) no tiene valor real; este es el valor complejo principal.');}
    else{var dig=/^\d+$/.test(rawRes)&&rawRes.length<=30;C.text('resultValue',dig?rawRes.replace(/\B(?=(\d{3})+(?!\d))/g,','):fmtNum(res));C.text('ex1L','Notación científica');C.text('ex1',sci(res));tg.textContent=exactTxt?'Valor exacto':'Aproximación decimal';C.text('interp',M.fmt(b,6)+' a la potencia '+M.fmt(x,6)+' is '+fmtNum(res)+'.');}
    C.text('ex2L','Forma exacta');C.text('ex2',exactTxt||(radTxt||'—'));
    var recip=cplx?null:1/res;
    tiles(cplx?[['Parte real',M.fmt(cl(cplx[0]),10),'|b|ˣ cos(πx)'],['Parte imaginaria',M.fmt(cl(cplx[1]),10),'|b|ˣ sin(πx)'],['Módulo',M.fmt(Math.hypot(cplx[0],cplx[1]),10),'|b|ˣ']]:[['Notación científica',sci(res),'mantisa × 10ⁿ'],['Notación de ingeniería',eng(res),'exponente múltiplo de 3'],['Forma radical',radTxt||'—','b^(p/q) = (q√b)ᵖ'],['Recíproco',isFinite(recip)?fmtNum(recip):'—','1 ÷ resultado'],['Logaritmo decimal log₁₀',res>0?M.fmt(Math.log10(res),10):'—','dígitos ≈ log₁₀ + 1'],['Logaritmo natural ln',res>0?M.fmt(Math.log(res),10):'—','x · ln b'],['Signo',res>0?'positive':res<0?'negative':'zero',b<0?'el signo sigue la paridad del exponente':'bˣ > 0 para b > 0'],['Carácter del crecimiento',b>1?'creciente en x':b>0&&b<1?'decreciente en x':b===1?'constant':'signo oscilante','depende de b']]);
    if(!cplx&&b>0&&b!==1&&isFinite(res)){curve(function(t){return Math.pow(b,t);},Math.min(-1,x-1),Math.max(3,x+1),[x,res],'P('+M.fmt(x,4)+', '+M.fmt(res,4)+')');C.text('vizH','Curva exponencial f(t) = '+M.fmt(b,4)+'ᵗ');C.text('vizNote','La curva con tu punto marcado; la asíntota horizontal es y = 0.');C.text('vizTag','base '+M.fmt(b,4));}else{$('viz').innerHTML='';C.text('vizTag','no hay gráfica para este caso');}
    if(pq&&pq[1]>1)st('Escribe el exponente como fracción','Un exponente decimal es un número racional m/n.',M.fmt(x,8)+' = <b>'+pq[0]+' / '+pq[1]+'</b> → b^x = b^('+pq[0]+'/'+pq[1]+')');
    if(pq&&pq[1]>1)st('Aplica la regla del radical','b^(m/n) = (ⁿ√b)ᵐ: primero la raíz y luego la potencia.',esc(M.fmt(b,6))+'^('+pq[0]+'/'+pq[1]+') = <b>'+esc(radTxt)+'</b>'+(exactTxt?' = <b>'+esc(exactTxt)+'</b>':''));
    st(cplx?'Valor complejo principal':'Evalúa','Usa bˣ = e^(x ln b)'+(b<0?' con el módulo |b|ˣ y el ángulo πx para una base negativa':'')+'.',cplx?'|b|ˣ = '+f(Math.pow(-b,x))+',  ángulo πx = '+f(PI*x)+' rad → <b>'+esc(rawRes)+'</b>':(isInt&&x>=0?f(b)+' multiplied '+f(x)+' times':'b^x = e^('+f(x)+' × ln '+f(Math.abs(b))+')')+' = <b>'+esc(fmtNum(res))+'</b>');
    if(!cplx&&isFinite(res))st('Otras formas','','Científica: '+esc(sci(res))+'<br>Ingeniería: '+esc(eng(res))+(res>0?'<br>log₁₀ = '+f(Math.log10(res)):''));
    last='Exponente — calculatepilot.com/math/exponent-calculator.html\n'+M.fmt(b,10)+' ^ '+M.fmt(x,10)+' = '+(cplx?rawRes:(rawRes.length>50?fmtNum(res):rawRes||fmtNum(res)))+(cplx?'':'\nScientific: '+sci(res));C.text('stepsIntro','Evaluando '+M.fmt(b,6)+' elevado a '+M.fmt(x,6)+'.');C.text('stepsTag','bˣ = e^(x ln b)');
  }else if(m==='s2'){
    var raw=String($('sn').value).trim().replace(/[,\s]/g,''),val=Number(raw);if(raw===''||!isFinite(val))return fail('Introduce un número, por ejemplo 299792458 o 6.02e23.');
    var ex=val===0?0:Math.floor(Math.log10(Math.abs(val))),mant=val/Math.pow(10,ex);if(Math.abs(mant)>=10){mant/=10;ex++;}
    var pre={'-24':'yocto','-21':'zepto','-18':'atto','-15':'femto','-12':'pico','-9':'nano','-6':'micro','-3':'milli','0':'','3':'kilo','6':'mega','9':'giga','12':'tera','15':'peta','18':'exa','21':'zetta','24':'yotta'},e3=Math.floor(ex/3)*3;
    C.text('heroLbl','Notación científica');C.text('resultValue',sci(val));C.text('ex1L','E-notation');C.text('ex1',val.toExponential().replace('e+','e'));C.text('ex2L','Notación de ingeniería');C.text('ex2',eng(val));tg.textContent='Orden de magnitud '+ex;C.text('fxNow',M.fmt(val,15)+' = '+M.fmt(mant,12)+' × 10'+sup(ex));
    C.text('interp','Desplaza la coma decimal '+Math.abs(ex)+' place'+(Math.abs(ex)===1?'':'s')+(ex>=0?' left':' right')+' para obtener una mantisa entre 1 y 10.');
    tiles([['Forma estándar',Math.abs(val)>=1e21||(Math.abs(val)<1e-7&&val!==0)?'demasiado largo: usa notación científica':val.toLocaleString('es-ES',{maximumFractionDigits:20}),'escrito completo'],['Mantisa (a)',M.fmt(mant,12),'1 ≤ |a| < 10'],['Exponente (n)',String(ex),'potencia de diez'],['Escala de prefijos del SI',pre[e3]!==undefined&&pre[e3]!==''?pre[e3]+' (10'+sup(e3)+')':(e3===0?'ninguno (unidades)':'más allá de los prefijos del SI'),'potencia de 1000 más cercana'],['Cifras significativas',String(raw.replace(/e.*$/i,'').replace(/^[-+]?0*\.?0*/,'').replace('.','').replace(/0+$/,'').length||1),'a partir de los dígitos que escribiste'],['log₁₀|x|',val!==0?M.fmt(Math.log10(Math.abs(val)),10):'—','= n + log₁₀|a|']]);
    $('viz').innerHTML='';st('Halla el exponente','Es la potencia de 10 que coloca el primer dígito en el lugar de las unidades.','n = ⌊log₁₀|'+f(val)+'|⌋ = <b>'+ex+'</b>');st('Calcula la mantisa','Divide entre 10ⁿ.','a = '+f(val)+' ÷ 10'+sup(ex)+' = <b>'+f(mant)+'</b>');st('Escríbelo completo','','<b>'+esc(sci(val))+'</b> (ingeniería: '+esc(eng(val))+')');
    last='Notación científica — calculatepilot.com/math/exponent-calculator.html\n'+raw+' = '+sci(val)+'\nengineering: '+eng(val);C.text('stepsIntro','Conversión a notación científica.');C.text('stepsTag','a × 10ⁿ');rawRes=sci(val);
  }else if(m==='s3'){
    var N0=v('g0'),k=v('gk'),t=v('gt');if($('g0').value===''||$('gk').value===''||$('gt').value==='')return fail('Introduce N₀, k y t.');
    var fac=Math.exp(k*t),Nt=N0*fac,T=k!==0?Math.LN2/Math.abs(k):Infinity;rawRes=String(Nt);
    C.text('heroLbl','N(t) = N₀ · e^(kt)');C.text('resultValue',fmtNum(Nt));C.text('ex1L',k>=0?'Tiempo de duplicación':'Half-life');C.text('ex1',isFinite(T)?M.fmt(T,8):'ninguno (k = 0)');C.text('ex2L','Factor de crecimiento e^(kt)');C.text('ex2',M.fmt(fac,10));tg.textContent=k>0?'Crecimiento exponencial':k<0?'Decaimiento exponencial':'Sin cambio';tg.className='sx-ef-grade'+(k<0?' mid':'');
    C.text('fxNow','N('+M.fmt(t,6)+') = '+M.fmt(N0,6)+' × e^('+M.fmt(k,6)+' × '+M.fmt(t,6)+') = '+fmtNum(Nt));C.text('interp','Partiendo de '+M.fmt(N0,6)+', continuo '+(k>=0?'growth':'decay')+' a una tasa de '+M.fmt(k,6)+' por unidad de tiempo se obtiene '+fmtNum(Nt)+' after '+M.fmt(t,6)+'.');
    tiles([['Cambio',fmtNum(Nt-N0),'N(t) − N₀'],['Cambio porcentual',(fac-1)*100>1e9?sci((fac-1)*100)+'%':M.fmt((fac-1)*100,8)+'%','(e^(kt) − 1) × 100'],['Tasa discreta equivalente',M.fmt((Math.exp(k)-1)*100,8)+'% por unidad de tiempo','e^k − 1'],['Tiempo para llegar a 2× o ½×',isFinite(T)?M.fmt(T,8):'—','ln 2 ÷ |k|'],['Logaritmo natural del factor',M.fmt(k*t,10),'k · t'],['Forma de vida media',k<0?'N₀ · (½)^(t ÷ '+M.fmt(T,6)+')':'—','equivalente para el decaimiento']]);
    var tmax=Math.max(t*1.4,Math.abs(t)+1);curve(function(tt){return N0*Math.exp(k*tt);},0,tmax,[t,Nt],'N('+M.fmt(t,4)+') = '+M.fmt(Nt,5));C.text('vizH','Curva de crecimiento N(t)');C.text('vizNote','Cambio continuo a lo largo del tiempo; las líneas discontinuas marcan t.');C.text('vizTag','k = '+M.fmt(k,6));
    st('Plantea el modelo','Cambio exponencial continuo.','N(t) = N₀ · e^(kt), N₀ = '+f(N0)+', k = '+f(k)+', t = '+f(t));st('Calcula el exponente','','kt = '+f(k)+' × '+f(t)+' = <b>'+f(k*t)+'</b>');st('Exponencia y escala','','e^('+f(k*t)+') = '+f(fac)+',   N(t) = '+f(N0)+' × '+f(fac)+' = <b>'+esc(fmtNum(Nt))+'</b>');if(isFinite(T))st(k>0?'Tiempo de duplicación':'Half-life','Haz e^(kt) = 2 (o ½).','t = ln 2 ÷ |k| = 0.693147 ÷ '+f(Math.abs(k))+' = <b>'+f(T)+'</b>');
    last='Crecimiento/decaimiento — calculatepilot.com/math/exponent-calculator.html\nN0 = '+N0+', k = '+k+', t = '+t+'\nN(t) = '+fmtNum(Nt)+(isFinite(T)?'\n'+(k>0?'tiempo de duplicación':'half-life')+' = '+M.fmt(T,8):'');C.text('stepsIntro','Crecimiento o decaimiento exponencial continuo.');C.text('stepsTag','N₀ · e^(kt)');
  }else{
    var rb=v('rb'),rn=Math.round(v('rn'));if(rn!==v('rn')||rn<2||rn>1000)return fail('El índice de la raíz debe ser un número entero de 2 a 1000.');if($('rb').value==='')return fail('Introduce un número.');
    var neg=rb<0,res2,cx=null;
    if(!neg||rn%2===1){res2=(neg?-1:1)*Math.pow(Math.abs(rb),1/rn);rawRes=String(res2);}else{var mg2=Math.pow(-rb,1/rn);cx=[mg2*Math.cos(PI/rn),mg2*Math.sin(PI/rn)];rawRes=M.fmt(cx[0],12)+' + '+M.fmt(cx[1],12)+'i';res2=NaN;}
    var rad='',isI=rb===Math.round(rb)&&Math.abs(rb)<=1e15;
    if(isI&&rb!==0){var fm=factor(Math.abs(rb)),kk=1,mm=1;fm.forEach(function(e,p){kk*=Math.pow(p,Math.floor(e/rn));mm*=Math.pow(p,e%rn);});var sgn=neg&&rn%2===1?'−':'';rad=mm===1?sgn+String(kk):sgn+(kk===1?'':kk)+(rn===2?'√':rn+'√')+mm;if(neg&&rn%2===0)rad='';}
    C.text('heroLbl',(rn===2?'Cuadrado':rn===3?'Cubo':rn+'th')+' raíz de '+M.fmt(rb,8));C.text('fxNow','b^(1/n) = '+M.fmt(rb,8)+'^(1/'+rn+')');
    if(cx){C.text('resultValue',M.fmt(cx[0],10)+' + '+M.fmt(cx[1],10)+'i');tg.textContent='Raíz compleja principal';tg.className='sx-ef-grade mid';C.text('interp','Un número negativo no tiene raíz real de índice par; esta es la raíz compleja principal.');}
    else{C.text('resultValue',fmtNum(res2));tg.textContent=rad&&!/√/.test(rad)?'Raíz entera exacta':'Raíz irracional';C.text('interp','La raíz real '+rn+'-ésima de '+M.fmt(rb,8)+' is '+fmtNum(res2)+'.');}
    C.text('ex1L','Radical simplificado');C.text('ex1',rad||'—');C.text('ex2L','Comprobación: resultado ⁿ');C.text('ex2',cx?'—':M.fmt(Math.pow(res2,rn),10));
    tiles([['Forma radical',rad||'—','k·ⁿ√m con m sin factores que sean potencias n-ésimas'],['Notación científica',cx?'—':sci(res2),'mantisa × 10ⁿ'],['Logaritmo natural ln|b| ÷ n',rb!==0?M.fmt(Math.log(Math.abs(rb))/rn,10):'—','ln de la raíz'],['Número de raíces complejas',String(rn),'las n raíces de la ecuación xⁿ = b']]);
    if(!cx&&rb>0){curve(function(tt){return tt>=0?Math.pow(tt,1/rn):NaN;},0,Math.max(rb*1.5,4),[rb,res2],'('+M.fmt(rb,4)+', '+M.fmt(res2,4)+')');C.text('vizH','Función raíz y = x^(1/'+rn+')');C.text('vizNote','La función raíz con tu punto marcado.');C.text('vizTag','n = '+rn);}else{$('viz').innerHTML='';C.text('vizTag','—');}
    st('Reescribe la raíz como exponente','La raíz n-ésima equivale a la potencia 1/n.',M.fmt(rb,8)+'^(1/'+rn+')');if(rad&&/√/.test(rad))st('Simplifica el radical','Extrae los factores que son potencias perfectas '+rn+'-ésimas.','<b>'+esc(rad)+'</b>');st('Evalúa','',cx?'raíz principal = <b>'+esc(rawRes)+'</b>':'<b>'+esc(fmtNum(res2))+'</b>');
    last='Raíz — calculatepilot.com/math/exponent-calculator.html\n'+rn+'-ésima de '+rb+' = '+(cx?rawRes:fmtNum(res2))+(rad?'  ('+rad+')':'');C.text('stepsIntro',rn+'-ésima de '+M.fmt(rb,8)+'.');C.text('stepsTag','b^(1/n)');
  }
  $('steps').innerHTML=h;
}
function cl(x){return Math.abs(x)<1e-13?0:x;}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('bb').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'exCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-b]');if(!b)return;C.set('bb',b.getAttribute('data-b'));C.set('bx',b.getAttribute('data-x'));fire();});
  $('copyBtn').addEventListener('click',function(){if(rawRes)copy(rawRes,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
