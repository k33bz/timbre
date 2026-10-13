// The error buzz's recipe (a lowpassed square with a fast level trill, stepping down by 0.89) made
// longer and heavier: up to four pulses, the last one sagging, with a sine under the first for
// weight. Same lowpass and the same falling steps, so the two read as relatives.
export default {
  id: 'notify-task-failed',
  name: 'Task Failed',
  category: 'notify',
  tags: ['fail', 'failed', 'error', 'task', 'build', 'broken', 'negative'],
  desc: 'A run of low falling buzzes that sags on the last one. Something you were waiting on did not work out; firm, not harsh.',
  dur: 0.85,
  family: 'synthetic',
  moments: ['error'],
  params: {
    pitch: { min: 120, max: 320, def: 190, unit: 'Hz', desc: 'Note of the first buzz and the sine under it; later pulses step lower' },
    pulses: { min: 2, max: 4, def: 3, step: 1, desc: 'Number of falling buzz pulses; the last one sags' },
    rough: { min: 0, max: 1, def: 0.4, desc: 'Depth of the fast level trill: 0 a smooth tone, 1 a rattling buzz' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Level of the low falling sine under the first pulse, 0 removes it' },
  },
  play(T, out, t, p) {
    const lp = T.filter(out, t, { type: 'lowpass', f: 1200, q: 0.8 });
    const n = Math.round(p.pulses);
    for (let k = 0; k < n; k++) {
      const f = p.pitch * Math.pow(0.89, k);
      const last = k === n - 1;
      T.osc(lp, t + k * 0.16, {
        type: 'square', f, to: last ? f * 0.78 : f * 0.97, dur: last ? 0.32 : 0.13, peak: 0.055, a: 0.008,
        s: 0.6, d: 0.03, r: last ? 0.1 : 0.03, trem: { rate: 30, depth: 0.7 * p.rough },
      });
    }
    T.osc(out, t, { f: p.pitch, to: p.pitch * 0.6, dur: 0.4, peak: 0.06 * p.weight, a: 0.01 });
  },
};
