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

  const CATS = [
    { key: 'under',  label: 'Underweight',    from: 15,   to: 18.5, advice: d => `You're about <strong>${d}</strong> below the healthy range for your height.` },
    { key: 'normal', label: 'Healthy weight', from: 18.5, to: 25,   advice: () => `You're <strong>within the healthy range</strong> for your height.` },
    { key: 'over',   label: 'Overweight',     from: 25,   to: 30,   advice: d => `You're about <strong>${d}</strong> above the healthy range for your height.` },
    { key: 'obese',  label: 'Obese',          from: 30,   to: 40,   advice: d => `You're about <strong>${d}</strong> above the healthy range for your height.` }
  ];

  function initWidget(root) {
    const svg = root.querySelector('.bmi-gauge__svg');
    const segG = svg.querySelector('.bmi-gauge__segs');
    const tickG = svg.querySelector('.bmi-gauge__ticks');
    const labG = svg.querySelector('.bmi-gauge__labels');
    const marker = svg.querySelector('.bmi-gauge__marker');

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
      const t = el('text', { x, y, class: 'bmi-gauge__label', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      t.textContent = v; labG.appendChild(t);
    });
    [[MIN, CX - R], [MAX, CX + R]].forEach(([v, x]) => {
      const t = el('text', { x, y: CY + 20, class: 'bmi-gauge__label', 'text-anchor': 'middle' });
      t.textContent = v === MAX ? '40+' : v; labG.appendChild(t);
    });

    const state = { unit: 'imperial', cm: 177.8, kg: 72.6 };
    const hRange = root.querySelector('.js-h-range');
    const wRange = root.querySelector('.js-w-range');
    const hBox = root.querySelector('.js-h-inputs');
    const wBox = root.querySelector('.js-w-inputs');
    const uid = Math.random().toString(36).slice(2, 8);

    const numField = (cls, unit, wide, label) =>
      `<span class="bmi-gauge__num"><input type="number" inputmode="decimal" class="${cls}" aria-label="${label}"${wide ? ' class="w-wide"' : ''}><span>${unit}</span></span>`;

    function buildInputs() {
      if (state.unit === 'imperial') {
        hBox.innerHTML = numField('js-ft', 'ft', false, 'Feet') + numField('js-in', 'in', false, 'Inches');
        wBox.innerHTML = numField('js-lb w-wide', 'lb', true, 'Weight in pounds');
        Object.assign(hRange, { min: 48, max: 90, step: 1 });
        Object.assign(wRange, { min: 66, max: 440, step: 1 });
      } else {
        hBox.innerHTML = numField('js-cm w-wide', 'cm', true, 'Height in centimetres');
        wBox.innerHTML = numField('js-kg w-wide', 'kg', true, 'Weight in kilograms');
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
        const t = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - t, 3);
        shown = from + (target - from) * e;
        valueEl.textContent = shown.toFixed(1);
        if (t < 1) raf = requestAnimationFrame(step);
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
