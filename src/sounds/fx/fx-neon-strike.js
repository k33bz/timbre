// A neon sign catching: a handful of stuttering strikes (a crack and a rough mains-pitch buzz that
// open up a little more each time and sit closer together) until the tube holds and settles into its
// steady hum with a faint sizzle. The buzz is a saw, rasped with a band of noise, so it reads as a
// sign or a bad bulb. The nixie strike in data is a single warm snap; this is the stutter.
export default {
  id: 'fx-neon-strike',
  name: 'Neon Strike',
  category: 'fx',
  tags: ['neon', 'flicker', 'buzz', 'hum', 'sign', 'bulb', 'tube', 'fluorescent', 'strike'],
  desc: 'A neon sign or bad bulb stuttering on: rough buzzing strikes that grow longer, then a steady electric hum. For a sign switching on or a failing light.',
  dur: 1.47,
  family: 'synthetic',
  moments: ['neon-on'],
  params: {
    flickers: { min: 2, max: 8, def: 5, step: 1, desc: 'How many stuttering strikes before the tube holds' },
    pitch: { min: 80, max: 160, def: 120, unit: 'Hz', desc: 'Pitch of the buzz and the hum: low a deep transformer drone, high a thin whine' },
    buzz: { min: 0, max: 1, def: 0.5, desc: 'Roughness of the strikes: 0 soft and smooth, 1 harsh with a rasp and sharp cracks' },
    length: { min: 0.3, max: 0.9, def: 0.55, unit: 's', desc: 'How long the flickering takes before the hum settles' },
  },
  play(T, out, t, p) {
    const n = Math.round(p.flickers);
    // each strike gets longer and each gap shorter; scale the whole run to the length
    const ons = [];
    const gaps = [];
    let total = 0;
    for (let k = 0; k < n; k++) {
      const u = k / n;
      ons.push((0.02 + 0.07 * u) * T.rand(0.8, 1.2));
      gaps.push((0.07 * (1 - u) + 0.015) * T.rand(0.8, 1.2));
      total += ons[k] + gaps[k];
    }
    const sc = p.length / total;
    let at = t;
    for (let k = 0; k < n; k++) {
      const u = k / n;
      const on = ons[k] * sc;
      const f = p.pitch * T.rand(0.98, 1.02);
      const lp = T.filter(out, at, { type: 'lowpass', f: 500 + 700 * u, to: 1100 + 1300 * u, dur: on, q: 1.5 });
      T.tick(out, at, { f: 3600, q: 1.2, dur: 0.01, peak: 0.03 + 0.07 * p.buzz, jitter: 1 });
      T.osc(lp, at, { type: 'sawtooth', f, dur: on, peak: 0.055, a: 0.003, s: 1, d: 0.004, r: 0.006 });
      T.osc(lp, at, { type: 'square', f: f * 2, dur: on, peak: 0.02, a: 0.003, s: 1, d: 0.004, r: 0.006 });
      T.noise(out, at, { filter: 'bandpass', f: 2200, q: 1.5, dur: on, peak: 0.02 + 0.08 * p.buzz, a: 0.003, s: 1, d: 0.004, r: 0.006 });
      at += (ons[k] + gaps[k]) * sc;
    }
    // the tube holds: a steady hum with a sizzle on top, fading out after about half a second
    const hum = 0.55;
    const hp = T.filter(out, at, { type: 'lowpass', f: 700, to: 1100, dur: 0.1, q: 1.2 });
    T.osc(hp, at, { type: 'sawtooth', f: p.pitch, dur: hum, peak: 0.05, a: 0.01, s: 1, d: 0.05, r: 0.2 });
    T.osc(hp, at, { f: p.pitch * 2, dur: hum, peak: 0.03, a: 0.01, s: 1, d: 0.05, r: 0.2 });
    T.osc(out, at, { f: p.pitch * 0.5, dur: hum, peak: 0.02, a: 0.01, s: 1, d: 0.05, r: 0.2 });
    T.crackle(out, at, { dur: hum - 0.1, rate: 30 + 40 * p.buzz, f: 4500, spread: 0.5, q: 1.2, len: 0.004, peak: 0.01 + 0.025 * p.buzz });
  },
};
