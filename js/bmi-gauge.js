(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const CX = 170, CY = 176, R = 134, MIN = 15, MAX = 40;
  const LB = 2.20462, IN = 2.54;
  const clampV = v => Math.min(MAX, Math.max(MIN, v));
  const pt = (v, r) => {
    const a = Math.PI * (1 - (clampV(v) - MIN) / (MAX - MIN));
    return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
  };
  const arc = (v1, v2, r) => {
    const [x1, y1] = pt(v1, r), [x2, y2] = pt(v2, r);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  const T = {
    en: {
      title: 'Your BMI', units: { imperial: 'Imperial', metric: 'Metric' },
      height: 'Height', weight: 'Weight', heightAria: 'Height slider', weightAria: 'Weight slider',
      feetAria: 'Feet', inchesAria: 'Inches', lbAria: 'Weight in pounds', cmAria: 'Height in centimetres', kgAria: 'Weight in kilograms',
      range: 'Healthy weight for your height', prime: 'BMI Prime',
      cats: [
        { key: 'under', label: 'Underweight', advice: d => `You're about <strong>${d}</strong> below the healthy range for your height.` },
        { key: 'normal', label: 'Healthy weight', advice: () => `You're <strong>within the healthy range</strong> for your height.` },
        { key: 'over', label: 'Overweight', advice: d => `You're about <strong>${d}</strong> above the healthy range for your height.` },
        { key: 'obese', label: 'Obese', advice: d => `You're about <strong>${d}</strong> above the healthy range for your height.` }
      ]
    },
    de: {
      title: 'Ihr BMI', units: { imperial: 'Imperial', metric: 'Metrisch' },
      height: 'Größe', weight: 'Gewicht', heightAria: 'Größenregler', weightAria: 'Gewichtsregler',
      feetAria: 'Fuß', inchesAria: 'Zoll', lbAria: 'Gewicht in Pfund', cmAria: 'Größe in Zentimetern', kgAria: 'Gewicht in Kilogramm',
      range: 'Gesundes Gewicht für Ihre Größe', prime: 'BMI-Prime',
      cats: [
        { key: 'under', label: 'Untergewicht', advice: d => `Sie liegen etwa <strong>${d}</strong> unter dem gesunden Bereich für Ihre Größe.` },
        { key: 'normal', label: 'Gesundes Gewicht', advice: () => `Sie liegen <strong>im gesunden Bereich</strong> für Ihre Größe.` },
        { key: 'over', label: 'Übergewicht', advice: d => `Sie liegen etwa <strong>${d}</strong> über dem gesunden Bereich für Ihre Größe.` },
        { key: 'obese', label: 'Adipositas', advice: d => `Sie liegen etwa <strong>${d}</strong> über dem gesunden Bereich für Ihre Größe.` }
      ]
    },
    es: {
      title: 'Tu IMC', units: { imperial: 'Imperial', metric: 'Métrico' },
      height: 'Estatura', weight: 'Peso', heightAria: 'Control de estatura', weightAria: 'Control de peso',
      feetAria: 'Pies', inchesAria: 'Pulgadas', lbAria: 'Peso en libras', cmAria: 'Estatura en centímetros', kgAria: 'Peso en kilogramos',
      range: 'Peso saludable para tu estatura', prime: 'IMC Prime',
      cats: [
        { key: 'under', label: 'Bajo peso', advice: d => `Estás aproximadamente <strong>${d}</strong> por debajo del rango saludable para tu estatura.` },
        { key: 'normal', label: 'Peso saludable', advice: () => `Estás <strong>dentro del rango saludable</strong> para tu estatura.` },
        { key: 'over', label: 'Sobrepeso', advice: d => `Estás aproximadamente <strong>${d}</strong> por encima del rango saludable para tu estatura.` },
        { key: 'obese', label: 'Obesidad', advice: d => `Estás aproximadamente <strong>${d}</strong> por encima del rango saludable para tu estatura.` }
      ]
    },
    fr: {
      title: 'Votre IMC', units: { imperial: 'Impérial', metric: 'Métrique' },
      height: 'Taille', weight: 'Poids', heightAria: 'Curseur de taille', weightAria: 'Curseur de poids',
      feetAria: 'Pieds', inchesAria: 'Pouces', lbAria: 'Poids en livres', cmAria: 'Taille en centimètres', kgAria: 'Poids en kilogrammes',
      range: 'Poids santé pour votre taille', prime: 'IMC Prime',
      cats: [
        { key: 'under', label: 'Insuffisance pondérale', advice: d => `Vous êtes environ <strong>${d}</strong> en dessous de la fourchette saine pour votre taille.` },
        { key: 'normal', label: 'Poids santé', advice: () => `Vous êtes <strong>dans la fourchette saine</strong> pour votre taille.` },
        { key: 'over', label: 'Surpoids', advice: d => `Vous êtes environ <strong>${d}</strong> au-dessus de la fourchette saine pour votre taille.` },
        { key: 'obese', label: 'Obésité', advice: d => `Vous êtes environ <strong>${d}</strong> au-dessus de la fourchette saine pour votre taille.` }
      ]
    }
  };
  const RANGES = [[15, 18.5], [18.5, 25], [25, 30], [30, 40]];

  function initWidget(root) {
    const lang = root.getAttribute('data-lang') || 'en';
    const t = T[lang] || T.en;
    const CATS = t.cats.map((c, i) => ({ ...c, from: RANGES[i][0], to: RANGES[i][1] }));

    const svg = root.querySelector('.bmi-gauge__svg');
    const segG = svg.querySelector('.bmi-gauge__segs');
    const tickG = svg.querySelector('.bmi-gauge__ticks');
    const labG = svg.querySelector('.bmi-gauge__labels');
    const marker = svg.querySelector('.bmi-gauge__marker');

    const titleEl = root.querySelector('.bmi-gauge__title');
    if (titleEl) titleEl.textContent = t.title;
    const rangeDt = root.querySelector('.js-range-label');
    if (rangeDt) rangeDt.textContent = t.range;
    const primeDt = root.querySelector('.js-prime-label');
    if (primeDt) primeDt.textContent = t.prime;
    const hLabel = root.querySelector('.js-height-label');
    if (hLabel) hLabel.textContent = t.height;
    const wLabel = root.querySelector('.js-weight-label');
    if (wLabel) wLabel.textContent = t.weight;
    const impBtn = root.querySelector('[data-unit="imperial"]');
    if (impBtn) impBtn.textContent = t.units.imperial;
    const metBtn = root.querySelector('[data-unit="metric"]');
    if (metBtn) metBtn.textContent = t.units.metric;
    const hRangeElAria = root.querySelector('.js-h-range');
    if (hRangeElAria) hRangeElAria.setAttribute('aria-label', t.heightAria);
    const wRangeElAria = root.querySelector('.js-w-range');
    if (wRangeElAria) wRangeElAria.setAttribute('aria-label', t.weightAria);

    const GAP = 0.18;
    CATS.forEach((c, i) => {
      const s = i === 0 ? c.from : c.from + GAP;
      const e = i === CATS.length - 1 ? c.to : c.to - GAP;
      const p = el('path', { d: arc(s, e, R), class: 'bmi-gauge__seg', stroke: `var(--${c.key})`, 'data-key': c.key });
      segG.appendChild(p);
    });
    for (let v = MIN; v <= MAX; v++) {
      const major = [15, 20, 25, 30, 35, 40].includes(v);
      const [x1, y1] = pt(v, R - 16), [x2, y2] = pt(v, R - (major ? 25 : 21));
      tickG.appendChild(el('line', { x1, y1, x2, y2, class: 'bmi-gauge__tick' + (major ? ' bmi-gauge__tick--major' : '') }));
    }
    [[18.5], [25], [30]].forEach(([v]) => {
      const [x, y] = pt(v, R + 20);
      const tx = el('text', { x, y, class: 'bmi-gauge__label', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      tx.textContent = v; labG.appendChild(tx);
    });
    [[MIN, CX - R], [MAX, CX + R]].forEach(([v, x]) => {
      const tx = el('text', { x, y: CY + 20, class: 'bmi-gauge__label', 'text-anchor': 'middle' });
      tx.textContent = v === MAX ? '40+' : v; labG.appendChild(tx);
    });

    const state = { unit: 'imperial', cm: 177.8, kg: 72.6 };
    const hRange = root.querySelector('.js-h-range');
    const wRange = root.querySelector('.js-w-range');
    const hBox = root.querySelector('.js-h-inputs');
    const wBox = root.querySelector('.js-w-inputs');

    const numField = (cls, unit, wide, label) =>
      `<span class="bmi-gauge__num"><input type="number" inputmode="decimal" class="${cls}" aria-label="${label}"${wide ? ' class="w-wide"' : ''}><span>${unit}</span></span>`;

    function buildInputs() {
      if (state.unit === 'imperial') {
        hBox.innerHTML = numField('js-ft', 'ft', false, t.feetAria) + numField('js-in', 'in', false, t.inchesAria);
        wBox.innerHTML = numField('js-lb w-wide', 'lb', true, t.lbAria);
        Object.assign(hRange, { min: 48, max: 90, step: 1 });
        Object.assign(wRange, { min: 66, max: 440, step: 1 });
      } else {
        hBox.innerHTML = numField('js-cm w-wide', 'cm', true, t.cmAria);
        wBox.innerHTML = numField('js-kg w-wide', 'kg', true, t.kgAria);
        Object.assign(hRange, { min: 122, max: 229, step: 1 });
        Object.assign(wRange, { min: 30, max: 200, step: 0.5 });
      }
      root.querySelectorAll('.bmi-gauge__num input').forEach(inp => {
        inp.addEventListener('input', onNumber);
        inp.addEventListener('change', () => sync(true));
        inp.addEventListener('focus', () => inp.select());
      });
    }

    function onNumber() {
      const v = cls => parseFloat(root.querySelector('.' + cls)?.value);
      if (state.unit === 'imperial') {
        const ft = v('js-ft'), inch = v('js-in') || 0, lb = v('js-lb');
        if (ft >= 3 && ft <= 8 && inch >= 0 && inch < 12) state.cm = (ft * 12 + inch) * IN;
        if (lb >= 50 && lb <= 700) state.kg = lb / LB;
      } else {
        const cm = v('js-cm'), kg = v('js-kg');
        if (cm >= 90 && cm <= 250) state.cm = cm;
        if (kg >= 20 && kg <= 320) state.kg = kg;
      }
      sync(false);
    }

    function setFill(r) {
      const p = ((r.value - r.min) / (r.max - r.min)) * 100;
      r.style.setProperty('--fill', Math.min(100, Math.max(0, p)) + '%');
    }

    function sync(fields) {
      if (state.unit === 'imperial') {
        const totalIn = Math.round(state.cm / IN), lb = Math.round(state.kg * LB);
        hRange.value = totalIn; wRange.value = lb;
        if (fields) {
          root.querySelector('.js-ft').value = Math.floor(totalIn / 12);
          root.querySelector('.js-in').value = totalIn % 12;
          root.querySelector('.js-lb').value = lb;
        }
      } else {
        hRange.value = Math.round(state.cm);
        wRange.value = Math.round(state.kg * 2) / 2;
        if (fields) {
          root.querySelector('.js-cm').value = Math.round(state.cm);
          root.querySelector('.js-kg').value = (Math.round(state.kg * 10) / 10);
        }
      }
      setFill(hRange); setFill(wRange);
      render();
    }

    hRange.addEventListener('input', () => {
      state.cm = state.unit === 'imperial' ? hRange.value * IN : +hRange.value;
      sync(true);
    });
    wRange.addEventListener('input', () => {
      state.kg = state.unit === 'imperial' ? wRange.value / LB : +wRange.value;
      sync(true);
    });
    root.querySelectorAll('.bmi-gauge__units button').forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.unit === state.unit) return;
        state.unit = b.dataset.unit;
        root.querySelectorAll('.bmi-gauge__units button').forEach(x => x.setAttribute('aria-pressed', x === b));
        buildInputs(); sync(true);
      });
    });

    const valueEl = root.querySelector('.bmi-gauge__value');
    const catEl = root.querySelector('.bmi-gauge__cat');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let shown = 23, raf = null;

    function tweenTo(target) {
      cancelAnimationFrame(raf);
      if (reduceMotion) { shown = target; valueEl.textContent = target.toFixed(1); return; }
      const from = shown, start = performance.now(), dur = 420;
      const step = now => {
        const tt = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - tt, 3);
        shown = from + (target - from) * e;
        valueEl.textContent = shown.toFixed(1);
        if (tt < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }

    const fmtWeight = kg => state.unit === 'imperial' ? Math.round(kg * LB) + ' lb' : (Math.round(kg * 10) / 10) + ' kg';

    function render() {
      const m = state.cm / 100;
      const bmi = state.kg / (m * m);
      const idx = bmi < 18.5 ? 0 : bmi < 25 ? 1 : bmi < 30 ? 2 : 3;
      const c = CATS[idx];

      tweenTo(Math.round(bmi * 10) / 10);
      root.style.setProperty('--cat', `var(--${c.key})`);
      root.style.setProperty('--cat-ink', `var(--${c.key}-ink)`);
      catEl.textContent = c.label;

      segG.querySelectorAll('path').forEach(p => p.classList.toggle('is-active', p.dataset.key === c.key));
      const deg = ((clampV(bmi) - MIN) / (MAX - MIN)) * 180;
      marker.style.transform = `rotate(${deg}deg)`;

      const lo = 18.5 * m * m, hi = 24.9 * m * m;
      const rangeEl = root.querySelector('.js-range');
      const primeEl = root.querySelector('.js-prime');
      const adviceEl = root.querySelector('.js-advice');
      if (rangeEl) rangeEl.textContent = state.unit === 'imperial'
        ? `${Math.round(lo * LB)}–${Math.round(hi * LB)} lb`
        : `${(Math.round(lo * 10) / 10)}–${(Math.round(hi * 10) / 10)} kg`;
      if (primeEl) primeEl.textContent = (bmi / 25).toFixed(2);
      const diff = state.kg < lo ? lo - state.kg : state.kg > hi ? state.kg - hi : 0;
      if (adviceEl) adviceEl.innerHTML = c.advice(fmtWeight(diff));
    }

    buildInputs();
    sync(true);
  }

  document.querySelectorAll('.bmi-gauge').forEach(initWidget);
})();
