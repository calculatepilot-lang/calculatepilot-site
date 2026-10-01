/* Waist-to-hip ratio calculator — CalculatePilot (redesign, PSEO standards).
   WHR = waist ÷ hip. WHO 2008 expert consultation: substantially increased risk of metabolic complications at WHR ≥ 0.90 (men) / ≥ 0.85 (women).
   Waist circumference: increased risk > 94 cm (men) / > 80 cm (women); substantially increased > 102 cm / > 88 cm. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){['waist','hip'].forEach(function(id){$(id).value=Math.round(v(id)*(imp?1/2.54:2.54)*2)/2;});}prevU=$('u').value;
  C.text('wU',imp?'in':'cm');C.text('hU',imp?'in':'cm');
  var male=$('sex').value==='s1',Wc=imp?v('waist')*2.54:v('waist'),Hc=imp?v('hip')*2.54:v('hip'),cut=male?0.90:0.85,w1=male?94:80,w2=male?102:88;
  var L=function(cm){return imp?(Math.round(cm/2.54*10)/10).toFixed(1)+' in':(Math.round(cm*10)/10).toFixed(1)+' cm';};
  if(!(Wc>0&&Hc>0))return;
  var r=Wc/Hc,over=r>=cut,t=$('catTag');
  C.text('resultValue',r.toFixed(2));t.textContent=over?'Riesgo sustancialmente aumentado':'Por debajo del umbral de la OMS';t.className='sx-ef-grade'+(over?' hi':'');
  C.text('rN',over?'En el límite de la OMS o por encima '+(male?'men\'s':'women\'s')+' de '+cut.toFixed(2)+' — asociado a un riesgo sustancialmente mayor de complicaciones metabólicas.':'Por debajo del umbral de la OMS '+(male?'men\'s':'women\'s')+' de '+cut.toFixed(2)+'. Fat distribution alone does not indicate substantially increased risk.');
  var lo=0.65,hi=1.15,segs=[[cut,'#22c55e','Por debajo de '+cut.toFixed(2)],[hi,'#ef4444',cut.toFixed(2)+'+']],prev=lo;
  C.text('specT','escala de la razón cintura-cadera ('+(male?'men':'women')+')');
  $('specBar').innerHTML=segs.map(function(s){var w=(s[0]-prev)/(hi-lo)*100;prev=s[0];return '<span style="width:'+w+'%;background:'+s[1]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(r-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=segs.map(function(s){return '<span>'+s[2]+'</span>';}).join('');C.text('specV',r.toFixed(2));
  C.text('cutL','umbral de la OMS ('+(male?'men':'women')+')');C.text('cut',cut.toFixed(2));C.text('maxW','Menos de '+L(Hc*cut));
  var wc=Wc>w2?['Sustancialmente aumentado','hi']:Wc>w1?['Aumentado','mid']:['No aumentado',''];
  C.text('wcTag',wc[0]);C.text('wcV',L(Wc));C.text('wc1','Por encima de '+L(w1));C.text('wc2','Por encima de '+L(w2));
  $('warn').textContent=over&&!(Wc>w1)?'Tu razón supera el límite, pero tu perímetro de cintura no está en un rango elevado: la razón cintura-cadera puede ser alta simplemente porque las caderas son estrechas, así que considera ambas medidas en conjunto.':'Es una medida de cribado, no un diagnóstico. Los puntos de corte pueden ser más bajos para algunos grupos étnicos (consulta más abajo).';
  var step=imp?2*2.54:5,base=imp?Math.round(Hc/2.54)*2.54:Math.round(Hc/5)*5;
  C.text('tbT',(male?'Hombres':'Mujeres')+' · razón cintura-cadera < '+cut.toFixed(2));
  $('hpTbl').innerHTML=[-2,-1,0,1,2].map(function(k){var h=base+k*step,x=Wc/h,me=k===0;return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+L(h)+(me?' <small class="p">(más cercano)</small>':'')+'</td><td class="b">'+L(h*cut)+'</td><td>'+x.toFixed(2)+'</td></tr>';}).join('');
  last='Razón cintura-cadera: '+r.toFixed(2)+' ('+(over?'at/above':'below')+' WHO '+(male?'men':'women')+' cut-off '+cut.toFixed(2)+')\nPerímetro de cintura: '+L(Wc)+' — '+wc[0].toLowerCase()+' riesgo (OMS)\n— calculatepilot.com/health/waist-to-hip-ratio-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'whrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
