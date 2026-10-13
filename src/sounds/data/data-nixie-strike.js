// A nixie tube lighting: a glassy snap and a fizz of tiny sparks as the gas strikes, then a warm
// low electrical hum that swells for a moment and falls away. The snap is the tick a counter wants;
// the hum is the glow. The hum is a lowpassed saw at a mains-like pitch so it stays warm, not buzzy.
export default {
  id: 'data-nixie-strike',
  name: 'Nixie Strike',
  category: 'data',
  tags: ['nixie', 'tube', 'strike', 'glow', 'digit', 'vintage', 'counter', 'tick', 'spark', 'hum'],
  desc: 'A glassy snap and a fizz of sparks as a nixie tube lights, then a warm electrical hum that swells and fades: for a retro digit appearing.',
  dur: 0.43,
  family: 'glass',
  moments: ['data-tick'],
  params: {
    snap: { min: 0, max: 1, def: 0.5, desc: 'The strike: 0 a muffled tick, 1 a bright glassy snap with more sparks' },
    hum: { min: 0, max: 1, def: 0.6, desc: 'Level of the warm hum after the strike: 0 almost none, 1 a full glow' },
    pitch: { min: 90, max: 180, def: 120, unit: 'Hz', desc: 'Pitch of the hum: low a deep warm drone, high a thinner whine' },
    glow: { min: 0.12, max: 0.4, def: 0.26, unit: 's', desc: 'How long the hum lingers before it fades' },
  },
  play(T, out, t, p) {
    // the strike
    T.osc(out, t, { f: 2600 + 1200 * p.snap, to: 2100, dur: 0.04, peak: 0.012 + 0.025 * p.snap, a: 0.001 });
    T.noise(out, t, { filter: 'highpass', f: 3500, q: 0.7, dur: 0.02, peak: 0.012 + 0.055 * p.snap, a: 0.001 });
    T.crackle(out, t + 0.004, { dur: 0.07, rate: 150, f: 5200, to: 3000, spread: 0.3, q: 1.5, len: 0.003, peak: 0.006 + 0.03 * p.snap });
    // the glow: a warm hum that fades in under the strike, on a soft lowpass
    const warm = T.filter(out, t, { type: 'lowpass', f: 650, q: 0.8, dur: 0.05 });
    const end = p.glow;
    T.osc(warm, t + 0.01, { type: 'sawtooth', f: p.pitch, dur: end, peak: 0.055 * p.hum, a: 0.025, tail: 0.12, fade: 0.06 });
    T.osc(out, t + 0.01, { type: 'triangle', f: p.pitch * 2, dur: end, peak: 0.016 * p.hum, a: 0.03, tail: 0.1, fade: 0.06 });
  },
};
