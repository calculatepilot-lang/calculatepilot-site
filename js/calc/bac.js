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
  var lvl=now>=0.08?['At or above 0.08%','hi']:now>=0.05?['0.05% or higher','hi']:now>0?['Alcohol still present','mid']:['Estimated 0.00%',''];
  t.textContent=lvl[0];t.className='sx-ef-grade'+(lvl[1]?' '+lvl[1]:'');
  C.text('rN',Math.round(A)+' g alcohol ÷ ('+(Math.round(kg*10)/10)+' kg × '+r+') = '+peak.toFixed(3)+'%, minus 0.015% × '+h+' h. Your real BAC may be higher or lower.');
  C.text('pk',peak.toFixed(3)+'%');C.text('tz',now>0?'About '+(Math.round(tz*2)/2)+' more hours':'Now (estimated)');
  C.text('ag',Math.round(A)+' g');C.text('sd',(A/14).toFixed(1));
  $('warn').innerHTML=now>=0.08?'<b style="color:var(--sx-err)">Do not drive.</b> This estimate is at or above the 0.08% legal limit — and impairment starts well below it.':'<b>Never drive after drinking</b> — impairment begins at low BACs, and this is only an estimate. Plan a sober ride.';
  var rows='',hr=Math.floor(h);for(var i=0;i<14;i++){var th=hr+i,b=Math.round(Math.max(0,peak-0.015*th)*1000)/1000;rows+='<tr'+(i===0?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+th+' h'+(i===0?' <small class="p">(now)</small>':'')+'</td><td class="b">'+b.toFixed(3)+'%</td><td style="font-family:inherit">'+(b>=0.08?'At or above':b>0?'Below limit — still impaired':'Estimated zero')+'</td></tr>';if(b<=0)break;}
  $('tlTbl').innerHTML=rows;
  last='Estimated BAC: '+now.toFixed(3)+'% (Widmark, educational estimate — never use to decide whether to drive)\n— calculatepilot.com/health/bac-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bacCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Estimate');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
