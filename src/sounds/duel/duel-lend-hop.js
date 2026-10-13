// Support: a point of strength lent from one card to another. Two soft mallet notes on a wooden
// bar (partials at 1, 4 and about 10 times the note, the way a marimba bar is tuned), the second
// higher, so the strength seems to hop across.
export default {
  id: 'duel-lend-hop',
  name: 'Lend Hop',
  category: 'duel',
  tags: ['ink-duel', 'support', 'keyword', 'mallet', 'marimba', 'bar', 'buff', 'lend'],
  desc: 'Two soft mallet blips, the second higher: strength hopping from one card to another. For Support.',
  dur: 0.38,
  family: 'soft',
  moments: ['ability'],
  params: {
    pitch: { min: 330, max: 880, def: 392, unit: 'Hz', desc: 'Note of the first blip' },
    step: { min: 3, max: 12, def: 5, unit: 'st', desc: 'How far up the second blip hops: a small step to a full octave' },
    gap: { min: 0.06, max: 0.16, def: 0.1, unit: 's', desc: 'Time between the two blips: short a quick hop, long a lazy arc' },
    bright: { min: 0, max: 1, def: 0.5, desc: 'Mallet hardness: 0 round and muted, 1 woody with a clear tap' },
  },
  play(T, out, t, p) {
    const bar = [[1, 1, 1], [4, 0.28, 0.3], [9.8, 0.1, 0.15]];
    const f1 = p.pitch;
    const f2 = p.pitch * Math.pow(2, p.step / 12);
    const hop = (at, f, lv) => {
      T.bell(out, at, { f, partials: bar, dur: 0.2, peak: 0.06 * lv * (0.8 + 0.4 * p.bright), a: 0.002 });
      // the tap of the mallet
      T.noise(out, at, { filter: 'bandpass', f: f * 3, q: 1.2, dur: 0.008, peak: 0.004 + 0.02 * p.bright * lv, a: 0.001 });
    };
    hop(t, f1, 0.85);
    hop(t + p.gap, f2, 1);
  },
};
