function calculatePregnancyWeightGain(){const units=document.getElementById('units').value;let weight=parseFloat(document.getElementById('weight').value)||0;let height=parseFloat(document.getElementById('height').value)||0;const multiples=document.getElementById('multiples').value;let weightKg=units==='metric'?weight:weight*0.453592;let heightM=units==='metric'?height/100:(height*2.54)/100;const bmi=heightM>0?weightKg/(heightM*heightM):0;let category,low,high;if(multiples==='twins'){if(bmi<18.5){category='Underweight';low=37;high=54;}
else if(bmi<25){category='Normal weight';low=37;high=54;}
else if(bmi<30){category='Overweight';low=31;high=50;}
else{category='Obese';low=25;high=42;}}else{if(bmi<18.5){category='Underweight';low=28;high=40;}
else if(bmi<25){category='Normal weight';low=25;high=35;}
else if(bmi<30){category='Overweight';low=15;high=25;}
else{category='Obese';low=11;high=20;}}
document.getElementById('resultValue').textContent=low+'\u2013'+high+' lb';document.getElementById('outBMI').textContent=bmi.toFixed(1);document.getElementById('outCategory').textContent=category;}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('calcForm').addEventListener('input',calculatePregnancyWeightGain);calculatePregnancyWeightGain();});