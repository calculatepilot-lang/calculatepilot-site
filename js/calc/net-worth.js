/* Net worth calculator — CalculatePilot (redesign).
   Net worth = assets − liabilities; debt-to-asset = liabilities ÷ assets; liquid = cash + investments.
   Fed SCF 2022 (Federal Reserve Bulletin Oct 2023, Table 2, thousands of 2022 $) median/mean by age of reference person.
   Stanley & Danko expected net worth = age × income ÷ 10 (PAW ≥ 2×, UAW ≤ 0.5×). */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var SCF=[['Less than 35',0,34,39.0,183.5],['35–44',35,44,135.6,549.6],['45–54',45,54,247.2,975.8],['55–64',55,64,364.5,1566.9],['65–74',65,74,409.9,1794.6],['75 or more',75,200,335.6,1624.1]];
function $0(x){return (x<0?'−$':'$')+Math.round(Math.abs(x)).toLocaleString('en-US');}

function compute(){
  var A=['cash','inv','ret','home','veh','oth'].reduce(function(a,id){return a+Math.max(0,v(id));},0);
  var L=['mort','auto','stu','cc','od'].reduce(function(a,id){return a+Math.max(0,v(id));},0);
  var nw=A-L,age=v('age'),inc=v('inc'),liq=Math.max(0,v('cash'))+Math.max(0,v('inv'));
  C.text('resultValue',$0(nw));var t=$('tag');t.textContent=nw>=0?'Positive':'Negative';t.className='sx-ef-grade'+(nw<0?' hi':'');
  C.text('rN',$0(A)+' in assets − '+$0(L)+' in liabilities.');
  C.text('ta',$0(A));C.text('tl',$0(L));C.text('dar',A>0?Math.round(L/A*100)+'%':(L>0?'No assets':'—'));C.text('liq',$0(liq));
  var g=null;if(age>0)SCF.forEach(function(s){if(age>=s[1]&&age<=s[2])g=s;});
  if(g){C.text('agT','Age '+g[0]);C.text('med',$0(g[3]*1000));C.text('mean',$0(g[4]*1000));var d=nw-g[3]*1000;C.text('vs',$0(Math.abs(d))+(d>=0?' above':' below'));}
  else{C.text('agT','Enter your age');['med','mean','vs'].forEach(function(id){C.text(id,'—');});}
  var sb=$('stBox');
  if(inc>0&&age>0){var ex=age*inc/10,ratio=nw/ex,cls=ratio>=2?'Prodigious accumulator (2× or more)':ratio<=0.5?'Under accumulator (half or less)':'Average accumulator';sb.className='gain'+(ratio<=0.5?' neg':'');C.text('stL','Expected net worth '+$0(ex)+' (age × income ÷ 10) — you: '+cls);C.text('stV',String(Math.round(ratio*100)/100).replace('-','−')+'×');}
  else{sb.className='gain neg';C.text('stL','Add household income for the expected net worth rule of thumb');C.text('stV','—');}
  $('scfTbl').innerHTML=SCF.map(function(s){return '<tr'+(g===s?' class="hl"':'')+'><td style="font-family:inherit;font-weight:600">'+s[0]+'</td><td class="b">'+$0(s[3]*1000)+'</td><td>'+$0(s[4]*1000)+'</td></tr>';}).join('')+'<tr><td style="font-family:inherit;font-weight:600">All families</td><td class="b">$192,900</td><td>$1,063,700</td></tr>';
  last='Net worth: '+$0(nw)+' (assets '+$0(A)+', liabilities '+$0(L)+')\n— calculatepilot.com/financial/net-worth-calculator.html';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'nwCalc',compute:compute});
  $('copyBtn').addEventListener('click',function(){if(!last||!navigator.clipboard)return;navigator.clipboard.writeText(last).then(function(){C.text('copyTxt','Copied');setTimeout(function(){C.text('copyTxt','Copy Result');},1800);},function(){});});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
