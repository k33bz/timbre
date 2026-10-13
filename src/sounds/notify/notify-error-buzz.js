// Built from the Deck Lab paralysis buzz (an oscillator with a fast level trill), shaped into a
// falling "uh-uh": square pulses through a lowpass, each a step lower than the last.
export default {
  id: 'notify-error-buzz',
  name: 'Error Buzz',
  category: 'notify',
  tags: ['error', 'fail', 'invalid', 'denied', 'buzz', 'negative'],
  desc: 'A low falling double buzz for a rejected action. Clear without being harsh.',
  dur: 0.45,
  family: 'synthetic',
  moments: ['error'],
  params: {
    pitch: { min: 90, max: 300, def: 160, unit: 'Hz', desc: 'Note of the first buzz; each further pulse steps lower' },
    pulses: { min: 1, max: 3, def: 2, step: 1, desc: 'Number of falling buzz pulses' },
    rough: { min: 0, max: 1, def: 0.5, desc: 'Depth of the fast level trill: 0 a smooth tone, 1 a rattling buzz' },
    tone: { min: 500, max: 3000, def: 1200, unit: 'Hz', desc: 'Lowpass cutoff: low is dull and muffled, high is brighter and edgier' },
  },
  play(T, out, t, p) {
    const lp = T.filter(out, t, { type: 'lowpass', f: p.tone, q: 0.8 });
    const n = Math.round(p.pulses);
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(0.89, k);
      T.osc(lp, t + k * 0.15, {
        type: 'square', f, to: f * 0.95, dur: 0.12, peak: 0.075, a: 0.006, s: 0.6, d: 0.03, r: 0.03,
        trem: { rate: 34, depth: 0.8 * p.rough },
      });
    }
  },
};
