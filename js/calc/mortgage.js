/* Mortgage calculator — CalculatePilot (Stitch 1:1 redesign).
   Fixed 30/15-year or 5/1 ARM (one reset at month 61), PITI + HOA + PMI (drops at 78% of original
   value), optional extra monthly principal, annual/monthly amortization schedule. */
(function(){
var C=window.CPX,$=C.$,v=C.val;
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
var expanded=false,last=null;

function M(x,dp){dp=dp===undefined?0:dp;if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});}
function pmt(P,annual,n){var i=annual/100/12;if(P<=0||n<=0)return 0;if(!i)return P/n;var p=Math.pow(1+i,n);return P*i*p/(p-1);}

function inputs(){
  var price=Math.max(0,v('price')),mode=$('dpMode').value,pct=Math.min(100,Math.max(0,v('downPct'))),down=Math.max(0,v('down'));
  if(mode==='pct')down=price*pct/100;else pct=price>0?down/price*100:0;
  down=Math.min(down,price);
  var term=$('term').value;
  return {price:price,down:down,pct:pct,mode:mode,term:term,years:term==='15'?15:30,rate:Math.max(0,v('rate')),armRate:Math.max(0,v('armRate')),
    tax:Math.max(0,v('tax')),ins:Math.max(0,v('ins')),hoa:Math.max(0,v('hoa')),pmiRate:Math.max(0,v('pmiRate')),extra:Math.max(0,v('extra'))};
}

function amortize(o,termOverride){
  var years=termOverride||o.years,n=years*12,P=o.price-o.down,bal=P,rate=o.rate,pay=pmt(P,rate,n),arm=!termOverride&&o.term==='arm';
  var pmiOn=o.price>0&&P>o.price*0.8,pmiMo=P*o.pmiRate/100/12,esc=o.tax/12+o.ins/12+o.hoa;
  var months=[],interest=0,total=0,pmiTotal=0,d=new Date();d.setDate(1);
  for(var m=1;m<=n&&bal>0.005;m++){
    if(arm&&m===61){rate=o.armRate;pay=pmt(bal,rate,n-60);}
    var ip=bal*rate/100/12,pp=Math.min(bal,pay-ip+o.extra);if(pp<0)pp=0;
    var pm=pmiOn&&bal>o.price*0.78?pmiMo:0;
    bal-=pp;interest+=ip;pmiTotal+=pm;total+=ip+pp+esc+pm;
    var dt=new Date(d.getFullYear(),d.getMonth()+m,1);
    months.push({n:m,label:MON[dt.getMonth()]+' '+dt.getFullYear(),year:dt.getFullYear(),start:bal+pp,principal:pp,interest:ip,pmi:pm,end:Math.max(0,bal),rate:rate});
  }
  var yearsArr=[],cur=null;
  /* loan years (12-payment blocks), labelled with the calendar year the block starts in */
  months.forEach(function(r,k){if(k%12===0){cur={year:r.year,start:r.start,principal:0,interest:0,end:r.end};yearsArr.push(cur);}cur.principal+=r.principal;cur.interest+=r.interest;cur.end=r.end;});
  var lastM=months[months.length-1];
  return {P:P,pay:pmt(P,o.rate,n),months:months,years:yearsArr,interest:interest,total:total,pmiTotal:pmiTotal,pmiFirst:pmiOn?pmiMo:0,payoff:lastM?lastM.label:'—',count:months.length,armPay:arm&&months.length>60?pmt(months[59].end,o.armRate,n-60):null};
}

function table(o,a){
  var view=$('view').value,rows=view==='month'?a.months:a.years,limit=view==='month'?12:5,L=rows.length;
  if(view==='month'){
    $('amortHead').innerHTML='<th scope="col">Month</th><th scope="col">Starting Balance</th><th scope="col">Principal Paid</th><th scope="col">Interest Paid</th><th scope="col">Ending Loan Balance</th><th scope="col">Loan Equity</th>';
  }else{
    $('amortHead').innerHTML='<th scope="col">Year</th><th scope="col">Starting Principal</th><th scope="col">Principal Paid</th><th scope="col">Interest Paid</th><th scope="col">Ending Loan Balance</th><th scope="col">Loan Equity</th>';
  }
  $('amortBody').innerHTML=rows.map(function(r,k){var eq=o.price>0?(o.price-r.end)/o.price*100:0;
    return '<tr'+(!expanded&&k>=limit?' class="hid"':'')+'><td class="y">'+(view==='month'?r.label:r.year)+'</td><td class="mu">'+M(r.start,2)+'</td><td class="pp">'+M(r.principal,2)+'</td><td class="ip">'+M(r.interest,2)+'</td><td class="eb">'+M(r.end,2)+'</td><td class="eq">'+eq.toFixed(1)+'%</td></tr>';}).join('');
  var unit=view==='month'?'months':'years';
  C.text('amortNote',expanded?'Showing all '+L+' '+unit:'Showing '+unit+' 1 to '+Math.min(limit,L)+' of '+L);
  C.text('amortMoreTxt',expanded?'Collapse schedule':'Expand full '+(view==='month'?L+'-month':(Math.round(a.count/12))+'-year')+' amortized schedule');
  $('amortMore').parentNode.querySelector('button').style.display=L>limit?'':'none';
  $('amortMore').setAttribute('aria-expanded',String(expanded));
}

