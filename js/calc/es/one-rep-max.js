/* One rep max calculator — CalculatePilot (redesign, PSEO standards).
   Epley w(1+r/30); Brzycki 36w/(37−r); Lander 100w/(101.3−2.67123r); Lombardi w·r^0.10; Mayhew 100w/(52.2+41.9e^(−0.055r));
   O'Conner w(1+0.025r); Wathan 100w/(48.8+53.8e^(−0.075r)). Headline = mean of the seven.
   NSCA %1RM–reps: 100:1, 95:2, 93:3, 90:4, 87:5, 85:6, 83:7, 80:8, 77:9, 75:10, 70:11, 67:12, 65:15.
   Goals (NSCA): strength ≥85% ≤6 reps; hypertrophy 67–85% 6–12; endurance ≤67% ≥12. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var F=[['Epley',function(w,r){return w*(1+r/30);}],['Brzycki',function(w,r){return w*36/(37-r);}],['Lander',function(w,r){return 100*w/(101.3-2.67123*r);}],['Lombardi',function(w,r){return w*Math.pow(r,0.10);}],['Mayhew et al.',function(w,r){return 100*w/(52.2+41.9*Math.exp(-0.055*r));}],["O'Conner et al.",function(w,r){return w*(1+0.025*r);}],['Wathan',function(w,r){return 100*w/(48.8+53.8*Math.exp(-0.075*r));}]];
var L=[[100,'1'],[95,'2'],[93,'3'],[90,'4'],[87,'5'],[85,'6'],[83,'7'],[80,'8'],[77,'9'],[75,'10'],[70,'11'],[67,'12'],[65,'15']];
function goal(p){return p>=85?'Resistencia':p>67?'Hipertrofia':p===67?'Hipertrofia / resistencia':'Resistencia muscular';}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value)$('w').value=Math.round(v('w')*(imp?2.20462:1/2.20462)*2)/2;prevU=$('u').value;
  var U=imp?'lb':'kg';C.text('wU',U);
  var steps=imp?[1,5,10]:[0.5,2.5,5];['rd1','rd2','rd3'].forEach(function(id,i){C.text(id,steps[i]+' '+U);});
  var st=steps[{s1:0,s2:1,s3:2}[$('rd').value]],RD=function(x){return Math.round(x/st)*st;};
  var w=v('w'),r=Math.round(v('r'));
  if(!(w>0&&r>=1))return;
  if(r===1){var vals=F.map(function(){return w;});}else var vals=F.map(function(f){return f[1](w,r);});
  var avg=vals.reduce(function(a,b){return a+b;},0)/vals.length,mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),fmt=function(x){return (Math.round(x*10)/10)+' '+U;},H=function(x){return imp?Math.round(x):Math.round(x*2)/2;};
  C.text('resultValue',H(avg)+' '+U);C.text('tag',r+' rep'+(r>1?'s':'')+' × '+w+' '+U);
  C.text('rN',r===1?'Una sola repetición es tu 1RM para ese ejercicio.':'Promedio de siete fórmulas para '+w+' '+U+' × '+r+' repeticiones. Epley da '+Math.round(vals[0])+' '+U+', Brzycki '+Math.round(vals[1])+' '+U+'.');
  C.text('rg',H(mn)===H(mx)?H(mn)+' '+U:H(mn)+'–'+H(mx)+' '+U);C.text('pc',Math.round(w/avg*100)+'%');
  $('fl').innerHTML=F.map(function(f,i){return '<div class="l"><span>'+f[0]+'</span><b>'+fmt(vals[i])+'</b></div>';}).join('')+'<div class="l t"><span>Promedio</span><b>'+fmt(avg)+'</b></div>';
  $('warn').textContent=r>12?'Por encima de unas 12 repeticiones las fórmulas divergen y son mucho menos fiables: usa una serie más pesada de 3–10 repeticiones si puedes.':r>10?'La precisión baja por encima de 10 repeticiones; una serie más pesada de 3–10 repeticiones da una estimación más estable.':'Usa una serie realizada cerca del fallo muscular y con buena técnica para obtener la mejor estimación.';
  C.text('tbT','1RM '+Math.round(avg)+' '+U+' · redondeado a '+st+' '+U);
  $('ldTbl').innerHTML=L.map(function(l){return '<tr'+(l[1]===String(r)?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+l[0]+'%</td><td class="b">'+RD(avg*l[0]/100)+' '+U+'</td><td>'+l[1]+'</td><td style="font-family:inherit">'+goal(l[0])+'</td></tr>';}).join('');
  last='1RM estimado: '+Math.round(avg)+' '+U+' (promedio de 7 fórmulas, rango '+Math.round(mn)+'–'+Math.round(mx)+')\nFrom '+w+' '+U+' × '+r+' repeticiones\n— calculatepilot.com/health/one-rep-max-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ormCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
