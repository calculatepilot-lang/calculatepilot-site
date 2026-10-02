/* VO2 max calculator — CalculatePilot (redesign, PSEO standards).
   Uth 2004: 15.3 × HRmax ÷ HRrest (HRmax = 208 − 0.7 × age, Tanaka 2001, unless measured).
   Rockport (Kline 1987): 132.853 − 0.0769 lb − 0.3877 age + 6.315 sex − 3.2649 min − 0.1565 HR.
   Cooper 1968: (m − 504.9) ÷ 44.73. 1.5-mile (ACSM): 3.5 + 483 ÷ min. METs = VO2max ÷ 3.5.
   Kodama 2009: each +1 MET ≈ 13% lower all-cause mortality risk. Activity METs: 2024 Adult Compendium. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevDu=null;
function mmss(mn){var s=Math.round(mn*60);return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}
var ACT=[['Gehen, 2,8–3,4 mph',3.8],['Gehen, 3,5–3,9 mph, zügig',4.8],['Bahnen schwimmen, Freistil, langsam',5.8],['Wandern, querfeldein',6.0],['Radfahren, 12–13,9 mph',8.0],['Laufen, 5,0–5,2 mph',8.5],['Laufen, 6–6,3 mph',9.3],['Laufen, 7 mph',11.0],['Laufen, 8 mph',12.0],['Laufen, 9 mph',13.0],['Laufen, 10 mph',14.8]];

function compute(){
  var m=$('m').value;['g1','g2','g3','g4'].forEach(function(g,i){$(g).hidden=m!=='s'+(i+1);});
  var mi=$('du').value==='s2';if(prevDu!==null&&prevDu!==$('du').value)$('dist').value=mi?(v('dist')/1609.344).toFixed(2):Math.round(v('dist')*1609.344);prevDu=$('du').value;C.text('dU',mi?'mi':'m');
  var age=v('age'),male=$('sex').value==='s1',vo,x2L='Verwendete max. Herzfrequenz',x2='—',name,wn='';
  var hmax=v('mhr')>0?v('mhr'):208-0.7*age;
  if(m==='s1'){if(!(v('rhr')>0&&age>0))return;vo=15.3*hmax/v('rhr');name='Verhältnis der Ruheherzfrequenz (Uth)';x2=Math.round(hmax)+' bpm'+(v('mhr')>0?' (measured)':' (208 − 0,7 × Alter)');
    wn=male?'Bei trainierten Männern entwickelt — am besten geeignet, um den eigenen Verlauf über die Zeit zu verfolgen.':'Bei Männern entwickelt; Schätzungen für Frauen können ungenauer sein. Am besten geeignet, um den eigenen Verlauf zu verfolgen.';}
  else if(m==='s2'){var t=v('wm')+v('ws')/60;if(!(t>0&&v('wlb')>0))return;vo=132.853-0.0769*v('wlb')-0.3877*age+6.315*(male?1:0)-3.2649*t-0.1565*v('whr');name='Rockport-1-Meilen-Gehtest';x2L='Gehtempo';x2=(60/t).toFixed(1)+' mph';wn='Gehen Sie auf einer ebenen Bahn so schnell wie möglich 1 Meile und messen Sie Ihre Herzfrequenz direkt im Ziel.';}
  else if(m==='s3'){var d=mi?v('dist')*1609.344:v('dist');if(!(d>0))return;vo=(d-504.9)/44.73;name='Cooper-12-Minuten-Lauf';x2L='Durchschnittliches Tempo';x2=mmss(12/(d/1609.344))+' /mile';wn='Eine maximale Belastung — wärmen Sie sich zuvor auf und sprechen Sie mit einem Arzt, wenn Sie intensives Training nicht gewohnt sind.';}
  else{var tr=v('rm')+v('rs')/60;if(!(tr>0))return;vo=3.5+483/tr;name='1,5-Meilen-Lauf (ACSM)';x2L='Durchschnittliches Tempo';x2=mmss(tr/1.5)+' /mile';wn='Eine maximale Belastung — wärmen Sie sich zuvor auf und sprechen Sie mit einem Arzt, wenn Sie intensives Training nicht gewohnt sind.';}
  if(!(vo>0)){C.text('resultValue','—');C.text('rN','Prüfen Sie Ihre Eingaben — diese Kombination ergibt keine gültige Schätzung.');return;}
  var mets=vo/3.5;
  C.text('resultValue',vo.toFixed(1));C.text('tag',name);C.text('mets',mets.toFixed(1)+' MET');C.text('x2L',x2L);C.text('x2',x2);
  C.text('rN','Ihre geschätzte maximale aerobe Kapazität beträgt '+vo.toFixed(1)+' ml Sauerstoff pro kg und Minute, also etwa das '+mets.toFixed(1)+' -Fache des Ruheumsatzes (MET).');
  $('warn').textContent=wn;
  $('imp').innerHTML=[1,2,3].map(function(k){return '<div class="l"><span>+'+k+' MET ('+(mets+k).toFixed(1)+' MET)</span><b>'+(vo+3.5*k).toFixed(1)+' ml/kg/min</b></div>';}).join('')+'<div class="l t"><span>Je +1 MET: etwa 13 % geringeres Gesamtmortalitätsrisiko (Kodama et al., JAMA 2009)</span><b>Zusammenhang</b></div>';
  C.text('tbT','Max '+mets.toFixed(1)+' MET');
  $('actTbl').innerHTML=ACT.map(function(a){var pct=a[1]/mets*100,c=pct>100?'color:var(--sx-err)':pct<=60?'color:var(--sx-pc)':'';return '<tr><td style="font-family:inherit;font-weight:600">'+a[0]+'</td><td>'+a[1].toFixed(1)+'</td><td class="b" style="'+c+'">'+(pct>100?'Über dem Maximum':Math.round(pct)+'%')+'</td></tr>';}).join('');
  last='Geschätzte VO2max: '+vo.toFixed(1)+' ml/kg/min ('+mets.toFixed(1)+' MET) — '+name+'\n— calculatepilot.com/health/vo2max-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'voCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Ergebnisse kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
