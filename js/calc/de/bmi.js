/* BMI calculator — CalculatePilot (Stitch 1:1 redesign).
   BMI = kg ÷ m² (imperial: 703 × lb ÷ in²). BMI Prime = BMI ÷ 25. New Oxford (Trefethen) = 1.3 × kg ÷ m^2.5.
   Ponderal Index = kg ÷ m³. Healthy range = 18.5–24.9 × m² (WHO), or 18.5–22.9 below the WHO 2004 Asian action point of 23.
   Categories: WHO adult; Asian populations use WHO 2004 action points (23 increased risk, 27.5 high risk). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;

function f1(x){return isFinite(x)?(Math.round(x*10)/10).toFixed(1):'—';}
function whoCat(b){return b<18.5?['Untergewicht','hi']:b<25?['Gesundes Gewicht','']:b<30?['Übergewicht','mid']:b<35?['Adipositas Grad I','hi']:b<40?['Adipositas Grad II','hi']:['Adipositas Grad III','hi'];}
function asCat(b){return b<18.5?['Untergewicht','hi']:b<23?['Zunehmendes, aber akzeptables Risiko','']:b<27.5?['Erhöhtes Risiko','mid']:['Hohes Risiko','hi'];}
function kgTxt(kg,imp){return imp?Math.round(kg*2.20462)+' lb':f1(kg)+' kg';}

function compute(){
  var imp=$('u').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=(Math.round((ti%12)*2)/2);$('lb').value=Math.round(v('kg')*2.20462);$('lbR').value=$('lb').value;}
    else{$('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;$('kg').value=Math.round(v('lb')/2.20462*10)/10;$('kgR').value=$('kg').value;}
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;$('wImp').hidden=!imp;$('wMet').hidden=imp;
  var inches=imp?Math.max(0,v('ft'))*12+Math.max(0,v('inch')):v('cm')/2.54,m=inches*0.0254,kg=imp?v('lb')/2.20462:v('kg'),age=v('age'),as=$('std').value==='s2';
  C.text('hAlt',imp?(Math.round(inches*2.54))+' cm':Math.floor(inches/12)+'′ '+(Math.round((inches%12)*10)/10)+'″');C.text('wAlt',imp?f1(kg)+' kg':Math.round(kg*2.20462)+' lb');
  if(!(m>0.5&&kg>0)){C.text('resultValue','—');return;}
  var b=kg/(m*m),cat=as?asCat(b):whoCat(b),who=whoCat(b);
  C.text('resultValue',f1(b));var t=$('catTag');t.textContent=cat[0];t.className='sx-ef-grade'+(cat[1]?' '+cat[1]:'');
  C.text('stdHelp',as?'WHO-Aktionsschwellen 2004 für asiatische Bevölkerungsgruppen: 23 = erhöhtes Risiko, 27,5 = hohes Risiko.':'WHO-Kategorien für Erwachsene: 18,5–24,9 gesund, 25–29,9 Übergewicht, ab 30 Adipositas.');
  C.text('catN',as?('WHO-Standardkategorie: '+who[0]+'. On the WHO 2004 action points for Asian populations, a BMI of '+f1(b)+' liegt im Bereich „'+cat[0].toLowerCase()+'“.'):(b>=23&&b<25?'Gesundes Gewicht nach WHO-Kategorien — beachten Sie, dass für asiatische Bevölkerungsgruppen ab 23 eine Aktionsschwelle für „erhöhtes Risiko“ gilt.':cat[0]+' nach den WHO-BMI-Kategorien für Erwachsene.'));
  var segs=as?[[18.5,'#60a5fa','<18.5'],[23,'#22c55e','18.5–22.9'],[27.5,'#f59e0b','23–27.4'],[40,'#ef4444','27.5+']]:[[18.5,'#60a5fa','<18.5'],[25,'#22c55e','18.5–24.9'],[30,'#f59e0b','25–29.9'],[35,'#fb923c','30–34.9'],[40,'#ef4444','35+']];
  var lo=15,hi=40,prev=lo;
  $('specBar').innerHTML=segs.map(function(s){var w=(s[0]-prev)/(hi-lo)*100;prev=s[0];return '<span style="width:'+w+'%;background:'+s[1]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(b-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=segs.map(function(s){return '<span>'+s[2]+'</span>';}).join('');C.text('specV',f1(b));
  var an=$('ageNote');
  if(age&&age<20){an.innerHTML='<b>Unter 20:</b> Die Kategorien für Erwachsene gelten nicht. Kinder und Jugendliche werden anhand der BMI-für-Alter-Perzentile der CDC für ihr Alter und Geschlecht beurteilt — siehe unten.';an.style.color='var(--sx-err)';}
  else if(age>=65){an.innerHTML='<b>Ab 65 Jahren:</b> Muskelabbau im Alter kann dazu führen, dass der BMI das Körperfett unterschätzt, und ein niedriger BMI kann auf Gebrechlichkeit hindeuten. Besprechen Sie Ihr Ergebnis mit einer Ärztin oder einem Arzt.';an.style.color='';}
  else{an.textContent='Die BMI-Kategorien für Erwachsene gelten ab 20 Jahren. Der BMI ist ein Screening-Maß, keine Diagnose.';an.style.color='';}
  var up=as?22.9:24.9,rl=18.5*m*m,rh=up*m*m;
  C.text('rng',kgTxt(rl,imp)+' – '+kgTxt(rh,imp));C.text('rngN','BMI 18,5–'+up+' bei Ihrer Körpergröße'+(imp?' ('+f1(rl)+'–'+f1(rh)+' kg)':''));
  var pr=b/25;C.text('prime',pr.toFixed(2));C.text('primeN',pr<1?Math.round((1-pr)*100)+'% unter der Übergewichtsschwelle (25)':pr===1?'Genau an der Übergewichtsschwelle':Math.round((pr-1)*100)+'% über der Übergewichtsschwelle (25)');
  C.text('ox',f1(1.3*kg/Math.pow(m,2.5))+' kg/m²');C.text('pi',f1(kg/Math.pow(m,3))+' kg/m³');
  var tb=Math.max(10,v('tb')),tw=tb*m*m,d=tw-kg;C.text('tOut','BMI '+f1(tb));
  $('tTxt').innerHTML='Bei Ihrer Körpergröße entspricht ein BMI von '+f1(tb)+' <b style="color:var(--sx-on)">'+kgTxt(tw,imp)+'</b>'+(Math.abs(d)<0.05?' — Ihrem aktuellen Gewicht.':' ('+(d<0?'−':'+')+kgTxt(Math.abs(d),imp)+' ab jetzt).');
  document.querySelectorAll('#catTbl tbody tr').forEach(function(r){r.className=(b>=+r.getAttribute('data-lo')&&b<+r.getAttribute('data-hi'))?'hl':'';});
  last='BMI: '+f1(b)+' kg/m² ('+who[0]+(as?'; asiatische Aktionsschwellen: '+cat[0]:'')+')\nGesunder Gewichtsbereich: '+kgTxt(rl,imp)+' – '+kgTxt(rh,imp)+'\nBMI Prime: '+pr.toFixed(2)+'\nNeuer Oxford-BMI: '+f1(1.3*kg/Math.pow(m,2.5))+'\nPonderal-Index: '+f1(kg/Math.pow(m,3))+' kg/m³\n— calculatepilot.com/health/bmi-calculator.html';
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bmCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpBmi={};
})();
