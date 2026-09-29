/* Sleep cycle calculator — CalculatePilot (Stitch redesign).
   90-minute cycles. Mode wake: bedtime = wake − N×90 − latency. Mode bed: wake = bed + latency + N×90. Mode nap: end = start + latency + minutes. */
(function(){
var C=window.CPX,$=C.$,last='';
function hm(m){m=((Math.round(m)%1440)+1440)%1440;var h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM',h12=h%12||12;return h12+':'+(mm<10?'0':'')+mm+' '+ap;}
function dur(m){var h=Math.floor(m/60),r=m%60;return h+'h '+(r<10?'0':'')+r+'m';}
function parse(v){var p=(v||'').split(':');if(p.length<2)return NaN;return (+p[0])*60+(+p[1]);}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oSleep','oBed'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function compute(){
  var mode=$('mode').value,t=parse($('t').value),lat=C.val('lat'),age=$('age').value.split('-'),lo=+age[0],hi=+age[1];
  C.text('latV',lat+' min');C.text('ageN',lo+' to '+hi+' hours recommended');$('err').hidden=true;
  $('ageRow').style.display=mode==='nap'?'none':'';
  if(isNaN(t))return fail('Enter a time.');
  var rows=[],best;
  if(mode==='nap'){
    C.text('tL','I plan to nap at');C.text('hL','Wake up at');C.text('lad','Nap options');C.text('h1','Wake at');C.text('h2','Type');
    [[20,'Power nap'],[30,'Short nap'],[60,'Deep sleep risk'],[90,'Full cycle']].forEach(function(o){rows.push({time:hm(t+lat+o[0]),c:o[1],s:o[0]+' min'});});
    best=rows[0];
    C.text('resultValue',best.time);C.text('tag','20 minute power nap');C.text('interp','Fall asleep around '+hm(t+lat)+' and wake after a 20 minute nap for an alertness boost with little grogginess.');
    C.text('oSleep','20 min');C.text('oBed',(20+lat)+' min');C.text('ladN','after '+lat+' min to fall asleep');
    C.text('note','A 10 to 20 minute nap helps alertness with little grogginess. Naps of 30 to 60 minutes often end in deep sleep and heavier grogginess. A 90-minute nap completes a cycle. Avoid napping within about 6 hours of bedtime if it hurts your night sleep.');
  }else if(mode==='wake'){
    C.text('tL','I need to wake up at');C.text('hL','Best bedtime');C.text('lad','Other bedtimes');C.text('h1','Go to bed at');C.text('h2','Cycles');
    [6,5,4,3].forEach(function(n){rows.push({time:hm(t-n*90-lat),c:n+' cycles',s:dur(n*90),n:n});});
    best=rows[1];
    C.text('resultValue',best.time);C.text('tag','5 cycles');
    C.text('interp','Be in bed at '+best.time+' and asleep by about '+hm(t-450)+' to wake at '+hm(t)+' after 5 full cycles.');
    C.text('oSleep','7h 30m');C.text('oBed',dur(450+lat));C.text('ladN','for a '+hm(t)+' wake up');
    C.text('note',(7.5>=lo&&7.5<=hi?'7.5 hours sits inside the recommended '+lo+' to '+hi+' hours for this age group.':'7.5 hours is outside the recommended '+lo+' to '+hi+' hours for this age group. Pick the 6 cycle option for 9 hours.')+' Fewer than 4 cycles (6 hours) leaves most adults short on sleep.');
  }else{
    C.text('tL','I plan to go to bed at');C.text('hL','Wake up at');C.text('lad','Other wake times');C.text('h1','Wake up at');C.text('h2','Cycles');
    [3,4,5,6].forEach(function(n){rows.push({time:hm(t+lat+n*90),c:n+' cycles',s:dur(n*90),n:n});});
    best=rows[2];
    C.text('resultValue',best.time);C.text('tag','5 cycles');
    C.text('interp','If you fall asleep about '+hm(t+lat)+', 5 full cycles end at '+best.time+'.');
    C.text('oSleep','7h 30m');C.text('oBed',dur(450+lat));C.text('ladN','bed at '+hm(t));
    C.text('note',(7.5>=lo&&7.5<=hi?'7.5 hours fits the recommended '+lo+' to '+hi+' hours for this age group.':'7.5 hours is outside the recommended '+lo+' to '+hi+' hours for this age group. Consider the 6 cycle option.')+' Set an alarm for one of these times rather than a random one.');
  }
  $('rows').innerHTML=rows.map(function(r){return '<tr><td class="a"><b>'+r.time+'</b></td><td class="n">'+r.c+'</td><td class="n">'+r.s+'</td></tr>';}).join('');
  last='Sleep calculator — calculatepilot.com/other/sleep-calculator.html\n'+$('hL').textContent+': '+best.time;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'slCalc',compute:compute});
  document.querySelectorAll('[data-t]').forEach(function(b){b.addEventListener('click',function(){$('t').value=b.getAttribute('data-t');$('t').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
