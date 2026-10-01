/* CalculatePilot shared calculator UI kit (pairs with css/cp-calc.css).
   Pages call CPX.init({root, compute}) and render with the helpers below. */
(function(){
var CPX={};
var C_esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
var $=function(id){return document.getElementById(id);};
CPX.$=$;
var LOC=({es:'es-ES',fr:'fr-FR',de:'de-DE'})[document.documentElement.lang]||'en-US';CPX.locale=LOC;

CPX.val=function(id){var el=$(id);if(!el)return 0;var t=String(el.value);if(LOC!=='en-US'&&/^\s*-?\d+,\d+\s*$/.test(t))t=t.replace(',','.');else t=t.replace(/,/g,'');var v=parseFloat(t);return isFinite(v)?v:0;};
CPX.set=function(id,v){var el=$(id);if(el)el.value=v;};
CPX.text=function(id,t){var el=$(id);if(el)el.textContent=t;};
CPX.html=function(id,h){var el=$(id);if(el)el.innerHTML=h;};
CPX.money=function(v,dp){dp=dp===undefined?0:dp;if(!isFinite(v))return '—';if(typeof cpFormatMoney==='function'){var s=cpFormatMoney(Math.abs(v),{maximumFractionDigits:dp,minimumFractionDigits:dp});return (v<0?'−':'')+s;}return (v<0?'−$':'$')+Math.abs(v).toLocaleString('en-US',{maximumFractionDigits:dp,minimumFractionDigits:dp});};
CPX.symbol=function(){try{return (window.CP_CURRENCIES&&CP_CURRENCIES[cpGetCurrency()]||{symbol:'$'}).symbol;}catch(e){return '$';}};
CPX.num=function(v,dp){dp=dp===undefined?0:dp;if(!isFinite(v))return '—';return v.toLocaleString(LOC,{maximumFractionDigits:dp,minimumFractionDigits:dp});};
CPX.pct=function(v,dp){dp=dp===undefined?1:dp;if(!isFinite(v))return '—';return v.toFixed(dp)+'%';};
CPX.short=function(v){var a=Math.abs(v),s=v<0?'−':'';var sym=CPX.symbol();if(a>=1e9)return s+sym+(a/1e9).toFixed(1)+'B';if(a>=1e6)return s+sym+(a/1e6).toFixed(a>=1e7?1:2)+'M';if(a>=1e4)return s+sym+Math.round(a/1e3)+'k';return s+sym+Math.round(a).toLocaleString(LOC);};
CPX.esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};

function fire(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
function syncPressed(root){
  root.querySelectorAll('[data-for][data-value]').forEach(function(b){var t=$(b.getAttribute('data-for'));if(!t)return;b.setAttribute('aria-pressed',String(parseFloat(t.value)===parseFloat(b.getAttribute('data-value'))||t.value===b.getAttribute('data-value')));});
  root.querySelectorAll('input[type=range][data-sync]').forEach(function(r){var t=$(r.getAttribute('data-sync'));if(t&&document.activeElement!==r)r.value=t.value;fill(r);});
}
function fill(r){var min=parseFloat(r.min)||0,max=parseFloat(r.max)||100,v=parseFloat(r.value)||0;r.style.setProperty('--fill',Math.max(0,Math.min(100,(v-min)/(max-min)*100))+'%');}

/* URL state: ?principal=1000&years=10 restores inputs, share copies current state */
function readQuery(root){try{var q=new URLSearchParams(location.search);q.forEach(function(v,k){var el=$(k);if(el&&root.contains(el)&&(el.tagName==='INPUT'||el.tagName==='SELECT')){if(el.type==='checkbox')el.checked=v==='1';else el.value=v;}});}catch(e){}}
CPX.shareUrl=function(root){var q=new URLSearchParams();root.querySelectorAll('input[id],select[id]').forEach(function(el){if(el.type==='range'&&el.hasAttribute('data-sync'))return;if(el.classList.contains('cp-currency-select'))return;q.set(el.id,el.type==='checkbox'?(el.checked?'1':'0'):el.value);});return location.origin+location.pathname+'?'+q.toString();};
function flash(btn,msg){if(!btn)return;var old=btn.getAttribute('data-label')||btn.innerHTML;btn.setAttribute('data-label',old);btn.textContent=msg;setTimeout(function(){btn.innerHTML=old;},1600);}
CPX.copy=function(text,btn){function done(){flash(btn,'Copied');}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){prompt('Copy this:',text);});}else{prompt('Copy this:',text);}};

