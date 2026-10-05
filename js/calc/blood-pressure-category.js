/* Blood pressure category calculator — CalculatePilot (redesign, PSEO standards).
   AHA chart (reviewed Aug 2025, aligned with the 2025 AHA/ACC guideline): Normal <120 and <80; Elevated 120–129 and <80;
   Stage 1 130–139 or 80–89; Stage 2 ≥140 or ≥90; Severe hypertension >180 and/or >120 (hypertensive emergency if symptoms).
   Readings averaged. Pulse pressure = SBP − DBP; MAP ≈ DBP + (SBP − DBP)/3. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var CAT=[['Normal','','Less than 120','and','Less than 80'],['Elevated','mid','120–129','and','Less than 80'],['Stage 1 hypertension','hi','130–139','or','80–89'],['Stage 2 hypertension','hi','140 or higher','or','90 or higher'],['Severe hypertension','hi','Higher than 180','and/or','Higher than 120']];
function sc(s){return s>180?4:s>=140?3:s>=130?2:s>=120?1:0;}
function dc(d){return d>120?4:d>=90?3:d>=80?2:0;}

function compute(){
  var rs=[1,2,3].map(function(i){return [v('s'+i),v('d'+i)];}).filter(function(r){return r[0]>0&&r[1]>0;});
  if(!rs.length)return;
  var S=rs.reduce(function(a,r){return a+r[0];},0)/rs.length,D=rs.reduce(function(a,r){return a+r[1];},0)/rs.length,Sr=Math.round(S),Dr=Math.round(D);
  var ci=Math.max(sc(Sr),dc(Dr)),sym=$('sym').value==='s2',t=$('tag');
  var name=ci===4&&sym?'Hypertensive emergency':CAT[ci][0];
  C.text('hdL',rs.length>1?'Category (average of '+rs.length+' readings)':'Blood pressure category');
  C.text('resultValue',name);t.textContent=Sr+'/'+Dr+' mm Hg';t.className='sx-ef-grade'+(CAT[ci][1]?' '+CAT[ci][1]:'');
  var why=sc(Sr)===dc(Dr)?'both numbers':sc(Sr)>dc(Dr)?'your systolic of '+Sr:'your diastolic of '+Dr;
  C.text('rN',(rs.length>1?'Average of '+rs.map(function(r){return r[0]+'/'+r[1];}).join(', ')+' = '+Sr+'/'+Dr+'. ':'')+(ci?'Set by '+why+'.':'Both numbers are in the normal range.'));
  var segs=[[120,'#22c55e','<120'],[130,'#facc15','120–129'],[140,'#f59e0b','130–139'],[180,'#ef4444','140–180'],[200,'#991b1b','>180']],lo=90,hi=200,prev=lo;
  $('specBar').innerHTML=segs.map(function(s){var w=(s[0]-prev)/(hi-lo)*100;prev=s[0];return '<span style="width:'+w+'%;background:'+s[1]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(S-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=segs.map(function(s){return '<span>'+s[2]+'</span>';}).join('');C.text('specV',String(Sr));
  C.text('pp',Math.round(S-D)+' mm Hg');C.text('map',Math.round(D+(S-D)/3)+' mm Hg');
  var wn=$('warn');
  if(ci===4&&sym)wn.innerHTML='<b style="color:var(--sx-err)">Call 911 or your local emergency number now.</b> A reading above 180/120 with symptoms may be a hypertensive emergency.';
  else if(ci===4)wn.innerHTML='<b style="color:var(--sx-err)">Wait 1 minute and measure again.</b> If it\'s still above 180/120, contact your healthcare professional right away. If symptoms start, call 911.';
  else if(ci>=2)wn.textContent='In the hypertension range — recheck on different days and discuss the results with a healthcare professional.';
  else if(ci===1)wn.textContent='Elevated — heart-healthy habits (diet, activity, less salt and alcohol) can help keep it from rising.';
  else if(Sr<90||Dr<60)wn.textContent='A reading below 90/60 can be low blood pressure — mention it to a clinician if you have dizziness or fainting.';
  else wn.textContent='Normal — keep checking regularly. A single reading is not a diagnosis.';
  C.text('tbT','You: '+name);
  $('catTbl').innerHTML=CAT.map(function(x,i){return '<tr'+(i===ci?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+(i===4?' <small>(emergency if symptoms)</small>':'')+'</td><td>'+x[2]+'</td><td style="font-family:inherit">'+x[3]+'</td><td>'+x[4]+'</td></tr>';}).join('');
  last='Blood pressure: '+Sr+'/'+Dr+' mm Hg — '+name+' (AHA)\n— calculatepilot.com/health/blood-pressure-category-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bpCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Result');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
