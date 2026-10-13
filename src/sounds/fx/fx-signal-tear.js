// A tracking slip on worn tape: the picture's tone sags in pitch as the signal wows, bands of noise
// race down the screen from top to bottom, snow speckles underneath, and the tone climbs back when
// the heads lock again. Smooth and analog, the opposite of the stuttering glitch burst.
export default {
  id: 'fx-signal-tear',
  name: 'Signal Tear',
  category: 'fx',
  tags: ['vhs', 'tracking', 'tape', 'signal', 'tear', 'static', 'wow', 'analog', 'old-tv'],
  desc: 'A worn tape losing tracking: the tone sags and wobbles, noise bands race down the screen, then it locks back. For old TVs, VHS and a failing signal.',
  dur: 1.0,
  family: 'synthetic',
  moments: ['glitch'],
  params: {
    tear: { min: 0, max: 1, def: 0.6, desc: 'How badly the signal slips: 0 a light wobble, 1 a deep sag with several heavy noise bands' },
    tone: { min: 200, max: 900, def: 440, unit: 'Hz', desc: 'Pitch of the picture tone before it sags' },
    length: { min: 0.35, max: 0.9, def: 0.6, unit: 's', desc: 'How long the slip lasts before the signal locks again' },
    snow: { min: 0, max: 1, def: 0.5, desc: 'Level of the static snow and speckle under the tear' },
  },
  play(T, out, t, p) {
    const L = p.length;
    const sag = 1 - 0.55 * p.tear;
    const lp = T.filter(out, t, { type: 'lowpass', f: 2400, q: 0.7 });
    // the tone sags with a wow, then a second voice climbs from the bottom of the sag back to pitch
    T.osc(lp, t, { type: 'sawtooth', f: p.tone, to: p.tone * sag, glide: L * 0.5, dur: L * 0.75, peak: 0.04, a: 0.02, s: 1, d: 0.02, r: L * 0.2, vib: { rate: 6.5, depth: 30 + 110 * p.tear } });
    T.osc(lp, t + L * 0.55, { type: 'sawtooth', f: p.tone * sag, to: p.tone, glide: L * 0.35, dur: L * 0.5, peak: 0.04, a: L * 0.12, s: 1, d: 0.02, r: L * 0.2, vib: { rate: 5, depth: 25 } });
    T.osc(lp, t, { f: p.tone * 0.5, to: p.tone * 0.5 * sag, glide: L * 0.5, dur: L * 0.75, peak: 0.025, a: 0.02, s: 1, d: 0.02, r: L * 0.2 });
    // the tear lines: a narrow band of noise falls from the top of the spectrum to the bottom
    const bands = 2 + Math.round(2 * p.tear);
    for (let k = 0; k < bands; k++) {
      T.noise(out, t + L * (0.04 + 0.2 * k), { filter: 'bandpass', f: 7000 - 700 * k, to: 600, q: 2.5, dur: L * 0.4, peak: 0.07 + 0.08 * p.tear, a: L * 0.04 });
    }
    // snow and speckle
    T.noise(out, t, { filter: 'highpass', f: 3000, q: 0.7, dur: L + 0.08, peak: 0.004 + 0.02 * p.snow, a: 0.03, s: 1, d: 0.02, r: 0.1 });
    T.crackle(out, t, { dur: L, rate: 25 + 90 * p.snow, f: 4500, to: 2500, spread: 0.7, q: 1, len: 0.004, peak: 0.01 + 0.04 * p.snow });
    // the heads lock: a small tick as the tone settles
    T.tick(out, t + L * 0.85, { f: 2200, q: 1, dur: 0.015, peak: 0.04 });
  },
};
