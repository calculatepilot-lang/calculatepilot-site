/* Waist-to-height ratio calculator — CalculatePilot (redesign, PSEO standards).
   WHtR = waist ÷ height (same unit). NICE adult classes: 0.4–0.49 healthy central adiposity, 0.5–0.59 increased, ≥0.6 high.
   Below 0.4 is not a NICE class. Target waist for WHtR < 0.5 = height ÷ 2. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
function cat(r){return r<0.4?['Por debajo de 0.4','mid']:r<0.5?['Saludable','']:r<0.6?['Aumentado','mid']:['Alto','hi'];}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
    $('waist').value=Math.round(v('waist')*(imp?1/2.54:2.54)*2)/2;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'in':'cm');
  var H=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),Wc=imp?v('waist')*2.54:v('waist');
  var L=function(cm){return imp?(Math.round(cm/2.54*10)/10).toFixed(1)+' in':(Math.round(cm*10)/10).toFixed(1)+' cm';};
  C.text('hAlt',imp?Math.round(H)+' cm':Math.floor(H/2.54/12)+'′ '+Math.round(H/2.54%12)+'″');
  if(!(H>50&&Wc>0))return;
  var r=Wc/H,c=cat(r),t=$('catTag');
  C.text('resultValue',r.toFixed(2));t.textContent=c[0];t.className='sx-ef-grade'+(c[1]?' '+c[1]:'');
  C.text('rN',r<0.4?'Por debajo de las clasificaciones del NICE, que empiezan en 0.4: revisa tu IMC para asegurarte de que no tienes bajo peso.':r<0.5?'Adiposidad central saludable (NICE 0.4–0.49): sin mayores riesgos para la salud por la grasa abdominal.':r<0.6?'Adiposidad central aumentada (NICE 0.5–0.59): mayores riesgos para la salud.':'Adiposidad central alta (NICE 0.6 o más): riesgos para la salud todavía mayores.');
  var segs=[[0.4,'#60a5fa','<0.4'],[0.5,'#22c55e','0.4–0.49'],[0.6,'#f59e0b','0.5–0.59'],[0.75,'#ef4444','0.6+']],lo=0.3,hi=0.75,prev=lo;
  $('specBar').innerHTML=segs.map(function(s){var w=(s[0]-prev)/(hi-lo)*100;prev=s[0];return '<span style="width:'+w+'%;background:'+s[1]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(r-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=segs.map(function(s){return '<span>'+s[2]+'</span>';}).join('');C.text('specV',r.toFixed(2));
  C.text('t5','Menos de '+L(H*0.5));C.text('t4',L(H*0.4)+' – '+L(H*0.49));
  var cb=$('chgBox'),d=Wc-H*0.5;
  if(r>=0.5){cb.className='gain neg';C.text('chgL','Reducción de cintura para alcanzar una razón inferior a 0.5');C.text('chgV',L(d));}
  else{cb.className='gain';C.text('chgL','Margen por debajo del límite de 0.5');C.text('chgV',L(-d));}
  $('warn').textContent='El NICE recomienda la razón cintura-estatura para adultos con un IMC inferior a 35, junto con el IMC. Es una medida de cribado, no un diagnóstico.';
  var base=imp?Math.round(H/2.54):Math.round(H/5)*5,step=imp?2:5,rows=[-2,-1,0,1,2].map(function(k){return base+k*step;});
  C.text('tbT',imp?'Pulgadas':'Centímetros');
  $('htTbl').innerHTML=rows.map(function(h){var hc=imp?h*2.54:h,me=h===base;return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+(imp?Math.floor(h/12)+'′ '+(h%12)+'″':h+' cm')+(me?' <small class="p">(más cercano)</small>':'')+'</td><td>'+L(hc*0.4)+'</td><td class="b">'+L(hc*0.5)+'</td><td>'+L(hc*0.6)+'</td></tr>';}).join('');
  last='Razón cintura-estatura: '+r.toFixed(2)+' ('+c[0]+', NICE)\nCintura para una razón inferior a 0.5: menos de '+L(H*0.5)+'\n— calculatepilot.com/health/waist-to-height-ratio-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'whtrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