CPX.init=function(opts){
  var root=typeof opts.root==='string'?$(opts.root):opts.root;if(!root)return;
  var compute=opts.compute;var defaults={};
  root.querySelectorAll('input[id],select[id]').forEach(function(el){defaults[el.id]=el.type==='checkbox'?el.checked:el.value;});
  readQuery(root);
  var raf=0;function run(){cancelAnimationFrame(raf);raf=requestAnimationFrame(function(){syncPressed(root);try{compute();}catch(e){if(window.console)console.error(e);}});}
  root.addEventListener('input',function(e){var t=e.target;if(t.matches('input[type=range][data-sync]')){var tgt=$(t.getAttribute('data-sync'));if(tgt){tgt.value=t.value;}fill(t);}run();});
  root.addEventListener('change',run);
  root.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b||!root.contains(b))return;
    if(b.hasAttribute('data-step')){var t=$(b.getAttribute('data-for'));if(!t)return;var st=parseFloat(b.getAttribute('data-step'))||1,mn=t.min!==''?parseFloat(t.min):-Infinity,mx=t.max!==''?parseFloat(t.max):Infinity;var dp=(String(st).split('.')[1]||'').length;t.value=Math.max(mn,Math.min(mx,(parseFloat(t.value)||0)+st)).toFixed(dp);fire(t);e.preventDefault();return;}
    if(b.hasAttribute('data-for')&&b.hasAttribute('data-value')){var t2=$(b.getAttribute('data-for'));if(t2){t2.value=b.getAttribute('data-value');fire(t2);}e.preventDefault();return;}
    var act=b.getAttribute('data-action');
    if(act==='reset'){Object.keys(defaults).forEach(function(k){var el=$(k);if(!el)return;if(el.type==='checkbox')el.checked=defaults[k];else el.value=defaults[k];});try{history.replaceState(null,'',location.pathname);}catch(er){}run();e.preventDefault();}
    else if(act==='share'){CPX.copy(CPX.shareUrl(root),b);e.preventDefault();}
    else if(act==='print'){window.print();e.preventDefault();}
    else if(act==='copy'){var src=$(b.getAttribute('data-target'));if(src)CPX.copy(src.innerText.trim(),b);e.preventDefault();}
  });
  var form=root.tagName==='FORM'?root:root.querySelector('form');if(form)form.addEventListener('submit',function(e){e.preventDefault();run();});
  /* currency selector already re-dispatches input on #calcForm; also listen globally */
  document.querySelectorAll('.cp-currency-select').forEach(function(s){s.addEventListener('change',function(){setTimeout(run,0);});});
  root.querySelectorAll('input[type=range]').forEach(fill);
  /* sticky mobile dock mirroring the primary result */
  var res=$(opts.result||'resultValue'),card=res&&res.closest('.cpx-card');
  if(res&&card&&'IntersectionObserver' in window){
    var dock=document.createElement('button');dock.type='button';dock.className='cpx-dock';dock.setAttribute('aria-hidden','true');dock.tabIndex=-1;
    dock.innerHTML='<span><small>'+C_esc(opts.dockLabel||(card.querySelector('.cpx-kicker')||{}).textContent||'Result')+'</small><b></b></span><span>View details ↑</span>';
    document.body.appendChild(dock);dock.addEventListener('click',function(){card.scrollIntoView({behavior:'smooth',block:'start'});});
    var inView=true,formSeen=false;var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.target===card)inView=e.isIntersecting;else formSeen=e.isIntersecting;});dock.querySelector('b').textContent=res.textContent;dock.classList.toggle('show',!inView&&formSeen);},{threshold:0.05});
    io.observe(card);var f=root.querySelector('form');if(f)io.observe(f);
    var orig=run;run=function(){orig();setTimeout(function(){dock.querySelector('b').textContent=res.textContent;},80);};
  }
  var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){document.querySelectorAll('.cpx-chart').forEach(function(c){if(c._cfg)CPX.chart(c,c._cfg);});},150);});
  run();
  return {run:run};
};

