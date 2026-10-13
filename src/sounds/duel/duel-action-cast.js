// An action card played: it rises with a gathering whoosh, pops with a glass-edged snap, a pulse
// ring sweeps across the table (left to right) and the spent card is flicked down onto the discard
// pile with a paper tick and a low bump. Four beats in about half a second.
export default {
  id: 'duel-action-cast',
  name: 'Action Cast',
  category: 'duel',
  tags: ['ink-duel', 'action', 'cast', 'play', 'whoosh', 'snap', 'pulse', 'discard', 'card'],
  desc: 'An action card played: a rising whoosh, a bright snap, a pulse sweeping the table and the card flicked onto the discard pile.',
  dur: 0.68,
  family: 'air',
  moments: ['ability'],
  params: {
    wind: { min: 0.08, max: 0.25, def: 0.16, unit: 's', desc: 'Length of the rising whoosh before the snap: short a flick, long a build-up' },
    flash: { min: 0, max: 1, def: 0.6, desc: 'Brightness of the snap: 0 a dull pop, 1 a crisp pop with a glass ring' },
    pulse: { min: 0, max: 1, def: 0.5, desc: 'Level of the pulse sweeping across the table after the snap, 0 none' },
  },
  play(T, out, t, p) {
    const W = p.wind;
    const snap = t + W;
    // 1. the card rises: air gathering upward, with a faint rising tone inside it
    T.noise(out, t, { filter: 'bandpass', f: 420, to: 4200, q: 1.2, dur: W + 0.02, peak: 0.1, a: W * 0.85 });
    T.osc(out, t, { type: 'triangle', f: 300, to: 900, dur: W + 0.02, peak: 0.024, a: W * 0.85 });
    // 2. the pop: a noise snap with a dull body, and a glass ring that grows with flash
    T.noise(out, snap, { filter: 'highpass', f: 3600, to: 2400, q: 0.8, dur: 0.03, peak: 0.03 + 0.07 * p.flash, a: 0.002 });
    T.osc(out, snap, { f: 330, to: 170, dur: 0.07, peak: 0.07, a: 0.003 });
    T.bell(out, snap, { f: 1760, partials: [[1, 1, 1], [2.32, 0.42, 0.55], [4.25, 0.2, 0.34]], dur: 0.32, peak: 0.05 * p.flash, a: 0.002 });
    // 3. the pulse: a narrow band of air that travels across the table, left to right
    const sw = T.pan(out, snap, { x: -0.8, to: 0.8, dur: 0.3 });
    T.noise(sw, snap + 0.02, { filter: 'bandpass', f: 2600, to: 900, q: 3, dur: 0.28, peak: 0.12 * p.pulse, a: 0.05, s: 0.5, d: 0.08, r: 0.12 });
    T.osc(sw, snap + 0.02, { f: 520, to: 330, dur: 0.28, peak: 0.03 * p.pulse, a: 0.05, s: 0.5, d: 0.08, r: 0.12 });
    // 4. the spent card is flicked onto the discard pile: paper tick, falling tick, low bump
    const down = snap + 0.27;
    T.noise(out, down, { filter: 'highpass', f: 3000, to: 1800, q: 0.9, dur: 0.034, peak: 0.04, a: 0.002 });
    T.osc(out, down, { type: 'triangle', f: 480, to: 260, dur: 0.03, peak: 0.012, a: 0.002 });
    T.osc(out, down + 0.05, { f: 140, to: 90, dur: 0.08, peak: 0.05, a: 0.003 });
  },
};
