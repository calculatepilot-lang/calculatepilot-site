/* Number base converter — CalculatePilot (Stitch redesign).
   Integer part: exact BigInt accumulation (parse) and repeated division (render). Fractional part: exact BigInt
   fraction num/den, converted digit by digit via repeated multiplication (render) — no floating point anywhere. */
(function(){
var C=window.CPX,$=C.$,esc=C.esc,last='';
var ALPHA='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function digitVal(c){var i=ALPHA.indexOf(c.toUpperCase());return i;}
function grp(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,',');}

function parseInBase(str,base){
  str=String(str||'').trim();
  var neg=false;if(str[0]==='+'||str[0]==='-'){neg=str[0]==='-';str=str.slice(1);}
  var parts=str.split('.');
  if(parts.length>2)return {err:'Es ist nur ein Dezimalzeichen erlaubt.'};
  var intPart=parts[0]||'0',fracPart=parts[1]||'';
  if(!intPart&&!fracPart)return {err:'Geben Sie einen Wert ein.'};
  var b=BigInt(base);
  function checkDigits(s){for(var i=0;i<s.length;i++){var d=digitVal(s[i]);if(d<0||d>=base)return false;}return true;}
  if((intPart&&!checkDigits(intPart))||(fracPart&&!checkDigits(fracPart)))return {err:'"'+str+'" enthält eine Ziffer, die in der Basis nicht gültig ist '+base+' (gültige Ziffern: '+ALPHA.slice(0,base)+').'};
  var intVal=0n;
  for(var i=0;i<intPart.length;i++)intVal=intVal*b+BigInt(digitVal(intPart[i]));
  var fracNum=0n,fracDen=1n;
  for(i=0;i<fracPart.length;i++){fracNum=fracNum*b+BigInt(digitVal(fracPart[i]));fracDen*=b;}
  return {neg:neg,intVal:intVal,fracNum:fracNum,fracDen:fracDen,intDigits:intPart.length,fracDigits:fracPart.length};
}
function renderInt(v,base){
  if(v===0n)return '0';
  var b=BigInt(base),digits=[];
  while(v>0n){digits.push(ALPHA[Number(v%b)]);v/=b;}
  return digits.reverse().join('');
}
function renderFrac(num,den,base,maxDigits){
  var b=BigInt(base),digits=[],exact=false;
  for(var i=0;i<maxDigits;i++){
    if(num===0n){exact=true;break;}
    num*=b;
    var d=num/den;
    digits.push(ALPHA[Number(d)]);
    num-=d*den;
  }
  return {digits:digits.join(''),exact:exact};
}
function fmtVal(neg,intVal,fracNum,fracDen,base,maxFrac){
  var s=(neg&&(intVal!==0n||fracNum!==0n)?'−':'')+renderInt(intVal,base);
  if(fracDen>1n){var f=renderFrac(fracNum,fracDen,base,maxFrac===undefined?20:maxFrac);if(f.digits)s+='.'+f.digits+(f.exact?'':'…');}
  return s;
}
function toDecimalString(neg,intVal,fracNum,fracDen){
  /* exact decimal string using base-10 rendering since fraction is already base-agnostic (BigInt) */
  var s=(neg&&(intVal!==0n||fracNum!==0n)?'−':'')+intVal.toString();
  if(fracDen>1n){
    var f=renderFrac(fracNum,fracDen,10,30);
    if(f.digits)s+='.'+f.digits+(f.exact?'':'…');
  }
  return s;
}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word;font-family:var(--font-mono)">'+t[1]+'</b><p>'+esc(t[2]||'')+'</p></div>';}).join('');}
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Korrigieren Sie die Eingabe oben, um ein Ergebnis zu sehen.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function refView(neg,intVal,fracNum,fracDen){
  var bases=[[2,'Binär'],[8,'Oktal'],[10,'Dezimalzahl'],[16,'Hexadezimal']];
  var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">';
  bases.forEach(function(b){
    html+='<div class="sx-card"><div class="k">'+b[1]+' (base '+b[0]+')</div><b style="font-family:var(--font-mono);font-size:15px;word-break:break-all">'+esc(fmtVal(neg,intVal,fracNum,fracDen,b[0],12))+'</b></div>';
  });
  html+='</div>';
  $('viz').innerHTML=html;
}

function populateSelects(){
  var opts='';for(var i=2;i<=36;i++)opts+='<option value="'+i+'">Base '+i+(i===2?' (binary)':i===8?' (octal)':i===10?' (decimal)':i===16?' (hexadecimal)':'')+'</option>';
  $('from').innerHTML=opts;$('to').innerHTML=opts;
  $('from').value='10';$('to').value='2';
}

function compute(){
  var tg=$('tag');tg.className='sx-ef-grade';$('err').hidden=true;
  var fromBase=parseInt($('from').value,10),toBase=parseInt($('to').value,10);
  var p=parseInBase($('v').value,fromBase);
  if(p.err)return fail(p.err);
  C.html('fxNow',esc($('v').value)+' (base '+fromBase+') → Basis '+toBase);
  var resultStr=fmtVal(p.neg,p.intVal,p.fracNum,p.fracDen,toBase,20);
  var decStr=toDecimalString(p.neg,p.intVal,p.fracNum,p.fracDen);
  C.text('heroLbl','Ergebnis (Basis '+toBase+')');C.text('resultValue',resultStr);tg.textContent='base '+fromBase+' → Basis '+toBase;
  C.text('ex1L','Dezimalwert');C.text('ex1',decStr);
  var expansion=renderInt(p.intVal,fromBase).split('').map(function(d,idx,arr){var place=arr.length-1-idx;return digitVal(d)+'×'+fromBase+(place?'<sup>'+place+'</sup>':'');}).join(' + ');
  C.text('ex2L','Stellenwertentwicklung (ganzzahliger Teil)');C.html('ex2',expansion||'0');
  C.text('interp','Exakt umgerechnet mit BigInt-Arithmetik — der ganzzahlige Teil durch wiederholte Division, der gebrochene Teil durch wiederholte Multiplikation eines exakten Bruchs, sodass keine Gleitkomma-Rundung auftritt.');
  tiles([
    ['Eingabe',esc($('v').value)+' (base '+fromBase+')',''],
    ['Verwendete Ziffern',ALPHA.slice(0,fromBase),'gültiges Alphabet für die Basis '+fromBase],
    ['Ganzzahliger Teil (dezimal)',grp(p.intVal.toString()),''],
    ['Gebrochener Teil exakt in Basis '+toBase+'?',p.fracDen>1n?(renderFrac(p.fracNum,p.fracDen,toBase,20).exact?'Ja':'Nein — periodisch, auf 20 Stellen abgeschnitten'):'— (kein Bruchteil)','']
  ]);
  refView(p.neg,p.intVal,p.fracNum,p.fracDen);C.text('vizTag','dezimal = '+decStr);
  var n=0,h='';function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st('Eingabe in Basis lesen '+fromBase,'Jede Ziffer wird mit ihrem Stellenwert multipliziert und aufsummiert.',esc($('v').value)+' (base '+fromBase+') = <b>'+decStr+'</b> dezimal');
  if(toBase!==10){
    var steps2=[],v2=p.intVal,guard=0;
    while(v2>0n&&guard<40){var d2=v2%BigInt(toBase);steps2.push(v2.toString()+' ÷ '+toBase+' = '+(v2/BigInt(toBase)).toString()+' remainder '+d2.toString());v2/=BigInt(toBase);guard++;}
    st('Ganzzahligen Teil in Basis umrechnen '+toBase+' durch wiederholte Division','Teilen Sie durch '+toBase+' jeweils; die Reste, von unten nach oben gelesen, sind die Ziffern.',(steps2.length?steps2.slice(0,6).join('<br>')+(steps2.length>6?'<br>…':''):'Wert ist 0')+'<br>Ergebnis: <b>'+renderInt(p.intVal,toBase)+'</b>');
  }
  if(p.fracDen>1n){
    var f=renderFrac(p.fracNum,p.fracDen,toBase,20);
    st('Gebrochenen Teil durch wiederholte Multiplikation umrechnen','Multiplizieren Sie den Bruch mit '+toBase+'; der entstehende ganzzahlige Teil ist die nächste Ziffer; wiederholen Sie dies mit dem Rest.','Ergebnis: <b>0,'+f.digits+(f.exact?'':'…')+'</b>'+(f.exact?' (exact)':' (periodisch — auf 20 Stellen abgeschnitten)'));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Umrechnung '+esc($('v').value)+' aus Basis '+fromBase+' zur Basis '+toBase+'.');C.text('stepsTag','base '+fromBase+' → '+toBase);
  last='Zahlensystem-Umrechnung — calculatepilot.com/math/number-base-converter.html\n'+$('v').value+' (base '+fromBase+') = '+resultStr.replace(/<[^>]+>/g,'')+' (base '+toBase+')\ndecimal: '+decStr;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Kopiert');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  populateSelects();
  C.init({root:'nbCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('v',b.getAttribute('data-v'));C.set('from',b.getAttribute('data-from'));C.set('to',b.getAttribute('data-to'));fire('v');});
  $('swap').addEventListener('click',function(){var t=$('from').value;C.set('from',$('to').value);C.set('to',t);fire('v');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Ergebnisse kopieren');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Code kopieren');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
