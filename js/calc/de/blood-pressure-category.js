/* Blood pressure category calculator — CalculatePilot (redesign, PSEO standards).
   AHA chart (reviewed Aug 2025, aligned with the 2025 AHA/ACC guideline): Normal <120 and <80; Elevated 120–129 and <80;
   Stage 1 130–139 or 80–89; Stage 2 ≥140 or ≥90; Severe hypertension >180 and/or >120 (hypertensive emergency if symptoms).
   Readings averaged. Pulse pressure = SBP − DBP; MAP ≈ DBP + (SBP − DBP)/3. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var CAT=[['Normal','','Unter 120','and','Unter 80'],['Erhöht','mid','120–129','and','Unter 80'],['Bluthochdruck Stufe 1','hi','130–139','or','80–89'],['Bluthochdruck Stufe 2','hi','140 oder höher','or','90 oder höher'],['Schwerer Bluthochdruck','hi','Höher als 180','and/or','Höher als 120']];
function sc(s){return s>180?4:s>=140?3:s>=130?2:s>=120?1:0;}
function dc(d){return d>120?4:d>=90?3:d>=80?2:0;}

function compute(){
  var rs=[1,2,3].map(function(i){return [v('s'+i),v('d'+i)];}).filter(function(r){return r[0]>0&&r[1]>0;});
  if(!rs.length)return;
  var S=rs.reduce(function(a,r){return a+r[0];},0)/rs.length,D=rs.reduce(function(a,r){return a+r[1];},0)/rs.length,Sr=Math.round(S),Dr=Math.round(D);
  var ci=Math.max(sc(Sr),dc(Dr)),sym=$('sym').value==='s2',t=$('tag');
  var name=ci===4&&sym?'Hypertensive Krise':CAT[ci][0];
  C.text('hdL',rs.length>1?'Kategorie (Durchschnitt aus '+rs.length+' Messwerten)':'Blutdruckkategorie');
  C.text('resultValue',name);t.textContent=Sr+'/'+Dr+' mmHg';t.className='sx-ef-grade'+(CAT[ci][1]?' '+CAT[ci][1]:'');
  var why=sc(Sr)===dc(Dr)?'beide Werte':sc(Sr)>dc(Dr)?'Ihr systolischer Wert von '+Sr:'Ihr diastolischer Wert von '+Dr;
  C.text('rN',(rs.length>1?'Durchschnitt aus '+rs.map(function(r){return r[0]+'/'+r[1];}).join(', ')+' = '+Sr+'/'+Dr+'. ':'')+(ci?'Bestimmt durch '+why+'.':'Beide Werte liegen im Normbereich.'));
  var segs=[[120,'#22c55e','<120'],[130,'#facc15','120–129'],[140,'#f59e0b','130–139'],[180,'#ef4444','140–180'],[200,'#991b1b','>180']],lo=90,hi=200,prev=lo;
  $('specBar').innerHTML=segs.map(function(s){var w=(s[0]-prev)/(hi-lo)*100;prev=s[0];return '<span style="width:'+w+'%;background:'+s[1]+'"></span>';}).join('')+'<i class="c" style="left:'+Math.max(0,Math.min(100,(S-lo)/(hi-lo)*100))+'%"></i>';
  $('specLb').innerHTML=segs.map(function(s){return '<span>'+s[2]+'</span>';}).join('');C.text('specV',String(Sr));
  C.text('pp',Math.round(S-D)+' mmHg');C.text('map',Math.round(D+(S-D)/3)+' mmHg');
  var wn=$('warn');
  if(ci===4&&sym)wn.innerHTML='<b style="color:var(--sx-err)">Rufen Sie jetzt den Notruf (112) bzw. die örtliche Notrufnummer an.</b> Ein Wert über 180/120 mit Symptomen kann eine hypertensive Krise sein.';
  else if(ci===4)wn.innerHTML='<b style="color:var(--sx-err)">Warten Sie 1 Minute und messen Sie erneut.</b> Liegt der Wert weiterhin über 180/120, wenden Sie sich umgehend an Ihre Ärztin oder Ihren Arzt. Treten Symptome auf, rufen Sie den Notruf an.';
  else if(ci>=2)wn.textContent='Im Bereich des Bluthochdrucks — messen Sie an verschiedenen Tagen erneut und besprechen Sie die Ergebnisse mit medizinischem Fachpersonal.';
  else if(ci===1)wn.textContent='Erhöht — herzgesunde Gewohnheiten (Ernährung, Bewegung, weniger Salz und Alkohol) können helfen, einen weiteren Anstieg zu verhindern.';
  else if(Sr<90||Dr<60)wn.textContent='Ein Wert unter 90/60 kann auf niedrigen Blutdruck hindeuten — sprechen Sie mit einer Ärztin oder einem Arzt, wenn Sie Schwindel oder Ohnmacht verspüren.';
  else wn.textContent='Normal — messen Sie weiterhin regelmäßig. Ein einzelner Messwert ist keine Diagnose.';
  C.text('tbT','Sie: '+name);
  $('catTbl').innerHTML=CAT.map(function(x,i){return '<tr'+(i===ci?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x[0]+(i===4?' <small>(Notfall bei Symptomen)</small>':'')+'</td><td>'+x[2]+'</td><td style="font-family:inherit">'+x[3]+'</td><td>'+x[4]+'</td></tr>';}).join('');
  last='Blutdruck: '+Sr+'/'+Dr+' mmHg — '+name+' (AHA)\n— calculatepilot.com/health/blood-pressure-category-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'bpCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Kopiert');setTimeout(function(){C.text('copyTxt','Ergebnis kopieren');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
