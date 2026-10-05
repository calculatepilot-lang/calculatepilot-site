/* Quadratic formula calculator — CalculatePilot (Stitch redesign).
   x = (−b ± √Δ) / 2a, Δ = b² − 4ac. Numerically stable real roots: q = −(b + sgn(b)√Δ)/2, x₁ = q/a, x₂ = c/q.
   Vertex (h,k) = (−b/2a, c − b²/4a) · focus (h, k + 1/4a) · directrix y = k − 1/4a · Vieta: x₁+x₂ = −b/a, x₁x₂ = c/a.
   Exact forms when a, b, c are integers (or decimals scaled to integers): rational roots or k√m radicals; complex roots p ± qi. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,last='';

function esc(s){return C.esc(s);}
function cl(x){return Math.abs(x)<1e-13?0:x;}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function fx(x,dp){return M.fmt(cl(x),dp);}
function scaleOf(list){for(var k=0;k<=4;k++){var s=Math.pow(10,k);if(list.every(function(x){var y=x*s;return Math.abs(y-Math.round(y))<=1e-9*Math.max(1,Math.abs(y));}))return s;}return null;}
function sqDecomp(N){/* N = k²·m with m squarefree */var k=1,m=N,p;for(p=2;p*p<=m&&p<=1e7;p++){while(m%(p*p)===0){m/=p*p;k*=p;}}return [k,m];}
function frac(n,d){var g=gcd(n,d)||1;n/=g;d/=g;if(d<0){n=-n;d=-d;}return d===1?String(n):n+'/'+d;}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','disc','ex'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}
function sgnTerm(x,dp,first){var s=x<0?'−':(first?'':'+');return (first?'':' ')+s+(first?'':' ')+fx(Math.abs(x),dp);}
function poly(a,b,c,dp){var t=(a===1?'':a===-1?'−':fx(a,dp))+'x²';if(b!==0)t+=' '+(b<0?'−':'+')+' '+(Math.abs(b)===1?'':fx(Math.abs(b),dp))+'x';if(c!==0)t+=' '+(c<0?'−':'+')+' '+fx(Math.abs(c),dp);return t;}

