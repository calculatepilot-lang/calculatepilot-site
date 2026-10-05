/* Credit utilization calculator — CalculatePilot (Stitch 1:1 redesign).
   Utilization = balance ÷ credit limit (per card and overall). Paydown capital is allocated by strategy:
   balance per card (water-fill the highest ratios), highest utilization first, or lowest balance first. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null,seq=0;
var cards=[{n:'Chase Sapphire',l:10000,b:3200,d:15},{n:'Amex Blue Cash',l:6000,b:2400,d:22},{n:'Capital One Venture',l:4000,b:400,d:5}];
var DAYS=[1,5,10,15,20,22,25,28];

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('fr-FR');}
function pc(x){return isFinite(x)?x.toFixed(1)+'%':'—';}
function ord(d){return d+(d%10===1&&d!==11?'st':d%10===2&&d!==12?'nd':d%10===3&&d!==13?'rd':'th');}
function tier(u){return u<10?['Faible','']:u<30?['Modérée','']:u<50?['Élevée','mid']:u<75?['Élevé','hi']:['Très élevé','hi'];}

function render(){
  $('cards').innerHTML=cards.map(function(c,i){return '<div class="sx-cu-card" data-i="'+i+'"><div class="h"><em>'+(i+1)+'</em><input type="text" class="cn" value="'+C.esc(c.n)+'" aria-label="Card name"><span class="u">—</span>'+(cards.length>1?'<button type="button" class="rm" aria-label="Remove card"><span class="msym" aria-hidden="true">close</span></button>':'')+'</div><div class="g"><div><label>Limite de crédit ($)</label><input type="number" class="cl" min="0" step="100" value="'+c.l+'" aria-label="Credit limit"></div><div><label>Solde actuel ($)</label><input type="number" class="cb" min="0" step="50" value="'+c.b+'" aria-label="Current balance"></div><div><label>Date du relevé</label><select class="cd" aria-label="Statement closing day">'+DAYS.map(function(d){return '<option value="'+d+'"'+(d===c.d?' selected':'')+'>'+ord(d)+' du mois</option>';}).join('')+'</select></div></div></div>';}).join('');
}
function read(){document.querySelectorAll('#cards .sx-cu-card').forEach(function(el){var c=cards[+el.getAttribute('data-i')];c.n=el.querySelector('.cn').value||'Carte';c.l=Math.max(0,parseFloat(el.querySelector('.cl').value)||0);c.b=Math.max(0,parseFloat(el.querySelector('.cb').value)||0);c.d=+el.querySelector('.cd').value;});}

function allocate(cap,strat){
  var pay=cards.map(function(){return 0;});
  if(strat==='bal'){var lo=0,hi=1;cards.forEach(function(c){if(c.l>0)hi=Math.max(hi,c.b/c.l);});
    var need=function(L){return cards.reduce(function(s,c){return s+Math.max(0,c.b-L*c.l);},0);};
    if(need(0)<=cap){cards.forEach(function(c,i){pay[i]=c.b;});}
    else{for(var k=0;k<60;k++){var m=(lo+hi)/2;if(need(m)>cap)lo=m;else hi=m;}cards.forEach(function(c,i){pay[i]=Math.max(0,c.b-hi*c.l);});}}
  else{var order=cards.map(function(c,i){return i;}).sort(function(a,b){return strat==='hi'?(cards[b].b/(cards[b].l||1))-(cards[a].b/(cards[a].l||1)):cards[a].b-cards[b].b;}),left=cap;
    order.forEach(function(i){var p=Math.min(left,cards[i].b);pay[i]=p;left-=p;});}
  return pay;
}

function compute(){
  read();var L=cards.reduce(function(s,c){return s+c.l;},0),B=cards.reduce(function(s,c){return s+c.b;},0),u=L>0?B/L*100:0,tgt=Math.max(0,v('tgt')),cap=Math.max(0,v('cap'));
  document.querySelectorAll('#cards .sx-cu-card').forEach(function(el,i){var c=cards[i],r=c.l>0?c.b/c.l*100:0,t=tier(r),s=el.querySelector('.u');s.textContent=pc(r)+' Util.';s.className='u '+t[1];});
  C.text('tLim',M(L));C.text('tBal',M(B));C.text('tN',cards.length+' Compte'+(cards.length===1?'':'s'));
  C.text('tgtOut',tgt+'%');var tt=tier(tgt);$('tgtTag').textContent=tt[0]+' Niveau';
  var t=tier(u),el=$('tier');el.textContent=t[0]+' Utilisation';el.className='sx-ef-grade'+(t[1]?' '+t[1]:'');
  C.text('resultValue',pc(u));C.text('bal',M(B));C.text('lim',M(L));var need=Math.max(0,B-tgt/100*L);C.text('pay',need>0?'Paie '+M(need):'Objectif atteint');C.text('payN',need>0?'pour atteindre '+tgt+'% au total':'Déjà à ou en dessous de '+tgt+'%');
  var p=allocate(cap,$('strat').value),after=cards.map(function(c,i){return c.b-p[i];}),B2=after.reduce(function(s,x){return s+x;},0),u2=L>0?B2/L*100:0;
  C.text('curL',pc(u));C.text('simL',pc(u2));$('curM').style.left=Math.min(100,u)+'%';$('simM').style.left=Math.min(100,u2)+'%';
  var hiIdx=0,hiR=-1;after.forEach(function(b,i){var r=cards[i].l>0?b/cards[i].l*100:0;if(r>hiR){hiR=r;hiIdx=i;}});
  C.text('simO',pc(u)+' → '+pc(u2));C.text('simH',cards.length?cards[hiIdx].n+' · '+pc(hiR):'—');
  var over=after.map(function(b,i){return [cards[i],cards[i].l>0?b/cards[i].l*100:0];}).filter(function(x){return x[1]>=30;}),al=$('alert');
  if(over.length){al.className='sx-cu-alert';al.querySelector('.msym').textContent='warning';C.text('alertTxt','Alerte par carte : '+over.map(function(x){return x[0].n+' ('+pc(x[1])+')';}).join(', ')+' afficherait encore 30 % ou plus. Une utilisation élevée sur une seule carte peut peser sur votre score même lorsque l’utilisation globale est plus basse.');}
  else{al.className='sx-cu-alert ok';al.querySelector('.msym').textContent='check_circle';C.text('alertTxt','Après ce remboursement, chaque carte affiche moins de 30 % de sa limite.');}
  var rows=cards.map(function(c,i){return {c:c,i:i,pay:p[i]};}).sort(function(a,b){return a.c.d-b.c.d;});last={rows:rows,tgt:tgt};
  $('tbl').innerHTML=rows.map(function(x){var c=x.c,r=c.l>0?c.b/c.l*100:0,t=tier(r),goal=tgt/100*c.l,dot=r>=30?'r':r>=10?'':'g';
    return '<tr><td><span class="dot '+dot+'"></span>'+C.esc(c.n)+'</td><td>'+M(c.l)+'</td><td>'+M(c.b)+'</td><td class="'+(r>=30?'r':'')+'">'+pc(r)+'</td><td><span class="sx-cu-risk '+t[1]+'">'+t[0]+'</span></td><td>'+ord(c.d)+' du mois</td><td style="white-space:normal">'+(c.b>goal+0.5?'Remboursez jusqu’à '+M(goal)+' avant le '+ord(c.d):'Maintenez le solde à ou sous '+M(goal))+'</td></tr>';}).join('')+
    '<tr class="act"><td>Totaux et recommandation</td><td>'+M(L)+'</td><td>'+M(B)+'</td><td>'+pc(u)+'</td><td colspan="2">'+(u>tgt?pc(u-tgt)+' au-dessus de votre '+tgt+'% d’objectif':'Dans votre '+tgt+'% d’objectif')+'</td><td>Remboursement total pour atteindre l’objectif : '+M(need)+'</td></tr>';
}

document.addEventListener('DOMContentLoaded',function(){
  render();
  $('cards').addEventListener('click',function(e){var b=e.target.closest('.rm');if(!b)return;read();cards.splice(+b.closest('.sx-cu-card').getAttribute('data-i'),1);render();compute();});
  $('addBtn').addEventListener('click',function(){read();seq++;cards.push({n:'Carte '+(cards.length+1),l:5000,b:0,d:15});render();compute();});
  C.init({root:'cuCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('credit-utilization-plan.csv',[{h:'Carte',key:'n'},{h:'Limite',key:'l'},{h:'Solde',key:'b'},{h:'Jour du relevé',key:'d'},{h:'Remboursement affecté',key:'p'},{h:'Solde cible',key:'g'}],last.rows.map(function(x){return {n:x.c.n,l:x.c.l,b:x.c.b,d:x.c.d,p:Math.round(x.pay),g:Math.round(last.tgt/100*x.c.l)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpCreditUtil={};
})();
