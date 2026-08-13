function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}
return a;}
function calculateGcdLcm(){const a=parseInt(document.getElementById('numA').value)||0;const b=parseInt(document.getElementById('numB').value)||0;const g=gcd(a,b);const l=g===0?0:Math.abs(a*b)/g;document.getElementById('resultValue').textContent=g;document.getElementById('outLCM').textContent=l.toLocaleString('en-US');}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('calcForm').addEventListener('input',calculateGcdLcm);calculateGcdLcm();});