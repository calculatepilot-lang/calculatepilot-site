/* Emergency fund calculator — CalculatePilot (Stitch 1:1 redesign).
   Target = monthly essentials (comfortable or bare-bones) × months. Runway = cash ÷ burn,
   stress-tested with bare-bones spending, severance, and unemployment benefits (6 months).
   Funding horizon compounds savings at the APY with monthly deposits. */
(function(){
var C=window.CPX,$=C.$,v=C.val;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function mo(x){return isFinite(x)?(Math.round(x*10)/10).toFixed(1)+' Monate':'—';}
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
  C.text('sugNote','Für Sie vorgeschlagen: '+sug+' months'+(up?' (oberes Ende)':''));
  document.querySelectorAll('#sugRows li').forEach(function(li){var k=li.getAttribute('data-k');li.className=(k===o.emp||(k==='extra'&&(o.dep>0||o.home==='own')))?'on':'';});

  C.text('tgtLbl','Ziel-Liquiditätsreserve ('+o.months+' Mo)');C.text('resultValue',M(r.target));
  C.text('tgtNote','Abgestimmt auf '+M(r.base)+'/mo '+(o.std==='bare'?'bare-bones':'baseline')+' cost');
  C.text('fundPct',r.pct.toFixed(1)+'% finanziert');C.text('curCash',M(o.cash));C.text('curMo','/ '+(Math.round(r.cover*10)/10)+' Monate');C.text('gap',M(r.gap));
  C.text('barL','Finanziert: '+M(o.cash)+' ('+(Math.round(r.cover*10)/10)+' Mo)');
  C.text('barR',r.gap>0?'Fehlbetrag: '+M(r.gap)+' ('+(Math.round((r.base>0?r.gap/r.base:0)*10)/10)+' Mo)':'Überschuss: '+M(o.cash-r.target));
  $('barFill').style.width=Math.min(100,r.pct)+'%';
  var g=$('grade');if(r.pct>=100){g.textContent='Bewertung: Vollständig finanziert';g.className='sx-ef-grade';}else if(r.pct>=50){g.textContent='Bewertung: Stabil';g.className='sx-ef-grade';}else if(r.pct>=25){g.textContent='Bewertung: Im Aufbau';g.className='sx-ef-grade mid';}else{g.textContent='Bewertung: Anfällig';g.className='sx-ef-grade hi';}
  C.text('horizon',r.h===0?'Bereits finanziert':isFinite(r.h)?mo(r.h).replace('.0 ',' '):'Nicht erreicht');
  C.text('horizonNote',r.h===0?'Ziel heute erreicht':isFinite(r.h)?'bei aktuell '+M(o.inflow)+'/mo inflow':'einen monatlichen Beitrag hinzufügen');
  C.text('yield',M(r.target*o.apy/100)+' / year');C.text('yieldNote','at '+o.apy+'% APY auf das gesamte Ziel');

  C.text('scnBase','Basierend auf '+M(o.cash)+' Aktuelle Reserve');
  C.text('r1',mo(o.bare>0?o.cash/o.bare:Infinity));C.text('r1t','Kürzt Restaurantbesuche, Abos und Reisen ('+M(o.bare)+'/mo burn).');
  C.text('r2',mo(o.exp>0?o.cash/o.exp:Infinity));C.text('r2t','Normaler Lebensstandard mit bestehenden Fixkosten ('+M(o.exp)+'/mo burn).');
  C.text('r3',mo(o.exp>0?(o.cash+o.sev)/o.exp:Infinity));C.text('r3t','Fügt eine '+M(o.sev)+' Abfindung hinzu (+'+(o.exp>0?(Math.round(o.sev/o.exp*10)/10):0)+' Mo).');
  var u=uiRunway(o.cash,o.exp,o.ui);C.text('r4',isFinite(u)?mo(u):'Gedeckt');C.text('r4t','Gleicht aus '+M(o.ui)+'/mo of unemployment benefits for up to 6 months.');

  var t1=Math.min(r.target,r100(0.5*r.base)),t3=Math.max(0,r.target-4*r.base),t2=Math.max(0,r.target-t1-t3);
  C.text('t1',M(t1));C.text('t2',M(t2));C.text('t3',M(t3));C.text('t2r','1–2 Werktage · '+o.apy+'% effektiver Jahreszins (APY)');C.text('tierTot','Gesamtzuteilung: '+M(r.target));

  var p5=Math.max(12,o.months+6),ph=[
    ['Starter-Puffer',1000,'$1,000','Deckt alltägliche Überraschungen wie Autoreparaturen ab, ohne Kreditkarten anzutasten.'],
    ['Überlebenskern',o.bare,M(o.bare)+' (1 Monat)','Deckt 30 Tage Miete, Lebensmittel, Medikamente und Nebenkosten im Minimalbetrieb ab.'],
    ['Sicherer Bereich',r.base*3,M(r.base*3)+' (3 Monate)','Der traditionelle Mindestpuffer für stabile Haushalte mit zwei Verdienern.'],
    ['Volles Ziel',r.target,M(r.target)+' ('+o.months+' Monate)','Ihre gewählte Reserve, bemessen für eine längere Jobsuche oder einen Wirtschaftsabschwung.'],
    ['Fonds für beruflichen Neustart',r.base*p5,M(r.base*p5)+' ('+p5+' Monate)','Ein erweiterter Puffer für einen Berufswechsel, ein Sabbatical oder eine Unternehmensgründung.']];
  var done=0,curSet=false;
  $('phases').innerHTML=ph.map(function(p,k){var ach=o.cash>=p[1]&&p[1]>0,cur=!ach&&!curSet;if(ach)done++;if(cur)curSet=true;var pc=p[1]>0?Math.min(100,o.cash/p[1]*100):0;
    var f=ach?'✓ 100 % erreicht':cur?'<div class="r"><span>In Arbeit</span><span>'+pc.toFixed(1)+'%</span></div><div class="t"><span style="width:'+pc+'%"></span></div>':'Zukünftiger Horizont';
    return '<div class="'+(cur?'cur':ach?'':'fut')+'"><span class="tag">Aktueller Fokus</span><div class="k">Phase '+(k+1)+'<span class="msym" aria-hidden="true">'+(ach?'check_circle':cur?'pending':'flag')+'</span></div><h3>'+p[0]+'</h3><div class="a">'+p[2]+'</div><p>'+p[3]+'</p><div class="f">'+f+'</div></div>';}).join('');
  C.text('stageTag',done===ph.length?'Alle Stufen abgeschlossen':'Aktuelle Stufe: '+done+' Abgeschlossen');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'efCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpEmergencyFund={calc:calc,horizon:horizon};
})();
