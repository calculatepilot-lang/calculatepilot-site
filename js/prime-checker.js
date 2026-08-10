function isPrime(num){if(num<2)return false;if(num===2)return true;if(num%2===0)return false;for(let i=3;i<=Math.sqrt(num);i+=2){if(num%i===0)return false;}
return true;}
function primeFactors(num){const factors=[];let n=num;let divisor=2;while(n>1&&divisor<=Math.sqrt(n)+1){while(n%divisor===0){factors.push(divisor);n=n/divisor;}
divisor++;}
if(n>1)factors.push(n);return factors;}
function calculatePrime(){const num=parseInt(document.getElementById('numberInput').value)||0;const prime=isPrime(num);const factors=prime?[num]:primeFactors(num);document.getElementById('resultValue').textContent=prime?'Prime':'Not Prime';document.getElementById('outFactors').textContent=factors.length?factors.join(' \u00d7 '):'N/A';}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('calcForm').addEventListener('input',calculatePrime);calculatePrime();});