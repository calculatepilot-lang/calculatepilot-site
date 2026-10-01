/* HELOC calculator — CalculatePilot (Stitch 1:1 redesign).
   Max line = value × CLTV cap − first mortgage; CLTV = (first + draw) ÷ value.
   Draw period: interest-only on the full draw; repayment: level P&I over the repayment years (constant rate).
   Optional fixed-rate home equity loan amortized over the same total term. */
(function(){
var C=window.CPX,$=C.$,v=C.val;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('fr-FR',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function K(x){return x>=1e6?'$'+(x/1e6).toFixed(2)+'M':'$'+Math.round(x/1000)+'k';}
function pmt(P,apr,n){var i=apr/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}

function inputs(){
  return {value:Math.max(0,v('value')),first:Math.max(0,v('first')),cap:Math.max(0,v('cap')),draw:Math.max(0,v('draw')),dYrs:Math.max(1,Math.round(v('dYrs'))),rYrs:Math.max(1,Math.round(v('rYrs'))),
    rate:Math.max(0,v('rate')),hel:$('hel').checked,helRate:Math.max(0,v('helRate'))};
}

function calc(o){
  var maxLine=Math.max(0,o.value*o.cap/100-o.first),cltv=o.value>0?(o.first+o.draw)/o.value*100:0;
  var io=o.draw*o.rate/100/12,n=o.rYrs*12,pi=pmt(o.draw,o.rate,n),i1=io*o.dYrs*12,i2=pi*n-o.draw;
  var hn=(o.dYrs+o.rYrs)*12,hp=pmt(o.draw,o.helRate,hn);
  return {maxLine:maxLine,cltv:cltv,io:io,pi:pi,i1:i1,i2:i2,hp:hp,hInt:hp*hn-o.draw};
}

function compute(){
  var o=inputs(),r=calc(o),T=o.dYrs+o.rYrs;
  $('helRow').hidden=!o.hel;
  var dr=$('drawR');dr.max=Math.max(1000,Math.ceil(Math.max(r.maxLine,o.draw)/1000)*1000);
  var dn=$('drawNote');if(o.draw>r.maxLine+0.5){dn.textContent='Dépasse la limite maximale de '+M(o.draw-r.maxLine);dn.className='warn';}else{dn.textContent='Tirage prévu';dn.className='mu';}

  C.text('resultValue',M(r.maxLine));C.text('maxNote',K(o.value*o.cap/100)+' Plafond − '+K(o.first)+' 1st');
  C.text('cltv',r.cltv.toFixed(1)+'%');
  var buf=o.cap-r.cltv,cn=$('cltvNote');cn.textContent=buf>=0?buf.toFixed(1)+'% de marge sous '+o.cap+'% de plafond':Math.abs(buf).toFixed(1)+'% au-dessus du '+o.cap+'% de plafond';cn.className=buf>=0?'ok':'bad';
  var z=$('zone');if(r.cltv>o.cap+0.001){z.textContent='Dépasse le plafond CLTV';z.className='sx-ef-grade hi';}else if(r.cltv<=80){z.textContent='Zone d’octroi sûre';z.className='sx-ef-grade';}else if(r.cltv<=85){z.textContent='Zone modérée';z.className='sx-ef-grade mid';}else{z.textContent='Zone de risque élevé';z.className='sx-ef-grade hi';}
  document.querySelectorAll('#tiers li').forEach(function(li){var t=+li.getAttribute('data-t');li.className=(t===80&&r.cltv<=80)||(t===85&&r.cltv>80&&r.cltv<=85)||(t===90&&r.cltv>85)?'on':'';});

  C.text('stackVal',M(o.value)+' Valeur');
  var V=o.value||1,rem=Math.max(0,r.maxLine-o.draw),cush=Math.max(0,o.value-o.first-Math.max(o.draw,r.maxLine)),segs=[
    ['1er prêt immobilier',o.first,'var(--sx-tertiary)'],['HELOC demandé',Math.min(o.draw,Math.max(0,o.value-o.first)),'var(--sx-pc)'],['Ligne restante',rem,'var(--sx-fdim)'],['Marge protégée',cush,'var(--sx-sch)']];
  $('stack').innerHTML=segs.map(function(s){return '<span style="width:'+(s[1]/V*100)+'%;background:'+s[2]+'"></span>';}).join('');
  $('stackLg').innerHTML=segs.map(function(s){return '<span><i style="background:'+s[2]+'"></i><span>'+s[0]+': <b>'+(s[1]/V*100).toFixed(1)+'% ('+K(s[1])+')</b></span></span>';}).join('');

  C.text('totTerm',T+' ans de durée totale');
  C.text('p1Lbl','Phase 1 : années 1–'+o.dYrs);C.text('p2Lbl','Phase 2 : années '+(o.dYrs+1)+'–'+T);
  C.text('p1',M(r.io));C.text('p2',M(r.pi));C.text('p2Note','Remboursement complet du solde sur '+(o.rYrs*12)+' mois');
  var sh=r.pi-r.io;C.text('shockAmt','+'+M(sh)+' (+'+(r.io>0?(sh/r.io*100).toFixed(1):'0')+'%)');C.text('shockYr','Année '+(o.dYrs+1));$('shock').hidden=!(sh>0.5);
  C.text('i1Lbl','Total des intérêts payés pendant le tirage (années 1-'+o.dYrs+'):');C.text('i2Lbl','Total des intérêts pendant le remboursement (années '+(o.dYrs+1)+'-'+T+'):');
  C.text('i1',M(r.i1));C.text('i2',M(r.i2));C.text('i3',M(r.i1+r.i2));
  var hi=$('helInfo');hi.hidden=!o.hel;
  if(o.hel)hi.innerHTML='<b>Prêt sur valeur domiciliaire à taux fixe de '+o.helRate+'%:</b> '+M(r.hp)+'/mo for all '+T+' ans, '+M(r.hInt)+' d’intérêts au total — '+(r.hInt<r.i1+r.i2?M(r.i1+r.i2-r.hInt)+' less':M(r.hInt-r.i1-r.i2)+' more')+' que le HELOC à un taux constant de '+o.rate+'%.';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'hlCalc',compute:compute});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpHeloc={calc:calc};
})();
