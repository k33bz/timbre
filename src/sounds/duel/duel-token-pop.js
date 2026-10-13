// A single-use ink token being spent: a soft round pop that falls in pitch, the thin skin of it
// breaking with a glassy tick, and a few tiny glass crumbs tumbling down and away. The mirror of
// Ink Token Mint, which rose.
export default {
  id: 'duel-token-pop',
  name: 'Ink Token Pop',
  category: 'duel',
  tags: ['ink-duel', 'token', 'single-use', 'pop', 'spend', 'ink', 'glass', 'card-game'],
  desc: 'A single-use ink token spent: a soft falling pop, a glassy tick and a few small crumbs of glass tumbling away. For paying one ink once.',
  dur: 0.3,
  family: 'glass',
  params: {
    pitch: { min: 400, max: 1000, def: 700, unit: 'Hz', desc: 'Start pitch of the pop before it falls: low a round bubble, high a small one' },
    crumbs: { min: 0, max: 1, def: 0.5, desc: 'The small glass crumbs after the pop: 0 none, 1 a clear tumble' },
  },
  play(T, out, t, p) {
    T.osc(out, t, { f: p.pitch, to: p.pitch * 0.34, dur: 0.06, peak: 0.05, a: 0.002 });
    T.noise(out, t, { filter: 'highpass', f: 4500, to: 2800, q: 0.8, dur: 0.018, peak: 0.03, a: 0.001 });
    // the crumbs: three tiny glass tinks, each lower and quieter
    for (let k = 0; k < 3; k++) {
      T.bell(out, t + 0.04 + k * 0.045, {
        f: 3000 * Math.pow(0.8, k), partials: [[1, 1, 1], [2.32, 0.35, 0.5]], drift: 0.96, dur: 0.1,
        peak: (0.006 + 0.03 * p.crumbs) * (1 - 0.25 * k), a: 0.002,
      });
    }
  },
};
