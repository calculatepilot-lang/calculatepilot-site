/* Shipping cost & dimensional weight — CalculatePilot (Stitch redesign).
   DIM weight = L × W × H (in³) ÷ divisor; billable = ceil(max(actual, DIM)); cost = billable × rate × service × (1 + fuel%) + fees.
   Rates and fees are entered by the user; nothing here is a carrier quote. Zones are approximate by distance. */
(function(){
var C=window.CPX,$=C.$,last='',csv='',prevU='in';
function zone(mi){return mi<=150?'1–2':mi<=300?'3':mi<=600?'4':mi<=1000?'5':mi<=1400?'6':mi<=1800?'7':'8';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oAct','oDim','oPen','oZone'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um das Ergebnis zu sehen.');$('cmp').innerHTML='';last='';}
function row(l,s,v,b){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--sx-border);font-size:'+(b?'15':'13')+'px"><span style="color:var(--sx-onv)">'+l+(s?'<small style="display:block;color:var(--sx-muted);font-size:11px">'+s+'</small>':'')+'</span><b style="font-family:var(--font-mono);color:var(--sx-on);white-space:nowrap">'+v+'</b></div>';}
function compute(){
  var u=$('u').value,k=u==='cm'?1/2.54:1,wk=u==='cm'?2.2046226218:1;
  if(u!==prevU){['L','W','H'].forEach(function(id){$(id).value=+(C.val(id)*(u==='cm'?2.54:1/2.54)).toFixed(1);});$('wt').value=+(C.val('wt')*(u==='cm'?1/2.2046226218:2.2046226218)).toFixed(2);prevU=u;}
  document.querySelectorAll('[data-du]').forEach(function(e){e.textContent=u==='cm'?'cm':'in';});document.querySelectorAll('[data-dw]').forEach(function(e){e.textContent=u==='cm'?'kg':'lb';});
  $('cdBox').hidden=$('dv').value!=='custom';
  var L=C.val('L')*k,W=C.val('W')*k,H=C.val('H')*k,act=C.val('wt')*wk,div=$('dv').value==='custom'?C.val('cdv'):+$('dv').value,mi=C.val('mi'),qty=Math.max(1,Math.round(C.val('qty'))||1);
  $('err').hidden=true;
  if(!(L>0&&W>0&&H>0))return fail('Geben Sie Länge, Breite und Höhe des Pakets ein.');
  if(!(act>0))return fail('Geben Sie das tatsächliche Gewicht ein.');
  if(!(div>0))return fail('Geben Sie einen Divisor größer als null ein.');
  var vol=L*W*H,dim=vol/div,billRaw=Math.max(act,dim),bill=Math.ceil(billRaw-1e-9),pen=bill-act;
  C.text('vol',C.num(vol,0)+' in³ · '+C.num(vol/1728,2)+' ft³');
  C.text('dimV',C.num(vol,0)+' ÷ '+div+' = '+C.num(dim,2)+' lb Volumengewicht, gegenüber '+C.num(act,2)+' lb auf der Waage.');
  C.text('zoneV','Eine Entfernung von '+C.num(mi,0)+' Meilen fällt ungefähr in Zone '+zone(mi)+'.');
  C.text('resultValue',C.num(bill,0));C.text('tag',dim>act?'Es gilt das Volumengewicht':'Es gilt das tatsächliche Gewicht');
  C.text('interp',(dim>act?'Der Karton ist für sein Gewicht sperrig, daher wird Ihnen berechnet: '+bill+' lb statt '+C.num(act,1)+' lb.':'Das Paket ist dicht, daher bestimmt das Waagengewicht den Preis.'));
  C.text('oAct',C.num(act,2)+' lb');C.text('oDim',C.num(dim,2)+' lb');C.text('oPen',(pen>0?'+':'')+C.num(pen,1)+' lb');C.text('oZone',zone(mi));
  var svc=+$('sv').value,fs=C.val('fs')/100,res=$('ad').value==='res'?C.val('rs'):0,ins=C.val('dvv')/100*C.val('ir'),sg=$('sg').value==='direct'?5.9:$('sg').value==='adult'?7.5:0;
  var rates=[['Anbieter A',C.val('r1')],['Anbieter B',C.val('r2')],['Anbieter C',C.val('r3')]],res2=[],best=null;
  rates.forEach(function(r){var base=bill*r[1]*svc*(1+fs),tot=(base+res+ins+sg)*qty;res2.push([r[0],base,tot]);if(best===null||tot<best[2])best=res2[res2.length-1];});
  $('cmp').innerHTML=res2.map(function(r,i){return row(r[0]+(r===best?' <span class="sx-mt-tag">am günstigsten</span>':''),'billable '+bill+' lb × '+C.money(rates[i][1],2)+(svc>1?' × '+svc:'')+' + Gebühren',C.money(r[2],2));}).join('').replace('border-top:1px solid var(--sx-border)','border-top:0');
  C.text('cmpN',qty>1?qty+' packages':'pro Paket');
  csv='Anbieter,Abrechnungsgewicht lb,Preis pro lb,Gesamt\n'+res2.map(function(r,i){return [r[0],bill,rates[i][1],r[2].toFixed(2)].join(',');}).join('\n');
  /* box optimisation */
  var opts=[[1,'1 in kürzer'],[2,'2 in kürzer'],[3,'3 in kürzer']],h='',bestSave=0,bestTxt='';
  opts.forEach(function(o){var hh=H-o[0]*(u==='cm'?1:1);if(hh<=0)return;var d2=L*W*hh/div,b2=Math.ceil(Math.max(act,d2)-1e-9),sv=(bill-b2)*best[2]/Math.max(bill,1)/qty*0;var save=(bill-b2)*rates[0][1]*svc*(1+fs);h+='<tr><td class="a">'+o[1]+'</td><td class="n">'+C.num(d2,2)+'</td><td class="n">'+b2+' lb</td><td class="n">'+(save>0?C.money(save,2):'—')+'</td></tr>';if(save>bestSave){bestSave=save;bestTxt=o[1]+' ('+C.num(L,0)+' × '+C.num(W,0)+' × '+C.num(H-o[0],0)+' in)';}});
  $('opt').querySelector('tbody').innerHTML=h;
  C.text('tip',bestSave>0?'Ein Karton '+bestTxt+' würde etwa einsparen: '+C.money(bestSave,2)+' pro Paket zum Tarif von Anbieter A.':(dim>act?'Kürzere Kartons senken das Abrechnungsgewicht nicht weiter. Versuchen Sie eine leichtere Verpackung oder einen anderen Divisor.':'Dieser Karton wird bereits nach tatsächlichem Gewicht berechnet, ein kleinerer Karton senkt die Kosten daher nicht.'));
  last='Versandkosten — calculatepilot.com/other/shipping-cost-calculator.html\n'+C.num(L,1)+' × '+C.num(W,1)+' × '+C.num(H,1)+' in, '+C.num(act,2)+' lb: DIM '+C.num(dim,2)+' lb, abgerechnet '+bill+' lb\n'+res2.map(function(r){return r[0]+': '+C.money(r[2],2);}).join('\n');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'spCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!csv)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='shipping.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
