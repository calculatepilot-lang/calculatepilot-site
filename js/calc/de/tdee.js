/* TDEE calculator — CalculatePilot (redesign, BMI/Stitch pattern).
   BMR: Mifflin-St Jeor 10W + 6.25H − 5A + 5 (men) / − 161 (women); Harris-Benedict revised (Roza & Shizgal 1984)
   men 88.362 + 13.397W + 4.799H − 5.677A, women 447.593 + 9.247W + 3.098H − 4.330A; Katch-McArdle 370 + 21.6 LBM;
   Cunningham 500 + 22 LBM (LBM = W × (1 − body fat)). TDEE = BMR × activity. TEF ≈ 10% of TDEE.
   Goal = TDEE × (1 + goal%). Weekly change ≈ (goal − TDEE) × 7 ÷ 7,700 kcal per kg. Macros 30/30/40 at 4/9/4 kcal per g. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var ACT=[[1.2,'Bewegungsarm'],[1.375,'Leicht aktiv'],[1.55,'Mäßig aktiv'],[1.725,'Sehr aktiv'],[1.9,'Extrem aktiv']];

function K(x){return isFinite(x)?Math.round(x).toLocaleString('de-DE'):'—';}
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
  C.text('fmHelp',B.lbm?'Magermasse: '+(imp?K(B.lbm*2.20462)+' lb':B.lbm.toFixed(1)+' kg')+'. All four formulas are available.':($('fm').value==='km'||$('fm').value==='cun'?'Geben Sie Ihren Körperfettanteil in % ein, um eine Formel auf Basis der fettfreien Masse zu verwenden – vorerst wird Mifflin-St Jeor angezeigt.':'Geben Sie einen Körperfettanteil in % ein (z. B. aus dem Körperfettrechner), um Katch-McArdle und Cunningham freizuschalten.'));
  C.text('fmTag',names[fm]);C.text('resultValue',K(tdee));
  C.text('tdN','Geschätzte Kalorien, die Sie pro Tag verbrennen bei "'+ACT.filter(function(x){return x[0]===act;})[0][1].toLowerCase()+'" — essen Sie so viel, um Ihr Gewicht zu halten.');
  C.text('bmr',K(bmr)+' kcal');C.text('gL',g===0?'Zielkalorien (Gewicht halten)':'Zielkalorien ('+(g>0?'+':'')+g+'%)');C.text('gc',K(gc)+' kcal');
  var gb=$('gBox');gb.className='gain'+(g<0?'':g===0?' neg':'');
  C.text('gTxt',g===0?'Gewichtserhalt — keine gezielte Veränderung':g<0?'Ungefährer anfänglicher Verlust':'Ungefähre Zunahme');
  C.text('gW',g===0?'±0':(g<0?'−':'+')+(imp?(Math.abs(dW)*2.20462).toFixed(2)+' lb':Math.abs(dW).toFixed(2)+' kg')+' / week');
  var wn=$('warn');
  if(gc<800){wn.innerHTML='<b style="color:var(--sx-err)">Unter 800 kcal/Tag</b> ist eine sehr kalorienarme Diät und erfordert ärztliche Aufsicht.';}
  else if(gc<bmr){wn.innerHTML='<b style="color:var(--sx-err)">Dieses Ziel liegt unter Ihrem Grundumsatz.</b> Dauerhaft unter Ihrem Ruhebedarf zu essen ist schwer durchzuhalten und riskiert Muskelverlust — erwägen Sie ein kleineres Defizit.';}
  else wn.textContent=a<18?'Die Formeln sind für Erwachsene validiert; der Energiebedarf von Jugendlichen schließt das Wachstum ein — sprechen Sie mit einem Arzt oder Ernährungsberater.':'Nur Schätzwerte — verfolgen Sie Ihr Gewicht 2–3 Wochen lang und passen Sie bei Bedarf um 100–200 kcal an.';
  var tef=tdee*0.10,actE=Math.max(0,tdee-bmr-tef),parts=[['Grundumsatz (in Ruhe)',bmr,'var(--sx-primary)'],['Verdauung (TEF ~10 %)',tef,'#f59e0b'],['Aktivität &amp; Bewegung',actE,'#34d399']];
  $('enBar').innerHTML=parts.map(function(p){return '<span style="width:'+(p[1]/tdee*100)+'%;background:'+p[2]+'"></span>';}).join('');
  $('enLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' '+K(p[1])+' ('+Math.round(p[1]/tdee*100)+'%)</span>';}).join('');
  var show=function(id,x,nid){C.text(id,x?K(x)+' kcal':'Benötigt Körperfettanteil in %');if(nid)C.text(nid,x?'BMR · TDEE '+K(x*act)+' kcal':'Körperfett-% eingeben, um zu berechnen');};
  C.text('f1',K(B.mif)+' kcal');C.text('f1n','BMR · TDEE '+K(B.mif*act)+' kcal');C.text('f2',K(B.hb)+' kcal');C.text('f2n','BMR · TDEE '+K(B.hb*act)+' kcal');show('f3',B.km,'f3n');show('f4',B.cun,'f4n');
  $('actTbl').innerHTML=ACT.map(function(x){var t=bmr*x[0],d=t-tdee;return '<tr'+(x[0]===act?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[1]+(x[0]===act?' <small class="p">(Ihr Wert)</small>':'')+'</td><td>× '+x[0]+'</td><td class="b">'+K(t)+' kcal</td><td class="'+(d>0?'pos':d<0?'r':'mu')+'">'+(Math.abs(d)<1?'—':(d>0?'+':'−')+K(Math.abs(d))+' kcal')+'</td></tr>';}).join('');
  C.text('actN','Dieselben '+K(bmr)+' kcal Grundumsatz reicht von '+K(bmr*1.2)+' to '+K(bmr*1.9)+' kcal/Tag über die Aktivitätsstufen — wählen Sie ehrlich; die meisten überschätzen sich.');
  var n=+$('meals').value||3,P=gc*.3/4,F=gc*.3/9,Cb=gc*.4/4;
  C.text('mealN','30 % Eiweiß / 30 % Fett / 40 % Kohlenhydrate Ihres '+K(gc)+' kcal-Ziels — ein allgemeiner Ausgangspunkt, verteilt auf '+n+' Mahlzeiten.');
  $('mealTbl').innerHTML='<tr style="background:var(--sx-emb)"><td style="font-family:inherit;font-weight:700">Tag</td><td class="b">'+K(gc)+' kcal</td><td>'+K(P)+' g</td><td>'+K(F)+' g</td><td>'+K(Cb)+' g</td></tr><tr><td style="font-family:inherit;font-weight:600">Jede von '+n+' Mahlzeiten</td><td>'+K(gc/n)+' kcal</td><td>'+K(P/n)+' g</td><td>'+K(F/n)+' g</td><td>'+K(Cb/n)+' g</td></tr>';
  last='TDEE: '+K(tdee)+' kcal/Tag ('+names[fm]+', Aktivität × '+act+')\nBMR: '+K(bmr)+' kcal\nZielkalorien: '+K(gc)+' kcal ('+(g>0?'+':'')+g+'%)\nMakros (30/30/40): '+K(P)+' g Eiweiß, '+K(F)+' g Fett, '+K(Cb)+' g Kohlenhydrate\n— calculatepilot.com/health/tdee-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'tdCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Ergebnisse kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpTdee={bmrs:bmrs};
})();
