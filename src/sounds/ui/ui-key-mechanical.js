// A clicky mechanical switch: a bright click leaf, then the bottom-out thock a few ms later, then a
// small release tick. `click` removes the leaf for a linear switch. Pitch and level vary per press.
export default {
  id: 'ui-key-mechanical',
  name: 'Mechanical Keypress',
  category: 'ui',
  tags: ['keypress', 'key', 'typing', 'keyboard', 'switch', 'clicky', 'mechanical'],
  desc: 'A mechanical keyboard keypress: a bright click, a bottom-out thock and a faint release tick, different every time.',
  dur: 0.11,
  family: 'mechanical',
  moments: ['type'],
  params: {
    pitch: { min: 2000, max: 5000, def: 3520, unit: 'Hz', desc: 'Tuning of the bright click leaf, varied slightly per press' },
    click: { min: 0, max: 1, def: 0.7, desc: 'Loudness of the click leaf and release tick: 0 a linear switch, 1 clicky' },
    thock: { min: 0, max: 1, def: 0.6, desc: 'Loudness of the bottom-out thock: 0 light, 1 heavy' },
  },
  play(T, out, t, p) {
    const v = 1 + 0.04 * T.rand(-1, 1);
    const l = 1 + 0.1 * T.rand(-1, 1);
    T.bell(out, t, { f: p.pitch * v, partials: [[1, 1, 1], [2.7, 0.4, 0.6]], drift: 0.97, dur: 0.03, peak: 0.016 * p.click * l, a: 0.002 });
    T.noise(out, t, { filter: 'highpass', f: 3500, q: 0.8, dur: 0.012, peak: (0.01 + 0.024 * p.click) * l, a: 0.002 });
    const at = t + 0.014;
    T.osc(out, at, { f: 260 * v, to: 160 * v, dur: 0.045, peak: (0.016 + 0.048 * p.thock) * l, a: 0.002 });
    T.noise(out, at, { filter: 'lowpass', f: 1400, q: 0.7, dur: 0.02, peak: (0.024 + 0.048 * p.thock) * l, a: 0.002 });
    T.noise(out, t + 0.085, { filter: 'highpass', f: 3500, q: 0.8, dur: 0.01, peak: (0.006 + 0.01 * p.click) * l, a: 0.002 });
  },
};