function graph(a,b,c,h,k,D,x1,x2){
  var W=760,H=340,pad=40,real=D>=0,w;
  if(D>0)w=Math.max(Math.abs(x1-h),Math.abs(x2-h))*1.7;else if(D===0)w=3;else w=Math.max(2,Math.sqrt(Math.abs(k/a))*2.2);w=Math.max(w,1e-6);
  var lo=h-w,hi=h+w,f=function(x){return a*x*x+b*x+c;},ys=[k,f(lo),f(hi),0],ymin=Math.min.apply(null,ys),ymax=Math.max.apply(null,ys);
  var ycap=Math.abs(k)+w*w*Math.abs(a)*1.2+1;if(ymax>k+ycap)ymax=k+ycap;if(ymin<k-ycap)ymin=k-ycap;
  if(a>0){ymax=Math.min(ymax,k+Math.max(1,2.3*Math.pow(w,2)*a));}else{ymin=Math.max(ymin,k-Math.max(1,2.3*Math.pow(w,2)*Math.abs(a)));}
  var sy=(ymax-ymin)||2;ymin-=sy*0.12;ymax+=sy*0.12;var kx=(W-2*pad)/(hi-lo),ky=(H-2*pad)/(ymax-ymin),X=function(x){return pad+(x-lo)*kx;},Y=function(y){return H-pad-(y-ymin)*ky;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  if(0>=ymin&&0<=ymax)s+='<line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+Y(0).toFixed(1)+'" y2="'+Y(0).toFixed(1)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  if(0>=lo&&0<=hi)s+='<line x1="'+X(0).toFixed(1)+'" x2="'+X(0).toFixed(1)+'" y1="'+pad+'" y2="'+(H-pad)+'" stroke="var(--sx-muted)" stroke-width="1.5"/>';
  s+='<line x1="'+X(h).toFixed(1)+'" x2="'+X(h).toFixed(1)+'" y1="'+pad+'" y2="'+(H-pad)+'" stroke="#2563eb" stroke-dasharray="5 4" stroke-width="1.5"/><text class="ax" x="'+(X(h)+6).toFixed(1)+'" y="'+(pad+8)+'" style="fill:#1d4ed8;font-weight:600">x = '+esc(M.fmt(cl(h),4))+'</text>';
  var pts=[],i;for(i=0;i<=200;i++){var x=lo+(hi-lo)*i/200,y=f(x);if(y>=ymin-sy&&y<=ymax+sy)pts.push(X(x).toFixed(1)+','+Y(Math.max(ymin-sy,Math.min(ymax+sy,y))).toFixed(1));}
  s+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--sx-primary)" stroke-width="2.6"/>';
  function dot(x,y,col,lab,dy){s+='<circle cx="'+X(x).toFixed(1)+'" cy="'+Y(y).toFixed(1)+'" r="5.5" fill="'+col+'"/><text class="ax" x="'+(X(x)+8).toFixed(1)+'" y="'+(Y(y)+dy).toFixed(1)+'" style="font-weight:700;fill:var(--sx-on)">'+esc(lab)+'</text>';}
  if(D>=0){dot(x1,0,'#059669','x₁ = '+M.fmt(cl(x1),4),18);if(D>0)dot(x2,0,'#059669','x₂ = '+M.fmt(cl(x2),4),18);}
  dot(h,k,'#dc2626','vértice ('+M.fmt(cl(h),3)+', '+M.fmt(cl(k),3)+')',a>0?18:-10);
  if(0>=lo&&0<=hi)dot(0,c,'var(--sx-primary)','(0, '+M.fmt(c,3)+')',-10);
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var a=v('qa'),b=v('qb'),c=v('qc'),dp=+$('dp').value,h='',n=0,tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  C.text('fxNow',poly(a,b,c,4)+' = 0');
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  if($('qa').value===''||$('qb').value===''||$('qc').value==='')return fail('Introduce los tres coeficientes.');
  if(a===0)return fail('a = 0 significa que la ecuación no es cuadrática. Es lineal: '+(b!==0?'x = −c ÷ b = '+fx(-c/b,8)+'.':(c===0?'todo x es solución (0 = 0).':'no hay solución (c = 0 es falso).')));
  var D=b*b-4*a*c,hh=-b/(2*a),kk=c-b*b/(4*a),f=function(x){return esc(fx(x,dp));},sc=scaleOf([a,b,c]),ex='',x1,x2,res,kind,fact;
  var ia=null,ib=null,ic=null,iD=null;if(sc){ia=Math.round(a*sc);ib=Math.round(b*sc);ic=Math.round(c*sc);iD=ib*ib-4*ia*ic;}
  if(D>1e-12*(b*b+Math.abs(4*a*c))||D>0){/* two real roots */
    var sq=Math.sqrt(D),q=-(b+(b<0?-sq:sq))/2;x1=q/a;x2=q!==0?c/q:x1;if(x1<x2){var t=x1;x1=x2;x2=t;}
    res='x₁ = '+fx(x1,dp)+',  x₂ = '+fx(x2,dp);kind='Dos raíces reales distintas';
    if(iD!==null&&iD>0){var r=Math.round(Math.sqrt(iD));if(r*r===iD){ex='x = '+frac(-ib+r,2*ia)+', '+frac(-ib-r,2*ia);kind='Dos raíces racionales distintas';}else{var d2=sqDecomp(iD),g=gcd(gcd(ib,d2[0]),2*ia),bb=-ib/g,kq=d2[0]/g,dd=2*ia/g;if(dd<0){bb=-bb;dd=-dd;}ex='x = '+(bb!==0?(dd===1?bb:'('+bb):'')+(bb!==0&&dd===1?' ':(bb!==0?' ':''))+'± '+(kq===1?'':kq)+'√'+d2[1]+(bb!==0&&dd!==1?')':'')+(dd!==1?' / '+dd:'');ex=ex.replace('( ','(');kind='Dos raíces irracionales distintas';}}
    fact='('+'x '+(x1<0?'+ ':'− ')+fx(Math.abs(x1),dp)+')(x '+(x2<0?'+ ':'− ')+fx(Math.abs(x2),dp)+')';
  }else if(D===0||Math.abs(D)<1e-12*(b*b+Math.abs(4*a*c))){x1=x2=hh;res='x = '+fx(hh,dp)+'  (raíz doble)';kind='Una raíz real repetida';ex=sc?'x = '+frac(-ib,2*ia):'';fact='(x '+(hh<0?'+ ':'− ')+fx(Math.abs(hh),dp)+')²';}
  else{/* complex */
    var p=hh,qi=Math.sqrt(-D)/(2*Math.abs(a));res=fx(p,dp)+' + '+fx(qi,dp)+'i,  '+fx(p,dp)+' − '+fx(qi,dp)+'i';kind='Dos raíces complejas conjugadas';
    if(iD!==null){var d3=sqDecomp(-iD),g3=gcd(gcd(ib,d3[0]),2*ia),b3=-ib/g3,k3=d3[0]/g3,dd3=2*ia/g3;if(dd3<0){b3=-b3;dd3=-dd3;}var im=(k3===1?'':k3)+(d3[1]===1?'':'√'+d3[1])+'i';if(d3[1]===1&&k3===1)im='i';
      ex='x = '+(dd3===1?(b3!==0?b3+' ± ':'± ')+im:'('+(b3!==0?b3+' ± ':'± ')+im+') / '+dd3);}
    fact='a(x − ('+fx(p,dp)+' + '+fx(qi,dp)+'i))(x − ('+fx(p,dp)+' − '+fx(qi,dp)+'i))';
  }
  C.text('heroLbl','Raíces de '+poly(a,b,c,3)+' = 0');C.text('resultValue',res);C.text('disc',fx(D,dp));C.text('exL','Forma exacta');C.text('ex',ex||'—');tg.textContent=kind;tg.className='sx-ef-grade'+(D<0?' mid':'');
  C.text('interp',D>0?'La parábola corta el eje x en dos puntos.':D===0?'La parábola toca el eje x en su vértice.':'La parábola no llega al eje x, así que las raíces son complejas.');
  var fo=1/(4*a),vertexForm=(a===1?'':a===-1?'−':fx(a,dp))+'(x '+(hh<0?'+ ':'− ')+fx(Math.abs(hh),dp)+')² '+(kk<0?'− ':'+ ')+fx(Math.abs(kk),dp);
  tiles([['Vértice (h, k)','('+fx(hh,dp)+', '+fx(kk,dp)+')',a>0?'mínimo (abre hacia arriba)':'máximo (abre hacia abajo)'],['Eje de simetría','x = '+fx(hh,dp),'x = −b ÷ 2a'],['y-intercept','(0, '+fx(c,dp)+')','donde x = 0'],['Foco','('+fx(hh,dp)+', '+fx(kk+fo,dp)+')','(h, k + 1/4a)'],['Directriz','y = '+fx(kk-fo,dp),'y = k − 1/4a'],['Forma vértice',vertexForm,'a(x − h)² + k'],['Suma de las raíces',fx(-b/a,dp),'−b ÷ a (Vieta)'],['Producto de las raíces',fx(c/a,dp),'c ÷ a (Vieta)']]);
  graph(a,b,c,hh,kk,D,x1,x2);C.text('vizTag','Δ = '+fx(D,4));
  st('Identifica los coeficientes','Forma estándar ax² + bx + c = 0 con a ≠ 0.','a = '+f(a)+',  b = '+f(b)+',  c = '+f(c));
  st('Calcula el discriminante','Δ = b² − 4ac determina el tipo de raíces.','Δ = ('+f(b)+')² − 4·('+f(a)+')·('+f(c)+') = '+f(b*b)+' − '+f(4*a*c)+' = <b>'+f(D)+'</b>  →  '+esc(kind.toLowerCase()));
  if(D>=0)st('Sustituye en la fórmula cuadrática','Los dos signos de la raíz dan las dos soluciones.','x = (−b ± √Δ) ÷ 2a = (−('+f(b)+') ± √'+f(D)+') ÷ (2·'+f(a)+')<br>x₁ = <b>'+f(x1)+'</b>'+(D>0?', x₂ = <b>'+f(x2)+'</b>':'  (raíz doble)'));
  else st('Raíces complejas','Para Δ < 0 la raíz cuadrada es imaginaria: √Δ = i√(−Δ).','x = −b ÷ 2a ± i·√(−Δ) ÷ 2a = <b>'+f(hh)+' ± '+f(Math.sqrt(-D)/(2*Math.abs(a)))+'i</b>');
  st('Vértice','El punto de giro está sobre el eje de simetría, a medio camino entre las raíces.','h = −b ÷ 2a = <b>'+f(hh)+'</b>, k = c − b² ÷ 4a = <b>'+f(kk)+'</b>');
  st('Comprueba con las fórmulas de Vieta','Suma y producto de las raíces.','x₁ + x₂ = '+f(-b/a)+' (= −b ÷ a),  x₁ · x₂ = '+f(c/a)+' (= c ÷ a)'+(D>=0?'<br>Forma factorizada: <b>'+esc(a===1?'':fx(a,dp))+esc(fact)+'</b>':''));
  $('steps').innerHTML=h;C.text('stepsIntro','Resolviendo '+poly(a,b,c,4)+' = 0.');C.text('stepsTag','Δ = '+fx(D,4));
  last='Ecuación cuadrática — calculatepilot.com/math/quadratic-formula-calculator.html\n'+poly(a,b,c,6)+' = 0\nΔ = '+fx(D,8)+' ('+kind+')\nroots: '+res+(ex?'\nexact: '+ex:'')+'\nvértice: ('+fx(hh,8)+', '+fx(kk,8)+')';
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('qa').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'quCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-c]');if(!b)return;var a=b.getAttribute('data-c').split(',');C.set('qa',a[0]);C.set('qb',a[1]);C.set('qc',a[2]);fire();});
  $('flip').addEventListener('click',function(){['qa','qb','qc'].forEach(function(id){C.set(id,-v(id));});fire();});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
