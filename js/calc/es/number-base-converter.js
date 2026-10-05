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
  if(parts.length>2)return {err:'Solo se permite un punto decimal.'};
  var intPart=parts[0]||'0',fracPart=parts[1]||'';
  if(!intPart&&!fracPart)return {err:'Introduce un valor.'};
  var b=BigInt(base);
  function checkDigits(s){for(var i=0;i<s.length;i++){var d=digitVal(s[i]);if(d<0||d>=base)return false;}return true;}
  if((intPart&&!checkDigits(intPart))||(fracPart&&!checkDigits(fracPart)))return {err:'"'+str+'" contiene un dígito no válido en la base '+base+' (dígitos válidos: '+ALPHA.slice(0,base)+').'};
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
function fail(msg){$('err').hidden=false;C.text('errT',msg);C.text('resultValue','—');C.text('ex1','—');C.text('ex2','—');C.text('tag','—');C.text('interp','Corrige los datos de arriba para ver un resultado.');$('tiles').innerHTML='';$('steps').innerHTML='';$('viz').innerHTML='';C.text('vizTag','—');}

function refView(neg,intVal,fracNum,fracDen){
  var bases=[[2,'Binario'],[8,'Octal'],[10,'Decimal'],[16,'Hexadecimal']];
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
  C.html('fxNow',esc($('v').value)+' (base '+fromBase+') → base '+toBase);
  var resultStr=fmtVal(p.neg,p.intVal,p.fracNum,p.fracDen,toBase,20);
  var decStr=toDecimalString(p.neg,p.intVal,p.fracNum,p.fracDen);
  C.text('heroLbl','Resultado (base '+toBase+')');C.text('resultValue',resultStr);tg.textContent='base '+fromBase+' → base '+toBase;
  C.text('ex1L','Valor decimal');C.text('ex1',decStr);
  var expansion=renderInt(p.intVal,fromBase).split('').map(function(d,idx,arr){var place=arr.length-1-idx;return digitVal(d)+'×'+fromBase+(place?'<sup>'+place+'</sup>':'');}).join(' + ');
  C.text('ex2L','Expansión posicional (parte entera)');C.html('ex2',expansion||'0');
  C.text('interp','Convertido exactamente con aritmética BigInt: la parte entera mediante divisiones repetidas y la parte fraccionaria mediante multiplicaciones repetidas de una fracción exacta, de modo que no hay redondeo de coma flotante.');
  tiles([
    ['Entrada',esc($('v').value)+' (base '+fromBase+')',''],
    ['Dígitos usados',ALPHA.slice(0,fromBase),'alfabeto válido para la base '+fromBase],
    ['Parte entera (decimal)',grp(p.intVal.toString()),''],
    ['Parte fraccionaria exacta en base '+toBase+'?',p.fracDen>1n?(renderFrac(p.fracNum,p.fracDen,toBase,20).exact?'Sí':'No — se repite, truncado a 20 dígitos'):'— (sin fracción)','']
  ]);
  refView(p.neg,p.intVal,p.fracNum,p.fracDen);C.text('vizTag','decimal = '+decStr);
  var n=0,h='';function st(t,d,e){n++;h+='<li><span class="n">'+n+'</span><h4>'+t+'</h4>'+(d?'<p>'+d+'</p>':'')+'<span class="eq">'+e+'</span></li>';}
  st('Lee la entrada en base '+fromBase,'Cada dígito se multiplica por su valor posicional y se suman.',esc($('v').value)+' (base '+fromBase+') = <b>'+decStr+'</b> en decimal');
  if(toBase!==10){
    var steps2=[],v2=p.intVal,guard=0;
    while(v2>0n&&guard<40){var d2=v2%BigInt(toBase);steps2.push(v2.toString()+' ÷ '+toBase+' = '+(v2/BigInt(toBase)).toString()+' remainder '+d2.toString());v2/=BigInt(toBase);guard++;}
    st('Convierte la parte entera a base '+toBase+' mediante divisiones repetidas','Divide entre '+toBase+' cada vez; los residuos, leídos de abajo hacia arriba, son los dígitos.',(steps2.length?steps2.slice(0,6).join('<br>')+(steps2.length>6?'<br>…':''):'el valor es 0')+'<br>resultado: <b>'+renderInt(p.intVal,toBase)+'</b>');
  }
  if(p.fracDen>1n){
    var f=renderFrac(p.fracNum,p.fracDen,toBase,20);
    st('Convierte la parte fraccionaria mediante multiplicaciones repetidas','Multiplica la fracción por '+toBase+'; la parte entera obtenida es el siguiente dígito; repite con el resto.','resultado: <b>0.'+f.digits+(f.exact?'':'…')+'</b>'+(f.exact?' (exact)':' (se repite — truncado a 20 dígitos)'));
  }
  $('steps').innerHTML=h;C.text('stepsIntro','Convirtiendo '+esc($('v').value)+' desde la base '+fromBase+' en base '+toBase+'.');C.text('stepsTag','base '+fromBase+' → '+toBase);
  last='Conversión de bases — calculatepilot.com/math/number-base-converter.html\n'+$('v').value+' (base '+fromBase+') = '+resultStr.replace(/<[^>]+>/g,'')+' (base '+toBase+')\ndecimal: '+decStr;
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
function fire(id){var el=$(id);if(el)el.dispatchEvent(new Event('input',{bubbles:true}));}
document.addEventListener('DOMContentLoaded',function(){
  populateSelects();
  C.init({root:'nbCalc',compute:compute});
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;C.set('v',b.getAttribute('data-v'));C.set('from',b.getAttribute('data-from'));C.set('to',b.getAttribute('data-to'));fire('v');});
  $('swap').addEventListener('click',function(){var t=$('from').value;C.set('from',$('to').value);C.set('to',t);fire('v');});
  $('copyBtn').addEventListener('click',function(){if(last)copy(last,'copyTxt','Copiar resultados');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  $('calcForm').addEventListener('submit',function(){if(window.innerWidth<1024)$('results').scrollIntoView({behavior:'smooth',block:'start'});});
});
})();
