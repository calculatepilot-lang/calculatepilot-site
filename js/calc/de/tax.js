/* Income tax calculator — CalculatePilot (Stitch 1:1 redesign). Tax year 2026 (IRS Rev. Proc. 2025-32).
   Taxable income = wages − 401(k) − HSA − Section 125 − (standard or itemized deduction); or entered directly.
   Federal tax by bracket. FICA (wages mode only): Social Security 6.2% up to $184,500, Medicare 1.45% + 0.9% above $200,000
   ($250,000 MFJ, $125,000 MFS), on wages less HSA/Section 125 payroll deductions. State = rate × (wages − pre-tax), an estimate. */
(function(){
var C=window.CPX,$=C.$,v=C.val,last=null;
var B={s1:[12400,50400,105700,201775,256225,640600],s2:[24800,100800,211400,403550,512450,768700],s3:[12400,50400,105700,201775,256225,384350],s4:[17700,67450,105700,201750,256200,640600]};
var R=[.10,.12,.22,.24,.32,.35,.37],SD={s1:16100,s2:32200,s3:16100,s4:24150},AMT={s1:200000,s2:250000,s3:125000,s4:200000},NM={s1:'Alleinstehend',s2:'Verheiratet, gemeinsame Veranlagung',s3:'Verheiratet, getrennte Veranlagung',s4:'Haushaltsvorstand'};

function M(x,d){return isFinite(x)?(x<0?'−$':'$')+Math.abs(x).toLocaleString('de-DE',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}):'—';}
function P(x){return isFinite(x)?x.toFixed(2)+'%':'—';}
function fed(t,fs){var b=B[fs],lo=0,out=[],tax=0;for(var i=0;i<7;i++){var hi=i<6?b[i]:Infinity,s=Math.max(0,Math.min(t,hi)-lo);out.push({r:R[i],lo:lo,hi:hi,s:s,t:s*R[i]});tax+=s*R[i];lo=hi;}return {tax:tax,rows:out};}

function compute(){
  var fs=$('filingStatus').value,gm=$('mode').value==='s1',inc=Math.max(0,v('taxableIncome'));
  $('grossBox').style.display=gm?'flex':'none';C.text('incL',gm?'Jahresbruttolohn':'Zu versteuerndes Einkommen');C.text('incN',gm?'Gehalt &amp; Boni (W-2)':'Nach Abzügen');
  var k=gm?Math.max(0,v('k401')):0,h=gm?Math.max(0,v('hsa')):0,s=gm?Math.max(0,v('s125')):0,pre=Math.min(inc,k+h+s);
  var itm=$('ded').value==='s2',sd=SD[fs],dd=itm?Math.max(0,v('itm')):sd;
  $('itRow').hidden=!itm;C.text('sdL','Standardabzug ('+M(sd)+')');C.text('sdN','Betrag 2026 für '+NM[fs].toLowerCase());
  var stv=$('st').value,stc=stv==='c';$('stRow').hidden=!stc;var sr=stc?Math.max(0,v('stR')):+stv;
  var agi=gm?inc-pre:inc,ti=gm?Math.max(0,agi-dd):inc,F=fed(ti,fs),ft=F.tax;
  var fw=gm?Math.max(0,inc-h-s):0,ss=Math.min(fw,184500)*.062,med=fw*.0145+Math.max(0,fw-AMT[fs])*.009,fica=ss+med,sttx=gm?Math.max(0,agi)*sr/100:0;
  var tot=ft+fica+sttx,base=gm?inc:inc,top=F.rows.filter(function(r){return r.s>0;}).pop();
  C.text('statT','2026 · '+NM[fs]);C.text('totL',gm?'Geschätzte Gesamtsteuer (Bund + FICA + Bundesstaat)':'Bundeseinkommensteuer auf das zu versteuernde Einkommen');
  C.text('totTax',M(gm?tot:ft));C.text('outEffective',P(base?(gm?tot:ft)/base*100:0));C.text('resultValue',M(ft));C.text('outBracket',top?Math.round(top.r*100)+'%':'0%');
  C.text('fed',M(ft));C.text('fedN','Grenzsteuersatz '+(top?Math.round(top.r*100):0)+'% · '+P(base?ft/base*100:0)+' eff.');
  $('ficaC').style.display=gm?'':'none';$('stC').style.display=gm?'':'none';$('netC').style.display=gm?'':'none';$('shC').style.display=gm?'':'none';$('t3').className='sx-in-t4 '+(gm?'c3':'c1');
  C.text('fica',M(fica));C.text('ficaN','SS '+M(ss)+' + Medicare '+M(med));C.text('stt',M(sttx));C.text('sttN',sr?P(sr)+' of '+M(agi)+(stc?' (Ihr Satz)':''):'Keine Einkommensteuer des Bundesstaats');
  var net=inc-pre-tot;C.text('net',M(net)+' / yr');C.text('netN',M(net/12)+' / month · '+P(inc?net/inc*100:0)+' des Bruttos');
  var parts=[['Take-home',net,'var(--sx-primary)'],['Vorsteuer-Ersparnisse',pre,'#34d399'],['Bund',ft,'#f59e0b'],['FICA',fica,'#3b82f6'],['Bundesstaat',sttx,'#ef4444']].filter(function(p){return p[1]>0;});
  $('alBar').innerHTML=parts.map(function(p){return '<span style="width:'+(inc?p[1]/inc*100:0)+'%;background:'+p[2]+'"></span>';}).join('');
  $('alLg').innerHTML=parts.map(function(p){return '<span><i style="background:'+p[2]+'"></i>'+p[0]+' '+(inc?(p[1]/inc*100).toFixed(1):'0.0')+'%</span>';}).join('');
  C.text('shT','Gesamte Steuerersparnis: '+M(pre));
  var noPre=fed(Math.max(0,inc-dd),fs).tax,ficaNo=Math.min(inc,184500)*.062+inc*.0145+Math.max(0,inc-AMT[fs])*.009,stNo=inc*sr/100,saved=(noPre-ft)+(ficaNo-fica)+(stNo-sttx);
  C.text('shTxt',pre?'Ihr '+M(pre)+' an Vorsteuer-Beiträgen senken die Steuer in diesem Jahr um etwa '+M(saved)+' (federal '+M(noPre-ft)+', FICA '+M(ficaNo-fica)+', Bundesstaat '+M(stNo-sttx)+') — eine sofortige '+Math.round(saved/pre*100)+'% Rendite auf diese Dollar.':'Keine Vorsteuer-Beiträge eingegeben.');
  var lim=[];if(k>24500)lim.push('401(k) über dem Limit von 24.500 $ (Catch-up ab 50 erlaubt)');if(h>8750)lim.push('HSA über dem Familienlimit von 8.750 $');C.text('limN',lim.length?'Prüfung: '+lim.join('; ')+'.':'Grenzen 2026: 401(k) 24.500 $ (unter 50); HSA 4.400 $ Einzelperson / 8.750 $ Familie.');
  C.text('brT','2026 '+NM[fs]);C.text('brN',gm?'Zu versteuerndes Einkommen '+M(ti)+' = '+M(inc)+' Lohn − '+M(pre)+' Vorsteuer − '+M(dd)+' '+(itm?'itemized':'standard')+' Abzug.':'Zu versteuerndes Einkommen von '+M(ti)+' über jede Steuerstufe 2026.');
  var cum=0;last={rows:F.rows,ti:ti};
  $('tbl').innerHTML=F.rows.map(function(r){cum+=r.t;var act=top&&r===top;return '<tr'+(act?' class="pb"':'')+'><td style="font-family:inherit;font-weight:600">'+Math.round(r.r*100)+'%'+(act?' <small class="p">(Grenzsatz)</small>':'')+'</td><td>'+(r.hi===Infinity?'Über '+M(r.lo):M(r.lo)+' — '+M(r.hi))+'</td><td>'+M(r.s)+'</td><td>'+M(r.t,2)+'</td><td>'+(r.s>0?M(cum,2):'—')+'</td></tr>';}).join('');
  var t2=top?top.r:0;C.text('myth','Bei Ihrem Einkommen kommen für die nächsten 1.000 $ zu versteuerndes Einkommen '+M(t2*1000)+' Bundessteuer hinzu, während Ihr effektiver Bundessteuersatz bei '+P(ti?ft/ti*100:0)+' des zu versteuernden Einkommens bleibt.');
  C.text('atl','Jede 1.000 $ an Vorsteuer-Beitrag spart etwa '+M(1000*(t2+sr/100))+' an Einkommensteuer bei Ihrem '+Math.round(t2*100)+'% Bund'+(sr?' + '+(+sr)+'% Bundesstaat':'')+' Grenzsteuersatz.');
}

document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'txCalc',compute:compute});
  $('csvBtn').addEventListener('click',function(){if(!last)return;C.csv('federal-tax-2026.csv',[{h:'Satz',key:'r'},{h:'Von',key:'lo'},{h:'To',key:'hi'},{h:'Einkommen in der Stufe',key:'s'},{h:'Steuer',key:'t'}],last.rows.map(function(x){return {r:Math.round(x.r*100)+'%',lo:x.lo,hi:x.hi===Infinity?'':x.hi,s:Math.round(x.s),t:x.t.toFixed(2)};}));});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
window.cpTax={fed:fed};
})();
