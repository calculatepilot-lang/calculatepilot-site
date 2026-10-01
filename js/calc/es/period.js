/* Period calculator — CalculatePilot (redesign, PSEO standards).
   Next period = last period + cycle length (repeat); end = start + period length − 1; ovulation ≈ next period − 14.
   FIGO 2018 normal limits: frequency 24–38 days; duration ≤ 8 days; regularity (longest − shortest) ≤ 7 days (ages 26–41)
   or ≤ 9 days (18–25, 42–45). Dates parsed as local calendar dates. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
function P(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function A(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;}
function ISO(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function F(d){return d.toLocaleDateString('es-ES',{month:'short',day:'numeric',year:'numeric'});}
function FW(d){return d.toLocaleDateString('es-ES',{weekday:'short',month:'short',day:'numeric',year:'numeric'});}
function DD(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);}

function compute(){
  var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  if(!$('d').value)$('d').value=ISO(A(today,-20));
  var d=P($('d').value),cl=Math.round(v('cl')),pl=Math.round(v('pl'))||5;
  if(!d||!(cl>=10))return;
  var s=A(d,cl),k=1;while(DD(today,A(s,pl-1))<0&&k<60){s=A(s,cl);k++;}
  var e=A(s,pl-1),inD=DD(today,s);
  C.text('resultValue',FW(s));C.text('tag',inD>0?'In '+inD+' day'+(inD===1?'':'s'):inD===0?'Hoy':'En curso');
  C.text('rN',(k>1?'Proyectado '+k+' ciclos a partir de la fecha que introdujiste. ':'')+'Última regla + '+cl+'días de ciclo. La regla suele llegar con unos pocos días de diferencia a cada lado de esta fecha.');
  C.text('pe',FW(e));C.text('ov',F(A(s,-14)));
  var fq=cl<24?['Frecuente (<24 días)','mid']:cl>38?['Poco frecuente (>38 días)','mid']:['Normal',''];
  C.text('fq',cl+' días · '+fq[0]);C.text('du',pl+' días · '+(pl>8?'Prolongada':'Normal'));
  var cs=['c1','c2','c3'].map(function(id){return Math.round(v(id));}).filter(function(x){return x>0;}),age=v('age'),lim=age&&(age<26||age>41)?9:7,va=null;
  if(cs.length>=2){va=Math.max.apply(null,cs)-Math.min.apply(null,cs);C.text('vaL','Variación, últimos '+cs.length+' ciclos (normal ≤ '+lim+' días)');C.text('va',va+' días · '+(va>lim?'Irregular':'Regulares'));}
  else{C.text('vaL','Variación entre ciclos');C.text('va','Introduce 2–3 duraciones de ciclo');}
  var flags=(fq[1]?1:0)+(pl>8?1:0)+(va!==null&&va>lim?1:0);C.text('rgT',flags?flags+' fuera de lo normal':'Dentro de los límites normales');
  var wn=$('warn');
  wn.textContent=flags?'Una o más medidas quedan fuera de los límites normales de la FIGO; conviene consultarlo con un profesional de la salud, sobre todo si persiste.':age&&age<18?'En los primeros años tras la primera regla, los ciclos suelen ser irregulares; es posible que los límites de la FIGO para adultas aún no se apliquen.':'Es una estimación: el estrés, las enfermedades, los viajes y otros factores pueden adelantar o retrasar la regla varios días.';
  C.text('tbT',cl+'días de ciclo · '+pl+'días de regla');
  var rows='';for(var i=0;i<6;i++){var a=A(s,i*cl),b=A(a,pl-1),n=DD(today,a);rows+='<tr'+(i===0?' class="hl"':'')+'><td>'+(i+1)+'</td><td class="b" style="font-family:inherit">'+F(a)+'</td><td style="font-family:inherit">'+F(b)+'</td><td>'+(n>0?n+' days':'now')+'</td></tr>';}
  $('prTbl').innerHTML=rows;
  last='Próxima regla: '+FW(s)+' – '+FW(e)+'\nFollowing: '+F(A(s,cl))+'\n— calculatepilot.com/health/period-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'prCalc',compute:compute});
  $('d').addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar fechas');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
