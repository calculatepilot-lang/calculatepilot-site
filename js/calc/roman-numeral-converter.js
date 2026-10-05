/* Roman numeral converter — CalculatePilot (Stitch redesign). Greedy conversion; vinculum via combining overline (U+0305); brackets (V) read as ×1000. */
(function(){
var C=window.CPX,$=C.$,last='',VIN='̅';
var STD=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
var ADD=[[1000,'M'],[500,'D'],[100,'C'],[50,'L'],[10,'X'],[5,'V'],[1,'I']];
var VAL={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
function base(n,add){var t=add?ADD:STD,o='';t.forEach(function(p){while(n>=p[0]){o+=p[1];n-=p[0];}});return o;}
function ov(s){return s.split('').map(function(c){return c+VIN;}).join('');}
function roman(n,add){if(n<4000)return base(n,add);return ov(base(Math.floor(n/1000),add))+base(n%1000,add);}
function cs(s,lower){return lower?s.toLowerCase():s;}
function parseBasic(s){if(!/^[IVXLCDM]+$/.test(s))return NaN;var t=0,i;for(i=0;i<s.length;i++){var v=VAL[s.charAt(i)],nx=i+1<s.length?VAL[s.charAt(i+1)]:0;t+=v<nx?-v:v;}return t;}
function parseRoman(raw){
  var s=raw.trim().toUpperCase().replace(/\s+/g,'');if(!s)return {err:'Enter a Roman numeral.'};
  var big=0,rest=s;
  var m=/^\(([IVXLCDM]+)\)([IVXLCDM]*)$/.exec(s);
  if(m){big=parseBasic(m[1]);rest=m[2];}
  else if(s.indexOf(VIN)>=0||s.indexOf('̄')>=0||s.indexOf('‾')>=0){var bar='',pl='',i,chars=Array.from(s.replace(/̄|‾/g,VIN));for(i=0;i<chars.length;i++){if(chars[i]===VIN){continue;}if(chars[i+1]===VIN)bar+=chars[i];else pl+=chars[i];}big=parseBasic(bar);rest=pl;}
  if(isNaN(big)||(big===0&&s.indexOf('(')===0))return {err:'Use only the letters I, V, X, L, C, D and M.'};
  var r=rest?parseBasic(rest):0;if(isNaN(r))return {err:'Use only the letters I, V, X, L, C, D and M.'};
  var n=big*1000+r;if(n<1)return {err:'Enter a Roman numeral.'};if(n>3999999)return {err:'That is above 3,999,999.'};
  return {n:n,canon:roman(n,false),canonAdd:roman(n,true),given:s};}
function partRows(n,add,lower){
  var rows=[],rem=n,t=add?ADD:STD,names=[[1000,'Thousands'],[100,'Hundreds'],[10,'Tens'],[1,'Units']];
  if(n>=4000){var k=Math.floor(n/1000);rows.push(['Thousands, barred',k*1000,cs(ov(base(k,add)),lower)]);rem=n%1000;names=names.slice(1);}
  names.forEach(function(p){var v=Math.floor(rem/p[0])*p[0];if(n>=4000&&p[0]===1000)return;if(v>0)rows.push([p[1],v,cs(base(v,add),lower)]);rem-=v;});
  return rows;}
function fail(msg){$('err').hidden=false;C.text('errT',msg);['resultValue','o1','o2','dateOut'].forEach(function(i){C.text(i,'—');});C.text('tag','—');$('rows').innerHTML='';last='';}
function dateRoman(y,mo,d,add,lower){return [cs(roman(d,add),lower),cs(roman(mo,add),lower),cs(roman(y,add),lower)];}
function compute(){
  var mode=$('mode').value,add=$('st').value==='a',lower=$('cs').value==='l';$('err').hidden=true;
  $('gA').hidden=mode!=='a';$('gR').hidden=mode!=='r';$('gD').hidden=mode!=='d';
  var n,out;
  if(mode==='a'){n=Math.round(C.val('n'));if(!(n>=1&&n<=3999999))return fail('Enter a whole number from 1 to 3,999,999.');
    out=cs(roman(n,add),lower);C.text('hL','Roman numeral');C.text('resultValue',out);C.text('tag',n>=4000?'with bars':add?'additive':'standard');C.text('interp',C.num(n,0)+' written in Roman numerals.');C.text('l1','Value');C.text('o1',C.num(n,0));C.text('o2',String(out.replace(/̅/g,'').length));last=out;}
  else if(mode==='r'){var p=parseRoman($('rn').value);if(p.err)return fail(p.err);n=p.n;
    C.text('hL','Number');C.text('resultValue',C.num(n,0));var canon=add?p.canonAdd:p.canon;
    var same=p.given.replace(/̅/g,'')===canon.replace(/̅/g,'')||(p.given===p.canon.replace(/̅/g,''));
    C.text('tag',p.given.replace(/[()]/g,'')===canon.replace(/̅/g,'')||p.given===p.canon||p.given===p.canonAdd?'valid':'reads as '+C.num(n,0));
    C.text('interp',p.given===p.canon||p.given===p.canonAdd?'A correct Roman numeral.':'Read as '+C.num(n,0)+'. The standard form is '+cs(p.canon,lower)+'.');
    C.text('l1','Standard form');C.text('o1',cs(p.canon,lower));C.text('o2',String(p.given.replace(/[()̅]/g,'').length));last=String(n);}
  else{var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec($('dt').value||'');if(!m)return fail('Enter a date.');var y=+m[1],mo=+m[2],d=+m[3];if(y<1)return fail('Enter a year of 1 or later.');
    var r=dateRoman(y,mo,d,add,lower);out=r.join('.');C.text('hL','Date in Roman numerals');C.text('resultValue',out);C.text('tag',y+'-'+m[2]+'-'+m[3]);C.text('interp','Day, month and year, separated by dots.');C.text('l1','Year');C.text('o1',cs(roman(y,add),lower));C.text('o2',String(out.replace(/[.̅]/g,'').length));n=y;last=out;}
  var rr=(mode==='d'?partRows(n,add,lower):partRows(n,add,lower));
  $('rows').innerHTML=rr.map(function(x){return '<tr><td class="a">'+x[0]+'</td><td class="n">'+C.num(x[1],0)+'</td><td class="n"><b>'+x[2]+'</b></td></tr>';}).join('');
  if(mode==='d'){C.text('dateOut',cs(roman(n,add),lower)+' is the year.');}
  else{var dt=/^(\d{4})-(\d{2})-(\d{2})$/.exec($('dt').value||'');C.text('dateOut',dt?dateRoman(+dt[1],+dt[2],+dt[3],add,lower).join('.')+'  (day.month.year of '+dt[3]+'/'+dt[2]+'/'+dt[1]+')':'—');}
}
function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'rmCalc',compute:compute});
  function put(id,v){$(id).value=v;$(id).dispatchEvent(new Event('input',{bubbles:true}));}
  document.querySelectorAll('[data-n]').forEach(function(b){b.addEventListener('click',function(){put('n',b.getAttribute('data-n'));});});
  document.querySelectorAll('[data-r]').forEach(function(b){b.addEventListener('click',function(){put('rn',b.getAttribute('data-r'));});});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy result');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
