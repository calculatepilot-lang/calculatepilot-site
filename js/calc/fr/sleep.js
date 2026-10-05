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
  C.text('latV',lat+' min');C.text('ageN',lo+' to '+hi+' heures recommandées');$('err').hidden=true;
  $('ageRow').style.display=mode==='nap'?'none':'';
  if(isNaN(t))return fail('Saisissez une heure.');
  var rows=[],best;
  if(mode==='nap'){
    C.text('tL','Je prévois de faire la sieste à');C.text('hL','Réveil à');C.text('lad','Options de sieste');C.text('h1','Réveil à');C.text('h2','Type');
    [[20,'Micro-sieste'],[30,'Sieste courte'],[60,'Risque de sommeil profond'],[90,'Cycle complet']].forEach(function(o){rows.push({time:hm(t+lat+o[0]),c:o[1],s:o[0]+' min'});});
    best=rows[0];
    C.text('resultValue',best.time);C.text('tag','Micro-sieste de 20 minutes');C.text('interp','Endormez-vous vers '+hm(t+lat)+' et réveillez-vous après 20 minutes de sieste pour un regain de vigilance sans grande somnolence.');
    C.text('oSleep','20 min');C.text('oBed',(20+lat)+' min');C.text('ladN','after '+lat+' min pour s\'endormir');
    C.text('note','Une sieste de 10 à 20 minutes améliore la vigilance avec peu de somnolence au réveil. Les siestes de 30 à 60 minutes se terminent souvent en sommeil profond et laissent une plus forte somnolence. Une sieste de 90 minutes complète un cycle. Évitez de faire la sieste dans les 6 heures qui précèdent le coucher si cela nuit à votre sommeil nocturne.');
  }else if(mode==='wake'){
    C.text('tL','Je dois me réveiller à');C.text('hL','Meilleure heure de coucher');C.text('lad','Autres heures de coucher');C.text('h1','Se coucher à');C.text('h2','Cycles');
    [6,5,4,3].forEach(function(n){rows.push({time:hm(t-n*90-lat),c:n+' cycles',s:dur(n*90),n:n});});
    best=rows[1];
    C.text('resultValue',best.time);C.text('tag','5 cycles');
    C.text('interp','Soyez au lit à '+best.time+' et endormi vers '+hm(t-450)+' pour vous réveiller à '+hm(t)+' après 5 cycles complets.');
    C.text('oSleep','7 h 30');C.text('oBed',dur(450+lat));C.text('ladN','pour une '+hm(t)+' réveil');
    C.text('note',(7.5>=lo&&7.5<=hi?'7,5 heures se situent dans la fourchette recommandée de '+lo+' to '+hi+' heures pour cette tranche d\'âge.':'7,5 heures sont en dehors de la fourchette recommandée de '+lo+' to '+hi+' heures pour cette tranche d\'âge. Choisissez l\'option à 6 cycles pour 9 heures.')+' Moins de 4 cycles (6 heures) laisse la plupart des adultes en manque de sommeil.');
  }else{
    C.text('tL','Je prévois d\'aller me coucher à');C.text('hL','Réveil à');C.text('lad','Autres heures de réveil');C.text('h1','Réveil à');C.text('h2','Cycles');
    [3,4,5,6].forEach(function(n){rows.push({time:hm(t+lat+n*90),c:n+' cycles',s:dur(n*90),n:n});});
    best=rows[2];
    C.text('resultValue',best.time);C.text('tag','5 cycles');
    C.text('interp','Si vous vous endormez environ '+hm(t+lat)+', 5 cycles complets se terminent à '+best.time+'.');
    C.text('oSleep','7 h 30');C.text('oBed',dur(450+lat));C.text('ladN','coucher à '+hm(t));
    C.text('note',(7.5>=lo&&7.5<=hi?'7,5 heures correspondent à la fourchette recommandée de '+lo+' to '+hi+' heures pour cette tranche d\'âge.':'7,5 heures sont en dehors de la fourchette recommandée de '+lo+' to '+hi+' heures pour cette tranche d\'âge. Envisagez l\'option à 6 cycles.')+' Réglez une alarme sur l\'une de ces heures plutôt que sur une heure au hasard.');
  }
  $('rows').innerHTML=rows.map(function(r){return '<tr><td class="a"><b>'+r.time+'</b></td><td class="n">'+r.c+'</td><td class="n">'+r.s+'</td></tr>';}).join('');
  last='Calculateur de sommeil — calculatepilot.com/other/sleep-calculator.html\n'+$('hL').textContent+': '+best.time;
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'slCalc',compute:compute});
  document.querySelectorAll('[data-t]').forEach(function(b){b.addEventListener('click',function(){$('t').value=b.getAttribute('data-t');$('t').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
