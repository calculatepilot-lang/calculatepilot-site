/* Body frame size calculator — CalculatePilot (redesign, PSEO standards).
   r = height ÷ wrist (Grant 1980): men >10.4 small, 9.6–10.4 medium, <9.6 large; women >11.0 small, 10.1–11.0 medium, <10.1 large.
   MedlinePlus wrist chart (inches): women <62 in: <5.5 S, 5.5–5.75 M, >5.75 L; 62–65: <6 S, 6–6.25 M, >6.25 L; >65: <6.25 S, 6.25–6.5 M, >6.5 L;
   men >65: <6.5 S, 6.5–7.5 M, >7.5 L (men ≤65 in not covered). Hamwi IBW ±10% for frame. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var T={m:[10.4,9.6],f:[11.0,10.1]};
function ratioCat(r,male){var t=T[male?'m':'f'];return r>t[0]?'Pequeña':r>=t[1]?'Mediana':'Grande';}
function mlp(hIn,wIn,male){
  var b=male?(hIn>65?[6.5,7.5]:null):hIn<62?[5.5,5.75]:hIn<=65?[6,6.25]:[6.25,6.5];
  if(!b)return null;return wIn<b[0]?'Pequeña':wIn<=b[1]?'Mediana':'Grande';
}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
    $('wr').value=imp?Math.round(v('wr')/2.54*20)/20:Math.round(v('wr')*2.54*10)/10;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'in':'cm');
  var hIn=imp?v('ft')*12+v('inch'):v('cm')/2.54,wIn=imp?v('wr'):v('wr')/2.54,male=$('sex').value==='s1';
  var L=function(inch){return imp?(Math.round(inch*100)/100)+'″':(Math.round(inch*2.54*10)/10).toFixed(1)+' cm';};
  C.text('hAlt',imp?Math.round(hIn*2.54)+' cm':Math.floor(hIn/12)+'′ '+Math.round(hIn%12)+'″');
  if(!(hIn>30&&wIn>0))return;
  var r=hIn/wIn,c=ratioCat(r,male),m=mlp(hIn,wIn,male),t=T[male?'m':'f'],a=$('agree');
  C.text('resultValue',c+' frame');
  a.textContent=m?(m===c?'Ambos métodos coinciden':'Los métodos difieren'):'Solo método de la razón';a.className='sx-ef-grade'+(m&&m!==c?' mid':'');
  C.text('rN','Tu estatura es '+r.toFixed(2)+' veces tu muñeca. Para '+(male?'men':'women')+', '+t[1].toFixed(1)+'–'+t[0].toFixed(1)+' es una complexión mediana.');
  C.text('mlp',m?m+' frame':'No cubierto (hombres de 5′5″ o menos)');
  C.text('medW',L(hIn/t[0])+' – '+L(hIn/t[1]));
  var lo=male?8.4:8.9,hi=male?11.6:12.2,segs=[[t[1],'#f59e0b','Grande'],[t[0],'#22c55e','Mediana'],[hi,'#60a5fa','Pequeña']],prev=lo;
  C.text('specT','Estatura ÷ muñeca ('+(male?'men':'women')+')');
  $('specBar').innerHTML=segs.map(function(s){var w=(s[0]-prev)/(hi-lo)*100;prev=s[0];return '<span style="width:'+w+'%;background:'+s[1]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(r-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=segs.map(function(s){return '<span>'+s[2]+'</span>';}).join('');C.text('specV',r.toFixed(2));
  $('warn').textContent=m&&m!==c?'Los métodos dan tallas vecinas, lo que suele indicar que estás cerca del límite entre ambas.':'Una estimación general a partir de una sola medida; resulta útil junto con otra información sobre la composición corporal.';
  var ibw=(male?48+2.7*(hIn-60):45.5+2.2*(hIn-60)),K=function(kg){return imp?Math.round(kg*2.20462)+' lb':(Math.round(kg*10)/10).toFixed(1)+' kg';};
  C.text('ibwTag',c+' frame');C.text('i1',K(ibw*0.9));C.text('i2',K(ibw));C.text('i3',K(ibw*1.1));
  var base=Math.round(hIn),rows=[-4,-2,0,2,4].map(function(d){return base+d;});
  C.text('tbT',male?'Hombres':'Mujeres');
  $('bandTbl').innerHTML=rows.map(function(h){var me=h===base;return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+Math.floor(h/12)+'′ '+(h%12)+'″ ('+Math.round(h*2.54)+' cm)'+(me?' <small class="p">(tú)</small>':'')+'</td><td>Menos de '+L(h/t[0])+'</td><td class="b">'+L(h/t[0])+' – '+L(h/t[1])+'</td><td>Más de '+L(h/t[1])+'</td></tr>';}).join('');
  last='Complexión corporal: '+c+' (estatura ÷ muñeca = '+r.toFixed(2)+')\nTabla de MedlinePlus: '+(m||'no cubierto')+'\n— calculatepilot.com/health/body-frame-size-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bfsCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
