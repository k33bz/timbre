// A cartoon-safe boom: a lowpassed noise body that sweeps down, a falling sub, a short "bwoop" pop
// at the front and a scatter of tiny crackles after. Soften pulls the noise cutoff down so it
// puffs instead of bangs. It is a big moment, so it is the loudest thing in the category.
export default {
  id: 'game-explosion-soft',
  name: 'Explosion Soft',
  category: 'game',
  tags: ['explosion', 'boom', 'blast', 'bomb', 'cartoon', 'poof', 'burst', 'detonate'],
  desc: 'A big but friendly boom: a round blast with a pop on the front and crackles after. Cartoon, not harsh.',
  dur: 1.05,
  family: 'impact',
  moments: ['explosion'],
  params: {
    size: { min: 0.3, max: 0.9, def: 0.6, unit: 's', desc: "How long the boom's noise body and falling sub last" },
    pitch: { min: 35, max: 110, def: 60, unit: 'Hz', desc: 'Base note of the falling sub under the blast; lower is deeper' },
    soften: { min: 0, max: 1, def: 0.5, desc: 'Darkens the blast: 0 a brighter bang, 1 a muffled puff' },
    crackle: { min: 0, max: 1, def: 0.4, desc: 'Loudness of the tiny crackles scattered after the boom, 0 none' },
  },
  play(T, out, t, p) {
    const L = p.size;
    T.noise(out, t, {
      filter: 'lowpass', f: 2800 - 1700 * p.soften, to: 120, q: 0.8, dur: L, peak: 0.23, a: 0.01,
    });
    T.osc(out, t, { f: p.pitch * 2.2, to: p.pitch * 0.6, glide: L * 0.8, dur: L * 0.9, peak: 0.1, a: 0.004 });
    T.osc(out, t, { f: 700, to: 160, dur: 0.07, peak: 0.031, a: 0.002 });
    for (let k = 0; k < 5; k++) {
      T.noise(out, t + 0.05 + k * 0.04 + T.rand(0, 0.03), {
        filter: 'highpass', f: 3500, q: 0.8, dur: 0.02,
        peak: 0.016 * p.crackle * T.rand(0.6, 1), a: 0.002,
      });
    }
  },
};
