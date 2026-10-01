/* BAC calculator — CalculatePilot (redesign, PSEO standards).
   Widmark: BAC% = A(g) ÷ (W(g) × r) × 100 − 0.015 × t; r = 0.68 (men), 0.55 (women).
   A = standard drinks × 14 g (NIAAA), or drinks × mL × ABV/100 × 0.789. Elimination 0.015%/h (average). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null,OZ=29.5735;

function compute(){
  var imp=$('u').value==='s1',cus=$('dm').value==='s2';
  if(prevU!==null&&prevU!==$('u').value){$('wt').value=Math.round(v('wt')*(imp?2.20462:1/2.20462));$('cs').value=imp?Math.round(v('cs')/OZ*2)/2:Math.round(v('cs')*OZ);}prevU=$('u').value;
  C.text('wU',imp?'lb':'kg');C.text('sU',imp?'oz':'mL');$('sdRow').hidden=cus;$('cuRow').hidden=!cus;
  var kg=imp?v('wt')/2.20462:v('wt'),r=$('sex').value==='s1'?0.68:0.55,h=Math.max(0,v('h'));
  var A=cus?v('cn')*(imp?v('cs')*OZ:v('cs'))*v('abv')/100*0.789:v('n')*14;
  if(!(kg>0)||!(A>=0))return;
  var peak=A/(kg*1000*r)*100,now=Math.max(0,peak-0.015*h),tz=now/0.015,t=$('tag');
  C.text('resultValue',now.toFixed(3));
  var lvl=now>=0.08?['0.08% o más','hi']:now>=0.05?['0.05% o más','hi']:now>0?['Aún hay alcohol presente','mid']:['Estimado 0.00%',''];
  t.textContent=lvl[0];t.className='sx-ef-grade'+(lvl[1]?' '+lvl[1]:'');
  C.text('rN',Math.round(A)+' g de alcohol ÷ ('+(Math.round(kg*10)/10)+' kg × '+r+') = '+peak.toFixed(3)+'%, menos 0.015% × '+h+' h. Tu BAC real puede ser mayor o menor.');
  C.text('pk',peak.toFixed(3)+'%');C.text('tz',now>0?'Acerca de '+(Math.round(tz*2)/2)+' horas más':'Ahora (estimado)');
  C.text('ag',Math.round(A)+' g');C.text('sd',(A/14).toFixed(1));
  $('warn').innerHTML=now>=0.08?'<b style="color:var(--sx-err)">No conduzcas.</b> Esta estimación está en el límite legal de 0.08% o por encima, y la afectación empieza mucho antes.':'<b>Nunca conduzcas después de beber</b>: la afectación comienza con niveles bajos de BAC y esto es solo una estimación. Planifica un transporte sobrio.';
  var rows='',hr=Math.floor(h);for(var i=0;i<14;i++){var th=hr+i,b=Math.round(Math.max(0,peak-0.015*th)*1000)/1000;rows+='<tr'+(i===0?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+th+' h'+(i===0?' <small class="p">(ahora)</small>':'')+'</td><td class="b">'+b.toFixed(3)+'%</td><td style="font-family:inherit">'+(b>=0.08?'En o por encima de':b>0?'Por debajo del límite — aún bajo los efectos':'Cero estimado')+'</td></tr>';if(b<=0)break;}
  $('tlTbl').innerHTML=rows;
  last='BAC estimado: '+now.toFixed(3)+'% (Widmark, estimación educativa — nunca la uses para decidir si puedes conducir)\n— calculatepilot.com/health/bac-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bacCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copiado');setTimeout(function(){C.text('copyTxt','Copiar estimación');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
