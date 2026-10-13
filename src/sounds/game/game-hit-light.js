// A quick light strike: a short falling sine knock, a bandpassed crack and a tiny bright triangle
// tick on top. Snap lifts the crack; body fattens the knock. Built to fire often in a fight.
export default {
  id: 'game-hit-light',
  name: 'Hit Light',
  category: 'game',
  tags: ['hit', 'light', 'tap', 'slap', 'combat', 'impact', 'strike', 'attack'],
  desc: 'A quick, light strike landing: a short knock with a crisp crack. Small enough to chain in a fight.',
  dur: 0.16,
  family: 'impact',
  moments: ['hit', 'attack'],
  params: {
    pitch: { min: 120, max: 400, def: 220, unit: 'Hz', desc: 'Note of the short falling knock' },
    snap: { min: 0, max: 1, def: 0.5, desc: 'Crack brightness and level: 0 a dull tap, 1 a crisp bright snap' },
    body: { min: 0, max: 1, def: 0.5, desc: 'Level of the knock under the crack: 0 thin, 1 fat' },
  },
  play(T, out, t, p) {
    const j = T.rand(0.95, 1.05);
    T.osc(out, t, { f: p.pitch * 1.6 * j, to: p.pitch * 0.7, dur: 0.07, peak: 0.035 + 0.035 * p.body, a: 0.002 });
    T.noise(out, t, {
      filter: 'bandpass', f: 1800 + 2200 * p.snap, q: 0.9, dur: 0.035,
      peak: 0.042 + 0.056 * p.snap, a: 0.001,
    });
    T.osc(out, t, { type: 'triangle', f: 1400 + 1400 * p.snap, to: 700, dur: 0.03, peak: 0.01, a: 0.001 });
  },
};
