/* Tip & split bill calculator — CalculatePilot (Stitch redesign).
   Works in integer cents: tax = round(subtotal × rate), tip = round(basis × tip%), total = subtotal + tax + tip.
   Split: each diner gets floor(total × weight / Σweights) cents, leftover cents go one each to the largest remainders
   (ties to the first diner), so shares always sum to the total. */
(function(){
var C=window.CPX,$=C.$,last='';

function cents(x){return Math.round(x*100+1e-9);}
function m(c){return C.money(c/100,2);}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','tTip','tTot','tTpp','tBpp','taxAmt'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the split.');$('ledger').innerHTML='';last='';}

function weights(n,mode){
  var w=[],i;
  if(mode==='wt'){var p=String($('wts').value).split(/[\s,;]+/).filter(function(s){return s!=='';});for(i=0;i<n;i++){var x=parseFloat(p[i]);w.push(isFinite(x)&&x>=0?x:1);}}
  else for(i=0;i<n;i++)w.push(1);
  return w;
}
/* largest-remainder split of `total` cents by weights (exact integer arithmetic on scaled weights) */
function split(total,w){
  var S=1000,ws=w.map(function(x){return Math.round(x*S);}),sum=ws.reduce(function(a,b){return a+b;},0);
  if(sum===0){ws=ws.map(function(){return 1;});sum=ws.length;}
  var out=[],rem=[],given=0;
  ws.forEach(function(x,i){var q=Math.floor(total*x/sum);out.push(q);rem.push({i:i,r:total*x-q*sum});given+=q;});
  var left=total-given;
  rem.sort(function(a,b){return b.r-a.r||a.i-b.i;});
  for(var k=0;k<left;k++)out[rem[k%rem.length].i]++;
  return out;
}

function compute(){
  var bill=cents(Math.max(0,C.val('bill'))),n=Math.max(1,Math.min(100,Math.round(C.val('n'))||1)),
      custom=$('tipC').value!=='',tipPct=custom?Math.max(0,Math.min(100,C.val('tipC'))):C.val('tip'),
      taxRate=Math.max(0,C.val('tax')),pre=$('pre').checked,rnd=$('rnd').value,mode=$('mode').value;
  $('wtRow').hidden=mode!=='wt';
  C.text('tipBadge',(custom?'custom ':'')+C.num(tipPct,2).replace(/\.?0+$/,'')+'% selected');
  $('err').hidden=true;
  if($('bill').value==='')return fail('Enter the bill subtotal.');
  if(C.val('n')<1||C.val('n')>100)return fail('Number of diners must be between 1 and 100.');
  var tax=Math.round(bill*taxRate/100+1e-9),basis=pre?bill:bill+tax,tip=Math.round(basis*tipPct/100+1e-9);
  C.text('taxAmt',m(tax));
  if(rnd==='tip'){tip=Math.round(tip/100)*100;}
  var total=bill+tax+tip;
  if(rnd==='total'){var rt=Math.round(total/100)*100;tip=Math.max(0,rt-bill-tax);total=bill+tax+tip;}
  var w=weights(n,mode),shares=split(total,w),tipShares=split(tip,w),base=shares.map(function(s,i){return s-tipShares[i];});
  var lo=Math.min.apply(null,shares),hi=Math.max.apply(null,shares);
  var eq=lo===hi,unevenCents=!eq&&mode==='eq';
  C.text('heroLbl',mode==='wt'?'Average per person':'Each person pays');
  C.text('resultValue',m(mode==='wt'?Math.round(total/n):hi));
  C.text('tag',mode==='wt'?'Custom ratio':unevenCents?'Cents shared out':'Equal split');
  C.text('tipK','Total tip ('+(custom?C.num(tipPct,2).replace(/\.?0+$/,''):tipPct)+'%)');
  C.text('tTip',m(tip));C.text('tTot',m(total));C.text('tTpp',m(Math.round(tip/n)));C.text('tBpp',m(Math.round((bill+tax)/n)));
  var effective=bill>0?(tip/bill*100):0;
  C.text('interp',(mode==='wt'?'Split '+n+' ways by weight. ':unevenCents?'The total does not divide evenly, so '+(total%n)+' diner'+(total%n>1?'s pay':' pays')+' one cent more. ':'Split evenly between '+n+' diner'+(n>1?'s':'')+'. ')+'The tip is '+effective.toFixed(1)+'% of the pre-tax subtotal.');
  var h='';
  shares.forEach(function(s,i){h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+'"><span style="display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:var(--sx-on)"><span style="width:20px;height:20px;border-radius:50%;background:var(--sx-sch);display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">'+(i+1)+'</span>Person '+(i+1)+(mode==='wt'?' <small style="color:var(--sx-muted);font-weight:400">× '+C.esc(String(w[i]))+'</small>':'')+'</span><b style="font-family:var(--font-mono);font-size:13px;color:var(--sx-on)">'+m(s)+'</b></div>';});
  $('ledger').innerHTML=h;
  var sum=shares.reduce(function(a,b){return a+b;},0);
  last='Tip & split bill — calculatepilot.com/other/tip-calculator.html\nSubtotal '+m(bill)+' + tax '+m(tax)+' + tip '+m(tip)+' = '+m(total)+'\n'+shares.map(function(s,i){return 'Person '+(i+1)+': '+m(s);}).join('\n')+'\nShares sum: '+m(sum);
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'tipCalc',compute:compute});
  C.text('curSym',C.symbol());
  $('tipPills').addEventListener('click',function(e){if(e.target.closest('button'))$('tipC').value='';});
  $('tipC').addEventListener('input',function(){if(this.value!=='')$('tip').value='';});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
