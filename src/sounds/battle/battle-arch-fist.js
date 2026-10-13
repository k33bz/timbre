// A jab with a shockwave: a short rush of air and a low hum as the fist drives forward, a dull
// thud at contact (knuckle crack, body, dust), then a deep sub that rolls out from the point of
// impact. Dry on purpose (no ring, no reverb) so it can sit under an element strike, and a little
// under a lone hit's level for the same reason. Not the game punch: one heavy blow with a rolling
// shockwave, no flurry.
export default {
  id: 'battle-arch-fist',
  name: 'Fist Jab',
  category: 'battle',
  tags: ['fist', 'jab', 'strike', 'shockwave', 'attack', 'battle', 'archetype'],
  desc: 'A single driving jab: a rush of air, a dull thud and a deep shockwave rolling out. Dry, so it stacks under any element strike.',
  dur: 0.86,
  moments: ['attack', 'hit'],
  family: 'impact',
  params: {
    reach: { min: 0.06, max: 0.3, def: 0.15, unit: 's', desc: 'Length of the rush of air and hum before the fist lands' },
    weight: { min: 0, max: 1, def: 0.6, desc: 'Heft of the blow: 0 a light tap, 1 a deep, slow thud' },
    shock: { min: 0, max: 1, def: 0.5, desc: 'Level and length of the shockwave that rolls out after contact' },
  },
  play(T, out, t, p) {
    const r = p.reach;
    const w = p.weight;
    const h = t + r;
    // the drive forward: air opening upward over a rising hum
    T.noise(out, t, { filter: 'bandpass', f: 260, to: 1500, q: 1.4, dur: r + 0.02, peak: 0.12, a: r * 0.85 });
    T.osc(out, t, { f: 98, to: 147, dur: r + 0.02, peak: 0.045, a: r * 0.7 });
    T.osc(out, t, { type: 'triangle', f: 196, to: 294, dur: r + 0.02, peak: 0.018, a: r * 0.7 });
    // contact: a falling body, a lowpassed dusty burst and a tiny crack of knuckle
    T.osc(out, h, { f: 190 - 80 * w, to: 44, dur: 0.14 + 0.1 * w, peak: 0.095, a: 0.003 });
    T.noise(out, h, { filter: 'lowpass', f: 1500 - 500 * w, to: 260, q: 1, dur: 0.1 + 0.05 * w, peak: 0.095, a: 0.003 });
    T.noise(out, h, { filter: 'highpass', f: 3000, to: 1200, q: 0.8, dur: 0.05, peak: 0.03, a: 0.002 });
    // the shockwave: a sub falling away and a soft band of rumble rolling out
    T.osc(out, h + 0.02, { f: 62, to: 30, dur: 0.2 + 0.3 * p.shock, peak: 0.035 + 0.06 * p.shock, a: 0.01 });
    T.noise(out, h + 0.03, { filter: 'bandpass', f: 900, to: 240, q: 0.9, dur: 0.15 + 0.3 * p.shock, peak: 0.026 + 0.077 * p.shock, a: 0.02 });
  },
};
