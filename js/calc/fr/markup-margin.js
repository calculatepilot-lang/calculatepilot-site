/* Break-even & markup/margin — CalculatePilot (Stitch redesign). Shared by break-even and markup-margin pages.
   Break-even units = ceil(fixed ÷ (price − variable)); target units = ceil((fixed + target) ÷ contribution);
   margin of safety = (target units − break-even units) ÷ target units; DOL = contribution ÷ operating income at target volume.
   markup = margin ÷ (1 − margin); margin = markup ÷ (1 + markup); price = cost ÷ (1 − margin) = cost × (1 + markup). */
(function(){
var C=window.CPX,$=C.$,last='',last2='',csv='';
var PRE={saas:[20000,6,49,10000],ecom:[8000,24,60,4000],agency:[35000,45,120,10000],food:[15000,7.5,18,5000]};
function n0(x){return C.num(x,0);}
function bu(fc,cm){return cm>0?Math.ceil(fc/cm-1e-9):Infinity;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','beR','cmU','cmR','mos','tU','tR','dol'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Corrigez la saisie ci-dessus pour voir le résultat.');$('proof').textContent='—';last='';}
function cvp(){
  var fc=C.val('fc'),vc=C.val('vc'),pr=C.val('pr'),tp=C.val('tp'),cm=pr-vc;
  $('err').hidden=true;
  if(!(pr>0))return fail('Saisissez un prix de vente supérieur à zéro.');
  if(cm<=0)return fail('Le prix n’est pas supérieur au coût variable : chaque vente fait perdre de l’argent et vous ne pourrez jamais atteindre le seuil de rentabilité.');
  var be=bu(fc,cm),tu=bu(fc+tp,cm),cr=cm/pr,mos=tu>0?(tu-be)/tu:0,bR=be*pr,tR=tu*pr;
  C.text('resultValue',n0(be));C.text('tag',C.money(bR,0)+' revenue');
  C.text('interp','Chaque unité contribue à hauteur de '+C.money(cm,2)+' aux coûts fixes de '+C.money(fc,0)+', il vous faut donc '+n0(be)+' unités par mois pour les couvrir.');
  C.text('beR',C.money(bR,0));C.text('cmU',C.money(cm,2));C.text('cmR',C.num(cr*100,2)+'%');C.text('mos',tp>0?C.num(mos*100,1)+'%':'—');
  C.text('tpN',tp>0?C.money(tp,0)+' par mois':'définir un bénéfice cible');C.text('tU',tp>0?n0(tu):n0(be));C.text('tUd',tp>0?'+'+n0(tu-be)+' au-dessus du seuil de rentabilité':'identique au seuil de rentabilité');C.text('tR',C.money(tp>0?tR:bR,0));
  var op=tu*cm-fc;C.text('dol',tp>0&&op>0?C.num(tu*cm/op,2)+'×':'n/a');
  $('proof').textContent=C.num(fc,2)+' ÷ ('+C.num(pr,2)+' − '+C.num(vc,2)+') = '+C.num(fc,2)+' ÷ '+C.num(cm,2)+' = '+C.num(fc/cm,2)+' → '+n0(be)+' units';
  var fs=bR>0?fc/bR*100:0;$('bF').style.width=fs+'%';$('bV').style.width=(100-fs)+'%';C.text('lF','Fixes '+C.num(fs,1)+'%');C.text('lV','Variable '+C.num(100-fs,1)+'%');
  C.text('ins','Avec une marge sur coûts variables de '+C.num(cr*100,2)+'%, chaque '+C.money(1000,0)+' de ventes supplémentaire rapporte environ '+C.money(1000*cr,2)+' de bénéfice une fois dépassées '+n0(be)+' unités.');
  var top=Math.max(be*2,10),step=top/10,vals=[[],[]],lab=[],rows=['Units,Revenue,Total cost,Profit'];
  for(var i=0;i<=10;i++){var q=Math.round(step*i);vals[0].push(q*pr);vals[1].push(fc+q*vc);lab.push(n0(q));rows.push([q,(q*pr).toFixed(2),(fc+q*vc).toFixed(2),(q*pr-fc-q*vc).toFixed(2)].join(','));}
  C.chart($('chart'),{series:[{name:'Chiffre d’affaires',values:vals[0],color:'#0f5b44'},{name:'Coût total',values:vals[1],color:'#d97706',dash:true}],labels:lab,label:'Chiffre d’affaires et coût total selon les unités vendues',tipFmt:function(x){return C.money(x,0);}});
  csv=rows.join('\n');
  var h='';[-10,-5,0,5,10].forEach(function(p){var pp=pr*(1+p/100),vv=vc*(1+p/100);h+='<tr'+(p===0?' style="background:var(--sx-low)"':'')+'><td class="a"><b>'+(p>0?'+':p<0?'−':'')+Math.abs(p)+'%</b></td><td class="n">'+C.money(pp,2)+'</td><td class="n">'+(pp>vc?n0(bu(fc,pp-vc)):'never')+'</td><td class="n">'+C.money(vv,2)+'</td><td class="n">'+(pr>vv?n0(bu(fc,pr-vv)):'never')+'</td></tr>';});
  $('sens').querySelector('tbody').innerHTML=h;
  last='Seuil de rentabilité — calculatepilot.com/other/break-even-calculator.html\nFixes '+C.money(fc,0)+', variables '+C.money(vc,2)+', prix '+C.money(pr,2)+'\nBreak-even '+n0(be)+' unités ('+C.money(bR,0)+')'+(tp>0?' ; pour '+C.money(tp,0)+' profit '+n0(tu)+' unités ('+C.money(tR,0)+')':'');
}
function mm(){
  var mode=$('mk').value;
  $('gCost').hidden=mode==='pm';$('gPrice').hidden=!(mode==='cp'||mode==='pm');$('gMargin').hidden=!(mode==='cm'||mode==='pm');$('gMarkup').hidden=mode!=='cu';
  $('err2').hidden=true;
  var c=C.val('mc'),p=C.val('mpr'),m=C.val('mg')/100,u=C.val('mu')/100,cost,price;
  function bad(msg){$('err2').hidden=false;C.text('err2T',msg);['mPrice','mProfit','mCost','mMarkup','mMargin'].forEach(function(i){C.text(i,'—');});C.text('mtag','—');C.text('mInterp','Corrigez la saisie ci-dessus.');last2='';}
  if(mode==='cm'){if(!(m>=0&&m<1))return bad('La marge doit être inférieure à 100 %.');cost=c;price=c/(1-m);}
  else if(mode==='cu'){cost=c;price=c*(1+u);}
  else if(mode==='cp'){cost=c;price=p;}
  else{if(!(m>=0&&m<1))return bad('La marge doit être inférieure à 100 %.');price=p;cost=p*(1-m);}
  if(!(price>0)||!(cost>=0))return bad('Saisissez des valeurs positives.');
  var pf=price-cost,mk=cost>0?pf/cost:NaN,mg=pf/price;
  C.text('mPrice',C.money(price,2));C.text('mtag',C.num(mg*100,1)+'% de marge');C.text('mProfit',C.money(pf,2));C.text('mCost',C.money(cost,2));C.text('mMarkup',isFinite(mk)?C.num(mk*100,2)+'%':'n/a');C.text('mMargin',C.num(mg*100,2)+'%');
  C.text('mInterp',isFinite(mk)?'A '+C.num(mg*100,2)+'% de marge correspond à un '+C.num(mk*100,2)+'% de majoration. Vendre à '+C.money(price,2)+' pour un coût de '+C.money(cost,2)+' earns '+C.money(pf,2)+'.':'Le coût est nul : la majoration est donc indéfinie.');
  var h='';[10,20,25,100/3,40,50,60,75].forEach(function(g){var k=g/(100-g);h+='<tr'+(Math.abs(g-C.val('mg'))<0.05?' style="background:var(--sx-low)"':'')+'><td class="a"><b>'+C.num(g,1).replace(/[.,]0$/,'')+'%</b></td><td class="n">'+C.num(k*100,2)+'%</td><td class="n">'+C.money(50*(1+k),2)+'</td><td class="n">'+C.money(100*(1+k),2)+'</td><td class="n">'+C.money(100*k,2)+'</td></tr>';});
  $('mmT').querySelector('tbody').innerHTML=h;
  last2='Majoration et marge — calculatepilot.com/other/markup-margin-calculator.html\nCoût '+C.money(cost,2)+', prix '+C.money(price,2)+', bénéfice '+C.money(pf,2)+'\nMarkup '+(isFinite(mk)?C.num(mk*100,2)+'%':'n/a')+', marge '+C.num(mg*100,2)+'%';
}
function compute(){cvp();mm();}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'beCalc',compute:compute});
  ['cvpForm','mmForm'].forEach(function(id){$(id).addEventListener('submit',function(e){e.preventDefault();});});
  $('bpre').addEventListener('click',function(e){var b=e.target.closest('button[data-p]');if(!b)return;var v=PRE[b.getAttribute('data-p')];C.set('fc',v[0]);C.set('vc',v[1]);C.set('pr',v[2]);C.set('tp',v[3]);$('fc').dispatchEvent(new Event('input',{bubbles:true}));});
  $('csvBtn').addEventListener('click',function(){if(!csv)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='break-even.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyBtn2').addEventListener('click',function(){if(last2)copy(last2,'copyTxt2','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
});
})();
