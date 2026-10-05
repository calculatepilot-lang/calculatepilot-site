/* Trigonometry calculator — CalculatePilot (Stitch redesign).
   Circular: sin, cos, tan, csc, sec, cot of θ (deg/rad/grad; "pi/6" typed as radians) with exact radicals for multiples of 30° and 45°.
   Inverse: principal values + all solutions in [0°, 360°). Hyperbolic: sinh, cosh, tanh, csch, sech, coth. Right triangle solver. */
(function(){
var C=window.CPX,$=C.$,v=C.val,M=C.math,PI=Math.PI,last='',prevAu='deg';
var K={deg:180/PI,rad:1,grad:200/PI},SYM={deg:'°',rad:' rad',grad:' grad'},EPS=1e-12;
var EX={0:{s:'0',c:'1',t:'0',cs:null,sc:'1',ct:null},30:{s:'1/2',c:'√3/2',t:'√3/3',cs:'2',sc:'2√3/3',ct:'√3'},45:{s:'√2/2',c:'√2/2',t:'1',cs:'√2',sc:'√2',ct:'1'},60:{s:'√3/2',c:'1/2',t:'√3',cs:'2√3/3',sc:'2',ct:'√3/3'},90:{s:'1',c:'0',t:null,cs:'1',sc:null,ct:'0'}};

function esc(s){return C.esc(s);}
function cl(x){return Math.abs(x)<1e-13?0:x;}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){var t=a%b;a=b;b=t;}return a;}
function approxFrac(x,maxd){if(x===0)return [0,1];var s=x<0?-1:1,y=Math.abs(x),h1=1,h0=0,k1=0,k0=1,i,a;for(i=0;i<25;i++){a=Math.floor(y);var h2=a*h1+h0,k2=a*k1+k0;h0=h1;h1=h2;k0=k1;k1=k2;if(k1>maxd)return null;if(Math.abs(h1/k1-Math.abs(x))<1e-9)return [s*h1,k1];if(y-a<1e-12)break;y=1/(y-a);}return null;}
function piTxt(rad){var q=approxFrac(rad/PI,24);if(!q)return null;if(q[0]===0)return '0';var n=q[0],d=q[1],ns=Math.abs(n)===1?'':Math.abs(n);return (n<0?'−':'')+ns+'π'+(d>1?'/'+d:'');}
function fmt(x,dp){return isFinite(x)?M.fmt(cl(x),dp):'undefined';}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+esc(t[1])+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','ex1','ex2'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');last='';}

function parseAng(str){str=String(str).trim().replace(/π/g,'pi');var m=str.match(/^(-?[\d.]*)\s*\*?\s*pi\s*(?:\/\s*([\d.]+))?$/i);if(m){var c=m[1]===''||m[1]==='-'?(m[1]==='-'?-1:1):parseFloat(m[1]),d=m[2]?parseFloat(m[2]):1;if(!isFinite(c)||!isFinite(d)||d===0)return null;return {v:c*PI/d,pi:true};}var n=Number(str);return str!==''&&isFinite(n)?{v:n,pi:false}:null;}

