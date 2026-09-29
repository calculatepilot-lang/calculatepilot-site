/* Hours & work shift calculator — CalculatePilot (Stitch redesign).
   Punch rounding (7-minute rule = nearest quarter hour), unpaid meal removed, overnight wrap (+24 h), then overtime by rule:
   weekly (1.5× over 40/week), daily+weekly (1.5× over 8/day and 40/week regular hours), daily double (1.5× 8–12, 2× over 12).
   Pay = regular × rate + OT × rate × 1.5 + DT × rate × 2. FICA 7.65% + user withholding for the take-home estimate. */
(function(){
var C=window.CPX,$=C.$,last='',csv='',DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],curRows=0;
var DEF=[['08:30','12:00','12:45','17:15'],['08:30','12:00','12:45','17:15'],['08:30','12:00','12:45','17:15'],['08:30','12:00','12:45','17:15'],['08:00','12:00','12:30','20:00'],['','','',''],['','','','']];
var F=['in','mo','mi','out'];
function build(n){
  if(n===curRows)return;curRows=n;var h='';
  for(var i=0;i<n;i++){var nm=n===14?(i<7?'Wk 1 ':'Wk 2 ')+DAYS[i%7].slice(0,3):n===1?'Shift':DAYS[i];var d=DEF[i%7];
    h+='<tr><td class="a"><b>'+nm+'</b></td>'+F.map(function(f,k){return '<td><div class="sx-au-in sm np"><input id="r'+i+f+'" type="time" value="'+(i<7||n===14?d[k]:d[k])+'" aria-label="'+nm+' '+f+'" style="min-width:84px"></div></td>';}).join('')+'<td class="n" id="r'+i+'h">0.00</td><td class="n" id="r'+i+'o">0.00</td><td class="n" id="r'+i+'p">$0.00</td></tr>';}
  $('tc').querySelector('tbody').innerHTML=h;
}
function mins(v){if(!v)return NaN;var p=v.split(':');return (+p[0])*60+(+p[1]);}
function rnd(m,mode){if(isNaN(m))return m;if(mode==='q')return Math.floor((m+7)/15)*15;if(mode==='5')return Math.round(m/5)*5;if(mode==='6')return Math.floor((m+3)/6)*6;return m;}
function hm(x){var t=Math.round(x*60),h=Math.floor(t/60),m=t%60;return h+' h '+String(m).padStart(2,'0')+' m';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','oReg','oOT','oHM','oPay'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Fix the input above to see the result.');$('pb').innerHTML='';$('txl').innerHTML='';last='';}
function row(l,v,b){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid var(--sx-border);font-size:'+(b?'15':'13')+'px"><span style="color:var(--sx-onv);'+(b?'font-weight:700':'')+'">'+l+'</span><b style="font-family:var(--font-mono);color:var(--sx-on)">'+v+'</b></div>';}
function dec(){
  var from=document.activeElement&&document.activeElement.id;var dhv=$('dh').value;
  if(from==='hh'||from==='hm'){var hv=C.val('hh'),mv=C.val('hm');$('dh').value=+(hv+mv/60).toFixed(4);}
  else if(dhv!==''){var d=parseFloat(dhv)||0;$('hh').value=Math.floor(d+1e-9);$('hm').value=Math.round((d-Math.floor(d+1e-9))*60);}
  var d2=C.val('dh');C.text('resultValue',C.num(d2,2));C.text('tag',hm(d2));C.text('interp',C.num(d2,2)+' hours is '+hm(d2)+'.');
  C.text('oReg',C.num(d2,2));C.text('oOT','—');C.text('oHM',hm(d2));C.text('oPay',C.money(d2*C.val('rate'),2));$('pb').innerHTML=row('Decimal hours',C.num(d2,4),false)+row('Minutes',C.num(d2*60,1),false)+row('At '+C.money(C.val('rate'),2)+' per hour',C.money(d2*C.val('rate'),2),true);$('txl').innerHTML='';C.text('cycle','converter');last='Decimal hours — calculatepilot.com/other/hours-calculator.html\n'+C.num(d2,2)+' h = '+hm(d2);csv='';
}
function compute(){
  var mode=$('mode').value;
  $('tcCard').hidden=mode==='dec';$('decCard').hidden=mode!=='dec';$('txBox').hidden=!$('tx').checked;
  $('err').hidden=true;
  if(mode==='dec')return dec();
  var n=mode==='bi'?14:mode==='one'?1:7;build(n);
  var rate=C.val('rate'),rule=$('ot').value,rm=$('rnd').value;
  if(!(rate>=0))return fail('Enter your hourly rate.');
  var tot=0,reg=0,ot=0,dt=0,pay=0,wkReg=0,wkHours=0,lines=[];
  for(var i=0;i<n;i++){
    if(n>=7&&i%7===0){wkReg=0;wkHours=0;}
    var a=rnd(mins($('r'+i+'in').value),rm),b=rnd(mins($('r'+i+'out').value),rm),mo=rnd(mins($('r'+i+'mo').value),rm),mi=rnd(mins($('r'+i+'mi').value),rm),h=0;
    if(!isNaN(a)&&!isNaN(b)){var dur=b-a;if(dur<0)dur+=1440;var meal=0;if(!isNaN(mo)&&!isNaN(mi)){meal=mi-mo;if(meal<0)meal+=1440;}h=Math.max(0,dur-meal)/60;}
    var r=0,o=0,d=0;
    if(rule==='none'){r=h;}
    else if(rule==='wk'){var room=Math.max(0,40-wkHours);r=Math.min(h,room);o=h-r;}
    else if(rule==='ca'){var rr=Math.min(h,8),oo=Math.max(0,h-8),room2=Math.max(0,40-wkReg);if(rr>room2){oo+=rr-room2;rr=room2;}r=rr;o=oo;wkReg+=r;}
    else{r=Math.min(h,8);o=Math.min(Math.max(0,h-8),4);d=Math.max(0,h-12);}
    wkHours+=h;
    var p=r*rate+o*rate*1.5+d*rate*2;tot+=h;reg+=r;ot+=o;dt+=d;pay+=p;
    C.text('r'+i+'h',C.num(h,2));C.text('r'+i+'o',C.num(o+d,2));C.text('r'+i+'p',C.money(p,2));
    lines.push([$('r'+i+'h').parentNode.firstChild.textContent,h,o+d,p]);
  }
  C.text('resultValue',C.num(tot,2));C.text('tag',n===14?'14-day cycle':n===1?'one shift':'7-day cycle');
  C.text('interp',C.num(reg,2)+' regular'+(ot?' + '+C.num(ot,2)+' overtime':'')+(dt?' + '+C.num(dt,2)+' double time':'')+' hours, with '+({q:'7-minute',x:'exact-minute','5':'5-minute','6':'tenth-hour'})[rm]+' rounding.');
  C.text('oReg',C.num(reg,2));C.text('oOT',C.num(ot+dt,2));C.text('oHM',hm(tot));C.text('oPay',C.money(pay,2));C.text('cycle',n===14?'14 days':n===1?'single shift':'7 days');
  var pb=row('Regular ('+C.num(reg,2)+' h × '+C.money(rate,2)+')',C.money(reg*rate,2));
  if(ot)pb+=row('Overtime ('+C.num(ot,2)+' h × '+C.money(rate*1.5,2)+')',C.money(ot*rate*1.5,2));
  if(dt)pb+=row('Double time ('+C.num(dt,2)+' h × '+C.money(rate*2,2)+')',C.money(dt*rate*2,2));
  pb+=row('Gross pay',C.money(pay,2),true);$('pb').innerHTML=pb.replace('border-top:1px solid var(--sx-border)','border-top:0');
  if($('tx').checked){var fica=pay*0.0765,wh=pay*C.val('wh')/100;$('txl').innerHTML=row('FICA (7.65%)','−'+C.money(fica,2))+row('Income tax withholding ('+C.num(C.val('wh'),1).replace(/\.0$/,'')+'%)','−'+C.money(wh,2))+row('Estimated take-home',C.money(pay-fica-wh,2),true);}
  csv='Day,Net hours,Overtime hours,Pay\n'+lines.map(function(l){return [l[0],l[1].toFixed(2),l[2].toFixed(2),l[3].toFixed(2)].join(',');}).join('\n')+'\nTotal,'+tot.toFixed(2)+','+(ot+dt).toFixed(2)+','+pay.toFixed(2);
  last='Hours worked — calculatepilot.com/other/hours-calculator.html\n'+C.num(tot,2)+' h ('+hm(tot)+'): '+C.num(reg,2)+' regular, '+C.num(ot+dt,2)+' overtime\nGross pay '+C.money(pay,2)+' at '+C.money(rate,2)+'/h';
  mtd();
}
function mtd(){if($('mtd').dataset.done)return;$('mtd').dataset.done=1;var h='';for(var i=1;i<=20;i++){var a=i,b=i+20,c=i+40;h+='<tr><td>'+a+' min</td><td class="n">'+(a/60).toFixed(2)+'</td><td>'+b+' min</td><td class="n">'+(b/60).toFixed(2)+'</td><td>'+c+' min</td><td class="n">'+(c/60).toFixed(2)+'</td></tr>';}$('mtd').querySelector('tbody').innerHTML=h;}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(){$('rate').dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  build(7);
  C.init({root:'hrCalc',compute:compute});
  $('fillBtn').addEventListener('click',function(){for(var i=0;i<curRows;i++){var wk=i%7<5;$('r'+i+'in').value=wk?'09:00':'';$('r'+i+'mo').value=wk?'12:00':'';$('r'+i+'mi').value=wk?'12:30':'';$('r'+i+'out').value=wk?'17:00':'';}fire();});
  $('clrBtn').addEventListener('click',function(){for(var i=0;i<curRows;i++)F.forEach(function(f){$('r'+i+f).value='';});fire();});
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){setTimeout(function(){for(var i=0;i<curRows;i++)F.forEach(function(f,k){$('r'+i+f).value=DEF[i%7][k];});fire();},0);});
  $('csvBtn').addEventListener('click',function(){if(!csv)return;var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='timesheet.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
