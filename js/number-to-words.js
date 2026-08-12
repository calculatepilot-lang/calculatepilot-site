function numberToWords(num){if(num===0)return'zero';const ones=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];const scales=['','thousand','million','billion','trillion'];function threeDigits(n){let s='';if(n>=100){s+=ones[Math.floor(n/100)]+' hundred';n%=100;if(n>0)s+=' ';}
if(n>=20){s+=tens[Math.floor(n/10)];if(n%10>0)s+='-'+ones[n%10];}else if(n>0){s+=ones[n];}
return s;}
let negative=num<0;num=Math.abs(Math.floor(num));let groups=[];if(num===0)groups=[0];while(num>0){groups.push(num%1000);num=Math.floor(num/1000);}
let parts=[];for(let i=groups.length-1;i>=0;i--){if(groups[i]===0)continue;parts.push(threeDigits(groups[i])+(scales[i]?' '+scales[i]:''));}
return(negative?'negative ':'')+parts.join(' ');}
function calculateNumberToWords(){const num=parseFloat(document.getElementById('numberInput').value)||0;const words=numberToWords(num);document.getElementById('resultValue').textContent=words.charAt(0).toUpperCase()+words.slice(1);}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('calcForm').addEventListener('input',calculateNumberToWords);calculateNumberToWords();});