// A round rising "bloop" for choosing one option in a group: a sine that bends upward, with a quiet
// octave-down body so it feels rounded rather than chirpy. Default pitch is E5 (pentatonic).
export default {
  id: 'ui-radio-select',
  name: 'Radio Select',
  category: 'ui',
  tags: ['radio', 'select', 'choose', 'option', 'bloop', 'soft'],
  desc: 'A soft rounded bloop for picking one option from a group: a sine that bends upward over a quiet low body.',
  dur: 0.1,
  params: {
    pitch: { min: 400, max: 1100, def: 659, unit: 'Hz' },
    bloop: { min: 0, max: 1, def: 0.5 },
    round: { min: 0, max: 1, def: 0.5 },
  },
  play(T, out, t, p) {
    const rise = 1.15 + 0.6 * p.bloop;
    T.osc(out, t, { f: p.pitch, to: p.pitch * rise, dur: 0.09, peak: 0.055, a: 0.004, glide: 0.05 });
    T.osc(out, t, { f: p.pitch / 2, to: (p.pitch / 2) * rise, dur: 0.07, peak: 0.015 + 0.03 * p.round, a: 0.004, glide: 0.05 });
    T.noise(out, t, { filter: 'highpass', f: 4000, q: 0.7, dur: 0.008, peak: 0.006, a: 0.002 });
  },
};
