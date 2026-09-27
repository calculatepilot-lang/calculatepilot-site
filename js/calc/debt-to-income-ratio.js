/* Debt-to-income calculator — CalculatePilot (Stitch 1:1 redesign).
   Front-end DTI = housing (P&I + tax + insurance + HOA/PMI) ÷ gross monthly income.
   Back-end DTI = (housing + all recurring debt payments) ÷ gross monthly income, compared with program guidelines. */
(function(){
var C=window.CPX,$=C.$,v=C.val,mode='month',last=null;
var P={conv:{n:'Conventional',f:28,b:36,x:50},fha:{n:'FHA',f:31,b:43,x:50},va:{n:'VA',f:null,b:41,x:50},jumbo:{n:'Jumbo',f:null,b:43,x:43}};
var DEBTS=[['auto','auto loan'],['stu','student loan'],['cc','credit card'],['oth','personal loan'],['cs','child support / alimony']];

function M(x){if(!isFinite(x))return '—';return (x<0?'−$':'$')+Math.abs(Math.round(x)).toLocaleString('en-US');}
function pc(x){return isFinite(x)?x.toFixed(1)+'%':'—';}

function scale(id,val,max,cuts,labels){
  var segs=[[0,cuts[0],'var(--sx-primary)'],[cuts[0],cuts[1],'#f5b53f'],[cuts[1],max,'#e2556b']];
  $(id+'T').innerHTML=segs.map(function(s){return '<span style="width:'+((s[1]-s[0])/max*100)+'%;background:'+s[2]+'"></span>';}).join('');
  $(id+'M').style.left=Math.min(100,Math.max(0,val/max*100))+'%';
  $(id+'L').innerHTML=labels.map(function(l){return '<span class="'+(l[2]||'')+'" style="left:'+(l[0]/max*100)+'%">'+l[1]+'</span>';}).join('');
}

function compute(){
  var inc=Math.max(0,v('inc')),g=$('mode').value==='year'?inc/12:inc,pr=P[$('prog').value];
  var house=['pi','ptax','hins','hoa'].reduce(function(s,k){return s+Math.max(0,v(k));},0),debts=DEBTS.map(function(d){return [d[1],Math.max(0,v(d[0]))];}),dsum=debts.reduce(function(s,d){return s+d[1];},0);
  var fe=g>0?house/g*100:0,be=g>0?(house+dsum)/g*100:0;last={g:g,house:house,dsum:dsum,fe:fe,be:be};
  C.text('yrBtn','Annual ('+M(g*12/1000).replace('$','$')+'k)');C.text('incAlt',$('mode').value==='year'?M(g)+' / month':M(g*12)+' / year');
  C.text('hTot',M(house)+' / mo');C.text('dTot',M(dsum)+' / mo');

  var feOK=pr.f===null||fe<=pr.f+1e-9,beOK=be<=pr.b+1e-9,ext=be<=pr.x+1e-9,gr=$('grade'),pl=$('pill');
  if(feOK&&beOK){C.text('resultValue','Approval Grade: Within '+pr.n+' Guidelines');C.text('gradeTxt','Both ratios sit inside the standard '+pr.n+' limits'+(pr.f?' ('+pr.f+'% / '+pr.b+'%)':' ('+pr.b+'% back-end)')+'. Lenders also weigh credit score, reserves and employment.');gr.className='sx-dt-grade';pl.textContent='Guideline Ready';pl.className='sx-ef-grade';}
  else if(ext){C.text('resultValue','Approval Grade: Possible With Compensating Factors');C.text('gradeTxt','Above the standard '+pr.n+' guideline, but within the range that automated underwriting may approve with strong credit, cash reserves or residual income.');gr.className='sx-dt-grade mid';pl.textContent='Needs Strong Profile';pl.className='sx-ef-grade mid';}
  else{C.text('resultValue','Approval Grade: Above Typical '+pr.n+' Limits');C.text('gradeTxt','Your back-end ratio is above what most '+pr.n+' programs accept. Lowering monthly debt or adding income would improve approval odds.');gr.className='sx-dt-grade hi';pl.textContent='High DTI';pl.className='sx-ef-grade hi';}

  var fc=fe<=28?'':fe<=(pr.f||36)?'mid':'hi',bc=be<=36?'':be<=43?'mid':'hi';
  C.text('fe',pc(fe));$('fe').className=fc;$('feDot').className=fc;
  $('feS').innerHTML='<span class="msym" aria-hidden="true">'+(fc?'info':'shield')+'</span>'+(fe<=28?'Safe zone (≤28%)':pr.f===null?'No front-end limit for '+pr.n:fe<=pr.f?'Within '+pr.f+'% '+pr.n+' limit':'Above '+(pr.f)+'% guideline');$('feS').className='s '+fc;
  C.text('be',pc(be));$('be').className=bc;$('beDot').className=bc;
  $('beS').innerHTML='<span class="msym" aria-hidden="true">'+(bc?'info':'verified')+'</span>'+(be<=36?'Low risk (≤36%)':be<=43?'Moderate (36–43%)':'High (above 43%)');$('beS').className='s '+bc;
  scale('fe',fe,50,[28,36],[[0,'0%'],[28,'28% Benchmark','b'],[50,'50%']]);
  scale('be',be,60,[36,43],[[0,'0%'],[36,'36% Prime','b'],[43,'43% Common Ceiling','r'],[60,'60%']]);
  var cush=0.43*g-house-dsum;C.text('cush',(cush>=0?'':'−')+M(Math.abs(cush))+' / month'+(cush<0?' over':''));

  var tip;var sorted=debts.filter(function(d){return d[1]>0;}).sort(function(a,b){return a[1]-b[1];});
  var target=beOK?36:pr.b,hit=null;for(var k=0;k<sorted.length;k++){var nb=(house+dsum-sorted[k][1])/g*100;if(nb<=target){hit=[sorted[k],nb];break;}}
  if(!sorted.length)tip='You have no recurring non-housing debts, so your back-end ratio equals your housing ratio. Lowering the housing payment (a smaller loan or larger down payment) is the lever here.';
  else if(hit)tip='Paying off the '+M(hit[0][1])+'/mo '+hit[0][0]+' payment would lower your back-end DTI to '+pc(hit[1])+(target===36?', inside the 36% benchmark lenders treat as low risk.':', bringing it within the '+pr.b+'% '+pr.n+' guideline.');
  else{var big=sorted[sorted.length-1],nb2=(house+dsum-big[1])/g*100;tip='Your largest debt payment is the '+M(big[1])+'/mo '+big[0]+'. Clearing it would lower your back-end DTI to '+pc(nb2)+'; you would need about '+M(Math.max(0,(house+dsum)-target/100*g))+'/mo less debt (or '+M(Math.max(0,(house+dsum)/(target/100)-g))+'/mo more income) to reach '+target+'%.';}
  C.text('tip',tip);
  var tot=house+dsum;C.text('outT','Total Monthly Obligations: '+M(tot));C.text('outN',tot>0?'Made up of '+pc(house/tot*100)+' housing and '+pc(dsum/tot*100)+' other debt payments.':'No obligations entered.');
  document.querySelectorAll('#mxBody tr').forEach(function(tr){tr.className=tr.getAttribute('data-p')===$('prog').value?'act':'';});
  mode=$('mode').value;
}

document.addEventListener('DOMContentLoaded',function(){
  mode=$('mode').value;
  $('mode').addEventListener('input',function(){var m=this.value;if(m===mode)return;var x=v('inc');$('inc').value=Math.round(m==='year'?x*12:x/12);mode=m;});
  C.init({root:'dtCalc',compute:compute});mode=$('mode').value;
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('dti-report.csv',[{h:'Item',key:'k'},{h:'Value',key:'v'}],[{k:'Gross monthly income',v:Math.round(last.g)},{k:'Housing payments',v:Math.round(last.house)},{k:'Other debt payments',v:Math.round(last.dsum)},{k:'Front-end DTI %',v:last.fe.toFixed(1)},{k:'Back-end DTI %',v:last.be.toFixed(1)}]);});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpDTI={};
})();
