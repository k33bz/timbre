// Fine sand pouring: a band of hiss for the stream with a granular crackle riding on it and a
// low rustle of the pile underneath, a slow waver in the flow, thinning out at the end to a few
// stray grains and a soft low shush as the pile settles. Everything but the stray grains and the
// settle plays through one group envelope, so the stream swells in, holds and thins as one, and
// through a lowpass, because sand is a dull hush rather than an airy hiss.
export default {
  id: 'ambience-sand-pour',
  name: 'Sand Pour',
  category: 'ambience',
  tags: ['sand', 'pour', 'hourglass', 'grains', 'timer', 'desert', 'hiss', 'bed'],
  desc: 'Fine sand pouring in a soft steady hiss, thinning to a last few grains and a quiet settle. Good under an hourglass or a timer running down.',
  dur: 8,
  loop: true,
  family: 'organic',
  moments: ['ambience'],
  params: {
    length: { min: 3, max: 8, def: 6, unit: 's', desc: 'Total duration of the bed, settle included' },
    flow: { min: 0, max: 1, def: 0.6, desc: 'Thickness of the stream: 0 a thin trickle, 1 a full pour' },
    grain: { min: 0, max: 1, def: 0.4, desc: 'Size of the grains: 0 fine and airy, 1 coarse and gritty' },
    settle: { min: 0, max: 1, def: 0.5, desc: 'Level of the soft shush as the pile settles at the end: 0 none' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const end = L - 0.55;
    const fade = Math.min(1.1, L * 0.22);
    const rel = Math.min(1.4, L * 0.3);
    const bed = T.bus(out, t, { dur: end, a: fade, s: 1, d: 0.02, r: rel, tail: 0.04, fade: 0.3 });
    // a slow waver in the flow, as the stream is never quite steady
    const flow = T.gain(bed, 0.85);
    T.lfo(flow, t, { param: 'gain', rate: 0.37, depth: 0.15, dur: end, a: 0.5 });
    const dull = T.filter(flow, t, { type: 'lowpass', f: 4800 - 1600 * p.grain, q: 0.6, dur: 0.05 });
    const fc = 3000 - 1200 * p.grain;
    T.noise(dull, t, { filter: 'bandpass', f: fc, q: 0.5, hp: 600, dur: end, peak: 0.022 + 0.022 * p.flow, a: 0.01, s: 1, d: 0.01, r: 0.01 });
    T.noise(dull, t, { filter: 'bandpass', f: 800, q: 0.9, dur: end, peak: 0.012 + 0.016 * p.flow, a: 0.01, s: 1, d: 0.01, r: 0.01 });
    T.crackle(dull, t, {
      dur: end, rate: 150 + 450 * p.flow, f: fc * 1.3, spread: 0.6, q: 1, len: 0.003 + 0.004 * p.grain, peak: 0.04, vary: 0.8,
    });
    // the last stray grains, then the settle
    T.crackle(out, t + end - 0.6, { dur: 1, rate: 14, f: 2800, spread: 0.7, q: 1.2, len: 0.004, peak: 0.06, vary: 0.6 });
    T.noise(out, t + end + 0.03, { filter: 'lowpass', f: 900, to: 260, q: 0.7, dur: 0.5, peak: 0.13 * p.settle, a: 0.12 });
  },
};
