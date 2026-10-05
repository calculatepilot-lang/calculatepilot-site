/* Ovulation calculator — CalculatePilot (redesign, PSEO standards).
   Ovulation = next period − luteal phase (default 14). Fertile window = ovulation − 5 … ovulation (Wilcox 1995).
   Most fertile = ovulation − 2 … ovulation. Varying cycles (Ogino-Knaus): cycle day (shortest − 18) … (longest − 11).
   Dates parsed as local calendar dates. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
function P(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function A(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;}
function ISO(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function F(d){return d.toLocaleDateString('fr-FR',{month:'short',day:'numeric'});}
function FY(d){return d.toLocaleDateString('fr-FR',{weekday:'short',month:'short',day:'numeric',year:'numeric'});}
function R(a,b){return F(a)+' – '+F(b);}

function compute(){
  var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  if(!$('d').value)$('d').value=ISO(A(today,-10));
  var d=P($('d').value),cl=Math.round(v('cl')),lp=Math.round(v('lp'))||14,irr=$('irr').value==='s2';$('vRow').hidden=!irr;
  if(!d||!(cl>=15)||lp>=cl)return;
  // roll forward to the current or next cycle whose ovulation hasn't passed
  var start=d,k=0;while(A(start,cl-lp)<today&&k<24){start=A(start,cl);k++;}
  var ov=A(start,cl-lp),fw1=A(ov,-5),np=A(start,cl);
  C.text('resultValue',FY(ov));C.text('tag','Jour du cycle '+(cl-lp+1));
  C.text('rN',(k?'Projeté '+k+' cycle'+(k>1?'s':'')+' à partir de vos dernières règles. ':'')+'A '+cl+'jours de cycle avec une '+lp+'jours de phase lutéale situent l\'ovulation au jour du cycle '+(cl-lp+1)+'.');
  C.text('fw',R(fw1,ov));C.text('mf',R(A(ov,-2),ov));C.text('np',FY(np));
  var sh=Math.round(v('sh')),lo=Math.round(v('lo'));
  if(irr&&sh>=18&&lo>=sh){var a=sh-18,b=lo-11;C.text('wideL','Fenêtre élargie (jours du cycle '+a+'–'+b+')');C.text('wide',a>=1&&a<=b?R(A(start,a-1),A(start,b-1)):'—');}
  else{C.text('wideL','Fenêtre élargie (cycles variables)');C.text('wide',irr?'Saisissez la plus courte et la plus longue':'Choisissez « Ils varient »');}
  var wn=$('warn');
  wn.textContent=cl<21||cl>35?'Des cycles inférieurs à 21 jours ou supérieurs à 35 jours peuvent être le signe d\'une ovulation irrégulière — à discuter avec un médecin.':irr&&lo-sh>9?'La durée de vos cycles varie de plus de 9 jours, les estimations par calendrier sont donc peu fiables — les tests d\'ovulation ou le suivi de la température vous aideront.':'Il s\'agit d\'une estimation — l\'ovulation réelle peut se décaler de plusieurs jours d\'un cycle à l\'autre.';
  C.text('tbT',cl+' jours');
  var rows='';for(var i=0;i<6;i++){var s=A(start,i*cl),o=A(s,cl-lp);rows+='<tr'+(i===0?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+F(s)+'</td><td class="b" style="font-family:inherit">'+R(A(o,-5),o)+'</td><td style="font-family:inherit">'+F(o)+'</td><td style="font-family:inherit">'+F(A(s,cl))+'</td></tr>';}
  $('cyTbl').innerHTML=rows;
  last='Ovulation estimée : '+FY(ov)+'\nFenêtre de fertilité : '+R(fw1,ov)+'\nProchaines règles : '+FY(np)+'\n— calculatepilot.com/health/ovulation-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ovCalc',compute:compute});
  $('d').addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les dates');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
