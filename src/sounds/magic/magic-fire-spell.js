// A fireball in three layers: a low thump as it ignites, a lowpassed roar that opens and dies
// away, and seeded crackles scattered through it.
export default {
  id: 'magic-fire-spell',
  name: 'Fire Spell',
  category: 'magic',
  tags: ['fire', 'fireball', 'flame', 'burn', 'spell', 'crackle', 'roar'],
  desc: 'A rushing fireball: a warm thump at the cast, a roar that swells and fades, and crackling embers.',
  dur: 1.3,
  family: 'organic',
  moments: ['spell', 'shoot'],
  params: {
    heat: { min: 0, max: 1, def: 0.5, desc: "How far the roar's lowpass opens: low a muffled rumble, high a bright blaze" },
    length: { min: 0.5, max: 1.2, def: 0.8, unit: 's', desc: 'How long the roar lasts, with the embers spread across it' },
    crackle: { min: 0, max: 1, def: 0.5, desc: 'Number of popping embers, from a few to a dense crackle' },
    weight: { min: 0, max: 1, def: 0.5, desc: 'Loudness of the low thump at ignition' },
  },
  play(T, out, t, p) {
    const len = p.length;
    // the roar: the cutoff opens with the heat, the level swells then falls
    T.noise(out, t, { filter: 'lowpass', f: 250, to: 900 + 2600 * p.heat, q: 0.8, dur: len, peak: 0.4, a: len * 0.22, glide: len * 0.5 });
    // the ignition: a short bright sizzle and a low thump
    T.noise(out, t, { filter: 'bandpass', f: 1200, to: 6000, q: 1.4, dur: 0.18, peak: 0.1, a: 0.01 });
    T.osc(out, t, { f: 130, to: 45, dur: 0.28, peak: 0.04 + 0.12 * p.weight, a: 0.004 });
    // the magic in it: a quick rising flare over the ignition
    T.osc(out, t, { type: 'triangle', f: 500, to: 2000, dur: 0.22, peak: 0.025, a: 0.01 });
    // embers popping at random moments, fewer and softer toward the end
    const n = Math.round(3 + 11 * p.crackle);
    for (let k = 0; k < n; k++) {
      const at = t + 0.05 + T.rand(0, len - 0.12);
      const fade = 1 - 0.6 * ((at - t) / len);
      T.noise(out, at, { filter: 'highpass', f: T.rand(2500, 6500), q: 0.8, dur: 0.014, peak: T.rand(0.03, 0.08) * fade, a: 0.001 });
    }
  },
};
