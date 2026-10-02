/* CD vs HYSA calculator — CalculatePilot (Stitch 1:1 redesign).
   CD: balance_m = P × (1 + cdAPY)^(m/12). HYSA: APY_m = max(0, start − cut × (m−1)/12), balance grows by (1 + APY_m)^(1/12) each month.
   Early withdrawal penalty = P × cdAPY × days/365 (simple interest). CD "if broken" = CD balance − penalty.
   Monthly deposits go to savings in both strategies, so the comparison uses the initial deposit; totals add the deposits' HYSA growth. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';}
function P(x){return isFinite(x)?x.toFixed(2)+'%':'—';}

function compute(){
  var p=Math.max(0,v('p')),T=Math.max(1,Math.round(v('t'))),cd=Math.max(0,v('cd'))/100,hy=Math.max(0,v('hy'))/100,cut=Math.max(0,+$('path').value)/100,mc=Math.max(0,v('mc')),days=+$('pen').value;
  var pen=p*cd*days/365,rows=[],hb=p,cb2=0,apySum=0,be=null;
  for(var m=1;m<=T;m++){var a=Math.max(0,hy-cut*(m-1)/12);apySum+=a;hb*=Math.pow(1+a,1/12);cb2=cb2*Math.pow(1+a,1/12)+mc;
    var cb=p*Math.pow(1+cd,m/12),brk=m<T?cb-pen:cb;rows.push({m:m,cb:cb,a:a,hb:hb,adv:cb-hb,brk:brk});if(be===null&&m<T&&brk>=hb)be=m;}
  var L=rows[T-1],adv=L.cb-L.hb,cdWins=adv>=0,avg=apySum/T;
  C.text('tOut',T+' Monate');C.text('durT',T+' months');C.text('resultValue',(cdWins?'Festgeld +':'Tagesgeld +')+M(Math.abs(adv)));
  C.text('verdN',cdWins?'Die/Der '+P(cd*100)+' Das Festgeld bringt '+M(adv)+' mehr als das Sparkonto über '+T+' Monate bei diesem Zinsverlauf — wenn Sie es bis zur Fälligkeit halten.':'Das Sparkonto bringt '+M(-adv)+' mehr als das Festgeld bei diesem Zinsverlauf, mit sofortigem Zugriff auf Ihr Geld.');
  C.text('rib1',cdWins?'Höhere Rendite':'Zinssatz fixiert');C.text('cdH',T+'-Monats-Festgeld mit festem Zins');C.text('cdB',M(L.cb));C.text('cdI','+'+M(L.cb-p)+' Zinsen · '+P(cd*100)+' locked');C.text('cdL','Gebunden ('+days+'-Tage-Strafe)');
  C.text('hyB',M(L.hb));C.text('hyI','+'+M(L.hb-p)+' Zinsen · '+P(hy*100)+' → '+P(L.a*100));C.text('hyA','~'+P(avg*100));
  if(mc>0){C.text('verdN',$('verdN').textContent+' Ihr '+M(mc)+' monatliche Einzahlungen ergeben '+M(cb2)+' an Ersparnissen in beiden Fällen.');}
  C.text('beH',be?'Break-even bei vorzeitiger Entnahme: Monat '+be:'Eine vorzeitige Auflösung des Festgelds holt das Sparkonto nicht ein');
  C.text('beT',be?'Die/Der '+days+'-Tage-Strafe kostet etwa '+M(pen)+'. From month '+be+'; das Festgeld abzüglich dieser Strafe ist dann bereits mehr wert als das Sparguthaben — selbst eine Auflösung zu diesem Zeitpunkt würde Sie also vorne lassen.':cdWins?'Die/Der '+days+'-Tage-Strafe von etwa '+M(pen)+' bedeutet, dass eine Auflösung des Festgelds vor Fälligkeit Sie bei diesem Zinsverlauf hinter das Sparkonto zurückfallen lässt. Legen Sie nur Geld fest, das Sie nicht benötigen für '+T+' Monate.':'Bei diesem Zinsverlauf bleibt das Sparkonto vorn, und eine vorzeitige Auflösung des Festgelds würde zusätzlich kosten: '+M(pen)+'.');
  C.text('ledT',P(cd*100)+' Festgeld vs. '+P(hy*100)+' HYSA'+(cut?' (−'+(cut*100).toFixed(2)+'%/yr)':''));
  var show=[1,3,6,9,12,18,24,36,48,60].filter(function(x){return x<=T;});if(show.indexOf(T)<0)show.push(T);if(be&&show.indexOf(be)<0)show.push(be);show.sort(function(a,b){return a-b;});
  last={rows:rows};
  $('tbl').innerHTML=show.map(function(m){var x=rows[m-1],end=m===T,st=end?'Fällig geworden':m===be?'Break-even':x.brk>=x.hb?'Auch bei Auflösung vorn':'Bei Auflösung im Rückstand';
    return '<tr'+(end?' style="background:var(--sx-emb)"':m===be?' class="pb"':'')+'><td style="font-family:inherit;font-weight:600">Monat '+m+(end?' (Maturity)':'')+'</td><td>'+M(x.cb)+'</td><td class="mu">'+P(x.a*100)+'</td><td>'+M(x.hb)+'</td><td class="'+(x.adv>=0?'pos':'r')+'">'+(x.adv>=0?'+':'')+M(x.adv)+'</td><td>'+(end?M(x.cb)+' <small class="p">(keine Strafgebühr)</small>':M(x.brk))+'</td><td><span class="sx-an-ph'+(end?' a':m===be?' p':x.brk>=x.hb?' a':'')+'">'+st+'</span></td></tr>';}).join('');
  var W=520,H=170,Lp=52,R=10,Tp=12,B=24,w=W-Lp-R,h=H-Tp-B,mx=Math.max(L.cb,L.hb),mn=p,X=function(m){return Lp+m/T*w;},Y=function(y){return Tp+h-(mx>mn?(y-mn)/(mx-mn):0)*h;};
  var line=function(k){return 'M'+X(0)+' '+Y(p)+rows.map(function(x){return ' L'+X(x.m).toFixed(1)+' '+Y(x[k]).toFixed(1);}).join('');},gr='';
  for(var i=0;i<=3;i++){var yy=mn+(mx-mn)*i/3;gr+='<line x1="'+Lp+'" x2="'+(W-R)+'" y1="'+Y(yy)+'" y2="'+Y(yy)+'" stroke="var(--sx-border)" stroke-dasharray="3 3"/><text x="'+(Lp-6)+'" y="'+(Y(yy)+3)+'" text-anchor="end" font-size="9" fill="var(--sx-muted)">$'+(Math.round(yy/10)/100).toFixed(1)+'k</text>';}
  gr+='<text x="'+X(0)+'" y="'+(H-8)+'" font-size="9" fill="var(--sx-muted)">Start</text><text x="'+X(T)+'" y="'+(H-8)+'" text-anchor="end" font-size="9" fill="var(--sx-muted)">Monat '+T+'</text>';
  $('chart').innerHTML=gr+'<path d="'+line('hb')+'" fill="none" stroke="#f59e0b" stroke-width="2.5"/><path d="'+line('cb')+'" fill="none" stroke="var(--sx-primary)" stroke-width="2.5"/>';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'chCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('cd-vs-hysa.csv',[{h:'Monat',key:'m'},{h:'Festgeld-Guthaben',key:'c'},{h:'Tagesgeld-APY %',key:'a'},{h:'Tagesgeld-Guthaben',key:'h'},{h:'Festgeld-Vorteil',key:'d'},{h:'Festgeld bei Auflösung',key:'b'}],last.rows.map(function(x){return {m:x.m,c:x.cb.toFixed(2),a:(x.a*100).toFixed(3),h:x.hb.toFixed(2),d:x.adv.toFixed(2),b:x.brk.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCdHysa={};
})();
