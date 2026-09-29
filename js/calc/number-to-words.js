/* Number to words converter — CalculatePilot (Stitch redesign).
   Splits the integer part into triads (groups of 3 digits) from the right, spells each 1-999 group, and pairs it
   with its scale word (short scale: thousand, million, billion, ...; long scale: thousand, million, milliard, billion, ...). */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
var ONES=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
var TENS=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
var ORD_ONES=['','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth'];
var ORD_TENS=['','','twentieth','thirtieth','fortieth','fiftieth','sixtieth','seventieth','eightieth','ninetieth'];
/* short-scale names, index = triad position (0=units,1=thousand,2=million,...) */
var SHORT=['','thousand','million','billion','trillion','quadrillion','quintillion','sextillion','septillion','octillion','nonillion','decillion'];
/* long-scale: 10^(3*2k)=...illion, 10^(3*(2k+1))=...illiard, with 'thousand' still at position1 */
var LONG=['','thousand','million','milliard','billion','billiard','trillion','trilliard','quadrillion','quadrilliard','quintillion','quintilliard'];

function hyph(s,hyphenate){return hyphenate?s:s.replace(/-/g,' ');}
function under100(n,hyphenate){
  if(n<20)return ONES[n];
  var t=Math.floor(n/10),o=n%10;
  return o?hyph(TENS[t]+'-'+ONES[o],hyphenate):TENS[t];
}
function under1000(n,hyphenate){
  var h=Math.floor(n/100),r=n%100;
  var parts=[];
  if(h)parts.push(ONES[h]+' hundred');
  if(r)parts.push(under100(r,hyphenate));
  return parts.join(' ');
}
function intToWords(n,scale,hyphenate){
  if(n===0)return 'zero';
  var names=scale==='long'?LONG:SHORT;
  var triads=[];
  while(n>0){triads.push(n%1000);n=Math.floor(n/1000);}
  var parts=[];
  for(var i=triads.length-1;i>=0;i--){
    if(triads[i]===0)continue;
    var words=under1000(triads[i],hyphenate);
    parts.push(words+(names[i]?' '+names[i]:''));
  }
  return parts.join(' ');
}
function ordinalWords(n,scale,hyphenate){
  if(n===0)return 'zeroth';
  var names=scale==='long'?LONG:SHORT;
  var triads=[];var n2=n;
  while(n2>0){triads.push(n2%1000);n2=Math.floor(n2/1000);}
  var parts=[];
  for(var i=triads.length-1;i>=0;i--){
    if(triads[i]===0)continue;
    var isLast=(i===0)||(triads.slice(0,i).every(function(x){return x===0;}));
    var words;
    if(isLast){
      var h=Math.floor(triads[i]/100),r=triads[i]%100;
      var pieces=[];
      if(h&&!r){words=ONES[h]+' hundredth';}
      else{
        if(h)pieces.push(ONES[h]+' hundred');
        if(r<20&&r>0)pieces.push(ORD_ONES[r]);
        else if(r>=20){var t=Math.floor(r/10),o=r%10;pieces.push(o?hyph(TENS[t]+'-'+ORD_ONES[o],hyphenate):ORD_TENS[t]);}
        words=pieces.join(' ');
      }
    }else{
      words=under1000(triads[i],hyphenate)+' '+names[i];
    }
    parts.push(words);
  }
  return parts.join(' ');
}
function fracHundredths(dec2){ /* dec2: 2-digit string, returns "seventy-five hundredths" style */
  var v=parseInt(dec2,10);
  if(v===0)return null;
  return under100(v,true)+' hundredths';
}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Fix the input above to see a result.');$('tiles').innerHTML='';$('steps').innerHTML='';}
function titleCase(s){return s.replace(/\b[a-z]+(-[a-z]+)*\b/g,function(w){return w==='and'?w:w.charAt(0).toUpperCase()+w.slice(1).replace(/-([a-z])/g,function(m,c){return '-'+c.toUpperCase();});});}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}

