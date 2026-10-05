function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function calculateBMI() {
  const unitsEl = document.getElementById('units');
  const weightEl = document.getElementById('weight');
  const heightEl = document.getElementById('height');
  if (!unitsEl || !weightEl || !heightEl) return;

  const units = unitsEl.value;
  const weight = parseFloat(weightEl.value);
  const height = parseFloat(heightEl.value);

  setText('resultValue', '—');
  setText('outCategory', '—');
  setText('outHealthyRange', '—');
  setText('validationMessage', '');

  if (!Number.isFinite(weight) || !Number.isFinite(height) || weight <= 0 || height <= 0) {
    setText('validationMessage', 'Enter a weight and height greater than zero.');
    return;
  }

  let bmi;
  if (units === 'imperial') {
    bmi = (weight / (height * height)) * 703;
  } else {
    const heightM = height / 100;
    bmi = weight / (heightM * heightM);
  }

  if (!Number.isFinite(bmi) || bmi <= 0) {
    setText('validationMessage', 'Please check your height and weight.');
    return;
  }

  let category;
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Healthy weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obesity';

  let rangeText;
  if (units === 'imperial') {
    const low = ((18.5 * height * height) / 703).toFixed(1);
    const high = ((24.9 * height * height) / 703).toFixed(1);
    rangeText = low + ' – ' + high + ' lb';
  } else {
    const heightM = height / 100;
    const low = (18.5 * heightM * heightM).toFixed(1);
    const high = (24.9 * heightM * heightM).toFixed(1);
    rangeText = low + ' – ' + high + ' kg';
  }

  setText('resultValue', bmi.toFixed(1));
  setText('outCategory', category);
  setText('outHealthyRange', rangeText);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calcForm');
  const heightField = document.getElementById('height');
  const weightField = document.getElementById('weight');
  const units = document.getElementById('units');
  if (!form || !heightField || !weightField || !units) return;

  function updateLabels() {
    const heightLabel = document.querySelector('label[for="height"]');
    const weightLabel = document.querySelector('label[for="weight"]');
    if (units.value === 'metric') {
      weightField.value = 72;
      heightField.value = 170;
      if (heightLabel) heightLabel.textContent = 'Height (cm)';
      if (weightLabel) weightLabel.textContent = 'Weight (kg)';
    } else {
      weightField.value = 160;
      heightField.value = 67;
      if (heightLabel) heightLabel.textContent = 'Height (inches)';
      if (weightLabel) weightLabel.textContent = 'Weight (lb)';
    }
    setText('inputHelp', 'For adults. BMI is a screening measure, not a diagnosis.');
    calculateBMI();
  }

  units.addEventListener('change', updateLabels);
  form.addEventListener('input', calculateBMI);
  calculateBMI();
});
