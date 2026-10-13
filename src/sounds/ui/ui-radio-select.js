// A round rising "bloop" for choosing one option in a group: a sine that bends upward, with a quiet
// octave-down body so it feels rounded rather than chirpy. Default pitch is E5 (pentatonic).
export default {
  id: 'ui-radio-select',
  name: 'Radio Select',
  category: 'ui',
  tags: ['radio', 'select', 'choose', 'option', 'bloop', 'soft'],
  desc: 'A soft rounded bloop for picking one option from a group: a sine that bends upward over a quiet low body.',
  dur: 0.1,
  family: 'soft',
  moments: ['click'],
  params: {
    pitch: { min: 400, max: 1100, def: 659, unit: 'Hz', desc: 'Start note of the bloop; its octave-down body follows' },
    bloop: { min: 0, max: 1, def: 0.5, desc: 'How far the sound bends upward: 0 a gentle lift, 1 a big rising bloop' },
    round: { min: 0, max: 1, def: 0.5, desc: 'Level of the octave-down body: 0 thinner and chirpier, 1 fuller and rounder' },
  },
  play(T, out, t, p) {
    const rise = 1.15 + 0.6 * p.bloop;
    T.osc(out, t, { f: p.pitch, to: p.pitch * rise, dur: 0.09, peak: 0.055, a: 0.004, glide: 0.05 });
    T.osc(out, t, { f: p.pitch / 2, to: (p.pitch / 2) * rise, dur: 0.07, peak: 0.015 + 0.03 * p.round, a: 0.004, glide: 0.05 });
    T.noise(out, t, { filter: 'highpass', f: 4000, q: 0.7, dur: 0.008, peak: 0.006, a: 0.002 });
  },
};
