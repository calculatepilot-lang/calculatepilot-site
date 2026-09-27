/* Income tax calculator — CalculatePilot (Stitch 1:1 redesign). Tax year 2026 (IRS Rev. Proc. 2025-32).
   Taxable income = wages − 401(k) − HSA − Section 125 − (standard or itemized deduction); or entered directly.
   Federal tax by bracket. FICA (wages mode only): Social Security 6.2% up to $184,500, Medicare 1.45% + 0.9% above $200,000
   ($250,000 MFJ, $125,000 MFS), on wages less HSA/Section 125 payroll deductions. State = rate × (wages − pre-tax), an estimate. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var B={s1:[12400,50400,105700,201775,256225,640600],s2:[24800,100800,211400,403550,512450,768700],s3:[12400,50400,105700,201775,256225,384350],s4:[17700,67450,105700,201750,256200,640600]};
var R=[.10,.12,.22,.24,.32,.35,.37],SD={s1:16100,s2:32200,s3:16100,s4:24150},AMT={s1:200000,s2:250000,s3:125000,s4:200000},NM={s1:'Single',s2:'Married Filing Jointly',s3:'Married Filing Separately',s4:'Head of Household'};

function M(x,d){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('en-US',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}):'—';}
function P(x){return isFinite(x)?x.toFixed(2)+'%':'—';}
function fed(t,fs){var b=B[fs],lo=0,out=[],tax=0;for(var i=0;i<7;i++){var hi=i<6?b[i]:Infinity,s=Math.max(0,Math.min(t,hi)-lo);out.push({r:R[i],lo:lo,hi:hi,s:s,t:s*R[i]});tax+=s*R[i];lo=hi;}return {tax:tax,rows:out};}

function compute(){
  var fs=$('filingStatus').value,gm=$('mode').value==='s1',inc=Math.max(0,v('taxableIncome'));
  $('grossBox').style.display=gm?'flex':'none';C.text('incL',gm?'Gross Annual Wages':'Taxable Income');C.text('incN',gm?'Salary & bonuses (W-2)':'After deductions');
  var k=gm?Math.max(0,v('k401')):0,h=gm?Math.max(0,v('hsa')):0,s=gm?Math.max(0,v('s125')):0,pre=Math.min(inc,k+h+s);
  var itm=$('ded').value==='s2',sd=SD[fs],dd=itm?Math.max(0,v('itm')):sd;
  $('itRow').hidden=!itm;C.text('sdL','Standard Deduction ('+M(sd)+')');C.text('sdN','2026 amount for '+NM[fs].toLowerCase());
  var stv=$('st').value,stc=stv==='c';$('stRow').hidden=!stc;var sr=stc?Math.max(0,v('stR')):+stv;
  var agi=gm?inc-pre:inc,ti=gm?Math.max(0,agi-dd):inc,F=fed(ti,fs),ft=F.tax;
  var fw=gm?Math.max(0,inc-h-s):0,ss=Math.min(fw,184500)*.062,med=fw*.0145+Math.max(0,fw-AMT[fs])*.009,fica=ss+med,sttx=gm?Math.max(0,agi)*sr/100:0;
  var tot=ft+fica+sttx,base=gm?inc:inc,top=F.rows.filter(function(r){return r.s>0;}).pop();
  C.text('statT','2026 · '+NM[fs]);C.text('totL',gm?'Total Estimated Tax (Federal + FICA + State)':'Federal Income Tax on Taxable Income');
  C.text('totTax',M(gm?tot:ft));C.text('outEffective',P(base?(gm?tot:ft)/base*100:0));C.text('resultValue',M(ft));C.text('outBracket',top?Math.round(top.r*100)+'%':'0%');
  C.text('fed',M(ft));C.text('fedN','Marginal '+(top?Math.round(top.r*100):0)+'% · '+P(base?ft/base*100:0)+' eff.');
  $('ficaC').style.display=gm?'':'none';$('stC').style.display=gm?'':'none';$('netC').style.display=gm?'':'none';$('shC').style.display=gm?'':'none';$('t3').className='sx-in-t4 '+(gm?'c3':'c1');
  C.text('fica',M(fica));C.text('ficaN','SS '+M(ss)+' + Medicare '+M(med));C.text('stt',M(sttx));C.text('sttN',sr?P(sr)+' of '+M(agi)+(stc?' (your rate)':''):'No state income tax');
  var net=inc-pre-tot;C.text('net',M(net)+' / yr');C.text('netN',M(net/12)+' / month · '+P(inc?net/inc*100:0)+' of gross');
  var parts=[['Take-home',net,'var(--sx-primary)'],['Pre-tax savings',pre,'#34d399'],['Federal',ft,'#f59e0b'],['FICA',fica,'#3b82f6'],['State',sttx,'#ef4444']].filter(function(p){return p[1]>0;});
  $('alBar').innerHTML=parts.map(function(p){return '<span style="width:'+(inc?p[1]/inc*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('alLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' '+(inc?(p[1]/inc*100).toFixed(1):'0.0')+'%</span>';}).join('');
  C.text('shT','Total shield: '+M(pre));
  var noPre=fed(Math.max(0,inc-dd),fs).tax,ficaNo=Math.min(inc,184500)*.062+inc*.0145+Math.max(0,inc-AMT[fs])*.009,stNo=inc*sr/100,saved=(noPre-ft)+(ficaNo-fica)+(stNo-sttx);
  C.text('shTxt',pre?'Your '+M(pre)+' of pre-tax contributions cut this year\'s tax by about '+M(saved)+' (federal '+M(noPre-ft)+', FICA '+M(ficaNo-fica)+', state '+M(stNo-sttx)+') — an immediate '+Math.round(saved/pre*100)+'% return on those dollars.':'No pre-tax contributions entered.');
  var lim=[];if(k>24500)lim.push('401(k) above the $24,500 limit (catch-up allowed at 50+)');if(h>8750)lim.push('HSA above the $8,750 family limit');C.text('limN',lim.length?'Check: '+lim.join('; ')+'.':'2026 limits: 401(k) $24,500 (under 50); HSA $4,400 self-only / $8,750 family.');
  C.text('brT','2026 '+NM[fs]);C.text('brN',gm?'Taxable income '+M(ti)+' = '+M(inc)+' wages − '+M(pre)+' pre-tax − '+M(dd)+' '+(itm?'itemized':'standard')+' deduction.':'Taxable income of '+M(ti)+' across each 2026 rate tier.');
  var cum=0;last={rows:F.rows,ti:ti};
  $('tbl').innerHTML=F.rows.map(function(r){cum+=r.t;var act=top&&r===top;return '<tr'+(act?' class="pb"':'')+'><td style="font-family:inherit;font-weight:600">'+Math.round(r.r*100)+'%'+(act?' <small class="p">(marginal)</small>':'')+'</td><td>'+(r.hi===Infinity?'Over '+M(r.lo):M(r.lo)+' — '+M(r.hi))+'</td><td>'+M(r.s)+'</td><td>'+M(r.t,2)+'</td><td>'+(r.s>0?M(cum,2):'—')+'</td></tr>';}).join('');
  var t2=top?top.r:0;C.text('myth','At your income, the next $1,000 of taxable income adds '+M(t2*1000)+' of federal tax, while your federal effective rate stays at '+P(ti?ft/ti*100:0)+' of taxable income.');
  C.text('atl','Each $1,000 contributed pre-tax saves about '+M(1000*(t2+sr/100))+' of income tax at your '+Math.round(t2*100)+'% federal'+(sr?' + '+(+sr)+'% state':'')+' marginal rate.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'txCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('federal-tax-2026.csv',[{h:'Rate',key:'r'},{h:'From',key:'lo'},{h:'To',key:'hi'},{h:'Income in bracket',key:'s'},{h:'Tax',key:'t'}],last.rows.map(function(x){return {r:Math.round(x.r*100)+'%',lo:x.lo,hi:x.hi===Infinity?'':x.hi,s:Math.round(x.s),t:x.t.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpTax={fed:fed};
})();
