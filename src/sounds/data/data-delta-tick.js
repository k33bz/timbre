// A KPI or table cell changing by a step: two quick soft chirps, rising when the number went up and
// falling when it went down (a touch quieter, so a long column of drops stays calm). `size` widens
// the interval between the two chirps. Soft family; short enough to fire on every cell of a table.
export default {
  id: 'data-delta-tick',
  name: 'Delta Tick',
  category: 'data',
  tags: ['delta', 'change', 'kpi', 'up', 'down', 'tick', 'chirp', 'metric'],
  desc: 'A tiny two-note chirp for a number that changed: rising when it went up, falling when it went down.',
  dur: 0.15,
  family: 'soft',
  moments: ['data-tick'],
  params: {
    up: { min: 0, max: 1, def: 1, step: 1, role: 'up', desc: '1 plays a rising chirp (the value went up), 0 a falling, slightly quieter one' },
    pitch: { min: 400, max: 1200, def: 700, unit: 'Hz', desc: 'Note of the lower chirp' },
    size: { min: 0, max: 1, def: 0.5, desc: 'How big the change is: 0 a small step between the notes, 1 a wide leap' },
  },
  play(T, out, t, p) {
    const up = p.up >= 0.5;
    const hi = p.pitch * Math.pow(2, (2 + 10 * p.size) / 12);
    const lo = p.pitch;
    const level = up ? 1 : 0.85;
    const a = up ? lo : hi;
    const b = up ? hi : lo;
    const dir = up ? 1 : -1;
    T.osc(out, t, { type: 'triangle', f: a, to: a * (1 + 0.04 * dir), dur: 0.05, peak: 0.04 * level, a: 0.003 });
    T.osc(out, t + 0.045, { type: 'triangle', f: b, to: b * (1 + 0.06 * dir), dur: 0.08, peak: 0.046 * level, a: 0.003 });
    T.noise(out, t, { filter: 'highpass', f: 4500, q: 0.7, dur: 0.008, peak: 0.008, a: 0.002 });
  },
};
