// One drop landing and the rings spreading from it: a sine that bends upward as the bubble forms,
// a tick where the surface breaks, then a few smaller plinks, each lower and quieter, spaced wider
// apart as the rings grow, all in a small wet room. Thick liquid is lower, slower and rounder. A
// single event for a loader or a ripple, where the cave drips in ambience are a long bed.
export default {
  id: 'fx-liquid-drip',
  name: 'Liquid Drip',
  category: 'fx',
  tags: ['drip', 'drop', 'ripple', 'rings', 'water', 'plink', 'wax', 'liquid', 'splash'],
  desc: 'A single drop plinks into a pool and ripple rings spread out behind it. Thin for water, thick for wax or syrup. For liquid loaders, ripples and dripping effects.',
  dur: 0.9,
  family: 'organic',
  params: {
    pitch: { min: 400, max: 1600, def: 850, unit: 'Hz', desc: 'Pitch of the drop: low a big heavy drop, high a tiny bright one' },
    rings: { min: 1, max: 5, def: 3, step: 1, desc: 'How many ripple rings follow the drop, each quieter than the last' },
    thick: { min: 0, max: 1, def: 0.3, desc: 'How thick the liquid is: 0 thin water, 1 slow wax or syrup with a lower, rounder drop' },
    space: { min: 0, max: 0.6, def: 0.3, desc: 'Small room reverb mix, from dry to wet' },
  },
  play(T, out, t, p) {
    const room = T.reverb(out, t, { time: 0.4, mix: p.space, tone: 0.6 });
    const th = p.thick;
    const f = p.pitch * (1 - 0.4 * th);
    // the drop: the pitch bends up as the bubble forms, a tick where the surface breaks
    T.osc(room, t, { f: f * (0.5 - 0.1 * th), to: f * 1.15, glide: 0.08 + 0.1 * th, dur: 0.14 + 0.1 * th, peak: 0.07, a: 0.003 });
    T.tick(room, t, { f: 3200, q: 1.5, dur: 0.008, peak: 0.02 * (1 - th) });
    // the rings: smaller plinks, lower and quieter, further apart each time
    const n = Math.round(p.rings);
    let at = t + 0.1 + 0.03 * th;
    for (let k = 0; k < n; k++) {
      const rf = f * (0.95 - 0.05 * k);
      T.osc(room, at, { f: rf, to: rf * 1.2, glide: 0.05, dur: 0.08 + 0.05 * th, peak: 0.04 * Math.pow(0.6, k), a: 0.003 });
      at += 0.05 + 0.02 * k + 0.04 * th;
    }
  },
};
