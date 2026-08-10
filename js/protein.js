function calculateProtein(){const weight=parseFloat(document.getElementById('weightKg').value)||0;const activity=document.getElementById('activityLevel').value;let lowFactor,highFactor;if(activity==='sedentary'){lowFactor=0.8;highFactor=1.0;}
else if(activity==='moderate'){lowFactor=1.2;highFactor=1.6;}
else{lowFactor=1.6;highFactor=2.2;}
const lower=weight*lowFactor;const upper=weight*highFactor;document.getElementById('resultValue').textContent=`${Math.round(lower)}-${Math.round(upper)}g`;document.getElementById('outLower').textContent=Math.round(lower)+'g';document.getElementById('outUpper').textContent=Math.round(upper)+'g';}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('calcForm').addEventListener('input',calculateProtein);calculateProtein();});