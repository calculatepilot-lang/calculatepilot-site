/* Exact age & milestone calculator — CalculatePilot (Stitch redesign).
   Age in Y/M/D by borrowing days of the previous month; total days from UTC date difference (no DST drift).
   Milestones: birth date + 10,000 / 20,000 days and + 1,000,000,000 seconds. Life expectancy is an editable average. */
(function(){
var C=window.CPX,$=C.$,last='',DAY=86400000;
var MON=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],WD=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
var ZOD=[['Steinbock',12,22],['Wassermann',1,20],['Fische',2,19],['Widder',3,21],['Stier',4,20],['Zwillinge',5,21],['Krebs',6,21],['Löwe',7,23],['Jungfrau',8,23],['Waage',9,23],['Skorpion',10,23],['Schütze',11,22]];
var CZ=['Ratte','Ox','Tiger','Hase','Drache','Schlange','Pferd','Ziege','Affe','Hahn','Hund','Schwein'];
function utc(y,m,d){return Date.UTC(y,m,d);}
function dim(y,m){return new Date(Date.UTC(y,m+1,0)).getUTCDate();}
function leap(y){return (y%4===0&&y%100!==0)||y%400===0;}
function fd(ms){var d=new Date(ms);return MON[d.getUTCMonth()].slice(0,3)+' '+d.getUTCDate()+', '+d.getUTCFullYear();}
function fdl(ms){var d=new Date(ms);return WD[d.getUTCDay()]+', '+MON[d.getUTCMonth()]+' '+d.getUTCDate()+', '+d.getUTCFullYear();}
function ord(n){var s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
function todayIso(){var t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');}
function zodiac(m,d){var v=m*100+d;if(v>=1222||v<120)return 'Steinbock';if(v<219)return 'Wassermann';if(v<321)return 'Fische';if(v<420)return 'Widder';if(v<521)return 'Stier';if(v<621)return 'Zwillinge';if(v<723)return 'Krebs';if(v<823)return 'Löwe';if(v<923)return 'Jungfrau';if(v<1023)return 'Waage';if(v<1122)return 'Skorpion';return 'Schütze';}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','nbA','nbD','tD','tW','tM','tMin','zs','cz','wd'].forEach(function(i){C.text(i,'—');});C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um das Alter zu sehen.');$('miles').innerHTML='';last='';}
function compute(){
  $('tBox').hidden=!$('useT').checked;
  var by=Math.round(C.val('by')),bm=+$('bm').value,bd=Math.round(C.val('bd')),ti=$('td').value||todayIso();
  $('err').hidden=true;
  if(!(by>=1&&bd>=1))return fail('Geben Sie Ihr vollständiges Geburtsdatum ein.');
  if(bd>dim(by,bm))return fail(MON[bm]+' '+by+' hat nur '+dim(by,bm)+' Tage.');
  var tp=ti.split('-').map(Number),ty=tp[0],tm=tp[1]-1,td=tp[2];
  var B=utc(by,bm,bd),T=utc(ty,tm,td);
  if(T<B)return fail('Das Berechnungsdatum liegt vor dem Geburtsdatum.');
  var y=ty-by,m=tm-bm,d=td-bd;
  if(d<0){m--;d+=dim(tm===0?ty-1:ty,tm===0?11:tm-1);}
  if(m<0){y--;m+=12;}
  var totDays=Math.round((T-B)/DAY)+($('incl').checked?1:0);
  var hasT=$('useT').checked&&$('bt').value,secs=totDays*86400;
  if(hasT){var hp=$('bt').value.split(':').map(Number);secs=Math.round((T-B)/1000)+(($('incl').checked?DAY/1000:0))-(hp[0]*3600+hp[1]*60)+0;var now=new Date();if(ti===todayIso())secs+=now.getHours()*3600+now.getMinutes()*60+now.getSeconds();}
  var hours=Math.floor(secs/3600),mins=Math.floor(secs/60);
  var nm=[];if(y)nm.push(y+' year'+(y>1?'s':''));nm.push(m+' month'+(m!==1?'s':''));nm.push(d+' day'+(d!==1?'s':''));
  C.text('resultValue',y+' Jahre, '+m+' Monate, '+d+' days');C.text('tag',(td===bd&&tm===bm?'Alles Gute zum Geburtstag!':C.num(totDays,0)+' days'));
  C.text('interp','On '+fdl(T)+'. Born '+fdl(B)+'.');
  /* next birthday */
  var ny=ty,nbm=bm,nbd=bd;
  function bday(yy){var dd=bd;if(bm===1&&bd===29&&!leap(yy)){return utc(yy,2,1);}return utc(yy,bm,dd);}
  var nb=bday(ty);if(nb<T)nb=bday(ty+1);
  var nbAge=new Date(nb).getUTCFullYear()-by,dl=Math.round((nb-T)/DAY);
  C.text('nbA',ord(nbAge)+' · '+fd(nb));C.text('nbD',dl===0?'Heute':C.num(dl,0)+' days');
  /* totals */
  var totM=y*12+m,wk=Math.floor(totDays/7);
  C.text('unitsN',$('incl').checked?'einschließlich des Enddatums':'exakt vergangen');
  C.text('tD',C.num(totDays,0));C.text('tDh',C.num(hasT?hours:totDays*24,0)+' hours');C.text('tW',C.num(wk,0));C.text('tWr','+ '+(totDays%7)+' day'+((totDays%7)===1?'':'s'));
  C.text('tM',C.num(totM,0));C.text('tMin',C.num(hasT?mins:totDays*1440,0));C.text('tSec',C.num(hasT?secs:totDays*86400,0)+' seconds');
  /* life progress */
  var le=Math.max(1,C.val('le')),ageY=(T-B)/DAY/365.2425,pct=Math.min(100,ageY/le*100);
  C.text('lifeP',C.num(pct,1)+'% von '+C.num(le,1)+' years');$('lifeBar').style.width=pct+'%';C.text('lifeE','Durchschnittliche Lebenserwartung '+C.num(le,1)+' yrs');
  var ms=[[10000*DAY,'10.000. Tag'],[1e9*1000,'1 Milliarde Sekunden'],[20000*DAY,'20,000. Tag']],h='';
  ms.forEach(function(x,i){var when=B+x[0],past=when<=T,diff=Math.round((when-T)/DAY);h+='<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:'+(i?'1px solid var(--sx-border)':'0')+';font-size:13px"><span style="color:var(--sx-onv)">'+x[1]+'</span><b style="font-family:var(--font-mono);color:var(--sx-on);text-align:right">'+(past?'Erreicht ':'')+fd(when)+'<small style="display:block;font-weight:500;color:var(--sx-muted)">'+(past?C.num(-diff,0)+' Tage her':'in '+C.num(diff,0)+' days')+'</small></b></div>';});
  $('miles').innerHTML=h;
  C.text('zs',zodiac(bm+1,bd));C.text('cz',CZ[((by-4)%12+12)%12]);C.text('wd',WD[new Date(B).getUTCDay()]);
  cohort(ty);
  last='Alter — calculatepilot.com/other/age-calculator.html\nGeboren '+fd(B)+'; am '+fd(T)+': '+y+' Jahre, '+m+' Monate, '+d+' days\n'+C.num(totDays,0)+' Tage · nächster Geburtstag '+fd(nb)+' ('+C.num(dl,0)+' Tage)';
}
function cohort(yr){
  C.text('cohortYr','Stand '+yr);
  var h='';for(var b=1985;b<=2015;b+=5){var age=yr-b,days=Math.round((utc(yr,6,1)-utc(b,6,1))/DAY),gen=b<=1964?'Babyboomer':b<=1980?'Generation X':b<=1996?'Millennial':b<=2012?'Generation Z':'Generation Alpha',fr=b>=1960?b+67:b+66;h+='<tr><td class="a">'+b+'</td><td class="n">'+age+'</td><td class="n">'+C.num(days,0)+'</td><td class="n">'+fr+'</td><td class="a">'+gen+'</td></tr>';}
  $('cohort').querySelector('tbody').innerHTML=h;
}
function setT(k){
  var by=Math.round(C.val('by')),bm=+$('bm').value,bd=Math.round(C.val('bd')),t=new Date(),ty=t.getFullYear(),v;
  function iso(ms){var d=new Date(ms);return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
  if(k==='today')v=todayIso();else if(k==='2030')v='2030-01-01';else if(k==='next'){var nb=utc(ty,bm,bd);if(nb<utc(ty,t.getMonth(),t.getDate()))nb=utc(ty+1,bm,bd);v=iso(nb);}else v=iso(utc(by+(+k),bm,bd));
  $('td').value=v;$('td').dispatchEvent(new Event('input',{bubbles:true}));
}
function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  if(!$('td').value)$('td').value=todayIso();
  C.init({root:'agCalc',compute:compute});
  $('tpre').addEventListener('click',function(e){var b=e.target.closest('button[data-t]');if(b)setT(b.getAttribute('data-t'));});
  document.querySelector('[data-action="reset"]').addEventListener('click',function(){setTimeout(function(){$('td').value=todayIso();$('td').dispatchEvent(new Event('input',{bubbles:true}));},0);});
  $('td').addEventListener('input',function(){C.text('tdNote',this.value===todayIso()?'today':'eigenes Datum');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnis kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
