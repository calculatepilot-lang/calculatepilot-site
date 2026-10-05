/* Scientific calculator — CalculatePilot (Stitch redesign).
   Hand-written recursive-descent parser (no eval()): grammar
   expr := term (('+'|'-') term)*
   term := factor (('*'|'/') factor)*
   factor := unary ('^' factor)?              // right-associative power
   unary := ('-'|'+') unary | postfix
   postfix := primary ('!')*
   primary := number | const | ident '(' expr ')' | '(' expr ')'
*/
(function(){
var C=window.CPX,esc=C.esc;
var $=function(id){return document.getElementById(id);};
var mem=0,history=[];

function tokenize(s){
  var toks=[],i=0;
  while(i<s.length){
    var c=s[i];
    if(/\s/.test(c)){i++;continue;}
    if(/[0-9.]/.test(c)){var j=i;while(j<s.length&&/[0-9.]/.test(s[j]))j++;toks.push({t:'num',v:parseFloat(s.slice(i,j))});i=j;continue;}
    if(/[a-zA-Z]/.test(c)){var k=i;while(k<s.length&&/[a-zA-Z]/.test(s[k]))k++;toks.push({t:'id',v:s.slice(i,k)});i=k;continue;}
    if('+-*/^!(),'.indexOf(c)>=0){toks.push({t:c});i++;continue;}
    throw new Error('Carácter inesperado "'+c+'" en la expresión.');
  }
  return toks;
}
var FUNCS={
  sin:function(x,deg){return Math.sin(deg?x*Math.PI/180:x);},
  cos:function(x,deg){return Math.cos(deg?x*Math.PI/180:x);},
  tan:function(x,deg){return Math.tan(deg?x*Math.PI/180:x);},
  asin:function(x,deg){var r=Math.asin(x);return deg?r*180/Math.PI:r;},
  acos:function(x,deg){var r=Math.acos(x);return deg?r*180/Math.PI:r;},
  atan:function(x,deg){var r=Math.atan(x);return deg?r*180/Math.PI:r;},
  sqrt:function(x){return Math.sqrt(x);},
  log:function(x){return Math.log10?Math.log10(x):Math.log(x)/Math.LN10;},
  ln:function(x){return Math.log(x);},
  exp:function(x){return Math.exp(x);},
  abs:function(x){return Math.abs(x);}
};
var CONSTS={pi:Math.PI,e:Math.E};

function factorial(n){
  if(n<0||Math.floor(n)!==n)throw new Error('El factorial requiere un entero no negativo.');
  if(n>170)return Infinity;
  var r=1;for(var i=2;i<=n;i++)r*=i;return r;
}

function Parser(toks,deg){
  var pos=0;
  function peek(){return toks[pos];}
  function next(){return toks[pos++];}
  function expect(t){if(!peek()||peek().t!==t)throw new Error('Se esperaba "'+t+'"'+(peek()?' pero se encontró "'+(peek().v||peek().t)+'"':' pero se llegó al final.'));return next();}
  function parseExpr(){
    var v=parseTerm();
    while(peek()&&(peek().t==='+'||peek().t==='-')){var op=next().t;var rhs=parseTerm();v=op==='+'?v+rhs:v-rhs;}
    return v;
  }
  function parseTerm(){
    var v=parseFactor();
    while(peek()&&(peek().t==='*'||peek().t==='/')){var op=next().t;var rhs=parseFactor();if(op==='/'){if(rhs===0)throw new Error('División entre cero.');v=v/rhs;}else v=v*rhs;}
    return v;
  }
  function parseFactor(){
    /* unary +/- wraps the whole power expression, so -3^2 = -(3^2) = -9, matching standard math
       convention (not (-3)^2); the exponent itself may still carry its own unary sign, e.g. 2^-3. */
    if(peek()&&(peek().t==='-'||peek().t==='+')){var op=next().t;var v=parseFactor();return op==='-'?-v:v;}
    return parsePower();
  }
  function parsePower(){
    var v=parsePostfix();
    if(peek()&&peek().t==='^'){next();var rhs=parseFactor();v=Math.pow(v,rhs);}
    return v;
  }
  function parsePostfix(){
    var v=parsePrimary();
    while(peek()&&peek().t==='!'){next();v=factorial(v);}
    return v;
  }
  function parsePrimary(){
    var tok=peek();
    if(!tok)throw new Error('Fin inesperado de la expresión.');
    if(tok.t==='num'){next();return tok.v;}
    if(tok.t==='('){next();var v=parseExpr();expect(')');return v;}
    if(tok.t==='id'){
      next();
      var name=tok.v.toLowerCase();
      if(peek()&&peek().t==='('){
        next();var arg=parseExpr();expect(')');
        if(!FUNCS[name])throw new Error('Función desconocida "'+tok.v+'".');
        return FUNCS[name](arg,deg);
      }
      if(CONSTS.hasOwnProperty(name))return CONSTS[name];
      throw new Error('Identificador desconocido "'+tok.v+'".');
    }
    throw new Error('Token inesperado "'+(tok.v||tok.t)+'".');
  }
  var result=parseExpr();
  if(pos<toks.length)throw new Error('Entrada sobrante inesperada cerca de "'+(toks[pos].v||toks[pos].t)+'".');
  return result;
}
function evaluate(str,deg){
  var withMem=str.replace(/\bans\b/gi,'('+mem+')');
  var toks=tokenize(withMem);
  return Parser(toks,deg);
}

function fmt(x){
  if(!isFinite(x))return x>0?'Infinito':(isNaN(x)?'indefinido (NaN)':'−Infinity');
  if(Math.abs(x)<1e-12)x=0;
  if(Number.isInteger(x)&&Math.abs(x)<1e15)return String(x);
  if(Math.abs(x)>=1e15||Math.abs(x)<1e-9&&x!==0)return x.toExponential(6);
  return parseFloat(x.toPrecision(12)).toString();
}
function tiles(a){$('tiles').innerHTML=a.map(function(t){return '<div class="sx-card"><div class="k">'+esc(t[0])+'</div><b style="font-size:16px;word-break:break-word">'+t[1]+'</b></div>';}).join('');}

function run(){
  var s=$('expr').value,deg=$('angMode').value==='deg';
  C.text('ex1L','Modo de ángulo');C.text('ex1',deg?'Grados':'Radianes');
  C.text('ex2L','Memoria');C.text('ex2',fmt(mem));
  var tg=$('tag');tg.className='sx-ef-grade';
  try{
    var val=evaluate(s,deg);
    var resStr=fmt(val);
    C.text('resultValue',resStr);tg.textContent='valid';
    C.text('interp','Se evalúa con el orden estándar de las operaciones: primero paréntesis y funciones, luego potencias, después ×⁄÷ y por último +⁄−.');
    history.unshift({expr:s,result:resStr});
    if(history.length>50)history.pop();
    tiles(history.slice(0,4).map(function(h){return [h.expr,h.result];}));
    $('steps').innerHTML=history.map(function(h){return '<li><h4 style="font-family:var(--font-mono);font-weight:600">'+esc(h.expr)+' = '+esc(h.result)+'</h4></li>';}).join('');
    C.text('stepsIntro','Todas las expresiones que has evaluado, de la más reciente a la más antigua.');C.text('stepsTag',history.length+' entr'+(history.length===1?'y':'ies'));
    return val;
  }catch(e){
    C.text('resultValue','Error');tg.textContent='invalid';tg.className='sx-ef-grade mid';
    C.text('interp',e.message||'No se pudo analizar esta expresión.');
    return null;
  }
}

function copy(t,id,lbl){var done=function(){C.text(id,'Copiado');setTimeout(function(){C.text(id,lbl);},1800);};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});}
document.addEventListener('DOMContentLoaded',function(){
  var root=$('scCalc');
  root.addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-for')&&b.hasAttribute('data-value')){$('angMode').value=b.getAttribute('data-value');root.querySelectorAll('[data-for="angMode"]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});run();return;}
    if(b.hasAttribute('data-ins')){var el=$('expr');el.value+=b.getAttribute('data-ins');el.focus();run();return;}
    var act=b.getAttribute('data-act');
    if(act==='mc'){mem=0;run();}
    else if(act==='mr'){var v=run();$('expr').value=fmt(mem);run();}
    else if(act==='clr'){$('expr').value='';run();}
    else if(act==='back'){$('expr').value=$('expr').value.slice(0,-1);run();}
    else if(act==='eq'){var val=run();if(val!==null)mem=val;}
  });
  $('expr').addEventListener('input',run);
  $('presets').addEventListener('click',function(e){var b=e.target.closest('button[data-v]');if(!b)return;$('expr').value=b.getAttribute('data-v');run();});
  $('copyBtn').addEventListener('click',function(){var t=history.map(function(h){return h.expr+' = '+h.result;}).join('\n');copy(t||'aún no hay historial','copyTxt','Copiar historial');});
  $('copyEmbed').addEventListener('click',function(){copy($('embedCode').textContent,'copyE','Copiar código');});
  document.querySelectorAll('[data-action="print"]').forEach(function(b){b.addEventListener('click',function(){window.print();});});
  run();
});
})();
