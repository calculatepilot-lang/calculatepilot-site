/* Calorie calculator — CalculatePilot (redesign, PSEO standards).
   Maintenance = Mifflin-St Jeor BMR × activity. Target = maintenance ∓ rate × 7,700 kcal/kg ÷ 7.
   Projection: intake fixed at target; each week maintenance is recalculated at the new weight and
   Δweight = (intake − maintenance) × 7 ÷ 7,700. Flat rule for comparison: constant weekly rate.
   Floors: 1,200 kcal (women) / 1,500 kcal (men) without supervision. Macros: protein 1.6 g/kg (loss) or 1.8 g/kg (gain) of
   current weight (ISSN 1.4–2.0 g/kg), fat 25% of calories (min 0.6 g/kg), carbs the remainder. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,prevU=null;
function K(x){return isFinite(x)?Math.round(x).toLocaleString('fr-FR'):'—';}
function bmr(w,h,a,m){return 10*w+6.25*h-5*a+(m?5:-161);}
function fmtD(d){return d.toLocaleDateString('fr-FR',{month:'short',day:'numeric',year:'numeric'});}

function compute(){
  var imp=$('u').value==='s1',L=imp?2.20462:1;
  if(prevU!==null&&prevU!==$('u').value){
    var f=imp?2.20462:1/2.20462;
    ['wt','gw'].forEach(function(id){$(id).value=Math.round(v(id)*f*(imp?1:10))/(imp?1:10);});
    if(imp){var ti=v('cm')/2.54;$('ft').value=Math.floor(ti/12);$('inch').value=Math.round((ti%12)*2)/2;}else $('cm').value=Math.round((v('ft')*12+v('inch'))*2.54*2)/2;
  }prevU=$('u').value;
  $('hImp').hidden=!imp;$('hMet').hidden=imp;C.text('wU',imp?'lb':'kg');C.text('gU',imp?'lb':'kg');
  [['r1',0.25],['r2',0.5],['r3',0.75],['r4',1]].forEach(function(r){C.text(r[0],imp?(r[1]*2).toString().replace('.5','½').replace('0½','½')+' lb':r[1]+' kg');});
  var h=imp?(v('ft')*12+v('inch'))*2.54:v('cm'),w=v('wt')/L,gw=v('gw')/L,a=v('age'),male=$('sex').value==='s1',act=+$('act').value,rate=+$('rate').value;
  C.text('hAlt',imp?Math.round(h)+' cm':Math.floor(h/2.54/12)+'′ '+Math.round((h/2.54)%12)+'″');
  if(!(h>0&&w>0&&a>0))return;
  var M=bmr(w,h,a,male)*act,dir=gw<w-0.05?-1:gw>w+0.05?1:0,rKg=imp?rate*2/2.20462:rate,tgt=M+dir*rKg*7700/7,floor=male?1500:1200;
  var W=function(kg){return imp?Math.round(kg*2.20462)+' lb':(Math.round(kg*10)/10)+' kg';};
  C.text('rateN','par semaine — '+(imp?'about '+(rKg).toFixed(2)+' kg':'about '+Math.round(rKg*2.20462*10)/10+' lb'));
  C.text('maint',K(M)+' kcal');C.text('resultValue',K(dir?tgt:M));
  C.text('dirTag',dir<0?'Perdre du poids':dir>0?'Prendre du poids':'Maintien');C.text('tgL',dir?'Objectif calorique quotidien':'Calories quotidiennes pour maintenir son poids');
  C.text('tgN',dir?(dir<0?'A '+K(M-tgt)+' kcal/jour de déficit':'A '+K(tgt-M)+' kcal/jour d’excédent')+' par rapport à vos '+K(M)+' kcal de maintien, avec un objectif d’environ '+W(rKg)+' par semaine au début.':'Votre objectif correspond à votre poids actuel — mangez autour de vos calories de maintien.');
  // projection
  var wt=w,wf=w,wk=0,pts=[[0,w]],fl=[[0,w]],hit=null,hitF=null,maxW=156;
  if(dir){for(wk=1;wk<=maxW;wk++){var m=bmr(wt,h,a,male)*act;wt+=(tgt-m)*7/7700;wf+=dir*rKg;pts.push([wk,wt]);fl.push([wk,wf]);
      if(hit===null&&(dir<0?wt<=gw:wt>=gw))hit=wk;if(hitF===null&&(dir<0?wf<=gw:wf>=gw))hitF=wk;if(hit!==null&&hitF!==null&&wk>=Math.max(hit,hitF))break;}}
  var today=new Date(),dAt=function(n){var d=new Date(today.getTime());d.setDate(d.getDate()+n*7);return d;};
  C.text('eta',!dir?'—':hit?fmtD(dAt(hit)):'Pas en moins de 3 ans');
  var cb=$('cmpBox');cb.className='gain'+(dir?'':' neg');
  if(dir&&hit&&hitF){C.text('cmpL','Semaines pour atteindre l’objectif : '+hit+' (mise à jour) contre '+hitF+' (règle fixe)');C.text('cmpV',(hit-hitF>0?'+':'')+(hit-hitF)+' wks');}
  else if(dir&&!hit){var pl=pts[pts.length-1][1];C.text('cmpL','Avec cet apport, votre poids se stabilise autour de');C.text('cmpV',W(pl));}
  else{C.text('cmpL','Aucun changement de poids prévu');C.text('cmpV','±0');}
  var wn=$('warn'),pct=rKg/w*100;
  if(dir<0&&tgt<floor)wn.innerHTML='<b style="color:var(--sx-err)">Moins de '+K(floor)+' kcal/jour</b> — la plupart des recommandations déconseillent d’aller aussi bas sans suivi médical. Choisissez un rythme plus lent.';
  else if(dir&&pct>1)wn.innerHTML='<b style="color:var(--sx-err)">'+pct.toFixed(1)+'% du poids corporel par semaine</b> est plus rapide que les ~0,5–1 % généralement recommandés.';
  else if(a<18)wn.textContent='Moins de 18 ans : un corps en croissance a des besoins différents — consultez un médecin ou un diététicien avant de faire un régime.';
  else wn.textContent='Simples estimations — pesez-vous régulièrement et ajustez de 100 à 200 kcal si les progrès diffèrent.';
  // chart
  var Wd=520,Hd=170,Lp=44,Rp=10,Tp=12,Bp=24,cw=Wd-Lp-Rp,ch=Hd-Tp-Bp,N=Math.max(1,pts.length-1);
  var ys=pts.concat(fl).map(function(p){return p[1];}).concat([gw]),mx=Math.max.apply(null,ys),mn=Math.min.apply(null,ys);if(mx-mn<1){mx+=1;mn-=1;}
  var X=function(i){return Lp+i/N*cw;},Y=function(y){return Tp+ch-(y-mn)/(mx-mn)*ch;},ln=function(arr){return arr.map(function(p,i){return (i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1);}).join(' ');};
  var g='';for(var i=0;i<=3;i++){var yy=mn+(mx-mn)*i/3;g+='<line x1="'+Lp+'" x2="'+(Wd-Rp)+'" y1="'+Y(yy)+'" y2="'+Y(yy)+'" stroke="var(--sx-border)" stroke-dasharray="3 3"/><text x="'+(Lp-6)+'" y="'+(Y(yy)+3)+'" text-anchor="end" font-size="9" fill="var(--sx-muted)">'+W(yy)+'</text>';}
  g+='<line x1="'+Lp+'" x2="'+(Wd-Rp)+'" y1="'+Y(gw)+'" y2="'+Y(gw)+'" stroke="var(--sx-pc)" stroke-width="1"/><text x="'+(Wd-Rp)+'" y="'+(Y(gw)-4)+'" text-anchor="end" font-size="9" fill="var(--sx-pc)">Objectif</text>';
  g+='<text x="'+Lp+'" y="'+(Hd-8)+'" font-size="9" fill="var(--sx-muted)">Aujourd’hui</text><text x="'+(Wd-Rp)+'" y="'+(Hd-8)+'" text-anchor="end" font-size="9" fill="var(--sx-muted)">Semaine '+N+'</text>';
  var flC=fl.filter(function(p){return p[0]<=N;});
  $('chart').innerHTML=g+(dir?'<path d="'+ln(flC)+'" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5 4"/>':'')+'<path d="'+ln(pts)+'" fill="none" stroke="var(--sx-primary)" stroke-width="2.5"/>';
  // milestones
  var msH='';if(dir){[0.25,0.5,0.75,1].forEach(function(f){var tw=w+(gw-w)*f,wkM=null;for(var j=1;j<pts.length;j++){if(dir<0?pts[j][1]<=tw:pts[j][1]>=tw){wkM=j;break;}}
    msH+='<div class="l"><span>'+(f===1?'Objectif : ':Math.round(f*100)+'% du chemin parcouru : ')+W(tw)+'</span><b'+(f===1?' style="color:var(--sx-pc)"':'')+'>'+(wkM?'Semaine '+wkM+' · '+fmtD(dAt(wkM)):'Au-delà de la projection')+'</b></div>';});}
  else msH='<div class="l"><span>Définissez un poids cible différent de votre poids actuel pour voir les étapes.</span><b>—</b></div>';
  $('ms').innerHTML=msH;
  // rate table
  var rows=[[-1,'Perdre'],[-0.75,'Perdre'],[-0.5,'Perdre'],[-0.25,'Perdre'],[0,'Maintien'],[0.25,'Plus-value'],[0.5,'Plus-value']];
  C.text('flT','Plancher : '+K(floor)+' kcal ('+(male?'men':'women')+')');
  $('rtTbl').innerHTML=rows.map(function(r){var kgw=r[0],c=M+kgw*7700/7,p=Math.abs(kgw)/w*100,bad=c<floor||p>1,sel=Math.abs(kgw-dir*rKg)<1e-6&&!(imp);
    var lbl=kgw===0?'Maintenir son poids':r[1]+' '+(imp?(Math.abs(kgw)*2.20462).toFixed(1)+' lb':Math.abs(kgw)+' kg')+' / week';
    return '<tr'+(Math.abs(kgw-dir*rKg)<0.001?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+lbl+'</td><td class="b">'+K(c)+' kcal</td><td>'+(kgw===0?'—':(kgw<0?'−':'+')+K(Math.abs(kgw)*1100)+' kcal')+'</td><td>'+(kgw===0?'—':p.toFixed(2)+'%')+'</td><td style="font-family:inherit">'+(c<floor?'<span style="color:var(--sx-err)">Sous le plancher</span>':p>1?'<span style="color:var(--sx-err)">Trop rapide</span>':'<span style="color:var(--sx-pc)">OK</span>')+'</td></tr>';}).join('');
  // macros
  var kc=dir?tgt:M,pg=w*(dir>0?1.8:1.6),fg=Math.max(kc*0.25/9,w*0.6),cg=Math.max(0,(kc-pg*4-fg*9)/4);
  $('mcTbl').innerHTML=[['Protéines',pg,4,(dir>0?'1.8':'1.6')+' g par kg de poids corporel'],['Lipides',fg,9,'25 % des calories (au moins 0,6 g/kg)'],['Glucides',cg,4,'Calories restantes']].map(function(r){return '<tr><td style="font-family:inherit;font-weight:600">'+r[0]+'</td><td class="b">'+K(r[1])+' g</td><td>'+K(r[1]*r[2])+' kcal</td><td>'+Math.round(r[1]*r[2]/kc*100)+'%</td><td style="font-family:inherit;white-space:normal">'+r[3]+'</td></tr>';}).join('');
  last='Maintien : '+K(M)+' kcal/day\nTarget: '+K(kc)+' kcal/day\n'+(dir&&hit?'Date d’atteinte de l’objectif prévue : '+fmtD(dAt(hit))+' (week '+hit+')\n':'')+'Macros : '+K(pg)+' g de protéines, '+K(fg)+' g de lipides, '+K(cg)+' g de glucides\n— calculatepilot.com/health/calorie-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'clCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copié');setTimeout(function(){C.text('copyTxt','Copier le plan');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCalorie={bmr:bmr};
})();