/* Segmented control bound to a hidden input: <div class="cpx-seg" data-bind="freq"><button data-for="freq" data-value="12">Monthly</button>... */

/* SVG chart: series [{name,values,color,fill:true,dash:false}], labels [] */
CPX.chart=function(el,cfg){
  el=typeof el==='string'?$(el):el;if(!el)return;
  var W=Math.max(300,Math.round(el.clientWidth||640)),H=cfg.height||(W<480?220:250),P={l:52,r:12,t:12,b:26};el._cfg=cfg;var n=0,max=0,min=0;
  cfg.series.forEach(function(s){n=Math.max(n,s.values.length);s.values.forEach(function(v){if(v>max)max=v;if(v<min)min=v;});});
  if(n<2){el.innerHTML='';return;}
  if(cfg.type==='bar'){return barChart(el,cfg,W,H,P,n,max,min);}
  var span=(max-min)||1;var nice=niceStep(span/4);max=Math.ceil(max/nice)*nice;min=Math.floor(min/nice)*nice;span=(max-min)||1;
  var fx=function(i){return P.l+i*(W-P.l-P.r)/(n-1);},fy=function(v){return P.t+(max-v)*(H-P.t-P.b)/span;};
  var fmt=cfg.fmt||CPX.short;var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+CPX.esc(cfg.label||'Chart')+'">';
  s+='<defs>';cfg.series.forEach(function(se,k){s+='<linearGradient id="cpxg'+k+el.id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+se.color+'" stop-opacity=".28"/><stop offset="1" stop-color="'+se.color+'" stop-opacity="0"/></linearGradient>';});s+='</defs>';
  for(var g=min;g<=max+1e-9;g+=nice){var y=fy(g);s+='<line class="grid" x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+y+'" y2="'+y+'"/><text class="ax" x="'+(P.l-6)+'" y="'+(y+3)+'" text-anchor="end">'+CPX.esc(fmt(g))+'</text>';}
  var labels=cfg.labels||[];var every=Math.max(1,Math.ceil(n/6));
  for(var i=0;i<n;i+=every){s+='<text class="ax" x="'+fx(i)+'" y="'+(H-6)+'" text-anchor="middle">'+CPX.esc(labels[i]!==undefined?labels[i]:i)+'</text>';}
  if((n-1)%every)s+='<text class="ax" x="'+fx(n-1)+'" y="'+(H-6)+'" text-anchor="end">'+CPX.esc(labels[n-1]!==undefined?labels[n-1]:n-1)+'</text>';
  cfg.series.forEach(function(se,k){var d='';se.values.forEach(function(v,i){d+=(i?'L':'M')+fx(i).toFixed(1)+' '+fy(v).toFixed(1);});
    if(se.fill)s+='<path d="'+d+'L'+fx(se.values.length-1)+' '+fy(Math.max(min,0))+'L'+fx(0)+' '+fy(Math.max(min,0))+'Z" fill="url(#cpxg'+k+el.id+')"/>';
    s+='<path d="'+d+'" fill="none" stroke="'+se.color+'" stroke-width="'+(se.width||2.5)+'" '+(se.dash?'stroke-dasharray="6 5"':'')+' stroke-linecap="round" stroke-linejoin="round"/>';
    var last=se.values.length-1;if(!se.dash)s+='<circle cx="'+fx(last)+'" cy="'+fy(se.values[last])+'" r="4" fill="'+se.color+'"/>';});
  s+='<line id="'+el.id+'-cur" x1="0" x2="0" y1="'+P.t+'" y2="'+(H-P.b)+'" stroke="var(--slate)" stroke-width="1" opacity="0"/>';
  s+='<rect x="'+P.l+'" y="'+P.t+'" width="'+(W-P.l-P.r)+'" height="'+(H-P.t-P.b)+'" fill="transparent" data-hit="1"/></svg><div class="cpx-tip"></div>';
  el.innerHTML=s;
  var svg=el.querySelector('svg'),tip=el.querySelector('.cpx-tip'),cur=el.querySelector('#'+el.id+'-cur');
  function move(ev){var r=svg.getBoundingClientRect();var cx=(ev.touches?ev.touches[0].clientX:ev.clientX)-r.left;var x=cx*W/r.width;var i=Math.round((x-P.l)/(W-P.l-P.r)*(n-1));i=Math.max(0,Math.min(n-1,i));
    var h='<b>'+CPX.esc(cfg.tipLabel?cfg.tipLabel(i):(labels[i]!==undefined?labels[i]:i))+'</b>';cfg.series.forEach(function(se){if(se.values[i]!==undefined)h+=se.name+': '+CPX.esc((cfg.tipFmt||CPX.money)(se.values[i]))+'<br>';});
    tip.innerHTML=h;tip.style.left=(fx(i)*r.width/W)+'px';tip.style.top=(fy(cfg.series[0].values[i]||0)*r.height/H)+'px';tip.style.opacity=1;cur.setAttribute('x1',fx(i));cur.setAttribute('x2',fx(i));cur.setAttribute('opacity',.4);}
  function out(){tip.style.opacity=0;cur.setAttribute('opacity',0);}
  svg.addEventListener('mousemove',move);svg.addEventListener('touchmove',move,{passive:true});svg.addEventListener('mouseleave',out);svg.addEventListener('touchend',out);
};
function niceStep(x){if(x<=0)return 1;var p=Math.pow(10,Math.floor(Math.log10(x))),f=x/p;return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p;}
function barChart(el,cfg,W,H,P,n,max,min){
  /* stacked bars: every series stacks per index */
  var tot=[];for(var i=0;i<n;i++){var t=0;cfg.series.forEach(function(se){t+=Math.max(0,se.values[i]||0);});tot.push(t);}max=Math.max.apply(null,tot)||1;var nice=niceStep(max/4);max=Math.ceil(max/nice)*nice;
  var bw=(W-P.l-P.r)/n,fy=function(v){return P.t+(max-v)*(H-P.t-P.b)/max;},fmt=cfg.fmt||CPX.short,labels=cfg.labels||[];
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+CPX.esc(cfg.label||'Chart')+'">';
  for(var g=0;g<=max+1e-9;g+=nice){var y=fy(g);s+='<line class="grid" x1="'+P.l+'" x2="'+(W-P.r)+'" y1="'+y+'" y2="'+y+'"/><text class="ax" x="'+(P.l-6)+'" y="'+(y+3)+'" text-anchor="end">'+CPX.esc(fmt(g))+'</text>';}
  var every=Math.max(1,Math.ceil(n/8));
  for(var j=0;j<n;j++){var base=0,x=P.l+j*bw+bw*.15,w=bw*.7;cfg.series.forEach(function(se){var v=Math.max(0,se.values[j]||0);var y1=fy(base+v),y0=fy(base);s+='<rect x="'+x.toFixed(1)+'" y="'+y1.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+Math.max(0,y0-y1).toFixed(1)+'" rx="2" fill="'+se.color+'"><title>'+CPX.esc((labels[j]||j)+' · '+se.name+': '+(cfg.tipFmt||CPX.money)(se.values[j]||0))+'</title></rect>';base+=v;});
    if(j%every===0)s+='<text class="ax" x="'+(x+w/2)+'" y="'+(H-6)+'" text-anchor="middle">'+CPX.esc(labels[j]!==undefined?labels[j]:j)+'</text>';}
  el.innerHTML=s+'</svg>';
}

/* Donut: parts [{name,value,color}] */
CPX.donut=function(el,parts,center){el=typeof el==='string'?$(el):el;if(!el)return;var tot=parts.reduce(function(a,p){return a+Math.max(0,p.value);},0)||1;var R=54,C=2*Math.PI*R,off=0;var s='<svg viewBox="0 0 140 140" role="img" aria-label="Breakdown"><circle cx="70" cy="70" r="'+R+'" fill="none" stroke="var(--line)" stroke-width="16"/>';
  parts.forEach(function(p){var len=Math.max(0,p.value)/tot*C;s+='<circle cx="70" cy="70" r="'+R+'" fill="none" stroke="'+p.color+'" stroke-width="16" stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 70 70)"><title>'+CPX.esc(p.name)+'</title></circle>';off+=len;});
  if(center)s+='<text x="70" y="66" text-anchor="middle" style="font:700 15px var(--font-display);fill:var(--ink)">'+CPX.esc(center[0])+'</text><text x="70" y="84" text-anchor="middle" style="font:500 9px var(--font-body);fill:var(--slate)">'+CPX.esc(center[1]||'')+'</text>';
  el.innerHTML=s+'</svg>';};

/* Split bar: parts [{value,color}] into .cpx-split */
CPX.split=function(el,parts){el=typeof el==='string'?$(el):el;if(!el)return;var tot=parts.reduce(function(a,p){return a+Math.max(0,p.value);},0)||1;el.innerHTML=parts.map(function(p){return '<span style="width:'+(Math.max(0,p.value)/tot*100)+'%;background:'+p.color+'"></span>';}).join('');};

/* Table with "show all" + CSV export. cols [{h,key,fmt,cls}] */
CPX.table=function(el,cols,rows,opt){el=typeof el==='string'?$(el):el;if(!el)return;opt=opt||{};var limit=opt.limit||12;var expanded=el.getAttribute('data-expanded')==='1';
  var h='<div class="cpx-table-wrap"><table class="cpx-table"><thead><tr>'+cols.map(function(c){return '<th scope="col">'+CPX.esc(c.h)+'</th>';}).join('')+'</tr></thead><tbody>';
  rows.forEach(function(r,i){h+='<tr'+(!expanded&&i>=limit?' class="is-hidden"':'')+'>'+cols.map(function(c){var v=r[c.key];var cls=typeof c.cls==='function'?c.cls(v,r):(c.cls||'');return '<td'+(cls?' class="'+cls+'"':'')+'>'+CPX.esc(c.fmt?c.fmt(v,r):v)+'</td>';}).join('')+'</tr>';});
  h+='</tbody></table></div><div class="cpx-table-foot"><span>'+CPX.esc(opt.caption||('Showing '+(expanded?rows.length:Math.min(limit,rows.length))+' of '+rows.length+' rows'))+'</span><span style="display:flex;gap:8px">';
  if(rows.length>limit)h+='<button type="button" class="cpx-btn" data-t="more">'+(expanded?'Show fewer':'Show all '+rows.length)+'</button>';
  h+='<button type="button" class="cpx-btn" data-t="csv"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3"/></svg>Export CSV</button></span></div>';
  el.innerHTML=h;
  el.querySelector('[data-t=csv]').onclick=function(){CPX.csv(opt.file||'calculatepilot-schedule.csv',cols,rows);};
  var m=el.querySelector('[data-t=more]');if(m)m.onclick=function(){el.setAttribute('data-expanded',expanded?'0':'1');CPX.table(el,cols,rows,opt);};
};
CPX.csv=function(file,cols,rows){var q=function(v){v=String(v==null?'':v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
  var out=[cols.map(function(c){return q(c.h);}).join(',')].concat(rows.map(function(r){return cols.map(function(c){var v=r[c.key];return q(typeof v==='number'?(Math.round(v*100)/100):(c.fmt?c.fmt(v,r):v));}).join(',');})).join('\n');
  var blob=new Blob([out],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},100);};

/* Financial helpers */
CPX.fin={
  pmt:function(rate,n,pv){if(n<=0)return 0;if(rate===0)return pv/n;return pv*rate/(1-Math.pow(1+rate,-n));},
  pv:function(rate,n,pmt){if(rate===0)return pmt*n;return pmt*(1-Math.pow(1+rate,-n))/rate;},
  fv:function(rate,n,pv,pmt,due){if(rate===0)return pv+pmt*n;var g=Math.pow(1+rate,n);return pv*g+pmt*(g-1)/rate*(due?1+rate:1);},
  nper:function(rate,pmt,pv){if(pmt<=pv*rate)return Infinity;if(rate===0)return pv/pmt;return -Math.log(1-pv*rate/pmt)/Math.log(1+rate);},
  /* effective rate per payment period given nominal annual rate compounded m times/yr and p payments/yr */
  periodRate:function(annualPct,m,p){var r=annualPct/100;if(m===Infinity)return Math.exp(r/p)-1;return Math.pow(1+r/m,m/p)-1;},
  apy:function(annualPct,m){var r=annualPct/100;if(m===Infinity)return (Math.exp(r)-1)*100;return (Math.pow(1+r/m,m)-1)*100;}
};

/* Math helpers shared by the math calculators */
CPX.math={
  /* numbers separated by commas, spaces, semicolons or new lines */
  list:function(str){var out=[],bad=0;String(str||'').split(/[\s,;]+/).forEach(function(t){if(t==='')return;var n=Number(t.replace(/,/g,''));if(isFinite(n))out.push(n);else bad++;});out.bad=bad;return out;},
  /* trimmed decimal: fmt(1.50000,4) -> "1.5" ; big/small numbers fall back to exponent */
  fmt:function(x,dp){if(!isFinite(x))return '—';dp=dp===undefined?4:dp;if(x===0)return '0';var a=Math.abs(x);if(a>=1e12||a<1e-6)return x.toExponential(Math.min(dp,6)).replace(/\.?0+e/,'e');var s=x.toFixed(dp);if(s.indexOf('.')>-1)s=s.replace(/0+$/,'').replace(/\.$/,'');return s==='-0'?'0':s;},
  fix:function(x,dp){return isFinite(x)?(Math.abs(x)<0.5*Math.pow(10,-dp)?0:x).toFixed(dp):'—';},
  /* standard normal density */
  pdf:function(z){return Math.exp(-0.5*z*z)/Math.sqrt(2*Math.PI);},
  /* standard normal CDF: Maclaurin series near 0, continued fraction in the tails (about 1e-15 accurate) */
  cdf:function(z){if(z===Infinity)return 1;if(z===-Infinity)return 0;var a=Math.abs(z),p;
    if(a<3){var t=z,sum=z,n=0;while(Math.abs(t)>1e-17*Math.abs(sum)&&n<200){n++;t*=z*z/(2*n+1);sum+=t;}return 0.5+CPX.math.pdf(z)*sum;}
    var f=0;for(var k=80;k>=1;k--)f=k/(a+f);p=CPX.math.pdf(a)/(a+f);return z>0?1-p:p;},
  /* upper tail Q(z)=1-cdf(z) without cancellation */
  sf:function(z){return CPX.math.cdf(-z);},
  /* inverse standard normal (Acklam's rational start, Newton-polished) */
  inv:function(p){if(!(p>0&&p<1))return p===0?-Infinity:p===1?Infinity:NaN;
    var a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416],x,q,r;
    if(p<0.02425){q=Math.sqrt(-2*Math.log(p));x=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
    else if(p>1-0.02425){q=Math.sqrt(-2*Math.log(1-p));x=-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
    else{q=p-0.5;r=q*q;x=(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}
    for(var i=0;i<3;i++){var e=(x<0?CPX.math.cdf(x)-p:-(CPX.math.cdf(-x)-(1-p)))/CPX.math.pdf(x);x-=e/(1+x*e/2);}return x;},
  mean:function(a){var s=0;a.forEach(function(v){s+=v;});return s/a.length;},
  /* sum of squared deviations (two-pass, stable) */
  ss:function(a){var m=CPX.math.mean(a),s=0;a.forEach(function(v){s+=(v-m)*(v-m);});return s;}
  ,
  /* ln Γ(x), Lanczos (g=7, n=9) */
  gammaln:function(x){if(x<0.5)return Math.log(Math.PI/Math.abs(Math.sin(Math.PI*x)))-CPX.math.gammaln(1-x);x-=1;var c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7],a=c[0],t=x+7.5;for(var i=1;i<9;i++)a+=c[i]/(x+i);return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a);},
  /* regularized incomplete beta I_x(a,b), Lentz continued fraction */
  betai:function(x,a,b){if(x<=0)return 0;if(x>=1)return 1;var bt=Math.exp(CPX.math.gammaln(a+b)-CPX.math.gammaln(a)-CPX.math.gammaln(b)+a*Math.log(x)+b*Math.log(1-x));
    function cf(x,a,b){var qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap,m,aa,del,h;if(Math.abs(d)<1e-300)d=1e-300;d=1/d;h=d;for(m=1;m<=300;m++){var m2=2*m;aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;h*=d*c;aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<1e-300)d=1e-300;c=1+aa/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;del=d*c;h*=del;if(Math.abs(del-1)<1e-15)break;}return h;}
    return x<(a+1)/(a+b+2)?bt*cf(x,a,b)/a:1-bt*cf(1-x,b,a)/b;},
  /* Student t CDF and quantile */
  tcdf:function(t,df){var x=df/(df+t*t),p=0.5*CPX.math.betai(x,df/2,0.5);return t>0?1-p:p;},
  tinv:function(p,df){if(!(p>0&&p<1))return NaN;if(p===0.5)return 0;var lo=-1,hi=1;while(CPX.math.tcdf(lo,df)>p)lo*=2;while(CPX.math.tcdf(hi,df)<p)hi*=2;for(var i=0;i<200;i++){var mid=(lo+hi)/2;if(CPX.math.tcdf(mid,df)<p)lo=mid;else hi=mid;if(hi-lo<1e-13*Math.max(1,Math.abs(mid)))break;}return (lo+hi)/2;}
};

window.CPX=CPX;
/* Localised pages (es/fr/de): script-written numbers use ".", so show a decimal comma. Only text written by scripts is touched. */
(function(){
  if(LOC==='en-US'||!window.MutationObserver)return;
  var RE=/(\d)\.(\d{1,2})(?!\d)(?!\.\d)/g;
  function fix(n){var p=n.parentNode;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE)$/.test(p.nodeName)||(p.closest&&p.closest('[data-nol10n],#embedCode')))return;var t=n.nodeValue;if(t&&RE.test(t)){RE.lastIndex=0;n.nodeValue=t.replace(RE,'$1,$2');}RE.lastIndex=0;}
  function walk(node){if(node.nodeType===3){fix(node);return;}if(node.nodeType!==1||/^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(node.nodeName))return;var w=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),x;while((x=w.nextNode()))fix(x);}
  var obs=new MutationObserver(function(ms){obs.disconnect();ms.forEach(function(m){if(m.type==='characterData')fix(m.target);else m.addedNodes.forEach(walk);});obs.observe(document.body,{childList:true,subtree:true,characterData:true});});
  function start(){obs.observe(document.body,{childList:true,subtree:true,characterData:true});}
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
})();

})();
