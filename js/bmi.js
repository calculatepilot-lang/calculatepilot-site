function calculateBMI(){
  const units=document.getElementById('units').value;
  const weight=parseFloat(document.getElementById('weight').value);
  const height=parseFloat(document.getElementById('height').value);
  const result=document.getElementById('resultValue');
  const categoryOut=document.getElementById('outCategory');
  const rangeOut=document.getElementById('outHealthyRange');
  const validation=document.getElementById('validationMessage');

  result.textContent='—';
  categoryOut.textContent='—';
  rangeOut.textContent='—';
  validation.textContent='';

  if(!Number.isFinite(weight)||!Number.isFinite(height)||weight<=0||height<=0){
    validation.textContent='Enter a weight and height greater than zero.';
    return;
  }

  let bmi;
  if(units==='imperial'){
    bmi=(weight/(height*height))*703;
  }else{
    const heightM=height/100;
    bmi=weight/(heightM*heightM);
  }

  if(!Number.isFinite(bmi)||bmi<=0){
    validation.textContent='Please check your height and weight.';
    return;
  }

  let category;
  if(bmi<18.5) category='Underweight';
  else if(bmi<25) category='Healthy weight';
  else if(bmi<30) category='Overweight';
  else category='Obesity';

  let rangeText;
  if(units==='imperial'){
    const low=((18.5*height*height)/703).toFixed(1);
    const high=((24.9*height*height)/703).toFixed(1);
    rangeText=`${low} – ${high} lb`;
  }else{
    const heightM=height/100;
    const low=(18.5*heightM*heightM).toFixed(1);
    const high=(24.9*heightM*heightM).toFixed(1);
    rangeText=`${low} – ${high} kg`;
  }

  result.textContent=bmi.toFixed(1);
  categoryOut.textContent=category;
  rangeOut.textContent=rangeText;
}

document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('calcForm');
  const heightField=document.getElementById('height');
  const weightField=document.getElementById('weight');
  const units=document.getElementById('units');
  const inputHelp=document.getElementById('inputHelp');

  function updateLabels(){
    if(units.value==='metric'){
      weightField.value=72;
      heightField.value=170;
      document.querySelector('label[for="height"]').textContent='Height (cm)';
      document.querySelector('label[for="weight"]').textContent='Weight (kg)';
      inputHelp.textContent='For adults. BMI is a screening measure, not a diagnosis.';
    }else{
      weightField.value=160;
      heightField.value=67;
      document.querySelector('label[for="height"]').textContent='Height (inches)';
      document.querySelector('label[for="weight"]').textContent='Weight (lb)';
      inputHelp.textContent='For adults. BMI is a screening measure, not a diagnosis.';
    }
    calculateBMI();
  }

  units.addEventListener('change',updateLabels);
  form.addEventListener('input',calculateBMI);
  calculateBMI();
});