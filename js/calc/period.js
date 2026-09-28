/* Period calculator — CalculatePilot (redesign, PSEO standards).
   Next period = last period + cycle length (repeat); end = start + period length − 1; ovulation ≈ next period − 14.
   FIGO 2018 normal limits: frequency 24–38 days; duration ≤ 8 days; regularity (longest − shortest) ≤ 7 days (ages 26–41)
   or ≤ 9 days (18–25, 42–45). Dates parsed as local calendar dates. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
function P(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function A(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x;}
function ISO(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function F(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
function FW(d){return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});}
function DD(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);}

function compute(){
  var today=new Date();today=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  if(!$('d').value)$('d').value=ISO(A(today,-20));
  var d=P($('d').value),cl=Math.round(v('cl')),pl=Math.round(v('pl'))||5;
  if(!d||!(cl>=10))return;
  var s=A(d,cl),k=1;while(DD(today,A(s,pl-1))<0&&k<60){s=A(s,cl);k++;}
  var e=A(s,pl-1),inD=DD(today,s);
  C.text('resultValue',FW(s));C.text('tag',inD>0?'In '+inD+' day'+(inD===1?'':'s'):inD===0?'Today':'Ongoing');
  C.text('rN',(k>1?'Projected '+k+' cycles from the date you entered. ':'')+'Last period + '+cl+'-day cycle. Periods typically arrive within a few days either side of this date.');
  C.text('pe',FW(e));C.text('ov',F(A(s,-14)));
  var fq=cl<24?['Frequent (<24 days)','mid']:cl>38?['Infrequent (>38 days)','mid']:['Normal',''];
  C.text('fq',cl+' days · '+fq[0]);C.text('du',pl+' days · '+(pl>8?'Prolonged':'Normal'));
  var cs=['c1','c2','c3'].map(function(id){return Math.round(v(id));}).filter(function(x){return x>0;}),age=v('age'),lim=age&&(age<26||age>41)?9:7,va=null;
  if(cs.length>=2){va=Math.max.apply(null,cs)-Math.min.apply(null,cs);C.text('vaL','Variation, last '+cs.length+' cycles (normal ≤ '+lim+' days)');C.text('va',va+' days · '+(va>lim?'Irregular':'Regular'));}
  else{C.text('vaL','Cycle-to-cycle variation');C.text('va','Enter 2–3 cycle lengths');}
  var flags=(fq[1]?1:0)+(pl>8?1:0)+(va!==null&&va>lim?1:0);C.text('rgT',flags?flags+' outside normal':'Within normal limits');
  var wn=$('warn');
  wn.textContent=flags?'One or more measures fall outside FIGO\'s normal limits — worth discussing with a healthcare provider, especially if it persists.':age&&age<18?'In the first years after periods start, cycles are often irregular — FIGO\'s adult limits may not apply yet.':'An estimate — stress, illness, travel and other factors can shift a period by several days.';
  C.text('tbT',cl+'-day cycle · '+pl+'-day period');
  var rows='';for(var i=0;i<6;i++){var a=A(s,i*cl),b=A(a,pl-1),n=DD(today,a);rows+='<tr'+(i===0?' class="hl"':'')+'><td>'+(i+1)+'</td><td class="b" style="font-family:inherit">'+F(a)+'</td><td style="font-family:inherit">'+F(b)+'</td><td>'+(n>0?n+' days':'now')+'</td></tr>';}
  $('prTbl').innerHTML=rows;
  last='Next period: '+FW(s)+' – '+FW(e)+'\nFollowing: '+F(A(s,cl))+'\n— calculatepilot.com/health/period-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'prCalc',compute:compute});
  $('d').addEventListener('change',compute);
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Dates');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
