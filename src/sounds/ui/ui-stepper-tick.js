// The plus and minus of a quantity stepper or time spinner: a micro pip that glides up when the value
// goes up and down when it goes down, with a soft pat of the button under it.
// Short and quiet because holding the button can fire it many times a second. Soft family.
export default {
  id: 'ui-stepper-tick',
  name: 'Number Stepper',
  category: 'ui',
  tags: ['stepper', 'quantity', 'spinner', 'increment', 'decrement', 'plus', 'minus', 'tick', 'soft'],
  desc: 'A tiny pip for the plus and minus of a number stepper: it hops up when the value rises and down when it falls.',
  dur: 0.055,
  family: 'soft',
  moments: ['scroll'],
  params: {
    up: { min: 0, max: 1, def: 1, step: 1, role: 'up', desc: '1 plays the rising tick for an increase, 0 the falling tick for a decrease' },
    pitch: { min: 500, max: 1500, def: 880, unit: 'Hz', desc: 'Resting note of the pip: the rise climbs past it and the fall drops below it' },
    pat: { min: 0, max: 1, def: 0.4, desc: 'Level of the soft button pat under the pip: 0 a bare pip, 1 a clear tap' },
  },
  play(T, out, t, p) {
    const up = p.up >= 0.5;
    const f = p.pitch;
    // the rise starts a little under the resting note and the fall a little over it, so the two
    // never begin on the same pitch and the direction reads even in 40 ms
    T.osc(out, t, {
      f: f * (up ? 0.9 : 1.1), to: f * (up ? 1.25 : 0.8), dur: 0.042, peak: 0.04, a: 0.003, glide: 0.025, s: 0.7, d: 0.01, r: 0.018,
    });
    T.noise(out, t, { filter: 'lowpass', f: 1800, q: 0.7, dur: 0.012, peak: 0.005 + 0.04 * p.pat, a: 0.002 });
  },
};
