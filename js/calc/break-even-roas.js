/* Break-Even ROAS Calculator — CalculatePilot. Own logic, independent of break-even.js.
   For each product: net revenue = price ÷ (1 + VAT); costs = product cost + shipping + other + fee% × price;
   profit before ads P = net revenue − costs. Break-even ROAS = price ÷ P; break-even ACoS = P ÷ price = 1 ÷ ROAS.
   Target ROAS: ad spend allowed A = P − target margin × net revenue; target ROAS = price ÷ A.
   Several products are blended by units sold: ROAS = Σ(price × units) ÷ Σ(P × units). */
(function(){
var C=window.CPX,$=C.$,last='',csv='';
var DEF=[
  {n:'Product A',p:60,v:20,c:14,s:5,f:3,o:1,u:100},
  {n:'Product B',p:30,v:20,c:8,s:4,f:3,o:0,u:200}
];
var seq=0;
function n2(x){return C.num(x,2);}
function r2(x){return isFinite(x)?C.num(x,2):'never';}
function pct(x){return isFinite(x)?C.num(x*100,1)+'%':'—';}
function fld(key,label,val,step,pre,suf){
  var inner=(pre?'<span class="pre cs">$</span>':'')+'<input type="number" inputmode="decimal" data-f="'+key+'" step="'+step+'" min="0" value="'+val+'" aria-label="'+label+'">';
  return '<div><div class="sx-au-l"><label>'+label+'</label></div><div class="sx-au-in sm'+(pre?'':' np')+(suf?' pc':'')+'">'+inner+(suf?'<span class="suf">%</span>':'')+'</div></div>';
}
function rowHtml(d){
  seq++;
  return '<div class="rp-row sx-card" data-row><div class="rp-top"><input type="text" data-f="n" class="rp-name" maxlength="40" value="'+C.esc(d.n)+'" aria-label="Product name"><button type="button" class="rp-del" data-del aria-label="Remove product"><span class="msym" aria-hidden="true">close</span></button></div>'+
    '<div class="rp-grid">'+fld('p','Selling price (with VAT)',d.p,'0.5',1)+fld('v','VAT or sales tax',d.v,'0.5',0,1)+fld('c','Product cost',d.c,'0.5',1)+fld('s','Shipping and packing',d.s,'0.5',1)+fld('f','Payment fee',d.f,'0.1',0,1)+fld('o','Other cost per unit',d.o,'0.5',1)+fld('u','Units sold',d.u,'1',0)+'</div></div>';
}
function render(list){
  $('rows').innerHTML=list.map(rowHtml).join('');
  document.querySelectorAll('#roasCalc .cs').forEach(function(e){e.textContent=C.symbol();});
}
function read(){
  var out=[];
  document.querySelectorAll('#rows [data-row]').forEach(function(r){
    function g(k){var e=r.querySelector('[data-f="'+k+'"]');return e?parseFloat(e.value)||0:0;}
    out.push({n:(r.querySelector('[data-f="n"]').value||'Product').trim()||'Product',p:g('p'),v:g('v'),c:g('c'),s:g('s'),f:g('f'),o:g('o'),u:Math.max(0,g('u'))});
  });
  return out;
}
function fail(msg){
  $('err').hidden=false;C.text('errT',msg);
  ['resultValue','acos','tRoas','cpaBE','cpaT','revT','profT'].forEach(function(i){C.text(i,'—');});
  C.text('tag','—');C.text('interp','Fix the input above to see the result.');$('prodT').querySelector('tbody').innerHTML='';last='';csv='';
}
function compute(){
  $('err').hidden=true;
  var tm=Math.max(0,Math.min(95,C.val('tm')))/100;
  var rows=read().filter(function(d){return d.p>0;});
  if(!rows.length)return fail('Enter a selling price above zero for at least one product.');
  var Rev=0,Net=0,P0=0,AT=0,U=0,h='',lines=['Product,Price,Net revenue,Costs,Profit before ads,Break-even ROAS,Break-even ACoS,Target ROAS'];
  rows.forEach(function(d){
    var net=d.p/(1+d.v/100),cost=d.c+d.s+d.o+d.p*d.f/100,P=net-cost,A=P-tm*net;
    var be=P>0?d.p/P:Infinity,ac=P>0?P/d.p:NaN,tr=A>0?d.p/A:Infinity;
    var u=d.u>0?d.u:1;
    Rev+=d.p*u;Net+=net*u;P0+=P*u;AT+=A*u;U+=u;d.P=P;d.be=be;d.tr=tr;
    h+='<tr><td class="a"><b>'+C.esc(d.n)+'</b></td><td class="n">'+C.money(net,2)+'</td><td class="n">'+C.money(cost,2)+'</td><td class="n">'+C.money(P,2)+'</td><td class="n">'+r2(be)+'</td><td class="n">'+(P>0?pct(ac):'—')+'</td><td class="n">'+r2(tr)+'</td></tr>';
    lines.push([JSON.stringify(d.n),d.p.toFixed(2),net.toFixed(2),cost.toFixed(2),P.toFixed(2),isFinite(be)?be.toFixed(2):'never',P>0?(ac*100).toFixed(1)+'%':'',isFinite(tr)?tr.toFixed(2):'never'].join(','));
  });
  $('prodT').querySelector('tbody').innerHTML=h;
  if(!(P0>0))return fail('Your products lose money before any ad spend (profit before ads is '+C.money(P0/U,2)+' per unit on average), so no ROAS can break even. Raise the price or cut costs.');
  var be=Rev/P0,ac=P0/Rev,tr=AT>0?Rev/AT:Infinity,units=U;
  var multi=rows.length>1;
  C.text('resultValue',n2(be));
  C.text('tag',multi?'Blended, '+rows.length+' products':rows[0].n);
  C.text('interp',(multi?'Across your product mix, ':'')+'every '+C.money(1,0)+' of ad spend must bring back '+C.money(be,2)+' of sales to break even. Below ROAS '+n2(be)+' the ads lose money; above it they earn a profit.');
  C.text('acos',pct(ac));C.text('tRoas',r2(tr));
  C.text('cpaBE',C.money(P0/units,2));C.text('cpaT',AT>0?C.money(AT/units,2):'—');
  C.text('revT',C.money(Rev,0));C.text('profT',C.money(P0,0));
  C.text('tmN',C.num(tm*100,0)+'% of net revenue');
  $('proof').textContent='break-even ROAS = '+C.num(Rev,2)+' ÷ '+C.num(P0,2)+' = '+n2(be)+'   ·   ACoS = '+C.num(P0,2)+' ÷ '+C.num(Rev,2)+' = '+C.num(ac*100,1)+'%';
  var top=Math.max(be*2.5,5),vals=[],lab=[];
  for(var i=0;i<=10;i++){var r=1+(top-1)*i/10;vals.push(P0-Rev/r);lab.push(C.num(r,1));}
  C.chart($('chart'),{series:[{name:'Profit after ads',values:vals,color:'#0f5b44'}],labels:lab,label:'Profit after ad spend at different ROAS levels',tipLabel:function(i){return 'ROAS '+lab[i];},tipFmt:function(x){return C.money(x,0);}});
  var ins='';
  if(AT>0)ins='To keep a '+C.num(tm*100,0)+'% profit margin on net revenue you need ROAS '+n2(tr)+' or better, which is ACoS '+C.num(AT/Rev*100,1)+'% or lower.';
  else ins='A '+C.num(tm*100,0)+'% target margin leaves nothing for ads at these costs, so lower the target or the costs.';
  C.text('ins',ins);
  last='Break-even ROAS — calculatepilot.com/financial/break-even-roas-calculator.html\n'+rows.length+' product'+(multi?'s':'')+', revenue '+C.money(Rev,0)+', profit before ads '+C.money(P0,0)+'\nBreak-even ROAS '+n2(be)+' (ACoS '+C.num(ac*100,1)+'%)'+(isFinite(tr)?'; ROAS '+n2(tr)+' for a '+C.num(tm*100,0)+'% margin':'');
  csv=lines.join('\n');
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  render(DEF);
  C.init({root:'roasCalc',compute:compute});
  $('roasForm').addEventListener('submit',function(e){e.preventDefault();compute();});
  $('add').addEventListener('click',function(){var l=read();if(l.length>=12)return;l.push({n:'Product '+String.fromCharCode(65+l.length),p:40,v:20,c:10,s:4,f:3,o:0,u:100});render(l);compute();});
  $('rows').addEventListener('click',function(e){var b=e.target.closest('[data-del]');if(!b)return;var l=read();if(l.length<=1)return;var idx=Array.prototype.indexOf.call(document.querySelectorAll('#rows [data-row]'),b.closest('[data-row]'));l.splice(idx,1);render(l);compute();});
  $('rst').addEventListener('click',function(){render(DEF);C.set('tm',10);compute();});
  $('csvBtn').addEventListener('click',function(){if(!csv)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='break-even-roas.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed')&&$('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  compute();
});
})();
