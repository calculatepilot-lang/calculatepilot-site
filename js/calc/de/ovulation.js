/* Ovulation calculator — CalculatePilot (redesign, PSEO standards).
   Ovulation = next period − luteal phase (default 14). Fertile window = ovulation − 5 … ovulation (Wilcox 1995).
   Most fertile = ovulation − 2 … ovulation. Varying cycles (Ogino-Knaus): cycle day (shortest − 18) … (longest − 11).
   Dates parsed as local calendar dates. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
function P(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function A(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;}
function ISO(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function F(d){return d.toLocaleDateString('de-DE',{month:'short',day:'numeric'});}
function FY(d){return d.toLocaleDateString('de-DE',{weekday:'short',month:'short',day:'numeric',year:'numeric'});}
function R(a,b){return F(a)+' – '+F(b);}

function compute(){
  var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  if(!$('d').value)$('d').value=ISO(A(today,-10));
  var d=P($('d').value),cl=Math.round(v('cl')),lp=Math.round(v('lp'))||14,irr=$('irr').value==='s2';$('vRow').hidden=!irr;
  if(!d||!(cl>=15)||lp>=cl)return;
  // roll forward to the current or next cycle whose ovulation hasn't passed
  var start=d,k=0;while(A(start,cl-lp)<today&&k<24){start=A(start,cl);k++;}
  var ov=A(start,cl-lp),fw1=A(ov,-5),np=A(start,cl);
  C.text('resultValue',FY(ov));C.text('tag','Zyklustag '+(cl-lp+1));
  C.text('rN',(k?'Prognose '+k+' cycle'+(k>1?'s':'')+' ab Ihrer letzten Periode. ':'')+'A '+cl+'-Tage-Zyklus mit einer '+lp+'-tägigen Lutealphase ergibt einen Eisprung an Zyklustag '+(cl-lp+1)+'.');
  C.text('fw',R(fw1,ov));C.text('mf',R(A(ov,-2),ov));C.text('np',FY(np));
  var sh=Math.round(v('sh')),lo=Math.round(v('lo'));
  if(irr&&sh>=18&&lo>=sh){var a=sh-18,b=lo-11;C.text('wideL','Erweitertes Zeitfenster (Zyklustage '+a+'–'+b+')');C.text('wide',a>=1&&a<=b?R(A(start,a-1),A(start,b-1)):'—');}
  else{C.text('wideL','Größeres Fenster (schwankende Zyklen)');C.text('wide',irr?'Geben Sie den kürzesten und längsten Wert ein':'Wählen Sie „Sie schwanken“');}
  var wn=$('warn');
  wn.textContent=cl<21||cl>35?'Zyklen von weniger als 21 oder mehr als 35 Tagen können ein Anzeichen für einen unregelmäßigen Eisprung sein – sprechen Sie darüber am besten mit einer Ärztin oder einem Arzt.':irr&&lo-sh>9?'Ihre Zykluslängen schwanken um mehr als 9 Tage, daher sind Kalenderschätzungen unzuverlässig – Ovulationstests oder Temperaturmessung helfen weiter.':'Eine Schätzung – der tatsächliche Eisprung kann von Zyklus zu Zyklus um mehrere Tage abweichen.';
  C.text('tbT',cl+'-Tage-Zyklus');
  var rows='';for(var i=0;i<6;i++){var s=A(start,i*cl),o=A(s,cl-lp);rows+='<tr'+(i===0?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+F(s)+'</td><td class="b" style="font-family:inherit">'+R(A(o,-5),o)+'</td><td style="font-family:inherit">'+F(o)+'</td><td style="font-family:inherit">'+F(A(s,cl))+'</td></tr>';}
  $('cyTbl').innerHTML=rows;
  last='Voraussichtlicher Eisprung: '+FY(ov)+'\nFruchtbare Tage: '+R(fw1,ov)+'\nNächste Periode: '+FY(np)+'\n— calculatepilot.com/health/ovulation-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ovCalc',compute:compute});
  $('d').addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Daten kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
