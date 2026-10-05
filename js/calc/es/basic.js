/* Basic calculator — CalculatePilot (Stitch redesign).
   Behaves like a physical four-function calculator: each operator applies immediately, left to right
   (not full algebraic order of operations) — the same convention as every handheld calculator. */
(function(){
var C=window.CPX,esc=C.esc;
var $=function(id){return document.getElementById(id);};
var display='0',acc=null,pendingOp=null,justEq=false,mem=0,history=[];

function fmt(x){
  if(!isFinite(x))return x>0?'Error: desbordamiento':'Error: indefinido';
  if(Math.abs(x)<1e-15)x=0;
  var s=Math.abs(x)<1e15&&Math.abs(x)>=1e-9||x===0?
    (Number.isInteger(x)?String(x):parseFloat(x.toPrecision(12)).toString()):
    x.toExponential(6);
  return s;
}
function opSym(op){return {add:'+',sub:'−',mul:'×',div:'÷'}[op];}
function apply(op,a,b){
  if(op==='add')return a+b;if(op==='sub')return a-b;if(op==='mul')return a*b;
  if(op==='div')return b===0?NaN:a/b;
}
function render(){
  $('bcMain').textContent=display;
  $('bcExpr').textContent=(acc!==null?fmt(acc)+' '+opSym(pendingOp)+' ':'')+(pendingOp&&!justEq?'':'');
  $('memTag').textContent='MEM: '+fmt(mem);
}
function pushHistory(exprStr,resultStr){
  history.unshift({expr:exprStr,result:resultStr});
  if(history.length>50)history.pop();
  C.text('resultValue',resultStr);
  C.text('ex1',fmt(mem));
  $('tiles').innerHTML=history.slice(0,4).map(function(h){return '<div class="sx-card"><div class="k">'+esc(h.expr)+'</div><b style="font-size:16px">'+esc(h.result)+'</b></div>';}).join('');
  $('steps').innerHTML=history.map(function(h){return '<li><h4 style="font-family:var(--font-mono);font-weight:600">'+esc(h.expr)+' = '+esc(h.result)+'</h4></li>';}).join('');
  C.text('stepsTag',history.length+' entr'+(history.length===1?'y':'ies'));
}

function pressDigit(d){
  if(justEq){display='0';acc=null;pendingOp=null;justEq=false;}
  if(display==='0'&&d!=='.')display=d;
  else if(d==='.'&&display.indexOf('.')>=0){/* ignore extra dot */}
  else display+=d;
  render();
}
function pressOp(op){
  var cur=parseFloat(display);
  if(pendingOp&&!justEq){
    acc=apply(pendingOp,acc,cur);
  }else{
    acc=cur;
  }
  pendingOp=op;justEq=false;display='0';
  render();
}
function pressEq(){
  if(pendingOp===null)return;
  var cur=parseFloat(display),a=acc,b=cur,op=pendingOp;
  var res=apply(op,a,b);
  var exprStr=fmt(a)+' '+opSym(op)+' '+fmt(b);
  display=fmt(res);
  pushHistory(exprStr,display);
  acc=null;pendingOp=null;justEq=true;
  render();
}
function pressUnary(kind){
  var cur=parseFloat(display),res,label;
  if(kind==='sqrt'){if(cur<0){display='Error: negativo';render();return;}res=Math.sqrt(cur);label='√('+fmt(cur)+')';}
  else if(kind==='sq'){res=cur*cur;label='('+fmt(cur)+')²';}
  else if(kind==='inv'){if(cur===0){display='Error: división entre 0';render();return;}res=1/cur;label='1/('+fmt(cur)+')';}
  else if(kind==='pct'){res=cur/100;label=fmt(cur)+'%';}
  display=fmt(res);
  pushHistory(label,display);
  justEq=true;
  render();
}
function act(a){
  if(a==='c'){display='0';render();return;}
  if(a==='ac'){display='0';acc=null;pendingOp=null;justEq=false;render();return;}
  if(a==='pm'){if(display!=='0')display=display[0]==='-'?display.slice(1):'-'+display;render();return;}
  if(a==='dot'){pressDigit('.');return;}
  if(a==='mc'){mem=0;render();return;}
  if(a==='mr'){display=fmt(mem);justEq=true;render();return;}
  if(a==='mplus'){mem+=parseFloat(display)||0;render();return;}
  if(a==='mminus'){mem-=parseFloat(display)||0;render();return;}
  if(a==='sqrt'||a==='sq'||a==='inv'||a==='pct'){pressUnary(a);return;}
  if(a==='eq'){pressEq();return;}
  if(['add','sub','mul','div'].indexOf(a)>=0){pressOp(a);return;}
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  var grid=$('bcGrid');
  grid.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-dig'))pressDigit(b.getAttribute('data-dig'));
    else if(b.hasAttribute('data-act'))act(b.getAttribute('data-act'));
  });
  document.addEventListener('keydown',function(e){
    if(!document.getElementById('bcCalc'))return;
    var k=e.key;
    if(/^[0-9]$/.test(k)){pressDigit(k);e.preventDefault();}
    else if(k==='.'){pressDigit('.');e.preventDefault();}
    else if(k==='+'){act('add');e.preventDefault();}
    else if(k==='-'){act('sub');e.preventDefault();}
    else if(k==='*'){act('mul');e.preventDefault();}
    else if(k==='/'){act('div');e.preventDefault();}
    else if(k==='Enter'||k==='='){act('eq');e.preventDefault();}
    else if(k==='Escape'){act('ac');e.preventDefault();}
    else if(k==='Backspace'){display=display.length>1?display.slice(0,-1):'0';render();e.preventDefault();}
    else if(k==='%'){act('pct');e.preventDefault();}
  });
  $('copyBtn').addEventListener('click',function(){
    var t=history.map(function(h){return h.expr+' = '+h.result;}).join('\n');
    copy(t||'aún no hay historial','copyTxt','Copiar historial');
  });
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  document.querySelectorAll('[data-action="print"]').forEach(function(b){b.addEventListener('click',function(){window.print();});});
  render();
});
})();
