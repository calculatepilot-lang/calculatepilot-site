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
  var lvl=now>=0.08?['Bei oder über 0.08 %','hi']:now>=0.05?['0.05 % oder höher','hi']:now>0?['Alkohol noch nachweisbar','mid']:['Geschätzt 0.00 %',''];
  t.textContent=lvl[0];t.className='sx-ef-grade'+(lvl[1]?' '+lvl[1]:'');
  C.text('rN',Math.round(A)+' g Alkohol ÷ ('+(Math.round(kg*10)/10)+' kg × '+r+') = '+peak.toFixed(3)+'%, minus 0.015 % × '+h+' Std. Ihr tatsächlicher Blutalkoholwert kann höher oder niedriger sein.');
  C.text('pk',peak.toFixed(3)+'%');C.text('tz',now>0?'Über uns '+(Math.round(tz*2)/2)+' weitere Stunden':'Jetzt (geschätzt)');
  C.text('ag',Math.round(A)+' g');C.text('sd',(A/14).toFixed(1));
  $('warn').innerHTML=now>=0.08?'<b style="color:var(--sx-err)">Fahren Sie nicht.</b> Diese Schätzung liegt bei oder über dem gesetzlichen Grenzwert von 0.08 % — und Beeinträchtigungen beginnen schon weit darunter.':'<b>Fahren Sie niemals nach dem Trinken</b> — Beeinträchtigungen beginnen schon bei niedrigen Werten, und dies ist nur eine Schätzung. Planen Sie eine nüchterne Heimfahrt.';
  var rows='',hr=Math.floor(h);for(var i=0;i<14;i++){var th=hr+i,b=Math.round(Math.max(0,peak-0.015*th)*1000)/1000;rows+='<tr'+(i===0?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+th+' h'+(i===0?' <small class="p">(jetzt)</small>':'')+'</td><td class="b">'+b.toFixed(3)+'%</td><td style="font-family:inherit">'+(b>=0.08?'Bei oder über':b>0?'Unter dem Grenzwert — dennoch beeinträchtigt':'Geschätzt null')+'</td></tr>';if(b<=0)break;}
  $('tlTbl').innerHTML=rows;
  last='Geschätzter Blutalkoholwert: '+now.toFixed(3)+'% (Widmark, Schätzung zu Bildungszwecken — nicht zur Entscheidung über das Fahren verwenden)\n— calculatepilot.com/health/bac-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bacCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Schätzung kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
