/* Shipping cost & dimensional weight — CalculatePilot (Stitch redesign).
   DIM weight = L × W × H (in³) ÷ divisor; billable = ceil(max(actual, DIM)); cost = billable × rate × service × (1 + fuel%) + fees.
   Rates and fees are entered by the user; nothing here is a carrier quote. Zones are approximate by distance. */
(function(){
var C=window.CPX,$=C.$,last='',csv='',prevU='in';
function zone(mi){return mi<=150?'1–2':mi<=300?'3':mi<=600?'4':mi<=1000?'5':mi<=1400?'6':mi<=1800?'7':'8';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oAct','oDim','oPen','oZone'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the result.');$('cmp').innerHTML='';last='';}
function row(l,s,v,b){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--sx-border);font-size:'+(b?'15':'13')+'px"><span style="color:var(--sx-onv)">'+l+(s?'<small style="display:block;color:var(--sx-muted);font-size:11px">'+s+'</small>':'')+'</span><b style="font-family:var(--font-mono);color:var(--sx-on);white-space:nowrap">'+v+'</b></div>';}
function compute(){
  var u=$('u').value,k=u==='cm'?1/2.54:1,wk=u==='cm'?2.2046226218:1;
  if(u!==prevU){['L','W','H'].forEach(function(id){$(id).value=+(C.val(id)*(u==='cm'?2.54:1/2.54)).toFixed(1);});$('wt').value=+(C.val('wt')*(u==='cm'?1/2.2046226218:2.2046226218)).toFixed(2);prevU=u;}
  document.querySelectorAll('[data-du]').forEach(function(e){e.textContent=u==='cm'?'cm':'in';});document.querySelectorAll('[data-dw]').forEach(function(e){e.textContent=u==='cm'?'kg':'lb';});
  $('cdBox').hidden=$('dv').value!=='custom';
  var L=C.val('L')*k,W=C.val('W')*k,H=C.val('H')*k,act=C.val('wt')*wk,div=$('dv').value==='custom'?C.val('cdv'):+$('dv').value,mi=C.val('mi'),qty=Math.max(1,Math.round(C.val('qty'))||1);
  $('err').hidden=true;
  if(!(L>0&&W>0&&H>0))return fail('Enter the length, width and height of the package.');
  if(!(act>0))return fail('Enter the actual weight.');
  if(!(div>0))return fail('Enter a divisor above zero.');
  var vol=L*W*H,dim=vol/div,billRaw=Math.max(act,dim),bill=Math.ceil(billRaw-1e-9),pen=bill-act;
  C.text('vol',C.num(vol,0)+' in³ · '+C.num(vol/1728,2)+' ft³');
  C.text('dimV',C.num(vol,0)+' ÷ '+div+' = '+C.num(dim,2)+' lb of dimensional weight, against '+C.num(act,2)+' lb on the scale.');
  C.text('zoneV','Distance of '+C.num(mi,0)+' miles falls in about zone '+zone(mi)+'.');
  C.text('resultValue',C.num(bill,0));C.text('tag',dim>act?'Dimensional weight applies':'Actual weight applies');
  C.text('interp',(dim>act?'The box is bulky for its weight, so you are billed for '+bill+' lb instead of '+C.num(act,1)+' lb.':'The package is dense, so the scale weight sets the price.'));
  C.text('oAct',C.num(act,2)+' lb');C.text('oDim',C.num(dim,2)+' lb');C.text('oPen',(pen>0?'+':'')+C.num(pen,1)+' lb');C.text('oZone',zone(mi));
  var svc=+$('sv').value,fs=C.val('fs')/100,res=$('ad').value==='res'?C.val('rs'):0,ins=C.val('dvv')/100*C.val('ir'),sg=$('sg').value==='direct'?5.9:$('sg').value==='adult'?7.5:0;
  var rates=[['Carrier A',C.val('r1')],['Carrier B',C.val('r2')],['Carrier C',C.val('r3')]],res2=[],best=null;
  rates.forEach(function(r){var base=bill*r[1]*svc*(1+fs),tot=(base+res+ins+sg)*qty;res2.push([r[0],base,tot]);if(best===null||tot<best[2])best=res2[res2.length-1];});
  $('cmp').innerHTML=res2.map(function(r,i){return row(r[0]+(r===best?' <span class="sx-mt-tag">lowest</span>':''),'billable '+bill+' lb × '+C.money(rates[i][1],2)+(svc>1?' × '+svc:'')+' + fees',C.money(r[2],2));}).join('').replace('border-top:1px solid var(--sx-border)','border-top:0');
  C.text('cmpN',qty>1?qty+' packages':'per package');
  csv='Carrier,Billable lb,Rate per lb,Total\n'+res2.map(function(r,i){return [r[0],bill,rates[i][1],r[2].toFixed(2)].join(',');}).join('\n');
  /* box optimisation */
  var opts=[[1,'1 in shorter'],[2,'2 in shorter'],[3,'3 in shorter']],h='',bestSave=0,bestTxt='';
  opts.forEach(function(o){var hh=H-o[0]*(u==='cm'?1:1);if(hh<=0)return;var d2=L*W*hh/div,b2=Math.ceil(Math.max(act,d2)-1e-9),sv=(bill-b2)*best[2]/Math.max(bill,1)/qty*0;var save=(bill-b2)*rates[0][1]*svc*(1+fs);h+='<tr><td class="a">'+o[1]+'</td><td class="n">'+C.num(d2,2)+'</td><td class="n">'+b2+' lb</td><td class="n">'+(save>0?C.money(save,2):'—')+'</td></tr>';if(save>bestSave){bestSave=save;bestTxt=o[1]+' ('+C.num(L,0)+' × '+C.num(W,0)+' × '+C.num(H-o[0],0)+' in)';}});
  $('opt').querySelector('tbody').innerHTML=h;
  C.text('tip',bestSave>0?'A box '+bestTxt+' would save about '+C.money(bestSave,2)+' per package at Carrier A’s rate.':(dim>act?'Shorter boxes do not cut the billable weight further. Try a lighter packaging or a different divisor.':'This box is already priced on actual weight, so a smaller box will not lower the cost.'));
  last='Shipping cost — calculatepilot.com/other/shipping-cost-calculator.html\n'+C.num(L,1)+' × '+C.num(W,1)+' × '+C.num(H,1)+' in, '+C.num(act,2)+' lb: DIM '+C.num(dim,2)+' lb, billable '+bill+' lb\n'+res2.map(function(r){return r[0]+': '+C.money(r[2],2);}).join('\n');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'spCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!csv)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='shipping.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
