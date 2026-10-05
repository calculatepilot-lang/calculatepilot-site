/* Date duration & business days calculator — CalculatePilot (Stitch redesign).
   Dates are UTC midnights. Interval = [start, end) (end included when chosen). Working days skip weekends, holidays
   (US 5 U.S.C. 6103 with Saturday→Friday / Sunday→Monday observance; UK, Canada, Australia national lists with Easter computed) and extra days. */
(function(){
var C=window.CPX,$=C.$,last='',lastEnd=null,DAY=86400000,cache={};
var MON=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],WD=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
function U(y,m,d){return Date.UTC(y,m,d);}
function iso(ms){var d=new Date(ms);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
function parse(s){var p=String(s).split('-').map(Number);return p.length===3&&p[0]?U(p[0],p[1]-1,p[2]):NaN;}
function todayMs(){var t=new Date();return U(t.getFullYear(),t.getMonth(),t.getDate());}
function dow(ms){return new Date(ms).getUTCDay();}
function fmt(ms){var d=new Date(ms);return MON[d.getUTCMonth()].slice(0,3)+' '+d.getUTCDate()+', '+d.getUTCFullYear();}
function fmtL(ms){var d=new Date(ms);return WD[d.getUTCDay()]+', '+MON[d.getUTCMonth()]+' '+d.getUTCDate()+', '+d.getUTCFullYear();}
function dim(y,m){return new Date(Date.UTC(y,m+1,0)).getUTCDate();}
function nth(y,m,wd,n){var first=dow(U(y,m,1)),d=1+((wd-first+7)%7)+(n-1)*7;return U(y,m,d);}
function lastWd(y,m,wd){var last=U(y,m,dim(y,m)),d=dow(last);return last-((d-wd+7)%7)*DAY;}
function easter(y){var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return U(y,mo-1,da);}
function nextMon(ms){var d=dow(ms);return d===6?ms+2*DAY:d===0?ms+DAY:ms;}
function obsUS(ms){var d=dow(ms);return d===6?ms-DAY:d===0?ms+DAY:ms;}
function holidays(j,y){
  var k=j+y;if(cache[k])return cache[k];var o={};
  function add(ms,n){o[iso(ms)]=n;}
  if(j==='us'){
    [[U(y,0,1),'Neujahrstag'],[nth(y,0,1,3),'Martin Luther King Jr. Day'],[nth(y,1,1,3),'Washingtons Geburtstag'],[lastWd(y,4,1),'Memorial Day'],[U(y,5,19),'Juneteenth'],[U(y,6,4),'Unabhängigkeitstag'],[nth(y,8,1,1),'Labor Day'],[nth(y,9,1,2),'Columbus Day'],[U(y,10,11),'Veterans Day'],[nth(y,10,4,4),'Thanksgiving'],[U(y,11,25),'Weihnachtstag']].forEach(function(h){var fixed=[0,5,6,10,11].indexOf(new Date(h[0]).getUTCMonth())>=0&&/Year|Juneteenth|Independence|Veterans|Christmas/.test(h[1]);add(fixed?obsUS(h[0]):h[0],h[1]+(fixed&&obsUS(h[0])!==h[0]?' (observed)':''));});
  }else if(j==='uk'||j==='au'||j==='ca'){
    var e=easter(y);
    var ny=U(y,0,1),tk={};
    function sub(ms,n){while(dow(ms)===0||dow(ms)===6||o[iso(ms)])ms+=DAY;add(ms,n);}
    if(j==='uk'){
      sub(dow(ny)===6||dow(ny)===0?nextMon(ny):ny,'Neujahrstag');add(e-2*DAY,'Karfreitag');add(e+DAY,'Ostermontag');add(nth(y,4,1,1),'Early May Bank Holiday');add(lastWd(y,4,1),'Spring Bank Holiday');add(lastWd(y,7,1),'Summer Bank Holiday');
      var c=U(y,11,25),b=U(y,11,26);if(dow(c)===0||dow(c)===6)sub(c+DAY*(dow(c)===6?2:2),'Weihnachtstag (Ersatztag)');else add(c,'Weihnachtstag');
      if(dow(b)===0||dow(b)===6)sub(b+DAY,'Boxing Day (Ersatztag)');else add(b,'Boxing Day');
    }else if(j==='ca'){
      sub(dow(ny)===6||dow(ny)===0?nextMon(ny):ny,'Neujahrstag');add(e-2*DAY,'Karfreitag');
      var vd=U(y,4,24);while(dow(vd)!==1)vd-=DAY;add(vd,'Victoria Day');
      [[U(y,6,1),'Canada Day'],[nth(y,8,1,1),'Labour Day'],[U(y,8,30),'Nationaler Tag der Wahrheit und Versöhnung'],[nth(y,9,1,2),'Thanksgiving'],[U(y,10,11),'Remembrance Day'],[U(y,11,25),'Weihnachtstag'],[U(y,11,26),'Boxing Day']].forEach(function(h){var m=h[0];if(dow(m)===0||dow(m)===6)sub(nextMon(m),h[1]+' (observed)');else add(m,h[1]);});
    }else{
      sub(dow(ny)===6||dow(ny)===0?nextMon(ny):ny,'Neujahrstag');
      var ad=U(y,0,26);if(dow(ad)===0||dow(ad)===6)sub(nextMon(ad),'Australia Day (Ersatztag)');else add(ad,'Australia Day');
      add(e-2*DAY,'Karfreitag');add(e+DAY,'Ostermontag');add(U(y,3,25),'Anzac Day');
      var c2=U(y,11,25),b2=U(y,11,26);if(dow(c2)===0||dow(c2)===6)sub(c2+2*DAY,'Weihnachtstag (Ersatztag)');else add(c2,'Weihnachtstag');
      if(dow(b2)===0||dow(b2)===6)sub(b2+DAY,'Boxing Day (Ersatztag)');else add(b2,'Boxing Day');
    }
  }
  cache[k]=o;return o;
}
function holidayName(j,ms){if(j==='none')return null;var y=new Date(ms).getUTCFullYear();return holidays(j,y)[iso(ms)]||holidays(j,y-1)[iso(ms)]||holidays(j,y+1)[iso(ms)]||null;}
var extra={};
function readExtra(){extra={};String($('cust').value).split(/[\s,;]+/).forEach(function(s){if(/^\d{4}-\d{2}-\d{2}$/.test(s))extra[s]='Zusätzlicher freier Tag';});}
function classify(ms){
  var wk=$('nowk').checked&&(dow(ms)===0||dow(ms)===6);
  if(wk)return 'w';
  var n=holidayName($('jur').value,ms)||extra[iso(ms)];
  return n?'h':'b';
}
function stats(a,b,incl){
  var lo=Math.min(a,b),hi=Math.max(a,b),end=hi+(incl?DAY:0),cal=Math.round((end-lo)/DAY),wk=0,hol=0,work=0,hl=[];
  for(var t=lo;t<end;t+=DAY){var c=classify(t);if(c==='w')wk++;else if(c==='h'){hol++;hl.push([t,holidayName($('jur').value,t)||extra[iso(t)]]);}else work++;}
  return {cal:cal,wk:wk,hol:hol,work:work,hl:hl,lo:lo,hi:hi};
}
function ymd(a,b){var lo=Math.min(a,b),hi=Math.max(a,b),x=new Date(lo),y=new Date(hi),yy=y.getUTCFullYear()-x.getUTCFullYear(),mm=y.getUTCMonth()-x.getUTCMonth(),dd=y.getUTCDate()-x.getUTCDate();if(dd<0){mm--;var pm=y.getUTCMonth()-1,py=y.getUTCFullYear();if(pm<0){pm=11;py--;}dd+=dim(py,pm);}if(mm<0){yy--;mm+=12;}return [yy,mm,dd];}
function ymdT(a,b){var r=ymd(a,b),p=[];if(r[0])p.push(r[0]+' yr');if(r[1])p.push(r[1]+' mo');p.push(r[2]+' d');return p.join(', ');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','h1','h2','h3','h4','oSol','oYr','oNext'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um das Ergebnis zu sehen.');$('cbar').innerHTML='';$('cleg').innerHTML='';$('hlist').innerHTML='';lastEnd=null;last='';}
function compute(){
  var mode=$('mode').value,j=$('jur').value;readExtra();
  $('endBox').hidden=mode==='addsub';$('addBox').hidden=mode!=='addsub';
  var s=parse($('sd').value),e=parse($('ed').value);
  C.text('sdW',isNaN(s)?'—':fmtL(s));C.text('edW',isNaN(e)?'—':fmtL(e));
  var yr=new Date(isNaN(s)?todayMs():s).getUTCFullYear(),hc=j==='none'?0:Object.keys(holidays(j,yr)).length;C.text('hCount',j==='none'?'keine Feiertage':hc+' Feiertage in '+yr);
  $('err').hidden=true;
  if(isNaN(s))return fail('Wählen Sie ein Startdatum.');
  var incl=$('incl').checked,hpd=C.val('hpd'),st,endMs;
  if(mode==='addsub'){
    var n=Math.max(0,Math.round(C.val('nd'))),dir=+$('dir').value;
    if($('cnt').value==='cal'){endMs=s+dir*n*DAY;}
    else{endMs=s;var left=n;var guard=0;while(left>0&&guard<200000){endMs+=dir*DAY;guard++;if(classify(endMs)==='b')left--;}}
    st=stats(s,endMs,false);
    C.text('heroL',(dir>0?'Start plus ':'Start minus ')+n+($('cnt').value==='cal'?' calendar':' business')+' days');C.text('resultValue',fmt(endMs));C.text('heroU','');C.text('tag',WD[dow(endMs)]);
    C.text('interp',fmtL(s)+(dir>0?' + ':' − ')+n+' '+($('cnt').value==='cal'?'calendar':'business')+' Tage = '+fmtL(endMs)+'.');
    C.text('h1L','Kalendertage');C.text('h1',C.num(st.cal,0));C.text('h2L','Arbeitstage dazwischen');C.text('h2',C.num(st.work,0));C.text('h3L','Jahre, Monate, Tage');C.text('h3',ymdT(s,endMs));C.text('h4L','Arbeitsstunden');C.text('h4',C.num(st.work*hpd,1)+' hrs');
  }else{
    if(isNaN(e))return fail('Wählen Sie ein Enddatum.');
    endMs=e;var swapped=e<s;st=stats(s,e,incl);
    var big=mode==='biz'?st.work:st.cal;
    C.text('heroL',mode==='biz'?'Arbeitstage':'Kalendertage');C.text('resultValue',C.num(big,0));C.text('heroU',big===1?'day':'days');C.text('tag',mode==='biz'?C.num(st.cal,0)+' Kalendertage':C.num(st.work,0)+' Arbeitstage');
    C.text('interp',fmt(st.lo)+' to '+fmt(st.hi)+(incl?', einschließlich des Endtags':', ohne den Endtag')+(swapped?'. The dates were in reverse order, so they were swapped.':'.'));
    C.text('h1L',mode==='biz'?'Kalendertage':'Arbeitstage');C.text('h1',C.num(mode==='biz'?st.cal:st.work,0));C.text('h2L','Wochen und Tage');C.text('h2',Math.floor(st.cal/7)+' wk, '+(st.cal%7)+' d');C.text('h3L','Jahre, Monate, Tage');C.text('h3',ymdT(s,e));C.text('h4L','Arbeitsstunden');C.text('h4',C.num(st.work*hpd,1)+' hrs');
  }
  lastEnd=endMs;
  /* composition */
  var tot=Math.max(1,st.cal),parts=[['Rechenweg',st.work,'#0f5b44'],['Wochenende',st.wk,'#94a3b8'],['Feiertag / freier Tag',st.hol,'#d97706']];
  $('cbar').innerHTML=parts.map(function(p){return '<div style="width:'+(p[1]/tot*100)+'%;background:'+p[2]+'"></div>';}).join('');
  $('cleg').innerHTML=parts.map(function(p){return '<span style="display:inline-flex;align-items:center;gap:6px"><i style="width:9px;height:9px;border-radius:50%;background:'+p[2]+'"></i>'+p[1]+' '+p[0].toLowerCase()+'</span>';}).join('');
  C.text('cmpN',st.cal+' Kalendertage');
  $('hlist').innerHTML=st.hl.slice(0,8).map(function(h,i){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:12px"><span style="color:var(--sx-onv)">'+C.esc(h[1])+'</span><b style="font-family:var(--font-mono);color:var(--sx-on)">'+fmt(h[0])+'</b></div>';}).join('')+(st.hl.length>8?'<div style="font-size:12px;color:var(--sx-muted);padding-top:6px">und '+(st.hl.length-8)+' weitere</div>':'');
  C.text('oSol',C.num(st.cal*24,0)+' hrs');C.text('oMin',C.num(st.cal*1440,0)+' minutes');
  var y0=new Date(st.lo).getUTCFullYear(),ylen=(y0%4===0&&y0%100!==0)||y0%400===0?366:365;C.text('oYr',C.num(st.cal/ylen*100,2)+'%');C.text('oYrN','of '+y0+' ('+ylen+' Tage)');
  var nx=endMs+DAY,g=0;while(classify(nx)!=='b'&&g<400){nx+=DAY;g++;}C.text('oNext',fmtL(nx));
  offsets();quarters();
  last='Datumsrechner — calculatepilot.com/other/date-calculator.html\n'+(mode==='addsub'?fmt(s)+' → '+fmt(endMs):fmt(st.lo)+' to '+fmt(st.hi))+': '+st.cal+' Kalendertage, '+st.work+' Arbeitstage ('+st.wk+' Wochenende, '+st.hol+' Feiertag)';
}
function offsets(){
  var t=todayMs(),h='';C.text('offBase','from '+fmt(t));
  [30,60,90,180,-90].forEach(function(n){var d=t+n*DAY;h+='<div><span>'+(n>0?'+':'−')+Math.abs(n)+' Tage</span><b style="font-size:17px">'+fmt(d)+'</b><small>'+WD[dow(d)]+(dow(d)===0||dow(d)===6?' (weekend)':'')+(n<0?' (past)':'')+'</small></div>';});
  $('offs').innerHTML=h;
}
function quarters(){
  var t=new Date(),y=t.getFullYear(),fy=t.getMonth()>=9?y+1:y,rows=[['Q1 '+y,U(y,0,1),U(y,2,31)],['Q2 '+y,U(y,3,1),U(y,5,30)],['Q3 '+y,U(y,6,1),U(y,8,30)],['Q4 '+y,U(y,9,1),U(y,11,31)],['US-Bundeshaushaltsjahr '+fy,U(fy-1,9,1),U(fy,8,30)]],h='';
  C.text('qBase',$('jur').value==='none'?'nur Wochenenden':$('jur').selectedOptions[0].text.split(' (')[0]);
  rows.forEach(function(r){var s=stats(r[1],r[2],true),hw=0;s.hl.forEach(function(x){hw++;});h+='<tr><td class="a">'+r[0]+'</td><td class="a">'+iso(r[1])+'</td><td class="a">'+iso(r[2])+'</td><td class="n">'+s.cal+'</td><td class="n">'+s.work+'</td><td class="n">'+hw+'</td></tr>';});
  $('qt').querySelector('tbody').innerHTML=h;
}
function ics(){if(lastEnd==null)return;var d=iso(lastEnd).replace(/-/g,''),nx=iso(lastEnd+DAY).replace(/-/g,'');var body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CalculatePilot//Date Calculator//EN','BEGIN:VEVENT','UID:'+d+'@calculatepilot.com','DTSTAMP:'+iso(todayMs()).replace(/-/g,'')+'T000000Z','DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+nx,'SUMMARY:Date from CalculatePilot','END:VEVENT','END:VCALENDAR'].join('\r\n');var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'text/calendar'}));a.download='date.ics';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function set(id,ms){$(id).value=iso(ms);$(id).dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  var t=todayMs();if(!$('sd').value)$('sd').value=iso(t);if(!$('ed').value)$('ed').value=iso(t+90*DAY);
  C.init({root:'dtCalc',compute:compute});
  $('spre').addEventListener('click',function(e){var b=e.target.closest('button[data-s]');if(!b)return;var k=b.getAttribute('data-s'),n=new Date();set('sd',k==='today'?t:k==='mstart'?U(n.getFullYear(),n.getMonth(),1):U(n.getFullYear(),0,1));});
  $('epre').addEventListener('click',function(e){var b=e.target.closest('button[data-e]');if(!b)return;var k=b.getAttribute('data-e'),s=parse($('sd').value)||t;set('ed',k==='yend'?U(new Date(s).getUTCFullYear(),11,31):s+(+k)*DAY);});
  $('icsBtn').addEventListener('click',ics);
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
