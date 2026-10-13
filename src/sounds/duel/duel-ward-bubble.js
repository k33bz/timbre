// Ward: a clear bubble that nothing can pick. A bubble forms (a glassy FM pip bending up with a
// wobbling film above it), a pane of glass rings, then something bounces off with a tink and
// shatters into a few fine specks. All bright and hollow: no saw hum, nothing charging.
export default {
  id: 'duel-ward-bubble',
  name: 'Ward Bubble',
  category: 'duel',
  tags: ['ink-duel', 'ward', 'keyword', 'glass', 'bubble', 'crackle', 'bounce', 'protect'],
  desc: 'A glassy bubble forming and ringing, then a tink and a tiny crackle as something bounces off and shatters. For Ward.',
  dur: 0.43,
  family: 'glass',
  moments: ['ability'],
  params: {
    pitch: { min: 300, max: 800, def: 520, unit: 'Hz', desc: 'Start note of the bubble before it bends up; the glass rings well above it' },
    ring: { min: 0, max: 1, def: 0.5, desc: 'How long the glass rings after the bubble forms: 0 a quick pop, 1 a lingering ring' },
    shatter: { min: 0, max: 1, def: 0.5, desc: 'Fine crackle of the thing that bounces off and breaks: 0 only a tink, 1 a clear spray' },
  },
  play(T, out, t, p) {
    // the bubble: a glittery FM pip that bends up and settles
    T.fm(out, t, { f: p.pitch, to: p.pitch * 2.1, ratio: 1.5, index: 1.4, index1: 0, dur: 0.12, peak: 0.063, a: 0.004, glide: 0.07 });
    // the film of the bubble, wobbling
    T.osc(out, t + 0.01, { f: p.pitch * 3.2, to: p.pitch * 3.6, dur: 0.2, peak: 0.01, a: 0.02, trem: { rate: 26, depth: 0.7 } });
    // the glass rings (glass-like partial ratios, not struck metal)
    T.bell(out, t + 0.05, {
      f: p.pitch * 5, partials: [[1, 1, 1], [2.32, 0.5, 0.6], [4.17, 0.28, 0.4], [6.7, 0.14, 0.25]],
      dur: 0.12 + 0.24 * p.ring, peak: 0.014 + 0.022 * p.ring, a: 0.002,
    });
    // something bounces off: a tink, then it breaks into specks
    const hit = t + 0.19;
    T.bell(out, hit, { f: p.pitch * 7.5, partials: [[1, 1, 1], [2.76, 0.4, 0.5]], drift: 0.97, dur: 0.07, peak: 0.025, a: 0.001 });
    if (p.shatter > 0.02) {
      T.crackle(out, hit + 0.01, { dur: 0.09, rate: 260, f: 7500, to: 3800, spread: 0.5, q: 2.5, len: 0.003, peak: 0.07 * p.shatter, vary: 0.6 });
    }
  },
};