function compute(){
  var tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  var raw=String($('v').value||'').trim();
  var neg=raw[0]==='-';if(neg)raw=raw.slice(1);
  if(!/^\d+(\.\d+)?$/.test(raw))return fail('Enter a valid non-negative number (optionally with a decimal point); enter the sign separately.');
  var parts=raw.split('.'),intStr=parts[0],decStr=(parts[1]||'').slice(0,2);
  if(intStr.length>34)return fail('Number is too large — no standard English name exists beyond decillion (10³³).');
  var intVal=parseInt(intStr,10);
  if(!isFinite(intVal))return fail('Number is too large to spell out exactly (JavaScript precision limit); try a smaller value.');
  var scale=$('scale').value,hyphenate=$('hyphen').checked,tc=$('titlecase').checked,fmt=$('fmt').value;
  C.html('fxNow',(neg?'−':'')+grp(intStr)+(decStr?'.'+decStr:''));

  var cardShort=intToWords(intVal,'short',hyphenate),cardLong=intToWords(intVal,'long',hyphenate);
  var main;
  if(fmt==='ord'){
    main=(neg?'negative ':'')+ordinalWords(intVal,scale,hyphenate);
    C.text('heroLbl','Ordinal');C.text('resultValue',tc?titleCase(main):main);tg.textContent=scale+' scale';
    C.text('ex1L','Cardinal form');C.text('ex1',(neg?'negative ':'')+cardShort);
    C.text('ex2L','Numeral');C.text('ex2',grp(String(intVal))+ordSuffix(intVal));
  }else if(fmt==='card'){
    var frac=fracHundredths(decStr.padEnd(2,'0'));
    main=(neg?'negative ':'')+cardShort+(frac?' and '+frac:'');
    var mainLong=(neg?'negative ':'')+cardLong+(frac?' and '+frac:'');
    C.text('heroLbl','Cardinal words (short scale)');C.text('resultValue',tc?titleCase(main):main);tg.textContent='short scale';
    C.text('ex1L','Long scale (European)');C.text('ex1',tc?titleCase(mainLong):mainLong);
    C.text('ex2L','Ordinal form');C.text('ex2',(neg?'negative ':'')+ordinalWords(intVal,scale,hyphenate));
  }else if(fmt==='check'){
    var cents=decStr?decStr.padEnd(2,'0'):'00';
    main=(neg?'negative ':'')+cardShort+' and '+cents+'/100 Dollars';
    C.text('heroLbl','Legal check line (USD)');C.text('resultValue',titleCase(main));tg.textContent='UCC § 3-114 style';
    C.text('ex1L','Cardinal words');C.text('ex1',(neg?'negative ':'')+cardShort);
    C.text('ex2L','Amount');C.text('ex2','$'+grp(intStr)+'.'+cents);
  }else{
    var curNames={usd:['dollar','dollars','cent','cents','$'],gbp:['pound','pounds','pence','pence','£'],eur:['euro','euros','cent','cents','€']}[fmt];
    var cents2=decStr?decStr.padEnd(2,'0'):'00',centsVal=parseInt(cents2,10);
    var mainWhole=(neg?'negative ':'')+cardShort+' '+(intVal===1?curNames[0]:curNames[1]);
    var mainCents=centsVal?' and '+under100(centsVal,true)+' '+(centsVal===1?curNames[2]:curNames[3]):'';
    main=mainWhole+mainCents;
    C.text('heroLbl','Currency words');C.text('resultValue',tc?titleCase(main):main);tg.textContent=fmt.toUpperCase();
    C.text('ex1L','Amount');C.text('ex1',curNames[4]+grp(intStr)+'.'+cents2);
    C.text('ex2L','Legal check line');C.text('ex2',titleCase((neg?'negative ':'')+cardShort+' and '+cents2+'/100 '+curNames[1]));
  }
  C.text('interp','The integer part is split into groups of three digits (triads), each spelled out and paired with its scale word.');
  var triadsShown=[];var tv=intVal,pos=0;var names=scale==='long'?LONG:SHORT;
  while(tv>0){var g=tv%1000;if(g)triadsShown.unshift([g,names[pos],under1000(g,hyphenate),pos]);tv=Math.floor(tv/1000);pos++;}
  tiles(triadsShown.length?triadsShown.map(function(t){return ['Triad: '+grp(String(t[0])),t[2]+(t[1]?' '+t[1]:''),'10^'+(t[3]*3)];}):[['Value','zero','']]);
  var n=0,h='';function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st('Split into groups of three digits','From the right: units, thousands, millions, billions, …',grp(intStr)+' → '+(triadsShown.map(function(t){return t[0];}).join(' | ')||'0'));
  st('Spell out each group and add its scale word',null,triadsShown.map(function(t){return t[2]+(t[1]?' '+t[1]:'');}).join(', ')||'zero');
  st('Join the groups together',null,'<b>'+(tc?titleCase(main):main)+'</b>');
  $('steps').innerHTML=h;C.text('stepsIntro','Converting '+grp(intStr)+(decStr?'.'+decStr:'')+' to words.');C.text('stepsTag',scale+' scale');
  last='Number to words — calculatepilot.com/math/number-to-words-calculator.html\n'+raw+' = '+main.replace(/<[^>]+>/g,'');
}
function ordSuffix(n){var m=n%100;if(m>=11&&m<=13)return 'th';switch(n%10){case 1:return 'st';case 2:return 'nd';case 3:return 'rd';default:return 'th';}}

function copy(t,id,lbl){var done=function(){C.text(id,'Copied');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  C.init({root:'ntCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('v',b.getAttribute('data-v'));C.set('fmt',b.getAttribute('data-fmt')||'card');fire('v');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copy results');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copy code');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
