/* 529 college savings calculator — CalculatePilot (Stitch 1:1 redesign).
   Balance: monthly contributions, monthly compounding at return/12, over (enrollment age − current age) years.
   Target = 4 × annual cost × (1 + college inflation)^years × coverage. Required monthly deposit
   M = (target − B0(1+i)^n) × i / ((1+i)^n − 1). Capital-gains tax avoided = gains × 15%. State saving = annual deposits × state rate. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,Y0=2026;

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('fr-FR');}
function K(x){return '$'+(Math.round(x/100)/10)+'k';}
function pc(x,d){return isFinite(x)?x.toFixed(d===undefined?1:d)+'%':'—';}
function fv(b,m,r,n){var i=r/1200;return i?b*Math.pow(1+i,n)+m*(Math.pow(1+i,n)-1)/i:b+m*n;}

function compute(){
  var age=Math.max(0,Math.round(v('age'))),enr=Math.max(age+1,Math.round(v('enr'))),Y=enr-age,cost=Math.max(0,v('cost')),b0=Math.max(0,v('bal')),m=Math.max(0,v('mo'));
  var r=Math.max(0,v('ret')),inf=Math.max(0,v('inf')),cov=Math.max(0,v('cov'))/100,st=$('stOn').checked?Math.max(0,v('stR')):0,n=Y*12;
  var B=fv(b0,m,r,n),tgt=4*cost*Math.pow(1+inf/100,Y)*cov,base=4*cost*cov,pr=b0+m*n,gains=B-pr,gap=tgt-B;
  C.text('ageOut',age+(age===1?' ans':' Ans'));C.text('hzTxt',Y+'ans d’accumulation restants (inscription à '+(Y0+Y)+')');
  C.text('retOut',pc(r)+' / yr');C.text('infOut',pc(inf)+' / yr');
  C.text('msTag','Âge '+enr+' Étape');C.text('costL','Coût projeté sur 4 ans'+(cov<1?' ('+Math.round(cov*100)+'% couvert)':''));
  C.text('need',M(tgt));C.text('infAddT','+'+M(tgt-base)+' inflation');C.text('resultValue',M(B));C.text('retTag',pc(r)+' compounded');
  var f=tgt>0?Math.min(1,B/tgt):1;C.text('pct',pc(f*100)+' Financé');$('pctBar').style.width=f*100+'%';
  C.text('fund','Financé : '+M(Math.min(B,tgt)));$('gapL').innerHTML=gap>0?'Manque à financer : <b>'+M(gap)+'</b>':'Excédent : <b style="color:var(--sx-pc)">'+M(-gap)+'</b>';
  var i=r/1200,need=i?(tgt-b0*Math.pow(1+i,n))*i/(Math.pow(1+i,n)-1):(tgt-b0)/n,vel=$('vel');
  if(gap>0){vel.className='sx-cs-vel';C.text('velH','Épargne nécessaire pour '+Math.round(cov*100)+'% de couverture');
    $('velT').innerHTML='Augmentez les versements mensuels de <b>'+M(m)+'/mo</b> to <b style="color:var(--sx-primary)">'+M(Math.max(0,need))+'/mo</b> (+'+M(Math.max(0,need)-m)+'/month) to close the '+M(gap)+' déficit par âge '+enr+'.';}
  else{vel.className='sx-cs-vel ok';C.text('velH','Objectif atteignable');$('velT').innerHTML='Votre plan couvre l’objectif. Vous pourriez l’atteindre avec environ <b>'+M(Math.max(0,need))+'/mo</b>.';}
  C.text('gains',M(gains)+' earnings');C.text('cg','~'+M(Math.max(0,gains)*0.15)+' saved');C.text('stSave',st?M(m*12*st/100)+' / year':'Non appliqué');
  var parts=[['Capital versé',pr,'var(--sx-primary)'],['Gains cumulés',Math.max(0,gains),'#34d399']];
  C.text('compN',M(B)+' total');$('compBar').innerHTML=parts.map(function(p){return '<span style="width:'+(B?p[1]/B*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('compLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+': '+M(p[1])+' ('+pc(B?p[1]/B*100:0)+')</span>';}).join('');
  C.text('ledH',Y+'ans : évolution de la croissance et du coût des études supérieures');C.text('ledTag',pc(r)+' croissance / '+pc(inf)+' inflation des frais de scolarité');
  var rows=[];for(var y=1;y<=Y;y++){var bb=fv(b0,m,r,y*12),p=b0+m*12*y,t=4*cost*Math.pow(1+inf/100,y)*cov;rows.push({a:age+y,yr:Y0+y,d:m*12,p:p,g:bb-p,b:bb,t:t,gap:bb-t,fin:y===Y});}
  last={rows:rows};
  $('tbl').innerHTML=rows.map(function(x){return '<tr'+(x.fin?' class="fin"':'')+'><td style="font-family:inherit;font-weight:600">'+(x.fin?'<span class="msym" aria-hidden="true" style="font-size:14px;vertical-align:-2px">flag</span> ':'')+'Âge '+x.a+(x.fin?' (Enrollment)':'')+'</td><td>'+x.yr+'</td><td>'+M(x.d)+'</td><td>'+M(x.p)+'</td><td class="pos">'+M(x.g)+'</td><td class="b">'+M(x.b)+'</td><td>'+M(x.t)+'</td><td class="'+(x.gap<0?'r':'pos')+'">'+(x.gap<0?'':'+')+M(x.gap)+'</td></tr>';}).join('');
  C.text('infEx',pc(inf,1));C.text('dbl',inf>0?Math.round(Math.log(2)/Math.log(1+inf/100)):'—');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'csCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('529-college-savings.csv',[{h:'Âge de l’enfant',key:'a'},{h:'Année',key:'yr'},{h:'Versements annuels',key:'d'},{h:'Capital cumulé',key:'p'},{h:'Gains',key:'g'},{h:'Solde',key:'b'},{h:'Coût sur 4 ans',key:'t'},{h:'Écart',key:'gap'}],last.rows.map(function(x){return {a:x.a,yr:x.yr,d:Math.round(x.d),p:Math.round(x.p),g:Math.round(x.g),b:Math.round(x.b),t:Math.round(x.t),gap:Math.round(x.gap)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCollege={fv:fv};
})();
