// One point of lore ticking onto the meter: a tiny gold glass tick, a sine with a faint inharmonic
// partial and a pinch of band-passed noise on top. Built to repeat quickly, one per point, so it
// stays at the quiet end of the range; raise its pitch step by step to climb the meter.
export default {
  id: 'duel-lore-tick',
  name: 'Lore Tick',
  category: 'duel',
  tags: ['ink-duel', 'lore', 'tick', 'meter', 'gauge', 'point', 'count', 'gold', 'score'],
  desc: 'A tiny gold glass tick for one point of lore on the meter. Quiet and quick, meant to repeat; raise the pitch as the meter fills.',
  dur: 0.15,
  family: 'glass',
  moments: ['score'],
  params: {
    pitch: { min: 1500, max: 3600, def: 2349, unit: 'Hz', desc: 'Pitch of the tick: low a dull gold, high a thin bright glass' },
    glass: { min: 0, max: 1, def: 0.5, desc: 'How long the glass rings after the tick: 0 a dry tick, 1 a small chime' },
  },
  play(T, out, t, p) {
    const f = p.pitch;
    T.tick(out, t, { f: f * 2.4, q: 2.4, dur: 0.009, peak: 0.022 });
    T.bell(out, t, { f, partials: [[1, 1, 1], [2.32, 0.35, 0.5]], dur: 0.05 + 0.1 * p.glass, peak: 0.034, a: 0.002 });
  },
};
