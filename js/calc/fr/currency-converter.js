/* Currency converter — CalculatePilot (Stitch 1:1 redesign).
   Mid-market: out = amount × rate. Provider: delivered = (amount − flat fee) × rate × (1 − markup).
   Rate is entered by the user (no live feed); swapping currencies inverts it. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var CUR=[['USD','🇺🇸','Dollar américain'],['EUR','🇪🇺','Euro'],['GBP','🇬🇧','Livre sterling'],['JPY','🇯🇵','Yen japonais'],['CAD','🇨🇦','Dollar canadien'],['AUD','🇦🇺','Dollar australien'],['CHF','🇨🇭','Franc suisse'],['CNY','🇨🇳','Yuan chinois'],['INR','🇮🇳','Roupie indienne'],['MXN','🇲🇽','Peso mexicain'],['SGD','🇸🇬','Dollar de Singapour'],['NZD','🇳🇿','Dollar néo-zélandais'],['HKD','🇭🇰','Dollar de Hong Kong'],['SEK','🇸🇪','Couronne suédoise'],['NOK','🇳🇴','Couronne norvégienne'],['ZAR','🇿🇦','Rand sud-africain'],['AED','🇦🇪','Dirham des Émirats arabes unis'],['PKR','🇵🇰','Roupie pakistanaise'],['PHP','🇵🇭','Peso philippin'],['BRL','🇧🇷','Réal brésilien'],['NGN','🇳🇬','Naira nigérian']];
var PROV={s1:['Taux interbancaire',0,0],s2:['Spécialiste en ligne',0.5,0],s3:['Grande banque de détail',3.25,30],s4:['Bureau de change',9.5,0]};

function N(x,d){if(!isFinite(x))return '—';d=d===undefined?2:d;return x.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});}
function R(x){if(!isFinite(x)||x<=0)return '—';var d=x>=100?2:x>=1?4:6;return x.toFixed(d);}
function deliv(a,rate,mk,ff){return Math.max(0,a-ff)*rate*(1-mk/100);}

function compute(){
  var f=$('from').value,t=$('to').value,a=Math.max(0,v('amount')),rate=Math.max(0,v('exchangeRate')),mk=Math.max(0,v('mk')),ff=Math.max(0,v('ff'));
  ['fromSuf','ffSuf'].forEach(function(id){C.text(id,f);});C.text('toSuf',t);C.text('toC',t);C.text('rateL','Taux de change (1 '+f+' = ? '+t+')');
  var mid=a*rate,d=deliv(a,rate,mk,ff),loss=mid-d,lossS=rate?loss/rate:0,p=$('prov').value;
  C.text('pairL',f+'/'+t+' taux interbancaire (votre taux)');C.text('pairV',R(rate));C.text('sprV',N(mk)+'%'+(ff?' + '+N(ff,0)+' '+f:''));
  C.text('resultValue',N(mid));C.text('r1','1 '+f+' = '+R(rate)+' '+t);C.text('outInverse','1 '+t+' = '+R(rate?1/rate:NaN)+' '+f);
  var fr=$('frBox'),pn=(mk===PROV[p][1]&&ff===PROV[p][2])?PROV[p][0]:'Votre devis de prestataire';
  fr.className='sx-fx-fr'+(loss<=0.005?' ok':'');C.text('frH',pn+(loss<=0.005?' — Sans frais':' Frais'));
  C.text('deliv',N(d)+' '+t);C.text('loss',(loss>0?'−':'')+N(Math.abs(loss))+' '+t+' ('+(loss>0?'−':'')+N(Math.abs(lossS))+' '+f+') · '+(mid?N(loss/mid*100):'0.00')+'% de perte');
  var mkC=Math.max(0,a-ff)*rate*mk/100,ffC=Math.min(a,ff)*rate,parts=[['Montant net reçu',d,'var(--sx-primary)'],['Marge de change ('+N(mk)+'%)',mkC,'#f59e0b'],['Frais fixes ('+N(ff,0)+' '+f+')',ffC,'#ef4444']];
  C.text('pctD',(mid?N(d/mid*100):'0.00')+'% reçu');
  $('anBar').innerHTML=parts.map(function(x){return '<span style="width:'+(mid?x[1]/mid*100:0)+'%;background:'+x[2]+'"></span>';}).join('');
  $('anLg').innerHTML=parts.map(function(x){return '<span><i style="background:'+x[2]+'"></i>'+x[0]+'</span>';}).join('');
  var rows=['s1','s2','s3','s4'].map(function(k){var q=PROV[k],dd=deliv(a,rate,q[1],q[2]);return {n:q[0],mk:q[1],ff:q[2],eff:a?dd/a:0,d:dd,l:mid-dd,p10:(10000*rate)-deliv(10000,rate,q[1],q[2]),sel:k===p};});
  last={rows:rows,f:f,t:t};
  C.text('mxN','Ce que chaque canal livrerait pour '+N(a)+' '+f+' à 1 '+f+' = '+R(rate)+' '+t+'.');
  $('tbl').innerHTML=rows.map(function(x){return '<tr'+(x.sel?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+x.n+'</td><td>'+N(x.mk)+'%</td><td>'+(x.ff?N(x.ff,0)+' '+f:'—')+'</td><td>'+R(x.eff)+'</td><td class="b">'+N(x.d)+' '+t+'</td><td class="'+(x.l>0.005?'r':'')+'">'+(x.l>0.005?'−'+N(x.l)+' '+t:'—')+'</td><td class="mu">'+(x.p10>0.005?'−'+N(x.p10,0)+' '+t:'—')+'</td></tr>';}).join('');
  var bank=rows[2],dig=rows[1];
  C.text('obs','Pour ce transfert, un spécialiste en ligne typique livrerait environ '+N(dig.d-bank.d)+' '+t+' de plus qu’un virement bancaire classique. Plus le montant est élevé, plus la marge en pourcentage l’emporte sur les frais fixes.');
}

document.addEventListener('DOMContentLoaded',function(){
  var opts=CUR.map(function(c){return '<option value="'+c[0]+'">'+c[1]+' '+c[0]+' — '+c[2]+'</option>';}).join('');
  $('from').innerHTML=opts;$('to').innerHTML=opts;$('from').value='USD';$('to').value='EUR';
  $('from').setAttribute('data-default','USD');$('to').setAttribute('data-default','EUR');
  $('prov').addEventListener('input',function(){var q=PROV[this.value];if(q){$('mk').value=q[1];$('ff').value=q[2];}});
  $('swap').addEventListener('click',function(){var f=$('from').value;$('from').value=$('to').value;$('to').value=f;var r=v('exchangeRate');if(r>0)$('exchangeRate').value=+(1/r).toPrecision(6);$('exchangeRate').dispatchEvent(new Event('input',{bubbles:true}));});
  C.init({root:'fxCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('fx-provider-matrix.csv',[{h:'Canal',key:'n'},{h:'Marge %',key:'mk'},{h:'Frais fixes ('+last.f+')',key:'ff'},{h:'Taux effectif',key:'e'},{h:'Le bénéficiaire reçoit ('+last.t+')',key:'d'},{h:'Coût par rapport au taux interbancaire ('+last.t+')',key:'l'}],last.rows.map(function(x){return {n:x.n,mk:x.mk,ff:x.ff,e:x.eff.toFixed(6),d:x.d.toFixed(2),l:x.l.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpFx={deliv:deliv};
})();
