function toRoman(num){const values=[1000,900,500,400,100,90,50,40,10,9,5,4,1];const symbols=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];let result='';for(let i=0;i<values.length;i++){while(num>=values[i]){result+=symbols[i];num-=values[i];}}
return result;}
function calculateRomanNumeral(){const num=parseInt(document.getElementById('number').value)||0;if(num<1||num>3999){document.getElementById('resultValue').textContent='Must be 1-3999';return;}
document.getElementById('resultValue').textContent=toRoman(num);}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('calcForm').addEventListener('input',calculateRomanNumeral);calculateRomanNumeral();});