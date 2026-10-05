/* Time calculator — CalculatePilot (Stitch redesign). Whole-minute arithmetic. */
(function(){
var C=window.CPX,$=C.$,last='';
function parse(v){var p=(v||'').split(':');if(p.length<2)return NaN;return (+p[0])*60+(+p[1]);}
function hm(m){m=Math.round(m);var neg=m<0;m=Math.abs(m);var h=Math.floor(m/60),r=m%60;return (neg?'−':'')+h+' h '+(r<10?'0':'')+r+' min';}
function clock(m){m=((m%1440)+1440)%1440;var h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM',h12=h%12||12;return h12+':'+(mm<10?'0':'')+mm+' '+ap;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','o1','o2','o3','o4'].forEach(function(i){C.text(i,'—');});C.text('tag','—');last='';}
/* one duration: 1:30 | 45m | 2h 15m | 1.5 (hours) */
function dur(line){line=line.trim().toLowerCase();if(!line)return null;var m=/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/.exec(line);if(m)return (+m[1])*60+(+m[2])+(m[3]?(+m[3])/60:0);
  m=/^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?)?$/.exec(line);if(m&&(m[1]||m[2]))return (m[1]?+m[1]*60:0)+(m[2]?+m[2]:0);
  if(/^\d+(\.\d+)?$/.test(line))return +line*60;return NaN;}
function compute(){
  var mode=$('mode').value;$('err').hidden=true;
  $('gEl').hidden=mode!=='el';$('gAd').hidden=mode!=='ad';$('gSu').hidden=mode!=='su';
  document.querySelectorAll('.cs').forEach(function(e){e.textContent=C.symbol();});
  var tot,net;
  if(mode==='el'){
    var a=parse($('a').value),b=parse($('b').value),dy=+$('dy').value,br=C.val('br'),rt=C.val('rt');
    if(isNaN(a)||isNaN(b))return fail('Saisissez une heure de début et une heure de fin.');
    var el=b+dy*1440-a;if(el<0)return fail('La fin est antérieure au début. Réglez la fin au jour suivant pour un service de nuit.');
    net=el-br;if(net<0)return fail('La pause est plus longue que le temps travaillé.');
    C.text('hL','Durée nette');C.text('resultValue',hm(net));C.text('tag',clock(a)+' → '+clock(b)+(dy?' (+'+dy+')':''));
    C.text('interp','De '+clock(a)+' to '+clock(b)+(dy?' '+(dy===1?'le lendemain':dy+' jours plus tard'):'')+', moins une '+br+' minutes de pause.');
    C.text('l1','Heures décimales');C.text('o1',(net/60).toFixed(2));C.text('l2','Total de minutes');C.text('o2',C.num(net,0));C.text('l3','Durée brute');C.text('o3',hm(el));C.text('l4','Paie');C.text('o4',rt>0?C.money(net/60*rt,2):'—');
    C.text('wk',clock(b)+(dy?' + '+dy+' day':'')+' − '+clock(a)+' = '+hm(el)+'. Less '+br+' min de pause = '+hm(net)+' = '+(net/60).toFixed(4)+' h.'+(rt>0?' × '+C.money(rt,2)+' = '+C.money(net/60*rt,2)+'.':''));
    last='Heure — calculatepilot.com/other/time-calculator.html\n'+clock(a)+' to '+clock(b)+': '+hm(net)+' ('+(net/60).toFixed(2)+' h)';
  }else if(mode==='ad'){
    var s=parse($('s').value),op=+$('op').value,span=C.val('dd')*1440+C.val('hh')*60+C.val('mm');
    if(isNaN(s))return fail('Saisissez une heure de début.');
    var r=s+op*span,days=Math.floor(r/1440);
    C.text('hL',op>0?'Heure après ajout de':'Heure après soustraction de');C.text('resultValue',clock(r));C.text('tag',days===0?'même jour':days>0?'+'+days+' day'+(days>1?'s':''):days+' day'+(days<-1?'s':''));
    C.text('interp',clock(s)+(op>0?' plus ':' minus ')+hm(span)+'.');
    C.text('l1','Durée en heures');C.text('o1',(span/60).toFixed(2));C.text('l2','Durée en minutes');C.text('o2',C.num(span,0));C.text('l3','Décalage de jour');C.text('o3',days===0?'0':(days>0?'+':'')+days);C.text('l4','Format 24 heures');C.text('o4',String(Math.floor((((r%1440)+1440)%1440)/60)).padStart(2,'0')+':'+String((((r%1440)+1440)%1440)%60).padStart(2,'0'));
    C.text('wk',clock(s)+(op>0?' + ':' − ')+hm(span)+' = '+clock(r)+(days?' ('+(days>0?'+':'')+days+' day'+(Math.abs(days)>1?'s':'')+')':'')+'.');
    last='Heure — calculatepilot.com/other/time-calculator.html\n'+clock(s)+(op>0?' + ':' − ')+hm(span)+' = '+clock(r);
  }else{
    var lines=$('ls').value.split(/\n/).filter(function(x){return x.trim();}),sum=0,bad=null;
    if(!lines.length)return fail('Saisissez au moins une durée.');
    lines.forEach(function(x){var d=dur(x);if(d===null)return;if(isNaN(d)){bad=x;return;}sum+=d;});
    if(bad)return fail('Impossible de lire « '+bad.trim()+' ». Utilisez h:mm, 45m ou 2h 15m.');
    C.text('hL','Durée totale');C.text('resultValue',hm(sum));C.text('tag',lines.length+(lines.length===1?' entry':' entries'));
    C.text('interp','La somme de '+lines.length+(lines.length===1?' durée.':' durées.'));
    C.text('l1','Heures décimales');C.text('o1',(sum/60).toFixed(2));C.text('l2','Total de minutes');C.text('o2',C.num(sum,0));C.text('l3','Total en secondes');C.text('o3',C.num(sum*60,0));C.text('l4','Jours');C.text('o4',(sum/1440).toFixed(3));
    C.text('wk',lines.map(function(x){return x.trim();}).join(' + ')+' = '+hm(sum)+'.');
    last='Heure — calculatepilot.com/other/time-calculator.html\nTotal '+hm(sum)+' ('+(sum/60).toFixed(2)+' h)';
  }
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copié');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'tmCalc',compute:compute});
  document.querySelectorAll('[data-b]').forEach(function(b){b.addEventListener('click',function(){$('br').value=b.getAttribute('data-b');$('br').dispatchEvent(new Event('input',{bubbles:true}));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copier le résultat');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copier le code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
