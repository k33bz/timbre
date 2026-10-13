// Damage counters, the small discs a card game puts on a creature. Down: the discs land one by one,
// each a soft click with a tiny tone in it. Up: the same number lift off in a climbing run of
// plucks, a minor third apart, as if they were rising off the card.
export default {
  id: 'battle-counter',
  name: 'Counters',
  category: 'battle',
  tags: ['counter', 'counters', 'damage', 'disc', 'token', 'marker', 'lift', 'place', 'tally', 'card-game'],
  desc: 'Damage counters on a card: the discs click down one by one when placed, or lift off in a climbing run of soft plucks.',
  dur: 0.6,
  family: 'soft',
  moments: ['data-tick'],
  params: {
    up: { min: 0, max: 1, def: 0, step: 1, role: 'up', desc: '1 lifts the counters off in a climbing run of plucks, 0 drops them on one by one with a disc click' },
    count: { min: 1, max: 5, def: 3, step: 1, desc: 'How many counters move' },
    gap: { min: 0.04, max: 0.12, def: 0.06, unit: 's', desc: 'Time between one counter and the next' },
    pitch: { min: 440, max: 880, def: 587, unit: 'Hz', desc: 'Note of the first pluck when lifting; the disc clicks sit higher or lower with it' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.count);
    const r = p.pitch / 587.3;
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      if (p.up >= 0.5) {
        const f = p.pitch * Math.pow(2, (3 * k) / 12);
        T.osc(out, at, { type: 'triangle', f, to: f * 1.06, dur: 0.08, peak: 0.05, a: 0.003 });
        T.osc(out, at, { f: f * 2, to: f * 2.1, dur: 0.05, peak: 0.016, a: 0.003 });
      } else {
        T.tick(out, at, { filter: 'highpass', f: 3500 * r, q: 0.8, dur: 0.016, peak: 0.026, blip: 1100 * r, blipTo: 800 * r, blipPeak: 0.03, blipDur: 0.03, jitter: 0.6 });
      }
    }
  },
};
