// A body meeting the ground: a falling sine thump, a lowpassed puff of noise for the impact and a
// thin band of grit for the scuff. Weight scales the thump and how long it lasts.
export default {
  id: 'game-land',
  name: 'Land',
  category: 'game',
  tags: ['land', 'landing', 'thud', 'fall', 'step', 'platformer', 'impact'],
  desc: 'A character landing after a jump or fall: a soft thump with a scuff of grit. Heavier settings hit longer.',
  dur: 0.3,
  family: 'impact',
  params: {
    weight: { min: 0, max: 1, def: 0.5, desc: 'Heft of the landing: a louder, longer thump and impact puff' },
    pitch: { min: 55, max: 160, def: 90, unit: 'Hz', desc: 'Note of the falling thump; lower is deeper' },
    scuff: { min: 0, max: 1, def: 0.4, desc: 'Grit on landing: a louder, longer scuff and a brighter puff' },
  },
  play(T, out, t, p) {
    const j = T.rand(0.94, 1.06);
    T.osc(out, t, {
      f: p.pitch * 1.5 * j, to: p.pitch * 0.6, dur: 0.12 + 0.08 * p.weight,
      peak: 0.022 + 0.032 * p.weight, a: 0.003,
    });
    T.noise(out, t, {
      filter: 'lowpass', f: 900 + 1200 * p.scuff, to: 300, q: 0.7,
      dur: 0.07 + 0.05 * p.weight, peak: 0.057 + 0.05 * p.weight, a: 0.002,
    });
    T.noise(out, t + 0.004, {
      filter: 'bandpass', f: 3000 * j, q: 0.8,
      dur: 0.045 + 0.05 * p.scuff, peak: 0.013 + 0.038 * p.scuff, a: 0.004,
    });
  },
};
