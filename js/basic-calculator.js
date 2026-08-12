function initBasicCalculator(root){const mainDisplay=root.querySelector('[data-display-main]');const subDisplay=root.querySelector('[data-display-sub]');let current='0';let previous=null;let operator=null;let resetOnNextDigit=false;function formatNumber(numStr){const num=parseFloat(numStr);if(isNaN(num))return'0';if(Math.abs(num)>=1e12||(Math.abs(num)<1e-9&&num!==0)){return num.toExponential(6);}
if(numStr.endsWith('.'))return numStr;return num.toLocaleString('en-US',{maximumFractionDigits:10});}
function updateDisplay(){mainDisplay.textContent=formatNumber(current);if(operator&&previous!==null){subDisplay.textContent=`${formatNumber(previous)} ${operator}`;}else{subDisplay.textContent='';}}
function inputDigit(d){if(resetOnNextDigit){current=d;resetOnNextDigit=false;}else{current=current==='0'?d:current+d;}}
function inputDecimal(){if(resetOnNextDigit){current='0.';resetOnNextDigit=false;return;}
if(!current.includes('.'))current+='.';}
function compute(a,op,b){switch(op){case'+':return a+b;case'−':return a-b;case'×':return a*b;case'÷':return b===0?NaN:a/b;default:return b;}}
function inputOperator(op){if(operator&&!resetOnNextDigit){previous=compute(parseFloat(previous),operator,parseFloat(current));current=String(previous);}else{previous=parseFloat(current);}
operator=op;resetOnNextDigit=true;}
function inputEquals(){if(operator===null||previous===null)return;const result=compute(parseFloat(previous),operator,parseFloat(current));current=isNaN(result)?'Error':String(result);previous=null;operator=null;resetOnNextDigit=true;}
function clearAll(){current='0';previous=null;operator=null;resetOnNextDigit=false;}
function backspace(){if(resetOnNextDigit)return;current=current.length>1?current.slice(0,-1):'0';}
function percent(){current=String(parseFloat(current)/100);}
function toggleSign(){current=String(parseFloat(current)*-1);}
root.querySelectorAll('[data-digit]').forEach(btn=>{btn.addEventListener('click',()=>{inputDigit(btn.dataset.digit);updateDisplay();});});root.querySelectorAll('[data-op]').forEach(btn=>{btn.addEventListener('click',()=>{inputOperator(btn.dataset.op);updateDisplay();});});root.querySelectorAll('[data-action]').forEach(btn=>{btn.addEventListener('click',()=>{const action=btn.dataset.action;if(action==='clear')clearAll();else if(action==='equals')inputEquals();else if(action==='decimal')inputDecimal();else if(action==='backspace')backspace();else if(action==='percent')percent();else if(action==='sign')toggleSign();updateDisplay();});});updateDisplay();}
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-calc-root]').forEach(initBasicCalculator);});