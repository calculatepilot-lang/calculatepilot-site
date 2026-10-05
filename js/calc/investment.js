/* Investment calculator — CalculatePilot (Stitch 1:1 redesign).
   Monthly simulation: growth rate g = (1 + r/m)^(m/12) − 1, reduced by tax drag; contributions at the end of each
   month (or year), optionally +3% a year. Real value = balance ÷ (1 + inflation)^years. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('en-US');}
function K(x){return x>=1e6?'$'+(Math.round(x/1e4)/100)+'M':x>=1000?'$'+Math.round(x/1000)+'k':M(x);}

function inputs(){return {p0:Math.max(0,v('p0')),c:Math.max(0,v('c')),cf:+$('cf').value,esc:$('esc').checked,n:Math.max(1,Math.round(v('n'))),r:v('r'),m:Math.max(1,v('m')),inf:$('infOn').checked?Math.max(0,v('inf')):0,tax:Math.max(0,v('tax'))};}

function sim(o,years){
  var g=(Math.pow(1+o.r/100/o.m,o.m/12)-1)*(1-o.tax/100),b=o.p0,prin=o.p0,cum=0,rows=[];
  for(var y=1;y<=years;y++){var cy=o.c*(o.esc?Math.pow(1.03,y-1):1),st=b,gr=0,ct=0;
    for(var mo=1;mo<=12;mo++){var e=b*g;b+=e;gr+=e;if(o.cf===12){b+=cy;ct+=cy;}}
    if(o.cf===1){b+=cy;ct+=cy;}
    prin+=ct;cum+=gr;rows.push({y:y,start:st,contrib:ct,growth:gr,cum:cum,end:b,prin:prin,real:b/Math.pow(1+o.inf/100,y)});}
  return rows;
}

function chart(o,rows,inf){
  var W=520,H=220,L=50,R=12,T=14,B=26,w=W-L-R,h=H-T-B,n=rows.length,mx=Math.max(rows[n-1].end,rows[n-1].prin)*1.06||1;
  function X(y){return L+y/n*w;}function Y(x){return T+h-x/mx*h;}
  var s='';[0,.25,.5,.75,1].forEach(function(f){s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(mx*f)+'" y2="'+Y(mx*f)+'" stroke="currentColor" stroke-opacity=".07"/><text x="'+(L-6)+'" y="'+(Y(mx*f)+3)+'" text-anchor="end" font-size="9" fill="#94a3b8">'+K(mx*f)+'</text>';});
  var tw=[[0,o.p0]].concat(rows.map(function(r){return [r.y,r.end];})),pr=[[0,o.p0]].concat(rows.map(function(r){return [r.y,r.prin];}));
  function line(a){return a.map(function(p){return X(p[0]).toFixed(1)+','+Y(p[1]).toFixed(1);}).join(' ');}
  s+='<polygon points="'+X(0)+','+Y(0)+' '+line(tw)+' '+X(n)+','+Y(0)+'" fill="var(--sx-pc)" fill-opacity=".1"/>';
  s+='<polyline points="'+line(pr)+'" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="5 4"/><polyline points="'+line(tw)+'" fill="none" stroke="var(--sx-primary)" stroke-width="2.5"/>';
  s+='<circle cx="'+X(0)+'" cy="'+Y(o.p0)+'" r="4" fill="var(--sx-primary)"/><circle cx="'+X(n)+'" cy="'+Y(rows[n-1].end)+'" r="4" fill="var(--sx-primary)"/>';
  if(inf){var ie=rows[inf-1].end,x=X(inf),y=Y(ie);s+='<circle cx="'+x+'" cy="'+y+'" r="4" fill="var(--sx-primary)" stroke="#fff" stroke-width="1.5"/><line x1="'+x+'" x2="'+x+'" y1="'+(y-8)+'" y2="'+(y-26)+'" stroke="var(--sx-primary)"/><rect x="'+(x-58)+'" y="'+(y-44)+'" width="116" height="18" rx="4" fill="var(--sx-primary)"/><text x="'+x+'" y="'+(y-31)+'" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">Year '+inf+' Inflection Point</text>';}
  [[0,'Start ('+K(o.p0)+')'],[Math.round(n/2),'Yr '+Math.round(n/2)],[n,'Yr '+n+' ('+K(rows[n-1].end)+')']].forEach(function(t,j){s+='<text x="'+X(t[0])+'" y="'+(H-8)+'" text-anchor="'+(j===0?'start':j===2?'end':'middle')+'" font-size="9" fill="#94a3b8"'+(j===2?' font-weight="700"':'')+'>'+t[1]+'</text>';});
  $('chart').innerHTML=s;
}

function compute(){
  var o=inputs(),rows=sim(o,o.n),L=rows[o.n-1],fv=L.end,prin=L.prin,earn=fv-prin;last={o:o,rows:rows};
  C.text('p0Out',M(o.p0));C.text('cOut',M(o.c)+(o.cf===12?' / month':' / year'));C.text('nOut',o.n+' Years');C.text('rOut',o.r.toFixed(2)+'%');
  C.text('heroK','Projected Portfolio Value (Year '+o.n+')');C.text('resultValue',M(fv));
  C.text('gTxt',(earn>=0?'+':'−')+M(Math.abs(earn))+' Total Investment Growth ('+(prin>0?(earn>=0?'+':'')+(earn/prin*100).toFixed(0)+'% on principal':'—')+')');
  C.text('prin',M(prin));C.text('prinN',K(o.p0)+' + '+K(prin-o.p0)+' contributed');C.text('earn',M(earn));C.text('earnN',(fv>0?(earn/fv*100).toFixed(1):'0')+'% of total wealth');
  C.text('real',M(L.real));C.text('realN',o.inf?'In today\'s dollars at '+o.inf+'% inflation':'Inflation adjustment off');C.text('inc',M(fv*0.04/12)+' / mo');
  var inf=0;for(var k=0;k<rows.length;k++){if(rows[k].growth>rows[k].contrib&&rows[k].contrib>0){inf=rows[k].y;break;}}
  C.text('trSub',inf?'Yearly growth exceeds your yearly contributions from Year '+inf+'.':'Contributions still exceed yearly growth over this horizon.');chart(o,rows,inf);
  var ext=sim(o,60),ms=[100000,250000,500000,1000000].filter(function(t){return t>o.p0;}).slice(0,3),ord=['1st','2nd','3rd'];
  $('ms').innerHTML=ms.map(function(t,j){var hit=null;for(var k=0;k<ext.length;k++)if(ext[k].end>=t){hit=ext[k].y;break;}var fut=!hit||hit>o.n;
    return '<div class="'+(fut?'fut':'')+'"><em>'+ord[j]+'</em><div><b>'+K(t)+' Milestone</b><span>'+(hit?(fut?'Projected at Year ':'Crossed at Year ')+hit:'Not reached in 60 years')+'</span></div></div>';}).join('');
  C.text('realH','Real Value ('+o.inf+'% Inflation)');
  var ys=[1,3,5,10,15,20,25,30,40,50].filter(function(y){return y<o.n;});ys.push(o.n);
  $('tbl').innerHTML=rows.filter(function(r){return ys.indexOf(r.y)>=0;}).map(function(r){var t=r.y===o.n,mid=!t&&r.y===10;
    return '<tr'+(t?' class="hl"':'')+'><td>Year '+r.y+(t?'<span class="tag t">Terminal</span>':mid?'<span class="tag">Milestone</span>':'')+'</td><td>'+M(r.start)+'</td><td>'+M(r.contrib)+'</td><td class="g">'+M(r.growth)+'</td><td>'+M(r.cum)+'</td><td class="b"'+(t?' style="font-size:15px;color:var(--sx-primary)"':'')+'>'+M(r.end)+'</td><td class="mu">'+M(r.real)+'</td></tr>';}).join('');
  var ea=o.r/100,dbl=ea>0?Math.log(2)/Math.log(1+ea):Infinity;
  C.text('r72',o.r>0?'The Rule of 72 is a quick approximation for doubling time: divide 72 by your annual return. At '+o.r.toFixed(2)+'%, money doubles roughly every '+(72/o.r).toFixed(2)+' years (the exact figure is '+dbl.toFixed(2)+' years). With regular contributions on top, growth accelerates further.':'With a zero or negative return, your balance only grows through contributions.');
  C.text('r72t',inf?'By Year '+inf+', yearly growth ('+M(rows[inf-1].growth)+') overtakes your yearly contributions ('+M(rows[inf-1].contrib)+').':'Over this horizon, contributions still outweigh yearly growth — a longer horizon lets compounding take over.');
  var late=o.n>5?sim(o,o.n-5)[o.n-6].end:0;
  C.text('wait','At '+o.inf+'% inflation, a nominal '+M(fv)+' balance is worth about '+M(L.real)+' in today\'s money.'+(o.n>5?' Waiting just 5 years to start (a '+(o.n-5)+'-year horizon) would leave you with '+M(late)+' — '+M(fv-late)+' less.':''));
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ivCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('investment-ledger.csv',[{h:'Year',key:'y'},{h:'Starting Balance',key:'start'},{h:'Contributions',key:'contrib'},{h:'Growth',key:'growth'},{h:'Ending Balance',key:'end'},{h:'Real Value',key:'real'}],last.rows.map(function(r){return {y:r.y,start:Math.round(r.start),contrib:Math.round(r.contrib),growth:Math.round(r.growth),end:Math.round(r.end),real:Math.round(r.real)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpInvestment={sim:sim};
})();
