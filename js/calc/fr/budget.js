/* 50/30/20 budget calculator — CalculatePilot (Stitch 1:1 redesign).
   Targets = monthly take-home × chosen split (50/30/20, 60/20/20, 40/15/45, 50/10/40);
   compares actual needs / wants / savings spending with the targets. */
(function(){
var C=window.CPX,$=C.$,v=C.val,mode='month',last=null;
var NAMES={'50-30-20':'Standard Warren','60-20-20':'Coût de la vie élevé','40-15-45':'FIRE','50-10-40':'Sprint de remboursement de dettes'};

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function P(x,dp){return (Math.round(x*Math.pow(10,dp===undefined?1:dp))/Math.pow(10,dp===undefined?1:dp))+'%';}

function inputs(){
  var inc=Math.max(0,v('inc')),key=$('split').value.replace(/^s/,''),sp=key.split('-').map(Number);
  return {m:$('mode').value==='year'?inc/12:inc,sp:sp,key:key,aN:Math.max(0,v('aN')),aW:Math.max(0,v('aW')),aS:Math.max(0,v('aS'))};
}

function audit(id,state,txt){var li=$(id),ic=li.querySelector('.msym');li.className=state==='ok'?'':state==='warn'?'warn':'fail';ic.textContent=state==='ok'?'check_circle':state==='warn'?'warning':'cancel';li.querySelector('em').textContent=state==='ok'?'PASSED':state==='warn'?'MONITOR':'REVIEW';$(id+'t').textContent=txt;}

function compute(){
  var o=inputs(),m=o.m,t=[m*o.sp[0]/100,m*o.sp[1]/100,m*o.sp[2]/100],a=[o.aN,o.aW,o.aS],sum=a[0]+a[1]+a[2];last={o:o,t:t,a:a};
  C.text('incUnit',$('mode').value==='year'?'/ year':'/ month');
  C.text('fBi',M(m*12/26));C.text('fSemi',M(m/2));C.text('fWk',M(m*12/52));
  document.querySelectorAll('.mp').forEach(function(b){b.setAttribute('aria-pressed',String(Math.abs(m-(+b.getAttribute('data-m')))<0.5));});
  C.text('varNote',NAMES[o.key]||'Personnalisé');
  C.text('resultValue',M(m));
  var L=['Besoins','Envies','Épargne'];
  ['N','W','S'].forEach(function(k,i){C.text('l'+k,o.sp[i]+'% '+L[i]);C.text('m'+k,M(t[i],2));C.text('c'+k+'l',L[i]+' ('+o.sp[i]+'%)');C.text('c'+k,M(t[i]));C.text('y'+k,M(t[i]*12)+' / year');C.text('t'+k,M(t[i]));});
  $('segBar').innerHTML=[['var(--sx-primary)',o.sp[0]],['var(--sx-secondary)',o.sp[1]],['var(--sx-tertiary)',o.sp[2]]].map(function(x){return '<span style="width:'+x[1]+'%;background:'+x[0]+'"></span>';}).join('');
  C.text('spSum','Total : '+M(sum)+' of '+M(m));

  var pct=function(x){return m>0?x/m*100:0;};
  audit('d1',a[0]<=t[0]+0.5?'ok':a[0]<=t[0]*1.1?'warn':'fail','Actuel : '+P(pct(a[0]),2)+' ('+M(a[0])+') contre '+o.sp[0]+'% d’allocation maximale'+(a[0]>t[0]+0.5?' — dépassement de '+M(a[0]-t[0]):''));
  audit('d2',a[1]<=t[1]+0.5?'ok':'warn','Actuel : '+P(pct(a[1]),2)+' ('+M(a[1])+')'+(a[1]>t[1]+0.5?' — dépasse l’objectif de '+M(a[1]-t[1]):' vs '+o.sp[1]+'% d’objectif'));
  audit('d3',a[2]>=t[2]-Math.max(0.5,t[2]*0.02)?'ok':a[2]>=t[2]*0.9?'warn':'fail','Actuel : '+P(pct(a[2]),2)+' ('+M(a[2])+') contre '+o.sp[2]+'% d’objectif de référence'+(a[2]<t[2]-0.5?' — manque '+M(t[2]-a[2]):''));
  var dev=m>0?(Math.abs(a[0]-t[0])+Math.abs(a[1]-t[1])+Math.abs(a[2]-t[2]))/2/m*100:0,sc=Math.max(0,100-dev),s=$('score');
  s.textContent=(sc>=95?'Équilibre optimal':sc>=85?'Proche de l’objectif':'Rééquilibrage nécessaire')+' ('+sc.toFixed(1)+'% d’alignement)';s.className='sx-ef-grade'+(sc>=95?'':sc>=85?' mid':' hi');
  var u=m-sum;C.text('unalloc',(u>=0?'+':'−')+M(Math.abs(u),2)+' / month'+(u>0.005?' (marge d’excédent)':u<-0.005?' (Overspent)':' (entièrement alloué)'));$('uDot').className=u<-0.005?'neg':'';

  var G=[['Besoins','Survie essentielle','Loyer/prêt immobilier, services de base, courses essentielles, assurance, paiements minimums des dettes','Exclut les extras comme les courses haut de gamme ou les vêtements au-delà de l’essentiel.'],
    ['Envies','Mode de vie discrétionnaire','Restaurants, streaming, voyages, salle de sport, gadgets, loisirs','Tout ce que vous pourriez suspendre en cas de perte d’emploi sans réel dommage.'],
    ['Épargne','Patrimoine &amp; accélération','Comptes retraite, fonds d’urgence, remboursements de capital supplémentaires','Le minimum contractuel de la dette relève des Besoins ; les paiements au-delà sont comptés ici.']];
  var rows=G.map(function(g,i){var d=t[i]-a[i],cls,txt;if(i<2){cls=d>=-0.5?'ok':'over';txt=d>=-0.5?'+'+M(d,2)+' under':'−'+M(-d,2)+' over';}else{cls=d<=0.5?'ok':'low';txt=d<=0.5?'+'+M(-d,2)+' above':'−'+M(d,2)+' under';}
    return '<tr><td class="pl"><b style="color:'+(i===1?'var(--sx-pc)':'var(--sx-on)')+'">'+g[0]+' ('+o.sp[i]+'%)</b><small>'+g[1]+'</small></td><td style="text-align:left;font-family:inherit;font-size:12px;white-space:normal;max-width:380px">'+g[2]+'<small>'+g[3]+'</small></td><td>'+M(t[i],2)+'</td><td>'+M(a[i],2)+'</td><td><span class="vd '+cls+'">'+txt+'</span></td></tr>';}).join('');
  rows+='<tr class="tot"><td>Total rapproché</td><td style="text-align:left;font-family:inherit;font-weight:400;color:var(--sx-muted)">'+P(m>0?sum/m*100:0)+' du revenu mensuel net alloué</td><td>'+M(m,2)+'</td><td>'+M(sum,2)+'</td><td>'+(Math.abs(u)<0.005?'Équilibré (0 $ non alloué)':(u>0?M(u,2)+' unallocated':M(-u,2)+' overspent'))+'</td></tr>';
  $('ledBody').innerHTML=rows;
  C.text('relCI','Prévoyez la croissance à long terme lorsque vous investissez '+M(t[2])+' par mois.');
  mode=$('mode').value;
}

document.addEventListener('DOMContentLoaded',function(){
  mode=$('mode').value;
  $('mode').addEventListener('input',function(){var mm=this.value;if(mm===mode)return;var x=v('inc');$('inc').value=Math.round(mm==='year'?x*12:x/12);mode=mm;});
  document.querySelectorAll('.mp').forEach(function(b){b.addEventListener('click',function(){var x=+b.getAttribute('data-m');$('inc').value=$('mode').value==='year'?x*12:x;$('inc').dispatchEvent(new Event('input',{bubbles:true}));});});
  C.init({root:'bdCalc',compute:compute});mode=$('mode').value;
  $('zeroBtn').addEventListener('click',function(){if(!last)return;var u=last.o.m-last.a[0]-last.a[1]-last.a[2];$('aS').value=Math.max(0,Math.round((last.a[2]+u)*100)/100);$('aS').dispatchEvent(new Event('input',{bubbles:true}));});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var L=['Besoins','Envies','Épargne'];
    C.csv('50-30-20-budget.csv',[{h:'Catégorie',key:'c'},{h:'% cible',key:'p'},{h:'Objectif',key:'t'},{h:'Réel',key:'a'},{h:'Variance',key:'d'}],L.map(function(n,i){return {c:n,p:last.o.sp[i],t:Math.round(last.t[i]*100)/100,a:last.a[i],d:Math.round((last.t[i]-last.a[i])*100)/100};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpBudget={};
})();
