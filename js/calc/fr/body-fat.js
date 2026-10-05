/* Body fat calculator — CalculatePilot (redesign, PSEO standards).
   U.S. Navy (Hodgdon & Beckett 1984, cm): men 495/(1.0324 − 0.19077 log10(waist − neck) + 0.15456 log10(height)) − 450;
   women 495/(1.29579 − 0.35004 log10(waist + hip − neck) + 0.22100 log10(height)) − 450.
   Jackson-Pollock 3-site: men BD = 1.10938 − 0.0008267 S + 0.0000016 S² − 0.0002574 age (chest, abdomen, thigh);
   women BD = 1.0994921 − 0.0009929 S + 0.0000023 S² − 0.0001392 age (triceps, suprailiac, thigh). Siri %BF = 495/BD − 450.
   Deurenberg 1991: 1.20 BMI + 0.23 age − 10.8 sex − 5.4. Categories: American Council on Exercise. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
var ACE={m:[['Graisse essentielle',2,6],['Athlètes',6,14],['Forme physique',14,18],['Moyenne',18,25],['Obésité',25,60]],f:[['Graisse essentielle',10,14],['Athlètes',14,21],['Forme physique',21,25],['Moyenne',25,32],['Obésité',32,70]]};
var COLS=['#60a5fa','#22c55e','#86efac','#f59e0b','#ef4444'];
function f1(x){return isFinite(x)?(Math.round(x*10)/10).toFixed(1):'—';}
function navy(male,w,n,hp,h){return male?(w-n>0?495/(1.0324-0.19077*Math.log10(w-n)+0.15456*Math.log10(h))-450:NaN):(w+hp-n>0?495/(1.29579-0.35004*Math.log10(w+hp-n)+0.22100*Math.log10(h))-450:NaN);}
function jp(male,S,a){var bd=male?1.10938-0.0008267*S+0.0000016*S*S-0.0002574*a:1.0994921-0.0009929*S+0.0000023*S*S-0.0001392*a;return 495/bd-450;}
function cat(p,male){var t=ACE[male?'m':'f'];for(var i=0;i<t.length;i++)if(p<t[i][2])return [t[i][0],i];return [t[t.length-1][0],t.length-1];}

function compute(){
  var imp=$('u').value==='s1',male=$('sex').value==='s1',tape=$('meth').value==='s1';
  if(prevU!==null&&prevU!==$('u').value){var fl=imp?1/2.54:2.54,fw=imp?2.20462:1/2.20462;['ht','neck','waist','hip'].forEach(function(id){$(id).value=Math.round(v(id)*fl*2)/2;});$('wt').value=Math.round(v('wt')*fw*2)/2;}prevU=$('u').value;
  var lu=imp?'in':'cm';['u1','u2','u3','hU'].forEach(function(id){C.text(id,lu);});C.text('wU',imp?'lb':'kg');
  $('navyBox').hidden=!tape;$('jpBox').hidden=tape;$('hipBox').style.visibility=male?'hidden':'visible';
  C.text('s1L',male?'Poitrine':'Triceps');C.text('s2L',male?'Abdomen':'Suprailiaque');C.text('s3L','Cuisse');
  C.text('jpHelp',male?'Hommes : poitrine (en diagonale, entre l’aisselle et le mamelon), abdomen (à la verticale, 2 cm à côté du nombril), cuisse (à la verticale, face avant, à mi-distance entre la hanche et le genou).':'Femmes : triceps (à la verticale, arrière du haut du bras), suprailiaque (en diagonale, au-dessus de l’os de la hanche), cuisse (à la verticale, face avant, à mi-distance entre la hanche et le genou).');
  var L=imp?2.54:1,h=v('ht')*L,w=v('wt')/(imp?2.20462:1),a=v('age'),n=v('neck')*L,wa=v('waist')*L,hp=v('hip')*L,S=v('s1')+v('s2')+v('s3');
  var pN=navy(male,wa,n,hp,h),pJ=jp(male,S,a),p=tape?pN:pJ,bmi=h>0?w/Math.pow(h/100,2):NaN,pD=1.2*bmi+0.23*a-10.8*(male?1:0)-5.4;
  C.text('mL',tape?'Masse grasse estimée — méthode de l’US Navy':'Masse grasse estimée — Jackson-Pollock 3 sites');
  if(!isFinite(p)||p<=0||p>75){C.text('resultValue','—');C.text('catN',tape?'Vérifiez vos mesures — le tour de taille doit être supérieur au tour de cou.':'Vérifiez vos valeurs de plis cutanés.');return;}
  var c=cat(p,male),t=$('catTag');t.textContent=c[0];t.className='sx-ef-grade'+(c[1]===4?' hi':c[1]===3?' mid':'');
  C.text('resultValue',f1(p));C.text('catN',c[0]+' plage pour '+(male?'men':'women')+' selon le tableau de l’American Council on Exercise.'+(a>=60?' Les plages de masse grasse saines sont un peu plus élevées chez les personnes âgées.':''));
  var tb=ACE[male?'m':'f'],lo=tb[0][1],hi=male?35:45;
  $('specBar').innerHTML=tb.map(function(r,i){var e=Math.min(r[2],hi);return '<span style="width:'+((e-Math.max(r[1],lo))/(hi-lo)*100)+'%;background:'+COLS[i]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(p-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=tb.map(function(r){return '<span>'+r[0].split(' ')[0]+'</span>';}).join('');C.text('specV',f1(p)+'%');
  var fm=w*p/100,lm=w-fm,W=function(kg){return imp?f1(kg*2.20462)+' lb':f1(kg)+' kg';};
  C.text('fm',W(fm));C.text('lm',W(lm));
  if(tape){C.text('oL','Plis cutanés (Jackson-Pollock)');C.text('oV',S>0&&isFinite(pJ)?f1(pJ)+'%':'—');C.text('oN','Changer de méthode pour saisir les plis cutanés');}
  else{C.text('oL','Mètre ruban (US Navy)');C.text('oV',isFinite(pN)&&pN>0?f1(pN)+'%':'—');C.text('oN','À partir de vos mensurations');}
  C.text('dV',isFinite(pD)?f1(pD)+'%':'—');C.text('dN','BMI '+f1(bmi)+' — estimation approximative, moins précise pour les personnes musclées');
  C.text('catSex','Votre ligne : '+(male?'men':'women'));
  var m=ACE.m,f=ACE.f;
  $('catTbl').innerHTML=m.map(function(r,i){var rg=function(x){return i===x.length-1?x[i][1]+'%+':x[i][1]+'–'+(x[i][2]-1)+'%';};return '<tr'+(i===c[1]?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+r[0]+'</td><td>'+rg(m)+'</td><td>'+rg(f)+'</td></tr>';}).join('');
  last='Masse grasse : '+f1(p)+'% ('+c[0]+', '+(tape?'US Navy':'Jackson-Pollock 3 sites')+')\nMasse grasse : '+W(fm)+' · Masse maigre : '+W(lm)+'\n— calculatepilot.com/health/body-fat-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bfCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier les résultats');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpBodyFat={navy:navy,jp:jp};
})();
