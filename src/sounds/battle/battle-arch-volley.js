// A flurry of light blows: each a short falling thump with a puff of lowpassed noise, a little
// different from the last, then a heavier finishing blow. Two to eight blows; every setting peaks
// on the finisher, so a longer flurry is longer, not louder. Not the game punch (at most three
// punches): this is the fast multi-hit pattern.
export default {
  id: 'battle-arch-volley',
  name: 'Rapid Volley',
  category: 'battle',
  tags: ['volley', 'flurry', 'combo', 'multi-hit', 'rapid', 'barrage', 'attack', 'battle', 'archetype'],
  desc: 'A quick flurry of two to eight light blows ending on a heavier one. Dry and fast, for multi-hit attacks.',
  dur: 0.88,
  moments: ['attack', 'hit'],
  family: 'impact',
  params: {
    hits: { min: 2, max: 8, def: 5, step: 1, desc: 'How many blows land in the flurry, the last one the finisher' },
    gap: { min: 0.04, max: 0.1, def: 0.065, unit: 's', desc: 'Time between blows; small is a blur, large is a count' },
    finish: { min: 0, max: 1, def: 0.6, desc: 'Weight of the last blow: 0 as light as the rest, 1 clearly heavier' },
    pitch: { min: 150, max: 340, def: 240, unit: 'Hz', desc: 'Note of the light thumps; lower is meatier' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.hits);
    for (let k = 0; k < n; k++) {
      const last = k === n - 1;
      const at = t + k * p.gap;
      const l = last ? 0.6 + 0.55 * p.finish : 0.6;
      const v = T.jitter({ f: p.pitch, to: p.pitch * 0.42, peak: 0.11 * l }, { cents: 70, db: 1 });
      T.osc(out, at, { f: v.f, to: v.to, dur: 0.08, peak: v.peak, a: 0.003 });
      T.noise(out, at, { filter: 'lowpass', f: 2200, to: 600, q: 1, dur: 0.055, peak: 0.085 * l, a: 0.002 });
      if (last) {
        // the finisher: a deeper body under the last blow, none at finish 0
        T.osc(out, at, { f: p.pitch * 0.8, to: 60, dur: 0.16, peak: 0.06 * p.finish, a: 0.003 });
      }
    }
  },
};
