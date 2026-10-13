// The all-in: a heap of chips shoved across the felt. A bed of soft sliding noise, a grain cloud of
// clay clicks whose density swells and fades, a low thud as the heap meets the pot and a few last
// chips settling. It is the loudest sound in the set because it is a rare, big moment.
export default {
  id: 'cards-chips-push',
  name: 'Chips Push All-In',
  category: 'cards',
  tags: ['chip', 'poker', 'all-in', 'push', 'bet', 'shove', 'pot', 'casino'],
  desc: 'A pile of chips pushed forward for an all-in: a swelling rattle of clay clicks that ends in a thud and a few settling chips.',
  dur: 1.27,
  family: 'wood',
  moments: ['chips'],
  params: {
    length: { min: 0.4, max: 0.9, def: 0.65, unit: 's', desc: 'Duration of the shove before the heap thuds into the pot' },
    chips: { min: 14, max: 40, def: 26, step: 1, desc: 'How many clay clicks rattle during the shove' },
    pitch: { min: 1400, max: 3200, def: 2200, unit: 'Hz', desc: 'Center frequency of the clicks and settling chips: low duller, high brighter' },
    slide: { min: 0, max: 1, def: 0.6, desc: 'Sliding noise under the clicks: 0 nearly silent, 1 loud felt hiss' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const n = Math.round(p.chips);
    T.noise(out, t, { filter: 'bandpass', f: 600, to: 1000, q: 0.8, dur: L + 0.05, peak: 0.015 + 0.1 * p.slide, a: L * 0.5 });
    for (let k = 0; k < n; k++) {
      // three uniform draws averaged: the clicks bunch in the middle of the shove
      const u = (T.rand() + T.rand() + T.rand()) / 3;
      const f = p.pitch * T.rand(0.7, 1.5);
      const l = (0.35 + 0.65 * Math.sin(Math.PI * u)) * T.rand(0.7, 1.2);
      T.noise(out, t + 0.02 + u * (L - 0.05), { filter: 'bandpass', f, to: f * 0.92, q: 9, dur: 0.03, peak: 0.3 * l, a: 0.001 });
    }
    const hit = t + L;
    T.osc(out, hit, { f: 150, to: 70, dur: 0.14, peak: 0.1, a: 0.003 });
    T.noise(out, hit, { filter: 'lowpass', f: 700, to: 250, q: 1, dur: 0.1, peak: 0.08, a: 0.002 });
    const rest = [0.04, 0.1, 0.19, 0.31];
    for (let k = 0; k < rest.length; k++) {
      const f = p.pitch * T.rand(0.8, 1.3);
      T.noise(out, hit + rest[k], { filter: 'bandpass', f, to: f * 0.93, q: 9, dur: 0.035, peak: 0.3 * (0.8 - 0.16 * k), a: 0.001 });
    }
  },
};
