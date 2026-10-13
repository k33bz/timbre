// A wide-board bonus in four beats: three soft wooden tilts (the characters exert), a muted landing
// (the leader), a short shimmer sweep (the gold ribbon linking them) and then one small glass chime
// per lore star, each higher than the last and ringing on under the next so they stack into a chord.
export default {
  id: 'duel-wide-payoff',
  name: 'Wide Payoff',
  category: 'duel',
  tags: ['ink-duel', 'lore', 'bonus', 'payoff', 'chime', 'stacked', 'ribbon', 'glass', 'rising'],
  desc: 'A bonus pays off: three soft tilts, a muted landing and a shimmer, then small gold glass chimes climb and stack, one per lore point scored.',
  dur: 2.18,
  family: 'glass',
  moments: ['score'],
  params: {
    stars: { min: 2, max: 4, def: 3, step: 1, desc: 'How many lore chimes stack up, each higher than the last' },
    pitch: { min: 700, max: 1400, def: 1000, unit: 'Hz', desc: 'Note of the first chime; the others climb above it' },
    gap: { min: 0.09, max: 0.18, def: 0.13, unit: 's', desc: 'Time between chimes: low a quick run, high a spaced climb' },
    space: { min: 0, max: 0.5, def: 0.25, desc: 'Room around the chimes, from dry to a wide shimmer' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.stars);
    // three characters tilt sideways: a hollow wooden knock with a short slide of air
    for (let k = 0; k < 3; k++) {
      const at = t + k * 0.085;
      T.noise(out, at, { filter: 'bandpass', f: 900 + 120 * k, to: 500, q: 1.6, dur: 0.05, peak: 0.07, a: 0.003 });
      T.osc(out, at, { type: 'triangle', f: 230 + 25 * k, to: 140, dur: 0.06, peak: 0.03, a: 0.003 });
    }
    // the leader lands beside them: a muted thump, not a slam
    const land = t + 0.36;
    T.osc(out, land, { f: 130, to: 52, dur: 0.24, peak: 0.055, a: 0.004 });
    T.noise(out, land, { filter: 'lowpass', f: 800, to: 180, q: 0.8, dur: 0.12, peak: 0.06, a: 0.003 });
    // the gold ribbon links the three: a thin rising shimmer, glassy grains over a faint glide
    const rb = t + 0.42;
    T.osc(out, rb, { f: 520, to: 1900, dur: 0.38, peak: 0.022, a: 0.14, trem: { rate: 14, depth: 0.4 } });
    T.crackle(out, rb, { dur: 0.36, rate: 70, f: 3200, to: 8000, spread: 0.3, q: 2, len: 0.005, peak: 0.04 });
    // the lore stars leap: stacked chimes, each a small glass bell with a warm low partner
    const room = T.reverb(out, t, { time: 0.7, mix: p.space, tone: 0.7 });
    const glass = [[1, 1, 1], [2.32, 0.38, 0.55], [4.1, 0.14, 0.3]];
    const rise = [0, 4, 7, 12];
    const first = t + 0.78;
    for (let k = 0; k < n; k++) {
      const at = first + k * p.gap;
      const f = p.pitch * Math.pow(2, rise[k] / 12);
      const top = k === n - 1;
      T.bell(room, at, { f, partials: glass, dur: top ? 0.85 : 0.65, peak: top ? 0.085 : 0.066, a: 0.003 });
      T.osc(room, at, { f: f / 2, dur: 0.3, peak: 0.024, a: 0.004 });
    }
    // a last glint over the top chime
    T.osc(room, first + (n - 1) * p.gap + 0.03, { f: p.pitch * 4 * Math.pow(2, rise[n - 1] / 12), dur: 0.35, peak: 0.016, a: 0.003 });
  },
};
