// An energy token smashed by a hammer. The swing's air builds, the hammer hits with a metal clank
// and a hard crack, a handful of tiny shards skitter away in a thin shower, and a low stone thud
// closes it. Heavier than an energy click, lighter than a knockout.
export default {
  id: 'battle-energy-break',
  name: 'Energy Break',
  category: 'battle',
  tags: ['energy', 'break', 'smash', 'shatter', 'discard', 'hammer', 'crack', 'shards', 'card-game'],
  desc: 'An energy card smashed: a swing of air, a clank and crack, a shower of tiny shards and a dull thud. For discarding an opponent\'s energy.',
  dur: 0.75,
  family: 'impact',
  params: {
    swing: { min: 0, max: 0.35, def: 0.2, unit: 's', desc: 'Length of the windup swish before the hit: 0 none, longer is a bigger swing' },
    shards: { min: 2, max: 8, def: 5, step: 1, desc: 'How many tiny shards skitter away after the hit' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'The low stone thud under the break: 0 light and brittle, 1 heavy' },
  },
  play(T, out, t, p) {
    const h = t + p.swing;
    if (p.swing > 0.05) T.noise(out, t, { filter: 'bandpass', f: 350, to: 1700, q: 1.2, dur: p.swing + 0.02, peak: 0.07, a: p.swing * 0.85 });
    // the clank and the crack
    T.osc(out, h, { f: 560, to: 549, dur: 0.12, peak: 0.06, a: 0.002 });
    T.osc(out, h, { f: 1546, to: 1512, dur: 0.08, peak: 0.03, a: 0.002 });
    T.noise(out, h, { filter: 'highpass', f: 3400, to: 1300, q: 0.8, dur: 0.05, peak: 0.05, a: 0.002 });
    T.osc(out, h, { type: 'triangle', f: 1800, to: 700, dur: 0.09, peak: 0.025, a: 0.002 });
    T.osc(out, h, { f: 140, to: 60, dur: 0.16, peak: 0.035 + 0.06 * p.weight, a: 0.002 });
    // the thud
    T.noise(out, h + 0.02, { filter: 'lowpass', f: 1400, to: 220, q: 1.1, dur: 0.2, peak: 0.025 + 0.06 * p.weight, a: 0.003 });
    // the shards
    const n = Math.round(p.shards);
    for (let k = 0; k < n; k++) {
      const at = h + 0.04 + (k * 0.26) / n + T.rand(0, 0.02);
      const f = T.rand(2600, 6200);
      const fade = 1 - (0.6 * k) / n;
      T.osc(out, at, { f, to: f * 0.97, dur: T.rand(0.04, 0.09), peak: 0.02 * fade, a: 0.001 });
      T.noise(out, at, { filter: 'highpass', f: 3000 + 300 * k, to: 2400, q: 0.8, dur: 0.025, peak: 0.03 * fade, a: 0.001 });
    }
  },
};
