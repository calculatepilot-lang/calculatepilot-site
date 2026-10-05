/* GPA & final grade needed — CalculatePilot (Stitch redesign). Shared by gpa and grade-needed pages (data-def on #gpCalc picks the start mode).
   GPA = Σ(points × credits) ÷ Σ credits; cumulative = (prior GPA × prior credits + term points) ÷ total credits.
   Scales: 4.0 standard (A+ = 4.0), 4.33 with +/−, 5.0 weighted (+0.5 honors, +1.0 AP/IB on passing grades).
   Final exam needed = (target − current × (1 − w)) ÷ w. */
(function(){
var C=window.CPX,$=C.$,last='';
var G=[['A+',97,4.0,4.33],['A',93,4.0,4.0],['A-',90,3.7,3.67],['B+',87,3.3,3.33],['B',83,3.0,3.0],['B-',80,2.7,2.67],['C+',77,2.3,2.33],['C',73,2.0,2.0],['C-',70,1.7,1.67],['D+',67,1.3,1.33],['D',63,1.0,1.0],['D-',60,0.7,0.67],['F',0,0,0]];
var DEF=[['Macroeconomía avanzada','A',3,0],['Cálculo II','A-',4,0.5],['Estructuras de datos','B+',3,0],['Mecánica física','B',4,0]];
var rows=0;
function pts(letter,scale){var g=G.filter(function(x){return x[0]===letter;})[0]||G[12];return scale==='pm'?g[3]:g[2];}
function opts(sel){return G.map(function(g){return '<option value="'+g[0]+'"'+(g[0]===sel?' selected':'')+'>'+g[0]+' ('+g[2].toFixed(2)+')</option>';}).join('');}
function addRow(n,g,c,w){
  var i=rows++,tr=document.createElement('tr');tr.dataset.i=i;
  tr.innerHTML='<td><div class="sx-au-in sm np"><input class="cn" type="text" maxlength="40" value="'+C.esc(n)+'" placeholder="Course name" aria-label="Course name"></div></td><td><select class="cg sx-mt-sel" aria-label="Grade">'+opts(g)+'</select></td><td class="n"><div class="sx-au-in sm np" style="min-width:70px"><input class="cc" type="number" inputmode="decimal" step="0.5" min="0" value="'+c+'" aria-label="Credits"></div></td><td><select class="cw sx-mt-sel" aria-label="Course weight"><option value="0"'+(w===0?' selected':'')+'>Regular</option><option value="0.5"'+(w===0.5?' selected':'')+'>Honores (+0.5)</option><option value="1"'+(w===1?' selected':'')+'>AP / IB (+1.0)</option></select></td><td><button type="button" class="sx-reset rm" aria-label="Remove course" style="padding:4px"><span class="msym" aria-hidden="true">close</span></button></td>';
  $('courses').querySelector('tbody').appendChild(tr);
}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oCum','oCr','oQp','oTc'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver el GPA.');$('dbar').innerHTML='';$('dleg').innerHTML='';last='';}
function gpaMode(){
  var scale=$('scale').value,trs=$('courses').querySelectorAll('tbody tr'),qp=0,cr=0,a=0,b=0,c=0,list=[];
  C.text('scNote',scale==='std'?'A+ cuenta como 4.0':scale==='pm'?'A+ cuenta como 4.33':'honores +0.5, AP/IB +1.0');
  document.querySelectorAll('#courses .cw').forEach(function(s){s.disabled=scale!=='w5';s.style.opacity=scale==='w5'?1:0.45;});
  $('err').hidden=true;
  trs.forEach(function(tr){var l=tr.querySelector('.cg').value,cc=parseFloat(tr.querySelector('.cc').value)||0,w=scale==='w5'?parseFloat(tr.querySelector('.cw').value)||0:0,p=pts(l,scale);if(p>0)p+=w;qp+=p*cc;cr+=cc;if(l.charAt(0)==='A')a+=cc;else if(l.charAt(0)==='B')b+=cc;else c+=cc;list.push([tr.querySelector('.cn').value||'Curso',l,cc,p]);});
  if(!(cr>0))return fail('Añade al menos una asignatura con créditos superiores a cero.');
  var gpa=qp/cr,pg=C.val('pg'),pc=C.val('pc'),cum=pc>0?(pg*pc+qp)/(cr+pc):gpa;
  C.text('resultValue',C.num(gpa,2));C.text('tag',C.num(cr,1).replace(/[.,]0$/,'')+' credits');
  C.text('interp',pc>0?'Tu GPA acumulado pasa de '+C.num(pg,2)+' to '+C.num(cum,2)+' ('+(cum>pg?'up ':cum<pg?'down ':'sin cambios, ')+C.num(Math.abs(cum-pg),2)+').':'GPA del semestre en la escala '+(scale==='std'?'4.0':scale==='pm'?'4.33':'ponderada de 5.0')+' .');
  C.text('oCum',C.num(cum,2));C.text('oCr',C.num(cr,1));C.text('oQp',C.num(qp,2));C.text('oTc',C.num(cr+(pc>0?pc:0),1));
  var parts=[['Rango A',a,'#0f5b44'],['Rango B',b,'#d97706'],['C o inferior',c,'#94a3b8']];
  $('dbar').innerHTML=parts.map(function(p){return '<div style="width:'+(p[1]/cr*100)+'%;background:'+p[2]+'"></div>';}).join('');
  $('dleg').innerHTML=parts.map(function(p){return '<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:9px;height:9px;border-radius:50%;background:'+p[2]+'"></i>'+p[0]+' ('+C.num(p[1]/cr*100,0)+'%)</span>';}).join('');
  C.text('distN',C.num(cr,1)+' credits');
  C.text('honors',gpa>=3.5?'Un GPA semestral de '+C.num(gpa,2)+' alcanza la línea de 3.5 que muchas universidades usan para el cuadro de honor. Consulta la norma de tu universidad.':'Muchas universidades fijan el cuadro de honor en un GPA semestral de 3.5 o superior. El tuyo es '+C.num(3.5-gpa,2)+' por debajo de esa línea.');
  last='GPA — calculatepilot.com/other/gpa-calculator.html\n'+list.map(function(x){return x[0]+': '+x[1]+' × '+x[2]+' cr';}).join('\n')+'\nGPA semestral '+C.num(gpa,2)+(pc>0?'; acumulado '+C.num(cum,2):'');
}
function finalMode(){
  var cg=C.val('cg'),tg=C.val('tg'),w=C.val('fw')/100,fp=C.val('fp');
  $('err2').hidden=true;
  if(!(w>0&&w<=1)){$('err2').hidden=false;C.text('err2T','El peso del examen final debe estar entre 0 y 100 %.');['fRes','fPts','fCw'].forEach(function(i){C.text(i,'—');});C.text('ftag','—');C.text('fInterp','Corrige el dato anterior.');$('fTab').innerHTML='';last='';return;}
  function need(t){return (t-cg*(1-w))/w;}
  var n=need(tg);
  C.text('fRes',C.num(n,1)+'%');
  C.text('ftag',n>100?'Puntos extra necesarios':n<=0?'Ya asegurado':n>=90?'Muy exigente':'Alcanzable');
  C.text('fPts',fp>0?C.num(n/100*fp,1)+' of '+C.num(fp,0):'—');C.text('fCw',C.num(cg*(1-w),1)+' of '+C.num(tg,1)+' points');
  C.text('fInterp',n>100?'Para subir de '+C.num(cg,1)+'% a '+C.num(tg,1)+'% con un examen final que vale '+C.num(w*100,0)+'%, necesitarías más de 100 % en el examen, por lo que el objetivo es inalcanzable sin puntos extra.':n<=0?'Incluso con un 0 % en el final, te quedas en '+C.num(tg,1)+'%.':'Saca al menos '+C.num(n,1)+'% en el final para terminar con '+C.num(tg,1)+'%.');
  $('fTab').innerHTML=[[90,'A'],[80,'B'],[70,'C'],[60,'D']].map(function(x,i){var v=need(x[0]);return '<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:13px"><span style="color:var(--sx-onv)">'+x[1]+' ('+x[0]+'%)</span><b style="font-family:var(--font-mono);color:'+(v>100?'var(--sx-err)':'var(--sx-on)')+'">'+(v<=0?'Asegurado':v>100?C.num(v,1)+'% (no es posible)':C.num(v,1)+'%')+'</b></div>';}).join('');
  last='Nota final necesaria — calculatepilot.com/other/grade-needed-calculator.html\nActual '+C.num(cg,1)+'%, objetivo '+C.num(tg,1)+'%, final con peso de '+C.num(w*100,0)+'%: necesitas '+C.num(n,1)+'% en el final';
}
function compute(){
  var m=$('mode').value;$('gpaMode').hidden=m!=='gpa';$('finalMode').hidden=m!=='final';
  if(m==='gpa')gpaMode();else finalMode();
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('pg').dispatchEvent(new Event('input',{bubbles:true}));}
function letters(){var h='';G.slice(0,12).concat([G[12]]).forEach(function(g,i){var hi=i===0?100:G[i-1][1]-0.1,pct=g[0]==='F'?'por debajo de 60 %':g[1]+'% – '+(i===0?'100':hi.toFixed(1))+'%';h+='<tr><td class="a"><b>'+g[0]+'</b></td><td class="a">'+pct+'</td><td class="n">'+g[2].toFixed(2)+'</td><td class="n">'+g[3].toFixed(2)+'</td><td class="n">'+(g[2]>0?(g[2]+0.5).toFixed(2):'0.00')+'</td><td class="n">'+(g[2]>0?(g[2]+1).toFixed(2):'0.00')+'</td></tr>';});$('lt').querySelector('tbody').innerHTML=h;}
document.addEventListener('DOMContentLoaded',function(){
  var root=$('gpCalc'),def=root.getAttribute('data-def')||'gpa';
  $('mode').value=def;
  DEF.forEach(function(d){addRow(d[0],d[1],d[2],d[3]);});
  letters();
  C.init({root:'gpCalc',compute:compute});
  $('addCourse').addEventListener('click',function(){addRow('','B',3,0);fire();});
  $('clrCourses').addEventListener('click',function(){$('courses').querySelector('tbody').innerHTML='';fire();});
  $('courses').addEventListener('click',function(e){var b=e.target.closest('.rm');if(!b)return;b.closest('tr').remove();fire();});
  $('courses').addEventListener('input',function(){});
  $('tpre').addEventListener('click',function(e){var b=e.target.closest('button[data-t]');if(!b)return;C.set('tg',b.getAttribute('data-t'));$('tg').dispatchEvent(new Event('input',{bubbles:true}));});
  document.querySelectorAll('[data-action="reset"]').forEach(function(b){b.addEventListener('click',function(){setTimeout(function(){$('courses').querySelector('tbody').innerHTML='';DEF.forEach(function(d){addRow(d[0],d[1],d[2],d[3]);});fire();},0);});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultado');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)window.scrollTo({top:document.getElementById('gpCalc').offsetTop+300,behavior:'smooth'});});
});
})();