function circle(th,opts){
  var W=760,H=340,cx=380,cy=170,R=130,s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet">';
  var px=cx+R*Math.cos(th),py=cy-R*Math.sin(th);
  s+='<line x1="'+(cx-R-30)+'" y1="'+cy+'" x2="'+(cx+R+30)+'" y2="'+cy+'" stroke="var(--sx-muted)"/><line x1="'+cx+'" y1="'+(cy-R-20)+'" x2="'+cx+'" y2="'+(cy+R+20)+'" stroke="var(--sx-muted)"/><circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="var(--sx-card)" stroke="var(--sx-primary)" stroke-width="2"/>';
  var a=Math.atan2(Math.sin(th),Math.cos(th)),ar=30,ax=cx+ar*Math.cos(a),ay=cy-ar*Math.sin(a);
  s+='<path d="M'+(cx+ar)+' '+cy+' A'+ar+' '+ar+' 0 '+(((th%(2*PI)+2*PI)%(2*PI))>PI?1:0)+' 0 '+ax.toFixed(1)+' '+ay.toFixed(1)+'" fill="none" stroke="#d97706" stroke-width="2"/>';
  s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+px.toFixed(1)+'" y2="'+py.toFixed(1)+'" stroke="var(--sx-primary)" stroke-width="2.5"/>';
  s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+px.toFixed(1)+'" y2="'+cy+'" stroke="#059669" stroke-width="3"/><line x1="'+px.toFixed(1)+'" y1="'+cy+'" x2="'+px.toFixed(1)+'" y2="'+py.toFixed(1)+'" stroke="#2563eb" stroke-width="3"/>';
  var t=Math.tan(th);if(Math.abs(Math.cos(th))>1e-9&&Math.abs(t)<2.6){s+='<line x1="'+(cx+R)+'" y1="'+cy+'" x2="'+(cx+R)+'" y2="'+(cy-R*t).toFixed(1)+'" stroke="#7c3aed" stroke-width="3" stroke-dasharray="6 3"/><line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+R)+'" y2="'+(cy-R*t).toFixed(1)+'" stroke="#7c3aed" stroke-width="1" opacity=".5"/>';}
  s+='<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="5.5" fill="var(--sx-primary)"/>';
  function tx(x,y,t2,col,anchor){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="'+(anchor||'middle')+'" style="font-weight:700;font-size:12px;fill:'+col+'">'+esc(t2)+'</text>';}
  s+=tx(cx+R+34,cy+4,'x','var(--sx-muted)')+tx(cx+8,cy-R-24,'y','var(--sx-muted)','start')+tx((cx+px)/2,cy+(Math.sin(th)>=0?16:-8),'cos '+M.fmt(cl(Math.cos(th)),4),'#047857')+tx(px+(Math.cos(th)>=0?8:-8),(py+cy)/2,'sin '+M.fmt(cl(Math.sin(th)),4),'#1d4ed8',Math.cos(th)>=0?'start':'end');
  if(opts&&opts.label)s+=tx(px+(Math.cos(th)>=0?10:-10),py+(Math.sin(th)>=0?-10:16),opts.label,'var(--sx-primary)',Math.cos(th)>=0?'start':'end');
  $('viz').innerHTML=s+'</svg>';
}
function tri(A,opp,adj,hyp){
  var W=760,H=300,pad=34,k=Math.min((W-2*pad)/adj,(H-2*pad)/opp),ox=(W-adj*k)/2,oy=(H+opp*k)/2;
  var X=function(x){return (ox+x*k).toFixed(1);},Y=function(y){return (oy-y*k).toFixed(1);};
  var s='<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet"><polygon points="'+X(0)+','+Y(0)+' '+X(adj)+','+Y(0)+' '+X(adj)+','+Y(opp)+'" fill="var(--sx-pc)" fill-opacity=".18" stroke="var(--sx-primary)" stroke-width="2.5" stroke-linejoin="round"/><polyline points="'+X(adj-Math.min(adj,opp)*0.12)+','+Y(0)+' '+X(adj-Math.min(adj,opp)*0.12)+','+Y(Math.min(adj,opp)*0.12)+' '+X(adj)+','+Y(Math.min(adj,opp)*0.12)+'" fill="none" stroke="var(--sx-primary)"/>';
  function tx(x,y,t,col){return '<text class="ax" x="'+x+'" y="'+y+'" text-anchor="middle" style="font-weight:700;font-size:12px;fill:'+col+'">'+esc(t)+'</text>';}
  s+=tx((+X(0)+ +X(adj))/2,+Y(0)+20,'adjacent = '+M.fmt(adj,4),'var(--sx-on)')+tx(+X(adj)+46,(+Y(0)+ +Y(opp))/2,'opposite = '+M.fmt(opp,4),'var(--sx-on)')+tx((+X(0)+ +X(adj))/2-26,(+Y(0)+ +Y(opp))/2-16,'hypotenuse = '+M.fmt(hyp,4),'var(--sx-primary)')+tx(+X(0)+42,+Y(0)-8,'A = '+M.fmt(A,4)+'°','#b45309');
  $('viz').innerHTML=s+'</svg>';
}

function compute(){
  var m=$('mode').value,dp=+$('dp').value,h='',n=0,tg=$('tag');tg.className='sx-ef-grade';
  ['p1','p2','p3','p4'].forEach(function(id,i){$(id).hidden=('s'+(i+1))!==m;});$('presets').hidden=m!=='s1';$('vizCard').hidden=m==='s3';
  C.text('formH',{s1:'Circular functions',s2:'Inverse functions',s3:'Hyperbolic functions',s4:'Right triangle solver'}[m]);$('err').hidden=true;
  function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  var f=function(x){return esc(fmt(x,dp));};
  if(m==='s1'){
    var pa=parseAng($('ang').value);if(!pa)return fail('Enter an angle as a number, or as a multiple of π such as pi/6 or 2pi/3.');
    if(pa.pi&&$('au').value!=='rad'){$('au').value='rad';prevAu='rad';}
    var u=$('au').value;if(u!==prevAu){if(!pa.pi){pa=parseAng(String(+(pa.v/K[prevAu]*K[u]).toPrecision(12)));$('ang').value=String(pa.v);}prevAu=u;}
    var th=pa.v/K[u],deg=th*180/PI,r=((deg%360)+360)%360,rounded=Math.abs(r-Math.round(r))<1e-9?Math.round(r):r,quad=r===0||r===90||r===180||r===270?'on an axis':r<90?'Quadrant I':r<180?'Quadrant II':r<270?'Quadrant III':'Quadrant IV';
    var ref=r<=90?r:r<=180?180-r:r<=270?r-180:360-r,sn=cl(Math.sin(th)),cs=cl(Math.cos(th)),tn=Math.abs(cs)<EPS?NaN:cl(Math.tan(th)),cc=Math.abs(sn)<EPS?NaN:1/sn,sc=Math.abs(cs)<EPS?NaN:1/cs,ct=Math.abs(sn)<EPS?NaN:cl(cs/sn);
    var special=[0,30,45,60,90].filter(function(a){return Math.abs(ref-a)<1e-9;})[0],E=special===undefined?null:EX[special];
    function ex(key,val){if(!E)return null;if(!isFinite(val))return 'undefined';var t=E[key];if(t===null)return 'undefined';return (val<0&&t!=='0'?'−':'')+t;}
    var vals=[['sin θ',sn,ex('s',sn)],['cos θ',cs,ex('c',cs)],['tan θ',tn,ex('t',tn)],['csc θ',cc,ex('cs',cc)],['sec θ',sc,ex('sc',sc)],['cot θ',ct,ex('ct',ct)]];
    C.text('heroLbl','sin θ');C.text('resultValue',fmt(sn,dp));C.text('ex1L','Exact sin θ');C.text('ex1',vals[0][2]||'—');C.text('ex2L','cos θ');C.text('ex2',fmt(cs,dp)+(vals[1][2]?'  ('+vals[1][2]+')':''));
    C.text('fxNow','θ = '+M.fmt(pa.v,6)+SYM[u]+' = '+M.fmt(deg,8)+'° = '+M.fmt(th,8)+' rad');tg.textContent=quad;
    C.text('interp','θ = '+M.fmt(deg,8)+'° ('+(piTxt(th)?piTxt(th)+' rad, ':'')+'reference angle '+M.fmt(ref,6)+'°).');
    tiles(vals.slice(1).map(function(x){return [x[0],fmt(x[1],dp)+(x[2]&&x[2]!=='undefined'?'  ('+x[2]+')':''),x[2]==='undefined'||!isFinite(x[1])?'undefined at this angle':'']}).concat([['Reference angle',M.fmt(ref,8)+'°','acute angle to the x-axis'],['Quadrant',quad,'signs: sin '+(sn>0?'+':sn<0?'−':'0')+', cos '+(cs>0?'+':cs<0?'−':'0')],['Coterminal angles',M.fmt(deg-360,6)+'°, '+M.fmt(deg+360,6)+'°','θ ± 360°'],['Identity check',M.fmt(sn*sn+cs*cs,10),'sin² + cos² = 1']]));
    circle(th,{label:M.fmt(deg,4)+'°'});C.text('vizH','Unit circle');C.text('vizNote','The point (cos θ, sin θ) on the circle of radius 1; the dashed line is tan θ.');C.text('vizTag','θ = '+M.fmt(deg,4)+'°');
    st('Convert to radians and degrees','Trig functions are evaluated on radians.','θ = '+esc(M.fmt(pa.v,8)+SYM[u])+' → <b>'+esc(M.fmt(th,10))+' rad</b> = <b>'+esc(M.fmt(deg,8))+'°</b>');
    st('Locate on the unit circle','Reduce to 0°–360°, then find the reference angle.','θ mod 360° = '+esc(M.fmt(rounded,8))+'° → '+quad+', reference angle <b>'+esc(M.fmt(ref,8))+'°</b>');
    st('Evaluate sine and cosine','The coordinates of the point on the circle.','sin θ = <b>'+f(sn)+'</b>'+(vals[0][2]?' = '+esc(vals[0][2]):'')+'<br>cos θ = <b>'+f(cs)+'</b>'+(vals[1][2]?' = '+esc(vals[1][2]):''));
    st('Derive the other four','Quotients and reciprocals.','tan θ = sin ÷ cos = <b>'+f(tn)+'</b>;  csc = 1/sin = <b>'+f(cc)+'</b><br>sec = 1/cos = <b>'+f(sc)+'</b>;  cot = cos ÷ sin = <b>'+f(ct)+'</b>');
    last='Trigonometry — calculatepilot.com/math/trigonometry-calculator.html\nθ = '+M.fmt(deg,8)+'° ('+M.fmt(th,8)+' rad)\n'+vals.map(function(x){return x[0]+' = '+fmt(x[1],dp)+(x[2]&&x[2]!=='undefined'?' ('+x[2]+')':'');}).join('\n');
    C.text('stepsIntro','All six functions of '+M.fmt(deg,6)+'°.');C.text('stepsTag','unit circle');
  }else if(m==='s2'){
    var fn=$('fn').value,x=v('iv'),dom={asin:'−1 to 1',acos:'−1 to 1',atan:'any real number',acsc:'|x| ≥ 1',asec:'|x| ≥ 1',acot:'any real number'}[fn];C.text('ivH',dom);
    if($('iv').value==='')return fail('Enter a value.');
    if((fn==='asin'||fn==='acos')&&Math.abs(x)>1)return fail('The value must be between −1 and 1 for '+(fn==='asin'?'arcsin':'arccos')+'.');if((fn==='acsc'||fn==='asec')&&Math.abs(x)<1)return fail('The magnitude of the value must be at least 1 for '+(fn==='acsc'?'arccsc':'arcsec')+'.');
    var a={asin:Math.asin(x),acos:Math.acos(x),atan:Math.atan(x),acsc:Math.asin(1/x),asec:Math.acos(1/x),acot:x===0?PI/2:(x>0?Math.atan(1/x):Math.atan(1/x)+PI)}[fn],ad=a*180/PI;
    var base=fn==='asin'||fn==='acsc'?'sin':fn==='acos'||fn==='asec'?'cos':'tan',sols=[];
    if(base==='sin'){sols=[ad,180-ad];}else if(base==='cos'){sols=[ad,360-ad];}else{sols=[ad,ad+180];}
    sols=sols.map(function(d){return ((d%360)+360)%360;}).filter(function(d,i,arr){return arr.findIndex(function(e){return Math.abs(e-d)<1e-9;})===i;}).sort(function(p,q){return p-q;});
    var nm={asin:'arcsin',acos:'arccos',atan:'arctan',acsc:'arccsc',asec:'arcsec',acot:'arccot'}[fn];
    C.text('heroLbl',nm+'('+M.fmt(x,6)+') — principal value');C.text('resultValue',M.fmt(cl(ad),dp)+'°');C.text('ex1L','Radians');C.text('ex1',M.fmt(cl(a),dp)+' rad'+(piTxt(a)?' = '+piTxt(a):''));C.text('ex2L','Gradians');C.text('ex2',M.fmt(cl(a*200/PI),dp)+' grad');
    tg.textContent=piTxt(a)&&Math.abs(a/PI*12-Math.round(a/PI*12))<1e-9?'Special angle':'Principal value';C.text('fxNow',nm+'(x) = θ  ⇔  '+(base==='sin'?(fn==='asin'?'sin':'csc'):base==='cos'?(fn==='acos'?'cos':'sec'):(fn==='atan'?'tan':'cot'))+' θ = x');
    C.text('interp',nm+'('+M.fmt(x,6)+') = '+M.fmt(cl(ad),8)+'°. Because trig functions repeat, other angles give the same value.');
    tiles([['Principal value',M.fmt(cl(ad),dp)+'°',{asin:'−90° to 90°',acos:'0° to 180°',atan:'−90° to 90°',acsc:'−90° to 90°, not 0',asec:'0° to 180°, not 90°',acot:'0° to 180°'}[fn]],['In radians',M.fmt(cl(a),dp),piTxt(a)||''],['In gradians',M.fmt(cl(a*200/PI),dp),''],['Solutions in [0°, 360°)',sols.map(function(d){return M.fmt(cl(d),dp)+'°';}).join(', '),'all angles with the same value'],['General solution',base==='tan'?'θ = '+M.fmt(cl(ad),6)+'° + 180°·k':base==='sin'?'θ = '+M.fmt(cl(ad),6)+'° + 360°k or '+M.fmt(cl(180-ad),6)+'° + 360°k':'θ = ±'+M.fmt(cl(ad),6)+'° + 360°k','k any integer']]);
    circle(a,{label:M.fmt(cl(ad),4)+'°'});C.text('vizH','The angle on the unit circle');C.text('vizNote','The principal value marked on the circle of radius 1.');C.text('vizTag',M.fmt(cl(ad),4)+'°');
    st('Set up the equation','Find the angle whose '+(base==='sin'?'sine':base==='cos'?'cosine':'tangent')+' equals the value.',(fn==='acsc'||fn==='asec'||fn==='acot'?'Use the reciprocal identity: '+nm+'(x) = '+{acsc:'arcsin(1/x)',asec:'arccos(1/x)',acot:'arctan(1/x) (adjusted to 0°–180°)'}[fn]+'<br>':'')+esc(nm)+'('+f(x)+')');
    st('Principal value','The unique angle in the standard range.','θ = <b>'+f(ad)+'°</b> = '+f(a)+' rad'+(piTxt(a)?' = <b>'+esc(piTxt(a))+'</b>':''));
    st('All angles in one turn','Use symmetry of the circle.',base==='sin'?'θ and 180° − θ':base==='cos'?'θ and 360° − θ':'θ and θ + 180°');
    last='Inverse trig — calculatepilot.com/math/trigonometry-calculator.html\n'+nm+'('+M.fmt(x,8)+') = '+M.fmt(cl(ad),8)+'° = '+M.fmt(cl(a),8)+' rad\nAll solutions in [0°, 360°): '+sols.map(function(d){return M.fmt(cl(d),6)+'°';}).join(', ');
    C.text('stepsIntro','Inverse trigonometric function.');C.text('stepsTag',nm);
  }else if(m==='s3'){
    var x3=v('hx');if($('hx').value==='')return fail('Enter x.');if(Math.abs(x3)>700)return fail('Use |x| ≤ 700 to avoid overflow.');
    var e1=Math.exp(x3),e2=Math.exp(-x3),sh=(e1-e2)/2,ch=(e1+e2)/2,th3=Math.tanh(x3),csh=Math.abs(sh)<EPS?NaN:1/sh,sch=1/ch,cth=Math.abs(sh)<EPS?NaN:ch/sh;
    C.text('heroLbl','sinh x');C.text('resultValue',fmt(sh,dp));C.text('ex1L','cosh x');C.text('ex1',fmt(ch,dp));C.text('ex2L','tanh x');C.text('ex2',fmt(th3,dp));tg.textContent='Hyperbolic';C.text('fxNow','sinh x = (eˣ − e⁻ˣ)/2,  cosh x = (eˣ + e⁻ˣ)/2');
    C.text('interp','At x = '+M.fmt(x3,8)+': eˣ = '+M.fmt(e1,8)+', e⁻ˣ = '+M.fmt(e2,8)+'.');
    tiles([['csch x',fmt(csh,dp),'1 ÷ sinh x'],['sech x',fmt(sch,dp),'1 ÷ cosh x'],['coth x',fmt(cth,dp),'cosh x ÷ sinh x'],['eˣ',fmt(e1,dp),'exponential'],['cosh²x − sinh²x',M.fmt(ch*ch-sh*sh,8),'always 1 (for moderate x)']]);
    st('Exponentials','Hyperbolic functions are built from eˣ.','eˣ = '+f(e1)+',  e⁻ˣ = '+f(e2));st('sinh and cosh','','sinh x = (eˣ − e⁻ˣ) ÷ 2 = <b>'+f(sh)+'</b><br>cosh x = (eˣ + e⁻ˣ) ÷ 2 = <b>'+f(ch)+'</b>');st('The others','','tanh = sinh ÷ cosh = <b>'+f(th3)+'</b>;  csch = <b>'+f(csh)+'</b>;  sech = <b>'+f(sch)+'</b>;  coth = <b>'+f(cth)+'</b>');
    last='Hyperbolic — calculatepilot.com/math/trigonometry-calculator.html\nx = '+M.fmt(x3,8)+'\nsinh = '+M.fmt(sh,10)+'\ncosh = '+M.fmt(ch,10)+'\ntanh = '+M.fmt(th3,10);C.text('stepsIntro','Hyperbolic functions of '+M.fmt(x3,6)+'.');C.text('stepsTag','sinh · cosh · tanh');$('viz').innerHTML='';
  }else{
    var rk=$('rk').value;$('fRA').hidden=rk!=='as';$('fRS').hidden=rk!=='as';$('fR2').hidden=rk==='as';
    var r1=v('r1'),r2=v('r2'),A,o,ad2,hy;
    C.text('r1L',rk==='as'?'Length of that side':rk==='oa'?'Opposite side':rk==='oh'?'Opposite side':'Adjacent side');C.text('r2L',rk==='oa'?'Adjacent side':'Hypotenuse');
    if(!(r1>0))return fail('Side lengths must be greater than 0.');
    if(rk==='as'){A=v('rA');if(!(A>0&&A<90))return fail('Angle A must be strictly between 0° and 90°.');var ar=A*PI/180,sd=$('rs').value;if(sd==='o'){o=r1;hy=o/Math.sin(ar);ad2=o/Math.tan(ar);}else if(sd==='a'){ad2=r1;o=ad2*Math.tan(ar);hy=ad2/Math.cos(ar);}else{hy=r1;o=hy*Math.sin(ar);ad2=hy*Math.cos(ar);}
      st('Choose the ratio that links the known side to the others','SOH-CAH-TOA.','sin A = opp ÷ hyp,  cos A = adj ÷ hyp,  tan A = opp ÷ adj');st('Solve for the other sides','','opposite = <b>'+f(o)+'</b>,  adjacent = <b>'+f(ad2)+'</b>,  hypotenuse = <b>'+f(hy)+'</b>');}
    else{if(!(r2>0))return fail('Side lengths must be greater than 0.');if(rk==='oa'){o=r1;ad2=r2;hy=Math.hypot(o,ad2);}else if(rk==='oh'){o=r1;hy=r2;if(o>=hy)return fail('The hypotenuse must be longer than the opposite side.');ad2=Math.sqrt(hy*hy-o*o);}else{ad2=r1;hy=r2;if(ad2>=hy)return fail('The hypotenuse must be longer than the adjacent side.');o=Math.sqrt(hy*hy-ad2*ad2);}
      A=Math.atan2(o,ad2)*180/PI;st('Find the missing side','Pythagorean theorem.','opposite = <b>'+f(o)+'</b>,  adjacent = <b>'+f(ad2)+'</b>,  hypotenuse = <b>'+f(hy)+'</b>');st('Find the angle','A = arctan(opposite ÷ adjacent).','A = arctan('+f(o)+' ÷ '+f(ad2)+') = <b>'+f(A)+'°</b>');}
    var B=90-A;
    C.text('heroLbl','Angle A');C.text('resultValue',M.fmt(A,dp)+'°');C.text('ex1L','Angle B');C.text('ex1',M.fmt(B,dp)+'°');C.text('ex2L','Hypotenuse');C.text('ex2',M.fmt(hy,dp));tg.textContent='Right triangle';C.text('fxNow','sin A = opp ÷ hyp,  cos A = adj ÷ hyp,  tan A = opp ÷ adj');
    C.text('interp','Opposite '+M.fmt(o,6)+', adjacent '+M.fmt(ad2,6)+', hypotenuse '+M.fmt(hy,6)+'; angles '+M.fmt(A,6)+'°, '+M.fmt(B,6)+'° and 90°.');
    tiles([['Opposite (to A)',M.fmt(o,dp),'side a'],['Adjacent (to A)',M.fmt(ad2,dp),'side b'],['Hypotenuse',M.fmt(hy,dp),'side c'],['sin A · cos A · tan A',M.fmt(o/hy,5)+' · '+M.fmt(ad2/hy,5)+' · '+M.fmt(o/ad2,5),'ratios'],['Area',M.fmt(o*ad2/2,dp),'½ × opp × adj'],['Perimeter',M.fmt(o+ad2+hy,dp),'sum of sides']]);
    tri(A,o,ad2,hy);C.text('vizH','Your right triangle');C.text('vizNote','Drawn to scale from the solved sides.');C.text('vizTag','A = '+M.fmt(A,4)+'°');
    last='Right triangle — calculatepilot.com/math/trigonometry-calculator.html\nopposite = '+M.fmt(o,8)+', adjacent = '+M.fmt(ad2,8)+', hypotenuse = '+M.fmt(hy,8)+'\nA = '+M.fmt(A,8)+'°, B = '+M.fmt(B,8)+'°';C.text('stepsIntro','Solving a right triangle with SOH-CAH-TOA.');C.text('stepsTag','SOH-CAH-TOA');
  }
  $('steps').innerHTML=h;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('ang').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'trgCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-a]');if(!b)return;var deg=+b.getAttribute('data-a'),u=$('au').value;$('ang').value=String(+(deg/180*(u==='deg'?180:u==='rad'?PI:200)).toPrecision(12));fire();});
  document.querySelector('#trgCalc [data-action=reset]').addEventListener('click',function(){prevAu='deg';});
  $('au').addEventListener('input',function(){});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
