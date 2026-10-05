/* Savings calculator — CalculatePilot (Stitch 1:1 redesign).
   Nominal rate r compounded n times a year → APY = (1 + r/n)^n − 1. Deposits are made at the end of each of f periods a year;
   between deposits the balance grows by (1 + APY)^(1/f). Deposits rise by the escalation rate each year. In a taxable account
   each year's interest is taxed at federal + state marginal rates and the tax is paid from the balance.
   Real value = balance ÷ (1 + CPI)^years. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('de-DE');}
function pc(x,d){return isFinite(x)?x.toFixed(d===undefined?2:d)+'%':'—';}
function apy(r,n){return Math.pow(1+r/100/n,n)-1;}

function sim(o,rate){
  var a=apy(rate,o.n),g=Math.pow(1+a,1/o.f),b=o.p0,rows=[],dep=0,int=0,tax=0,c=o.c;
  for(var y=1;y<=o.yrs;y++){var s=b,iy=0;
    for(var k=0;k<o.f;k++){var i=b*(g-1);iy+=i;b+=i+c;}
    var t=o.tax?iy*o.drag:0;b-=t;dep+=c*o.f;int+=iy;tax+=t;
    rows.push({y:y,s:s,c:c*o.f,i:iy,t:t,e:b,real:b/Math.pow(1+o.cpi/100,y),esc:y>1&&o.esc>0});
    c*=1+o.esc/100;}
  return {b:b,dep:dep,int:int,tax:tax,rows:rows};
}

function compute(){
  var o={p0:Math.max(0,v('p0')),c:Math.max(0,v('c')),f:Math.max(1,Math.round(v('fq'))),esc:$('escOn').checked?Math.max(0,v('esc')):0,
    n:Math.max(1,Math.round(v('n'))),yrs:Math.max(1,Math.round(v('yrs'))),tax:$('tx').value==='s2',cpi:Math.max(0,v('cpi'))};
  var r=Math.max(0,v('r')),fed=+$('fed').value,st=Math.max(0,v('st'));o.drag=(fed+st)/100;
  var R=sim(o,r),base=sim(o,0.45),a=apy(r,o.n);last={o:o,R:R};
  $('taxRow').hidden=!o.tax;C.text('dragOut','= '+pc(o.drag*100,1)+' jährlicher Abzug');
  C.text('apyOut','APY '+pc(a*100,3));C.text('yOut',o.yrs+' Jahr'+(o.yrs>1?'s':''));C.text('afterT','Nach '+o.yrs+' Jahr'+(o.yrs>1?'s':''));
  C.text('resultValue',M(R.b));
  $('verd').innerHTML='Ihre Ersparnisse wachsen mit Zinseszins ab einem anfänglichen '+M(o.p0)+' Einmalbetrag'+(o.c?' with '+(o.esc?'escalating ':'')+'deposits':'')+(r>0.45?' und übertreffen ein herkömmliches Konto mit 0,45 % um <b>'+M(R.b-base.b)+'</b>':'')+'.';
  var net=R.int-R.tax,T=o.p0+R.dep+net,parts=[['Anfangsbetrag',o.p0,'var(--sx-primary)'],['Einzahlungen',R.dep,'#34d399'],['Zinsen'+(o.tax?' (nach Steuer)':''),net,'#a7f3d0']];
  C.text('stN',M(R.b)+' nominal');
  $('stBar').innerHTML=parts.map(function(p){return '<span style="width:'+(T?Math.max(0,p[1])/T*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('stLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' ('+pc(T?p[1]/T*100:0,1)+')</span>';}).join('');
  C.text('out',M(o.p0+R.dep));C.text('outN',pc(R.b?(o.p0+R.dep)/R.b*100:0,1)+' des Endsaldos');
  C.text('int','+'+M(R.int));C.text('intN',pc(R.b?R.int/R.b*100:0,1)+' durch Zinseszins erzielt'+(o.tax?' (vor Steuer)':''));
  C.text('realL','Realer Wert ('+pc(o.cpi,1)+' VPI)');C.text('real',M(R.b/Math.pow(1+o.cpi/100,o.yrs)));
  C.text('tax',o.tax?'−'+M(R.tax):'$0');C.text('taxN',o.tax?'Geschätzte Bundes- und Landessteuer auf Zinsen laut 1099-INT':'Steuerfrei / Roth — keine jährliche Steuer auf Zinsen');
  $('ms').innerHTML=[25000,50000,100000].map(function(t,k){var hit=null;R.rows.some(function(x){if(x.e>=t){hit=x.y;return true;}});
    if(o.p0>=t)hit=0;return '<li><span>'+M(t)+' '+['Liquiditätsreserve','Halbes-Jahrhundert-Marke','Kapitalschwelle'][k]+'</span><em'+(hit===null?' class="no"':'')+'>'+(hit===null?'Nicht erreicht in '+o.yrs+' yrs':hit===0?'Bereits erreicht':'Erreichtes Jahr '+hit)+'</em></li>';}).join('');
  C.text('thTax',o.tax?'Steuerabzug ('+pc(o.drag*100,0)+')':'Steuerabzug (keiner)');C.text('thReal','Realer Wert ('+pc(o.cpi,1)+' VPI)');
  C.text('ledN','Jahr für Jahr: Wachstum, Zinseszins, '+(o.tax?pc(o.drag*100,0)+' Steuerabzug':'keine Steuer (steuerfreies Konto)')+' und inflationsbereinigter Wert.');
  $('tbl').innerHTML=R.rows.map(function(x,k){var end=k===R.rows.length-1;
    return '<tr'+(end?' style="background:var(--sx-emb)"':'')+'><td style="font-family:inherit;font-weight:600">Jahr '+x.y+'</td><td>'+M(x.s)+'</td><td>'+M(x.c)+(x.esc&&x.y===2?' <small class="p">(+'+pc(o.esc,0)+')</small>':'')+'</td><td class="pos">+'+M(x.i)+'</td><td class="r">'+(x.t?'−'+M(x.t):'$0')+'</td><td class="b"'+(end?' style="font-size:16px"':'')+'>'+M(x.e)+'</td><td class="mu">'+M(x.real)+'</td></tr>';}).join('');
  C.text('tdN',pc(a*100,2)+' APY');C.text('tdE',o.tax?'~'+pc(a*100*(1-o.drag),2):pc(a*100,2)+' (tax-free)');
  var aA=apy(r,1),aD=apy(r,365);C.text('cfA',pc(aA*100,3));C.text('cfD',pc(aD*100,3));
  C.text('cfTxt','Bei einem Guthaben von 100.000 $ zu '+pc(r,2)+' bringt tägliche Verzinsung etwa '+M((aD-aA)*100000)+' mehr pro Jahr als jährliche Verzinsung — wenig, aber kostenlos.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'hyCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('savings-ledger.csv',[{h:'Jahr',key:'y'},{h:'Anfangssaldo',key:'s'},{h:'Einzahlungen',key:'c'},{h:'Zinsen',key:'i'},{h:'Steuer',key:'t'},{h:'Endsaldo',key:'e'},{h:'Realer Wert',key:'r'}],last.R.rows.map(function(x){return {y:x.y,s:Math.round(x.s),c:Math.round(x.c),i:Math.round(x.i),t:Math.round(x.t),e:Math.round(x.e),r:Math.round(x.real)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpSavings={sim:sim,apy:apy};
})();
