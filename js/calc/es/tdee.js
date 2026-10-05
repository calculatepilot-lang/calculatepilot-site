/* TDEE calculator — CalculatePilot (redesign, BMI/Stitch pattern).
   BMR: Mifflin-St Jeor 10W + 6.25H − 5A + 5 (men) / − 161 (women); Harris-Benedict revised (Roza & Shizgal 1984)
   men 88.362 + 13.397W + 4.799H − 5.677A, women 447.593 + 9.247W + 3.098H − 4.330A; Katch-McArdle 370 + 21.6 LBM;
   Cunningham 500 + 22 LBM (LBM = W × (1 − body fat)). TDEE = BMR × activity. TEF ≈ 10% of TDEE.
   Goal = TDEE × (1 + goal%). Weekly change ≈ (goal − TDEE) × 7 ÷ 7,700 kcal per kg. Macros 30/30/40 at 4/9/4 kcal per g. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var ACT=[[1.2,'Sedentaria'],[1.375,'Ligeramente activa'],[1.55,'Moderadamente activa'],[1.725,'Muy activa'],[1.9,'Extremadamente activo']];

function K(x){return isFinite(x)?Math.round(x).toLocaleString('es-ES'):'—';}
function bmrs(w,h,a,male,bf){var lbm=bf>0&&bf<70?w*(1-bf/100):null;
  return {mif:10*w+6.25*h-5*a+(male?5:-161),hb:male?88.362+13.397*w+4.799*h-5.677*a:447.593+9.247*w+3.098*h-4.330*a,km:lbm?370+21.6*lbm:null,cun:lbm?500+22*lbm:null,lbm:lbm};}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;$('wt').value=Math.round(v('wt')*2.20462);}
    else{$('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;$('wt').value=Math.round(v('wt')/2.20462*10)/10;}
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');
  var h=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),w=imp?v('wt')/2.20462:v('wt'),a=v('age'),male=$('sex').value==='s1',bf=v('bf'),act=+$('act').value,g=+$('goal').value;
  C.text('hAlt',imp?Math.round(h)+' cm':Math.floor(h/2.54/12)+'′ '+Math.round((h/2.54)%12)+'″');C.text('actOut','× '+act);
  if(!(h>0&&w>0&&a>0))return;
  var B=bmrs(w,h,a,male,bf),fm=$('fm').value;if((fm==='km'||fm==='cun')&&!B.lbm)fm='mif';
  var names={mif:'Mifflin-St Jeor',hb:'Harris-Benedict',km:'Katch-McArdle',cun:'Cunningham'},bmr=B[fm],tdee=bmr*act,gc=tdee*(1+g/100),dW=(gc-tdee)*7/7700;
  C.text('fmHelp',B.lbm?'Masa corporal magra: '+(imp?K(B.lbm*2.20462)+' lb':B.lbm.toFixed(1)+' kg')+'. All four formulas are available.':($('fm').value==='km'||$('fm').value==='cun'?'Introduce tu % de grasa corporal para usar una fórmula de masa magra; por ahora se muestra Mifflin-St Jeor.':'Agrega un % de grasa corporal (p. ej., de la calculadora de grasa corporal) para desbloquear Katch-McArdle y Cunningham.'));
  C.text('fmTag',names[fm]);C.text('resultValue',K(tdee));
  C.text('tdN','Calorías estimadas que quemas al día con "'+ACT.filter(function(x){return x[0]===act;})[0][1].toLowerCase()+'": come esta cantidad para mantener tu peso.');
  C.text('bmr',K(bmr)+' kcal');C.text('gL',g===0?'Calorías objetivo (mantenimiento)':'Calorías objetivo ('+(g>0?'+':'')+g+'%)');C.text('gc',K(gc)+' kcal');
  var gb=$('gBox');gb.className='gain'+(g<0?'':g===0?' neg':'');
  C.text('gTxt',g===0?'Mantenimiento — sin cambio deliberado':g<0?'Pérdida inicial aproximada':'Aumento aproximado');
  C.text('gW',g===0?'±0':(g<0?'−':'+')+(imp?(Math.abs(dW)*2.20462).toFixed(2)+' lb':Math.abs(dW).toFixed(2)+' kg')+' / week');
  var wn=$('warn');
  if(gc<800){wn.innerHTML='<b style="color:var(--sx-err)">Por debajo de 800 kcal/día</b> es una dieta muy baja en calorías y requiere supervisión médica.';}
  else if(gc<bmr){wn.innerHTML='<b style="color:var(--sx-err)">Este objetivo está por debajo de tu TMB.</b> Comer por debajo de tus necesidades en reposo a largo plazo es difícil de sostener y arriesga pérdida de músculo: considera un déficit menor.';}
  else wn.textContent=a<18?'Las fórmulas están validadas para adultos; las necesidades energéticas de los adolescentes incluyen el crecimiento: consulta con un médico o dietista.':'Solo son estimaciones: controla tu peso durante 2–3 semanas y ajusta en 100–200 kcal según sea necesario.';
  var tef=tdee*0.10,actE=Math.max(0,tdee-bmr-tef),parts=[['TMB (en reposo)',bmr,'var(--sx-primary)'],['Digestión (TEF ~10 %)',tef,'#f59e0b'],['Actividad y movimiento',actE,'#34d399']];
  $('enBar').innerHTML=parts.map(function(p){return '<span style="width:'+(p[1]/tdee*100)+'%;background:'+p[2]+'"></span>';}).join('');
  $('enLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' '+K(p[1])+' ('+Math.round(p[1]/tdee*100)+'%)</span>';}).join('');
  var show=function(id,x,nid){C.text(id,x?K(x)+' kcal':'Requiere el % de grasa corporal');if(nid)C.text(nid,x?'TMB · GET '+K(x*act)+' kcal':'Introduce el % de grasa corporal para calcular');};
  C.text('f1',K(B.mif)+' kcal');C.text('f1n','TMB · GET '+K(B.mif*act)+' kcal');C.text('f2',K(B.hb)+' kcal');C.text('f2n','TMB · GET '+K(B.hb*act)+' kcal');show('f3',B.km,'f3n');show('f4',B.cun,'f4n');
  $('actTbl').innerHTML=ACT.map(function(x){var t=bmr*x[0],d=t-tdee;return '<tr'+(x[0]===act?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[1]+(x[0]===act?' <small class="p">(el tuyo)</small>':'')+'</td><td>× '+x[0]+'</td><td class="b">'+K(t)+' kcal</td><td class="'+(d>0?'pos':d<0?'r':'mu')+'">'+(Math.abs(d)<1?'—':(d>0?'+':'−')+K(Math.abs(d))+' kcal')+'</td></tr>';}).join('');
  C.text('actN','Las mismas '+K(bmr)+' kcal de TMB oscilan entre '+K(bmr*1.2)+' to '+K(bmr*1.9)+' kcal/día según los niveles de actividad: elige con honestidad; la mayoría de las personas la sobrestima.');
  var n=+$('meals').value||3,P=gc*.3/4,F=gc*.3/9,Cb=gc*.4/4;
  C.text('mealN','30 % proteína / 30 % grasa / 40 % carbohidratos de tu '+K(gc)+' kcal objetivo — un punto de partida general, repartido en '+n+' comidas.');
  $('mealTbl').innerHTML='<tr style="background:var(--sx-emb)"><td style="font-family:inherit;font-weight:700">Día</td><td class="b">'+K(gc)+' kcal</td><td>'+K(P)+' g</td><td>'+K(F)+' g</td><td>'+K(Cb)+' g</td></tr><tr><td style="font-family:inherit;font-weight:600">Cada una de '+n+' comidas</td><td>'+K(gc/n)+' kcal</td><td>'+K(P/n)+' g</td><td>'+K(F/n)+' g</td><td>'+K(Cb/n)+' g</td></tr>';
  last='GET: '+K(tdee)+' kcal/día ('+names[fm]+', actividad × '+act+')\nBMR: '+K(bmr)+' kcal\nCalorías objetivo: '+K(gc)+' kcal ('+(g>0?'+':'')+g+'%)\nMacros (30/30/40): '+K(P)+' g de proteína, '+K(F)+' g de grasa, '+K(Cb)+' g de carbohidratos\n— calculatepilot.com/health/tdee-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'tdCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar resultados');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpTdee={bmrs:bmrs};
})();
