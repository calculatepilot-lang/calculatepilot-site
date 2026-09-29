/* Moving cost estimator — CalculatePilot (Stitch redesign). Planning estimate from editable assumptions, not a quote.
   Full service = (lb/100) × (handling + rate × miles/100) × season + extras + coverage.
   Container = ceil(cu ft ÷ size) × (fixed + per mile × miles) × season + extras that apply to a self-load (crating, heavy item).
   DIY truck = base + per mile × miles + miles ÷ mpg × fuel + lodging × nights + tolls + helpers. Volume = lb ÷ 7. */
(function(){
var C=window.CPX,$=C.$,last='',csv='';
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oFs','oPod','oDiy','oVol'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the estimate.');$('cmp').innerHTML='';last='';}
function row(l,s,v,b,hi){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--sx-border);font-size:'+(b?'15':'13')+'px"><span style="color:var(--sx-onv)">'+l+(s?'<small style="display:block;color:var(--sx-muted);font-size:11px">'+s+'</small>':'')+'</span><b style="font-family:var(--font-mono);color:'+(hi?'var(--sx-primary)':'var(--sx-on)')+';white-space:nowrap">'+v+'</b></div>';}
function sizes(){var S=[['Studio or 1 bed',3000],['2 bedroom',5000],['3 bedroom',7500],['4+ bedroom',11000]],cap=C.val('a5')||700,h='';S.forEach(function(s){var cf=s[1]/7,n=Math.ceil(cf/cap-1e-9);h+='<tr><td class="a">'+s[0]+'</td><td class="n">'+C.num(s[1],0)+' lb</td><td class="n">'+C.num(cf,0)+' cu ft</td><td class="a">'+n+' container'+(n>1?'s':'')+' of '+C.num(cap,0)+' cu ft</td></tr>';});$('szT').querySelector('tbody').innerHTML=h;}
function compute(){
  var mi=C.val('mi'),lb=C.val('wt'),ss=C.val('ss');
  C.text('miV',C.num(mi,0)+' miles');$('covBox').hidden=$('cov').value==='0';
  $('err').hidden=true;
  if(!(lb>0))return fail('Enter the weight of your belongings.');
  var cf=lb/7,extras=[['k1','p1','Full packing'],['k2','p2','Crating'],['k3','p3','Heavy item'],['k4','p4','Stairs or long carry']],ex=0,exSelf=0,list=[];
  extras.forEach(function(e,i){if($(e[0]).checked){var v=C.val(e[1]);ex+=v;list.push(e[2]);if(i>=1)exSelf+=v;}});
  var fvp=$('cov').value==='0'?0:C.val('fvp');
  C.text('cf',C.num(cf,0)+' cu ft');C.text('oVol',C.num(cf,0)+' cu ft');
  var fs=(lb/100)*(C.val('a1')+C.val('a2')*mi/100)*ss+ex+fvp;
  var n=Math.max(1,Math.ceil(cf/Math.max(1,C.val('a5'))-1e-9)),pod=n*(C.val('a3')+C.val('a4')*mi)*ss+exSelf;
  var nights=Math.max(0,Math.ceil(mi/550)-1),fuel=mi/Math.max(1,C.val('a8'))*C.val('a9'),truck=C.val('a6')+C.val('a7')*mi,lodg=nights*C.val('b1'),toll=C.val('b2')*mi,help=C.val('b3'),diy=(truck+fuel+lodg+toll+help)*(ss>1?1.05:1)+exSelf;
  var opts=[['Full-service movers',fs,'loading, transport, unloading'+(list.length?' + '+list.join(', ').toLowerCase():'')+(fvp?' + full value protection':'')],['Moving container',pod,n+' container'+(n>1?'s':'')+'; you pack and load'],['DIY rental truck',diy,'truck '+C.money(truck,0)+', fuel '+C.money(fuel,0)+', lodging '+C.money(lodg,0)+', tolls '+C.money(toll,0)+', helpers '+C.money(help,0)]];
  var best=opts.reduce(function(a,b){return b[1]<a[1]?b:a;});
  C.text('resultValue',C.money(best[1],0));C.text('tag',best[0]);
  C.text('interp',C.num(mi,0)+' miles, '+C.num(lb,0)+' lb ('+C.num(cf,0)+' cu ft) from '+($('from').value||'origin')+' to '+($('to').value||'destination')+'.');
  C.text('oFs',C.money(fs,0));C.text('oPod',C.money(pod,0));C.text('oDiy',C.money(diy,0));
  $('cmp').innerHTML=opts.map(function(o,i){return row(o[0],o[2],C.money(o[1],0),false,o===best);}).join('').replace('border-top:1px solid var(--sx-border)','border-top:0');
  C.text('cmpN','planning estimate');
  C.text('rec',best[0]+' is the cheapest on these assumptions'+(best!==opts[0]?', about '+C.money(fs-best[1],0)+' less than full-service movers':'')+'. Movers charge for weight and distance, so trimming '+C.num(lb*0.1,0)+' lb (10%) would cut a full-service quote by about '+C.money(fs*0.1,0)+'. Get written estimates before you book.');
  csv='Option,Estimate\n'+opts.map(function(o){return o[0]+','+o[1].toFixed(2);}).join('\n');
  last='Moving cost — calculatepilot-site/other/moving-cost-calculator\n'.replace('calculatepilot-site/other/moving-cost-calculator','calculatepilot.com/other/moving-cost-estimator.html')+C.num(mi,0)+' mi, '+C.num(lb,0)+' lb\n'+opts.map(function(o){return o[0]+': '+C.money(o[1],0);}).join('\n');
  sizes();
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  C.init({root:'mvCalc',compute:compute});
  $('tier').addEventListener('input',function(){C.set('wt',$('tier').value);$('wt').dispatchEvent(new Event('input',{bubbles:true}));});
  $('csvBtn').addEventListener('click',function(){if(!csv)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='moving-cost.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
