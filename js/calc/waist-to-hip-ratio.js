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
  C.text('resultValue',r.toFixed(2));t.textContent=over?'Substantially increased risk':'Below WHO threshold';t.className='sx-ef-grade'+(over?' hi':'');
  C.text('rN',over?'At or above the WHO '+(male?'men\'s':'women\'s')+' cut-off of '+cut.toFixed(2)+' — linked to a substantially increased risk of metabolic complications.':'Below the WHO '+(male?'men\'s':'women\'s')+' cut-off of '+cut.toFixed(2)+'. Fat distribution alone does not indicate substantially increased risk.');
  var lo=0.65,hi=1.15,segs=[[cut,'#22c55e','Below '+cut.toFixed(2)],[hi,'#ef4444',cut.toFixed(2)+'+']],prev=lo;
  C.text('specT','WHR scale ('+(male?'men':'women')+')');
  $('specBar').innerHTML=segs.map(function(s){var w=(s[0]-prev)/(hi-lo)*100;prev=s[0];return '<span style="width:'+w+'%;background:'+s[1]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(r-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=segs.map(function(s){return '<span>'+s[2]+'</span>';}).join('');C.text('specV',r.toFixed(2));
  C.text('cutL','WHO threshold ('+(male?'men':'women')+')');C.text('cut',cut.toFixed(2));C.text('maxW','Under '+L(Hc*cut));
  var wc=Wc>w2?['Substantially increased','hi']:Wc>w1?['Increased','mid']:['Not increased',''];
  C.text('wcTag',wc[0]);C.text('wcV',L(Wc));C.text('wc1','Above '+L(w1));C.text('wc2','Above '+L(w2));
  $('warn').textContent=over&&!(Wc>w1)?'Your ratio is above the cut-off but your waist size is not in a raised range — WHR can be high simply because hips are narrow, so consider both measures together.':'A screening measure, not a diagnosis. Cut-offs may be lower for some ethnic groups (see below).';
  var step=imp?2*2.54:5,base=imp?Math.round(Hc/2.54)*2.54:Math.round(Hc/5)*5;
  C.text('tbT',(male?'Men':'Women')+' · WHR < '+cut.toFixed(2));
  $('hpTbl').innerHTML=[-2,-1,0,1,2].map(function(k){var h=base+k*step,x=Wc/h,me=k===0;return '<tr'+(me?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+L(h)+(me?' <small class="p">(nearest)</small>':'')+'</td><td class="b">'+L(h*cut)+'</td><td>'+x.toFixed(2)+'</td></tr>';}).join('');
  last='Waist-to-hip ratio: '+r.toFixed(2)+' ('+(over?'at/above':'below')+' WHO '+(male?'men':'women')+' cut-off '+cut.toFixed(2)+')\nWaist circumference: '+L(Wc)+' — '+wc[0].toLowerCase()+' risk (WHO)\n— calculatepilot.com/health/waist-to-hip-ratio-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'whrCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Results');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
