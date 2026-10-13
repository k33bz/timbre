// The trigger bag resolving: wooden chips knocked out one at a time, each a step higher than the
// last on a major arpeggio, each answered by a tiny glass ping, from left to right across the
// stereo field. The last ping rings a little longer, so you hear the bag empty.
export default {
  id: 'duel-bag-resolve',
  name: 'Trigger Bag Resolve',
  category: 'duel',
  tags: ['ink-duel', 'trigger', 'bag', 'resolve', 'chips', 'sequence', 'wood', 'card-game'],
  desc: 'Wooden chips knock out one at a time, climbing in pitch, each answered by a small glass ping. For triggered abilities resolving in order.',
  dur: 1.17,
  family: 'wood',
  moments: ['ability'],
  params: {
    count: { min: 2, max: 4, def: 3, step: 1, desc: 'How many chips resolve, each a step higher' },
    gap: { min: 0.14, max: 0.24, def: 0.19, unit: 's', desc: 'Time between chips: short a quick run, long a deliberate one' },
    pitch: { min: 300, max: 720, def: 440, unit: 'Hz', desc: 'Pitch of the first chip; the rest climb from it' },
    ping: { min: 0, max: 1, def: 0.6, desc: 'The glass ping after each chip: 0 only wooden knocks, 1 clear pings' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.count);
    const steps = [0, 4, 7, 12];
    const wood = [[1, 1, 1], [2, 0.22, 0.4], [3.76, 0.14, 0.22]];
    for (let k = 0; k < n; k++) {
      const at = t + k * p.gap;
      const last = k === n - 1;
      const side = T.pan(out, at, { x: n > 1 ? -0.35 + (0.7 * k) / (n - 1) : 0 });
      const f = p.pitch * Math.pow(2, steps[k] / 12);
      T.bell(side, at, { f, partials: wood, dur: 0.1, peak: 0.075, a: 0.001 });
      T.noise(side, at, { filter: 'bandpass', f: 2400 + f, q: 2, dur: 0.01, peak: 0.06, a: 0.001 });
      T.bell(side, at + 0.035, {
        f: f * 3, partials: [[1, 1, 1], [2.32, 0.3, 0.5]], dur: last ? 0.4 : 0.14,
        peak: (last ? 0.04 : 0.028) * p.ping, a: 0.002,
      });
    }
  },
};
