// A clean electric hum built from sine harmonics, each a pair split by a fraction of a hertz
// on opposite sides so the hum throbs slowly, a thin resonant sheen of noise sweeping the other way in
// each ear, and a light traffic of tiny data ticks that cross the field. Glassy and exact, where the
// room hum is buzzy and warm.
export default {
  id: 'ambience-grid-hum',
  name: 'Grid Hum',
  category: 'ambience',
  tags: ['grid', 'hum', 'electric', 'digital', 'neon', 'data', 'power', 'wide', 'bed'],
  desc: 'The clean electric hum of a vast digital grid: a pure throbbing tone with a glassy sheen and tiny data ticks crossing it. For cyber scenes.',
  dur: 8,
  family: 'synthetic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, fades included' },
    pitch: { min: 55, max: 220, def: 110, unit: 'Hz', desc: 'Fundamental of the hum, the harmonics follow it' },
    sheen: { min: 0, max: 1, def: 0.4, desc: 'Level of the glassy resonant sheen above the hum: 0 none, 1 clear' },
    traffic: { min: 0, max: 1, def: 0.4, desc: 'How many tiny data ticks cross the grid: 0 none, 1 busy' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const fade = Math.min(1.2, L * 0.3);
    const win = (x) => Math.min(1, x / 0.6, (L - x) / 0.8);
    const f = p.pitch;
    // the hum: harmonic sines, the higher ones wider apart and quieter
    [[1, 1, 0.1], [2, 0.5, 0.35], [3, 0.35, 0.5], [4, 0.22, 0.65], [6, 0.12, 0.8]].forEach((h, k) => {
      [-1, 1].forEach((s) => {
        T.osc(T.pan(out, t, { x: s * h[2] }), t, {
          f: f * h[0] + s * (0.12 + 0.07 * k), dur: L, peak: 0.015 * h[1], a: fade, s: 1, d: 0.02, r: fade,
          trem: { rate: 0.2 + 0.06 * k, depth: 0.2 },
        });
      });
    });
    // the sheen: a very narrow band of noise, swept in opposite directions in the two ears
    [-1, 1].forEach((s) => {
      T.noise(T.pan(out, t, { x: s * 0.85 }), t, {
        filter: 'bandpass', f: s < 0 ? 2300 : 4600, to: s < 0 ? 4600 : 2300, q: 14, dur: L, peak: 0.2 * p.sheen,
        a: fade, s: 1, d: 0.02, r: fade,
      });
    });
    // traffic: tiny ticks with a pitched blip, each one crossing from one side to the other
    const n = Math.round(L * 7 * p.traffic);
    for (let k = 0; k < n; k++) {
      const at = T.rand(0.3, L - 0.5);
      const dir = T.rand() < 0.5 ? 1 : -1;
      const w = win(at);
      const lane = T.pan(out, t + at, { x: -0.8 * dir, to: 0.8 * dir, dur: 0.3 });
      T.tick(lane, t + at, {
        f: T.rand(5000, 9000), q: 5, dur: 0.012, peak: 0.006 * w, blip: T.rand(1400, 3200), blipPeak: 0.003 * w, blipDur: 0.045, jitter: 0.5,
      });
    }
  },
};
