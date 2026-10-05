/* House flip calculator — CalculatePilot (Stitch 1:1 redesign).
   Costs = purchase + buyer closing + rehab + loan points + interest-only interest (loan = LTC × (purchase + rehab))
   + monthly carry × months + selling costs (broker % + transfer % of ARV + concessions). Profit = ARV − costs.
   Cash invested = (purchase + closing + rehab − loan) + points + interest + carry. MAO = 70% × ARV − rehab. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('en-US');}
function K(x){return (x<0?'−':'')+'$'+(Math.round(Math.abs(x)/100)/10)+'k';}
function pc(x,d){return isFinite(x)?x.toFixed(d===undefined?1:d)+'%':'—';}

function inputs(){var g=function(k){return Math.max(0,v(k));};
  return {arv:g('arv'),buy:g('buy'),bcc:g('bcc'),r:g('r1')+g('r2')+g('r3'),mo:Math.max(1,Math.round(v('mo'))),cash:$('fin').value==='cash',ltc:Math.min(100,g('ltc')),apr:g('apr'),pts:g('pts'),carry:g('c1')+g('c2')+g('c3')+g('c4'),s1:g('s1'),s2:g('s2'),s3:g('s3')};}

function calc(o,mo){
  mo=mo||o.mo;var close=o.buy*o.bcc/100,loan=o.cash?0:o.ltc/100*(o.buy+o.r),points=loan*o.pts/100,int=loan*o.apr/100/12*mo,carry=o.carry*mo,disp=o.arv*(o.s1+o.s2)/100+o.s3;
  var out=o.buy+close+o.r+points+int+carry+disp,profit=o.arv-out,cash=(o.buy+close+o.r-loan)+points+int+carry;
  return {close:close,loan:loan,points:points,int:int,carry:carry,disp:disp,out:out,profit:profit,cash:cash,roi:cash>0?profit/cash*100:0,mo:mo};
}

function compute(){
  var o=inputs(),r=calc(o),mao=o.arv*0.7-o.r;last={o:o,r:r};
  C.text('rehabTot',M(o.r));C.text('moOut',o.mo+' Months');C.text('carryMo',M(o.carry)+'/mo');C.text('dispTot',M(r.disp));
  $('finRow').hidden=o.cash;C.text('ltcN',M(r.loan)+' funded');C.text('ptsN',M(r.points)+' upfront fee');
  C.text('maoNote','70% MAO Benchmark: '+M(mao));C.text('pctArv',pc(o.arv?o.buy/o.arv*100:0)+' of ARV');
  var over=o.buy-mao,w=$('maoWarn');w.className='sx-hf-warn'+(over>0?'':' ok');C.text('maoTxt',over>0?'Purchase exceeds the 70% guideline by '+M(over):'Purchase is '+M(-over)+' under the 70% guideline');
  C.text('resultValue',M(r.profit));$('resultValue').style.color=r.profit<0?'var(--sx-err)':'var(--sx-primary)';
  var ann=r.roi*12/r.mo,a=$('annual');a.textContent=(ann>=0?'':'−')+pc(Math.abs(ann))+' Annualized ROI';a.className='sx-ef-grade'+(r.profit<0?' hi':'');
  $('profitNote').innerHTML='Based on a '+r.mo+'-month hold at '+K(o.arv)+' ARV. Yields <b style="color:var(--sx-on)">'+pc(r.roi)+' return</b> on cash invested.';
  C.text('cash',M(r.cash));C.text('outlay',M(r.out));C.text('spread',M(o.arv-o.buy));C.text('hold',M(r.int+r.carry+r.points));C.text('holdN','Debt '+K(r.int+r.points)+' + carry '+K(r.carry));
  C.text('parv',pc(o.arv?r.profit/o.arv*100:0,2));
  var rb=$('ruleBox');rb.className='sx-cu-alert'+(over>0?'':' ok');rb.querySelector('.msym').textContent=over>0?'warning':'check_circle';
  C.text('ruleTxt',over>0?'Attention: the purchase price ('+M(o.buy)+') exceeds the maximum allowable offer ('+M(mao)+') by '+M(over)+'. The deal needs tight execution to keep a healthy margin.':'The purchase price is within the 70% rule\'s maximum allowable offer of '+M(mao)+'.');
  $('maoMath').innerHTML='MAO = (ARV × 70%) − Rehab<br>MAO = ('+M(o.arv)+' × 0.70) − '+M(o.r)+' = <b>'+M(mao)+'</b>';
  var parts=[['Purchase + closing',o.buy+r.close,'var(--sx-tertiary)'],['Rehab outlay',o.r,'var(--sx-primary)'],['Resale fees',r.disp,'#f59e0b'],['Debt & carry',r.int+r.points+r.carry,'#3b82f6'],['Net cash margin',Math.max(0,r.profit),'#10b981']];
  C.text('wfTot','ARV: '+M(o.arv));$('wfBar').innerHTML=parts.map(function(p){return '<span style="width:'+(o.arv?p[1]/o.arv*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('wfList').innerHTML=parts.map(function(p,k){return '<li><span><i style="background:'+p[2]+'"></i>'+p[0]+'</span><b>'+(k===4&&r.profit<0?M(r.profit):K(p[1]))+' ('+pc(o.arv?(k===4?r.profit:p[1])/o.arv*100:0)+')</b></li>';}).join('');
  var rows=[['real_estate_agent','Acquisition (Purchase + Buyer Closing Costs)',o.buy+r.close,null],['handyman','Rehabilitation & Permitting',o.r,o.r/r.mo],['account_balance_wallet','Financing (Interest'+(r.points?' + Points':'')+', '+r.mo+'-Month Term)',r.int+r.points,r.int/r.mo],['home_work','Property Carrying Costs (Taxes, Insurance, Utilities)',r.carry,o.carry],['verified','Disposition (Commission, Transfer Taxes, Concessions)',r.disp,null]];
  last.rows=rows;
  $('tbl').innerHTML=rows.map(function(x){return '<tr><td style="font-family:inherit"><span style="display:inline-flex;align-items:center;gap:8px"><span class="msym" aria-hidden="true" style="font-size:16px;color:var(--sx-muted)">'+x[0]+'</span>'+x[1]+'</span></td><td>'+M(x[2])+'</td><td class="mu">'+(x[3]===null?'—':M(x[3])+'/mo')+'</td><td>'+pc(o.arv?x[2]/o.arv*100:0)+'</td></tr>';}).join('')+
    '<tr class="tg"><td style="font-family:inherit"><span style="display:inline-flex;align-items:center;gap:8px"><span class="msym" aria-hidden="true" style="font-size:16px">account_balance</span>Net Investor Profit (Pre-Tax)</span></td><td>—</td><td>—</td><td class="b" style="font-size:15px">'+M(r.profit)+' ('+pc(o.arv?r.profit/o.arv*100:0)+')</td></tr>';
  var d=calc(o,r.mo+3),loss=r.profit-d.profit;
  $('delay').innerHTML='<b>The 3-month extension impact:</b> stretching this flip from '+r.mo+' to '+(r.mo+3)+' months adds '+M(d.int-r.int)+' of interest and '+M(d.carry-r.carry)+' of carrying costs — '+M(loss)+(r.profit>0?' ('+pc(loss/r.profit*100)+' of projected profit)':'')+'.';
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'hfCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('house-flip-ledger.csv',[{h:'Category',key:'c'},{h:'Amount',key:'a'}],last.rows.map(function(x){return {c:x[1],a:Math.round(x[2])};}).concat([{c:'Net profit',a:Math.round(last.r.profit)}]));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpHouseFlip={calc:calc};
})();
