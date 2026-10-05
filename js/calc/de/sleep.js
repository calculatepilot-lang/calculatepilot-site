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
  C.text('latV',lat+' min');C.text('ageN',lo+' to '+hi+' Stunden empfohlen');$('err').hidden=true;
  $('ageRow').style.display=mode==='nap'?'none':'';
  if(isNaN(t))return fail('Geben Sie eine Uhrzeit ein.');
  var rows=[],best;
  if(mode==='nap'){
    C.text('tL','Ich möchte ein Nickerchen machen um');C.text('hL','Aufwachen um');C.text('lad','Optionen für das Nickerchen');C.text('h1','Aufwachen um');C.text('h2','Art');
    [[20,'Power-Nap'],[30,'Kurzes Nickerchen'],[60,'Risiko für Tiefschlaf'],[90,'Voller Zyklus']].forEach(function(o){rows.push({time:hm(t+lat+o[0]),c:o[1],s:o[0]+' min'});});
    best=rows[0];
    C.text('resultValue',best.time);C.text('tag','20-minütiger Power-Nap');C.text('interp','Einschlafen gegen '+hm(t+lat)+' und nach einem 20-minütigen Nickerchen aufwachen – für einen Wachheitsschub mit wenig Benommenheit.');
    C.text('oSleep','20 Min.');C.text('oBed',(20+lat)+' min');C.text('ladN','after '+lat+' Min. zum Einschlafen');
    C.text('note','Ein Nickerchen von 10 bis 20 Minuten steigert die Wachheit mit wenig Benommenheit. Nickerchen von 30 bis 60 Minuten enden oft im Tiefschlaf und mit stärkerer Benommenheit. Ein 90-minütiges Nickerchen schließt einen Zyklus ab. Vermeiden Sie Nickerchen innerhalb von etwa 6 Stunden vor dem Schlafengehen, wenn es Ihrem Nachtschlaf schadet.');
  }else if(mode==='wake'){
    C.text('tL','Ich muss aufwachen um');C.text('hL','Beste Schlafenszeit');C.text('lad','Weitere Schlafenszeiten');C.text('h1','Schlafengehen um');C.text('h2','Zyklen');
    [6,5,4,3].forEach(function(n){rows.push({time:hm(t-n*90-lat),c:n+' cycles',s:dur(n*90),n:n});});
    best=rows[1];
    C.text('resultValue',best.time);C.text('tag','5 Zyklen');
    C.text('interp','Im Bett sein um '+best.time+' und eingeschlafen gegen '+hm(t-450)+' um aufzuwachen um '+hm(t)+' nach 5 vollen Zyklen.');
    C.text('oSleep','7 Std. 30 Min.');C.text('oBed',dur(450+lat));C.text('ladN','für eine '+hm(t)+' aufwachen');
    C.text('note',(7.5>=lo&&7.5<=hi?'7,5 Stunden liegen innerhalb der empfohlenen '+lo+' to '+hi+' Stunden für diese Altersgruppe.':'7,5 Stunden liegen außerhalb der empfohlenen '+lo+' to '+hi+' Stunden für diese Altersgruppe. Wählen Sie die 6-Zyklen-Option für 9 Stunden.')+' Weniger als 4 Zyklen (6 Stunden) lassen die meisten Erwachsenen mit zu wenig Schlaf zurück.');
  }else{
    C.text('tL','Ich möchte ins Bett gehen um');C.text('hL','Aufwachen um');C.text('lad','Weitere Aufwachzeiten');C.text('h1','Aufwachen um');C.text('h2','Zyklen');
    [3,4,5,6].forEach(function(n){rows.push({time:hm(t+lat+n*90),c:n+' cycles',s:dur(n*90),n:n});});
    best=rows[2];
    C.text('resultValue',best.time);C.text('tag','5 Zyklen');
    C.text('interp','Wenn Sie etwa '+hm(t+lat)+'einschlafen, enden 5 volle Zyklen um '+best.time+'.');
    C.text('oSleep','7 Std. 30 Min.');C.text('oBed',dur(450+lat));C.text('ladN','im Bett um '+hm(t));
    C.text('note',(7.5>=lo&&7.5<=hi?'7,5 Stunden passen zu den empfohlenen '+lo+' to '+hi+' Stunden für diese Altersgruppe.':'7,5 Stunden liegen außerhalb der empfohlenen '+lo+' to '+hi+' Stunden für diese Altersgruppe. Erwägen Sie die 6-Zyklen-Option.')+' Stellen Sie den Wecker auf eine dieser Zeiten statt auf eine beliebige.');
  }
  $('rows').innerHTML=rows.map(function(r){return '<tr><td class="a"><b>'+r.time+'</b></td><td class="n">'+r.c+'</td><td class="n">'+r.s+'</td></tr>';}).join('');
  last='Schlafrechner — calculatepilot.com/other/sleep-calculator.html\n'+$('hL').textContent+': '+best.time;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'slCalc',compute:compute});
  document.querySelectorAll('[data-t]').forEach(function(b){b.addEventListener('click',function(){$('t').value=b.getAttribute('data-t');$('t').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
