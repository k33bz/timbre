// An ability switching on: a breath of air rising, a short glide up an octave, and a two-note
// banner ping landing as the glide arrives (a fourth below the top, then the top). Power adds a low
// swell under the glide and a third ping. Not the power-up scale run: one glide and one ping,
// short enough to open any ability.
export default {
  id: 'battle-ability',
  name: 'Ability Trigger',
  category: 'battle',
  tags: ['ability', 'activate', 'trigger', 'power-on', 'skill', 'banner', 'battle'],
  desc: 'A short rising glide with a bright two-note ping: a creature ability switching on. Power fills it out with a low swell.',
  dur: 0.59,
  family: 'synthetic',
  moments: ['ability'],
  params: {
    pitch: { min: 330, max: 660, def: 440, unit: 'Hz', desc: 'Start note of the rising glide, which climbs an octave' },
    power: { min: 0, max: 1, def: 0.5, desc: 'How big the activation feels: 0 a light trigger, 1 a fuller rise with a low swell and a third ping' },
    ring: { min: 0.1, max: 0.4, def: 0.22, unit: 's', desc: 'How long the banner pings ring' },
  },
  play(T, out, t, p) {
    const g = 0.14 + 0.08 * p.power;
    const f = p.pitch;
    const pt = t + g * 0.55;
    // the breath and the glide
    T.noise(out, t, { filter: 'bandpass', f: 700, to: 2600, q: 1.4, dur: g, peak: 0.09, a: g * 0.3 });
    T.osc(out, t, { type: 'triangle', f, to: f * 2, dur: g, peak: 0.09, a: 0.008 });
    // the banner ping: the top note and one a fourth below it
    T.osc(out, pt, { f: f * 4, dur: p.ring, peak: 0.055, a: 0.006 });
    T.osc(out, pt, { type: 'triangle', f: f * 2.667, dur: p.ring * 0.9, peak: 0.035, a: 0.006 });
    if (p.power > 0.02) {
      T.osc(out, t, { f: f * 0.5, to: f, dur: g + 0.1, peak: 0.07 * p.power, a: g * 0.8 });
      T.osc(out, pt + 0.05, { f: f * 3, dur: p.ring, peak: 0.04 * p.power, a: 0.006 });
    }
  },
};