function compute(){
  var o=inputs();
  /* keep both down-payment fields in sync with whichever one drives */
  if(document.activeElement!==$('down'))$('down').value=Math.round(o.down);
  if(document.activeElement!==$('downPct'))$('downPct').value=Math.round(o.pct*10)/10;
  document.querySelectorAll('#dpChips button').forEach(function(b){b.setAttribute('aria-pressed',String(Math.abs(o.pct-parseFloat(b.getAttribute('data-dp')))<0.05));});
  $('armBox').hidden=o.term!=='arm';

  var a=amortize(o),i30=o.term==='15'?amortize(o,30).interest:a.interest,i15=amortize(o,15).interest;
  C.text('save15','Save '+M(Math.max(0,(o.term==='arm'?amortize(o,30).interest:i30)-i15))+' Interest');
  C.text('mRate','Monthly rate: '+(o.rate/12).toFixed(4).replace(/0+$/,'').replace(/\.$/,'')+'%');

  var pi=a.pay,tax=o.tax/12,ins=o.ins/12,other=o.hoa+a.pmiFirst,total=pi+tax+ins+other;
  C.text('resultValue',M(total));
  var t=total||1,segs=[[pi,'var(--sx-pc)','Principal & Interest'],[tax,'var(--sx-secondary)','Property Taxes'],[ins,'var(--sx-otc)','Insurance'],[other,'var(--sx-sfd)','HOA & PMI']];
  $('stackBar').innerHTML=segs.map(function(s){return '<span style="width:'+(s[0]/t*100)+'%;background:'+s[1]+'" title="'+s[2]+': '+M(s[0],2)+'"></span>';}).join('');
  C.text('piPct','Principal & Interest ('+Math.round(pi/t*100)+'%)');C.text('tiPct','Taxes & Insurance ('+Math.round((tax+ins+other)/t*100)+'%)');
  C.text('itPI',M(pi,2));C.text('itTax',M(tax,2));C.text('itIns',M(ins,2));C.text('itHoa',M(other,2));
  var rt=$('rateType');rt.innerHTML=o.term==='arm'?'<span class="msym" aria-hidden="true">sync_alt</span>Adjustable after 5 yrs':'<span class="msym" aria-hidden="true">lock</span>Fixed Escrow';

  var yrs=Math.round(a.count/12*10)/10;
  C.text('totLbl','Total '+(yrs%1?yrs:Math.round(yrs))+'-Yr Payments');C.text('totPay',M(a.total));C.text('totInt',M(a.interest));
  var pm=a.payoff.split(' ');C.text('payoff',a.count?FULL[MON.indexOf(pm[0])]+' '+pm[1]:'—');
  var ltv=o.price>0?(o.price-o.down)/o.price*100:0,le=$('ltv');le.textContent=ltv.toFixed(1)+'% '+(ltv<=80?'(Prime)':'(PMI required)');le.className='t '+(ltv<=80?'ok':'warn');

  var escrow=tax+ins+other;C.text('escrowMo',M(escrow)+' / month');
  C.text('taxPct','~'+(o.price>0?(o.tax/o.price*100).toFixed(2):'0')+'%');
  $('pmi').value=a.pmiFirst?Math.round(a.pmiFirst):0;var pn=$('pmiNote');
  if(a.pmiFirst){var off=null;for(var k=0;k<a.months.length;k++){if(a.months[k].pmi===0){off=a.months[k].label;break;}}pn.textContent=off?'Drops off '+off:'Est. /mo';pn.className='suf warn';}
  else{pn.textContent='Waived (20% Down)';pn.className='suf ok';}

  table(o,a);last={o:o,a:a};
}

document.addEventListener('DOMContentLoaded',function(){
  var root=$('mortCalc');
  /* editing a down-payment box makes it the driver */
  root.addEventListener('input',function(e){if(e.target.id==='down')$('dpMode').value='usd';else if(e.target.id==='downPct')$('dpMode').value='pct';},true);
  $('dpChips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;$('dpMode').value='pct';$('downPct').value=b.getAttribute('data-dp');$('downPct').dispatchEvent(new Event('input',{bubbles:true}));});
  $('escrowAcc').querySelector('button').addEventListener('click',function(){var acc=$('escrowAcc'),open=!acc.classList.contains('open');acc.classList.toggle('open',open);this.setAttribute('aria-expanded',String(open));});
  C.init({root:'mortCalc',compute:compute});
  $('amortMore').addEventListener('click',function(){expanded=!expanded;if(last)table(last.o,last.a);});
  $('view').addEventListener('input',function(){expanded=false;});
  $('csvBtn').addEventListener('click',function(){if(!last)return;var mo=$('view').value==='month';
    C.csv(mo?'mortgage-schedule-monthly.csv':'mortgage-schedule-annual.csv',[{h:mo?'Month':'Year',key:mo?'label':'year'},{h:'Starting Balance',key:'start'},{h:'Principal Paid',key:'principal'},{h:'Interest Paid',key:'interest'},{h:'Ending Balance',key:'end'}],mo?last.a.months:last.a.years);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpMortgage={amortize:amortize,pmt:pmt};
})();
