/* Period calculator — CalculatePilot (redesign, PSEO standards).
   Next period = last period + cycle length (repeat); end = start + period length − 1; ovulation ≈ next period − 14.
   FIGO 2018 normal limits: frequency 24–38 days; duration ≤ 8 days; regularity (longest − shortest) ≤ 7 days (ages 26–41)
   or ≤ 9 days (18–25, 42–45). Dates parsed as local calendar dates. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
function P(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function A(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;}
function ISO(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function F(d){return d.toLocaleDateString('fr-FR',{month:'short',day:'numeric',year:'numeric'});}
function FW(d){return d.toLocaleDateString('fr-FR',{weekday:'short',month:'short',day:'numeric',year:'numeric'});}
function DD(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);}

function compute(){
  var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  if(!$('d').value)$('d').value=ISO(A(today,-20));
  var d=P($('d').value),cl=Math.round(v('cl')),pl=Math.round(v('pl'))||5;
  if(!d||!(cl>=10))return;
  var s=A(d,cl),k=1;while(DD(today,A(s,pl-1))<0&&k<60){s=A(s,cl);k++;}
  var e=A(s,pl-1),inD=DD(today,s);
  C.text('resultValue',FW(s));C.text('tag',inD>0?'In '+inD+' day'+(inD===1?'':'s'):inD===0?'Aujourd’hui':'En cours');
  C.text('rN',(k>1?'Projeté '+k+' cycles à partir de la date saisie. ':'')+'Dernières règles + '+cl+'jours de cycle. Les règles arrivent généralement à quelques jours près de cette date.');
  C.text('pe',FW(e));C.text('ov',F(A(s,-14)));
  var fq=cl<24?['Fréquent (<24 jours)','mid']:cl>38?['Peu fréquent (>38 jours)','mid']:['Normale',''];
  C.text('fq',cl+' jours · '+fq[0]);C.text('du',pl+' jours · '+(pl>8?'Prolongé':'Normale'));
  var cs=['c1','c2','c3'].map(function(id){return Math.round(v(id));}).filter(function(x){return x>0;}),age=v('age'),lim=age&&(age<26||age>41)?9:7,va=null;
  if(cs.length>=2){va=Math.max.apply(null,cs)-Math.min.apply(null,cs);C.text('vaL','Variation, derniers '+cs.length+' cycles (normale ≤ '+lim+' jours)');C.text('va',va+' jours · '+(va>lim?'Irrégulier':'Réguliers'));}
  else{C.text('vaL','Variation d\'un cycle à l\'autre');C.text('va','Saisissez 2 à 3 durées de cycle');}
  var flags=(fq[1]?1:0)+(pl>8?1:0)+(va!==null&&va>lim?1:0);C.text('rgT',flags?flags+' hors de la normale':'Dans les limites normales');
  var wn=$('warn');
  wn.textContent=flags?'Une ou plusieurs mesures se situent en dehors des limites normales de la FIGO — à discuter avec un professionnel de santé, surtout si cela persiste.':age&&age<18?'Durant les premières années après l\'apparition des règles, les cycles sont souvent irréguliers — les limites adultes de la FIGO peuvent ne pas encore s\'appliquer.':'Il s\'agit d\'une estimation — le stress, la maladie, les voyages et d\'autres facteurs peuvent décaler les règles de plusieurs jours.';
  C.text('tbT',cl+'jours de cycle · '+pl+'jours de règles');
  var rows='';for(var i=0;i<6;i++){var a=A(s,i*cl),b=A(a,pl-1),n=DD(today,a);rows+='<tr'+(i===0?' class="hl"':'')+'><td>'+(i+1)+'</td><td class="b" style="font-family:inherit">'+F(a)+'</td><td style="font-family:inherit">'+F(b)+'</td><td>'+(n>0?n+' days':'now')+'</td></tr>';}
  $('prTbl').innerHTML=rows;
  last='Prochaines règles : '+FW(s)+' – '+FW(e)+'\nFollowing: '+F(A(s,cl))+'\n— calculatepilot.com/health/period-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'prCalc',compute:compute});
  $('d').addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les dates');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
