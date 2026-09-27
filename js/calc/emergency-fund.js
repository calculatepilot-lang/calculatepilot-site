/* Emergency fund calculator — CalculatePilot (Stitch 1:1 redesign).
   Target = monthly essentials (comfortable or bare-bones) × months. Runway = cash ÷ burn,
   stress-tested with bare-bones spending, severance, and unemployment benefits (6 months).
   Funding horizon compounds savings at the APY with monthly deposits. */
(function(){
var C=window.CPX,$=C.$,v=C.val;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function mo(x){return isFinite(x)?(Math.round(x*10)/10).toFixed(1)+' Months':'—';}
function r100(x){return Math.round(x/100)*100;}

function inputs(){
  return {std:$('std').value,exp:Math.max(0,v('exp')),bare:Math.max(0,v('bare')),cash:Math.max(0,v('cash')),inflow:Math.max(0,v('inflow')),emp:$('emp').value,home:$('home').value,
    dep:Math.max(0,v('dep')),months:Math.max(1,v('months')),sev:Math.max(0,v('sev')),ui:Math.max(0,v('ui')),apy:Math.max(0,v('apy'))};
}

function horizon(cash,target,inflow,apy){
  if(cash>=target)return 0;var r=Math.pow(1+apy/100,1/12)-1,b=cash;
  for(var n=1;n<=1200;n++){b=b*(1+r)+inflow;if(b>=target)return n;}return Infinity;
}
function uiRunway(cash,exp,ui){var net=Math.max(0,exp-ui);if(net===0)return cash>0?Infinity:0;if(cash<=6*net)return cash/net;return exp>0?6+(cash-6*net)/exp:Infinity;}

function calc(o){
  var base=o.std==='bare'?o.bare:o.exp,target=base*o.months,pct=target>0?o.cash/target*100:0;
  return {base:base,target:target,pct:pct,gap:Math.max(0,target-o.cash),cover:base>0?o.cash/base:0,h:horizon(o.cash,target,o.inflow,o.apy)};
}

function compute(){
  var o=inputs(),r=calc(o);
  C.text('stdBare','('+M(o.bare)+')');C.text('stdComf','('+M(o.exp)+')');C.text('expNote',M(o.exp)+' / month');
  var sug=o.emp==='dual'?'3–6':o.emp==='single'?'6':'9–12',up=o.dep>=3||(o.dep>0&&o.home==='own');
  C.text('sugNote','Suggested for you: '+sug+' months'+(up?' (upper end)':''));
  document.querySelectorAll('#sugRows li').forEach(function(li){var k=li.getAttribute('data-k');li.className=(k===o.emp||(k==='extra'&&(o.dep>0||o.home==='own')))?'on':'';});

  C.text('tgtLbl','Target Liquid Reserve ('+o.months+' Mo)');C.text('resultValue',M(r.target));
  C.text('tgtNote','Calibrated to '+M(r.base)+'/mo '+(o.std==='bare'?'bare-bones':'baseline')+' cost');
  C.text('fundPct',r.pct.toFixed(1)+'% Funded');C.text('curCash',M(o.cash));C.text('curMo','/ '+(Math.round(r.cover*10)/10)+' Months');C.text('gap',M(r.gap));
  C.text('barL','Funded: '+M(o.cash)+' ('+(Math.round(r.cover*10)/10)+' Mo)');
  C.text('barR',r.gap>0?'Deficit Gap: '+M(r.gap)+' ('+(Math.round((r.base>0?r.gap/r.base:0)*10)/10)+' Mo)':'Surplus: '+M(o.cash-r.target));
  $('barFill').style.width=Math.min(100,r.pct)+'%';
  var g=$('grade');if(r.pct>=100){g.textContent='Grade: Fully Funded';g.className='sx-ef-grade';}else if(r.pct>=50){g.textContent='Grade: Stable';g.className='sx-ef-grade';}else if(r.pct>=25){g.textContent='Grade: Building';g.className='sx-ef-grade mid';}else{g.textContent='Grade: Vulnerable';g.className='sx-ef-grade hi';}
  C.text('horizon',r.h===0?'Already funded':isFinite(r.h)?mo(r.h).replace('.0 ',' '):'Not reached');
  C.text('horizonNote',r.h===0?'target met today':isFinite(r.h)?'at current '+M(o.inflow)+'/mo inflow':'add a monthly contribution');
  C.text('yield',M(r.target*o.apy/100)+' / year');C.text('yieldNote','at '+o.apy+'% APY on the full target');

  C.text('scnBase','Based on '+M(o.cash)+' Current Reserve');
  C.text('r1',mo(o.bare>0?o.cash/o.bare:Infinity));C.text('r1t','Cuts dining, subscriptions and travel ('+M(o.bare)+'/mo burn).');
  C.text('r2',mo(o.exp>0?o.cash/o.exp:Infinity));C.text('r2t','Standard living with existing fixed outlays ('+M(o.exp)+'/mo burn).');
  C.text('r3',mo(o.exp>0?(o.cash+o.sev)/o.exp:Infinity));C.text('r3t','Adds a '+M(o.sev)+' severance payout (+'+(o.exp>0?(Math.round(o.sev/o.exp*10)/10):0)+' Mo).');
  var u=uiRunway(o.cash,o.exp,o.ui);C.text('r4',isFinite(u)?mo(u):'Covered');C.text('r4t','Offsets '+M(o.ui)+'/mo of unemployment benefits for up to 6 months.');

  var t1=Math.min(r.target,r100(0.5*r.base)),t3=Math.max(0,r.target-4*r.base),t2=Math.max(0,r.target-t1-t3);
  C.text('t1',M(t1));C.text('t2',M(t2));C.text('t3',M(t3));C.text('t2r','1-2 business days · '+o.apy+'% APY');C.text('tierTot','Total Allocation: '+M(r.target));

  var p5=Math.max(12,o.months+6),ph=[
    ['Starter Buffer',1000,'$1,000','Covers routine surprises like car repairs without touching credit cards.'],
    ['Survival Core',o.bare,M(o.bare)+' (1 Month)','Covers 30 days of bare-bones rent, groceries, medicines and utilities.'],
    ['Safe Harbor',r.base*3,M(r.base*3)+' (3 Months)','The traditional minimum buffer for stable dual-earner households.'],
    ['Full Target',r.target,M(r.target)+' ('+o.months+' Months)','Your chosen reserve, sized for a longer job search or economic downturn.'],
    ['Career Pivot Fund',r.base*p5,M(r.base*p5)+' ('+p5+' Months)','An extended buffer for a career change, sabbatical or starting a business.']];
  var done=0,curSet=false;
  $('phases').innerHTML=ph.map(function(p,k){var ach=o.cash>=p[1]&&p[1]>0,cur=!ach&&!curSet;if(ach)done++;if(cur)curSet=true;var pc=p[1]>0?Math.min(100,o.cash/p[1]*100):0;
    var f=ach?'✓ 100% Achieved':cur?'<div class="r"><span>In Progress</span><span>'+pc.toFixed(1)+'%</span></div><div class="t"><span style="width:'+pc+'%"></span></div>':'Future Horizon';
    return '<div class="'+(cur?'cur':ach?'':'fut')+'"><span class="tag">Current Focus</span><div class="k">Phase '+(k+1)+'<span class="msym" aria-hidden="true">'+(ach?'check_circle':cur?'pending':'flag')+'</span></div><h3>'+p[0]+'</h3><div class="a">'+p[2]+'</div><p>'+p[3]+'</p><div class="f">'+f+'</div></div>';}).join('');
  C.text('stageTag',done===ph.length?'All Stages Complete':'Current Level: Stage '+done+' Complete');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'efCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpEmergencyFund={calc:calc,horizon:horizon};
})();
